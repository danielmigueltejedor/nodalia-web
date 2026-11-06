/* Vortia downloads: official GitHub Releases, platform-aware with safe fallback. */
(() => {
  'use strict';

  if (!document.getElementById('vortia-downloads')) return;

  const OWNER = 'danielmigueltejedor';
  const REPO = 'vortia';
  const RELEASES = 'https://github.com/' + OWNER + '/' + REPO + '/releases';
  const LATEST = 'https://api.github.com/repos/' + OWNER + '/' + REPO + '/releases/latest';
  const ASSET_PREFIX = 'https://github.com/' + OWNER + '/' + REPO + '/releases/download/';

  // Last verified stable assets, used only when the public GitHub API is unavailable.
  const FALLBACK = {
    tag_name: 'v0.1.1',
    html_url: RELEASES + '/tag/v0.1.1',
    assets: [
      { name: 'Vortia-0.1.1-linux-x86_64.AppImage', size: 105191928,
        browser_download_url: ASSET_PREFIX + 'v0.1.1/Vortia-0.1.1-linux-x86_64.AppImage' },
      { name: 'Vortia-0.1.1-linux-x86_64.AppImage.sha256', size: 106,
        browser_download_url: ASSET_PREFIX + 'v0.1.1/Vortia-0.1.1-linux-x86_64.AppImage.sha256' },
      { name: 'Vortia-0.1.1-macos-arm64.dmg', size: 57620328,
        browser_download_url: ASSET_PREFIX + 'v0.1.1/Vortia-0.1.1-macos-arm64.dmg' },
      { name: 'Vortia-0.1.1-macos-arm64.dmg.sha256', size: 121,
        browser_download_url: ASSET_PREFIX + 'v0.1.1/Vortia-0.1.1-macos-arm64.dmg.sha256' }
    ]
  };

  const $ = (id) => document.getElementById(id);

  function safeAsset(asset) {
    if (!asset || typeof asset.name !== 'string' || typeof asset.browser_download_url !== 'string') return null;
    try {
      const url = new URL(asset.browser_download_url);
      if (url.protocol !== 'https:' || !url.href.startsWith(ASSET_PREFIX)) return null;
      return { name: asset.name, url: url.href, size: Number(asset.size) || 0 };
    } catch {
      return null;
    }
  }

  function findPlatformAssets(release) {
    const assets = Array.isArray(release.assets) ? release.assets.map(safeAsset).filter(Boolean) : [];
    const linux = assets.find((a) => /^Vortia-.+-linux-(x86_64|amd64)\.AppImage$/i.test(a.name)) || null;
    const mac = assets.find((a) => /^Vortia-.+-macos-(arm64|aarch64|universal)\.dmg$/i.test(a.name)) || null;
    const checksum = (asset) => asset ? (assets.find((a) => a.name === asset.name + '.sha256') || null) : null;
    return { linux, mac, linuxSha: checksum(linux), macSha: checksum(mac) };
  }

  function platform() {
    const ua = navigator.userAgent || '';
    const p = (navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || ua;
    if (/android|iphone|ipad|ipod/i.test(ua) || (/mac/i.test(p) && (navigator.maxTouchPoints || 0) > 1)) return 'other';
    if (/mac/i.test(p)) return 'mac';
    if (/linux|x11/i.test(p)) return 'linux';
    return 'other';
  }

  async function architecture() {
    try {
      if (navigator.userAgentData && typeof navigator.userAgentData.getHighEntropyValues === 'function') {
        const hints = await navigator.userAgentData.getHighEntropyValues(['architecture']);
        if (/^(arm|arm64|aarch64)$/i.test(hints.architecture || '')) return 'arm';
        if (/^(x86|x86_64|amd64)$/i.test(hints.architecture || '')) return 'x86';
      }
    } catch { /* Browser architecture hints are optional. */ }
    if (/aarch64|arm64/i.test(navigator.userAgent || '')) return 'arm';
    return 'unknown';
  }

  function mb(bytes) {
    return bytes ? (bytes / 1e6).toFixed(1).replace('.', ',') + ' MB' : 'Tamaño no disponible';
  }

  function releaseUrl(release) {
    const url = release && release.html_url;
    if (typeof url === 'string' && url.startsWith(RELEASES + '/tag/')) return url;
    return RELEASES;
  }

  function setOption(platformId, asset, checksum, release) {
    const link = $('vortia-' + platformId + '-link');
    const size = $('vortia-' + platformId + '-size');
    const sha = $('vortia-' + platformId + '-sha');
    if (!link || !size || !sha) return;
    const fileType = platformId === 'linux' ? 'AppImage' : 'DMG';
    link.href = asset ? asset.url : releaseUrl(release);
    link.textContent = asset ? 'Descargar ' + fileType + ' ↓' : 'Consultar en GitHub ↗';
    size.textContent = asset ? mb(asset.size) : 'No disponible en esta versión';
    sha.hidden = !checksum;
    if (checksum) sha.href = checksum.url;
  }

  function render(release, os, arch, isFallback) {
    const version = (typeof release.tag_name === 'string' && /^v?[0-9]/.test(release.tag_name))
      ? release.tag_name : 'Versión disponible';
    const packages = findPlatformAssets(release);
    $('vortia-release-version').textContent = version;
    $('vortia-release-source').textContent = isFallback
      ? 'Referencia local: comprueba en GitHub si hay una versión más reciente.'
      : 'Versión estable más reciente publicada en GitHub Releases.';

    setOption('linux', packages.linux, packages.linuxSha, release);
    setOption('mac', packages.mac, packages.macSha, release);

    let selected = null;
    let icon = '';
    let label = 'Ver versiones y descargas';
    let detail = 'Selecciona Linux o macOS en las opciones de descarga.';
    if (os === 'linux') {
      icon = '/platform-linux.svg';
      if (arch === 'arm') {
        detail = 'No hay AppImage Linux ARM64 en esta versión. La descarga publicada es para x86_64.';
      } else if (packages.linux) {
        selected = packages.linux;
        label = 'Descargar para Linux';
        detail = 'AppImage x86_64 · ' + mb(selected.size) + ' · ' + version;
      } else {
        detail = 'No hay AppImage Linux x86_64 en la última versión.';
      }
    } else if (os === 'mac') {
      icon = '/platform-apple.svg';
      const universal = packages.mac && /universal/i.test(packages.mac.name);
      if (arch === 'x86' && !universal) {
        detail = 'No hay DMG compatible con Mac Intel en esta versión. El publicado es para Apple Silicon.';
      } else if (packages.mac) {
        selected = packages.mac;
        label = 'Descargar para macOS';
        detail = (universal ? 'DMG universal' : 'DMG para Apple Silicon (M1/M2/M3/M4 y posteriores)') + ' · ' + mb(selected.size) + ' · ' + version;
      } else {
        detail = 'No hay DMG para macOS en la última versión.';
      }
    }

    const primary = $('vortia-primary-download');
    const iconEl = $('vortia-primary-icon');
    primary.href = selected ? selected.url : releaseUrl(release);
    $('vortia-primary-title').textContent = label;
    $('vortia-primary-detail').textContent = detail;
    if (icon) {
      iconEl.src = icon;
      iconEl.hidden = false;
    } else {
      iconEl.hidden = true;
    }
  }

  async function main() {
    const os = platform();
    render(FALLBACK, os, 'unknown', true);

    const releasePromise = fetch(LATEST, {
      headers: { Accept: 'application/vnd.github+json' },
      cache: 'no-store'
    }).then((response) => {
      if (!response.ok) throw new Error('GitHub Releases unavailable');
      return response.json();
    });
    const [arch, latest] = await Promise.all([
      architecture(),
      releasePromise.catch(() => null)
    ]);

    const valid = latest && !latest.draft && !latest.prerelease &&
      Array.isArray(latest.assets) && latest.assets.length > 0 &&
      typeof latest.tag_name === 'string' && /^v?[0-9]/.test(latest.tag_name);

    render(valid ? latest : FALLBACK, os, arch, !valid);
  }

  main().catch(() => render(FALLBACK, platform(), 'unknown', true));
})();