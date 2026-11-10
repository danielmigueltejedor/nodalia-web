import { t, formatNumber } from './i18n.js';
/* Vortia downloads: official GitHub Releases, platform-aware with safe fallback. */

export const OWNER = 'danielmigueltejedor';
export const REPO = 'vortia';
export const RELEASES = `https://github.com/${OWNER}/${REPO}/releases`;
export const LATEST = `https://api.github.com/repos/${OWNER}/${REPO}/releases/latest`;
export const ASSET_PREFIX = `https://github.com/${OWNER}/${REPO}/releases/download/`;

/** Last verified stable assets, used only when the public GitHub API is unavailable. */
export const FALLBACK = {
  tag_name: 'v0.1.1',
  html_url: `${RELEASES}/tag/v0.1.1`,
  assets: [
    {
      name: 'Vortia-0.1.1-linux-x86_64.AppImage',
      size: 105191928,
      browser_download_url: `${ASSET_PREFIX}v0.1.1/Vortia-0.1.1-linux-x86_64.AppImage`,
    },
    {
      name: 'Vortia-0.1.1-linux-x86_64.AppImage.sha256',
      size: 106,
      browser_download_url: `${ASSET_PREFIX}v0.1.1/Vortia-0.1.1-linux-x86_64.AppImage.sha256`,
    },
    {
      name: 'Vortia-0.1.1-macos-arm64.dmg',
      size: 57620328,
      browser_download_url: `${ASSET_PREFIX}v0.1.1/Vortia-0.1.1-macos-arm64.dmg`,
    },
    {
      name: 'Vortia-0.1.1-macos-arm64.dmg.sha256',
      size: 121,
      browser_download_url: `${ASSET_PREFIX}v0.1.1/Vortia-0.1.1-macos-arm64.dmg.sha256`,
    },
  ],
};

export function safeAsset(asset, Url = URL, assetPrefix = ASSET_PREFIX) {
  if (!asset || typeof asset.name !== 'string' || typeof asset.browser_download_url !== 'string') {
    return null;
  }
  try {
    const url = new Url(asset.browser_download_url);
    if (url.protocol !== 'https:' || !url.href.startsWith(assetPrefix)) return null;
    return { name: asset.name, url: url.href, size: Number(asset.size) || 0 };
  } catch {
    return null;
  }
}

export function findPlatformAssets(release, Url = URL, assetPrefix = ASSET_PREFIX) {
  const assets = Array.isArray(release?.assets)
    ? release.assets.map((asset) => safeAsset(asset, Url, assetPrefix)).filter(Boolean)
    : [];
  const linux = assets.find((a) => /^Vortia-.+-linux-(x86_64|amd64)\.AppImage$/i.test(a.name)) || null;
  const mac = assets.find((a) => /^Vortia-.+-macos-(arm64|aarch64|universal)\.dmg$/i.test(a.name)) || null;
  const checksum = (asset) => (asset ? assets.find((a) => a.name === `${asset.name}.sha256`) || null : null);
  return { linux, mac, linuxSha: checksum(linux), macSha: checksum(mac) };
}

export function detectPlatform(nav) {
  const ua = nav?.userAgent || '';
  const p = (nav?.userAgentData && nav.userAgentData.platform) || nav?.platform || ua;
  if (/android|iphone|ipad|ipod/i.test(ua) || (/mac/i.test(p) && (nav?.maxTouchPoints || 0) > 1)) {
    return 'other';
  }
  if (/mac/i.test(p)) return 'mac';
  if (/linux|x11/i.test(p)) return 'linux';
  return 'other';
}

export async function detectArchitecture(nav) {
  try {
    if (nav?.userAgentData && typeof nav.userAgentData.getHighEntropyValues === 'function') {
      const hints = await nav.userAgentData.getHighEntropyValues(['architecture']);
      if (/^(arm|arm64|aarch64)$/i.test(hints.architecture || '')) return 'arm';
      if (/^(x86|x86_64|amd64)$/i.test(hints.architecture || '')) return 'x86';
    }
  } catch {
    /* Browser architecture hints are optional. */
  }
  if (/aarch64|arm64/i.test(nav?.userAgent || '')) return 'arm';
  return 'unknown';
}

export function formatMegabytes(bytes) {
  return bytes ? `${formatNumber(bytes / 1e6)} MB` : t('Tamaño no disponible');
}

export function releaseUrl(release) {
  const url = release && release.html_url;
  if (typeof url === 'string' && url.startsWith(`${RELEASES}/tag/`)) return url;
  return RELEASES;
}

export function isValidRelease(release) {
  return Boolean(
    release &&
      !release.draft &&
      !release.prerelease &&
      Array.isArray(release.assets) &&
      release.assets.length > 0 &&
      typeof release.tag_name === 'string' &&
      /^v?[0-9]/.test(release.tag_name),
  );
}

