// Research Desk — local server: serves the app and keeps all data in the db/ folder.
// Run with: node server.js  (or double-click start.bat). No dependencies — Node.js is enough.
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.PORT) || 8765;
const APP_FILE = path.join(__dirname, 'Research Desk offline.html');
const DB_DIR = path.join(__dirname, 'db');
const PDF_DIR = path.join(DB_DIR, 'pdf-library');
const NOTES_DIR = path.join(DB_DIR, 'notes');
const COLLECTIONS = ['plan', 'publications', 'trips', 'funding', 'todos', 'notes', 'library', 'settings'];
const MAX_JSON_BYTES = 50 * 1024 * 1024;
const ALLOWED_HOSTS = new Set(['localhost:' + PORT, '127.0.0.1:' + PORT, '[::1]:' + PORT]);

/* ——— files ——— */

// Writes through a temporary file + rename, so an interrupted write never leaves a broken JSON file.
function writeFileAtomic(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = file + '.' + process.pid + '.tmp';
  fs.writeFileSync(tmp, content);
  try {
    fs.renameSync(tmp, file);
  } catch (e) {
    // Windows can block the rename (antivirus, an open editor) — fall back to a direct write.
    fs.writeFileSync(file, content);
    try { fs.unlinkSync(tmp); } catch (e2) {}
  }
}

function readJson(file) {
  let text = fs.readFileSync(file, 'utf8');
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  return JSON.parse(text);
}

function collectionFile(name) { return path.join(DB_DIR, name + '.json'); }

function readCollections() {
  const data = {};
  for (const name of COLLECTIONS) {
    const file = collectionFile(name);
    if (!fs.existsSync(file)) continue;
    try {
      data[name] = readJson(file);
    } catch (e) {
      throw new Error('The file db/' + name + '.json is corrupted: ' + e.message);
    }
  }
  return data;
}

function slug(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/\p{M}/gu, '')
    .replace(/ł/g, 'l').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48) || 'note';
}

const noteId = n => String(n.id).replace(/[^a-z0-9]/gi, '');

// Every note is also written as a readable .txt file in db/notes (<title>-<id>.txt).
function syncNoteFiles(notes, previousNotes) {
  if (!Array.isArray(notes)) return;
  fs.mkdirSync(NOTES_DIR, { recursive: true });
  const expected = new Set();
  for (const n of notes) {
    if (!n || !n.id) continue;
    const name = slug(n.title) + '-' + noteId(n) + '.txt';
    expected.add(name);
    const date = n.date ? new Date(n.date).toLocaleString('pl-PL') : '';
    const content = (n.title || '—') + '\r\n' + date + '\r\n\r\n' + String(n.text || '').replace(/\r?\n/g, '\r\n');
    const file = path.join(NOTES_DIR, name);
    try {
      if (!fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== content) writeFileAtomic(file, content);
    } catch (e) { console.warn('Could not write note file', name, e.message); }
  }
  // Removes stale note files (after a title change or a deleted note) — only those whose id
  // belongs to a known note; any other file in the folder is left alone.
  const known = new Set([].concat(notes, Array.isArray(previousNotes) ? previousNotes : [])
    .filter(n => n && n.id).map(noteId));
  for (const f of fs.readdirSync(NOTES_DIR)) {
    const m = f.match(/-([a-z0-9]+)\.txt$/i);
    if (!m || expected.has(f) || !known.has(m[1])) continue;
    try { fs.unlinkSync(path.join(NOTES_DIR, f)); } catch (e) {}
  }
}

