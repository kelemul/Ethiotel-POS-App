
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
	<div class="fk-menu-wrap fk-actions-menu-wrap">
		<button class="etv2-icon-btn fk-actions-trigger" title="${__("Actions")}">
			<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>
		</button>
		<div class="fk-dropdown-menu fk-actions-menu">
			<div class="fk-menu-item" data-action="return_invoice">
				<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg>
				<span>${__("Return Invoice")}</span>
			</div>
			<div class="fk-menu-item" data-action="resync">
				<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
				<span>${__("Resync")}</span>
			</div>
			<div class="fk-menu-item" data-action="print_last_invoice">
				<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9V2h12v7"></path><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
				<span>${__("Print Last Invoice")}</span>
			</div>
			<div class="fk-menu-item fk-menu-item-disabled" data-action="send_to_mor">
				<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
				<span>${__("Send to MoR")}</span>
				<span class="fk-menu-badge">${__("Soon")}</span>
			</div>
		</div>
	</div>

	<button class="etv2-icon-btn etv2-home-btn" title="${__("Exit POS")}">
		<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
	</button>

	<div class="etv2-network etv2-online">
		<span class="etv2-network-dot"></span><span class="etv2-network-label">${__("Online")}</span>
	</div>

	<div class="fk-menu-wrap fk-profile-menu-wrap">
		<button class="fk-profile-btn fk-profile-trigger">
			<span class="etv2-avatar"></span>
			<span class="fk-profile-name">${frappe.utils.escape_html(frappe.session.user_fullname || frappe.session.user)}</span>
			<svg class="fk-caret" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
		</button>
		<div class="fk-dropdown-menu fk-profile-menu">
			<div class="fk-menu-header">
				<div class="fk-menu-header-name">${frappe.utils.escape_html(frappe.session.user_fullname || frappe.session.user)}</div>
				<div class="fk-menu-header-shift">${__("Shift")}: <span class="fk-shift-time">${__("Not opened")}</span></div>
			</div>
			<div class="fk-menu-divider"></div>
			<div class="fk-menu-item" data-profile-action="my_profile"><span>${__("My Profile")}</span></div>
			<div class="fk-menu-item" data-profile-action="apps"><span>${__("Apps")}</span></div>
			<div class="fk-menu-item" data-profile-action="fullscreen"><span>${__("Toggle Full Screen")}</span></div>
			<div class="fk-menu-divider"></div>
			<div class="fk-menu-item fk-menu-item-danger" data-profile-action="sign_out"><span>${__("Sign Out")}</span></div>
		</div>
	</div>

	<button class="etv2-icon-btn etv2-settings-btn" data-ws="settings" title="${__("Settings")}">
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
				<button class="etv2-nav-item etv2-nav-mor" data-ws="mor">
					<span class="etv2-nav-icon">
						<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16v12H5.17L4 19.17V4z"></path><polyline points="8 8 16 8 16 10 8 10 8 8"></polyline><line x1="8" y1="13" x2="16" y2="13"></line></svg>
					</span>
					<span class="etv2-nav-label">MoR Invoices</span>
				</button>
				<button class="etv2-nav-item etv2-nav-settings" data-ws="settings">
					<span class="etv2-nav-icon">
						<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
					</span>
					<span class="etv2-nav-label">Settings</span>
				</button>
			</nav>
		</aside>
<div class="etv2-drawer-scrim"></div>
		<!-- ===================== WORKSPACE ===================== -->
		<main class="etv2-workspace" id="etv2-workspace">
			<div class="etv2-workspace-empty">
				<div class="etv2-spinner"></div>
				<p>Loading workspace…</p>
			</div>
		</main>

	<!-- ===================== STATUS BAR ===================== -->
	<footer class="etv2-statusbar">
		<div class="etv2-status-left">
			<span class="etv2-status-profile">Profile: —</span>
			<span class="etv2-status-warehouse">Warehouse: —</span>
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
