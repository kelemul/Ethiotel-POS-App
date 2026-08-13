erpnext.PointOfSale.Controller = class {
	constructor(wrapper) {
		this.wrapper = $(wrapper).find(".layout-main-section");
		this.page = wrapper.page;

		// locked = left menu stays hidden everywhere until unlocked
		this.sidebar_locked = localStorage.getItem("ethiotel_pos.sidebar_locked") === "1";

		this.check_opening_entry();
	}

	fetch_opening_entry() {
		return frappe.call("ethiotel_pos.ethio_telecom_pos_app.page.ethiotel_pos.ethiotel_pos.check_opening_entry", {
			user: frappe.session.user,
		});
	}

	check_opening_entry() {
		this.fetch_opening_entry().then((r) => {
			if (r.message.length) {
				// assuming only one opening voucher is available for the current user
				this.prepare_app_defaults(r.message[0]);
			} else {
				this.create_opening_voucher();
			}
		});
	}

	create_opening_voucher() {
		const me = this;
		const table_fields = [
			{
				fieldname: "mode_of_payment",
				fieldtype: "Link",
				in_list_view: 1,
				label: __("Mode of Payment"),
				options: "Mode of Payment",
				reqd: 1,
			},
			{
				fieldname: "opening_amount",
				fieldtype: "Currency",
				in_list_view: 1,
				label: __("Opening Amount"),
				options: "company:company_currency",
				onchange: function () {
					dialog.fields_dict.balance_details.df.data.some((d) => {
						if (d.idx == this.doc.idx) {
							d.opening_amount = this.value;
							dialog.fields_dict.balance_details.grid.refresh();
							return true;
						}
					});
				},
			},
		];
		const fetch_pos_payment_methods = () => {
			const pos_profile = dialog.fields_dict.pos_profile.get_value();
			if (!pos_profile) return;
			frappe.db.get_doc("POS Profile", pos_profile).then(({ payments }) => {
				dialog.fields_dict.balance_details.df.data = [];
				payments.forEach((pay) => {
					const { mode_of_payment } = pay;
					dialog.fields_dict.balance_details.df.data.push({ mode_of_payment, opening_amount: "0" });
				});
				dialog.fields_dict.balance_details.grid.refresh();
			});
		};
		const dialog = new frappe.ui.Dialog({
			title: __("Create POS Opening Entry"),
			static: true,
			fields: [
				{
					fieldtype: "Link",
					label: __("Company"),
					default: frappe.defaults.get_default("company"),
					options: "Company",
					fieldname: "company",
					reqd: 1,
				},
				{
					fieldtype: "Link",
					label: __("POS Profile"),
					options: "POS Profile",
					fieldname: "pos_profile",
					reqd: 1,
					get_query: () => pos_profile_query(),
					onchange: () => fetch_pos_payment_methods(),
				},
				{
					fieldname: "balance_details",
					fieldtype: "Table",
					label: __("Opening Balance Details"),
					cannot_add_rows: false,
					in_place_edit: true,
					reqd: 1,
					data: [],
					fields: table_fields,
				},
			],
			primary_action: async function ({ company, pos_profile, balance_details }) {
				if (!balance_details.length) {
					frappe.show_alert({
						message: __("Please add Mode of payments and opening balance details."),
						indicator: "red",
					});
					return frappe.utils.play_sound("error");
				}

				// filter balance details for empty rows
				balance_details = balance_details.filter((d) => d.mode_of_payment);

				const method = "ethiotel_pos.ethio_telecom_pos_app.page.ethiotel_pos.ethiotel_pos.create_opening_voucher";
				const res = await frappe.call({
					method,
					args: { pos_profile, company, balance_details },
					freeze: true,
				});
				!res.exc && me.prepare_app_defaults(res.message);
				dialog.hide();
			},
			primary_action_label: __("Submit"),
		});
		dialog.show();
		const pos_profile_query = () => {
			return {
				query: "erpnext.accounts.doctype.pos_profile.pos_profile.pos_profile_query",
				filters: { company: dialog.fields_dict.company.get_value() },
			};
		};
	}

	async prepare_app_defaults(data) {
		this.pos_opening = data.name;
		this.company = data.company;
		this.pos_profile = data.pos_profile;
		this.pos_opening_time = data.period_start_date;
		this.item_stock_map = {};
		this.settings = {};

		frappe.db.get_value("Stock Settings", undefined, "allow_negative_stock").then(({ message }) => {
			this.allow_negative_stock = flt(message.allow_negative_stock) || false;
		});

		frappe.call({
			method: "ethiotel_pos.ethio_telecom_pos_app.page.ethiotel_pos.ethiotel_pos.get_pos_profile_data",
			args: { pos_profile: this.pos_profile },
			callback: (res) => {
				const profile = res.message;
				Object.assign(this.settings, profile);
				this.settings.customer_groups = profile.customer_groups.map((group) => group.name);
				this.make_app();
			},
		});

		frappe.realtime.on(`poe_${this.pos_opening}_closed`, (data) => {
			const route = frappe.get_route_str();
			if (data && route == "ethiotel-pos") {
				frappe.dom.freeze();
				frappe.msgprint({
					title: __("POS Closed"),
					indicator: "orange",
					message: __("POS has been closed at {0}. Please refresh the page.", [
						frappe.datetime.str_to_user(data.creation).bold(),
					]),
					primary_action_label: __("Refresh"),
					primary_action: {
						action() {
							window.location.reload();
						},
					},
				});
			}
		});
	}

	set_opening_entry_status() {
		this.page.set_title_sub(
			`<span class="indicator orange">
				<a class="text-muted" href="#Form/POS%20Opening%20Entry/${this.pos_opening}">
					Opened at ${frappe.datetime.str_to_user(this.pos_opening_time)}
				</a>
			</span>`
		);
	}

	make_app() {
		this.prepare_dom();
		this.prepare_components();
		this.prepare_topbar_events();
		this.prepare_menu();
		this.prepare_fullscreen_btn();
		this.make_new_invoice();
		this.show_view("pos");
	}


	
	show_view(view_name) {
		this.wrapper.find(".et-view").css("display", "none");
		// et-view-pos is display:flex; it hosts .point-of-sale-app which itself uses CSS grid
		this.wrapper.find(`.et-view-${view_name}`).css("display", view_name === "pos" ? "flex" : "block");

		this.wrapper.find(".et-left-menu-list .et-menu-item").removeClass("active");
		this.wrapper.find(`.et-left-menu-list .et-menu-item[data-view="${view_name}"]`).addClass("active");

		// non-POS views always run full-page without the menu; when the menu is
		// locked it stays hidden everywhere (even on the selling screen)
		if (this.sidebar_locked || view_name !== "pos") {
			this.wrapper.find(".et-pos-layout").addClass("et-sidebar-collapsed").removeClass("et-sidebar-open");
		} else {
			this.wrapper.find(".et-pos-layout").removeClass("et-sidebar-collapsed").addClass("et-sidebar-open");
		}

		this.current_view = view_name;
	}

	go_home() {
		// "Home" returns to the actual selling screen, not the dashboard
		this.show_view("pos");
		this.toggle_components(true);
		this.item_details.toggle_component(false);
		this.payment.toggle_component(false);
		this.recent_order_list.toggle_component(false);
		this.order_summary.toggle_component(false);
		$(".point-of-sale-app").removeClass("et-checkout-mode");
	}

	toggle_sidebar_lock() {
		this.sidebar_locked = !this.sidebar_locked;
		localStorage.setItem("ethiotel_pos.sidebar_locked", this.sidebar_locked ? "1" : "0");

		const $layout = this.wrapper.find(".et-pos-layout");
		$layout.toggleClass("et-sidebar-locked", this.sidebar_locked);

		this.wrapper.find(".et-sidebar-lock").each((i, el) => {
			const $el = $(el);
			$el.html(this.get_lock_svg(this.sidebar_locked));
			$el.attr("title", this.sidebar_locked ? __("Unlock menu") : __("Lock menu"));
			$el.toggleClass("et-locked", this.sidebar_locked);
		});

		this.show_view(this.current_view || "pos");
	}

	get_lock_svg(locked) {
		return locked
			? `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`
			: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>`;
	}

	prepare_topbar_events() {
		const container = this.wrapper;

		container.on("click", ".et-network-status", () => {
			frappe.show_alert({
				message: ethiotel_pos.is_online() ? __("Online") : __("Offline"),
				indicator: ethiotel_pos.is_online() ? "green" : "red",
			});
		});

		container.on("click", ".et-invoices-icon", () => {
			this.show_view("pos");
			this.toggle_recent_order();
		});

		container.on("click", ".et-sync-icon", () => {
			ethiotel_pos.sync_queued();
			frappe.show_alert({ message: __("Sync started"), indicator: "blue" });
		});

		container.on("click", ".et-barcode-icon", () => {
			this.show_view("pos");
			this.item_selector.toggle_component(true);
			if (this.item_selector && this.item_selector.open_scanner) this.item_selector.open_scanner();
		});

		/* ---------- sidebar drawer toggle ---------- */
		container.on("click", ".et-sidebar-toggle", () => {
			if (this.sidebar_locked) return; // locked menu stays hidden
			const $layout = container.find(".et-pos-layout");
			// Start collapsed = NO (default open via class="et-pos-layout et-sidebar-open" in prepare_dom)
			const isCollapsed = $layout.hasClass("et-sidebar-collapsed");
			if (isCollapsed) {
				// opening the drawer: add et-sidebar-open, remove et-sidebar-collapsed
				$layout.removeClass("et-sidebar-collapsed").addClass("et-sidebar-open");
			} else {
				// closing (collapsing) the drawer: remove et-sidebar-open, add et-sidebar-collapsed
				$layout.removeClass("et-sidebar-open").addClass("et-sidebar-collapsed");
			}
			// refresh layout — some child components use flex heights
			setTimeout(() => $(window).trigger("resize"), 260);
		});

		/* ---------- sidebar lock / unlock ---------- */
		container.on("click", ".et-sidebar-lock", () => this.toggle_sidebar_lock());

		/* ---------- dropdowns ---------- */
		container.on("click", ".et-actions-btn", (e) => {
			e.stopPropagation();
			container.find(".et-profile-menu").hide();
			container.find(".et-actions-menu").toggle();
		});

		container.on("click", ".et-profile-btn", (e) => {
			e.stopPropagation();
			container.find(".et-actions-menu").hide();
			container.find(".et-profile-menu").toggle();
		});

		// close dropdowns when clicking anywhere else
		$(document).on("click.et-pos-dropdowns", () => {
			container.find(".et-actions-menu, .et-profile-menu").hide();
		});

		container.on("click", ".et-action-return", () => {
			this.show_view("pos");
			this.toggle_recent_order();
			frappe.show_alert({ message: __("Select an invoice, then use Return from its summary."), indicator: "orange" });
		});

		container.on("click", ".et-action-resync", () => {
			ethiotel_pos.sync_queued();
		});

		container.on("click", ".et-action-print-last", () => {
			frappe.call({ method: "ethiotel_pos.ethio_telecom_pos_app.page.ethiotel_pos.ethiotel_pos.get_last_invoice" }).then((r) => {
				if (r.message) frappe.utils.print("POS Invoice", r.message, "EIMS POS Receipt");
				else frappe.show_alert({ message: __("No invoice found"), indicator: "orange" });
			});
		});

		container.on("click", ".et-action-send-mor", () => {
			this.send_invoice_to_mor();
		});

		container.on("click", ".et-profile-signout", () => {
			frappe.call("frappe.core.doctype.user.user.logout").then(() => window.location.reload());
		});

		container.on("click", ".et-profile-toggle-width", () => {
			ethiotel_pos.toggle_fullscreen();
		});

		container.on("click", ".et-profile-shifttime", () => {
			this.show_shift_time_alert();
		});

		container.on("click", ".et-profile-myprofile", () => {
			frappe.set_route("Form", "User", frappe.session.user);
		});

		container.on("click", ".et-profile-apps", () => {
			window.open("/apps", "_blank");
		});

		/* ---------- left menu ---------- */
		container.on("click", ".et-left-menu-list .et-home", () => this.go_home());
		container.on("click", ".et-left-menu-list .et-shift-dashboard", () => this.show_dashboard());
		container.on("click", ".et-left-menu-list .et-held-orders", () => this.show_held_orders());
		container.on("click", ".et-left-menu-list .et-order-history", () => this.show_order_history());
		container.on("click", ".et-left-menu-list .et-invoices", () => this.show_invoices_view());
		container.on("click", ".et-left-menu-list .et-report", () => this.show_report());
		container.on("click", ".et-left-menu-list .et-close-shift", () => this.close_pos());
		container.on("click", ".et-left-menu-list .et-sign-out", () => {
			frappe.call("frappe.core.doctype.user.user.logout").then(() => window.location.reload());
		});
	}

	send_invoice_to_mor(invoice_name) {
		const proceed = (name) => {
			if (!name) return frappe.msgprint(__("No invoice found"));
			frappe.call({
				method: "ethiotel_pos.eims_api.submit_invoice_and_update",
				args: { invoice_name: name },
				freeze: true,
			}).then((resp) => {
				if (resp.message && resp.message.success) {
					frappe.show_alert({ message: __("Sent to MoR"), indicator: "green" });
				} else {
					frappe.show_alert({ message: __("Failed to send to MoR"), indicator: "red" });
				}
			});
		};

		if (invoice_name) return proceed(invoice_name);

		frappe.db
			.get_list("POS Invoice", { fields: ["name"], limit: 1, order_by: "creation desc" })
			.then((res) => proceed(res && res.length ? res[0].name : null));
	}

	show_shift_time_alert() {
		frappe.call({
			method: "ethiotel_pos.ethio_telecom_pos_app.page.ethiotel_pos.ethiotel_pos.get_shift_summary",
			args: { pos_opening: this.pos_opening },
		}).then((r) => {
			const d = r.message || {};
			frappe.msgprint({
				title: __("Current Shift"),
				message: `
					<div><b>${__("Opened")}:</b> ${frappe.datetime.str_to_user(this.pos_opening_time)}</div>
					<div><b>${__("Sales so far")}:</b> ${format_currency(d.sales_total || 0)}</div>
					<div><b>${__("Invoices so far")}:</b> ${d.invoice_count || 0}</div>
				`,
				indicator: "blue",
			});
		});
	}

	// ---------- Left menu pages ----------
	show_dashboard() {
		this.show_view("dashboard");
		const $view = this.wrapper.find(".et-view-dashboard");
		if (!this.shift_dashboard || this.shift_dashboard_wrapper !== $view[0]) {
			this.shift_dashboard = new erpnext.PointOfSale.ShiftDashboard({
				wrapper: $view,
				events: { pos_profile: this.pos_profile },
			});
			this.shift_dashboard_wrapper = $view[0];
		} else {
			this.shift_dashboard.load_metrics();
			this.shift_dashboard.load_recent_invoices();
		}
	}

	show_held_orders() {
		this.show_view("held");
		const $view = this.wrapper.find(".et-view-held");
		if (!this.held_orders || this.held_orders_wrapper !== $view[0]) {
			this.held_orders = new erpnext.PointOfSale.HeldOrders({
				wrapper: $view,
				events: {
					resume_order: (name) => {
						frappe.dom.freeze();
						this.frm = this.get_new_frm(this.frm);
						frappe.db.get_doc("POS Invoice", name).then((doc) => {
							frappe.model.sync(doc);
							this.frm.refresh(doc.name);
							this.cart.load_invoice();
							this.go_home();
							frappe.dom.unfreeze();
						});
					},
					reload: () => this.show_held_orders(),
				},
			});
			this.held_orders_wrapper = $view[0];
		} else {
			this.held_orders.load();
		}
	}

	show_order_history() {
		this.show_view("history");
		const $view = this.wrapper.find(".et-view-history");
		if (!this.order_history || this.order_history_wrapper !== $view[0]) {
			this.order_history = new erpnext.PointOfSale.OrderHistory({
				wrapper: $view,
				events: {},
			});
			this.order_history_wrapper = $view[0];
		} else {
			this.order_history.load();
		}
	}

	show_invoices_view() {
		this.show_view("invoices");
		const $view = this.wrapper.find(".et-view-invoices");
		if (!this.invoices_view || this.invoices_view_wrapper !== $view[0]) {
			this.invoices_view = new erpnext.PointOfSale.InvoicesView({
				wrapper: $view,
				events: {
					view_invoice: (name) => {
						frappe.db.get_doc("POS Invoice", name).then((doc) => {
							this.show_view("pos");
							this.toggle_components(false);
							this.recent_order_list.toggle_component(false);
							this.order_summary.toggle_component(true);
							this.order_summary.load_summary_of(doc, true);
						});
					},
					print_invoice: (name) => frappe.utils.print("POS Invoice", name, "EIMS POS Receipt"),
					send_invoice_to_mor: (name) => this.send_invoice_to_mor(name),
				},
			});
			this.invoices_view_wrapper = $view[0];
		} else {
			this.invoices_view.load();
		}
	}

	show_report() {
		this.show_view("report");
		const $view = this.wrapper.find(".et-view-report");
		if (!this.report_view || this.report_view_wrapper !== $view[0]) {
			this.report_view = new erpnext.PointOfSale.ReportView({
				wrapper: $view,
				events: { pos_profile: this.pos_profile },
			});
			this.report_view_wrapper = $view[0];
		} else {
			this.report_view.run_report();
		}
	}

	clear_main() {
		// retained for backward-compatibility; no longer used to wipe the
		// live POS components. Use show_view() + rendering into the
		// dedicated .et-view-* container instead.
		this.wrapper.find(`.et-view-${this.current_view}`).html("");
	}

	prepare_dom() {
		this.wrapper.append(`
			<div class="et-pos-layout et-sidebar-open">
				<aside class="et-left-menu">
					<div class="et-left-menu-inner">
						<div class="et-sidebar-lock-row">
							<span>${__("Menu")}</span>
							<button class="et-icon et-sidebar-lock ${this.sidebar_locked ? "et-locked" : ""}"
								title="${this.sidebar_locked ? __("Unlock menu") : __("Lock menu")}">
								${this.get_lock_svg(this.sidebar_locked)}
							</button>
						</div>
						<ul class="et-left-menu-list">
							<li class="et-menu-item et-home" data-view="pos">${__("Home")}</li>
							<li class="et-menu-item et-shift-dashboard" data-view="dashboard">${__("Shift Dashboard")}</li>
							<li class="et-menu-item et-held-orders" data-view="held">${__("Held Orders")}</li>
							<li class="et-menu-item et-order-history" data-view="history">${__("Order History")}</li>
							<li class="et-menu-item et-invoices" data-view="invoices">${__("Invoices")}</li>
							<li class="et-menu-item et-report" data-view="report">${__("Report")}</li>
							<li class="et-menu-item et-close-shift">${__("Close Shift")}</li>
							<li class="et-menu-item et-sign-out">${__("Sign Out")}</li>
						</ul>
					</div>
				</aside>
				<div class="et-main">
					<header class="et-topbar pos-navbar-enhanced">
						<div class="et-topbar-left">
							<button class="et-icon et-sidebar-toggle" title="${__("Toggle menu")}">
								<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
									<line x1="3" y1="6" x2="21" y2="6"></line>
									<line x1="3" y1="12" x2="21" y2="12"></line>
									<line x1="3" y1="18" x2="21" y2="18"></line>
								</svg>
							</button>
							<button class="et-icon et-sidebar-lock ${this.sidebar_locked ? "et-locked" : ""}"
								title="${this.sidebar_locked ? __("Unlock menu") : __("Lock menu")}">
								${this.get_lock_svg(this.sidebar_locked)}
							</button>
							<div class="et-nav-brand pos-navbar-logo">
								<img src="/assets/ethiotel_pos/images/tele.jpg" alt="logo" />
							</div>
						</div>
						<div class="et-topbar-right">
							<span class="et-nav-clock"><span></span></span>
							<button class="et-icon et-network-status" title="${__("Network status")}">${this.get_icon_svg("network")}</button>
							<button class="et-icon et-invoices-icon" title="${__("Invoices")}">${this.get_icon_svg("invoice")}</button>
							<button class="et-icon et-sync-icon" title="${__("Sync")}">${this.get_icon_svg("sync")}</button>
							<button class="et-icon et-barcode-icon" title="${__("Scan barcode")}">${this.get_icon_svg("barcode")}</button>
							<div class="et-actions-dropdown">
								<button class="et-icon et-actions-btn">${__("Actions")} ▾</button>
								<ul class="et-actions-menu">
									<li class="et-action-return">${__("Return Invoice")}</li>
									<li class="et-action-resync">${__("Resync")}</li>
									<li class="et-action-print-last">${__("Print Last Invoice")}</li>
									<li class="et-action-send-mor">${__("Send to MoR")}</li>
								</ul>
							</div>
							<div class="et-profile-dropdown">
								<button class="et-profile-btn">${frappe.utils.escape_html(frappe.session.user_fullname || frappe.session.user)} ▾</button>
								<ul class="et-profile-menu">
									<li class="et-profile-shifttime">${__("Shift Time")}</li>
									<li class="et-profile-myprofile">${__("My Profile")}</li>
									<li class="et-profile-apps">${__("Apps")}</li>
									<li class="et-profile-toggle-width">${__("Toggle Full Width")}</li>
									<li class="et-profile-signout">${__("Sign Out")}</li>
								</ul>
							</div>
						</div>
					</header>
					<div class="et-view-container">
						<div class="point-of-sale-app et-view et-view-pos"></div>
						<div class="et-view et-view-dashboard"></div>
						<div class="et-view et-view-held"></div>
						<div class="et-view et-view-history"></div>
						<div class="et-view et-view-invoices"></div>
						<div class="et-view et-view-report"></div>
					</div>
				</div>
			</div>
		`);

		// only the .point-of-sale-app / et-view-pos container hosts the live
		// selling-screen components (item selector, cart, payment, etc.)
		this.$components_wrapper = this.wrapper.find(".et-view-pos");
	}

	get_icon_svg(name) {
		const icons = {
			network: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><circle cx="12" cy="20" r="1"/></svg>`,
			invoice: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2h9l5 5v15H6z"/><path d="M14 2v6h6"/><path d="M9 13h6M9 17h6M9 9h1"/></svg>`,
			sync: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>`,
			barcode: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 5v14M7 5v14M11 5v14M14 5v14M18 5v14M21 5v14" stroke-linecap="round"/></svg>`,
		};
		return icons[name] || "";
	}

	prepare_components() {
		this.init_item_selector();
		this.init_item_details();
		this.init_item_cart();
		this.init_payments();
		this.init_recent_order_list();
		this.init_order_summary();
	}

	prepare_menu() {
		this.page.clear_menu();

		this.page.add_menu_item(__("Open Form View"), this.open_form_view.bind(this), false, "Ctrl+F");

		this.page.add_menu_item(
			__("Toggle Recent Orders"),
			this.toggle_recent_order.bind(this),
			false,
			"Ctrl+O"
		);

		this.page.add_menu_item(__("Save as Draft"), this.save_draft_invoice.bind(this), false, "Ctrl+S");

		this.page.add_menu_item(__("Close the POS"), this.close_pos.bind(this), false, "Shift+Ctrl+C");
	}

	prepare_fullscreen_btn() {
		this.page.page_actions.find(".custom-actions").empty();

		this.page.add_button(__("Full Screen"), null, { btn_class: "btn-default fullscreen-btn" });

		this.bind_fullscreen_events();
	}

	bind_fullscreen_events() {
		this.$fullscreen_btn = this.page.page_actions.find(".fullscreen-btn");

		this.$fullscreen_btn.on("click", function () {
			if (!document.fullscreenElement) {
				document.documentElement.requestFullscreen();
			} else if (document.exitFullscreen) {
				document.exitFullscreen();
			}
		});

		$(document).on("fullscreenchange", this.handle_fullscreen_change_event.bind(this));
	}

	handle_fullscreen_change_event() {
		let enable_fullscreen_label = __("Full Screen");
		let exit_fullscreen_label = __("Exit Full Screen");

		if (document.fullscreenElement) {
			this.$fullscreen_btn[0].innerText = exit_fullscreen_label;
		} else {
			this.$fullscreen_btn[0].innerText = enable_fullscreen_label;
		}
	}

	open_form_view() {
		frappe.model.sync(this.frm.doc);
		frappe.set_route("Form", this.frm.doc.doctype, this.frm.doc.name);
	}

	toggle_recent_order() {
		const show = this.recent_order_list.$component.is(":hidden");
		this.toggle_recent_order_list(show);
	}

	save_draft_invoice() {
		if (this.current_view !== "pos") return;

		if (this.frm.doc.items.length == 0) {
			frappe.show_alert({
				message: __("You must add atleast one item to save it as draft."),
				indicator: "red",
			});
			frappe.utils.play_sound("error");
			return;
		}

		this.frm
			.save(undefined, undefined, undefined, () => {
				frappe.show_alert({
					message: __("There was an error saving the document."),
					indicator: "red",
				});
				frappe.utils.play_sound("error");
			})
			.then(() => {
				frappe.run_serially([
					() => frappe.dom.freeze(),
					() => this.make_new_invoice(),
					() => frappe.dom.unfreeze(),
				]);
			});
	}

	/* -------------------------------------------------------------------
	   Close Shift
	   Creates & properly SYNCS a new POS Closing Entry (pre-filled from the
	   current opening voucher) before routing to its form so the user can
	   review totals and submit. Previously this used
	   frappe.model.get_new_doc() without syncing/naming the doc via
	   make_new_doc_and_get_name(), so frappe.set_route() could land on a
	   route with nothing loaded in frappe.model.locals.
	   ------------------------------------------------------------------- */
	close_pos() {
		if (!this.pos_opening) {
			frappe.msgprint(__("No open shift found."));
			return;
		}

		frappe.confirm(__("Close the current shift and go to the Closing Entry form?"), () => {
			frappe.model.with_doctype("POS Closing Entry", () => {
				const name = frappe.model.make_new_doc_and_get_name("POS Closing Entry", true);
				const voucher = frappe.model.get_doc("POS Closing Entry", name);

				voucher.pos_profile = this.pos_profile;
				voucher.user = frappe.session.user;
				voucher.company = this.company;
				voucher.pos_opening_entry = this.pos_opening;
				voucher.period_start_date = this.pos_opening_time;
				voucher.period_end_date = frappe.datetime.now_datetime();
				voucher.posting_date = frappe.datetime.now_date();
				voucher.posting_time = frappe.datetime.now_time();

				frappe.model.sync(voucher);
				frappe.set_route("Form", "POS Closing Entry", voucher.name);
			});
		});
	}

	init_item_selector() {
		this.item_selector = new erpnext.PointOfSale.ItemSelector({
			wrapper: this.$components_wrapper,
			pos_profile: this.pos_profile,
			settings: this.settings,
			events: {
				item_selected: (args) => this.on_cart_update(args),

				get_frm: () => this.frm || {},
			},
		});
	}

	init_item_cart() {
		this.cart = new erpnext.PointOfSale.ItemCart({
			wrapper: this.$components_wrapper,
			settings: this.settings,
			events: {
				get_frm: () => this.frm,

				cart_item_clicked: (item) => {
					const item_row = this.get_item_from_frm(item);
					this.item_details.toggle_item_details_section(item_row);
				},

				// Points item_details at a cart row so the numpad "remove"
				// action works, WITHOUT opening the details modal.
				select_cart_item: (name) => {
					const item_row = this.get_item_from_frm({ name });
					if (!item_row || !item_row.name) return;
					this.item_details.doctype = item_row.doctype;
					this.item_details.name = item_row.name;
					this.item_details.item_row = item_row;
					this.item_details.current_item = item_row;
				},

				numpad_event: (value, action) => this.update_item_field(value, action),

				checkout: () => this.save_and_checkout(),

				edit_cart: () => this.payment.edit_cart(),

				customer_details_updated: (details) => {
					this.item_selector.load_items_data();
					this.customer_details = details;
					// will add/remove LP payment method
					this.payment.render_loyalty_points_payment_mode();
				},

				save_and_print: () => this.save_and_print("EIMS POS Receipt"),
				print_invoice: () => this.save_and_print("EIMS Invoice"),
			},
		});
	}

	save_and_print(print_format) {
		if (this.frm.doc.items.length == 0) {
			frappe.show_alert({
				message: __("You must add atleast one item to print."),
				indicator: "orange",
			});
			frappe.utils.play_sound("error");
			return;
		}

		frappe.run_serially([
			() => this.frm.save(),
			() => {
				frappe.utils.print(
					this.frm.doc.doctype,
					this.frm.doc.name,
					print_format,
					this.frm.doc.letter_head,
					this.frm.doc.language || frappe.boot.lang
				);
			},
		]);
	}

	init_item_details() {
		this.item_details = new erpnext.PointOfSale.ItemDetails({
			wrapper: this.$components_wrapper,
			settings: this.settings,
			events: {
				get_frm: () => this.frm,

				toggle_item_selector: (minimize) => {
					// Item details now opens as a modal overlay, so no grid
					// resizing or payment / item-details card swapping is needed.
					this.cart.toggle_numpad(minimize);
				},

				form_updated: (item, field, value) => {
					const item_row = frappe.model.get_doc(item.doctype, item.name);
					if (item_row && item_row[field] != value) {
						const args = {
							field,
							value,
							item: this.item_details.current_item,
						};
						return this.on_cart_update(args);
					}

					return Promise.resolve();
				},

				highlight_cart_item: (item) => {
					const cart_item = this.cart.get_cart_item(item);
					this.cart.toggle_item_highlight(cart_item);
				},

				item_field_focused: (fieldname) => {
					this.cart.toggle_numpad_field_edit(fieldname);
				},
				set_value_in_current_cart_item: (selector, value) => {
					this.cart.update_selector_value_in_cart_item(
						selector,
						value,
						this.item_details.current_item
					);
				},
				clone_new_batch_item_in_frm: (batch_serial_map, item) => {
					// called if serial nos are 'auto_selected' and if those serial nos belongs to multiple batches
					// for each unique batch new item row is added in the form & cart
					Object.keys(batch_serial_map).forEach((batch) => {
						const item_to_clone = this.frm.doc.items.find((i) => i.name == item.name);
						const new_row = this.frm.add_child("items", { ...item_to_clone });
						// update new serialno and batch
						new_row.batch_no = batch;
						new_row.serial_no = batch_serial_map[batch].join(`\n`);
						new_row.qty = batch_serial_map[batch].length;
						this.frm.doc.items.forEach((row) => {
							if (item.item_code === row.item_code) {
								this.update_cart_html(row);
							}
						});
					});
				},
				remove_item_from_cart: () => this.remove_item_from_cart(),
				get_item_stock_map: () => this.item_stock_map,
				close_item_details: () => {
					this.item_details.toggle_item_details_section(null);
					this.cart.prev_action = null;
					this.cart.toggle_item_highlight();
				},
				get_available_stock: (item_code, warehouse) => this.get_available_stock(item_code, warehouse),
			},
		});
	}

	init_payments() {
		this.payment = new erpnext.PointOfSale.Payment({
			wrapper: this.$components_wrapper,
			settings: this.settings,
			events: {
				get_frm: () => this.frm || {},

				get_customer_details: () => this.customer_details || {},

				toggle_other_sections: (show) => {
					// item details is a modal overlay now, nothing to hide
					if (!show) {
						this.item_selector.toggle_component(true);
					}
				},

				submit_invoice: () => {
					this.frm.savesubmit().then((r) => {
						this.toggle_components(false);
						this.order_summary.toggle_component(true);
						this.order_summary.load_summary_of(this.frm.doc, true);
						frappe.show_alert({
							indicator: "green",
							message: __("POS invoice {0} created succesfully", [r.doc.name]),
						});
					});
				},
			},
		});
	}

	init_recent_order_list() {
		this.recent_order_list = new erpnext.PointOfSale.PastOrderList({
			wrapper: this.$components_wrapper,
			events: {
				open_invoice_data: (name) => {
					frappe.db.get_doc("POS Invoice", name).then((doc) => {
						this.order_summary.load_summary_of(doc);
					});
				},
				reset_summary: () => this.order_summary.toggle_summary_placeholder(true),
			},
		});
	}

	init_order_summary() {
		this.order_summary = new erpnext.PointOfSale.PastOrderSummary({
			wrapper: this.$components_wrapper,
			settings: this.settings,
			events: {
				get_frm: () => this.frm,

				process_return: (name) => {
					this.recent_order_list.toggle_component(false);
					frappe.db.get_doc("POS Invoice", name).then((doc) => {
						frappe.run_serially([
							() => this.make_return_invoice(doc),
							() => this.cart.load_invoice(),
							() => this.item_selector.toggle_component(true),
						]);
					});
				},
				edit_order: (name) => {
					this.recent_order_list.toggle_component(false);
					frappe.run_serially([
						() => this.frm.refresh(name),
						() => this.frm.call("reset_mode_of_payments"),
						() => this.cart.load_invoice(),
						() => this.item_selector.toggle_component(true),
					]);
				},
				delete_order: (name) => {
					frappe.model.delete_doc(this.frm.doc.doctype, name, () => {
						this.recent_order_list.refresh_list();
					});
				},
				new_order: () => {
					frappe.run_serially([
						() => frappe.dom.freeze(),
						() => this.make_new_invoice(),
						() => this.item_selector.toggle_component(true),
						() => this.cart.enable_customer_selection(),
						() => frappe.dom.unfreeze(),
					]);
				},
			},
		});
	}

	toggle_recent_order_list(show) {
		this.show_view("pos");
		this.toggle_components(!show);
		this.recent_order_list.toggle_component(show);
		this.order_summary.toggle_component(show);
	}

	toggle_components(show) {
		this.cart.toggle_component(show);
		this.item_selector.toggle_component(show);

		// do not show item details or payment if recent order is toggled off
		!show ? this.item_details.toggle_component(false) || this.payment.toggle_component(false) : "";
	}

	make_new_invoice() {
		return frappe.run_serially([
			() => frappe.dom.freeze(),
			() => this.make_sales_invoice_frm(),
			() => this.set_pos_profile_data(),
			() => this.set_pos_profile_status(),
			() => this.cart.load_invoice(),
			() => frappe.dom.unfreeze(),
		]);
	}

	make_sales_invoice_frm() {
		const doctype = "POS Invoice";
		return new Promise((resolve) => {
			if (this.frm) {
				this.frm = this.get_new_frm(this.frm);
				this.frm.doc.items = [];
				this.frm.doc.is_pos = 1;
				resolve();
			} else {
				frappe.model.with_doctype(doctype, () => {
					this.frm = this.get_new_frm();
					this.frm.doc.items = [];
					this.frm.doc.is_pos = 1;
					resolve();
				});
			}
		});
	}

	get_new_frm(_frm) {
		const doctype = "POS Invoice";
		const page = $("<div>");
		const frm = _frm || new frappe.ui.form.Form(doctype, page, false);
		const name = frappe.model.make_new_doc_and_get_name(doctype, true);
		frm.refresh(name);

		return frm;
	}

	async make_return_invoice(doc) {
		frappe.dom.freeze();
		this.frm = this.get_new_frm(this.frm);
		this.frm.doc.items = [];
		return frappe.call({
			method: "erpnext.accounts.doctype.pos_invoice.pos_invoice.make_sales_return",
			args: {
				source_name: doc.name,
				target_doc: this.frm.doc,
			},
			callback: (r) => {
				frappe.model.sync(r.message);
				frappe.get_doc(r.message.doctype, r.message.name).__run_link_triggers = false;
				this.set_pos_profile_data().then(() => {
					frappe.dom.unfreeze();
				});
			},
		});
	}

	set_pos_profile_data() {
		if (this.company && !this.frm.doc.company) this.frm.doc.company = this.company;
		if (
			(this.pos_profile && !this.frm.doc.pos_profile) |
			(this.frm.doc.is_return && this.pos_profile != this.frm.doc.pos_profile)
		) {
			this.frm.doc.pos_profile = this.pos_profile;
		}
		this.frm.doc.set_warehouse = this.settings.warehouse;

		if (!this.frm.doc.company) return;

		return this.frm.trigger("set_pos_data");
	}

	set_pos_profile_status() {
		this.page.set_indicator(this.pos_profile, "blue");
	}

	async on_cart_update(args) {
		this.show_view("pos");
		frappe.dom.freeze();
		if (this.frm.doc.set_warehouse !== this.settings.warehouse) {
			this.frm.set_value("set_warehouse", this.settings.warehouse);
		}
		let item_row = undefined;
		try {
			let { field, value, item } = args;
			item_row = this.get_item_from_frm(item);
			const item_row_exists = !$.isEmptyObject(item_row);

			const from_selector = field === "qty" && value === "+1";
			if (from_selector) value = flt(item_row.qty) + flt(value);

			if (item_row_exists) {
				if (field === "qty") value = flt(value);

				if (["qty", "conversion_factor"].includes(field) && value > 0 && !this.allow_negative_stock) {
					const qty_needed =
						field === "qty" ? value * item_row.conversion_factor : item_row.qty * value;
					await this.check_stock_availability(item_row, qty_needed, this.frm.doc.set_warehouse);
				}

				if (this.is_current_item_being_edited(item_row) || from_selector) {
					await frappe.model.set_value(item_row.doctype, item_row.name, field, value);
					if (item.serial_no && from_selector) {
						await frappe.model.set_value(
							item_row.doctype,
							item_row.name,
							"serial_no",
							item_row.serial_no + `\n${item.serial_no}`
						);
					}
					if (["discount_percentage", "rate", "qty", "conversion_factor", "uom"].includes(field)) {
						await this.frm.script_manager.trigger(field, item_row.doctype, item_row.name);
						if (["discount_percentage", "rate"].includes(field)) {
							await this.frm.script_manager.trigger("qty", item_row.doctype, item_row.name);
						}
					}
					this.update_cart_html(item_row);
				}
			} else {
				if (!this.frm.doc.customer) return this.raise_customer_selection_alert();

				const { item_code, batch_no, serial_no, rate, uom, stock_uom } = item;

				if (!item_code) return;

				if (rate == undefined || rate == 0) {
					frappe.show_alert({
						message: __("Price is not set for the item."),
						indicator: "orange",
					});
					frappe.utils.play_sound("error");
					return;
				}
				const new_item = { item_code, batch_no, rate, uom, [field]: value, stock_uom };

				if (serial_no) {
					await this.check_serial_no_availablilty(item_code, this.frm.doc.set_warehouse, serial_no);
					new_item["serial_no"] = serial_no;
				}

				new_item["use_serial_batch_fields"] = 1;
				new_item["warehouse"] = this.settings.warehouse;
				if (field === "serial_no") new_item["qty"] = value.split(`\n`).length || 0;

				item_row = this.frm.add_child("items", new_item);

				if (field === "qty" && value !== 0 && !this.allow_negative_stock) {
					const qty_needed = value * item_row.conversion_factor;
					await this.check_stock_availability(item_row, qty_needed, this.frm.doc.set_warehouse);
				}

				await this.trigger_new_item_events(item_row);

				this.update_cart_html(item_row);

				if (this.item_details.$component.is(":visible")) this.edit_item_details_of(item_row);

				if (
					this.check_serial_batch_selection_needed(item_row) &&
					!this.item_details.$component.is(":visible")
				)
					this.edit_item_details_of(item_row);
			}
		} catch (error) {
			console.log(error);
		} finally {
			frappe.dom.unfreeze();
			return item_row; // eslint-disable-line no-unsafe-finally
		}
	}

	raise_customer_selection_alert() {
		frappe.dom.unfreeze();
		frappe.show_alert({
			message: __("You must select a customer before adding an item."),
			indicator: "orange",
		});
		frappe.utils.play_sound("error");
	}

	get_item_from_frm({ name, item_code, batch_no, uom, rate }) {
		let item_row = null;
		if (name) {
			item_row = this.frm.doc.items.find((i) => i.name == name);
		} else {
			// if item is clicked twice from item selector
			// then "item_code, batch_no, uom, rate" will help in getting the exact item
			// to increase the qty by one
			const has_batch_no = batch_no !== "null" && batch_no !== null;
			item_row = this.frm.doc.items.find(
				(i) =>
					i.item_code === item_code &&
					(!has_batch_no || (has_batch_no && i.batch_no === batch_no)) &&
					i.uom === uom &&
					i.price_list_rate === flt(rate)
			);
		}

		return item_row || {};
	}

	edit_item_details_of(item_row) {
		this.item_details.toggle_item_details_section(item_row);
	}

	is_current_item_being_edited(item_row) {
		return item_row.name == this.item_details.current_item.name;
	}

	update_cart_html(item_row, remove_item) {
		this.cart.update_item_html(item_row, remove_item);
		this.cart.update_totals_section(this.frm);
	}

	check_serial_batch_selection_needed(item_row) {
		// right now item details is shown for every type of item.
		// if item details is not shown for every item then this fn will be needed
		const serialized = item_row.has_serial_no;
		const batched = item_row.has_batch_no;
		const no_serial_selected = !item_row.serial_no;
		const no_batch_selected = !item_row.batch_no;

		if (
			(serialized && no_serial_selected) ||
			(batched && no_batch_selected) ||
			(serialized && batched && (no_batch_selected || no_serial_selected))
		) {
			return true;
		}
		return false;
	}

	async trigger_new_item_events(item_row) {
		await this.frm.script_manager.trigger("item_code", item_row.doctype, item_row.name);
		await this.frm.script_manager.trigger("qty", item_row.doctype, item_row.name);
	}

	async check_stock_availability(item_row, qty_needed, warehouse) {
		const resp = (await this.get_available_stock(item_row.item_code, warehouse)).message;
		const available_qty = resp[0];
		const is_stock_item = resp[1];
		const is_negative_stock_allowed = resp[2];

		frappe.dom.unfreeze();
		const bold_uom = item_row.stock_uom.bold();
		const bold_item_code = item_row.item_code.bold();
		const bold_warehouse = warehouse.bold();
		const bold_available_qty = available_qty.toString().bold();

		if (is_negative_stock_allowed) return;

		if (!(available_qty > 0)) {
			if (is_stock_item) {
				frappe.model.clear_doc(item_row.doctype, item_row.name);
				frappe.throw({
					title: __("Not Available"),
					message: __("Item Code: {0} is not available under warehouse {1}.", [
						bold_item_code,
						bold_warehouse,
					]),
				});
			} else {
				return;
			}
		} else if (is_stock_item && available_qty < qty_needed) {
			frappe.throw({
				message: __(
					"Stock quantity not enough for Item Code: {0} under warehouse {1}. Available quantity {2} {3}.",
					[bold_item_code, bold_warehouse, bold_available_qty, bold_uom]
				),
				indicator: "orange",
			});
			frappe.utils.play_sound("error");
		}
		frappe.dom.freeze();
	}

	async check_serial_no_availablilty(item_code, warehouse, serial_no) {
		const method = "erpnext.stock.doctype.serial_no.serial_no.get_pos_reserved_serial_nos";
		const args = { filters: { item_code, warehouse } };
		const res = await frappe.call({ method, args });

		if (res.message.includes(serial_no)) {
			frappe.throw({
				title: __("Not Available"),
				message: __("Serial No: {0} has already been transacted into another POS Invoice.", [
					serial_no.bold(),
				]),
			});
		}
	}

	get_available_stock(item_code, warehouse) {
		const me = this;
		return frappe.call({
			method: "erpnext.accounts.doctype.pos_invoice.pos_invoice.get_stock_availability",
			args: {
				item_code: item_code,
				warehouse: warehouse,
			},
			callback(res) {
				if (!me.item_stock_map[item_code]) me.item_stock_map[item_code] = {};
				me.item_stock_map[item_code][warehouse] = res.message;
			},
		});
	}

	update_item_field(value, field_or_action) {
		if (field_or_action === "checkout") {
			this.item_details.toggle_item_details_section(null);
		} else if (field_or_action === "remove") {
			this.remove_item_from_cart();
		} else {
			const field_control = this.item_details[`${field_or_action}_control`];
			if (!field_control) return;
			field_control.set_focus();
			value != "" && field_control.set_value(value);
		}
	}

	remove_item_from_cart() {
		frappe.dom.freeze();
		const { doctype, name, current_item } = this.item_details;

		return frappe.model
			.set_value(doctype, name, "qty", 0)
			.then(() => {
				frappe.model.clear_doc(doctype, name);
				this.update_cart_html(current_item, true);
				this.item_details.toggle_item_details_section(null);
				frappe.dom.unfreeze();
			})
			.catch((e) => console.log(e));
	}

	async save_and_checkout() {
		if (this.frm.is_dirty()) {
			let save_error = false;
			await this.frm.save(null, null, null, () => (save_error = true));
			// only move to payment section if save is successful
			!save_error && this.payment.checkout();
			// show checkout button on error
			save_error &&
				setTimeout(() => {
					this.cart.toggle_checkout_btn(true);
				}, 300); // wait for save to finish
		} else {
			this.payment.checkout();
		}
	}
};