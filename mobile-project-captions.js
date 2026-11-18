/* One stable selection per mobile track; sample motion once per animation frame. */
(() => {
    'use strict';
    const mobile = matchMedia('(max-width: 700px)');
    const states = [...document.querySelectorAll('.home-projects .gallery, .catalogue-track')].map(track => ({
        track,
        cards: [...track.querySelectorAll('.card, .catalogue-card')].map(card => ({
            card, cover: card.querySelector('.card-inner, .catalogue-cover')
        })).filter(item => item.cover),
        selected: null, candidate: null, since: 0, previous: null, speed: 0
    }));
    if (!states.length) return;
    let frame = null;
    let awakeUntil = 0;
    function select(state, card) {
        if (state.selected === card) return;
        state.selected?.classList.remove('is-caption-visible');
        state.selected = card;
        card?.classList.add('is-caption-visible');
    }
    function reset() {
        if (frame !== null) cancelAnimationFrame(frame);
        frame = null;
        states.forEach(state => {
            select(state, null);
            state.previous = state.candidate = null;
            state.speed = 0;
        });
    }
    function sample(now) {
        frame = null;
        if (!mobile.matches || document.hidden) { reset(); return; }
        const blocked = !!document.querySelector('dialog[open]');
        const headerBottom = Math.max(0, document.querySelector('.header')?.getBoundingClientRect().bottom || 52);
        let moving = false;
        states.forEach(state => {
            const bounds = state.track.getBoundingClientRect();
            const position = { x: bounds.left - state.track.scrollLeft, y: bounds.top, time: now };
            if (state.previous) {
                const elapsed = Math.max(1, now - state.previous.time);
                const distance = Math.abs(position.x - state.previous.x) + Math.abs(position.y - state.previous.y);
                const speed = distance / elapsed;
                // Fast motion hides immediately; the smoothed tail prevents threshold flicker.
                state.speed = Math.max(speed, state.speed * Math.exp(-elapsed / 55));
                if (distance > .1) moving = true;
            }
            state.previous = position;
            const left = Math.max(0, bounds.left);
            const right = Math.min(innerWidth, bounds.right);
            const center = (left + right) / 2;
            const visible = blocked ? [] : state.cards.filter(({ cover }) => {
                const rect = cover.getBoundingClientRect();
                return rect.width > 0 && rect.height > 0 && rect.left >= left - 1.5 && rect.right <= right + 1.5
                    && rect.top >= headerBottom - 1.5 && rect.bottom <= innerHeight + 1.5;
            });
            // Retain the current card while it remains fully visible: nearby cards
            // and fractional coordinates must not repeatedly restart the entrance.
            const retained = visible.find(item => item.card === state.selected);
            visible.sort((a, b) => {
                const ar = a.cover.getBoundingClientRect();
                const br = b.cover.getBoundingClientRect();
                return Math.abs((ar.left + ar.right) / 2 - center) - Math.abs((br.left + br.right) / 2 - center);
            });
            const candidate = (retained || visible[0])?.card || null;
            if (state.speed > .35 || !candidate) {
                select(state, null);
                state.candidate = null;
                state.since = now;
            } else {
                if (state.selected && state.selected !== candidate) select(state, null);
                if (candidate !== state.candidate || state.speed > .1) {
                    state.candidate = candidate;
                    state.since = now;
                }
                if (now - state.since >= 160) select(state, candidate);
            }
        });
        if (moving) awakeUntil = now + 600;
        if (now < awakeUntil) frame = requestAnimationFrame(sample);
    }
    function wake() {
        if (!mobile.matches || document.hidden) { reset(); return; }
        awakeUntil = performance.now() + 1200;
        if (frame === null) {
            // An idle interval is not a motion sample.
            states.forEach(state => { state.previous = null; state.speed = 0; });
            frame = requestAnimationFrame(sample);
        }
    }
    document.addEventListener('scroll', wake, { capture: true, passive: true });
    document.addEventListener('pointerdown', wake, { passive: true });
    window.addEventListener('pointerup', wake, { passive: true });
    window.addEventListener('pointercancel', wake, { passive: true });
    window.addEventListener('blur', reset);
    window.addEventListener('focus', wake);
    window.addEventListener('resize', wake);
    window.addEventListener('pageshow', wake);
    document.addEventListener('visibilitychange', wake);
    mobile.addEventListener('change', wake);
    // Visibility notifications wake the sampler without hiding a settled label.
    const observer = new IntersectionObserver(wake, { threshold: [0, 1] });
    states.forEach(state => state.cards.forEach(({ cover }) => observer.observe(cover)));
    document.fonts.ready.then(wake);
    wake();
})();
