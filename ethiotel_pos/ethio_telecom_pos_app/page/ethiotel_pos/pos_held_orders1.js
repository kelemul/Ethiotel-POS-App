frappe.provide("erpnext.PointOfSale");

erpnext.PointOfSale.HeldOrders = class {
	constructor({ wrapper, events = {} }) {
		this.wrapper = wrapper;
		this.events = events;

		this.render();
		this.load();
	}

	render() {
		this.wrapper.html(`<section class="et-page et-page-held">
			<div class="et-page-head">
				<h4>${__("Held Orders")}</h4>
			</div>
			<div class="et-held-list">${__("Loading...")}</div>
		</section>`);
	}

	load() {
		const me = this;
		frappe.call({
			method: "ethiotel_pos.ethio_telecom_pos_app.page.ethiotel_pos.ethiotel_pos.get_past_order_list",
			args: { search_term: "", status: "Draft", limit: 50 },
		}).then((r) => {
			const rows = r.message || [];
			const $list = this.wrapper.find(".et-held-list");
			$list.html("");

			if (!rows.length) {
				$list.html(`<div class="et-empty-state">${__("No held orders")}</div>`);
				return;
			}

			rows.forEach((d) => {
				$list.append(
					`<div class="et-held-row">
						<div class="et-held-left">${frappe.utils.escape_html(d.name)} — ${frappe.utils.escape_html(d.customer || "")} — ${format_currency(d.grand_total, d.currency)}</div>
						<div class="et-held-actions">
							<button class="btn btn-default et-resume" data-name="${d.name}">${__("Resume")}</button>
							<button class="btn btn-danger et-delete-held" data-name="${d.name}">${__("Delete")}</button>
						</div>
					</div>`
				);
			});

			$list.on("click", ".et-resume", (e) => {
				const name = $(e.currentTarget).attr("data-name");
				me.events.resume_order && me.events.resume_order(name);
			});

			$list.on("click", ".et-delete-held", (e) => {
				const name = $(e.currentTarget).attr("data-name");
				frappe.confirm(__("Delete held order {0}?", [name]), () => {
					frappe.call({ method: "frappe.client.delete", args: { doctype: "POS Invoice", name } }).then(() => {
						frappe.show_alert({ message: __("Deleted"), indicator: "green" });
						me.events.reload && me.events.reload();
					});
				});
			});
		});
	}
};