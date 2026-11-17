(() => {
    'use strict';
    const page = document.querySelector('.degree-page');
    if (!page) return;

    const groups = new Map();
    const registered = new Set();
    function reveal(element, delay = 0, trigger = element) {
        if (!element || element.closest('.footer') || registered.has(element)) return;
        registered.add(element);
        element.style.setProperty('--degree-reveal-opacity', getComputedStyle(element).opacity);
        element.style.setProperty('--degree-reveal-delay', `${delay}ms`);
        element.classList.add('degree-reveal');
        if (!groups.has(trigger)) groups.set(trigger, []);
        groups.get(trigger).push(element);
    }

    // Keep the opening's scroll transforms on their existing parent elements.
    page.querySelectorAll('#degree-title span').forEach((word, index) => {
        reveal(word, index * 70, page.querySelector('#degree-title'));
    });
    reveal(page.querySelector('.degree-description .text-body'), 100);

    reveal(page.querySelector('.project-points-title'));
    const concept = page.querySelector('.project-points');
    page.querySelectorAll('.point').forEach(point => {
        reveal(point.querySelector('.point-line'), 140, concept);
        reveal(point.querySelector('.point-row'), 400, concept);
    });

    const scheme = page.querySelector('.scheme');
    if (scheme) {
        reveal(scheme.querySelector('.layer.grid'), 0, scheme);
        ['pattern', 'foundation', 'isometric'].forEach((name, index) => {
            const delay = 80 + index * 450;
            reveal(scheme.querySelector(`[data-name="${name}"]`), delay, scheme);
            reveal(scheme.querySelector(`[data-target="${name}"]`), delay, scheme);
            const line = scheme.querySelectorAll('polyline')[index];
            if (line) {
                line.setAttribute('pathLength', '1');
                reveal(line, delay, scheme);
            }
        });
    }

    // Measure complete parts so returning from below does not wait for the heading.
    const partRanges = new Map();
    const partObjects = 'h2, p, .drafts-subtitle, .final-subtitle, .drafts2-item, img, video';
    function revealPart(trigger, containers) {
        if (!trigger) return;
        const members = containers.filter(Boolean);
        partRanges.set(trigger, members);
        members.forEach(container => {
            const objects = [...container.querySelectorAll(partObjects)];
            if (container.matches(partObjects)) objects.unshift(container);
            objects.forEach(element => {
                if (element.closest('.lightbox, .lightbox1')) return;
                if (!element.matches('.drafts2-item') && element.closest('.drafts2-item')) return;
                reveal(element, 0, trigger);
            });
        });
    }
    const drafts = page.querySelector('.drafts');
    revealPart(drafts, [drafts, drafts?.nextElementSibling, page.querySelector('.final-text')]);
    const finalTitle = page.querySelector('.final-title');
    const finalVersion = page.querySelector('.final-version');
    revealPart(finalTitle, [finalTitle, finalVersion, finalVersion?.nextElementSibling]);
    const carriers = page.querySelector('.final-gallery');
    revealPart(carriers?.previousElementSibling, [
        carriers?.previousElementSibling, carriers,
        page.querySelector('.post-gallery'), page.querySelector('.merch-gallery')
    ]);
    const photos = [...page.querySelectorAll('.drafts2')].at(-1);
    revealPart(photos?.previousElementSibling, [photos?.previousElementSibling, photos]);

    page.querySelectorAll('.degree-content h2, .drafts-subtitle, .final-subtitle, .final-text > p, .final-animation-copy > p').forEach(element => {
        reveal(element);
    });
    page.querySelectorAll('.degree-content img, .degree-content video').forEach(element => {
        if (element.closest('.scheme, .drafts2-item, .lightbox, .lightbox1')) return;
        reveal(element, 0, element.closest('section'));
    });

    const visibleGroups = new Set();
    let previousScroll = window.scrollY;
    let scrollingUp = false;
    let frame = 0;
    function update() {
        frame = 0;
        const scroll = window.scrollY;
        if (scroll !== previousScroll) scrollingUp = scroll < previousScroll;
        previousScroll = scroll;
        const height = window.innerHeight;
        const entryTop = scrollingUp ? height * .45 : 64;
        const entryBottom = scrollingUp ? height - 64 : height * .55;
        const changes = [];
        groups.forEach((elements, trigger) => {
            const boxes = (partRanges.get(trigger) || [trigger]).map(element => element.getBoundingClientRect());
            const top = Math.min(...boxes.map(box => box.top));
            const bottom = Math.max(...boxes.map(box => box.bottom));
            const wasVisible = visibleGroups.has(trigger);
            // Keep a revealed part visible until it leaves the screen completely.
            const visible = wasVisible
                ? bottom > 0 && top < height
                : bottom > entryTop && top < entryBottom;
            if (visible !== wasVisible) changes.push({ trigger, elements, visible });
        });
        changes.forEach(({ trigger, elements, visible }) => {
            if (visible) visibleGroups.add(trigger);
            else visibleGroups.delete(trigger);
            elements.forEach(element => element.classList.toggle('is-in-view', visible));
        });
    }
    function schedule() {
        if (!frame) frame = requestAnimationFrame(update);
    }
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    window.addEventListener('load', schedule, { once: true });
    if (document.fonts) document.fonts.ready.then(schedule);
    if ('ResizeObserver' in window) new ResizeObserver(schedule).observe(page.querySelector('.degree-content'));
    page.classList.add('has-degree-reveals');
    schedule();
})();
