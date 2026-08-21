"""Custom POS Invoice class that integrates POS Awesome shift logic."""

import frappe

from erpnext.accounts.doctype.pos_invoice.pos_invoice import POSInvoice as ERPNextPOSInvoice

from ethiotel_pos.api.invoice import validate_shift


class CustomPOSInvoice(ERPNextPOSInvoice):
    """Override ERPNext POS Invoice to respect POS Awesome opening shifts."""

    def before_validate(self):
        """Ensure a Sales Taxes and Charges Template is applied before the
        invoice is validated so the EIMS payload carries the correct tax
        type/rate and line tax amounts.

        Precedence (cashier check-in overrides settings):
          1. POS Awesome opening shift (if the invoice references one)
          2. Active POS Opening Entry for the cashier (chosen at check-in)
          3. POS Profile default (settings)
          4. EIMS Setting default tax template (settings)
        """
        self.apply_default_tax_template()

    def apply_default_tax_template(self):
        if getattr(self, "taxes_and_charges", None):
            return

        template = self._resolve_tax_template()
        if not template:
            return
        if not frappe.db.exists("Sales Taxes and Charges Template", template):
            return

        self.taxes_and_charges = template
        # Only build the taxes table if the client did not already supply one.
        # NOTE: the framework's set_taxes_and_charges() early-returns for POS
        # invoices (is_pos), so we append the template rows directly.
        if not self.taxes:
            try:
                self.append_taxes_from_master("Sales Taxes and Charges Template")
            except Exception:
                frappe.log_error(
                    frappe.get_traceback(),
                    f"MoR: failed to apply tax template {template} on {self.name or 'new POS Invoice'}",
                )

    def _resolve_tax_template(self):
        # 1) POS Awesome opening shift referenced by the invoice
        opening_shift = getattr(self, "posa_pos_opening_shift", None)
        if opening_shift and frappe.db.exists("POS Opening Shift", opening_shift):
            tmpl = frappe.db.get_value("POS Opening Shift", opening_shift, "taxes_and_charges")
            if tmpl:
                return tmpl

        # 2) Active POS Opening Entry for the cashier (set at check-in)
        user = self.owner or frappe.session.user
        entry = frappe.db.sql(
            """
            SELECT name FROM `tabPOS Opening Entry`
            WHERE user = %s AND docstatus = 1
              AND (pos_closing_entry = '' OR pos_closing_entry IS NULL)
            ORDER BY period_start_date DESC LIMIT 1
            """,
            user,
        )
        if entry:
            tmpl = frappe.db.get_value("POS Opening Entry", entry[0][0], "taxes_and_charges")
            if tmpl:
                return tmpl

        # 3) POS Profile default (settings)
        if getattr(self, "pos_profile", None):
            tmpl = frappe.db.get_value("POS Profile", self.pos_profile, "taxes_and_charges")
            if tmpl:
                return tmpl

        # 4) EIMS Setting default (settings)
        return frappe.db.get_value(
            "EIMS Setting", "EIMS Setting", "default_taxes_and_charges_template"
        )

    def validate_pos_opening_entry(self):
        """Allow POS invoices when a POS Awesome shift is open.

        If the invoice references ``posa_pos_opening_shift`` we validate that
        shift using POS Awesome's rules and skip the standard ERPNext
        validation for ``POS Opening Entry``. Otherwise, fall back to the
        default ERPNext behaviour.
        """

        if getattr(self, "posa_pos_opening_shift", None):
            # Use existing shift validation from POS Awesome
            validate_shift(self)
            return

        # No POS Awesome shift - use ERPNext's validation
        super().validate_pos_opening_entry()
