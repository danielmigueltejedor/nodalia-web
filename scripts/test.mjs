import { strict as assert } from 'node:assert';
import { readFile, stat } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
execFileSync(process.execPath, ['scripts/build.mjs'], { cwd: root, stdio: 'pipe' });
for (const id of ['portal','vortia','vinilo','lienzo','nodalix']) {
  const dir = path.join(root,'dist',id);
  const page = await readFile(path.join(dir,'index.html'),'utf8');
  const css = await readFile(path.join(dir,'styles.css'),'utf8');
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
    assert.match(page,/class="product-preview"/);
    assert.match(page,/Estado y requisitos/);
  }
}
const portal=await readFile(path.join(root,'dist/portal/index.html'),'utf8');
for(const name of ['Vortia','Vinilo','Lienzo','Nodalix OS'])assert.match(portal,new RegExp(name));
assert.match(portal,/hero-stage/);
assert.match(portal,/window-main/);
assert.match(portal,/product-grid/);
assert.match(portal,/spotlight/);
assert.match(portal,/docs\/screenshots\/library\.webp/);
assert.match(portal,/docs\/images\/screenshots\/levels\.png/);
assert.doesNotMatch(portal,/floating-chip|art-panel|concept-geometry/);
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
console.log('✓ Cinco webs, identidad visual, capturas reales y descargas ISO validadas.');
