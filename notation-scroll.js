(() => {
    'use strict';

    const scene = document.querySelector('.notation-scroll-scene');
    const light = document.querySelector('.notation-light');
    const experimental = document.querySelector('.notation-experimental');
    const word = document.querySelector('.notation-word');
    const media = document.querySelector('.notation-growing-video');
    const intro = document.querySelector('.notation-intro-copy');
    const copy = intro.querySelector('.notation-text');
    const paragraph = copy.querySelector('p');
    // Keep each word intact so every line can move smoothly from left to center.
    const words = paragraph.textContent.trim().split(/[ \t\r\n]+/).map(text => {
        const span = document.createElement('span');
        span.textContent = text;
        return span;
    });
    paragraph.replaceChildren(...words.flatMap((span, index) => index ? [document.createTextNode(' '), span] : [span]));
    let endWidth = 0;
    let frame = null;

    function render() {
        frame = null;
        const width = document.documentElement.clientWidth;
        const height = window.innerHeight;
        const rect = scene.getBoundingClientRect();
        const distance = Math.max(0, -rect.top);
        const progress = Math.min(1, distance / (height * 1.4));
        const headerHeight = document.querySelector('.header').offsetHeight;
        const firstTop = Math.max(headerHeight + 42, height * 0.2);
        const wordTop = firstTop + width * 0.145 + 22;
        const startWidth = width * 0.33;
        const videoWidth = startWidth + (endWidth - startWidth) * progress;
        const endTop = Math.max(headerHeight + 16, (height - endWidth * 9 / 16) / 2);

        experimental.style.top = `${firstTop - height * 0.65 * progress}px`;
        word.style.top = `${wordTop - height * 0.48 * progress}px`;
        word.style.columnGap = `${width * 0.35 * (1 - Math.min(1, progress / 0.8))}px`;
        const notaWidth = document.querySelector('.notation-nota').offsetWidth;
        const tionWidth = document.querySelector('.notation-tion').offsetWidth;
        const mediaCenter = width / 2 + (notaWidth - tionWidth) / 2 * (1 - progress);
        media.style.left = `${mediaCenter}px`;
        media.style.width = `${videoWidth}px`;
        const mediaTop = wordTop + (endTop - wordTop) * progress;
        media.style.top = `${mediaTop}px`;
        const eased = progress * progress * (3 - 2 * progress);
        const gutter = Math.max(24, (width - endWidth) / 2);
        const finalCopyWidth = Math.min(700, width - gutter * 2);
        const initialLeft = mediaCenter - videoWidth / 2;
        const initialCopyWidth = Math.min(Math.max(160, videoWidth * 0.64), width - initialLeft - 16);
        const copyWidth = initialCopyWidth + (finalCopyWidth - initialCopyWidth) * eased;
        intro.style.width = `${copyWidth}px`;
        intro.style.left = `${initialLeft + ((width - finalCopyWidth) / 2 - initialLeft) * eased}px`;
        intro.style.top = `${mediaTop + videoWidth * 9 / 16 + 10 * (1 - eased)}px`;
        paragraph.style.fontSize = `${8 + 10 * eased}px`;
        copy.style.transform = `translateY(${Math.max(0, (intro.offsetHeight - paragraph.offsetHeight) / 2) * eased}px)`;

        const lines = new Map();
        words.forEach(word => {
            const top = word.offsetTop;
            if (!lines.has(top)) lines.set(top, []);
            lines.get(top).push({word, right: word.offsetLeft + word.offsetWidth});
        });
        lines.forEach(line => {
            const offset = Math.max(0, (paragraph.clientWidth - line[line.length - 1].right) / 2) * eased;
            line.forEach(({word}) => { word.style.transform = `translateX(${offset}px)`; });
        });
    }

    function requestRender() {
        if (frame === null) frame = requestAnimationFrame(render);
    }

    function measure() {
        const width = document.documentElement.clientWidth;
        const headerHeight = document.querySelector('.header').offsetHeight;
        const currentMaxWidth = Math.min(width * 0.8, Math.max(width * 0.4, (window.innerHeight - headerHeight - 190) * 16 / 9));
        endWidth = (currentMaxWidth + width * 0.96) / 2;
        const endTop = Math.max(headerHeight + 16, (window.innerHeight - endWidth * 9 / 16) / 2);
        document.body.style.setProperty('--notation-gutter', `${(width - endWidth) / 2}px`);
        const stageHeight = Math.max(window.innerHeight, endTop + endWidth * 9 / 16 + intro.offsetHeight + window.innerHeight * 0.18);
        scene.style.setProperty('--notation-stage-height', `${stageHeight}px`);
        scene.style.setProperty('--notation-scene-height', `${stageHeight + window.innerHeight * 1.4}px`);
        light.style.paddingBottom = '0px';
        light.style.setProperty('--light-pin-top', `${Math.min(0, window.innerHeight - light.offsetHeight)}px`);
        const posters = document.querySelector('.notation-poster-panel');
        posters.style.setProperty('--poster-pin-top', `${Math.min(0, window.innerHeight - posters.offsetHeight)}px`);
        requestRender();
    }

    window.addEventListener('scroll', requestRender, { passive: true });
    window.addEventListener('resize', measure);
    window.addEventListener('load', measure, { once: true });
    document.fonts.ready.then(measure);
    measure();
})();
