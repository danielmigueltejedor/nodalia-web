import { strict as assert } from 'node:assert';
import { readFile } from 'node:fs/promises';
import { nozzleHalfHeight, scrollProgress, storyCut, storyFrame } from '../assets/scroll-story.js';

assert.equal(scrollProgress(220, 1000, 120), 0);
assert.equal(scrollProgress(120, 1000, 120), 0);
assert.equal(scrollProgress(-380, 1000, 120), .5);
assert.equal(scrollProgress(-880, 1000, 120), 1);
assert.equal(scrollProgress(-1200, 1000, 120), 1);
assert.equal(scrollProgress(-200, 0, 120), 0);
assert.deepEqual(storyFrame(0), { chapter: 1, progress: 0, first: 0, second: 0, third: 0 });
assert.deepEqual(storyFrame(1), { chapter: 3, progress: 1, first: 1, second: 1, third: 1 });
assert.equal(storyFrame(1 / 3).chapter, 2);
assert.equal(storyFrame(2 / 3).chapter, 3);
assert.ok(storyFrame(.5).second > 0 && storyFrame(.5).second < 1);
assert.equal(storyFrame(.5).third, 0);
assert.equal(nozzleHalfHeight(0), 88);
assert.equal(nozzleHalfHeight(.54), 32);
assert.equal(nozzleHalfHeight(1), 76);
assert.equal(storyCut(.70, 'vortia'), 0);
assert.equal(storyCut(.70, 'lienzo'), 0);
assert.equal(storyCut(.9, 'vinilo'), 1);

for (const site of ['portal', 'brujula', 'vortia', 'vinilo', 'lienzo', 'forja', 'pluma', 'letra', 'celdas', 'lamina', 'torno', 'nodalix']) {
  for (const locale of ['', 'en/', 'fr/', 'de/', 'pt/']) {
    const page = await readFile(new URL(`../dist/portal/${site === 'portal' ? '' : `${site}/`}${locale}index.html`, import.meta.url), 'utf8');
    const story = page.match(/<section id="demostracion"[\s\S]*?<\/section>/)?.[0];
    assert.ok(story, `${site}/${locale}: demonstration missing`);
    assert.match(story, /aria-labelledby="story-title"/);
    assert.equal([...story.matchAll(/<li data-story-chapter="[123]"><h3>[^<]+<\/h3><p>[^<]+<\/p>/g)].length, 3);
    assert.match(story, new RegExp(`class="story-skip text-link" href="#${site === 'portal' ? 'aplicaciones' : 'funciones'}"`));
    assert.doesNotMatch(story, /story-active/);
    if (site === 'vortia') assert.match(story, /data-story-canvas="nozzle"/);
    if (site === 'lienzo') {
      assert.match(story, /data-story-canvas="curve"/);
      assert.match(story, /src="\/lienzo\/screens\/lienzo\/lienzo-demo\.jpg"/);
      assert.match(story, /src="\/lienzo\/screens\/lienzo\/lienzo-adjustments\.jpg"/);
    }
    assert.match(page, /type="module" src="\/scroll-story\.js\?v=[0-9a-f]{10}"/);
  }
}
console.log('✓ Demostraciones: once páginas, cinco idiomas, tres etapas y alternativa estática.');
