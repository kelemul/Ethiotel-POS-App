// Copyright (c) 2026, Guba Technology and contributors

frappe.query_reports["X Report"] = {
    "filters": [
        {
            "fieldname": "group_by",
            "label": __("View Mode"),
            "fieldtype": "Select",
            "options": "Item\nInvoice",
            "default": "Item",
            "reqd": 1
        },
        {
            "fieldname": "from_date",
            "label": __("From Date"),
            "fieldtype": "Date",
            "default": frappe.datetime.get_today()
        },
        {
            "fieldname": "to_date",
            "label": __("To Date"),
            "fieldtype": "Date",
            "default": frappe.datetime.get_today()
        },
        {
            "fieldname": "item_code",
            "label": __("Item"),
            "fieldtype": "Link",
            "options": "Item"
        },
        {
            "fieldname": "is_pos",
            "label": __("POS Only"),
            "fieldtype": "Check",
            "default": 1
        },
        {
            "fieldname": "tax_options",
            "label": __("Tax Filter"),
            "fieldtype": "Select",
            "options": "\nTaxed Items\nNon-taxed Items"
        },
        {
            "fieldname": "customer",
            "label": __("Customer"),
            "fieldtype": "Link",
            "options": "Customer"
        }
    ]
};