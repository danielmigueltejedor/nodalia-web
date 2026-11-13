import { lang } from './i18n.js';
// Muestra la última versión publicada de cada proyecto. Si GitHub no responde se conserva el valor incluido en la página.
const API = 'https://api.github.com/repos/';
const PERSONAL_REPOS = new Set(['nodalia-cards', 'nodalia-cards-engine', 'apps-nodalia', 'nodalia-roborock-custom-map', 'studium']);
const repoOwner = (repo) => PERSONAL_REPOS.has(repo) ? 'danielmigueltejedor' : 'getnodalia';

export const isTag = (value) => typeof value === 'string' && /^v?\d+(\.\d+){1,3}([-.][0-9A-Za-z.]+)?$/.test(value);

export function relativeDate(iso, now = Date.now(), locale = lang()) {
  const days = Math.floor((now - Date.parse(iso)) / 86400000);
  if (!Number.isFinite(days) || days < 0) return '';
  const format = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  if (days < 30) return format.format(-days, 'day');
  const months = Math.floor(days / 30);
  if (months < 12) return format.format(-months, 'month');
  return format.format(-Math.floor(days / 365), 'year');
}

// A reading is reused for a few minutes only, so a release published while the page is open (or
// earlier in the same tab) shows on the next visit. After that GitHub is asked again with the
// stored ETag: an unchanged answer is a 304, which does not spend the visitor's rate limit.
export const FRESH_MS = 5 * 60 * 1000;

function storage() {
  try { return globalThis.localStorage || null; } catch { return null; }
}

export async function latest(repo, { fetchImpl = globalThis.fetch, store = storage(), now = Date.now() } = {}) {
  const key = `nodalia-release:${repo}`;
  let cached = null;
  try { cached = JSON.parse(store?.getItem(key) || 'null'); } catch { /* lectura dañada */ }
  if (cached && isTag(cached.tag) && now - (cached.at || 0) < FRESH_MS) return cached;
  const headers = { Accept: 'application/vnd.github+json' };
  if (cached?.etag && isTag(cached.tag)) headers['If-None-Match'] = cached.etag;
  const response = await fetchImpl(`${API}${repoOwner(repo)}/${encodeURIComponent(repo)}/releases/latest`, { headers, cache: 'no-store' });
  let release;
  if (response.status === 304 && cached) {
    release = { ...cached, at: now };
  } else {
    if (!response.ok) throw new Error(`GitHub ${response.status}`);
    const data = await response.json();
    if (data.draft || data.prerelease) throw new Error('not a stable release');
    release = { tag: data.tag_name, date: data.published_at, etag: response.headers?.get?.('ETag') || '', at: now };
  }
  try { store?.setItem(key, JSON.stringify(release)); } catch { /* sin caché */ }
  return release;
}

if (typeof document !== 'undefined') {
  for (const element of document.querySelectorAll('[data-release]')) {
    latest(element.dataset.release).then((release) => {
      if (!isTag(release.tag)) return;
      element.textContent = release.tag;
      // A project that had no release when the page was built appears once it has one.
      const item = element.closest('li');
      if (item) item.hidden = false;
      const when = relativeDate(release.date);
      const time = element.parentElement.querySelector('time');
      if (time && when) { time.dateTime = release.date; time.textContent = when; }
    }).catch(() => { /* se mantiene el valor estático */ });
  }
}
