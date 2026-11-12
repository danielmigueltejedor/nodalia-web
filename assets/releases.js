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

async function latest(repo) {
  const key = `nodalia-release:${repo}`;
  try {
    const cached = sessionStorage.getItem(key);
    if (cached) return JSON.parse(cached);
  } catch { /* almacenamiento no disponible */ }
  const response = await fetch(`${API}${repoOwner(repo)}/${encodeURIComponent(repo)}/releases/latest`, { headers: { Accept: 'application/vnd.github+json' } });
  if (!response.ok) throw new Error(`GitHub ${response.status}`);
  const data = await response.json();
  if (data.draft || data.prerelease) throw new Error('not a stable release');
  const release = { tag: data.tag_name, date: data.published_at };
  try { sessionStorage.setItem(key, JSON.stringify(release)); } catch { /* sin caché */ }
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
