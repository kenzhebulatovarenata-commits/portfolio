(() => {
    'use strict';
    const header = document.querySelector('.header.mobile-header-enabled');
    const menu = document.querySelector('.mobile-menu');
    if (!header || !menu) return;
    const toggle = header.querySelector('.mobile-menu-toggle');
    const mobile = matchMedia('(max-width: 700px)');
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    let openingAnimations = [];
    function clearAnimations() {
        openingAnimations.forEach(animation => animation.cancel());
        openingAnimations = [];
    }
    function reveal() {
        clearAnimations();
        if (reducedMotion.matches) return;
        const button = toggle.getBoundingClientRect();
        const panel = menu.getBoundingClientRect();
        const x = button.left + button.width / 2 - panel.left;
        const y = button.top + button.height / 2 - panel.top;
        const radius = Math.ceil(Math.hypot(Math.max(x, panel.width - x), Math.max(y, panel.height - y))) + 2;
        openingAnimations.push(menu.animate([
            { clipPath: `circle(0px at ${x}px ${y}px)` },
            { clipPath: `circle(${radius}px at ${x}px ${y}px)` }
        ], { duration: 280, easing: 'cubic-bezier(.22, 1, .36, 1)' }));
        menu.querySelectorAll('a').forEach((link, index) => {
            openingAnimations.push(link.animate([
                { opacity: 0, transform: 'translateY(6px)' },
                { opacity: 1, transform: 'translateY(0)' }
            ], { duration: 160, delay: 50 + index * 20, easing: 'ease-out', fill: 'backwards' }));
        });
    }
    function close(restoreFocus = false) {
        clearAnimations();
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
        reveal();
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
