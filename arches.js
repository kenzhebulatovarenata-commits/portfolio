/* Keep a real video frame visible while the hover preview is paused or loading. */
(() => {
    document.querySelectorAll('.arches-page .arches-video').forEach(video => {
        video.addEventListener('playing', () => video.classList.add('is-playing'));
        const showPoster = () => video.classList.remove('is-playing');
        video.addEventListener('pause', showPoster);
        video.addEventListener('ended', showPoster);
        video.addEventListener('error', showPoster);
    });
})();
