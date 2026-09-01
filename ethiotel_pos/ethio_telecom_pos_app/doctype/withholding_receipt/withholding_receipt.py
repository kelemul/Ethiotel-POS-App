import json

import requests

import frappe
from frappe import _
from frappe.model.document import Document

from ethiotel_pos.eims_connector import EIMSConnector
from ethiotel_pos.eims.payload import sum_withholding


class WithholdingReceipt(Document):
    WITHHOLDING_RECEIPT_TYPE = "Withholding Receipts"

    def validate(self):
        # Withholding values are never negative on submission.
        for fld in ("withholding_rate", "pre_tax_amount", "withholding_amount", "exchange_rate"):
            val = self.get(fld)
            if val is None:
                continue
            try:
                if float(val) < 0:
                    setattr(self, fld, abs(float(val)))
            except (TypeError, ValueError):
                pass

    def before_save(self):
        self.receipt_type = self.WITHHOLDING_RECEIPT_TYPE
        if not self.eims_status:
            self.eims_status = "Pending"
        if not self.receipt_number:
            self.receipt_number = f"WHT-{self.name or ''}"
        if not self.receipt_date:
            self.receipt_date = frappe.utils.now_datetime().replace(microsecond=0)

    def _settings(self):
        return frappe.get_single("EIMS Setting")

    @frappe.whitelist()
    def populate_from_invoice(self, sales_invoice):
        """Fill the withholding receipt (the Laravel request fields) from a
        registered Sales Invoice. Mirrors WithholdingReceiptRequest's field
        set: InvoiceIRN, SellerTIN, PreTaxAmount, WithholdingAmount, Currency,
        ExchangeRate, Reason, ReceiptCounter, SourceSystemType/Number."""
        inv = frappe.get_doc("Sales Invoice", sales_invoice)
        if inv.docstatus != 1:
            frappe.throw(_("Sales Invoice {0} is not submitted.").format(sales_invoice))
        if not inv.custom_irn:
            frappe.throw(_("Invoice has no MoR IRN (custom_irn) yet."))

        self.invoice_irn = inv.custom_irn or ""
        self.currency = inv.currency or "ETB"
        self.exchange_rate = inv.conversion_rate
        self.seller_tin = (self._settings().seller_tin or "").strip()

        default_client = self._settings().get("client_data_list") or []
        if default_client:
            client = default_client[0]
            self.source_system_type = (client.get("system_type") or "POS").strip()
            self.source_system_number = (client.get("system_number") or "").strip()

        transaction_type = ""
        t_map = {
            "Individual": "B2C",
            "Company": "B2B",
            "Government": "G2C",
            "Partnership": "B2B",
        }
        transaction_type = t_map.get(
            frappe.db.get_value("Customer", inv.customer, "customer_type"), ""
        )
        transaction_wht, income_wht = sum_withholding(inv, transaction_type)
        rate = transaction_wht or income_wht
        self.withholding_type = (
            "TWTH" if transaction_wht else ("IWTH" if income_wht else (self.withholding_type or "TWTH"))
        )
        self.withholding_rate = abs(float(rate or 0.0))
        pre_tax = abs(float(inv.net_total or 0.0))
        self.pre_tax_amount = pre_tax
        self.withholding_amount = round(pre_tax * (abs(float(rate or 0.0)) / 100.0), 2)
        self.reason = _("Withholding on registered invoice {0}").format(inv.name)
        self.receipt_number = f"WHT-{int(inv.custom_document_number or 0) or inv.name}"
        return True

    @frappe.whitelist()
    def trigger_remote_withholding_receipt(self):
        """Transmit the withholding receipt to MoR
        (POST /v1/receipt/withholding). Payload uses the confirmed working
        MoR format (ReceiptNumber, Reason, ReceiptCounter, ManualReceiptNumber,
        SourceSystemType/Number, InvoiceDetail, WithholdDetail). Optional
        fields (ExchangeRate, Rate) are sent as null when absent."""
        if self.eims_status == "Active":
            frappe.throw(_("This withholding receipt has already been authorized by MoR."))

        connector = EIMSConnector()
        try:
            token = connector.get_valid_token()
            base_url = connector.settings.base_url.strip().replace('"', "").replace("'", "").rstrip("/")
            url = f"{base_url}/v1/receipt/withholding"

            headers = {
                "Authorization": f"Bearer {token}",
                "apikey": connector.settings.get_password("api_key"),
                "Content-Type": "application/json",
                "Accept": "*/*",
            }

            receipt_number = self.receipt_number or f"WHT-{self.name}"

            self.receipt_date = frappe.utils.now_datetime().replace(microsecond=0)

            payload = {
                "ReceiptNumber": receipt_number,
                "Reason": self.reason or "Withholding payment",
                "ReceiptCounter": str(self.receipt_counter or ""),
                "ManualReceiptNumber": self.manual_receipt_number or "",
                "SourceSystemType": self.source_system_type or "POS",
                "SourceSystemNumber": self.source_system_number or "",
                "InvoiceDetail": {
                    "InvoiceIRN": self.invoice_irn,
                    "Currency": self.currency or "ETB",
                    "ExchangeRate": abs(float(self.exchange_rate)) if self.exchange_rate else None,
                },
                "WithholdDetail": {
                    "Type": self.withholding_type or "TWTH",
                    "Rate": abs(float(self.withholding_rate)) if self.withholding_rate else None,
                    "PreTaxAmount": abs(float(self.pre_tax_amount or 0.0)),
                    "WithholdingAmount": abs(float(self.withholding_amount or 0.0)),
                },
            }
            payload_data = json.dumps(payload)
            self.request_payload = payload_data

            response = requests.post(url, data=payload_data, headers=headers, timeout=15)
            res_data = response.json()

            if response.status_code == 200 and res_data.get("statusCode") == 200:
                body = res_data.get("body", {}) or {}
                api_status = body.get("status") or "Active"
                self.eims_status = "Active" if api_status == "A" else api_status
                self.mor_receipt_id = body.get("id") or self.mor_receipt_id
                self.rrn = body.get("rrn") or self.rrn
                self.returned_rnn = body.get("rrn") or self.returned_rnn
                self.qr_code_base64 = body.get("qr") or self.qr_code_base64
                self.response_log = json.dumps(res_data, indent=4)
                self.save()
                frappe.db.commit()
                return {
                    "success": True,
                    "status": self.eims_status,
                    "rrn": self.rrn,
                    "html": self.compile_receipt_html(),
                }

            self.response_log = json.dumps(res_data, indent=4)
            detail = json.dumps(res_data, indent=2)
            duplicate_msg = "Receipt generated for the Invoice IRN given" in detail

            # Only a genuine success response (statusCode 200) that reports the
            # receipt already exists is healed to Active. A 406 rejection keeps
            # the receipt Failed so real validation errors are never hidden.
            if response.status_code == 200 and duplicate_msg and self.eims_status != "Active":
                self.eims_status = "Active"
                self.response_log = (self.response_log or "") + "\n[auto-heal] duplicate-receipt response marked Active"
                self.save()
                frappe.db.commit()
                return {
                    "success": True,
                    "status": self.eims_status,
                    "healed_duplicate": True,
                    "rrn": self.rrn or "",
                    "html": self.compile_receipt_html(),
                }

            self.eims_status = "Failed"
            if duplicate_msg:
                self.response_log = (self.response_log or "") + (
                    "\n[note] MoR reports a withholding receipt already exists for this Invoice IRN —"
                    " check for an existing Active receipt instead of re-authorizing."
                )
            self.save()
            frappe.db.commit()
            return {"success": False, "message": f"Error {response.status_code}: {detail}", "html": None}
        except Exception as e:
            frappe.log_error(frappe.get_traceback(), "EIRMS Withholding Receipt Dispatch Failure")
            frappe.throw(_(f"Critical System Processing Exception: {str(e)}"))

    def compile_receipt_html(self):
        from frappe.utils import get_datetime

        receipt_date = self.receipt_date
        if receipt_date:
            try:
                if isinstance(receipt_date, str):
                    receipt_date = get_datetime(receipt_date)
                receipt_date = receipt_date.strftime("%d %B %Y, %H:%M")
            except Exception:
                receipt_date = str(receipt_date)

        qr = self.qr_code_base64 or ""
        qr_html = (
            f'<div style="text-align:center;margin-top:12px;">'
            f'<img src="data:image/png;base64,{qr}" style="width:140px;height:140px;"/></div>'
            if qr
            else ""
        )

        return f"""
        <div style="font-family:Arial,sans-serif;width:360px;margin:0 auto;border:1px solid #ccc;padding:16px;">
            <div style="text-align:center;border-bottom:1px dashed #ccc;padding-bottom:8px;">
                <h3 style="margin:0;">Withholding Receipt</h3>
                <div>Receipt No: {self.receipt_number or self.name}</div>
                <div>{receipt_date or ''}</div>
            </div>
            <table style="width:100%;font-size:12px;margin-top:10px;">
                <tr><td><b>Seller TIN</b></td><td style="text-align:right;">{self.seller_tin or ''}</td></tr>
                <tr><td>Invoice IRN</td><td style="text-align:right;">{self.invoice_irn or ''}</td></tr>
                <tr><td>Type</td><td style="text-align:right;">{self.withholding_type or ''}</td></tr>
                <tr><td>Rate</td><td style="text-align:right;">{self.withholding_rate or 0}%</td></tr>
                <tr><td>PreTax Amount</td><td style="text-align:right;">{self.pre_tax_amount or 0}</td></tr>
                <tr><td>Withholding Amount</td><td style="text-align:right;">{self.withholding_amount or 0}</td></tr>
                <tr><td>Status</td><td style="text-align:right;">{self.eims_status or ''}</td></tr>
                <tr><td>MoR ID</td><td style="text-align:right;">{self.mor_receipt_id or ''}</td></tr>
                <tr><td>RRN</td><td style="text-align:right;">{self.rrn or ''}</td></tr>
            </table>
            {qr_html}
        </div>
        """


