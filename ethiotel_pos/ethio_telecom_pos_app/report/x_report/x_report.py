# Copyright (c) 2026, Guba Technology and contributors
import frappe
from frappe import _
import json

def execute(filters=None):
    filters = filters or {}
    columns = get_columns(filters)
    data = get_data(filters)
    
    # Summary calculations
    total_tax = sum(row.get("tax", 0) for row in data)
    total_amount = sum(row.get("grand_total", 0) for row in data)
    total_qty = sum(row.get("qty", 0) for row in data)

    report_summary = [
        {"label": _("Total Tax"), "value": total_tax, "indicator": "Green", "datatype": "Currency"},
        {"label": _("Entry Count"), "value": len(data), "indicator": "Blue"},
        {"label": _("Total Amount"), "value": total_amount, "indicator": "Red", "datatype": "Currency"},
        {"label": _("Total Quantity"), "value": total_qty, "indicator": "Pink"},
    ]
    
    return columns, data, None, None, report_summary

def get_columns(filters):
    group_by = filters.get("group_by") or "Item"
    columns = [
        {"label": _("Invoice"), "fieldname": "invoice", "fieldtype": "Link", "options": "Sales Invoice", "width": 140},
        {"label": _("Posting Time"), "fieldname": "posting_time", "fieldtype": "Time", "width": 100}
    ]

    if group_by == "Item":
        columns.append({"label": _("Item Code"), "fieldname": "item_code", "fieldtype": "Link", "options": "Item", "width": 120})

    columns.extend([
        {"label": _("Qty"), "fieldname": "qty", "fieldtype": "Float", "width": 80},
        {"label": _("Rate"), "fieldname": "rate", "fieldtype": "Currency", "width": 100},
        {"label": _("Net Amount"), "fieldname": "amount", "fieldtype": "Currency", "width": 110},
        {"label": _("Tax"), "fieldname": "tax", "fieldtype": "Currency", "width": 100},
        {"label": _("Total"), "fieldname": "grand_total", "fieldtype": "Currency", "width": 120},
        {"label": _("Customer"), "fieldname": "customer", "fieldtype": "Link", "options": "Customer", "width": 140}
    ])
    return columns

def get_data(filters):
    group_by = filters.get("group_by") or "Item"
    conditions = ["si.docstatus < 2"]
    values = {}

    # Date Filtering
    if filters.get("from_date") and filters.get("to_date"):
        conditions.append("si.posting_date BETWEEN %(from_date)s AND %(to_date)s")
        values["from_date"] = filters.get("from_date")
        values["to_date"] = filters.get("to_date")
    else:
        conditions.append("si.posting_date = CURRENT_DATE")

    # Item Filtering
    if filters.get("item_code") and group_by == "Item":
        conditions.append("ii.item_code = %(item_code)s")
        values["item_code"] = filters.get("item_code")

    # Tax Options
    if filters.get("tax_options") == "Taxed Items":
        conditions.append("si.total_taxes_and_charges > 0")
    elif filters.get("tax_options") == "Non-taxed Items":
        conditions.append("si.total_taxes_and_charges = 0")

    where_clause = " AND ".join(conditions)

    if group_by == "Invoice":
        query = f"""
            SELECT 
                si.name as invoice,
                si.posting_time as posting_time,
                si.total_qty as qty,
                0 as rate,
                si.net_total as amount,
                si.total_taxes_and_charges as tax,
                si.rounded_total as grand_total,
                si.customer as customer
            FROM `tabSales Invoice` si
            WHERE {where_clause}
            ORDER BY si.posting_time DESC
        """
        return frappe.db.sql(query, values, as_dict=True)
    
    else:
        # Per Item View
        # We calculate Tax per item based on the proportion of the item amount 
        # to the total invoice amount, which is the most reliable way in Frappe 
        # if item_tax_template is not consistently used.
        query = f"""
            SELECT 
                si.name as invoice,
                si.posting_time as posting_time,
                ii.item_code as item_code,
                ii.qty as qty,
                ii.rate as rate,
                ii.net_amount as amount,
                si.total_taxes_and_charges as total_inv_tax,
                si.net_total as inv_net_total,
                si.customer as customer
            FROM `tabSales Invoice` si
            JOIN `tabSales Invoice Item` ii ON si.name = ii.parent
            WHERE {where_clause}
            ORDER BY si.posting_time DESC, ii.idx ASC
        """
        raw_data = frappe.db.sql(query, values, as_dict=True)
        
        processed_data = []
        for row in raw_data:
            # Calculate item-wise tax share
            # (Item Net Amount / Total Invoice Net Amount) * Total Invoice Tax
            item_tax = 0
            if row['inv_net_total']:
                item_tax = (row['amount'] / row['inv_net_total']) * row['total_inv_tax']
            
            processed_data.append({
                "invoice": row['invoice'],
                "posting_time": row['posting_time'],
                "item_code": row['item_code'],
                "qty": row['qty'],
                "rate": row['rate'],
                "amount": row['amount'],
                "tax": item_tax,
                "grand_total": row['amount'] + item_tax,
                "customer": row['customer']
            })
        return processed_data