frappe.pages["ethiotel-pos"].on_page_load = function (wrapper) {
	frappe.ui.make_app_page({
		parent: wrapper,
		title: __("Point of Sale"),
		single_column: true,
	});

	// page-scoped stylesheets (not added to hooks.py so they never leak
	// onto other Desk pages) — one file per UI component, under css/ui/.
	// Load order matters: tokens first, cascade preserved, responsive last.
	["ui/ethiotel_pos_tokens.css",
	 "ui/ethiotel_pos_shell.css",
	 "ui/ethiotel_pos_topbar.css",
	 "ui/ethiotel_pos_sidebar.css",
	 "ui/ethiotel_pos_dropdown.css",
	 "ui/ethiotel_pos_primitives.css",
	 "ui/ethiotel_pos_buttons.css",
	 "ui/ethiotel_pos_sale.css",
	 "ui/ethiotel_pos_dashboard.css",
	 "ui/ethiotel_pos_orders.css",
	 "ui/ethiotel_pos_reports.css",
	 "ui/ethiotel_pos_mor.css",
	 "ui/ethiotel_pos_dialogs.css",
	 "ui/ethiotel_pos_payment.css",
	 "ui/ethiotel_pos_checkin.css",
	 "ui/ethiotel_pos_forkiva_sale.css",
	 "ui/ethiotel_pos_responsive.css"].forEach((f) => {
		$('<link rel="stylesheet">').attr("href", `/assets/ethiotel_pos/css/${f}`).appendTo(document.head);
	});

	// when offline.
	$('<link rel="stylesheet">')
		.attr("href", "https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap")
		.appendTo(document.head);

	// ---- Print helper: every print opens in a new popped-out window ----
	// `frappe.utils.print` is often invoked from inside async frappe.call
	// callbacks (after save/submit). Browsers block window.open() there as a
	// non-gesture popup, so no window appears. These helpers open the window
	// from a user gesture (or a placeholder captured in the gesture) and point
	// it at Frappe's /printview route with trigger_print=1.
	const PRINT_FEATURES = "width=900,height=720,menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes";
	window.ethiotel_print_url = function (doctype, name, print_format, opts) {
		opts = opts || {};
		const lang = opts.lang || (frappe.boot && frappe.boot.lang) || "en";
		const letterhead = opts.letterhead || "";
		return frappe.urllib.get_full_url(
			"/printview?doctype=" + encodeURIComponent(doctype) +
			"&name=" + encodeURIComponent(name) +
			"&trigger_print=1" +
			"&format=" + encodeURIComponent(print_format) +
			"&no_letterhead=" + (letterhead ? "0" : "1") +
			"&letterhead=" + encodeURIComponent(letterhead) +
			"&_lang=" + encodeURIComponent(lang)
		);
	};
	window.ethiotel_print = function (doctype, name, print_format, opts) {
		const win = window.open(ethiotel_print_url(doctype, name, print_format, opts), "_blank", PRINT_FEATURES);
		if (!win) frappe.msgprint(__("Please allow pop-ups to print the document."));
		return win;
	};
	// Capture a blank popup window during a user gesture, then set its
	// location once the (async) document name becomes available.
	window.ethiotel_print_placeholder = function () {
		const win = window.open("", "_blank", PRINT_FEATURES);
		if (!win) frappe.msgprint(__("Please allow pop-ups to print the document."));
		return win;
	};

	frappe.require("ethiotel-pos-v2.bundle.js", function () {
		wrapper.pos_v2 = new erpnext.POSV2.Shell(wrapper);
		window.cur_pos_v2 = wrapper.pos_v2;
	});
};