/* Keep playback stable near viewport edges; never restart an active player. */
(() => {
    const mobile = matchMedia('(max-width: 700px)');
    const videos = [...document.querySelectorAll('.notation-page main video')];
    const states = new WeakMap(videos.map(video => [video, { visible: false, pending: false }]));
    function update(video) {
        const state = states.get(video);
        const shouldPlay = !document.hidden && (mobile.matches ? state.visible : video.autoplay);
        if (!shouldPlay) { if (!video.paused) video.pause(); return; }
        if (!video.paused || state.pending) return;
        state.pending = true;
        video.play().catch(() => {}).finally(() => {
            state.pending = false;
            if (document.hidden || (mobile.matches && !state.visible)) video.pause();
        });
    }
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            const video = entry.target.querySelector('video');
            const state = states.get(video);
            // Start once enough is visible; pause only after the whole wrapper leaves.
            if (!entry.isIntersecting) state.visible = false;
            else if (entry.intersectionRatio >= .15) state.visible = true;
            update(video);
        });
    }, { threshold: [0, .15] });
    videos.forEach(video => {
        if (mobile.matches) video.pause();
        observer.observe(video.closest('.video-wrapper'));
    });
    document.addEventListener('visibilitychange', () => videos.forEach(update));
    mobile.addEventListener('change', () => videos.forEach(update));
})();

/* Hold the preceding composition when the posters reach mid-screen. */
(() => {
    const panel = document.querySelector('.notation-before-yellow');
    if (!panel) return;
    const mobile = matchMedia('(max-width: 700px)');
    let frame = null;
    function measure() {
        frame = null;
        if (!mobile.matches) { panel.style.removeProperty('--notation-before-pin-top'); return; }
        const top = `calc(50svh - ${panel.offsetHeight}px)`;
        if (panel.style.getPropertyValue('--notation-before-pin-top') !== top) panel.style.setProperty('--notation-before-pin-top', top);
    }
    function schedule() { if (frame === null) frame = requestAnimationFrame(measure); }
    new ResizeObserver(schedule).observe(panel);
    window.addEventListener('resize', schedule);
    mobile.addEventListener('change', schedule);
    document.fonts.ready.then(schedule);
    schedule();
})();
