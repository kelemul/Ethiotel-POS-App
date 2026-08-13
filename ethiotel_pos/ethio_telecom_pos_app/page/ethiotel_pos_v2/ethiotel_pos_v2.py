# Copyright (c) 2026, Ethiotel and contributors
# For license information, please see license.txt

import json

import frappe
from frappe.utils import nowdate, add_days, flt, cint

from erpnext.accounts.doctype.pos_profile.pos_profile import get_item_groups
from erpnext.stock.get_item_details import get_conversion_factor

_pv = "ethiotel_pos.ethio_telecom_pos_app.page.ethiotel_pos_v2.ethiotel_pos_v2"


@frappe.whitelist()
def check_opening_entry(user):
	"""
	Find the cashier's currently-open shift. A shift stays open until the
	cashier (or the close-shift route) links a POS Closing Entry, so this
	must match SUBMITTED (docstatus=1) POS Opening Entries that have no
	closing entry yet — same contract as the v1 POS.
	"""
	return frappe.db.sql(
		"""
		SELECT name, company, pos_profile, period_start_date
		FROM `tabPOS Opening Entry`
		WHERE user = %s
		  AND docstatus = 1
		  AND (pos_closing_entry = '' OR pos_closing_entry IS NULL)
		ORDER BY period_start_date DESC
		""",
		user,
		as_dict=True,
	)


@frappe.whitelist()
def get_pos_profile_data(pos_profile):
	return frappe.get_doc("POS Profile", pos_profile).as_dict()


@frappe.whitelist()
def get_root_item_group():
	return frappe.db.sql(
		"SELECT name FROM `tabItem Group` WHERE lft = 1 AND is_group = 1 LIMIT 1",
		as_dict=True,
	)


@frappe.whitelist()
@frappe.validate_and_sanitize_search_inputs
def item_group_query(doctype, txt, searchfield, start, page_len, filters):
	"""
	Category lookup for the sale workspace chips. Filters to the POS
	Profile's configured item groups (ports v1's item_group_query).
	"""
	item_groups = []
	cond = "is_group = 1"

	try:
		if isinstance(filters, str):
			filters = json.loads(filters)
	except Exception:
		filters = {}

	pos_profile = (filters or {}).get("pos_profile")

	if pos_profile:
		item_groups = get_item_groups(pos_profile)
		if item_groups:
			cond = "name in (%s)" % (", ".join(["%s"] * len(item_groups)))

	return frappe.db.sql(
		f"""
		SELECT DISTINCT name FROM `tabItem Group`
		WHERE {cond} AND (name LIKE %(txt)s)
		ORDER BY lft ASC
		LIMIT %(page_len)s OFFSET %(start)s
		""",
		{"txt": f"%{txt}%", "page_len": cint(page_len), "start": cint(start)},
	)


@frappe.whitelist()
def get_uom_conversion_factor(item_code, uom):
	"""Conversion factor between an item's stock uom and the given uom."""
	cf = get_conversion_factor(item_code, uom)
	return {"conversion_factor": cf.get("conversion_factor", 1)}


@frappe.whitelist()
def get_warehouse_stock(item_code, warehouse):
	"""Live stock availability for an item in a specific warehouse."""
	from erpnext.accounts.doctype.pos_invoice.pos_invoice import get_stock_availability

	actual_qty, is_stock_item, _is_negative_stock_allowed = get_stock_availability(
		item_code, warehouse
	)
	return {"actual_qty": flt(actual_qty), "is_stock_item": cint(is_stock_item)}


