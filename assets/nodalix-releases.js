/*
 * Descargas oficiales de Nodalix OS.
 * Fuente primaria de versiones: GitHub Releases del proyecto.
 * ISO completa opcional: data/nodalix-iso-releases.json, publicado como /releases.json.
 * El JSON NO crea enlaces ficticios; solo debe incluir objetos ya subidos y verificados.
 */
'use strict';

export const REPO_URL = 'https://github.com/danielmigueltejedor/nodalix-os';
export const RELEASES_API =
  'https://api.github.com/repos/danielmigueltejedor/nodalix-os/releases?per_page=30';
export const ALLOWED_HOSTS = new Set(['github.com', 'downloads.getnodalia.com']);

export function createSecureLink(url, label, primary = false, Url = URL) {
  try {
    const parsed = new Url(url);
    if (parsed.protocol !== 'https:' || !ALLOWED_HOSTS.has(parsed.hostname)) return null;
    return {
      href: parsed.href,
      textContent: label,
      className: `btn ${primary ? 'btn-primary' : 'btn-secondary'}`,
      rel: 'noopener noreferrer',
    };
  } catch {
    return null;
  }
}

export function appendLinks(actions, createAnchor, ...items) {
  actions.replaceChildren();
  for (const item of items) {
    if (!item) continue;
    const anchor = createAnchor(item);
    if (anchor) actions.append(anchor);
  }
}

export function formatGibibytes(bytes, locale = 'es-ES') {
  return Number.isFinite(bytes) && bytes > 0
    ? `${(bytes / 2 ** 30).toLocaleString(locale, { maximumFractionDigits: 2 })} GiB`
    : 'No especificado';
}

export const normalizeVersion = (name) => String(name || '').replace(/^v/i, '');
export const isSha256 = (value) => typeof value === 'string' && /^[a-f0-9]{64}$/i.test(value);

export function findGithubCandidate(releases) {
  if (!Array.isArray(releases)) return null;
  for (const release of releases) {
    if (release.draft || release.prerelease || !Array.isArray(release.assets)) continue;
    const files = release.assets;
    const iso = files.find((a) => /\.iso$/i.test(a.name) && a.browser_download_url);
    const parts = files.filter((a) => /\.iso\.part\d+$/i.test(a.name));
    const script = files.find((a) => /nodalix-download-iso\.py$/i.test(a.name));
    const checksums = files.find((a) => /\.iso\.sha256$|^SHA256SUMS$/i.test(a.name));
    if (iso || (parts.length && script)) {
      return { release, iso, parts, script, checksums };
    }
  }
  return null;
}

export function findStoredIso(manifest, Url = URL) {
  if (manifest?.schema !== 1 || !Array.isArray(manifest.isos)) return null;
  const valid = manifest.isos.filter(
    (entry) =>
      entry &&
      entry.channel === 'stable' &&
      typeof entry.version === 'string' &&
      isSha256(entry.sha256) &&
      Number.isFinite(entry.sizeBytes) &&
      entry.sizeBytes > 0 &&
      createSecureLink(entry.url, 'test', false, Url),
  );
  valid.sort((a, b) => (b.publishedAt || '').localeCompare(a.publishedAt || ''));
  return valid[0] || null;
}