function setOption(get, platformId, asset, checksum, release) {
  const link = get(`vortia-${platformId}-link`);
  const size = get(`vortia-${platformId}-size`);
  const sha = get(`vortia-${platformId}-sha`);
  if (!link || !size || !sha) return;
  const fileType = platformId === 'linux' ? 'AppImage' : 'DMG';
  link.href = asset ? asset.url : releaseUrl(release);
  link.textContent = asset ? t('Descargar {type} ↓', { type: fileType }) : t('Consultar en GitHub ↗');
  size.textContent = asset ? formatMegabytes(asset.size) : t('No disponible en esta versión');
  sha.hidden = !checksum;
  if (checksum) sha.href = checksum.url;
}

export function renderRelease(get, release, os, arch, isFallback) {
  const version =
    typeof release.tag_name === 'string' && /^v?[0-9]/.test(release.tag_name)
      ? release.tag_name
      : t('Versión disponible');
  const packages = findPlatformAssets(release);
  const versionEl = get('vortia-release-version');
  const sourceEl = get('vortia-release-source');
  if (versionEl) versionEl.textContent = version;
  if (sourceEl) {
    sourceEl.textContent = isFallback
      ? t('Referencia local: comprueba en GitHub si hay una versión más reciente.')
      : t('Versión estable más reciente publicada en GitHub Releases.');
  }

  setOption(get, 'linux', packages.linux, packages.linuxSha, release);
  setOption(get, 'mac', packages.mac, packages.macSha, release);

  let selected = null;
  let icon = '';
  let label = t('Ver versiones y descargas');
  let detail = t('Selecciona Linux o macOS en las opciones de descarga.');

  if (os === 'linux') {
    icon = '/platform-linux.svg';
    if (arch === 'arm') {
      detail = t('No hay AppImage Linux ARM64 en esta versión. La descarga publicada es para x86_64.');
    } else if (packages.linux) {
      selected = packages.linux;
      label = t('Descargar para Linux');
      detail = `AppImage x86_64 · ${formatMegabytes(selected.size)} · ${version}`;
    } else {
      detail = t('No hay AppImage Linux x86_64 en la última versión.');
    }
  } else if (os === 'mac') {
    icon = '/platform-apple.svg';
    const universal = packages.mac && /universal/i.test(packages.mac.name);
    if (arch === 'x86' && !universal) {
      detail = t('No hay DMG compatible con Mac Intel en esta versión. El publicado es para Apple Silicon.');
    } else if (packages.mac) {
      selected = packages.mac;
      label = t('Descargar para macOS');
      detail = `${universal ? t('DMG universal') : t('DMG para Apple Silicon (M1/M2/M3/M4 y posteriores)')} · ${formatMegabytes(selected.size)} · ${version}`;
    } else {
      detail = t('No hay DMG para macOS en la última versión.');
    }
  }

  const primary = get('vortia-primary-download');
  const iconEl = get('vortia-primary-icon');
  const titleEl = get('vortia-primary-title');
  const detailEl = get('vortia-primary-detail');
  if (primary) primary.href = selected ? selected.url : releaseUrl(release);
  if (titleEl) titleEl.textContent = label;
  if (detailEl) detailEl.textContent = detail;
  if (iconEl) {
    if (icon) {
      iconEl.src = icon;
      iconEl.hidden = false;
    } else {
      iconEl.hidden = true;
    }
  }
}

export async function fetchLatestRelease(fetchImpl) {
  const response = await fetchImpl(LATEST, {
    headers: { Accept: 'application/vnd.github+json' },
    cache: 'no-store',
  });
  if (!response.ok) throw new Error('GitHub Releases unavailable');
  return response.json();
}

export async function bootVortiaDownloads({
  document: doc,
  navigator: nav,
  fetch: fetchImpl = fetch,
} = globalThis) {
  if (!doc?.getElementById?.('vortia-downloads')) return null;
  const get = (id) => doc.getElementById(id);
  const os = detectPlatform(nav);
  renderRelease(get, FALLBACK, os, 'unknown', true);

  const [arch, latest] = await Promise.all([
    detectArchitecture(nav),
    fetchLatestRelease(fetchImpl).catch(() => null),
  ]);
  const valid = isValidRelease(latest);
  renderRelease(get, valid ? latest : FALLBACK, os, arch, !valid);
  return { os, arch, valid };
}

const runningInBrowser = typeof document !== 'undefined' && typeof document.getElementById === 'function';
if (runningInBrowser) {
  bootVortiaDownloads({ document, navigator, fetch }).catch(() => {
    const get = (id) => document.getElementById(id);
    if (get('vortia-downloads')) {
      renderRelease(get, FALLBACK, detectPlatform(navigator), 'unknown', true);
    }
  });
}
