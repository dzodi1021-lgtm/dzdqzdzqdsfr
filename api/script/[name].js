const path = require("path");
const fs = require("fs").promises;

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

// Page humour (vue non-raw)
function buildHtmlCardPage({ title, subtitle }) {
  const jeffImgUrl = "https://i.postimg.cc/Jzm7phVG/image.png";

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
          <span class="pill">Atleast im not in the files</span>
          <span class="pill">Script endpoint</span>
        </div>
        <p class="hint">
          Cette page montre juste que le script existe.<br/>
          Le contenu brut est seulement utilisé depuis le client Lua.
        </p>
      </div>
    </div>
  </div>
</body>
</html>
`;
}

// Page troll pour ?raw=1 vue depuis un navigateur
function buildRawBlockedPage(scriptName) {
  const jeffImgUrl = "https://i.postimg.cc/Jzm7phVG/image.png";
  const title = "Nice try.";
  const subtitle = scriptName
    ? `Script: ${scriptName}`
    : "Protected raw endpoint";

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
      --card: rgba(10, 16, 38, .85);
      --stroke: rgba(255,255,255,.14);
      --text:#eaf0ff;
      --muted:rgba(234,240,255,.72);
      --shadow: 0 26px 90px rgba(0,0,0,.80);
      --radius: 20px;
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
        radial-gradient(900px 500px at 80% 20%, rgba(82,255,197,.18), transparent 55%),
        radial-gradient(900px 600px at 60% 90%, rgba(255,143,77,.14), transparent 60%),
        linear-gradient(160deg, var(--bg1), var(--bg2));
    }
    .card{
      position:relative;
      width:min(520px, 94vw);
      background:var(--card);
      border-radius:var(--radius);
      border:1px solid var(--stroke);
      box-shadow:var(--shadow);
      padding:20px 20px 18px;
      backdrop-filter: blur(22px);
      -webkit-backdrop-filter: blur(22px);
      overflow:hidden;
    }
    .card::before{
      content:"";
      position:absolute;
      inset:-1px;
      background:
        radial-gradient(620px 260px at 18% 0%, rgba(140,180,255,.22), transparent 60%),
        radial-gradient(520px 340px at 88% 0%, rgba(120,255,210,.16), transparent 55%);
      opacity:.95;
      pointer-events:none;
    }
    .inner{
      position:relative;
      display:flex;
      gap:18px;
      align-items:center;
    }
    .imgBox{
      width:110px;
      height:110px;
      border-radius:26px;
      border:1px solid rgba(255,255,255,.18);
      overflow:hidden;
      background:rgba(255,255,255,.08);
      box-shadow:0 18px 55px rgba(0,0,0,.75);
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
      font-size:19px;
      font-weight:900;
      letter-spacing:.2px;
    }
    .subtitle{
      margin:6px 0 10px;
      font-size:13px;
      color:var(--muted);
      white-space:nowrap;
      overflow:hidden;
      text-overflow:ellipsis;
    }
    .msg{
      margin:8px 0 0;
      font-size:13px;
      line-height:1.5;
      color:var(--text);
    }
    .msg strong{
      font-weight:900;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="inner">
      <div class="imgBox" aria-hidden="true">
        <img src="${jeffImgUrl}" alt="epstein" />
      </div>
      <div class="content">
        <p class="title">${escapeHtml(title)}</p>
        <p class="subtitle">${escapeHtml(subtitle)}</p>
        <p class="msg">
          <strong>Stop trying to get the source code I'm going to add you in the files</strong><br/>
        </p>
      </div>
    </div>
  </div>
</body>
</html>
`;
}

// ----- Handler -----
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
      })
    );
    return;
  }

  // --- Vue raw (GET /api/script/:name?raw=1) ---
  if (method !== "GET") {
    res.status(405).send("Method not allowed");
    return;
  }

  const filePath = await findScriptFile(scriptName);
  if (!filePath) {
    res.status(404).type("text/plain; charset=utf-8").send("Script not found");
    return;
  }

  const accept = String(req.headers["accept"] || "").toLowerCase();
  const ua = String(req.headers["user-agent"] || "").toLowerCase();

  // Heuristique : si ça ressemble à un navigateur → page HTML troll,
  // sinon → renvoyer le Lua brut (pour loadstring / HttpGet).
  const looksLikeBrowser =
    accept.includes("text/html") ||
    ua.includes("mozilla") ||
    ua.includes("chrome") ||
    ua.includes("safari") ||
    ua.includes("edg/");

  if (looksLikeBrowser) {
    res
      .status(200)
      .setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(buildRawBlockedPage(scriptName));
    return;
  }

  // Client non-navigateur : on donne le script brut
  const content = await fs.readFile(filePath, "utf8");
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.send(content);
};

