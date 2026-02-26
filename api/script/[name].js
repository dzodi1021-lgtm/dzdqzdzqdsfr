const path = require("path");
const fs = require("fs").promises;

const ROOT = process.cwd();
const SCRIPTS_DIR = path.join(ROOT, "scripts");

function cleanName(name) {
  return String(name || "").replace(/[^a-zA-Z0-9_-]/g, "");
}

async function resolveScript(name) {
  const extensions = [".lua", ".txt"];
  for (const ext of extensions) {
    const file = path.join(SCRIPTS_DIR, name + ext);
    try {
      await fs.access(file);
      return file;
    } catch {}
  }
  return null;
}

function safe(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function buildIndexPage(title) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${safe(title)}</title>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{
  background:#0f1115;
  color:#e6e6e6;
  font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Arial;
  height:100vh;
  display:flex;
  align-items:center;
  justify-content:center;
}
.wrapper{
  width:min(460px,92vw);
  background:#161a22;
  border:1px solid #262b36;
  border-radius:14px;
  padding:28px;
  box-shadow:0 25px 60px rgba(0,0,0,.6);
}
h1{
  font-size:18px;
  font-weight:700;
  margin-bottom:8px;
}
p{
  font-size:13px;
  color:#9da3b0;
}
.tag{
  margin-top:14px;
  font-size:11px;
  padding:6px 10px;
  background:#1e2430;
  border:1px solid #2c3444;
  border-radius:999px;
  display:inline-block;
}
</style>
</head>
<body>
<div class="wrapper">
  <h1>${safe(title)}</h1>
  <p>This endpoint exists.</p>
  <div class="tag">Script delivery node</div>
</div>
</body>
</html>`;
}

function buildBlockedPage() {
  const img = "https://i.postimg.cc/Jzm7phVG/image.png";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Stop trying to skid</title>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{
  background:#0e1014;
  color:#f1f1f1;
  font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Arial;
  height:100vh;
  display:flex;
  align-items:center;
  justify-content:center;
}
.card{
  width:min(520px,94vw);
  background:#171b23;
  border:1px solid #272d3a;
  border-radius:16px;
  padding:30px;
  display:flex;
  gap:22px;
  align-items:center;
  box-shadow:0 30px 70px rgba(0,0,0,.7);
}
.image{
  width:120px;
  height:120px;
  border-radius:18px;
  overflow:hidden;
  flex-shrink:0;
  border:1px solid #2d3443;
}
.image img{
  width:100%;
  height:100%;
  object-fit:cover;
}
.content{
  flex:1;
}
.content h2{
  font-size:20px;
  font-weight:700;
  margin-bottom:10px;
}
.content p{
  font-size:14px;
  color:#b8c0d0;
  line-height:1.6;
}
</style>
</head>
<body>
<div class="card">
  <div class="image">
    <img src="${img}" alt="epstein">
  </div>
  <div class="content">
    <h2>Stop trying to skid</h2>
    <p>Keep trying to see the code and im gonna put you on the files</p>
    <p style="margin-top:12px;font-size:12px;color:#8c94a8;">
      &lt;-- btw this is epstein cuz you have to be very uneducated to attempt to skid my scripts
    </p>
  </div>
</div>
<script>
const text = "Stop trying to skid   ";
let i = 0;
setInterval(() => {
  document.title = text.substring(i) + text.substring(0,i);
  i = (i + 1) % text.length;
}, 150);
</script>
</body>
</html>`;
}

module.exports = async (req, res) => {
  const { name, raw } = req.query;
  const method = req.method || "GET";
  const scriptName = cleanName(name);
  const wantRaw = raw === "1";

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
      res.status(404).setHeader("Content-Type", "text/html; charset=utf-8");
      res.send(buildIndexPage("Script not found"));
      return;
    }

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(buildIndexPage("Access restricted"));
    return;
  }

  if (method !== "GET") {
    res.status(405).send("Method not allowed");
    return;
  }

  const file = await resolveScript(scriptName);

  if (!file) {
    res.status(404).type("text/plain; charset=utf-8").send("Script not found");
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
    res.status(200).setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(buildBlockedPage());
    return;
  }

  const content = await fs.readFile(file, "utf8");
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.send(content);
};
