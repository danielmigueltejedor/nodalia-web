import { strict as assert } from 'node:assert';
import { FALLBACK, findAppImage, render, bootViniloDownload } from '../assets/vinilo-download.js';

const elements = () => ({
  'vinilo-primary-download': { href: FALLBACK.assets[0].browser_download_url },
  'vinilo-primary-version': { textContent: FALLBACK.tag_name },
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

console.log('✓ Vinilo: AppImage directa, versión nueva, release sin AppImage y fallback offline.');
