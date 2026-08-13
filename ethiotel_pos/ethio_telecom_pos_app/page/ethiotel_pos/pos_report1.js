frappe.provide("erpnext.PointOfSale");

erpnext.PointOfSale.ReportView = class {
	constructor({ wrapper, events = {} }) {
		this.wrapper = wrapper;
		this.events = events;
		this.pos_profile = events.pos_profile;

		this.render();
		this.bind_events();
		this.run_report();
	}

	render() {
		this.wrapper.html(`<section class="et-page et-page-report">
			<div class="et-page-head">
				<h4>${__("Sales Report")}</h4>
			</div>
			<div class="et-report-filters">
				<div class="et-report-field et-report-from"></div>
				<div class="et-report-field et-report-to"></div>
				<button class="btn btn-primary et-report-run">${__("Run")}</button>
			</div>
			<div class="et-report-summary"></div>
			<div class="et-report-table"></div>
		</section>`);

		this.from_field = frappe.ui.form.make_control({
			df: { label: __("From Date"), fieldtype: "Date", default: frappe.datetime.month_start() },
			parent: this.wrapper.find(".et-report-from"),
			render_input: true,
		});
		this.to_field = frappe.ui.form.make_control({
			df: { label: __("To Date"), fieldtype: "Date", default: frappe.datetime.now_date() },
			parent: this.wrapper.find(".et-report-to"),
			render_input: true,
		});
	}

	bind_events() {
		this.wrapper.find(".et-report-run").on("click", () => this.run_report());
	}

	run_report() {
		const me = this;
		frappe.call({
			method: "ethiotel_pos.ethio_telecom_pos_app.page.ethiotel_pos.ethiotel_pos.get_sales_report",
			args: {
				from_date: (this.from_field && this.from_field.get_value()) || frappe.datetime.month_start(),
				to_date: (this.to_field && this.to_field.get_value()) || frappe.datetime.now_date(),
				pos_profile: this.pos_profile,
			},
			freeze: true,
		}).then((r) => {
			const data = r.message || {};

			this.wrapper.find(".et-report-summary").html(`
				<div class="et-report-stats">
					<div class="et-report-stat">
						<span class="et-report-stat-label">${__("Total Sales")}</span>
						<span class="et-report-stat-value">${format_currency(data.total_sales || 0)}</span>
					</div>
					<div class="et-report-stat">
						<span class="et-report-stat-label">${__("Invoice Count")}</span>
						<span class="et-report-stat-value">${data.invoice_count || 0}</span>
					</div>
					<div class="et-report-stat">
						<span class="et-report-stat-label">${__("Avg. Sale")}</span>
						<span class="et-report-stat-value">${format_currency(data.avg_sale || 0)}</span>
					</div>
				</div>
			`);

			const rows = data.by_payment_mode || [];
			const $table = this.wrapper.find(".et-report-table");
			if (!rows.length) {
				$table.html(`<div class="et-empty-state">${__("No data for this period")}</div>`);
				return;
			}
			$table.html(`
				<table class="table table-bordered">
					<thead><tr><th>${__("Mode of Payment")}</th><th>${__("Amount")}</th></tr></thead>
					<tbody>
						${rows.map((r) => `<tr><td>${frappe.utils.escape_html(r.mode_of_payment)}</td><td>${format_currency(r.amount)}</td></tr>`).join("")}
					</tbody>
				</table>
			`);
		});
	}
};