@frappe.whitelist()
def get_items(start, page_length, price_list, item_group, pos_profile, search_term=""):
	"""
	Browse/query products for the V2 sale workspace.
	Reuses the same query shape as the v1 POS but returns a flat list
	plus the category tree so the workspace can build its own UI.
	"""
	parent = frappe.db.sql(
		"SELECT name FROM `tabItem Group` WHERE lft = 1 AND is_group = 1 LIMIT 1", as_dict=True
	)
	parent_item_group = item_group or (parent[0].name if parent else "")

	if not frappe.db.exists("Item Group", parent_item_group):
		parent_item_group = "All Item Groups"

	pos_profile_doc = frappe.get_doc("POS Profile", pos_profile)
	warehouse = pos_profile_doc.warehouse or pos_profile_doc.set_warehouse
	hide_unavailable = frappe.db.get_value("POS Profile", pos_profile, "hide_unavailable_items")

	fields = "item.name AS item_code, item.item_name, item.description, item.stock_uom, item.image AS item_image, item.is_stock_item, item.sales_uom"

	lft, rgt = frappe.db.get_value("Item Group", parent_item_group, ["lft", "rgt"])

	search_cond = ""
	if search_term:
		search_cond = "AND (item.name LIKE %s OR item.item_name LIKE %s OR item.item_code LIKE %s)"

	bin_join = """LEFT JOIN (
			SELECT item_code, SUM(actual_qty) AS actual_qty
			FROM `tabBin`
			GROUP BY item_code
		) bin ON bin.item_code = item.name"""
	if hide_unavailable:
		bin_join = """LEFT JOIN (
			SELECT bin.item_code, bin.actual_qty
			FROM `tabBin` bin
			WHERE bin.warehouse = %s
		) bin ON bin.item_code = item.name"""

	sql = f"""
		SELECT {fields}, ip.price_list_rate, ip.uom, ip.currency, ip.batch_no,
		       ifnull(bin.actual_qty, 0) AS actual_qty
		FROM `tabItem` item
		LEFT JOIN (
			SELECT ip.item_code, ip.price_list_rate, ip.uom, ip.currency, ip.batch_no
			FROM `tabItem Price` ip
			WHERE ip.price_list = %s AND ip.selling = 1 AND %s BETWEEN ifnull(ip.valid_from, '2000-01-01') AND ifnull(ip.valid_upto, '2099-12-31')
		) ip ON ip.item_code = item.name
		{bin_join}
		WHERE item.disabled = 0
		  AND item.has_variants = 0
		  AND item.is_sales_item = 1
		  AND item.is_fixed_asset = 0
		  AND item.item_group in (SELECT name FROM `tabItem Group` WHERE lft >= %s AND rgt <= %s)
		  {search_cond}
		  {("AND actual_qty > 0" if hide_unavailable else "")}
		ORDER BY item.item_name ASC
		LIMIT %s OFFSET %s
	"""
	params = [price_list, nowdate()]
	if hide_unavailable:
		params.append(warehouse)
	params += [cint(lft), cint(rgt)]
	if search_term:
		params += [f"%{search_term}%", f"%{search_term}%", f"%{search_term}%"]
	params += [cint(page_length), cint(start)]

	items = frappe.db.sql(sql, params, as_dict=True)

	return {
		"items": items,
		"warehouse": warehouse,
		"parent_item_group": parent_item_group,
	}


