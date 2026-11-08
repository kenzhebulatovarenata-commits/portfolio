(() => {
    'use strict';

    const scene = document.querySelector('.scene');
    const gallery = scene.querySelector('.gallery');
    const cards = Array.from(gallery.querySelectorAll('.card'));
    const header = document.querySelector('.header');
    const projectsTitle = document.querySelector('.proj');
    const boundary = document.querySelector('.zig-image');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    const defs = document.createElementNS(svgNS, 'defs');
    svg.classList.add('gallery-clips');
    svg.setAttribute('aria-hidden', 'true');
    svg.append(defs);
    scene.append(svg);
    scene.setAttribute('aria-label', 'Проекты — листайте влево или вправо');
    gallery.setAttribute('aria-roledescription', 'карусель');

    const initialIndex = Math.min(2, cards.length - 1);
    let targetIndex = initialIndex;
    let activeIndex = initialIndex;
    let scroll = window.scrollY;
    let targetScroll = scroll;
    let frame = null;
    let previousTime = 0;
    let width = 0;
    let height = 0;
    let boundaryY = 0;
    let step = 240;
    let drag = null;
    let suppressClickUntil = 0;
    let wheelEndTimer = null;
    let indexVelocity = 0;

    const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
    const lerp = (a, b, t) => a + (b - a) * t;
    const smoothstep = t => t * t * (3 - 2 * t);
    const wrapIndex = index => ((index % cards.length) + cards.length) % cards.length;
    const relativeOffset = (index, centre) =>
        wrapIndex(index - centre + cards.length / 2) - cards.length / 2;

    const items = cards.map((card, i) => {
        const inner = card.querySelector('.card-inner');
        const label = card.querySelector('.card-label');
        // Keep the existing project names, images, links and order.
        card.append(label);
        const separator = document.createElement('span');
        separator.className = 'card-separator';
        separator.setAttribute('aria-hidden', 'true');
        card.append(separator);
        const clip = document.createElementNS(svgNS, 'clipPath');
        const path = document.createElementNS(svgNS, 'path');
        clip.id = `home-project-clip-${i}`;
        clip.setAttribute('clipPathUnits', 'objectBoundingBox');
        clip.append(path);
        defs.append(clip);
        inner.style.clipPath = `url(#${clip.id})`;
        const image = card.querySelector('img');
        image.alt = label.textContent.replace('→', '').trim();
        image.draggable = false;
        card.setAttribute('aria-label', image.alt);
        card.draggable = false;
        return { card, inner, image, label, separator, path };
    });

    function requestRender() {
        if (frame === null) frame = requestAnimationFrame(render);
    }

    function measure() {
        width = document.documentElement.clientWidth;
        height = window.innerHeight;
        boundaryY = boundary.getBoundingClientRect().top + window.scrollY;
        requestRender();
    }

    function select(index) {
        targetIndex = index;
        requestRender();
    }

    // A rounded rectangle becomes a horizontal capsule. The far edge bends
    // gently as it travels off centre, like the moving ovals in the reference.
    function contour(w, h, growth, offset, velocity) {
        const radius = h / 2;
        const rx = Math.min(0.5, radius / w);
        const ry = Math.min(0.5, radius / h);
        const k = 0.55228475;
        const bend = reducedMotion.matches ? 0 : clamp(Math.abs(offset) * 0.12 + Math.abs(velocity) * 2.2, 0, 0.3);
        const left = offset < 0 ? bend : 0;
        const right = offset > 0 ? bend : 0;
        return [
            `M ${rx} 0`,
            `C ${rx + (1 - 2 * rx) / 3} ${left} ${1 - rx - (1 - 2 * rx) / 3} ${right} ${1 - rx} 0`,
            `C ${1 - rx + rx * k} 0 1 ${ry * (1 - k)} 1 ${ry}`,
            `L 1 ${1 - ry}`,
            `C 1 ${1 - ry + ry * k} ${1 - rx + rx * k} 1 ${1 - rx} 1`,
            `C ${1 - rx - (1 - 2 * rx) / 3} ${1 - right} ${rx + (1 - 2 * rx) / 3} ${1 - left} ${rx} 1`,
            `C ${rx * (1 - k)} 1 0 ${1 - ry + ry * k} 0 ${1 - ry}`,
            `L 0 ${ry}`,
            `C 0 ${ry * (1 - k)} ${rx * (1 - k)} 0 ${rx} 0 Z`
        ].join(' ');
    }

    function render(time) {
        frame = null;
        const dt = previousTime ? Math.min(48, time - previousTime) : 16.67;
        previousTime = time;
        const oldIndex = activeIndex;
        // Integrate a critically damped spring in small time steps. Unlike a
        // per-event jump this preserves momentum when a gesture changes direction.
        if (reducedMotion.matches) {
            activeIndex = targetIndex;
            indexVelocity = 0;
        } else {
            const frequency = drag?.horizontal || wheelEndTimer !== null ? 12 : 8;
            const count = Math.ceil(dt / 8);
            const seconds = dt / count / 1000;
            for (let n = 0; n < count; n++) {
                indexVelocity += ((targetIndex - activeIndex) * frequency * frequency
                    - 2 * frequency * indexVelocity) * seconds;
                activeIndex += indexVelocity * seconds;
            }
        }
        const scrollEase = reducedMotion.matches ? 1 : 1 - Math.exp(-dt / 160);
        scroll = lerp(scroll, targetScroll, scrollEase);
        if (Math.abs(activeIndex - targetIndex) < 0.0001 && Math.abs(indexVelocity) < 0.001) {
            activeIndex = targetIndex;
            indexVelocity = 0;
        }
        if (Math.abs(scroll - targetScroll) < 0.1) scroll = targetScroll;

        const progress = clamp(scroll / (height * 2.3));
        const exitStart = Math.max(height * 0.15, boundaryY - height * 0.95);
        const growthStart = Math.min(height * 0.1, exitStart * 0.15);
        const growthEnd = Math.min(height * 0.95, exitStart * 0.85);
        const growth = smoothstep(clamp((scroll - growthStart) / Math.max(1, growthEnd - growthStart)));
        const exit = smoothstep(clamp((scroll - exitStart) / Math.max(1, boundaryY - exitStart)));
        const expandedWidth = Math.min(width * 0.56, height * 1.12, 1000);
        const expandedHeight = expandedWidth * 0.5625;
        const compactScale = Math.min(1, width / 800);
        const cardWidth = lerp(171 * compactScale, expandedWidth, growth);
        const cardHeight = cardWidth * 0.5625;
        const gap = expandedWidth * 0.13;
        step = lerp(240 * compactScale, expandedWidth + gap, growth);
        const centreY = lerp(-100, 0, growth) - exit * height * 1.2;
        const velocity = (activeIndex - oldIndex) * 16.67 / dt;

        // Retain the existing header and project-heading scroll choreography.
        header.style.transform = `translateY(${-120 * progress}px)`;
        const titleExit = clamp((progress - 0.75) / 0.25);
        projectsTitle.style.transform = `translateY(${-150 * titleExit}px)`;
        scene.style.visibility = exit === 1 ? 'hidden' : 'visible';
        scene.inert = exit === 1;

        items.forEach(({ card, image, label, separator, path }, i) => {
            const offset = relativeOffset(i, activeIndex);
            card.style.width = `${cardWidth}px`;
            card.style.height = `${cardHeight}px`;
            card.style.transform = `translate3d(${offset * step - cardWidth / 2}px, ${centreY - cardHeight / 2}px, 0)`;
            card.style.zIndex = String(cards.length - Math.round(Math.abs(offset)));
            card.style.setProperty('--separator-gap', `${Math.max(0, step - cardWidth) / 2}px`);
            path.setAttribute('d', contour(cardWidth, cardHeight, growth, offset, velocity));
            const refraction = reducedMotion.matches ? 0 : clamp(indexVelocity * 0.018, -0.09, 0.09);
            image.style.transform = `translateX(${-refraction * 25}%) scale(${1.04 + Math.abs(refraction) * 0.6}) skewX(${refraction * -12}deg)`;
            const selected = i === wrapIndex(Math.round(targetIndex));
            if (selected) card.setAttribute('aria-current', 'true');
            else card.removeAttribute('aria-current');
            const labelVisibility = growth * (1 - exit);
            label.style.opacity = String(labelVisibility * lerp(1, 0.35, clamp(Math.abs(offset))));
            separator.style.opacity = String(growth * (1 - exit));
        });

        if (activeIndex !== targetIndex || scroll !== targetScroll) requestRender();
        else previousTime = 0;
    }

    cards.forEach((card, i) => {
        card.addEventListener('click', event => {
            if (performance.now() < suppressClickUntil) {
                event.preventDefault();
                return;
            }
            if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
            if (i !== wrapIndex(Math.round(targetIndex)) || Math.abs(activeIndex - targetIndex) > 0.03) {
                event.preventDefault();
                select(Math.round(targetIndex) + relativeOffset(i, Math.round(targetIndex)));
            }
        });
    });

    window.addEventListener('wheel', event => {
        const horizontal = Math.abs(event.deltaX) > Math.abs(event.deltaY);
        if ((!horizontal && !event.shiftKey) || scene.inert) return;
        const delta = horizontal ? event.deltaX : event.deltaY;
        if (!delta) return;
        // Leave normal vertical scrolling entirely under the browser's control.
        event.preventDefault();
        const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? width : 1;
        targetIndex += clamp(delta * unit / Math.max(180, step * 0.65), -0.65, 0.65);
        clearTimeout(wheelEndTimer);
        wheelEndTimer = setTimeout(() => {
            wheelEndTimer = null;
            select(Math.round(targetIndex));
        }, 150);
        requestRender();
    }, { passive: false });

    gallery.addEventListener('keydown', event => {
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
        event.preventDefault();
        clearTimeout(wheelEndTimer);
        wheelEndTimer = null;
        select(Math.round(targetIndex) + (event.key === 'ArrowRight' ? 1 : -1));
        cards[wrapIndex(targetIndex)].focus({ preventScroll: true });
    });

    gallery.addEventListener('pointerdown', event => {
        if (event.button !== 0 || !event.target.closest('.card')) return;
        clearTimeout(wheelEndTimer);
        wheelEndTimer = null;
        event.target.closest('.card').setPointerCapture(event.pointerId);
        drag = { id: event.pointerId, x: event.clientX, y: event.clientY,
            index: activeIndex, horizontal: false };
    });

    gallery.addEventListener('pointermove', event => {
        if (!drag || drag.id !== event.pointerId) return;
        const dx = event.clientX - drag.x;
        const dy = event.clientY - drag.y;
        if (!drag.horizontal && Math.max(Math.abs(dx), Math.abs(dy)) > 10) {
            if (Math.abs(dy) > Math.abs(dx)) { drag = null; return; }
            drag.horizontal = true;
        }
        if (!drag.horizontal) return;
        targetIndex = drag.index - dx / step;
        suppressClickUntil = performance.now() + 300;
        requestRender();
    });

    function endDrag(event) {
        if (!drag || drag.id !== event.pointerId) return;
        if (drag.horizontal) {
            const dx = event.clientX - drag.x;
            const moved = Math.abs(dx) > Math.min(48, step * 0.15);
            select(event.type === 'pointercancel' ? Math.round(drag.index) :
                moved ? Math.round(drag.index) - Math.sign(dx) * Math.max(1, Math.round(Math.abs(dx) / step)) : Math.round(drag.index));
            suppressClickUntil = performance.now() + 300;
        }
        drag = null;
    }
    gallery.addEventListener('pointerup', endDrag);
    gallery.addEventListener('pointercancel', endDrag);
    gallery.addEventListener('lostpointercapture', event => {
        if (drag && drag.id === event.pointerId) { select(Math.round(targetIndex)); drag = null; }
    });
    gallery.addEventListener('dragstart', event => event.preventDefault());
    window.addEventListener('scroll', () => {
        targetScroll = window.scrollY;
        requestRender();
    }, { passive: true });
    window.addEventListener('resize', measure);
    window.addEventListener('pageshow', () => {
        targetScroll = window.scrollY;
        measure();
    });
    reducedMotion.addEventListener('change', requestRender);
    document.fonts.ready.then(measure);
    measure();
})();
