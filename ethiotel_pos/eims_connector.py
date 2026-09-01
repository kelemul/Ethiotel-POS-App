import json

import frappe

from ethiotel_pos.eims.connector import EIMSConnector
from ethiotel_pos.eims.constants import WALK_IN_CUSTOMER
from ethiotel_pos.eims.payload import resolve_mor_payment_mode

__all__ = [
    "EIMSConnector",
    "WALK_IN_CUSTOMER",
    "resolve_mor_payment_mode",
    "submit_invoice",
    "submit_invoices",
    "get_eims_status",
    "eims_callback",
]


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
    return EIMSConnector()._handle_callback()
