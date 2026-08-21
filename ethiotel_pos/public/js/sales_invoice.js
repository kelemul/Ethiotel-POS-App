frappe.ui.form.on("Sales Invoice", {
    refresh: function(frm) {
        if (frm.fields_dict.disable_rounded_total) {
            frm.set_value("disable_rounded_total", 1);
            frm.set_df_property("disable_rounded_total", "read_only", 1);
            frm.refresh_field("disable_rounded_total");
        }
        frm.events.setup_mor_tasks(frm);
    },

    setup_mor_tasks: function(frm) {
        frm.page.remove_inner_button("Register Invoice To MoR", "MoR Tasks");
        frm.page.remove_inner_button("Get Receipt", "MoR Tasks");
        frm.page.remove_inner_button("Verify", "MoR Tasks");
        frm.page.remove_inner_button("Cancel", "MoR Tasks");

        if (!frm.is_new() && frm.doc.docstatus === 1) {
            const status = (frm.doc.custom_eims_status || "").trim();
            const registered = status === "Registered";

            frm.page.add_inner_button(__("Register Invoice To MoR"), function() {
                frm.events.register_with_mor(frm);
            }, __("MoR Tasks"));

            if (registered) {
                frm.page.add_inner_button(__("Get Receipt"), function() {
                    frm.events.get_receipt(frm);
                }, __("MoR Tasks"));

                frm.page.add_inner_button(__("Verify"), function() {
                    frm.events.verify(frm);
                }, __("MoR Tasks"));

                frm.page.add_inner_button(__("Cancel"), function() {
                    frm.events.cancel(frm);
                }, __("MoR Tasks"));
            }
        }
    },

    register_with_mor: function(frm) {
        frappe.call({
            method: "ethiotel_pos.ethio_telecom_pos_app.page.ethiotel_pos.ethiotel_pos.register_sales_invoice",
            args: { sales_invoice: frm.doc.name },
            freeze: true,
            freeze_message: __("Registering with MoR..."),
            callback: function(r) {
                const res = r.message || {};
                if (res.status === "ok") {
                    frappe.msgprint(res.result && res.result.message ? res.result.message : __("Submitted to MoR."));
                    frm.reload_doc();
                } else {
                    frappe.msgprint(res.message || __("Registration failed."));
                }
            }
        });
    },

    get_receipt: function(frm) {
        frappe.call({
            method: "ethiotel_pos.ethio_telecom_pos_app.page.ethiotel_pos.ethiotel_pos.get_invoice_receipt",
            args: { sales_invoice: frm.doc.name },
            freeze: true,
            freeze_message: __("Generating MoR receipt..."),
            callback: function(r) {
                const res = r.message || {};
                if (res.status === "ok" && res.result && res.result.html) {
                    frm.events.show_receipt(res.result.html);
                } else if (res.status === "ok" && res.already_active && res.html) {
                    frm.events.show_receipt(res.html);
                } else {
                    frappe.msgprint((res.result && res.result.message) || res.message || __("Receipt generation failed."));
                }
            }
        });
    },

    verify: function(frm) {
        frappe.call({
            method: "ethiotel_pos.ethio_telecom_pos_app.page.ethiotel_pos.ethiotel_pos.verify_sales_invoice",
            args: { sales_invoice: frm.doc.name },
            freeze: true,
            freeze_message: __("Verifying with MoR..."),
            callback: function(r) {
                const res = r.message || {};
                if (res.status === "ok" && res.result && res.result.html) {
                    const d = new frappe.ui.Dialog({
                        title: __("MoR Verification Result"),
                        size: "large",
                        primary_action_label: __("Close"),
                        primary_action: function() { d.hide(); }
                    });
                    d.body.html(res.result.html);
                    d.show();
                } else {
                    frappe.msgprint((res.result && res.result.message) || res.message || __("Verification failed."));
                }
            }
        });
    },

    cancel: function(frm) {
        const d = new frappe.ui.Dialog({
            title: __("Cancel MoR Invoice"),
            fields: [
                { fieldname: "cancellation_reasons", label: __("Cancellation Reasons"), fieldtype: "Select",
                  options: ["Mistake", "Duplicate", "Fraudulent", "Change of Order", "Others"] },
                { fieldname: "remark", label: __("Remark"), fieldtype: "Small Text" }
            ],
            primary_action_label: __("Cancel Invoice"),
            primary_action: function(values) {
                frappe.call({
                    method: "ethiotel_pos.ethio_telecom_pos_app.page.ethiotel_pos.ethiotel_pos.cancel_sales_invoice",
                    args: {
                        sales_invoice: frm.doc.name,
                        cancellation_reasons: values.cancellation_reasons || "Mistake",
                        remark: values.remark || ""
                    },
                    freeze: true,
                    freeze_message: __("Cancelling with MoR..."),
                    callback: function(r) {
                        const res = r.message || {};
                        if (res.status === "ok" && res.result && res.result.status === "Cancelled") {
                            frappe.msgprint(__("Invoice cancelled with MoR."));
                            frm.reload_doc();
                        } else {
                            frappe.msgprint((res.result && res.result.message) || res.message || __("Cancellation failed."));
                        }
                        d.hide();
                    }
                });
            }
        });
        d.show();
    },

    show_receipt: function(html) {
        const d = new frappe.ui.Dialog({
            title: __("MoR Receipt"),
            size: "large",
            primary_action_label: __("Print"),
            primary_action: function() {
                const w = window.open();
                if (w) {
                    w.document.write(html);
                    w.document.close();
                    w.focus();
                    w.print();
                }
            }
        });
        d.body.html(html);
        d.show();
    }
});