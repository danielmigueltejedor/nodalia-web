import { mkdir, rm, writeFile, copyFile, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { apps, brand } from './data.mjs';

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
  mail: svg('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/>'),
  github: '<svg class="i i-fill" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z"/></svg>',
};
const A = (url, text, className = '', external = false) => `<a href="${safeUrl(url)}" class="${e(className)}"${external ? ' target="_blank" rel="noopener noreferrer"' : ''}>${text}</a>`;
const iconImg = (app, cls = 'app-icon', size = 80) => `<img class="${e(cls)}" src="${safeUrl(app.icon)}" alt="Icono de ${e(app.name)}" width="${size}" height="${size}" loading="lazy" decoding="async" />`;
const chips = (app) => `<ul class="chips" aria-label="Tecnología">${app.technology.split(' · ').map((t) => `<li class="chip">${e(t)}</li>`).join('')}</ul>`;
const jsonLd = (data) => `<script type="application/ld+json">${JSON.stringify(data).replaceAll('<', '\\u003c')}</script>`;
const fontFiles = ['sora-latin-wght.woff2', 'inter-latin-wght.woff2'];
// Activa las animaciones solo con JavaScript y sin reduced-motion; si motion.js no carga, el contenido vuelve a mostrarse.
const motionBoot = `<script>(function(d){if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;d.classList.add('js');setTimeout(function(){if(!window.__nodaliaMotion)d.classList.remove('js')},2500)})(document.documentElement)</script>`;
const order = ['nodalix', 'vinilo', 'vortia', 'lienzo'];
const byId = Object.fromEntries(apps.map((app) => [app.id, app]));
const ordered = order.map((id) => byId[id]);

const nav = (active = '') => `<header class="topbar"><div class="container topbar-inner">
  ${A(brand.portal, '<img src="/nodalia-wordmark.svg" alt="Nodalia" width="118" height="30"/>', 'brand')}
  <nav class="nav" aria-label="Navegación principal">
    ${A(`${brand.portal}/#aplicaciones`, 'Productos', active === 'portal' ? '' : 'optional')}
    ${A(byId.nodalix.domain, 'Nodalix OS', 'optional')}
    ${A(`${brand.portal}/#principios`, 'Principios', 'optional')}
    ${A(brand.github, `${icon.github}GitHub`, 'outline', true)}
  </nav>
</div></header>`;
const footer = () => `<footer class="footer"><div class="container">
  <div class="footer-content">
    <div class="footer-about"><a class="brand" href="${safeUrl(brand.portal)}"><img src="/nodalia-wordmark.svg" alt="Nodalia" width="133" height="34" loading="lazy"/></a>
      <p>Software independiente y de código abierto: un sistema operativo Linux y aplicaciones de escritorio hechas con criterio.</p></div>
    <div class="footer-col"><h2>Productos</h2><nav class="footer-links" aria-label="Productos">
      ${ordered.map((app) => A(app.domain, e(app.name))).join('')}
    </nav></div>
    <div class="footer-col"><h2>Proyecto</h2><nav class="footer-links" aria-label="Proyecto">
      ${A(brand.github, 'GitHub', '', true)}
      ${A(`${brand.portal}/#principios`, 'Principios')}
      ${A(`mailto:${brand.email}`, 'Contacto')}
    </nav></div>
  </div>
  <div class="footer-meta"><span>© ${new Date().getUTCFullYear()} Nodalia · Proyectos de código abierto</span><span>Sin cookies ni analítica propia.</span></div>
