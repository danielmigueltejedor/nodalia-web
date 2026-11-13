import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Keep links working for repositories that have not moved into the organization yet.
const PERSONAL_REPOS = new Set(['nodalia-cards', 'nodalia-cards-engine', 'apps-nodalia', 'nodalia-roborock-custom-map', 'studium']);
const repoOwner = (name) => PERSONAL_REPOS.has(name) ? 'danielmigueltejedor' : 'getnodalia';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const githubRepo = (name) => `https://github.com/${repoOwner(name)}/${name}`;
const rawAsset = (repo, assetPath, branch = 'main') =>
  `https://raw.githubusercontent.com/${repoOwner(repo)}/${repo}/${branch}/${assetPath}`;

export const brand = {
  name: 'Nodalia',
  email: 'hola@getnodalia.com',
  github: "https://github.com/getnodalia",
  portal: 'https://getnodalia.com',
  instagram: 'https://www.instagram.com/getnodalia/',
  x: 'https://x.com/getnodalia',
  // Donaciones. Pon aquí la página de Buy Me a Coffee; vacío oculta la sección y el enlace del pie.
  coffee: 'https://buymeacoffee.com/getnodalia',
};

function defineApp(entry) {
  const { id, repo, icon, branch = 'main', previews = [], ...rest } = entry;
  // Every product lives under the portal, getnodalia.com/<id>/, so a new app needs no DNS or Pages project.
  const domain = `${brand.portal}/${id}`;
  // A preview that starts with "/" is served by the product's own page (assets/screens/<id>/ → /<id>/screens/<id>/).
  const asset = (assetPath) => (assetPath.startsWith('/') ? `${domain}${assetPath}` : rawAsset(repo, assetPath, branch));
  return {
    ...rest,
    id,
    domain,
    url: `${domain}/`,
    repoName: repo,
    repo: githubRepo(repo),
    icon: asset(icon),
    previews: previews.map(([assetPath, alt]) => [asset(assetPath), alt]),
    localScreens: previews.map(([assetPath]) => assetPath).filter((assetPath) => assetPath.startsWith('/screens/')),
  };
}

const catalog = JSON.parse(readFileSync(path.join(root, 'data', 'apps.json'), 'utf8'));
export const apps = catalog.map(defineApp);
export const site = JSON.parse(readFileSync(path.join(root, 'data', 'site.json'), 'utf8'));
export const repoUrl = githubRepo;
