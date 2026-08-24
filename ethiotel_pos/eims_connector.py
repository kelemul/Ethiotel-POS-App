import frappe
import requests
import re
import base64
import json
import logging
import os
from pathlib import Path
from frappe.utils import get_datetime, now_datetime
from cryptography.hazmat.primitives import serialization, hashes
from cryptography.hazmat.primitives.asymmetric import padding


def _get_eims_logger():
    logger = logging.getLogger("eims_connector")
    if not logger.handlers:
        log_dir = frappe.utils.get_site_path("logs")
        os.makedirs(log_dir, exist_ok=True)
        log_path = os.path.join(log_dir, "eims_connector.log")
        handler = logging.FileHandler(log_path)
        formatter = logging.Formatter("%(asctime)s [%(levelname)s] %(message)s")
        handler.setFormatter(formatter)
        logger.addHandler(handler)
        logger.setLevel(logging.DEBUG)
        logger.propagate = False
    return logger


eims_logger = _get_eims_logger()

EIMS_MIN_BULK_SIZE = 2

WALK_IN_CUSTOMER = "Walk-In Customer"

ID_TYPES = {"NID", "KID", "SID", "WID", "PST", "DLS", "MRS"}

ID_TYPE_ALIASES = {
    "NATIONAL ID": "NID",
    "NATIONAL ID CARD": "NID",
    "NATIONALID": "NID",
    "KEBELE": "KID",
    "KEBELE ID": "KID",
    "KEBELE ID CARD": "KID",
    "KEBELE CARD": "KID",
    "KEDIDA": "KID",
    "STUDENT ID": "SID",
    "STUDENT": "SID",
    "WORKER ID": "WID",
    "WORKERS ID": "WID",
    "PASSPORT": "PST",
    "DRIVER LICENSE": "DLS",
    "DRIVER'S LICENSE": "DLS",
    "DRIVING LICENSE": "DLS",
    "DRIVER LICENCE": "DLS",
    "DRIVERS LICENCE": "DLS",
    "MARRIAGE CERTIFICATE": "MRS",
    "MARRIAGE CERT": "MRS",
}

MOR_PAYMENT_MODES = ("CASH", "ADVANCE", "CREDIT")


def resolve_mor_payment_mode(mode_of_payment):
    """Map a Mode of Payment onto one of MoR's accepted payment modes
    (rule 7022: CASH / ADVANCE / CREDIT). An explicit classification on
    the Mode of Payment (custom_mor_mode) wins; otherwise the mode name
    itself is matched. Returns None when the mode cannot be resolved."""
    if not mode_of_payment:
        return None
    configured = frappe.db.get_value("Mode of Payment", mode_of_payment, "custom_mor_mode")
    if configured:
        return str(configured).strip().upper()
    name = str(mode_of_payment).strip().upper()
    for mode in MOR_PAYMENT_MODES:
        if mode in name:
            return mode
    return None


def _add_if_present(target_dict, key, value):
    """Only add a key to the payload if value is not None / not an empty string.
    Used for every Conditional / Optional field per the EIMS requirement spec."""
    if value is not None and str(value).strip() != "":
        target_dict[key] = value


