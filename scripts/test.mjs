import { strict as assert } from 'node:assert';
import { readFile, stat } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
execFileSync(process.execPath, ['scripts/build.mjs'], { cwd: root, stdio: 'pipe' });
const sites = ['portal','vortia','vinilo','lienzo','nodalix'];
for (const site of sites) {
  const dir = path.join(root,'dist',site);
  const html = await readFile(path.join(dir,'index.html'),'utf8');
  const css = await readFile(path.join(dir,'styles.css'),'utf8');
  const sitemap = await readFile(path.join(dir,'sitemap.xml'),'utf8');
  const brand = await readFile(path.join(dir,'nodalia-wordmark.svg'),'utf8');
  const icon = await readFile(path.join(dir,'nodalia-mark.svg'),'utf8');
  assert.match(brand,/<svg[^>]+viewBox/);
  assert.match(icon,/<svg[^>]+viewBox/);
  assert.match(html,/<html lang="es">/);
  assert.match(html,/nodalia-wordmark\.svg/);
  assert.match(html,/rel="canonical"/);
  assert.match(html,/<meta name="description"/);
  assert.match(html,/class="topbar"/);
  assert.match(html,/class="footer"/);
  assert.match(css,/\.container/);
  assert.match(css,/@media\(max-width:600px\)/);
  assert.match(css,/prefers-reduced-motion/);
  assert.doesNotMatch(css,/\.orb\b|\.art-panel\b|radial-gradient|rotat(e|ion)\(-[234]deg/);
  assert.match(sitemap,/<urlset/);
  assert.ok((await stat(path.join(dir,'404.html'))).size>100);
  if(site!=='portal') {
    assert.match(html,new RegExp('https://'+site+'\\.getnodalia\\.com'));
    assert.match(html,/class="product-hero"/);
    assert.match(html,/class="product-showcase"/);
    assert.match(html,/Estado y requisitos/);
  }
}
const portal=await readFile(path.join(root,'dist/portal/index.html'),'utf8');
for(const name of ['Vortia','Vinilo','Lienzo','Nodalix OS'])assert.match(portal,new RegExp(name));
assert.match(portal,/class="home-hero"/);
assert.match(portal,/class="hero-title"/);
assert.match(portal,/class="project-grid"/);
assert.match(portal,/class="os-feature"/);
assert.match(portal,/CAPTURA REAL/);
assert.match(portal,/docs\/screenshots\/library\.webp/);
assert.match(portal,/docs\/images\/screenshots\/levels\.png/);
assert.doesNotMatch(portal,/art-panel|floating-chip|hero-art|Ventana conceptual/);
assert.match(portal,/nodalix\.getnodalia\.com/);
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
console.log('✓ Cinco sitios, imágenes reales, diseño responsive y descargas Nodalix verificados.');
