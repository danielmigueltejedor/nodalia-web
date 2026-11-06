import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const GH_USER = 'danielmigueltejedor';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const githubRepo = (name) => `https://github.com/${GH_USER}/${name}`;
const rawAsset = (repo, assetPath) =>
  `https://raw.githubusercontent.com/${GH_USER}/${repo}/main/${assetPath}`;
const productDomain = (subdomain) => `https://${subdomain}.getnodalia.com`;

export const brand = {
  name: 'Nodalia',
  email: 'hola@getnodalia.com',
  github: `https://github.com/${GH_USER}`,
  portal: 'https://getnodalia.com',
};

function defineApp(entry) {
  const { id, repo, icon, previews = [], ...rest } = entry;
  return {
    ...rest,
    id,
    domain: productDomain(id),
    repo: githubRepo(repo),
    icon: rawAsset(repo, icon),
    previews: previews.map(([assetPath, alt]) => [rawAsset(repo, assetPath), alt]),
  };
}

const catalog = JSON.parse(readFileSync(path.join(root, 'data', 'apps.json'), 'utf8'));
export const apps = catalog.map(defineApp);
