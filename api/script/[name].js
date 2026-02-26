'use strict';

const path = require('path');
const fs = require('fs/promises');

const ROOT_DIR = process.cwd();
const SCRIPTS_DIR = path.join(ROOT_DIR, 'scripts');
const EXTENSIONS = ['.lua', '.txt'];
const MAX_NAME_LENGTH = 80;

function sanitizeName(value) {
  return String(value ?? '')
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .slice(0, MAX_NAME_LENGTH);
}

async function findScriptFile(scriptName) {
  for (const ext of EXTENSIONS) {
    const fullPath = path.join(SCRIPTS_DIR, scriptName + ext);
    try {
      await fs.access(fullPath);
      return fullPath;
    } catch {}
  }
  return null;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function getHeader(headers, name) {
  if (!headers) return '';
  const key = String(name).toLowerCase();
  return String(headers[key] ?? headers[name] ?? '');
}

function isBrowserLikeRequest(req) {
  const headers = req?.headers || {};
  const accept = getHeader(headers, 'accept').toLowerCase();
  const ua = getHeader(headers, 'user-agent').toLowerCase();
  const secFetchDest = getHeader(headers, 'sec-fetch-dest').toLowerCase();
  const secFetchMode = getHeader(headers, 'sec-fetch-mode').toLowerCase();

  if (secFetchDest === 'document' || secFetchMode === 'navigate') return true;
  if (accept.includes('text/html')) return true;

  return /(mozilla|chrome|safari|firefox|edg\/)/.test(ua);
}

function applyCommonHeaders(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
}

function applyHtmlHeaders(res) {
  applyCommonHeaders(res);
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; img-src data:; style-src 'unsafe-inline'"
  );
}

function respond(res, status, contentType, body, extraHeaders) {
  if (typeof res.status === 'function') res.status(status);
  else res.statusCode = status;

  if (contentType) res.setHeader('Content-Type', contentType);

  if (extraHeaders) {
    for (const [k, v] of Object.entries(extraHeaders)) res.setHeader(k, v);
  }

  if (typeof res.send === 'function') res.send(body);
  else res.end(body);
}

const ICON_SVG = `
<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
  <path d="M7 3h7l3 3v15a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" fill="none" stroke="currentColor" stroke-width="1.6" />
  <path d="M14 3v4h4" fill="none" stroke="currentColor" stroke-width="1.6" />
  <path d="M8 12h8M8 16h8" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
</svg>
`.trim();