@frappe.whitelist()
def get_dashboard_data(pos_profile=None, from_date=None, to_date=None):
	from_date = from_date or nowdate()
	to_date = to_date or nowdate()

	cond = "docstatus = 1 AND posting_date BETWEEN %s AND %s"
	params = [from_date, to_date]
	if pos_profile:
		cond += " AND pos_profile = %s"
		params.append(pos_profile)

	sales_today = frappe.db.sql(
		f"SELECT ifnull(SUM(grand_total), 0) FROM `tabPOS Invoice` WHERE {cond}",
		params,
	)[0][0]

	transactions = frappe.db.sql(
		f"SELECT COUNT(name) FROM `tabPOS Invoice` WHERE {cond}",
		params,
	)[0][0]

	customers = frappe.db.sql(
		f"SELECT COUNT(DISTINCT customer) FROM `tabPOS Invoice` WHERE {cond}",
		params,
	)[0][0]

	held_orders = frappe.db.sql(
		"SELECT COUNT(name) FROM `tabPOS Invoice` WHERE docstatus = 0"
	)[0][0]

	# hourly sales for the last 24h (by hour of posting_time)
	hourly = frappe.db.sql(
		"""
		SELECT HOUR(posting_time) AS hr, ifnull(SUM(grand_total), 0) AS amount, COUNT(name) AS cnt
		FROM `tabPOS Invoice`
		WHERE docstatus = 1 AND posting_date = %s AND pos_profile = COALESCE(%s, pos_profile)
		GROUP BY HOUR(posting_time)
		ORDER BY hr
		""",
		(nowdate(), pos_profile),
		as_dict=True,
	)

	# payment methods
	payments = frappe.db.sql(
		"""
		SELECT sip.mode_of_payment, ifnull(SUM(sip.amount), 0) AS amount
		FROM `tabSales Invoice Payment` sip
		JOIN `tabPOS Invoice` si ON si.name = sip.parent
		WHERE si.docstatus = 1 AND si.posting_date BETWEEN %s AND %s AND si.pos_profile = COALESCE(%s, si.pos_profile)
		GROUP BY sip.mode_of_payment
		ORDER BY amount DESC
		""",
		(from_date, to_date, pos_profile),
		as_dict=True,
	)

	# top selling items
	top_items = frappe.db.sql(
		"""
		SELECT sii.item_code, sii.item_name, ifnull(SUM(sii.qty), 0) AS qty, ifnull(SUM(sii.base_net_amount), 0) AS amount
		FROM `tabPOS Invoice Item` sii
		JOIN `tabPOS Invoice` si ON si.name = sii.parent
		WHERE si.docstatus = 1 AND si.posting_date BETWEEN %s AND %s AND si.pos_profile = COALESCE(%s, si.pos_profile)
		GROUP BY sii.item_code, sii.item_name
		ORDER BY amount DESC
		LIMIT 8
		""",
		(from_date, to_date, pos_profile),
		as_dict=True,
	)

	# recent activity
	recent = frappe.db.sql(
		"""
		SELECT name, customer, customer_name, grand_total, posting_time, posting_date
		FROM `tabPOS Invoice`
		WHERE docstatus = 1 AND posting_date BETWEEN %s AND %s AND pos_profile = COALESCE(%s, pos_profile)
		ORDER BY creation DESC
		LIMIT 12
		""",
		(from_date, to_date, pos_profile),
		as_dict=True,
	)

	# cash drawer — opening amount of the current open shift + today's cash payment
	opening = frappe.db.sql(
		"""
		SELECT ifnull(SUM(bd.opening_amount), 0) AS amount
		FROM `tabPOS Opening Entry Detail` bd
		JOIN `tabPOS Opening Entry` o ON o.name = bd.parent
		WHERE o.docstatus = 0 AND o.pos_profile = COALESCE(%s, o.pos_profile)
		""",
		(pos_profile,),
		as_dict=True,
	)
	opening_amount = opening[0]["amount"] if opening else 0

	cash_in = frappe.db.sql(
		"""
		SELECT ifnull(SUM(sip.amount), 0)
		FROM `tabSales Invoice Payment` sip
		JOIN `tabPOS Invoice` si ON si.name = sip.parent
		WHERE si.docstatus = 1 AND si.posting_date = %s
		  AND lower(sip.mode_of_payment) LIKE '%%cash%%'
		  AND si.pos_profile = COALESCE(%s, si.pos_profile)
		""",
		(nowdate(), pos_profile),
	)[0][0]

	return {
		"sales_today": sales_today,
		"transactions": transactions,
		"customers": customers,
		"held_orders": held_orders,
		"hourly_sales": hourly,
		"payment_methods": payments,
		"top_items": top_items,
		"recent_activity": recent,
		"cash_drawer": {
			"opening_amount": opening_amount,
			"cash_in": cash_in,
			"expected": flt(opening_amount) + flt(cash_in),
		},
		"from_date": from_date,
		"to_date": to_date,
	}


@frappe.whitelist()
def get_customers(search_term="", limit=50, customer_group=None):
	cond = ""
	params = []
	if search_term:
		cond = " AND (name LIKE %s OR customer_name LIKE %s OR mobile_no LIKE %s)"
		params += [f"%{search_term}%", f"%{search_term}%", f"%{search_term}%"]
	if customer_group:
		cond += " AND customer_group = %s"
		params.append(customer_group)

	return frappe.db.sql(
		f"""
		SELECT name, customer_name, customer_group, mobile_no, email_id, image, loyalty_program, territory, disabled
		FROM `tabCustomer`
		WHERE disabled = 0 {cond}
		ORDER BY customer_name ASC
		LIMIT %s
		""",
		params + [cint(limit)],
		as_dict=True,
	)


@frappe.whitelist()
def get_customer_details(customer):
	cust = frappe.db.get_value(
		"Customer",
		customer,
		["name", "customer_name", "customer_group", "mobile_no", "email_id", "image", "loyalty_program", "territory"],
		as_dict=True,
	)
	transactions = frappe.db.sql(
		"""
		SELECT name, grand_total, posting_date, posting_time, status, currency
		FROM `tabPOS Invoice`
		WHERE customer = %s AND docstatus = 1
		ORDER BY creation DESC
		LIMIT 15
		""",
		customer,
		as_dict=True,
	)
	return {"customer": cust, "transactions": transactions}


@frappe.whitelist()
def get_held_orders(search_term="", limit=50):
	cond = "docstatus = 0"
	params = []
	if search_term:
		cond += " AND (name LIKE %s OR customer LIKE %s)"
		params += [f"%{search_term}%", f"%{search_term}%"]
	return frappe.db.sql(
		f"""
		SELECT name, customer, customer_name, grand_total, currency, posting_time, posting_date
		FROM `tabPOS Invoice`
		WHERE {cond}
		ORDER BY creation DESC
		LIMIT %s
		""",
		params + [cint(limit)],
		as_dict=True,
	)


