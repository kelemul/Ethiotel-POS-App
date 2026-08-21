// =====================================================================
// SETTINGS WORKSPACE
// Shift / profile / session info. Lightweight for now.
// =====================================================================
erpnext.POSV2 = erpnext.POSV2 || {};

erpnext.POSV2.SettingsWorkspace = class {
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
					<h2 class="etv2-page-title">${__("Settings")}</h2>
				</div>
				<div class="etv2-ws-content" style="flex-direction:column;max-width:640px;">
					<div class="etv2-card">
						<div class="etv2-card-header"><span class="etv2-card-title">${__("Session")}</span></div>
						<div class="etv2-card-body">
							<div class="etv2-list">
								<div class="etv2-list-row"><span class="etv2-list-row-label">${__("User")}</span><span class="etv2-list-row-amount" style="text-align:left;min-width:0;flex:1">${frappe.utils.escape_html(frappe.session.user_fullname || frappe.session.user)}</span></div>
								<div class="etv2-list-row"><span class="etv2-list-row-label">${__("POS Profile")}</span><span class="etv2-list-row-amount" style="text-align:left;min-width:0;flex:1">${frappe.utils.escape_html(this.shell.pos_profile || "—")}</span></div>
								<div class="etv2-list-row"><span class="etv2-list-row-label">${__("Warehouse")}</span><span class="etv2-list-row-amount" style="text-align:left;min-width:0;flex:1">${frappe.utils.escape_html(this.shell.warehouse || "—")}</span></div>
								<div class="etv2-list-row"><span class="etv2-list-row-label">${__("Company")}</span><span class="etv2-list-row-amount" style="text-align:left;min-width:0;flex:1">${frappe.utils.escape_html(this.shell.company || "—")}</span></div>
								<div class="etv2-list-row"><span class="etv2-list-row-label">${__("Tax Template")}</span><span class="etv2-list-row-amount etv2-session-tax" style="text-align:left;min-width:0;flex:1">${frappe.utils.escape_html(this.shell.tax_template || "—")}</span></div>
							</div>
						</div>
					</div>
					<div class="etv2-card">
						<div class="etv2-card-header"><span class="etv2-card-title">${__("Actions")}</span></div>
						<div class="etv2-card-body">
							<div class="etv2-cart-actions" style="padding:0;max-width:420px;">
								<button class="etv2-btn etv2-btn-danger etv2-close-shift-btn" ${this.shell.pos_opening ? "" : "disabled"}>${__("Close Shift")}</button>
								<button class="etv2-btn etv2-btn-ghost etv2-signout-btn">${__("Sign Out")}</button>
								<button class="etv2-btn etv2-btn-ghost etv2-fullscreen2-btn">${__("Toggle Full Screen")}</button>
							</div>
						</div>
					</div>
				</div>
			</section>
		`);

		this.$el.find(".etv2-signout-btn").on("click", () => frappe.app.logout());
		this.$el.find(".etv2-fullscreen2-btn").on("click", () => {
			if (!document.fullscreenElement) document.documentElement.requestFullscreen();
			else if (document.exitFullscreen) document.exitFullscreen();
		});
		this.$el.find(".etv2-close-shift-btn").on("click", () => this.shell.close_shift());

		return this.$el;
	}
};