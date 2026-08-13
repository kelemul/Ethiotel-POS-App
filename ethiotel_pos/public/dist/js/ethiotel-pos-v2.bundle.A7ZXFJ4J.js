(() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));

  // ../ethiotel_pos/ethiotel_pos/ethio_telecom_pos_app/page/ethiotel_pos_v2/js/etv2_template.js
  erpnext.POSV2 = erpnext.POSV2 || {};
  erpnext.POSV2.SHELL_TEMPLATE = `
<div class="etv2-shell">

	<!-- ===================== TOP BAR ===================== -->
	<header class="etv2-topbar">
		<div class="etv2-topbar-left">
			<button class="etv2-icon-btn etv2-sidebar-toggle" title="Toggle menu">
				<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
			</button>
			<div class="etv2-brand">
				<img src="/assets/ethiotel_pos/images/tele.jpg" alt="logo" />
				<span class="etv2-brand-name">Ethiotel POS</span>
			</div>
			<div class="etv2-shift-chip etv2-shift-chip-hidden">
				<span class="etv2-shift-dot"></span>
				<span class="etv2-shift-chip-text">Shift open</span>
			</div>
		</div>
		<div class="etv2-topbar-right">
			<button class="etv2-icon-btn etv2-home-btn" title="Exit POS">
				<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
			</button>
			<button class="etv2-icon-btn etv2-fullscreen-btn" title="Toggle full screen">
				<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/></svg>
			</button>
			<div class="etv2-network etv2-online">
				<span class="etv2-network-dot"></span><span class="etv2-network-label">Online</span>
			</div>
			<div class="etv2-user">
				<div class="etv2-avatar"></div>
				<span class="etv2-user-name"></span>
			</div>
			<button class="etv2-icon-btn etv2-settings-btn" data-ws="settings" title="Settings">
				<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
			</button>
		</div>
	</header>

	<!-- ===================== SIDEBAR (direct grid child) ===================== -->
	<aside class="etv2-sidebar">
		<nav class="etv2-sidebar-nav">
				<button class="etv2-nav-item etv2-nav-sale" data-ws="sale">
					<span class="etv2-nav-icon">
						<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
					</span>
					<span class="etv2-nav-label">Sale</span>
				</button>
				<button class="etv2-nav-item etv2-nav-checkin" data-ws="checkin">
					<span class="etv2-nav-icon">
						<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"></path></svg>
					</span>
					<span class="etv2-nav-label">Check-in</span>
				</button>
				<button class="etv2-nav-item etv2-nav-held" data-ws="held">
					<span class="etv2-nav-icon">
						<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
					</span>
					<span class="etv2-nav-label">Held Orders</span>
				</button>
				<button class="etv2-nav-item etv2-nav-dashboard" data-ws="dashboard">
					<span class="etv2-nav-icon">
						<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9" rx="1"></rect><rect x="14" y="3" width="7" height="5" rx="1"></rect><rect x="14" y="12" width="7" height="9" rx="1"></rect><rect x="3" y="16" width="7" height="5" rx="1"></rect></svg>
					</span>
					<span class="etv2-nav-label">Shift Dashboard</span>
				</button>
				<button class="etv2-nav-item etv2-nav-customers" data-ws="customers">
					<span class="etv2-nav-icon">
						<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
					</span>
					<span class="etv2-nav-label">Customers</span>
				</button>
				<button class="etv2-nav-item etv2-nav-returns" data-ws="returns">
					<span class="etv2-nav-icon">
						<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg>
					</span>
					<span class="etv2-nav-label">Returns</span>
				</button>
				<button class="etv2-nav-item etv2-nav-reports" data-ws="reports">
					<span class="etv2-nav-icon">
						<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 20V10"></path><path d="M12 20V4"></path><path d="M6 20v-6"></path></svg>
					</span>
					<span class="etv2-nav-label">Reports</span>
				</button>
				<button class="etv2-nav-item etv2-nav-settings" data-ws="settings">
					<span class="etv2-nav-icon">
						<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
					</span>
					<span class="etv2-nav-label">Settings</span>
				</button>
			</nav>
			<div class="etv2-sidebar-footer">
				<div class="etv2-sidebar-lock-row">
					<button class="etv2-icon-btn etv2-sidebar-lock" title="Lock menu">
						<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
					</button>
					<span class="etv2-sidebar-lock-label">Lock menu</span>
				</div>
			</div>
		</aside>

		<!-- ===================== WORKSPACE ===================== -->
		<main class="etv2-workspace" id="etv2-workspace">
			<div class="etv2-workspace-empty">
				<div class="etv2-spinner"></div>
				<p>Loading workspace\u2026</p>
			</div>
		</main>

	<!-- ===================== STATUS BAR ===================== -->
	<footer class="etv2-statusbar">
		<div class="etv2-status-left">
			<span class="etv2-status-profile">Profile: \u2014</span>
			<span class="etv2-status-warehouse">Warehouse: \u2014</span>
		</div>
		<div class="etv2-status-right">
			<span class="etv2-status-clock"></span>
		</div>
	</footer>

	<!-- ===================== MOBILE BOTTOM NAV ===================== -->
	<nav class="etv2-bottomnav">
		<button class="etv2-bottomnav-item etv2-nav-sale" data-ws="sale">
			<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
			<span>Sale</span>
		</button>
		<button class="etv2-bottomnav-item etv2-nav-held" data-ws="held">
			<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
			<span>Held</span>
		</button>
		<button class="etv2-bottomnav-item etv2-nav-dashboard" data-ws="dashboard">
			<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9" rx="1"></rect><rect x="14" y="3" width="7" height="5" rx="1"></rect><rect x="14" y="12" width="7" height="9" rx="1"></rect><rect x="3" y="16" width="7" height="5" rx="1"></rect></svg>
			<span>Dashboard</span>
		</button>
		<button class="etv2-bottomnav-item etv2-nav-customers" data-ws="customers">
			<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
			<span>Customers</span>
		</button>
		<button class="etv2-bottomnav-item etv2-nav-reports" data-ws="reports">
			<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 20V10"></path><path d="M12 20V4"></path><path d="M6 20v-6"></path></svg>
			<span>Reports</span>
		</button>
	</nav>
</div>
`;

  // ../ethiotel_pos/ethiotel_pos/ethio_telecom_pos_app/page/ethiotel_pos_v2/js/etv2_workspace_manager.js
  erpnext.POSV2 = erpnext.POSV2 || {};
  erpnext.POSV2.WorkspaceManager = class {
    constructor({ shell }) {
      this.shell = shell;
      this.registry = {};
      this.instances = {};
      this.current = null;
      this.$container = shell.$workspace;
    }
    register(name, Ctor) {
      this.registry[name] = Ctor;
      return this;
    }
    async show(name, opts = {}) {
      if (name === this.current) {
        if (this.instances[name] && this.instances[name].refresh) {
          this.instances[name].refresh(opts);
        }
        return;
      }
      if (this.current && this.instances[this.current]) {
        this.instances[this.current].$el && this.instances[this.current].$el.removeClass("etv2-active");
        this.instances[this.current].hide && this.instances[this.current].hide();
      }
      if (!this.real_mounted) {
        this.$container.find(".etv2-workspace-empty").remove();
        this.real_mounted = true;
      }
      let ws = this.instances[name];
      if (!ws) {
        const Ctor = this.registry[name];
        if (!Ctor) {
          frappe.show_alert({ message: __(`Unknown workspace: ${name}`), indicator: "red" });
          return;
        }
        ws = new Ctor({ shell: this.shell, workspace: this, container: this.$container, name });
        this.instances[name] = ws;
        ws.$el && this.$container.append(ws.$el);
      }
      ws.$el.addClass("etv2-active");
      ws.show && ws.show(opts);
      this.current = name;
      this.shell.sidebar.set_active(name);
      setTimeout(() => $(window).trigger("resize"), 60);
    }
  };

  // ../ethiotel_pos/ethiotel_pos/ethio_telecom_pos_app/page/ethiotel_pos_v2/js/etv2_sidebar.js
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
      this.shell.$shell.on("click", ".etv2-nav-item", (e) => {
        const name = $(e.currentTarget).attr("data-ws");
        this.shell.workspaces.show(name);
        this.close_drawer();
      });
      this.shell.$shell.on("click", ".etv2-sidebar-toggle", () => {
        const isTablet = window.matchMedia("(max-width: 1023px)").matches;
        if (isTablet) {
          this.$layout.toggleClass("etv2-drawer-open");
          return;
        }
        this.$layout.toggleClass("etv2-nav-collapsed");
      });
      this.shell.$shell.on("click", ".etv2-drawer-scrim", () => this.close_drawer());
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
    set_active(name) {
      this.$layout.find(".etv2-nav-item").removeClass("active");
      this.$layout.find(`.etv2-nav-item[data-ws="${name}"]`).addClass("active");
    }
  };

  // ../ethiotel_pos/ethiotel_pos/ethio_telecom_pos_app/page/ethiotel_pos_v2/js/etv2_shell.js
  erpnext.POSV2 = erpnext.POSV2 || {};
  erpnext.POSV2.Shell = class {
    constructor(wrapper) {
      this.wrapper = wrapper;
      this.page = wrapper.page;
      this.$main = $(wrapper).find(".layout-main-section");
      this.pos_profile = null;
      this.settings = {};
      this.price_list = null;
      this.warehouse = null;
      this.parent_item_group = null;
      this.customer_groups = [];
      this.render();
      this.boot();
    }
    render() {
      this.$main.html(erpnext.POSV2.SHELL_TEMPLATE);
      this.$shell = this.$main.find(".etv2-shell");
      this.$workspace = this.$main.find("#etv2-workspace");
      this.$sidebar = this.$main.find(".etv2-sidebar");
      this.$statusProfile = this.$main.find(".etv2-status-profile");
      this.$statusWarehouse = this.$main.find(".etv2-status-warehouse");
      const initials = (frappe.session.user_fullname || frappe.session.user || "U").slice(0, 1).toUpperCase();
      this.$main.find(".etv2-avatar").text(initials);
      this.$main.find(".etv2-user-name").text(frappe.session.user_fullname || frappe.session.user);
      $("<div class='etv2-drawer-scrim'></div>").appendTo(this.$shell);
    }
    boot() {
      this.sidebar = new erpnext.POSV2.Sidebar({ shell: this });
      this.workspaces = new erpnext.POSV2.WorkspaceManager({ shell: this });
      this.workspaces.register("sale", erpnext.POSV2.SaleWorkspace);
      this.workspaces.register("checkin", erpnext.POSV2.CheckinWorkspace);
      this.workspaces.register("held", erpnext.POSV2.HeldOrdersWorkspace);
      this.workspaces.register("dashboard", erpnext.POSV2.ShiftDashboardWorkspace);
      this.workspaces.register("customers", erpnext.POSV2.CustomerWorkspace);
      this.workspaces.register("returns", erpnext.POSV2.ReturnsWorkspace);
      this.workspaces.register("reports", erpnext.POSV2.ReportsWorkspace);
      this.workspaces.register("settings", erpnext.POSV2.SettingsWorkspace);
      this.bind_topbar();
      this.start_clock();
      this.watch_network();
      this.check_opening_entry().then(() => {
        if (this.pos_profile) {
          this.workspaces.show("sale");
        }
      });
    }
    bind_topbar() {
      this.$main.find(".etv2-home-btn").on("click", () => {
        window.location.href = "/app";
      });
      this.$main.find(".etv2-fullscreen-btn").on("click", () => {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen();
        } else if (document.exitFullscreen) {
          document.exitFullscreen();
        }
      });
    }
    check_opening_entry() {
      const pv = "ethiotel_pos.ethio_telecom_pos_app.page.ethiotel_pos_v2.ethiotel_pos_v2";
      return frappe.call({
        method: `${pv}.check_opening_entry`,
        args: { user: frappe.session.user }
      }).then((r) => {
        if (r.message && r.message.length) {
          const entry = r.message[0];
          this.pos_opening = entry.name;
          this.pos_profile = entry.pos_profile;
          this.company = entry.company;
          this.pos_opening_time = entry.period_start_date;
          this.show_shift_chip();
          return this.load_profile();
        }
        return this.open_shift_dialog();
      });
    }
    show_shift_chip() {
      const $chip = this.$main.find(".etv2-shift-chip");
      $chip.removeClass("etv2-shift-chip-hidden");
      $chip.find(".etv2-shift-chip-text").text(`${__("Shift open")} \xB7 ${frappe.datetime.str_to_user(this.pos_opening_time)}`);
    }
    load_profile() {
      const pv = "ethiotel_pos.ethio_telecom_pos_app.page.ethiotel_pos_v2.ethiotel_pos_v2";
      return frappe.call({
        method: `${pv}.get_pos_profile_data`,
        args: { pos_profile: this.pos_profile }
      }).then((r) => {
        const profile = r.message;
        this.settings = profile;
        this.price_list = profile.selling_price_list;
        this.warehouse = profile.warehouse || profile.set_warehouse;
        this.customer_groups = (profile.customer_groups || []).map((g) => g.name);
        this.set_status_bar();
        return frappe.call({ method: `${pv}.get_root_item_group` }).then((r2) => {
          this.parent_item_group = r2.message && r2.message[0] && r2.message[0].name || "All Item Groups";
        });
      });
    }
    set_status_bar() {
      this.$statusProfile.text(`${__("Profile")}: ${this.pos_profile}`);
      this.$statusWarehouse.text(`${__("Warehouse")}: ${this.warehouse || "\u2014"}`);
    }
    open_shift_dialog() {
      const pv = "ethiotel_pos.ethio_telecom_pos_app.page.ethiotel_pos_v2.ethiotel_pos_v2";
      const me = this;
      const dialog = new frappe.ui.Dialog({
        title: __("Open Shift"),
        static: true,
        fields: [
          { fieldname: "company", fieldtype: "Link", label: __("Company"), options: "Company", default: frappe.defaults.get_default("company"), reqd: 1 },
          {
            fieldname: "pos_profile",
            fieldtype: "Link",
            label: __("POS Profile"),
            options: "POS Profile",
            reqd: 1,
            get_query: () => ({
              query: "erpnext.accounts.doctype.pos_profile.pos_profile.pos_profile_query",
              filters: { company: dialog.fields_dict.company.get_value() }
            }),
            onchange: () => fetch_payments()
          },
          {
            fieldname: "balance_details",
            fieldtype: "Table",
            label: __("Opening Balance"),
            cannot_add_rows: false,
            in_place_edit: true,
            reqd: 1,
            data: [],
            fields: [
              { fieldname: "mode_of_payment", fieldtype: "Link", in_list_view: 1, label: __("Mode of Payment"), options: "Mode of Payment", reqd: 1 },
              { fieldname: "opening_amount", fieldtype: "Currency", in_list_view: 1, label: __("Opening Amount"), default: 0 }
            ]
          }
        ],
        primary_action_label: __("Open"),
        primary_action: function(values) {
          const balance = (values.balance_details || []).filter((d) => d.mode_of_payment);
          if (!balance.length) {
            frappe.show_alert({ message: __("Add at least one mode of payment."), indicator: "orange" });
            return;
          }
          frappe.call({
            method: "ethiotel_pos.ethio_telecom_pos_app.page.ethiotel_pos.ethiotel_pos.create_opening_voucher",
            args: { pos_profile: values.pos_profile, company: values.company, balance_details: balance },
            freeze: true
          }).then((r) => {
            if (!r.exc) {
              const doc = r.message;
              me.pos_opening = doc.name;
              me.pos_profile = doc.pos_profile;
              me.company = doc.company;
              me.pos_opening_time = doc.period_start_date;
              dialog.hide();
              me.show_shift_chip();
              me.load_profile().then(() => {
                me.workspaces.show("sale");
              });
            }
          });
        }
      });
      function fetch_payments() {
        const profile = dialog.fields_dict.pos_profile.get_value();
        if (!profile)
          return;
        frappe.db.get_doc("POS Profile", profile).then((doc) => {
          dialog.fields_dict.balance_details.df.data = (doc.payments || []).map((p) => ({
            mode_of_payment: p.mode_of_payment,
            opening_amount: 0
          }));
          dialog.fields_dict.balance_details.grid.refresh();
        });
      }
      dialog.show();
    }
    start_clock() {
      const $clock = this.$main.find(".etv2-status-clock");
      const tick = () => $clock.text(moment().format("DD-MM-YYYY hh:mm:ss A").toUpperCase());
      tick();
      setInterval(tick, 1e3);
    }
    watch_network() {
      const $net = this.$main.find(".etv2-network");
      const update = () => {
        const online = navigator.onLine;
        $net.toggleClass("etv2-online", online).toggleClass("etv2-offline", !online);
        $net.find(".etv2-network-label").text(online ? __("Online") : __("Offline"));
      };
      window.addEventListener("online", update);
      window.addEventListener("offline", update);
      update();
    }
    get_pv() {
      return "ethiotel_pos.ethio_telecom_pos_app.page.ethiotel_pos_v2.ethiotel_pos_v2";
    }
  };

  // ../ethiotel_pos/ethiotel_pos/ethio_telecom_pos_app/page/ethiotel_pos_v2/js/etv2_sale_workspace.js
  erpnext.POSV2 = erpnext.POSV2 || {};
  erpnext.POSV2.SaleWorkspace = class {
    constructor({ shell, workspace, container, name }) {
      this.shell = shell;
      this.workspace = workspace;
      this.container = container;
      this.name = name;
      this.cart = {};
      this.customer = null;
      this.items = [];
      this.item_groups = [];
      this.discount_mode = "percentage";
      this.discount_value = 0;
      this.render();
      this.load_item_groups();
      this.load_products();
    }
    render() {
      const me = this;
      this.$el = $(`
			<section class="etv2-ws fk-sale">
				<div class="etv2-ws-toolbar fk-sale-toolbar">
					<div class="fk-search-box etv2-sale-search">
						<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
						<input type="text" placeholder="${__("Search products\u2026")}" />
					</div>
					<div class="fk-search-box etv2-sale-barcode" title="${__("Barcode scanner")}">
						<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 5V3h4v2H3zM9 5h2v14H9zM17 5h4v2h-4zM21 12h-2v5h2zM13 5h2v14h-2zM3 12h2v5H3zM17 17h4v2h-4zM7 17h2v2H7z"></path></svg>
						<input type="text" placeholder="${__("Scan barcode")}" autocomplete="off" />
					</div>
				</div>
				<div class="fk-sale-body">
					<div class="fk-panel fk-products">
						<div class="fk-panel-body">
							<div class="fk-cats etv2-cats"></div>
							<div class="fk-products-scroll">
								<div class="fk-products-grid etv2-products"></div>
							</div>
						</div>
					</div>
					<div class="fk-panel fk-order">
						<div class="fk-panel-body fk-order-body">
							<div class="fk-customer-section">
								<button class="fk-customer-btn etv2-sale-customer-btn" type="button">
									<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
									<span>${__("Customer")}: <b>${__("Walk-in")}</b></span>
								</button>
							</div>
							<div class="fk-cart-head">
								<div class="fk-cart-title-row">
									<span class="fk-cart-title">${__("Current Sale")}</span>
									<span class="fk-cart-count">0</span>
								</div>
							</div>
							<div class="fk-cart-list">
								<div class="fk-empty">
									<p class="fk-empty-title">${__("Cart is empty")}</p>
									<span>${__("Tap a product to add it.")}</span>
								</div>
							</div>
							<div class="fk-invoice">
								<div class="fk-row-line"><span>${__("Subtotal")}</span><span class="fk-subtotal">0.00</span></div>
								<div class="fk-row-line fk-discount-row"><span>${__("Discount")}</span><span class="fk-discount-value fk-row-discount">- 0.00</span></div>
								<div class="fk-divider"></div>
								<div class="fk-row-line fk-row-total"><span>${__("Total")}</span><span class="fk-grand">0.00</span></div>
							</div>
							<div class="fk-discount">
								<div class="fk-discount-mode-row">
									<button type="button" class="fk-discount-type-card active" data-mode="percentage">
										<span class="fk-dt-info"><span class="fk-dt-name">${__("Percentage")}</span></span>
										<span class="fk-dt-check"><svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"></path></svg></span>
									</button>
									<button type="button" class="fk-discount-type-card" data-mode="value">
										<span class="fk-dt-info"><span class="fk-dt-name">${__("Amount")}</span></span>
										<span class="fk-dt-check"><svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"></path></svg></span>
									</button>
								</div>
								<div class="fk-discount-input-row">
									<input type="number" class="fk-discount-input" placeholder="0" min="0" />
									<span class="fk-discount-value">- 0.00</span>
								</div>
							</div>
							<div class="fk-cart-actions">
								<button type="button" class="fk-action fk-print-invoice-btn" title="${__("Save draft and print invoice")}">
									<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9V2h12v7"></path><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
									<span class="fk-action-name">${__("Print Invoice")}</span>
								</button>
								<button type="button" class="fk-action fk-print-receipt-btn" title="${__("Save draft and print receipt")}">
									<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2h12v20l-3-2-3 2-3-2-3 2V2z"></path><line x1="9" y1="8" x2="15" y2="8"></line><line x1="9" y1="12" x2="15" y2="12"></line></svg>
									<span class="fk-action-name">${__("Print Receipt")}</span>
								</button>
								<button type="button" class="fk-action fk-hold-btn" title="${__("Hold the order")}">
									<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
									<span class="fk-action-name">${__("Hold")}</span>
								</button>
							</div>
							<button type="button" class="fk-checkin-btn etv2-checkin-btn">
								${__("Checkin")}<span class="fk-checkin-total fk-grand">0.00</span>
							</button>
						</div>
					</div>
				</div>
			</section>
		`);
      let searchTimer;
      this.$el.find(".etv2-sale-search input").on("input", (e) => {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => this.load_products($(e.currentTarget).val()), 250);
      });
      this.$el.find(".etv2-sale-barcode input").on("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          const code = $(e.currentTarget).val().trim();
          if (code)
            this.scan_barcode(code);
        }
      });
      this.$el.on("click", ".fk-cat-chip", (e) => {
        const $chip = $(e.currentTarget);
        this.$el.find(".fk-cat-chip").removeClass("active");
        $chip.addClass("active");
        this.active_item_group = $chip.attr("data-group");
        this.load_products(this.$el.find(".etv2-sale-search input").val());
      });
      this.$el.on("click", ".fk-product-card", (e) => {
        const item = this.items.find((i) => i.item_code === $(e.currentTarget).attr("data-code"));
        if (item) {
          this.add_to_cart(item);
          frappe.utils.play_sound("submit");
        }
      });
      this.$el.on("click", ".fk-qty-btn-plus", (e) => this.change_qty($(e.currentTarget).attr("data-code"), 1));
      this.$el.on("click", ".fk-qty-btn-minus", (e) => this.change_qty($(e.currentTarget).attr("data-code"), -1));
      this.$el.on("click", ".fk-ci-eye", (e) => {
        const code = $(e.currentTarget).attr("data-code");
        const item = this.items.find((i) => i.item_code === code) || this.cart[code];
        if (item)
          this.open_item_details(item, { mode: "update" });
      });
      this.$el.find(".etv2-sale-customer-btn").on("click", () => this.select_customer());
      this.$el.find(".fk-hold-btn").on("click", () => this.hold_order());
      this.$el.find(".etv2-checkin-btn").on("click", () => this.checkout());
      this.$el.find(".fk-print-invoice-btn").on("click", () => this.save_and_print("EIMS Invoice"));
      this.$el.find(".fk-print-receipt-btn").on("click", () => this.save_and_print("EIMS POS Receipt"));
      this.$el.on("click", ".fk-discount-type-card", (e) => {
        const $card = $(e.currentTarget);
        this.discount_mode = $card.attr("data-mode");
        this.discount_value = 0;
        this.$el.find(".fk-discount-type-card").removeClass("active");
        $card.addClass("active");
        this.$el.find(".fk-discount-input").val("");
        this.render_cart();
      });
      let discountTimer;
      this.$el.find(".fk-discount-input").on("input", (e) => {
        clearTimeout(discountTimer);
        discountTimer = setTimeout(() => {
          let value = flt($(e.currentTarget).val()) || 0;
          if (this.discount_mode === "percentage" && value > 100) {
            frappe.msgprint({
              title: __("Invalid Discount"),
              indicator: "red",
              message: __("Discount cannot be greater than 100%.")
            });
            value = 0;
            $(e.currentTarget).val("");
          }
          this.discount_value = Math.max(0, value);
          this.render_cart();
        }, 200);
      });
      return this.$el;
    }
    load_item_groups() {
      const pv = this.shell.get_pv();
      frappe.call({
        method: `${pv}.item_group_query`,
        args: {
          doctype: "Item Group",
          txt: "",
          searchfield: "name",
          start: 0,
          page_len: 200,
          filters: { pos_profile: this.shell.pos_profile }
        }
      }).then((r) => {
        this.item_groups = (r.message || []).map((row) => row[0]);
        const $cats = this.$el.find(".etv2-cats");
        $cats.html(
          `<button class="fk-cat-chip active" data-group="">${__("All")}</button>` + this.item_groups.map((g) => `<button class="fk-cat-chip" data-group="${frappe.utils.escape_html(g)}">${frappe.utils.escape_html(g)}</button>`).join("")
        );
      });
    }
    load_products(search_term = "") {
      const pv = this.shell.get_pv();
      frappe.call({
        method: `${pv}.get_items`,
        args: {
          start: 0,
          page_length: 200,
          price_list: this.shell.price_list,
          item_group: this.active_item_group || this.shell.parent_item_group,
          pos_profile: this.shell.pos_profile,
          search_term
        }
      }).then((r) => {
        const data = r.message || { items: [] };
        this.items = data.items || [];
        this.warehouse = data.warehouse;
        this.render_products();
      });
    }
    render_products() {
      const $grid = this.$el.find(".etv2-products");
      if (!this.items.length) {
        $grid.html(
          `<div class="fk-empty" style="grid-column:1/-1;"><p class="fk-empty-title">${__("No products found.")}</p></div>`
        );
        return;
      }
      $grid.html(
        this.items.map((i) => {
          const img = i.item_image ? `<img src="${i.item_image}" onerror="this.outerHTML = etv2_ph(${JSON.stringify(i.item_name)})" />` : `<div class="fk-product-img-ph">${frappe.utils.escape_html((i.item_name || i.item_code || "?").slice(0, 1).toUpperCase())}</div>`;
          const is_new = i.is_new;
          const has_original = flt(i.price_list_rate || 0) > 0 && flt(i.standard_rate || 0) > flt(i.price_list_rate || 0);
          return `
					<div class="fk-product-card" data-code="${frappe.utils.escape_html(i.item_code)}">
						<div class="fk-product-media">
							${img}
							${is_new ? `<span class="fk-product-badge-new">${__("NEW")}</span>` : ""}
						</div>
						<div class="fk-product-name">${frappe.utils.escape_html(i.item_name || i.item_code)}</div>
						<div class="fk-product-price">
							<span class="selling-price">${format_currency(i.price_list_rate || 0, i.currency)}</span>
							${has_original ? `<span class="original-price">${format_currency(i.standard_rate, i.currency)}</span>` : ""}
						</div>
						<div class="fk-product-stock">${__("Stock")}: ${flt(i.actual_qty || 0)}</div>
					</div>`;
        }).join("")
      );
    }
    open_item_details(item, opts = {}) {
      var _a, _b;
      const me = this;
      const key = item.item_code;
      const in_cart = this.cart[key];
      const is_update = Boolean(in_cart);
      const full = this.items.find((i) => i.item_code === key) || item;
      const currency = full.currency || frappe.boot.sysdefaults.currency;
      const allow_rate_change = parseInt((_a = this.shell.settings.allow_rate_change) != null ? _a : 1, 10) !== 0;
      const allow_discount_change = parseInt((_b = this.shell.settings.allow_discount_change) != null ? _b : 1, 10) !== 0;
      const default_qty = is_update ? in_cart.qty : 1;
      const default_uom = is_update ? in_cart.uom : full.uom || full.stock_uom || full.sales_uom;
      const default_cf = is_update ? in_cart.conversion_factor : 1;
      const default_rate = is_update ? in_cart.rate : full.price_list_rate || 0;
      const default_discount = is_update ? in_cart.discount_percentage || 0 : 0;
      const default_wh = is_update ? in_cart.warehouse : this.warehouse;
      const dialog = new frappe.ui.Dialog({
        title: __("Item Details"),
        fields: [{ fieldtype: "HTML", fieldname: "body" }],
        primary_action_label: is_update ? __("Update Cart") : __("Add to Cart"),
        primary_action: async () => {
          const qty = flt(controls.qty.get_value()) || 0;
          const row = this.cart[key] || this.cart_item_from(full);
          const wh = controls.warehouse.get_value() || this.warehouse;
          if (qty > 0 && !await me.check_stock(row, qty, wh))
            return;
          if (qty <= 0) {
            delete this.cart[key];
          } else {
            row.qty = qty;
            row.uom = controls.uom.get_value() || row.uom;
            row.conversion_factor = flt(controls.conversion_factor.get_value()) || 1;
            row.rate = flt(controls.rate.get_value()) || 0;
            row.discount_percentage = flt(controls.discount_percentage.get_value()) || 0;
            row.price_list_rate = flt(controls.price_list_rate.get_value()) || row.price_list_rate || 0;
            row.warehouse = wh;
            this.cart[key] = row;
          }
          dialog.hide();
          this.render_cart();
          frappe.show_alert({
            message: __("Cart updated \xB7 {0} \xD7 {1}", [qty, full.item_name]),
            indicator: "green"
          });
        }
      });
      dialog.$wrapper.addClass("fk-item-dialog");
      const img = full.item_image ? `<img class="etv2-id-img" src="${full.item_image}" onerror="this.outerHTML = etv2_ph_big(${JSON.stringify(full.item_name)})" />` : etv2_ph_big(full.item_name || full.item_code || "?");
      dialog.fields_dict.body.$wrapper.html(`
			<div class="etv2-item-dialog">
				<div class="etv2-id-media">${img}</div>
				<div class="etv2-id-name">${frappe.utils.escape_html(full.item_name || full.item_code)}</div>
				<div class="etv2-id-code">${frappe.utils.escape_html(full.item_code)}</div>
				<div class="etv2-id-stock ${flt(in_cart ? in_cart.actual_qty : full.actual_qty || 0) <= 0 ? "etv2-id-stock-out" : ""}">
					${__("Stock")}: ${flt(in_cart ? in_cart.actual_qty : full.actual_qty || 0)}
				</div>
				<div class="etv2-id-price">${format_currency(full.price_list_rate || 0, currency)}</div>
				${in_cart ? `<div class="etv2-id-in-cart">${__("In cart")}: ${in_cart.qty}</div>` : ""}
				<div class="fk-item-detail-form"></div>
			</div>
		`);
      const $form = dialog.fields_dict.body.$wrapper.find(".fk-item-detail-form");
      const controls = {};
      const field_df = {
        qty: { fieldtype: "Float", label: __("Quantity"), reqd: 1 },
        uom: {
          fieldtype: "Link",
          options: "UOM",
          label: __("UOM"),
          get_query: () => ({
            query: "erpnext.controllers.queries.get_item_uom_query",
            filters: { item_code: key }
          })
        },
        conversion_factor: { fieldtype: "Float", label: __("Conversion Factor") },
        rate: { fieldtype: "Currency", options: currency, label: __("Rate"), read_only: !allow_rate_change },
        discount_percentage: {
          fieldtype: "Percent",
          label: __("Discount (%)"),
          read_only: !allow_discount_change
        },
        warehouse: {
          fieldtype: "Link",
          options: "Warehouse",
          label: __("Warehouse"),
          reqd: 1,
          get_query: () => ({
            filters: { company: this.shell.company, is_group: 0 }
          })
        },
        actual_qty: { fieldtype: "Float", label: __("Available Qty"), read_only: 1 },
        price_list_rate: { fieldtype: "Currency", options: currency, label: __("Price List Rate"), read_only: 1 }
      };
      Object.keys(field_df).forEach((fieldname) => {
        $form.append(`<div class="fk-idf-${fieldname}" data-fieldname="${fieldname}"></div>`);
        const ctrl = frappe.ui.form.make_control({
          df: __spreadProps(__spreadValues({}, field_df[fieldname]), {
            fieldname,
            onchange: () => me.form_updated(fieldname, ctrl, controls, full)
          }),
          parent: $form.find(`.fk-idf-${fieldname}`),
          render_input: true
        });
        controls[fieldname] = ctrl;
      });
      controls.qty.set_value(default_qty);
      controls.uom.set_value(default_uom);
      controls.conversion_factor.set_value(default_cf);
      controls.conversion_factor.df.read_only = (default_uom || full.stock_uom) === full.stock_uom;
      controls.conversion_factor.refresh();
      controls.rate.set_value(default_rate);
      controls.discount_percentage.set_value(default_discount);
      controls.warehouse.set_value(default_wh);
      controls.actual_qty.set_value(is_update ? in_cart.actual_qty : full.actual_qty || 0);
      controls.price_list_rate.set_value(full.price_list_rate || 0);
      dialog.show();
    }
    form_updated(fieldname, ctrl, controls, item) {
      const pv = this.shell.get_pv();
      if (fieldname === "discount_percentage") {
        let value = flt(ctrl.get_value()) || 0;
        if (value < 0)
          value = 0;
        if (value > 100)
          value = 100;
        ctrl.set_value(value);
        const base = flt(controls.price_list_rate.get_value()) || 0;
        controls.rate.set_value(flt(base * (1 - value / 100), 2));
      }
      if (fieldname === "uom") {
        frappe.call({
          method: `${pv}.get_uom_conversion_factor`,
          args: { item_code: item.item_code, uom: ctrl.get_value() }
        }).then((r) => {
          const cf = r.message && r.message.conversion_factor || 1;
          controls.conversion_factor.set_value(cf);
          controls.conversion_factor.df.read_only = ctrl.get_value() === item.stock_uom;
          controls.conversion_factor.refresh();
        });
      }
      if (fieldname === "warehouse") {
        const warehouse = ctrl.get_value();
        if (!warehouse)
          return;
        frappe.call({
          method: `${pv}.get_warehouse_stock`,
          args: { item_code: item.item_code, warehouse }
        }).then((r) => {
          const d = r.message || {};
          const available_qty = flt(d.actual_qty);
          controls.actual_qty.set_value(available_qty);
          if (available_qty === 0 && d.is_stock_item) {
            ctrl.set_value("");
            frappe.show_alert({
              message: __("Item {0} is not available under warehouse {1}.", [
                item.item_code.bold(),
                warehouse.bold()
              ]),
              indicator: "orange"
            });
          }
        });
      }
    }
    cart_item_from(item) {
      return {
        item_code: item.item_code,
        item_name: item.item_name || item.item_code,
        rate: item.price_list_rate || 0,
        price_list_rate: item.price_list_rate || 0,
        discount_percentage: 0,
        uom: item.uom || item.stock_uom || item.sales_uom,
        conversion_factor: 1,
        currency: item.currency,
        qty: 1,
        warehouse: this.warehouse,
        actual_qty: item.actual_qty || 0,
        is_stock_item: item.is_stock_item,
        stock_uom: item.stock_uom
      };
    }
    scan_barcode(code) {
      const me = this;
      const pv = this.shell.get_pv();
      frappe.call({
        method: `${pv}.get_item_by_barcode`,
        args: { barcode: code, price_list: this.shell.price_list, pos_profile: this.shell.pos_profile }
      }).then((r) => {
        const item = r.message || {};
        if (!item.item_code) {
          frappe.show_alert({ message: __("No product found for barcode: {0}", [code]), indicator: "orange" });
          return;
        }
        this.add_to_cart(item);
        this.$el.find(".etv2-sale-barcode input").val("");
        frappe.show_alert({ message: __("Scanned {0}", [item.item_name]), indicator: "green" });
      });
    }
    async add_to_cart(item, qty) {
      const key = item.item_code;
      qty = flt(qty) || 1;
      const row = this.cart[key] || this.cart_item_from(item);
      const wh = row.warehouse || this.warehouse;
      if (!await this.check_stock(item, qty, wh))
        return;
      row.qty = flt(row.qty || 0) + qty;
      row.actual_qty = item.actual_qty;
      this.cart[key] = row;
      this.render_cart();
    }
    async change_qty(item_code, delta) {
      if (!this.cart[item_code])
        return;
      const row = this.cart[item_code];
      const next = flt(row.qty || 0) + flt(delta);
      const wh = row.warehouse || this.warehouse;
      if (next > row.qty && !await this.check_stock(row, next - row.qty, wh))
        return;
      row.qty = Math.max(0, next);
      if (row.qty <= 0)
        delete this.cart[item_code];
      this.render_cart();
    }
    async check_stock(item, qty_needed, warehouse) {
      if (!item || !item.item_code)
        return true;
      const r = await frappe.call({
        method: "erpnext.accounts.doctype.pos_invoice.pos_invoice.get_stock_availability",
        args: { item_code: item.item_code, warehouse }
      });
      const resp = r.message || [0, 1, 0];
      const available = flt(resp[0]);
      const is_stock_item = resp[1];
      const allow_negative = flt(resp[2]);
      if (allow_negative || !is_stock_item)
        return true;
      if (available <= 0) {
        frappe.show_alert({
          message: __("Item {0} is not available under warehouse {1}.", [
            item.item_code.bold(),
            (warehouse || "\u2014").bold()
          ]),
          indicator: "orange"
        });
        frappe.utils.play_sound("error");
        return false;
      }
      if (available < qty_needed) {
        frappe.show_alert({
          message: __(
            "Stock quantity not enough for Item Code: {0} under warehouse {1}. Available quantity {2} {3}.",
            [
              item.item_code.bold(),
              (warehouse || "\u2014").bold(),
              available,
              (item.stock_uom || "").bold()
            ]
          ),
          indicator: "orange"
        });
        frappe.utils.play_sound("error");
        return false;
      }
      return true;
    }
    cart_subtotal() {
      return Object.keys(this.cart).reduce((s, k) => s + this.cart[k].rate * this.cart[k].qty, 0);
    }
    cart_discount() {
      const subtotal = this.cart_subtotal();
      if (this.discount_mode === "percentage") {
        return subtotal * flt(this.discount_value || 0) / 100;
      }
      return Math.min(flt(this.discount_value || 0), subtotal);
    }
    cart_total() {
      return this.cart_subtotal() - this.cart_discount();
    }
    render_cart() {
      const $list = this.$el.find(".fk-cart-list");
      const keys = Object.keys(this.cart);
      const count = keys.reduce((sum, k) => sum + this.cart[k].qty, 0);
      this.$el.find(".fk-cart-count").text(count);
      if (!keys.length) {
        $list.html(
          `<div class="fk-empty"><p class="fk-empty-title">${__("Cart is empty")}</p><span>${__("Tap a product to add it.")}</span></div>`
        );
      } else {
        $list.html(
          keys.map((k) => {
            const c = this.cart[k];
            return `
						<div class="fk-cart-item">
							<div class="fk-cart-item-row">
								<div class="fk-cart-item-name" title="${frappe.utils.escape_html(c.item_name)}">
									${frappe.utils.escape_html(c.item_name)}
									<button class="fk-ci-eye" data-code="${frappe.utils.escape_html(k)}" type="button" title="${__("View item details")}">
										<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
									</button>
								</div>
								<div class="fk-qty-box">
									<button class="fk-qty-btn fk-qty-btn-minus" data-code="${frappe.utils.escape_html(k)}" type="button">\u2212</button>
									<span class="fk-qty-value">${c.qty}</span>
									<button class="fk-qty-btn fk-qty-btn-plus" data-code="${frappe.utils.escape_html(k)}" type="button">+</button>
								</div>
								<div class="fk-cart-item-price">${format_currency(c.rate, c.currency)}</div>
								<div class="fk-cart-item-total">${format_currency(c.rate * c.qty, c.currency)}</div>
							</div>
						</div>`;
          }).join("")
        );
      }
      const subtotal = this.cart_subtotal();
      const discount = this.cart_discount();
      this.$el.find(".fk-subtotal").text(format_currency(subtotal));
      this.$el.find(".fk-row-discount").text(`- ${format_currency(discount)}`);
      this.$el.find(".fk-discount-input-row .fk-discount-value").text(`- ${format_currency(discount)}`);
      this.$el.find(".fk-grand").text(format_currency(subtotal - discount));
    }
    select_customer() {
      const me = this;
      const dialog = new frappe.ui.Dialog({
        title: __("Select Customer"),
        fields: [{ fieldtype: "HTML", fieldname: "body" }],
        primary_action_label: __("Walk-in"),
        primary_action: () => {
          me.customer = null;
          me.$el.find(".etv2-sale-customer-btn span").html(`${__("Customer")}: <b>${__("Walk-in")}</b>`);
          dialog.hide();
        }
      });
      dialog.$wrapper.addClass("fk-customer-picker");
      const $body = dialog.fields_dict.body.$wrapper;
      $body.addClass("etv2-customer-picker");
      $body.html(`
			<div class="fk-search-box etv2-customer-picker-search">
				<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
				<input type="text" placeholder="${__("Search customers\u2026")}" />
			</div>
			<div class="etv2-customer-picker-list"></div>
		`);
      const load = (term = "") => {
        const pv = this.shell.get_pv();
        frappe.call({
          method: `${pv}.get_customers`,
          args: { search_term: term, limit: 50 }
        }).then((r) => {
          let rows = r.message || [];
          if (this.shell.customer_groups.length) {
            rows = rows.filter((c) => this.shell.customer_groups.includes(c.customer_group));
          }
          const $list = $body.find(".etv2-customer-picker-list");
          if (!rows.length) {
            $list.html(`<div class="etv2-empty">${__("No customers found.")}</div>`);
            return;
          }
          $list.html(
            rows.map((c) => `
						<div class="etv2-customer-picker-row" data-name="${frappe.utils.escape_html(c.name)}">
							<div class="etv2-customer-avatar">
								${c.image ? `<img src="${c.image}" onerror="this.remove()" />` : frappe.utils.escape_html((c.customer_name || c.name).slice(0, 1).toUpperCase())}
							</div>
							<div class="etv2-customer-picker-info">
								<div class="etv2-customer-picker-name">${frappe.utils.escape_html(c.customer_name || c.name)}</div>
								<div class="etv2-customer-picker-sub">${frappe.utils.escape_html(c.mobile_no || c.customer_group || "")}</div>
							</div>
						</div>`).join("")
          );
        });
      };
      let timer;
      $body.on("input", ".etv2-customer-picker-search input", (e) => {
        clearTimeout(timer);
        timer = setTimeout(() => load($(e.currentTarget).val()), 250);
      });
      $body.on("click", ".etv2-customer-picker-row", (e) => {
        const name = $(e.currentTarget).attr("data-name");
        frappe.db.get_value("Customer", name, ["customer_name"]).then(({ message }) => {
          me.customer = name;
          me.$el.find(".etv2-sale-customer-btn span").html(`${__("Customer")}: <b>${frappe.utils.escape_html(message && message.customer_name || name)}</b>`);
          dialog.hide();
        });
      });
      load();
      dialog.show();
    }
    build_order_doc() {
      const default_customer = this.customer || this.shell.settings && this.shell.settings.customer || null;
      if (!default_customer) {
        frappe.show_alert({ message: __("Select a customer before checkout."), indicator: "orange" });
        return null;
      }
      if (!Object.keys(this.cart).length) {
        frappe.show_alert({ message: __("Cart is empty."), indicator: "orange" });
        return null;
      }
      const doc = {
        doctype: "POS Invoice",
        is_pos: 1,
        docstatus: 0,
        company: this.shell.company,
        pos_profile: this.shell.pos_profile,
        customer: default_customer,
        set_warehouse: this.shell.warehouse,
        currency: frappe.boot.sysdefaults.currency,
        posting_date: frappe.datetime.now_date(),
        posting_time: frappe.datetime.now_time(),
        items: Object.keys(this.cart).map((k) => {
          const c = this.cart[k];
          return {
            item_code: c.item_code,
            qty: c.qty,
            rate: c.rate,
            uom: c.uom,
            conversion_factor: c.conversion_factor || 1,
            discount_percentage: c.discount_percentage || 0,
            price_list_rate: c.price_list_rate || c.rate,
            warehouse: c.warehouse || this.shell.warehouse
          };
        })
      };
      if (this.discount_value > 0) {
        doc.apply_discount_on = "Grand Total";
        if (this.discount_mode === "percentage") {
          doc.additional_discount_percentage = flt(this.discount_value);
        } else {
          doc.discount_amount = flt(this.discount_value);
        }
      }
      return doc;
    }
    hold_order() {
      const doc = this.build_order_doc();
      if (!doc)
        return;
      const pv = this.shell.get_pv();
      frappe.call({
        method: `${pv}.save_held_order`,
        args: { doc },
        freeze: true
      }).then((r) => {
        if (r.message && r.message.status === "ok") {
          frappe.show_alert({ message: __("Order held: {0}", [r.message.invoice_name]), indicator: "blue" });
          this.cart = {};
          this.discount_value = 0;
          this.render_cart();
        }
      });
    }
    save_and_print(print_format) {
      if (!Object.keys(this.cart).length) {
        frappe.show_alert({ message: __("You must add at least one item to print."), indicator: "orange" });
        frappe.utils.play_sound("error");
        return;
      }
      const doc = this.build_order_doc();
      if (!doc)
        return;
      const pv = this.shell.get_pv();
      frappe.call({
        method: `${pv}.save_held_order`,
        args: { doc },
        freeze: true
      }).then((r) => {
        if (r.message && r.message.status === "ok") {
          frappe.utils.print("POS Invoice", r.message.invoice_name, print_format, "", frappe.boot.lang);
        }
      });
    }
    checkout() {
      const doc = this.build_order_doc();
      if (!doc)
        return;
      const me = this;
      const total = this.cart_total();
      const modes = (this.shell.settings.payments || []).map((p) => p.mode_of_payment);
      const default_mode = modes[0] || "Cash";
      let selected_mode = default_mode;
      let quick_pay = this.quick_pay_amounts(total);
      const dialog = new frappe.ui.Dialog({
        title: __("Checkout"),
        fields: [{ fieldtype: "HTML", fieldname: "body" }],
        primary_action_label: __("Charge"),
        primary_action: () => {
          const amount_received = flt(dialog.fields_dict.body.$wrapper.find(".fk-amount-input").val()) || 0;
          if (amount_received < total) {
            frappe.show_alert({ message: __("Amount received is less than total."), indicator: "orange" });
            return;
          }
          doc.payments = [{ mode_of_payment: selected_mode, amount: total }];
          const pv = this.shell.get_pv();
          frappe.call({
            method: `${pv}.save_held_order`,
            args: { doc },
            freeze: true
          }).then((r) => {
            if (r.message && r.message.status === "ok") {
              frappe.call({ method: `${pv}.submit_invoice`, args: { name: r.message.invoice_name } }).then((res) => {
                if (res.message && res.message.status === "ok") {
                  const change = flt(amount_received) - total;
                  dialog.hide();
                  frappe.show_alert({
                    message: __("Invoice {0} submitted \xB7 change {1}", [res.message.invoice_name, format_currency(change)]),
                    indicator: "green"
                  });
                  this.cart = {};
                  this.customer = null;
                  this.discount_value = 0;
                  this.$el.find(".etv2-sale-customer-btn span").html(`${__("Customer")}: <b>${__("Walk-in")}</b>`);
                  this.$el.find(".fk-discount-input").val("");
                  this.render_cart();
                  this.after_sale_actions(res.message.invoice_name, change);
                }
              });
            }
          });
        }
      });
      dialog.$wrapper.addClass("fk-pay-dialog");
      const $body = dialog.fields_dict.body.$wrapper;
      $body.html(`
			<div class="fk-pay-layout">
				<div class="fk-pay-finalize">
					<div class="fk-pay-title">${__("Finalize Payment")}</div>
					<div>
						<div class="fk-pay-section-title">${__("Payment Mode")}</div>
						<div class="fk-pay-modes">
							${(modes.length ? modes : [default_mode]).map((m) => `
									<div class="fk-pay-mode ${m === selected_mode ? "active" : ""}" data-mode="${frappe.utils.escape_html(m)}">
										<span class="fk-pm-info"><span class="fk-pm-name">${frappe.utils.escape_html(m)}</span></span>
										<span class="fk-pm-check"><svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"></path></svg></span>
									</div>`).join("")}
						</div>
					</div>
					<div>
						<div class="fk-pay-section-title">${__("Amount Received")}</div>
						<div class="fk-pay-amount-row">
							<div class="fk-pay-input">
								<span>ETB</span>
								<input type="number" class="fk-amount-input" value="${total}" min="0" />
							</div>
						</div>
					</div>
					<div>
						<div class="fk-pay-section-title">${__("Numeric Keypad")}</div>
						<div class="fk-keypad-grid fk-keypad"></div>
						<button type="button" class="fk-calculator-open-btn fk-calculator-btn">
							<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"></rect><line x1="8" y1="6" x2="16" y2="6"></line><line x1="8" y1="11" x2="8" y2="11"></line><line x1="12" y1="11" x2="12" y2="11"></line><line x1="16" y1="11" x2="16" y2="11"></line><line x1="8" y1="15" x2="8" y2="15"></line><line x1="12" y1="15" x2="12" y2="15"></line><line x1="16" y1="15" x2="16" y2="15"></line><line x1="8" y1="19" x2="8" y2="19"></line><line x1="12" y1="19" x2="12" y2="19"></line><line x1="16" y1="19" x2="16" y2="19"></line></svg>
							${__("Calculator")}
						</button>
					</div>
					<div>
						<div class="fk-pay-section-title">${__("Quick Pay")}</div>
						<div class="fk-quick-pay-grid fk-quick-pay"></div>
					</div>
				</div>
				<div class="fk-pay-summary">
					<div class="fk-summary-rows">
						<div class="fk-summary-row"><span class="fk-sr-title">${__("Total Products")}</span><span class="fk-sr-value fk-sum-count">0</span></div>
						<div class="fk-summary-row"><span class="fk-sr-title">${__("Sub Total")}</span><span class="fk-sr-value fk-sum-subtotal">0.00</span></div>
						<div class="fk-summary-row"><span class="fk-sr-title">${__("Discount")}</span><span class="fk-sr-value fk-sum-discount">0.00</span></div>
						<div class="fk-summary-row fk-sr-grand"><span class="fk-sr-title">${__("Grand Total")}</span><span class="fk-sr-value fk-sum-grand">0.00</span></div>
						<div class="fk-summary-row"><span class="fk-sr-title">${__("Amount Received")}</span><span class="fk-sr-value fk-sum-received">0.00</span></div>
						<div class="fk-summary-row fk-sr-change"><span class="fk-sr-title">${__("Change Return")}</span><span class="fk-sr-value fk-sum-change">0.00</span></div>
					</div>
					<div class="fk-pay-footer">
						<div class="fk-pay-footer-btns">
							<button type="button" class="fk-btn-cancel fk-pay-cancel-btn">${__("Cancel")}</button>
							<button type="button" class="fk-btn-charge fk-charge-btn">${__("Charge")}</button>
						</div>
						<button type="button" class="fk-btn-charge-print fk-charge-print-btn">
							${__("Charge & Print Invoice")}
						</button>
					</div>
				</div>
			</div>
		`);
      $body.on("click", ".fk-pay-mode", (e) => {
        selected_mode = $(e.currentTarget).attr("data-mode");
        $body.find(".fk-pay-mode").removeClass("active");
        $(e.currentTarget).addClass("active");
      });
      const $sum = {
        count: $body.find(".fk-sum-count"),
        subtotal: $body.find(".fk-sum-subtotal"),
        discount: $body.find(".fk-sum-discount"),
        grand: $body.find(".fk-sum-grand"),
        received: $body.find(".fk-sum-received"),
        change: $body.find(".fk-sum-change")
      };
      const count = Object.keys(this.cart).reduce((s, k) => s + this.cart[k].qty, 0);
      const subtotal = this.cart_subtotal();
      const discount = this.cart_discount();
      $sum.count.text(count);
      $sum.subtotal.text(format_currency(subtotal));
      $sum.discount.text(`- ${format_currency(discount)}`);
      $sum.grand.text(format_currency(total));
      const render_summary = () => {
        const recv = flt($body.find(".fk-amount-input").val()) || 0;
        const change = recv - total;
        $sum.received.text(format_currency(recv));
        $sum.change.text(format_currency(Math.max(change, 0)));
        $sum.change.toggleClass("fk-sr-neg", change < 0);
      };
      const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "C"];
      $body.find(".fk-keypad").html(
        keys.map(
          (k) => `
						<button type="button" class="fk-pad-btn ${k === "C" ? "fk-pad-clear" : ""}" data-key="${k === "." ? "dot" : k}">${k}</button>`
        ).join("")
      );
      $body.on("click", ".fk-pad-btn", (e) => {
        const k = $(e.currentTarget).attr("data-key");
        const $input = $body.find(".fk-amount-input");
        let val = $input.val();
        if (k === "C") {
          $input.val(total);
        } else if (k === "dot") {
          if (!String(val).includes("."))
            $input.val(val === "" ? "0." : val + ".");
        } else {
          $input.val(val === "" ? k : String(val) + k);
        }
        render_summary();
      });
      $body.find(".fk-quick-pay").html(
        quick_pay.map((amt) => `<button type="button" class="fk-quick-pay-btn" data-amt="${amt}">+ ${format_currency(amt)}</button>`).join("")
      );
      $body.on("click", ".fk-quick-pay-btn", (e) => {
        $body.find(".fk-amount-input").val($(e.currentTarget).attr("data-amt"));
        render_summary();
      });
      $body.find(".fk-amount-input").on("input", render_summary);
      render_summary();
      $body.find(".fk-calculator-btn").on("click", () => {
        this.open_calculator(total, (value) => {
          $body.find(".fk-amount-input").val(flt(value));
          render_summary();
        });
      });
      const do_charge = (with_print) => {
        const amount_received = flt($body.find(".fk-amount-input").val()) || 0;
        if (amount_received < total) {
          frappe.show_alert({ message: __("Amount received is less than total."), indicator: "orange" });
          return;
        }
        doc.payments = [{ mode_of_payment: selected_mode, amount: total }];
        const pv = this.shell.get_pv();
        frappe.call({
          method: `${pv}.save_held_order`,
          args: { doc },
          freeze: true
        }).then((r) => {
          if (r.message && r.message.status === "ok") {
            frappe.call({ method: `${pv}.submit_invoice`, args: { name: r.message.invoice_name } }).then((res) => {
              if (res.message && res.message.status === "ok") {
                const change = flt(amount_received) - total;
                dialog.hide();
                frappe.show_alert({
                  message: __("Invoice {0} submitted \xB7 change {1}", [res.message.invoice_name, format_currency(change)]),
                  indicator: "green"
                });
                this.cart = {};
                this.customer = null;
                this.discount_value = 0;
                this.$el.find(".etv2-sale-customer-btn span").html(`${__("Customer")}: <b>${__("Walk-in")}</b>`);
                this.$el.find(".fk-discount-input").val("");
                this.render_cart();
                if (with_print) {
                  this.print_invoice(res.message.invoice_name);
                } else {
                  this.after_sale_actions(res.message.invoice_name, change);
                }
              }
            });
          }
        });
      };
      $body.find(".fk-charge-btn").on("click", () => do_charge(false));
      $body.find(".fk-charge-print-btn").on("click", () => do_charge(true));
      $body.find(".fk-pay-cancel-btn").on("click", () => dialog.hide());
      dialog.show();
    }
    open_calculator(initial, on_apply) {
      const dialog = new frappe.ui.Dialog({
        title: __("Calculator"),
        fields: [{ fieldtype: "HTML", fieldname: "body" }],
        primary_action_label: __("OK"),
        primary_action: () => {
          const res = dialog.fields_dict.body.$wrapper.find(".fk-calc-preview").text();
          const parsed = parseFloat(String(res).replace(/[^\d.-]/g, ""));
          if (!isNaN(parsed))
            on_apply(parsed);
          dialog.hide();
        }
      });
      dialog.$wrapper.addClass("fk-calc-dialog");
      dialog.fields_dict.body.$wrapper.addClass("fk-calc-card");
      const $w = dialog.fields_dict.body.$wrapper;
      $w.html(`
			<div class="fk-calc-content">
				<div class="fk-calc-display">
					<div class="fk-calc-expression"></div>
					<div class="fk-calc-preview">${initial || 0}</div>
				</div>
				<div class="fk-calc-grid">
					<button type="button" class="fk-calc-btn fk-calc-clear" data-k="C">C</button>
					<button type="button" class="fk-calc-btn fk-calc-op" data-k="/">\xF7</button>
					<button type="button" class="fk-calc-btn fk-calc-op" data-k="*">\xD7</button>
					<button type="button" class="fk-calc-btn fk-calc-clear" data-k="back">\u232B</button>
					<button type="button" class="fk-calc-btn" data-k="7">7</button>
					<button type="button" class="fk-calc-btn" data-k="8">8</button>
					<button type="button" class="fk-calc-btn" data-k="9">9</button>
					<button type="button" class="fk-calc-btn fk-calc-op" data-k="-">\u2212</button>
					<button type="button" class="fk-calc-btn" data-k="4">4</button>
					<button type="button" class="fk-calc-btn" data-k="5">5</button>
					<button type="button" class="fk-calc-btn" data-k="6">6</button>
					<button type="button" class="fk-calc-btn fk-calc-op" data-k="+">+</button>
					<button type="button" class="fk-calc-btn" data-k="1">1</button>
					<button type="button" class="fk-calc-btn" data-k="2">2</button>
					<button type="button" class="fk-calc-btn" data-k="3">3</button>
					<button type="button" class="fk-calc-btn fk-calc-op" data-k="=">=</button>
					<button type="button" class="fk-calc-btn" data-k="0">0</button>
					<button type="button" class="fk-calc-btn" data-k=".">.</button>
					<button type="button" class="fk-calc-btn fk-calc-op" data-k="00">00</button>
				</div>
			</div>
			<div class="fk-calc-actions">
				<button type="button" class="fk-calc-cancel-btn">${__("Cancel")}</button>
				<button type="button" class="fk-calc-apply-btn">${__("Apply")}</button>
			</div>
		`);
      let expr = String(initial || 0);
      const $expr = $w.find(".fk-calc-expression");
      const $preview = $w.find(".fk-calc-preview");
      const update = () => {
        $preview.text(expr || "0");
      };
      const compute = (e) => {
        try {
          const r = Function(`"use strict"; return (${e})`)();
          return isNaN(r) ? null : r;
        } catch (err) {
          return null;
        }
      };
      $w.on("click", ".fk-calc-btn", (e) => {
        const k = $(e.currentTarget).attr("data-k");
        if (k === "C") {
          expr = "0";
        } else if (k === "back") {
          expr = expr.length > 1 ? expr.slice(0, -1) : "0";
        } else if (k === "=") {
          const r = compute(expr);
          if (r !== null) {
            $expr.text(`${expr} =`);
            expr = String(round(r, 2));
          }
        } else if (["+", "-", "*", "/"].includes(k)) {
          expr = expr + k;
        } else {
          expr = expr === "0" ? k : expr + k;
        }
        update();
      });
      $w.find(".fk-calc-apply-btn").on("click", () => {
        const r = compute(expr);
        if (r !== null)
          on_apply(round(r, 2));
        dialog.hide();
      });
      $w.find(".fk-calc-cancel-btn").on("click", () => dialog.hide());
      dialog.show();
    }
    quick_pay_amounts(total) {
      const t = Math.ceil(total);
      const denominations = [10, 20, 50, 100, 200, 500, 1e3, 2e3];
      const out = [];
      for (const d of denominations) {
        const rounded = Math.ceil(t / d) * d;
        if (rounded > total && !out.includes(rounded))
          out.push(rounded);
        if (out.length >= 6)
          break;
      }
      if (!out.includes(t))
        out.unshift(t);
      return out.slice(0, 6);
    }
    after_sale_actions(invoice_name, change) {
      frappe.confirm(
        __("Invoice {0} submitted successfully{1}. Print the receipt?", [invoice_name, change ? ` (change ${format_currency(change)})` : ""]),
        () => this.print_receipt(invoice_name),
        () => {
        }
      );
    }
    print_receipt(invoice_name) {
      frappe.utils.print("POS Invoice", invoice_name, "EIMS POS Receipt", "", frappe.boot.lang);
    }
    print_invoice(invoice_name) {
      frappe.utils.print("POS Invoice", invoice_name, "EIMS Invoice", "", frappe.boot.lang);
    }
    refresh() {
      this.load_products(this.$el.find(".etv2-sale-search input").val());
    }
    hide() {
    }
  };
  window.etv2_ph = function(name) {
    const $div = $(`<div class="fk-product-img-ph">${frappe.utils.escape_html(String(name || "?").slice(0, 1).toUpperCase())}</div>`);
    return $div[0].outerHTML;
  };
  window.etv2_ph_big = function(name) {
    return `<div class="etv2-id-img-ph">${frappe.utils.escape_html(String(name || "?").slice(0, 1).toUpperCase())}</div>`;
  };

  // ../ethiotel_pos/ethiotel_pos/ethio_telecom_pos_app/page/ethiotel_pos_v2/js/etv2_shift_dashboard.js
  erpnext.POSV2 = erpnext.POSV2 || {};
  erpnext.POSV2.ShiftDashboardWorkspace = class {
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
					<h2 class="etv2-page-title">${__("Shift Dashboard")}</h2>
					<div class="etv2-dash-date-range"></div>
				</div>
				<div class="etv2-dash-content">
					<div class="etv2-dash-metrics etv2-dash-metrics"></div>
					<div class="etv2-dash-grid">
						<div class="etv2-card etv2-dash-chart-card">
							<div class="etv2-card-header"><span class="etv2-card-title">${__("Hourly Sales")}</span></div>
							<div class="etv2-card-body"><div class="etv2-hourly etv2-hourly"></div></div>
						</div>
						<div class="etv2-card">
							<div class="etv2-card-header"><span class="etv2-card-title">${__("Payment Methods")}</span></div>
							<div class="etv2-card-body"><div class="etv2-list etv2-payments"></div></div>
						</div>
						<div class="etv2-card">
							<div class="etv2-card-header"><span class="etv2-card-title">${__("Top Selling Items")}</span></div>
							<div class="etv2-card-body"><div class="etv2-list etv2-top-items"></div></div>
						</div>
						<div class="etv2-card">
							<div class="etv2-card-header"><span class="etv2-card-title">${__("Recent Activity")}</span></div>
							<div class="etv2-card-body"><div class="etv2-activity etv2-activity"></div></div>
						</div>
						<div class="etv2-card">
							<div class="etv2-card-header"><span class="etv2-card-title">${__("Cash Drawer")}</span></div>
							<div class="etv2-card-body"><div class="etv2-cash-drawer"></div></div>
						</div>
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
      const pv = this.shell.get_pv();
      frappe.call({
        method: `${pv}.get_dashboard_data`,
        args: { pos_profile: this.shell.pos_profile }
      }).then((r) => {
        const d = r.message || {};
        this.render_metrics(d);
        this.render_hourly(d.hourly_sales || []);
        this.render_payments(d.payment_methods || []);
        this.render_top_items(d.top_items || []);
        this.render_activity(d.recent_activity || []);
        this.render_cash_drawer(d.cash_drawer || {});
      });
    }
    render_metrics(d) {
      const metrics = [
        { label: __("Sales Today"), value: format_currency(d.sales_today || 0), sub: d.from_date || frappe.datetime.now_date() },
        { label: __("Transactions"), value: String(d.transactions || 0), sub: __("Invoices today") },
        { label: __("Customers"), value: String(d.customers || 0), sub: __("Served today") },
        { label: __("Held Orders"), value: String(d.held_orders || 0), sub: __("Pending drafts") }
      ];
      this.$el.find(".etv2-dash-metrics").html(
        metrics.map((m) => `
				<div class="etv2-metric">
					<span class="etv2-metric-label">${m.label}</span>
					<span class="etv2-metric-value">${m.value}</span>
					<span class="etv2-metric-sub">${m.sub}</span>
				</div>`).join("")
      );
    }
    render_hourly(hourly) {
      const $chart = this.$el.find(".etv2-hourly");
      if (!hourly.length) {
        $chart.html(`<div class="etv2-empty">${__("No sales yet today.")}</div>`);
        return;
      }
      const max = Math.max(...hourly.map((h) => h.amount), 1);
      $chart.html(
        hourly.map((h) => `
				<div class="etv2-hourly-col">
					<div class="etv2-hourly-bar" style="height:${Math.max(h.amount / max * 100, 4)}%">
						<span class="etv2-hourly-val">${format_currency(h.amount, void 0, 0)}</span>
					</div>
					<span class="etv2-hourly-label">${h.hr}:00</span>
				</div>`).join("")
      );
    }
    render_payments(payments) {
      const $list = this.$el.find(".etv2-payments");
      if (!payments.length) {
        $list.html(`<div class="etv2-empty">${__("No payments today.")}</div>`);
        return;
      }
      const max = Math.max(...payments.map((p) => p.amount), 1);
      $list.html(
        payments.map((p) => `
				<div class="etv2-list-row">
					<span class="etv2-list-row-label">${frappe.utils.escape_html(p.mode_of_payment)}</span>
					<div class="etv2-list-bar-wrap">
						<div class="etv2-list-bar"><div class="etv2-list-bar-fill" style="width:${Math.max(p.amount / max * 100, 4)}%"></div></div>
					</div>
					<span class="etv2-list-row-amount">${format_currency(p.amount)}</span>
				</div>`).join("")
      );
    }
    render_top_items(items) {
      const $list = this.$el.find(".etv2-top-items");
      if (!items.length) {
        $list.html(`<div class="etv2-empty">${__("No items sold.")}</div>`);
        return;
      }
      $list.html(
        items.map((i, idx) => `
				<div class="etv2-list-row">
					<span class="etv2-list-row-label">${idx + 1}. ${frappe.utils.escape_html(i.item_name || i.item_code)}</span>
					<div class="etv2-list-bar-wrap">
						<div class="etv2-list-bar"><div class="etv2-list-bar-fill" style="width:${100 - idx * 8}%"></div></div>
					</div>
					<span class="etv2-list-row-amount">${flt(i.qty)} \xD7 ${format_currency(i.amount / (i.qty || 1), void 0, 0)}</span>
				</div>`).join("")
      );
    }
    render_activity(activity) {
      const $list = this.$el.find(".etv2-activity");
      if (!activity.length) {
        $list.html(`<div class="etv2-empty">${__("No recent activity.")}</div>`);
        return;
      }
      $list.html(
        activity.map((a) => `
				<div class="etv2-activity-row">
					<div class="etv2-activity-avatar">${frappe.utils.escape_html((a.customer_name || a.customer || "?").slice(0, 1).toUpperCase())}</div>
					<div class="etv2-activity-info">
						<div class="etv2-activity-title">${frappe.utils.escape_html(a.customer_name || a.customer || __("Walk-in"))}</div>
						<div class="etv2-activity-sub">${frappe.utils.escape_html(a.name)} \xB7 ${a.posting_time || ""}</div>
					</div>
					<span class="etv2-activity-amount">${format_currency(a.grand_total)}</span>
				</div>`).join("")
      );
    }
    render_cash_drawer(d) {
      const $drawer = this.$el.find(".etv2-cash-drawer");
      $drawer.html(`
			<div class="etv2-list">
				<div class="etv2-list-row">
					<span class="etv2-list-row-label">${__("Opening")}</span>
					<span class="etv2-list-row-amount">${format_currency(d.opening_amount || 0)}</span>
				</div>
				<div class="etv2-list-row">
					<span class="etv2-list-row-label">${__("Cash in")}</span>
					<span class="etv2-list-row-amount">${format_currency(d.cash_in || 0)}</span>
				</div>
				<div class="etv2-list-row">
					<span class="etv2-list-row-label">${__("Expected")}</span>
					<span class="etv2-list-row-amount">${format_currency(d.expected || 0)}</span>
				</div>
			</div>
		`);
    }
  };

  // ../ethiotel_pos/ethiotel_pos/ethio_telecom_pos_app/page/ethiotel_pos_v2/js/etv2_held_orders.js
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
						<input type="text" placeholder="${__("Search held orders\u2026")}" />
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
        args: { search_term, limit: 50 }
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
							<span>${frappe.utils.escape_html(d.customer_name || d.customer || __("Walk-in"))}</span>
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
        if (!sale)
          return;
        sale.customer = doc.customer;
        sale.$el.find(".etv2-sale-customer-btn").html(`${__("Customer")}: <b>${frappe.utils.escape_html(doc.customer_name || doc.customer)}</b>`);
        (doc.items || []).forEach((it) => {
          sale.cart[it.item_code] = {
            item_code: it.item_code,
            item_name: it.item_name || it.item_code,
            rate: it.rate,
            uom: it.uom,
            currency: doc.currency,
            qty: it.qty,
            warehouse: it.warehouse || me.shell.warehouse
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

  // ../ethiotel_pos/ethiotel_pos/ethio_telecom_pos_app/page/ethiotel_pos_v2/js/etv2_customers.js
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
						<input type="text" placeholder="${__("Search customers\u2026")}" />
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
        args: { search_term, limit: 80 }
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
        args: { customer: name }
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
				<div class="etv2-cp-meta">${frappe.utils.escape_html(c.customer_group || "")} \xB7 ${frappe.utils.escape_html(c.territory || "")}</div>
			</div>
			<div class="etv2-cp-section">
				<div class="etv2-cp-field"><span class="etv2-cp-field-label">${__("Mobile")}</span><span class="etv2-cp-field-value">${frappe.utils.escape_html(c.mobile_no || "\u2014")}</span></div>
				<div class="etv2-cp-field"><span class="etv2-cp-field-label">${__("Email")}</span><span class="etv2-cp-field-value">${frappe.utils.escape_html(c.email_id || "\u2014")}</span></div>
				<div class="etv2-cp-field"><span class="etv2-cp-field-label">${__("Loyalty")}</span><span class="etv2-cp-field-value">${frappe.utils.escape_html(c.loyalty_program || "\u2014")}</span></div>
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

  // ../ethiotel_pos/ethiotel_pos/ethio_telecom_pos_app/page/ethiotel_pos_v2/js/etv2_checkin.js
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
      $status.html(`<span class="etv2-pill etv2-pill-green"><span class="etv2-shift-dot"></span>${__("Shift open")} \xB7 ${frappe.datetime.str_to_user(shell.pos_opening_time)}</span>`);
      $shift.html(`
			<div class="etv2-checkin-row"><span>${__("Opening Entry")}</span><b>${frappe.utils.escape_html(entry)}</b></div>
			<div class="etv2-checkin-row"><span>${__("POS Profile")}</span><b>${frappe.utils.escape_html(shell.pos_profile)}</b></div>
			<div class="etv2-checkin-row"><span>${__("Company")}</span><b>${frappe.utils.escape_html(shell.company)}</b></div>
			<div class="etv2-checkin-row"><span>${__("Opened")}</span><b>${frappe.datetime.str_to_user(shell.pos_opening_time)}</b></div>
		`);
      const pv = shell.get_pv();
      frappe.call({
        method: `${pv}.get_shift_summary`,
        args: { pos_opening: entry }
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
            freeze: true
          }).then((r) => {
            if (r.message && r.message.status === "ok") {
              frappe.show_alert({ message: __("Shift closed \xB7 closing entry {0}", [r.message.closing_entry]), indicator: "green" });
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

  // ../ethiotel_pos/ethiotel_pos/ethio_telecom_pos_app/page/ethiotel_pos_v2/js/etv2_returns.js
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
						<input type="text" placeholder="${__("Search invoices\u2026")}" />
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
        args: { search_term, status: "", limit: 50 }
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
        frappe.show_alert({ message: __("Open the invoice and use Return in the document action menu."), indicator: "blue" });
      });
    }
  };

  // ../ethiotel_pos/ethiotel_pos/ethio_telecom_pos_app/page/ethiotel_pos_v2/js/etv2_reports.js
  erpnext.POSV2 = erpnext.POSV2 || {};
  erpnext.POSV2.ReportsWorkspace = class {
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
					<h2 class="etv2-page-title">${__("Sales Report")}</h2>
					<div class="etv2-report-filters">
						<div class="etv2-date-field etv2-report-from"></div>
						<div class="etv2-date-field etv2-report-to"></div>
						<button class="etv2-btn etv2-btn-primary etv2-report-run">${__("Run")}</button>
					</div>
				</div>
				<div class="etv2-ws-content etv2-report-body" style="flex-direction:column;">
					<div class="etv2-report-stats etv2-report-stats"></div>
					<div class="etv2-card">
						<div class="etv2-card-header"><span class="etv2-card-title">${__("By Payment Mode")}</span></div>
						<div class="etv2-card-body"><div class="etv2-report-table-wrap"></div></div>
					</div>
				</div>
			</section>
		`);
      this.from_field = frappe.ui.form.make_control({
        df: { label: __("From"), fieldtype: "Date", default: frappe.datetime.month_start() },
        parent: this.$el.find(".etv2-report-from"),
        render_input: true
      });
      this.to_field = frappe.ui.form.make_control({
        df: { label: __("To"), fieldtype: "Date", default: frappe.datetime.now_date() },
        parent: this.$el.find(".etv2-report-to"),
        render_input: true
      });
      this.$el.find(".etv2-report-run").on("click", () => this.run_report());
      return this.$el;
    }
    show() {
      this.run_report();
    }
    refresh() {
      this.run_report();
    }
    run_report() {
      const pv = this.shell.get_pv();
      frappe.call({
        method: `${pv}.get_sales_report`,
        args: {
          from_date: this.from_field && this.from_field.get_value() || frappe.datetime.month_start(),
          to_date: this.to_field && this.to_field.get_value() || frappe.datetime.now_date(),
          pos_profile: this.shell.pos_profile
        },
        freeze: true
      }).then((r) => {
        const d = r.message || {};
        this.$el.find(".etv2-report-stats").html(`
				<div class="etv2-metric"><span class="etv2-metric-label">${__("Total Sales")}</span><span class="etv2-metric-value">${format_currency(d.total_sales || 0)}</span><span class="etv2-metric-sub">${d.from_date || ""} \u2192 ${d.to_date || ""}</span></div>
				<div class="etv2-metric"><span class="etv2-metric-label">${__("Invoices")}</span><span class="etv2-metric-value">${d.invoice_count || 0}</span><span class="etv2-metric-sub">${__("Submitted")}</span></div>
				<div class="etv2-metric"><span class="etv2-metric-label">${__("Avg. Sale")}</span><span class="etv2-metric-value">${format_currency(d.avg_sale || 0)}</span><span class="etv2-metric-sub">${__("Per invoice")}</span></div>
			`);
        const rows = d.by_payment_mode || [];
        const $wrap = this.$el.find(".etv2-report-table-wrap");
        if (!rows.length) {
          $wrap.html(`<div class="etv2-empty">${__("No data for this period.")}</div>`);
          return;
        }
        $wrap.html(`
				<table class="etv2-report-table">
					<thead><tr><th>${__("Mode of Payment")}</th><th>${__("Amount")}</th><th>${__("Share")}</th></tr></thead>
					<tbody>
						${rows.map((r2) => `
							<tr>
								<td>${frappe.utils.escape_html(r2.mode_of_payment)}</td>
								<td>${format_currency(r2.amount)}</td>
								<td>${d.total_sales ? (r2.amount / d.total_sales * 100).toFixed(1) : 0}%</td>
							</tr>`).join("")}
					</tbody>
				</table>
			`);
      });
    }
  };

  // ../ethiotel_pos/ethiotel_pos/ethio_telecom_pos_app/page/ethiotel_pos_v2/js/etv2_settings.js
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
								<div class="etv2-list-row"><span class="etv2-list-row-label">${__("POS Profile")}</span><span class="etv2-list-row-amount" style="text-align:left;min-width:0;flex:1">${frappe.utils.escape_html(this.shell.pos_profile || "\u2014")}</span></div>
								<div class="etv2-list-row"><span class="etv2-list-row-label">${__("Warehouse")}</span><span class="etv2-list-row-amount" style="text-align:left;min-width:0;flex:1">${frappe.utils.escape_html(this.shell.warehouse || "\u2014")}</span></div>
								<div class="etv2-list-row"><span class="etv2-list-row-label">${__("Company")}</span><span class="etv2-list-row-amount" style="text-align:left;min-width:0;flex:1">${frappe.utils.escape_html(this.shell.company || "\u2014")}</span></div>
							</div>
						</div>
					</div>
					<div class="etv2-card">
						<div class="etv2-card-header"><span class="etv2-card-title">${__("Actions")}</span></div>
						<div class="etv2-card-body">
							<div class="etv2-cart-actions" style="padding:0;max-width:420px;">
								<button class="etv2-btn etv2-btn-ghost etv2-signout-btn">${__("Sign Out")}</button>
								<button class="etv2-btn etv2-btn-ghost etv2-fullscreen2-btn">${__("Toggle Full Screen")}</button>
							</div>
						</div>
					</div>
				</div>
			</section>
		`);
      this.$el.find(".etv2-signout-btn").on("click", () => {
        frappe.call("frappe.core.doctype.user.user.logout").then(() => window.location.reload());
      });
      this.$el.find(".etv2-fullscreen2-btn").on("click", () => {
        if (!document.fullscreenElement)
          document.documentElement.requestFullscreen();
        else if (document.exitFullscreen)
          document.exitFullscreen();
      });
      return this.$el;
    }
  };
})();
//# sourceMappingURL=ethiotel-pos-v2.bundle.A7ZXFJ4J.js.map
