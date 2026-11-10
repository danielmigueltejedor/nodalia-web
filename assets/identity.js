// Firmas visuales de cada producto. El marcado ya es legible sin este módulo; aquí solo se añade movimiento e interacción.
const reduceMotion = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const number = (value) => value.toFixed(2).replace('.', ',').replace('-', '−');

// Flujo potencial incompresible alrededor de un cilindro de radio 1 con U∞ = 1.
export function velocity(x, y) {
  const r2 = x * x + y * y;
  const r4 = r2 * r2;
  return [1 - (x * x - y * y) / r4, (-2 * x * y) / r4];
}

export function probe(x, y) {
  if (x * x + y * y < 1) return null;
  const [u, v] = velocity(x, y);
  const speed = Math.hypot(u, v);
  return { x: x / 2, y: y / 2, speed, cp: 1 - speed * speed };
}

const STOPS = [[0, 34, 62, 128], [1, 61, 155, 255], [1.5, 150, 214, 255], [2, 255, 255, 255]];
export function speedColor(speed) {
  const value = Math.min(2, Math.max(0, speed));
  let i = 1;
  while (i < STOPS.length - 1 && value > STOPS[i][0]) i += 1;
  const [a, b] = [STOPS[i - 1], STOPS[i]];
  const t = (value - a[0]) / (b[0] - a[0]);
  return `rgb(${[1, 2, 3].map((k) => Math.round(a[k] + (b[k] - a[k]) * t)).join(',')})`;
}

function setupFlow(element) {
  const { w, h, cx, cy, s } = JSON.parse(element.dataset.flow);
  const stage = element.querySelector('.flow-stage');
  const marker = element.querySelector('.flow-probe');
  const out = Object.fromEntries([...element.querySelectorAll('[data-probe]')].map((node) => [node.dataset.probe, node]));

  const showProbe = (px, py) => {
    const result = probe((px - cx) / s, (cy - py) / s);
    marker.style.left = `${(px / w) * 100}%`;
    marker.style.top = `${(py / h) * 100}%`;
    marker.classList.toggle('solid', !result);
    if (!result) {
      for (const key of ['x', 'y', 'u', 'cp']) out[key].textContent = '—';
      return;
    }
    out.x.textContent = number(result.x);
    out.y.textContent = number(result.y);
    out.u.textContent = number(result.speed);
    out.cp.textContent = number(result.cp);
  };
  showProbe(cx, cy - s * 1.15);
  stage.addEventListener('pointermove', (event) => {
    const box = stage.getBoundingClientRect();
    showProbe(((event.clientX - box.left) / box.width) * w, ((event.clientY - box.top) / box.height) * h);
  });

  if (reduceMotion) return;
  const canvas = element.querySelector('canvas');
  const context = canvas.getContext('2d');
  const left = -cx / s;
  const right = (w - cx) / s;
  const half = cy / s;
  const seed = (particle, anywhere) => {
    particle.x = anywhere ? left + Math.random() * (right - left) : left;
    particle.y = (Math.random() * 2 - 1) * half;
    if (particle.x * particle.x + particle.y * particle.y < 1.1) particle.x = left;
    return particle;
  };
  const particles = Array.from({ length: 110 }, () => seed({}, true));
  let scale = 1;
  const resize = () => {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(stage.clientWidth * ratio);
    canvas.height = Math.round(stage.clientHeight * ratio);
    scale = canvas.width / w;
  };
  resize();
  new ResizeObserver(resize).observe(stage);

  let visible = false;
  let frame = 0;
  let last = 0;
  const tick = (now) => {
    frame = 0;
    if (!visible || document.hidden) return;
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016) * 0.9;
    last = now;
    context.setTransform(scale, 0, 0, scale, 0, 0);
    context.globalCompositeOperation = 'destination-out';
    context.fillStyle = 'rgba(0,0,0,.07)';
    context.fillRect(0, 0, w, h);
    context.globalCompositeOperation = 'source-over';
    context.lineWidth = 1.4;
    context.lineCap = 'round';
    for (const particle of particles) {
      const { x, y } = particle;
      // Punto medio (RK2): suficiente para que los trazadores sigan las líneas de corriente.
      const [u1, v1] = velocity(x, y);
      const [u, v] = velocity(x + u1 * dt * 0.5, y + v1 * dt * 0.5);
      particle.x = x + u * dt;
      particle.y = y + v * dt;
      if (particle.x > right || particle.x * particle.x + particle.y * particle.y < 1.02) { seed(particle, false); continue; }
      context.strokeStyle = speedColor(Math.hypot(u, v));
      context.beginPath();
      context.moveTo(cx + x * s, cy - y * s);
      context.lineTo(cx + particle.x * s, cy - particle.y * s);
      context.stroke();
    }
    frame = requestAnimationFrame(tick);
  };
  const start = () => { if (!frame) { last = performance.now(); frame = requestAnimationFrame(tick); } };
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) start(); }).observe(stage);
  document.addEventListener('visibilitychange', () => { if (!document.hidden && visible) start(); });
}

// Lienzo: la selección muestra las dimensiones reales de la captura.
function setupSelection(element) {
  const image = element.querySelector('img');
  const label = element.querySelector('.sel-size');
  if (!image || !label) return;
  const write = () => { if (image.naturalWidth) label.textContent = `${image.naturalWidth} × ${image.naturalHeight} px`; };
  if (image.complete) write(); else image.addEventListener('load', write, { once: true });
}

if (typeof document !== 'undefined') {
  for (const element of document.querySelectorAll('[data-identity="flow"]')) setupFlow(element);
  for (const element of document.querySelectorAll('[data-identity="select"]')) setupSelection(element);
}