class EIMSConnector:
    def __init__(self):
        self.settings = frappe.get_single("EIMS Setting")
        self.headers = {"Content-Type": "application/json"}

    def _require(self, value, field_label, doc_label, link=None, title="EIMS Schema Validation Error"):
        if value is None or str(value).strip() == "":
            location = f"<a href='{link}'>{doc_label}</a>" if link else f"<b>{doc_label}</b>"
            frappe.throw(
                f"Validation Error on {location}:<br><br>"
                f"<b>{field_label}</b> is required and cannot be empty for EIMS submission.",
                title=title
            )
        return value

    def get_default_client_data(self):
        if not self.settings.client_data_list:
            frappe.throw("No client configuration found in EIMS Settings.")

        for row in self.settings.client_data_list:
            if row.is_default == 1:
                return frappe.get_doc(row.doctype, row.name)

        frappe.throw("No default configuration row selected in EIMS Settings.")

    def _normalize_pem(self, raw_text, label):
        text = raw_text.strip()
        text = text.replace("\\n", "\n")
        begin_marker = f"-----BEGIN {label}-----"
        end_marker = f"-----END {label}-----"
        body = text.replace(begin_marker, "").replace(end_marker, "")
        body = body.replace("\n", " ")
        base64_chars = "".join(body.split())
        wrapped_lines = [base64_chars[i:i + 64] for i in range(0, len(base64_chars), 64)]
        rebuilt_pem = begin_marker + "\n" + "\n".join(wrapped_lines) + "\n" + end_marker + "\n"
        return rebuilt_pem

    def _sign_data(self, data_bytes, default_client):
        decrypted_private_key = default_client.get_password("private_key")
        certificate_text = default_client.public_certificate

        if not decrypted_private_key or not certificate_text:
            frappe.throw(
                "Private Key and Public Certificate must be configured on the "
                "default Client Data row to use HTTPS EIMS endpoints.",
                title="EIMS Configuration Error"
            )

        normalized_key_text = self._normalize_pem(decrypted_private_key, "PRIVATE KEY")

        try:
            private_key = serialization.load_pem_private_key(
                normalized_key_text.encode("utf-8"), password=None
            )
        except ValueError:
            frappe.throw(
                "Stored Private Key could not be parsed as a valid PEM key. "
                "Please re-paste the full key (including BEGIN/END lines) into "
                "the Private Key field on the default Client Data row.",
                title="EIMS Configuration Error"
            )

        signature = private_key.sign(
            data_bytes,
            padding.PKCS1v15(),
            hashes.SHA512()
        )
        signature_b64 = base64.b64encode(signature).decode()
        certificate_b64 = base64.b64encode(certificate_text.encode("utf-8")).decode()

        return signature_b64, certificate_b64

    def _build_signed_envelope(self, json_string, default_client):
        data_bytes = json_string.encode("utf-8")
        signature_b64, certificate_b64 = self._sign_data(data_bytes, default_client)

        envelope = {
            "request": json.loads(json_string),
            "signature": signature_b64,
            "certificate": certificate_b64
        }
        envelope_string = json.dumps(envelope, separators=(",", ":"), ensure_ascii=False)
        return envelope_string

    def _build_signed_item(self, payload_dict, default_client):
        json_string = json.dumps(payload_dict, separators=(",", ":"))
        data_bytes = json_string.encode("utf-8")
        signature_b64, certificate_b64 = self._sign_data(data_bytes, default_client)

        return {
            "request": json.loads(json_string),
            "signature": signature_b64,
            "certificate": certificate_b64
        }

    def get_valid_token(self, force_refresh=False):
        if (not force_refresh and self.settings.current_access_token
                and self.settings.token_expiry
                and get_datetime(self.settings.token_expiry) > now_datetime()):
            return self.settings.current_access_token

        default_client = self.get_default_client_data()

        decrypted_id = default_client.get_password("client_id")
        decrypted_secret = default_client.get_password("client_secret")
        decrypted_apikey = self.settings.get_password("api_key")

        payload = {
            "clientId": decrypted_id,
            "clientSecret": decrypted_secret,
            "apikey": decrypted_apikey,
            "tin": self.settings.seller_tin
        }

        clean_url = self.settings.base_url.strip().rstrip('/')
        login_url = f"{clean_url}/auth/login"

        json_string = json.dumps(payload, separators=(",", ":"))
        data_bytes = json_string.encode("utf-8")

        is_https = login_url.lower().startswith("https://")

        if is_https:
            envelope_string = self._build_signed_envelope(json_string, default_client)
            response = requests.post(
                login_url,
                data=envelope_string.encode("utf-8"),
                headers=self.headers,
                timeout=15,
                verify=False
            )
        else:
            response = requests.post(
                login_url,
                data=data_bytes,
                headers=self.headers,
                timeout=10
            )

        if response.status_code == 200:
            res_data = response.json()
            token = res_data.get("data", {}).get("accessToken")

            self.settings.current_access_token = token
            self.settings.token_expiry = frappe.utils.add_to_date(now_datetime(), minutes=60)
            self.settings.save(ignore_permissions=True)
            frappe.db.commit()

            return token
        else:
            frappe.throw(f"EIMS Authentication Failed (Status {response.status_code}): {response.text}")

    def _lookup_irn_for_doc_num(self, doc_num):
        if doc_num <= 0:
            return ""
        db_res = frappe.db.sql(
            """SELECT custom_irn FROM `tabSales Invoice`
               WHERE custom_document_number = %s AND docstatus = 1 LIMIT 1""",
            doc_num, as_dict=1
        )
        if db_res:
            return db_res[0].get("custom_irn") or ""
        db_res = frappe.db.sql(
            """SELECT custom_mor_irn FROM `tabPOS Invoice`
               WHERE custom_document_number = %s AND docstatus = 1 LIMIT 1""",
            doc_num, as_dict=1
        )
        if db_res:
            return db_res[0].get("custom_mor_irn") or ""
        return ""

    def _peek_next_document_number(self):
        """Read-only peek at the next MoR document number: the highest of
        last_document_number + 1 and every document number ever recorded on
        a Sales Invoice or POS Invoice, plus one. This guarantees a fresh
        submission never reuses a number that was already sent to MoR.
        Does NOT reserve or persist anything. The caller must call
        _commit_document_number() only after MoR confirms a successful
        registration for that number."""
        row = frappe.db.sql(
            """SELECT value FROM `tabSingles`
            WHERE doctype = 'EIMS Setting' AND field = 'last_document_number'"""
        )
        last_num = int(row[0][0]) if row and row[0][0] else 0
        max_si = frappe.db.sql(
            """SELECT MAX(custom_document_number) FROM `tabSales Invoice`
               WHERE custom_document_number IS NOT NULL AND custom_document_number > 0"""
        )
        max_pos = frappe.db.sql(
            """SELECT MAX(custom_document_number) FROM `tabPOS Invoice`
               WHERE custom_document_number IS NOT NULL AND custom_document_number > 0"""
        )
        max_used = max(
            int(max_si[0][0] or 0) if max_si else 0,
            int(max_pos[0][0] or 0) if max_pos else 0,
        )
        return max(last_num + 1, max_used + 1)

    def _parse_expected_doc_num(self, response_text):
        """Extract the MoR-expected next document number from a rule
        validation error, e.g. 'Document number is not in correct sequence
        expected : 107'. Returns None when the error carries no number."""
        match = re.search(r"expected\s*:\s*(\d+)", response_text or "", re.IGNORECASE)
        if match:
            return int(match.group(1))
        return None

    def _commit_document_number(self, doc_num):
        """Persist doc_num as the new EIMS Setting.last_document_number.
        Called only after MoR confirms successful registration for that
        number, so a failed/rejected/pending submission never burns a
        document number."""
        doc_num = int(doc_num)
        exists = frappe.db.sql(
            """SELECT 1 FROM `tabSingles`
            WHERE doctype = 'EIMS Setting' AND field = 'last_document_number'"""
        )
        if exists:
            frappe.db.sql(
                """UPDATE `tabSingles` SET value = %s
                WHERE doctype = 'EIMS Setting' AND field = 'last_document_number'""",
                (doc_num,),
            )
        else:
            frappe.db.sql(
                """INSERT INTO `tabSingles` (doctype, field, value)
                VALUES ('EIMS Setting', 'last_document_number', %s)""",
                (doc_num,),
            )
        frappe.db.commit()
        self.settings.last_document_number = doc_num
    # def _get_max_document_number(self):
    #     row = frappe.db.sql(
    #         """SELECT MAX(CAST(custom_document_number AS UNSIGNED))
    #            FROM `tabSales Invoice`
    #            WHERE custom_document_number IS NOT NULL AND custom_document_number != '' AND custom_eims_status IN ('Registered', 'Pending')""",
    #     )
    #     doc_num =  int(self.settings.last_document_number)+1 if self.settings.last_document_number else 0
    #     row_doc_num = int(row[0][0]) if row and row[0][0] else 0
    #     return max(doc_num, row_doc_num)

    # def _next_document_number(self):
    #     """Atomically increment EIMS Setting.last_document_number by one and
    #     return the new value. This is the per-submission MoR sequence number
    #     (committed immediately so a failed submission still consumes a number).
    #     Single doctypes are stored as key/value rows in `tabSingles`; both the
    #     locked read and the write are raw SQL so no frappe single-value cache
    #     can go stale."""
    #     settings_name = "EIMS Setting"
    #     row = frappe.db.sql(
    #         """SELECT value FROM `tabSingles`
    #            WHERE doctype = %s AND field = 'last_document_number'
    #            FOR UPDATE""",
    #         settings_name,
    #     )
    #     if row:
    #         next_num = int(row[0][0] or 0) + 1
    #         frappe.db.sql(
    #             """UPDATE `tabSingles` SET value = %s
    #                WHERE doctype = %s AND field = 'last_document_number'""",
    #             (next_num, settings_name),
    #         )
    #     else:
    #         next_num = 1
    #         frappe.db.sql(
    #             """INSERT INTO `tabSingles` (doctype, field, value)
    #                VALUES (%s, 'last_document_number', '1')""",
    #             settings_name,
    #         )
    #     frappe.db.commit()
    #     return next_num

    # def _document_number_for(self, invoice_doc):
    #     """Reuse an invoice's existing MoR document number, otherwise consume
    #     the next number from EIMS Setting (idempotent resends)."""
    #     existing = invoice_doc.get("custom_document_number")
    #     if existing:
    #         try:
    #             return int(existing)
    #         except (TypeError, ValueError):
    #             pass
    #     return self._next_document_number()

    def build_invoice_payload(self, invoice_doc, override_doc_num=None, override_prev_irn=None):
        company = frappe.get_doc("Company", invoice_doc.company)
        company_link = f"/app/company/{company.name}"

        is_walk_in = (invoice_doc.customer or "") == WALK_IN_CUSTOMER
        customer_type = frappe.db.get_value("Customer", invoice_doc.customer, "customer_type")
        transaction_type =""
        t_map = {
            "Individual": "B2C",
            "Company": "B2B",
            "Government": "G2C",
            "Partnership": "B2B"
        }
        transaction_type = t_map.get(customer_type, "")
        if transaction_type == "":
            if is_walk_in:
                transaction_type = "B2C"
            else:
                frappe.throw(f"Customer Type in Customer Document is not supported: {customer_type}. Only Individual, Company, Government and Partnership are supported.")

        if not is_walk_in and not frappe.db.exists("Customer Details", invoice_doc.customer):
            frappe.throw(
                f"Missing Record: Please create a <b>Customer Details</b> document for Customer "
                f"<b>{invoice_doc.customer}</b> before proceeding.",
                title="EIMS Schema Validation Error"
            )
        customer = frappe.get_doc("Customer", invoice_doc.customer)
        customer_link = f"/app/customer/{customer.name}"
        if is_walk_in:
            # Walk-in sales have no registered buyer: the invoice keeps the
            # walk-in name but the MoR submission is a minimal B2C with no
            # TIN, no ID and no contact details.
            cust_details = frappe._dict({
                "name": WALK_IN_CUSTOMER,
                "legal_name": None, "tin_number": "", "email": "",
                "region": "", "city": "", "country": None, "zone": None,
                "kebele": None, "woreda": None, "id_number": None,
                "id_type": None, "phone": None, "sub_tin": None,
                "trade_name": None, "sub_city": None, "house_number": None,
                "locality": None,
            })
            cust_link = customer_link
        else:
            cust_details = frappe.get_doc("Customer Details", invoice_doc.customer)
            cust_link = f"/app/customer-details/{cust_details.name}"

        # BuyerDetails.Tin — Conditional, required only if transaction is NOT B2C/G2C
        raw_tin = cust_details.tin_number or ""
        clean_tin = re.sub(r"\D", "", str(raw_tin))
        if transaction_type not in ("B2C", "G2C"):
            if not clean_tin or len(clean_tin) < 10 or len(clean_tin) > 20:
                frappe.throw(
                    f"Validation Error on <a href='{cust_link}'>Customer Details ({cust_details.name})</a>:<br><br>"
                    f"<b>TIN Number</b> must be purely numeric and between 10 and 20 digits long. Found: '{raw_tin}'",
                    title="EIMS Schema Error: Invalid TIN"
                )
        elif clean_tin and (len(clean_tin) < 10 or len(clean_tin) > 20):
            frappe.throw(
                f"Validation Error on <a href='{cust_link}'>Customer Details ({cust_details.name})</a>:<br><br>"
                f"<b>TIN Number</b> must be purely numeric and between 10 and 20 digits long. Found: '{raw_tin}'",
                title="EIMS Schema Error: Invalid TIN"
            )

        # BuyerDetails.Email — validate format only if present
        buyer_email = (cust_details.email or "").strip()
        email_pattern = re.compile(r"^[a-zA-Z0-9+_.-]+@[a-zA-Z0-9.-]+$")
        if buyer_email and not email_pattern.match(buyer_email):
            frappe.throw(
                f"Validation Error on <a href='{cust_link}'>Customer Details ({cust_details.name})</a>:<br><br>"
                f"<b>Email</b> is invalid. It must match a standard email format (e.g., info@domain.com). "
                f"Found: '{buyer_email}'",
                title="EIMS Schema Error: Invalid Email"
            )

        # BuyerDetails.Region — Required, numeric 1-3 chars
        buyer_region = (cust_details.region or "").strip()
        if buyer_region and (not buyer_region.isdigit() or not (1 <= len(buyer_region) <= 3)):
            frappe.throw(
                f"Validation Error on <a href='{cust_link}'>Customer Details ({cust_details.name})</a>:<br><br>"
                f"<b>Region</b> must be a numeric code string between 1 and 3 digits (e.g., '13'). "
                f"Found: '{buyer_region}'",
                title="EIMS Schema Error: Invalid Region Code"
            )
        elif not buyer_region and not is_walk_in:
            frappe.throw(
                f"Validation Error on <a href='{cust_link}'>Customer Details ({cust_details.name})</a>:<br><br>"
                f"<b>Region</b> is required for EIMS submission.",
                title="EIMS Schema Error: Missing Region Code"
            )

        seller_vat_number = company.custom_vat_number  # Conditional
        seller_email = self._require(company.email, "Email", company.name, company_link)
        seller_phone = self._require(company.phone_no, "Phone", company.name, company_link)
        seller_region = self._require(company.custom_seller_region_code, "Seller Region Code", company.name, company_link)
        seller_wereda = self._require(company.custom_seller_woreda_code, "Seller Wereda Code", company.name, company_link)
        seller_city = self._require(company.custom_city, "City", company.name, company_link)
        seller_house_number = company.custom_house_number  # Optional

        buyer_city = "" if is_walk_in else self._require(cust_details.city, "City", cust_details.name, cust_link)
        buyer_country = cust_details.country  # Optional
        buyer_zone = cust_details.zone  # Optional
        buyer_kebele = cust_details.kebele  # Optional
        buyer_woreda = "" if is_walk_in else self._require(cust_details.woreda, "Wereda", cust_details.name, cust_link)

        buyer_id_number = cust_details.id_number
        buyer_id_type = (cust_details.id_type or "").strip().upper()
        # MoR accepts only NID, KID, SID, WID, PST, DLS, MRS. Normalize
        # common human-readable labels; anything unrecognised is omitted
        # (the schema does not require an ID for B2C).
        if buyer_id_type not in ID_TYPES:
            buyer_id_type = ID_TYPE_ALIASES.get(buyer_id_type, "")

        # Walk-in sales fall back to the seller's region so the BuyerDetails
        # schema (Region is a required, numeric 1-3 digit code) stays valid.
        if is_walk_in and not buyer_region:
            buyer_region = seller_region

        buyer_vat_number = frappe.db.get_value("Customer", invoice_doc.customer, "custom_vat_number")  # Conditional

        if override_doc_num is None:
            frappe.throw(
                "Internal Error: build_invoice_payload() requires an explicit "
                "document number. Callers must peek the next number via "
                "_peek_next_document_number() (or reuse an existing invoice's "
                "custom_document_number) before building the payload.",
                title="EIMS Document Number Error"
            )
        doc_num = int(override_doc_num)

        if override_prev_irn is not None:
            prev_irn = override_prev_irn
        else:
            prev_irn = self._lookup_irn_for_doc_num(doc_num - 1)

        cashier_name = None
        sales_team_entries = invoice_doc.get("sales_team")
        if sales_team_entries:
            cashier_name = sales_team_entries[0].sales_person

        payment_mode = None
        payment_entries = invoice_doc.get("payments")
        if payment_entries:
            payment_mode = payment_entries[0].mode_of_payment
            resolved_payment_mode = resolve_mor_payment_mode(payment_mode)
            if not resolved_payment_mode:
                frappe.throw(
                    f"Unsupported <b>Mode of Payment</b>: '{payment_mode}'. "
                    f"MoR accepts only CASH, ADVANCE or CREDIT (rule 7022). Open the "
                    f"<a href='/app/mode-of-payment/{payment_mode}'>{payment_mode}</a> "
                    f"record and set <b>MoR Payment Mode</b> to one of CASH, ADVANCE or CREDIT.",
                    title="EIMS Payment Mode Error"
                )
            payment_mode = resolved_payment_mode

        raw_phone = cust_details.phone or getattr(invoice_doc, "contact_mobile", "") or ""
        clean_phone = raw_phone.replace("+251", "0").replace(" ", "")
        if clean_phone and not clean_phone.startswith("0"):
            clean_phone = "0" + clean_phone

        default_client = self.get_default_client_data()

        payload = {
            "Version": "1",
            "TransactionType": transaction_type,
            "DocumentDetails": {
                "DocumentNumber": str(doc_num),
                "Date": (get_datetime(invoice_doc.posting_date).strftime("%d-%m-%YT00:00:00")
                         if invoice_doc.posting_date else now_datetime().strftime("%d-%m-%YT00:00:00")),
                "Type": "INV"
            },
            "SellerDetails": {
                "Tin": self.settings.seller_tin,
                "LegalName": company.custom_seller_legal_name or company.company_name,
                "Email": seller_email,
                "Phone": seller_phone,
                "Region": seller_region,
                "Wereda": seller_wereda,
                "City": seller_city,
            },
            "SourceSystem": {
                "SystemType": default_client.system_type,
                "SystemNumber": default_client.system_number,
                "InvoiceCounter": doc_num
            },
            "PaymentDetails": {
                "PaymentTerm": "IMMEDIATE"
            },
            "ValueDetails": {
                "InvoiceCurrency": invoice_doc.currency or "ETB",
            },
            "ReferenceDetails": {},
            "ItemList": []
        }

        # BuyerDetails — minimal LegalName for walk-in sales (no buyer exists,
        # but MoR requires the property and the LegalName field)
        if not is_walk_in:
            payload["BuyerDetails"] = {
                "City": buyer_city,
                "Region": buyer_region,
                "Wereda": buyer_woreda,
            }
        else:
            payload["BuyerDetails"] = {"LegalName": WALK_IN_CUSTOMER}


        # SellerDetails
        _add_if_present(payload["SellerDetails"], "VatNumber", seller_vat_number)
        _add_if_present(payload["SellerDetails"], "HouseNumber", seller_house_number)
        _add_if_present(payload["SellerDetails"], "TradeName", company.get("custom_trade_name"))
        _add_if_present(payload["SellerDetails"], "SubTin", company.get("custom_sub_tin"))
        _add_if_present(payload["SellerDetails"], "Country", company.get("custom_country"))
        _add_if_present(payload["SellerDetails"], "Zone", company.get("custom_zone"))
        _add_if_present(payload["SellerDetails"], "SubCity", company.get("custom_sub_city"))
        _add_if_present(payload["SellerDetails"], "Kebele", company.get("custom_kebele"))
        _add_if_present(payload["SellerDetails"], "Locality", company.get("custom_locality"))

        # BuyerDetails
        if not is_walk_in:
            _add_if_present(payload["BuyerDetails"], "LegalName", cust_details.legal_name or invoice_doc.customer_name)
            _add_if_present(payload["BuyerDetails"], "Tin", clean_tin)
            _add_if_present(payload["BuyerDetails"], "SubTin", cust_details.get("sub_tin"))
            _add_if_present(payload["BuyerDetails"], "VatNumber", buyer_vat_number)
            _add_if_present(payload["BuyerDetails"], "Email", buyer_email)
            _add_if_present(payload["BuyerDetails"], "Phone", clean_phone)
            _add_if_present(payload["BuyerDetails"], "TradeName", cust_details.get("trade_name"))
            _add_if_present(payload["BuyerDetails"], "Country", buyer_country)
            _add_if_present(payload["BuyerDetails"], "Zone", buyer_zone)
            _add_if_present(payload["BuyerDetails"], "SubCity", cust_details.get("sub_city"))
            _add_if_present(payload["BuyerDetails"], "HouseNumber", cust_details.house_number)
            _add_if_present(payload["BuyerDetails"], "Kebele", buyer_kebele)
            _add_if_present(payload["BuyerDetails"], "Locality", cust_details.get("locality"))

        # MoR requires a buyer ID for every transaction type (rule 7004).
        # Use the buyer's own ID from Customer Details when its type is one
        # of the valid codes, otherwise fall back to a generic KID / 000000
        # so the submission is always accepted.
        if buyer_id_type in ID_TYPES and buyer_id_number:
            payload["BuyerDetails"]["IdNumber"] = buyer_id_number
            payload["BuyerDetails"]["IdType"] = buyer_id_type
        else:
            payload["BuyerDetails"]["IdNumber"] = "000000"
            payload["BuyerDetails"]["IdType"] = "KID"

        # SourceSystem
        _add_if_present(payload["SourceSystem"], "CashierName", cashier_name)
        _add_if_present(payload["SourceSystem"], "SalesPersonName", cashier_name)

        # PaymentDetails
        _add_if_present(payload["PaymentDetails"], "Mode", payment_mode)

        # ValueDetails
        discount_val = float(invoice_doc.discount_amount or 0.0)
        if discount_val:
            payload["ValueDetails"]["Discount"] = discount_val

        exchange_rate = getattr(invoice_doc, "conversion_rate", None)
        if invoice_doc.currency and invoice_doc.currency != "ETB":
            _add_if_present(payload["ValueDetails"], "ExchangeRate", exchange_rate)

        excise_val = getattr(invoice_doc, "custom_excise_tax_value", None)
        _add_if_present(payload["ValueDetails"], "ExciseValue", excise_val)

        income_wht = getattr(invoice_doc, "custom_income_withhold_value", None)
        _add_if_present(payload["ValueDetails"], "IncomeWithholdValue", income_wht)

        trans_wht = getattr(invoice_doc, "custom_transaction_withhold_value", None)
        _add_if_present(payload["ValueDetails"], "TransactionWithholdValue", trans_wht)

        # DocumentDetails
        manual_receipt_no = getattr(invoice_doc, "custom_manual_invoice_number", None)
        _add_if_present(payload["DocumentDetails"], "ManualInvoiceNumber", manual_receipt_no)
        reason_text = getattr(invoice_doc, "custom_reason", None)
        _add_if_present(payload["DocumentDetails"], "Reason", reason_text)

        # ReferenceDetails
        payload["ReferenceDetails"]["PreviousIrn"] = prev_irn
        related_doc = getattr(invoice_doc, "custom_related_document", None)
        payload["ReferenceDetails"]["RelatedDocument"] = related_doc
        po_number = getattr(invoice_doc, "po_no", None)
        _add_if_present(payload["ReferenceDetails"], "PurchaseOrder", po_number)
        contract_number = getattr(invoice_doc, "custom_contract_number", None)
        _add_if_present(payload["ReferenceDetails"], "Contract", contract_number)
        first_ticket = getattr(invoice_doc, "custom_first_ticket", None)
        _add_if_present(payload["ReferenceDetails"], "FirstTicket", first_ticket)
        last_ticket = getattr(invoice_doc, "custom_last_ticket", None)
        _add_if_present(payload["ReferenceDetails"], "LastTicket", last_ticket)

        tax_type = ""
        tax_rate = 0
        tax_entries = invoice_doc.get("taxes")
        if invoice_doc.taxes_and_charges and tax_entries:
            # Pick the first tax row that actually carries a rate (the first
            # row may be a 0% / exempt row on mixed invoices).
            for te in tax_entries:
                if float(te.rate or 0) > 0:
                    account = te.account_head
                    tax_type = frappe.db.get_value("Account", account, "account_name")
                    tax_rate = float(te.rate)
                    break
        valid_units = {"LTR", "MTR", "101", "PCS", "ROL", "MTS", "PKG", "SET", "KLG"}

        for idx, item in enumerate(invoice_doc.items, start=1):
            base_rate = float(item.base_rate or 0.0)
            qty = float(item.qty or 0.0)
            line_net_amount = float(item.base_net_amount or item.net_amount or 0.0)

            # Per-item tax rate/code (item_tax_rate is a JSON map like
            # {"VAT15 - GT": 15}) — falls back to the header tax row.
            line_tax_rate = tax_rate
            line_tax_code = tax_type
            try:
                item_tax_rate_map = json.loads(item.get("item_tax_rate") or "{}") or {}
                for code, rate_val in item_tax_rate_map.items():
                    rate_val = float(rate_val or 0)
                    if rate_val:
                        line_tax_rate = rate_val
                        resolved = frappe.db.get_value("Account", code, "account_name") if code else None
                        line_tax_code = resolved or code
                        break
            except (ValueError, TypeError):
                pass

            line_tax = round(line_net_amount * (line_tax_rate / 100), 6)

            # UnitPrice must be the NET unit price (excl. tax) at full
            # precision so MoR's UnitPrice x Quantity base matches our
            # net_amount exactly. For "inclusive of tax" pricing the
            # rate/base_rate is the gross price and MoR would compute the
            # tax on top of it again.
            unit_price = round(line_net_amount / qty, 6) if qty else base_rate

            # Report the discount actually granted on this line. Both the
            # list price and the charged amount are VAT-inclusive, so the
            # difference is converted to the VAT-exclusive base MoR works
            # in. UnitPrice is restated pre-discount and Discount is derived
            # from it so that MoR's check "UnitPrice x Qty - Discount ==
            # PreTaxValue" holds exactly.
            line_discount = 0.0
            pl_rate = float(item.get("price_list_rate") or 0)
            amount_incl = float(item.amount or 0) or (base_rate * qty)
            if qty and pl_rate > 0:
                disc_incl = round(pl_rate * qty - amount_incl, 2)
                if disc_incl > 0.005:
                    disc_excl = disc_incl / (1 + (line_tax_rate or 0) / 100.0)
                    unit_price = round((line_net_amount + disc_excl) / qty, 6)
                    line_discount = round(unit_price * qty - line_net_amount, 6)
            raw_uom = str(item.uom or "PCS").strip().upper()

            line_item = {
                "LineNumber": idx,
                "ItemCode": item.item_code,
                "ProductDescription": item.description or item.item_name or "string",
                "NatureOfSupplies": "goods",
                "Quantity": qty,
                "UnitPrice": unit_price,
                "PreTaxValue": round(line_net_amount, 2),
                "TaxCode": line_tax_code,
                "TaxAmount": line_tax,
                "Unit": raw_uom if raw_uom in valid_units else "PCS",
                "TotalLineAmount": round(line_net_amount + line_tax, 6)
            }

            _add_if_present(line_item, "HarmonizationCode", getattr(item, "custom_harmonization_code", None))

            if line_discount:
                line_item["Discount"] = line_discount

            excise_tax_val = getattr(item, "custom_excise_tax_value", None)
            if excise_tax_val:
                line_item["ExciseTaxValue"] = float(excise_tax_val)
            else:
                line_item["ExciseTaxValue"] = 0.0

            payload["ItemList"].append(line_item)

        # ValueDetails must exactly equal the payload line sums so MoR's
        # calculation-accuracy rule passes (rounding drift between per-line
        # values and the invoice document totals would otherwise be rejected).
        payload["ValueDetails"]["TaxValue"] = round(sum(it["TaxAmount"] for it in payload["ItemList"]), 6)
        payload["ValueDetails"]["TotalValue"] = round(sum(it["TotalLineAmount"] for it in payload["ItemList"]), 6)
        total_line_discount = round(sum(it.get("Discount", 0.0) for it in payload["ItemList"]), 6)
        if total_line_discount:
            payload["ValueDetails"]["Discount"] = total_line_discount

        self._validate_payload_schema_rules(payload, invoice_doc)
        return payload

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
        import time
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

    def _validate_payload_schema_rules(self, payload, invoice_doc):
        invoice_link = f"/app/sales-invoice/{invoice_doc.name}"

        tax_value = payload["ValueDetails"]["TaxValue"]
        if tax_value < 0:
            frappe.throw(
                f"Validation Error on <a href='{invoice_link}'>Sales Invoice ({invoice_doc.name})</a>:<br><br>"
                f"<b>Total Tax Value</b> cannot be negative for EIMS submission. Found: {tax_value}. "
                f"This usually means the invoice's tax/charges total is negative (e.g. a discount applied "
                f"as a negative tax line). Please review the Taxes and Charges table on this invoice.",
                title="EIMS Schema Error: Negative Tax Value"
            )

        for item in payload["ItemList"]:
            tax_amount = item["TaxAmount"]
            if tax_amount < 0:
                frappe.throw(
                    f"Validation Error on <a href='{invoice_link}'>Sales Invoice ({invoice_doc.name})</a>:<br><br>"
                    f"<b>Tax Amount</b> for item <b>{item['ItemCode']}</b> (line {item['LineNumber']}) "
                    f"cannot be negative for EIMS submission. Found: {tax_amount}. "
                    f"This usually means the invoice's overall tax total is negative, which gets distributed "
                    f"proportionally across line items. Please review the Taxes and Charges table on this invoice.",
                    title="EIMS Schema Error: Negative Tax Amount"
                )

            nature = item["NatureOfSupplies"]
            if nature not in ("goods", "service"):
                frappe.throw(
                    f"Validation Error on <a href='{invoice_link}'>Sales Invoice ({invoice_doc.name})</a>:<br><br>"
                    f"<b>NatureOfSupplies</b> for item <b>{item['ItemCode']}</b> (line {item['LineNumber']}) "
                    f"must be either 'goods' or 'service'. Found: '{nature}'.",
                    title="EIMS Schema Error: Invalid Nature Of Supplies"
                )

            pre_tax_value = item["PreTaxValue"]
            if pre_tax_value < 0:
                frappe.throw(
                    f"Validation Error on <a href='{invoice_link}'>Sales Invoice ({invoice_doc.name})</a>:<br><br>"
                    f"<b>Pre-Tax Value</b> for item <b>{item['ItemCode']}</b> (line {item['LineNumber']}) "
                    f"cannot be negative for EIMS submission. Found: {pre_tax_value}.",
                    title="EIMS Schema Error: Negative Pre-Tax Value"
                )

        discount = payload["ValueDetails"].get("Discount", 0)
        if discount < 0:
            frappe.throw(
                f"Validation Error on <a href='{invoice_link}'>Sales Invoice ({invoice_doc.name})</a>:<br><br>"
                f"<b>Discount</b> cannot be negative for EIMS submission. Found: {discount}.",
                title="EIMS Schema Error: Negative Discount"
            )

        total_value = payload["ValueDetails"]["TotalValue"]
        if total_value < 0:
            frappe.throw(
                f"Validation Error on <a href='{invoice_link}'>Sales Invoice ({invoice_doc.name})</a>:<br><br>"
                f"<b>Total Value</b> cannot be negative for EIMS submission. Found: {total_value}.",
                title="EIMS Schema Error: Negative Total Value"
            )