@frappe.whitelist()
def get_invoices(search_term="", status="", limit=50, from_date=None, to_date=None):
	cond = "docstatus = 1"
	params = []
	if search_term:
		cond += " AND (name LIKE %s OR customer LIKE %s)"
		params += [f"%{search_term}%", f"%{search_term}%"]
	if status and status != "All":
		cond += " AND status = %s"
		params.append(status)
	if from_date:
		cond += " AND posting_date >= %s"
		params.append(from_date)
	if to_date:
		cond += " AND posting_date <= %s"
		params.append(to_date)
	return frappe.db.sql(
		f"""
		SELECT name, customer, customer_name, grand_total, currency, status, posting_time, posting_date
		FROM `tabPOS Invoice`
		WHERE {cond}
		ORDER BY creation DESC
		LIMIT %s
		""",
		params + [cint(limit)],
		as_dict=True,
	)


@frappe.whitelist()
def get_sales_report(from_date=None, to_date=None, pos_profile=None):
	from_date = from_date or add_days(nowdate(), -30)
	to_date = to_date or nowdate()

	cond = "docstatus = 1 AND posting_date BETWEEN %s AND %s"
	params = [from_date, to_date]
	if pos_profile:
		cond += " AND pos_profile = %s"
		params.append(pos_profile)

	total_sales = frappe.db.sql(f"SELECT ifnull(SUM(grand_total), 0) FROM `tabPOS Invoice` WHERE {cond}", params)[0][0]
	invoice_count = frappe.db.sql(f"SELECT COUNT(name) FROM `tabPOS Invoice` WHERE {cond}", params)[0][0]
	avg_sale = (total_sales / invoice_count) if invoice_count else 0

	by_payment_mode = frappe.db.sql(
		f"""
		SELECT sip.mode_of_payment, ifnull(SUM(sip.amount), 0) AS amount
		FROM `tabSales Invoice Payment` sip
		JOIN `tabPOS Invoice` si ON si.name = sip.parent
		WHERE si.docstatus = 1 AND si.posting_date BETWEEN %s AND %s
		  AND si.pos_profile = COALESCE(%s, si.pos_profile)
		GROUP BY sip.mode_of_payment
		ORDER BY amount DESC
		""",
		(from_date, to_date, pos_profile),
		as_dict=True,
	)

	return {
		"total_sales": total_sales,
		"invoice_count": invoice_count,
		"avg_sale": avg_sale,
		"by_payment_mode": by_payment_mode,
		"from_date": from_date,
		"to_date": to_date,
	}


@frappe.whitelist()
def save_held_order(doc):
	"""Persist a POS invoice as a DRAFT (held order). Returns the doc name."""
	import json

	if isinstance(doc, str):
		doc = json.loads(doc)
	if not doc or doc.get("doctype") != "POS Invoice":
		frappe.throw("Invalid held order payload")

	from frappe.model.utils import clean_doc

	doc["doctype"] = "POS Invoice"
	doc["is_pos"] = 1
	doc["docstatus"] = 0

	pos_inv = frappe.get_doc(doc)
	pos_inv.flags.ignore_permissions = True
	pos_inv.insert(ignore_permissions=True, ignore_mandatory=False)
	frappe.db.commit()
	return {"status": "ok", "invoice_name": pos_inv.name, "grand_total": pos_inv.grand_total}


@frappe.whitelist()
def submit_invoice(name):
	doc = frappe.get_doc("POS Invoice", name)
	doc.flags.ignore_permissions = True
	if doc.docstatus == 0:
		doc.submit()
	frappe.db.commit()
	return {"status": "ok", "invoice_name": doc.name, "grand_total": doc.grand_total}


@frappe.whitelist()
def delete_draft(name):
	frappe.db.delete("POS Invoice", {"name": name})
	frappe.db.commit()
	return {"status": "ok"}


