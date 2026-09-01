import frappe


class EIMSConnectorBase:
    def __init__(self):
        self.settings = frappe.get_single("EIMS Setting")
        self.headers = {"Content-Type": "application/json"}

    def _require(self, value, field_label, doc_label, link=None,
                 title="EIMS Schema Validation Error"):
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
