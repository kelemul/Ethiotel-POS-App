// =====================================================================
// INVOICES WORKSPACE
// Two tabs:
//   • POS Invoice   — submitted POS invoices + "Make Sales Invoice"
//   • Sales Invoice — the converted documents, with MoR (EIMS)
//     register / verify / cancel / receipt actions.
// =====================================================================
erpnext.POSV2 = erpnext.POSV2 || {};

erpnext.POSV2.InvoicesWorkspace = class {
	constructor({ shell, workspace, container, name }) {
		this.shell = shell;
		this.workspace = workspace;
		this.container = container;
		this.name = name;
		this.active_tab = "pos";
		this.render();
	}

	render() {
		this.$el = $(`
			<section class="etv2-ws etv2-invoices">
				<div class="etv2-ws-toolbar">
					<h2 class="etv2-page-title">${__("Invoices")}</h2>
					<div class="etv2-inv-filters">
						<input class="etv2-inv-search" type="text" placeholder="${__("Search invoice or customer")}…">
						<select class="etv2-inv-status">
							<option value="All">${__("All Status")}</option>
							<option value="Paid">${__("Paid")}</option>
							<option value="Credit">${__("Credit")}</option>
							<option value="Return">${__("Return")}</option>
							<option value="Draft">${__("Draft")}</option>
						</select>
						<select class="etv2-inv-mor">
							<option value="All">${__("MoR: All")}</option>
							<option value="Registered">${__("MoR: Registered")}</option>
							<option value="Pending">${__("MoR: Pending")}</option>
							<option value="Failed">${__("MoR: Failed")}</option>
							<option value="Cancelled">${__("MoR: Cancelled")}</option>
						</select>
						<button class="etv2-btn etv2-btn-primary etv2-inv-refresh">${__("Refresh")}</button>
						<button class="etv2-btn etv2-btn-danger etv2-inv-close-shift">${__("Close Shift")}</button>
					</div>
				</div>
				<div class="etv2-tabs etv2-inv-tabs">
					<button class="etv2-tab etv2-tab-active" data-tab="pos">${__("POS Invoice")}</button>
					<button class="etv2-tab" data-tab="sales">${__("Sales Invoice")}</button>
				</div>
				<div class="etv2-ws-content etv2-inv-content" style="flex-direction:column;">
					<div class="etv2-inv-stats etv2-inv-stats"></div>
					<div class="etv2-card etv2-inv-table-card">
						<div class="etv2-card-body">
							<div class="etv2-inv-table-wrap etv2-inv-pos"></div>
							<div class="etv2-inv-table-wrap etv2-inv-sales" style="display:none;"></div>
						</div>
					</div>
				</div>
			</section>
		`);

		let searchTimer;
		this.$el.find(".etv2-inv-search").on("input", (e) => {
			clearTimeout(searchTimer);
			searchTimer = setTimeout(() => this.load(), 250);
		});
		this.$el.find(".etv2-inv-status").on("change", () => this.load());
		this.$el.find(".etv2-inv-mor").on("change", () => this.load());
		this.$el.find(".etv2-inv-refresh").on("click", () => this.load());
		this.$el.find(".etv2-inv-close-shift").on("click", () => this.close_shift());
		this.$el.find(".etv2-inv-tabs .etv2-tab").on("click", (e) => {
			const tab = $(e.currentTarget).attr("data-tab");
			if (tab === this.active_tab) return;
			this.active_tab = tab;
			this.$el.find(".etv2-inv-tabs .etv2-tab").removeClass("etv2-tab-active");
			$(e.currentTarget).addClass("etv2-tab-active");
			this.$el.find(".etv2-inv-pos").toggle(tab === "pos");
			this.$el.find(".etv2-inv-sales").toggle(tab === "sales");
			this.load();
		});

		return this.$el;
	}

	close_shift() {
		const shell = this.shell;
		const entry = shell.pos_opening;
		if (!entry) {
			frappe.show_alert({ message: __("No open shift to close."), indicator: "orange" });
			return;
		}
		frappe.confirm(
			__("Are you sure you want to close this shift? <br><br> The POS Closing Entry will be created and submitted. You won't be able to process sales until a new shift is opened."),
			() => {
				const pv = shell.get_pv();
				frappe.call({
					method: `${pv}.close_shift`,
					args: { pos_opening: entry },
					freeze: true,
					freeze_message: __("Closing Shift..."),
				}).then((r) => {
					if (r.message && r.message.status === "ok") {
						frappe.show_alert({ message: __("Shift successfully closed (Entry: {0})", [r.message.closing_entry]), indicator: "green" });
						shell.pos_opening = null;
						shell.pos_profile = null;
						shell.$main.find(".etv2-shift-chip").addClass("etv2-shift-chip-hidden");
						this.load();
					} else {
						frappe.show_alert({ message: __("Failed to close shift: {0}", [r.exc]), indicator: "red" });
					}
				});
			}
		);
	}

	show() {
		this.load();
	}

	refresh() {
		this.load();
	}

	load() {
		if (this.active_tab === "sales") this.load_sales();
		else this.load_pos();
	}

	load_pos() {
		const pv = this.shell.get_pv();
		const search_term = this.$el.find(".etv2-inv-search").val() || "";
		const status = this.$el.find(".etv2-inv-status").val() || "All";
		const mor = this.$el.find(".etv2-inv-mor").val() || "All";
		frappe.call({
			method: `${pv}.get_invoices`,
			args: { search_term, status, limit: 200 },
			freeze: true,
		}).then((r) => {
			const invoices = (r.message || []).filter((inv) => {
				if (mor === "All") return true;
				const s = (inv.eims_status || "").trim().toLowerCase();
				return s === String(mor).toLowerCase();
			});
			this.render_stats(invoices, __("POS Invoices"));
			this.render_table("pos", invoices);
		});
	}

	load_sales() {
		const pv = this.shell.get_pv();
		const search_term = this.$el.find(".etv2-inv-search").val() || "";
		const status = this.$el.find(".etv2-inv-status").val() || "All";
		const mor = this.$el.find(".etv2-inv-mor").val() || "All";
		frappe.call({
			method: `${pv}.get_sales_invoices`,
			args: { search_term, status, limit: 200 },
			freeze: true,
		}).then((r) => {
			const invoices = (r.message || []).filter((inv) => {
				if (mor === "All") return true;
				const s = (inv.eims_status || "").trim().toLowerCase();
				return s === String(mor).toLowerCase();
			});
			this.render_stats(invoices, __("Sales Invoices"));
			this.render_table("sales", invoices);
		});
	}

	render_stats(invoices, label) {
		const total = invoices.reduce((s, i) => s + flt(i.grand_total), 0);
		const registered = invoices.filter((i) => (i.eims_status || "") === "Registered").length;
		this.$el.find(".etv2-inv-stats").html(`
			<div class="etv2-metric"><span class="etv2-metric-label">${label}</span><span class="etv2-metric-value">${invoices.length}</span><span class="etv2-metric-sub">${__("Submitted")}</span></div>
			<div class="etv2-metric"><span class="etv2-metric-label">${__("Total")}</span><span class="etv2-metric-value">${format_currency(total)}</span><span class="etv2-metric-sub">${__("Selected list")}</span></div>
			<div class="etv2-metric"><span class="etv2-metric-label">${__("MoR Registered")}</span><span class="etv2-metric-value">${registered}</span><span class="etv2-metric-sub">${__("Of {0}", [invoices.length])}</span></div>
		`);
	}

	render_table(tab, invoices) {
		const $wrap = this.$el.find(tab === "sales" ? ".etv2-inv-sales" : ".etv2-inv-pos");
		if (!invoices.length) {
			$wrap.html(`<div class="etv2-empty">${__("No invoices found.")}</div>`);
			return;
		}
		const rows = invoices
			.map((inv) => {
				const mor_status = inv.eims_status || "Not Registered";
				const mor_pill_class =
					mor_status === "Registered"
						? "etv2-pill etv2-pill-green"
						: mor_status === "Cancelled"
						? "etv2-pill etv2-pill-orange"
						: mor_status === "Failed"
						? "etv2-pill etv2-pill-red"
						: "etv2-pill etv2-pill-muted";
				const converted = Boolean(inv.sales_invoice);
				if (tab === "sales") {
					const pos = inv.pos_invoice || "";
					return `
						<tr>
							<td><b>${frappe.utils.escape_html(inv.name)}</b><div class="etv2-inv-meta">${frappe.utils.escape_html(inv.customer_name || inv.customer || "")}</div></td>
							<td>${frappe.datetime.str_to_user(`${inv.posting_date} ${inv.posting_time || ""}`)}</td>
							<td class="text-right">${format_currency(inv.grand_total)}</td>
							<td><span class="etv2-pill ${inv.status === "Submitted" ? "etv2-pill-green" : inv.status === "Cancelled" ? "etv2-pill-orange" : "etv2-pill-muted"}">${frappe.utils.escape_html(inv.status || "")}</span></td>
							<td><span class="${mor_pill_class}" title="${frappe.utils.escape_html(inv.mor_irn || "")}">${frappe.utils.escape_html(mor_status)}</span></td>
							<td>
								<div class="etv2-inv-actions">
									<button class="etv2-btn etv2-btn-small etv2-si-receipt" data-name="${frappe.utils.escape_html(inv.name)}" data-pos="${frappe.utils.escape_html(pos)}">${__("Receipt")}</button>
									<button class="etv2-btn etv2-btn-small etv2-btn-primary etv2-si-mor-register" data-name="${frappe.utils.escape_html(inv.name)}" data-pos="${frappe.utils.escape_html(pos)}" ${pos ? "" : "disabled"}>${__("Send to MoR")}</button>
									<button class="etv2-btn etv2-btn-small etv2-si-mor-verify" data-name="${frappe.utils.escape_html(inv.name)}" data-pos="${frappe.utils.escape_html(pos)}" ${inv.mor_irn ? "" : "disabled"}>${__("Verify")}</button>
									<button class="etv2-btn etv2-btn-small etv2-btn-danger etv2-si-mor-cancel" data-name="${frappe.utils.escape_html(inv.name)}" data-pos="${frappe.utils.escape_html(pos)}" ${inv.mor_irn ? "" : "disabled"}>${__("Cancel")}</button>
									<button class="etv2-btn etv2-btn-small etv2-si-open" data-name="${frappe.utils.escape_html(inv.name)}">${__("Open")}</button>
								</div>
							</td>
						</tr>
					`;
				}
				return `
					<tr>
						<td><b>${frappe.utils.escape_html(inv.name)}</b><div class="etv2-inv-meta">${frappe.utils.escape_html(inv.customer_name || inv.customer || "")}</div></td>
						<td>${frappe.datetime.str_to_user(`${inv.posting_date} ${inv.posting_time || ""}`)}</td>
						<td class="text-right">${format_currency(inv.grand_total)}</td>
						<td><span class="etv2-pill ${inv.status === "Paid" ? "etv2-pill-green" : inv.status === "Credit" ? "etv2-pill-orange" : "etv2-pill-muted"}">${frappe.utils.escape_html(inv.status || "")}</span></td>
						<td><span class="${mor_pill_class}" title="${frappe.utils.escape_html(inv.mor_irn || "")}">${frappe.utils.escape_html(mor_status)}</span></td>
						<td>
							<div class="etv2-inv-actions">
								<button class="etv2-btn etv2-btn-small etv2-pi-receipt" data-name="${frappe.utils.escape_html(inv.name)}">${__("Receipt")}</button>
								<button class="etv2-btn etv2-btn-small etv2-pi-invoice" data-name="${frappe.utils.escape_html(inv.name)}">${__("Invoice")}</button>
								<button class="etv2-btn etv2-btn-small etv2-btn-primary etv2-pi-make-si" data-name="${frappe.utils.escape_html(inv.name)}" ${converted ? "disabled" : ""}>${converted ? __("Converted") : __("Make Sales Invoice")}</button>
								<button class="etv2-btn etv2-btn-small etv2-pi-open" data-name="${frappe.utils.escape_html(inv.name)}">${__("Open")}</button>
							</div>
						</td>
					</tr>
				`;
			})
			.join("");
		$wrap.html(`
			<table class="etv2-report-table etv2-inv-table">
				<thead><tr><th>${__("Invoice")}</th><th>${__("Posting")}</th><th class="text-right">${__("Total")}</th><th>${__("Status")}</th><th>${__("MoR")}</th><th>${__("Actions")}</th></tr></thead>
				<tbody>${rows}</tbody>
			</table>
		`);

		this.bind_actions(tab);
	}

	bind_actions(tab) {
		const ns = tab === "sales" ? "etv2-si" : "etv2-pi";
		this.$el.off(`click.${ns}`);
		if (tab === "sales") {
			this.$el.on(`click.${ns}`, ".etv2-si-receipt", (e) => {
				const pos = $(e.currentTarget).attr("data-pos");
				if (pos) ethiotel_print("POS Invoice", pos, "EIMS Invoice");
				else frappe.show_alert({ message: __("No source POS Invoice to print."), indicator: "orange" });
			});
			this.$el.on(`click.${ns}`, ".etv2-si-open", (e) => {
				frappe.set_route("Form", "Sales Invoice", $(e.currentTarget).attr("data-name"));
			});
			this.$el.on(`click.${ns}`, ".etv2-si-mor-register", (e) => this.register_with_mor($(e.currentTarget).attr("data-pos")));
			this.$el.on(`click.${ns}`, ".etv2-si-mor-verify", (e) => this.verify_mor($(e.currentTarget).attr("data-pos")));
			this.$el.on(`click.${ns}`, ".etv2-si-mor-cancel", (e) => this.cancel_mor($(e.currentTarget).attr("data-pos")));
		} else {
			this.$el.on(`click.${ns}`, ".etv2-pi-receipt", (e) => {
				ethiotel_print("POS Invoice", $(e.currentTarget).attr("data-name"), "Forkiva Sales Receipt");
			});
			this.$el.on(`click.${ns}`, ".etv2-pi-invoice", (e) => {
				ethiotel_print("POS Invoice", $(e.currentTarget).attr("data-name"), "EIMS Invoice");
			});
			this.$el.on(`click.${ns}`, ".etv2-pi-open", (e) => {
				frappe.set_route("Form", "POS Invoice", $(e.currentTarget).attr("data-name"));
			});
			this.$el.on(`click.${ns}`, ".etv2-pi-make-si", (e) => this.make_sales_invoice($(e.currentTarget).attr("data-name")));
		}
	}

	make_sales_invoice(name) {
		frappe.confirm(
			__("Convert POS Invoice {0} into a Sales Invoice?", [name]),
			() => {
				const pv = this.shell.get_pv();
				frappe.call({
					method: `${pv}.make_sales_invoice_from_pos`,
					args: { pos_invoice_name: name },
					freeze: true,
					freeze_message: __("Converting to Sales Invoice…"),
				}).then((r) => {
					const d = r.message || {};
					if (d.status === "ok") {
						frappe.show_alert({
							message: __("Sales Invoice {0} created", [d.sales_invoice]),
							indicator: "green",
						});
						this.load_pos();
						this.load_sales();
					} else {
						frappe.show_alert({ message: d.message || __("Conversion failed."), indicator: "red" });
					}
				});
			}
		);
	}

	register_with_mor(name) {
		if (!name) return;
		frappe.confirm(
			__("Send invoice {0} to the Ministry of Revenue (MoR) for EIMS registration?", [name]),
			() => {
				const pv = this.shell.get_pv();
				frappe.call({
					method: `${pv}.register_with_mor`,
					args: { pos_invoice_name: name },
					freeze: true,
					freeze_message: __("Contacting MoR…"),
				}).then((r) => {
					const d = r.message || {};
					if (d.status === "ok") {
						frappe.show_alert({
							message: __("{0} · {1}", [d.result?.status || "Done", d.result?.message || ""]),
							indicator: "green",
						});
						if (d.irn) frappe.show_alert({ message: __("IRN: {0}", [d.irn]), indicator: "blue" });
					} else {
						frappe.show_alert({ message: d.message || __("Registration failed."), indicator: "red" });
					}
					this.load_sales();
				});
			}
		);
	}

	verify_mor(name) {
		if (!name) return;
		const pv = this.shell.get_pv();
		frappe.call({
			method: `${pv}.verify_mor_pos_invoice`,
			args: { pos_invoice_name: name },
			freeze: true,
			freeze_message: __("Verifying with MoR…"),
		}).then((r) => {
			const d = r.message || {};
			if (d.status === "ok") {
				const res = d.result || {};
				frappe.msgprint({
					title: __("Verification Result"),
					indicator: res.verification_status === "Verified" ? "green" : "red",
					message: res.verification_summary || res.error_logs || __("No details returned."),
				});
			} else {
				frappe.show_alert({ message: d.message || __("Verification failed."), indicator: "red" });
			}
			this.load_sales();
		});
	}

	cancel_mor(name) {
		if (!name) return;
		const pv = this.shell.get_pv();
		const dialog = new frappe.ui.Dialog({
			title: __("Cancel MoR Invoice {0}", [name]),
			fields: [
				{
					fieldname: "cancellation_reasons",
					label: __("Reason"),
					fieldtype: "Select",
					default: "Mistake",
					options: ["Order cancelled", "DuplicateData entry", "Mistake", "Others"],
					reqd: 1,
				},
				{ fieldname: "remark", label: __("Remark"), fieldtype: "Small Text", reqd: 1 },
			],
			primary_action_label: __("Cancel at MoR"),
			primary_action: (values) => {
				dialog.hide();
				frappe.call({
					method: `${pv}.cancel_mor_pos_invoice`,
					args: { pos_invoice_name: name, ...values },
					freeze: true,
					freeze_message: __("Cancelling at MoR…"),
				}).then((r) => {
					const d = r.message || {};
					if (d.status === "ok" && d.result?.status === "Cancelled") {
						frappe.show_alert({ message: __("Invoice cancelled at MoR."), indicator: "green" });
					} else {
						frappe.show_alert({
							message: (d.result && d.result.status_code) || d.message || __("Cancellation failed."),
							indicator: "red",
						});
					}
					this.load_sales();
				});
			},
		});
		dialog.show();
	}

	hide() {}
};
