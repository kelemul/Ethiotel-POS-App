// =====================================================================
// RETURNS WORKSPACE
// Lists submitted invoices with a Return action. Uses the standard
// ERPNext sales-return flow by opening the source invoice form.
// =====================================================================
erpnext.POSV2 = erpnext.POSV2 || {};

erpnext.POSV2.ReturnsWorkspace = class {
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
					<h2 class="etv2-page-title">${__("Returns")}</h2>
					<div class="etv2-search etv2-returns-search">
						<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
						<input type="text" placeholder="${__("Search invoices…")}" />
					</div>
				</div>
				<div class="etv2-ws-content">
					<div class="etv2-orders-grid etv2-returns-grid"></div>
				</div>
			</section>
		`);

		let searchTimer;
		this.$el.find(".etv2-returns-search input").on("input", (e) => {
			clearTimeout(searchTimer);
			searchTimer = setTimeout(() => this.load($(e.currentTarget).val()), 250);
		});
		this.$el.on("click", ".etv2-return-btn", (e) => this.make_return($(e.currentTarget).attr("data-name")));

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
			method: `${pv}.get_invoices`,
			args: { search_term, status: "", limit: 50 },
		}).then((r) => {
			const rows = r.message || [];
			const $grid = this.$el.find(".etv2-returns-grid");
			if (!rows.length) {
				$grid.html(`<div class="etv2-empty">${__("No invoices found.")}</div>`);
				return;
			}
			$grid.html(
				rows.map((d) => `
					<div class="etv2-order-card">
						<div class="etv2-order-id">#${frappe.utils.escape_html(d.name)}</div>
						<div class="etv2-order-meta">
							<span>${frappe.utils.escape_html(d.customer_name || d.customer || __("Walk-in"))}</span>
							<span>${d.posting_date || ""} ${d.posting_time || ""}</span>
						</div>
						<div class="etv2-order-total">${format_currency(d.grand_total, d.currency)}</div>
						<div class="etv2-order-actions">
							<button class="etv2-btn etv2-btn-primary etv2-return-btn" data-name="${frappe.utils.escape_html(d.name)}">${__("Return")}</button>
						</div>
					</div>`).join("")
			);
		});
	}

	make_return(name) {
		frappe.set_route("Form", "POS Invoice", name);
		frappe.after_ajax(() => {
			const cur_frm = frappe.model.get_doc("POS Invoice", name).__onload;
			// fall through to standard ERPNext: open the invoice and let the
			// user hit "Return" via the document's own action
			frappe.show_alert({ message: __("Open the invoice and use Return in the document action menu."), indicator: "blue" });
		});
	}
};