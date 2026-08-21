// public/js/workspace_branding.js
frappe.provide("ethiotel.workspace_branding");

ethiotel.workspace_branding.SHORTCUT_BG = "linear-gradient(155deg, #ffffff 60%, rgba(0,150,57,0.08))";
ethiotel.workspace_branding.LINKS_BG = "linear-gradient(160deg, #ffffff 55%, rgba(0,82,155,0.06))";

// true while the workspace block editor is open — branding must not run then,
// otherwise its forced inline styles fight the editor and cause an infinite
// MutationObserver feedback loop (screen flicker, components can't be selected).
ethiotel.workspace_branding.is_editing = function () {
	const section = document.querySelector("#page-Workspaces .layout-main-section");
	return !!(section && section.classList.contains("edit-mode"));
};

// write an inline style only when it actually differs.
// this is what prevents the observer -> rewrite -> mutate -> observer loop.
ethiotel.workspace_branding.set_prop = function (el, prop, value) {
	if (el.style.getPropertyValue(prop) !== value) {
		el.style.setProperty(prop, value, "important");
	}
};

ethiotel.workspace_branding.apply = function () {
	if (!frappe.get_route || frappe.get_route()[0] !== "workspaces") return;
	if (ethiotel.workspace_branding.is_editing()) return;

	document.querySelectorAll("#page-Workspaces .shortcut-widget-box").forEach((el) => {
		ethiotel.workspace_branding.set_prop(el, "background", ethiotel.workspace_branding.SHORTCUT_BG);
		ethiotel.workspace_branding.set_prop(el, "background-color", "transparent");
		el.querySelectorAll(".widget-head, .widget-body, .widget-footer").forEach((child) => {
			ethiotel.workspace_branding.set_prop(child, "background", "transparent");
			ethiotel.workspace_branding.set_prop(child, "background-color", "transparent");
		});
	});

	document.querySelectorAll("#page-Workspaces .links-widget-box").forEach((el) => {
		ethiotel.workspace_branding.set_prop(el, "background", ethiotel.workspace_branding.LINKS_BG);
		ethiotel.workspace_branding.set_prop(el, "background-color", "transparent");
		el.querySelectorAll(".widget-head, .widget-body").forEach((child) => {
			ethiotel.workspace_branding.set_prop(child, "background", "transparent");
			ethiotel.workspace_branding.set_prop(child, "background-color", "transparent");
		});
	});
};

// initial + on every route/render change
$(document).on("page-change", () => setTimeout(ethiotel.workspace_branding.apply, 150));
frappe.after_ajax && frappe.after_ajax(() => setTimeout(ethiotel.workspace_branding.apply, 150));

// catch Editor.js re-renders (drag/reorder, widget refresh, color picker changes)
// mutations no longer re-trigger a style rewrite, so there is no feedback loop
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