function buildCardPage({ title, subtitle, chips = [], hintHtml = '', accent = '#7dd3fc' }) {
  const safeTitle = escapeHtml(title);
  const safeSubtitle = escapeHtml(subtitle || '');

  const accentColor = String(accent || '#7dd3fc');
  const accentGlow = accentColor.length === 7 ? `${accentColor}33` : accentColor;

  const chipHtml = chips
    .map((c) => `<span class="chip">${escapeHtml(c)}</span>`)
    .join('');

  const hint = String(hintHtml || '');

  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="dark light" />
  <title>${safeTitle}</title>
  <style>
    :root{
      --bg0:#060814;
      --bg1:#0a1022;
      --card: rgba(255,255,255,.055);
      --stroke: rgba(255,255,255,.11);
      --text: rgba(255,255,255,.92);
      --muted: rgba(255,255,255,.68);
      --shadow: 0 22px 70px rgba(0,0,0,.60);
      --radius: 16px;
      --accent: ${escapeHtml(accentColor)};
      --accentGlow: ${escapeHtml(accentGlow)};
    }
    *{ box-sizing:border-box; }
    body{
      margin:0;
      min-height:100vh;
      display:grid;
      place-items:center;
      padding:28px 16px;
      font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
      color:var(--text);
      background:
        radial-gradient(900px 560px at 20% 10%, var(--accentGlow), transparent 60%),
        radial-gradient(860px 520px at 92% 18%, rgba(34,197,94,.10), transparent 60%),
        linear-gradient(180deg, var(--bg0), var(--bg1));
    }
    .card{
      width:min(740px, 96vw);
      background:var(--card);
      border:1px solid var(--stroke);
      border-radius:var(--radius);
      box-shadow:var(--shadow);
      overflow:hidden;
    }
    .top{
      display:flex;
      gap:14px;
      align-items:flex-start;
      padding:18px 18px 16px 18px;
    }
    .icon{
      width:44px;
      height:44px;
      border-radius:12px;
      display:grid;
      place-items:center;
      background:rgba(255,255,255,.06);
      border:1px solid rgba(255,255,255,.10);
      color:var(--accent);
      flex:0 0 auto;
    }
    .icon svg{ width:26px; height:26px; display:block; }
    .hgroup{ min-width:0; flex:1 1 auto; }
    h1{
      margin:0;
      font-size:18px;
      font-weight:800;
      letter-spacing:.2px;
      line-height:1.2;
    }
    .sub{
      margin:6px 0 0 0;
      font-size:13px;
      color:var(--muted);
      line-height:1.45;
      overflow:hidden;
      text-overflow:ellipsis;
    }
    .chips{
      display:flex;
      flex-wrap:wrap;
      gap:8px;
      padding:0 18px 14px 18px;
    }
    .chip{
      display:inline-flex;
      align-items:center;
      padding:7px 10px;
      border-radius:999px;
      background:rgba(255,255,255,.06);
      border:1px solid rgba(255,255,255,.10);
      color:rgba(255,255,255,.82);
      font-size:12px;
      white-space:nowrap;
    }
    .footer{
      padding:14px 18px 18px 18px;
      color:rgba(255,255,255,.60);
      font-size:12px;
      line-height:1.5;
    }
    .footer code{
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
      font-size: 12px;
      padding: 2px 6px;
      border-radius: 8px;
      background: rgba(0,0,0,.30);
      border: 1px solid rgba(255,255,255,.10);
      color: rgba(255,255,255,.86);
      white-space: nowrap;
    }
  </style>
</head>
<body>
  <main class="card" role="main">
    <div class="top">
      <div class="icon">${ICON_SVG}</div>
      <div class="hgroup">
        <h1>${safeTitle}</h1>
        ${safeSubtitle ? `<p class="sub">${safeSubtitle}</p>` : ``}
      </div>
    </div>
    ${chipHtml ? `<div class="chips">${chipHtml}</div>` : ``}
    ${hint ? `<div class="footer">${hint}</div>` : ``}
  </main>
</body>
</html>`;
}

function buildExistsPage(scriptName) {
  return buildCardPage({
    title: "At least I'm not in the files",
    subtitle: `Script détecté : ${scriptName}`,
    chips: ['Script endpoint', 'Vue non-raw'],
    hintHtml:
      "Cette page confirme l'existence du script. Le contenu brut est consommé par le client Lua via <code>?raw=1</code>.",
    accent: '#60a5fa',
  });
}

function buildNotFoundPage(scriptName) {
  return buildCardPage({
    title: 'Script introuvable',
    subtitle: `Aucun script nommé "${scriptName}"`,
    chips: ['404', 'scripts/'],
    hintHtml:
      "Vérifie le nom demandé et la présence du fichier dans <code>scripts/</code> (extensions supportées : <code>.lua</code> et <code>.txt</code>).",
    accent: '#fbbf24',
  });
}

function buildRawBlockedPage(scriptName) {
  return buildCardPage({
    title: 'Nice try.',
    subtitle: `Accès raw bloqué : ${scriptName}`,
    chips: ['Accès navigateur bloqué', 'Raw endpoint'],
    hintHtml: 'Ce endpoint ne sert pas le contenu brut dans un navigateur.',
    accent: '#fb7185',
  });
}

module.exports = async (req, res) => {
  const query = req?.query || {};
  const params = req?.params || {};
  const nameInput = query.name ?? params.name ?? '';
  const scriptName = sanitizeName(nameInput);
  const wantRaw = String(query.raw ?? '') === '1';
  const method = String(req?.method || 'GET').toUpperCase();

  if (method !== 'GET') {
    applyCommonHeaders(res);
    respond(res, 405, 'text/plain; charset=utf-8', 'Method not allowed');
    return;
  }

  if (!scriptName) {
    applyCommonHeaders(res);
    respond(res, 400, 'text/plain; charset=utf-8', 'Invalid script name');
    return;
  }

  const filePath = await findScriptFile(scriptName);

  if (!wantRaw) {
    applyHtmlHeaders(res);
    res.setHeader('Cache-Control', 'no-store');
    if (!filePath) {
      respond(res, 404, 'text/html; charset=utf-8', buildNotFoundPage(scriptName));
      return;
    }
    respond(res, 200, 'text/html; charset=utf-8', buildExistsPage(scriptName));
    return;
  }

  res.setHeader('Vary', 'Accept, User-Agent, Sec-Fetch-Dest, Sec-Fetch-Mode');

  if (!filePath) {
    applyCommonHeaders(res);
    respond(res, 404, 'text/plain; charset=utf-8', 'Script not found', { 'Cache-Control': 'no-store' });
    return;
  }

  if (isBrowserLikeRequest(req)) {
    applyHtmlHeaders(res);
    respond(res, 200, 'text/html; charset=utf-8', buildRawBlockedPage(scriptName), { 'Cache-Control': 'no-store' });
    return;
  }

  try {
    const content = await fs.readFile(filePath, 'utf8');
    applyCommonHeaders(res);
    respond(res, 200, 'text/plain; charset=utf-8', content, { 'Cache-Control': 'no-store' });
  } catch {
    applyCommonHeaders(res);
    respond(res, 500, 'text/plain; charset=utf-8', 'Internal error', { 'Cache-Control': 'no-store' });
  }
};
