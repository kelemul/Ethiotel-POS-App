# Copyright (c) 2026, Guba Technology and contributors
import frappe
from frappe import _

def execute(filters=None):
    filters = filters or {}
    columns = get_columns()
    data = get_data(filters)
    
    # Calculate Summary Totals with fallback for None types
    # This prevents the 'int' and 'NoneType' error
    total_tax = sum((row.get("tax") or 0) for row in data)
    total_amount = sum((row.get("grand_total") or 0) for row in data)
    total_qty = sum((row.get("qty") or 0) for row in data)

    report_summary = [
        {"label": _("Total Tax"), "value": total_tax, "indicator": "Green", "datatype": "Currency"},
        {"label": _("Invoice Count"), "value": len(set(row['invoice'] for row in data if row.get('invoice'))), "indicator": "Blue"},
        {"label": _("Total Amount"), "value": total_amount, "indicator": "Red", "datatype": "Currency"},
        {"label": _("Total Quantity"), "value": total_qty, "indicator": "Pink"},
    ]
    
    chart = get_chart(data)
    
    return columns, data, None, chart, report_summary

def get_columns():
    return [
        {"label": _("Invoice"), "fieldname": "invoice", "fieldtype": "Link", "options": "Sales Invoice", "width": 140},
        {"label": _("Item Code"), "fieldname": "item_code", "fieldtype": "Link", "options": "Item", "width": 120},
        {"label": _("Qty"), "fieldname": "qty", "fieldtype": "Float", "width": 80},
        {"label": _("Rate"), "fieldname": "rate", "fieldtype": "Currency", "width": 100},
        {"label": _("Net Amount"), "fieldname": "amount", "fieldtype": "Currency", "width": 110},
        {"label": _("Tax"), "fieldname": "tax", "fieldtype": "Currency", "width": 100},
        {"label": _("Total"), "fieldname": "grand_total", "fieldtype": "Currency", "width": 120},
        {"label": _("Posting Date"), "fieldname": "posting_date", "fieldtype": "Date", "width": 100},
        {"label": _("Posting Time"), "fieldname": "posting_time", "fieldtype": "Time", "width": 100},
        {"label": _("Customer"), "fieldname": "customer", "fieldtype": "Link", "options": "Customer", "width": 140},
    ]

def get_data(filters):
    # Z-Report strictly focuses on Submitted (1) transactions
    conditions = ["si.docstatus = 1"]
    values = {}

    if filters.get("from_date") and filters.get("to_date"):
        conditions.append("si.posting_date BETWEEN %(from_date)s AND %(to_date)s")
        values["from_date"] = filters.get("from_date")
        values["to_date"] = filters.get("to_date")
    else:
        conditions.append("si.posting_date = CURRENT_DATE")

    if filters.get("item_code"):
        conditions.append("ii.item_code = %(item_code)s")
        values["item_code"] = filters.get("item_code")

    if filters.get("tax_options") == "Taxed Items":
        conditions.append("si.total_taxes_and_charges > 0")
    elif filters.get("tax_options") == "Non-taxed Items":
        conditions.append("si.total_taxes_and_charges = 0")

    where_clause = " AND ".join(conditions)

    # SQL uses IFNULL to ensure no NULL values reach the Python side
    # It also handles the proportional tax calculation per item row
    query = f"""
        SELECT 
            si.name as invoice,
            ii.item_code as item_code,
            IFNULL(ii.qty, 0) as qty,
            IFNULL(ii.rate, 0) as rate,
            IFNULL(ii.net_amount, 0) as amount,
            (IFNULL(ii.net_amount, 0) * (IFNULL(si.total_taxes_and_charges, 0) / NULLIF(si.net_total, 0))) as tax,
            (IFNULL(ii.net_amount, 0) + (IFNULL(ii.net_amount, 0) * (IFNULL(si.total_taxes_and_charges, 0) / NULLIF(si.net_total, 0)))) as grand_total,
            si.posting_date as posting_date,
            si.posting_time as posting_time,
            si.customer as customer
        FROM `tabSales Invoice` si
        JOIN `tabSales Invoice Item` ii ON si.name = ii.parent
        WHERE {where_clause}
        ORDER BY si.posting_time DESC
    """
    return frappe.db.sql(query, values, as_dict=True)

def get_chart(data):
    if not data:
        return None
    
    # Aggregate revenue per item for the top 10 sellers
    item_totals = {}
    for row in data:
        item = row.get("item_code")
        if item:
            item_totals[item] = item_totals.get(item, 0) + (row.get("grand_total") or 0)
    
    sorted_items = sorted(item_totals.items(), key=lambda x: x[1], reverse=True)[:10]
    
    if not sorted_items:
        return None

    return {
        "data": {
            "labels": [x[0] for x in sorted_items],
            "datasets": [{"name": _("Revenue"), "values": [x[1] for x in sorted_items]}]
        },
        "type": "bar",
        "colors": ["#7cd6fd"]
    }