(() => {
    'use strict';
    const section = document.querySelector('.home-projects #about');
    if (!section) return;
    const stage = section.querySelector('.about-stage');
    const track = section.querySelector('.about-copy-track');
    if (!stage || !track) return;
    const panels = [...track.querySelectorAll(':scope > p')];
    if (panels.length !== 3) return;
    const clamp = value => Math.max(0, Math.min(1, value));
    const smooth = value => { const t = clamp(value); return t * t * (3 - 2 * t); };
    let frame = null;
    let previousTime = null;
    let visualPosition = null;
    let visualTop = null;
    let visualReveal = null;
    const title = section.querySelector('h2');
    const projects = document.querySelector('.home-projects .proj');
    const tools = document.querySelector('.home-projects .tools');
    let revealTriggered = null;
    let exitTriggered = null;
    let currentPanel = -1;

    function render(time) {
        frame = null;
        const top = section.getBoundingClientRect().top;
        const range = Math.max(1, section.offsetHeight - innerHeight);
        const progress = clamp(-top / range);
        const bottom = top + section.offsetHeight;
        const projectsTop = projects.getBoundingClientRect().top;
        const projectsHeight = Math.max(1, top - projectsTop);
        const triggerDistance = projectsTop + projectsHeight * 2 / 3;
        const upperClose = innerHeight * 2 / 3;
        if (revealTriggered === null) revealTriggered = triggerDistance <= 0 && top < upperClose;
        else if (!revealTriggered && triggerDistance <= 0 && top < upperClose - 16) revealTriggered = true;
        else if (revealTriggered && top >= upperClose) revealTriggered = false;
        const toolsTop = tools ? tools.getBoundingClientRect().top : bottom;
        // Keep the about panel open until the neighbouring section fills two thirds
        // of the viewport. Reopen symmetrically when returning from below.
        if (exitTriggered === null) exitTriggered = toolsTop <= innerHeight / 3;
        else if (!exitTriggered && toolsTop <= innerHeight / 3) exitTriggered = true;
        else if (exitTriggered && toolsTop >= innerHeight * 2 / 3) exitTriggered = false;
        // Both opening and closing complete with the same timed settling motion.
        const targetReveal = revealTriggered && !exitTriggered ? 1 : 0;
        // Longer transitions, with time to read each complete paragraph.
        const targetPosition = smooth((progress - 0.18) / 0.24)
            + smooth((progress - 0.56) / 0.24);
        const pinnedTop = Math.min(Math.max(top, 0), top + range);
        const dt = previousTime === null ? 16.67 : Math.min(64, time - previousTime);
        previousTime = time;
        if (visualPosition === null) visualPosition = targetPosition;
        if (visualTop === null) visualTop = pinnedTop;
        if (visualReveal === null) visualReveal = targetReveal;
        visualPosition += (targetPosition - visualPosition) * (1 - Math.exp(-dt / 145));
        visualTop += (pinnedTop - visualTop) * (1 - Math.exp(-dt / 110));
        visualReveal += (targetReveal - visualReveal) * (1 - Math.exp(-dt / 150));
        // Keep the settling motion local even after a large wheel or page jump.
        visualTop = pinnedTop + Math.max(-110, Math.min(110, visualTop - pinnedTop));
        const textSettled = Math.abs(targetPosition - visualPosition) < 0.0002;
        const revealSettled = Math.abs(targetReveal - visualReveal) < 0.0002;
        if (revealSettled) visualReveal = targetReveal;
        const stageSettled = Math.abs(pinnedTop - visualTop) < 0.1;
        if (textSettled) visualPosition = targetPosition;
        if (stageSettled) visualTop = pinnedTop;
        track.style.transform = `translate3d(0, ${-visualPosition * 100}%, 0)`;
        stage.style.setProperty('--about-settle-y', `${(visualTop - pinnedTop).toFixed(3)}px`);
        stage.style.setProperty('--about-mask-inset', `${((1 - visualReveal) * 100).toFixed(3)}%`);
        title.classList.toggle('is-in-view', visualReveal > 0.65);
        stage.inert = visualReveal < 0.03;
        const current = Math.round(visualPosition);
        if (current !== currentPanel) {
            currentPanel = current;
            panels.forEach((panel, index) => {
                panel.inert = index !== current;
                panel.setAttribute('aria-hidden', String(index !== current));
            });
        }
        if (!textSettled || !stageSettled || !revealSettled) frame = requestAnimationFrame(render);
        else previousTime = null;
    }
    function schedule() {
        if (frame === null) frame = requestAnimationFrame(render);
    }
    function reset() {
        visualPosition = visualTop = visualReveal = previousTime = null;
        revealTriggered = exitTriggered = null;
        schedule();
    }
    section.classList.add('has-about-scroll');
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', reset);
    window.addEventListener('pageshow', reset);
    schedule();
})();
