// Page entry for Ethiotel POS V2 — loads the bundle then boots the shell.
frappe.pages["ethiotel-pos-v2"].on_page_load = function (wrapper) {
	frappe.ui.make_app_page({
		parent: wrapper,
		title: __("Point of Sale"),
		single_column: true,
	});

	// page-scoped stylesheets (not added to hooks.py so they never leak
	// onto other Desk pages)
	["ethiotel_pos_v2_layout.css", "ethiotel_pos_v2_components.css", "ethiotel_pos_v2_forkiva.css"].forEach((f) => {
		$('<link rel="stylesheet">').attr("href", `/assets/ethiotel_pos/css/${f}`).appendTo(document.head);
	});

	// when offline.
	$('<link rel="stylesheet">')
		.attr("href", "https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap")
		.appendTo(document.head);

	frappe.require("ethiotel-pos-v2.bundle.js", function () {
		wrapper.pos_v2 = new erpnext.POSV2.Shell(wrapper);
		window.cur_pos_v2 = wrapper.pos_v2;
	});
};