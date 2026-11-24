// Browser test (Chromium through Playwright) of the card layout at narrow widths: at the minimum width the
// cards declare in getGridOptions (6 columns of a sections view, about 245 px) and a little above, in long
// languages and both themes, the title never collapses, the status pill and the buttons stay in the card,
// volume names keep their column, tags never cover the volume detail, the mini card labels fit their column
// and its footer items stay on one line. At a third of a section (4 columns, about 160 px), the header alone
// is checked. Skipped when Playwright or Chromium is not installed, except in CI, where it must run.
import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { mocks } from "../scripts/mock-states.mjs";
import { source } from "./source.mjs";

const src = source;
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
        let mock = mocks[c.brand];
        // The NAS offline: every entity unavailable.
        if (c.st === "na") mock = { ...mock, states: Object.fromEntries(Object.entries(mock.states).map(([k, v]) => [k, { ...v, state: "unavailable" }])) };
        el.hass = { ...mock, language: c.lang, locale: { language: c.lang }, themes: { darkMode: c.theme === "dark" } };
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
        const chip = sr.querySelector(".titles .chip");
        // A text cut by its box (ellipsis or overflow): the width of its text against the width of its box.
        const cut = (n) => n && shown(n) && textWidth(n) > rect(n).width + 0.5;
        const chipTxt = chip?.querySelector(".txt");
        const r = {
          outside,
          minColumns: el.getGridOptions().min_columns,
          chipText: !chip || !shown(chip) ? "none" : !chipTxt || !shown(chipTxt) ? "dot" : cut(chipTxt) ? "cut" : "full",
          footStatusCut: !!cut(sr.querySelector('.foot [data-key="status"] .txt')),
          values: [...sr.querySelectorAll(".metric .v, .gauge .val b, .tile .v, .disk .temp, .vol .detail span")].filter(cut).map((n) => n.textContent),
          nameWidth: rect(name).width,
          nameMin: 4 * ch,
          // The pill on the title row only beside the whole title (a pill on a line of its own leaves the title the row).
          titleCutByPill: !!(chip && shown(chip) && rect(chip).top < rect(name).bottom && cut(name)),
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
        // A label hidden on purpose (very narrow mini card: only for screen readers) is clipped away entirely.
        r.labels = [...sr.querySelectorAll(".metric > span:first-of-type")].filter((l) => getComputedStyle(l).clipPath === "none" && textWidth(l) > rect(l).width + 0.5).map((l) => l.textContent);
        // Each footer item on one line; the network item may put its two rates on two lines, each on one.
        r.wrapped = [...sr.querySelectorAll('.foot > span:not([data-key="network"]), .foot .rate')]
          .filter((s) => shown(s) && s.getClientRects().length && rect(s).height > 24)
          .map((s) => s.textContent.trim());
        // Texts that reach the card's padding (12 px): cut by its rounded border and its edge.
        r.edge = [...sr.querySelectorAll(".foot .rate, .foot .txt, .metric .v")].filter((n) => shown(n) && rect(n).right > card.right - 6).map((n) => n.textContent.trim());
        return r;
      }),
    { cases, mocks, THEMES }
  );
  await page.close();
  assert.deepEqual(errors, []);
  return out;
};

const matrix = (types, widths, extra = {}, states = ["ok"]) => {
  const cases = [];
  for (const brand of ["ugreen", "synology", "qnap"])
    for (const type of types)
      for (const lang of ["en", "pl", "sr", "sr-Latn", "bg", "el", "lv"])
        for (const theme of ["light", "dark"])
          for (const st of states) for (const width of widths) cases.push({ brand, type, lang, theme, st, width, ...extra });
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
    assert.equal(r.titleCutByPill, false, `title cut beside the status pill: ${at}`);
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
    assert.equal(r.titleCutByPill, false, `title cut beside the status pill: ${at}`);
  });
});

// Width of N columns of a sections view on a phone (section about 320 px): 3 = 78, 4 = 104, 6 = 156, 8 = 208, 9 = 234.
const PHONE = { 3: 78, 4: 104, 6: 156, 8: 208, 9: 234, 12: 320 };

