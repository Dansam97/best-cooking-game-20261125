// A pocket static server for game/, so the entry can be played and
// screenshotted locally with no build step: `node serve.ts [--port 8123]`
// serves http://localhost:8123. It answers only for files inside game/ and
// knows the handful of MIME types a browser game loads; it is a development
// convenience, nothing more.

import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const gameDir = resolve(fileURLToPath(new URL('./game', import.meta.url)));
const portFlag = process.argv.indexOf('--port');
const port = portFlag === -1 ? 8123 : Number(process.argv[portFlag + 1]) || 8123;

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
};

createServer((request, response) => {
  const url = new URL(request.url ?? '/', 'http://localhost');
  const wanted = url.pathname === '/' ? '/index.html' : url.pathname;
  const file = normalize(join(gameDir, wanted));
  if (file !== gameDir && !file.startsWith(gameDir + sep)) {
    response.writeHead(403).end('outside game/');
    return;
  }
  if (!existsSync(file) || !statSync(file).isFile()) {
    response.writeHead(404).end('not here');
    return;
  }
  response.writeHead(200, { 'content-type': MIME_TYPES[extname(file)] ?? 'application/octet-stream' });
  createReadStream(file).pipe(response);
}).listen(port, () => {
  console.log(`Sizzle & Serve on http://localhost:${port}`);
});
