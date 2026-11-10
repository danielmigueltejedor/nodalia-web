// Visor de capturas: al pulsar una captura se abre sobre la página, sin salir de ella, con botones
// para pasar a la anterior o la siguiente y para cerrar. Sirve para cualquier `.gallery` de la web.
// Sin JavaScript, o sin <dialog>, el enlace sigue abriendo la imagen como antes.
import { t } from './i18n.js';

/** Índice tras avanzar `delta` posiciones, dando la vuelta en los extremos. */
export const step = (index, delta, total) => (total > 0 ? (((index + delta) % total) + total) % total : 0);

/** Un clic normal abre el visor; con Ctrl, Cmd, Mayús, Alt o el botón central se respeta el enlace. */
export const opensViewer = (event) => event.button === 0 && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey;

const ICONS = {
  close: 'M6 6l12 12M18 6 6 18',
  previous: 'M14.5 6l-6 6 6 6',
  next: 'M9.5 6l6 6-6 6',
};

function iconButton(doc, name, label) {
  const NS = 'http://www.w3.org/2000/svg';
  const button = doc.createElement('button');
  button.type = 'button';
  button.className = `lightbox-button lightbox-${name}`;
  button.setAttribute('aria-label', label);
  button.title = label;
  const svg = doc.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  const path = doc.createElementNS(NS, 'path');
  path.setAttribute('d', ICONS[name]);
  svg.append(path);
  button.append(svg);
  return button;
}

export function setupGallery(doc = document) {
  const links = [...doc.querySelectorAll('.gallery a')].filter((link) => link.querySelector('img'));
  if (!links.length || typeof doc.createElement('dialog').showModal !== 'function') return null;
  const items = links.map((link) => ({ src: link.href, alt: link.querySelector('img').alt }));

  const dialog = doc.createElement('dialog');
  dialog.className = 'lightbox';
  dialog.setAttribute('aria-label', t('Visor de capturas'));
  const figure = doc.createElement('figure');
  const image = doc.createElement('img');
  image.decoding = 'async';
  const caption = doc.createElement('figcaption');
  const text = doc.createElement('span');
  const count = doc.createElement('span');
  count.className = 'lightbox-count';
  caption.append(text, count);
  figure.append(image, caption);
  const close = iconButton(doc, 'close', t('Cerrar'));
  const previous = iconButton(doc, 'previous', t('Imagen anterior'));
  const next = iconButton(doc, 'next', t('Imagen siguiente'));
  dialog.append(figure, previous, next, close);
  doc.body.append(dialog);
  if (items.length < 2) { previous.hidden = true; next.hidden = true; count.hidden = true; }

  let current = 0;
  let opener = null;
  const show = (index) => {
    current = step(index, 0, items.length);
    const item = items[current];
    image.src = item.src;
    image.alt = item.alt;
    text.textContent = item.alt;
    count.textContent = t('{n} de {total}', { n: String(current + 1), total: String(items.length) });
    // La siguiente se pide ya, para que pasar de imagen no espere a la red.
    if (items.length > 1) new Image().src = items[step(current, 1, items.length)].src;
  };
  const move = (delta) => show(step(current, delta, items.length));

  links.forEach((link, index) => {
    link.setAttribute('aria-haspopup', 'dialog');
    link.addEventListener('click', (event) => {
      if (!opensViewer(event)) return;
      event.preventDefault();
      opener = link;
      show(index);
      doc.documentElement.classList.add('lightbox-open');
      dialog.showModal();
      close.focus();
    });
  });
  close.addEventListener('click', () => dialog.close());
  previous.addEventListener('click', () => move(-1));
  next.addEventListener('click', () => move(1));
  // Pulsar fuera de la imagen (el fondo es el propio <dialog>) cierra el visor.
  dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener('keydown', (event) => {
    if (items.length < 2) return;
    if (event.key === 'ArrowLeft') { event.preventDefault(); move(-1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); move(1); }
  });
  // Deslizar con el dedo pasa de imagen.
  let startX = null;
  dialog.addEventListener('pointerdown', (event) => { startX = event.pointerType === 'touch' ? event.clientX : null; });
  dialog.addEventListener('pointerup', (event) => {
    if (startX === null || items.length < 2) return;
    const distance = event.clientX - startX;
    startX = null;
    if (Math.abs(distance) > 48) move(distance < 0 ? 1 : -1);
  });
  dialog.addEventListener('close', () => {
    doc.documentElement.classList.remove('lightbox-open');
    image.removeAttribute('src');
    opener?.focus();
    opener = null;
  });
  return { dialog, show, move, items };
}

if (typeof document !== 'undefined' && typeof document.querySelectorAll === 'function') setupGallery();
