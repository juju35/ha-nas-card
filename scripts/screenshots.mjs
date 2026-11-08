// Renders the cards with mock NAS data (UGREEN, Synology DSM, QNAP) and saves the README screenshots.
// Usage: npm run build && npm run screenshots
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { mocks } from "./mock-states.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const cardJs = readFileSync(`${root}dist/nas-card.js`, "utf8");

const THEMES = {
  light: {
    "--primary-background-color": "#e8eaed",
    "--secondary-background-color": "#ececec",
    "--card-background-color": "#ffffff",
    "--primary-text-color": "#212121",
    "--secondary-text-color": "#727272",
    "--divider-color": "rgba(0,0,0,.12)",
  },
  dark: {
    "--primary-background-color": "#111111",
    "--secondary-background-color": "#282828",
    "--card-background-color": "#1c1c1c",
    "--primary-text-color": "#e1e1e1",
    "--secondary-text-color": "#9b9b9b",
    "--divider-color": "rgba(225,225,225,.12)",
  },
};

// Minimal stand-in for Home Assistant's <ha-card>.
const HA_CARD = `customElements.define("ha-card", class extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" }).innerHTML =
      "<style>:host{display:block;background:var(--card-background-color);border-radius:12px;" +
      "border:1px solid var(--divider-color);color:var(--primary-text-color);overflow:hidden}</style><slot></slot>";
  }
});`;

const page_html = (theme, width) => `<!doctype html><html><head><meta charset="utf-8">
<style>
  :root { ${Object.entries(THEMES[theme]).map(([k, v]) => `${k}:${v};`).join("")} }
  body { margin: 0; padding: 16px; background: var(--primary-background-color); color: var(--primary-text-color);
         font-family: Roboto, "Segoe UI", Helvetica, Arial, sans-serif; width: ${width}px; }
</style></head><body><div id="root"></div></body></html>`;

// Opens a fresh page for one shot and mounts the card with the mock hass of its brand.
async function openCard(browser, s) {
  // A fresh page for each capture: the card script declares its classes and custom elements once per page.
  const page = await browser.newPage({ deviceScaleFactor: 2, viewport: { width: 1000, height: 2000 } });
  page.on("pageerror", (err) => console.error(`${s.file}: ${err.message}`));
  await page.setContent(page_html(s.theme, s.width));
  await page.addScriptTag({ content: HA_CARD });
  await page.addScriptTag({ content: cardJs });
  await page.evaluate(
    ({ type, config, mock, dark, zoom }) => {
      const el = document.createElement(type);
      el.setConfig({ type: `custom:${type}`, ...config });
      // Recorder statistics, one 5-minute period after the other up to now: a plausible 24 h rate curve for each
      // network sensor (busy evening, quiet night), and CPU / RAM percentages (CPU busy in the evening and during the
      // nightly backup, RAM steadier).
      const pct = (id) => (/cpu/.test(id) ? "cpu" : /ram|memory/.test(id) ? "ram" : null);
      const mean = (kind, i, k) =>
        kind === "cpu"
          ? 10 + 40 * Math.exp(-((i - 235) ** 2) / 400) + 25 * Math.exp(-((i - 40) ** 2) / 150) + 6 * Math.sin(i * 0.09) ** 2
          : kind === "ram"
            ? 34 + 10 * Math.exp(-((i - 230) ** 2) / 1500) + 3 * Math.sin(i * 0.08) ** 2
            : 20 + 80 * Math.exp(-((i - 230 + k * 20) ** 2) / 900) + 35 * Math.exp(-((i - 110) ** 2) / 400) + 8 * Math.sin(i * 0.12 + k) ** 2;
      const callWS = async (msg) =>
        Object.fromEntries(
          (msg.statistic_ids || []).map((id, k) => [
            id,
            Array.from({ length: 288 }, (_, i) => ({ start: Date.now() - (288 - i) * 300000, mean: mean(pct(id), i, k) })),
          ])
        );
      el.hass = { ...mock, language: "en", locale: { language: "en" }, themes: { darkMode: dark }, callWS };
      document.getElementById("root").appendChild(el);
      // A mouse click (detail 1) on the zoom button: the zoomed-in view, without a keyboard focus ring.
      if (zoom)
        el.shadowRoot
          .querySelector(".zoom")
          .dispatchEvent(new MouseEvent("click", { bubbles: true, composed: true, detail: 1 }));
    },
    { type: s.type, config: s.config, mock: mocks[s.mock ?? "ugreen"], dark: s.theme === "dark", zoom: !!s.zoom }
  );
  return page;
}

