import assert from "node:assert/strict";
import { test } from "node:test";
import { load } from "./load.mjs";

const { volumeUsage, discover, NasCard, NasMiniCard, toBps, fmtRate, toBytes, fmtBytes, STRINGS } = load("nas-card.js", [
  "volumeUsage",
  "discover",
  "NasCard",
  "NasMiniCard",
  "toBps",
  "fmtRate",
  "toBytes",
  "fmtBytes",
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
    // A freshly loaded card (startup): no mapping seen yet to fall back on while the NAS is offline.
    const { discover } = load("nas-card.js", ["discover"]);
    assert.equal(discover({ entities, states: { [cpu]: bare(cpu), [ram]: bare(ram) } }, "").nasId, null);
    const partial = discover({ entities, states: { [cpu]: s(cpu, 10, "%"), [ram]: bare(ram) } }, "");
    assert.equal(partial.nasId, "nas");
    const full = discover({ entities, states: { [cpu]: s(cpu, 10, "%"), [ram]: s(ram, 30, "%") } }, "");
    assert.equal(full.scalars.cpu_usage, cpu);
    assert.equal(full.scalars.ram_usage, ram);
  }
});

test("a registry without UGREEN entities leaves nothing to discover, an empty registry falls back to the states", () => {
  const id = "sensor.syno_cpu";
  const states = { [id]: s(id, 10, "%") };
  // Non-empty registry, no UGREEN platform: the states are not scanned (no fallback on each state change).
  assert.equal(discover({ entities: { [id]: { platform: "synology_dsm" } }, states }, "").nasId, null);
  // Empty registry object: the fallback scan of the states still applies.
  assert.equal(discover({ entities: {}, states }, "").nasId, "nas");
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

test("data sizes follow Home Assistant: kB/MB/GB/TB decimal, KiB/MiB/GiB/TiB binary", () => {
  assert.equal(toBytes(s("sensor.v", 2, "kB")), 2000);
  assert.equal(toBytes(s("sensor.v", 2, "GB")), 2e9);
  assert.equal(toBytes(s("sensor.v", 6.62, "TB")), 6.62e12);
  assert.equal(toBytes(s("sensor.v", 1, "KiB")), 1024);
  assert.equal(toBytes(s("sensor.v", 1, "GiB")), 1024 ** 3);
  assert.equal(toBytes(s("sensor.v", 1, "TiB")), 1024 ** 4);
  assert.equal(toBytes(s("sensor.v", 5)), 5);
  // A sensor in GB or TB reads the same on the card as in Home Assistant.
  assert.equal(fmtBytes(toBytes(s("sensor.v", 6.62, "TB"))), "6.62 TB");
  assert.equal(fmtBytes(toBytes(s("sensor.v", 1000, "GB"))), "1 TB");
  assert.equal(fmtBytes(toBytes(s("sensor.v", 1, "GiB"))), "1.07 GB");
  assert.equal(fmtBytes(1500), "1.5 kB");
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
  // Seen online before: the last mapping is kept while offline (values unavailable, no warning).
  assert.equal(discover({ states: offline, entities }, "").nasId, "ugreen_nas");
  const el = new NasMiniCard();
  el._config = {};
  el._hass = { states: offline, entities, language: "en" };
  assert.doesNotMatch(el._render(), /class="warning"/);
  // Never seen online (fresh page): the warning.
  const fresh = load("nas-card.js", ["NasMiniCard"]);
  const cold = new fresh.NasMiniCard();
  cold._config = {};
  cold._hass = { states: offline, entities, language: "en" };
  assert.match(cold._render(), /class="warning"/);
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
  assert.deepEqual({ ...nas.info }, { name: "diskstation", model: "DS923+", version: "DSM 7.2.2-72806 Update 3", url: "https://192.168.1.20:5001" });
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
  assert.equal(u.used, 6.62e12);
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

test("the logo opens the brand website and the picture the NAS interface, both configurable", async () => {
  const { mocks } = await import("../scripts/mock-states.mjs");
  const render = (hass, config = {}) => {
    const el = new NasCard();
    el._config = config;
    el._hass = { ...hass, language: "en" };
    return el._render();
  };
  const href = (html, cls) => (html.match(new RegExp(`<a class="${cls}" href="([^"]*)"`)) || [])[1] ?? null;
  // Brand websites by default, the brand_url option replaces them.
  assert.equal(href(render(mocks.ugreen), "brand-link"), "https://nas.ugreen.com");
  assert.equal(href(render(mocks.synology), "brand-link"), "https://www.synology.com");
  assert.equal(href(render(mocks.qnap), "brand-link"), "https://www.qnap.com");
  assert.equal(href(render(mocks.qnap, { brand_url: "https://example.com/qnap" }), "brand-link"), "https://example.com/qnap");
  // NAS interface: the configuration_url of the NAS device (Synology here), none for QNAP unless set.
  assert.equal(href(render(mocks.synology), "nas-link"), "https://192.168.1.20:5001");
  assert.equal(href(render(mocks.qnap), "nas-link"), null);
  assert.equal(href(render(mocks.qnap, { url: "http://192.168.1.30:8080" }), "nas-link"), "http://192.168.1.30:8080");
  assert.equal(href(render(mocks.synology, { url: "https://nas.example.com" }), "nas-link"), "https://nas.example.com");
  // UGREEN: found through an entity's device, up to the root device (pools are child devices).
  const ids = Object.keys(mocks.ugreen.states);
  const ugreen = {
    states: mocks.ugreen.states,
    entities: Object.fromEntries(ids.map((id) => [id, { entity_id: id, platform: "ugreen", device_id: id.includes("pool_") ? "pool" : "root" }])),
    devices: { root: { id: "root", configuration_url: "http://192.168.1.253:9999" }, pool: { id: "pool", via_device_id: "root" } },
  };
  assert.equal(href(render(ugreen), "nas-link"), "http://192.168.1.253:9999");
  // Only web addresses become links; links open in a new tab.
  const odd = render(mocks.qnap, { url: "javascript:alert(1)" });
  assert.equal(href(odd, "nas-link"), null);
  assert.match(render(mocks.synology), /<a class="nas-link" href="[^"]*" target="_blank" rel="noopener noreferrer"/);
  // show_image: false drops the picture and its link.
  assert.equal(href(render(mocks.synology, { show_image: false }), "nas-link"), null);
});

test("the visual editor offers the url and brand_url options after the picture", () => {
  const { NasCardEditor } = load("nas-card.js", ["NasCardEditor"]);
  const ed = new NasCardEditor();
  ed._hass = { states: {}, language: "en" };
  ed._config = {};
  const names = [...ed._schema().map((f) => f.name)];
  assert.deepEqual(names.slice(names.indexOf("image"), names.indexOf("image") + 3), ["image", "url", "brand_url"]);
});

test("I18N parity: every language has exactly the English keys and placeholders", () => {
  const keys = Object.keys(STRINGS.en).sort();
  assert.deepEqual(Object.keys(STRINGS).sort(), ["de", "en", "es", "fr"]);
  for (const [l, strings] of Object.entries(STRINGS)) {
    assert.deepEqual(Object.keys(strings).sort(), keys, l);
    for (const k of keys) {
      const ph = (s) => [...String(s).matchAll(/\{\w+\}/g)].map((m) => m[0]).sort();
      assert.deepEqual(ph(strings[k]), ph(STRINGS.en[k]), `${l}.${k}`);
    }
  }
});

test("the editor offers German and Spanish, and de/es locales resolve to their strings", () => {
  const { NasCardEditor } = load("nas-card.js", ["NasCardEditor"]);
  const ed = new NasCardEditor();
  ed._hass = { states: {}, language: "en" };
  ed._config = {};
  const language = ed._schema().find((f) => f.name === "language");
  assert.deepEqual(
    [...language.selector.select.options.map((o) => o.value)],
    ["", "en", "fr", "de", "es"],
  );
  const el = new NasCard();
  for (const [hl, l] of [["de-DE", "de"], ["es", "es"], ["it", "en"]]) {
    el._hass = { states: {}, language: hl };
    el._config = {};
    assert.equal(el._t("network"), STRINGS[l].network);
  }
});

test("volume and disk keys built from free-text QNAP names are escaped in the data-key attribute", () => {
  const el = new NasCard();
  el._config = {};
  el._hass = { states: {}, language: "en" };
  const nas = { pools: { 1: { volumes: { 'My "Vol"': { labelText: 'My "Vol"' } }, disks: { 'a"b': { labelText: "Disk" } } } } };
  assert.match(el._volumes(nas), /data-key="1-My &quot;Vol&quot;"/);
  assert.doesNotMatch(el._volumes(nas), /data-key="1-My "/);
  assert.match(el._disks(nas), /data-key="1-a&quot;b"/);
});

test("the RAM label keeps the unit of the used figure when it differs from the total's", () => {
  const el = new NasCard();
  el._config = {};
  const st = (entity_id, state, unit) => ({ entity_id, state: String(state), attributes: { unit_of_measurement: unit } });
  const run = (used) => {
    el._hass = { states: { "sensor.ram_used": st("sensor.ram_used", used, "MB"), "sensor.ram_total": st("sensor.ram_total", 2000, "MB") }, language: "en" };
    return el._system({ scalars: { ram_used: "sensor.ram_used", ram_total: "sensor.ram_total" } });
  };
  assert.match(run(800), /RAM · 800 MB \/ 2 GB/);
  assert.match(run(1500), /RAM · 1\.5 \/ 2 GB/);
});

test("a network tile without its sensor is neither focusable nor clickable", () => {
  const el = new NasCard();
  el._config = {};
  el._hass = { states: { "sensor.rx": { entity_id: "sensor.rx", state: "1", attributes: { unit_of_measurement: "MB/s" } } }, language: "en" };
  const html = el._network({ scalars: { lan_down: "sensor.rx" } });
  assert.equal((html.match(/role="button"/g) || []).length, 1);
  assert.doesNotMatch(html, /data-entity=""/);
});

test("the mini card network footer opens the upload sensor when there is no download sensor", async () => {
  const hass = await registryHass("qnap");
  const { lan_down: down, lan_up: up } = discover(hass, "").scalars;
  assert.ok(down && up, "the QNAP mock has both rate sensors");
  const states = { ...hass.states };
  const entities = { ...hass.entities };
  delete states[down];
  delete entities[down];
  const mini = new NasMiniCard();
  mini._config = {};
  mini._hass = { ...hass, states, entities };
  assert.equal(discover(mini._hass, "").scalars.lan_down, undefined);
  const html = mini._render();
  assert.match(html, new RegExp(`data-key="network" data-entity="${up.replace(/\./g, "\\.")}"`));
});

// Two NAS of the same integration whose registry order differs from the sorted order the cards use.
const twoNas = () => ({
  synology: {
    states: {
      "sensor.office_cpu": { entity_id: "sensor.office_cpu", state: "10", attributes: {} },
      "sensor.backup_cpu": { entity_id: "sensor.backup_cpu", state: "20", attributes: {} },
    },
    entities: {
      "sensor.office_cpu": { platform: "synology_dsm", device_id: "ffff", translation_key: "cpu_total_load" },
      "sensor.backup_cpu": { platform: "synology_dsm", device_id: "0000", translation_key: "cpu_total_load" },
    },
    devices: { ffff: { id: "ffff", name: "Office NAS" }, "0000": { id: "0000", name: "Backup NAS" } },
    language: "en",
  },
  ugreen: {
    states: {
      "sensor.z_nas_cpu_usage": { entity_id: "sensor.z_nas_cpu_usage", state: "10", attributes: { UGNAS_device_id: "Z" } },
      "sensor.a_nas_cpu_usage": { entity_id: "sensor.a_nas_cpu_usage", state: "20", attributes: { UGNAS_device_id: "A" } },
    },
    entities: {
      "sensor.z_nas_cpu_usage": { platform: "ugreen" },
      "sensor.a_nas_cpu_usage": { platform: "ugreen" },
    },
    language: "en",
  },
});

test("without nas, the editor and the stub config pick the NAS the card shows", () => {
  for (const [brand, hass] of Object.entries(twoNas())) {
    const m = load("nas-card.js", ["discover", "NasCard", "NasCardEditor", "NasMiniCardEditor"]);
    const shown = m.discover(hass, "").nasId;
    assert.equal(shown, brand === "ugreen" ? "A" : "0000");
    assert.equal(m.NasCard.getStubConfig(hass).nas, shown, brand);
    for (const Editor of [m.NasCardEditor, m.NasMiniCardEditor]) {
      const ed = new Editor();
      ed._hass = hass;
      ed._config = {};
      ed._render();
      assert.equal(ed._form.data.nas, shown, brand);
      // The NAS list starts with that NAS too.
      assert.equal(ed._schema()[0].selector.select.options[0].value, shown, brand);
    }
  }
});

test("without any NAS, the editor leaves nas empty", () => {
  const { NasCardEditor, NasCard: Card } = load("nas-card.js", ["NasCardEditor", "NasCard"]);
  const ed = new NasCardEditor();
  ed._hass = { states: {}, entities: {}, devices: {}, language: "en" };
  ed._config = {};
  ed._render();
  assert.equal(ed._form.data.nas, undefined);
  assert.deepEqual({ ...Card.getStubConfig(ed._hass) }, {});
});

// The UGREEN coordinator failing (NAS rebooting or unreachable) leaves every entity unavailable
// without its UGNAS_device_id attribute.
const ugreenOffline = async () => {
  const { states: mock } = await import("../scripts/mock-states.mjs");
  const entities = Object.fromEntries(Object.keys(mock).map((id) => [id, { entity_id: id, platform: "ugreen" }]));
  const offline = Object.fromEntries(
    Object.keys(mock).map((id) => [id, { entity_id: id, state: "unavailable", attributes: { friendly_name: "x", restored: true } }])
  );
  return { mock, entities, offline };
};

test("an offline UGREEN NAS keeps its card with unavailable values instead of a setup warning", async () => {
  const { mock, entities, offline } = await ugreenOffline();
  for (const nas of ["ugreen_nas", ""]) {
    const m = load("nas-card.js", ["discover", "NasCard", "NasMiniCard"]);
    const online = m.discover({ states: mock, entities }, nas);
    assert.equal(online.nasId, "ugreen_nas");
    const down = m.discover({ states: offline, entities }, nas);
    assert.equal(down.nasId, "ugreen_nas", `nas: "${nas}"`);
    assert.equal(down.scalars.cpu_usage, online.scalars.cpu_usage);
    for (const Card of [m.NasCard, m.NasMiniCard]) {
      const el = new Card();
      el._config = nas ? { nas } : {};
      el._hass = { states: offline, entities, language: "en" };
      const html = el._render();
      assert.doesNotMatch(html, /class="warning"/, `${Card.name} nas: "${nas}"`);
      assert.match(html, /—/);
    }
    // Back online: the live mapping again.
    assert.equal(m.discover({ states: { ...mock }, entities }, nas).nasId, "ugreen_nas");
  }
});

test("an offline UGREEN NAS never seen online, removed from the registry or another nas still warns", async () => {
  const { mock, entities, offline } = await ugreenOffline();
  const m = load("nas-card.js", ["discover"]);
  // Never seen since the page loaded: nothing to fall back on.
  assert.equal(m.discover({ states: offline, entities }, "ugreen_nas").nasId, null);
  m.discover({ states: mock, entities }, "ugreen_nas");
  // A NAS id that was never mapped.
  assert.equal(m.discover({ states: offline, entities }, "other_nas").nasId, null);
  // Integration removed: its entities left the registry and the states.
  assert.equal(m.discover({ states: {}, entities: {} }, "ugreen_nas").nasId, null);
  // Entities still there but moved to another platform in a new registry.
  const moved = Object.fromEntries(Object.keys(entities).map((id) => [id, { entity_id: id, platform: "other" }]));
  assert.equal(m.discover({ states: offline, entities: moved }, "ugreen_nas").nasId, null);
});

test("with two UGREEN NAS, the offline one keeps its card and the other its own", async () => {
  const { mock, entities, offline } = await ugreenOffline();
  const m = load("nas-card.js", ["discover"]);
  // A second NAS online, with its own entities.
  const other = { "sensor.b_nas_cpu_usage": { entity_id: "sensor.b_nas_cpu_usage", state: "5", attributes: { UGNAS_device_id: "B" } } };
  const allEntities = { ...entities, "sensor.b_nas_cpu_usage": { platform: "ugreen" } };
  m.discover({ states: { ...mock, ...other }, entities: allEntities }, "ugreen_nas");
  const hass = { states: { ...offline, ...other }, entities: allEntities };
  assert.equal(m.discover(hass, "ugreen_nas").nasId, "ugreen_nas");
  assert.equal(m.discover(hass, "B").scalars.cpu_usage, "sensor.b_nas_cpu_usage");
  // A sensor of the offline NAS deleted meanwhile does not prevent the fallback.
  const { "sensor.ugreen_nas_cpu_fan": _fan, ...rest } = hass.states;
  const { "sensor.ugreen_nas_cpu_fan": _fe, ...restEntities } = allEntities;
  assert.equal(m.discover({ states: rest, entities: restEntities }, "ugreen_nas").nasId, "ugreen_nas");
});

// Texts shown by the card, outside the status chip: title, subtitle, CPU model, volume and disk labels.
const shownTexts = (html) => {
  const out = [];
  for (const re of [/class="name">([^<]*)</g, /class="sub"><div class="parts">(.*?)<\/div>/g, /class="grow">([^<]*)</g, /class="top">.*?<span>([^<]*)</g, /class="tag">([^<]*)</g, /class="model">([^<]*)</g]) {
    for (const m of html.matchAll(re)) out.push(m[1]);
  }
  const facts = html.match(/class="facts">([\s\S]*?)<\/div>/);
  if (facts) out.push(facts[1]);
  return out.join("\n");
};

test("an offline UGREEN NAS keeps its last known name, model and labels instead of showing unavailable", async () => {
  const { mock, entities, offline } = await ugreenOffline();
  for (const Card of ["NasCard", "NasMiniCard"]) {
    const m = load("nas-card.js", ["NasCard", "NasMiniCard"]);
    const el = new m[Card]();
    el._config = {};
    el._hass = { states: mock, entities, language: "en" };
    const live = el._render();
    assert.match(live, /class="name">ugreen-nas</);
    el._hass = { states: offline, entities, language: "en" };
    const html = el._render();
    assert.doesNotMatch(shownTexts(html), /unavailable/, Card);
    assert.match(html, /class="name">ugreen-nas</, Card);
    assert.match(html, /<span>DXP480T Plus<\/span>/, Card);
    // The picture of the model, not the generic fallback.
    assert.equal(html.match(/<img class="nas" src="([^"]*)"/)?.[1], live.match(/<img class="nas" src="([^"]*)"/)?.[1], Card);
  }
});

test("an offline UGREEN NAS whose texts were never shown falls back to generic names, never unavailable", async () => {
  const { mock, entities, offline } = await ugreenOffline();
  const m = load("nas-card.js", ["discover", "NasCard", "NasMiniCard"]);
  // Mapped online (e.g. by the editor) but never rendered before going offline.
  m.discover({ states: mock, entities }, "");
  for (const Card of [m.NasCard, m.NasMiniCard]) {
    const el = new Card();
    el._config = {};
    el._hass = { states: offline, entities, language: "en" };
    const html = el._render();
    assert.doesNotMatch(html, /class="warning"/);
    assert.doesNotMatch(shownTexts(html), /unavailable/, Card.name);
    assert.match(html, /class="name">UGREEN NAS</, Card.name);
  }
});
