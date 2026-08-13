// =====================================================================
// PHASE 1 — SHELL
// The POS shell: builds the HTML template, wires the topbar, boots the
// WorkspaceManager + Sidebar, resolves the open shift, and keeps the
// clock / network / status bar live.
// =====================================================================
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

		// user avatar + name
		const initials = (frappe.session.user_fullname || frappe.session.user || "U").slice(0, 1).toUpperCase();
		this.$main.find(".etv2-avatar").text(initials);
		this.$main.find(".etv2-user-name").text(frappe.session.user_fullname || frappe.session.user);

		// scrim element (tablet drawer)
		$("<div class='etv2-drawer-scrim'></div>").appendTo(this.$shell);
	}

	boot() {
		this.sidebar = new erpnext.POSV2.Sidebar({ shell: this });
		this.workspaces = new erpnext.POSV2.WorkspaceManager({ shell: this });

		// register workspaces
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

		// resolve shift then open the sale workspace (only once a shift/pos
		// profile is available — otherwise get_items would 404)
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
			args: { user: frappe.session.user },
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
		$chip.find(".etv2-shift-chip-text").text(`${__("Shift open")} · ${frappe.datetime.str_to_user(this.pos_opening_time)}`);
	}

	load_profile() {
		const pv = "ethiotel_pos.ethio_telecom_pos_app.page.ethiotel_pos_v2.ethiotel_pos_v2";
		return frappe.call({
			method: `${pv}.get_pos_profile_data`,
			args: { pos_profile: this.pos_profile },
		}).then((r) => {
			const profile = r.message;
			this.settings = profile;
			this.price_list = profile.selling_price_list;
			this.warehouse = profile.warehouse || profile.set_warehouse;
			this.customer_groups = (profile.customer_groups || []).map((g) => g.name);
			this.set_status_bar();

			// root item group
			return frappe.call({ method: `${pv}.get_root_item_group` }).then((r2) => {
				this.parent_item_group = (r2.message && r2.message[0] && r2.message[0].name) || "All Item Groups";
			});
		});
	}

	set_status_bar() {
		this.$statusProfile.text(`${__("Profile")}: ${this.pos_profile}`);
		this.$statusWarehouse.text(`${__("Warehouse")}: ${this.warehouse || "—"}`);
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
						filters: { company: dialog.fields_dict.company.get_value() },
					}),
					onchange: () => fetch_payments(),
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
						{ fieldname: "opening_amount", fieldtype: "Currency", in_list_view: 1, label: __("Opening Amount"), default: 0 },
					],
				},
			],
			primary_action_label: __("Open"),
			primary_action: function (values) {
				const balance = (values.balance_details || []).filter((d) => d.mode_of_payment);
				if (!balance.length) {
					frappe.show_alert({ message: __("Add at least one mode of payment."), indicator: "orange" });
					return;
				}
				frappe.call({
					method: "ethiotel_pos.ethio_telecom_pos_app.page.ethiotel_pos.ethiotel_pos.create_opening_voucher",
					args: { pos_profile: values.pos_profile, company: values.company, balance_details: balance },
					freeze: true,
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
			},
		});

		function fetch_payments() {
			const profile = dialog.fields_dict.pos_profile.get_value();
			if (!profile) return;
			frappe.db.get_doc("POS Profile", profile).then((doc) => {
				dialog.fields_dict.balance_details.df.data = (doc.payments || []).map((p) => ({
					mode_of_payment: p.mode_of_payment,
					opening_amount: 0,
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
		setInterval(tick, 1000);
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

	// helper: load POS invoices for a customer (used by several workspaces)
	get_pv() {
		return "ethiotel_pos.ethio_telecom_pos_app.page.ethiotel_pos_v2.ethiotel_pos_v2";
	}
};