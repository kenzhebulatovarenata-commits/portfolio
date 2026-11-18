(() => {
    'use strict';
    const groups = [...document.querySelectorAll('.catalogue-group')];
    const links = [...document.querySelectorAll('[data-catalogue-group]')];
    const mobile = matchMedia('(max-width: 700px)');
    const header = document.querySelector('.header');
    function measureHeader() {
        document.documentElement.style.setProperty('--catalogue-header-height', `${header.getBoundingClientRect().height}px`);
    }
    new ResizeObserver(measureHeader).observe(header);
    measureHeader();
    let mobileGroup = groups.find(group => '#' + group.id === location.hash)?.dataset.group || 'all';
    function showMobileGroup(value) {
        mobileGroup = groups.some(group => group.dataset.group === value) ? value : 'all';
        groups.forEach(group => group.classList.toggle('is-mobile-current', group.dataset.group === mobileGroup));
        links.forEach(link => {
            if (link.dataset.catalogueGroup === mobileGroup) link.setAttribute('aria-current', 'true');
            else link.removeAttribute('aria-current');
        });
    }
    document.body.classList.add('has-mobile-catalogue');
    showMobileGroup(mobileGroup);
    let active = '';
    let frame = null;
    function updateGroup() {
        frame = null;
        if (mobile.matches) return;
        const focus = innerHeight * .55;
        const current = groups.find(group => {
            const r = group.getBoundingClientRect();
            return r.top <= focus && r.bottom > focus;
        }) || (groups[0].getBoundingClientRect().top > focus ? groups[0] : groups.at(-1));
        if (active === current.dataset.group) return;
        active = current.dataset.group;
        links.forEach(link => {
            if (link.dataset.catalogueGroup === active) link.setAttribute('aria-current', 'true');
            else link.removeAttribute('aria-current');
        });
    }
    function scheduleGroup() { if (frame === null) frame = requestAnimationFrame(updateGroup); }
    window.addEventListener('scroll', scheduleGroup, { passive: true });
    window.addEventListener('resize', scheduleGroup);
    mobile.addEventListener('change', () => {
        if (mobile.matches) showMobileGroup(mobileGroup);
        else { active = ''; scheduleGroup(); }
    });
    window.addEventListener('hashchange', () => {
        if (!mobile.matches) return;
        const group = groups.find(group => '#' + group.id === location.hash);
        if (group) showMobileGroup(group.dataset.group);
    });
    links.forEach(link => link.addEventListener('click', event => {
        event.preventDefault();
        if (mobile.matches) {
            showMobileGroup(link.dataset.catalogueGroup);
            history.replaceState(null, '', link.getAttribute('href'));
            return;
        }
        document.getElementById(link.getAttribute('href').slice(1)).scrollIntoView({ behavior: 'smooth', block: 'start' });
    }));
    groups.forEach(group => {
        const track = group.querySelector('.catalogue-track');
        if (!track.querySelector('.catalogue-entry')) return;
        const controls = [...group.querySelectorAll('[data-direction]')];
        let drag = null;
        let suppressUntil = 0;
        function updateControls() {
            controls[0].disabled = track.scrollLeft <= 1;
            controls[1].disabled = track.scrollLeft >= track.scrollWidth - track.clientWidth - 2;
        }
        function move(direction) {
            const width = track.querySelector('.catalogue-entry').offsetWidth;
            const gap = parseFloat(getComputedStyle(track).gap) || 0;
            track.scrollBy({ left: direction * (width + gap), behavior: 'smooth' });
        }
        controls.forEach(button => button.addEventListener('click', () => move(Number(button.dataset.direction))));
        track.addEventListener('keydown', event => {
            if (mobile.matches) return;
            if (!['ArrowLeft','ArrowRight'].includes(event.key)) return;
            event.preventDefault();
            move(event.key === 'ArrowLeft' ? -1 : 1);
        });
        track.addEventListener('pointerdown', event => {
            if (mobile.matches || event.pointerType !== 'mouse' || event.button !== 0) return;
            drag = { id: event.pointerId, x: event.clientX, start: track.scrollLeft, active: false };
        });
        track.addEventListener('pointermove', event => {
            if (!drag || drag.id !== event.pointerId) return;
            const dx = event.clientX - drag.x;
            if (!drag.active && Math.abs(dx) < 6) return;
            if (!drag.active) {
                drag.active = true;
                track.setPointerCapture(event.pointerId);
                track.classList.add('is-dragging');
            }
            event.preventDefault();
            track.scrollLeft = drag.start - dx;
        });
        function end(event) {
            if (!drag || drag.id !== event.pointerId) return;
            if (drag.active) suppressUntil = performance.now() + 250;
            drag = null;
            track.classList.remove('is-dragging');
        }
        track.addEventListener('pointerup', end);
        track.addEventListener('pointercancel', end);
        track.addEventListener('lostpointercapture', end);
        track.addEventListener('dragstart', event => event.preventDefault());
        track.addEventListener('click', event => {
            if (performance.now() < suppressUntil) { event.preventDefault(); event.stopImmediatePropagation(); }
        }, true);
        track.addEventListener('scroll', updateControls, { passive: true });
        new ResizeObserver(updateControls).observe(track);
        updateControls();
    });

    updateGroup();
    if (new URLSearchParams(location.search).get('project') === '8') {
        document.querySelector('.catalogue-entry[data-project-id="8"] [data-viewer-images]').click();
    }
})();