</div></footer>`;
const shell = ({title, description, canonical, content, accent = '', preview = '', previewAlt = '', active = '', schema = null}) => `<!doctype html>
<html lang="es"><head>
<meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta name="theme-color" content="#07080c"/><meta name="color-scheme" content="dark"/>
<title>${e(title)}</title><meta name="description" content="${e(description)}"/>
<link rel="canonical" href="${safeUrl(canonical)}"/>
<meta property="og:type" content="website"/><meta property="og:site_name" content="Nodalia"/><meta property="og:locale" content="es_ES"/>
<meta property="og:title" content="${e(title)}"/>
<meta property="og:description" content="${e(description)}"/><meta property="og:url" content="${safeUrl(canonical)}"/>
${preview ? `<meta property="og:image" content="${safeUrl(preview)}"/>${previewAlt ? `<meta property="og:image:alt" content="${e(previewAlt)}"/>` : ''}` : ''}
<meta name="twitter:card" content="${preview ? 'summary_large_image' : 'summary'}"/>
<link rel="icon" type="image/svg+xml" href="/nodalia-mark.svg"/>
<link rel="preconnect" href="https://raw.githubusercontent.com" crossorigin/>
<link rel="preload" href="/fonts/sora-latin-wght.woff2" as="font" type="font/woff2" crossorigin/>
<link rel="preload" href="/fonts/inter-latin-wght.woff2" as="font" type="font/woff2" crossorigin/>
<link rel="stylesheet" href="/${cssFileName}"/>
${motionBoot}
${schema ? jsonLd(schema) : ''}
</head><body class="${e(accent ? `accent-${accent}` : '')}"><a class="visually-hidden" href="#contenido">Saltar al contenido</a>
<div class="scroll-progress" aria-hidden="true"></div>${nav(active)}<main id="contenido">${content}</main>${footer()}<script type="module" src="/motion.js"></script></body></html>`;

function home() {
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
  const specs = [['Base', 'Arch Linux'], ['Escritorio', 'GNOME · Wayland'], ['Arquitectura', 'x86_64 · BIOS / UEFI'], ['Instalación', 'ISO verificada con SHA-256']];
  const values = [
    [icon.code, 'Código abierto.', 'El desarrollo, las incidencias y las versiones se pueden seguir directamente en GitHub.'],
    [icon.desktop, 'Diseñado para escritorio.', 'Herramientas pensadas para el ordenador, no simples envoltorios web.'],
    [icon.check, 'Sin promesas vacías.', 'El estado de cada proyecto y sus limitaciones se explican antes de descargarlo.'],
  ];
  return shell({
    title: 'Nodalia — Aplicaciones de escritorio y Nodalix OS',
    description: 'Nodalia reúne Vortia, Vinilo, Lienzo y Nodalix OS: software independiente, código abierto y experiencias de escritorio cuidadas.',
    canonical: brand.portal + '/',
    preview: vinilo.previews[0][0],
    previewAlt: vinilo.previews[0][1],
    active: 'portal',
    schema: {'@context':'https://schema.org','@type':'Organization',name:brand.name,url:brand.portal,logo:`${brand.portal}/logo.svg`,email:brand.email,sameAs:[brand.github]},
    content: `<section class="home-hero"><div class="container hero-layout">
      <div class="hero-copy">
        <span class="kicker" data-reveal>Software independiente · Código abierto</span>
        <h1 class="hero-title" data-reveal>Software que se siente <span>propio.</span></h1>
        <p class="hero-lead" data-reveal>Un sistema operativo Linux y aplicaciones para crear, investigar y disfrutar. Herramientas con personalidad, desarrolladas a la vista de todos.</p>
        <div class="actions" data-reveal>${A(`${brand.portal}/#aplicaciones`, 'Explorar productos', 'btn btn-primary')}${A(nodalix.domain, `Descubrir Nodalix OS ${icon.arrow}`, 'btn btn-secondary')}</div>
        <nav class="hero-products" data-reveal aria-label="Productos de Nodalia">${ordered.map((app) => `<a href="${safeUrl(app.domain)}"><img src="${safeUrl(app.icon)}" alt="" width="24" height="24" decoding="async"/>${e(app.name)}</a>`).join('')}</nav>
      </div>
      <div class="hero-stage" aria-label="Capturas de las aplicaciones Vinilo y Lienzo">
        <div class="stage-halo" aria-hidden="true"></div>
        <figure class="shot shot-main" data-parallax style="--depth:-34px">
          <img src="${previewUrl(vinilo)}" alt="Captura real de la biblioteca musical de Vinilo" decoding="async" loading="eager" fetchpriority="high" width="1280" height="800"/>
          <figcaption>Vinilo · biblioteca musical</figcaption>
        </figure>
        <figure class="shot shot-secondary" data-parallax style="--depth:-78px">
          <img src="${previewUrl(lienzo)}" alt="Captura real de la herramienta de niveles de Lienzo" decoding="async" loading="eager" width="1280" height="800"/>
          <figcaption>Lienzo · niveles</figcaption>
        </figure>
        <p class="stage-caption"><strong>Aplicaciones reales.</strong> Capturas de los repositorios oficiales.</p>
      </div>
    </div></section>
    <div class="hero-stats"><div class="container hero-stats-inner">
      <div class="hero-stat" data-reveal><b data-count="4">4</b><span>productos en desarrollo</span></div>
      <div class="hero-stat" data-reveal><b data-count="100" data-suffix="%">100%</b><span>código abierto en GitHub</span></div>
      <div class="hero-stat" data-reveal><b data-count="3">3</b><span>plataformas: Linux, macOS y Windows</span></div>
      <div class="hero-stat" data-reveal><b>0</b><span>rastreadores, analítica o cookies</span></div>
    </div></div>
    <section class="catalogue" id="aplicaciones"><div class="container">
      <div class="section-head"><div data-reveal><span class="eyebrow">Nuestro software</span><h2 data-reveal>Cuatro ideas.<br/>Una forma de hacerlas.</h2></div><p data-reveal>Aplicaciones que resuelven problemas concretos. Conoce cada proyecto, comprueba su estado real y accede a la documentación.</p></div>
      <div class="product-grid">${ordered.map(card).join('')}</div>
    </div></section>
    <section class="spotlight"><div class="container spotlight-content">
      <div data-reveal="left"><span class="eyebrow">Nodalix OS · Linux para personas</span><h2 data-reveal>El sistema operativo también cuenta.</h2><p>Un escritorio GNOME integrado sobre Arch Linux, con herramientas propias y una ISO para instalarlo desde USB. Sin ocultar los requisitos ni el estado de desarrollo.</p><div class="actions">${A(nodalix.domain, `Conocer Nodalix OS ${icon.arrow}`, 'btn btn-primary')}${A(`${nodalix.domain}/#descargas`, 'Descargas e instalación', 'btn btn-secondary')}</div></div>
      <div class="spec-card" data-reveal="right"><div class="spec-card-head"><img src="${safeUrl(nodalix.icon)}" alt="Logo de Nodalix OS" width="60" height="60" loading="lazy" decoding="async"/><div><strong>${e(nodalix.name)}</strong><span>${e(nodalix.tagline)}</span></div></div>
        <dl class="spec-list">${specs.map(([k, v]) => `<div><dt>${e(k)}</dt><dd>${e(v)}</dd></div>`).join('')}</dl></div>
    </div></section>
    <section class="values" id="principios"><div class="container">
      <div class="section-head"><div data-reveal><span class="eyebrow">Principios</span><h2 data-reveal>Cómo hacemos software.</h2></div><p data-reveal>Tres compromisos que se aplican a todos los proyectos de Nodalia, desde el sistema operativo hasta la aplicación más pequeña.</p></div>
      <div class="value-row">${values.map(([ico, h, d]) => `<div class="value" data-reveal><span class="value-icon">${ico}</span><b>${e(h)}</b><p>${e(d)}</p></div>`).join('')}</div>
    </div></section>
    <section class="cta"><div class="container"><div class="cta-box" data-reveal="scale">
      <div><h2>Desarrollado a la vista de todos.</h2><p>El código, las incidencias y las versiones de cada proyecto están en GitHub. ¿Dudas o propuestas? Escríbenos.</p></div>
      <div class="actions">${A(brand.github, `${icon.github}Ver en GitHub`, 'btn btn-primary', true)}${A(`mailto:${brand.email}`, `${icon.mail}${e(brand.email)}`, 'btn btn-secondary')}</div>
    </div></div></section>`
  });
}
function product(app) {
  const title = ({vortia:'La simulación de fluidos, a tu alcance.',vinilo:'Disfruta de toda tu música.',lienzo:'Un lugar para crear sin límites.',nodalix:'Tu ordenador. Tu sistema.'})[app.id] || app.headline;
  const hasDownloads = app.id === 'vortia' || app.id === 'nodalix';
  const preview = app.previews.length
    ? `<figure><img src="${safeUrl(app.previews[0][0])}" alt="${e(app.previews[0][1])}" loading="eager" fetchpriority="high" decoding="async"/><figcaption>${e(app.previews[0][1])} · Captura publicada por el proyecto</figcaption></figure>`
    : `<div class="product-placeholder"><div class="orb">${iconImg(app, 'placeholder-icon', 132)}</div>${chips(app)}<p>Capturas oficiales aún no publicadas.</p></div>`;
  const primaryDownload = app.id === 'vortia'
    ? '<a id="vortia-primary-download" class="btn btn-primary" href="https://github.com/danielmigueltejedor/vortia/releases/latest" rel="noopener noreferrer"><img id="vortia-primary-icon" class="vortia-platform-icon" src="/platform-linux.svg" alt="" width="20" height="20" hidden/><span id="vortia-primary-title">Ver versiones y descargas</span><span class="btn-icon" aria-hidden="true">↓</span></a>'
    : app.id === 'nodalix'
      ? `<a href="#descargas" class="btn btn-primary">Descargar Nodalix OS ${icon.down}</a>`
      : A(app.repo + '/releases', `Ver versiones y descargas ${icon.arrow}`, 'btn btn-primary', true);
  const primaryHint = app.id === 'vortia'
    ? '<p class="vortia-primary-detail" id="vortia-primary-detail" role="status" aria-live="polite">Se elegirá el instalador compatible con tu sistema operativo.</p>'
    : '';
  const sections = [['funciones', 'Funciones'], ...(hasDownloads ? [['descargas', 'Descargas']] : []), ...(app.id === 'nodalix' ? [['instalacion', 'Instalación']] : []), ...(app.previews.length ? [['capturas', 'Capturas']] : []), ['codigo', 'Código']];
  const others = ordered.filter((item) => item.id !== app.id);
  return shell({
    title: `${app.name} — ${app.eyebrow} | Nodalia`,
    description: app.description,
    canonical: app.domain + '/',
    preview: app.previews[0]?.[0] || app.icon,
    previewAlt: app.previews[0]?.[1] || `Icono de ${app.name}`,
    accent: app.accent,
    schema: {'@context':'https://schema.org','@type':'SoftwareApplication',name:app.name,description:app.description,url:app.domain,image:app.icon,applicationCategory:app.category,operatingSystem:app.platforms,offers:{'@type':'Offer',price:'0',priceCurrency:'EUR'},publisher:{'@type':'Organization',name:brand.name,url:brand.portal}},
    content: `<div class="subnav"><div class="container subnav-inner"><a class="subnav-id" href="#contenido">${iconImg(app, 'subnav-icon', 26)}<span>${e(app.name)}</span></a><nav aria-label="Secciones de ${e(app.name)}">${sections.map(([id, label]) => `<a href="#${id}">${label}</a>`).join('')}</nav></div></div>
      <section class="product-hero"><div class="container product-hero-inner"><div data-reveal="left">
      <nav class="crumbs" aria-label="Ruta de navegación">${A(brand.portal, 'Nodalia')}${icon.chevron}<span aria-current="page">${e(app.name)}</span></nav>
      <div class="product-heading">${iconImg(app, 'product-icon', 60)}<div><strong>${e(app.name)}</strong><span class="status-text">${e(app.status)}</span></div></div>
      <span class="eyebrow">${e(app.eyebrow)}</span><h1>${e(title)}</h1><p class="lede">${e(app.description)}</p>
      <div class="actions">${primaryDownload}${A(app.repo, `${icon.github}Código en GitHub`, 'btn btn-secondary', true)}</div>
      ${primaryHint}<div class="product-meta"><span class="pill">${e(app.platforms)}</span><span class="pill">${e(app.technology)}</span></div></div>
      <div class="product-preview" data-reveal="right">${preview}</div></div></section>
      <section class="section features" id="funciones"><div class="container"><span class="eyebrow" data-reveal>Funciones del proyecto</span><h2 data-reveal>Diseñado para hacer más.</h2><div class="feature-grid">${app.features.map(([h,d],i)=>`<article class="feature" data-reveal><span class="num">0${i+1}</span><h3>${e(h)}</h3><p>${e(d)}</p></article>`).join('')}</div><div class="notice" data-reveal>${icon.alert}<p><strong>Estado y requisitos:</strong> ${e(app.limitation)}</p></div></div></section>
      ${app.id==='vortia' ? vortiaDownloads() : ''}
      ${app.id==='nodalix' ? nodalixDownloads(app) : ''}
      ${app.previews.length ? `<section class="section" id="capturas"><div class="container"><span class="eyebrow" data-reveal>Vistas de la aplicación</span><h2 data-reveal>Conoce ${e(app.name)}.</h2><div class="gallery">${app.previews.map(([url,alt])=>`<figure data-reveal="scale"><a href="${safeUrl(url)}" target="_blank" rel="noopener noreferrer" aria-label="${e(alt)} (abrir imagen completa)"><img src="${safeUrl(url)}" alt="${e(alt)}" loading="lazy" decoding="async"/></a><figcaption>${e(alt)}</figcaption></figure>`).join('')}</div></div></section>` : ''}
      <section class="section product-outro" id="codigo"><div class="container"><span class="eyebrow" data-reveal>Código y documentación</span><h2 data-reveal>Forma parte del desarrollo.</h2><p>Consulta el código, los cambios y las publicaciones reales en GitHub. La disponibilidad de paquetes instalables depende del estado de cada aplicación.</p><div class="actions">${A(app.repo,`Explorar repositorio ${icon.arrow}`,'btn btn-primary',true)}${A(`${app.repo}/releases`,'Versiones publicadas','btn btn-secondary',true)}</div></div></section>
      <section class="section"><div class="container"><span class="eyebrow" data-reveal>Más de Nodalia</span><h2 data-reveal>Otros productos.</h2><div class="more-grid">${others.map((item) => `<a class="more-card" data-reveal href="${safeUrl(item.domain)}">${iconImg(item, 'more-icon', 48)}<div><strong>${e(item.name)}</strong><span>${e(item.category)}</span></div>${icon.arrow}</a>`).join('')}</div></div></section>`
  });
}
function vortiaDownloads() {
  return `<section class="section vortia-download-section" id="descargas">
    <div class="container">
      <div class="vortia-download-head">
        <div><span class="eyebrow">Instaladores oficiales</span>
          <h2>Descarga Vortia.</h2>
          <p>El botón superior selecciona automáticamente Linux o macOS. También puedes elegir un paquete manualmente y comprobar su integridad con SHA-256.</p>
        </div>
        <div class="vortia-version-info" data-reveal="right">
          <span class="kicker">Última publicación estable</span>
          <strong id="vortia-release-version">v0.1.1</strong>
          <span id="vortia-release-source">Consultando GitHub Releases…</span>
        </div>
      </div>
      <div id="vortia-downloads" class="vortia-download-grid">
        <article class="vortia-package" data-reveal data-platform="linux">
          <div class="vortia-package-head"><img src="/platform-linux.svg" alt="" width="38" height="38"/>
            <div><h3>Linux</h3><p>AppImage · x86_64</p></div>
          </div>
          <p class="vortia-package-desc">Archivo ejecutable para distribuciones Linux de 64 bits con arquitectura x86_64.</p>
          <p class="vortia-package-size" id="vortia-linux-size">105,2 MB</p>
          <a class="btn btn-primary" id="vortia-linux-link" href="https://github.com/danielmigueltejedor/vortia/releases/download/v0.1.1/Vortia-0.1.1-linux-x86_64.AppImage">Descargar AppImage ↓</a>
          <a class="vortia-checksum" id="vortia-linux-sha" href="https://github.com/danielmigueltejedor/vortia/releases/download/v0.1.1/Vortia-0.1.1-linux-x86_64.AppImage.sha256">SHA-256 ↗</a>
        </article>
        <article class="vortia-package" data-reveal data-platform="mac">
          <div class="vortia-package-head"><img src="/platform-apple.svg" alt="" width="38" height="38"/>
            <div><h3>macOS</h3><p>DMG · Apple Silicon (arm64)</p></div>
          </div>
          <p class="vortia-package-desc">Para Macs con procesadores Apple Silicon. El DMG publicado no es compatible con Macs Intel.</p>
          <p class="vortia-package-size" id="vortia-mac-size">57,6 MB</p>
          <a class="btn btn-primary" id="vortia-mac-link" href="https://github.com/danielmigueltejedor/vortia/releases/download/v0.1.1/Vortia-0.1.1-macos-arm64.dmg">Descargar DMG ↓</a>
          <a class="vortia-checksum" id="vortia-mac-sha" href="https://github.com/danielmigueltejedor/vortia/releases/download/v0.1.1/Vortia-0.1.1-macos-arm64.dmg.sha256">SHA-256 ↗</a>
        </article>
      </div>
      <div class="vortia-download-footer">
        <p>Los instaladores se descargan directamente de GitHub Releases. En macOS el navegador no siempre permite identificar si el procesador es Intel o Apple Silicon.</p>
        <a class="text-link" href="https://github.com/danielmigueltejedor/vortia/releases" target="_blank" rel="noopener noreferrer">Ver todas las versiones ↗</a>
      </div>
    </div>
  </section>
  <script type="module" src="/vortia-download.js"></script>`;
}

function nodalixDownloads(app) {
  return `<section class="section iso-section" id="descargas"><div class="container">
    <span class="eyebrow">Nodalix OS / x86_64</span>
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
  <section class="section install-section" id="instalacion"><div class="container"><span class="eyebrow" data-reveal>Instalación</span><h2 data-reveal>De la descarga al primer arranque</h2>
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

