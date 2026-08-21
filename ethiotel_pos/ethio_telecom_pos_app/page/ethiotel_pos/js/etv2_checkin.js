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
                    <h2 class="etv2-page-title">${__("Shift Management")}</h2>
                    <div class="etv2-checkin-status"></div>
                </div>
                <div class="etv2-checkin-body">
                    <!-- Dynamic Content Injected Here -->
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
        const $body = this.$el.find(".etv2-checkin-body");

        if (!entry) {
            // BEAUTIFUL EMPTY STATE
            $status.html(`<span class="etv2-pill etv2-pill-muted">${__("Offline")}</span>`);
            $body.html(`
                <div class="etv2-empty-state-wrapper">
                    <div class="etv2-empty-state">
                        <div class="etv2-empty-icon">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="3" y1="9" x2="21" y2="9"></line>
                                <line x1="9" y1="21" x2="9" y2="9"></line>
                            </svg>
                        </div>
                        <h3>${__("Ready to start selling?")}</h3>
                        <p class="etv2-text-muted">${__("You don't have an active shift. Open a new shift to start processing sales and managing the register.")}</p>
                        <button class="etv2-btn etv2-btn-primary etv2-btn-large etv2-checkin-open-btn">
                            ${__("Open New Shift")}
                        </button>
                    </div>
                </div>
            `);
            this.$el.find(".etv2-checkin-open-btn").on("click", () => this.shell.open_shift_dialog());
            return;
        }

        // ACTIVE SHIFT STATE
        $status.html(`<span class="etv2-pill etv2-pill-green"><span class="etv2-indicator-dot blink"></span>${__("Active Shift")} · ${frappe.datetime.str_to_user(shell.pos_opening_time)}</span>`);
        
        // Setup Grid Layout
        $body.html(`
            <div class="etv2-checkin-grid">
                <!-- Left Column: Shift Info -->
                <div class="etv2-card etv2-shift-info-card">
                    <div class="etv2-card-header"><span class="etv2-card-title">${__("Current Shift Details")}</span></div>
                    <div class="etv2-card-body etv2-checkin-shift">
                        <div class="etv2-info-group">
                            <label>${__("Opening Entry")}</label>
                            <div class="etv2-info-value">${frappe.utils.escape_html(entry)}</div>
                        </div>
                        <div class="etv2-info-group">
                            <label>${__("POS Profile")}</label>
                            <div class="etv2-info-value">${frappe.utils.escape_html(shell.pos_profile)}</div>
                        </div>
                        <div class="etv2-info-group">
                            <label>${__("Company")}</label>
                            <div class="etv2-info-value">${frappe.utils.escape_html(shell.company)}</div>
                        </div>
                        <div class="etv2-info-group">
                            <label>${__("Opened At")}</label>
                            <div class="etv2-info-value">${frappe.datetime.str_to_user(shell.pos_opening_time)}</div>
                        </div>
                    </div>
                </div>

                <!-- Right Column: Summary & Actions -->
                <div class="etv2-card etv2-shift-summary-card">
                    <div class="etv2-card-header"><span class="etv2-card-title">${__("Live Shift Summary")}</span></div>
                    <div class="etv2-card-body etv2-checkin-summary">
                        <div class="etv2-loading-shimmer">Loading summary...</div>
                    </div>
                </div>
            </div>
        `);

        const $summary = this.$el.find(".etv2-checkin-summary");
        const pv = shell.get_pv();

        frappe.call({
            method: `${pv}.get_shift_summary`,
            args: { pos_opening: entry },
        }).then((r) => {
            const d = r.message || {};
            
            $summary.html(`
                <!-- High-level Metrics -->
                <div class="etv2-metrics-grid">
                    <div class="etv2-metric-box metric-highlight">
                        <span class="etv2-metric-label">${__("Total Sales")}</span>
                        <span class="etv2-metric-value">${format_currency(d.sales_total || 0)}</span>
                    </div>
                    <div class="etv2-metric-box">
                        <span class="etv2-metric-label">${__("Invoices")}</span>
                        <span class="etv2-metric-value">${d.invoice_count || 0}</span>
                    </div>
                    <div class="etv2-metric-box">
                        <span class="etv2-metric-label">${__("Customers")}</span>
                        <span class="etv2-metric-value">${d.customer_count || 0}</span>
                    </div>
                </div>

                <div class="etv2-summary-sections">
                    <!-- Payments Received -->
                    <div class="etv2-summary-section">
                        <div class="etv2-section-title">${__("Payments Received")}</div>
                        <div class="etv2-breakdown-list">
                            ${(d.payments || []).length ? d.payments.map((p) => `
                                <div class="etv2-breakdown-row">
                                    <span class="etv2-breakdown-label">${frappe.utils.escape_html(p.mode_of_payment)}</span>
                                    <span class="etv2-breakdown-amount">${format_currency(p.amount)}</span>
                                </div>`).join("") : `<div class="etv2-empty-text">${__("No payments recorded yet.")}</div>`}
                        </div>
                    </div>

                    <!-- Opening Balance -->
                    <div class="etv2-summary-section">
                        <div class="etv2-section-title">${__("Opening Balance")}</div>
                        <div class="etv2-breakdown-list">
                            ${Object.keys(d.opening_balance || {}).length ? Object.keys(d.opening_balance).map((m) => `
                                <div class="etv2-breakdown-row">
                                    <span class="etv2-breakdown-label">${frappe.utils.escape_html(m)}</span>
                                    <span class="etv2-breakdown-amount">${format_currency(d.opening_balance[m])}</span>
                                </div>`).join("") : `<div class="etv2-empty-text">${__("No opening balance.")}</div>`}
                        </div>
                    </div>
                </div>

            `);
        });
    }
};