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
    "default-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; img-src https://i.postimg.cc data:; style-src 'unsafe-inline'; script-src 'unsafe-inline'"
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

function buildCardPage({ title, subtitle, accent = '#fb7185', iconUrl, tickerLines = [] }) {
  const safeTitle = escapeHtml(title || '');
  const safeSubtitle = escapeHtml(subtitle || '');
  const accentColor = escapeHtml(accent);

  const linesRaw = Array.isArray(tickerLines) ? tickerLines.filter(Boolean).slice(0, 64) : [];
  const lines = linesRaw.length ? linesRaw : ['stop trying to skid', 'learn to code', 'nice try'];
  const escapedLines = lines.map((s) => escapeHtml(s));

  const iconHtml = iconUrl
    ? `<img src="${escapeHtml(iconUrl)}" alt="epstein" />`
    : `<span class="fallbackIcon"></span>`;

  const titleScrollText = (linesRaw[0] || 'STOP TRYING TO SKID').toUpperCase();
  const titleScroll = escapeHtml(`${titleScrollText}   •   `);

  // One continuous ticker line (already filled at load): duplicate content and loop -50%.
  const tickerItemHtml = escapedLines
    .map((x) => `<span class="tickItem">${x}</span>`)
    .join('');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="dark" />
  <title>${safeTitle}</title>
  <style>
    :root{
      --bg0:#050511;
      --bg1:#090a18;
      --card: rgba(255,255,255,.055);
      --stroke: rgba(255,255,255,.12);
      --text: rgba(255,255,255,.92);
      --muted: rgba(255,255,255,.72);
      --shadow: 0 30px 100px rgba(0,0,0,.72);
      --radius: 18px;
      --accent: ${accentColor};
    }

    *{ box-sizing:border-box; }
    html, body{ height:100%; }
    body{
      margin:0;
      min-height:100vh;
      display:grid;
      place-items:center;
      padding:28px 16px;
      font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
      color:var(--text);
      background:
        radial-gradient(900px 560px at 18% 10%, color-mix(in srgb, var(--accent) 24%, transparent), transparent 60%),
        radial-gradient(880px 540px at 86% 20%, rgba(99,102,241,.18), transparent 60%),
        radial-gradient(760px 520px at 50% 110%, rgba(34,197,94,.10), transparent 60%),
        linear-gradient(180deg, var(--bg0), var(--bg1));
      overflow-x:hidden;
    }

    /* subtle noise */
    body::before{
      content:"";
      position:fixed;
      inset:0;
      pointer-events:none;
      opacity:.07;
      background-image:
        repeating-linear-gradient(0deg, rgba(255,255,255,.08), rgba(255,255,255,.08) 1px, transparent 1px, transparent 3px),
        repeating-linear-gradient(90deg, rgba(255,255,255,.06), rgba(255,255,255,.06) 1px, transparent 1px, transparent 4px);
      mix-blend-mode:overlay;
      filter: blur(.2px);
    }

    .card{
      width:min(920px, 96vw);
      background:var(--card);
      border:1px solid var(--stroke);
      border-radius:var(--radius);
      box-shadow:var(--shadow);
      overflow:hidden;
      position:relative;
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
    }

    .card::before{
      content:"";
      position:absolute;
      inset:-2px;
      background:
        radial-gradient(520px 220px at 10% 0%, color-mix(in srgb, var(--accent) 24%, transparent), transparent 60%),
        radial-gradient(520px 260px at 92% 0%, rgba(34,197,94,.12), transparent 60%),
        radial-gradient(420px 220px at 50% 120%, rgba(99,102,241,.12), transparent 60%);
      opacity:.85;
      pointer-events:none;
    }

    .topbar{
      position:relative;
      display:flex;
      align-items:center;
      gap:14px;
      padding:16px 18px 14px;
      border-bottom: 1px solid rgba(255,255,255,.08);
      background: rgba(0,0,0,.12);
    }

    .dots{
      display:flex;
      gap:7px;
      align-items:center;
      margin-right:2px;
      filter: drop-shadow(0 10px 25px rgba(0,0,0,.35));
    }
    .dot{
      width:11px; height:11px;
      border-radius:50%;
      box-shadow: inset 0 0 0 1px rgba(0,0,0,.25);
      opacity:.95;
    }
    .dot.red{ background:#ff5f57; }
    .dot.yellow{ background:#febc2e; }
    .dot.green{ background:#28c840; }

    .icon{
      width:64px;
      height:64px;
      border-radius:16px;
      overflow:hidden;
      border:1px solid rgba(255,255,255,.14);
      background:rgba(255,255,255,.06);
      box-shadow: 0 18px 70px rgba(0,0,0,.55);
      flex:0 0 auto;
      display:grid;
      place-items:center;
      position:relative;
    }
    .icon::after{
      content:"";
      position:absolute;
      inset:0;
      background: radial-gradient(120px 90px at 20% 10%, rgba(255,255,255,.12), transparent 55%);
      pointer-events:none;
    }
    .icon img{ width:100%; height:100%; object-fit:cover; display:block; }
    .fallbackIcon{
      width:28px; height:28px;
      border-radius:8px;
      background: rgba(255,255,255,.10);
      box-shadow: 0 0 0 1px rgba(255,255,255,.10) inset;
    }

    .head{
      min-width:0;
      flex:1 1 auto;
    }

    h1{
      margin:0;
      font-size:22px;
      font-weight:900;
      letter-spacing:.2px;
      line-height:1.15;
    }

    .sub{
      margin:8px 0 0 0;
      font-size:14px;
      color:var(--muted);
      line-height:1.45;
      max-width: 62ch;
    }

    /* ONE ticker line */
    .ticker{
      position:relative;
      padding:14px 0 16px;
    }
    .tickerRow{
      overflow:hidden;
      border-top: 1px solid rgba(255,255,255,.07);
      border-bottom: 1px solid rgba(255,255,255,.07);
      background:
        linear-gradient(90deg, rgba(0,0,0,.35), rgba(0,0,0,.12) 40%, rgba(0,0,0,.35));
      padding:10px 0;
      position:relative;
    }
    .tickerRow::before,
    .tickerRow::after{
      content:"";
      position:absolute;
      top:0; bottom:0;
      width:90px;
      pointer-events:none;
    }
    .tickerRow::before{
      left:0;
      background: linear-gradient(90deg, rgba(6,6,18,1), rgba(6,6,18,0));
    }
    .tickerRow::after{
      right:0;
      background: linear-gradient(270deg, rgba(6,6,18,1), rgba(6,6,18,0));
    }

    .tickerInner{
      display:flex;
      width:max-content;
      will-change: transform;
      animation: marquee 16s linear infinite;
    }
    .tickerChunk{
      display:inline-flex;
      gap:14px;
      padding:0 12px;
      white-space:nowrap;
    }

    .tickItem{
      font-size:12px;
      letter-spacing:.38px;
      text-transform:uppercase;
      color: rgba(255,255,255,.80);
      padding:5px 10px;
      border-radius:999px;
      border:1px solid rgba(255,255,255,.14);
      background:
        linear-gradient(180deg, rgba(255,255,255,.07), rgba(255,255,255,.03));
      box-shadow: 0 14px 38px rgba(0,0,0,.30);
      position:relative;
    }
    .tickItem::after{
      content:"";
      position:absolute;
      inset:-1px;
      border-radius:999px;
      pointer-events:none;
      box-shadow: 0 0 0 1px rgba(0,0,0,.18) inset;
      opacity:.8;
    }

    @keyframes marquee{
      0%{ transform: translateX(0); }
      100%{ transform: translateX(-50%); }
    }

    @media (prefers-reduced-motion: reduce){
      .tickerInner{ animation:none; }
    }

    .glitch{
      position:relative;
      display:inline-block;
    }
    .glitch::before,
    .glitch::after{
      content: attr(data-text);
      position:absolute;
      left:0; top:0;
      opacity:.55;
      pointer-events:none;
    }
    .glitch::before{
      transform: translate(1px, 0);
      color: color-mix(in srgb, var(--accent) 80%, white);
      clip-path: inset(0 0 60% 0);
      animation: g1 2.6s infinite linear;
    }
    .glitch::after{
      transform: translate(-1px, 0);
      color: rgba(99,102,241,.92);
      clip-path: inset(55% 0 0 0);
      animation: g2 3.1s infinite linear;
    }
    @keyframes g1{
      0%,100%{ clip-path: inset(0 0 62% 0); }
      50%{ clip-path: inset(0 0 40% 0); }
    }
    @keyframes g2{
      0%,100%{ clip-path: inset(58% 0 0 0); }
      50%{ clip-path: inset(40% 0 0 0); }
    }

    .pad{
      position:relative;
      padding:18px;
    }
    .big{
      margin:0;
      font-size:13px;
      color: rgba(255,255,255,.60);
      line-height:1.6;
    }
  </style>
</head>
<body>
  <main class="card" role="main">
    <header class="topbar">
      <div class="dots" aria-hidden="true">
        <span class="dot red"></span>
        <span class="dot yellow"></span>
        <span class="dot green"></span>
      </div>

      <div class="icon" aria-hidden="true">
        ${iconHtml}
      </div>

      <div class="head">
        <h1><span class="glitch" data-text="${safeTitle}">${safeTitle}</span></h1>
        ${safeSubtitle ? `<p class="sub">${safeSubtitle}</p>` : ``}
      </div>
    </header>

    <section class="ticker" aria-hidden="true">
      <div class="tickerRow">
        <div class="tickerInner">
          <div class="tickerChunk">${tickerItemHtml}</div>
          <div class="tickerChunk" aria-hidden="true">${tickerItemHtml}</div>
        </div>
      </div>
    </section>

    <div class="pad">
      <p class="big">Keep trying to see the code and im gonna put you on the files.</p>
    </div>
  </main>

  <script>
    (function () {
      var base = ${JSON.stringify(titleScroll)};
      if (!base) return;
      var text = base;
      var i = 0;
      setInterval(function () {
        i = (i + 1) % text.length;
        document.title = text.slice(i) + text.slice(0, i);
      }, 95);
    })();
  </script>
</body>
</html>`;
}

function buildNotFoundPage() {
  return buildCardPage({
    title: 'Not found',
    subtitle: 'Wrong name, wrong day.',
    accent: '#fbbf24',
    iconUrl: 'https://i.postimg.cc/Jzm7phVG/image.png',
    tickerLines: ['404', 'nice guess', 'try again', 'still not here', 'learn to type'],
  });
}

function buildRawBlockedPage() {
  return buildCardPage({
    title: 'Stop trying to skid',
    subtitle: 'You really opened it in a browser like that?',
    accent: '#fb7185',
    iconUrl: 'https://i.postimg.cc/Jzm7phVG/image.png',
    tickerLines: [
      'copy paste warrior spotted',
      'skid detected',
      'learn javascript',
      'learn lua',
      'stop stealing scripts',
      'write your own code',
      'youtube tutorial enjoyer',
      'no source for you',
      'go read docs',
      'devtools wont save you',
      'ctrl c ctrl v champion',
      'bro thinks inspect element is hacking',
      'if it works it is mine',
      'paste more, think less',
      'typing skills: npc',
      'skill issue',
      'try harder',
      'not today',
      'stay mad',
      'build something original',
      'real devs ship code',
      'skids ship excuses',
      'keep clicking, it wont help',
      'imagine learning',
      'you could be coding rn',
      'stop begging for source',
      'get good',
      'this is not github',
      'touch grass then touch code',
      'reading docs is free',
      'make it yourself',
      'stop trying to skid',
      'stop trying to skid',
      'stop trying to skid',
    ],
  });
}

module.exports = async (req, res) => {
  const query = req?.query || {};
  const params = req?.params || {};
  const nameInput = query.name ?? params.name ?? '';
  const scriptName = sanitizeName(nameInput);
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

  // IMPORTANT:
  // Raw is now the default: /api/script/<name> serves the script to non-browser clients.
  // Browser-like requests get the troll page. Query raw=1 is no longer needed (but we ignore it).
  const filePath = await findScriptFile(scriptName);

  // Vary still useful because we serve HTML to browsers and raw to clients
  res.setHeader('Vary', 'Accept, User-Agent, Sec-Fetch-Dest, Sec-Fetch-Mode');
  res.setHeader('Cache-Control', 'no-store');

  if (!filePath) {
    if (isBrowserLikeRequest(req)) {
      applyHtmlHeaders(res);
      respond(res, 404, 'text/html; charset=utf-8', buildNotFoundPage());
      return;
    }
    applyCommonHeaders(res);
    respond(res, 404, 'text/plain; charset=utf-8', 'Script not found');
    return;
  }

  if (isBrowserLikeRequest(req)) {
    applyHtmlHeaders(res);
    respond(res, 200, 'text/html; charset=utf-8', buildRawBlockedPage());
    return;
  }

  try {
    const content = await fs.readFile(filePath, 'utf8');
    applyCommonHeaders(res);
    respond(res, 200, 'text/plain; charset=utf-8', content);
  } catch {
    applyCommonHeaders(res);
    respond(res, 500, 'text/plain; charset=utf-8', 'Internal error');
  }
};
