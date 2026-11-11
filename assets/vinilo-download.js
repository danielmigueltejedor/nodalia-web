import { t } from './i18n.js';
import { detectPlatform, detectArchitecture } from './platform.js';

/* Vinilo: the main button downloads the latest build straight from GitHub Releases.
   Linux gets the AppImage; a Mac gets the DMG once a release carries one. */

export const OWNER = 'danielmigueltejedor';
export const REPO = 'vinilo';
export const RELEASES = `https://github.com/${OWNER}/${REPO}/releases`;
export const LATEST = `https://api.github.com/repos/${OWNER}/${REPO}/releases/latest`;
export const ASSET_PREFIX = `https://github.com/${OWNER}/${REPO}/releases/download/`;

/** Last verified release, used in the static page and when the GitHub API is unavailable. */
export const FALLBACK = {
  tag_name: 'v2.0.0',
  assets: [
    {
      name: 'Vinilo-2.0.0-x86_64.AppImage',
      size: 310970872,
      browser_download_url: `${ASSET_PREFIX}v2.0.0/Vinilo-2.0.0-x86_64.AppImage`,
    },
    {
      name: 'Vinilo-2.0.0-macos-arm64.dmg',
      size: 171563827,
      browser_download_url: `${ASSET_PREFIX}v2.0.0/Vinilo-2.0.0-macos-arm64.dmg`,
    },
  ],
};

function findAsset(release, pattern, Url) {
  if (!release || release.draft || release.prerelease || !Array.isArray(release.assets)) return null;
  for (const asset of release.assets) {
    if (!asset || typeof asset.name !== 'string' || !pattern.test(asset.name)) continue;
    try {
      const url = new Url(asset.browser_download_url);
      if (url.protocol === 'https:' && url.href.startsWith(ASSET_PREFIX)) {
        return { name: asset.name, url: url.href, size: Number(asset.size) || 0 };
      }
    } catch {
      /* An asset with a broken URL is skipped. */
    }
  }
  return null;
}

export function findAppImage(release, Url = URL) {
  return findAsset(release, /^Vinilo-.+-x86_64\.AppImage$/, Url);
}

export function findDmg(release, Url = URL) {
  return findAsset(release, /^Vinilo-.+-macos-arm64\.dmg$/, Url);
}

export function render(get, release, os = 'other', arch = 'unknown') {
  const appImage = findAppImage(release);
  const dmg = findDmg(release);
  if (!appImage && !dmg) return false;
  const version = typeof release.tag_name === 'string' && /^v?[0-9]/.test(release.tag_name) ? release.tag_name : '';
  const link = get('vinilo-primary-download');
  const title = get('vinilo-primary-title');
  const iconEl = get('vinilo-primary-icon');
  const kind = get('vinilo-primary-kind');
  const versionEl = get('vinilo-primary-version');
  const macRow = get('vinilo-mac');
  const macLink = get('vinilo-mac-download');
  if (versionEl && version) versionEl.textContent = version;
  if (macRow) macRow.hidden = !dmg;
  if (macLink && dmg) macLink.href = dmg.url;
  // An Intel Mac cannot run the arm64 DMG, and the AppImage is no use there either.
  const mac = os === 'mac';
  if (mac && arch === 'x86') {
    if (link) link.href = `${RELEASES}/latest`;
    if (title) title.textContent = t('Ver versiones y descargas');
    if (iconEl) iconEl.hidden = true;
    return true;
  }
  const chosen = mac && dmg ? dmg : appImage;
  if (!chosen) return false;
  if (link) link.href = chosen.url;
  // The button names the system it downloads for, with its mark: the apple for the DMG, the
  // penguin for the AppImage.
  if (title) title.textContent = chosen === dmg ? t('Descargar para macOS') : t('Descargar AppImage');
  if (iconEl) {
    iconEl.src = chosen === dmg ? '/platform-apple.svg' : '/platform-linux.svg';
    iconEl.hidden = false;
  }
  if (kind && chosen === dmg) kind.textContent = t('DMG para Apple Silicon (M1/M2/M3/M4 y posteriores)');
  if (macRow && chosen === dmg) macRow.hidden = true;
  return true;
}

export async function bootViniloDownload({ document: doc, navigator: nav, fetch: fetchImpl = fetch } = globalThis) {
  if (!doc?.getElementById?.('vinilo-primary-download')) return false;
  const get = (id) => doc.getElementById(id);
  const os = detectPlatform(nav);
  const arch = os === 'mac' ? await detectArchitecture(nav).catch(() => 'unknown') : 'unknown';
  try {
    const response = await fetchImpl(LATEST, { headers: { Accept: 'application/vnd.github+json' }, cache: 'no-store' });
    if (response.ok) return render(get, await response.json(), os, arch);
  } catch {
    /* Offline or rate-limited: the last verified release below still picks the right system. */
  }
  render(get, FALLBACK, os, arch);
  return false;
}

if (typeof document !== 'undefined' && typeof document.getElementById === 'function') {
  // Failures already leave the static AppImage link in place.
  bootViniloDownload({ document, navigator, fetch }).catch(() => false);
}
