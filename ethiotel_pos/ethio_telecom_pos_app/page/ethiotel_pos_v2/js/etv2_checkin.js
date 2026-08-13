// =====================================================================
// PHASE 9 — CHECK-IN WORKSPACE
// Open / close the cashier shift. Shows the currently-open shift with its
// sales summary + payment breakdown + opening balance, and a Close Shift
// action that creates + submits the POS Closing Entry (Forkiva-style).
// =====================================================================
erpnext.POSV2 = erpnext.POSV2 || {};

erpnext.POSV2.CheckinWorkspace = class {
	constructor({ shell, workspace, container, name }) {
		this.shell = shell;
		this.workspace = workspace;
		this.container = container;
		this.name = name;
		this.render();
	}

	render() {
		this.$el = $(`
			<section class="etv2-ws etv2-checkin">
				<div class="etv2-ws-toolbar">
					<h2 class="etv2-page-title">${__("Check-in / Check-out")}</h2>
					<div class="etv2-checkin-status"></div>
				</div>
				<div class="etv2-checkin-body">
					<div class="etv2-card etv2-checkin-shift-card">
						<div class="etv2-card-header"><span class="etv2-card-title">${__("Current Shift")}</span></div>
						<div class="etv2-card-body etv2-checkin-shift"></div>
					</div>
					<div class="etv2-card">
						<div class="etv2-card-header"><span class="etv2-card-title">${__("Shift Summary")}</span></div>
						<div class="etv2-card-body etv2-checkin-summary"></div>
					</div>
				</div>
			</section>
		`);
		return this.$el;
	}

	show() {
		this.load();
	}

	refresh() {
		this.load();
	}

	load() {
		const shell = this.shell;
		const entry = shell.pos_opening;
		const $status = this.$el.find(".etv2-checkin-status");
		const $shift = this.$el.find(".etv2-checkin-shift");
		const $summary = this.$el.find(".etv2-checkin-summary");

		if (!entry) {
			$status.html(`<span class="etv2-pill etv2-pill-muted">${__("No open shift")}</span>`);
			$shift.html(`
				<div class="etv2-empty">${__("No shift is currently open for this user.")}</div>
			`);
			$summary.html(`
				<div class="etv2-checkin-actions">
					<button class="etv2-btn etv2-btn-primary etv2-checkin-open-btn">${__("Open Shift")}</button>
				</div>
			`);
			this.$el.find(".etv2-checkin-open-btn").on("click", () => this.shell.open_shift_dialog());
			return;
		}

		$status.html(`<span class="etv2-pill etv2-pill-green"><span class="etv2-shift-dot"></span>${__("Shift open")} · ${frappe.datetime.str_to_user(shell.pos_opening_time)}</span>`);
		$shift.html(`
			<div class="etv2-checkin-row"><span>${__("Opening Entry")}</span><b>${frappe.utils.escape_html(entry)}</b></div>
			<div class="etv2-checkin-row"><span>${__("POS Profile")}</span><b>${frappe.utils.escape_html(shell.pos_profile)}</b></div>
			<div class="etv2-checkin-row"><span>${__("Company")}</span><b>${frappe.utils.escape_html(shell.company)}</b></div>
			<div class="etv2-checkin-row"><span>${__("Opened")}</span><b>${frappe.datetime.str_to_user(shell.pos_opening_time)}</b></div>
		`);

		const pv = shell.get_pv();
		frappe.call({
			method: `${pv}.get_shift_summary`,
			args: { pos_opening: entry },
		}).then((r) => {
			const d = r.message || {};
			$summary.html(`
				<div class="etv2-checkin-metrics">
					<div class="etv2-checkin-metric">
						<span class="etv2-metric-label">${__("Sales")}</span>
						<span class="etv2-metric-value">${format_currency(d.sales_total || 0)}</span>
					</div>
					<div class="etv2-checkin-metric">
						<span class="etv2-metric-label">${__("Invoices")}</span>
						<span class="etv2-metric-value">${d.invoice_count || 0}</span>
					</div>
					<div class="etv2-checkin-metric">
						<span class="etv2-metric-label">${__("Customers")}</span>
						<span class="etv2-metric-value">${d.customer_count || 0}</span>
					</div>
				</div>
				<div class="etv2-checkin-section-title">${__("Payments Received")}</div>
				<div class="etv2-list">
					${(d.payments || []).length ? d.payments.map((p) => `
						<div class="etv2-list-row">
							<span class="etv2-list-row-label">${frappe.utils.escape_html(p.mode_of_payment)}</span>
							<span class="etv2-list-row-amount">${format_currency(p.amount)}</span>
						</div>`).join("") : `<div class="etv2-empty">${__("No payments this shift.")}</div>`}
				</div>
				<div class="etv2-checkin-section-title">${__("Opening Balance")}</div>
				<div class="etv2-list">
					${Object.keys(d.opening_balance || {}).length ? Object.keys(d.opening_balance).map((m) => `
						<div class="etv2-list-row">
							<span class="etv2-list-row-label">${frappe.utils.escape_html(m)}</span>
							<span class="etv2-list-row-amount">${format_currency(d.opening_balance[m])}</span>
						</div>`).join("") : `<div class="etv2-empty">${__("No opening balance.")}</div>`}
				</div>
				<div class="etv2-checkin-actions">
					<button class="etv2-btn etv2-btn-danger etv2-checkin-close-btn">${__("Close Shift")}</button>
				</div>
			`);
			this.$el.find(".etv2-checkin-close-btn").on("click", () => this.close_shift(entry));
		});
	}

	close_shift(entry) {
		const me = this;
		frappe.confirm(
			__("Close this shift? The POS Closing Entry will be created and submitted."),
			() => {
				const pv = this.shell.get_pv();
				frappe.call({
					method: `${pv}.close_shift`,
					args: { pos_opening: entry },
					freeze: true,
				}).then((r) => {
					if (r.message && r.message.status === "ok") {
						frappe.show_alert({ message: __("Shift closed · closing entry {0}", [r.message.closing_entry]), indicator: "green" });
						this.shell.pos_opening = null;
						this.shell.pos_profile = null;
						this.shell.$main.find(".etv2-shift-chip").addClass("etv2-shift-chip-hidden");
						this.load();
					} else {
						frappe.show_alert({ message: __("Failed to close shift: {0}", [r.exc]), indicator: "red" });
					}
				});
			}
		);
	}
};