function sitemap(domain) {return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${e(domain)}/</loc></url></urlset>\n`}
async function build(site) {
  const dir = path.join(root, 'dist', site);
  await rm(dir, { recursive: true, force: true });
  await mkdir(path.join(dir, 'fonts'), { recursive: true });
  const app = apps.find((item) => item.id === site);
  const content = site === 'portal' ? home() : product(app);
  const baseUrl = site === 'portal' ? brand.portal : app.domain;
  await Promise.all([
    writeFile(path.join(dir, 'index.html'), content, 'utf8'),
    writeFile(path.join(dir, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${baseUrl}/sitemap.xml\n`, 'utf8'),
    writeFile(path.join(dir, 'sitemap.xml'), sitemap(baseUrl), 'utf8'),
    writeFile(path.join(dir, '404.html'), shell({title:'Página no encontrada | Nodalia',description:'No hemos encontrado esa página.',canonical:baseUrl+'/',content:`<section class="hero"><div class="container"><span class="eyebrow" data-reveal>Error 404</span><h1>Esta página no existe.</h1><p>Prueba a volver al catálogo de aplicaciones.</p><div class="actions">${A(brand.portal, 'Volver al inicio','btn btn-primary')}</div></div></section>`}), 'utf8'),
    copyFile(path.join(root, 'assets', 'logo.svg'), path.join(dir, 'logo.svg')),
    copyFile(path.join(root, 'assets', 'nodalia-wordmark.svg'), path.join(dir, 'nodalia-wordmark.svg')),
    copyFile(path.join(root, 'assets', 'nodalia-mark.svg'), path.join(dir, 'nodalia-mark.svg')),
    copyFile(path.join(root, 'assets', 'styles.css'), path.join(dir, 'styles.css')),
    copyFile(path.join(root, 'assets', '_headers'), path.join(dir, '_headers')),
    copyFile(path.join(root, 'assets', 'motion.js'), path.join(dir, 'motion.js')),
    ...fontFiles.map((file) => copyFile(path.join(root, 'assets', 'fonts', file), path.join(dir, 'fonts', file))),
    writeFile(path.join(dir, cssFileName), cssSource),
    ...(site === 'vortia' ? [
      copyFile(path.join(root, 'assets', 'vortia-download.js'), path.join(dir, 'vortia-download.js')),
      copyFile(path.join(root, 'assets', 'platform-apple.svg'), path.join(dir, 'platform-apple.svg')),
      copyFile(path.join(root, 'assets', 'platform-linux.svg'), path.join(dir, 'platform-linux.svg')),
    ] : []),
    ...(site === 'nodalix' ? [
      copyFile(path.join(root, 'assets', 'nodalix-releases.js'), path.join(dir, 'nodalix-releases.js')),
      copyFile(path.join(root, 'data', 'nodalix-iso-releases.json'), path.join(dir, 'releases.json')),
    ] : []),
  ]);
  console.log(`✓ ${site}: ${path.relative(root, dir)}`);
}
for (const site of selected) await build(site);
