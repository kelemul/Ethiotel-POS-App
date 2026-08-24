import frappe
from frappe.custom.doctype.custom_field.custom_field import create_custom_fields


def execute():
	create_custom_fields(
		{
			"Sales Invoice": [
				dict(
					fieldname="custom_mor_total_value",
					label="MoR Total Value",
					fieldtype="Currency",
					insert_after="custom_document_number",
					read_only=1,
					no_copy=1,
					print_hide=1,
				),
				dict(
					fieldname="custom_conversation_id",
					label="Conversation ID",
					fieldtype="Data",
					insert_after="custom_mor_total_value",
					read_only=1,
					no_copy=1,
					print_hide=1,
				),
			]
		}
	)
