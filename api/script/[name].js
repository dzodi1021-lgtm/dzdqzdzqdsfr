'use strict';

const path = require('path');
const fs = require('fs/promises');
const crypto = require('crypto');

const ROOT_DIR = process.cwd();
const SCRIPTS_DIR = path.join(ROOT_DIR, 'scripts');
const EXTENSIONS = ['.txt', '.lua'];
const POSTIMG_URL = 'https://i.postimg.cc/Jzm7phVG/image.png';
const MAX_NAME_LENGTH = 80;

function sanitizeScriptName(input) {
  return String(input ?? '')
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .slice(0, MAX_NAME_LENGTH);
}

function getQueryParam(req, key) {
  const q = req && req.query ? req.query : {};
  const v = q[key];
  return v === undefined || v === null ? '' : String(v);
}

function getParam(req, key) {
  const p = req && req.params ? req.params : {};
  const v = p[key];
  return v === undefined || v === null ? '' : String(v);
}

function getHeader(req, name) {
  const h = req && req.headers ? req.headers : {};
  const v = h[String(name).toLowerCase()];
  return v === undefined || v === null ? '' : String(v);
}

function isBrowserLike(req) {
  const accept = getHeader(req, 'accept').toLowerCase();
  const ua = getHeader(req, 'user-agent').toLowerCase();
  const fetchMode = getHeader(req, 'sec-fetch-mode').toLowerCase();
  const fetchDest = getHeader(req, 'sec-fetch-dest').toLowerCase();

  if (fetchMode === 'navigate') return true;
  if (fetchDest === 'document') return true;
  if (accept.includes('text/html')) return true;

  return /\b(mozilla|chrome|safari|firefox|edg\/)\b/.test(ua);
}

function createNonce() {
  return crypto.randomBytes(16).toString('base64');
}

function setStatus(res, statusCode) {
  if (res && typeof res.status === 'function') res.status(statusCode);
  else if (res) res.statusCode = statusCode;
}

function send(res, body) {
  if (res && typeof res.send === 'function') res.send(body);
  else if (res && typeof res.end === 'function') res.end(body);
}

function setHeader(res, name, value) {
  if (!res) return;
  if (typeof res.setHeader === 'function') res.setHeader(name, value);
  else if (typeof res.set === 'function') res.set(name, value);
}

function applyCommonHeaders(res) {
  setHeader(res, 'X-Content-Type-Options', 'nosniff');
  setHeader(res, 'Referrer-Policy', 'strict-origin-when-cross-origin');
  setHeader(res, 'Cache-Control', 'no-store');
}

function buildCsp(nonce) {
  return [
    "default-src 'none'",
    "base-uri 'none'",
    "form-action 'none'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    `img-src 'self' data: https://i.postimg.cc`,
    `style-src 'nonce-${nonce}'`,
    `script-src 'nonce-${nonce}'`
  ].join('; ');
}

function applyHtmlHeaders(res, nonce) {
  applyCommonHeaders(res);
  setHeader(res, 'X-Frame-Options', 'DENY');
  setHeader(res, 'Content-Security-Policy', buildCsp(nonce));
}

function applyTextHeaders(res) {
  applyCommonHeaders(res);
}

function reply(res, statusCode, contentType, body, headers) {
  setStatus(res, statusCode);
  if (contentType) setHeader(res, 'Content-Type', contentType);
  if (headers) {
    for (const [k, v] of Object.entries(headers)) setHeader(res, k, v);
  }
  send(res, body);
}

