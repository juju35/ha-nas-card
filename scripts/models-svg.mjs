// Regenerates images/models.svg, the README banner of the drawn NAS models: one row per brand,
// each model at a shared height with its name under it. The drawings come from the card source.
// Usage: node scripts/models-svg.mjs
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { load } from "../test/load.mjs";

const { nasSvg } = load("ugreen-nas-card.js", ["nasSvg"]);

// The models drawn in the banner: every distinct form factor of the editor lists (two models that
// share a drawing, like DS224+ and DS723+, appear once).
const ROWS = [
  ["UGREEN", ["DXP2800", "DXP4800 Plus", "DXP6800 Pro", "DXP8800 Plus", "DXP480T Plus", "DH2300", "DH4300 Plus"]],
  ["Synology", ["DS224+", "DS923+", "DS1522+", "DS1821+", "RS1221+"]],
  ["QNAP", ["TS-233", "TS-464", "TS-664", "TS-873A", "TS-873AeU"]],
];

const H = 70; // drawing height
const GAP = 24; // between models
const CAPTION = 18; // brand name line
const LABEL = 24; // model name line
const ROW = CAPTION + H + LABEL;

// Every drawing carries its own gradient ids: suffix them so they stay unique in the banner.
const uniq = (svg, n) => svg.replace(/id="(\w+)"/g, `id="$1${n}"`).replace(/url\(#(\w+)\)/g, `url(#$1${n})`);

let items = "";
let width = 0;
let n = 0;
ROWS.forEach(([brand, models], r) => {
  const top = r * ROW;
  items += `<text x="0" y="${top + 12}" class="brand">${brand}</text>`;
  let x = 0;
  for (const model of models) {
    const svg = nasSvg(model);
    const [, , vw, vh] = svg.match(/viewBox="([\d.]+) ([\d.]+) ([\d.]+) ([\d.]+)"/).slice(1).map(Number);
    const w = (vw / vh) * H;
    items += `<svg x="${x}" y="${top + CAPTION}" width="${w}" height="${H}" ${uniq(svg.slice(4), n++)}`;
    items += `<text x="${x + w / 2}" y="${top + CAPTION + H + 16}" text-anchor="middle">${model}</text>`;
    x += w + GAP;
  }
  width = Math.max(width, x - GAP);
});

const out = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${ROWS.length * ROW}"><style>text{font:12px -apple-system,Segoe UI,Roboto,sans-serif;fill:#8b949e}text.brand{font-weight:600;letter-spacing:.06em;text-transform:uppercase;font-size:11px}</style>${items}</svg>\n`;
writeFileSync(fileURLToPath(new URL("../images/models.svg", import.meta.url)), out);
console.log(`images/models.svg (${(out.length / 1024).toFixed(1)} KB)`);
