import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { readFile } from "fs/promises";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

const distRoot = path.resolve(__dirname, "../../dist");
const browserBundleDir = path.join(distRoot, "browser");

const sdkEntry = path.join(distRoot, "index.mjs");
const {default: Bland} = await import(`file://${sdkEntry}`);

const bland = new Bland({
  admin: {
    apiKey: process.env.BLAND_API_KEY || "",
    endpoint: process.env.BLAND_API_ENDPOINT || "https://api.bland.ai"
  },
  webchat: {}
});

app.use("/sdk", express.static(browserBundleDir));
app.use("/", express.static(path.join(__dirname, "public")));

app.options("/api/agent-authorize", (_req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:5173");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.sendStatus(204);
});

app.post("/api/agent-authorize", async (req, res) => {
  try {
    const agentId = String(req.body?.agentId || "").trim();
    if (!agentId) return res.status(400).json({ error: "missing agentId" });
    const admin = await bland.AdminClient();
    const context = { ua: req.get("user-agent") || "unknown" };
    const token = await admin.agents.authorize({ agentId, context });
    res.setHeader("Access-Control-Allow-Origin", "http://localhost:5173");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.json(token);
  } catch (e) {
    res.status(500).json({ error: String(e?.message || e) });
  }
});

app.get("/health", async (_req, res) => {
  try {
    const p = path.join(browserBundleDir, "index.global.js");
    await readFile(p);
    res.json({ ok: true });
  } catch {
    res.status(500).json({ ok: false });
  }
});

const port = Number(process.env.PORT || 5174);
app.listen(port, () => {
  console.log(`workbench at http://localhost:${port}`);
});
