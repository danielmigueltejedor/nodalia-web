/* Vinilo: the main button downloads the latest AppImage straight from GitHub Releases. */

export const OWNER = 'danielmigueltejedor';
export const REPO = 'vinilo';
export const RELEASES = `https://github.com/${OWNER}/${REPO}/releases`;
export const LATEST = `https://api.github.com/repos/${OWNER}/${REPO}/releases/latest`;
export const ASSET_PREFIX = `https://github.com/${OWNER}/${REPO}/releases/download/`;

/** Last verified release, used in the static page and when the GitHub API is unavailable. */
export const FALLBACK = {
  tag_name: 'v1.1.5',
  assets: [
    {
      name: 'Vinilo-1.1.5-x86_64.AppImage',
      size: 317299192,
      browser_download_url: `${ASSET_PREFIX}v1.1.5/Vinilo-1.1.5-x86_64.AppImage`,
    },
  ],
};

export function findAppImage(release, Url = URL) {
  if (!release || release.draft || release.prerelease || !Array.isArray(release.assets)) return null;
  for (const asset of release.assets) {
    if (!asset || typeof asset.name !== 'string' || !/^Vinilo-.+-x86_64\.AppImage$/.test(asset.name)) continue;
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

export function render(get, release) {
  const appImage = findAppImage(release);
  if (!appImage) return false;
  const version = typeof release.tag_name === 'string' && /^v?[0-9]/.test(release.tag_name) ? release.tag_name : '';
  const link = get('vinilo-primary-download');
  const versionEl = get('vinilo-primary-version');
  if (link) link.href = appImage.url;
  if (versionEl && version) versionEl.textContent = version;
  return true;
}

export async function bootViniloDownload({ document: doc, fetch: fetchImpl = fetch } = globalThis) {
  if (!doc?.getElementById?.('vinilo-primary-download')) return false;
  const get = (id) => doc.getElementById(id);
  try {
    const response = await fetchImpl(LATEST, { headers: { Accept: 'application/vnd.github+json' }, cache: 'no-store' });
    if (!response.ok) return false;
    return render(get, await response.json());
  } catch {
    return false;
  }
}

if (typeof document !== 'undefined' && typeof document.getElementById === 'function') {
  // Failures already leave the static AppImage link in place.
  bootViniloDownload({ document, fetch }).catch(() => false);
}