test("at their declared minimum on a phone, and at 245 px, nothing leaves the card and no value is cut", { timeout: 180000 }, async (t) => {
  if (skip) return t.skip(skip);
  const probe = await measure([{ brand: "ugreen", type: "nas-card", lang: "en", theme: "light", width: 300 }, { brand: "ugreen", type: "nas-mini-card", lang: "en", theme: "light", width: 300 }]);
  const cases = [];
  for (const [i, type] of ["nas-card", "nas-mini-card"].entries()) {
    const min = PHONE[probe[i].minColumns];
    assert.ok(min, `min_columns ${probe[i].minColumns} of ${type}`);
    cases.push(...matrix([type], [min, 245], {}, ["ok", "na"]));
  }
  const results = await measure(cases);
  results.forEach((r, i) => {
    const c = cases[i];
    const at = `${c.brand} ${c.type} ${c.lang} ${c.theme} ${c.st} ${c.width}px`;
    assert.deepEqual(r.outside, [], `outside the card: ${at}`);
    assert.ok(r.nameWidth >= r.nameMin, `title ${r.nameWidth.toFixed(0)} px < ${r.nameMin} px: ${at}`);
    assert.deepEqual(r.values, [], `values cut: ${at}`);
    assert.deepEqual(r.labels, [], `metric label wider than its column: ${at}`);
    assert.deepEqual(r.wrapped, [], `footer item on two lines: ${at}`);
    assert.deepEqual(r.edge, [], `text on the card edge: ${at}`);
    assert.equal(r.footStatusCut, false, `mini card footer status cut: ${at}`);
  });
});

test("from 245 to 500 px, the status pill shows its whole label or its dot only", { timeout: 120000 }, async (t) => {
  if (skip) return t.skip(skip);
  const cases = matrix(["nas-card"], [245, 290, 320, 400, 500], {}, ["ok", "na"]);
  const results = await measure(cases);
  results.forEach((r, i) => {
    const c = cases[i];
    assert.notEqual(r.chipText, "cut", `status pill: ${c.brand} ${c.lang} ${c.theme} ${c.st} ${c.width}px`);
    assert.ok(r.nameWidth >= r.nameMin, `title: ${c.brand} ${c.lang} ${c.theme} ${c.st} ${c.width}px`);
  });
});

// Contexts that size the card from its content (inline-block, grid auto column: button-card, layout-card) or
// squeeze it (grid 1fr 1fr: grid card, horizontal-stack, layout-card), with the card placed directly or wrapped
// in a <div> (whose min-width stays auto). The card must keep a usable width in the first two, and never
// overflow its column nor collapse to 0 px in the last.
test("in a container sized by its content or a 1fr 1fr grid, the cards keep a usable width and never overflow", { timeout: 60000 }, async (t) => {
  if (skip) return t.skip(skip);
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
  await page.route("https://brands.home-assistant.io/**", (r) => r.fulfill({ status: 404 }));
  await page.setContent("<!doctype html><body style='margin:0;font-family:Roboto,Arial,sans-serif'></body>");
  await page.addScriptTag({ content: HA_CARD });
  await page.addScriptTag({ content: src });
  const results = await page.evaluate((mocks) => {
    const out = [];
    const contexts = [
      ["inline-block", "display:inline-block", 1],
      ["grid auto", "display:grid;grid-template-columns:auto", 1],
      ...[320, 360, 500].map((w) => [`grid 1fr 1fr ${w}px`, `display:grid;grid-template-columns:1fr 1fr;gap:8px;width:${w}px`, 2]),
    ];
    for (const type of ["nas-card", "nas-mini-card"])
      for (const wrapped of [false, true])
        for (const [name, css, n] of contexts) {
          const box = document.createElement("div");
          box.style.cssText = css;
          document.body.appendChild(box);
          const cards = [];
          for (let i = 0; i < n; i++) {
            const el = document.createElement(type);
            el.setConfig({ type: `custom:${type}` });
            el.hass = { ...mocks.ugreen, language: "en", locale: { language: "en" } };
            if (wrapped) {
              const div = document.createElement("div");
              div.appendChild(el);
              box.appendChild(div);
            } else box.appendChild(el);
            cards.push(el);
          }
          const boxRect = box.getBoundingClientRect();
          const widths = cards.map((el) => el.shadowRoot.querySelector("ha-card").getBoundingClientRect().width);
          // Overflow: a card past the box, or past the half of the box it should get in a 1fr 1fr grid.
          const overflow = Math.max(
            box.scrollWidth - box.clientWidth,
            ...cards.map((el, i) => {
              const r = el.shadowRoot.querySelector("ha-card").getBoundingClientRect();
              const cellRight = n === 2 ? boxRect.left + (i + 1) * (boxRect.width - 8) / 2 + i * 8 : boxRect.right;
              return Math.max(r.right - cellRight, r.right - boxRect.right);
            }),
          );
          out.push({ label: `${type} ${wrapped ? "in a div" : "direct"} ${name}`, n, boxWidth: boxRect.width, widths, overflow });
          box.remove();
        }
    return out;
  }, mocks);
  await page.close();
  const failures = [];
  for (const r of results) {
    const ws = r.widths.map((w) => w.toFixed(0)).join("/");
    if (r.overflow > 0.5) failures.push(`${r.label}: overflows by ${r.overflow.toFixed(0)} px (widths ${ws})`);
    else if (r.n === 1 ? r.widths[0] < 240 : r.widths.some((w) => w < (r.boxWidth - 8) / 2 - 0.5))
      failures.push(`${r.label}: ${ws} px in ${r.boxWidth} px`);
  }
  assert.deepEqual(failures, []);
});

