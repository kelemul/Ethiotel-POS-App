# Copyright (c) 2026, Ethiotel and contributors
# For license information, please see license.txt

import json

import frappe
from frappe import _
from frappe.utils import nowdate, add_days, flt, cint, now_datetime, getdate

from erpnext.accounts.doctype.pos_profile.pos_profile import get_item_groups
from erpnext.stock.get_item_details import get_conversion_factor

_pv = "ethiotel_pos.ethio_telecom_pos_app.page.ethiotel_pos.ethiotel_pos"


# ---------------------------------------------------------------------
# MoR (EIMS) helpers — the EIMS connector lives on Sales Invoice, so a
# submitted POS Invoice is converted to a Sales Invoice before
# registration / verification / cancellation.
# ---------------------------------------------------------------------
_POS_MOR_FIELDS = (
	("custom_sales_invoice", "Link", "Sales Invoice"),
	("custom_eims_status", "Select", "\nRegistered\nPending\nFailed\nTransmitted\nCancelled"),
	("custom_mor_irn", "Data", None),
)


def _ensure_pos_mor_fields():
	"""Create the POS Invoice MoR tracking fields on first use (avoids a
	full migrate in this environment)."""
	meta = frappe.get_meta("POS Invoice")
	for fieldname, fieldtype, options in _POS_MOR_FIELDS:
		if meta.get_field(fieldname):
			continue
		frappe.get_doc(
			{
				"doctype": "Custom Field",
				"dt": "POS Invoice",
				"fieldname": fieldname,
				"fieldtype": fieldtype,
				"label": fieldname.replace("custom_", "").replace("_", " ").title(),
				"options": options or "",
				"insert_after": "status",
			}
		).insert(ignore_permissions=True)
	frappe.db.commit()


def _convert_pos_invoice_to_sales_invoice(pos_invoice_name):
	"""Create + submit a Sales Invoice mirroring a submitted POS Invoice.
	Returns the Sales Invoice name (reuses an existing conversion)."""
	_ensure_pos_mor_fields()
	existing = frappe.db.get_value("POS Invoice", pos_invoice_name, "custom_sales_invoice")
	if existing and frappe.db.get_value("Sales Invoice", existing, "docstatus") == 1:
		return existing

	pos = frappe.get_doc("POS Invoice", pos_invoice_name)
	if pos.docstatus != 1:
		frappe.throw(_("Only submitted POS Invoices can be registered with MoR."))

	si = frappe.new_doc("Sales Invoice")
	si.customer = pos.customer
	si.company = pos.company
	si.posting_date = pos.posting_date
	si.set_posting_time = 1
	si.posting_time = pos.posting_time or now_datetime().time()
	si.due_date = pos.due_date
	si.currency = pos.currency
	si.conversion_rate = pos.conversion_rate or 1
	si.is_pos = 0
	si.update_stock = 0
	si.set_warehouse = pos.set_warehouse
	si.debit_to = pos.debit_to
	si.party_account_currency = pos.party_account_currency
	si.cost_center = pos.cost_center
	si.disable_rounded_total = 1  # required by the EIRMS override
	si.remarks = _("Converted from POS Invoice {0}").format(pos.name)
	si.flags.ignore_permissions = True

	for item in pos.items:
		si.append(
			"items",
			{
				"item_code": item.item_code,
				"item_name": item.item_name,
				"qty": item.qty,
				"uom": item.uom,
				"conversion_factor": item.conversion_factor or 1,
				"rate": item.rate,
				"price_list_rate": item.price_list_rate,
				"discount_percentage": item.discount_percentage or 0,
				"warehouse": item.warehouse or pos.set_warehouse,
				"cost_center": item.cost_center or pos.cost_center,
				"serial_no": item.serial_no,
				"batch_no": item.batch_no,
			},
		)

	for tax in pos.taxes:
		si.append(
			"taxes",
			{
				"charge_type": tax.charge_type,
				"account_head": tax.account_head,
				"description": tax.description,
				"rate": tax.rate,
				"tax_amount": tax.tax_amount,
			},
		)

	for p in pos.payments:
		si.append(
			"payments",
			{
				"mode_of_payment": p.mode_of_payment,
				"amount": p.amount,
				"type": p.type,
				"account": p.account,
				"default": p.default,
			},
		)

	si.insert(ignore_permissions=True)
	si.submit()
	frappe.db.set_value(
		"POS Invoice", pos_invoice_name, "custom_sales_invoice", si.name, update_modified=True
	)
	frappe.db.commit()
	return si.name