@frappe.whitelist()
def get_item_by_barcode(barcode, price_list, pos_profile):
	"""Look up a single item by its barcode (any barcode in the Item Barcodes
	child table) and return it in the same shape as get_items rows so the sale
	workspace can push it straight into the cart."""
	from erpnext.stock.utils import scan_barcode

	scanned = scan_barcode(barcode)
	if not scanned or not scanned.get("item_code"):
		return {}

	item_code = scanned["item_code"]
	item = frappe.db.sql(
		"""
		SELECT item.name AS item_code, item.item_name, item.description, item.stock_uom,
		       item.image AS item_image, item.is_stock_item, item.sales_uom
		FROM `tabItem` item
		WHERE item.name = %s AND item.disabled = 0
		  AND item.has_variants = 0 AND item.is_sales_item = 1 AND item.is_fixed_asset = 0
		""",
		item_code,
		as_dict=True,
	)
	if not item:
		return {}
	item = item[0]

	# price for the profile's selling price list (today-valid)
	price = frappe.db.sql(
		"""
		SELECT ip.price_list_rate, ip.currency, ip.uom, ip.batch_no
		FROM `tabItem Price` ip
		WHERE ip.price_list = %s AND ip.item_code = %s AND ip.selling = 1
		  AND %s BETWEEN ifnull(ip.valid_from, '2000-01-01') AND ifnull(ip.valid_upto, '2099-12-31')
		ORDER BY ip.valid_from DESC
		LIMIT 1
		""",
		(price_list, item_code, nowdate()),
		as_dict=True,
	)
	item["price_list_rate"] = price[0]["price_list_rate"] if price else 0
	item["currency"] = price[0]["currency"] if price else frappe.get_cached_value("Company", frappe.defaults.get_user_default("company"), "default_currency")
	item["uom"] = (price[0]["uom"] or item.sales_uom or item.stock_uom) if price else (item.sales_uom or item.stock_uom)
	item["batch_no"] = price[0]["batch_no"] if price else None

	# stock across all warehouses (fall back to profile warehouse when available)
	warehouse = frappe.db.get_value("POS Profile", pos_profile, "warehouse")
	if warehouse:
		item["actual_qty"] = frappe.db.sql(
			"SELECT ifnull(actual_qty, 0) FROM `tabBin` WHERE item_code = %s AND warehouse = %s",
			(item_code, warehouse),
		)[0][0]
	else:
		item["actual_qty"] = frappe.db.sql(
			"SELECT ifnull(SUM(actual_qty), 0) FROM `tabBin` WHERE item_code = %s", item_code
		)[0][0]

	item["barcode"] = scanned.get("barcode")
	return item


@frappe.whitelist()
def get_shift_summary(pos_opening):
	"""Sales + payments made during the currently-open shift (used by the
	Check-in workspace and the shift dashboard)."""
	summary = {
		"sales_total": 0.0,
		"invoice_count": 0,
		"customer_count": 0,
		"payments": [],
		"opening_balance": {},
	}

	if not pos_opening:
		return summary

	entry = frappe.get_doc("POS Opening Entry", pos_opening)
	summary["period_start_date"] = entry.period_start_date
	summary["pos_profile"] = entry.pos_profile
	summary["company"] = entry.company

	for d in entry.balance_details:
		summary["opening_balance"][d.mode_of_payment] = d.opening_amount

	rows = frappe.db.sql(
		"""
		SELECT name, grand_total, customer, posting_date, posting_time
		FROM `tabPOS Invoice`
		WHERE docstatus = 1 AND creation >= %s AND pos_profile = %s
		""",
		(entry.period_start_date, entry.pos_profile),
		as_dict=True,
	)
	summary["invoice_count"] = len(rows)
	summary["sales_total"] = flt(sum(r.grand_total or 0) for r in rows)
	summary["customer_count"] = len({r.customer for r in rows})

	payments = frappe.db.sql(
		"""
		SELECT sip.mode_of_payment, ifnull(SUM(sip.amount), 0) AS amount
		FROM `tabSales Invoice Payment` sip
		JOIN `tabPOS Invoice` si ON si.name = sip.parent
		WHERE si.docstatus = 1 AND si.creation >= %s AND si.pos_profile = %s
		GROUP BY sip.mode_of_payment
		""",
		(entry.period_start_date, entry.pos_profile),
		as_dict=True,
	)
	summary["payments"] = payments
	return summary


@frappe.whitelist()
def close_shift(pos_opening):
	"""Create + submit the POS Closing Entry for the open shift, then link it
	back to the POS Opening Entry. Returns the closing entry details."""
	from erpnext.accounts.doctype.pos_closing_entry.pos_closing_entry import make_closing_entry_from_opening

	opening = frappe.get_doc("POS Opening Entry", pos_opening)
	closing = make_closing_entry_from_opening(opening)
	closing.flags.ignore_permissions = True
	closing.submit()
	closing.update_opening_entry()
	frappe.db.commit()

	return {
		"status": "ok",
		"closing_entry": closing.name,
		"grand_total": closing.grand_total,
		"net_total": closing.net_total,
		"total_quantity": closing.total_quantity,
		"period_end_date": closing.period_end_date,
	}
