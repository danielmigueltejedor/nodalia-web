// Animaciones de scroll de Nodalia. Sin dependencias; el contenido es visible sin JavaScript.
const root = document.documentElement;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export function staggerIndex(element) {
  const siblings = [...element.parentElement.children].filter((item) => item.hasAttribute('data-reveal'));
  return Math.min(siblings.indexOf(element), 5);
}

function setupReveal() {
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const element = entry.target;
      observer.unobserve(element);
      const index = Number(element.style.getPropertyValue('--i')) || 0;
      element.classList.add('in');
      // Al terminar se retiran los estilos de entrada para no interferir con hover y parallax.
      setTimeout(() => {
        element.removeAttribute('data-reveal');
        element.classList.remove('in');
        element.style.removeProperty('--i');
      }, 800 + index * 70);
    }
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.1 });
  for (const element of document.querySelectorAll('[data-reveal]')) {
    element.style.setProperty('--i', staggerIndex(element));
    observer.observe(element);
  }
}

function setupScrollEffects() {
  const bar = document.querySelector('.scroll-progress');
  const topbar = document.querySelector('.topbar');
  const layers = [...document.querySelectorAll('[data-parallax]')];
  let queued = false;
  const update = () => {
    queued = false;
    const viewport = window.innerHeight;
    const scrollable = root.scrollHeight - viewport;
    if (bar) bar.style.transform = `scaleX(${scrollable > 0 ? clamp(window.scrollY / scrollable, 0, 1) : 0})`;
    if (topbar) topbar.classList.toggle('scrolled', window.scrollY > 12);
    for (const layer of layers) {
      const rect = layer.getBoundingClientRect();
      if (rect.bottom < -200 || rect.top > viewport + 200) continue;
      const offset = (rect.top + rect.height / 2 - viewport / 2) / viewport;
      layer.style.setProperty('--py', clamp(offset, -1, 1).toFixed(3));
    }
  };
  const request = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(update);
  };
  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', request, { passive: true });
  update();
}

function setupSectionSpy() {
  const links = [...document.querySelectorAll('.subnav nav a[href^="#"]')];
  if (!links.length) return;
  const byId = new Map(links.map((link) => [link.getAttribute('href').slice(1), link]));
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      for (const link of links) link.classList.toggle('active', link === byId.get(entry.target.id));
    }
  }, { rootMargin: '-35% 0px -60% 0px' });
  for (const id of byId.keys()) {
    const section = document.getElementById(id);
    if (section) observer.observe(section);
  }
}

// Escaparate de la portada: una captura real por producto, con pestañas que avanzan solas
// mientras está a la vista. Se detiene al pasar el ratón o al enfocar una pestaña.
function setupShowcase(autoplay) {
  for (const stage of document.querySelectorAll('[data-showcase]')) {
    const tabs = [...stage.querySelectorAll('.showcase-tab')];
    const slides = [...stage.querySelectorAll('figure[data-slide]')];
    if (tabs.length < 2) continue;
    const DURATION = 5200;
    let current = 0, started = performance.now(), paused = false, visible = false, frame = 0;
    const show = (index) => {
      current = (index + slides.length) % slides.length;
      started = performance.now();
      tabs.forEach((tab, i) => { tab.setAttribute('aria-selected', String(i === current)); tab.style.setProperty('--p', '0'); });
      slides.forEach((slide, i) => {
        slide.classList.toggle('is-active', i === current);
        slide.toggleAttribute('aria-hidden', i !== current);
        const image = slide.querySelector('img');
        if (i === current && image?.loading === 'lazy') image.loading = 'eager';
      });
    };
    const tick = (now) => {
      frame = 0;
      if (!visible || !autoplay) return;
      if (paused) started = now - (Number(tabs[current].style.getPropertyValue('--p')) || 0) * DURATION;
      const progress = clamp((now - started) / DURATION, 0, 1);
      tabs[current].style.setProperty('--p', progress.toFixed(4));
      if (progress >= 1) show(current + 1);
      frame = requestAnimationFrame(tick);
    };
    tabs.forEach((tab, i) => {
      tab.addEventListener('click', () => show(i));
      tab.addEventListener('keydown', (event) => {
        const step = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
        if (!step) return;
        event.preventDefault();
        show(current + step);
        tabs[current].focus();
      });
    });
    stage.addEventListener('pointerenter', () => { paused = true; });
    stage.addEventListener('pointerleave', () => { paused = false; });
    stage.addEventListener('focusin', () => { paused = true; });
    stage.addEventListener('focusout', () => { paused = false; });
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !frame) { started = performance.now() - (Number(tabs[current].style.getPropertyValue('--p')) || 0) * DURATION; frame = requestAnimationFrame(tick); }
    }, { threshold: 0.25 }).observe(stage);
  }
}