// PDF file name without path parts or characters Windows does not allow.
function safePdfName(name) {
  let s = path.basename(String(name || '')).replace(/[<>:"/\\|?*]|\p{Cc}/gu, '_').replace(/^[.\s]+|[.\s]+$/g, '');
  if (!s) s = 'document.pdf';
  if (!/\.pdf$/i.test(s)) s += '.pdf';
  return s.slice(0, 180);
}

function freePdfName(name) {
  if (!fs.existsSync(path.join(PDF_DIR, name))) return name;
  const m = name.match(/^(.*?)(\.pdf)$/i);
  let i = 2;
  while (fs.existsSync(path.join(PDF_DIR, m[1] + ' (' + i + ')' + m[2]))) i++;
  return m[1] + ' (' + i + ')' + m[2];
}

/* ——— HTTP ——— */

function send(res, status, body, type) {
  res.writeHead(status, { 'Content-Type': type || 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(body);
}
const sendJson = (res, status, obj) => send(res, status, JSON.stringify(obj), 'application/json; charset=utf-8');

function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let length = 0;
    req.on('data', c => {
      length += c.length;
      if (limit && length > limit) { reject(new Error('Request too large')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

// Requiring a JSON / PDF content type forces a CORS preflight, so other websites cannot write here.
const hasType = (req, type) => new RegExp('^' + type.replace('/', '\\/'), 'i').test(req.headers['content-type'] || '');

async function handle(req, res) {
  // DNS rebinding protection: local addresses only.
  if (!ALLOWED_HOSTS.has(String(req.headers.host || '').toLowerCase())) return send(res, 403, 'Forbidden');

  const url = new URL(req.url, 'http://localhost');
  const pathname = decodeURIComponent(url.pathname);

  if (req.method === 'GET' && (pathname === '/' || pathname === '/index.html')) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
    return fs.createReadStream(APP_FILE).pipe(res);
  }

  if (req.method === 'GET' && pathname === '/api/ping') return sendJson(res, 200, { ok: true });

  if (req.method === 'GET' && pathname === '/api/db') return sendJson(res, 200, readCollections());

  let m = pathname.match(/^\/api\/db\/([a-z]+)$/);
  if (m && req.method === 'PUT') {
    const name = m[1];
    if (!COLLECTIONS.includes(name)) return send(res, 404, 'Unknown collection');
    if (!hasType(req, 'application/json')) return send(res, 415, 'JSON required');
    const data = JSON.parse((await readBody(req, MAX_JSON_BYTES)).toString('utf8'));
    const file = collectionFile(name);
    let previous = null;
    if (name === 'notes') { try { previous = readJson(file); } catch (e) {} }
    writeFileAtomic(file, JSON.stringify(data, null, 2));
    if (name === 'notes') syncNoteFiles(data, previous);
    return sendJson(res, 200, { ok: true });
  }

  if (pathname === '/api/files' && req.method === 'POST') {
    if (!hasType(req, 'application/pdf')) return send(res, 415, 'PDF required');
    const body = await readBody(req);
    fs.mkdirSync(PDF_DIR, { recursive: true });
    const name = freePdfName(safePdfName(url.searchParams.get('name')));
    fs.writeFileSync(path.join(PDF_DIR, name), body);
    return sendJson(res, 200, { name });
  }

  m = pathname.match(/^\/api\/files\/(.+)$/);
  if (m) {
    const name = safePdfName(m[1]);
    const file = path.join(PDF_DIR, name);
    if (req.method === 'GET') {
      if (!fs.existsSync(file)) return send(res, 404, 'File not found: db/pdf-library/' + name);
      res.writeHead(200, {
        'Content-Type': 'application/pdf',
        'Content-Disposition': "inline; filename*=UTF-8''" + encodeURIComponent(name),
        'Cache-Control': 'no-store'
      });
      return fs.createReadStream(file).pipe(res);
    }
    if (req.method === 'DELETE') {
      try { fs.unlinkSync(file); } catch (e) { if (e.code !== 'ENOENT') throw e; }
      return sendJson(res, 200, { ok: true });
    }
  }

  send(res, 404, 'Not found');
}

function openBrowser() {
  if (!process.argv.includes('--open')) return;
  const address = 'http://localhost:' + PORT + '/';
  const { exec } = require('child_process');
  const command = process.platform === 'win32' ? 'start "" "' + address + '"' : process.platform === 'darwin' ? 'open ' + address : 'xdg-open ' + address;
  exec(command);
}

const onRequest = (req, res) => {
  handle(req, res).catch(e => {
    console.error(e);
    if (!res.headersSent) send(res, 500, e.message);
  });
};

const server = http.createServer(onRequest);

server.on('error', e => {
  if (e.code === 'EADDRINUSE') {
    console.log('Research Desk is already running at http://localhost:' + PORT);
    openBrowser();
    setTimeout(() => process.exit(0), 500);
  } else {
    console.error(e);
    process.exit(1);
  }
});

server.listen(PORT, '127.0.0.1', () => {
  for (const dir of [DB_DIR, PDF_DIR, NOTES_DIR]) fs.mkdirSync(dir, { recursive: true });
  // localhost may resolve to ::1 — listen on IPv6 too when it is available.
  const ipv6 = http.createServer(onRequest);
  ipv6.on('error', () => {});
  ipv6.listen(PORT, '::1');
  console.log('Research Desk: http://localhost:' + PORT + '/');
  console.log('Data: ' + DB_DIR);
  console.log('Close this window to stop the server.');
  openBrowser();
});
