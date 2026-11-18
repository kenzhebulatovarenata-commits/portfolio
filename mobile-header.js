(() => {
    'use strict';
    const header = document.querySelector('.header.mobile-header-enabled');
    const menu = document.querySelector('.mobile-menu');
    if (!header || !menu) return;
    const toggle = header.querySelector('.mobile-menu-toggle');
    const mobile = matchMedia('(max-width: 700px)');
    function close(restoreFocus = false) {
        menu.hidden = true;
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-label', toggle.dataset.openLabel);
        document.documentElement.classList.remove('mobile-menu-open');
        if (restoreFocus) toggle.focus();
    }
    toggle.addEventListener('click', () => {
        if (!menu.hidden) { close(true); return; }
        menu.hidden = false;
        toggle.setAttribute('aria-expanded', 'true');
        toggle.setAttribute('aria-label', toggle.dataset.closeLabel);
        document.documentElement.classList.add('mobile-menu-open');
    });
    menu.addEventListener('click', event => {
        if (event.target.closest('a')) close();
    });
    document.addEventListener('keydown', event => {
        if (menu.hidden) return;
        if (event.key === 'Escape') { event.preventDefault(); close(true); }
        if (event.key === 'Tab') {
            const items = [...header.querySelectorAll('.mobile-header-bar a, .mobile-menu-toggle'), ...menu.querySelectorAll('a')];
            const first = items[0], last = items[items.length - 1];
            if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
            else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
        }
    });
    mobile.addEventListener('change', () => { if (!mobile.matches) close(); });
    window.addEventListener('pageshow', () => close());
})();
