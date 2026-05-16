/**
 * Fetch Stitch screen HTML + screenshots for Echoes project.
 * Usage: STITCH_API_KEY=... node scripts/fetch-stitch-screens.mjs
 */
import { mkdir, writeFile } from "node:fs/promises";
import { createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const API_KEY = process.env.STITCH_API_KEY;
if (!API_KEY) {
  console.error("STITCH_API_KEY is required");
  process.exit(1);
}

const PROJECT_ID = "2713172289002767391";
const SCREENS = [
  { slug: "welcome", title: "Welcome to Echoes", id: "8135c78993e34e50b1461b2cc0dcb5a9" },
  { slug: "personas", title: "Personas", id: "ea87795b77f94262a9df2d96ba4faaea" },
  { slug: "new-persona", title: "New Persona", id: "fb2ae106ec864818a62cf9f572d4907e" },
  { slug: "your-archive", title: "Your Archive (Dark Mode)", id: "3b8a1928851c4a62bae8907c86727953" },
  { slug: "conversation-with-mom", title: "Conversation with Mom", id: "852a6d662e3640f7afd64eca4aca0e6e" },
  { slug: "the-vault", title: "The Vault", id: "73f1ac252b614978a2c774ecaa01f54f" },
  { slug: "settings", title: "Settings", id: "4ffa23fd67cd433db3b0bd4d39bb62e8" },
];

const MCP_URL = "https://stitch.googleapis.com/mcp";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "..", "design", "stitch");

let rpcId = 1;

async function mcpCall(method, params) {
  const body = { jsonrpc: "2.0", id: rpcId++, method, params };
  const res = await fetch(MCP_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": API_KEY,
    },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (json.error) {
    throw new Error(`${method} failed: ${JSON.stringify(json.error)}`);
  }
  return json.result;
}

async function mcpTool(name, args) {
  const result = await mcpCall("tools/call", { name, arguments: args });
  return result;
}

function parseToolText(result) {
  const text = result?.content?.find((c) => c.type === "text")?.text;
  if (!text) return result?.structuredContent ?? result;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function downloadFile(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed ${res.status}: ${url}`);
  await pipeline(res.body, createWriteStream(dest));
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const tools = await mcpCall("tools/list", {});
  const toolNames = (tools?.tools ?? []).map((t) => t.name);
  console.log("Available tools:", toolNames.join(", "));

  const manifest = {
    projectId: PROJECT_ID,
    projectTitle: "Echoes: AI Memory Preservation",
    fetchedAt: new Date().toISOString(),
    screens: [],
  };

  for (const screen of SCREENS) {
    console.log(`\nFetching: ${screen.title} (${screen.id})`);
    const screenDir = path.join(OUT_DIR, screen.slug);
    await mkdir(screenDir, { recursive: true });

    const raw = await mcpTool("get_screen", {
      projectId: PROJECT_ID,
      screenId: screen.id,
    });
    const data = parseToolText(raw);

    const htmlUrl =
      data?.htmlCode?.downloadUrl ??
      data?.html?.downloadUrl ??
      data?.htmlDownloadUrl;
    const imageUrl =
      data?.screenshot?.downloadUrl ??
      data?.screenshot?.url ??
      data?.imageDownloadUrl;

    const entry = {
      ...screen,
      htmlUrl: htmlUrl ?? null,
      imageUrl: imageUrl ?? null,
      files: {},
    };

    if (htmlUrl) {
      const htmlPath = path.join(screenDir, "screen.html");
      await downloadFile(htmlUrl, htmlPath);
      entry.files.html = `design/stitch/${screen.slug}/screen.html`;
      console.log("  HTML saved");
    } else {
      console.warn("  No HTML URL found");
    }

    if (imageUrl) {
      const imgPath = path.join(screenDir, "screenshot.png");
      await downloadFile(imageUrl, imgPath);
      entry.files.screenshot = `design/stitch/${screen.slug}/screenshot.png`;
      console.log("  Screenshot saved");
    } else {
      console.warn("  No image URL found");
    }

    await writeFile(
      path.join(screenDir, "metadata.json"),
      JSON.stringify(data, null, 2),
      "utf8"
    );
    entry.files.metadata = `design/stitch/${screen.slug}/metadata.json`;

    manifest.screens.push(entry);
  }

  await writeFile(
    path.join(OUT_DIR, "manifest.json"),
    JSON.stringify(manifest, null, 2),
    "utf8"
  );
  console.log(`\nDone. Output: ${OUT_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
