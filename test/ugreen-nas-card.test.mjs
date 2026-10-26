import assert from "node:assert/strict";
import { test } from "node:test";
import { load } from "./load.mjs";

const { volumeUsage, discover, UgreenNasCard, UgreenNasMiniCard, toBps, fmtRate, STRINGS } = load("ugreen-nas-card.js", [
  "volumeUsage",
  "discover",
  "UgreenNasCard",
  "UgreenNasMiniCard",
  "toBps",
  "fmtRate",
  "STRINGS",
]);

const A = (unit) => ({ UGNAS_device_id: "nas", ...(unit ? { unit_of_measurement: unit } : {}) });
const s = (entity_id, state, unit) => ({ entity_id, state: String(state), attributes: A(unit) });

test("volume percentage is unknown when the used space is unknown", () => {
  const hass = { states: { "sensor.total": s("sensor.total", 1000, "B") } };
  const u = volumeUsage(hass, { total_size_raw: "sensor.total" });
  assert.equal(u.total, 1000);
  assert.equal(u.used, null);
  assert.equal(u.pct, null);
});

test("volume percentage from used or available space", () => {
  const states = {
    "sensor.total": s("sensor.total", 1000, "B"),
    "sensor.used": s("sensor.used", 250, "B"),
    "sensor.avail": s("sensor.avail", 600, "B"),
  };
  assert.equal(volumeUsage({ states }, { total_size_raw: "sensor.total", used_size_raw: "sensor.used" }).pct, 25);
  assert.equal(volumeUsage({ states }, { total_size_raw: "sensor.total", available_size_raw: "sensor.avail" }).pct, 40);
});

test("mini card storage total leaves out volumes whose used space is unknown", () => {
  const states = {
    "sensor.ugreen_nas_cpu_usage": s("sensor.ugreen_nas_cpu_usage", 10, "%"),
    "sensor.ugreen_nas_pool_1_volume_1_total_size_raw": s("sensor.ugreen_nas_pool_1_volume_1_total_size_raw", 1000, "B"),
    "sensor.ugreen_nas_pool_1_volume_1_used_size_raw": s("sensor.ugreen_nas_pool_1_volume_1_used_size_raw", 500, "B"),
    "sensor.ugreen_nas_pool_1_volume_2_total_size_raw": s("sensor.ugreen_nas_pool_1_volume_2_total_size_raw", 9000, "B"),
  };
  const el = new UgreenNasMiniCard();
  el._config = {};
  el._hass = { states, language: "en" };
  // 500 / 1000 = 50 %; counting the unknown volume as empty would give 5 %.
  assert.match(el._render(), />50%</);
});

test("discovery is cached across state changes and refreshed when entities change", () => {
  const entities = {};
  const states = { "sensor.ugreen_nas_cpu_usage": s("sensor.ugreen_nas_cpu_usage", 10, "%") };
  const a = discover({ states, entities }, "");
  const b = discover({ states: { ...states, "sensor.ugreen_nas_cpu_usage": s("sensor.ugreen_nas_cpu_usage", 20, "%") }, entities }, "");
  assert.equal(a, b);
  assert.equal(a.scalars.cpu_usage, "sensor.ugreen_nas_cpu_usage");
  const more = { ...states, "sensor.ugreen_nas_ram_usage": s("sensor.ugreen_nas_ram_usage", 30, "%") };
  const c = discover({ states: more, entities }, "");
  assert.notEqual(a, c);
  assert.equal(c.scalars.ram_usage, "sensor.ugreen_nas_ram_usage");
});

test("discovery finds the NAS once UGNAS_device_id appears on already registered entities", () => {
  // Restored / unavailable entities carry no UGNAS_device_id: same registry, same number of states.
  const bare = (id) => ({ entity_id: id, state: "unavailable", attributes: { restored: true } });
  const cpu = "sensor.ugreen_nas_cpu_usage";
  const ram = "sensor.ugreen_nas_ram_usage";
  for (const entities of [{ [cpu]: {}, [ram]: {} }, { [cpu]: { platform: "ugreen" }, [ram]: { platform: "ugreen" } }]) {
    assert.equal(discover({ entities, states: { [cpu]: bare(cpu), [ram]: bare(ram) } }, "").nasId, null);
    const partial = discover({ entities, states: { [cpu]: s(cpu, 10, "%"), [ram]: bare(ram) } }, "");
    assert.equal(partial.nasId, "nas");
    const full = discover({ entities, states: { [cpu]: s(cpu, 10, "%"), [ram]: s(ram, 30, "%") } }, "");
    assert.equal(full.scalars.cpu_usage, cpu);
    assert.equal(full.scalars.ram_usage, ram);
  }
});

test("network rates follow the unit of the sensor", () => {
  assert.equal(toBps(s("sensor.r", 2348000, "B/s")), 2348000);
  assert.equal(toBps(s("sensor.r", 2348, "kB/s")), 2348000);
  assert.equal(toBps(s("sensor.r", 2.348, "MB/s")), 2348000);
  assert.equal(toBps(s("sensor.r", 8, "Mbit/s")), 1e6);
  assert.equal(toBps(s("sensor.r", 1, "MiB/s")), 1024 ** 2);
  assert.equal(toBps(s("sensor.r", 5)), 5);
  assert.equal(toBps(s("sensor.r", "unavailable", "B/s")), null);
  assert.equal(fmtRate(toBps(s("sensor.r", 48.475, "MB/s"))), "48.5 MB/s");
});

