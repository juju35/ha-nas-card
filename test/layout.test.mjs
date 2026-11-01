// Browser test (Chromium through Playwright) of the card layout at narrow widths: at the minimum width the
// cards declare in getGridOptions (6 columns of a sections view, about 245 px) and a little above, in long
// languages and both themes, the title never collapses, the status pill and the buttons stay in the card,
// volume names keep their column, tags never cover the volume detail, the mini card labels fit their column
// and its footer items stay on one line. At a third of a section (4 columns, about 160 px), the header alone
// is checked. Skipped when Playwright or Chromium is not installed, except in CI, where it must run.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { after, before, test } from "node:test";
import { mocks } from "../scripts/mock-states.mjs";

const src = readFileSync(new URL("../src/nas-card.js", import.meta.url), "utf8");
const THEMES = {
  light: { "--secondary-background-color": "#ececec", "--card-background-color": "#fff", "--primary-text-color": "#212121", "--secondary-text-color": "#727272" },
  dark: { "--secondary-background-color": "#282828", "--card-background-color": "#1c1c1c", "--primary-text-color": "#e1e1e1", "--secondary-text-color": "#9b9b9b" },
};
const HA_CARD = `customElements.define("ha-card", class extends HTMLElement { constructor() { super();
  this.attachShadow({ mode: "open" }).innerHTML = "<style>:host{display:block;overflow:hidden;background:var(--card-background-color);color:var(--primary-text-color)}</style><slot></slot>"; } });`;

let browser;
let skip = false;
before(async () => {
  try {
    const { chromium } = await import("playwright");
    browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  } catch (err) {
    if (process.env.CI) throw err;
    skip = `Chromium not available: ${err.message.split("\n")[0]}`;
  }
});
after(() => browser?.close());

// Mounts every case on one page (one card per case, each in a box of its width) and measures them.
const measure = async (cases) => {
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.route("https://brands.home-assistant.io/**", (r) => r.fulfill({ status: 404 }));
  await page.setContent("<!doctype html><body style='margin:0;font-family:Roboto,Arial,sans-serif'></body>");
  await page.addScriptTag({ content: HA_CARD });
  await page.addScriptTag({ content: src });
  const out = await page.evaluate(
    ({ cases, mocks, THEMES }) =>
      cases.map((c) => {
        const box = document.createElement("div");
        box.style.cssText = `width:${c.width}px;${Object.entries(THEMES[c.theme]).map(([k, v]) => `${k}:${v}`).join(";")}`;
        document.body.appendChild(box);
        const el = document.createElement(c.type);
        el.setConfig({ type: `custom:${c.type}` });
        el.hass = { ...mocks[c.brand], language: c.lang, locale: { language: c.lang }, themes: { darkMode: c.theme === "dark" } };
        box.appendChild(el);
        const sr = el.shadowRoot;
        const card = el.getBoundingClientRect();
        const shown = (n) => n.getClientRects().length > 0 && getComputedStyle(n).visibility !== "hidden";
        const rect = (n) => n.getBoundingClientRect();
        const textWidth = (n) => {
          const r = document.createRange();
          r.selectNodeContents(n);
          return r.getBoundingClientRect().width;
        };
        const scope = c.headerOnly ? sr.querySelector(".header") : sr;
        const outside = [...scope.querySelectorAll("*")]
          .filter((n) => shown(n) && !n.closest("svg") && rect(n).right > card.right + 0.5)
          .map((n) => n.className?.baseVal ?? n.className);
        const name = sr.querySelector(".name");
        const ch = parseFloat(getComputedStyle(name).fontSize) * 0.5; // a narrow character
        const chip = sr.querySelector(".titles > .chip");
        const r = {
          outside,
          nameWidth: rect(name).width,
          nameMin: 4 * ch,
          chipRatio: chip && shown(chip) ? rect(chip).width / rect(sr.querySelector(".titles")).width : 0,
        };
        if (c.headerOnly) return r;
        r.grows = [...sr.querySelectorAll(".vol .grow")].map((n) => rect(n).width);
        r.overlaps = [];
        for (const v of sr.querySelectorAll(".vol")) {
          const d = rect(v.querySelector(".detail span"));
          for (const t of v.querySelectorAll(".tag")) {
            const tr = rect(t);
            if (shown(t) && tr.right > d.left + 0.5 && tr.left < d.right - 0.5 && tr.bottom > d.top + 0.5 && tr.top < d.bottom - 0.5) r.overlaps.push(t.textContent);
          }
        }
        r.labels = [...sr.querySelectorAll(".metric > span:first-of-type")].filter((l) => textWidth(l) > rect(l).width + 0.5).map((l) => l.textContent);
        r.wrapped = [...sr.querySelectorAll(".foot > span")].filter((s) => shown(s) && s.getClientRects().length && rect(s).height > 24).map((s) => s.textContent.trim());
        return r;
      }),
    { cases, mocks, THEMES }
  );
  await page.close();
  assert.deepEqual(errors, []);
  return out;
};

const matrix = (types, widths, extra = {}) => {
  const cases = [];
  for (const brand of ["ugreen", "synology", "qnap"])
    for (const type of types)
      for (const lang of ["en", "pl", "sr", "sr-Latn"])
        for (const theme of ["light", "dark"]) for (const width of widths) cases.push({ brand, type, lang, theme, width, ...extra });
  return cases;
};

test("at their minimum width and above, nothing of the cards collapses, overlaps or leaves the card", { timeout: 120000 }, async (t) => {
  if (skip) return t.skip(skip);
  const cases = matrix(["nas-card", "nas-mini-card"], [245, 290, 340]);
  const results = await measure(cases);
  results.forEach((r, i) => {
    const c = cases[i];
    const at = `${c.brand} ${c.type} ${c.lang} ${c.theme} ${c.width}px`;
    assert.deepEqual(r.outside, [], `outside the card: ${at}`);
    assert.ok(r.nameWidth >= r.nameMin, `title ${r.nameWidth.toFixed(0)} px < ${r.nameMin} px: ${at}`);
    assert.ok(r.chipRatio <= 0.51, `status pill ${(r.chipRatio * 100).toFixed(0)} % of the title block: ${at}`);
    for (const w of r.grows) assert.ok(w >= 40, `volume name ${w.toFixed(0)} px: ${at}`);
    assert.deepEqual(r.overlaps, [], `tags over the volume detail: ${at}`);
    assert.deepEqual(r.labels, [], `metric label wider than its column: ${at}`);
    assert.deepEqual(r.wrapped, [], `footer item on two lines: ${at}`);
  });
});

test("at a third of a section (4 columns), the header keeps a readable title and stays in the card", { timeout: 120000 }, async (t) => {
  if (skip) return t.skip(skip);
  const cases = matrix(["nas-card", "nas-mini-card"], [160], { headerOnly: true });
  const results = await measure(cases);
  results.forEach((r, i) => {
    const c = cases[i];
    const at = `${c.brand} ${c.type} ${c.lang} ${c.theme} ${c.width}px`;
    assert.deepEqual(r.outside, [], `outside the card: ${at}`);
    assert.ok(r.nameWidth >= r.nameMin, `title ${r.nameWidth.toFixed(0)} px < ${r.nameMin} px: ${at}`);
    assert.ok(r.chipRatio <= 0.51, `status pill ${(r.chipRatio * 100).toFixed(0)} %: ${at}`);
  });
});
