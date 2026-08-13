// =====================================================================
// PHASE 4 — WORKSPACE MANAGER
// Registry of workspaces. Each one is instantiated lazily on first use
// and cached, so the shell never leaves the page — only the active
// workspace panel changes.
// =====================================================================
erpnext.POSV2 = erpnext.POSV2 || {};

erpnext.POSV2.WorkspaceManager = class {
	constructor({ shell }) {
		this.shell = shell;
		this.registry = {};
		this.instances = {};
		this.current = null;
		this.$container = shell.$workspace;
	}

	register(name, Ctor) {
		this.registry[name] = Ctor;
		return this;
	}

	async show(name, opts = {}) {
		if (name === this.current) {
			// still re-fire refresh so data stays fresh
			if (this.instances[name] && this.instances[name].refresh) {
				this.instances[name].refresh(opts);
			}
			return;
		}

		// hide previous
		if (this.current && this.instances[this.current]) {
			this.instances[this.current].$el && this.instances[this.current].$el.removeClass("etv2-active");
			this.instances[this.current].hide && this.instances[this.current].hide();
		}

		// drop the "Loading workspace…" placeholder once the first real
		// workspace mounts (it must never linger over rendered content)
		if (!this.real_mounted) {
			this.$container.find(".etv2-workspace-empty").remove();
			this.real_mounted = true;
		}

		let ws = this.instances[name];
		if (!ws) {
			const Ctor = this.registry[name];
			if (!Ctor) {
				frappe.show_alert({ message: __(`Unknown workspace: ${name}`), indicator: "red" });
				return;
			}
			ws = new Ctor({ shell: this.shell, workspace: this, container: this.$container, name });
			this.instances[name] = ws;
			ws.$el && this.$container.append(ws.$el);
		}

		ws.$el.addClass("etv2-active");
		ws.show && ws.show(opts);
		this.current = name;

		this.shell.sidebar.set_active(name);
		setTimeout(() => $(window).trigger("resize"), 60);
	}
};