@frappe.whitelist()
def register_with_mor(pos_invoice_name):
	"""Send a submitted POS Invoice to the MoR: convert to a Sales Invoice
	(first time only) then run the EIMS registration."""
	try:
		si_name = _convert_pos_invoice_to_sales_invoice(pos_invoice_name)
		sales_status = frappe.db.get_value("Sales Invoice", si_name, "custom_eims_status")
		if sales_status == "Registered":
			return {"status": "ok", "result": {"status": "Transmitted", "message": "Already Registered"}, "sales_invoice": si_name}

		from ethiotel_pos.eims_connector import EIMSConnector

		res = EIMSConnector().submit_single_invoice(si_name)

		irn = frappe.db.get_value("Sales Invoice", si_name, "custom_irn")
		status = frappe.db.get_value("Sales Invoice", si_name, "custom_eims_status") or res.get("status")
		frappe.db.set_value(
			"POS Invoice", pos_invoice_name, "custom_eims_status", status, update_modified=True
		)
		if irn:
			frappe.db.set_value("POS Invoice", pos_invoice_name, "custom_mor_irn", irn, update_modified=True)
		frappe.db.commit()

		return {"status": "ok", "result": res, "sales_invoice": si_name, "irn": irn, "eims_status": status}
	except Exception as e:
		frappe.log_error(frappe.get_traceback(), "V2 MoR registration error")
		return {"status": "error", "message": str(e)}


@frappe.whitelist()
def verify_mor_pos_invoice(pos_invoice_name=None, irn=None):
	"""Verify an MoR invoice by IRN (or from the converted Sales Invoice)."""
	try:
		_ensure_pos_mor_fields()
		sales_invoice = None
		if pos_invoice_name:
			sales_invoice = frappe.db.get_value("POS Invoice", pos_invoice_name, "custom_sales_invoice")
		if not irn:
			irn = frappe.db.get_value("POS Invoice", pos_invoice_name, "custom_mor_irn") if pos_invoice_name else None
			if not irn and sales_invoice:
				irn = frappe.db.get_value("Sales Invoice", sales_invoice, "custom_irn")
		if not irn:
			return {"status": "error", "message": _("Unable to determine IRN for verification")}

		doc = frappe.get_doc(
			{
				"doctype": "EIMS Invoice Verification",
				"select_registered_invoices": sales_invoice,
				"irn": irn.strip(),
			}
		)
		doc.insert(ignore_permissions=True)
		res = doc.trigger_remote_verification()
		return {"status": "ok", "result": res, "irn": irn}
	except Exception as e:
		frappe.log_error(frappe.get_traceback(), "V2 MoR verification error")
		return {"status": "error", "message": str(e)}


