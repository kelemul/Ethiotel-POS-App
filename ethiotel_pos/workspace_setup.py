import frappe

def setup_tele_pos_workspace():
    """
    Hides the default POS Awesome workspace by setting public to 0.
    """
    old_workspace = "POS Awesome"
    
    if frappe.db.exists("Workspace", old_workspace):
        frappe.db.set_value("Workspace", old_workspace, {
            "public": 0
        })
        
        frappe.db.commit()
        print(f"--- Hidden: {old_workspace} ---")
    frappe.clear_cache()