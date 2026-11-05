/*
 * Descargas oficiales de Nodalix OS.
 * Fuente primaria de versiones: GitHub Releases del proyecto.
 * ISO completa opcional: data/nodalix-iso-releases.json, publicado como /releases.json.
 * El JSON NO crea enlaces ficticios; solo debe incluir objetos ya subidos y verificados.
 */
(() => {
  'use strict';
  const gh = 'https://github.com/danielmigueltejedor/nodalix-os';
  const api = 'https://api.github.com/repos/danielmigueltejedor/nodalix-os/releases?per_page=30';
  const title = document.getElementById('release-name');
  const subtitle = document.getElementById('release-subtitle');
  const actions = document.getElementById('release-actions');
  const size = document.getElementById('release-size');
  const versionNode = document.getElementById('release-version');
  const checksum = document.getElementById('checksum-block');
  const checksumValue = document.getElementById('release-sha');
  const disclaimer = document.getElementById('release-disclaimer');
  if (!title || !actions || !subtitle || !size || !versionNode || !checksum || !checksumValue || !disclaimer) return;

  function link(url, label, primary = false) {
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== 'https:' || !['github.com', 'downloads.getnodalia.com'].includes(parsed.hostname)) return null;
      const a = document.createElement('a');
      a.href = parsed.href;
      a.textContent = label;
      a.className = `btn ${primary ? 'btn-primary' : 'btn-secondary'}`;
      a.rel = 'noopener noreferrer';
      return a;
    } catch { return null; }
  }
  const showLinks = (...items) => {
    actions.replaceChildren();
    for (const item of items) {
      if (item) actions.append(item);
    }
  };
  const formatSize = (bytes) => Number.isFinite(bytes) && bytes > 0
    ? `${(bytes / 2 ** 30).toLocaleString('es-ES', { maximumFractionDigits: 2 })} GiB`
    : 'No especificado';
  const normalizeVersion = (name) => String(name || '').replace(/^v/i, '');
  const isSha = (v) => typeof v === 'string' && /^[a-f0-9]{64}$/i.test(v);
  function showHash(hash, checksumUrl) {
    checksum.hidden = true;
    checksumValue.textContent = '';
    if (isSha(hash)) {
      checksumValue.textContent = hash.toLowerCase();
      checksum.hidden = false;
    } else if (checksumUrl) {
      const ref = link(checksumUrl, 'Comprobar SHA-256');
      if (ref) actions.append(ref);
    }
  }
  function showDirect({ version, url, bytes, sha256, date, checksumUrl }) {
    title.textContent = `Nodalix OS ${version}`;
    subtitle.textContent = date ? `ISO de instalación publicada el ${new Date(date).toLocaleDateString('es-ES')}.` : 'ISO completa de instalación.';
    size.textContent = formatSize(bytes);
    versionNode.textContent = version;
    showLinks(link(url, '↓ Descargar ISO completa', true), link(`${gh}/releases`, 'Ver historial'));
    showHash(sha256, checksumUrl);
    disclaimer.textContent = 'Verifica el SHA-256 y realiza una copia de seguridad antes de grabar o instalar la ISO.';
  }
  function showParts(release, parts, script, checksums) {
    title.textContent = `Nodalix OS ${normalizeVersion(release.tag_name)}`;
    subtitle.textContent = 'La ISO se distribuye en partes: utiliza el descargador oficial para reconstruir y verificar la imagen completa.';
    size.textContent = 'Disponible en partes';
    versionNode.textContent = normalizeVersion(release.tag_name);
    showLinks(
      script ? link(script.browser_download_url, '↓ Descargar herramienta oficial', true) : link(release.html_url, 'Ver descarga por partes', true),
      link(release.html_url, `Ver ${parts.length} partes y archivos`),
    );
    showHash(null, checksums?.browser_download_url);
    disclaimer.textContent = `Después de descargar el script, ejecútalo con Python 3: python3 nodalix-download-iso.py --version ${normalizeVersion(release.tag_name)}. Sigue la documentación oficial antes de grabar el USB.`;
  }
  function showUnavailable() {
    title.textContent = 'ISO no disponible para descarga directa';
    subtitle.textContent = 'Todavía no se ha podido identificar una ISO publicada. Consulta las versiones oficiales mientras se prepara el almacenamiento de imágenes completas.';
    showLinks(link(`${gh}/releases`, 'Consultar versiones oficiales', true));
    size.textContent = '—';
    versionNode.textContent = '—';
    checksum.hidden = true;
    disclaimer.textContent = 'No se ofrecen archivos ISO ni números de versión sin confirmar.';
  }
  function findGithubCandidate(releases) {
    if (!Array.isArray(releases)) return null;
    for (const r of releases) {
      if (r.draft || r.prerelease || !Array.isArray(r.assets)) continue;
      const files = r.assets;
      const iso = files.find(a => /\.iso$/i.test(a.name) && a.browser_download_url);
      const parts = files.filter(a => /\.iso\.part\d+$/i.test(a.name));
      const script = files.find(a => /nodalix-download-iso\.py$/i.test(a.name));
      const checksums = files.find(a => /\.iso\.sha256$|^SHA256SUMS$/i.test(a.name));
      if (iso || (parts.length && script)) return {release:r,iso,parts,script,checksums};
    }
    return null;
  }
  function findStoredIso(manifest) {
    if (manifest?.schema !== 1 || !Array.isArray(manifest.isos)) return null;
    const valid = manifest.isos.filter(v => v && v.channel === 'stable' && typeof v.version === 'string' &&
      isSha(v.sha256) && Number.isFinite(v.sizeBytes) && v.sizeBytes > 0 && link(v.url, 'test'));
    valid.sort((a,b) => (b.publishedAt || '').localeCompare(a.publishedAt || ''));
    return valid[0] || null;
  }
  async function fetchJson(url) {
    const r = await fetch(url, {cache:'no-cache', headers: {Accept:'application/json'}});
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  }
  async function render() {
    const [manifestResult, githubResult] = await Promise.allSettled([
      fetchJson('/releases.json'),
      fetchJson(api),
    ]);
    const stored = manifestResult.status === 'fulfilled' ? findStoredIso(manifestResult.value) : null;
    const official = githubResult.status === 'fulfilled' ? findGithubCandidate(githubResult.value) : null;
    const sameVersion = stored && official && normalizeVersion(official.release.tag_name) === normalizeVersion(stored.version);
    if (stored && (!official || sameVersion)) {
      showDirect({version:stored.version,url:stored.url,bytes:stored.sizeBytes,sha256:stored.sha256,date:stored.publishedAt});
      return;
    }
    if (official?.iso) {
      const iso = official.iso;
      const sha256 = iso.digest?.startsWith('sha256:') ? iso.digest.slice(7) : undefined;
      showDirect({version:normalizeVersion(official.release.tag_name),url:iso.browser_download_url,bytes:iso.size,sha256,date:official.release.published_at,checksumUrl:official.checksums?.browser_download_url});
    } else if (official?.parts?.length) {
      showParts(official.release,official.parts,official.script,official.checksums);
    } else if (stored) {
      showDirect({version:stored.version,url:stored.url,bytes:stored.sizeBytes,sha256:stored.sha256,date:stored.publishedAt});
    } else {
      showUnavailable();
    }
  }
  render().catch(showUnavailable);
})();
