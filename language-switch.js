(() => {
    const links = [...document.querySelectorAll('[data-language-link]')];
    function update() {
        links.forEach(link => {
            const target = new URL(link.getAttribute('href'), location.href);
            target.search = location.search;
            target.hash = location.hash;
            link.href = target.href;
        });
    }
    update();
    window.addEventListener('hashchange', update);
})();
