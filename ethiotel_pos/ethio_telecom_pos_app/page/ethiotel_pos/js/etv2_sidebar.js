// =====================================================================
// PHASE 3 — SIDEBAR (desk) + bottom-nav (mobile)
// Builds nav items from the template's buttons, wires locking and the
// drawer behavior for tablet.
// =====================================================================
erpnext.POSV2 = erpnext.POSV2 || {};

erpnext.POSV2.Sidebar = class {
	constructor({ shell }) {
	this.shell = shell;
	this.$sidebar = shell.$sidebar;
	this.$layout = shell.$shell;

	this.locked = localStorage.getItem("ethiotel_pos.sidebar_locked") === "1";
	const expanded = localStorage.getItem("ethiotel_pos.sidebar_expanded") === "1";
	this.$layout.toggleClass("etv2-nav-expanded", expanded);

	this.render_lock_state();
	this.bind();
}

	bind() {
		// nav buttons (both sidebar + bottom nav)
		this.shell.$shell.on("click", ".etv2-nav-item", (e) => {
			const name = $(e.currentTarget).attr("data-ws");
			this.shell.workspaces.show(name);
			this.close_drawer();
		});

		// sidebar toggle (hamburger) — drawer on tablet, collapse on desktop
		this.shell.$shell.on("click", ".etv2-sidebar-toggle", () => {
	const isTablet = window.matchMedia("(max-width: 1023px)").matches;
	if (isTablet) {
		this.$layout.toggleClass("etv2-drawer-open");
		return;
	}
	// desktop: toggle expanded (icon+text) state
	this.$layout.toggleClass("etv2-nav-expanded");
	localStorage.setItem(
		"ethiotel_pos.sidebar_expanded",
		this.$layout.hasClass("etv2-nav-expanded") ? "1" : "0"
	);
});

		this.shell.$shell.on("click", ".etv2-drawer-scrim", () => {
	this.close_drawer();
	this.close_all_menus();
});
		// lock toggle
		this.shell.$shell.on("click", ".etv2-sidebar-lock", () => this.toggle_lock());
		// action menu (return invoice / resync / print last / MoR)
this.shell.$shell.on("click", ".fk-actions-trigger", (e) => {
	e.stopPropagation();
	this.toggle_menu(".fk-actions-menu");
});
this.shell.$shell.on("click", ".fk-actions-menu .fk-menu-item", (e) => {
	const action = $(e.currentTarget).attr("data-action");
	this.close_all_menus();
	this.handle_action(action);
});

// profile dropdown
this.shell.$shell.on("click", ".fk-profile-trigger", (e) => {
	e.stopPropagation();
	this.toggle_menu(".fk-profile-menu");
});
this.shell.$shell.on("click", ".fk-profile-menu .fk-menu-item", (e) => {
	const action = $(e.currentTarget).attr("data-profile-action");
	this.close_all_menus();
	this.handle_profile_action(action);
});

// click-away closes any open dropdown
$(document).on("click.etv2-menus", () => this.close_all_menus());

// keep fullscreen icon (if you keep a standalone button) and dropdown item in sync
$(document).on("fullscreenchange", () => this.sync_fullscreen_label());
	}

	close_drawer() {
		this.$layout.removeClass("etv2-drawer-open");
	}

	toggle_lock() {
		this.locked = !this.locked;
		localStorage.setItem("ethiotel_pos.sidebar_locked", this.locked ? "1" : "0");
		this.render_lock_state();
	}

	render_lock_state() {
		const $lock = this.$sidebar.find(".etv2-sidebar-lock");
		$lock.toggleClass("etv2-locked", this.locked);
		$lock.attr("title", this.locked ? __("Unlock menu") : __("Lock menu"));
		// this.$sidebar.find(".etv2-sidebar-lock-label").text(this.locked ? __("Menu locked") : __("Lock menu"));
	}

	// highlight the active nav item (sidebar + bottom nav)
	set_active(name) {
		this.$layout.find(".etv2-nav-item").removeClass("active");
		this.$layout.find(`.etv2-nav-item[data-ws="${name}"]`).addClass("active");
	}

toggle_menu(selector) {
	const $menu = this.shell.$shell.find(selector);
	const is_open = $menu.hasClass("fk-menu-open");
	this.close_all_menus();
	if (!is_open) $menu.addClass("fk-menu-open");
}

close_all_menus() {
	this.shell.$shell.find(".fk-dropdown-menu").removeClass("fk-menu-open");
}

handle_action(action) {
	switch (action) {
		case "return_invoice":
			this.shell.workspaces.show("returns");
			break;
		case "resync":
			frappe.show_alert({ message: __("Resyncing…"), indicator: "blue" });
			frappe.call({ method: `${this.shell.get_pv()}.resync_pos_data` })
				.then(() => frappe.show_alert({ message: __("Resync complete."), indicator: "green" }))
				.catch(() => frappe.show_alert({ message: __("Resync failed."), indicator: "red" }));
			break;
		case "print_last_invoice": {
			if (!this.shell.last_invoice_name) {
				frappe.show_alert({ message: __("No invoice has been created in this session yet."), indicator: "orange" });
				return;
			}
			ethiotel_print("POS Invoice", this.shell.last_invoice_name, "EIMS Invoice");
			break;
		}
		case "send_to_mor":
			this.shell.workspaces.show("invoices");
			break;
	}
}

handle_profile_action(action) {
	switch (action) {
		case "my_profile":
			frappe.set_route("app", "user-profile", frappe.session.user);
			break;
		case "apps":
			window.open("/apps", "_blank");
			break;
		case "fullscreen":
			this.toggle_fullscreen();
			break;
		case "sign_out":
			frappe.app.logout();
			break;
	}
}

toggle_fullscreen() {
	if (!document.fullscreenElement) {
		document.documentElement.requestFullscreen().catch(() => {});
	} else {
		document.exitFullscreen().catch(() => {});
	}
}

sync_fullscreen_label() {
	const is_full = Boolean(document.fullscreenElement);
	this.shell.$shell
		.find('[data-profile-action="fullscreen"] span')
		.text(is_full ? __("Exit Full Screen") : __("Toggle Full Screen"));
}

set_shift_time(text) {
	this.$sidebar.closest(".etv2-shell").find(".fk-shift-time").text(text || __("Not opened"));
}
};