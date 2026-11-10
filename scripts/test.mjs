import { strict as assert } from 'node:assert';
import { readFile, stat } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
execFileSync(process.execPath, ['scripts/build.mjs'], { cwd: root, stdio: 'pipe' });
const sourceCss = await readFile(path.join(root, 'assets', 'styles.css'), 'utf8');
const hash = createHash('sha256').update(sourceCss).digest('hex').slice(0, 12);
const versionedCss = `styles.${hash}.css`;
for (const id of ['portal','vortia','vinilo','lienzo','nodalix']) {
  const dir = path.join(root,'dist',id);
  const page = await readFile(path.join(dir,'index.html'),'utf8');
  const css = await readFile(path.join(dir, versionedCss),'utf8');
  assert.ok(page.includes(`href="/${versionedCss}"`), `Stale or missing CSS reference in ${id}`);
  assert.equal(css, sourceCss, `Unexpected CSS content in ${id}`);
  const sitemap = await readFile(path.join(dir,'sitemap.xml'),'utf8');
  const wordmark = await readFile(path.join(dir,'nodalia-wordmark.svg'),'utf8');
  const mark = await readFile(path.join(dir,'nodalia-mark.svg'),'utf8');
  assert.match(page,/<html lang="es">/);
  assert.match(page,/rel="canonical"/);
  assert.match(page,/<meta name="description"/);
  assert.match(page,/nodalia-wordmark\.svg/);
  assert.match(page,/class="topbar"/);
  assert.match(page,/class="footer"/);
  assert.match(css,/@media\(max-width:600px\)/);
  assert.match(css,/prefers-reduced-motion/);
  assert.match(wordmark,/<svg[^>]+viewBox/);
  assert.match(mark,/<svg[^>]+viewBox/);
  assert.match(sitemap,/<urlset/);
  assert.ok((await stat(path.join(dir,'404.html'))).size>100);
  if (id!=='portal') {
    assert.match(page,new RegExp(`https://${id}\\.getnodalia\\.com`));
    assert.match(page,/class="product-hero"/);
    assert.match(page,/class="product-preview[ "]/);
    assert.match(page,/Estado y requisitos/);
    assert.ok(page.includes('id="ficha"') && page.includes('id="faq"'), `Faltan ficha o FAQ en ${id}`);
  }
}
const portal=await readFile(path.join(root,'dist/portal/index.html'),'utf8');
for(const name of ['Vortia','Vinilo','Lienzo','Nodalix OS'])assert.match(portal,new RegExp(name));
assert.match(portal,/hero-stage/);
for (const id of ['ecosistema','autor','faq']) assert.ok(portal.includes(`id="${id}"`), `Portal sin sección ${id}`);
assert.ok(portal.includes('id="en-camino"'), 'Portal sin la sección de apps en camino');
for (const key of ['luz','pulso','pliego','pluma','toma','papel','letra','celdas','lamina','forja','torno','brujula','buzon']) { assert.ok(portal.includes(`/app-icons/${key}.png`), `Falta ${key} en apps en camino`); assert.ok((await stat(path.join(root, 'dist/portal/app-icons', `${key}.png`))).size > 1000, `Falta el icono de ${key}`); }
assert.ok(portal.includes('id="studium"') && portal.includes('/studium/archive/refs/tags/') && portal.includes('studium mcp'), 'Portal sin descarga o instrucciones de Studium');
assert.match(portal,/href="\/favicon\.svg\?v=[0-9a-f]+"/);
assert.match(portal,/"@type":"FAQPage"/);
for (const url of ['https://www.instagram.com/getnodalia/', 'https://x.com/getnodalia']) assert.ok(portal.split(url).length > 3, `Falta el enlace a ${url} en pie, contacto o metadatos`);
for (const asset of ['favicon.svg','favicon.ico','apple-touch-icon.png','motion.js']) assert.ok((await stat(path.join(root,'dist/portal',asset))).size>100, `Falta ${asset}`);
assert.match(portal,/class="hero-title"/);
assert.match(sourceCss,/\.hero-title\{/);
assert.match(portal,/width="120" height="120"/);
assert.match(portal,/shot-main/);
assert.match(portal,/shot-secondary/);
assert.match(portal,/product-grid/);
assert.match(portal,/spotlight/);
assert.match(portal,/docs\/screenshots\/library\.webp/);
assert.match(portal,/docs\/images\/screenshots\/levels\.png/);
assert.doesNotMatch(portal,/floating-chip|art-panel|concept-geometry|window-bar/);
const iso=await readFile(path.join(root,'dist/nodalix/index.html'),'utf8');
assert.match(iso,/id="descargas"/);
assert.match(iso,/id="release-actions"/);
assert.match(iso,/nodalix-releases\.js/);
assert.match(iso,/Secure Boot/);
const releases=JSON.parse(await readFile(path.join(root,'dist/nodalix/releases.json'),'utf8'));
assert.equal(releases.schema,1);
assert.ok(Array.isArray(releases.isos));
for(const item of releases.isos){
 assert.match(item.sha256,/^[0-9a-f]{64}$/i);
 assert.ok(item.sizeBytes>0);
 assert.match(item.url,/^https:\/\/(downloads\.getnodalia\.com|github\.com)\//);
}
const vortiaHtml = await readFile(path.join(root, 'dist/vortia/index.html'), 'utf8');
for (const id of [
  'vortia-primary-download', 'vortia-downloads', 'vortia-linux-link',
  'vortia-mac-link', 'vortia-linux-sha', 'vortia-mac-sha'
]) {
  assert.ok(vortiaHtml.includes('id="' + id + '"'), 'Vortia UI missing ' + id);
}
assert.match(vortiaHtml, /vortia-download\.js/);
assert.match(vortiaHtml, /Apple Silicon/);
for (const asset of ['vortia-download.js', 'platform-apple.svg', 'platform-linux.svg']) {
  assert.ok((await stat(path.join(root, 'dist/vortia', asset))).size > 100);
}
assert.ok((await stat(path.join(root, 'dist/portal/_headers'))).size > 40);
assert.ok((await stat(path.join(root, 'dist/vortia/_headers'))).size > 40);
assert.doesNotMatch(sourceCss, /fonts\.googleapis/);
assert.match(vortiaHtml, /type="module" src="\/vortia-download\.js"/);
assert.match(iso, /type="module" src="\/nodalix-releases\.js"/);
// Firmas visuales por producto.
const identity = await import('../assets/identity.js');
assert.ok(Math.abs(identity.velocity(0, 1)[0] - 2) < 1e-9 && Math.abs(identity.velocity(0, 1)[1]) < 1e-9);
assert.equal(identity.probe(0, 0.5), null);
assert.ok(Math.abs(identity.probe(-1, 0).cp - 1) < 1e-9, 'Cp de remanso debe ser 1');
assert.ok(Math.abs(identity.probe(0, 1).cp + 3) < 1e-9, 'Cp mínimo debe ser -3');
assert.equal(identity.speedColor(2), 'rgb(255,255,255)');
for (const [id, marker] of [['vortia', 'data-identity="flow"'], ['nodalix', 'class="boot-log"'], ['vinilo', 'class="record"'], ['lienzo', 'data-identity="select"']]) {
  const page = await readFile(path.join(root, 'dist', id, 'index.html'), 'utf8');
  assert.ok(page.includes(marker), `Falta la firma visual de ${id}`);
  assert.match(page, /src="\/identity\.js\?v=[0-9a-f]+"/);
  assert.ok((await stat(path.join(root, 'dist', id, 'identity.js'))).size > 100);
}
// Idiomas: cada sitio se publica en cinco idiomas, sin textos pendientes de traducir.
const i18n = await import('./i18n.mjs');
assert.deepEqual(JSON.parse(await readFile(path.join(root, 'dist/i18n-missing.json'), 'utf8')), {}, 'Hay textos sin traducir: revisa dist/i18n-missing.json');
for (const code of i18n.localeCodes.filter((item) => item !== 'es')) {
  for (const [key, value] of Object.entries(i18n.dictionaries[code])) {
    assert.ok(value.trim(), `Traducción vacía (${code}): ${key}`);
    assert.deepEqual((value.match(/\{\w+\}/g) || []).sort(), (key.match(/\{\w+\}/g) || []).sort(), `Marcadores distintos (${code}): ${key}`);
  }
}
for (const id of ['portal', 'vortia', 'vinilo', 'lienzo', 'nodalix']) {
  const base = id === 'portal' ? 'https://getnodalia.com' : `https://${id}.getnodalia.com`;
  const spanish = await readFile(path.join(root, 'dist', id, 'index.html'), 'utf8');
  assert.match(spanish, /<html lang="es">/);
  assert.ok(spanish.includes('class="lang"') && spanish.includes('nodalia-lang'), `Falta el selector de idioma en ${id}`);
  for (const code of i18n.localeCodes.filter((item) => item !== 'es')) {
    const page = await readFile(path.join(root, 'dist', id, code, 'index.html'), 'utf8');
    assert.ok(page.includes(`<html lang="${code}">`), `${id}/${code} sin lang`);
    assert.ok(page.includes(`<link rel="canonical" href="${base}/${code}/"/>`), `${id}/${code} sin canonical propio`);
    for (const other of i18n.localeCodes) assert.ok(page.includes(`hreflang="${other}" href="${base}${i18n.localePath(other)}"`), `${id}/${code} sin alternate ${other}`);
    assert.ok(page.includes(`hreflang="x-default" href="${base}/"`));
    assert.ok(!/href="https:\/\/(?:[a-z]+\.)?getnodalia\.com\/(?:#[^"]*)?"/.test(page.split('<').filter((tag) => !tag.includes('hreflang')).join('<')), `${id}/${code} enlaza a la versión en español`);
    assert.notEqual(page.match(/<h1[^>]*>([^<]*)/)[1], spanish.match(/<h1[^>]*>([^<]*)/)[1], `${id}/${code} con titular sin traducir`);
    JSON.parse(page.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  }
  assert.ok((await stat(path.join(root, 'dist', id, 'i18n.js'))).size > 100);
  const map = await readFile(path.join(root, 'dist', id, 'sitemap.xml'), 'utf8');
  for (const code of i18n.localeCodes) assert.ok(map.includes(`<loc>${base}${i18n.localePath(code)}</loc>`));
}
const vortiaDe = await readFile(path.join(root, 'dist/vortia/de/index.html'), 'utf8');
assert.equal(JSON.parse(vortiaDe.match(/<script type="application\/json" id="i18n">([\s\S]*?)<\/script>/)[1])['Descargar para Linux'], 'Für Linux herunterladen');
assert.equal(i18n.translateHtml('<p title="Hola mundo">Hola <b>mundo</b></p><code>Hola</code>', 'en', { lookup: (key) => ({ 'Hola mundo': 'Hello world', Hola: 'Hello', mundo: 'world' })[key] }), '<p title="Hello world">Hello <b>world</b></p><code>Hola</code>');
assert.equal(i18n.translateHtml('<b translate="no">Luz</b> <i>Luz</i>', 'en', { lookup: (key) => ({ Luz: 'Light' })[key] }), '<b translate="no">Luz</b> <i>Light</i>');
const portalEn = await readFile(path.join(root, 'dist/portal/en/index.html'), 'utf8');
assert.ok(portalEn.includes('<strong translate="no">Luz</strong>'), 'El nombre de la app Luz no debe traducirse');
const clientI18n = await import('../assets/i18n.js');
assert.equal(clientI18n.t('Descargar {type} ↓', { type: 'DMG' }), 'Descargar DMG ↓');
const releasesModule = await import('../assets/releases.js');
assert.equal(releasesModule.isTag('v1.2.3'), true);
assert.equal(releasesModule.isTag('<img src=x>'), false);
assert.equal(releasesModule.relativeDate('2026-01-01T00:00:00Z', Date.parse('2026-01-04T00:00:00Z')), 'hace 3 días');
assert.equal(releasesModule.relativeDate('2026-01-01T00:00:00Z', Date.parse('2026-01-04T00:00:00Z'), 'en'), '3 days ago');
assert.match(portal, /data-release="nodalix-os"/);
assert.ok((await stat(path.join(root, 'dist/portal/releases.js'))).size > 100);
await import('./test-vortia-download.mjs');
await import('./test-nodalix-releases.mjs');
console.log('✓ Cinco webs, CSS con hash anti-caché, cabeceras, módulos ES y descargas ISO/Vortia validados.');
