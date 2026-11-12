import { strict as assert } from 'node:assert';
import { choose, detail, kind, packages, render, bootAppDownload } from '../assets/app-download.js';
import { slim } from './releases.mjs';

// The download button shared by Vinilo, Lienzo and every app with installers.
const dl = (repo, tag, name, size = 1) => ({ name, size, browser_download_url: `https://github.com/getnodalia/${repo}/releases/download/${tag}/${name}` });
const vinilo = { repo: 'vinilo', patterns: { linux: '^Vinilo-.+-x86_64\\.AppImage$', mac: '^Vinilo-(?!.*-nodalia-).+-macos-(arm64|universal)\\.dmg$', macAlt: '^Vinilo-.+-nodalia-macos-(arm64|universal)\\.dmg$' } };
const lienzo = { repo: 'lienzo', patterns: { linux: '^lienzo-.+-linux-x86_64\\.AppImage$', mac: '^lienzo-.+-macos-(arm64|universal)\\.dmg$', windows: '^lienzo-.+-windows-x64\\.msi$' } };
const v2 = {
  tag_name: 'v2.0.0',
  html_url: 'https://github.com/getnodalia/vinilo/releases/tag/v2.0.0',
  assets: [dl('vinilo', 'v2.0.0', 'vinilo_2.0.0_amd64.deb'), dl('vinilo', 'v2.0.0', 'Vinilo-2.0.0-x86_64.AppImage', 310970872), dl('vinilo', 'v2.0.0', 'Vinilo-2.0.0-macos-arm64.dmg', 171563827)],
};

// Two Mac editions: the button offers Vinilo Native, the section lists both.
const v01 = {
  tag_name: 'v0.1.0',
  html_url: 'https://github.com/getnodalia/vinilo/releases/tag/v0.1.0',
  assets: [
    dl('vinilo', 'v0.1.0', 'Vinilo-0.1.0-x86_64.AppImage'),
    dl('vinilo', 'v0.1.0', 'Vinilo-0.1.0-native-macos-arm64.dmg', 90),
    dl('vinilo', 'v0.1.0', 'Vinilo-0.1.0-nodalia-macos-arm64.dmg', 170),
  ],
};
assert.equal(choose(v01, vinilo, 'mac', 'arm').asset.name, 'Vinilo-0.1.0-native-macos-arm64.dmg');
assert.equal(choose(v01, vinilo, 'mac', 'arm').found.macAlt.name, 'Vinilo-0.1.0-nodalia-macos-arm64.dmg');
assert.equal(kind('macAlt', choose(v01, vinilo, 'mac', 'arm').found.macAlt), 'DMG · Apple Silicon');

