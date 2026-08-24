import frappe
from frappe.custom.doctype.custom_field.custom_field import create_custom_fields


def execute():
    """Store the MoR receipt RNN (returned at receipt-generation time) on
    the Sales Invoice. MoR rejects duplicate receipt generation, so this
    RNN is the key used to re-fetch an already-generated receipt."""
    create_custom_fields(
        {
            "Sales Invoice": [
                dict(
                    fieldname="custom_mor_rrn",
                    label="MoR Receipt RNN",
                    fieldtype="Data",
                    read_only=1,
                    insert_after="custom_qr_code_url",
                    no_copy=1,
                    print_hide=1,
                )
            ]
        },
        ignore_validate=True,
        update=True,
    )
