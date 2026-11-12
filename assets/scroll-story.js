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

export function storyCut(progress, scene) {
  // Allow the viewer to see the mesh, colour proof, or player before the reveal.
  const range = { vortia: [.76, .95], lienzo: [.72, .90], vinilo: [.68, .86] }[scene];
  return range ? easeBetween(progress, ...range) : easeBetween(progress, .57, .96);
}

// Illustrative stream tube. Vortia's actual result is the capture revealed at the end.
export function nozzleHalfHeight(x) {
  const narrowing = easeBetween(x, .17, .54);
  const expansion = easeBetween(x, .54, .97);
  return 88 - 56 * narrowing + 44 * expansion;
}

const PAPER_BLUE = '#85abd5';

function trace(ctx, point, end, color, weight = 1) {
  if (end <= 0) return;
  ctx.beginPath();
  const steps = Math.max(1, Math.ceil(end * 88));
  for (let i = 0; i <= steps; i += 1) {
    const [x, y] = point(i / steps * end);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = weight;
  ctx.stroke();
}

function drawNozzle(ctx, { progress, first, second, third }) {
  const map = (x, row) => [62 + x * 596, 214 + row * nozzleHalfHeight(x)];
  ctx.lineCap = 'round';
  ctx.setLineDash([5, 6]);
  trace(ctx, (x) => map(x, 0), 1, '#7894af75');
  trace(ctx, (t) => [384, 73 + t * 282], 1, '#7894af55');
  ctx.setLineDash([]);

  for (const wall of [-1, 1]) {
    trace(ctx, (x) => map(x, wall), .08 + .92 * first, '#d2e5f5', 2);
    const [x, y] = map(.08 + .92 * first, wall);
    ctx.fillStyle = '#e3eff8';
    ctx.fillRect(x - 2, y - 2, 4, 4);
  }

  for (let row = -5; row <= 5; row += 1) {
    trace(ctx, (x) => map(x, row / 6), second, '#8bb7d66e');
  }
  for (let i = 0; i <= 31; i += 1) {
    const x = i / 31;
    const revealed = clamp((second - x) * 10);
    trace(ctx, (t) => map(x, t * 2 - 1), revealed, '#8bb7d678');
  }

  const flow = easeBetween(progress, .57, .82);
  ctx.globalAlpha = flow * (1 - third * .4);
  for (let row = -3; row <= 3; row += 1) {
    for (let i = 0; i < 5; i += 1) {
      // Concentrate the tracers visually at the throat, with a fixed phase for reverse scroll.
      const phase = (i / 5 + flow * .84 + row * .021 + 1) % 1;
      const position = phase + Math.sin(phase * Math.PI * 2) * .078;
      const begin = Math.max(0, position - .04);
      const color = Math.abs(position - .54) < .17 ? '#f4d491' : '#83e1da';
      trace(ctx, (t) => map(begin + (position - begin) * t, row / 4.1), 1, color, 2.8);
    }
  }
  ctx.globalAlpha = 1;
  ctx.font = '15px monospace';
  ctx.fillStyle = PAPER_BLUE;
  ctx.fillText('x', 666, 218);
  ctx.fillText('r', 390, 87);
  ctx.fillText('0', 48, 218);
}

function drawCurve(ctx, { second }) {
  const curve = (t) => [
    23 + t * 194,
    178 - t * 154 + Math.sin(t * Math.PI * 2) * second * 17,
  ];
  ctx.strokeStyle = '#c2a28869';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i += 1) {
    trace(ctx, (t) => [23 + i * 48.5, 24 + t * 154], 1, '#c2a28869');
    trace(ctx, (t) => [23 + t * 194, 24 + i * 38.5], 1, '#c2a28869');
  }
  trace(ctx, (t) => [23 + t * 194, 178 - t * 154], 1, '#cab9a1a0');
  trace(ctx, curve, 1, '#f1c295', 2);
  for (const stop of [0, .28, .65, 1]) {
    const [x, y] = curve(stop);
    ctx.fillStyle = '#fff1d8';
    ctx.fillRect(x - 2.5, y - 2.5, 5, 5);
  }
}

function paint(canvas, frame, ratio) {
  const ctx = canvas.getContext('2d');
  if (!ctx || !canvas.clientWidth || !canvas.clientHeight) return;
  const width = Math.round(canvas.clientWidth * ratio);
  const height = Math.round(canvas.clientHeight * ratio);
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  const nozzle = canvas.dataset.storyCanvas === 'nozzle';
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, width, height);
  const scale = Math.min(width / (nozzle ? 720 : 240), height / (nozzle ? 430 : 202));
  ctx.setTransform(scale, 0, 0, scale,
    (width - scale * (nozzle ? 720 : 240)) / 2,
    (height - scale * (nozzle ? 430 : 202)) / 2);
  if (nozzle) drawNozzle(ctx, frame);
  else drawCurve(ctx, frame);
}

export function setupScrollStories(doc = document, win = window) {
  const stories = [...doc.querySelectorAll('[data-scroll-story]')].map((section) => ({
    section,
    pin: section.querySelector('[data-story-pin]'),
    canvases: [...section.querySelectorAll('[data-story-canvas]')],
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
      const frame = storyFrame(frames[i]);
      const { chapter, progress, first, second, third } = frame;
      const { section } = story;
      if (section.dataset.chapter !== String(chapter)) section.dataset.chapter = String(chapter);
      section.style.setProperty('--story-progress', progress);
      section.style.setProperty('--story-a', first);
      section.style.setProperty('--story-b', second);
      section.style.setProperty('--story-c', third);
      section.style.setProperty('--story-cut', storyCut(progress, section.dataset.scrollStory));
      section.style.setProperty('--story-open', easeBetween(progress, .27, .49));
      for (const canvas of story.canvases) paint(canvas, frame, Math.min(win.devicePixelRatio || 1, 2));
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
        for (const name of ['--story-progress', '--story-a', '--story-b', '--story-c', '--story-cut', '--story-open']) {
          story.section.style.removeProperty(name);
        }
      }
    }
    queue();
  };
  win.addEventListener('scroll', queue, { passive: true });
  const resize = () => {
    for (const story of stories) story.lastProgress = -1;
    queue();
  };
  win.addEventListener('resize', resize, { passive: true });
  win.addEventListener('pageshow', queue);
  eligible.addEventListener('change', sync);
  if (typeof win.ResizeObserver === 'function') {
    const observer = new win.ResizeObserver(resize);
    for (const { pin } of stories) observer.observe(pin);
  }
  sync();
}

if (typeof document !== 'undefined') setupScrollStories();
