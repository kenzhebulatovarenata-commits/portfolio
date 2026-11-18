(() => {
    'use strict';
    const page = document.querySelector('.degree-page');
    if (!page) return;
    const units = [];
    const registered = new Set();
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

    // Measure the layout wrapper, so every part of one object appears together.
    function register(box, elements = [box]) {
        if (!box || box.closest('.footer, .lightbox, .lightbox1')) return;
        const members = elements.filter(element => element && !registered.has(element));
        if (!members.length) return;
        members.forEach(element => {
            registered.add(element);
            element.style.setProperty('--degree-reveal-opacity', getComputedStyle(element).opacity);
            element.style.setProperty('--degree-reveal-delay', '0ms');
            element.classList.add('degree-reveal');
        });
        units.push({ box, members, visible: false });
    }
    const title = page.querySelector('#degree-title');
    register(title, [...title.querySelectorAll('span')]);
    register(page.querySelector('.degree-description .text-body'));
    page.querySelectorAll('.point').forEach(point => {
        register(point, [...point.querySelectorAll('.point-line, .point-row')]);
    });
    const scheme = page.querySelector('.scheme');
    if (scheme) {
        scheme.querySelectorAll('polyline').forEach(line => line.setAttribute('pathLength', '1'));
        register(scheme, [...scheme.querySelectorAll('.layer, .label, polyline')]);
    }
    page.querySelectorAll('.degree-content h2, .degree-content p, .drafts-subtitle, .final-subtitle, .drafts2-item, .degree-content img, .degree-content video').forEach(element => {
        if (element.closest('.scheme, .point, .lightbox, .lightbox1')) return;
        if (!element.matches('.drafts2-item') && element.closest('.drafts2-item')) return;
        register(element);
    });

    let frame = 0;
    function update() {
        frame = 0;
        const height = window.innerHeight;
        // Read all positions before changing classes. Ignore the entrance shift
        // so an animation cannot move its own trigger or split a horizontal row.
        const measured = units.map(unit => {
            const rect = unit.box.getBoundingClientRect();
            const translate = getComputedStyle(unit.box).translate;
            const shift = translate === 'none' ? 0 : parseFloat(translate.split(' ')[1]) || 0;
            return { unit, top: rect.top - shift, bottom: rect.bottom - shift, height: rect.height, width: rect.width };
        }).filter(item => item.height > 0 && item.width > 0).sort((a, b) => a.top - b.top);
        const rows = [];
        measured.forEach(item => {
            let row = rows[rows.length - 1];
            if (!row || Math.abs(item.top - row.top) > 16) {
                row = { top: item.top, bottom: item.bottom, items: [] };
                rows.push(row);
            }
            row.bottom = Math.max(row.bottom, item.bottom);
            row.items.push(item);
        });
        rows.forEach(row => {
            const visibleHeight = Math.max(0, Math.min(height, row.bottom) - Math.max(0, row.top));
            const threshold = Math.min((row.bottom - row.top) * .25, height * .25);
            const wasVisible = row.items.some(item => item.unit.visible);
            // Trigger from either edge once a quarter is visible; retain the
            // row until it leaves completely, avoiding flicker near the edge.
            const visible = reducedMotion.matches || (wasVisible ? visibleHeight > 0 : visibleHeight >= threshold);
            row.items.forEach(({ unit }) => {
                if (unit.visible === visible) return;
                unit.visible = visible;
                unit.members.forEach(element => element.classList.toggle('is-in-view', visible));
            });
        });
    }
    function schedule() {
        if (!frame) frame = requestAnimationFrame(update);
    }
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    window.addEventListener('load', schedule, { once: true });
    reducedMotion.addEventListener('change', schedule);
    if (document.fonts) document.fonts.ready.then(schedule);
    if ('ResizeObserver' in window) new ResizeObserver(schedule).observe(page.querySelector('.degree-content'));
    page.classList.add('has-degree-reveals');
    schedule();
})();
