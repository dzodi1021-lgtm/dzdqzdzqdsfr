const path = require("path");
const fs = require("fs").promises;

const ROOT = process.cwd();
const SCRIPTS_DIR = path.join(ROOT, "scripts");

function cleanName(name) {
  return name.replace(/[^a-zA-Z0-9_-]/g, "");
}

async function resolveScript(name) {
  const extensions = [".lua", ".txt"];
  for (const ext of extensions) {
    const full = path.join(SCRIPTS_DIR, name + ext);
    try {
      await fs.access(full);
      return full;
    } catch {}
  }
  return null;
}

function escapeHtml(input) {
  return String(input)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function animatedTitleScript(text) {
  return `
<script>
(function(){
  const base = "${text}";
  let i = 0;
  function tick(){
    document.title = base.slice(i) + " " + base.slice(0, i);
    i = (i + 1) % base.length;
  }
  setInterval(tick, 120);
})();
</script>
`;
}

function renderCardPage(title) {
  const img = "https://i.postimg.cc/Jzm7phVG/image.png";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)}</title>
<style>
:root{
  --bg:#070b1a;
  --card:#0f172a;
  --border:rgba(255,255,255,.08);
  --text:#e5e7eb;
  --muted:rgba(229,231,235,.55);
  --accent:#3b82f6;
}
*{box-sizing:border-box;margin:0;padding:0}
body{
  min-height:100vh;
  display:flex;
  align-items:center;
  justify-content:center;
  font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Arial;
  background:radial-gradient(circle at 20% 20%, #111827, #070b1a 60%);
  color:var(--text);
}
.card{
  width:min(480px,90vw);
  background:var(--card);
  border:1px solid var(--border);
  border-radius:20px;
  padding:24px;
  box-shadow:0 30px 80px rgba(0,0,0,.6);
  backdrop-filter:blur(12px);
}
.top{
  display:flex;
  gap:18px;
  align-items:center;
}
.avatar{
  width:110px;
  height:110px;
  border-radius:18px;
  overflow:hidden;
  border:1px solid var(--border);
  flex-shrink:0;
}
.avatar img{
  width:100%;
  height:100%;
  object-fit:cover;
}
.content h1{
  font-size:18px;
  font-weight:700;
  margin-bottom:8px;
}
.content p{
  font-size:13px;
  line-height:1.5;
  color:var(--muted);
}
.footer{
  margin-top:16px;
  font-size:12px;
  color:var(--muted);
}
</style>
</head>
<body>
<div class="card">
  <div class="top">
    <div class="avatar">
      <img src="${img}" alt="epstein">
    </div>
    <div class="content">
      <h1>Keep trying to see the code and im gonna put you on the files</h1>
      <p>&lt;-- btw this is epstein cuz you have to be very uneducated to attempt to skid my scripts</p>
    </div>
  </div>
</div>
${animatedTitleScript("Stop trying to skid")}
</body>
</html>
`;
}

module.exports = async (req, res) => {
  const { name, raw } = req.query;
  const method = req.method || "GET";
  const wantRaw = raw === "1";
  const scriptName = cleanName(name || "");

  if (!scriptName) {
    res.status(400).send("Invalid script name");
    return;
  }

  if (!wantRaw) {
    if (method !== "GET") {
      res.status(405).send("Method not allowed");
      return;
    }

    const file = await resolveScript(scriptName);
    if (!file) {
      res.status(404).send(renderCardPage("Stop trying to skid"));
      return;
    }

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(renderCardPage("Stop trying to skid"));
    return;
  }

  if (method !== "GET") {
    res.status(405).send("Method not allowed");
    return;
  }

  const file = await resolveScript(scriptName);
  if (!file) {
    res.status(404).type("text/plain").send("Script not found");
    return;
  }

  const accept = String(req.headers["accept"] || "").toLowerCase();
  const ua = String(req.headers["user-agent"] || "").toLowerCase();

  const browser =
    accept.includes("text/html") ||
    ua.includes("mozilla") ||
    ua.includes("chrome") ||
    ua.includes("safari") ||
    ua.includes("edg/");

  if (browser) {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(renderCardPage("Stop trying to skid"));
    return;
  }

  const content = await fs.readFile(file, "utf8");
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.send(content);
};
