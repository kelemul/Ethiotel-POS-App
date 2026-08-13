// =====================================================================
// PHASE 8 — CUSTOMER WORKSPACE
// Search + customer grid + profile panel (details + recent transactions).
// =====================================================================
erpnext.POSV2 = erpnext.POSV2 || {};

erpnext.POSV2.CustomerWorkspace = class {
	constructor({ shell, workspace, container, name }) {
		this.shell = shell;
		this.workspace = workspace;
		this.container = container;
		this.name = name;
		this.selected = null;
		this.render();
	}

	render() {
		this.$el = $(`
			<section class="etv2-ws">
				<div class="etv2-ws-toolbar">
					<h2 class="etv2-page-title">${__("Customers")}</h2>
					<div class="etv2-search etv2-customer-search">
						<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
						<input type="text" placeholder="${__("Search customers…")}" />
					</div>
				</div>
				<div class="etv2-customer-body">
					<div class="etv2-customer-grid"></div>
					<aside class="etv2-card etv2-customer-panel">
						<div class="etv2-customer-panel-empty">
							<svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg>
							<p>${__("Select a customer to see their profile.")}</p>
						</div>
					</aside>
				</div>
			</section>
		`);

		let searchTimer;
		this.$el.find(".etv2-customer-search input").on("input", (e) => {
			clearTimeout(searchTimer);
			searchTimer = setTimeout(() => this.load($(e.currentTarget).val()), 250);
		});

		this.$el.on("click", ".etv2-customer-card", (e) => this.select_customer($(e.currentTarget).attr("data-name")));

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
			method: `${pv}.get_customers`,
			args: { search_term, limit: 80 },
		}).then((r) => {
			const rows = r.message || [];
			const $grid = this.$el.find(".etv2-customer-grid");
			if (!rows.length) {
				$grid.html(`<div class="etv2-empty">${__("No customers found.")}</div>`);
				return;
			}
			$grid.html(
				rows.map((c) => `
					<div class="etv2-customer-card" data-name="${frappe.utils.escape_html(c.name)}">
						<div class="etv2-customer-avatar">
							${c.image ? `<img src="${c.image}" onerror="this.remove()" />` : frappe.utils.escape_html((c.customer_name || c.name).slice(0, 1).toUpperCase())}
						</div>
						<div class="etv2-customer-card-info">
							<div class="etv2-customer-card-name">${frappe.utils.escape_html(c.customer_name || c.name)}</div>
							<div class="etv2-customer-card-sub">${frappe.utils.escape_html(c.mobile_no || c.customer_group || "")}</div>
						</div>
					</div>`).join("")
			);
		});
	}

	select_customer(name) {
		this.selected = name;
		this.$el.find(".etv2-customer-card").removeClass("selected");
		this.$el.find(`.etv2-customer-card[data-name="${name}"]`).addClass("selected");
		const pv = this.shell.get_pv();
		frappe.call({
			method: `${pv}.get_customer_details`,
			args: { customer: name },
		}).then((r) => {
			this.render_panel(r.message || {});
		});
	}

	render_panel({ customer, transactions }) {
		const c = customer || {};
		const $panel = this.$el.find(".etv2-customer-panel");
		const txns = transactions || [];
		$panel.html(`
			<div class="etv2-cp-head">
				<div class="etv2-cp-avatar">
					${c.image ? `<img src="${c.image}" onerror="this.remove()" />` : frappe.utils.escape_html((c.customer_name || c.name || "?").slice(0, 1).toUpperCase())}
				</div>
				<div class="etv2-cp-name">${frappe.utils.escape_html(c.customer_name || c.name)}</div>
				<div class="etv2-cp-meta">${frappe.utils.escape_html(c.customer_group || "")} · ${frappe.utils.escape_html(c.territory || "")}</div>
			</div>
			<div class="etv2-cp-section">
				<div class="etv2-cp-field"><span class="etv2-cp-field-label">${__("Mobile")}</span><span class="etv2-cp-field-value">${frappe.utils.escape_html(c.mobile_no || "—")}</span></div>
				<div class="etv2-cp-field"><span class="etv2-cp-field-label">${__("Email")}</span><span class="etv2-cp-field-value">${frappe.utils.escape_html(c.email_id || "—")}</span></div>
				<div class="etv2-cp-field"><span class="etv2-cp-field-label">${__("Loyalty")}</span><span class="etv2-cp-field-value">${frappe.utils.escape_html(c.loyalty_program || "—")}</span></div>
			</div>
			<div class="etv2-cp-section">
				<div class="etv2-cp-section-title">${__("Transactions")}</div>
				${txns.length ? txns.map((t) => `
					<div class="etv2-cp-txn">
						<div class="etv2-cp-txn-name">#${frappe.utils.escape_html(t.name)}<br/><span class="etv2-muted">${t.posting_date || ""} ${t.posting_time || ""}</span></div>
						<div class="etv2-cp-txn-amt">${format_currency(t.grand_total, t.currency)}</div>
					</div>`).join("") : `<div class="etv2-empty">${__("No transactions.")}</div>`}
			</div>
		`);
	}
};