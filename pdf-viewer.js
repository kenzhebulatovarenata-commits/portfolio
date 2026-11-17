(() => {
    'use strict';
    const links = document.querySelectorAll('[data-pdf-viewer]');
    if (!links.length) return;
    const viewer = document.createElement('dialog');
    viewer.className = 'pdf-viewer';
    viewer.setAttribute('aria-label', 'Alphabet — просмотр PDF');
    viewer.innerHTML = `
        <div class="pdf-viewer-toolbar">
            <span>Alphabet</span>
            <a class="pdf-viewer-direct" target="_blank" rel="noopener">Открыть PDF отдельно</a>
            <button class="pdf-viewer-close" type="button" aria-label="Закрыть просмотр">×</button>
        </div>
        <iframe class="pdf-viewer-document" title="Alphabet — каталог PDF"></iframe>`;
    document.body.append(viewer);
    const frame = viewer.querySelector('iframe');
    const direct = viewer.querySelector('.pdf-viewer-direct');
    links.forEach(link => link.addEventListener('click', event => {
        if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        frame.src = `pdf-reader.html?file=${encodeURIComponent(link.getAttribute('href'))}`;
        direct.href = link.href;
        viewer.showModal();
    }));
    viewer.querySelector('button').addEventListener('click', () => viewer.close());
    viewer.addEventListener('close', () => frame.removeAttribute('src'));
})();