const shots = [
  { file: "card", type: "nas-card", theme: "light", width: 460, config: {} },
  { file: "card-dark", type: "nas-card", theme: "dark", width: 460, config: {} },
  { file: "mini-card", type: "nas-mini-card", theme: "light", width: 380, config: {} },
  { file: "mini-card-dark", type: "nas-mini-card", theme: "dark", width: 380, config: {} },
  { file: "mini-card-zoom", type: "nas-mini-card", theme: "light", width: 460, config: {}, zoom: true },
  { file: "mini-card-zoom-dark", type: "nas-mini-card", theme: "dark", width: 460, config: {}, zoom: true },
  { file: "card-synology", type: "nas-card", theme: "light", width: 460, config: {}, mock: "synology" },
  { file: "card-synology-dark", type: "nas-card", theme: "dark", width: 460, config: {}, mock: "synology" },
  { file: "mini-card-synology", type: "nas-mini-card", theme: "light", width: 380, config: {}, mock: "synology" },
  { file: "mini-card-synology-dark", type: "nas-mini-card", theme: "dark", width: 380, config: {}, mock: "synology" },
  { file: "card-qnap", type: "nas-card", theme: "light", width: 460, config: {}, mock: "qnap" },
  { file: "card-qnap-dark", type: "nas-card", theme: "dark", width: 460, config: {}, mock: "qnap" },
  { file: "mini-card-qnap", type: "nas-mini-card", theme: "light", width: 380, config: {}, mock: "qnap" },
  { file: "mini-card-qnap-dark", type: "nas-mini-card", theme: "dark", width: 380, config: {}, mock: "qnap" },
];

const browser = await chromium.launch(
  process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}
);

// A screenshot is only rewritten when its pixels change: two encodings of the same image (another libpng or
// zlib) differ in bytes, not on screen. The browser decodes both PNGs and compares their pixels.
const decoder = await browser.newPage();
const samePixels = (a, b) =>
  decoder.evaluate(
    async ([a, b]) => {
      const pixels = async (b64) => {
        const bmp = await createImageBitmap(await (await fetch(`data:image/png;base64,${b64}`)).blob());
        const canvas = new OffscreenCanvas(bmp.width, bmp.height);
        const ctx = canvas.getContext("2d");
        ctx.drawImage(bmp, 0, 0);
        return { w: bmp.width, h: bmp.height, d: ctx.getImageData(0, 0, bmp.width, bmp.height).data };
      };
      const [x, y] = await Promise.all([pixels(a), pixels(b)]);
      return x.w === y.w && x.h === y.h && x.d.every((v, i) => v === y.d[i]);
    },
    [a.toString("base64"), b.toString("base64")]
  );
const savePng = async (path, png) => {
  if (existsSync(path) && (await samePixels(readFileSync(path), png))) return console.log(`${path.slice(root.length)} (unchanged)`);
  writeFileSync(path, png);
  console.log(path.slice(root.length));
};
// Same for the GIFs: the decoded frames (RGBA) are compared through their checksums.
const frameSums = (path) =>
  execFileSync("ffmpeg", ["-loglevel", "error", "-i", path, "-pix_fmt", "rgba", "-f", "framemd5", "-"], { encoding: "utf8" })
    .split("\n")
    .filter((l) => l && !l.startsWith("#"))
    .map((l) => l.split(",").pop().trim());
