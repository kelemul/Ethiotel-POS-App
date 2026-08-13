frappe.provide("erpnext.PointOfSale");

erpnext.PointOfSale.ShiftDashboard = class {
	constructor({ wrapper, events = {} }) {
		this.wrapper = wrapper;
		this.events = events;
		this.pos_profile = events.pos_profile;

		this.render();
		this.load_metrics();
		this.load_recent_invoices();
	}

	render() {
		this.wrapper.html(`<section class="et-page et-page-dashboard">
			<div class="et-page-head">
				<h4>${__("Shift Dashboard")}</h4>
			</div>
			<div class="et-dash-metrics">
				<div class="et-metric">
					<span class="et-metric-label">${__("Sales Today")}</span>
					<span class="et-metric-value et-sales-today">${__("Loading...")}</span>
				</div>
				<div class="et-metric">
					<span class="et-metric-label">${__("Held Orders")}</span>
					<span class="et-metric-value et-held-count">${__("Loading...")}</span>
				</div>
				<div class="et-metric">
					<span class="et-metric-label">${__("Invoices Today")}</span>
					<span class="et-metric-value et-invoices-count">${__("Loading...")}</span>
				</div>
			</div>
			<div class="et-page-section">
				<h5>${__("Recent Invoices")}</h5>
				<div class="et-dash-invoices"></div>
			</div>
		</section>`);
	}

	load_metrics() {
		frappe.call({
			method: "ethiotel_pos.ethio_telecom_pos_app.page.ethiotel_pos.ethiotel_pos.get_dashboard_metrics",
			args: { pos_profile: this.pos_profile },
		}).then((r) => {
			const m = r.message || {};
			this.wrapper.find(".et-sales-today").html(format_currency(m.sales_today || 0));
			this.wrapper.find(".et-held-count").html(String(m.held_orders || 0));
			this.wrapper.find(".et-invoices-count").html(String(m.invoices_today || 0));
		});
	}

	load_recent_invoices() {
		frappe.call({
			method: "ethiotel_pos.ethio_telecom_pos_app.page.ethiotel_pos.ethiotel_pos.get_past_order_list",
			args: { search_term: "", status: "Paid", limit: 8 },
		}).then((r) => {
			const list = (r && r.message) || [];
			const $invoices = this.wrapper.find(".et-dash-invoices");
			$invoices.html("");

			if (!list.length) {
				$invoices.html(`<div class="et-empty-state">${__("No invoices yet")}</div>`);
				return;
			}

			list.forEach((i) => {
				$invoices.append(
					`<div class="et-dash-invoice-row">${frappe.utils.escape_html(i.name)} — ${format_currency(i.grand_total, i.currency)}</div>`
				);
			});
		});
	}
};