(() => {
    'use strict';
    const light = document.querySelector('.pragma-light');
    const palette = document.querySelector('.pragma-palette');
    palette.querySelectorAll('span').forEach((stripe, index) => {
        stripe.style.setProperty('--stripe-delay', `${index * 30}ms`);
    });
    document.querySelectorAll('.header a').forEach(element => element.classList.add('reveal'));
    const items = [...document.querySelectorAll('.reveal')].map(element => {
        element.style.setProperty('--part-opacity', getComputedStyle(element).opacity);
        return { element, visible: false };
    });
    let frame = null;

    function render() {
        frame = null;
        const viewport = innerHeight;
        const paletteRect = palette.getBoundingClientRect();
        palette.classList.toggle('is-in-view', paletteRect.top < viewport - 16 && paletteRect.bottom > 64);
        const revealEdge = viewport - Math.min(48, viewport * .06);
        items.forEach(item => {
            const element = item.element;
            const rect = element.getBoundingClientRect();
            const shift = parseFloat(getComputedStyle(element).translate.split(' ')[1]) || 0;
            const top = rect.top - shift;
            const bottom = rect.bottom - shift;
            if (bottom <= (element.closest('.header') ? 0 : 64) || top >= viewport) item.visible = false;
            else if (top <= revealEdge) item.visible = true;
            if (element.contains(document.activeElement)) item.visible = true;
            element.classList.toggle('is-in-view', item.visible);
        });
    }
    function schedule() { if (frame === null) frame = requestAnimationFrame(render); }
    function measure() {
        // Pin the entire white opening, including its palette, at the bottom edge.
        light.style.setProperty('--pragma-light-top', `${Math.min(0, innerHeight - light.offsetHeight)}px`);
        schedule();
    }
    document.body.classList.add('has-pragma-reveals');
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', measure);
    window.addEventListener('pageshow', measure);
    document.addEventListener('load', schedule, true);
    if ('ResizeObserver' in window) new ResizeObserver(measure).observe(light);
    // Commit the hidden starting state before revealing anything in view.
    void document.body.offsetHeight;
    document.fonts.ready.then(() => requestAnimationFrame(measure));
    requestAnimationFrame(measure);
})();
