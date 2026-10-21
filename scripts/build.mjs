// Bundles src/ugreen-nas-card.js into the single HACS file dist/ugreen-nas-card.js,
// inlining the NAS picture so the card needs no extra resource.
// Usage: node scripts/build.mjs  (dist/ is not committed: CI and the release workflow build it)
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const pkg = JSON.parse(readFileSync(`${root}package.json`, "utf8"));
const img = readFileSync(`${root}images/nas.webp`).toString("base64");

const out = readFileSync(`${root}src/ugreen-nas-card.js`, "utf8")
  .replace("__VERSION__", pkg.version)
  .replace("__IMG_NAS__", `data:image/webp;base64,${img}`);

const target = `${root}dist/ugreen-nas-card.js`;
mkdirSync(`${root}dist`, { recursive: true });
writeFileSync(target, out);
console.log(`Built dist/ugreen-nas-card.js (${(out.length / 1024).toFixed(1)} KB)`);