export async function fetchJson(url, fetchImpl = fetch) {
  const response = await fetchImpl(url, {
    cache: 'no-cache',
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

function bindDom(doc) {
  const nodes = {
    title: doc.getElementById('release-name'),
    subtitle: doc.getElementById('release-subtitle'),
    actions: doc.getElementById('release-actions'),
    size: doc.getElementById('release-size'),
    versionNode: doc.getElementById('release-version'),
    checksum: doc.getElementById('checksum-block'),
    checksumValue: doc.getElementById('release-sha'),
    disclaimer: doc.getElementById('release-disclaimer'),
  };
  if (Object.values(nodes).some((node) => !node)) return null;
  return nodes;
}

function createAnchorFactory(doc) {
  return (descriptor) => {
    const anchor = doc.createElement('a');
    anchor.href = descriptor.href;
    anchor.textContent = descriptor.textContent;
    anchor.className = descriptor.className;
    anchor.rel = descriptor.rel;
    return anchor;
  };
}

export function createNodalixRenderer(doc, Url = URL) {
  const nodes = bindDom(doc);
  if (!nodes) return null;
  const createAnchor = createAnchorFactory(doc);
  const link = (url, label, primary = false) => createSecureLink(url, label, primary, Url);

  const showHash = (hash, checksumUrl) => {
    nodes.checksum.hidden = true;
    nodes.checksumValue.textContent = '';
    if (isSha256(hash)) {
      nodes.checksumValue.textContent = hash.toLowerCase();
      nodes.checksum.hidden = false;
    } else if (checksumUrl) {
      const ref = link(checksumUrl, 'Comprobar SHA-256');
      if (ref) nodes.actions.append(createAnchor(ref));
    }
  };

  const showDirect = ({ version, url, bytes, sha256, date, checksumUrl }) => {
    nodes.title.textContent = `Nodalix OS ${version}`;
    nodes.subtitle.textContent = date
      ? `ISO de instalación publicada el ${new Date(date).toLocaleDateString('es-ES')}.`
      : 'ISO completa de instalación.';
    nodes.size.textContent = formatGibibytes(bytes);
    nodes.versionNode.textContent = version;
    appendLinks(
      nodes.actions,
      createAnchor,
      link(url, '↓ Descargar ISO completa', true),
      link(`${REPO_URL}/releases`, 'Ver historial'),
    );
    showHash(sha256, checksumUrl);
    nodes.disclaimer.textContent =
      'Verifica el SHA-256 y realiza una copia de seguridad antes de grabar o instalar la ISO.';
  };

  const showParts = (release, parts, script, checksums) => {
    nodes.title.textContent = `Nodalix OS ${normalizeVersion(release.tag_name)}`;
    nodes.subtitle.textContent =
      'La ISO se distribuye en partes: utiliza el descargador oficial para reconstruir y verificar la imagen completa.';
    nodes.size.textContent = 'Disponible en partes';
    nodes.versionNode.textContent = normalizeVersion(release.tag_name);
    appendLinks(
      nodes.actions,
      createAnchor,
      script
        ? link(script.browser_download_url, '↓ Descargar herramienta oficial', true)
        : link(release.html_url, 'Ver descarga por partes', true),
      link(release.html_url, `Ver ${parts.length} partes y archivos`),
    );
    showHash(null, checksums?.browser_download_url);
    nodes.disclaimer.textContent =
      `Después de descargar el script, ejecútalo con Python 3: python3 nodalix-download-iso.py --version ${normalizeVersion(release.tag_name)}. Sigue la documentación oficial antes de grabar el USB.`;
  };

  const showUnavailable = () => {
    nodes.title.textContent = 'ISO no disponible para descarga directa';
    nodes.subtitle.textContent =
      'Todavía no se ha podido identificar una ISO publicada. Consulta las versiones oficiales mientras se prepara el almacenamiento de imágenes completas.';
    appendLinks(
      nodes.actions,
      createAnchor,
      link(`${REPO_URL}/releases`, 'Consultar versiones oficiales', true),
    );
    nodes.size.textContent = '—';
    nodes.versionNode.textContent = '—';
    nodes.checksum.hidden = true;
    nodes.disclaimer.textContent = 'No se ofrecen archivos ISO ni números de versión sin confirmar.';
  };

  const renderFromSources = (manifest, releases) => {
    const stored = findStoredIso(manifest, Url);
    const official = findGithubCandidate(releases);
    const sameVersion =
      stored &&
      official &&
      normalizeVersion(official.release.tag_name) === normalizeVersion(stored.version);

    if (stored && (!official || sameVersion)) {
      showDirect({
        version: stored.version,
        url: stored.url,
        bytes: stored.sizeBytes,
        sha256: stored.sha256,
        date: stored.publishedAt,
      });
      return 'stored';
    }
    if (official?.iso) {
      const iso = official.iso;
      const sha256 = iso.digest?.startsWith('sha256:') ? iso.digest.slice(7) : undefined;
      showDirect({
        version: normalizeVersion(official.release.tag_name),
        url: iso.browser_download_url,
        bytes: iso.size,
        sha256,
        date: official.release.published_at,
        checksumUrl: official.checksums?.browser_download_url,
      });
      return 'github-iso';
    }
    if (official?.parts?.length) {
      showParts(official.release, official.parts, official.script, official.checksums);
      return 'github-parts';
    }
    if (stored) {
      showDirect({
        version: stored.version,
        url: stored.url,
        bytes: stored.sizeBytes,
        sha256: stored.sha256,
        date: stored.publishedAt,
      });
      return 'stored-fallback';
    }
    showUnavailable();
    return 'unavailable';
  };

  return { showDirect, showParts, showUnavailable, renderFromSources, nodes };
}

export async function bootNodalixReleases({
  document: doc = globalThis.document,
  fetch: fetchImpl = fetch,
  URL: Url = URL,
} = {}) {
  const renderer = createNodalixRenderer(doc, Url);
  if (!renderer) return null;

  try {
    const [manifestResult, githubResult] = await Promise.allSettled([
      fetchJson('/releases.json', fetchImpl),
      fetchJson(RELEASES_API, fetchImpl),
    ]);
    const manifest = manifestResult.status === 'fulfilled' ? manifestResult.value : null;
    const releases = githubResult.status === 'fulfilled' ? githubResult.value : null;
    return renderer.renderFromSources(manifest, releases);
  } catch {
    renderer.showUnavailable();
    return 'unavailable';
  }
}

const runningInBrowser = typeof document !== 'undefined' && typeof document.getElementById === 'function';
if (runningInBrowser) {
  bootNodalixReleases({ document, fetch, URL }).catch(() => {
    createNodalixRenderer(document)?.showUnavailable();
  });
}
