import { strict as assert } from 'node:assert';
import {
  bootVortiaDownloads,
  detectPlatform,
  findPlatformAssets,
  isValidRelease,
  safeAsset,
} from '../assets/vortia-download.js';

const ids = [
  'vortia-downloads', 'vortia-release-config', 'vortia-release-version', 'vortia-release-source',
  'vortia-linux-link', 'vortia-linux-size', 'vortia-linux-sha',
  'vortia-mac-link', 'vortia-mac-size', 'vortia-mac-sha',
  'vortia-macnative-link', 'vortia-macnative-size', 'vortia-macnative-sha',
  'vortia-primary-download', 'vortia-primary-icon',
  'vortia-primary-title', 'vortia-primary-detail',
];

function createDocument() {
  const elements = Object.fromEntries(ids.map((id) => [id, {
    href: '', textContent: '', src: '', hidden: false,
  }]));
  return {
    elements,
    getElementById: (id) => elements[id] || null,
  };
}

async function simulate({ platform, userAgent, architecture, release, fail = false }) {
  const document = createDocument();
  const navigator = {
    platform,
    userAgent,
    maxTouchPoints: 0,
  };
  if (architecture) {
    navigator.userAgentData = {
      platform,
      getHighEntropyValues: async () => ({ architecture }),
    };
  }

  await bootVortiaDownloads({
    document,
    navigator,
    fetch: async () => {
      if (fail) throw new Error('Offline');
      return { ok: true, json: async () => release };
    },
  });

  return document.elements;
}

const latest = {
  tag_name: 'v0.2.0', draft: false, prerelease: false,
  html_url: 'https://github.com/getnodalia/vortia/releases/tag/v0.2.0',
  assets: [
    {
      name: 'Vortia-0.2.0-linux-x86_64.AppImage', size: 123000000,
      browser_download_url: 'https://github.com/getnodalia/vortia/releases/download/v0.2.0/Vortia-0.2.0-linux-x86_64.AppImage',
    },
    {
      name: 'Vortia-0.2.0-macos-arm64.dmg', size: 63000000,
      browser_download_url: 'https://github.com/getnodalia/vortia/releases/download/v0.2.0/Vortia-0.2.0-macos-arm64.dmg',
    },
    {
      name: 'Vortia-0.2.0-linux-x86_64.AppImage.sha256', size: 105,
      browser_download_url: 'https://github.com/getnodalia/vortia/releases/download/v0.2.0/Vortia-0.2.0-linux-x86_64.AppImage.sha256',
    },
  ],
};

assert.equal(detectPlatform({ platform: 'Linux x86_64', userAgent: 'X11' }), 'linux');
assert.equal(detectPlatform({ platform: 'MacIntel', userAgent: 'Macintosh' }), 'mac');
assert.equal(detectPlatform({ platform: 'Win32', userAgent: 'Windows' }), 'windows');
assert.equal(isValidRelease(latest), true);
assert.equal(isValidRelease({ ...latest, draft: true }), false);
assert.equal(safeAsset({ name: 'x', browser_download_url: 'http://evil.example/x' }), null);
assert.ok(findPlatformAssets(latest).linux);

const linux = await simulate({
  platform: 'Linux x86_64',
  userAgent: 'Mozilla/5.0 (X11; Linux x86_64)',
  release: latest,
});
assert.match(linux['vortia-primary-download'].href, /v0\.2\.0\/Vortia-0\.2\.0-linux-x86_64\.AppImage$/);
assert.equal(linux['vortia-primary-icon'].src, '/platform-linux.svg');
assert.equal(linux['vortia-primary-title'].textContent, 'Descargar para Linux');
assert.equal(linux['vortia-release-version'].textContent, 'v0.2.0');
assert.equal(linux['vortia-linux-sha'].hidden, false);
assert.equal(linux['vortia-mac-sha'].hidden, true);

const mac = await simulate({
  platform: 'MacIntel',
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X)',
  architecture: 'arm',
  release: latest,
});
assert.match(mac['vortia-primary-download'].href, /\.dmg$/);
assert.equal(mac['vortia-primary-icon'].src, '/platform-apple.svg');
assert.match(mac['vortia-primary-detail'].textContent, /Apple Silicon/);

const intel = await simulate({
  platform: 'macOS',
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X)',
  architecture: 'x86',
  release: latest,
});
assert.match(intel['vortia-primary-download'].href, /releases\/tag\/v0\.2\.0$/);
assert.match(intel['vortia-primary-detail'].textContent, /Mac Intel/);

const arm = await simulate({
  platform: 'Linux',
  userAgent: 'Mozilla/5.0 (X11; Linux aarch64)',
  architecture: 'arm',
  release: latest,
});
assert.match(arm['vortia-primary-download'].href, /releases\/tag\/v0\.2\.0$/);
assert.match(arm['vortia-primary-detail'].textContent, /ARM64/);