test("both cards share setConfig and translate the Normal server status", () => {
  for (const Cls of [UgreenNasCard, UgreenNasMiniCard]) {
    const el = new Cls();
    el._hass = { states: {}, language: "en" };
    el._update = () => {};
    el.setConfig({ nas: "x" });
    assert.deepEqual({ ...el._config }, { nas: "x" });
    assert.throws(() => el.setConfig(null));
    STRINGS.en.status_ok = "OK (test)";
    try {
      assert.equal(el._statusText({ state: "Normal" }), "OK (test)");
    } finally {
      STRINGS.en.status_ok = "Normal";
    }
    assert.equal(el._statusText({ state: "Warning" }), "Warning");
  }
});

// R1: the attribute is lost (entity unavailable) while a configuration is resolved for the first time,
// then comes back with the same registry and the same number of states.
const regression = async () => {
  const { states: mock } = await import("../scripts/mock-states.mjs");
  const entities = Object.fromEntries(Object.keys(mock).map((id) => [id, { entity_id: id, platform: "ugreen" }]));
  const lose = (states, id) => ({ ...states, [id]: { entity_id: id, state: "unavailable", attributes: { friendly_name: "x" } } });
  return { mock, entities, lose };
};

test("discovery recovers when the first NAS entity comes back after a lookup without nas", async () => {
  const { mock, entities, lose } = await regression();
  assert.equal(discover({ states: mock, entities }, "ugreen_nas").nasId, "ugreen_nas");
  const first = Object.keys(mock).sort()[0];
  const down = lose(mock, first);
  assert.equal(discover({ states: down, entities }, "").nasId, "ugreen_nas");
  const el = new UgreenNasCard();
  el._config = {};
  el._hass = { states: down, entities, language: "en" };
  assert.doesNotMatch(el._render(), /class="warning"/);
  assert.equal(discover({ states: { ...mock }, entities }, "").scalars.cpu_fan, first);
});

test("discovery finds the NAS again after it was entirely offline", async () => {
  const { mock, entities, lose } = await regression();
  let offline = mock;
  for (const id of Object.keys(mock)) offline = lose(offline, id);
  assert.equal(discover({ states: offline, entities }, "").nasId, null);
  const el = new UgreenNasMiniCard();
  el._config = {};
  el._hass = { states: offline, entities, language: "en" };
  assert.match(el._render(), /class="warning"/);
  el._hass = { states: { ...mock }, entities, language: "en" };
  assert.doesNotMatch(el._render(), /class="warning"/);
  assert.equal(discover({ states: { ...mock }, entities }, "").nasId, "ugreen_nas");
});

test("a sensor missing at the first lookup of a configuration is found once it is back", async () => {
  const { mock, entities, lose } = await regression();
  const ram = "sensor.ugreen_nas_ram_usage";
  const other = { ...mock };
  assert.equal(discover({ states: lose(other, ram), entities }, "ugreen_nas").scalars.ram_usage, undefined);
  assert.equal(discover({ states: other, entities }, "ugreen_nas").scalars.ram_usage, ram);
  // And the other way round: lost again, then back.
  assert.equal(discover({ states: lose(other, ram), entities }, "ugreen_nas").scalars.ram_usage, undefined);
  assert.equal(discover({ states: { ...other }, entities }, "ugreen_nas").scalars.ram_usage, ram);
});

test("an entity of the registry removed from the states does not break discovery", async () => {
  const { mock, entities } = await regression();
  const { "sensor.ugreen_nas_cpu_usage": _gone, ...rest } = mock;
  const swapped = { ...rest, "light.kitchen": { entity_id: "light.kitchen", state: "on", attributes: {} } };
  discover({ states: mock, entities }, "");
  // Same registry object and same number of states: only the content changed.
  const nas = discover({ states: swapped, entities }, "");
  assert.equal(nas.nasId, "ugreen_nas");
  assert.equal(nas.scalars.cpu_usage, undefined);
});

test("a volume without a label sensor is named after its own number, not the pool number", () => {
  const el = new UgreenNasCard();
  el._config = {};
  el._hass = { states: {}, language: "en" };
  const names = (pools) => [...el._volumes({ pools }).matchAll(/<span class="grow">([^<]*)<\/span>/g)].map((m) => m[1]);
  const pool = (n) => ({ volumes: Object.fromEntries(Array.from({ length: n }, (_, i) => [String(i + 1), {}])), disks: {} });
  assert.deepEqual(names({ 1: pool(2) }), ["Volume 1", "Volume 2"]);
  // With several pools, the volume numbers start again in each pool: the pool number tells them apart.
  assert.deepEqual(names({ 1: pool(2), 2: pool(1) }), ["Volume 1-1", "Volume 1-2", "Volume 2-1"]);
});

