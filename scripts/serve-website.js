#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');

const siteRoot = path.resolve(__dirname, '..', 'website');
const port = Number.parseInt(process.env.VPOS_SITE_PORT || '4173', 10);
const host = '127.0.0.1';
const types = new Map([
  ['.css', 'text/css; charset=utf-8'],
  ['.html', 'text/html; charset=utf-8'],
  ['.ico', 'image/x-icon'],
  ['.jpg', 'image/jpeg'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.png', 'image/png'],
  ['.svg', 'image/svg+xml'],
  ['.webmanifest', 'application/manifest+json'],
]);

function resolveRequest(urlValue) {
  const requestUrl = new URL(urlValue || '/', `http://${host}:${port}`);
  let pathname = decodeURIComponent(requestUrl.pathname);
  if (pathname.endsWith('/')) pathname += 'index.html';
  const target = path.resolve(siteRoot, `.${pathname}`);
  if (target !== siteRoot && !target.startsWith(`${siteRoot}${path.sep}`)) return null;
  return target;
}

const server = http.createServer((request, response) => {
  let target;
  try {
    target = resolveRequest(request.url);
  } catch (_) {
    response.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Bad request');
    return;
  }

  if (!target || !fs.existsSync(target) || !fs.statSync(target).isFile()) {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Not found');
    return;
  }

  const extension = path.extname(target).toLowerCase();
  const cacheControl = ['.jpg', '.png', '.svg'].includes(extension)
    ? 'public, max-age=3600'
    : 'no-cache';
  response.writeHead(200, {
    'Content-Type': types.get(extension) || 'application/octet-stream',
    'Cache-Control': cacheControl,
    'X-Content-Type-Options': 'nosniff',
  });
  fs.createReadStream(target).pipe(response);
});

server.listen(port, host, () => {
  process.stdout.write(`VPOS website: http://${host}:${port}\n`);
});
