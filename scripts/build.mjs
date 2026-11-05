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
  ${A(brand.portal, `<img src="/logo.svg" alt="" width="38" height="38"/><span>Nodalia</span><small>APPS</small>`, 'brand')}
  <nav class="nav" aria-label="Navegación principal">
   ${A(`${brand.portal}/#aplicaciones`, 'Aplicaciones', active === 'portal' ? '' : 'optional')}
   ${A(brand.github, 'GitHub', 'optional', true)}
   ${A(brand.portal, 'Explorar', 'outline')}
  </nav>
 </div></header>`;
const footer = () => `<footer class="footer"><div class="container footer-content"><div><div class="brand"><img src="/logo.svg" alt="" width="38" height="38"/><span>Nodalia</span></div><p>Software creado con cuidado, abierto a nuevas ideas.</p><p>© ${new Date().getUTCFullYear()} Nodalia · Proyectos independientes, no afiliados a marcas de terceros.</p></div><div class="footer-links">${A(brand.portal, 'Inicio')}${A(brand.github, 'GitHub', '', true)}${A(`mailto:${brand.email}`, 'Contacto')}</div></div></footer>`;
const shell = ({title, description, canonical, content, accent = '', preview = '', active = ''}) => `<!doctype html>
<html lang="es"><head>
<meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta name="theme-color" content="#070a13"/><meta name="color-scheme" content="dark"/>
<title>${e(title)}</title><meta name="description" content="${e(description)}"/>
<link rel="canonical" href="${safeUrl(canonical)}"/>
<meta property="og:type" content="website"/><meta property="og:title" content="${e(title)}"/>
<meta property="og:description" content="${e(description)}"/><meta property="og:url" content="${safeUrl(canonical)}"/>
${preview ? `<meta property="og:image" content="${safeUrl(preview)}"/>` : ''}
<meta name="twitter:card" content="${preview ? 'summary_large_image' : 'summary'}"/>
<link rel="icon" type="image/svg+xml" href="/logo.svg"/>
<link rel="stylesheet" href="/styles.css"/>
</head><body class="${e(accent ? `accent-${accent}` : '')}"><a class="visually-hidden" href="#contenido">Saltar al contenido</a>
${nav(active)}<main id="contenido">${content}</main>${footer()}</body></html>`;

function home() {
  const card = (app) => `<article class="app-card"><div>${iconImg(app)}</div><span class="category">${e(app.category)}</span><h3>${e(app.name)}</h3><p>${e(app.description)}</p><div class="card-foot"><span class="tag ${e(app.statusKind)}">${e(app.status)}</span>${A(app.domain, '<span class="arrow" aria-hidden="true">↗</span><span class="visually-hidden">Visitar '+e(app.name)+'</span>')}</div></article>`;
  const tile = (app) => `<div class="art-tile">${iconImg(app, '')}<div><b>${e(app.name)}</b><span>${e(app.category)}</span></div></div>`;
  return shell({
    title: 'Nodalia — Software y sistemas operativos con identidad propia',
    description: 'Descubre las aplicaciones y sistemas operativos de Nodalia: Vortia, Vinilo, Lienzo y Nodalix OS para Linux.',
    canonical: brand.portal + '/',
    active: 'portal',
    content: `<section class="hero"><div class="container hero-grid"><div>
      <span class="eyebrow">Software con identidad propia</span>
      <h1>Una nueva forma de hacer las cosas.</h1>
      <p class="lede">Software para crear, investigar, disfrutar y trabajar. Desde aplicaciones de escritorio hasta un sistema operativo Linux completo.</p>
      <div class="actions">${A(`${brand.portal}/#aplicaciones`, 'Descubrir aplicaciones <span aria-hidden="true">↗</span>', 'btn btn-primary')}${A(brand.github, 'Explorar GitHub', 'btn btn-secondary', true)}</div>
      <p class="note">Proyectos open source · Desarrollo continuo</p></div>
      <div class="hero-art" aria-label="Vista del catálogo de aplicaciones Nodalia"><div class="orb"></div><div class="art-panel"><div class="panel-top"><i class="dot"></i><i class="dot"></i><i class="dot"></i><span class="panel-label">NODALIA / APPS</span></div><div class="art-grid">${apps.map(tile).join('')}</div></div><div class="floating-chip">Un ecosistema en crecimiento ✦</div></div>
    </div></section>
    <section class="section" id="aplicaciones"><div class="container"><div class="section-head"><div><span class="eyebrow">El catálogo</span><h2>Aplicaciones y sistemas operativos</h2></div><p>Cada proyecto tiene su propia identidad, documentación abierta, descargas y un espacio dentro de Nodalia.</p></div><div class="app-grid">${apps.map(card).join('')}</div></div></section>
    <div class="value-band"><div class="container value-row"><div><span class="value-icon">◇</span><h3>Código abierto</h3><p>Consulta el código, sigue el desarrollo y participa en los proyectos.</p></div><div><span class="value-icon">◎</span><h3>Experiencias nativas</h3><p>Aplicaciones construidas pensando en las posibilidades del escritorio.</p></div><div><span class="value-icon">✧</span><h3>En evolución</h3><p>Las funciones, plataformas y versiones dependen del estado de cada proyecto.</p></div></div></div>`
  });
}
function product(app) {
  const preview = app.id === 'nodalix'
    ? `<div class="nodalix-concept" role="img" aria-label="Ilustración conceptual del escritorio Nodalix OS, no una captura real"><div class="desktop-top"><span>●</span><span>NODALIX / WAYLAND</span><span>◈ ◦ ●</span></div><div class="desktop-centre"><img src="${safeUrl(app.icon)}" alt=""/><strong>Nodalix OS</strong><span>Linux, integrado.</span></div><span class="desktop-caption">Concepto visual · No es una captura del sistema</span></div>`
    : app.previews.length
    ? `<img src="${safeUrl(app.previews[0][0])}" alt="${e(app.previews[0][1])}" loading="eager" decoding="async"/>`
    : `<div class="concept" role="img" aria-label="Ilustración conceptual abstracta de una malla de simulación"><div class="concept-header"><i></i><i></i><i></i></div><div class="concept-main"><div class="concept-geometry"></div></div><span class="concept-caption">Visualización conceptual · No es una captura del programa</span></div>`;
  return shell({
    title: `${app.name} — ${app.eyebrow} | Nodalia`,
    description: app.description,
    canonical: app.domain + '/',
    preview: app.previews[0]?.[0] || app.icon,
    accent: app.accent,
    content: `<section class="product-hero"><div class="container hero-grid"><div>
      <div class="product-heading">${iconImg(app, '')}<div><strong>${e(app.name)}</strong><span class="status-text">${e(app.status)}</span></div></div>
      <span class="eyebrow">${e(app.eyebrow)}</span>
      <h1>${e(app.headline)}</h1><p class="lede">${e(app.description)}</p>
      <div class="actions">${app.id === 'nodalix' ? '<a href="#descargas" class="btn btn-primary">Descargar ISO <span aria-hidden="true">↓</span></a>' : A(app.repo, e(app.cta) + ' <span aria-hidden="true">↗</span>', 'btn btn-primary', true)}${A(brand.portal, 'Más aplicaciones', 'btn btn-secondary')}</div>
      <div class="product-meta"><span class="pill">${e(app.platforms)}</span><span class="pill">${e(app.technology)}</span></div></div>
      <div class="product-preview">${preview}</div></div></section>
      <section class="section"><div class="container"><span class="eyebrow">Pensado para tu escritorio</span><h2>Lo que hace diferente a ${e(app.name)}</h2><div class="feature-grid">${app.features.map(([h, d], i) => `<article class="feature"><span class="num">0${i + 1} / CARACTERÍSTICA</span><h3>${e(h)}</h3><p>${e(d)}</p></article>`).join('')}</div>
      <div class="notice"><strong>Estado y requisitos:</strong> ${e(app.limitation)}</div></div></section>
      ${app.id === 'nodalix' ? nodalixDownloads(app) : ''}
      ${app.previews.length ? `<section class="section"><div class="container"><span class="eyebrow">La aplicación por dentro</span><h2>Una mirada a ${e(app.name)}</h2><div class="gallery">${app.previews.map(([url, alt]) => `<figure><img src="${safeUrl(url)}" alt="${e(alt)}" loading="lazy" decoding="async"/><figcaption>${e(alt)}</figcaption></figure>`).join('')}</div></div></section>` : ''}
      <section class="section"><div class="container"><span class="eyebrow">Participa</span><h2>Construido de forma abierta.</h2><p>Lee la documentación, consulta las versiones disponibles y sigue el desarrollo directamente en el repositorio.</p><div class="actions">${A(app.repo, 'Abrir repositorio ↗', 'btn btn-primary', true)}${A(`${app.repo}/releases`, 'Ver versiones', 'btn btn-secondary', true)}</div><p class="small-label">La disponibilidad de descargas compiladas varía según la aplicación.</p></div></section>`
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
    copyFile(path.join(root, 'assets', 'styles.css'), path.join(dir, 'styles.css')),
    ...(site === 'nodalix' ? [
      copyFile(path.join(root, 'assets', 'nodalix-releases.js'), path.join(dir, 'nodalix-releases.js')),
      copyFile(path.join(root, 'data', 'nodalix-iso-releases.json'), path.join(dir, 'releases.json')),
    ] : []),
  ]);
  console.log(`✓ ${site}: ${path.relative(root, dir)}`);
}
for (const site of selected) await build(site);