// Mini card zoom: a mini card on the mock NAS whose renders are captured instead of patched into a DOM.
const zoomCard = async (config = {}) => {
  const { states } = await import("../scripts/mock-states.mjs");
  const el = new UgreenNasMiniCard();
  el._config = config;
  el._hass = { states, language: "en" };
  el._update = () => {
    el.html = el._render();
  };
  el.shadowRoot.querySelector = () => null;
  el._update();
  return el;
};
const node = (localName) => ({ localName });
const click = (path, extra = {}) => ({ composedPath: () => path, stopPropagation() {}, detail: 1, ...extra });
const zoomButton = () => click([], { target: { closest: (sel) => (sel === ".zoom" ? {} : null) } });

test("the mini card zoom button switches to the full card content and back", async () => {
  const el = await zoomCard();
  const full = new UgreenNasCard();
  full._config = {};
  full._hass = el._hass;
  assert.match(el.html, /class="metric/);
  assert.match(el.html, /<button class="zoom" title="Show the full card">/);
  assert.equal(el.getCardSize(), 3);
  let stopped = false;
  el._zoomClick({ ...zoomButton(), stopPropagation: () => (stopped = true) });
  assert.equal(stopped, true);
  assert.equal(el._zoomed, true);
  // Everything the full card shows: gauges, network, volumes, disks and fans, then the button at the far right.
  for (const cls of ["gauges", "net", "vol clickable", "disks", "fans"]) assert.match(el.html, new RegExp(`class="${cls}`));
  assert.doesNotMatch(el.html, /class="metric/);
  assert.equal(el.html.replace(/<button class="zoom"[\s\S]*?<\/button>/, ""), full._render());
  assert.match(el.html, /<button class="zoom" title="Back to the compact view">/);
  assert.equal(el.getCardSize(), full.getCardSize());
  assert.deepEqual({ ...el.getGridOptions() }, { ...full.getGridOptions() });
  el._zoomClick(zoomButton());
  assert.equal(el._zoomed, false);
  assert.match(el.html, /class="metric/);
  assert.equal(el.getCardSize(), 3);
});

test("a click outside the mini card collapses it, a click inside or in a dialog does not", async () => {
  const el = await zoomCard({ language: "fr" });
  assert.match(el.html, /title="Afficher la carte complète"/);
  el._zoomClick(zoomButton());
  assert.match(el.html, /title="Revenir à la vue compacte"/);
  el._onOutside(click([node("div"), el, node("body")]));
  assert.equal(el._zoomed, true);
  for (const dialog of ["ha-more-info-dialog", "ha-dialog", "dialog"]) {
    el._onOutside(click([node("div"), node(dialog), node("body")]));
    assert.equal(el._zoomed, true, dialog);
  }
  // Other clicks on the card leave it as it is.
  el._zoomClick(click([el], { target: { closest: () => null } }));
  assert.equal(el._zoomed, true);
  el._onOutside(click([node("div"), node("body")]));
  assert.equal(el._zoomed, false);
  assert.match(el.html, /class="metric/);
});

test("zoom: false removes the mini card zoom button, the full card has none", async () => {
  const el = await zoomCard({ zoom: false });
  assert.doesNotMatch(el.html, /class="zoom"/);
  const full = new UgreenNasCard();
  full._config = {};
  full._hass = el._hass;
  assert.doesNotMatch(full._render(), /class="zoom"/);
});

test("the NAS picture follows the model, the image option overrides it", () => {
  const { nasSvg, nasPicture } = load("ugreen-nas-card.js", ["nasSvg", "nasPicture"]);
  const bays = (svg) => (svg.match(/fill="#43c463"/g) || []).length;
  assert.equal(bays(nasSvg("DXP2800")), 2);
  assert.equal(bays(nasSvg("DXP4800 Plus")), 4);
  assert.equal(bays(nasSvg("DXP6800 Pro")), 6);
  assert.equal(bays(nasSvg("dxp8800plus")), 8);
  assert.equal(bays(nasSvg("DXP480T Plus")), 0); // flat all-flash model, no trays
  assert.match(nasSvg("DH4300 Plus"), /#f2f2f0/); // white DH series
  assert.equal(bays(nasSvg(undefined)), 4); // unknown model: 4-bay tower
  assert.equal(nasPicture("https://example.com/nas.png", "DXP2800"), "https://example.com/nas.png");
  assert.equal(decodeURIComponent(nasPicture("DXP8800 Plus", "DXP2800")).split("data:image/svg+xml,")[1], nasSvg("DXP8800 Plus"));
});

test("the status pill sits in the header row; the compact mini card subtitle shows the model only", async () => {
  const el = await zoomCard();
  // Compact view: model only (the UGOS version would be cut off by the NAS picture).
  assert.match(el.html, /<div class="sub"><div class="parts"><span>DXP480T Plus<\/span><\/div><\/div>/);
  el._zoomClick(zoomButton());
  // Zoomed in, like the full card: model and UGOS version, then the status pill right of the title block.
  assert.match(el.html, /<span>DXP480T Plus<\/span><span>UGOS 1\.20\.0\.0142<\/span><\/div><\/div>\s*<\/div>\s*<span class="chip clickable ok"/);
});
