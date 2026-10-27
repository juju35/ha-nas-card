import assert from "node:assert/strict";
import { test } from "node:test";
import { load } from "./load.mjs";

const { volumeUsage, discover, NasCard, NasMiniCard, toBps, fmtRate, STRINGS } = load("nas-card.js", [
  "volumeUsage",
  "discover",
  "NasCard",
  "NasMiniCard",
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
  const el = new NasMiniCard();
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
  for (const Cls of [NasCard, NasMiniCard]) {
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
  const el = new NasCard();
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
  const el = new NasMiniCard();
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
  const el = new NasCard();
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
  const el = new NasMiniCard();
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
  const full = new NasCard();
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
  const full = new NasCard();
  full._config = {};
  full._hass = el._hass;
  assert.doesNotMatch(full._render(), /class="zoom"/);
});

test("the NAS picture follows the model, the image option overrides it", () => {
  const { nasSvg, nasPicture } = load("nas-card.js", ["nasSvg", "nasPicture"]);
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

test("Synology and QNAP models map to their own towers and rackmounts", () => {
  const { nasSvg } = load("nas-card.js", ["nasSvg"]);
  const bays = (svg) => (svg.match(/fill="#43c463"/g) || []).length;
  const rack = (svg) => / 72"/.test(svg.split(">")[0]); // rackmount viewBox is 62 + 10 high
  // Synology: the family decides the bay count, the leading digit alone would be wrong.
  for (const [model, n] of [["DS224+", 2], ["DS423+", 4], ["DS723+", 2], ["DS923+", 4], ["DS925+", 4], ["DS1522+", 5], ["DS1621+", 6], ["DS1821+", 8]]) {
    const svg = nasSvg(model);
    assert.equal(bays(svg), n, model);
    assert.match(svg, /#101113/, model); // black Synology front
    assert.equal(rack(svg), false, model);
  }
  for (const [model, n] of [["RS822+", 4], ["RS1221+", 8]]) {
    assert.equal(rack(nasSvg(model)), true, model);
    assert.equal(bays(nasSvg(model)), n, model);
  }
  // QNAP: the digits before the last two are the bay count; models ending in U are rackmounts.
  for (const [model, n] of [["TS-233", 2], ["TS-264", 2], ["TS-464", 4], ["TS-664", 6], ["TS-873A", 8], ["TVS-h674", 6], ["HS-264", 2]]) {
    const svg = nasSvg(model);
    assert.equal(bays(svg), n, model);
    assert.match(svg, /#c8a46a/, model); // copper strip
    assert.equal(rack(svg), false, model);
  }
  assert.equal(rack(nasSvg("TS-873AeU")), true);
  assert.equal(bays(nasSvg("TS-873AeU")), 8);
  // An unrecognized model string still follows the discovered brand.
  assert.match(nasSvg("", "synology"), /#101113/);
  assert.match(nasSvg("", "qnap"), /#c8a46a/);
});

// Registry integrations: a hass carrying the mock states, entity registry and device registry.
const registryHass = async (brand) => {
  const { mocks } = await import("../scripts/mock-states.mjs");
  return { ...mocks[brand], language: "en" };
};

test("Synology DSM discovery: scalars, security status, volumes and disks from the device registry", async () => {
  const hass = await registryHass("synology");
  const nas = discover(hass, "");
  assert.equal(nas.brand, "synology");
  assert.equal(nas.nasId, "syno_nas");
  assert.deepEqual({ ...nas.info }, { name: "diskstation", model: "DS923+", version: "DSM 7.2.2-72806 Update 3" });
  assert.equal(nas.scalars.cpu_usage, "sensor.diskstation_cpu_utilization_total");
  assert.equal(nas.scalars.ram_usage, "sensor.diskstation_memory_usage_real");
  assert.equal(nas.scalars.sys_temp, "sensor.diskstation_temperature");
  assert.equal(nas.scalars.lan_down, "sensor.diskstation_download_throughput");
  assert.equal(nas.scalars.server_status, "binary_sensor.diskstation_security_status");
  assert.equal(nas.scalars.boot, "sensor.diskstation_last_boot"); // no translation_key, found by device_class
  const vols = Object.values(nas.pools[1].volumes);
  assert.equal(vols.length, 1);
  assert.equal(vols[0].labelText, "Volume 1");
  const u = volumeUsage(hass, vols[0]);
  assert.equal(u.used, 6.62 * 1024 ** 4);
  assert.equal(Math.round(u.pct * 10) / 10, 63.1); // the direct percentage completes the missing total
  const disks = Object.values(nas.pools[1].disks);
  assert.equal(disks.length, 4);
  assert.equal(disks[0].labelText, "Drive 1");
  assert.equal(disks[0].modelText, "WD40EFPX-68C6CN0");
  assert.equal(disks[0].temperature, "sensor.diskstation_drive_1_temperature");
});

test("QNAP discovery: one device, volumes and drives joined on the insert of their names", async () => {
  const hass = await registryHass("qnap");
  const nas = discover(hass, "");
  assert.equal(nas.brand, "qnap");
  assert.equal(nas.scalars.cpu_temp, "sensor.qnap_nas_cpu_temperature");
  assert.equal(nas.scalars.sys_temp, "sensor.qnap_nas_system_temperature");
  assert.equal(nas.scalars.server_status, "sensor.qnap_nas_status");
  assert.equal(nas.scalars.lan_down, "sensor.qnap_nas_eth0_download");
  assert.equal(nas.scalars.boot, "sensor.qnap_nas_uptime");
  const vols = nas.pools[1].volumes;
  assert.deepEqual(Object.keys(vols), ["DataVol1"]);
  assert.equal(vols.DataVol1.labelText, "DataVol1");
  assert.equal(vols.DataVol1.used_size, "sensor.qnap_nas_used_space_datavol1");
  const u = volumeUsage(hass, vols.DataVol1);
  assert.equal(Math.round(u.pct * 10) / 10, 71.2);
  assert.ok(u.total > u.used); // total completed from the percentage
  const disks = nas.pools[1].disks;
  assert.deepEqual(Object.keys(disks), ["0:1", "0:2"]);
  assert.equal(disks["0:1"].temperature, "sensor.qnap_nas_drive_0_1_temperature");
  assert.equal(disks["0:1"].status, "sensor.qnap_nas_drive_0_1_status");
});

test("both new brands render without warnings; Synology translates its safety binary status", async () => {
  for (const brand of ["synology", "qnap"]) {
    const hass = await registryHass(brand);
    for (const Cls of [NasCard, NasMiniCard]) {
      const el = new Cls();
      el._config = {};
      el._hass = hass;
      const html = el._render();
      assert.doesNotMatch(html, /class="warning"/, brand);
      assert.match(html, /class="chip clickable ok"|data-key="status"/, brand);
    }
  }
  const el = new NasCard();
  el._hass = { states: {}, language: "en" };
  el._config = {};
  assert.equal(el._statusText({ state: "off" }, "synology"), "Normal");
  assert.equal(el._statusText({ state: "on" }, "synology"), "Warning");
  assert.equal(el._statusText({ state: "good" }, "qnap"), "Normal");
});

test("a configured nas picks its own integration, the UGREEN NAS keeps priority by default", async () => {
  const { mocks } = await import("../scripts/mock-states.mjs");
  const hass = {
    states: { ...mocks.ugreen.states, ...mocks.synology.states },
    entities: { ...Object.fromEntries(Object.keys(mocks.ugreen.states).map((id) => [id, { platform: "ugreen" }])), ...mocks.synology.entities },
    devices: mocks.synology.devices,
    language: "en",
  };
  assert.equal(discover(hass, "").brand, "ugreen");
  assert.equal(discover(hass, "syno_nas").brand, "synology");
  assert.equal(discover(hass, "ugreen_nas").brand, "ugreen");
});

test("the cards register as nas-card and nas-mini-card, the former ugreen-* types stay as aliases", () => {
  const { customElements, NasCard, NasMiniCard, window } = load("nas-card.js", ["customElements", "NasCard", "NasMiniCard", "window"]);
  assert.equal(customElements.get("nas-card"), NasCard);
  assert.equal(customElements.get("nas-mini-card"), NasMiniCard);
  assert.ok(customElements.get("ugreen-nas-card").prototype instanceof NasCard);
  assert.ok(customElements.get("ugreen-nas-mini-card").prototype instanceof NasMiniCard);
  assert.ok(customElements.get("nas-card-editor") && customElements.get("nas-mini-card-editor"));
  assert.deepEqual([...window.customCards.map((c) => c.type)], ["nas-card", "nas-mini-card"]);
});

test("the status pill sits in the header row; the compact mini card subtitle shows the model only", async () => {
  const el = await zoomCard();
  // Compact view: model only (the UGOS version would be cut off by the NAS picture).
  assert.match(el.html, /<div class="sub"><div class="parts"><span>DXP480T Plus<\/span><\/div><\/div>/);
  el._zoomClick(zoomButton());
  // Zoomed in, like the full card: model and UGOS version, then the status pill in the title block (right of the title line).
  assert.match(el.html, /<span>DXP480T Plus<\/span><span>UGOS 1\.20\.0\.0142<\/span><\/div><\/div>\s*<span class="chip clickable ok"/);
});

test("the editor lists the pictures sorted by brand, then by model, with the brand as prefix", () => {
  const { modelOptions, NAS_MODELS } = load("nas-card.js", ["modelOptions", "NAS_MODELS"]);
  const options = [...modelOptions()];
  assert.equal(options.length, Object.values(NAS_MODELS).flat().length);
  const brands = [...options.map((o) => o.label.split(" ")[0])];
  assert.deepEqual([...new Set(brands)], ["QNAP", "Synology", "UGREEN"]);
  // Brands are contiguous blocks, in alphabetical order.
  assert.deepEqual(brands, [...brands].sort());
  // Natural order inside a brand (DS224+ before DS1522+), the value stays the bare model name.
  const syno = options.filter((o) => o.label.startsWith("Synology ")).map((o) => o.value);
  assert.ok(syno.indexOf("DS224+") < syno.indexOf("DS1522+"));
  assert.deepEqual({ ...options.find((o) => o.value === "DXP4800 Plus") }, { value: "DXP4800 Plus", label: "UGREEN DXP4800 Plus" });
});