@frappe.whitelist()
def submit_invoice(invoice_name):
    if not invoice_name:
        frappe.throw("Parameter 'invoice_name' is required.")

    if not frappe.has_permission("Sales Invoice", "submit", doc=invoice_name) \
            and not frappe.has_permission("Sales Invoice", "write", doc=invoice_name):
        frappe.throw("Not permitted to submit this Sales Invoice to EIMS.", frappe.PermissionError)

    connector = EIMSConnector()
    result = connector.submit_single_invoice(invoice_name)
    return result


@frappe.whitelist()
def submit_invoices(invoice_names):
    if not invoice_names:
        frappe.throw("Parameter 'invoice_names' is required.")

    if isinstance(invoice_names, str):
        try:
            invoice_names = json.loads(invoice_names)
        except Exception:
            frappe.throw("Parameter 'invoice_names' must be a JSON array or list of invoice names.")

    if not isinstance(invoice_names, list) or not invoice_names:
        frappe.throw("Parameter 'invoice_names' must be a non-empty list of invoice names.")

    for name in invoice_names:
        if not frappe.has_permission("Sales Invoice", "write", doc=name):
            frappe.throw(f"Not permitted to submit invoice '{name}' to EIMS.", frappe.PermissionError)

    connector = EIMSConnector()
    result = connector.submit_bulk_invoices(invoice_names)
    return result