// Linux gets the penguin and the AppImage; a Mac the apple and the DMG.
let c = choose(v2, vinilo, 'linux', 'x86');
assert.equal(c.asset.name, 'Vinilo-2.0.0-x86_64.AppImage');
assert.equal(c.icon, '/platform-linux.svg');
assert.equal(c.title, 'Descargar para Linux');
assert.equal(detail(c, 'es'), 'AppImage · x86_64 · 311 MB · v2.0.0');
c = choose(v2, vinilo, 'mac', 'arm');
assert.equal(c.asset.name, 'Vinilo-2.0.0-macos-arm64.dmg');
assert.equal(c.icon, '/platform-apple.svg');
assert.equal(c.title, 'Descargar para macOS');
// An Intel Mac cannot run an arm64 DMG; a universal one is fine.
assert.equal(choose(v2, vinilo, 'mac', 'x86').asset, null);
const universal = { ...v2, assets: [dl('vinilo', 'v2.0.0', 'Vinilo-2.0.0-macos-universal.dmg')] };
assert.equal(choose(universal, vinilo, 'mac', 'x86').asset.name, 'Vinilo-2.0.0-macos-universal.dmg');
assert.equal(kind('mac', choose(universal, vinilo, 'mac', 'x86').asset), 'DMG · Universal');
const armAndUniversal = {
  ...v2,
  assets: [
    dl('vinilo', 'v2.0.0', 'Vinilo-2.0.0-macos-arm64.dmg'),
    dl('vinilo', 'v2.0.0', 'Vinilo-2.0.0-macos-universal.dmg'),
  ],
};
assert.equal(packages(armAndUniversal, vinilo).mac.name, 'Vinilo-2.0.0-macos-universal.dmg');
assert.equal(choose(armAndUniversal, vinilo, 'mac', 'x86').asset.name, 'Vinilo-2.0.0-macos-universal.dmg');
assert.match(choose(v2, vinilo, 'mac', 'unknown').href, /Vinilo-2\.0\.0-macos-arm64\.dmg$/);
assert.match(choose(v2, vinilo, 'linux', 'unknown').href, /Vinilo-2\.0\.0-x86_64\.AppImage$/);
// Phones, Windows without an installer, ARM Linux: the release page, with no system icon.
for (const [os, arch] of [['other', 'unknown'], ['windows', 'unknown'], ['linux', 'arm']]) {
  c = choose(v2, vinilo, os, arch);
  assert.equal(c.href, v2.html_url, `${os}/${arch}`);
  assert.equal(c.icon, '');
  assert.equal(c.title, 'Descargar');
}
// Assets outside the app's own releases, drafts and pre-releases are never offered.
assert.equal(packages({ ...v2, assets: [{ name: 'Vinilo-9-x86_64.AppImage', browser_download_url: 'https://evil.example/Vinilo-9-x86_64.AppImage' }] }, vinilo).linux, null);
assert.equal(packages({ ...v2, prerelease: true }, vinilo).linux, null);
assert.equal(packages({ ...v2, draft: true }, vinilo).mac, null);
assert.equal(choose(null, lienzo, 'linux').href, 'https://github.com/getnodalia/lienzo/releases/latest');
// Windows gets its installer when the release has one.
const l = { tag_name: 'v0.2.0', assets: [dl('lienzo', 'v0.2.0', 'lienzo-0.2.0-windows-x64.msi'), dl('lienzo', 'v0.2.0', 'lienzo-0.2.0-linux-x86_64.AppImage')] };
assert.equal(choose(l, lienzo, 'windows').title, 'Descargar para Windows');
assert.equal(choose(l, lienzo, 'windows').icon, '/platform-windows.svg');
assert.equal(choose(l, lienzo, 'windows').asset.name, 'lienzo-0.2.0-windows-x64.msi');