@frappe.whitelist()
def cancel_mor_pos_invoice(pos_invoice_name, cancellation_reasons="Mistake", remark=""):
	"""Cancel a registered MoR invoice (single) using the EIMS Invoice
	Cancellation doctype."""
	try:
		_ensure_pos_mor_fields()
		si = frappe.db.get_value("POS Invoice", pos_invoice_name, "custom_sales_invoice")
		irn = frappe.db.get_value("POS Invoice", pos_invoice_name, "custom_mor_irn") or (
			frappe.db.get_value("Sales Invoice", si, "custom_irn") if si else None
		)
		if not irn:
			return {"status": "error", "message": _("No IRN found — invoice was never registered.")}

		doc = frappe.get_doc(
			{
				"doctype": "EIMS Invoice Cancellation",
				"is_bulk_cancellation": 0,
				"sales_invoice": si,
				"irn": irn,
				"cancellation_reasons": cancellation_reasons,
				"remark": remark or f"Cancelled from POS: {pos_invoice_name}",
			}
		)
		doc.insert(ignore_permissions=True)
		res = doc.trigger_remote_cancellation()

		if res.get("status") == "Cancelled":
			frappe.db.set_value("POS Invoice", pos_invoice_name, "custom_eims_status", "Cancelled", update_modified=True)
			frappe.db.commit()
		return {"status": "ok", "result": res, "irn": irn}
	except Exception as e:
		frappe.log_error(frappe.get_traceback(), "V2 MoR cancellation error")
		return {"status": "error", "message": str(e)}


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
def resync_pos_data():
	"""Force-refresh cached POS data (item groups, prices, stock bins and
	the profiles themselves) so the sale workspace re-browses on next load.
	Used by the sidebar "Resync" action — replaces the dead v1-era call."""
	frappe.cache().delete_keys("*pos_profile*")
	frappe.cache().delete_keys("*item_group*")
	frappe.cache().delete_keys("*item_price*")
	frappe.cache().delete_keys("pos_profile")
	frappe.cache().delete_keys("item:data:*")
	frappe.clear_cache(doctype="Item")
	frappe.clear_cache(doctype="Bin")
	frappe.clear_cache(doctype="POS Profile")
	frappe.clear_cache(doctype="Item Price")
	frappe.clear_cache(doctype="Item Group")
	return {"status": "ok"}


@frappe.whitelist()
@frappe.validate_and_sanitize_search_inputs
def item_group_query(doctype, txt, searchfield, start, page_len, filters):
	"""
	Category lookup for the sale workspace chips. Filters to the POS
	Profile's configured item groups (ports v1's item_group_query).
	"""
	item_groups = []
	cond = "is_group = 0"

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

	# item.item_group is included so the sale workspace's list view can
	# show each product's category as a subtitle.
	fields = "item.name AS item_code, item.item_name, item.item_group, item.description, item.stock_uom, item.image AS item_image, item.is_stock_item, item.sales_uom"

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
	try:
		_ensure_pos_mor_fields()
	except Exception:
		frappe.db.rollback()
	cond = "1=1"
	params = []
	st = (status or "").strip()
	# docstatus / lifecycle filter
	if st in ("draft", "Draft", "not-submitted"):
		cond += " AND docstatus = 0"
	elif st in ("submitted",):
		cond += " AND docstatus = 1"
	elif st in ("cancelled", "Cancelled"):
		cond += " AND docstatus = 2"
	elif st in ("Paid", "Credit", "Return"):
		# these are POS Invoice `status` values on a submitted invoice
		cond += " AND docstatus = 1 AND status = %s"
		params.append(st)
	elif st and st != "All":
		# any other explicit status value
		cond += " AND status = %s"
		params.append(st)
	# "All" or empty -> every docstatus
	if search_term:
		cond += " AND (name LIKE %s OR customer LIKE %s OR customer_name LIKE %s)"
		params += [f"%{search_term}%", f"%{search_term}%", f"%{search_term}%"]
	if from_date:
		cond += " AND posting_date >= %s"
		params.append(from_date)
	if to_date:
		cond += " AND posting_date <= %s"
		params.append(to_date)
	meta = frappe.get_meta("POS Invoice")
	extra_cols = ""
	for fieldname in ("custom_sales_invoice", "custom_eims_status", "custom_mor_irn"):
		if meta.get_field(fieldname):
			extra_cols += f", ifnull({fieldname}, '') AS {fieldname.replace('custom_', '')}"
	try:
		return frappe.db.sql(
			f"""
			SELECT name, customer, customer_name, grand_total, currency, status, posting_time, posting_date{extra_cols}
			FROM `tabPOS Invoice`
			WHERE {cond}
			ORDER BY creation DESC
			LIMIT %s
			""",
			params + [cint(limit)],
			as_dict=True,
		)
	except Exception:
		frappe.log_error(frappe.get_traceback(), "get_invoices failed")
		return []


