import http from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));
const args = process.argv.slice(2);
const option = (name, fallback) => {
  const index = args.indexOf(`--${name}`);
  if (index >= 0 && args[index + 1] && !args[index + 1].startsWith('--')) return args[index + 1];
  const inline = args.find((arg) => arg.startsWith(`--${name}=`));
  return inline ? inline.split('=').slice(1).join('=') : fallback;
};
const port = Number(option('port', '7100'));
const host = option('host', '127.0.0.1');
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
  '.ico': 'image/x-icon'
};

const server = http.createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, `http://${req.headers.host}`).pathname);
    let file = resolve(root, `.${pathname}`);
    if (file !== root.slice(0, -1) && !file.startsWith(root.endsWith(sep) ? root : root + sep)) {
      res.writeHead(403).end('Forbidden');
      return;
    }
    let info = await stat(file);
    if (info.isDirectory()) {
      file = resolve(file, 'index.html');
      info = await stat(file);
    }
    const type = mime[extname(file).toLowerCase()] || 'application/octet-stream';
    const range = req.headers.range;
    if (range) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(range);
      if (match) {
        const start = match[1] ? Number(match[1]) : 0;
        const end = match[2] ? Math.min(Number(match[2]), info.size - 1) : info.size - 1;
        if (start <= end && start < info.size) {
          res.writeHead(206, {
            'Content-Type': type,
            'Content-Length': end - start + 1,
            'Content-Range': `bytes ${start}-${end}/${info.size}`,
            'Accept-Ranges': 'bytes'
          });
          if (req.method === 'HEAD') res.end();
          else createReadStream(file, { start, end }).pipe(res);
          return;
        }
      }
      res.writeHead(416, { 'Content-Range': `bytes */${info.size}` }).end();
      return;
    }
    res.writeHead(200, {
      'Content-Type': type,
      'Content-Length': info.size,
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'no-cache'
    });
    if (req.method === 'HEAD') res.end();
    else createReadStream(file).pipe(res);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Not found');
  }
});

server.listen(port, host, () => {
  console.log(`Camellia Letters preview: http://${host}:${port}/`);
});
