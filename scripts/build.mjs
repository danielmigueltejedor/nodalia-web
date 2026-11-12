import { mkdir, rm, writeFile, copyFile, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { apps, brand, site, repoUrl } from './data.mjs';
import { DEFAULT_LOCALE, locales, localeCodes, localePath, localize, dictionaries, clientKeys } from './i18n.mjs';
import { loadReleases } from './releases.mjs';
import { choose, detail, kind, megabytes, releasesUrl } from '../assets/app-download.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const target = process.argv[2];
const sites = ['portal', ...apps.map((app) => app.id)];
if (target && !sites.includes(target)) {
  console.error(`Sitio no válido: ${target}. Opciones: ${sites.join(', ')}`);
  process.exit(1);
}
const selected = target ? [target] : sites;

// Unique CSS URL per release prevents cached styles from breaking newer HTML layouts.
const cssSource = await readFile(path.join(root, 'assets', 'styles.css'));
const cssHash = createHash('sha256').update(cssSource).digest('hex').slice(0, 12);
const cssFileName = `styles.${cssHash}.css`;
// Los SVG de marca y motion.js mantienen su nombre; el parámetro de versión evita que la caché sirva una versión anterior.
const assetVersion = async (name) => createHash('sha256').update(await readFile(path.join(root, 'assets', name))).digest('hex').slice(0, 10);
const wordmarkSrc = `/nodalia-wordmark.svg?v=${await assetVersion('nodalia-wordmark.svg')}`;
const faviconSrc = `/favicon.svg?v=${await assetVersion('favicon.svg')}`;
const i18nSrc = `/i18n.js?v=${await assetVersion('i18n.js')}`;
// Idioma de la página que se está generando. La plantilla se escribe en español; localize() traduce el resultado.
let locale = DEFAULT_LOCALE;
// Traducciones que necesitan los scripts del navegador de la página en curso (null en español).
let clientStrings = null;
const missing = {};
const motionSrc = `/motion.js?v=${await assetVersion('motion.js')}`;
const appDownloadSrc = `/app-download.js?v=${await assetVersion('app-download.js')}`;
// Las versiones publicadas en GitHub en el momento de generar: la página ya sale con ellas.
const releaseRepos = [...new Set([...site.releases.map(([, repo]) => repo), ...apps.map((app) => app.repoName), ...site.upcoming.apps.map(([, , , repo]) => repo).filter(Boolean)])];
const { releases, live } = await loadReleases(releaseRepos);
console.log(`· versiones: ${releaseRepos.map((repo) => `${repo} ${releases[repo]?.tag_name || '—'}${live.includes(repo) ? '' : ' (guardada)'}`).join(', ')}`);

const e = (s) => String(s ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
const safeUrl = (s) => {
  const u = new URL(s);
  if (!['https:', 'mailto:'].includes(u.protocol)) throw new Error(`URL no permitida: ${s}`);
  return e(u.href);
};
const svg = (body, cls = 'i') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${body}</svg>`;
const icon = {
  arrow: svg('<path d="M7 17 17 7M8 7h9v9"/>'),
  down: svg('<path d="M12 4v13M6 12l6 6 6-6M5 21h14"/>'),
  chevron: svg('<path d="m9 6 6 6-6 6"/>'),
  code: svg('<path d="m8 8-4 4 4 4M16 8l4 4-4 4M13.5 5l-3 14"/>'),
  desktop: svg('<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>'),
  check: svg('<path d="M12 3 4.5 6v5.5c0 4.5 3.1 8.3 7.5 9.5 4.4-1.2 7.5-5 7.5-9.5V6z"/><path d="m9 12 2.2 2.2L15.2 10"/>'),
  alert: svg('<path d="M12 4 2.8 19.5h18.4zM12 10v4.5M12 17.2v.1"/>'),
  tick: svg('<path d="m5 12.5 4.5 4.5L19 7.5"/>'),
  instagram: svg('<rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17" cy="7" r=".6"/>'),
  x: '<svg class="i i-fill" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>',
  mail: svg('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/>'),
  github: '<svg class="i i-fill" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z"/></svg>',
};
const A = (url, text, className = '', external = false) => `<a href="${safeUrl(url)}" class="${e(className)}"${external ? ' target="_blank" rel="noopener noreferrer"' : ''}>${text}</a>`;
const iconImg = (app, cls = 'app-icon', size = 80) => `<img class="${e(cls)}" src="${safeUrl(app.icon)}" alt="Icono de ${e(app.name)}" width="${size}" height="${size}" loading="lazy" decoding="async" />`;
const chips = (app) => `<ul class="chips" aria-label="Tecnología">${app.technology.split(' · ').map((t) => `<li class="chip">${e(t)}</li>`).join('')}</ul>`;
const jsonLd = (data) => `<script type="application/ld+json">${JSON.stringify(data).replaceAll('<', '\\u003c')}</script>`;
// Iconos de las apps en camino: se sirven desde la portada porque no todas tienen repositorio.
const upcomingIcons = site.upcoming.apps.map(([, key]) => `${key}.png`);
const fontFiles = ['sora-latin-wght.woff2', 'inter-latin-wght.woff2'];
// Activa las animaciones solo con JavaScript y sin reduced-motion; si motion.js no carga, el contenido vuelve a mostrarse.
const motionBoot = `<script>(function(d){if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;d.classList.add('js');setTimeout(function(){if(!window.__nodaliaMotion)d.classList.remove('js')},2500)})(document.documentElement)</script>`;
const identitySrc = `/identity.js?v=${await assetVersion('identity.js')}`;
const gallerySrc = `/gallery.js?v=${await assetVersion('gallery.js')}`;

// Firmas visuales: un elemento propio por producto en la cabecera. Todas son legibles sin JavaScript.
// Vortia: flujo potencial alrededor de un cilindro. Las líneas de corriente se calculan aquí; identity.js añade trazadores y sonda.
const FLOW = { w: 600, h: 420, cx: 270, cy: 210, s: 70 };
function flowStreamlines() {
  const { w, cx, cy, s } = FLOW;
  const levels = [0.22, 0.55, 0.95, 1.4, 1.85, 2.3, 2.75];
  const yFor = (x, psi) => {
    let lo = Math.abs(x) < 1 ? Math.sqrt(1 - x * x) : 0;
    let hi = psi + 2;
    for (let i = 0; i < 40; i += 1) {
      const y = (lo + hi) / 2;
      if (y * (1 - 1 / (x * x + y * y)) < psi) lo = y; else hi = y;
    }
    return (lo + hi) / 2;
  };
  const paths = [];
  for (const psi of levels) for (const sign of [1, -1]) {
    let d = '';
    for (let px = -10; px <= w + 10; px += 10) {
      const y = yFor((px - cx) / s, psi);
      d += `${d ? 'L' : 'M'}${px} ${(cy - sign * y * s).toFixed(1)}`;
    }
    paths.push(`<path d="${d}"/>`);
  }
  paths.push(`<path d="M-10 ${cy}H${cx - s}M${cx + s} ${cy}H${w + 10}"/>`);
  return paths.join('');
}
const signatureFlow = () => `<div class="sig sig-flow" data-identity="flow" data-flow="${e(JSON.stringify(FLOW))}">
  <div class="flow-stage"><svg viewBox="0 0 ${FLOW.w} ${FLOW.h}" role="img" aria-label="Líneas de corriente del flujo potencial alrededor de un cilindro"><g class="flow-lines">${flowStreamlines()}</g><circle class="flow-body" cx="${FLOW.cx}" cy="${FLOW.cy}" r="${FLOW.s}"/><path class="flow-axis" d="M${FLOW.cx - 9} ${FLOW.cy}h18M${FLOW.cx} ${FLOW.cy - 9}v18"/></svg><canvas aria-hidden="true"></canvas><span class="flow-probe" aria-hidden="true"></span></div>
  <div class="flow-hud"><dl class="flow-read"><div><dt>x/D</dt><dd data-probe="x">0,00</dd></div><div><dt>y/D</dt><dd data-probe="y">0,57</dd></div><div><dt>|U|/U∞</dt><dd data-probe="u">1,76</dd></div><div><dt>Cp</dt><dd data-probe="cp">−2,08</dd></div></dl><div class="flow-legend" aria-hidden="true"><span>0</span><i></i><span>2</span><b>|U|/U∞</b></div></div>
  <p class="sig-note">Flujo potencial alrededor de un cilindro, solución analítica. Mueve el cursor para sondear. Es una ilustración, no un resultado de Vortia.</p></div>`;
const signatureBoot = (app) => {
  const lines = [...app.specs.slice(0, 2).map(([k, v]) => [k, v]), ...app.components.map(([name]) => [name, ''])];
  return `<div class="sig sig-boot"><div class="boot-bar" aria-hidden="true"><span>tty1</span><span>nodalix</span></div><ol class="boot-log" aria-label="Componentes de Nodalix OS">${lines.map(([a, b], i) => `<li style="--n:${i}"><span class="boot-ok" aria-hidden="true">[  OK  ]</span><span><strong>${e(a)}</strong>${b ? ` ${e(b)}` : ''}</span></li>`).join('')}</ol><p class="boot-login" style="--n:${lines.length + 1}" aria-hidden="true">nodalix login: <span class="caret"></span></p><p class="sig-note">Ilustración con los componentes reales del sistema. Las capturas reales están en la sección Capturas.</p></div>`;
};
const record = `<div class="record" aria-hidden="true"><div class="record-label"><svg viewBox="0 0 100 100"><defs><path id="record-ring" d="M50 50m-37 0a37 37 0 1 1 74 0a37 37 0 1 1-74 0"/></defs><text><textPath href="#record-ring">VINILO · 33⅓ RPM · LADO A · VINILO · 33⅓ RPM · LADO B ·</textPath></text></svg></div></div>`;
const selection = `<span class="ants" aria-hidden="true"></span>${Array.from({ length: 8 }, (_, i) => `<i class="handle handle-${i}" aria-hidden="true"></i>`).join('')}<span class="sel-size" aria-hidden="true"></span>`;
const faqSchema = (items) => ({'@type':'FAQPage',mainEntity:items.map(([q, a]) => ({'@type':'Question',name:q,acceptedAnswer:{'@type':'Answer',text:a}}))});
const faqBlock = (items) => `<section class="section faq-section" id="faq"><div class="container faq-layout">
  <div data-reveal="left"><h2>Preguntas frecuentes</h2><p>¿No encuentras tu duda? Escribe a ${A(`mailto:${brand.email}`, e(brand.email), 'text-link')}</p></div>
  <div class="faq">${items.map(([q, a]) => `<details class="faq-item" data-reveal><summary>${e(q)}<span class="faq-mark" aria-hidden="true"></span></summary><p>${e(a)}</p></details>`).join('')}</div>
</div></section>`;
const table = (head, rows) => `<div class="table-wrap" data-reveal><table class="table"><thead><tr>${head.map((h) => `<th scope="col">${e(h)}</th>`).join('')}</tr></thead><tbody>${rows.map((row) => `<tr>${row.map((cell, i) => (i === 0 ? `<th scope="row">${e(cell)}</th>` : `<td>${e(cell)}</td>`)).join('')}</tr>`).join('')}</tbody></table></div>`;
const specCard = (app) => `<div class="spec-card" data-reveal="left"><div class="spec-card-head">${iconImg(app, 'spec-icon', 60)}<div><strong>${e(app.name)}</strong><span>${e(app.category)}</span></div></div><dl class="spec-list">${app.specs.map(([k, v]) => `<div><dt>${e(k)}</dt><dd>${e(v)}</dd></div>`).join('')}</dl></div>`;
const order = ['nodalix', 'vinilo', 'vortia', 'lienzo'];
const byId = Object.fromEntries(apps.map((app) => [app.id, app]));
const ordered = order.map((id) => byId[id]);

const globe = svg('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.6 2.8 3.9 5.8 3.9 9s-1.3 6.2-3.9 9c-2.6-2.8-3.9-5.8-3.9-9S9.4 5.8 12 3z"/>');
const langSelect = (base) => `<details class="lang"><summary aria-label="Idioma">${globe}<span>${locale.toUpperCase()}</span></summary><ul>${locales.map(({ code, name }) => `<li><a href="${safeUrl(base + localePath(code).slice(1))}" hreflang="${code}" lang="${code}" data-lang="${code}"${code === locale ? ' aria-current="true"' : ''}>${name}</a></li>`).join('')}</ul></details>`;
// Antes de pintar: guarda el idioma elegido (?hl=) y, solo en la portada en español y sin elección previa, lleva al idioma del navegador.
const langBoot = () => `<script>(function(){try{var s=${JSON.stringify(localeCodes)},l=location,q=new URLSearchParams(l.search),h=q.get('hl'),k='nodalia-lang';if(h&&s.indexOf(h)!==-1){localStorage.setItem(k,h);q.delete('hl');var r=q.toString();history.replaceState(null,'',l.pathname+(r?'?'+r:'')+l.hash)}var p=localStorage.getItem(k);if(!p&&!/bot|crawl|spider|slurp|lighthouse|preview/i.test(navigator.userAgent)){(navigator.languages||[navigator.language]).some(function(n){var b=String(n||'').slice(0,2).toLowerCase();if(s.indexOf(b)!==-1){p=b;return true}return false})}if(${JSON.stringify(locale)}==='es'&&p&&p!=='es'&&s.indexOf(p)!==-1&&l.pathname==='/')l.replace('/'+p+'/'+l.search+l.hash)}catch(e){}})()</script>`;
const nav = (active = '', base = brand.portal + '/') => `<header class="topbar"><div class="container topbar-inner">
  ${A(brand.portal, `<img src="${wordmarkSrc}" alt="Nodalia" width="118" height="30"/>`, 'brand')}
  <nav class="nav" aria-label="Navegación principal">
    ${A(`${brand.portal}/#aplicaciones`, 'Productos', active === 'portal' ? '' : 'optional')}
    ${A(byId.nodalix.domain, 'Nodalix OS', 'optional')}
    ${A(`${brand.portal}/#studium`, 'Studium', 'optional')}
    ${A(`${brand.portal}/#ecosistema`, 'Home Assistant', 'optional')}
    ${A(`${brand.portal}/#autor`, 'Autor', 'optional')}
    ${A(brand.github, `${icon.github}GitHub`, 'outline', true)}
  </nav>
  ${langSelect(base)}
</div></header>`;
const footer = () => `<footer class="footer"><div class="container">
  <div class="footer-content">
    <div class="footer-about"><a class="brand" href="${safeUrl(brand.portal)}"><img src="${wordmarkSrc}" alt="Nodalia" width="133" height="34" loading="lazy"/></a>
      <p>Software independiente desarrollado en público: un sistema operativo Linux, aplicaciones de escritorio y componentes para Home Assistant.</p>
      <nav class="social" aria-label="Redes sociales">${[['Instagram', brand.instagram, icon.instagram], ['X', brand.x, icon.x], ['GitHub', brand.github, icon.github]].map(([name, url, glyph]) => `<a href="${safeUrl(url)}" target="_blank" rel="noopener noreferrer me" aria-label="${name}">${glyph}</a>`).join('')}</nav></div>
    <div class="footer-col"><h2>Productos</h2><nav class="footer-links" aria-label="Productos">
      ${ordered.map((app) => A(app.domain, e(app.name))).join('')}
      ${A(`${brand.portal}/#studium`, 'Studium')}
    </nav></div>
    <div class="footer-col"><h2>Home Assistant</h2><nav class="footer-links" aria-label="Home Assistant">
      ${A(repoUrl(site.ecosystem.featured.repo), e(site.ecosystem.featured.name), '', true)}
      ${site.ecosystem.more.slice(0, 2).map(([name, repo]) => A(repoUrl(repo), e(name), '', true)).join('')}
    </nav></div>
    <div class="footer-col"><h2>Proyecto</h2><nav class="footer-links" aria-label="Proyecto">
      ${A(brand.github, 'GitHub', '', true)}
      ${A(`${brand.portal}/#autor`, 'Sobre el autor')}
      ${A(`${brand.portal}/#faq`, 'Preguntas frecuentes')}
      ${A(`mailto:${brand.email}`, 'Contacto')}
    </nav></div>
  </div>
  <div class="footer-meta"><span>© <span>${new Date().getUTCFullYear()}</span> Nodalia · Creado por ${A(site.author.website, e(site.author.name), '', true)}</span><span>Sin cookies ni analítica propia.</span></div>
</div></footer>`;
const shell = ({title, description, canonical, content, accent = '', preview = '', previewAlt = '', active = '', schema = null, scripts = '', identity = false}) => `<!doctype html>
<html lang="${locale}"><head>
<meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta name="theme-color" content="#07080c"/><meta name="color-scheme" content="dark"/>
<title>${e(title)}</title><meta name="description" content="${e(description)}"/>
<link rel="canonical" href="${safeUrl(canonical + localePath(locale).slice(1))}"/>
${locales.map(({ code }) => `<link rel="alternate" hreflang="${code}" href="${safeUrl(canonical + localePath(code).slice(1))}"/>`).join('')}<link rel="alternate" hreflang="x-default" href="${safeUrl(canonical)}"/>
<meta property="og:type" content="website"/><meta property="og:site_name" content="Nodalia"/><meta property="og:locale" content="${locales.find(({ code }) => code === locale).og}"/>
<meta property="og:title" content="${e(title)}"/>
<meta property="og:description" content="${e(description)}"/><meta property="og:url" content="${safeUrl(canonical + localePath(locale).slice(1))}"/>
${preview ? `<meta property="og:image" content="${safeUrl(preview)}"/>${previewAlt ? `<meta property="og:image:alt" content="${e(previewAlt)}"/>` : ''}` : ''}
<meta name="twitter:card" content="${preview ? 'summary_large_image' : 'summary'}"/>
<link rel="icon" href="/favicon.ico" sizes="32x32"/>
<link rel="icon" type="image/svg+xml" href="${faviconSrc}"/>
<link rel="apple-touch-icon" href="/apple-touch-icon.png"/>
<link rel="preconnect" href="https://raw.githubusercontent.com" crossorigin/>
<link rel="preload" href="/fonts/sora-latin-wght.woff2" as="font" type="font/woff2" crossorigin/>
<link rel="preload" href="/fonts/inter-latin-wght.woff2" as="font" type="font/woff2" crossorigin/>
<link rel="stylesheet" href="/${cssFileName}"/>
${langBoot()}${motionBoot}
${clientStrings ? `<script type="application/json" id="i18n">${JSON.stringify(clientStrings).replaceAll('<', '\\u003c')}</script>` : ''}
${schema ? jsonLd({'@context':'https://schema.org','@graph':[].concat(schema)}) : ''}
</head><body class="${e(accent ? `accent-${accent}` : '')}"><a class="visually-hidden" href="#contenido">Saltar al contenido</a>
<div class="scroll-progress" aria-hidden="true"></div>${nav(active, canonical)}<main id="contenido">${content}</main>${footer()}<script type="module" src="${motionSrc}"></script>${identity ? `<script type="module" src="${identitySrc}"></script>` : ''}${scripts}</body></html>`;

async function home() {
  const vinilo = byId.vinilo, lienzo = byId.lienzo, nodalix = byId.nodalix;
  const previewUrl = (app, i = 0) => safeUrl(app.previews[i][0]);
  const headlines = {nodalix:'Tu ordenador. Con otra perspectiva.',vortia:'Ingeniería de fluidos sin cajas negras.',vinilo:'Escucha como tú quieras.',lienzo:'Un espacio para crear.'};
  const card = (app) => {
    const media = app.previews.length
      ? `<div class="product-card-image"><img class="screen" src="${previewUrl(app)}" alt="${e(app.previews[0][1])}" loading="lazy" decoding="async"/></div>`
      : `<div class="product-card-art"><div class="orb"><img src="${safeUrl(app.icon)}" alt="" width="120" height="120" loading="lazy" decoding="async"/></div>${chips(app)}</div>`;
    return `<article class="product-card product-card--${e(app.id)}" data-reveal>
      <div class="product-card-inner"><div class="product-card-top"><div class="product-id">${iconImg(app, 'card-icon', 44)}<div><strong>${e(app.name)}</strong><span>${e(app.category)}</span></div></div><span class="tag ${e(app.statusKind)}">${e(app.statusKind==='active'?'En desarrollo':'Experimental')}</span></div>
      <h3>${e(headlines[app.id])}</h3><p>${e(app.description)}</p></div>
      ${media}
      <div class="product-card-bottom"><span>${e(app.platforms)}</span><span class="view">Conocer ${e(app.name)} ${icon.arrow}</span></div>
      <a class="cover-link" href="${safeUrl(app.domain)}" aria-label="Conocer ${e(app.name)}"></a>
    </article>`;
  };
  const specs = [['Base', 'Arch Linux'], ['Escritorio', 'GNOME · Wayland'], ['Arquitectura', 'x86_64 · BIOS / UEFI'], ['Teléfono', 'Phone Link para iPhone'], ['Instalación', 'ISO verificada con SHA-256']];
  const eco = site.ecosystem, author = site.author;
  const studium = site.studium;
  const cardNames = ['Luz', 'Clima', 'Persiana', 'Cerradura', 'Alarma', 'Multimedia', 'Aspirador', 'Gráfica', 'Flujo de energía', 'Tiempo', 'Calendario', 'Cámara', 'Notificaciones', 'Navegación', 'Resumen de sala', 'Escenas'];
  const values = [
    [icon.code, 'Código abierto.', 'El desarrollo, las incidencias y las versiones se pueden seguir directamente en GitHub.'],
    [icon.desktop, 'Diseñado para escritorio.', 'Herramientas pensadas para el ordenador, no simples envoltorios web.'],
    [icon.check, 'Sin promesas vacías.', 'El estado de cada proyecto y sus limitaciones se explican antes de descargarlo.'],
  ];
  return shell({
    title: 'Nodalia — Nodalix OS, aplicaciones de escritorio y Home Assistant',
    description: 'Nodalia crea Nodalix OS, Vinilo, Vortia, Lienzo y Nodalia Cards: software independiente para Linux, el escritorio y Home Assistant, desarrollado en público por Daniel Miguel Tejedor.',
    canonical: brand.portal + '/',
    preview: vinilo.previews[0][0],
    previewAlt: vinilo.previews[0][1],
    active: 'portal',
    scripts: `<script type="module" src="/releases.js?v=${await assetVersion('releases.js')}"></script>`,
    schema: [{'@type':'Organization',name:brand.name,url:brand.portal,logo:`${brand.portal}/logo.svg`,email:brand.email,sameAs:[brand.github, brand.instagram, brand.x],founder:{'@type':'Person',name:site.author.name,url:site.author.website,sameAs:[brand.github]}}, faqSchema(site.faq)],
    content: `<section class="home-hero"><div class="container hero-layout">
      <div class="hero-copy">
        <h1 class="hero-title" data-reveal>Software que se siente propio.<span class="caret" aria-hidden="true"></span></h1>
        <p class="hero-lead" data-reveal>Nodalia crea un sistema operativo Linux y aplicaciones de escritorio para escuchar, crear y simular. Software nativo, hecho con cuidado y desarrollado en público.</p>
        <div class="actions" data-reveal>${A(`${brand.portal}/#aplicaciones`, 'Explorar productos', 'btn btn-primary')}${A(nodalix.domain, `Descubrir Nodalix OS ${icon.arrow}`, 'btn btn-secondary')}</div>
        <nav class="hero-products" data-reveal aria-label="Productos de Nodalia">${ordered.map((app) => `<a href="${safeUrl(app.domain)}"><img src="${safeUrl(app.icon)}" alt="" width="24" height="24" decoding="async"/>${e(app.name)}</a>`).join('')}</nav>
      </div>
      <div class="hero-stage" aria-label="Capturas de las aplicaciones Vinilo y Lienzo">
        <div class="stage-halo" aria-hidden="true"></div>
        <figure class="shot shot-main" data-parallax style="--depth:-34px">
          <img src="${previewUrl(vinilo)}" alt="Captura real del reproductor de Vinilo" decoding="async" loading="eager" fetchpriority="high" width="1600" height="1088"/>
          <figcaption>Vinilo · reproductor</figcaption>
        </figure>
        <figure class="shot shot-secondary" data-parallax style="--depth:-78px">
          <img src="${previewUrl(lienzo)}" alt="Captura real de Lienzo editando una imagen por capas" decoding="async" loading="eager" width="2400" height="1500"/>
          <figcaption>Lienzo · capas</figcaption>
        </figure>
        <p class="stage-caption"><strong>Aplicaciones reales.</strong> Capturas de los repositorios oficiales.</p>
      </div>
    </div></section>
    <div class="release-strip"><div class="container release-strip-inner"><span class="release-label">Últimas versiones</span>
      <ul>${site.releases.map(([name, repo]) => {
        // Un proyecto aún sin versión se incluye oculto: releases.js lo muestra en cuanto se publique.
        const release = releases[repo];
        return `<li${release ? '' : ' hidden'}><a href="${safeUrl(`${repoUrl(repo)}/releases/latest`)}" target="_blank" rel="noopener noreferrer"><span>${e(name)}</span><b data-release="${e(repo)}">${e(release?.tag_name || '')}</b><time${release?.published_at ? ` datetime="${e(release.published_at)}"` : ''}></time></a></li>`;
      }).join('')}</ul>
    </div></div>
    <section class="catalogue" id="aplicaciones"><div class="container">
      <div class="section-head"><div data-reveal><h2 data-reveal>Cuatro ideas.<br/>Una forma de hacerlas.</h2></div><p data-reveal>Un sistema operativo y tres aplicaciones, cada una con un problema concreto que resolver. Todas indican su estado real antes de que descargues nada.</p></div>
      <div class="product-grid">${ordered.map(card).join('')}</div>
    </div></section>
    <section class="spotlight"><div class="container spotlight-content">
      <div data-reveal="left"><h2 data-reveal>El sistema operativo también cuenta.</h2><p>Un escritorio GNOME sobre Arch Linux desarrollado como un solo sistema: instalador y actualizador propios, paquetes ajustados a tu procesador e integración con iPhone desde el primer arranque.</p><div class="actions">${A(nodalix.domain, `Conocer Nodalix OS ${icon.arrow}`, 'btn btn-primary')}${A(`${nodalix.domain}/#descargas`, 'Descargas e instalación', 'btn btn-secondary')}</div></div>
      <div class="spec-card" data-reveal="right"><div class="spec-card-head"><img src="${safeUrl(nodalix.icon)}" alt="Logo de Nodalix OS" width="60" height="60" loading="lazy" decoding="async"/><div><strong>${e(nodalix.name)}</strong><span>${e(nodalix.tagline)}</span></div></div>
        <dl class="spec-list">${specs.map(([k, v]) => `<div><dt>${e(k)}</dt><dd>${e(v)}</dd></div>`).join('')}</dl></div>
    </div></section>
    <section class="section eco" id="ecosistema"><div class="container">
      <div class="section-head"><div data-reveal><h2>Nodalia en Home Assistant.</h2></div><p data-reveal>Además del escritorio, Nodalia publica componentes para paneles domóticos. Es su proyecto con más recorrido en la comunidad.</p></div>
      <div class="eco-card" data-reveal>
        <div class="eco-copy"><span class="kicker">${e(eco.featured.kicker)}</span><h3>${e(eco.featured.name)}</h3><p class="eco-headline">${e(eco.featured.headline)}</p><p>${e(eco.featured.description)}</p>
          <ul class="check-list">${eco.featured.points.map((point) => `<li>${icon.tick}${e(point)}</li>`).join('')}</ul>
          <div class="actions">${A(repoUrl(eco.featured.repo), `${icon.github}Ver Nodalia Cards`, 'btn btn-primary', true)}${A(`${repoUrl(eco.featured.repo)}#installation`, 'Instalación', 'btn btn-secondary', true)}</div></div>
        <div class="eco-art" aria-hidden="true"><b>25</b><span>tarjetas</span><ul class="chips">${cardNames.map((name) => `<li class="chip">${e(name)}</li>`).join('')}</ul></div>
      </div>
      <div class="more-grid">${eco.more.map(([name, repo, text]) => `<a class="more-card more-card--text" data-reveal href="${safeUrl(repoUrl(repo))}" target="_blank" rel="noopener noreferrer"><div><strong>${e(name)}</strong><span>${e(text)}</span></div>${icon.arrow}</a>`).join('')}</div>
    </div></section>
    <section class="section soon" id="en-camino"><div class="container">
      <div class="section-head"><div data-reveal><h2>Más en camino.</h2></div><p data-reveal>${e(site.upcoming.intro)}</p></div>
      <ul class="soon-grid">${site.upcoming.apps.map(([name, key, what, repo]) => {
        // Con una versión publicada, la tarjeta lleva a la descarga y muestra la versión.
        const release = repo ? releases[repo] : null;
        const inner = `<img src="/app-icons/${e(key)}.png" alt="" width="64" height="64" loading="lazy" decoding="async"/><div><strong translate="no">${e(name)}</strong><span>${e(what)}</span>${release ? `<b class="soon-version">${e(release.tag_name)}</b>` : ''}</div>`;
        const href = release ? `${repoUrl(repo)}/releases/latest` : repo ? repoUrl(repo) : '';
        return `<li data-reveal>${repo ? `<a class="soon-card${release ? ' soon-card--released' : ''}" href="${safeUrl(href)}" target="_blank" rel="noopener noreferrer">${inner}${release ? icon.down : icon.arrow}</a>` : `<div class="soon-card soon-card--plain">${inner}<em>Sin repositorio aún</em></div>`}</li>`;
      }).join('')}</ul>
      <p class="small-label" data-reveal>Cada icono es un personaje histórico ligado a lo que hace la aplicación.</p>
    </div></section>
    <section class="section studium" id="studium"><div class="container">
      <div class="section-head"><div data-reveal><h2>Studium.</h2></div><p data-reveal>${e(studium.intro)}</p></div>
      <div class="eco-card" data-reveal>
        <div class="eco-copy"><span class="kicker">${e(studium.kicker)}</span><h3>${e(studium.name)}</h3><p class="eco-headline">${e(studium.headline)}</p><p>${e(studium.description)}</p>
          <ul class="check-list">${studium.points.map((point) => `<li>${icon.tick}${e(point)}</li>`).join('')}</ul>
          <div class="actions">${A(`${repoUrl(studium.repo)}/archive/refs/tags/${studium.version}.zip`, `Descargar Studium ${icon.down}`, 'btn btn-primary')}${A(repoUrl(studium.repo), `${icon.github}Código en GitHub`, 'btn btn-secondary', true)}</div>
          <p class="small-label">${e(studium.version)} · código fuente en .zip · Python 3.11 o superior</p></div>
        <div class="studium-steps"><h4>Instalación y conexión con tu IA</h4>
          <pre class="code" tabindex="0"><code>${studium.commands.map((line) => e(line)).join('\n')}</code></pre>
          <p>El último comando arranca el servicio MCP. Configura tu cliente de IA para lanzarlo como servidor MCP local.</p>
          <p>Necesitas Git y, para generar el PDF, un compilador de LaTeX (pdflatex o tectonic).</p>
          <p class="studium-links">${A(`${repoUrl(studium.repo)}/tree/main/integrations`, `Guías para cada cliente ${icon.arrow}`, 'text-link', true)}${A(studium.preview, `Ver la interfaz provisional ${icon.arrow}`, 'text-link', true)}</p>
          <p class="small-label">La interfaz web es provisional y todavía está en desarrollo.</p></div>
      </div>
    </div></section>
    <section class="values" id="principios"><div class="container">
      <div class="section-head"><div data-reveal><h2 data-reveal>Cómo hacemos software.</h2></div><p data-reveal>Tres compromisos que se aplican a todos los proyectos de Nodalia, desde el sistema operativo hasta la aplicación más pequeña.</p></div>
      <ul class="principles">${values.map(([, h, d]) => `<li data-reveal><h3>${e(h)}</h3><p>${e(d)}</p></li>`).join('')}</ul>
    </div></section>
    <section class="section author" id="autor"><div class="container author-layout">
      <div class="author-card" data-reveal="left"><img src="${safeUrl(author.avatar)}" alt="Retrato de ${e(author.name)}" width="120" height="120" loading="lazy" decoding="async"/><strong>${e(author.name)}</strong><span>${e(author.role)}</span>
        <ul class="chips">${author.topics.map((topic) => `<li class="chip">${e(topic)}</li>`).join('')}</ul></div>
      <div data-reveal="right"><h2>Quién hace Nodalia</h2>${author.bio.map((text) => `<p>${e(text)}</p>`).join('')}
        <div class="actions">${A(author.website, `danielmigueltejedor.com ${icon.arrow}`, 'btn btn-primary', true)}${A(brand.github, `${icon.github}Perfil en GitHub`, 'btn btn-secondary', true)}</div></div>
    </div></section>
    ${faqBlock(site.faq)}
    <section class="contact"><div class="container">
      <p class="contact-lead" data-reveal>¿Una duda, una idea o un fallo que contar?</p>
      <a class="contact-mail" data-reveal href="${safeUrl(`mailto:${brand.email}`)}">${e(brand.email)}<span class="caret" aria-hidden="true"></span></a>
      <p class="contact-links" data-reveal>${A(brand.github, `GitHub ${icon.arrow}`, 'text-link', true)}${A(brand.instagram, `Instagram ${icon.arrow}`, 'text-link', true)}${A(brand.x, `X ${icon.arrow}`, 'text-link', true)}${A(author.website, `danielmigueltejedor.com ${icon.arrow}`, 'text-link', true)}</p>
    </div></section>`
  });
}
// Botón de descarga de las apps con instaladores (Vinilo, Lienzo): la página sale con la versión
// actual para Linux; app-download.js elige el paquete de tu sistema y comprueba si hay otra más nueva.
const appDownloadConfig = (app) => ({ repo: app.repoName, patterns: app.downloads, release: releases[app.repoName] || null });
function appDownloadButton(app) {
  const choice = choose(releases[app.repoName], appDownloadConfig(app), 'linux', 'x86');
  return `<a id="app-primary-download" class="btn btn-primary" href="${safeUrl(choice.href)}" rel="noopener noreferrer"><img id="app-primary-icon" class="vortia-platform-icon" src="${choice.icon || '/platform-linux.svg'}" alt="" width="20" height="20"${choice.icon ? '' : ' hidden'}/><span id="app-primary-title">${e(choice.title)}</span></a>`;
}
function appDownloadHint(app) {
  const config = appDownloadConfig(app);
  const choice = choose(config.release, config, 'linux', 'x86');
  return `<p class="vortia-primary-detail app-download-detail"><span id="app-primary-detail" translate="no">${e(detail(choice, 'es'))}</span></p><script type="application/json" id="app-download-config">${JSON.stringify(config).replaceAll('<', '\\u003c')}</script><script type="module" src="${appDownloadSrc}"></script>`;
}
// Sección de descargas de Vinilo y Lienzo: el instalador de cada sistema de la última versión publicada.
// El botón principal de arriba descarga directamente; "Ver todas las versiones" baja hasta aquí.
function appDownloadsSection(app) {
  const config = appDownloadConfig(app);
  const choice = choose(config.release, config, 'linux', 'x86');
  const systems = { linux: ['Linux', '/platform-linux.svg'], mac: ['macOS', '/platform-apple.svg'], macAlt: ['macOS', '/platform-apple.svg'], windows: ['Windows', ''] };
  const cards = Object.keys(systems).filter((os) => app.downloads[os]).map((os) => {
    const asset = choice.found[os];
    const [defaultName, logo] = systems[os];
    const name = app.downloadNames?.[os] || defaultName;
    return `<article class="vortia-package" data-reveal data-platform="${os === 'macAlt' ? 'mac' : os}">
          <div class="vortia-package-head">${logo ? `<img src="${logo}" alt="" width="38" height="38"/>` : ''}<div><h3>${name}</h3></div></div>
          <p class="vortia-package-size" id="app-card-${os}-size" translate="no">${e(asset ? megabytes(asset.size, 'es') : '')}</p>
          <a class="btn btn-primary" id="app-card-${os}" href="${safeUrl(asset ? asset.url : choice.page)}" rel="noopener noreferrer">${asset ? `Descargar <span translate="no">${e(kind(os, asset))}</span>` : 'Consultar en GitHub ↗'}</a>
        </article>`;
  }).join('\n        ');
  return `<section class="section vortia-download-section" id="descargas">
    <div class="container">
      <div class="vortia-download-head">
        <div><h2>Descarga ${e(app.name)}.</h2>
          <p>El botón superior ofrece el instalador de tu sistema. Aquí tienes los de todos los sistemas de la última versión estable publicada en GitHub.</p>
        </div>
        <div class="vortia-version-info" data-reveal="right">
          <span class="kicker">Última publicación estable</span>
          <strong id="app-release-version">${e(choice.version)}</strong>
        </div>
      </div>
      <div class="vortia-download-grid app-download-grid">
        ${cards}
      </div>
      <div class="vortia-download-footer">
        <p>Los instaladores se descargan directamente de GitHub Releases.</p>
        ${A(releasesUrl(app.repoName), 'Ver todas las versiones ↗', 'text-link', true)}
      </div>
    </div>
  </section>`;
}

function product(app) {
  const title = ({vortia:'La simulación de fluidos, a tu alcance.',vinilo:'Disfruta de toda tu música.',lienzo:'Un lugar para crear sin límites.',nodalix:'Tu ordenador. Tu sistema.'})[app.id] || app.headline;
  const hasDownloads = app.id === 'vortia' || app.id === 'nodalix' || Boolean(app.downloads);
  const figure = app.previews.length
    ? `<figure><img src="${safeUrl(app.previews[0][0])}" alt="${e(app.previews[0][1])}" loading="eager" fetchpriority="high" decoding="async"/><figcaption>${e(app.previews[0][1])} · Captura publicada por el proyecto</figcaption></figure>`
    : '';
  const stage = ({
    vortia: () => `<div class="product-preview product-preview--sig" data-reveal="right">${signatureFlow()}</div>`,
    nodalix: () => `<div class="product-preview product-preview--sig" data-reveal="right">${signatureBoot(app)}</div>`,
    vinilo: () => `<div class="sig-vinyl" data-reveal="right">${record}<div class="product-preview">${figure}</div></div>`,
    lienzo: () => `<div class="sig-select" data-identity="select" data-reveal="right"><div class="product-preview">${figure}</div>${selection}</div>`,
  })[app.id]();
  const primaryDownload = app.id === 'vortia'
    ? '<a id="vortia-primary-download" class="btn btn-primary" href="https://github.com/getnodalia/vortia/releases/latest" rel="noopener noreferrer"><img id="vortia-primary-icon" class="vortia-platform-icon" src="/platform-linux.svg" alt="" width="20" height="20" hidden/><span id="vortia-primary-title">Ver versiones y descargas</span></a>'
    : app.downloads
      ? appDownloadButton(app)
    : app.id === 'nodalix'
      ? `<a href="#descargas" class="btn btn-primary">Descargar Nodalix OS ${icon.down}</a>`
      : app.primaryCta
        ? A(app.repo + app.primaryCta[1], `${e(app.primaryCta[0])} ${icon.arrow}`, 'btn btn-primary', true)
        : A(app.repo + '/releases', `Ver versiones y descargas ${icon.arrow}`, 'btn btn-primary', true);
  const primaryHint = app.id === 'vortia'
    ? '<p class="vortia-primary-detail" id="vortia-primary-detail" role="status" aria-live="polite">Se elegirá el instalador compatible con tu sistema operativo.</p>'
    : app.downloads
      ? appDownloadHint(app)
      : '';
  const sections = [['funciones', 'Funciones'], ['ficha', 'Ficha técnica'], ...(hasDownloads ? [['descargas', 'Descargas']] : []), ...(app.id === 'nodalix' || app.install ? [['instalacion', 'Instalación']] : []), ...(app.previews.length ? [['capturas', 'Capturas']] : []), ['faq', 'Preguntas'], ['codigo', 'Código']];
  const detail = app.sources
    ? `<div><h3 class="detail-title" data-reveal>Fuentes de música</h3>${table(['Fuente', 'Canal', 'Qué necesitas'], app.sources)}</div>`
    : app.components
      ? `<div><h3 class="detail-title" data-reveal>Componentes del sistema</h3>${table(['Componente', 'Función'], app.components)}</div>`
      : app.formats
        ? `<div data-reveal="right"><h3 class="detail-title">Formatos compatibles</h3><ul class="chips chips--lg">${app.formats.map((f) => `<li class="chip">${e(f)}</li>`).join('')}</ul><p class="credit">${e(app.credit)}</p></div>`
        : `<div><h3 class="detail-title" data-reveal>Del caso al resultado</h3><ol class="flow">${app.flow.map(([name, text], i) => `<li data-reveal><span class="flow-num">${i + 1}</span><div><strong>${e(name)}</strong><span>${e(text)}</span></div></li>`).join('')}</ol></div>`;
  const installBlock = app.install
    ? `<section class="section install-section" id="instalacion"><div class="container"><h2 data-reveal>${e(app.install.title)}</h2><p class="iso-intro" data-reveal>${e(app.install.intro)}</p><pre class="code" data-reveal tabindex="0"><code>${app.install.commands.map((line) => e(line)).join('\n')}</code></pre><p class="small-label">Guía completa, actualización y otras distribuciones en ${A(app.repo + '#installation', 'el repositorio', 'text-link', true)}.</p></div></section>`
    : '';
  const others = ordered.filter((item) => item.id !== app.id);
  return shell({
    title: `${app.name} — ${app.eyebrow} | Nodalia`,
    description: app.description,
    canonical: app.domain + '/',
    preview: app.previews[0]?.[0] || app.icon,
    previewAlt: app.previews[0]?.[1] || `Icono de ${app.name}`,
    accent: app.accent,
    identity: true,
    schema: [{'@type':'SoftwareApplication',name:app.name,description:app.description,url:app.domain,image:app.icon,applicationCategory:app.category,operatingSystem:app.platforms,offers:{'@type':'Offer',price:'0',priceCurrency:'EUR'},author:{'@type':'Person',name:site.author.name,url:site.author.website},publisher:{'@type':'Organization',name:brand.name,url:brand.portal}}, faqSchema(app.faq)],
    content: `<div class="subnav"><div class="container subnav-inner"><a class="subnav-id" href="#contenido">${iconImg(app, 'subnav-icon', 26)}<span>${e(app.name)}</span></a><nav aria-label="Secciones de ${e(app.name)}">${sections.map(([id, label]) => `<a href="#${id}">${label}</a>`).join('')}</nav></div></div>
      <section class="product-hero"><div class="container product-hero-inner"><div data-reveal="left">
      <nav class="crumbs" aria-label="Ruta de navegación">${A(brand.portal, 'Nodalia')}${icon.chevron}<span aria-current="page">${e(app.name)}</span></nav>
      <div class="product-heading">${iconImg(app, 'product-icon', 60)}<div><strong>${e(app.name)}</strong><span class="status-text">${e(app.status)}</span></div></div>
      <span class="eyebrow">${e(app.eyebrow)}</span><h1>${e(title)}</h1><p class="lede">${e(app.description)}</p>
      <div class="actions">${hasDownloads && app.id !== 'nodalix' ? `<div class="download-stack">${primaryDownload}<a href="#descargas" class="btn btn-secondary btn-all-versions">Ver todas las versiones <span class="btn-icon" aria-hidden="true">↓</span></a></div>` : primaryDownload}${A(app.repo, `${icon.github}Código en GitHub`, 'btn btn-secondary', true)}</div>
      ${primaryHint}<div class="product-meta"><span class="pill">${e(app.platforms)}</span><span class="pill">${e(app.technology)}</span></div></div>
      ${stage}</div></section>
      <section class="section features" id="funciones"><div class="container"><h2 data-reveal>Qué hace ${e(app.name)}.</h2><div class="feature-grid">${app.features.map(([h,d],i)=>`<article class="feature" data-reveal><h3>${e(h)}</h3><p>${e(d)}</p></article>`).join('')}</div><div class="notice" data-reveal>${icon.alert}<p><strong>Estado y requisitos:</strong> ${e(app.limitation)}</p></div></div></section>
      <section class="section" id="ficha"><div class="container"><h2 data-reveal>Ficha técnica</h2><div class="detail-grid">${specCard(app)}${detail}</div></div></section>
      ${app.id==='vortia' ? vortiaDownloads() : app.downloads ? appDownloadsSection(app) : ''}
      ${installBlock}
      ${app.id==='nodalix' ? nodalixDownloads(app) : ''}
      ${app.previews.length ? `<section class="section" id="capturas"><div class="container"><h2 data-reveal>Capturas</h2><div class="gallery">${app.previews.map(([url,alt])=>`<figure data-reveal="scale"><a href="${safeUrl(url)}" target="_blank" rel="noopener noreferrer" aria-label="${e(alt)} (abrir imagen completa)"><img src="${safeUrl(url)}" alt="${e(alt)}" loading="lazy" decoding="async"/></a><figcaption>${e(alt)}</figcaption></figure>`).join('')}</div></div><script type="module" src="${gallerySrc}"></script></section>` : ''}
      ${faqBlock(app.faq)}
      <section class="section product-outro" id="codigo"><div class="container"><h2 data-reveal>Forma parte del desarrollo.</h2><p>Consulta el código, los cambios y las publicaciones reales en GitHub. La disponibilidad de paquetes instalables depende del estado de cada aplicación.</p><div class="actions">${A(app.repo,`Explorar repositorio ${icon.arrow}`,'btn btn-primary',true)}${A(`${app.repo}/releases`,'Versiones publicadas','btn btn-secondary',true)}</div></div></section>
      <section class="section"><div class="container"><h2 data-reveal>Más de Nodalia</h2><div class="more-grid">${others.map((item) => `<a class="more-card" data-reveal href="${safeUrl(item.domain)}">${iconImg(item, 'more-icon', 48)}<div><strong>${e(item.name)}</strong><span>${e(item.category)}</span></div>${icon.arrow}</a>`).join('')}</div></div></section>`
  });
}
function vortiaDownloads() {
  // La versión de Vortia publicada al generar; vortia-download.js la sustituye si GitHub tiene otra más nueva.
  const release = releases.vortia;
  const assets = release?.assets || [];
  const find = (re) => assets.find((asset) => re.test(asset.name)) || null;
  const linux = find(/^Vortia-.+-linux-(x86_64|amd64)\.AppImage$/i);
  const macAssets = assets.filter((asset) => /^Vortia-.+-macos-(arm64|aarch64|universal)\.dmg$/i.test(asset.name));
  const mac = macAssets.find((asset) => /universal/i.test(asset.name)) || macAssets[0] || null;
  const sha = (asset) => (asset ? assets.find((item) => item.name === `${asset.name}.sha256`) || null : null);
  const page = release?.html_url || 'https://github.com/getnodalia/vortia/releases';
  const size = (asset) => (asset?.size ? `${(asset.size / 1e6).toLocaleString('es', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} MB` : '');
  const option = (id, asset, type) => `<p class="vortia-package-size" id="vortia-${id}-size" translate="no">${e(size(asset))}</p>
          <a class="btn btn-primary" id="vortia-${id}-link" href="${safeUrl(asset ? asset.browser_download_url : page)}">${asset ? `Descargar ${type}` : 'Consultar en GitHub ↗'}</a>
          <a class="vortia-checksum" id="vortia-${id}-sha" href="${safeUrl(sha(asset)?.browser_download_url || page)}"${sha(asset) ? '' : ' hidden'}>SHA-256 ↗</a>`;
  return `<section class="section vortia-download-section" id="descargas">
    <div class="container">
      <div class="vortia-download-head">
        <div><h2>Descarga Vortia.</h2>
          <p>El botón superior selecciona automáticamente Linux o macOS. También puedes elegir un paquete manualmente y comprobar su integridad con SHA-256.</p>
        </div>
        <div class="vortia-version-info" data-reveal="right">
          <span class="kicker">Última publicación estable</span>
          <strong id="vortia-release-version">${e(release?.tag_name || '')}</strong>
          <span id="vortia-release-source">Consultando GitHub Releases…</span>
        </div>
      </div>
      <div id="vortia-downloads" class="vortia-download-grid">
        <article class="vortia-package" data-reveal data-platform="linux">
          <div class="vortia-package-head"><img src="/platform-linux.svg" alt="" width="38" height="38"/>
            <div><h3>Linux</h3><p>AppImage · x86_64</p></div>
          </div>
          <p class="vortia-package-desc">Para distribuciones Linux de 64 bits (x86_64) con glibc 2.31 o posterior. Incluye OpenFOAM y el mallador.</p>
          ${option('linux', linux, 'AppImage')}
        </article>
        <article class="vortia-package" data-reveal data-platform="mac">
          <div class="vortia-package-head"><img src="/platform-apple.svg" alt="" width="38" height="38"/>
            <div><h3>macOS</h3><p>DMG · Apple Silicon (arm64)</p></div>
          </div>
          <p class="vortia-package-desc">Para Macs con Apple Silicon y macOS 14 o posterior. Incluye OpenFOAM y el mallador. No es compatible con Macs Intel.</p>
          ${option('mac', mac, 'DMG')}
        </article>
      </div>
      <div class="vortia-download-footer">
        <p>Los instaladores se descargan directamente de GitHub Releases. En macOS el navegador no siempre permite identificar si el procesador es Intel o Apple Silicon.</p>
        <a class="text-link" href="https://github.com/getnodalia/vortia/releases" target="_blank" rel="noopener noreferrer">Ver todas las versiones ↗</a>
      </div>
    </div>
  </section>
  ${release ? `<script type="application/json" id="vortia-release-config">${JSON.stringify(release).replaceAll('<', '\\u003c')}</script>` : ''}
  <script type="module" src="/vortia-download.js"></script>`;
}

function nodalixDownloads(app) {
  return `<section class="section iso-section" id="descargas"><div class="container">
    <h2>Descarga la imagen de instalación</h2>
    <p class="iso-intro">Consigue la ISO oficial, comprueba su integridad y grábala en una memoria USB. Las versiones se consultan directamente en la publicación oficial de Nodalix OS.</p>
    <div class="download-panel" data-reveal aria-live="polite">
      <div><span class="tag active">Canal estable</span><h3 id="release-name">Buscando ISO publicada…</h3><p id="release-subtitle">Consultando las versiones oficiales.</p></div>
      <div id="release-actions" class="actions"></div>
      <dl class="release-spec"><div><dt>Arquitectura</dt><dd>x86_64</dd></div><div><dt>Tamaño</dt><dd id="release-size">—</dd></div><div><dt>Versión</dt><dd id="release-version">—</dd></div></dl>
      <div id="checksum-block" class="checksum" hidden><strong>SHA-256 de la ISO</strong><code id="release-sha"></code><p>Comprueba que este hash coincide con el archivo descargado antes de instalar.</p></div>
      <p id="release-disclaimer" class="small-label">Nunca se mostrará un botón de ISO directa para un archivo que no exista en la publicación.</p>
    </div>
    <div class="download-links"><p>¿Buscas otra versión o un canal de pruebas?</p>
      ${A(`${app.repo}/releases`, 'Ver todas las versiones y betas ↗', 'text-link', true)}
      ${A(`${app.repo}/blob/main/docs/iso.md`, 'Documentación oficial de las ISO ↗', 'text-link', true)}</div>
  </div></section>
  <section class="section install-section" id="instalacion"><div class="container"><h2 data-reveal>De la descarga al primer arranque</h2>
    <div class="feature-grid">
      <article class="feature" data-reveal><span class="num">01 · Descargar</span><h3>Obtén la ISO completa</h3><p>Descarga la imagen verificada. Si GitHub la distribuye en partes, utiliza el descargador oficial para reconstruirla.</p></article>
      <article class="feature" data-reveal><span class="num">02 · Grabar USB</span><h3>Crea tu USB de arranque</h3><p>Usa una herramienta de grabación de imágenes, como Balena Etcher o Rufus. Al grabar se borrará el contenido de la unidad USB.</p></article>
      <article class="feature" data-reveal><span class="num">03 · Instalar</span><h3>Inicia Nodalix OS</h3><p>Arranca el PC desde el USB, entra al entorno live y sigue el instalador. Revisa el disco de destino antes de confirmar.</p></article>
    </div>
    <div class="notice" data-reveal>${icon.alert}<p><strong>Antes de instalar:</strong> realiza una copia de seguridad. Nodalix necesita Internet durante la instalación y su ISO actual no permite arrancar con Secure Boot activado. Una instalación sobre el disco equivocado puede borrar datos.</p></div>
    <p class="small-label">Verificación en Linux: <code>sha256sum archivo.iso</code> · macOS: <code>shasum -a 256 archivo.iso</code> · Windows PowerShell: <code>Get-FileHash archivo.iso -Algorithm SHA256</code></p>
  </div></section>
  <script type="module" src="/nodalix-releases.js"></script>`;
}

function sitemap(domain) {return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${localeCodes.map((code) => `<url><loc>${e(domain)}${localePath(code)}</loc></url>`).join('')}</urlset>\n`}
async function build(site) {
  const dir = path.join(root, 'dist', site);
  await rm(dir, { recursive: true, force: true });
  await mkdir(path.join(dir, 'fonts'), { recursive: true });
  if (site === 'portal') await mkdir(path.join(dir, 'app-icons'), { recursive: true });
  const app = apps.find((item) => item.id === site);
  if (app?.localScreens.length) await mkdir(path.join(dir, 'screens', app.id), { recursive: true });
  const clientScripts = [...({ vortia: ['vortia-download.js'], nodalix: ['nodalix-releases.js'] }[site] || []), ...(app?.downloads ? ['app-download.js'] : []), ...(app?.previews.length ? ['gallery.js'] : [])];
  const keys = (await Promise.all(clientScripts.map((file) => readFile(path.join(root, 'assets', file), 'utf8')))).flatMap(clientKeys);
  const pages = [];
  for (const code of localeCodes) {
    locale = code;
    clientStrings = code === DEFAULT_LOCALE || !keys.length ? null : Object.fromEntries(keys.filter((key) => dictionaries[code][key] !== undefined).map((key) => [key, dictionaries[code][key]]));
    const page = localize(site === 'portal' ? await home() : product(app), code);
    const absent = [...page.missing, ...(code === DEFAULT_LOCALE ? [] : keys.filter((key) => dictionaries[code][key] === undefined))];
    if (absent.length) missing[code] = [...new Set([...(missing[code] || []), ...absent])];
    pages.push([code, page.html]);
  }
  locale = DEFAULT_LOCALE;
  clientStrings = null;
  await Promise.all(localeCodes.filter((code) => code !== DEFAULT_LOCALE).map((code) => mkdir(path.join(dir, code), { recursive: true })));
  const baseUrl = site === 'portal' ? brand.portal : app.domain;
  await Promise.all([
    ...pages.map(([code, html]) => writeFile(path.join(dir, localePath(code).slice(1), 'index.html'), html, 'utf8')),
    copyFile(path.join(root, 'assets', 'i18n.js'), path.join(dir, 'i18n.js')),
    writeFile(path.join(dir, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${baseUrl}/sitemap.xml\n`, 'utf8'),
    writeFile(path.join(dir, 'sitemap.xml'), sitemap(baseUrl), 'utf8'),
    writeFile(path.join(dir, '404.html'), shell({title:'Página no encontrada | Nodalia',description:'No hemos encontrado esa página.',canonical:baseUrl+'/',content:`<section class="hero"><div class="container"><span class="eyebrow" data-reveal>Error 404</span><h1>Esta página no existe.</h1><p>Prueba a volver al catálogo de aplicaciones.</p><div class="actions">${A(brand.portal, 'Volver al inicio','btn btn-primary')}</div></div></section>`}), 'utf8'),
    copyFile(path.join(root, 'assets', 'logo.svg'), path.join(dir, 'logo.svg')),
    copyFile(path.join(root, 'assets', 'nodalia-wordmark.svg'), path.join(dir, 'nodalia-wordmark.svg')),
    copyFile(path.join(root, 'assets', 'nodalia-mark.svg'), path.join(dir, 'nodalia-mark.svg')),
    copyFile(path.join(root, 'assets', 'styles.css'), path.join(dir, 'styles.css')),
    copyFile(path.join(root, 'assets', '_headers'), path.join(dir, '_headers')),
    copyFile(path.join(root, 'assets', 'motion.js'), path.join(dir, 'motion.js')),
    ...(site === 'portal' ? [] : [copyFile(path.join(root, 'assets', 'identity.js'), path.join(dir, 'identity.js'))]),
    ...(app?.previews.length ? [copyFile(path.join(root, 'assets', 'gallery.js'), path.join(dir, 'gallery.js'))] : []),
    ...['favicon.svg', 'favicon.ico', 'apple-touch-icon.png'].map((file) => copyFile(path.join(root, 'assets', file), path.join(dir, file))),
    ...fontFiles.map((file) => copyFile(path.join(root, 'assets', 'fonts', file), path.join(dir, 'fonts', file))),
    writeFile(path.join(dir, cssFileName), cssSource),
    ...(site === 'portal' ? [copyFile(path.join(root, 'assets', 'releases.js'), path.join(dir, 'releases.js'))] : []),
    ...(site === 'portal' ? upcomingIcons.map((file) => copyFile(path.join(root, 'assets', 'app-icons', file), path.join(dir, 'app-icons', file))) : []),
    ...(site === 'vortia' ? [
      copyFile(path.join(root, 'assets', 'vortia-download.js'), path.join(dir, 'vortia-download.js')),
      copyFile(path.join(root, 'assets', 'platform.js'), path.join(dir, 'platform.js')),
      copyFile(path.join(root, 'assets', 'platform-apple.svg'), path.join(dir, 'platform-apple.svg')),
      copyFile(path.join(root, 'assets', 'platform-linux.svg'), path.join(dir, 'platform-linux.svg')),
    ] : []),
    ...(app?.downloads ? ['app-download.js', 'platform.js', 'platform-apple.svg', 'platform-linux.svg'].map((file) => copyFile(path.join(root, 'assets', file), path.join(dir, file))) : []),
    ...(app?.localScreens || []).map((file) => copyFile(path.join(root, 'assets', file.slice(1)), path.join(dir, file.slice(1)))),
    ...(site === 'nodalix' ? [
      copyFile(path.join(root, 'assets', 'nodalix-releases.js'), path.join(dir, 'nodalix-releases.js')),
      copyFile(path.join(root, 'data', 'nodalix-iso-releases.json'), path.join(dir, 'releases.json')),
    ] : []),
  ]);
  console.log(`✓ ${site}: ${path.relative(root, dir)}`);
}
for (const site of selected) await build(site);
// Textos sin traducir: las pruebas fallan si este archivo no está vacío.
await writeFile(path.join(root, 'dist', 'i18n-missing.json'), JSON.stringify(missing, null, 1), 'utf8');
const pending = Object.values(missing).reduce((total, list) => total + list.length, 0);
if (pending) console.warn(`! ${pending} textos sin traducir (dist/i18n-missing.json)`);
