/**
 * Ethio Telecom POS Branding Script
 * Handles Navbar, Watermarks, and Opening Dialog Customization
 */
$(document).on('app_ready', function() {
    // Security check: Only run on the POS page
    if (window.location.href.indexOf('pos') === -1) return;

    const brandSettings = {
        logo: '/assets/ethiotel_pos/images/tele.jpg',
        watermark: '/assets/ethiotel_pos/images/left-bottom.png',
        titleLight: 'EthioTel',
        titleBold: 'POS',
        primaryGreen: '#009639',
        corpName: 'Ethio Telecom'
    };

    const observer = new MutationObserver((mutations) => {
        
        // --- FEATURE 1: Navbar Logo Injection ---
        const logoImg = document.querySelector('.pos-navbar-logo img');
        if (logoImg && !logoImg.src.includes(brandSettings.logo)) {
            logoImg.src = brandSettings.logo;
            logoImg.srcset = ""; 
        }

        // --- FEATURE 2: Navbar Text Branding ---
        const titleLight = document.querySelector('.pos-navbar-title-light');
        const titleBold = document.querySelector('.pos-navbar-title-bold');
        const titleCompact = document.querySelector('.pos-navbar-title-compact');

        if (titleLight && titleLight.innerText !== brandSettings.titleLight) {
            titleLight.innerText = brandSettings.titleLight;
        }
        if (titleBold && titleBold.innerText !== brandSettings.titleBold) {
            titleBold.innerText = brandSettings.titleBold;
        }
        if (titleCompact && titleCompact.innerText !== "ET POS") {
            titleCompact.innerText = "ET POS";
        }

        // --- FEATURE 3: Navbar Aesthetic (Bottom Border) ---
        const appBar = document.querySelector('.pos-navbar-enhanced');
        if (appBar && !appBar.classList.contains('ethiotel-applied')) {
            appBar.style.borderBottom = `3px solid ${brandSettings.primaryGreen}`;
            appBar.classList.add('ethiotel-applied');
        }

        // --- FEATURE 4: Invoice Card Watermark ---
        const invoiceCard = document.querySelector('.invoice-main-card');
        if (invoiceCard && !invoiceCard.querySelector('.et-invoice-watermark')) {
            const invWatermark = document.createElement('img');
            invWatermark.src = brandSettings.watermark; 
            invWatermark.className = 'et-invoice-watermark';
            invoiceCard.style.position = 'relative';
            invoiceCard.appendChild(invWatermark);
        }

        // --- FEATURE 5: Item Selector Card Watermark ---
        const selectorCard = document.querySelector('.selection-card');
        if (selectorCard && !selectorCard.querySelector('.et-selector-watermark')) {
            const selWatermark = document.createElement('img');
            selWatermark.src = brandSettings.watermark;
            selWatermark.className = 'et-selector-watermark';
            selectorCard.style.position = 'relative';
            selectorCard.appendChild(selWatermark);
        }

        // --- FEATURE 6: Opening Dialog Branding & Logo Bar ---
        const dialogCard = document.querySelector('.opening-dialog-card');
        if (dialogCard && dialogCard.dataset.customized !== 'true') {
            
            // Create the branding bar with Logo and "Ethio Telecommunication"
            if (!dialogCard.querySelector('.tele-brand-bar')) {
                const brandBar = document.createElement('div');
                brandBar.className = 'tele-brand-bar';
                brandBar.innerHTML = `
                    <img src="${brandSettings.logo}" class="tele-logo-mini">
                    <span class="tele-corp-name">${brandSettings.corpName}</span>
                `;
                dialogCard.prepend(brandBar);
            }

            // Update Header Title
            const title = dialogCard.querySelector('.header-title');
            if (title) title.innerText = 'Tele POS Shift Entry';

            // Update Header Subtitle
            const subtitle = dialogCard.querySelector('.header-subtitle');
            if (subtitle) {
                subtitle.innerText = 'Please initialize the cash drawer for your Ethio Telecom service shift.';
            }

            // Update Submit Button Text
            const submitBtn = dialogCard.querySelector('.submit-action-btn span');
            if (submitBtn) submitBtn.innerText = 'Start Shift';

            // Prevent infinite loop by flagging as customized
            dialogCard.dataset.customized = 'true';
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });
});