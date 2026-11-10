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

if (typeof window !== 'undefined' && root.classList.contains('js')) {
  window.__nodaliaMotion = true;
  setupReveal();
  setupScrollEffects();
  setupSectionSpy();
}