@frappe.whitelist()
def get_sales_invoices(search_term="", status="", limit=50, from_date=None, to_date=None):
	"""List Sales Invoices (the converted/from-POS documents) for the
	Sales Invoice tab. Each row carries its source POS Invoice so the MoR
	actions can be routed through the POS Invoice registration helpers."""
	try:
		_ensure_pos_mor_fields()
	except Exception:
		frappe.db.rollback()
	cond = "1=1"
	params = []
	st = (status or "").strip()
	if st in ("Draft", "draft"):
		cond += " AND docstatus = 0"
	elif st in ("Submitted", "submitted"):
		cond += " AND docstatus = 1"
	elif st in ("Cancelled", "cancelled"):
		cond += " AND docstatus = 2"
	elif st and st not in ("All", "Paid", "Credit", "Return"):
		cond += " AND status = %s"
		params.append(st)
	if search_term:
		cond += " AND (name LIKE %s OR customer LIKE %s OR customer_name LIKE %s)"
		params += [f"%{search_term}%", f"%{search_term}%", f"%{search_term}%"]
	if from_date:
		cond += " AND posting_date >= %s"
		params.append(from_date)
	if to_date:
		cond += " AND posting_date <= %s"
		params.append(to_date)
	meta = frappe.get_meta("Sales Invoice")
	extra_cols = ""
	for fieldname in ("custom_eims_status", "custom_irn"):
		if meta.get_field(fieldname):
			extra_cols += f", ifnull({fieldname}, '') AS {fieldname.replace('custom_', '')}"
	try:
		return frappe.db.sql(
			f"""
			SELECT name, customer, customer_name, grand_total, currency, status, posting_time, posting_date{extra_cols},
				(select name from `tabPOS Invoice` where custom_sales_invoice = `tabSales Invoice`.name limit 1) as pos_invoice
			FROM `tabSales Invoice`
			WHERE {cond}
			ORDER BY creation DESC
			LIMIT %s
			""",
			params + [cint(limit)],
			as_dict=True,
		)
	except Exception:
		frappe.log_error(frappe.get_traceback(), "get_sales_invoices failed")
		return []


@frappe.whitelist()
def make_sales_invoice_from_pos(pos_invoice_name):
	"""Convert a submitted POS Invoice into a Sales Invoice (no MoR
	registration yet). Idempotent — reuses an existing conversion."""
	try:
		si_name = _convert_pos_invoice_to_sales_invoice(pos_invoice_name)
		return {"status": "ok", "sales_invoice": si_name}
	except Exception as e:
		frappe.log_error(frappe.get_traceback(), "make_sales_invoice_from_pos failed")
		return {"status": "error", "message": str(e)}


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
		SELECT item.name AS item_code, item.item_name, item.item_group, item.description, item.stock_uom,
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


def _sales_rows_cond(from_date=None, to_date=None, pos_profile=None, pos_opening=None):
	"""Shared WHERE clause for X/Z report queries. X uses the open-shift
	period (creation >= shift start); Z uses a date range."""
	cond = "docstatus = 1"
	params = []
	if pos_opening:
		entry = frappe.get_doc("POS Opening Entry", pos_opening)
		cond += " AND creation >= %s"
		params.append(entry.period_start_date)
		pos_profile = entry.pos_profile
	elif from_date and to_date:
		cond += " AND posting_date BETWEEN %s AND %s"
		params += [from_date, to_date]
	if pos_profile:
		cond += " AND pos_profile = %s"
		params.append(pos_profile)
	return cond, params, pos_profile


