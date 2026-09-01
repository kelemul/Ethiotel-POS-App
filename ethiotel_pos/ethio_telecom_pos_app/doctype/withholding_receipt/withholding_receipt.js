frappe.ui.form.on("Withholding Receipt", {
    withholding_rate: function (frm) {
        frm.events.recalculate(frm);
    },

    pre_tax_amount: function (frm) {
        frm.events.recalculate(frm);
    },

    recalculate: function (frm) {
        if (frm.doc.eims_status === "Active") return;

        const rate = flt(frm.doc.withholding_rate, 6);
        const pre_tax = flt(frm.doc.pre_tax_amount, 2);

        if (pre_tax > 0 && rate > 0) {
            const amount = (pre_tax * rate) / 100;
            frm.set_value("withholding_amount", Math.round(amount * 100) / 100);
        }
    },

    refresh: function (frm) {
        frm.events.recalculate(frm);

        if (frm.doc.eims_status === "Active" && frm.doc.qr_code_base64) {
            frm.disable_form();
            frappe.call({
                doc: frm.doc,
                method: "compile_receipt_html",
                callback: function (r) {
                    if (r.message && frm.get_field("receipt_viewport")) {
                        frm.get_field("receipt_viewport").html(r.message);
                    }
                },
            });
        }

        if (frm.doc.eims_status !== "Active") {
            frm.add_custom_button(__("Authorize MoR Withholding"), function () {
                frappe.call({
                    method: "trigger_remote_withholding_receipt",
                    doc: frm.doc,
                    freeze: true,
                    freeze_message: __("Transmitting Withholding Receipt to Revenue Endpoint..."),
                    callback: function (r) {
                        frm.reload_doc().then(() => {
                            if (r.message && r.message.success) {
                                frappe.show_alert({
                                    message: __("Withholding Receipt Certified and Registered Successfully!"),
                                    indicator: "green",
                                });
                            } else if (r.message && !r.message.success) {
                                frappe.msgprint({
                                    title: __("EIRMS Gateway Rejection"),
                                    indicator: "red",
                                    message: r.message.message,
                                });
                            }
                        });
                    },
                });
            }).addClass("btn-primary");
        }
    },
});
