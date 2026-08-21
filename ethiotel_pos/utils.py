# Copyright (c) 2026, Guba Technology
# Jinja / helpers used by EIMS-style print formats

from __future__ import annotations

import json
import time
from pathlib import Path

from ethiotel_pos import __version__ as app_version


import base64
import io

import frappe


_BASE_DIR = Path(__file__).resolve().parent
_VERSION_FILE = _BASE_DIR / "public" / "dist" / "js" / "version.json"
_CSS_FILE = _BASE_DIR / "public" / "dist" / "js" / "posawesome.css"
_FALLBACK_VERSION: str | None = None
_VERSION_FILE_MTIME: float | None = None
_CACHED_VERSION_FILE_VALUE: str | None = None
_CSS_FILE_MTIME: float | None = None
_CACHED_CSS_VERSION: str | None = None
def _qrcode_png_data_uri(text):
	try:
		import qrcode

		qr = qrcode.QRCode(version=1, error_correction=qrcode.constants.ERROR_CORRECT_H, box_size=6, border=2)
		qr.add_data(text)
		qr.make(fit=True)
		img = qr.make_image(fill_color="black", back_color="white")
		buf = io.BytesIO()
		img.save(buf, format="PNG")
		return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()
	except Exception:
		frappe.log_error(frappe.get_traceback(), "ethiotel_pos: QR generation error")
		return ""


def get_invoice_qr_data_uri(doc, tax=0):
	"""QR payload matching EIMS: Seller / Vat No / Date / Total / Tax."""
	total = doc.get("grand_total") or 0
	vatt = tax or doc.get("total_taxes_and_charges") or 0
	currency = doc.get("currency") or "ETB"
	date = doc.get("posting_date") or doc.get("date")
	payload = "\n".join(
		[
			"Seller: {0}".format(doc.get("company") or ""),
			"Vat No: {0}".format(doc.get("company_tax_id") or doc.get("tax_id") or ""),
			"Date: {0}".format(frappe.utils.formatdate(date) if date else ""),
			"Total: {0}".format(frappe.utils.fmt_money(total, currency=currency)),
			"Tax: {0}".format(frappe.utils.fmt_money(vatt, currency=currency)),
		]
	)
	return _qrcode_png_data_uri(payload)


def get_qr_img_tag(doc, tax=0, width=80):
	uri = get_invoice_qr_data_uri(doc, tax)
	if not uri:
		return ""
	return '<img src="{0}" width="{1}" height="{1}" alt="QR" />'.format(uri, width)


def eims_qr(data_uri):
	"""Jinja filter passthrough for a data uri."""
	return data_uri





def _read_version_file() -> str | None:
    global _VERSION_FILE_MTIME, _CACHED_VERSION_FILE_VALUE

    try:
        version_stat = _VERSION_FILE.stat()
    except FileNotFoundError:
        _VERSION_FILE_MTIME = None
        _CACHED_VERSION_FILE_VALUE = None
        return None
    except OSError:
        return None

    if _CACHED_VERSION_FILE_VALUE is not None and _VERSION_FILE_MTIME == version_stat.st_mtime:
        # Avoid re-reading/parsing when the asset version file is unchanged.
        return _CACHED_VERSION_FILE_VALUE

    try:
        data = json.loads(_VERSION_FILE.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError, ValueError):
        return None
    version = data.get("version") or data.get("buildVersion")
    if not version:
        return None

    normalized = str(version)
    _CACHED_VERSION_FILE_VALUE = normalized
    _VERSION_FILE_MTIME = version_stat.st_mtime
    return normalized


def _css_mtime_version() -> str | None:
    global _CSS_FILE_MTIME, _CACHED_CSS_VERSION

    try:
        css_stat = _CSS_FILE.stat()
    except FileNotFoundError:
        _CSS_FILE_MTIME = None
        _CACHED_CSS_VERSION = None
        return None
    except OSError:
        return None

    if _CACHED_CSS_VERSION is not None and _CSS_FILE_MTIME == css_stat.st_mtime:
        # Avoid repeated stat conversions when the CSS asset is untouched.
        return _CACHED_CSS_VERSION

    try:
        version = str(int(css_stat.st_mtime))
    except OSError:
        return None
    _CACHED_CSS_VERSION = version
    _CSS_FILE_MTIME = css_stat.st_mtime
    return version


def get_build_version() -> str:
    """Return a string that uniquely identifies the current asset build."""

    version = _read_version_file()
    if version:
        return version

    mtime_version = _css_mtime_version()
    if mtime_version:
        return mtime_version

    global _FALLBACK_VERSION
    if _FALLBACK_VERSION is None:
        _FALLBACK_VERSION = f"{app_version}-{int(time.time())}"
    return _FALLBACK_VERSION
