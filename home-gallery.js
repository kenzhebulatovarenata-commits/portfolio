(() => {
    'use strict';
    const light = document.querySelector('.home-light');
    const gallery = document.querySelector('.home-projects .gallery');
    if (!gallery || !light) return;
    const scene = gallery.closest('.scene');
    const controls = [...scene.querySelectorAll('[data-project-direction]')];
    let target = gallery.scrollLeft;
    let frame = null;
    let previousTime = null;
    let drag = null;
    let suppressClickUntil = 0;
    const maxScroll = () => Math.max(0, gallery.scrollWidth - gallery.clientWidth);
    const bound = value => Math.max(0, Math.min(maxScroll(), value));
    function updateControls() {
        controls.forEach(button => {
            button.disabled = Number(button.dataset.projectDirection) < 0
                ? gallery.scrollLeft <= 1 : gallery.scrollLeft >= maxScroll() - 2;
        });
    }
    function render(time) {
        frame = null;
        const dt = previousTime === null ? 16.67 : Math.min(64, time - previousTime);
        previousTime = time;
        target = bound(target);
        const distance = target - gallery.scrollLeft;
        if (Math.abs(distance) < 2) {
            gallery.scrollLeft = target;
            previousTime = null;
        } else {
            gallery.scrollLeft += distance * (1 - Math.exp(-dt / (drag?.active ? 55 : 115)));
            frame = requestAnimationFrame(render);
        }
        updateControls();
    }
    function moveTo(value) {
        target = bound(value);
        if (frame === null) frame = requestAnimationFrame(render);
    }
    controls.forEach(button => button.addEventListener('click', () => {
        const card = gallery.querySelector('.card');
        const gap = parseFloat(getComputedStyle(gallery).columnGap) || 0;
        moveTo(target + Number(button.dataset.projectDirection) * (card.offsetWidth + gap));
    }));
    gallery.addEventListener('wheel', event => {
        // Vertical scrolling keeps moving the page, as in the reference.
        if (!event.shiftKey && Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
        const delta = event.shiftKey && !event.deltaX ? event.deltaY : event.deltaX;
        if (!delta) return;
        event.preventDefault();
        const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? gallery.clientWidth : 1;
        moveTo(target + delta * unit);
    }, { passive: false });
    gallery.addEventListener('pointerdown', event => {
        if (event.pointerType !== 'mouse' || event.button !== 0) return;
        target = gallery.scrollLeft;
        drag = { id: event.pointerId, x: event.clientX, start: target, active: false };
    });
    gallery.addEventListener('pointermove', event => {
        if (!drag || drag.id !== event.pointerId) return;
        const distance = event.clientX - drag.x;
        if (!drag.active && Math.abs(distance) < 6) return;
        if (!drag.active) {
            drag.active = true;
            gallery.setPointerCapture(event.pointerId);
            gallery.classList.add('is-dragging');
        }
        event.preventDefault();
        moveTo(drag.start - distance);
    });
    function endDrag(event) {
        if (!drag || drag.id !== event.pointerId) return;
        if (drag.active) suppressClickUntil = performance.now() + 250;
        drag = null;
        gallery.classList.remove('is-dragging');
    }
    gallery.addEventListener('pointerup', endDrag);
    gallery.addEventListener('pointercancel', endDrag);
    gallery.addEventListener('lostpointercapture', endDrag);
    gallery.addEventListener('click', event => {
        if (performance.now() < suppressClickUntil) event.preventDefault();
    }, true);
    gallery.addEventListener('dragstart', event => event.preventDefault());
    gallery.addEventListener('keydown', event => {
        if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
        event.preventDefault();
        const card = gallery.querySelector('.card');
        moveTo(target + (event.key === 'ArrowLeft' ? -1 : 1) * (card.offsetWidth + (parseFloat(getComputedStyle(gallery).columnGap) || 0)));
    });
    gallery.addEventListener('scroll', () => {
        if (frame === null) target = gallery.scrollLeft;
        updateControls();
    }, { passive: true });
    gallery.addEventListener('pointerdown', event => {
        if (event.pointerType !== 'touch') return;
        if (frame !== null) cancelAnimationFrame(frame);
        frame = previousTime = null;
        target = gallery.scrollLeft;
    });
    new ResizeObserver(() => {
        target = bound(gallery.scrollLeft);
        updateControls();
    }).observe(gallery);
    updateControls();
    const heading = document.querySelector('.hero h1');
    function fitGreeting() {
        const hero = heading.closest('.hero');
        const style = getComputedStyle(hero);
        const available = hero.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
        heading.style.setProperty('--greeting-size', '100px');
        // Both lines retain their word spacing and the second-line indent.
        const indent = innerWidth * 0.163;
        const lines = [...heading.querySelectorAll('.hero-line')];
        const widths = lines.map(line => {
            const words = [...line.querySelectorAll('.hero-word')];
            return words.at(-1).getBoundingClientRect().right - words[0].getBoundingClientRect().left;
        });
        const size = Math.min(available / widths[0], (available - indent) / widths[1]) * 100;
        heading.style.setProperty('--greeting-size', `${size}px`);
    }
    fitGreeting();
    document.fonts.ready.then(fitGreeting);
    window.addEventListener('resize', fitGreeting);
    function pinLightPanel() {
        light.style.setProperty('--home-light-top', `${Math.min(0, innerHeight - light.offsetHeight)}px`);
    }
    new ResizeObserver(pinLightPanel).observe(light);
    window.addEventListener('resize', pinLightPanel);
    pinLightPanel();
})();