@frappe.whitelist()
def get_x_report(pos_opening=None, pos_profile=None):
	"""X report — intermediate reading for the currently-open shift
	(sales, counts, payments, taxes and a line-item summary)."""
	cond, params, pos_profile = _sales_rows_cond(pos_opening=pos_opening, pos_profile=pos_profile)

	invoices = frappe.db.sql(
		f"""
		SELECT name, customer, customer_name, grand_total, net_total, total_taxes_and_charges,
		       posting_date, posting_time, currency, creation
		FROM `tabPOS Invoice`
		WHERE {cond}
		ORDER BY creation ASC
		""",
		params,
		as_dict=True,
	)

	grand_total = flt(sum(i.grand_total or 0 for i in invoices))
	net_total = flt(sum(i.net_total or 0 for i in invoices))
	tax_total = flt(sum(i.total_taxes_and_charges or 0 for i in invoices))
	discount_total = flt(sum((i.discount_amount or 0) for i in invoices))
	item_count = 0
	invoice_count = len(invoices)

	items = frappe.db.sql(
		f"""
		SELECT sii.item_code, sii.item_name, ifnull(SUM(sii.qty), 0) AS qty,
		       ifnull(SUM(sii.base_net_amount), 0) AS amount
		FROM `tabPOS Invoice Item` sii
		JOIN `tabPOS Invoice` si ON si.name = sii.parent
		WHERE si.docstatus = 1
		  AND si.creation >= COALESCE((SELECT period_start_date FROM `tabPOS Opening Entry`
		     WHERE name = %s), '2000-01-01')
		  AND si.pos_profile = COALESCE(%s, si.pos_profile)
		GROUP BY sii.item_code, sii.item_name
		ORDER BY amount DESC
		LIMIT 100
		""",
		(pos_opening, pos_profile),
		as_dict=True,
	)
	item_count = flt(sum(i.qty for i in items))

	payments = frappe.db.sql(
		f"""
		SELECT sip.mode_of_payment, ifnull(SUM(sip.amount), 0) AS amount
		FROM `tabSales Invoice Payment` sip
		JOIN `tabPOS Invoice` si ON si.name = sip.parent
		WHERE si.docstatus = 1
		  AND si.creation >= COALESCE((SELECT period_start_date FROM `tabPOS Opening Entry`
		     WHERE name = %s), '2000-01-01')
		  AND si.pos_profile = COALESCE(%s, si.pos_profile)
		GROUP BY sip.mode_of_payment
		ORDER BY amount DESC
		""",
		(pos_opening, pos_profile),
		as_dict=True,
	)

	taxes = frappe.db.sql(
		f"""
		SELECT sit.account_head, sit.rate, ifnull(SUM(sit.tax_amount), 0) AS amount
		FROM `tabSales Taxes and Charges` sit
		JOIN `tabPOS Invoice` si ON si.name = sit.parent
		WHERE si.docstatus = 1
		  AND si.creation >= COALESCE((SELECT period_start_date FROM `tabPOS Opening Entry`
		     WHERE name = %s), '2000-01-01')
		  AND si.pos_profile = COALESCE(%s, si.pos_profile)
		GROUP BY sit.account_head, sit.rate
		ORDER BY amount DESC
		""",
		(pos_opening, pos_profile),
		as_dict=True,
	)

	return {
		"report_type": "X",
		"invoices": invoices,
		"grand_total": grand_total,
		"net_total": net_total,
		"tax_total": tax_total,
		"discount_total": discount_total,
		"invoice_count": invoice_count,
		"item_count": item_count,
		"avg_sale": (grand_total / invoice_count) if invoice_count else 0,
		"payments": payments,
		"items": items,
		"taxes": taxes,
		"pos_profile": pos_profile,
		"period_start": frappe.db.get_value("POS Opening Entry", pos_opening, "period_start_date")
		if pos_opening
		else None,
	}


