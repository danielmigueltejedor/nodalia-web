import { strict as assert } from 'node:assert';
import { FALLBACK, findAppImage, findDmg, render, bootViniloDownload } from '../assets/vinilo-download.js';

const elements = () => ({
  'vinilo-primary-download': { href: FALLBACK.assets[0].browser_download_url, textContent: 'Descargar AppImage ↓' },
  'vinilo-primary-kind': { textContent: 'AppImage x86_64' },
  'vinilo-primary-version': { textContent: FALLBACK.tag_name },
  'vinilo-mac': { hidden: true },
  'vinilo-mac-download': { href: 'https://github.com/danielmigueltejedor/vinilo/releases/latest' },
});

const newer = {
  tag_name: 'v1.1.6',
  assets: [
    { name: 'vinilo_1.1.6_amd64.deb', size: 1, browser_download_url: 'https://github.com/danielmigueltejedor/vinilo/releases/download/v1.1.6/vinilo_1.1.6_amd64.deb' },
    { name: 'Vinilo-1.1.6-x86_64.AppImage', size: 2, browser_download_url: 'https://github.com/danielmigueltejedor/vinilo/releases/download/v1.1.6/Vinilo-1.1.6-x86_64.AppImage' },
  ],
};

assert.equal(findAppImage(FALLBACK).name, 'Vinilo-1.1.5-x86_64.AppImage');
assert.equal(findAppImage(newer).name, 'Vinilo-1.1.6-x86_64.AppImage');
assert.equal(findAppImage({ ...newer, prerelease: true }), null);
assert.equal(findAppImage({ assets: [{ name: 'Vinilo-9-x86_64.AppImage', browser_download_url: 'https://evil.example/Vinilo.AppImage' }] }), null);
assert.equal(findAppImage(null), null);

// The latest release replaces the static link and version.
let page = elements();
const fetchOk = async () => ({ ok: true, json: async () => newer });
assert.equal(await bootViniloDownload({ document: { getElementById: (id) => page[id] }, fetch: fetchOk }), true);
assert.match(page['vinilo-primary-download'].href, /v1\.1\.6\/Vinilo-1\.1\.6-x86_64\.AppImage$/);
assert.equal(page['vinilo-primary-version'].textContent, 'v1.1.6');

// Offline or rate-limited: the static AppImage link stays.
page = elements();
const fetchDown = async () => ({ ok: false });
assert.equal(await bootViniloDownload({ document: { getElementById: (id) => page[id] }, fetch: fetchDown }), false);
assert.match(page['vinilo-primary-download'].href, /v1\.1\.5\/Vinilo-1\.1\.5-x86_64\.AppImage$/);
page = elements();
await bootViniloDownload({ document: { getElementById: (id) => page[id] }, fetch: async () => { throw new Error('offline'); } });
assert.match(page['vinilo-primary-download'].href, /Vinilo-1\.1\.5-x86_64\.AppImage$/);

// A release without an AppImage leaves the page alone.
page = elements();
assert.equal(render((id) => page[id], { tag_name: 'v2.0.0', assets: [newer.assets[0]] }), false);
assert.equal(page['vinilo-primary-version'].textContent, 'v1.1.5');

// A release with a DMG: Linux keeps the AppImage and gains a link to the DMG.
const withMac = {
  tag_name: 'v2.0.0',
  assets: [
    { name: 'Vinilo-2.0.0-x86_64.AppImage', size: 2, browser_download_url: 'https://github.com/danielmigueltejedor/vinilo/releases/download/v2.0.0/Vinilo-2.0.0-x86_64.AppImage' },
    { name: 'Vinilo-2.0.0-macos-arm64.dmg', size: 3, browser_download_url: 'https://github.com/danielmigueltejedor/vinilo/releases/download/v2.0.0/Vinilo-2.0.0-macos-arm64.dmg' },
  ],
};
assert.equal(findDmg(withMac).name, 'Vinilo-2.0.0-macos-arm64.dmg');
assert.equal(findDmg(newer), null);
assert.equal(findDmg({ assets: [{ name: 'Vinilo-9-macos-arm64.dmg', browser_download_url: 'https://evil.example/x.dmg' }] }), null);
page = elements();
assert.equal(render((id) => page[id], withMac, 'linux'), true);
assert.match(page['vinilo-primary-download'].href, /Vinilo-2\.0\.0-x86_64\.AppImage$/);
assert.equal(page['vinilo-mac'].hidden, false);
assert.match(page['vinilo-mac-download'].href, /Vinilo-2\.0\.0-macos-arm64\.dmg$/);

// On a Mac the main button is the DMG, and the extra link goes away.
page = elements();
assert.equal(render((id) => page[id], withMac, 'mac', 'unknown'), true);
assert.match(page['vinilo-primary-download'].href, /Vinilo-2\.0\.0-macos-arm64\.dmg$/);
assert.equal(page['vinilo-primary-download'].textContent, 'Descargar para macOS ↓');
assert.match(page['vinilo-primary-kind'].textContent, /Apple Silicon/);
assert.equal(page['vinilo-mac'].hidden, true);

// An Intel Mac is sent to the releases page rather than a file it cannot run.
page = elements();
render((id) => page[id], withMac, 'mac', 'x86');
assert.equal(page['vinilo-primary-download'].href, 'https://github.com/danielmigueltejedor/vinilo/releases/latest');

// A Mac before any release has a DMG keeps the AppImage page as it was.
page = elements();
render((id) => page[id], newer, 'mac', 'arm');
assert.match(page['vinilo-primary-download'].href, /Vinilo-1\.1\.6-x86_64\.AppImage$/);
assert.equal(page['vinilo-mac'].hidden, true);

// The browser detects a Mac from navigator.
page = elements();
const fetchMac = async () => ({ ok: true, json: async () => withMac });
await bootViniloDownload({ document: { getElementById: (id) => page[id] }, navigator: { platform: 'MacIntel', userAgent: 'Mozilla/5.0 (Macintosh)' }, fetch: fetchMac });
assert.match(page['vinilo-primary-download'].href, /macos-arm64\.dmg$/);

console.log('✓ Vinilo: AppImage directa, DMG en Mac, Mac Intel, versión nueva, release sin AppImage y fallback offline.');
