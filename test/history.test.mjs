import assert from "node:assert/strict";
import { test } from "node:test";
import { load } from "./load.mjs";

const { discover, NasCard, NasMiniCard, spark } = load("nas-card.js", ["discover", "NasCard", "NasMiniCard", "spark"]);
const { mocks } = await import("../scripts/mock-states.mjs");

// A card on a mock NAS whose recorder answers three 5-minute means per sensor; `calls` keeps the queries.
function mount(Card, config, mock = mocks.ugreen) {
  const calls = [];
  const el = new Card();
  el._config = config;
  el._hass = {
    ...mock,
    language: "en",
    callWS: async (msg) => {
      calls.push(msg);
      const at = (k) => Date.now() - k * 300000;
      return Object.fromEntries(msg.statistic_ids.map((id) => [id, [{ start: at(3), mean: 10 }, { start: at(2), mean: 40 }, { start: at(1), mean: 20 }]]));
    },
  };
  el._update = () => {
    el.html = el._render();
  };
  el.shadowRoot.querySelector = () => null;
  return { el, calls, sc: discover(el._hass, "").scalars };
}
const tick = () => new Promise((r) => setTimeout(r, 0));
// The markup of the element (gauge or mini row) that opens `id`, up to its label (gauge) or value (row): the curve
// comes first.
const block = (html, cls, id) => {
  const start = html.search(new RegExp(`<div class="${cls}\\b[^>]*data-entity="${id.replace(/\./g, "\\.")}"`));
  if (start < 0) return "";
  const end = html.slice(start).search(/<div class="lbl"|<span class="v"/);
  return html.slice(start, end < 0 ? undefined : start + end);
};

for (const brand of ["ugreen", "synology", "qnap"])
  test(`full card (${brand}): CPU and RAM curves behind their gauges, fetched in the same query as the rates`, async () => {
    const { el, calls, sc } = mount(NasCard, {}, mocks[brand]);
    assert.ok(sc.cpu_usage && sc.ram_usage, "the card has CPU and RAM percentages");
    el._update();
    assert.equal(calls.length, 1, "one statistics query");
    assert.deepEqual([...calls[0].statistic_ids], [sc.cpu_usage, sc.ram_usage, sc.lan_down, sc.lan_up].filter(Boolean));
    await tick();
    for (const id of [sc.cpu_usage, sc.ram_usage]) assert.match(block(el.html, "gauge", id), /class="spark"/, id);
    // The temperature gauge has no curve.
    assert.doesNotMatch(block(el.html, "gauge", sc.cpu_temp || sc.sys_temp), /class="spark"/);
  });

test("full card: show_system: false and show_network: false leave their sensors out of the query", async () => {
  const noSys = mount(NasCard, { show_system: false });
  noSys.el._update();
  assert.deepEqual([...noSys.calls[0].statistic_ids], [noSys.sc.lan_down, noSys.sc.lan_up]);
  const noNet = mount(NasCard, { show_network: false });
  noNet.el._update();
  assert.deepEqual([...noNet.calls[0].statistic_ids], [noNet.sc.cpu_usage, noNet.sc.ram_usage]);
  await tick();
  assert.match(block(noNet.el.html, "gauge", noNet.sc.cpu_usage), /class="spark"/);
  const none = mount(NasCard, { show_system: false, show_network: false });
  none.el._update();
  assert.equal(none.calls.length, 0, "nothing drawn, nothing fetched");
  const off = mount(NasCard, { show_history: false });
  off.el._update();
  assert.equal(off.calls.length, 0);
  assert.doesNotMatch(off.el.html, /class="spark"/);
});

test("mini card: CPU and RAM curves behind their rows, one query with the rates", async () => {
  const { el, calls, sc } = mount(NasMiniCard, {});
  el._update();
  assert.equal(calls.length, 1);
  assert.deepEqual([...calls[0].statistic_ids], [sc.cpu_usage, sc.ram_usage, sc.lan_down, sc.lan_up]);
  await tick();
  for (const id of [sc.cpu_usage, sc.ram_usage]) assert.match(block(el.html, "metric", id), /^<div class="metric[^>]*><svg class="spark"/, id);
  assert.doesNotMatch(block(el.html, "metric", sc.cpu_temp || sc.sys_temp), /class="spark"/);

  // Without the network, the CPU and RAM rows only; with show_history: false, nothing.
  const noNet = mount(NasMiniCard, { show_network: false });
  noNet.el._update();
  assert.deepEqual([...noNet.calls[0].statistic_ids], [noNet.sc.cpu_usage, noNet.sc.ram_usage]);
  const off = mount(NasMiniCard, { show_history: false });
  off.el._update();
  assert.equal(off.calls.length, 0);
  assert.doesNotMatch(off.el.html, /class="spark"/);
});

test("sparkline: a fixed 0–100 % scale clamps values outside it, keeps the time axis and the gaps", () => {
  const now = Date.UTC(2026, 11, 8, 12);
  const H = 3600000;
  const pt = (h, v) => ({ t: now - h * H, v });
  // Fixed scale: 50 % sits at mid-height whatever the series' peak; above 100 at the top, below 0 at the bottom.
  const line = (pts) => spark(pts, now, 100).match(/class="spark-l" d="([^"]+)"/)[1];
  assert.equal(line([pt(1, 50), pt(0.95, 10)]), "M95.83,16.00L96.04,27.20");
  assert.equal(line([pt(1, 150), pt(0.95, -5)]), "M95.83,2.00L96.04,30.00");
  // Without a fixed scale, the peak is the top.
  assert.match(spark([pt(1, 50), pt(0.95, 10)], now), /d="M95\.83,2\.00L/);
  // Points on the 24 h axis, the line broken over 6 h without data.
  const run = (from, to) => Array.from({ length: (from - to) * 12 + 1 }, (_, i) => pt(from - i / 12, 30 + (i % 5)));
  const d = line([...run(18, 12), ...run(6, 0)]);
  assert.equal(d.split("M").filter(Boolean).length, 2);
  assert.match(d, /^M25\.00,/);
  assert.match(d, /L50\.00,[\d.]+M75\.00,/);
});