@frappe.whitelist()
def get_eims_status(invoice_name):
    if not invoice_name:
        frappe.throw("Parameter 'invoice_name' is required.")

    if not frappe.has_permission("Sales Invoice", "read", doc=invoice_name):
        frappe.throw("Not permitted to view this Sales Invoice.", frappe.PermissionError)

    status_data = frappe.db.get_value(
        "Sales Invoice",
        invoice_name,
        ["custom_eims_status", "custom_irn", "custom_qr_code_url"],
        as_dict=True
    )

    if not status_data:
        frappe.throw(f"Sales Invoice '{invoice_name}' not found.")

    return status_data


@frappe.whitelist(allow_guest=True)
def eims_callback():
    try:
        raw_body = frappe.request.get_data(as_text=True)
        eims_logger.debug("Callback received: %s", raw_body)

        if not raw_body or not raw_body.strip():
            eims_logger.debug("Empty callback body received - ignoring.")
            frappe.response["http_status_code"] = 200
            return {"status": "ignored_empty_body"}

        try:
            payload = json.loads(raw_body)
        except (ValueError, TypeError):
            eims_logger.exception("Callback body was not valid JSON")
            frappe.response["http_status_code"] = 400
            return {"status": "invalid_json"}

        items = payload if isinstance(payload, list) else payload.get("body", [payload])
        if not isinstance(items, list):
            items = [items]

        connector = EIMSConnector()
        processed, skipped, failed = 0, 0, 0
        last_doc_num = connector._peek_next_document_number() - 1

        for item in items:
            if not isinstance(item, dict):
                skipped += 1
                continue

            doc_no = item.get("documentNumber") or item.get("docNo")
            if not doc_no:
                skipped += 1
                continue

            invoice_name = frappe.db.get_value(
                "Sales Invoice", {"custom_document_number": doc_no}, "name"
            )
            if not invoice_name:
                eims_logger.warning("No Sales Invoice found for doc_no=%s", doc_no)
                skipped += 1
                continue

            irn = item.get("irn")
            item_status = item.get("status")

            try:
                if irn and item_status == "A":
                    signed_qr_base64 = item.get("signedQR")
                    qr_code_url = connector._save_qr_file(invoice_name, signed_qr_base64)

                    frappe.db.set_value("Sales Invoice", invoice_name, {
                        "custom_irn": irn,
                        "custom_qr_code_url": qr_code_url,
                        "custom_eims_status": "Registered",
                        "custom_conversation_id": item.get("conversationId") or item.get("conversionId"),
                        "custom_document_number": doc_no,
                    }, update_modified=True)
                    try:
                        doc_no_int = int(doc_no)
                        if doc_no_int > int(connector.settings.last_document_number or 0):
                            connector._commit_document_number(doc_no_int)
                    except (TypeError, ValueError):
                        pass
                    try:
                        last_doc_num = max(last_doc_num, int(doc_no))
                    except (TypeError, ValueError):
                        pass

                    child_name = frappe.db.get_value(
                        "Invoice List",
                        {"sales_invoice": invoice_name, "parenttype": "Invoice Registration"},
                        "name",
                    )
                    if child_name:
                        frappe.db.set_value(
                            "Invoice List", child_name, "status", "Transmitted",
                            update_modified=True,
                        )
                    else:
                        eims_logger.warning(
                            "No Invoice List row found for Sales Invoice %s (doc_no=%s)",
                            invoice_name, doc_no,
                        )

                    processed += 1
                else:
                    rule_error = item.get("ruleError")
                    error_detail = json.dumps(rule_error) if rule_error else json.dumps(item)

                    last_doc_num += 1
                    frappe.db.set_value("Sales Invoice", invoice_name, {
                        "custom_eims_status": "Failed",
                        "custom_document_number": last_doc_num,
                    }, update_modified=True)
                    frappe.log_error(message=error_detail, title=f"EIMS Callback Rejection: {invoice_name}")
                    failed += 1

            except Exception:
                frappe.log_error(
                    message=frappe.get_traceback(),
                    title=f"EIMS Callback Item Error: {invoice_name}",
                )
                failed += 1
                continue

        frappe.db.commit()
        eims_logger.debug(
            "Callback processed: %d ok, %d skipped, %d failed", processed, skipped, failed
        )
        frappe.response["http_status_code"] = 200
        return {"status": "received", "processed": processed, "skipped": skipped, "failed": failed}

    except Exception:
        frappe.db.rollback()
        frappe.log_error(message=frappe.get_traceback(), title="EIMS Callback Processing Error")
        eims_logger.exception("Callback processing error")
        frappe.response["http_status_code"] = 500
        return {"status": "error"}