// Cifras que cuentan hasta su valor al aparecer (el número final ya está en el HTML).
function setupCount() {
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      observer.unobserve(entry.target);
      const element = entry.target, target = Number(element.dataset.count) || 0, start = performance.now();
      const step = (now) => {
        const t = clamp((now - start) / 1400, 0, 1);
        element.textContent = String(Math.round(target * (1 - (1 - t) ** 3)));
        if (t < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }
  }, { threshold: 0.6 });
  for (const element of document.querySelectorAll('[data-count]')) observer.observe(element);
}

// Posición de un elemento respecto a la ventana: 0 cuando su borde superior entra por abajo,
// 1 cuando ha recorrido `span` alturas de ventana.
export function enterProgress(top, viewport, span = 0.75) {
  return clamp((viewport - top) / (viewport * span), 0, 1);
}

// Efectos ligados al scroll que no caben en un IntersectionObserver.
function setupScrollLinked() {
  const tilts = [...document.querySelectorAll('[data-tilt]')];
  const focus = [...document.querySelectorAll('[data-focus]')];
  const stacks = [...document.querySelectorAll('[data-stack]')].map((stack) => [...stack.querySelectorAll('[data-stack-card]')]);
  const stackable = window.matchMedia('(min-width: 861px)');
  let queued = false;
  const update = () => {
    queued = false;
    const viewport = window.innerHeight;
    for (const element of tilts) {
      const rect = element.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > viewport) continue;
      element.style.setProperty('--tilt', (1 - enterProgress(rect.top, viewport, 0.85)).toFixed(3));
    }
    for (const element of focus) {
      const rect = element.getBoundingClientRect();
      const distance = Math.abs(rect.top + rect.height / 2 - viewport * 0.5) / (viewport * 0.5);
      element.style.setProperty('--focus', (1 - clamp(distance - 0.15, 0, 1)).toFixed(3));
    }
    for (const cards of stacks) {
      cards.forEach((card, i) => {
        const next = cards[i + 1];
        if (!next || !stackable.matches) { card.style.removeProperty('--under'); return; }
        // Cuánto ha subido la tarjeta siguiente sobre esta: 0 al empezar, 1 al cubrirla.
        const top = card.getBoundingClientRect().top;
        const covered = clamp(1 - (next.getBoundingClientRect().top - top) / card.offsetHeight, 0, 1);
        card.style.setProperty('--under', covered.toFixed(3));
      });
    }
  };
  const request = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(update);
  };
  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', request, { passive: true });
  update();
}

if (typeof window !== 'undefined' && root.classList.contains('js')) {
  window.__nodaliaMotion = true;
  setupReveal();
  setupScrollEffects();
  setupSectionSpy();
  setupCount();
  setupScrollLinked();
}

// Idiomas: recuerda el elegido en el selector y lo transmite a los demás sitios de Nodalia,
// que al estar en otro subdominio no comparten almacenamiento.
export function setupLanguage(doc = document, storage = localStorage, here = location) {
  const KEY = 'nodalia-lang';
  const menu = doc.querySelector('.lang');
  if (!menu) return;
  for (const link of menu.querySelectorAll('a[data-lang]')) {
    link.addEventListener('click', () => { try { storage.setItem(KEY, link.dataset.lang); } catch { /* sin almacenamiento */ } });
  }
  doc.addEventListener('click', (event) => { if (menu.open && !menu.contains(event.target)) menu.open = false; });
  doc.addEventListener('keydown', (event) => { if (event.key === 'Escape') menu.open = false; });
  let chosen = null;
  try { chosen = storage.getItem(KEY); } catch { /* sin almacenamiento */ }
  if (!chosen || chosen !== doc.documentElement.lang) return;
  for (const link of doc.querySelectorAll('a[href^="https://"]')) {
    if (link.closest('.lang')) continue;
    const url = new URL(link.href);
    if (url.origin === here.origin || !/(^|\.)getnodalia\.com$/.test(url.hostname)) continue;
    url.searchParams.set('hl', chosen);
    link.href = url.href;
  }
}

if (typeof window !== 'undefined') {
  setupLanguage();
  setupShowcase(!window.matchMedia('(prefers-reduced-motion: reduce)').matches);
}
