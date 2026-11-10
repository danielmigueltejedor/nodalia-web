/* Which installer fits the visitor's computer. Shared by the download pages. */

export function detectPlatform(nav) {
  const ua = nav?.userAgent || '';
  const p = (nav?.userAgentData && nav.userAgentData.platform) || nav?.platform || ua;
  if (/android|iphone|ipad|ipod/i.test(ua) || (/mac/i.test(p) && (nav?.maxTouchPoints || 0) > 1)) {
    return 'other';
  }
  if (/mac/i.test(p)) return 'mac';
  if (/linux|x11/i.test(p)) return 'linux';
  return 'other';
}

export async function detectArchitecture(nav) {
  try {
    if (nav?.userAgentData && typeof nav.userAgentData.getHighEntropyValues === 'function') {
      const hints = await nav.userAgentData.getHighEntropyValues(['architecture']);
      if (/^(arm|arm64|aarch64)$/i.test(hints.architecture || '')) return 'arm';
      if (/^(x86|x86_64|amd64)$/i.test(hints.architecture || '')) return 'x86';
    }
  } catch {
    /* Browser architecture hints are optional. */
  }
  if (/aarch64|arm64/i.test(nav?.userAgent || '')) return 'arm';
  return 'unknown';
}
