import frappe
import json

def setup_tele_pos_workspace():
    old_name = "POS Awesome"
    new_name = "Tele POS"
    new_module = "Ethio Telecom POS App" 

    if frappe.db.exists("Workspace", old_name) and frappe.db.exists("Workspace", new_name):
        frappe.delete_doc("Workspace", new_name, ignore_missing=True, force=True)
        frappe.db.commit()

    if frappe.db.exists("Workspace", old_name):
        frappe.rename_doc("Workspace", old_name, new_name, force=True)
        frappe.db.commit()

    if frappe.db.exists("Workspace", new_name):
        doc = frappe.get_doc("Workspace", new_name)
        
        doc.module = new_module
        doc.title = "Tele POS"
        doc.label = "Tele POS"
        doc.is_standard = 1 
        
        try:
            content_data = json.loads(doc.content)
            for block in content_data:
                if block.get('type') == 'header':
                    block['data']['text'] = '<span class="h4">Tele POS</span>'
                
                if block.get('type') == 'shortcut':
                    s_name = block['data'].get('shortcut_name', '')
                    if "POS Awesome" in s_name:
                        block['data']['shortcut_name'] = s_name.replace("POS Awesome", "Tele POS")
            
            doc.content = json.dumps(content_data)
        except (ValueError, TypeError, KeyError):
            pass 

        for link in doc.links:
            if "POS Awesome" in link.label:
                link.label = link.label.replace("POS Awesome", "Tele POS")
        
        for shortcut in doc.shortcuts:
            if "POS Awesome" in shortcut.label:
                shortcut.label = shortcut.label.replace("POS Awesome", "Tele POS")
                shortcut.color = "Blue"

        # Save and Commit
        doc.save(ignore_permissions=True)
        frappe.db.commit()