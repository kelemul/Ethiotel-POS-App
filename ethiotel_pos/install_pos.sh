#!/bin/bash

SITE=$1
REPO_POS="https://github.com/defendicon/POS-Awesome-V15.git"

fail() {
    echo -e "\n\e[31m[ERROR]\e[0m $1"
    exit 1
}

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

# 1. Handle ERPNext
echo "Step 1: Checking ERPNext..."
if [ ! -d "apps/erpnext" ]; then
    echo "ERPNext code missing from bench. Fetching..."
    bench get-app erpnext || fail "Failed to fetch ERPNext code."
fi

echo "Installing ERPNext on $SITE..."
bench --site $SITE install-app erpnext || fail "Failed to install ERPNext on $SITE."

# 2. Handle POSAwesome with Re-creation Prompt
echo "Step 2: Checking POSAwesome..."
if [ -d "apps/posawesome" ]; then
    read -p "POSAwesome already exists. Do you want to re-create it? (y/n): " confirm
    if [[ $confirm == [yY] || $confirm == [yY][eE][sS] ]]; then
        echo "Removing existing POSAwesome..."
        rm -rf apps/posawesome || fail "Could not remove apps/posawesome folder."
        echo "Fetching fresh POSAwesome repository..."
        bench get-app $REPO_POS || fail "Failed to fetch POSAwesome code."
    else
        echo "Keeping existing POSAwesome code."
    fi
else
    echo "Fetching POSAwesome repository..."
    bench get-app $REPO_POS || fail "Failed to fetch POSAwesome code."
fi

echo "Installing POSAwesome on $SITE..."
bench --site $SITE install-app posawesome || fail "Failed to install POSAwesome on $SITE."

# 3. Handle Ethio Telecom Wrapper
echo "Step 3: Installing Ethio Telecom POS Wrapper..."
bench --site $SITE install-app ethiotel_pos --force || fail "Failed to install ethiotel_pos."

# 4. Build Assets
echo "Step 4: Building Assets..."
echo "Building POSAwesome..."
bench build --app posawesome || fail "Failed to build POSAwesome assets."

echo "Building Ethio Telecom POS..."
bench build --app ethiotel_pos || fail "Failed to build ethiotel_pos assets."

# 5. Finalize
echo "Step 5: Finalizing (Migrate & Branding)..."
bench --site $SITE migrate || fail "Migration failed."

echo "----------------------------------------------------"
echo -e "\e[32m[SUCCESS]\e[0m Setup Complete for $SITE"
echo "----------------------------------------------------"