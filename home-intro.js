(() => {
    'use strict';
    const root = document.documentElement;
    root.classList.add('has-home-intro');
    const fallback = setTimeout(() => root.classList.remove('has-home-intro'), 1500);

    function initialize() {
        const hero = document.querySelector('.home-projects .hero');
        if (!hero || !('IntersectionObserver' in window)) {
            root.classList.remove('has-home-intro');
            clearTimeout(fallback);
            return;
        }
        const targets = new Map();
        const animated = new Set();
        // Observe stationary boxes; animate only their contents so an entrance
        // cannot move its own trigger and repeatedly hide itself at the edge.
        function register(anchor, elements, step = 0) {
            if (!anchor) return;
            const items = [...elements].filter(element => !animated.has(element));
            items.forEach((element, index) => {
                const opacity = parseFloat(getComputedStyle(element).opacity);
                element.style.setProperty('--part-opacity', opacity > 0 ? opacity : 1);
                element.style.setProperty('--part-delay', `${index * step}ms`);
                element.classList.add('part-reveal');
                animated.add(element);
            });
            if (items.length) targets.set(anchor, [...(targets.get(anchor) || []), ...items]);
        }
        function content(element) {
            const span = document.createElement('span');
            span.className = 'part-reveal-content';
            span.append(...element.childNodes);
            element.append(span);
            return span;
        }
        try {
            register(hero, hero.querySelectorAll('.hero-word'), 60);
            document.querySelectorAll('.home-projects .proj h2, .home-projects .tools h2, .home-projects .tools-desc, .home-projects .experience h2').forEach(element => {
                register(element, [content(element)]);
            });
            document.querySelectorAll('.home-projects .card').forEach(card => {
                register(card, card.querySelectorAll('.card-inner'));
            });
            document.querySelectorAll('.home-projects .project-more-wrap').forEach(slot => {
                register(slot, slot.querySelectorAll('.projects-more'));
            });
            const icons = document.querySelector('.home-projects .tools-grid');
            if (icons) register(icons, icons.querySelectorAll('img'), 90);
            const experience = document.querySelector('.home-projects .exp-grid');
            if (experience) register(experience, experience.querySelectorAll('.exp-item'), 60);

            function show(anchor, visible) {
                (targets.get(anchor) || []).forEach(element => {
                    element.classList.toggle('part-visible', visible || element.contains(document.activeElement));
                });
            }
            const observer = new IntersectionObserver(entries => {
                entries.forEach(entry => show(entry.target, entry.isIntersecting));
            }, { rootMargin: '-48px 0px -16px 0px', threshold: 0 });
            root.classList.add('has-part-reveals');
            targets.forEach((_, anchor) => observer.observe(anchor));
            root.classList.remove('has-home-intro');
            clearTimeout(fallback);

            // Focus and back/forward restoration must never leave controls blank.
            document.addEventListener('focusin', () => {
                animated.forEach(element => {
                    if (element.contains(document.activeElement)) element.classList.add('part-visible');
                });
            });
            window.addEventListener('pageshow', event => {
                if (!event.persisted) return;
                targets.forEach((_, anchor) => {
                    const rect = anchor.getBoundingClientRect();
                    show(anchor, rect.bottom > 48 && rect.top < innerHeight - 16 && rect.right > 0 && rect.left < innerWidth);
                });
            });
        } catch (error) {
            // Animation is optional: a failed enhancement must leave content visible.
            root.classList.remove('has-part-reveals', 'has-home-intro');
            clearTimeout(fallback);
        }
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize, { once: true });
    else initialize();
})();
