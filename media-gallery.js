(() => {
    'use strict';
    const english = document.documentElement.lang === 'en';
    const labels = {
        'Просмотр проекта': 'Project viewer', 'Закрыть просмотр': 'Close viewer',
        'Предыдущее изображение': 'Previous image', 'Следующее изображение': 'Next image',
        'Выбрать изображение': 'Choose an image', 'видео': 'video', 'из': 'of',
        'Видео': 'Video', 'Изображение': 'Image', 'Открыть': 'Open',
        'Degree Show — эскизы': 'Degree Show — early explorations',
        'Degree Show — итоговая выставка': 'Degree Show — final exhibition',
        'Арки среди нас': 'Arches Among Us', 'Комната мечты': 'Dream room',
        'Pragma x БВШД': 'Pragma x BHSAD'
    };
    const t = text => english ? labels[text] || text : text;
    const viewer = document.createElement('dialog');
    viewer.className = 'media-modal';
    viewer.tabIndex = -1;
    viewer.setAttribute('aria-label', t('Просмотр проекта'));
    viewer.innerHTML = `<button class="media-close" type="button" aria-label="Закрыть просмотр">×</button>
        <div class="media-body"><button class="media-prev" type="button" aria-label="Предыдущее изображение">←</button><img class="media-image" alt=""><video class="media-video" controls muted loop playsinline hidden></video><button class="media-next" type="button" aria-label="Следующее изображение">→</button></div>
        <p class="media-caption" aria-live="polite"></p><div class="media-thumbs" aria-label="Выбрать изображение"></div>`;
    viewer.querySelectorAll('[aria-label]').forEach(el => el.setAttribute('aria-label', t(el.getAttribute('aria-label'))));
    document.body.append(viewer);
    const image = viewer.querySelector('.media-image');
    const video = viewer.querySelector('.media-video');
    const caption = viewer.querySelector('.media-caption');
    const thumbs = viewer.querySelector('.media-thumbs');
    const previous = viewer.querySelector('.media-prev');
    const next = viewer.querySelector('.media-next');
    let items = [], index = 0, title = '';
    function stopVideo() { video.pause(); video.removeAttribute('src'); video.load(); }
    function show() {
        stopVideo();
        const item = items[index];
        image.hidden = item.video;
        video.hidden = !item.video;
        if (item.video) {
            image.removeAttribute('src');
            video.src = item.src;
            video.setAttribute('aria-label', item.alt || `${title} — ${t('видео')}`);
            video.play().catch(() => {});
        } else {
            image.src = item.src;
            image.alt = item.alt || `${title} — ${index + 1} ${t('из')} ${items.length}`;
        }
        caption.textContent = `${item.alt || title}${items.length > 1 ? ` · ${index + 1} / ${items.length}` : ''}`;
        previous.hidden = next.hidden = items.length < 2;
        [...thumbs.children].forEach((button, i) => button.setAttribute('aria-current', String(i === index)));
        thumbs.children[index]?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
    function open(collection, selected, name) {
        items = collection; index = selected; title = name;
        thumbs.replaceChildren();
        thumbs.hidden = items.length < 2;
        items.forEach((item, i) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.setAttribute('aria-label', `${t(item.video ? 'Видео' : 'Изображение')} ${i + 1}`);
            if (!item.video || item.poster) {
                const thumbnail = document.createElement('img');
                thumbnail.src = item.poster || item.src;
                thumbnail.alt = '';
                button.append(thumbnail);
            }
            if (item.video) { const play = document.createElement('span'); play.textContent = '▶'; button.append(play); }
            button.addEventListener('click', () => { index = i; show(); });
            thumbs.append(button);
        });
        viewer.showModal();
        viewer.focus({ preventScroll: true });
        show();
    }
    function move(step) { index = (index + step + items.length) % items.length; show(); }
    previous.addEventListener('click', () => move(-1));
    next.addEventListener('click', () => move(1));
    viewer.querySelector('.media-close').addEventListener('click', () => viewer.close());
    viewer.addEventListener('click', event => {
        if (!event.target.closest('button, img, video')) viewer.close();
    });
    viewer.addEventListener('close', stopVideo);
    viewer.addEventListener('keydown', event => {
        if (event.target === video) return;
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
            event.preventDefault(); move(event.key === 'ArrowLeft' ? -1 : 1);
        }
    });
    document.querySelectorAll('[data-viewer-images]').forEach(button => button.addEventListener('click', event => {
        if (event.defaultPrevented) return;
        const sources = JSON.parse(button.dataset.viewerImages);
        const name = button.querySelector('.catalogue-title').textContent;
        open(sources.map(src => ({ src, video: /\.mp4(?:[?#]|$)/i.test(src), poster: /\.mp4(?:[?#]|$)/i.test(src) ? sources[0] : '' })), 0, name);
    }));
    function bindGroup(selector, name) {
        name = t(name);
        const elements = [...document.querySelectorAll(selector)];
        const collection = elements.map(el => ({ src: el.currentSrc || el.src, video: el.tagName === 'VIDEO', poster: el.poster || '', alt: el.alt || el.parentElement.querySelector('.drafts2-title, .drafts2-title1')?.textContent.trim() || '' }));
        elements.forEach((el, i) => {
            el.classList.add('media-trigger');
            el.tabIndex = 0;
            el.setAttribute('role', 'button');
            el.setAttribute('aria-label', `${t('Открыть')}: ${collection[i].alt || name} — ${i + 1}`);
            el.addEventListener('click', () => { if (el.tagName === 'VIDEO') el.pause(); open(collection, i, name); });
            el.addEventListener('keydown', event => {
                if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); el.click(); }
            });
        });
    }
    bindGroup('.gallery-image', 'Degree Show — эскизы');
    bindGroup('.gallery-image1', 'Degree Show — итоговая выставка');
    bindGroup('.arches-video', 'Арки среди нас');
    bindGroup('.gallery-grid img', 'Комната мечты');
    document.querySelectorAll('.pragma-gallery').forEach((group, i) => {
        group.dataset.mediaGroup = i;
        bindGroup(`[data-media-group="${i}"] img`, 'Pragma x БВШД');
    });
    bindGroup('.alphabet-spreads img', 'Alphabet');
    document.querySelectorAll('.arches-video').forEach(el => {
        el.addEventListener('mouseenter', () => { if (!viewer.open) el.play().catch(() => {}); });
        el.addEventListener('mouseleave', () => { el.pause(); el.currentTime = 0; });
    });
})();
