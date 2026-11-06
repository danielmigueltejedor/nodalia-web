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
const A = (url, text, className = '', external = false) => `<a href="${safeUrl(url)}" class="${e(className)}"${external ? ' target="_blank" rel="noopener noreferrer"' : ''}>${text}</a>`;
const iconImg = (app, cls = 'app-icon') => `<img class="${e(cls)}" src="${safeUrl(app.icon)}" alt="Icono de ${e(app.name)}" width="80" height="80" loading="lazy" decoding="async" />`;
const nav = (active = '') => `<header class="topbar"><div class="container topbar-inner">
  ${A(brand.portal, '<img src="/nodalia-wordmark.svg" alt="Nodalia" width="154" height="46"/>', 'brand')}
  <nav class="nav" aria-label="Navegación principal">
    ${A(`${brand.portal}/#aplicaciones`, 'Aplicaciones', active === 'portal' ? '' : 'optional')}
    ${A('https://nodalix.getnodalia.com', 'Nodalix OS', 'optional')}
    ${A(brand.github, 'GitHub ↗', 'outline', true)}
  </nav>
</div></header>`;
const footer = () => `<footer class="footer"><div class="container footer-content">
  <div><a class="brand" href="${safeUrl(brand.portal)}"><img src="/nodalia-wordmark.svg" alt="Nodalia" width="177" height="55" /></a>
    <p>Software independiente, creado con criterio.</p><div class="footer-meta">© ${new Date().getUTCFullYear()} Nodalia · Proyectos de código abierto</div></div>
  <nav class="footer-links" aria-label="Enlaces de pie de página">
    ${A(`${brand.portal}/#aplicaciones`, 'Aplicaciones')}
    ${A('https://nodalix.getnodalia.com', 'Nodalix OS')}
    ${A(brand.github, 'GitHub', '', true)}
    ${A(`mailto:${brand.email}`, 'Contacto')}
  </nav>
