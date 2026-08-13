// =====================================================================
// REPORTS WORKSPACE
// Date-range sales report: summary stats + payment-mode breakdown table.
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
					<h2 class="etv2-page-title">${__("Sales Report")}</h2>
					<div class="etv2-report-filters">
						<div class="etv2-date-field etv2-report-from"></div>
						<div class="etv2-date-field etv2-report-to"></div>
						<button class="etv2-btn etv2-btn-primary etv2-report-run">${__("Run")}</button>
					</div>
				</div>
				<div class="etv2-ws-content etv2-report-body" style="flex-direction:column;">
					<div class="etv2-report-stats etv2-report-stats"></div>
					<div class="etv2-card">
						<div class="etv2-card-header"><span class="etv2-card-title">${__("By Payment Mode")}</span></div>
						<div class="etv2-card-body"><div class="etv2-report-table-wrap"></div></div>
					</div>
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

		this.$el.find(".etv2-report-run").on("click", () => this.run_report());

		return this.$el;
	}

	show() {
		this.run_report();
	}

	refresh() {
		this.run_report();
	}

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
			const $wrap = this.$el.find(".etv2-report-table-wrap");
			if (!rows.length) {
				$wrap.html(`<div class="etv2-empty">${__("No data for this period.")}</div>`);
				return;
			}
			$wrap.html(`
				<table class="etv2-report-table">
					<thead><tr><th>${__("Mode of Payment")}</th><th>${__("Amount")}</th><th>${__("Share")}</th></tr></thead>
					<tbody>
						${rows.map((r) => `
							<tr>
								<td>${frappe.utils.escape_html(r.mode_of_payment)}</td>
								<td>${format_currency(r.amount)}</td>
								<td>${d.total_sales ? ((r.amount / d.total_sales) * 100).toFixed(1) : 0}%</td>
							</tr>`).join("")}
					</tbody>
				</table>
			`);
		});
	}
};