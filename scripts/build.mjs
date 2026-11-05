import { mkdir, rm, writeFile, copyFile } from 'node:fs/promises';
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

const e = (s) => String(s ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
const safeUrl = (s) => {
  const u = new URL(s);
  if (!['https:', 'mailto:'].includes(u.protocol)) throw new Error(`URL no permitida: ${s}`);
  return e(u.href);
};
const A = (url, text, className = '', external = false) => `<a href="${safeUrl(url)}" class="${e(className)}"${external ? ' target="_blank" rel="noopener noreferrer"' : ''}>${text}</a>`;
const iconImg = (app, cls = 'app-icon') => `<img class="${e(cls)}" src="${safeUrl(app.icon)}" alt="Icono de ${e(app.name)}" loading="lazy" decoding="async" />`;
const nav = (active = '') => `<header class="topbar"><div class="container topbar-inner">
  ${A(brand.portal, '<img src="/nodalia-wordmark.svg" alt="Nodalia" width="150" height="40"/>', 'brand')}
  <nav class="nav" aria-label="Navegación principal">
    ${A(`${brand.portal}/#aplicaciones`, 'Proyectos', active === 'portal' ? '' : 'optional')}
    ${A('https://nodalix.getnodalia.com', 'Nodalix OS', 'optional')}
    ${A(brand.github, 'GitHub ↗', 'outline', true)}
  </nav>
</div></header>`;
const footer = () => `<footer class="footer"><div class="container footer-content">
  <div><a class="brand" href="${safeUrl(brand.portal)}"><img src="/nodalia-wordmark.svg" width="210" height="58" alt="Nodalia"/></a>
    <p>Software independiente. Consulta el progreso de cada proyecto en sus repositorios.</p>
    <p>© ${new Date().getUTCFullYear()} Nodalia</p>
  </div>
  <nav class="footer-links" aria-label="Enlaces del pie de página">
    ${A(`${brand.portal}/#aplicaciones`, 'Proyectos')}
    ${A('https://nodalix.getnodalia.com', 'Nodalix OS')}
    ${A(brand.github, 'GitHub ↗', '', true)}
    ${A(`mailto:${brand.email}`, 'Contacto')}
  </nav>
</div></footer>`;
const shell = ({title, description, canonical, content, accent = '', preview = '', active = ''}) => `<!doctype html>
<html lang="es"><head>
<meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta name="theme-color" content="#f7f7f3"/><meta name="color-scheme" content="light"/>
<title>${e(title)}</title><meta name="description" content="${e(description)}"/>
<link rel="canonical" href="${safeUrl(canonical)}"/>
<meta property="og:type" content="website"/><meta property="og:title" content="${e(title)}"/>
<meta property="og:description" content="${e(description)}"/><meta property="og:url" content="${safeUrl(canonical)}"/>
${preview ? `<meta property="og:image" content="${safeUrl(preview)}"/>` : ''}
<meta name="twitter:card" content="${preview ? 'summary_large_image' : 'summary'}"/>
<link rel="icon" type="image/svg+xml" href="/nodalia-mark.svg"/>
<link rel="stylesheet" href="/styles.css"/>
</head><body class="${e(accent ? `accent-${accent}` : '')}"><a class="visually-hidden" href="#contenido">Saltar al contenido</a>
${nav(active)}<main id="contenido">${content}</main>${footer()}</body></html>`;

function home() {
  const rows = apps.map((app, i) => `<article class="project-row">
    <span class="project-number">${String(i+1).padStart(2, '0')}</span>
    <div class="project-title">
      ${iconImg(app)}
      <div><h3>${e(app.name)}</h3><span class="project-category">${e(app.category)}</span></div>
    </div>
    <p>${e(app.description)}</p>
    <span class="project-state">${e(app.status)}</span>
    <a class="project-link" href="${safeUrl(app.domain)}" aria-label="Ver la web de ${e(app.name)}">↗</a>
  </article>`).join('');
  const os = apps.find((app) => app.id === 'nodalix');
  return shell({
    title: 'Nodalia — Nodalix OS, Vortia, Vinilo y Lienzo',
    description: 'Nodalia reúne cuatro proyectos abiertos: Nodalix OS, Vortia, Vinilo y Lienzo. Descubre el código, las funciones y las versiones disponibles.',
    canonical: brand.portal + '/',
    active: 'portal',
    content: `<section class="home-hero"><div class="container">
      <div class="intro-meta"><span>NODALIA / SOFTWARE INDEPENDIENTE</span><span>2026 — EN DESARROLLO</span></div>
      <div class="intro-main">
        <h1>Un Linux.<br/><em>Tres aplicaciones.</em></h1>
        <div class="intro-copy">
          <p>Nodalix OS, Vortia, Vinilo y Lienzo. Cuatro proyectos de software que se desarrollan de forma abierta. Sin promesas de funciones que aún no existen.</p>
          <div class="actions">
            ${A(`${brand.portal}/#aplicaciones`, 'Ver los proyectos ↘', 'btn btn-primary')}
            ${A(brand.github, 'Código en GitHub ↗', 'btn btn-secondary', true)}
          </div>
        </div>
      </div>
      <div class="intro-bottom"><span>DESARROLLO ABIERTO / VERSIONES Y CÓDIGO DISPONIBLES EN CADA REPOSITORIO</span><span>DESLIZA ↓</span></div>
    </div></section>
    <section id="aplicaciones" class="project-index"><div class="container">
      <div class="section-heading">
        <div><span class="eyebrow">01 — CATÁLOGO</span><h2>Los proyectos.</h2></div>
        <p>Cada producto tiene su propio ritmo de desarrollo. Consulta su estado, la documentación y las versiones que realmente están publicadas.</p>
      </div>
      <div class="project-list">${rows}</div>
    </div></section>
    <section class="nodalix-feature"><div class="container">
      <div class="nodalix-feature-inner">
        <div>
          <span class="eyebrow">02 — NODALIX OS</span>
          <h2>Un escritorio Linux. Un proyecto completo.</h2>
          <p>Basado en Arch Linux. GNOME, Wayland, herramientas del sistema y un instalador para PC x86_64. Consulta las ISO disponibles y los requisitos antes de instalar.</p>
          ${A(os.domain, 'Nodalix OS y sus descargas ↗', 'btn btn-primary')}
        </div>
        <div class="nodalix-feature-aside"><img src="${safeUrl(os.icon)}" alt="Icono de Nodalix OS"/><span>ARCH LINUX<br/>GNOME / WAYLAND<br/>X86_64</span></div>
      </div>
    </div></section>
    <div class="value-band"><div class="container value-row">
      <div><h3>Repositorios públicos</h3><p>Consulta el código, los cambios y los problemas abiertos sin depender de una presentación comercial.</p></div>
      <div><h3>Software de escritorio</h3><p>Aplicaciones desarrolladas con tecnologías nativas y objetivos concretos, no interfaces web disfrazadas.</p></div>
      <div><h3>Estado transparente</h3><p>Las limitaciones, dependencias y versiones se documentan en la página de cada proyecto.</p></div>
    </div></div>`
  });
}
function product(app) {
  const headlines = {
    vortia: 'CFD con OpenFOAM.',
    vinilo: 'Tu música, en Linux.',
    lienzo: 'Un editor de imágenes con capas.',
    nodalix: 'Linux, con un escritorio integrado.'
  };
  const preview = app.previews.length
    ? `<figure><img src="${safeUrl(app.previews[0][0])}" alt="${e(app.previews[0][1])}" loading="eager" decoding="async"/><figcaption>${e(app.previews[0][1])} · Captura del repositorio del proyecto</figcaption></figure>`
    : `<div class="product-placeholder">
        <span class="placeholder-kicker">${e(app.platforms)} / ${e(app.technology)}</span>
        <div><img src="${safeUrl(app.icon)}" alt=""/><strong>${e(app.name)}</strong>
        <p>No hay capturas oficiales disponibles en la documentación del proyecto. Consulta el repositorio para conocer su estado actual.</p></div>
      </div>`;
  return shell({
    title: `${app.name} — ${app.eyebrow} | Nodalia`,
    description: app.description,
    canonical: app.domain + '/',
    preview: app.previews[0]?.[0] || app.icon,
    accent: app.accent,
    content: `<section class="product-hero"><div class="container hero-grid">
      <div>
        <div class="product-heading">${iconImg(app, '')}<div><strong>${e(app.name)}</strong><span class="status-text">${e(app.status)}</span></div></div>
        <span class="eyebrow">${e(app.eyebrow)}</span>
        <h1>${e(headlines[app.id] ?? app.headline)}</h1>
        <p class="lede">${e(app.description)}</p>
        <div class="actions">${app.id === 'nodalix' ? '<a href="#descargas" class="btn btn-primary">Ir a las descargas ↓</a>' : A(app.repo, e(app.cta) + ' ↗', 'btn btn-primary', true)}
          ${A(`${brand.portal}/#aplicaciones`, 'Otros proyectos', 'btn btn-secondary')}
        </div>
        <div class="product-meta"><span class="pill">${e(app.platforms)}</span><span class="pill">${e(app.technology)}</span></div>
      </div>
      <div class="product-preview">${preview}</div>
    </div></section>
    <section class="section"><div class="container">
      <span class="eyebrow">01 — FUNCIONES</span><h2>Qué incluye.</h2>
      <div class="feature-grid">${app.features.map(([h,d],i) => `<article class="feature"><span class="num">${String(i+1).padStart(2,'0')} / ${e(app.name.toUpperCase())}</span><h3>${e(h)}</h3><p>${e(d)}</p></article>`).join('')}</div>
      <div class="notice"><strong>Estado y requisitos.</strong> ${e(app.limitation)}</div>
    </div></section>
    ${app.id === 'nodalix' ? nodalixDownloads(app) : ''}
    ${app.previews.length ? `<section class="section"><div class="container"><span class="eyebrow">02 — CAPTURAS REALES</span><h2>Dentro de ${e(app.name)}.</h2>
      <div class="gallery">${app.previews.map(([url,alt]) => `<figure><img src="${safeUrl(url)}" alt="${e(alt)}" loading="lazy" decoding="async"/><figcaption>${e(alt)}</figcaption></figure>`).join('')}</div>
    </div></section>` : ''}
    <section class="section"><div class="container">
      <span class="eyebrow">CÓDIGO Y VERSIONES</span>
      <h2>Consulta el proyecto.</h2>
      <p>El repositorio contiene el código, la documentación y el historial de desarrollo. Comprueba las publicaciones disponibles antes de descargar o instalar.</p>
      <div class="actions">${A(app.repo, 'Código y documentación ↗', 'btn btn-primary', true)}${A(`${app.repo}/releases`, 'Versiones publicadas ↗', 'btn btn-secondary', true)}</div>
    </div></section>`
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
    ...(site === 'nodalix' ? [
      copyFile(path.join(root, 'assets', 'nodalix-releases.js'), path.join(dir, 'nodalix-releases.js')),
      copyFile(path.join(root, 'data', 'nodalix-iso-releases.json'), path.join(dir, 'releases.json')),
    ] : []),
  ]);
  console.log(`✓ ${site}: ${path.relative(root, dir)}`);
}
for (const site of selected) await build(site);
