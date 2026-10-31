// Renders the cards with mock NAS data (UGREEN, Synology DSM, QNAP) and saves the README screenshots.
// Usage: npm run build && npm run screenshots
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
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
  // Brand icons (Synology, QNAP) load from the HA brand images CDN: point BRANDS_DIR at a checkout
  // of github.com/home-assistant/brands to render them offline.
  if (process.env.BRANDS_DIR)
    await page.route("https://brands.home-assistant.io/**", (route) => {
      const path = join(process.env.BRANDS_DIR, "core_integrations", new URL(route.request().url()).pathname);
      return existsSync(path) ? route.fulfill({ path }) : route.continue();
    });
  await page.setContent(page_html(s.theme, s.width));
  await page.addScriptTag({ content: HA_CARD });
  await page.addScriptTag({ content: cardJs });
  await page.evaluate(
    ({ type, config, mock, dark, zoom }) => {
      const el = document.createElement(type);
      el.setConfig({ type: `custom:${type}`, ...config });
      el.hass = { ...mock, language: "en", locale: { language: "en" }, themes: { darkMode: dark } };
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
for (const s of shots) {
  const page = await openCard(browser, s);
  await page.waitForTimeout(800);
  const box = await page.locator("#root").boundingBox();
  await page.screenshot({
    path: `${root}screenshots/${s.file}.png`,
    clip: { x: 0, y: 0, width: s.width + 32, height: Math.ceil(box.height) + 32 },
    animations: "disabled",
  });
  console.log(`screenshots/${s.file}.png`);
  await page.close();
}

// Record the spinning cooling fans as a looping GIF. Needs ffmpeg on PATH. Every animation is paused and
// stepped frame by frame, so the GIF is identical whatever the machine's speed.
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
  const box = await page.locator("#root").boundingBox();
  const clip = { x: 0, y: 0, width: gif.width + 32, height: Math.ceil(box.height) + 32 };
  const dir = mkdtempSync(join(tmpdir(), "nas-frames-"));
  const frames = Math.round(FPS * SECONDS);
  for (let i = 0; i < frames; i++) {
    await page.evaluate((t) => { for (const a of document.getAnimations()) { a.pause(); a.currentTime = t; } }, (i * 1000) / FPS);
    await page.screenshot({ path: join(dir, `f${String(i).padStart(3, "0")}.png`), clip });
  }
  await page.close();
  const out = `${root}screenshots/${gif.file}.gif`;
  execFileSync("ffmpeg", [
    "-y", "-loglevel", "error", "-framerate", String(FPS), "-i", join(dir, "f%03d.png"),
    "-vf", `scale=${clip.width}:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=128[p];[b][p]paletteuse=dither=bayer:bayer_scale=4`,
    "-loop", "0", out,
  ]);
  rmSync(dir, { recursive: true });
  console.log(`screenshots/${gif.file}.gif`);
}
await browser.close();