@frappe.whitelist()
def get_z_report(from_date=None, to_date=None, pos_profile=None):
	"""Z report — daily / closed-period reading (full detail + totals)."""
	from_date = from_date or nowdate()
	to_date = to_date or nowdate()
	cond, params, pos_profile = _sales_rows_cond(
		from_date=from_date, to_date=to_date, pos_profile=pos_profile
	)

	invoices = frappe.db.sql(
		f"""
		SELECT name, customer, customer_name, grand_total, net_total, total_taxes_and_charges,
		       posting_date, posting_time, currency, creation
		FROM `tabPOS Invoice`
		WHERE {cond}
		ORDER BY posting_date ASC, posting_time ASC
		""",
		params,
		as_dict=True,
	)

	grand_total = flt(sum(i.grand_total or 0 for i in invoices))
	net_total = flt(sum(i.net_total or 0 for i in invoices))
	tax_total = flt(sum(i.total_taxes_and_charges or 0 for i in invoices))
	discount_total = flt(sum((i.discount_amount or 0) for i in invoices))
	invoice_count = len(invoices)

	items = frappe.db.sql(
		f"""
		SELECT sii.item_code, sii.item_name, ifnull(SUM(sii.qty), 0) AS qty,
		       ifnull(SUM(sii.base_net_amount), 0) AS amount
		FROM `tabPOS Invoice Item` sii
		JOIN `tabPOS Invoice` si ON si.name = sii.parent
		WHERE si.docstatus = 1 AND si.posting_date BETWEEN %s AND %s
		  AND si.pos_profile = COALESCE(%s, si.pos_profile)
		GROUP BY sii.item_code, sii.item_name
		ORDER BY amount DESC
		LIMIT 200
		""",
		(from_date, to_date, pos_profile),
		as_dict=True,
	)
	item_count = flt(sum(i.qty for i in items))

	payments = frappe.db.sql(
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

	taxes = frappe.db.sql(
		f"""
		SELECT sit.account_head, sit.rate, ifnull(SUM(sit.tax_amount), 0) AS amount
		FROM `tabSales Taxes and Charges` sit
		JOIN `tabPOS Invoice` si ON si.name = sit.parent
		WHERE si.docstatus = 1 AND si.posting_date BETWEEN %s AND %s
		  AND si.pos_profile = COALESCE(%s, si.pos_profile)
		GROUP BY sit.account_head, sit.rate
		ORDER BY amount DESC
		""",
		(from_date, to_date, pos_profile),
		as_dict=True,
	)

	return {
		"report_type": "Z",
		"invoices": invoices,
		"grand_total": grand_total,
		"net_total": net_total,
		"tax_total": tax_total,
		"discount_total": discount_total,
		"invoice_count": invoice_count,
		"item_count": item_count,
		"avg_sale": (grand_total / invoice_count) if invoice_count else 0,
		"payments": payments,
		"items": items,
		"taxes": taxes,
		"pos_profile": pos_profile,
		"from_date": from_date,
		"to_date": to_date,
	}


@frappe.whitelist()
def save_offline_order(order, ref):
	"""Replay a POS Invoice that was queued in the browser while offline
	(mirrors the v1 endpoint so the same sync strategy works for V2)."""
	if isinstance(order, str):
		order = json.loads(order)

	if not order or order.get("doctype") != "POS Invoice":
		frappe.throw("Invalid offline order: missing POS Invoice details")

	cleaned = {k: v for k, v in order.items() if not str(k).startswith("__")}
	cleaned["doctype"] = "POS Invoice"
	cleaned["is_pos"] = 1
	cleaned["docstatus"] = 0

	pos_inv = frappe.get_doc(cleaned)
	pos_inv.flags.ignore_permissions = True
	pos_inv.insert(ignore_permissions=True, ignore_mandatory=False)

	if pos_inv.docstatus == 0:
		pos_inv.submit()

	frappe.db.commit()
	frappe.db.set_value(
		"POS Invoice", pos_inv.name, "remarks", "Synced from offline queue: {0}".format(ref)
	)
	return {"status": "ok", "invoice_name": pos_inv.name, "grand_total": pos_inv.grand_total}


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
@frappe.whitelist()
def create_opening_voucher(pos_profile, company, balance_details):
	balance_details = json.loads(balance_details)

	new_pos_opening = frappe.get_doc(
		{
			"doctype": "POS Opening Entry",
			"period_start_date": frappe.utils.get_datetime(),
			"posting_date": frappe.utils.getdate(),
			"user": frappe.session.user,
			"pos_profile": pos_profile,
			"company": company,
		}
	)
	new_pos_opening.set("balance_details", balance_details)
	new_pos_opening.submit()

	return new_pos_opening.as_dict()
