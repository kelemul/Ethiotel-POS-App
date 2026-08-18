// public/js/workspace_branding.js
frappe.provide("ethiotel.workspace_branding");

ethiotel.workspace_branding.SHORTCUT_BG = "linear-gradient(155deg, #ffffff 60%, rgba(0,150,57,0.08))";
ethiotel.workspace_branding.LINKS_BG = "linear-gradient(160deg, #ffffff 55%, rgba(0,82,155,0.06))";

ethiotel.workspace_branding.apply = function () {
	if (!frappe.get_route || frappe.get_route()[0] !== "workspaces") return;

	document.querySelectorAll("#page-Workspaces .shortcut-widget-box").forEach((el) => {
		el.style.setProperty("background", ethiotel.workspace_branding.SHORTCUT_BG, "important");
		el.style.setProperty("background-color", "transparent", "important");
		el.querySelectorAll(".widget-head, .widget-body, .widget-footer").forEach((child) => {
			child.style.setProperty("background", "transparent", "important");
			child.style.setProperty("background-color", "transparent", "important");
		});
	});

	document.querySelectorAll("#page-Workspaces .links-widget-box").forEach((el) => {
		el.style.setProperty("background", ethiotel.workspace_branding.LINKS_BG, "important");
		el.style.setProperty("background-color", "transparent", "important");
		el.querySelectorAll(".widget-head, .widget-body").forEach((child) => {
			child.style.setProperty("background", "transparent", "important");
			child.style.setProperty("background-color", "transparent", "important");
		});
	});
};

// initial + on every route/render change
$(document).on("page-change", () => setTimeout(ethiotel.workspace_branding.apply, 150));
frappe.after_ajax && frappe.after_ajax(() => setTimeout(ethiotel.workspace_branding.apply, 150));

// catch Editor.js re-renders (drag/reorder, widget refresh, color picker changes)
const et_observer = new MutationObserver(() => ethiotel.workspace_branding.apply());
$(document).on("app_ready", () => {
	const attach = () => {
		const target = document.getElementById("page-Workspaces");
		if (target) {
			et_observer.observe(target, { childList: true, subtree: true, attributes: true, attributeFilter: ["style"] });
			ethiotel.workspace_branding.apply();
		} else {
			setTimeout(attach, 300);
		}
	};
	attach();
});