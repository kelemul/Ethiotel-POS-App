// =====================================================================
// PHASE 1 — HTML TEMPLATE
// The V2 POS shell. One page, everything else is a component that gets
// swapped inside #etv2-workspace by the WorkspaceManager.
//
//   +--------------------------------------------------------------+
//   |  Ethiotel POS      (search?)              User  Shift  Gear   |
//   +------------+-------------------------------------------------+
//   | Sidebar    |                                                 |
//   |  Sale      |             WORKSPACE                           |
//   |  Held      |                                                 |
//   |  Dashboard |                                                 |
//   |  Customers |                                                 |
//   |  Returns   |                                                 |
//   |  Reports   |                                                 |
//   |  Settings  |                                                 |
//   +------------+-------------------------------------------------+
//   |  Status Bar                                                  |
//   +--------------------------------------------------------------+
// =====================================================================
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
