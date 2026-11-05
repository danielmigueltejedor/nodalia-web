import { strict as assert } from 'node:assert';
import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
execFileSync(process.execPath, ['scripts/build.mjs'], { cwd: root, stdio: 'pipe' });
const apps = ['portal', 'vortia', 'vinilo', 'lienzo', 'nodalix'];
for (const app of apps) {
  const base = path.join(root, 'dist', app);
  const page = await readFile(path.join(base, 'index.html'), 'utf8');
  const sitemap = await readFile(path.join(base, 'sitemap.xml'), 'utf8');
  const wordmark = await readFile(path.join(base, 'nodalia-wordmark.svg'), 'utf8');
  const mark = await readFile(path.join(base, 'nodalia-mark.svg'), 'utf8');
  assert.match(wordmark, /<svg[^>]+viewBox/);
  assert.match(mark, /<svg[^>]+viewBox/);
  assert.match(page, /nodalia-wordmark\.svg/);
  assert.match(page, /<html lang="es">/);
  assert.match(page, /<meta name="description"/);
  assert.match(page, /rel="canonical"/);
  assert.match(sitemap, /<urlset/);
  if (app !== 'portal') assert.match(page, new RegExp(`https://${app}\\.getnodalia\\.com`));
}
const portal = await readFile(path.join(root, 'dist/portal/index.html'), 'utf8');
assert.match(portal, /Nodalix OS/);
assert.match(portal, /nodalix-feature/);
assert.match(portal, /nodalix\.getnodalia\.com/);
const iso = await readFile(path.join(root, 'dist/nodalix/index.html'), 'utf8');
assert.match(iso, /id="descargas"/);
assert.match(iso, /id="release-actions"/);
assert.match(iso, /nodalix-releases\.js/);
assert.match(iso, /Secure Boot/);
const releases = JSON.parse(await readFile(path.join(root, 'dist/nodalix/releases.json'), 'utf8'));
assert.equal(releases.schema, 1);
assert.ok(Array.isArray(releases.isos));
for (const item of releases.isos) {
  assert.match(item.sha256, /^[0-9a-f]{64}$/i);
  assert.ok(item.sizeBytes > 0);
  assert.match(item.url, /^https:\/\/(downloads\.getnodalia\.com|github\.com)\//);
}
console.log('✓ 5 webs generadas; Nodalix y descargas comprobadas; manifiesto validado.');