const windows = await simulate({
  platform: 'Win32',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
  release: latest,
});
assert.match(windows['vortia-primary-download'].href, /releases\/tag\/v0\.2\.0$/);
assert.equal(windows['vortia-primary-title'].textContent, 'Descargar');

const offline = await simulate({
  platform: 'Linux x86_64',
  userAgent: 'Mozilla/5.0 (X11; Linux x86_64)',
  fail: true,
});
assert.match(offline['vortia-primary-download'].href, /v0\.7\.0\/Vortia-0\.7\.0-linux-x86_64\.AppImage$/);
assert.match(offline['vortia-release-source'].textContent, /Referencia local/);

const universalRelease = {
  ...latest,
  assets: [
    ...latest.assets,
    {
      name: 'Vortia-0.2.0-macos-universal.dmg', size: 70000000,
      browser_download_url: 'https://github.com/getnodalia/vortia/releases/download/v0.2.0/Vortia-0.2.0-macos-universal.dmg',
    },
  ],
};
assert.match(findPlatformAssets(universalRelease).mac.name, /universal/);

// Two macOS installers: the Qt DMG stays the main one and Vortia Native gets its own card.
const twoMacs = {
  ...latest,
  assets: [
    {
      name: 'Vortia-0.7.0-native-macos-arm64.dmg', size: 407000000,
      browser_download_url: 'https://github.com/getnodalia/vortia/releases/download/v0.2.0/Vortia-0.7.0-native-macos-arm64.dmg',
    },
    {
      name: 'Vortia-0.7.0-native-macos-arm64.dmg.sha256', size: 102,
      browser_download_url: 'https://github.com/getnodalia/vortia/releases/download/v0.2.0/Vortia-0.7.0-native-macos-arm64.dmg.sha256',
    },
    ...latest.assets,
  ],
};
{
  const found = findPlatformAssets(twoMacs);
  assert.equal(found.mac.name, 'Vortia-0.2.0-macos-arm64.dmg');
  assert.equal(found.macNative.name, 'Vortia-0.7.0-native-macos-arm64.dmg');
  assert.equal(found.macNativeSha.name, 'Vortia-0.7.0-native-macos-arm64.dmg.sha256');
  assert.equal(found.macSha, null);
  assert.equal(findPlatformAssets(latest).macNative, null);
  const onlyNative = findPlatformAssets({ ...latest, assets: twoMacs.assets.slice(0, 2) });
  assert.equal(onlyNative.mac, null);
}
{
  const el = await simulate({
    platform: 'MacIntel',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X)',
    architecture: 'arm',
    release: twoMacs,
  });
  assert.match(el['vortia-macnative-link'].href, /native-macos-arm64\.dmg$/);
  assert.equal(el['vortia-macnative-sha'].hidden, false);
  assert.match(el['vortia-mac-link'].href, /0\.2\.0-macos-arm64\.dmg$/);
  assert.match(el['vortia-primary-download'].href, /0\.2\.0-macos-arm64\.dmg$/);
}

// Keep the primary button on GitHub until architecture detection completes, then render the built version.
{
  const document = createDocument();
  document.elements['vortia-release-config'].textContent = JSON.stringify(latest);
  let resolveArchitecture;
  let resolveResponse;
  const navigator = {
    platform: 'MacIntel',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X)',
    userAgentData: {
      platform: 'macOS',
      getHighEntropyValues: () => new Promise((resolve) => { resolveArchitecture = resolve; }),
    },
  };
  const pending = bootVortiaDownloads({
    document,
    navigator,
    fetch: () => new Promise((resolve) => { resolveResponse = resolve; }),
  });
  assert.match(document.elements['vortia-primary-download'].href, /releases\/tag\/v0\.2\.0$/);
  resolveArchitecture({ architecture: 'x86' });
  await new Promise(setImmediate);
  assert.match(document.elements['vortia-primary-download'].href, /releases\/tag\/v0\.2\.0$/);
  assert.match(document.elements['vortia-primary-detail'].textContent, /Mac Intel/);
  resolveResponse({ ok: false });
  await pending;
}

// The release the page was built with is the offline fallback, ahead of the one in the script.
{
  const { builtRelease, FALLBACK: verified } = await import('../assets/vortia-download.js');
  const doc = (text) => ({ getElementById: (id) => (id === 'vortia-release-config' ? { textContent: text } : null) });
  const built = { tag_name: 'v9.0.0', assets: [{ name: 'Vortia-9.0.0-linux-x86_64.AppImage', size: 1, browser_download_url: 'https://github.com/getnodalia/vortia/releases/download/v9.0.0/Vortia-9.0.0-linux-x86_64.AppImage' }] };
  assert.equal(builtRelease(doc(JSON.stringify(built))).tag_name, 'v9.0.0');
  assert.equal(builtRelease(doc('{broken')), verified);
  assert.equal(builtRelease(doc(JSON.stringify({ ...built, draft: true }))), verified);
  assert.equal(builtRelease({ getElementById: () => null }), verified);
}
console.log('✓ Vortia: Linux, macOS, Intel, ARM64, Windows, versiones nuevas y fallback offline.');
