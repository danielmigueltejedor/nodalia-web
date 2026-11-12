import { strict as assert } from 'node:assert';
import {
  createSecureLink,
  findGithubCandidate,
  findStoredIso,
  formatGibibytes,
  isSha256,
  normalizeVersion,
  createNodalixRenderer,
  bootNodalixReleases,
} from '../assets/nodalix-releases.js';

assert.equal(normalizeVersion('v1.2.3'), '1.2.3');
assert.equal(isSha256('a'.repeat(64)), true);
assert.equal(isSha256('xyz'), false);
assert.match(formatGibibytes(2 ** 30), /1\s*GiB/);
assert.equal(createSecureLink('http://evil.example/x.iso', 'bad'), null);
assert.ok(createSecureLink('https://github.com/getnodalia/nodalix-os/releases', 'ok'));

const sha = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
const stored = findStoredIso({
  schema: 1,
  isos: [
    {
      channel: 'stable',
      version: '0.9.0',
      sha256: sha,
      sizeBytes: 3_000_000_000,
      url: 'https://downloads.getnodalia.com/nodalix-0.9.0.iso',
      publishedAt: '2026-01-01T00:00:00Z',
    },
  ],
});
assert.equal(stored.version, '0.9.0');

const candidate = findGithubCandidate([
  {
    draft: false,
    prerelease: false,
    tag_name: 'v1.0.0',
    html_url: 'https://github.com/getnodalia/nodalix-os/releases/tag/v1.0.0',
    published_at: '2026-02-01T00:00:00Z',
    assets: [
      {
        name: 'nodalix-1.0.0-x86_64.iso',
        size: 4_000_000_000,
        browser_download_url:
          'https://github.com/getnodalia/nodalix-os/releases/download/v1.0.0/nodalix-1.0.0-x86_64.iso',
        digest: `sha256:${sha}`,
      },
    ],
  },
]);
assert.equal(candidate.iso.name, 'nodalix-1.0.0-x86_64.iso');

function createDocument() {
  const nodes = {};
  const make = (id) => {
    const el = {
      id,
      textContent: '',
      hidden: false,
      children: [],
      replaceChildren(...items) {
        this.children = items;
      },
      append(...items) {
        this.children.push(...items);
      },
    };
    nodes[id] = el;
    return el;
  };
  for (const id of [
    'release-name',
    'release-subtitle',
    'release-actions',
    'release-size',
    'release-version',
    'checksum-block',
    'release-sha',
    'release-disclaimer',
  ]) {
    make(id);
  }
  return {
    nodes,
    getElementById: (id) => nodes[id] || null,
    createElement: (tag) => ({
      tagName: tag,
      href: '',
      textContent: '',
      className: '',
      rel: '',
    }),
  };
}

const doc = createDocument();
const renderer = createNodalixRenderer(doc);
assert.ok(renderer);
const mode = renderer.renderFromSources(
  { schema: 1, isos: [] },
  [
    {
      draft: false,
      prerelease: false,
      tag_name: 'v1.0.0',
      html_url: 'https://github.com/getnodalia/nodalix-os/releases/tag/v1.0.0',
      published_at: '2026-02-01T00:00:00Z',
      assets: [
        {
          name: 'nodalix-1.0.0-x86_64.iso',
          size: 4_000_000_000,
          browser_download_url:
            'https://github.com/getnodalia/nodalix-os/releases/download/v1.0.0/nodalix-1.0.0-x86_64.iso',
          digest: `sha256:${sha}`,
        },
      ],
    },
  ],
);
assert.equal(mode, 'github-iso');
assert.match(doc.nodes['release-name'].textContent, /1\.0\.0/);
assert.equal(doc.nodes['release-sha'].textContent, sha);
assert.equal(doc.nodes['checksum-block'].hidden, false);
assert.ok(doc.nodes['release-actions'].children.length >= 1);

const offlineDoc = createDocument();
const status = await bootNodalixReleases({
  document: offlineDoc,
  fetch: async () => {
    throw new Error('offline');
  },
});
assert.equal(status, 'unavailable');
assert.match(offlineDoc.nodes['release-name'].textContent, /no disponible/i);

console.log('✓ Nodalix: validación de ISO, SHA-256, candidatos GitHub y fallback offline.');
