// Tutorial pages: a step jumps its video to the moment it shows, and the step on screen is marked.
for (const box of document.querySelectorAll('[data-tutorial]')) {
  const video = box.querySelector('video');
  const steps = [...box.querySelectorAll('[data-seek]')];
  if (!video || !steps.length) continue;
  const times = steps.map((step) => Number(step.dataset.seek));
  // With preload="none" there is nothing to seek in until the metadata arrives.
  const seek = (at) => {
    if (video.readyState >= 1) video.currentTime = at;
    else video.addEventListener('loadedmetadata', () => { video.currentTime = at; }, { once: true });
    video.play().catch(() => {});
  };
  steps.forEach((step, i) => step.addEventListener('click', () => seek(times[i])));
  video.addEventListener('timeupdate', () => {
    const current = times.findLastIndex((at) => video.currentTime >= at);
    steps.forEach((step, i) => (i === current ? step.setAttribute('aria-current', 'step') : step.removeAttribute('aria-current')));
  });
  // One video at a time on pages with several.
  video.addEventListener('play', () => {
    for (const other of document.querySelectorAll('[data-tutorial] video')) if (other !== video) other.pause();
  });
}
