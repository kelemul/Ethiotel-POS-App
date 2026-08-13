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

		this.locked = localStorage.getItem("ethiotel_pos_v2.sidebar_locked") === "1";
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
			// desktop: toggle collapsed (icons-only) state via width class
			this.$layout.toggleClass("etv2-nav-collapsed");
		});

		// drawer scrim click-to-close
		this.shell.$shell.on("click", ".etv2-drawer-scrim", () => this.close_drawer());

		// lock toggle
		this.shell.$shell.on("click", ".etv2-sidebar-lock", () => this.toggle_lock());
	}

	close_drawer() {
		this.$layout.removeClass("etv2-drawer-open");
	}

	toggle_lock() {
		this.locked = !this.locked;
		localStorage.setItem("ethiotel_pos_v2.sidebar_locked", this.locked ? "1" : "0");
		this.render_lock_state();
	}

	render_lock_state() {
		const $lock = this.$sidebar.find(".etv2-sidebar-lock");
		$lock.toggleClass("etv2-locked", this.locked);
		$lock.attr("title", this.locked ? __("Unlock menu") : __("Lock menu"));
		this.$sidebar.find(".etv2-sidebar-lock-label").text(this.locked ? __("Menu locked") : __("Lock menu"));
	}

	// highlight the active nav item (sidebar + bottom nav)
	set_active(name) {
		this.$layout.find(".etv2-nav-item").removeClass("active");
		this.$layout.find(`.etv2-nav-item[data-ws="${name}"]`).addClass("active");
	}
};