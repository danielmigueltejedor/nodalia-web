import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const GH_USER = 'danielmigueltejedor';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const githubRepo = (name) => `https://github.com/${GH_USER}/${name}`;
const rawAsset = (repo, assetPath, branch = 'main') =>
  `https://raw.githubusercontent.com/${GH_USER}/${repo}/${branch}/${assetPath}`;
const productDomain = (subdomain) => `https://${subdomain}.getnodalia.com`;

export const brand = {
  name: 'Nodalia',
  email: 'hola@getnodalia.com',
  github: `https://github.com/${GH_USER}`,
  portal: 'https://getnodalia.com',
  instagram: 'https://www.instagram.com/getnodalia/',
  x: 'https://x.com/getnodalia',
};

function defineApp(entry) {
  const { id, repo, icon, branch = 'main', previews = [], ...rest } = entry;
  const domain = productDomain(id);
  // A preview that starts with "/" is served by the product's own site (assets/screens/<id>/).
  const asset = (assetPath) => (assetPath.startsWith('/') ? `${domain}${assetPath}` : rawAsset(repo, assetPath, branch));
  return {
    ...rest,
    id,
    domain,
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
