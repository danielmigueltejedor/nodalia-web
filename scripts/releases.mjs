// Últimas versiones publicadas en GitHub Releases, leídas al generar las webs.
// Así la página estática ya trae la versión y los enlaces de descarga actuales; los scripts del
// navegador vuelven a consultar GitHub y la ponen al día entre dos generaciones.
// Si GitHub no responde se usa la última lectura guardada en data/releases.json
// (`npm run releases` la renueva). NODALIA_OFFLINE=1 no consulta la red.
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Only these older repositories remain under the personal account until they are migrated.
const PERSONAL_REPOS = new Set(['nodalia-cards', 'nodalia-cards-engine', 'apps-nodalia', 'nodalia-roborock-custom-map', 'studium']);
const repoOwner = (repo) => PERSONAL_REPOS.has(repo) ? 'danielmigueltejedor' : 'getnodalia';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const snapshotPath = path.join(root, 'data', 'releases.json');
const TAG = /^v?\d+(\.\d+){1,3}([-.][0-9A-Za-z.]+)?$/;

/** Reduce una respuesta de la API a lo que usan las webs, y descarta lo que no sea de fiar. */
export function slim(repo, release) {
  if (!release || release.draft || release.prerelease || typeof release.tag_name !== 'string' || !TAG.test(release.tag_name)) return null;
  const owner = repoOwner(repo);
  const prefix = `https://github.com/${owner}/${repo}/releases/download/`;
  const assets = (Array.isArray(release.assets) ? release.assets : [])
    .filter((a) => a && typeof a.name === 'string' && typeof a.browser_download_url === 'string' && a.browser_download_url.startsWith(prefix))
    .map((a) => ({ name: a.name, size: Number(a.size) || 0, browser_download_url: a.browser_download_url }));
  return { tag_name: release.tag_name, published_at: release.published_at || null, html_url: `https://github.com/${owner}/${repo}/releases/tag/${encodeURIComponent(release.tag_name)}`, assets };
}

function readSnapshot() {
  try {
    return JSON.parse(readFileSync(snapshotPath, 'utf8'));
  } catch {
    return {};
  }
}

// Las últimas versiones estables, de la más nueva a la más antigua. Una versión puede salir solo para
// una plataforma, así que las anteriores se guardan en `previous` para que cada sistema siga
// ofreciendo su último paquete (la web elige con `combine`, de assets/app-download.js).
const HISTORY = 5;

async function fetchLatest(repo) {
  const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'nodalia-web-build' };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const response = await fetch(`https://api.github.com/repos/${repoOwner(repo)}/${repo}/releases?per_page=10`, { headers, signal: AbortSignal.timeout(8000) });
  // 404: el proyecto todavía no tiene ninguna versión publicada.
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`GitHub ${response.status}`);
  const list = await response.json();
  const stable = (Array.isArray(list) ? list : []).map((release) => slim(repo, release)).filter(Boolean);
  if (!stable.length) return null;
  const [newest, ...older] = stable;
  return older.length ? { ...newest, previous: older.slice(0, HISTORY) } : newest;
}

/** Devuelve { repo: release | null }. `live` dice de qué proyectos se obtuvo respuesta de GitHub. */
export async function loadReleases(repos) {
  const snapshot = readSnapshot();
  const releases = {};
  const live = [];
  await Promise.all(repos.map(async (repo) => {
    if (process.env.NODALIA_OFFLINE !== '1') {
      try {
        releases[repo] = await fetchLatest(repo);
        live.push(repo);
        return;
      } catch { /* se usa la última lectura guardada */ }
    }
    releases[repo] = snapshot[repo] ?? null;
  }));
  return { releases, live };
}

export function saveSnapshot(releases) {
  const sorted = Object.fromEntries(Object.keys(releases).sort((a, b) => a.localeCompare(b)).map((repo) => [repo, releases[repo]]));
  writeFileSync(snapshotPath, `${JSON.stringify(sorted, null, 1)}\n`, 'utf8');
}

// `npm run releases`: guarda la lectura actual como respaldo para cuando GitHub no responda.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { apps, site } = await import('./data.mjs');
  const repos = [...new Set([...site.releases.map(([, repo]) => repo), ...apps.map((app) => app.repoName), ...site.upcoming.apps.map(([, , , repo]) => repo).filter(Boolean)])];
  const { releases, live } = await loadReleases(repos);
  if (live.length !== repos.length) console.warn(`! sin respuesta de GitHub para: ${repos.filter((repo) => !live.includes(repo)).join(', ')} (se conserva lo guardado)`);
  saveSnapshot(releases);
  console.log(`✓ data/releases.json: ${Object.entries(releases).filter(([, r]) => r).map(([repo, r]) => `${repo} ${r.tag_name}`).join(', ')}`);
}
