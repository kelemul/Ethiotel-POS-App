import base64
import json
import time

import requests

from .constants import EIMS_MIN_BULK_SIZE
from .logging_setup import eims_logger

import frappe


class EIMSConnectorSubmit:
    def _resolve_invoice_doctype(self, invoice_name):
        """Return the doctype of the invoice: 'Sales Invoice' when the name
        is a Sales Invoice, otherwise 'POS Invoice'. Sales Invoices and POS
        Invoices are separate EIMS registrations that share one document
        number source (EIMS Setting.last_document_number)."""
        if frappe.db.exists("Sales Invoice", invoice_name):
            return "Sales Invoice"
        if frappe.db.exists("POS Invoice", invoice_name):
            return "POS Invoice"
        frappe.throw(f"Invoice {invoice_name} not found (neither Sales Invoice nor POS Invoice).")

    def submit_single_invoice(self, invoice_name):
        try:
            doctype = self._resolve_invoice_doctype(invoice_name)
            doc = frappe.get_doc(doctype, invoice_name)

            existing_doc_num = doc.get("custom_document_number")
            if existing_doc_num:
                # idempotent resend: reuse the number already assigned to this invoice
                doc_num = int(existing_doc_num)
                is_resend = True
            else:
                doc_num = self._peek_next_document_number()
                is_resend = False

            token = self.get_valid_token()
            default_client = self.get_default_client_data()

            clean_url = self.settings.base_url.strip().rstrip('/')
            register_url = f"{clean_url}/v1/register"
            is_https = register_url.lower().startswith("https://")

            attempts = 0
            while True:
                attempts += 1
                invoice_payload = self.build_invoice_payload(doc, override_doc_num=doc_num)

                auth_headers = {
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {token}",
                    "apikey": self.settings.get_password("api_key"),
                }

                json_string_payload = json.dumps(invoice_payload, separators=(",", ":"))
                if is_https:
                    request_body = self._build_signed_envelope(json_string_payload, default_client)
                else:
                    request_body = json_string_payload

                response = self._post_with_retry(
                    register_url,
                    request_body,
                    auth_headers,
                    timeout=15
                )

                if response.status_code == 401:
                    token = self.get_valid_token(force_refresh=True)
                    auth_headers["Authorization"] = f"Bearer {token}"
                    response = self._post_with_retry(
                        register_url,
                        request_body,
                        auth_headers,
                        timeout=15
                    )

                if response.status_code in (200, 201):
                    res_json = response.json()
                    body_data = res_json.get("body", {})
                    irn = body_data.get("irn")
                    signed_qr_base64 = body_data.get("signedQR")

                    qr_code_url = self._save_qr_file(invoice_name, signed_qr_base64, doctype)

                    frappe.db.set_value(doctype, invoice_name, self._filter_known_fields(doctype, {
                        "custom_irn": irn,
                        "custom_qr_code_url": qr_code_url,
                        "custom_eims_status": "Registered",
                        "custom_document_number": doc_num,
                        # Exact totals MoR registered for this invoice — the
                        # receipt must quote these verbatim or MoR rejects
                        # it with "Invoice total amount mismatch".
                        "custom_mor_total_value": invoice_payload["ValueDetails"]["TotalValue"],
                    }), update_modified=True)

                    # Only persist the counter after MoR confirms success.
                    if doc_num > int(self.settings.last_document_number or 0):
                        self._commit_document_number(doc_num)

                    frappe.db.commit()
                    return {"status": "Transmitted", "message": f"Successfully registered. IRN: {irn}"}

                # MoR enforces strict sequential document numbers and tells us
                # exactly which number it expects next. Adopt that number and
                # retry once so a drifted local counter self-heals instead of
                # burning numbers with "not in correct sequence" / "document
                # number must be unique" rejections.
                expected_num = self._parse_expected_doc_num(response.text)
                if expected_num is not None and expected_num != doc_num and attempts < 2:
                    self._commit_document_number(expected_num - 1)
                    doc_num = expected_num
                    frappe.db.set_value(
                        doctype, invoice_name, "custom_document_number", doc_num,
                        update_modified=True,
                    )
                    frappe.db.commit()
                    continue

                # MoR rejected the very number we were told to use. If that
                # number was already registered for THIS invoice (a resend
                # after a lost response), treat it as an idempotent success.
                if expected_num is not None and expected_num == doc_num and is_resend:
                    irn = self._lookup_irn_for_doc_num(doc_num)
                    if irn:
                        frappe.db.set_value(doctype, invoice_name, self._filter_known_fields(doctype, {
                            "custom_irn": irn,
                            "custom_eims_status": "Registered",
                            "custom_document_number": doc_num,
                        }), update_modified=True)
                        if doc_num > int(self.settings.last_document_number or 0):
                            self._commit_document_number(doc_num)
                        frappe.db.commit()
                        return {"status": "Transmitted", "message": f"Already registered. IRN: {irn}"}

                frappe.db.set_value(doctype, invoice_name, "custom_eims_status", "Failed", update_modified=True)
                frappe.db.commit()

                error_msg = f"Error {response.status_code}: {response.text}"
                frappe.log_error(message=error_msg, title=f"EIMS submission rejected: {invoice_name}")
                return {"status": "Rule Error", "message": error_msg}

        except frappe.ValidationError:
            raise
        except Exception as e:
            frappe.log_error(message=frappe.get_traceback(), title=f"EIMS System Crash: {invoice_name}")
            return {"status": "Rule Error", "message": self._friendly_network_error(e)}

    @staticmethod
    def _filter_known_fields(doctype, updates):
        """Drop any key the target doctype doesn't have as a field.
        Registration must survive a missing optional tracking column
        (e.g. custom_mor_total_value on an environment where the patch
        has not run yet) instead of crashing with a DB 1054 error."""
        try:
            meta = frappe.get_meta(doctype)
            return {k: v for k, v in updates.items() if meta.has_field(k)}
        except Exception:
            return updates

    def _save_qr_file(self, invoice_name, signed_qr_base64, doctype="Sales Invoice"):
        qr_code_url = ""
        if not signed_qr_base64:
            return qr_code_url
        try:
            file_name = f"qr_{invoice_name}.png"
            old_file_id = frappe.db.get_value("File", {
                "attached_to_doctype": doctype,
                "attached_to_name": invoice_name,
                "file_name": file_name
            }, "name")
            if old_file_id:
                frappe.delete_doc("File", old_file_id, ignore_permissions=True)

            qr_file = frappe.get_doc({
                "doctype": "File",
                "file_name": file_name,
                "attached_to_doctype": doctype,
                "attached_to_name": invoice_name,
                "content": base64.b64decode(signed_qr_base64),
                "is_private": 0
            })
            qr_file.insert(ignore_permissions=True)
            qr_code_url = qr_file.file_url
        except Exception as qr_err:
            frappe.log_error(message=str(qr_err), title="EIMS QR Image Processing Error")
        return qr_code_url

    def _post_with_retry(self, url, data, headers, timeout, max_retries=4):
        attempt = 0
        while True:
            response = requests.post(url, data=data, headers=headers, timeout=timeout)
            if response.status_code != 429:
                return response
            attempt += 1
            if attempt >= max_retries:
                return response
            wait_seconds = min(2 ** attempt, 30)
            time.sleep(wait_seconds)

    def _register_single_leftover(self, doc, assigned_num, prev_irn, default_client, token):

        payload = self.build_invoice_payload(
            doc, override_doc_num=assigned_num, override_prev_irn=prev_irn
        )
        clean_url = self.settings.base_url.strip().rstrip('/')
        register_url = f"{clean_url}/v1/register"
        is_https = register_url.lower().startswith("https://")

        json_string_payload = json.dumps(payload, separators=(",", ":"))
        if is_https:
            request_body = self._build_signed_envelope(json_string_payload, default_client)
        else:
            request_body = json_string_payload

        auth_headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {token}",
            "apikey": self.settings.get_password("api_key"),
        }

        response = self._post_with_retry(register_url, request_body, auth_headers, 15)
        eims_logger.debug(
            "Single-invoice fallback for %s (DocNum %s) - status: %s body: %s",
            doc.name, assigned_num, response.status_code, response.text
        )

        if response.status_code == 401:
            token = self.get_valid_token(force_refresh=True)
            auth_headers["Authorization"] = f"Bearer {token}"
            response = self._post_with_retry(register_url, request_body, auth_headers, 15)

        return response

    def _friendly_network_error(self, e):
        """Map connection-level failures to a clean, actionable message that
        points the user at the EIMS Setting Base URL instead of dumping the
        raw requests traceback (e.g. 'System Crash Error: HTTPConnectionPool
        ... ConnectTimeoutError ...')."""
        clean_url = (self.settings.base_url or "").strip().rstrip("/")
        if isinstance(e, requests.exceptions.ConnectTimeout):
            return (
                f"Could not reach the EIRMS server at <b>{clean_url}</b> — the connection timed out. "
                f"Check that the Base URL in <b>EIMS Setting</b> is correct and that the EIRMS "
                f"server is reachable from this machine."
            )
        if isinstance(e, requests.exceptions.ConnectionError):
            return (
                f"Could not connect to the EIRMS server at <b>{clean_url}</b>. "
                f"Check that the Base URL in <b>EIMS Setting</b> is correct, the server is running, "
                f"and that this machine can reach it."
            )
        if isinstance(e, requests.exceptions.Timeout):
            return (
                f"The EIRMS server at <b>{clean_url}</b> did not respond in time. "
                f"Check your network connection and the Base URL in <b>EIMS Setting</b>."
            )
        return str(e)

    def submit_bulk_invoices(self, invoice_names):
        results_map = {}
        successes = 0
        failures = 0
        pending_count = 0
        logs = []

        try:
            token = self.get_valid_token()
        except Exception as e:
            eims_logger.error("Auth failed before bulk submission: %s", str(e))
            for name in invoice_names:
                results_map[name] = {"status": "Rule Error", "message": str(e)}
            return {
                "status": "Failed",
                "message": f"EIMS authentication failed before bulk submission: {str(e)}",
                "results": results_map
            }

        default_client = self.get_default_client_data()

        docs = []
        for name in invoice_names:
            try:
                doc = frappe.get_doc("Sales Invoice", name)
                docs.append(doc)
            except Exception as load_err:
                results_map[name] = {"status": "Rule Error", "message": str(load_err)}
                failures += 1
                logs.append(f"[{name}] Failed -> {str(load_err)}")

        docs.sort(key=lambda d: d.creation)
        pending = docs

        current_doc_num = self._peek_next_document_number()
        prev_irn = self._lookup_irn_for_doc_num(current_doc_num - 1)

        clean_url = self.settings.base_url.strip().rstrip('/')
        register_url = f"{clean_url}/v1/bulkRegister"
        is_https = register_url.lower().startswith("https://")

        eims_logger.debug("register_url=%s is_https=%s", register_url, is_https)

        while pending:

            if len(pending) < EIMS_MIN_BULK_SIZE:
                doc = pending[0]
                assigned_num = current_doc_num
                try:
                    response = self._register_single_leftover(
                        doc, assigned_num, prev_irn, default_client, token
                    )
                except frappe.ValidationError as ve:
                    results_map[doc.name] = {"status": "Rule Error", "message": str(ve)}
                    frappe.db.set_value("Sales Invoice", doc.name, "custom_eims_status", "Failed", update_modified=True)
                    frappe.db.commit()
                    failures += 1
                    logs.append(f"[{doc.name}] Failed -> {str(ve)}")
                    pending = []
                    break

                if response.status_code in (200, 201):
                    res_json = response.json()
                    body_data = res_json.get("body", {}) if isinstance(res_json, dict) else {}
                    irn = body_data.get("irn")
                    if irn:
                        signed_qr_base64 = body_data.get("signedQR")
                        qr_code_url = self._save_qr_file(doc.name, signed_qr_base64)
                        frappe.db.set_value("Sales Invoice", doc.name, {
                            "custom_irn": irn,
                            "custom_qr_code_url": qr_code_url,
                            "custom_eims_status": "Registered",
                            "custom_document_number": assigned_num
                        }, update_modified=True)
                        if assigned_num > int(self.settings.last_document_number or 0):
                            self._commit_document_number(assigned_num)
                        results_map[doc.name] = {"status": "Transmitted", "message": f"Successfully registered. IRN: {irn}"}
                        successes += 1
                        logs.append(f"[{doc.name}] Success -> IRN: {irn} (DocNum: {assigned_num}, via single-invoice fallback)")
                    else:
                        conversation_id = res_json.get("conversationId") if isinstance(res_json, dict) else None
                        frappe.db.set_value("Sales Invoice", doc.name, {
                            "custom_eims_status": "Pending",
                            "custom_document_number": assigned_num,
                            "custom_conversation_id": conversation_id
                        }, update_modified=True)
                        results_map[doc.name] = {
                            "status": "Pending",
                            "message": f"Submitted for async processing (conversationId: {conversation_id}). Awaiting confirmation callback."
                        }
                        pending_count += 1
                        logs.append(f"[{doc.name}] Pending -> submitted via single-invoice fallback, awaiting callback (DocNum {assigned_num})")
                else:
                    error_msg = f"Error {response.status_code}: {response.text}"
                    frappe.db.set_value("Sales Invoice", doc.name, "custom_eims_status", "Failed", update_modified=True)
                    results_map[doc.name] = {"status": "Rule Error", "message": error_msg}
                    failures += 1
                    logs.append(f"[{doc.name}] Failed -> {error_msg}")

                frappe.db.commit()
                pending = []
                break

            batch_docs = []
            batch_payloads = []
            running_doc_num = current_doc_num
            running_prev_irn = prev_irn

            for doc in pending:
                try:
                    payload = self.build_invoice_payload(
                        doc, override_doc_num=running_doc_num, override_prev_irn=running_prev_irn
                    )
                    batch_payloads.append(payload)
                    batch_docs.append((doc, running_doc_num))
                except frappe.ValidationError as ve:
                    results_map[doc.name] = {"status": "Rule Error", "message": str(ve)}
                    frappe.db.set_value("Sales Invoice", doc.name, "custom_eims_status", "Failed", update_modified=True)
                    frappe.db.commit()
                    failures += 1
                    logs.append(f"[{doc.name}] Failed -> {str(ve)}")
                    continue
                running_doc_num += 1
                running_prev_irn = None

            if not batch_payloads:
                pending = []
                break

            try:
                auth_headers = {
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {token}",
                    "apikey": self.settings.get_password("api_key"),
                }

                if is_https:
                    json_string_payload = json.dumps(batch_payloads, separators=(",", ":"))
                    request_body = self._build_signed_envelope(json_string_payload, default_client)
                else:
                    request_body = json.dumps(batch_payloads, separators=(",", ":"))

                response = self._post_with_retry(register_url, request_body, auth_headers, 30)

                eims_logger.debug("Response status: %s", response.status_code)
                eims_logger.debug("Response body: %s", response.text)

                if response.status_code == 401:
                    token = self.get_valid_token(force_refresh=True)
                    auth_headers["Authorization"] = f"Bearer {token}"
                    response = self._post_with_retry(register_url, request_body, auth_headers, 30)
                    eims_logger.debug("Retry after 401 - status: %s body: %s", response.status_code, response.text)

                if response.status_code not in (200, 201):
                    error_msg = f"Error {response.status_code}: {response.text}"
                    frappe.log_error(message=error_msg, title="EIMS Bulk Submission Rejected")
                    eims_logger.error("Bulk submission rejected: %s", error_msg)
                    for doc, assigned_num in batch_docs:
                        results_map[doc.name] = {"status": "Rule Error", "message": error_msg}
                        frappe.db.set_value("Sales Invoice", doc.name, "custom_eims_status", "Failed", update_modified=True)
                        failures += 1
                        logs.append(f"[{doc.name}] Failed -> {error_msg}")
                    frappe.db.commit()
                    pending = []
                    break

                res_json = response.json()

                is_async_envelope = (
                    isinstance(res_json, dict)
                    and "body" not in res_json
                    and "data" not in res_json
                    and "conversationId" in res_json
                )

                if is_async_envelope:
                    conversation_id = res_json.get("conversationId")
                    for doc, assigned_num in batch_docs:
                        frappe.db.set_value("Sales Invoice", doc.name, {
                            "custom_eims_status": "Pending",
                            "custom_document_number": assigned_num,
                            "custom_conversation_id": conversation_id
                        }, update_modified=True)
                        results_map[doc.name] = {
                            "status": "Pending",
                            "message": f"Submitted for async processing (conversationId: {conversation_id}). Awaiting confirmation callback."
                        }
                        pending_count += 1
                        logs.append(f"[{doc.name}] Pending -> submitted, conversationId {conversation_id} (DocNum {assigned_num})")
                    frappe.db.commit()
                    pending = []
                    break

                if isinstance(res_json, dict):
                    res_items = res_json.get("body", res_json.get("data", [res_json]))
                else:
                    res_items = res_json

                if not isinstance(res_items, list):
                    res_items = [res_items]

                error_index = None
                last_committed_irn = prev_irn

                for idx, (doc, assigned_num) in enumerate(batch_docs):
                    if idx >= len(res_items):
                        error_index = idx
                        break

                    item = res_items[idx]
                    if not isinstance(item, dict):
                        error_index = idx
                        break

                    if ("conversionId" in item or "conversationId" in item) and "irn" not in item and "ruleError" not in item and item.get("status") != "ERROR":
                        error_index = idx
                        break

                    irn = item.get("irn")
                    item_status = item.get("status")

                    if irn and item_status == "A":
                        signed_qr_base64 = item.get("signedQR")
                        qr_code_url = self._save_qr_file(doc.name, signed_qr_base64)

                        frappe.db.set_value("Sales Invoice", doc.name, {
                            "custom_irn": irn,
                            "custom_qr_code_url": qr_code_url,
                            "custom_eims_status": "Registered",
                            "custom_document_number": assigned_num
                        }, update_modified=True)
                        if assigned_num > int(self.settings.last_document_number or 0):
                            self._commit_document_number(assigned_num)
                        results_map[doc.name] = {
                            "status": "Transmitted",
                            "message": f"Successfully registered. IRN: {irn}"
                        }
                        successes += 1
                        logs.append(f"[{doc.name}] Success -> IRN: {irn} (DocNum: {assigned_num})")
                        last_committed_irn = irn
                    else:
                        rule_error = item.get("ruleError")
                        if rule_error:
                            error_detail = json.dumps(rule_error)
                        else:
                            error_detail = json.dumps(item)

                        frappe.db.set_value("Sales Invoice", doc.name, "custom_eims_status", "Failed", update_modified=True)
                        results_map[doc.name] = {
                            "status": "Rule Error",
                            "message": f"Document number {assigned_num} rejected: {error_detail}"
                        }
                        failures += 1
                        logs.append(f"[{doc.name}] Failed -> {error_detail} (DocNum {assigned_num} recycled)")
                        error_index = idx
                        break

                frappe.db.commit()

                if error_index is None:
                    pending = []
                else:
                    remaining = [d for d, n in batch_docs[error_index + 1:]]
                    pending = remaining
                    current_doc_num = batch_docs[error_index][1]
                    prev_irn = last_committed_irn

            except Exception as batch_err:
                eims_logger.exception("Bulk submission system crash")
                friendly_msg = self._friendly_network_error(batch_err)
                for doc, assigned_num in batch_docs:
                    if doc.name not in results_map:
                        results_map[doc.name] = {"status": "Rule Error", "message": friendly_msg}
                        frappe.db.set_value("Sales Invoice", doc.name, "custom_eims_status", "Failed", update_modified=True)
                        failures += 1
                        logs.append(f"[{doc.name}] Failed -> {friendly_msg}")
                frappe.db.commit()
                pending = []

        if failures == 0 and pending_count == 0:
            overall_status = "Transmitted"
        elif failures == 0 and pending_count > 0:
            overall_status = "Pending" if successes == 0 else "Partially Transmitted"
        elif successes > 0 or pending_count > 0:
            overall_status = "Partially Transmitted"
        else:
            overall_status = "Failed"

        summary_text = (
            f"Bulk Processing Complete.\n"
            f"Total processed: {len(invoice_names)} | Success: {successes} | "
            f"Pending (awaiting callback): {pending_count} | Failures: {failures}\n\n"
            f"Execution Logs:\n" + "\n".join(logs)
        )

        return {
            "status": overall_status,
            "message": summary_text,
            "results": results_map
        }
