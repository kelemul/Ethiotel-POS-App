// =====================================================================
// MoR INVOICES WORKSPACE (redesigned)
// Dashboard for submitted POS Invoices and their MoR (EIRMS) status.
// - Status stat cards + searchable/filterable invoice table.
// - Registration happens in the background after each sale; this page
//   is where cashiers come back to print receipts:
//     · Light receipt  (Forkiva)  → walk-in customers, pre-prepared,
//       served instantly from storage.
//     · Detailed receipt (EIMS)   → registered customers only, issued
//       exclusively on explicit request.
// =====================================================================
erpnext.POSV2 = erpnext.POSV2 || {};

const MOR_WALK_IN = "Walk-In Customer";

erpnext.POSV2.MoRWorkspace = class {
	constructor({ shell, workspace, container, name }) {
		this.shell = shell;
		this.workspace = workspace;
		this.container = container;
		this.name = name;
		this.invoices = [];
		this.stats = {};
		this.render();
		this.load();
	}

	render() {
		this.$el = $(`
			<section class="etv2-ws">
				<div class="etv2-ws-toolbar">
					<h2 class="etv2-page-title">${__("MoR Invoices")}</h2>
					<select class="etv2-mor-filter etv2-input">
						<option value="All">${__("All Statuses")}</option>
						<option value="Not Submitted">${__("Not Submitted")}</option>
						<option value="Pending">${__("Pending")}</option>
						<option value="Failed">${__("Failed")}</option>
						<option value="Registered">${__("Registered")}</option>
						<option value="Cancelled">${__("Cancelled")}</option>
					</select>
					<input type="text" class="etv2-mor-search etv2-input" placeholder="${__("Search invoice / customer...")}">
					<button class="etv2-btn etv2-btn-primary etv2-mor-refresh">${__("Refresh")}</button>
				</div>
				<div class="etv2-ws-content etv2-mor-body">
					<div class="etv2-mor-stats"></div>
					<div class="etv2-mor-list"></div>
				</div>
			</section>
		`);

		this.$stats = this.$el.find(".etv2-mor-stats");
		this.$list = this.$el.find(".etv2-mor-list");
		this.$filter = this.$el.find(".etv2-mor-filter");
		this.$search = this.$el.find(".etv2-mor-search");

		this.$el.find(".etv2-mor-refresh").on("click", () => this.load());
		this.$filter.on("change", () => this.load());
		let search_timer = null;
		this.$search.on("input", () => {
			clearTimeout(search_timer);
			search_timer = setTimeout(() => this.load(), 300);
		});
	}

	load() {
		frappe.call({
			method: "ethiotel_pos.ethio_telecom_pos_app.page.ethiotel_pos.ethiotel_pos.get_mor_invoices",
			args: {
				status: this.$filter.val() || "All",
				search_term: (this.$search.val() || "").trim(),
				limit: 200,
			},
			callback: (r) => {
				const res = r.message || {};
				this.invoices = res.invoices || (Array.isArray(res) ? res : []);
				this.stats = res.stats || {};
				this.render_stats();
				this.render_list();
			},
		});
	}

	render_stats() {
		const cards = [
			{ key: "Registered", label: __("Registered"), cls: "green" },
			{ key: "Pending", label: __("Pending"), cls: "orange" },
			{ key: "Failed", label: __("Failed"), cls: "red" },
			{ key: "Cancelled", label: __("Cancelled"), cls: "gray" },
		];
		this.$stats.html(
			cards.map((c) => `
				<div class="etv2-mor-stat-card is-${c.cls}" data-status="${c.key}">
					<div class="etv2-mor-stat-num">${this.stats[c.key] || 0}</div>
					<div class="etv2-mor-stat-label">${c.label}</div>
				</div>`).join("")
		);
		this.$stats.find(".etv2-mor-stat-card").on("click", (e) => {
			this.$filter.val($(e.currentTarget).data("status"));
			this.load();
		});
	}

	status_badge(status) {
		const map = {
			"Not Submitted": "gray",
			"Pending": "orange",
			"Failed": "red",
			"Registered": "green",
			"Transmitted": "blue",
			"Cancelled": "red",
		};
		const color = map[status] || "gray";
		return `<span class="indicator ${color}">${__(status || "Not Submitted")}</span>`;
	}

	render_list() {
		const invoices = this.invoices || [];
		if (!invoices.length) {
			this.$list.html(`<div class="etv2-empty">${__("No invoices found.")}</div>`);
			return;
		}

		const rows = invoices.map((inv) => {
			const status = (inv.eims_status || "Not Submitted").trim();
			const is_walk_in = inv.customer === MOR_WALK_IN;
			const customer_html = is_walk_in
				? `<span class="etv2-text-muted">${__("Walk-In Customer")}</span>`
				: frappe.utils.escape_html(inv.customer_name || inv.customer || "");
			const irn = inv.mor_irn || "";
			const actions = [];

			if (status === "Registered" || status === "Transmitted") {
				actions.push(`<button class="etv2-btn etv2-btn-primary etv2-mor-light" data-invoice="${inv.name}" title="${__("Compact receipt for walk-in customers")}">${__("Light Receipt")}</button>`);
				if (!is_walk_in) {
					actions.push(`<button class="etv2-btn etv2-mor-detailed" data-invoice="${inv.name}" title="${__("Detailed EIMS receipt — issued only on request")}">${__("Detailed Receipt")}</button>`);
				}
				actions.push(`<button class="etv2-btn etv2-mor-verify" data-invoice="${inv.name}">${__("Verify")}</button>`);
				actions.push(`<button class="etv2-btn etv2-btn-danger etv2-mor-cancel" data-invoice="${inv.name}">${__("Cancel")}</button>`);
			} else if (status !== "Cancelled") {
				actions.push(`<button class="etv2-btn etv2-btn-primary etv2-mor-resend" data-invoice="${inv.name}">${__("Resend")}</button>`);
			}

			actions.push(`<button class="etv2-btn etv2-mor-details" data-invoice="${inv.name}">${__("Details")}</button>`);

			return `
				<tr>
					<td><b>${inv.name}</b><br /><small class="etv2-text-muted">#${inv.custom_document_number || "—"}</small></td>
					<td>${frappe.datetime.str_to_user ? frappe.datetime.str_to_user(inv.posting_date) : inv.posting_date}</td>
					<td>${customer_html}</td>
					<td class="etv2-mor-amount">${format_currency(inv.grand_total, inv.currency)}</td>
					<td>${this.status_badge(status)}</td>
					<td class="etv2-mor-irn" title="${frappe.utils.escape_html(irn)}">${irn ? irn.slice(0, 18) + (irn.length > 18 ? "…" : "") : "—"}</td>
					<td class="etv2-mor-actions">${actions.join("")}</td>
				</tr>`;
		}).join("");

		this.$list.html(`
			<table class="etv2-mor-table">
				<thead>
					<tr>
						<th>${__("Invoice")}</th>
						<th>${__("Date")}</th>
						<th>${__("Customer")}</th>
						<th>${__("Total")}</th>
						<th>${__("MoR Status")}</th>
						<th>${__("IRN")}</th>
						<th>${__("Actions")}</th>
					</tr>
				</thead>
				<tbody>${rows}</tbody>
			</table>
		`);

		this.$list.find(".etv2-mor-resend").on("click", (e) => this.resend($(e.currentTarget).data("invoice")));
		this.$list.find(".etv2-mor-light").on("click", (e) => this.light_receipt($(e.currentTarget).data("invoice")));
		this.$list.find(".etv2-mor-detailed").on("click", (e) => this.detailed_receipt($(e.currentTarget).data("invoice")));
		this.$list.find(".etv2-mor-verify").on("click", (e) => this.verify($(e.currentTarget).data("invoice")));
		this.$list.find(".etv2-mor-cancel").on("click", (e) => this.cancel($(e.currentTarget).data("invoice")));
		this.$list.find(".etv2-mor-details").on("click", (e) => this.details($(e.currentTarget).data("invoice")));
	}

	show_loading() {
		this.$list.html(`<div class="etv2-empty"><div class="etv2-spinner"></div><p>${__("Loading...")}</p></div>`);
	}

	resend(invoice) {
		frappe.call({
			method: "ethiotel_pos.ethio_telecom_pos_app.page.ethiotel_pos.ethiotel_pos.register_with_mor",
			args: { pos_invoice_name: invoice },
			freeze: true,
			freeze_message: __("Submitting to MoR..."),
			callback: (r) => {
				const res = r.message || {};
				if (res.status === "ok") {
					const result = res.result || {};
					const msg = result.message || __("Submitted to MoR.");
					const irn = res.irn || result.irn;
					frappe.show_alert({
						message: irn ? `${msg} — IRN: ${irn}` : msg,
						indicator: "green",
					});
				} else {
					frappe.msgprint(res.message || __("Submission failed."));
				}
				this.load();
			},
		});
	}

	// Light (Forkiva) receipt — pre-prepared in the background after the
	// sale; served instantly from storage. For walk-in customers.
	light_receipt(invoice) {
		frappe.call({
			method: "ethiotel_pos.ethio_telecom_pos_app.page.ethiotel_pos.ethiotel_pos.get_light_receipt",
			args: { pos_invoice_name: invoice },
			callback: (r) => {
				const res = r.message || {};
				if (res.status !== "ok" || !res.html) {
					frappe.msgprint(res.message || __("Receipt generation failed."));
					return;
				}
				if (!res.registered) {
					frappe.show_alert({
						message: __("MoR registration still in progress — QR code is provisional."),
						indicator: "orange",
					});
				}
				this.show_print_dialog(__("Sales Receipt"), res.html, "small");
			},
		});
	}

	// Detailed EIMS receipt — registered customers only, issued
	// exclusively when explicitly requested.
	detailed_receipt(invoice) {
		frappe.confirm(
			__("Issue a detailed MoR receipt for {0}? This sends the receipt to MoR immediately.", [invoice]),
			() => {
				frappe.call({
					method: "ethiotel_pos.ethio_telecom_pos_app.page.ethiotel_pos.ethiotel_pos.get_pos_receipt",
					args: { pos_invoice_name: invoice },
					freeze: true,
					freeze_message: __("Generating detailed MoR receipt..."),
					callback: (r) => {
						const res = r.message || {};
						const html = (res.status === "ok" && res.result && res.result.html) ||
							(res.status === "ok" && res.already_active && res.html);
						if (html) {
							this.show_print_dialog(__("Detailed MoR Receipt"), html, "large");
						} else {
							frappe.msgprint((res.result && res.result.message) || res.message || __("Receipt generation failed."));
						}
						this.load();
					},
				});
			}
		);
	}

	verify(invoice) {
		frappe.call({
			method: "ethiotel_pos.ethio_telecom_pos_app.page.ethiotel_pos.ethiotel_pos.verify_mor_pos_invoice",
			args: { pos_invoice_name: invoice },
			freeze: true,
			freeze_message: __("Verifying with MoR..."),
			callback: (r) => {
				const res = r.message || {};
				const result = res.result || {};
				const html = result.verification_summary || result.html;
				if (res.status === "ok" && html) {
					this.show_dialog(__("MoR Verification Result"), html);
				} else if (res.status === "ok" && result.verification_status) {
					frappe.show_alert({
						message: __(result.verification_status),
						indicator: result.verification_status === "Verified" ? "green" : "red",
					});
				} else {
					frappe.msgprint(result.error_logs || res.message || __("Verification failed."));
				}
			},
		});
	}

	details(invoice) {
		frappe.call({
			method: "frappe.client.get",
			args: { doctype: "POS Invoice", name: invoice },
			callback: (r) => {
				const d = r.message || {};
				if (!d.name) {
					frappe.msgprint(__("Unable to load invoice details."));
					return;
				}
				const items = (d.items || []).map((it) => `
					<tr>
						<td>${frappe.utils.escape_html(it.item_code)}</td>
						<td>${frappe.utils.escape_html(it.item_name || "")}</td>
						<td class="etv2-right">${it.qty}</td>
						<td class="etv2-right">${format_currency(it.rate, d.currency)}</td>
						<td class="etv2-right">${format_currency(it.amount, d.currency)}</td>
					</tr>`).join("");
				const taxes = (d.taxes || []).map((t) => `
					<tr>
						<td colspan="3">${frappe.utils.escape_html(t.description || t.account_head || "")}</td>
						<td class="etv2-right">${t.rate}%</td>
						<td class="etv2-right">${format_currency(t.tax_amount, d.currency)}</td>
					</tr>`).join("");
				const html = `
					<div class="etv2-mor-detail">
						<div class="etv2-mor-detail-grid">
							<div><label>${__("Invoice")}</label><span>${frappe.utils.escape_html(d.name)}</span></div>
							<div><label>${__("Status")}</label><span>${__(d.custom_eims_status || "Not Submitted")}</span></div>
							<div><label>${__("MoR Doc #")}</label><span>${d.custom_document_number || "—"}</span></div>
							<div><label>${__("IRN")}</label><span>${d.custom_irn || d.custom_mor_irn || "—"}</span></div>
							<div><label>${__("Customer")}</label><span>${frappe.utils.escape_html(d.customer_name || d.customer || "")}</span></div>
							<div><label>${__("Date")}</label><span>${frappe.datetime.str_to_user(d.posting_date)}</span></div>
							<div><label>${__("Tax Template")}</label><span>${frappe.utils.escape_html(d.taxes_and_charges || "—")}</span></div>
						</div>
						<h4>${__("Items")}</h4>
						<table class="etv2-mor-detail-table">
							<thead><tr><th>${__("Item")}</th><th>${__("Name")}</th><th>${__("Qty")}</th><th>${__("Rate")}</th><th>${__("Amount")}</th></tr></thead>
							<tbody>${items || `<tr><td colspan="5" class="etv2-text-muted">${__("No items")}</td></tr>`}</tbody>
						</table>
						${taxes ? `<h4>${__("Taxes")}</h4><table class="etv2-mor-detail-table"><tbody>${taxes}</tbody></table>` : ""}
						<div class="etv2-mor-detail-totals">
							<div><label>${__("Net Total")}</label><span>${format_currency(d.net_total, d.currency)}</span></div>
							<div><label>${__("Total Tax")}</label><span>${format_currency(d.total_taxes_and_charges, d.currency)}</span></div>
							<div><label>${__("Grand Total")}</label><span>${format_currency(d.grand_total, d.currency)}</span></div>
						</div>
					</div>`;
				const dd = new frappe.ui.Dialog({
					title: __("MoR Invoice Details") + " — " + d.name,
					size: "large",
				});
				dd.$body.html(html);
				dd.show();
			},
		});
	}

	cancel(invoice) {
		const d = new frappe.ui.Dialog({
			title: __("Cancel MoR Invoice") + " — " + invoice,
			fields: [
				{ fieldname: "cancellation_reasons", label: __("Cancellation Reasons"), fieldtype: "Select",
				  options: ["", "Order cancelled", "Duplicate", "Data entry mistake", "Others"],
				  default: "Order cancelled" },
				{ fieldname: "remark", label: __("Remark"), fieldtype: "Small Text" },
			],
			primary_action_label: __("Cancel Invoice"),
			primary_action: (values) => {
				frappe.call({
					method: "ethiotel_pos.ethio_telecom_pos_app.page.ethiotel_pos.ethiotel_pos.cancel_mor_pos_invoice",
					args: {
						pos_invoice_name: invoice,
						cancellation_reasons: values.cancellation_reasons || "Order cancelled",
						remark: values.remark || "",
					},
					freeze: true,
					freeze_message: __("Cancelling with MoR..."),
					callback: (r) => {
						const res = r.message || {};
						if (res.status === "ok" && res.result && res.result.status === "Cancelled") {
							frappe.show_alert({ message: __("Invoice cancelled with MoR."), indicator: "green" });
						} else {
							frappe.msgprint((res.result && res.result.message) || res.message || __("Cancellation failed."));
						}
						d.hide();
						this.load();
					},
				});
			},
		});
		d.show();
	}

	show_dialog(title, html) {
		const d = new frappe.ui.Dialog({
			title: title,
			size: "large",
			primary_action_label: __("Close"),
			primary_action: () => d.hide(),
		});
		d.$body.html(html);
		d.show();
	}

	show_print_dialog(title, html, size) {
		// Never inject scripts or full-document markup into the dialog —
		// jQuery executes them and the print-view wrappers break the UI.
		const safe = String(html || "")
			.replace(/<script[\s\S]*?<\/script>/gi, "")
			.replace(/<\/?(?:html|head|body)[^>]*>/gi, "");
		const d = new frappe.ui.Dialog({
			title: title,
			size: size || "large",
			primary_action_label: __("Print"),
			primary_action: () => {
				const w = window.open();
				if (w) {
					w.document.write(safe);
					w.document.close();
					w.focus();
					w.print();
				}
				d.hide();
			},
		});
		d.$body.html(safe);
		d.show();
	}
};
