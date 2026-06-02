// Local-only static server for the docs/ folder, so docs/BRD.html (the editable
// PRD) can be opened in the preview pane. Not part of the app, never deployed.
// Run: node scripts/serve-docs.mjs  (or via the "docs" preview launch config).
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, normalize, extname } from 'node:path';

const ROOT = join(process.cwd(), 'docs');
const PORT = 4321;
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
};

createServer(async (req, res) => {
  let rel = decodeURIComponent((req.url || '/').split('?')[0]);
  if (rel === '/') rel = '/BRD.html';
  const path = normalize(join(ROOT, rel));
  if (!path.startsWith(ROOT)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }
  try {
    const data = await readFile(path);
    res.writeHead(200, { 'content-type': TYPES[extname(path)] || 'application/octet-stream' });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end('Not found');
  }
}).listen(PORT, () => console.log(`docs preview on http://localhost:${PORT}/ (serving docs/BRD.html)`));
