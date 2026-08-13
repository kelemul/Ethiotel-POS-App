import onScan from "onscan.js";

erpnext.PointOfSale.ItemSelector = class {
	// eslint-disable-next-line no-unused-vars
	constructor({ frm, wrapper, events, pos_profile, settings }) {
		this.wrapper = wrapper;
		this.events = events;
		this.pos_profile = pos_profile;
		this.hide_images = settings.hide_images;
		this.auto_add_item = settings.auto_add_item_to_cart;
		// view defaults
		this.current_start = 0;
		this.page_length = 200;
		this.view_mode = 'grid'; // 'grid' or 'list'

		this.inti_component();
	}

	inti_component() {
		this.prepare_dom();
		this.make_search_bar();
		this.make_scan_button();
		this.load_items_data();
		this.bind_events();
		this.attach_shortcuts();
	}

	prepare_dom() {
		this.wrapper.append(
			`<section class="items-selector">
				<div class="et-categories-topmost">
					<button class="et-cat-scroll et-cat-scroll-left" title="${__("Scroll left")}">
						<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
					</button>
					<div class="categories-boxes"></div>
					<button class="et-cat-scroll et-cat-scroll-right" title="${__("Scroll right")}">
						<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
					</button>
				</div>
				<div class="filter-section">
					<div class="search-field"></div>
				</div>
				<div class="items-container"></div>
			</section>`
		);

		this.$component = this.wrapper.find(".items-selector");
		this.$items_container = this.$component.find(".items-container");
		this.$categories_wrapper = this.$component.find(".et-categories-topmost");
		this.$categories_boxes = this.$component.find(".categories-boxes");
	}

	async load_items_data() {
		if (!this.item_group) {
			frappe.call({
				method: "ethiotel_pos.ethio_telecom_pos_app.page.ethiotel_pos.ethiotel_pos.get_parent_item_group",
				async: false,
				callback: (r) => {
					if (r.message) this.parent_item_group = r.message;
				},
			});
		}
		if (!this.price_list) {
			const res = await frappe.db.get_value("POS Profile", this.pos_profile, "selling_price_list");
			this.price_list = res.message.selling_price_list;
		}

		this.current_start = 0;
		this.get_items({ start: this.current_start }).then(({ message }) => {
			this.render_item_list(message.items);
			this.update_pagination_state(message.items);
		});
	}

	get_items({ start = 0, page_length = 200, search_term = "" } = {}, no_freeze = false) {
		const doc = this.events.get_frm().doc;
		const price_list = (doc && doc.selling_price_list) || this.price_list;
		let { item_group, pos_profile } = this;

		!item_group && (item_group = this.parent_item_group);

		return frappe.call({
			method: "ethiotel_pos.ethio_telecom_pos_app.page.ethiotel_pos.ethiotel_pos.get_items",
			freeze: !no_freeze,
			args: { start, page_length, price_list, item_group, search_term, pos_profile },
		});
	}

	render_item_list(items) {
		this.$items_container.html("");

		// Use CSS classes instead of inline styles so responsive media queries work
		if (this.view_mode === 'list') {
			this.$items_container.addClass('list-view');
			this.$items_container.html(`
				<table class="item-list-table">
					<thead>
						<tr>
							<th>${__("Item")}</th>
							<th>${__("Barcode")}</th>
							<th>${__("UOM")}</th>
							<th>${__("Price")}</th>
							<th>${__("Stock")}</th>
						</tr>
					</thead>
					<tbody></tbody>
				</table>
			`);
			const $tbody = this.$items_container.find('tbody');
			this.items = items || [];
			items.forEach((item) => {
				$tbody.append(this.get_item_table_row(item));
			});
			return;
		} else {
			this.$items_container.removeClass('list-view');
		}

		this.items = items || [];
		items.forEach((item) => {
			const item_html = this.get_item_html(item);
			this.$items_container.append(item_html);
		});
	}

	get_item_table_row(item) {
		const { item_name, item_code, barcode, uom, price_list_rate, currency, actual_qty, is_stock_item, stock_uom } = item;
		const precision = flt(price_list_rate, 2) % 1 != 0 ? 2 : 0;
		let indicator_color = "";
		let qty_to_display = actual_qty;

		if (is_stock_item) {
			indicator_color = actual_qty > 10 ? "green" : actual_qty <= 0 ? "red" : "orange";

			if (Math.round(qty_to_display) > 999) {
				qty_to_display = Math.round(qty_to_display) / 1000;
				qty_to_display = qty_to_display.toFixed(1) + "K";
			}
		} else {
			qty_to_display = "";
		}

		return `<tr class="item-table-row"
			data-item-code="${escape(item_code)}" data-serial-no="${escape(item.serial_no)}"
			data-batch-no="${escape(item.batch_no)}" data-uom="${escape(uom)}"
			data-rate="${escape(price_list_rate || 0)}"
			data-stock-uom="${escape(stock_uom)}"
			title="${item_name}">
			<td>
				<div class="item-table-name">${frappe.ellipsis(item_name, 36)}</div>
				<div class="item-table-code text-muted">${item_code}</div>
			</td>
			<td>${barcode || ""}</td>
			<td>${uom || ""}</td>
			<td>${format_currency(price_list_rate, currency, precision) || 0}</td>
			<td><span class="indicator-pill whitespace-nowrap ${indicator_color}">${qty_to_display}</span></td>
		</tr>`;
	}

	/* Track whether Prev/Next should be usable and show a small page-range
	   indicator, e.g. "Showing 41-56". Since get_items() doesn't return a
	   total row count, "Next" is disabled once a page comes back shorter
	   than page_length (i.e. we've hit the last page). */
	update_pagination_state(items) {
		const count = (items || []).length;
		const range_start = count ? this.current_start + 1 : 0;
		const range_end = this.current_start + count;

		this.$component.find(".et-page-info").text(
			count ? __("Showing {0}-{1}", [range_start, range_end]) : __("No items")
		);

		this.$component.find(".et-prev-page").prop("disabled", this.current_start <= 0);
		this.$component.find(".et-next-page").prop("disabled", count < this.page_length);
	}

	get_item_html(item) {
		const me = this;
		// eslint-disable-next-line no-unused-vars
		const { item_image, serial_no, batch_no, barcode, actual_qty, uom, price_list_rate } = item;
		const precision = flt(price_list_rate, 2) % 1 != 0 ? 2 : 0;
		let indicator_color;
		let qty_to_display = actual_qty;

		if (item.is_stock_item) {
			indicator_color = actual_qty > 10 ? "green" : actual_qty <= 0 ? "red" : "orange";

			if (Math.round(qty_to_display) > 999) {
				qty_to_display = Math.round(qty_to_display) / 1000;
				qty_to_display = qty_to_display.toFixed(1) + "K";
			}
		} else {
			indicator_color = "";
			qty_to_display = "";
		}

		function get_item_image_html() {
			if (!me.hide_images && item_image) {
				return `<div class="item-qty-pill">
							<span class="indicator-pill whitespace-nowrap ${indicator_color}">${qty_to_display}</span>
						</div>
						<div class="flex items-center justify-center border-b-grey text-6xl text-grey-100" style="height:8rem; min-height:8rem">
							<img
								onerror="cur_pos.item_selector.handle_broken_image(this)"
								class="h-full item-img" src="${item_image}"
								alt="${frappe.get_abbr(item.item_name)}"
							>
						</div>`;
			} else {
				return `<div class="item-qty-pill">
							<span class="indicator-pill whitespace-nowrap ${indicator_color}">${qty_to_display}</span>
						</div>
						<div class="item-display abbr">${frappe.get_abbr(item.item_name)}</div>`;
			}
		}

		return `<div class="item-wrapper"
				data-item-code="${escape(item.item_code)}" data-serial-no="${escape(serial_no)}"
				data-batch-no="${escape(batch_no)}" data-uom="${escape(uom)}"
				data-rate="${escape(price_list_rate || 0)}"
				data-stock-uom="${escape(item.stock_uom)}"
				title="${item.item_name}">

				${get_item_image_html()}

				<div class="item-detail">
					<div class="item-name">
						${frappe.ellipsis(item.item_name, 18)}
					</div>
					<div class="item-rate">${format_currency(price_list_rate, item.currency, precision) || 0} / ${uom}</div>
				</div>
			</div>`;
	}

	handle_broken_image($img) {
		const item_abbr = $($img).attr("alt");
		$($img).parent().replaceWith(`<div class="item-display abbr">${item_abbr}</div>`);
	}

	make_search_bar() {
		const me = this;
		this.$component.find(".search-field").html("");

		this.search_field = frappe.ui.form.make_control({
			df: {
				label: __("Search"),
				fieldtype: "Data",
				placeholder: __("Search by item code, serial number or barcode"),
			},
			parent: this.$component.find(".search-field"),
			render_input: true,
		});
		this.search_field.toggle_label(false);

		this.attach_clear_btn();

		this.$component.find('.search-field').append(`
			<div class="et-selector-controls">
				<button class="barcode-scan-btn" title="${__("Scan barcode with camera")}">
					<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
						<circle cx="12" cy="13" r="4"></circle>
					</svg>
				</button>
				<button class="btn btn-default et-view-grid active">${__("Grid")}</button>
				<button class="btn btn-default et-view-list">${__("List")}</button>
			</div>
		`);

		this.$component.on('click', '.et-view-grid', () => {
			this.view_mode = 'grid';
			this.$component.find('.et-view-grid').addClass('active');
			this.$component.find('.et-view-list').removeClass('active');
			this.render_item_list(this.items);
		});
		this.$component.on('click', '.et-view-list', () => {
			this.view_mode = 'list';
			this.$component.find('.et-view-list').addClass('active');
			this.$component.find('.et-view-grid').removeClass('active');
			this.render_item_list(this.items);
		});

		this.render_categories = async function () {
			const doc = me.events.get_frm && me.events.get_frm() ? me.events.get_frm().doc : null;
			const pos_profile = (doc && doc.pos_profile) || me.pos_profile;

			let groups_raw = [];
			try {
				const res = await frappe.call({
					method: "ethiotel_pos.ethio_telecom_pos_app.page.ethiotel_pos.ethiotel_pos.item_group_query",
					args: {
						doctype: "Item Group",
						txt: "",
						searchfield: "name",
						start: 0,
						page_len: 200,
						filters: pos_profile ? { pos_profile: pos_profile } : {},
					},
				});
				groups_raw = (res && res.message) || [];
			} catch (e) {
				console.warn("[POS] category fetch failed:", e);
			}
			me._categories = groups_raw.map((g) => {
				if (!g) return null;
				if (Array.isArray(g)) return g[0];
				return g.name || g;
			}).filter(Boolean);

			const $box = me.$categories_boxes || me.$component.find('.categories-boxes');
			const $wrap = me.$categories_wrapper || me.$component.find('.et-categories-topmost');
			const $leftBtn = $wrap.find('.et-cat-scroll-left');
			const $rightBtn = $wrap.find('.et-cat-scroll-right');
			const self = me;

			function render_cats() {
				$box.html('');

				const $all = $(`<button class="et-category-btn ${!self.item_group ? 'active' : ''}" data-group="">${__("All Items")}</button>`);
				$all.on('click', () => {
					self.item_group = undefined;
					if (self.item_group_field) self.item_group_field.set_value('');
					render_cats();
					self.filter_items && self.filter_items();
				});
				$box.append($all);

				if (!self._categories || self._categories.length === 0) {
					// Fallback: show a hint so the user knows the bar exists
					const $hint = $(`<button class="et-category-btn et-category-loading" style="background:#fff7ed;color:#b45309;border-color:#fde68a;">${__("Categories loading…")}</button>`);
					$box.append($hint);
					// Retry once after a short delay (frm.doc may not have been ready yet)
					setTimeout(() => self.render_categories(), 1200);
				} else {
					self._categories.forEach((name) => {
						const safe = frappe.utils.escape_html(name);
						const $el = $(`<button class="et-category-btn ${self.item_group === name ? 'active' : ''}" data-group="${safe}">${safe}</button>`);
						$el.on('click', () => {
							self.item_group = name;
							if (self.item_group_field) self.item_group_field.set_value(name);
							render_cats();
							self.filter_items && self.filter_items();
						});
						$box.append($el);
					});
				}

				update_scroll_buttons();
			}

			function update_scroll_buttons() {
				const el = $box[0];
				if (!el) return;
				const overflow = el.scrollWidth > el.clientWidth + 10;
				const canLeft = el.scrollLeft > 4;
				const canRight = el.scrollLeft + el.clientWidth < el.scrollWidth - 4;
				$wrap.css('display', 'flex'); // always visible: categories at top
				if (overflow) {
					$leftBtn.css('display', 'flex').prop('disabled', !canLeft).css('visibility', canLeft ? 'visible' : 'hidden');
					$rightBtn.css('display', 'flex').prop('disabled', !canRight).css('visibility', canRight ? 'visible' : 'hidden');
				} else {
					$leftBtn.css('display', 'none');
					$rightBtn.css('display', 'none');
				}
			}

			$box.off('scroll.et-cat').on('scroll.et-cat', () => update_scroll_buttons());
			$leftBtn.off('click.et-cat').on('click.et-cat', () => {
				$box[0].scrollBy({ left: -300, behavior: 'smooth' });
			});
			$rightBtn.off('click.et-cat').on('click.et-cat', () => {
				$box[0].scrollBy({ left: 300, behavior: 'smooth' });
			});
			$(window).off('resize.et-cat').on('resize.et-cat', () => update_scroll_buttons());

			render_cats();
			setTimeout(() => update_scroll_buttons(), 200);
			setTimeout(() => update_scroll_buttons(), 800);
		};

		this.render_categories();
	}

	attach_clear_btn() {
		this.search_field.$wrapper.find(".control-input").append(
			`<span class="link-btn" style="top: 2px;">
				<a class="btn-open no-decoration" title="${__("Clear")}">
					${frappe.utils.icon("close", "sm")}
				</a>
			</span>`
		);

		this.$clear_search_btn = this.search_field.$wrapper.find(".link-btn");

		this.$clear_search_btn.on("click", "a", () => {
			this.set_search_value("");
			this.search_field.set_focus();
		});
	}
//barcode scanner

	make_scan_button() {
		this.$scan_btn = this.$component.find(".barcode-scan-btn");
		this.$scan_btn.on("click", () => this.open_scanner());
	}

	open_scanner() {
		if (this.scanner_open) return;

		if (!(window.BarcodeDetector || navigator.mediaDevices)) {
			frappe.show_alert({
				message: __("Camera barcode scanning is not supported in this browser."),
				indicator: "orange",
			});
			return;
		}

		if (!window.BarcodeDetector) {
			// lazy-load the polyfill only when the user clicks the button
			frappe.require("/assets/ethiotel_pos/js/vendor/barcode-detector.js", () => {
				this.open_scanner();
			});
			return;
		}

		this.scanner_open = true;
		this.last_detected_barcode = null;
		this.scanner_history = [];
		this.build_scanner_dialog();
		this.start_camera();
	}

	build_scanner_dialog() {
		const me = this;
		this.scanner_dialog = new frappe.ui.Dialog({
			title: __("Scan Barcode"),
			fields: [
				{
					fieldname: "scanner_area",
					fieldtype: "HTML",
					options: `<div class="et-scanner-area">
						<video class="et-scanner-video" autoplay playsinline muted></video>
						<div class="et-scanner-status">${__("Point the camera at a barcode…")}</div>
						<div class="et-scanner-history"></div>
					</div>`,
				},
			],
			primary_action_label: __("Close"),
			primary_action: () => {
				me.close_scanner();
			},
		});
		this.scanner_dialog.show();
		this.$scanner_video = this.scanner_dialog.$wrapper.find(".et-scanner-video");
		this.$scanner_status = this.scanner_dialog.$wrapper.find(".et-scanner-status");
		this.$scanner_history = this.scanner_dialog.$wrapper.find(".et-scanner-history");
	}

	async start_camera() {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({
				video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
				audio: false,
			});
			this.scanner_stream = stream;
			this.$scanner_video[0].srcObject = stream;
			await this.$scanner_video[0].play();

			this.detector = new BarcodeDetector({
				formats: [
					"code_128",
					"code_39",
					"code_93",
					"codabar",
					"ean_13",
					"ean_8",
					"itf",
					"qr_code",
					"data_matrix",
					"pdf417",
				],
			});

			this.detect_loop();
		} catch (err) {
			frappe.show_alert({
				message: __("Could not start camera: {0}", [err.name || err.message]),
				indicator: "orange",
			});
			this.close_scanner();
		}
	}

	detect_loop() {
		if (!this.scanner_open || !this.detector) return;

		this.detector
			.detect(this.$scanner_video[0])
			.then((codes) => {
				if (codes && codes.length) {
					codes.forEach((code) => {
						const barcode = code.rawValue;
						// "stacked" scanning: the camera stays open and every
						// detected barcode adds its item to the cart. The same
						// barcode is only added once per continuous presence in
						// the frame — moving it out of view re-enables it.
						if (barcode !== this.last_detected_barcode) {
							this.last_detected_barcode = barcode;
							this.$scanner_status.html(`${__("Detected:")} <b>${barcode}</b>`);
							this.on_barcode_detected(barcode, true);
						}
					});
					setTimeout(() => this.detect_loop(), 500);
					return;
				}
				// no code in frame — allow the same barcode again next time
				this.last_detected_barcode = null;
				this.detect_loop();
			})
			.catch(() => {
				this.detect_loop();
			});
	}

	async on_barcode_detected(barcode, keep_open = true) {
		this.scan_barcode = barcode;
		const { message } = await this.get_items({ search_term: barcode }, true);
		const items = (message && message.items) || [];

		if (items.length === 1) {
			const item = items[0];
			this.events.item_selected({
				field: "qty",
				value: "+1",
				item: {
					item_code: item.item_code,
					batch_no: item.batch_no,
					serial_no: item.serial_no,
					uom: item.uom,
					rate: item.price_list_rate,
					stock_uom: item.stock_uom,
				},
			});
			frappe.utils.play_sound("submit");
			this.update_scanner_history(barcode, item.item_name);
			this.$scanner_status.html(
				`${__("Added")} <b>${frappe.ellipsis(item.item_name, 22)}</b> — ${__("scan next…")}`
			);
		} else if (items.length === 0) {
			frappe.utils.play_sound("error");
			this.$scanner_status.html(`${__("No item found for barcode")} <b>${barcode}</b>`);
		}

		if (!keep_open) {
			this.close_scanner();
		}
	}

	update_scanner_history(barcode, item_name) {
		if (!this.$scanner_history) return;
		const label = item_name ? `${frappe.ellipsis(item_name, 20)} (${barcode})` : barcode;
		this.scanner_history = this.scanner_history || [];
		this.scanner_history.push(label);
		const values = this.scanner_history.slice(-6).reverse();
		this.$scanner_history.html(`
			<div class="et-scanner-history-title">${__("Scanned")}</div>
			<div class="et-scanner-history-list">${values
				.map((value) => `<div class="et-scanner-history-item">${frappe.utils.escape_html(value)}</div>`)
				.join("")}
			</div>
		`);
	}

	close_scanner() {
		this.scanner_open = false;
		this.detector = null;
		if (this.scanner_stream) {
			this.scanner_stream.getTracks().forEach((t) => t.stop());
			this.scanner_stream = null;
		}
		if (this.scanner_dialog) {
			this.scanner_dialog.hide();
			this.scanner_dialog = null;
		}
	}

	set_search_value(value) {
		$(this.search_field.$input[0]).val(value).trigger("input");
	}

	bind_events() {
		const me = this;
		window.onScan = onScan;

		onScan.decodeKeyEvent = function (oEvent) {
			var iCode = this._getNormalizedKeyNum(oEvent);
			switch (true) {
				case iCode >= 48 && iCode <= 90: // numbers and letters
				case iCode >= 106 && iCode <= 111: // operations on numeric keypad (+, -, etc.)
				case (iCode >= 160 && iCode <= 164) || iCode == 170: // ^ ! # $ *
				case iCode >= 186 && iCode <= 194: // (; = , - . / `)
				case iCode >= 219 && iCode <= 222: // ([ \ ] ')
				case iCode == 32: // spacebar
					if (oEvent.key !== undefined && oEvent.key !== "") {
						return oEvent.key;
					}

					var sDecoded = String.fromCharCode(iCode);
					switch (oEvent.shiftKey) {
						case false:
							sDecoded = sDecoded.toLowerCase();
							break;
						case true:
							sDecoded = sDecoded.toUpperCase();
							break;
					}
					return sDecoded;
				case iCode >= 96 && iCode <= 105: // numbers on numeric keypad
					return 0 + (iCode - 96);
			}
			return "";
		};

		onScan.attachTo(document, {
			onScan: (sScancode) => {
				if (this.search_field && this.$component.is(":visible")) {
					this.search_field.set_focus();
					this.set_search_value(sScancode);
					this.barcode_scanned = true;
				}
			},
		});

		this.$component.on("click", ".item-wrapper, .item-table-row", function () {
			const $item = $(this);
			const item_code = unescape($item.attr("data-item-code"));
			let batch_no = unescape($item.attr("data-batch-no"));
			let serial_no = unescape($item.attr("data-serial-no"));
			let uom = unescape($item.attr("data-uom"));
			let rate = unescape($item.attr("data-rate"));
			let stock_uom = unescape($item.attr("data-stock-uom"));

			// escape(undefined) returns "undefined" then unescape returns "undefined"
			batch_no = batch_no === "undefined" ? undefined : batch_no;
			serial_no = serial_no === "undefined" ? undefined : serial_no;
			uom = uom === "undefined" ? undefined : uom;
			rate = rate === "undefined" ? undefined : rate;
			stock_uom = stock_uom === "undefined" ? undefined : stock_uom;

			me.events.item_selected({
				field: "qty",
				value: "+1",
				item: { item_code, batch_no, serial_no, uom, rate, stock_uom },
			});
			me.search_field.set_focus();
		});

		this.search_field.$input.on("input", (e) => {
			clearTimeout(this.last_search);
			this.last_search = setTimeout(() => {
				const search_term = e.target.value;
				this.filter_items({ search_term });
			}, 300);

			this.$clear_search_btn.toggle(Boolean(this.search_field.$input.val()));
		});

		this.search_field.$input.on("focus", () => {
			this.$clear_search_btn.toggle(Boolean(this.search_field.$input.val()));
		});
	}

	attach_shortcuts() {
		const ctrl_label = frappe.utils.is_mac() ? "⌘" : "Ctrl";
		this.search_field.parent.attr("title", `${ctrl_label}+I`);
		frappe.ui.keys.add_shortcut({
			shortcut: "ctrl+i",
			action: () => this.search_field.set_focus(),
			condition: () => this.$component.is(":visible"),
			description: __("Focus on search input"),
			ignore_inputs: true,
			page: cur_page.page.page,
		});

		// for selecting the last filtered item on search
		frappe.ui.keys.on("enter", () => {
			const selector_is_visible = this.$component.is(":visible");
			if (!selector_is_visible || this.search_field.get_value() === "") return;

			if (this.items.length == 1) {
				this.$items_container.find(".item-wrapper").click();
				frappe.utils.play_sound("submit");
				this.set_search_value("");
			} else if (this.items.length == 0 && this.barcode_scanned) {
				// only show alert of barcode is scanned and enter is pressed
				frappe.show_alert({
					message: __("No items found. Scan barcode again."),
					indicator: "orange",
				});
				frappe.utils.play_sound("error");
				this.barcode_scanned = false;
				this.set_search_value("");
			}
		});
	}

	filter_items({ search_term = "" } = {}) {
		const selling_price_list = this.events.get_frm().doc.selling_price_list;
		this.last_search_term = search_term;
		this.current_start = 0;

		if (search_term) {
			search_term = search_term.toLowerCase();

			// memoize
			this.search_index = this.search_index || {};
			this.search_index[selling_price_list] = this.search_index[selling_price_list] || {};
			if (this.search_index[selling_price_list][search_term]) {
				const items = this.search_index[selling_price_list][search_term];
				this.items = items;
				this.render_item_list(items);
				this.update_pagination_state(items);
				this.auto_add_item &&
					this.search_field.$input[0].value &&
					this.items.length == 1 &&
					this.add_filtered_item_to_cart();
				return;
			}
		}

		this.get_items({ search_term }).then(({ message }) => {
			// eslint-disable-next-line no-unused-vars
			const { items, serial_no, batch_no, barcode } = message;
			if (search_term && !barcode) {
				this.search_index[selling_price_list][search_term] = items;
			}
			this.items = items;
			this.render_item_list(items);
			this.update_pagination_state(items);
			this.auto_add_item &&
				this.search_field.$input[0].value &&
				this.items.length == 1 &&
				this.add_filtered_item_to_cart();
		});
	}

	add_filtered_item_to_cart() {
		this.$items_container.find(".item-wrapper").click();
		this.set_search_value("");
	}

	resize_selector(minimize) {
		// New 2-column layout: CART (left col) + EVERYTHING ELSE (right col).
		// Minimizing the item-selector happens when the item-details panel
		// is opened for editing — we widen the right column at cost of cart.
		// this.wrapper IS the .point-of-sale-app grid container itself:
		const $app = this.wrapper && this.wrapper.filter
			? this.wrapper.filter(".point-of-sale-app")
			: $(this.wrapper).closest(".point-of-sale-app");
		if ($app && $app.length) {
			$app.toggleClass("et-detail-mode", !!minimize);
		} else {
			// Fallback — just in case wrapper context changes
			$(".point-of-sale-app").toggleClass("et-detail-mode", !!minimize);
		}

		// Also mark the selector itself for compact styling
		this.$component.toggleClass("et-selector-minimized", !!minimize);
		this.$items_container.toggleClass("et-minimized-grid", !!minimize);
	}

	toggle_component(show) {
		this.set_search_value("");
		this.$component.css("display", show ? "flex" : "none");
	}
};