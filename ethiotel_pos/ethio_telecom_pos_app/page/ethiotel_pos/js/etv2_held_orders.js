// =====================================================================
// PHASE 7 — HELD ORDERS WORKSPACE
// Search + cards grid. Resume pushes the draft's items into the sale
// cart; delete removes the draft.
// =====================================================================
erpnext.POSV2 = erpnext.POSV2 || {};

erpnext.POSV2.HeldOrdersWorkspace = class {
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
					<h2 class="etv2-page-title">${__("Held Orders")}</h2>
					<div class="etv2-search etv2-held-search">
						<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
						<input type="text" placeholder="${__("Search held orders…")}" />
					</div>
				</div>
				<div class="etv2-ws-content">
					<div class="etv2-orders-grid etv2-held-grid"></div>
				</div>
			</section>
		`);

		let searchTimer;
		this.$el.find(".etv2-held-search input").on("input", (e) => {
			clearTimeout(searchTimer);
			searchTimer = setTimeout(() => this.load($(e.currentTarget).val()), 250);
		});

		this.$el.on("click", ".etv2-resume-btn", (e) => this.resume($(e.currentTarget).attr("data-name")));
		this.$el.on("click", ".etv2-delete-btn", (e) => this.delete_order($(e.currentTarget).attr("data-name")));

		return this.$el;
	}

	show() {
		this.load();
	}

	refresh() {
		this.load();
	}

	load(search_term = "") {
		const pv = this.shell.get_pv();
		frappe.call({
			method: `${pv}.get_held_orders`,
			args: { search_term, limit: 50 },
		}).then((r) => {
			const rows = r.message || [];
			const $grid = this.$el.find(".etv2-held-grid");
			if (!rows.length) {
				$grid.html(`<div class="etv2-empty">${__("No held orders.")}</div>`);
				return;
			}
			$grid.html(
				rows.map((d) => `
					<div class="etv2-order-card">
						<div class="etv2-order-id">#${frappe.utils.escape_html(d.name)}</div>
						<div class="etv2-order-meta">
							<span>${frappe.utils.escape_html(d.customer_name || d.customer || __("Choose customer"))}</span>
							<span>${d.posting_date || ""} ${d.posting_time || ""}</span>
						</div>
						<div class="etv2-order-total">${format_currency(d.grand_total, d.currency)}</div>
						<div class="etv2-order-actions">
							<button class="etv2-btn etv2-btn-primary etv2-resume-btn" data-name="${frappe.utils.escape_html(d.name)}">${__("Resume")}</button>
							<button class="etv2-btn etv2-btn-danger etv2-delete-btn" data-name="${frappe.utils.escape_html(d.name)}">${__("Delete")}</button>
						</div>
					</div>`).join("")
			);
		});
	}

	resume(name) {
		const me = this;
		frappe.db.get_doc("POS Invoice", name).then((doc) => {
			const sale = this.shell.workspaces.instances["sale"];
			if (!sale) return;
			// load the customer + items into the sale cart
			sale.customer = doc.customer;
			sale.$el.find(".etv2-sale-customer-btn").html(`${__("Customer")}: <b>${frappe.utils.escape_html(doc.customer_name || doc.customer)}</b>`);
			(doc.items || []).forEach((it) => {
				sale.cart[it.item_code] = {
					item_code: it.item_code,
					item_name: it.item_name || it.item_code,
					rate: it.rate,
					price_list_rate: it.price_list_rate || it.rate || 0,
					discount_percentage: it.discount_percentage || 0,
					uom: it.uom,
					conversion_factor: it.conversion_factor || 1,
					currency: doc.currency,
					qty: it.qty,
					warehouse: it.warehouse || me.shell.warehouse,
					actual_qty: it.actual_qty || 0,
					is_stock_item: it.is_stock_item,
					stock_uom: it.stock_uom,
				};
			});
			sale.render_cart();
			frappe.show_alert({ message: __("Loaded held order into cart."), indicator: "blue" });
		});
	}

	delete_order(name) {
		const me = this;
		frappe.confirm(__("Delete held order {0}?", [name]), () => {
			const pv = this.shell.get_pv();
			frappe.call({ method: `${pv}.delete_draft`, args: { name } }).then((r) => {
				frappe.show_alert({ message: __("Deleted"), indicator: "green" });
				me.load(me.$el.find(".etv2-held-search input").val());
			});
		});
	}
};