(() => {
    'use strict';
    const opening = document.querySelector('.degree-opening');
    if (!opening) return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const mobileOpening = window.matchMedia('(max-width: 700px)');
    let frame = 0;
    const mix = (start, end, progress) => start + (end - start) * progress;
    function render() {
        frame = 0;
        if (reducedMotion.matches || mobileOpening.matches) return;
        const height = opening.querySelector('.degree-stage').clientHeight;
        const progress = Math.max(0, Math.min(1, -opening.getBoundingClientRect().top / (height * .3)));
        const eased = progress * progress * (3 - 2 * progress);
        const mobile = window.matchMedia('(max-width: 700px)').matches;
        opening.style.setProperty('--degree-title-scale', mix(1, .53, eased));
        opening.style.setProperty('--degree-title-top', `${mobile ? 38 : 60}%`);
        opening.style.setProperty('--degree-copy-scale', mix(.65, 1, eased));
        opening.style.setProperty('--degree-copy-top', `${mobile ? 80 : 60}%`);
    }
    function schedule() {
        if (!frame) frame = requestAnimationFrame(render);
    }
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    reducedMotion.addEventListener('change', schedule);
    render();
})();