function pageShell({ nonce, title, body, titleScript }) {
  const scriptBlock = titleScript ? `<script nonce="${nonce}">${titleScript}</script>` : '';
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="dark light">
<title>${title}</title>
<style nonce="${nonce}">
:root{--bg:#0b0f1a;--bg2:#070a12;--card:#0e1426;--stroke:rgba(255,255,255,.10);--muted:rgba(255,255,255,.72);--text:rgba(255,255,255,.92);--shadow:0 18px 60px rgba(0,0,0,.55);--r:16px;--a:#7dd3fc;--b:#a78bfa;--c:#fb7185}
*{box-sizing:border-box}
body{margin:0;min-height:100vh;display:grid;place-items:center;padding:28px 16px;font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:var(--text);background:radial-gradient(900px 520px at 12% 12%, rgba(125,211,252,.18), transparent 60%),radial-gradient(900px 520px at 88% 22%, rgba(167,139,250,.14), transparent 60%),linear-gradient(180deg,var(--bg),var(--bg2))}
.wrap{width:min(760px,96vw)}
.window{border:1px solid var(--stroke);border-radius:var(--r);background:linear-gradient(180deg,rgba(255,255,255,.04),rgba(255,255,255,.02));box-shadow:var(--shadow);overflow:hidden}
.bar{display:flex;align-items:center;gap:10px;padding:12px 14px;border-bottom:1px solid rgba(255,255,255,.08);background:rgba(0,0,0,.20)}
.dots{display:flex;gap:7px}
.dot{width:10px;height:10px;border-radius:999px}
.dot:nth-child(1){background:rgba(248,113,113,.65)}
.dot:nth-child(2){background:rgba(251,191,36,.60)}
.dot:nth-child(3){background:rgba(34,197,94,.55)}
.brand{font-size:12px;color:rgba(255,255,255,.66);letter-spacing:.25px;text-transform:lowercase}
.card{display:flex;gap:16px;align-items:flex-start;padding:18px}
.icon{flex:0 0 auto;width:44px;height:44px;border-radius:12px;border:1px solid rgba(255,255,255,.10);background:rgba(255,255,255,.04);display:grid;place-items:center;color:var(--a)}
.icon.is-violet{color:var(--b)}
.icon svg{width:24px;height:24px;display:block}
.h{margin:0;font-size:18px;font-weight:800;letter-spacing:.2px;line-height:1.25}
.p{margin:6px 0 0;color:var(--muted);font-size:13px;line-height:1.5}
.row{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}
.chip{font-size:12px;color:rgba(255,255,255,.82);border:1px solid rgba(255,255,255,.10);background:rgba(255,255,255,.04);padding:7px 10px;border-radius:999px}
.grid{display:grid;grid-template-columns:1fr;gap:12px;margin-top:14px}
.kbd{font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;background:rgba(0,0,0,.28);border:1px solid rgba(255,255,255,.10);border-radius:10px;padding:2px 8px;color:rgba(255,255,255,.88);font-size:12px}
.media{display:flex;align-items:center;gap:14px;margin-top:14px}
.avatar{width:84px;height:84px;border-radius:18px;overflow:hidden;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.03)}
.avatar img{width:100%;height:100%;object-fit:cover;display:block}
.footer{padding:0 18px 18px;color:rgba(255,255,255,.55);font-size:12px;line-height:1.45}
.ticker{overflow:hidden;border-top:1px solid rgba(255,255,255,.08);background:rgba(0,0,0,.16)}
.ticker span{display:inline-block;white-space:nowrap;padding:10px 18px;color:rgba(255,255,255,.70);font-size:12px;letter-spacing:.2px;animation:t 14s linear infinite}
@keyframes t{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
</style>
</head>
<body>
<div class="wrap">
<div class="window">
<div class="bar"><div class="dots"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div><div class="brand">script endpoint</div></div>
${body}
</div>
</div>
${scriptBlock}
</body>
</html>`;
}

function inlineIconSvg() {
  return `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M7 3h7l3 3v15a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M14 3v4h4" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M8 12h8M8 16h8" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`;
}

function buildExistsPage(nonce) {
  const body = `<div class="card">
<div class="icon">${inlineIconSvg()}</div>
<div>
<h1 class="h">Endpoint online</h1>
<p class="p">This route serves script content to non-browser clients. The browser view only confirms the resource exists.</p>
<div class="row"><span class="chip">HTML view</span><span class="chip">No source in browser</span><span class="chip">Lua client supported</span></div>
<div class="grid">
<div class="p">To consume the raw content, your client must request <span class="kbd">?raw=1</span> and avoid browser-like headers.</div>
</div>
<div class="media">
<div class="avatar"><img src="${POSTIMG_URL}" alt="image"></div>
<div class="p">If you're seeing this in a browser, you're in the safe, non-raw view.</div>
</div>
</div>
</div>`;
  return pageShell({ nonce, title: 'Script endpoint', body });
}

function buildNotFoundPage(nonce) {
  const body = `<div class="card">
<div class="icon">${inlineIconSvg()}</div>
<div>
<h1 class="h">Script not found</h1>
<p class="p">No matching script was located in the server's scripts directory.</p>
<div class="row"><span class="chip">404</span><span class="chip">.lua / .txt</span></div>
<div class="grid">
<div class="p">Double-check the requested name and that the file exists under <span class="kbd">/scripts</span>.</div>
</div>
</div>
</div>`;
  return pageShell({ nonce, title: 'Not found', body });
}

function buildBlockedRawPage(nonce) {
  const phrases = [
    'Stop trying to skid',
    'Nice try',
    'No source for you',
    'Try harder',
    'Not happening',
    'Keep scrolling',
    'Skill issue'
  ];
  const stream = `${phrases.join(' • ')} • `;
  const tickerStream = `${stream}${stream}`;

  const titleScript = `(() => {
  const s = ${JSON.stringify(stream)};
  let i = 0;
  const step = () => {
    const view = (s.slice(i) + s.slice(0, i)).trim();
    document.title = view.length ? view : "Stop trying to skid";
    i = (i + 1) % s.length;
  };
  step();
  setInterval(step, 140);
})();`;

  const body = `<div class="card">
<div class="icon is-violet">${inlineIconSvg()}</div>
<div>
<h1 class="h">Protected raw endpoint</h1>
<p class="p">Keep trying to see the code and I'm gonna put you on the files</p>
<div class="row"><span class="chip">raw=1</span><span class="chip">browser blocked</span><span class="chip">text-only for clients</span></div>
<div class="media">
<div class="avatar"><img src="${POSTIMG_URL}" alt="image"></div>
<div class="p">Your browser can reach the endpoint, but it won't receive the plain text body.</div>
</div>
</div>
</div>
<div class="ticker"><span>${tickerStream}</span></div>`;
  return pageShell({ nonce, title: 'Stop trying to skid', body, titleScript });
}

function candidatePaths(scriptName) {
  return EXTENSIONS.map((ext) => path.join(SCRIPTS_DIR, scriptName + ext));
}

async function firstAccessiblePath(paths) {
  for (const p of paths) {
    try {
      await fs.access(p);
      return p;
    } catch {}
  }
  return null;
}

async function readFirstAvailable(paths) {
  for (const p of paths) {
    try {
      const content = await fs.readFile(p, { encoding: 'utf8' });
      return content;
    } catch (err) {
      const code = err && err.code ? String(err.code) : '';
      if (code === 'ENOENT') continue;
      throw err;
    }
  }
  return null;
}

module.exports = async (req, res) => {
  const method = String(req && req.method ? req.method : 'GET').toUpperCase();
  if (method !== 'GET') {
    applyTextHeaders(res);
    setHeader(res, 'Allow', 'GET');
    reply(res, 405, 'text/plain; charset=utf-8', 'Method not allowed');
    return;
  }

  const nameInput = getQueryParam(req, 'name') || getParam(req, 'name');
  const scriptName = sanitizeScriptName(nameInput);
  if (!scriptName) {
    applyTextHeaders(res);
    reply(res, 400, 'text/plain; charset=utf-8', 'Invalid script name');
    return;
  }

  const wantRaw = getQueryParam(req, 'raw') === '1';
  const paths = candidatePaths(scriptName);
  const vary = 'Accept, User-Agent, Sec-Fetch-Mode, Sec-Fetch-Dest';

  if (!wantRaw) {
    const nonce = createNonce();
    applyHtmlHeaders(res, nonce);
    const exists = await firstAccessiblePath(paths);
    if (!exists) {
      reply(res, 404, 'text/html; charset=utf-8', buildNotFoundPage(nonce));
      return;
    }
    reply(res, 200, 'text/html; charset=utf-8', buildExistsPage(nonce));
    return;
  }

  if (isBrowserLike(req)) {
    const exists = await firstAccessiblePath(paths);
    if (!exists) {
      applyTextHeaders(res);
      setHeader(res, 'Vary', vary);
      reply(res, 404, 'text/plain; charset=utf-8', 'Script not found');
      return;
    }
    const nonce = createNonce();
    applyHtmlHeaders(res, nonce);
    setHeader(res, 'Vary', vary);
    reply(res, 200, 'text/html; charset=utf-8', buildBlockedRawPage(nonce));
    return;
  }

  try {
    const content = await readFirstAvailable(paths);
    applyTextHeaders(res);
    setHeader(res, 'Vary', vary);
    if (content === null) {
      reply(res, 404, 'text/plain; charset=utf-8', 'Script not found');
      return;
    }
    reply(res, 200, 'text/plain; charset=utf-8', content);
  } catch {
    applyTextHeaders(res);
    setHeader(res, 'Vary', vary);
    reply(res, 500, 'text/plain; charset=utf-8', 'Internal error');
  }
};