// In the page: the built release first, then GitHub's newer one; every system's installer in the downloads section.
const elements = () => Object.fromEntries(['app-primary-download', 'app-primary-icon', 'app-primary-title', 'app-primary-detail', 'app-release-version', 'app-card-linux', 'app-card-linux-size', 'app-card-mac', 'app-card-mac-size', 'app-card-macAlt', 'app-card-macAlt-size', 'app-card-windows', 'app-card-windows-size'].map((id) => [id, { hidden: false, href: '', textContent: '', src: '' }]));
const page = (config, nav) => {
  const els = elements();
  els['app-download-config'] = { textContent: JSON.stringify(config) };
  return { els, doc: { getElementById: (id) => els[id] }, nav };
};
const mac = { platform: 'MacIntel', userAgent: 'Macintosh', userAgentData: { platform: 'macOS', getHighEntropyValues: async () => ({ architecture: 'arm' }) } };
const linux = { platform: 'Linux x86_64', userAgent: 'X11; Linux x86_64' };
const v21 = { ...v2, tag_name: 'v2.1.0', html_url: 'https://github.com/getnodalia/vinilo/releases/tag/v2.1.0', assets: [dl('vinilo', 'v2.1.0', 'Vinilo-2.1.0-x86_64.AppImage'), dl('vinilo', 'v2.1.0', 'Vinilo-2.1.0-macos-arm64.dmg')] };
let p = page({ ...vinilo, release: v2 }, mac);
assert.equal(await bootAppDownload({ document: p.doc, navigator: p.nav, fetch: async () => ({ ok: true, json: async () => v21 }) }), true);
assert.match(p.els['app-primary-download'].href, /v2\.1\.0\/Vinilo-2\.1\.0-macos-arm64\.dmg$/);
assert.equal(p.els['app-primary-icon'].src, '/platform-apple.svg');
assert.equal(p.els['app-primary-icon'].hidden, false);
assert.match(p.els['app-primary-detail'].textContent, /v2\.1\.0$/);
assert.equal(p.els['app-release-version'].textContent, 'v2.1.0');
assert.match(p.els['app-card-mac'].href, /Vinilo-2\.1\.0-macos-arm64\.dmg$/);
assert.match(p.els['app-card-linux'].href, /Vinilo-2\.1\.0-x86_64\.AppImage$/);
// A system the release has no installer for points to the release page.
assert.equal(p.els['app-card-windows'].href, v21.html_url);
// Offline: the release the page was built with, still picked for this system.
p = page({ ...vinilo, release: v2 }, mac);
await bootAppDownload({ document: p.doc, navigator: p.nav, fetch: async () => { throw new Error('offline'); } });
assert.match(p.els['app-primary-download'].href, /v2\.0\.0\/Vinilo-2\.0\.0-macos-arm64\.dmg$/);
p = page({ ...vinilo, release: v2 }, linux);
await bootAppDownload({ document: p.doc, navigator: p.nav, fetch: async () => ({ ok: false }) });
assert.match(p.els['app-primary-download'].href, /Vinilo-2\.0\.0-x86_64\.AppImage$/);
assert.equal(p.els['app-primary-icon'].src, '/platform-linux.svg');
// An app built before its first release picks it up as soon as GitHub has it.
const first = { tag_name: 'v0.1.0', html_url: 'https://github.com/getnodalia/lienzo/releases/tag/v0.1.0', assets: [dl('lienzo', 'v0.1.0', 'lienzo-0.1.0-linux-x86_64.AppImage')] };
p = page({ ...lienzo, release: null }, linux);
assert.equal(await bootAppDownload({ document: p.doc, navigator: p.nav, fetch: async () => ({ ok: true, json: async () => first }) }), true);
assert.match(p.els['app-primary-download'].href, /lienzo-0\.1\.0-linux-x86_64\.AppImage$/);
// Safari identifies the OS but does not supply the CPU architecture.
p = page({ ...vinilo, release: v2 }, {
  platform: 'MacIntel',
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/26.1 Safari/605.1.15',
});
await bootAppDownload({ document: p.doc, navigator: p.nav, fetch: async () => ({ ok: false }) });
assert.match(p.els['app-primary-download'].href, /Vinilo-2\.0\.0-macos-arm64\.dmg$/);
assert.equal(p.els['app-primary-icon'].src, '/platform-apple.svg');
assert.equal(p.els['app-primary-icon'].hidden, false);

// A Mac visitor of a Linux-only release goes to the release page, without the apple.
p = page({ ...lienzo, release: first }, mac);
await bootAppDownload({ document: p.doc, navigator: p.nav, fetch: async () => ({ ok: true, json: async () => first }) });
assert.equal(p.els['app-primary-download'].href, first.html_url);
assert.equal(p.els['app-primary-icon'].hidden, true);
assert.equal(render(() => null, null, lienzo, 'linux'), false);

// Architecture detection updates the built release before a stalled GitHub request finishes.
{
  let resolveArchitecture;
  let resolveResponse;
  p = page({ ...vinilo, release: armAndUniversal }, {
    platform: 'MacIntel',
    userAgent: 'Macintosh',
    userAgentData: {
      platform: 'macOS',
      getHighEntropyValues: () => new Promise((resolve) => { resolveArchitecture = resolve; }),
    },
  });
  const pending = bootAppDownload({
    document: p.doc,
    navigator: p.nav,
    fetch: () => new Promise((resolve) => { resolveResponse = resolve; }),
  });
  assert.equal(p.els['app-primary-download'].href, armAndUniversal.html_url);
  resolveArchitecture({ architecture: 'x86' });
  await new Promise(setImmediate);
  assert.match(p.els['app-primary-download'].href, /Vinilo-2\.0\.0-macos-universal\.dmg$/);
  resolveResponse({ ok: false });
  await pending;
}

// The build keeps only what the page needs, from the app's own releases.
assert.equal(slim('vinilo', { ...v2, draft: true }), null);
assert.equal(slim('vinilo', { ...v2, tag_name: '<b>' }), null);
const kept = slim('vinilo', { ...v2, assets: [...v2.assets, { name: 'x', browser_download_url: 'https://evil.example/x' }] });
assert.equal(kept.assets.length, 3);
assert.equal(kept.html_url, 'https://github.com/getnodalia/vinilo/releases/tag/v2.0.0');

console.log('✓ Botón de descarga: Linux, macOS (Apple Silicon, Intel, universal), Windows, móvil, versiones nuevas, primera versión y sin conexión.');
