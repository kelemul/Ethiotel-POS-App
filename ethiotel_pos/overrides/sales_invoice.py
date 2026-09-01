import frappe
from frappe import _
from erpnext.accounts.doctype.sales_invoice.sales_invoice import SalesInvoice

class CustomSalesInvoice(SalesInvoice):
    def before_save(self):
        super().before_save()
        # if not self.disable_rounded_total:
        #     frappe.throw(_("Rounded Total is required for EIRMS submission. Please ensure that 'Disable Rounded Total' is checked."))
        # MoR document number is now assigned per submission (increments
        # EIMS Setting.last_document_number) via eims_connector, not at save.
        # if not self.custom_document_number or int(self.custom_document_number) == 0:
        #     result = frappe.db.sql("""
        #         SELECT MAX(CAST(custom_document_number AS UNSIGNED))
        #         FROM `tabSales Invoice`
        #     """)
        #     cdn = result[0][0] if result and result[0][0] is not None else 0
        #     eims_setting = frappe.get_doc("EIMS Setting", "EIMS Setting")
        #     cdn = cdn if cdn > int(eims_setting.last_document_number) else eims_setting.last_document_number
        #     self.custom_document_number = cdn + 1