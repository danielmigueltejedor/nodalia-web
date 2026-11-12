import { t, lang } from './i18n.js';
import { detectPlatform, detectArchitecture } from './platform.js';

/* The main download button of an app page: it offers the installer for the visitor's system,
   with the Apple logo on a Mac and the penguin on Linux, from the latest GitHub release.
   The page is generated with the release that was current when it was built
   (#app-download-config); this script asks GitHub again, so a release published since then
   shows up without rebuilding the site. */

export const OWNER = 'getnodalia';
const ICONS = { linux: '/platform-linux.svg', mac: '/platform-apple.svg' };
// Systems with a second installer for the same OS (Vinilo ships two Mac editions) list it as a card only.
const CARDS = ['linux', 'mac', 'macAlt', 'windows'];
const TITLES = { linux: 'Descargar para Linux', mac: 'Descargar para macOS', windows: 'Descargar para Windows' };

export const releasesUrl = (repo) => `https://github.com/${OWNER}/${repo}/releases`;

function safe(asset, repo) {
  if (!asset || typeof asset.name !== 'string' || typeof asset.browser_download_url !== 'string') return null;
  try {
    const url = new URL(asset.browser_download_url);
    if (url.protocol !== 'https:' || !url.href.startsWith(`${releasesUrl(repo)}/download/`)) return null;
    return { name: asset.name, url: url.href, size: Number(asset.size) || 0 };
  } catch {
    return null;
  }
}

export function isRelease(release) {
  return Boolean(release && !release.draft && !release.prerelease && typeof release.tag_name === 'string' && /^v?[0-9]/.test(release.tag_name) && Array.isArray(release.assets));
}

/** The installer for each system that the release carries, by the app's file-name patterns. */
export function packages(release, config) {
  const out = { linux: null, mac: null, macAlt: null, windows: null };
  if (!isRelease(release)) return out;
  const assets = release.assets.map((asset) => safe(asset, config.repo)).filter(Boolean);
  for (const os of Object.keys(out)) {
    const pattern = config.patterns?.[os];
    if (pattern) {
      const matches = assets.filter((asset) => new RegExp(pattern, 'i').test(asset.name));
      out[os] = os === 'mac' || os === 'macAlt'
        ? matches.find((asset) => /universal/i.test(asset.name)) || matches[0] || null
        : matches[0] || null;
    }
  }
  return out;
}

/** What a file is, in words that read the same in every language the site speaks. */
export function kind(os, asset) {
  if (!asset) return '';
  if (os === 'mac' || os === 'macAlt') return /universal/i.test(asset.name) ? 'DMG · Universal' : 'DMG · Apple Silicon';
  if (os === 'windows') return /\.msi$/i.test(asset.name) ? 'MSI · Windows x64' : 'Windows x64';
  return /\.AppImage$/i.test(asset.name) ? 'AppImage · x86_64' : 'Linux x86_64';
}

export function megabytes(bytes, locale = lang()) {
  if (!bytes) return '';
  return `${(bytes / 1e6).toLocaleString(locale, { maximumFractionDigits: 0 })} MB`;
}

/**
 * Which file the main button offers. A Mac with an Intel processor cannot run an arm64 DMG,
 * so it is sent to the release page instead; so is a phone, or a system with no installer.
 */
export function choose(release, config, os = 'other', arch = 'unknown') {
  const found = packages(release, config);
  const page = isRelease(release) && typeof release.html_url === 'string' && release.html_url.startsWith(`${releasesUrl(config.repo)}/tag/`)
    ? release.html_url
    : `${releasesUrl(config.repo)}/latest`;
  let target = ['linux', 'mac', 'windows'].includes(os) ? found[os] : null;
  if (target && os === 'mac' && arch === 'x86' && !/universal/i.test(target.name)) target = null;
  if (target && os === 'mac' && arch === 'unknown') target = null;
  if (target && os === 'linux' && arch !== 'x86') target = null;
  return {
    os: target ? os : 'other',
    asset: target,
    href: target ? target.url : page,
    icon: target ? ICONS[os] || '' : '',
    title: target ? TITLES[os] : 'Descargar',
    version: isRelease(release) ? release.tag_name : '',
    found,
    page,
  };
}

