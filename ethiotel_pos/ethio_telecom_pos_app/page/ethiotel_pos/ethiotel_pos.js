frappe.provide("erpnext.PointOfSale");

(function () {
	function apply_ethiopos_fullscreen_layout() {
		$("body").addClass("ethiopos-fullscreen");
		const $navbar = $(".navbar-home, header.navbar, #navbar-breadcrumbs, .navbar-container");
		const $sidebar = $("#sidebar, .sidebar, .sidebar-container");
		const $pageHead = $(".page-head, .page-header, .page-actions, .layout-main-section-header");
		const $breadcrumbs = $(".breadcrumb-container, #page-breadcrumbs, .page-breadcrumbs");

		$navbar.each((_, el) => {
			const $el = $(el);
			$el.data("eth-pos-orig-display", $el.css("display"));
			$el.css("display", "none");
		});
		$sidebar.each((_, el) => {
			const $el = $(el);
			$el.data("eth-pos-orig-display", $el.css("display"));
			$el.css("display", "none");
		});
		$pageHead.each((_, el) => {
			const $el = $(el);
			$el.data("eth-pos-orig-display", $el.css("display"));
			$el.css("display", "none");
		});
		$breadcrumbs.each((_, el) => {
			const $el = $(el);
			$el.data("eth-pos-orig-display", $el.css("display"));
			$el.css("display", "none");
		});

		$(".page-container").addClass("ethiopos-page-container");
		$(".layout-main-section").addClass("ethiopos-layout-main");
		$("#page-ethiotel-pos, [data-page-route='ethiotel-pos']").addClass("ethiopos-page-route");
	}

	frappe.pages["ethiotel-pos"].on_page_load = function (wrapper) {
		frappe.ui.make_app_page({
			parent: wrapper,
			title: __("Point of Sale"),
			single_column: true,
		});

		frappe.require("ethiotel-pos.bundle.js", function () {
			setTimeout(apply_ethiopos_fullscreen_layout, 30);
			setTimeout(apply_ethiopos_fullscreen_layout, 250);
			setTimeout(apply_ethiopos_fullscreen_layout, 800);
			$(window).on("hashchange.eth-pos", () => {
				if (frappe.get_route && frappe.get_route()[0] !== "ethiotel-pos") {
					restore_ethiopos_fullscreen_layout();
				} else {
					apply_ethiopos_fullscreen_layout();
				}
			});
			wrapper.pos = new erpnext.PointOfSale.Controller(wrapper);
			window.cur_pos = wrapper.pos;
		});
	};

	function restore_ethiopos_fullscreen_layout() {
		$("body").removeClass("ethiopos-fullscreen");
		$(".navbar-home, header.navbar, #navbar-breadcrumbs, .navbar-container").each((_, el) => {
			const $el = $(el);
			const orig = $el.data("eth-pos-orig-display");
			if (orig !== undefined) $el.css("display", orig);
			else $el.css("display", "");
		});
		$("#sidebar, .sidebar, .sidebar-container").each((_, el) => {
			const $el = $(el);
			const orig = $el.data("eth-pos-orig-display");
			if (orig !== undefined) $el.css("display", orig);
			else $el.css("display", "");
		});
		$(".page-head, .page-header, .page-actions, .layout-main-section-header").each((_, el) => {
			const $el = $(el);
			const orig = $el.data("eth-pos-orig-display");
			if (orig !== undefined) $el.css("display", orig);
			else $el.css("display", "");
		});
		$(".breadcrumb-container, #page-breadcrumbs, .page-breadcrumbs").each((_, el) => {
			const $el = $(el);
			const orig = $el.data("eth-pos-orig-display");
			if (orig !== undefined) $el.css("display", orig);
			else $el.css("display", "");
		});
		$(".page-container").removeClass("ethiopos-page-container");
		$(".layout-main-section").removeClass("ethiopos-layout-main");
	}

	frappe.pages["ethiotel-pos"].refresh = function (wrapper) {
		setTimeout(apply_ethiopos_fullscreen_layout, 30);
		setTimeout(apply_ethiopos_fullscreen_layout, 200);
		if (document.scannerDetectionData) {
			onScan.detachFrom(document);
			wrapper.pos.wrapper.html("");
			wrapper.pos.check_opening_entry();
		}
	};
})();
