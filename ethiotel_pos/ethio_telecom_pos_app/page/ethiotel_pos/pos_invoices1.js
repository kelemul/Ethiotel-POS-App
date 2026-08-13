frappe.provide("erpnext.PointOfSale");

erpnext.PointOfSale.InvoicesView = class {
	constructor({ wrapper, events = {} }) {
		this.wrapper = wrapper;
		this.events = events;

		this.render();
		this.load();
	}

	render() {
		this.wrapper.html(`<section class="et-page et-page-invoices">
			<div class="et-page-head">
				<h4>${__("Invoices")}</h4>
			</div>
			<div class="et-invoices-list">${__("Loading...")}</div>
		</section>`);
	}

	load() {
		const me = this;
		frappe.db
			.get_list("POS Invoice", {
				fields: ["name", "grand_total", "currency", "customer", "posting_date"],
				limit: 50,
				order_by: "creation desc",
			})
			.then((rows) => {
				const $list = this.wrapper.find(".et-invoices-list");
				$list.html("");

				if (!rows.length) {
					$list.html(`<div class="et-empty-state">${__("No invoices yet")}</div>`);
					return;
				}

				rows.forEach((d) => {
					const $row = $(
						`<div class="et-invoice-row">
							<div class="et-invoice-left">${d.posting_date || ""} — ${frappe.utils.escape_html(d.name)} — ${frappe.utils.escape_html(d.customer || "")} — ${format_currency(d.grand_total, d.currency)}</div>
							<div class="et-invoice-actions">
								<button class="btn btn-default et-view-invoice" data-name="${d.name}">${__("View")}</button>
								<button class="btn btn-default et-print-invoice" data-name="${d.name}">${__("Print")}</button>
								<button class="btn btn-default et-send-mor-row" data-name="${d.name}">${__("Send to MoR")}</button>
							</div>
						</div>`
					);
					$row.find(".et-view-invoice").on("click", (e) => {
						me.events.view_invoice && me.events.view_invoice($(e.currentTarget).attr("data-name"));
					});
					$row.find(".et-print-invoice").on("click", (e) => {
						me.events.print_invoice && me.events.print_invoice($(e.currentTarget).attr("data-name"));
					});
					$row.find(".et-send-mor-row").on("click", (e) => {
						me.events.send_invoice_to_mor && me.events.send_invoice_to_mor($(e.currentTarget).attr("data-name"));
					});
					$list.append($row);
				});
			});
	}
};