</div></footer>`;
const shell = ({title, description, canonical, content, accent = '', preview = '', active = ''}) => `<!doctype html>
<html lang="es"><head>
<meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta name="theme-color" content="#090a0f"/><meta name="color-scheme" content="dark"/>
<title>${e(title)}</title><meta name="description" content="${e(description)}"/>
<link rel="canonical" href="${safeUrl(canonical)}"/>
<meta property="og:type" content="website"/><meta property="og:title" content="${e(title)}"/>
<meta property="og:description" content="${e(description)}"/><meta property="og:url" content="${safeUrl(canonical)}"/>
${preview ? `<meta property="og:image" content="${safeUrl(preview)}"/>` : ''}
<meta name="twitter:card" content="${preview ? 'summary_large_image' : 'summary'}"/>
<link rel="icon" type="image/svg+xml" href="/nodalia-mark.svg"/>
<link rel="stylesheet" href="/${cssFileName}"/>
</head><body class="${e(accent ? `accent-${accent}` : '')}"><a class="visually-hidden" href="#contenido">Saltar al contenido</a>
${nav(active)}<main id="contenido">${content}</main>${footer()}</body></html>`;

function home() {
  const data = Object.fromEntries(apps.map(app => [app.id, app]));
  const vinilo = data.vinilo, lienzo = data.lienzo, nodalix = data.nodalix;
  const previewUrl = (app, i = 0) => safeUrl(app.previews[i][0]);
  const card = (app) => {
    const screen = app.previews.length
      ? `<img class="screen" src="${previewUrl(app)}" alt="${e(app.previews[0][1])}" loading="lazy" decoding="async"/>`
      : `<img src="${safeUrl(app.icon)}" alt="" width="120" height="120" loading="lazy" decoding="async"/>`;
    const headline = ({nodalix:'Tu ordenador. Con otra perspectiva.',vortia:'Ingeniería de fluidos sin cajas negras.',vinilo:'Escucha como tú quieras.',lienzo:'Un espacio para crear.'})[app.id];
    return `<article class="product-card product-card--${e(app.id)}">
      <div class="product-card-inner"><div class="product-card-top"><div class="product-id">${iconImg(app, 'card-icon')}<div><strong>${e(app.name)}</strong><span>${e(app.category)}</span></div></div><span class="tag ${e(app.statusKind)}">${e(app.statusKind==='active'?'En desarrollo':'Experimental')}</span></div>
      <h3>${e(headline)}</h3><p>${e(app.description)}</p></div>
      <div class="product-card-image">${screen}</div>
      <div class="product-card-bottom"><span>${e(app.platforms)}</span><span class="view">Conocer ${e(app.name)} ↗</span></div>
      <a class="cover-link" href="${safeUrl(app.domain)}" aria-label="Conocer ${e(app.name)}"></a>
    </article>`;
  };
  return shell({
    title: 'Nodalia — Aplicaciones de escritorio y Nodalix OS',
    description: 'Nodalia reúne Vortia, Vinilo, Lienzo y Nodalix OS: software independiente, código abierto y experiencias de escritorio cuidadas.',
    canonical: brand.portal + '/',
    preview: vinilo.previews[0][0],
    active: 'portal',
    content: `<section class="home-hero"><div class="container hero-layout">
      <div class="hero-copy">
        <span class="kicker">NODALIA / SOFTWARE INDEPENDIENTE</span>
        <h1 class="hero-title">Software que<br/>se siente<br/><span>propio.</span></h1>
        <p class="hero-lead">Un sistema operativo Linux y aplicaciones para crear, investigar y disfrutar. Herramientas con personalidad, desarrolladas a la vista de todos.</p>
        <div class="actions">${A(`${brand.portal}/#aplicaciones`, 'Explorar aplicaciones <span class="btn-icon" aria-hidden="true">↗</span>', 'btn btn-primary')}${A(nodalix.domain, 'Descubrir Nodalix OS', 'btn btn-secondary')}</div>
        <div class="hero-trust"><span><strong>04</strong> proyectos independientes</span><span>·</span><span>Código abierto</span><span>·</span><span>Desarrollo activo</span></div>
      </div>
      <div class="hero-stage" aria-label="Capturas de las aplicaciones Vinilo y Lienzo">
        <div class="stage-halo"></div>
        <div class="window window-main"><div class="window-bar"><i></i><i></i><i></i><b>Vinilo</b><span class="window-label">Reproductor para Linux</span></div><div class="window-body"><img src="${previewUrl(vinilo)}" alt="Captura real de la biblioteca musical de Vinilo" decoding="async" loading="eager"/></div></div>
        <div class="window window-small"><div class="window-bar"><i></i><i></i><i></i><b>Lienzo</b></div><div class="window-body"><img src="${previewUrl(lienzo)}" alt="Captura real de la herramienta de niveles de Lienzo" decoding="async" loading="eager"/></div></div>
        <div class="stage-caption"><strong>Aplicaciones reales.</strong> Capturas de los repositorios oficiales.</div>
      </div>
    </div></section>
    <div class="hero-stats"><div class="container hero-stats-inner"><div class="hero-stat"><b>04</b><span>proyectos en desarrollo</span></div><div class="hero-stat"><b>01</b><span>distribución Linux</span></div><div class="hero-stat"><b>100%</b><span>repositorios públicos</span></div></div></div>
    <section class="catalogue" id="aplicaciones"><div class="container"><div class="catalogue-top"><div><span class="eyebrow">NUESTRO SOFTWARE</span><h2>Cuatro ideas.<br/>Una forma de hacerlas.</h2></div><p>Aplicaciones que resuelven problemas concretos. Conoce cada proyecto, comprueba su estado real y accede a la documentación.</p></div><div class="product-grid">${['nodalix','vinilo','vortia','lienzo'].map(id=>card(data[id])).join('')}</div></div></section>
    <section class="spotlight"><div class="container spotlight-content"><div><span class="eyebrow">NODALIX OS / LINUX PARA PERSONAS</span><h2>El sistema operativo también cuenta.</h2><p>Un escritorio GNOME integrado sobre Arch Linux, con herramientas propias y una ISO para instalarlo desde USB. Sin ocultar los requisitos ni el estado de desarrollo.</p><div class="actions">${A(nodalix.domain, 'Conocer Nodalix OS <span class="btn-icon" aria-hidden="true">↗</span>', 'btn btn-primary')}${A(`${nodalix.domain}/#descargas`, 'Descargas e instalación', 'btn btn-secondary')}</div></div><div class="spotlight-art"><div class="ring"></div><img src="${safeUrl(nodalix.icon)}" alt="Logo de Nodalix OS" width="160" height="160" loading="lazy"/><span class="technical">ARCH LINUX / GNOME / WAYLAND</span></div></div></section>
    <section class="values"><div class="container value-row"><div class="value"><b>Código abierto.</b><p>El desarrollo, las incidencias y las versiones se pueden seguir directamente en GitHub.</p></div><div class="value"><b>Diseñado para escritorio.</b><p>Herramientas pensadas para el ordenador, no simples envoltorios web.</p></div><div class="value"><b>Sin promesas vacías.</b><p>El estado de cada proyecto y sus limitaciones se explican antes de descargarlo.</p></div></div></section>`
  });
}
function product(app) {
  const title = ({vortia:'La simulación de fluidos, a tu alcance.',vinilo:'Disfruta de toda tu música.',lienzo:'Un lugar para crear sin límites.',nodalix:'Tu ordenador. Tu sistema.'})[app.id] || app.headline;
  const preview = app.previews.length
    ? `<figure><img src="${safeUrl(app.previews[0][0])}" alt="${e(app.previews[0][1])}" loading="eager" decoding="async"/><figcaption>${e(app.previews[0][1])} · Captura publicada por el proyecto</figcaption></figure>`
    : `<div class="product-placeholder"><span class="kicker">${e(app.technology)}</span><div>${iconImg(app,'placeholder-icon')}<strong>${e(app.name)}</strong><p>Proyecto en desarrollo. No se presenta una captura artificial de la aplicación.</p></div></div>`;
  return shell({
    title: `${app.name} — ${app.eyebrow} | Nodalia`,
    description: app.description,
    canonical: app.domain + '/',
    preview: app.previews[0]?.[0] || app.icon,
    accent: app.accent,
    content: `<section class="product-hero"><div class="container product-hero-inner"><div>
      <div class="product-heading">${iconImg(app,'product-icon')}<div><strong>${e(app.name)}</strong><span class="status-text">${e(app.status)}</span></div></div>
      <span class="eyebrow">${e(app.eyebrow)}</span><h1>${e(title)}</h1><p class="lede">${e(app.description)}</p>
      <div class="actions">${app.id==='nodalix' ? '<a href="#descargas" class="btn btn-primary">Descargas de Nodalix OS <span class="btn-icon" aria-hidden="true">↓</span></a>' : A(`${app.repo}/releases`, 'Ver versiones y descargas <span class="btn-icon" aria-hidden="true">↗</span>', 'btn btn-primary', true)}${A(app.repo, 'Código en GitHub', 'btn btn-secondary', true)}</div>
      <div class="product-meta"><span class="pill">${e(app.platforms)}</span><span class="pill">${e(app.technology)}</span></div></div>
      <div class="product-preview">${preview}</div></div></section>
      <section class="section features"><div class="container"><span class="eyebrow">FUNCIONES DEL PROYECTO</span><h2>Diseñado para hacer más.</h2><div class="feature-grid">${app.features.map(([h,d],i)=>`<article class="feature"><span class="num">0${i+1} / ${e(app.name.toUpperCase())}</span><h3>${e(h)}</h3><p>${e(d)}</p></article>`).join('')}</div><div class="notice"><strong>Estado y requisitos:</strong> ${e(app.limitation)}</div></div></section>
      ${app.id==='nodalix' ? nodalixDownloads(app) : ''}
      ${app.previews.length ? `<section class="section"><div class="container"><span class="eyebrow">VISTAS DE LA APLICACIÓN</span><h2>Conoce ${e(app.name)}.</h2><div class="gallery">${app.previews.map(([url,alt])=>`<figure><img src="${safeUrl(url)}" alt="${e(alt)}" loading="lazy" decoding="async"/><figcaption>${e(alt)}</figcaption></figure>`).join('')}</div></div></section>` : ''}
      <section class="section product-outro"><div class="container"><span class="eyebrow">CÓDIGO Y DOCUMENTACIÓN</span><h2>Forma parte del desarrollo.</h2><p>Consulta el código, los cambios y las publicaciones reales en GitHub. La disponibilidad de paquetes instalables depende del estado de cada aplicación.</p><div class="actions">${A(app.repo,'Explorar repositorio ↗','btn btn-primary',true)}${A(`${app.repo}/releases`,'Versiones publicadas','btn btn-secondary',true)}</div></div></section>`
  });
}
function nodalixDownloads(app) {
  return `<section class="section iso-section" id="descargas"><div class="container">
    <span class="eyebrow">Nodalix OS / x86_64</span>
    <h2>Descarga la imagen de instalación</h2>
    <p class="iso-intro">Consigue la ISO oficial, comprueba su integridad y grábala en una memoria USB. Las versiones se consultan directamente en la publicación oficial de Nodalix OS.</p>
    <div class="download-panel" aria-live="polite">
      <div><span class="tag">Canal estable</span><h3 id="release-name">Buscando ISO publicada…</h3><p id="release-subtitle">Consultando las versiones oficiales.</p></div>
      <div id="release-actions" class="actions"></div>
      <dl class="release-spec"><div><dt>Arquitectura</dt><dd>x86_64</dd></div><div><dt>Tamaño</dt><dd id="release-size">—</dd></div><div><dt>Versión</dt><dd id="release-version">—</dd></div></dl>
      <div id="checksum-block" class="checksum" hidden><strong>SHA-256 de la ISO</strong><code id="release-sha"></code><p>Comprueba que este hash coincide con el archivo descargado antes de instalar.</p></div>
      <p id="release-disclaimer" class="small-label">Nunca se mostrará un botón de ISO directa para un archivo que no exista en la publicación.</p>
    </div>
    <div class="download-links"><p>¿Buscas otra versión o un canal de pruebas?</p>
      ${A(`${app.repo}/releases`, 'Ver todas las versiones y betas ↗', 'text-link', true)}
      ${A(`${app.repo}/blob/main/docs/iso.md`, 'Documentación oficial de las ISO ↗', 'text-link', true)}</div>
  </div></section>
  <section class="section install-section" id="instalacion"><div class="container"><span class="eyebrow">Instalación</span><h2>De la descarga al primer arranque</h2>
    <div class="feature-grid">
      <article class="feature"><span class="num">01 / DESCARGAR</span><h3>Obtén la ISO completa</h3><p>Descarga la imagen verificada. Si GitHub la distribuye en partes, utiliza el descargador oficial para reconstruirla.</p></article>
      <article class="feature"><span class="num">02 / GRABAR USB</span><h3>Crea tu USB de arranque</h3><p>Usa una herramienta de grabación de imágenes, como Balena Etcher o Rufus. Al grabar se borrará el contenido de la unidad USB.</p></article>
      <article class="feature"><span class="num">03 / INSTALAR</span><h3>Inicia Nodalix OS</h3><p>Arranca el PC desde el USB, entra al entorno live y sigue el instalador. Revisa el disco de destino antes de confirmar.</p></article>
    </div>
    <div class="notice"><strong>Antes de instalar:</strong> realiza una copia de seguridad. Nodalix necesita Internet durante la instalación y su ISO actual no permite arrancar con Secure Boot activado. Una instalación sobre el disco equivocado puede borrar datos.</div>
    <p class="small-label">Verificación en Linux: <code>sha256sum archivo.iso</code> · macOS: <code>shasum -a 256 archivo.iso</code> · Windows PowerShell: <code>Get-FileHash archivo.iso -Algorithm SHA256</code></p>
  </div></section>
  <script src="/nodalix-releases.js" defer></script>`;
}

function sitemap(domain) {return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${e(domain)}/</loc></url></urlset>\n`}
async function build(site) {
  const dir = path.join(root, 'dist', site);
  await rm(dir, { recursive: true, force: true });
  await mkdir(dir, { recursive: true });
  const app = apps.find((item) => item.id === site);
  const content = site === 'portal' ? home() : product(app);
  const baseUrl = site === 'portal' ? brand.portal : app.domain;
  await Promise.all([
    writeFile(path.join(dir, 'index.html'), content, 'utf8'),
    writeFile(path.join(dir, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${baseUrl}/sitemap.xml\n`, 'utf8'),
    writeFile(path.join(dir, 'sitemap.xml'), sitemap(baseUrl), 'utf8'),
    writeFile(path.join(dir, '404.html'), shell({title:'Página no encontrada | Nodalia',description:'No hemos encontrado esa página.',canonical:baseUrl+'/',content:`<section class="hero"><div class="container"><span class="eyebrow">Error 404</span><h1>Esta página no existe.</h1><p>Prueba a volver al catálogo de aplicaciones.</p><div class="actions">${A(brand.portal, 'Volver al inicio','btn btn-primary')}</div></div></section>`}), 'utf8'),
    copyFile(path.join(root, 'assets', 'logo.svg'), path.join(dir, 'logo.svg')),
    copyFile(path.join(root, 'assets', 'nodalia-wordmark.svg'), path.join(dir, 'nodalia-wordmark.svg')),
    copyFile(path.join(root, 'assets', 'nodalia-mark.svg'), path.join(dir, 'nodalia-mark.svg')),
    copyFile(path.join(root, 'assets', 'styles.css'), path.join(dir, 'styles.css')),
    writeFile(path.join(dir, cssFileName), cssSource),
    ...(site === 'nodalix' ? [
      copyFile(path.join(root, 'assets', 'nodalix-releases.js'), path.join(dir, 'nodalix-releases.js')),
      copyFile(path.join(root, 'data', 'nodalix-iso-releases.json'), path.join(dir, 'releases.json')),
    ] : []),
  ]);
  console.log(`✓ ${site}: ${path.relative(root, dir)}`);
}
for (const site of selected) await build(site);