@frappe.whitelist()
def create_withholding_receipt(sales_invoice):
    """Create (or return) a Withholding Receipt pre-populated from a
    registered Sales Invoice. NOT auto-submitted; authorization happens from
    the document. Populates only the Laravel request fields."""
    try:
        inv = frappe.get_doc("Sales Invoice", sales_invoice)
        if inv.docstatus != 1:
            return {"status": "error", "message": _("Sales Invoice {0} is not submitted.").format(sales_invoice)}
        if not inv.custom_irn:
            return {"status": "error", "message": _("Invoice has no MoR IRN (custom_irn) yet.")}

        existing = frappe.get_all(
            "Withholding Receipt",
            filters={"invoice_irn": inv.custom_irn, "docstatus": 0},
            fields=["name"],
            order_by="creation desc",
            limit=1,
        )
        if existing:
            doc = frappe.get_doc("Withholding Receipt", existing[0].name)
            if not doc.eims_status:
                doc.eims_status = "Pending"
            return {"status": "ok", "receipt_name": doc.name, "already_created": doc.eims_status == "Active"}

        doc = frappe.new_doc("Withholding Receipt")
        doc.receipt_type = WithholdingReceipt.WITHHOLDING_RECEIPT_TYPE
        doc.eims_status = "Pending"
        doc.populate_from_invoice(sales_invoice)
        doc.insert(ignore_permissions=True)
        frappe.db.commit()
        return {"status": "ok", "receipt_name": doc.name, "already_created": False}
    except Exception as e:
        frappe.db.rollback()
        frappe.log_error(frappe.get_traceback(), "Create withholding receipt error")
        return {"status": "error", "message": str(e)}
