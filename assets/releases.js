// Muestra la última versión publicada de cada proyecto. Si GitHub no responde se conserva el valor incluido en la página.
const API = 'https://api.github.com/repos/danielmigueltejedor/';

export const isTag = (value) => typeof value === 'string' && /^v?\d+(\.\d+){1,3}([-.][0-9A-Za-z.]+)?$/.test(value);

export function relativeDate(iso, now = Date.now()) {
  const days = Math.floor((now - Date.parse(iso)) / 86400000);
  if (!Number.isFinite(days) || days < 0) return '';
  if (days === 0) return 'hoy';
  if (days === 1) return 'ayer';
  if (days < 30) return `hace ${days} días`;
  const months = Math.floor(days / 30);
  if (months < 12) return `hace ${months} ${months === 1 ? 'mes' : 'meses'}`;
  const years = Math.floor(days / 365);
  return `hace ${years} ${years === 1 ? 'año' : 'años'}`;
}

async function latest(repo) {
  const key = `nodalia-release:${repo}`;
  try {
    const cached = sessionStorage.getItem(key);
    if (cached) return JSON.parse(cached);
  } catch { /* almacenamiento no disponible */ }
  const response = await fetch(`${API}${encodeURIComponent(repo)}/releases/latest`, { headers: { Accept: 'application/vnd.github+json' } });
  if (!response.ok) throw new Error(`GitHub ${response.status}`);
  const data = await response.json();
  const release = { tag: data.tag_name, date: data.published_at };
  try { sessionStorage.setItem(key, JSON.stringify(release)); } catch { /* sin caché */ }
  return release;
}

if (typeof document !== 'undefined') {
  for (const element of document.querySelectorAll('[data-release]')) {
    latest(element.dataset.release).then((release) => {
      if (isTag(release.tag)) element.textContent = release.tag;
      const when = relativeDate(release.date);
      const time = element.parentElement.querySelector('time');
      if (time && when) { time.dateTime = release.date; time.textContent = when; }
    }).catch(() => { /* se mantiene el valor estático */ });
  }
}
