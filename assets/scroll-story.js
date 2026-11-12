const clamp = (value) => Math.min(1, Math.max(0, value));

export function scrollProgress(sectionTop, travel, stickyTop) {
  return travel > 0 ? clamp((stickyTop - sectionTop) / travel) : 0;
}

function easeBetween(progress, from, to) {
  const t = clamp((progress - from) / (to - from));
  return t * t * (3 - 2 * t);
}

export function storyFrame(progress) {
  return {
    chapter: Math.min(3, Math.floor(clamp(progress) * 3) + 1),
    progress: clamp(progress),
    first: easeBetween(progress, 0, .30),
    second: easeBetween(progress, .23, .62),
    third: easeBetween(progress, .57, .96),
  };
}

export function setupScrollStories(doc = document, win = window) {
  const stories = [...doc.querySelectorAll('[data-scroll-story]')].map((section) => ({
    section,
    pin: section.querySelector('[data-story-pin]'),
    lastProgress: -1,
  }));
  if (!stories.length) return;

  const eligible = win.matchMedia('(min-width: 320px) and (min-height: 620px) and (prefers-reduced-motion: no-preference)');
  let pending = false;
  const render = () => {
    pending = false;
    if (!eligible.matches) return;

    // Read layout before applying the variables used for compositing.
    const frames = stories.map(({ section, pin }) => {
      const { height, top } = section.getBoundingClientRect();
      const inset = Number.parseFloat(win.getComputedStyle(pin).top) || 0;
      return Math.round(scrollProgress(top, height - pin.offsetHeight, inset) * 1000) / 1000;
    });
    for (const [i, story] of stories.entries()) {
      if (story.lastProgress === frames[i]) continue;
      story.lastProgress = frames[i];
      const { chapter, progress, first, second, third } = storyFrame(frames[i]);
      const { section } = story;
      if (section.dataset.chapter !== String(chapter)) section.dataset.chapter = String(chapter);
      section.style.setProperty('--story-progress', progress);
      section.style.setProperty('--story-a', first);
      section.style.setProperty('--story-b', second);
      section.style.setProperty('--story-c', third);
    }
  };
  const queue = () => {
    if (pending || !eligible.matches) return;
    pending = true;
    win.requestAnimationFrame(render);
  };
  const sync = () => {
    for (const story of stories) {
      story.section.classList.toggle('story-active', eligible.matches);
      story.lastProgress = -1;
      if (!eligible.matches) {
        delete story.section.dataset.chapter;
        for (const name of ['--story-progress', '--story-a', '--story-b', '--story-c']) {
          story.section.style.removeProperty(name);
        }
      }
    }
    queue();
  };
  win.addEventListener('scroll', queue, { passive: true });
  win.addEventListener('resize', queue, { passive: true });
  win.addEventListener('pageshow', queue);
  eligible.addEventListener('change', sync);
  if (typeof win.ResizeObserver === 'function') {
    const observer = new win.ResizeObserver(queue);
    for (const { pin } of stories) observer.observe(pin);
  }
  sync();
}

if (typeof document !== 'undefined') setupScrollStories();