/** The line under the button: what the file is, its size and the version. */
export function detail(choice, locale) {
  if (!choice.asset) return choice.version;
  return [kind(choice.os, choice.asset), megabytes(choice.asset.size, locale), choice.version].filter(Boolean).join(' · ');
}

/** The card's label: "Descargar" translates, the file kind (DMG, AppImage...) stays as it is. */
function setCardLabel(card, fileKind) {
  if (!fileKind) {
    card.textContent = t('Consultar en GitHub ↗');
    return;
  }
  const doc = card.ownerDocument;
  if (!doc || typeof card.replaceChildren !== 'function') {
    card.textContent = `${t('Descargar')} ${fileKind}`;
    return;
  }
  const span = doc.createElement('span');
  span.setAttribute('translate', 'no');
  span.textContent = fileKind;
  card.replaceChildren(`${t('Descargar')} `, span);
}

export function render(get, release, config, os, arch) {
  const choice = choose(release, config, os, arch);
  if (!choice.version) return false;
  const link = get('app-primary-download');
  const icon = get('app-primary-icon');
  const title = get('app-primary-title');
  const info = get('app-primary-detail');
  if (link) link.href = choice.href;
  // Literal keys, so the build ships their translations with the page.
  const titles = { linux: t('Descargar para Linux'), mac: t('Descargar para macOS'), windows: t('Descargar para Windows'), other: t('Descargar') };
  if (title) title.textContent = titles[choice.os] || titles.other;
  if (info) info.textContent = detail(choice);
  if (icon) {
    icon.hidden = !choice.icon;
    if (choice.icon) icon.src = choice.icon;
  }
  // The downloads section lists every system's installer, whichever one the button offers.
  const versionLabel = get('app-release-version');
  if (versionLabel) versionLabel.textContent = choice.version;
  for (const other of CARDS) {
    const card = get(`app-card-${other}`);
    if (!card) continue;
    const asset = choice.found[other];
    card.href = asset ? asset.url : choice.page;
    setCardLabel(card, asset ? kind(other, asset) : '');
    const size = get(`app-card-${other}-size`);
    if (size) size.textContent = asset ? megabytes(asset.size) : '';
  }
  return true;
}

export async function bootAppDownload({ document: doc, navigator: nav, fetch: fetchImpl = fetch } = globalThis) {
  const holder = doc?.getElementById?.('app-download-config');
  if (!holder) return false;
  let config;
  try {
    config = JSON.parse(holder.textContent);
  } catch {
    return false;
  }
  const get = (id) => doc.getElementById(id);
  const os = detectPlatform(nav);
  const architecturePromise = os === 'mac' || os === 'linux'
    ? detectArchitecture(nav)
    : Promise.resolve('unknown');
  // Keep the primary button safe while architecture detection is still pending.
  if (config.release) render(get, config.release, config, os, 'unknown');
  const latestPromise = Promise.resolve().then(() => fetchImpl(
    `https://api.github.com/repos/${OWNER}/${encodeURIComponent(config.repo)}/releases/latest`,
    { headers: { Accept: 'application/vnd.github+json' }, cache: 'no-store' },
  )).catch(() => null);
  const arch = await architecturePromise;
  if (config.release) render(get, config.release, config, os, arch);
  try {
    const response = await latestPromise;
    if (!response?.ok) return Boolean(config.release);
    const latest = await response.json();
    if (render(get, latest, config, os, arch)) {
      const section = get('app-download');
      if (section) section.hidden = false;
      return true;
    }
  } catch {
    /* Offline or rate-limited: the built-in release stays. */
  }
  return Boolean(config.release);
}

if (typeof document !== 'undefined' && typeof document.getElementById === 'function') {
  bootAppDownload({ document, navigator, fetch }).catch(() => false);
}
