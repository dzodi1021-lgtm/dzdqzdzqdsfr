const path = require("path");
const fs = require("fs").promises;
const fsSync = require("fs");

// ----- Config (clé côté serveur) -----
let VIEW_KEY = "";
try {
  const rootDir = process.cwd();
  const rawConfig = fsSync.readFileSync(path.join(rootDir, "config.json"), "utf8");
  const cfg = JSON.parse(rawConfig);
  VIEW_KEY = String(cfg.viewKey || "");
  console.log("View key loaded.");
} catch (e) {
  console.error("Could not read config.json. Make sure it exists with a viewKey.");
}

// ----- Helpers -----
const rootDir = process.cwd();
const SCRIPTS_DIR = path.join(rootDir, "scripts");

function sanitizeName(name) {
  return name.replace(/[^a-zA-Z0-9_-]/g, "");
}

async function findScriptFile(name) {
  const exts = [".txt", ".lua"];
  for (const ext of exts) {
    const tryPath = path.join(SCRIPTS_DIR, name + ext);
    try {
      await fs.access(tryPath);
      return tryPath;
    } catch {
      // ignore
    }
  }
  return null;
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// Page humour (non-raw)
function buildHtmlCardPage({ title, subtitle }) {
  const jeffImgUrl = "https://example.com/epstein-image.jpg"; // remplace par ton image

  return `
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    :root{
      --bg1:#050816;
      --bg2:#0b1230;
      --card: rgba(10, 16, 38, .80);
      --stroke: rgba(255,255,255,.10);
      --text:#eaf0ff;
      --muted:rgba(234,240,255,.70);
      --shadow: 0 22px 80px rgba(0,0,0,.75);
      --radius: 18px;
    }
    *{ box-sizing:border-box; }
    body{
      margin:0;
      min-height:100vh;
      display:flex;
      align-items:center;
      justify-content:center;
      font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial;
      color:var(--text);
      background:
        radial-gradient(1200px 600px at 20% 15%, rgba(77,120,255,.25), transparent 60%),
        radial-gradient(900px 500px at 80% 20%, rgba(82,255,197,.14), transparent 55%),
        radial-gradient(900px 600px at 60% 90%, rgba(255,143,77,.10), transparent 60%),
        linear-gradient(160deg, var(--bg1), var(--bg2));
    }
    .card{
      position:relative;
      width:min(480px, 92vw);
      background:var(--card);
      border-radius:var(--radius);
      border:1px solid var(--stroke);
      box-shadow:var(--shadow);
      padding:18px 18px 16px;
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      overflow:hidden;
    }
    .card::before{
      content:"";
      position:absolute;
      inset:-1px;
      background:
        radial-gradient(520px 240px at 12% 0%, rgba(140,180,255,.20), transparent 60%),
        radial-gradient(520px 320px at 88% 0%, rgba(120,255,210,.14), transparent 55%);
      opacity:.95;
      pointer-events:none;
    }
    .inner{
      position:relative;
      display:flex;
      gap:16px;
      align-items:center;
    }
    .imgBox{
      width:96px;
      height:96px;
      border-radius:22px;
      border:1px solid rgba(255,255,255,.16);
      overflow:hidden;
      background:rgba(255,255,255,.06);
      box-shadow:0 16px 45px rgba(0,0,0,.6);
      flex:0 0 auto;
      display:grid;
      place-items:center;
    }
    .imgBox img{
      width:100%;
      height:100%;
      object-fit:cover;
      display:block;
    }
    .content{
      min-width:0;
      flex:1 1 auto;
    }
    .title{
      margin:0;
      font-size:18px;
      font-weight:900;
      letter-spacing:.2px;
      white-space:nowrap;
      overflow:hidden;
      text-overflow:ellipsis;
    }
    .subtitle{
      margin:6px 0 10px;
      font-size:13px;
      color:var(--muted);
      white-space:nowrap;
      overflow:hidden;
      text-overflow:ellipsis;
    }
    .pillRow{
      display:flex;
      gap:8px;
      align-items:center;
      flex-wrap:wrap;
    }
    .pill{
      display:inline-flex;
      align-items:center;
      gap:6px;
      padding:7px 10px;
      border-radius:999px;
      border:1px solid rgba(255,255,255,.16);
      background:rgba(255,255,255,.05);
      font-size:12px;
      color:rgba(234,240,255,.85);
    }
    .lockIcon{
      width:16px;
      height:16px;
    }
    .hint{
      margin-top:10px;
      font-size:11px;
      color:rgba(234,240,255,.58);
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="inner">
      <div class="imgBox" aria-hidden="true">
        <img src="${jeffImgUrl}" alt="hidden content" />
      </div>
      <div class="content">
        <p class="title">${escapeHtml(title)}</p>
        <p class="subtitle">${escapeHtml(subtitle)}</p>
        <div class="pillRow">
          <span class="pill">
            <svg class="lockIcon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect x="5" y="10" width="14" height="10" rx="2" stroke="currentColor" stroke-width="2"/>
              <path d="M9 10V7a3 3 0 0 1 6 0v3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              <circle cx="12" cy="14" r="1.4" fill="currentColor"/>
            </svg>
            Atleast im not in the files
          </span>
          <span class="pill">Script endpoint</span>
        </div>
        <p class="hint">
          This page only reveals that the script exists.<br/>
          Raw content is protected by a key.
        </p>
      </div>
    </div>
  </div>
</body>
</html>
`;
}

// Page de saisie de clé pour ?raw=1
function buildKeyPage(scriptName, wrongKey) {
  const title = "Enter access key";
  const subtitle = scriptName ? `Script: ${scriptName}` : "Protected raw endpoint";

  return `
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    :root{
      --bg1:#050816;
      --bg2:#0b1230;
      --card: rgba(10, 16, 38, .80);
      --stroke: rgba(255,255,255,.10);
      --text:#eaf0ff;
      --muted:rgba(234,240,255,.70);
      --shadow: 0 22px 80px rgba(0,0,0,.75);
      --radius: 18px;
    }
    *{ box-sizing:border-box; }
    body{
      margin:0;
      min-height:100vh;
      display:flex;
      align-items:center;
      justify-content:center;
      font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial;
      color:var(--text);
      background:
        radial-gradient(1200px 600px at 20% 15%, rgba(77,120,255,.25), transparent 60%),
        radial-gradient(900px 500px at 80% 20%, rgba(82,255,197,.14), transparent 55%),
        radial-gradient(900px 600px at 60% 90%, rgba(255,143,77,.10), transparent 60%),
        linear-gradient(160deg, var(--bg1), var(--bg2));
    }
    .card{
      position:relative;
      width:min(460px, 92vw);
      background:var(--card);
      border-radius:var(--radius);
      border:1px solid var(--stroke);
      box-shadow:var(--shadow);
      padding:18px 18px 16px;
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      overflow:hidden;
    }
    .card::before{
      content:"";
      position:absolute;
      inset:-1px;
      background:
        radial-gradient(520px 240px at 12% 0%, rgba(140,180,255,.20), transparent 60%),
        radial-gradient(520px 320px at 88% 0%, rgba(120,255,210,.14), transparent 55%);
      opacity:.95;
      pointer-events:none;
    }
    .inner{ position:relative; }
    .title{
      margin:0 0 6px;
      font-size:18px;
      font-weight:900;
      letter-spacing:.2px;
    }
    .subtitle{
      margin:0 0 10px;
      font-size:13px;
      color:var(--muted);
      white-space:nowrap;
      overflow:hidden;
      text-overflow:ellipsis;
    }
    .error{
      margin:0 0 10px;
      font-size:12px;
      color:#ff8a8a;
    }
    form{
      display:flex;
      gap:8px;
      align-items:center;
      flex-wrap:wrap;
    }
    input[type="password"]{
      flex:1 1 auto;
      min-width:0;
      padding:8px 10px;
      border-radius:10px;
      border:1px solid rgba(255,255,255,.16);
      background:rgba(0,0,0,.25);
      color:var(--text);
      font-size:13px;
    }
    button{
      padding:8px 12px;
      border-radius:10px;
      border:1px solid rgba(255,255,255,.20);
      background:rgba(255,255,255,.10);
      color:var(--text);
      font-size:13px;
      font-weight:700;
      cursor:pointer;
    }
    button:hover{
      border-color:rgba(255,255,255,.85);
      background:rgba(255,255,255,.16);
    }
    .hint{
      margin-top:10px;
      font-size:11px;
      color:rgba(234,240,255,.58);
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="inner">
      <p class="title">${escapeHtml(title)}</p>
      <p class="subtitle">${escapeHtml(subtitle)}</p>
      ${wrongKey ? '<p class="error">Wrong key, try again.</p>' : ''}
      <form method="POST">
        <input type="password" name="key" placeholder="Enter access key" autocomplete="off" />
        <button type="submit">Unlock</button>
      </form>
      <p class="hint">
        Raw content is only returned after a correct key.<br/>
        Until then, nothing is exposed in the source or network.
      </p>
    </div>
  </div>
</body>
</html>
`;
}

// ----- Handler Vercel -----
module.exports = async (req, res) => {
  const { name, raw } = req.query;
  const method = req.method || "GET";
  const wantRaw = raw === "1";
  const scriptName = sanitizeName(name || "");

  if (!scriptName) {
    res.status(400).send("Invalid script name");
    return;
  }

  // --- Vue non-raw (GET /api/script/:name) ---
  if (!wantRaw) {
    if (method !== "GET") {
      res.status(405).send("Method not allowed");
      return;
    }

    const filePath = await findScriptFile(scriptName);
    if (!filePath) {
      res
        .status(404)
        .setHeader("Content-Type", "text/html; charset=utf-8");
      res.send(
        buildHtmlCardPage({
          title: "Script not found",
          subtitle: `No script named "${scriptName}"`,
        })
      );
      return;
    }

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(
      buildHtmlCardPage({
        title: "Atleast im not in the files",
        subtitle: `Script: ${scriptName}`,
      })
    );
    return;
  }

  // --- Vue raw protégée ---
  if (method === "GET") {
    // première visite : formulaire de clé
    res
      .status(401)
      .setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(buildKeyPage(scriptName, false));
    return;
  }

  if (method === "POST") {
    if (!VIEW_KEY) {
      res.status(500).type("text/plain").send("Server key not configured");
      return;
    }

    // parse body x-www-form-urlencoded à la main
    let body = "";
    await new Promise((resolve, reject) => {
      req.on("data", chunk => {
        body += chunk;
        if (body.length > 1e6) {
          req.destroy();
          reject(new Error("Body too large"));
        }
      });
      req.on("end", resolve);
      req.on("error", reject);
    });

    const params = new URLSearchParams(body);
    const key = String(params.get("key") || "");

    if (key !== VIEW_KEY) {
      res
        .status(401)
        .setHeader("Content-Type", "text/html; charset=utf-8");
      res.send(buildKeyPage(scriptName, true));
      return;
    }

    const filePath = await findScriptFile(scriptName);
    if (!filePath) {
      res.status(404).type("text/plain").send("Script not found");
      return;
    }

    const content = await fs.readFile(filePath, "utf8");
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.send(content);
    return;
  }

  res.status(405).send("Method not allowed");
};