frappe.provide("erpnext.PointOfSale");

erpnext.PointOfSale.OrderHistory = class {
	constructor({ wrapper, events = {} }) {
		this.wrapper = wrapper;
		this.events = events;

		this.render();
		this.load();
	}

	render() {
		this.wrapper.html(`<section class="et-page et-page-history">
			<div class="et-page-head">
				<h4>${__("Order History")}</h4>
			</div>
			<div class="et-history-list">${__("Loading...")}</div>
		</section>`);
	}

	load() {
		frappe.call({
			method: "ethiotel_pos.ethio_telecom_pos_app.page.ethiotel_pos.ethiotel_pos.get_past_order_list",
			args: { search_term: "", status: "Paid", limit: 50 },
		}).then((r) => {
			const rows = r.message || [];
			const $list = this.wrapper.find(".et-history-list");
			$list.html("");

			if (!rows.length) {
				$list.html(`<div class="et-empty-state">${__("No orders yet")}</div>`);
				return;
			}

			rows.forEach((d) => {
				$list.append(
					`<div class="et-history-row">${d.posting_date || ""} ${d.posting_time || ""} — ${frappe.utils.escape_html(d.name)} — ${frappe.utils.escape_html(d.customer || "")} — ${format_currency(d.grand_total, d.currency)}</div>`
				);
			});
		});
	}
};