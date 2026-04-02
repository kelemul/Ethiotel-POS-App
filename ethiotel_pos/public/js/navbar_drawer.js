$(document).on('app_ready', function() {
    if (window.location.href.indexOf('pos') === -1) return;

    const drawerBranding = {
        logo: '/assets/ethiotel_pos/images/tele.jpg',
        bgImage: '/assets/ethiotel_pos/images/background-small.png',
        prefix: 'Ethio Telecom'
    };

    const drawerObserver = new MutationObserver(() => {
        const drawer = document.querySelector('.v-navigation-drawer.drawer-custom');
        if (!drawer) return;

        // 1. Force Background Image on the container and its content area
        const contentArea = drawer.querySelector('.v-navigation-drawer__content');
        if (contentArea && !contentArea.classList.contains('et-bg-set')) {
            contentArea.style.setProperty('background-image', `url("${drawerBranding.bgImage}")`, 'important');
            contentArea.style.backgroundSize = 'cover';
            contentArea.style.backgroundPosition = 'center';
            contentArea.classList.add('et-bg-set');
        }

        // 2. Logo Swap - Target the <img> tag directly
        // We look for any image inside the drawer's avatar
        const logos = drawer.querySelectorAll('img'); 
        logos.forEach(img => {
            if (img && !img.src.includes(drawerBranding.logo)) {
                img.src = drawerBranding.logo;
                img.srcset = ""; // Clear srcset to prevent browser from choosing old versions
            }
        });

        // 3. Company Name with New Line
        const companyLabel = drawer.querySelector('.drawer-company');
        if (companyLabel && !companyLabel.classList.contains('et-text-updated')) {
            const originalName = companyLabel.innerText;
            companyLabel.innerHTML = `${drawerBranding.prefix}<br><span style="font-size: 0.85em; opacity: 0.8;">${originalName}</span>`;
            companyLabel.classList.add('et-text-updated');
        }
        
    });

    drawerObserver.observe(document.body, { childList: true, subtree: true });
});