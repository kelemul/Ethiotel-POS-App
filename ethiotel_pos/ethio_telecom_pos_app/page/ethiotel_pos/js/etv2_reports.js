// =====================================================================
// REPORTS WORKSPACE
// Tabs: Sales Report (date range), X Report (open shift), Z Report
// (date range / closed period).
// =====================================================================
erpnext.POSV2 = erpnext.POSV2 || {};

erpnext.POSV2.ReportsWorkspace = class {
	constructor({ shell, workspace, container, name }) {
		this.shell = shell;
		this.workspace = workspace;
		this.container = container;
		this.name = name;
		this.render();
	}

	render() {
		this.$el = $(`
			<section class="etv2-ws">
				<div class="etv2-ws-toolbar">
					<h2 class="etv2-page-title">${__("Reports")}</h2>
					<div class="etv2-report-tabs">
						<button class="etv2-report-tab active" data-tab="sales">${__("Sales")}</button>
						<button class="etv2-report-tab" data-tab="x">${__("X Report")}</button>
						<button class="etv2-report-tab" data-tab="z">${__("Z Report")}</button>
					</div>
					<div class="etv2-report-filters etv2-report-filters-sales">
						<div class="etv2-date-field etv2-report-from"></div>
						<div class="etv2-date-field etv2-report-to"></div>
						<button class="etv2-btn etv2-btn-primary etv2-report-run">${__("Run")}</button>
					</div>
					<div class="etv2-report-filters etv2-report-filters-z" style="display:none;">
						<div class="etv2-date-field etv2-z-from"></div>
						<div class="etv2-date-field etv2-z-to"></div>
						<button class="etv2-btn etv2-btn-primary etv2-z-run">${__("Run")}</button>
					</div>
					<button class="etv2-btn etv2-btn-primary etv2-x-run etv2-report-filters-x">${__("Run X Report")}</button>
					<button class="etv2-btn etv2-inv-print-report">${__("Print")}</button>
				</div>
				<div class="etv2-ws-content etv2-report-body" style="flex-direction:column;">
					<div class="etv2-report-stats etv2-report-stats"></div>
					<div class="etv2-report-detail"></div>
				</div>
			</section>
		`);

		this.from_field = frappe.ui.form.make_control({
			df: { label: __("From"), fieldtype: "Date", default: frappe.datetime.month_start() },
			parent: this.$el.find(".etv2-report-from"),
			render_input: true,
		});
		this.to_field = frappe.ui.form.make_control({
			df: { label: __("To"), fieldtype: "Date", default: frappe.datetime.now_date() },
			parent: this.$el.find(".etv2-report-to"),
			render_input: true,
		});
		this.z_from_field = frappe.ui.form.make_control({
			df: { label: __("From"), fieldtype: "Date", default: frappe.datetime.now_date() },
			parent: this.$el.find(".etv2-z-from"),
			render_input: true,
		});
		this.z_to_field = frappe.ui.form.make_control({
			df: { label: __("To"), fieldtype: "Date", default: frappe.datetime.now_date() },
			parent: this.$el.find(".etv2-z-to"),
			render_input: true,
		});

		this.$el.find(".etv2-report-tab").on("click", (e) => {
			const tab = $(e.currentTarget).attr("data-tab");
			this.$el.find(".etv2-report-tab").removeClass("active");
			$(e.currentTarget).addClass("active");
			this.$el.find(".etv2-report-filters-sales").toggle(tab === "sales");
			this.$el.find(".etv2-report-filters-z").toggle(tab === "z");
			this.$el.find(".etv2-report-filters-x").toggle(tab === "x");
			this.active_tab = tab;
			if (tab === "x") this.run_x_report();
			else if (tab === "z") this.run_z_report();
			else this.run_report();
		});

		this.$el.find(".etv2-report-run").on("click", () => this.run_report());
		this.$el.find(".etv2-z-run").on("click", () => this.run_z_report());
		this.$el.find(".etv2-x-run").on("click", () => this.run_x_report());
		this.$el.find(".etv2-inv-print-report").on("click", () => {
			const content = this.$el.find(".etv2-report-body").clone();
			this.print_report(content);
		});

		this.active_tab = "sales";
		return this.$el;
	}

	show() {
		if (this.active_tab === "x") this.run_x_report();
		else if (this.active_tab === "z") this.run_z_report();
		else this.run_report();
	}

	refresh() {
		this.show();
	}

	print_report($content) {
		const $print = $("<div class='etv2-print-window'></div>");
		$print.append($content.html());
		$(document.body).append($print);
		$print.attr("data-print", "1");
		const win = window.open("", "_blank", "width=900,height=720,menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes");
		if (!win) return frappe.msgprint(__("Popup blocked — allow popups to print."));
		win.document.write(`
			<html><head><title>${__("Report")}</title>
			<link href="/assets/ethiotel_pos/css/ui/ethiotel_pos_tokens.css" rel="stylesheet">
			<link href="/assets/ethiotel_pos/css/ui/ethiotel_pos_primitives.css" rel="stylesheet">
			<link href="/assets/ethiotel_pos/css/ui/ethiotel_pos_reports.css" rel="stylesheet">
			<style>
				body { padding: 20px; font-family: 'Cairo', Arial, sans-serif; }
				.etv2-report-body { display: flex; flex-direction: column; gap: 16px; }
				.etv2-report-stats { display: flex; gap: 12px; }
				.etv2-metric { background: #f1f5f9; border-radius: 10px; padding: 14px; min-width: 140px; }
				.etv2-metric-label { display: block; font-size: 11px; color: #64748b; }
				.etv2-metric-value { display: block; font-size: 20px; font-weight: 800; }
				.etv2-metric-sub { font-size: 11px; color: #94a3b8; }
				.etv2-report-table { width: 100%; border-collapse: collapse; font-size: 12px; }
				.etv2-report-table th, .etv2-report-table td { border: 1px solid #e2e8f0; padding: 6px 8px; text-align: left; }
				.etv2-report-table th { background: #0f172a; color: #fff; }
				table { border-collapse: collapse; width: 100%; }
			</style></head>
			<body>${$content.html()}</body></html>
		`);
		win.document.close();
		win.focus();
		setTimeout(() => win.print(), 400);
		$print.remove();
	}

	// ---------- Sales report (existing) ----------
	run_report() {
		const pv = this.shell.get_pv();
		frappe.call({
			method: `${pv}.get_sales_report`,
			args: {
				from_date: (this.from_field && this.from_field.get_value()) || frappe.datetime.month_start(),
				to_date: (this.to_field && this.to_field.get_value()) || frappe.datetime.now_date(),
				pos_profile: this.shell.pos_profile,
			},
			freeze: true,
		}).then((r) => {
			const d = r.message || {};
			this.$el.find(".etv2-report-stats").html(`
				<div class="etv2-metric"><span class="etv2-metric-label">${__("Total Sales")}</span><span class="etv2-metric-value">${format_currency(d.total_sales || 0)}</span><span class="etv2-metric-sub">${d.from_date || ""} → ${d.to_date || ""}</span></div>
				<div class="etv2-metric"><span class="etv2-metric-label">${__("Invoices")}</span><span class="etv2-metric-value">${d.invoice_count || 0}</span><span class="etv2-metric-sub">${__("Submitted")}</span></div>
				<div class="etv2-metric"><span class="etv2-metric-label">${__("Avg. Sale")}</span><span class="etv2-metric-value">${format_currency(d.avg_sale || 0)}</span><span class="etv2-metric-sub">${__("Per invoice")}</span></div>
			`);
			const rows = d.by_payment_mode || [];
			this.$el.find(".etv2-report-detail").html(`
				<div class="etv2-card">
					<div class="etv2-card-header"><span class="etv2-card-title">${__("By Payment Mode")}</span></div>
					<div class="etv2-card-body">${
						rows.length
							? `<table class="etv2-report-table">
								<thead><tr><th>${__("Mode of Payment")}</th><th>${__("Amount")}</th><th>${__("Share")}</th></tr></thead>
								<tbody>${rows.map((r) => `
									<tr>
										<td>${frappe.utils.escape_html(r.mode_of_payment)}</td>
										<td>${format_currency(r.amount)}</td>
										<td>${d.total_sales ? ((r.amount / d.total_sales) * 100).toFixed(1) : 0}%</td>
									</tr>`).join("")}
								</tbody>
							</table>`
							: `<div class="etv2-empty">${__("No data for this period.")}</div>`
					}</div>
				</div>
			`);
		});
	}

	// ---------- X report (open shift) ----------
	run_x_report() {
		const pv = this.shell.get_pv();
		frappe.call({
			method: `${pv}.get_x_report`,
			args: { pos_opening: this.shell.pos_opening, pos_profile: this.shell.pos_profile },
			freeze: true,
		}).then((r) => this.render_xz(r.message || {}));
	}

	// ---------- Z report (date range) ----------
	run_z_report() {
		const pv = this.shell.get_pv();
		frappe.call({
			method: `${pv}.get_z_report`,
			args: {
				from_date: (this.z_from_field && this.z_from_field.get_value()) || frappe.datetime.now_date(),
				to_date: (this.z_to_field && this.z_to_field.get_value()) || frappe.datetime.now_date(),
				pos_profile: this.shell.pos_profile,
			},
			freeze: true,
		}).then((r) => this.render_xz(r.message || {}));
	}

	render_xz(d) {
		const period =
			d.report_type === "X"
				? `${__("Shift from")} ${d.period_start ? frappe.datetime.str_to_user(d.period_start) : "—"}`
				: `${d.from_date || ""} → ${d.to_date || ""}`;

		this.$el.find(".etv2-report-stats").html(`
			<div class="etv2-metric"><span class="etv2-metric-label">${d.report_type === "X" ? __("X Report — Total") : __("Z Report — Total")}</span><span class="etv2-metric-value">${format_currency(d.grand_total || 0)}</span><span class="etv2-metric-sub">${period}</span></div>
			<div class="etv2-metric"><span class="etv2-metric-label">${__("Invoices")}</span><span class="etv2-metric-value">${d.invoice_count || 0}</span><span class="etv2-metric-sub">${__("Submitted")}</span></div>
			<div class="etv2-metric"><span class="etv2-metric-label">${__("Items Sold")}</span><span class="etv2-metric-value">${d.item_count || 0}</span><span class="etv2-metric-sub">${__("Total qty")}</span></div>
			<div class="etv2-metric"><span class="etv2-metric-label">${__("Net / Tax")}</span><span class="etv2-metric-value">${format_currency(d.net_total || 0)} / ${format_currency(d.tax_total || 0)}</span><span class="etv2-metric-sub">${__("Discounts: {0}", [format_currency(d.discount_total || 0)])}</span></div>
		`);

		const payments = (d.payments || [])
			.map((p) => `<tr><td>${frappe.utils.escape_html(p.mode_of_payment)}</td><td>${format_currency(p.amount)}</td><td>${d.grand_total ? ((p.amount / d.grand_total) * 100).toFixed(1) : 0}%</td></tr>`)
			.join("");
		const taxes = (d.taxes || [])
			.map((t) => `<tr><td>${frappe.utils.escape_html(t.account_head)}</td><td>${t.rate}%</td><td>${format_currency(t.amount)}</td></tr>`)
			.join("");
		const items = (d.items || []).slice(0, 100)
			.map((i) => `<tr><td>${frappe.utils.escape_html(i.item_name || i.item_code)}</td><td>${flt(i.qty)}</td><td>${format_currency(i.amount)}</td></tr>`)
			.join("");

		this.$el.find(".etv2-report-detail").html(`
			<div class="etv2-report-grid">
				<div class="etv2-card">
					<div class="etv2-card-header"><span class="etv2-card-title">${__("Payment Modes")}</span></div>
					<div class="etv2-card-body">${
						payments
							? `<table class="etv2-report-table"><thead><tr><th>${__("Mode")}</th><th>${__("Amount")}</th><th>${__("Share")}</th></tr></thead><tbody>${payments}</tbody></table>`
							: `<div class="etv2-empty">${__("No payments")}</div>`
					}</div>
				</div>
				<div class="etv2-card">
					<div class="etv2-card-header"><span class="etv2-card-title">${__("Tax Summary")}</span></div>
					<div class="etv2-card-body">${
						taxes
							? `<table class="etv2-report-table"><thead><tr><th>${__("Tax")}</th><th>${__("Rate")}</th><th>${__("Amount")}</th></tr></thead><tbody>${taxes}</tbody></table>`
							: `<div class="etv2-empty">${__("No taxes")}</div>`
					}</div>
				</div>
				<div class="etv2-card etv2-report-items-card">
					<div class="etv2-card-header"><span class="etv2-card-title">${__("Item Summary")}</span></div>
					<div class="etv2-card-body">${
						items
							? `<table class="etv2-report-table"><thead><tr><th>${__("Item")}</th><th>${__("Qty")}</th><th>${__("Amount")}</th></tr></thead><tbody>${items}</tbody></table>`
							: `<div class="etv2-empty">${__("No items")}</div>`
					}</div>
				</div>
				<div class="etv2-card">
					<div class="etv2-card-header"><span class="etv2-card-title">${__("Invoice Detail")}</span></div>
					<div class="etv2-card-body etv2-report-inv-list">${
						(d.invoices || [])
							.map((i) => `
								<div class="etv2-report-inv-row">
									<span><b>${frappe.utils.escape_html(i.name)}</b> · ${frappe.utils.escape_html(i.customer_name || i.customer || "")}</span>
									<span>${frappe.datetime.str_to_user(`${i.posting_date} ${i.posting_time || ""}`)}</span>
									<span>${format_currency(i.grand_total)}</span>
								</div>`)
							.join("") || `<div class="etv2-empty">${__("No invoices")}</div>`
					}</div>
				</div>
			</div>
		`);
	}

	hide() {}
};
