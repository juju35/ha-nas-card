// Renders the README galleries of the drawn NAS models, one file per brand (images/models-<brand>.svg):
// every model of the editor list, in the editor's order, at a shared height with its name under it,
// wrapped in rows. The drawings come from the card source.
// Usage: node scripts/models-svg.mjs
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { load } from "../test/load.mjs";

const { nasSvg, modelOptions, NAS_MODELS } = load("nas-card.js", ["nasSvg", "modelOptions", "NAS_MODELS"]);

const H = 70; // drawing height
const GAP = 24; // between models
const LABEL = 24; // model name line
const ROW_GAP = 14; // between rows
const MAX_W = 980; // wrap width

// Every drawing carries its own gradient ids: suffix them so they stay unique in a gallery.
const uniq = (svg, n) => svg.replace(/id="(\w+)"/g, `id="$1${n}"`).replace(/url\(#(\w+)\)/g, `url(#$1${n})`);

const options = modelOptions();
for (const [brand, list] of Object.entries(NAS_MODELS)) {
  const models = options.filter((o) => list.includes(o.value)).map((o) => o.value);
  let items = "";
  let x = 0;
  let y = 0;
  let width = 0;
  models.forEach((model, n) => {
    const svg = nasSvg(model);
    const [vw, vh] = svg.match(/viewBox="[\d.]+ [\d.]+ ([\d.]+) ([\d.]+)"/).slice(1).map(Number);
    const w = (vw / vh) * H;
    if (x > 0 && x + w > MAX_W) {
      x = 0;
      y += H + LABEL + ROW_GAP;
    }
    items += `<svg x="${x}" y="${y}" width="${w}" height="${H}" ${uniq(svg.slice(4), n)}`;
    items += `<text x="${x + w / 2}" y="${y + H + 16}" text-anchor="middle">${model}</text>`;
    x += w + GAP;
    width = Math.max(width, x - GAP);
  });
  const out = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${y + H + LABEL}"><style>text{font:12px -apple-system,Segoe UI,Roboto,sans-serif;fill:#8b949e}</style>${items}</svg>\n`;
  writeFileSync(fileURLToPath(new URL(`../images/models-${brand}.svg`, import.meta.url)), out);
  console.log(`images/models-${brand}.svg (${models.length} models, ${(out.length / 1024).toFixed(1)} KB)`);
}
