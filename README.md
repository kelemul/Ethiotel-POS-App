# Ethio Telecom POS App

A specialized Point of Sale application for **ethio telecom**, built on the Frappe Framework. This app acts as a wrapper for **ERPNext** and **Ethiotel_POS** to provide a custom Ethio Telecom experience.

---

### 🚀 Robust Installation Script

Use this script to handle all dependencies (ERPNext, Ethiotel_POS), build assets, and set up branding in one step. 

#### 1. Create the installer
In your `frappe-bench` root folder, run:
`nano install_pos.sh`

#### 2. Paste this script
```bash
#!/bin/bash

# --- Configuration ---
SITE=$1
REPO_POS="[https://github.com/defendicon/POS-Awesome-V15.git](https://github.com/defendicon/POS-Awesome-V15.git)"

# --- Helper: Exit on Error ---
fail() {
    echo -e "\n\e[31m[ERROR]\e[0m $1"
    exit 1
}

# --- Validation ---
if [ -z "$SITE" ]; then
    echo "Usage: ./install_pos.sh [site-name]"
    exit 1
fi

if [ ! -d "sites/$SITE" ]; then
    fail "Site '$SITE' does not exist. Create it first with 'bench new-site $SITE'."
fi

echo "----------------------------------------------------"
echo " Starting Robust Ethio Telecom POS Installer"
echo "----------------------------------------------------"

# 1. Handle ERPNext (The Core Dependency)
echo "Step 1: Checking ERPNext..."
if [ ! -d "apps/erpnext" ]; then
    echo "ERPNext code missing from bench. Fetching..."
    bench get-app erpnext || fail "Failed to fetch ERPNext code."
fi

echo "Installing ERPNext on $SITE..."
bench --site $SITE install-app erpnext || fail "Failed to install ERPNext on $SITE."

# 2. Handle Ethiotel_POS with Re-creation Prompt
echo "Step 2: Checking Ethiotel_POS..."
if [ -d "apps/ethiotel_pos" ]; then
    read -p "Ethiotel_POS already exists. Do you want to re-create it? (y/n): " confirm
    if [[ $confirm == [yY] || $confirm == [yY][eE][sS] ]]; then
        echo "Removing existing Ethiotel_POS..."
        rm -rf apps/ethiotel_pos || fail "Could not remove apps/ethiotel_pos folder."
        echo "Fetching fresh Ethiotel_POS repository..."
        bench get-app $REPO_POS || fail "Failed to fetch Ethiotel_POS code."
    else
        echo "Keeping existing Ethiotel_POS code."
    fi
else
    echo "Fetching Ethiotel_POS repository..."
    bench get-app $REPO_POS || fail "Failed to fetch Ethiotel_POS code."
fi

echo "Installing Ethiotel_POS on $SITE..."
bench --site $SITE install-app ethiotel_pos || fail "Failed to install Ethiotel_POS on $SITE."

# 3. Handle Ethio Telecom Wrapper
echo "Step 3: Installing Ethio Telecom POS Wrapper..."
bench --site $SITE install-app ethiotel_pos --force || fail "Failed to install ethiotel_pos."

# 4. Build Assets (Crucial for Vue/CSS)
echo "Step 4: Building Assets..."
echo "Building Ethiotel_POS..."
bench build --app ethiotel_pos || fail "Failed to build Ethiotel_POS assets."

echo "Building Ethio Telecom POS..."
bench build --app ethiotel_pos || fail "Failed to build ethiotel_pos assets."

# 5. Finalize and Branding
echo "Step 5: Finalizing (Migrate & Branding)..."
bench --site $SITE migrate || fail "Migration failed."

echo "----------------------------------------------------"
echo -e "\e[32m[SUCCESS]\e[0m Setup Complete for $SITE"
echo "----------------------------------------------------"