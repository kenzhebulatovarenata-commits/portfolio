/* Match the browser's exposed canvas to the section at the bottom edge. */
(() => {
    'use strict';
    const mobile = matchMedia('(max-width: 700px)');
    const root = document.documentElement;
    let theme = document.querySelector('meta[name="theme-color"]');
    const originalTheme = theme?.content;
    const createdTheme = !theme;
    if (!theme) {
        theme = document.createElement('meta');
        theme.name = 'theme-color';
        document.head.append(theme);
    }
    let frame = null;
    let previous = '';
    function update() {
        frame = null;
        if (!mobile.matches) {
            root.style.removeProperty('--mobile-edge-background');
            if (createdTheme) theme.removeAttribute('content');
            else theme.content = originalTheme;
            previous = '';
            return;
        }
        const viewport = window.visualViewport;
        const bottom = Math.min(innerHeight, viewport ? viewport.offsetTop + viewport.height : innerHeight);
        let element = document.elementFromPoint(Math.min(2, innerWidth / 2), Math.max(0, bottom - 2));
        let color = '';
        while (element && element !== root) {
            const background = getComputedStyle(element).backgroundColor;
            if (background !== 'transparent' && background !== 'rgba(0, 0, 0, 0)') {
                color = background;
                break;
            }
            element = element.parentElement;
        }
        color ||= getComputedStyle(document.body).backgroundColor;
        // The yellow panel is content, not browser chrome. Safari may retain
        // a sampled tint after that sticky panel has left the viewport.
        if (document.body.classList.contains('notation-page') && color === 'rgb(242, 204, 50)') color = 'rgb(0, 0, 0)';
        if (color === previous) return;
        previous = color;
        root.style.setProperty('--mobile-edge-background', color);
        theme.content = color;
    }
    function schedule() { if (frame === null) frame = requestAnimationFrame(update); }
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    window.addEventListener('pageshow', schedule);
    window.visualViewport?.addEventListener('resize', schedule);
    window.visualViewport?.addEventListener('scroll', schedule);
    mobile.addEventListener('change', schedule);
    document.addEventListener('load', schedule, true);
    // The home masks keep moving briefly after scrolling stops. Follow their
    // paint changes without restarting or modifying the animation itself.
    const stage = document.querySelector('.home-projects .about-stage');
    if (stage) new MutationObserver(schedule).observe(stage, { attributes: true, attributeFilter: ['style'] });
    schedule();
})();
