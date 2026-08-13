import frappe
import json
import os

app_root = frappe.get_app_path("ethiotel_pos")
page_dir = os.path.join(app_root, "ethio_telecom_pos_app", "page", "ethiotel_pos_v2")
json_path = os.path.join(page_dir, "ethiotel_pos_v2.json")

name = "ethiotel-pos-v2"
if frappe.db.exists("Page", name):
    print("Page already exists:", name)
else:
    with open(json_path) as f:
        data = json.load(f)

    doc = frappe.get_doc(
        {
            "doctype": "Page",
            "name": name,
            "page_name": name,
            "module": data.get("module", "Ethio Telecom POS App"),
            "title": data.get("title", "Ethiotel POS"),
            "standard": "Yes",
            "system_page": 0,
            "roles": data.get("roles", []),
        }
    )
    doc.insert(ignore_permissions=True)
    frappe.db.commit()
    print("Created page:", name)