const saveGif = (path, tmp) => {
  if (existsSync(path) && frameSums(path).join() === frameSums(tmp).join()) return console.log(`${path.slice(root.length)} (unchanged)`);
  copyFileSync(tmp, path);
  console.log(path.slice(root.length));
};

// Waits for the card pictures (NAS pictures) and returns those that failed:
// a capture without its picture is not a change of the card, so it never replaces the committed one.
const failedImages = async (page) => {
  const imgs = () => [...(document.querySelector("#root > *")?.shadowRoot?.querySelectorAll("img") ?? [])];
  await page.waitForFunction(`(${imgs})().every((i) => i.complete)`, null, { timeout: 15000 }).catch(() => {});
  return page.evaluate(`(${imgs})().filter((i) => !i.complete || !i.naturalWidth).map((i) => i.src)`);
};

for (const s of shots) {
  const page = await openCard(browser, s);
  await page.waitForTimeout(800);
  const path = `${root}screenshots/${s.file}.png`;
  const failed = await failedImages(page);
  if (failed.length && existsSync(path)) {
    console.warn(`${path.slice(root.length)} kept: picture not loaded (${failed.join(", ")})`);
    await page.close();
    continue;
  }
  const box = await page.locator("#root").boundingBox();
  const png = await page.screenshot({
    clip: { x: 0, y: 0, width: s.width + 32, height: Math.ceil(box.height) + 32 },
    animations: "disabled",
  });
  await savePng(path, png);
  await page.close();
}

// Record the spinning cooling fans as a looping GIF. Needs ffmpeg on PATH. Every animation is paused and
// stepped frame by frame, so the GIF is identical whatever the machine's speed; the palette and the ordered
// (Bayer) dithering are computed from the frames alone, with no random dithering.
// Recorded in both themes with the same setup: fans.gif light, fans-dark.gif dark.
const gifs = [
  { file: "fans", type: "nas-card", theme: "light", width: 460, config: {} },
  { file: "fans-dark", type: "nas-card", theme: "dark", width: 460, config: {} },
];
const FPS = 20;
const SECONDS = 3;
for (const gif of gifs) {
  const page = await openCard(browser, gif);
  await page.waitForTimeout(300);
  const failed = await failedImages(page);
  if (failed.length && existsSync(`${root}screenshots/${gif.file}.gif`)) {
    console.warn(`screenshots/${gif.file}.gif kept: picture not loaded (${failed.join(", ")})`);
    await page.close();
    continue;
  }
  const box = await page.locator("#root").boundingBox();
  const clip = { x: 0, y: 0, width: gif.width + 32, height: Math.ceil(box.height) + 32 };
  const dir = mkdtempSync(join(tmpdir(), "nas-frames-"));
  const frames = Math.round(FPS * SECONDS);
  for (let i = 0; i < frames; i++) {
    // document.getAnimations() leaves out the card's shadow tree (the spinning fans): its own list is added.
    await page.evaluate((t) => {
      const card = document.querySelector("#root > *");
      for (const a of [...document.getAnimations(), ...(card?.shadowRoot?.getAnimations() ?? [])]) {
        a.pause();
        a.currentTime = t;
      }
    }, (i * 1000) / FPS);
    await page.screenshot({ path: join(dir, `f${String(i).padStart(3, "0")}.png`), clip });
  }
  await page.close();
  const out = join(dir, "out.gif");
  execFileSync("ffmpeg", [
    "-y", "-loglevel", "error", "-framerate", String(FPS), "-i", join(dir, "f%03d.png"),
    "-vf", `scale=${clip.width}:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=128[p];[b][p]paletteuse=dither=bayer:bayer_scale=4`,
    "-loop", "0", out,
  ]);
  saveGif(`${root}screenshots/${gif.file}.gif`, out);
  rmSync(dir, { recursive: true });
}
await browser.close();