// Home Assistant's <ha-card> is a Lit element: it shows its content from its first update only, a microtask after it is
// connected, so whatever the card measures before that is 0 px wide. With such a stand-in, the status pill must be in
// its place (and the card at its height) from the first frame, and keep them through state updates.
const LIT_HA_CARD = `customElements.define("ha-card", class extends HTMLElement {
  constructor() { super(); this.attachShadow({ mode: "open" }).innerHTML = "<style>:host{display:block;overflow:hidden}</style>"; }
  connectedCallback() {
    if (this.updateComplete) return;
    this.hasUpdated = false;
    this.updateComplete = Promise.resolve().then(() => { this.shadowRoot.appendChild(document.createElement("slot")); this.hasUpdated = true; return true; });
  }
});`;

for (const [type, config] of ["nas-card", "nas-mini-card"].flatMap((type) => [{}, { title: "Main network storage of the house" }].map((c) => [type, c])))
  for (const width of [300, 400])
    test(`${type}${config.title ? " (long title)" : ""} at ${width} px in a Lit-like ha-card: the pill is placed from the first frame and stays`, async (t) => {
      if (skip) return t.skip(skip);
      const page = await browser.newPage({ viewport: { width: 1000, height: 1400 } });
      const errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      await page.route("https://brands.home-assistant.io/**", (r) => r.fulfill({ status: 404 }));
      await page.setContent("<!doctype html><body style='margin:0'></body>");
      await page.addScriptTag({ content: LIT_HA_CARD });
      await page.addScriptTag({ content: src });
      const r = await page.evaluate(
        async ({ type, config, width, hass }) => {
          const frame = () => new Promise((done) => requestAnimationFrame(done));
          const box = document.createElement("div");
          box.style.width = `${width}px`;
          document.body.appendChild(box);
          const el = document.createElement(type);
          el.setConfig({ type: `custom:${type}`, ...config });
          el.hass = hass;
          box.appendChild(el);
          const look = () => `${Math.round(el.getBoundingClientRect().height)} ${[...el.shadowRoot.querySelectorAll(".titles")].map((n) => n.className).join("|")}`;
          const first = new Set();
          for (let k = 0; k < 6; k++) {
            await frame();
            first.add(look());
          }
          await new Promise((done) => setTimeout(done, 300));
          await frame();
          const settled = look();
          const updates = new Set();
          let h = hass;
          for (let i = 1; i <= 8; i++) {
            const states = { ...h.states };
            if (i % 2) states["sensor.layout_probe"] = { entity_id: "sensor.layout_probe", state: String(i), attributes: {} };
            else {
              for (const [key, v] of [["cpu_usage", 10 + ((i * 7) % 60)], ["cpu_temperature", 40 + (i % 9)], ["ram_usage", 30 + ((i * 3) % 50)]]) {
                const id = `sensor.ugreen_nas_${key}`;
                states[id] = { ...states[id], state: String(v) };
              }

            }
            h = { ...h, states };
            el.hass = h;
            await frame();
            await frame();
            updates.add(look());
          }
          return { first: [...first], settled, updates: [...updates] };
        },
        { type, config, width, hass: { ...mocks.ugreen, language: "en", locale: { language: "en" }, themes: { darkMode: false } } },
      );
      await page.close();
      assert.deepEqual(errors, []);
      assert.deepEqual(r.first, [r.settled], "the first frames show the pill where it settles, at the same height");
      assert.deepEqual(r.updates, [r.settled], "state updates keep the pill's place and the height");
    });
