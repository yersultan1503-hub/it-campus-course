import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), 'dist', 'client');
const port = Number(process.env.PORT || 4176);
const types = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.png':'image/png', '.svg':'image/svg+xml', '.woff2':'font/woff2', '.json':'application/json; charset=utf-8' };
const url = `http://127.0.0.1:${port}/`;
const server = http.createServer(async (req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); res.end(); return; }
  try {
    const pathname = decodeURIComponent(new URL(req.url, url).pathname);
    const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!file.startsWith(root + path.sep)) { res.writeHead(403); res.end(); return; }
    const bytes = await readFile(file);
    res.writeHead(200, { 'Content-Type':types[path.extname(file)] || 'application/octet-stream', 'Cache-Control':'no-cache' });
    res.end(req.method === 'HEAD' ? undefined : bytes);
  } catch { res.writeHead(404); res.end('File not found'); }
});
server.on('error', e => {
  if (e.code === 'EADDRINUSE') { console.log(`Already running: ${url}`); open(); }
  else { console.error(e.message); process.exitCode = 1; }
});
function open() {
  if (process.argv.includes('--open') && process.platform === 'win32') {
    spawn('cmd.exe', ['/c', 'start', '', url], { windowsHide:true, stdio:'ignore' }).unref();
  }
}
server.listen(port, '127.0.0.1', () => { console.log(`IT CAMPUS: ${url}\nKeep this window open. Ctrl+C stops the game server.`); open(); });
