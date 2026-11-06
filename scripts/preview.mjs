import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const site = process.argv[2] || 'portal';
const port = Number(process.env.PORT || 4317);
const dir = path.join(root, 'dist', site);
const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.webp': 'image/webp',
  '.png': 'image/png',
};

try {
  await stat(path.join(dir, 'index.html'));
} catch {
  console.error(`No existe dist/${site}. Ejecuta antes: npm run build:${site === 'portal' ? 'portal' : site}`);
  process.exit(1);
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', `http://127.0.0.1:${port}`);
    let pathname = decodeURIComponent(url.pathname);
    if (pathname.endsWith('/')) pathname += 'index.html';
    if (pathname === '') pathname = '/index.html';
    const filePath = path.normalize(path.join(dir, pathname));
    if (!filePath.startsWith(dir)) {
      res.writeHead(403).end('Forbidden');
      return;
    }
    const data = await readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': types[ext] || 'application/octet-stream',
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'no-store',
    });
    res.end(data);
  } catch {
    try {
      const fallback = await readFile(path.join(dir, '404.html'));
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(fallback);
    } catch {
      res.writeHead(404).end('Not found');
    }
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Preview ${site}: http://127.0.0.1:${port}/`);
});
