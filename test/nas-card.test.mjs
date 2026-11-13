import assert from "node:assert/strict";
import { test } from "node:test";
import { load } from "./load.mjs";

const { volumeUsage, discover, NasCard, NasMiniCard, NasCardEditor, toBps, fmtRate, toBytes, fmtBytes, STRINGS, spark, histPoints, pruneThresholds, window } = load("nas-card.js", [
  "volumeUsage",
  "discover",
  "NasCard",
  "NasMiniCard",
  "NasCardEditor",
  "toBps",
  "fmtRate",
  "toBytes",
  "fmtBytes",
  "STRINGS",
  "spark",
  "histPoints",
  "pruneThresholds",
  "window",
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
  // The first entity carrying UGNAS_device_id (the reboot button, a button, has none).
  const first = Object.keys(mock).filter((id) => id.startsWith("sensor.")).sort()[0];
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

// Synology's "temperature" and "disk_temp" sensors carry no translation_key (#58): the card tells
// them by their temperature device class, or by their default object id while the state is missing
// (restored at startup) or renamed by the user.
test("Synology temperatures without translation_key: found by device class, or by id without a state", async () => {
  const base = await registryHass("synology");
  for (const [id, e] of Object.entries(base.entities)) assert.notEqual(e.translation_key, "disk_temp", id);
  assert.equal(base.entities["sensor.diskstation_temperature"].translation_key, undefined);
  const m = load("nas-card.js", ["discover"]);
  const nas = m.discover(base, "");
  assert.equal(nas.scalars.sys_temp, "sensor.diskstation_temperature");
  assert.deepEqual(
    Object.values(nas.pools[1].disks).map((d) => d.temperature),
    [1, 2, 3, 4].map((n) => `sensor.diskstation_drive_${n}_temperature`)
  );
  // No state loaded yet: the default object ids still tell the sensors apart.
  const noState = { ...base, states: {} };
  const cold = load("nas-card.js", ["discover"]).discover(noState, "");
  assert.equal(cold.scalars.sys_temp, "sensor.diskstation_temperature");
  assert.equal(Object.values(cold.pools[1].disks)[0].temperature, "sensor.diskstation_drive_1_temperature");
  // Renamed entity with a loaded state: the device class decides, and a volume device never gets a disk slot.
  const renamed = { ...base, states: { ...base.states }, entities: { ...base.entities } };
  renamed.states["sensor.nas_box_heat"] = { entity_id: "sensor.nas_box_heat", state: "44", attributes: { device_class: "temperature" } };
  renamed.entities["sensor.nas_box_heat"] = { entity_id: "sensor.nas_box_heat", platform: "synology_dsm", device_id: "syno_nas" };
  delete renamed.states["sensor.diskstation_temperature"];
  delete renamed.entities["sensor.diskstation_temperature"];
  const r = load("nas-card.js", ["discover"]).discover(renamed, "");
  assert.equal(r.scalars.sys_temp, "sensor.nas_box_heat");
  assert.equal(Object.keys(r.pools[1].volumes).length, 1);
  assert.equal(Object.keys(r.pools[1].disks).length, 4);
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
  assert.deepEqual([...new Set(brands)], ["ASUSTOR", "QNAP", "Synology", "UGREEN"]);
  // Brands are contiguous blocks, in alphabetical order.
  assert.deepEqual(brands, [...brands].sort());
  // Natural order inside a brand (DS224+ before DS1522+), the value stays the bare model name.
  const syno = options.filter((o) => o.label.startsWith("Synology ")).map((o) => o.value);
  assert.ok(syno.indexOf("DS224+") < syno.indexOf("DS1522+"));
  assert.deepEqual({ ...options.find((o) => o.value === "DXP4800 Plus") }, { value: "DXP4800 Plus", label: "UGREEN DXP4800 Plus" });
});

test("the header icon opens the brand website and the picture the NAS interface, both configurable", async () => {
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
  assert.deepEqual(Object.keys(STRINGS).sort(), ["bg", "cs", "da", "de", "el", "en", "es", "fr", "hu", "it", "lv", "nl", "pl", "pt", "ro", "ru", "sk", "sl", "sr", "sr-Latn", "sv", "uk"]);
  for (const [l, strings] of Object.entries(STRINGS)) {
    assert.deepEqual(Object.keys(strings).sort(), keys, l);
    for (const k of keys) {
      const ph = (s) => [...String(s).matchAll(/\{\w+\}/g)].map((m) => m[0]).sort();
      assert.deepEqual(ph(strings[k]), ph(STRINGS.en[k]), `${l}.${k}`);
      assert.equal(typeof strings[k], typeof STRINGS.en[k], `${l}.${k}`);
      if (Array.isArray(STRINGS.en[k])) assert.equal(strings[k].length, STRINGS.en[k].length, `${l}.${k}`);
      assert.notEqual(String(strings[k]).trim(), "", `${l}.${k} is empty`);
    }
  }
});

test("Serbian: no Latin letters in sr outside names, brands and units, no Cyrillic in sr-Latn", () => {
  // Proper names, brands, acronyms, units and the example URL stay in Latin script in both variants.
  const allowed =
    /\{\w+\}|https?:\/\/\S+|Home Assistant|UGREEN|Synology|QNAP|ASUSTOR|DSM|NAS|CPU|RAM|URL|\b(?:h|d|min)\b/g;
  for (const [k, v] of Object.entries(STRINGS.sr)) {
    assert.doesNotMatch(String(v).replace(allowed, ""), /[A-Za-z]/, `sr.${k}: ${v}`);
  }
  for (const [k, v] of Object.entries(STRINGS["sr-Latn"])) {
    assert.doesNotMatch(String(v), /[\u0400-\u04FF]/, `sr-Latn.${k}: ${v}`);
  }
});

test("language resolution: full code first, then the part before the dash, then English", () => {
  const el = new NasCard();
  for (const [hl, l] of [["fr-FR", "fr"], ["sr-Latn", "sr-Latn"], ["sr", "sr"], ["pt-BR", "pt"], ["ja", "en"]]) {
    for (const hass of [{ language: hl }, { locale: { language: hl }, language: "en" }]) {
      el._hass = { states: {}, ...hass };
      el._config = {};
      assert.equal(el._t("network"), STRINGS[l].network, hl);
    }
    // config.language keeps priority over the Home Assistant language.
    el._hass = { states: {}, language: "de" };
    el._config = { language: hl };
    assert.equal(el._t("network"), STRINGS[l].network, `config ${hl}`);
  }
  // Italian, Dutch, European Portuguese and Polish: regional variants fall back to the base language,
  // pt-BR to European Portuguese, and an unsupported language to English.
  for (const [hl, l] of [["it-IT", "it"], ["nl-BE", "nl"], ["pt", "pt"], ["pt-BR", "pt"], ["pl-PL", "pl"], ["sr-Latn", "sr-Latn"], ["ja", "en"]]) {
    el._hass = { states: {}, language: hl };
    el._config = {};
    assert.equal(el._t("network"), STRINGS[l].network, hl);
  }
  // Romanian, Danish, Swedish, Bulgarian, Russian, Ukrainian, Hungarian, Slovak, Czech, Slovenian, Latvian
  // and Greek: the bare code and its regional variant resolve to the language.
  for (const [hl, l] of [["ro-RO", "ro"], ["da-DK", "da"], ["sv-SE", "sv"], ["bg", "bg"], ["ru-RU", "ru"], ["uk-UA", "uk"], ["hu", "hu"], ["sk", "sk"], ["cs-CZ", "cs"], ["sl", "sl"], ["lv", "lv"], ["el-GR", "el"]]) {
    el._hass = { states: {}, language: hl };
    el._config = {};
    assert.equal(el._t("network"), STRINGS[l].network, hl);
  }
  // Numbers formatted with the sr-Latn locale stay in Latin script.
  assert.doesNotMatch((12345).toLocaleString("sr-Latn"), /[\u0400-\u04FF]/);
});

test("the editor offers every supported language with its native name, and locales resolve to their strings", () => {
  const { NasCardEditor } = load("nas-card.js", ["NasCardEditor"]);
  const ed = new NasCardEditor();
  ed._hass = { states: {}, language: "en" };
  ed._config = {};
  const language = ed._schema().find((f) => f.name === "language");
  assert.deepEqual(
    [...language.selector.select.options.map((o) => o.value)],
    ["", "en", "fr", "de", "es", "sr", "sr-Latn", "it", "nl", "pt", "pl", "ro", "da", "sv", "bg", "ru", "uk", "hu", "sk", "cs", "sl", "lv", "el"],
  );
  const labels = Object.fromEntries(language.selector.select.options.map((o) => [o.value, o.label]));
  assert.equal(labels.sr, "Српски");
  assert.equal(labels["sr-Latn"], "Srpski (latinica)");
  assert.equal(labels.it, "Italiano");
  assert.equal(labels.nl, "Nederlands");
  assert.equal(labels.pt, "Português (Portugal)");
  assert.equal(labels.pl, "Polski");
  assert.equal(labels.ro, "Română");
  assert.equal(labels.da, "Dansk");
  assert.equal(labels.sv, "Svenska");
  assert.equal(labels.bg, "Български");
  assert.equal(labels.ru, "Русский");
  assert.equal(labels.uk, "Українська");
  assert.equal(labels.hu, "Magyar");
  assert.equal(labels.sk, "Slovenčina");
  assert.equal(labels.cs, "Čeština");
  assert.equal(labels.sl, "Slovenščina");
  assert.equal(labels.lv, "Latviešu");
  assert.equal(labels.el, "Ελληνικά");
  const el = new NasCard();
  for (const [hl, l] of [["de-DE", "de"], ["es", "es"], ["it", "it"], ["nl", "nl"], ["pt-PT", "pt"], ["pl", "pl"], ["ru", "ru"], ["el", "el"], ["ja", "en"]]) {
    el._hass = { states: {}, language: hl };
    el._config = {};
    assert.equal(el._t("network"), STRINGS[l].network);
  }
});

test("Intl formatting uses pt-PT for Home Assistant's pt, keeps pt-BR, and honours the language option", () => {
  const { fmtLang } = load("nas-card.js", ["fmtLang"]);
  assert.equal(fmtLang({ language: "pt" }, {}), "pt-PT");
  assert.equal(fmtLang({ locale: { language: "pt" }, language: "pt" }, {}), "pt-PT");
  assert.equal(fmtLang({ language: "pt-BR" }, {}), "pt-BR");
  assert.equal(fmtLang({ language: "de-CH" }, {}), "de-CH");
  assert.equal(fmtLang({ language: "ja" }, {}), "en");
  assert.equal(fmtLang({ language: "sr-Latn" }, {}), "sr-Latn");
  // The card's language option keeps priority over Home Assistant's locale.
  assert.equal(fmtLang({ language: "en" }, { language: "pt" }), "pt-PT");
  assert.equal(fmtLang({ language: "pt" }, { language: "de" }), "de");
  assert.equal(fmtLang({ language: "pt-BR" }, { language: "fr" }), "fr");
  assert.equal((1234567).toLocaleString(fmtLang({ language: "pt" }, {})), (1234567).toLocaleString("pt-PT"));
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
  // Without the 24 h curves, the rates stay in the footer.
  mini._config = { show_history: false };
  mini._hass = { ...hass, states, entities };
  assert.equal(discover(mini._hass, "").scalars.lan_down, undefined);
  const html = mini._render();
  assert.match(html, new RegExp(`data-key="network" data-entity="${up.replace(/\./g, "\\.")}"`));
  // With them, the upload tile opens the upload sensor and the download tile, without a sensor, opens nothing.
  mini._config = {};
  const tiles = mini._render();
  assert.match(tiles, new RegExp(`class="tile clickable up" role="button" tabindex="0" data-entity="${up.replace(/\./g, "\\.")}"`));
  assert.match(tiles, /class="tile down"/);
  assert.doesNotMatch(tiles, /tabindex="0" data-key="network"/);
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
    assert.equal(m.discover(hass, "").nasId, brand === "ugreen" ? "A" : "0000");
    // Synology and QNAP NAS are named by their device name in the YAML (#74).
    const shown = brand === "ugreen" ? "A" : "Backup NAS";
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

test("a NAS renamed while offline shows its new name once back online", async () => {
  const { mock, entities, offline } = await ugreenOffline();
  const m = load("nas-card.js", ["NasCard"]);
  const el = new m.NasCard();
  el._config = {};
  el._hass = { states: mock, entities, language: "en" };
  el._render();
  el._hass = { states: offline, entities, language: "en" };
  assert.match(el._render(), /class="name">ugreen-nas</);
  const id = "sensor.ugreen_nas_nas_name";
  assert.ok(mock[id], id);
  el._hass = { states: { ...mock, [id]: { ...mock[id], state: "backup-nas" } }, entities, language: "en" };
  assert.match(el._render(), /class="name">backup-nas</);
  // An entity that left the states is not shown from memory either: the generic name.
  const { [id]: _gone, ...rest } = mock;
  el._hass = { states: rest, entities, language: "en" };
  assert.match(el._render(), /class="name">UGREEN NAS</);
});

// Registry NAS with ten bays or more: entity ids sort "drive_10_…" before "drive_1_…" ('0' < '_'),
// so the slots must follow the bay numbers, not the plain string order of their entity ids.
const bigRegistryHass = async (brand, bays) => {
  const { mocks } = await import("../scripts/mock-states.mjs");
  const base = mocks[brand];
  const hass = { states: { ...base.states }, entities: { ...base.entities }, devices: { ...base.devices }, language: "en" };
  const rootId = brand === "synology" ? "syno_nas" : "qnap_nas";
  const platform = brand === "synology" ? "synology_dsm" : "qnap";
  const add = (id, tk, state, name, deviceId = rootId) => {
    hass.states[id] = { entity_id: id, state, attributes: { friendly_name: name } };
    hass.entities[id] = { entity_id: id, platform, device_id: deviceId, translation_key: tk };
  };
  for (let n = 1; n <= bays; n++) {
    if (brand === "synology") {
      const dev = `syno_big_d${n}`;
      hass.devices[dev] = { id: dev, name: `diskstation (Drive ${n})`, model: "HAT5300", via_device_id: rootId };
      add(`sensor.diskstation_drive_${n}_status`, "disk_status", "normal", `diskstation (Drive ${n}) Status`, dev);
      add(`sensor.diskstation_drive_${n}_temperature`, undefined, "38", `diskstation (Drive ${n}) Temperature`, dev);
    } else {
      add(`sensor.qnap_nas_drive_0_${n}_temperature`, "drive_temp", "34", `qnap-nas Drive 0:${n} temperature`);
      add(`sensor.qnap_nas_drive_0_${n}_status`, "drive_smart_status", "GOOD", `qnap-nas Drive 0:${n} status`);
    }
  }
  return hass;
};

test("Synology with twelve bays: the drives keep the order of their bays", async () => {
  const hass = await bigRegistryHass("synology", 12);
  const labels = Object.values(discover(hass, "").pools[1].disks).map((d) => d.labelText);
  // The four drives of the mock (devices syno_d1…d4) come along with the twelve added ones.
  const want = [];
  for (let n = 1; n <= 12; n++) want.push(`Drive ${n}`);
  assert.deepEqual([...new Set(labels)], want);
  const el = new NasCard();
  el._config = {};
  el._hass = hass;
  const html = el._render();
  const order = [...html.matchAll(/Drive (\d+)/g)].map((m) => Number(m[1]));
  assert.deepEqual([...new Set(order)], want.map((_, i) => i + 1));
});

test("QNAP with ten drives: the drives keep the order of their bays", async () => {
  const hass = await bigRegistryHass("qnap", 10);
  const keys = Object.keys(discover(hass, "").pools[1].disks);
  assert.deepEqual(keys, ["0:1", "0:2", "0:3", "0:4", "0:5", "0:6", "0:7", "0:8", "0:9", "0:10"]);
});

test("QNAP network tiles follow the first interface in numeric order (eth2 before eth10)", async () => {
  const hass = await bigRegistryHass("qnap", 2);
  for (const iface of ["eth10", "eth2"]) {
    const id = `sensor.qnap_nas_${iface}_download`;
    hass.states[id] = { entity_id: id, state: "1", attributes: { friendly_name: `qnap-nas ${iface} download` } };
    hass.entities[id] = { entity_id: id, platform: "qnap", device_id: "qnap_nas", translation_key: "network_rx" };
  }
  delete hass.entities["sensor.qnap_nas_eth0_download"];
  assert.equal(discover(hass, "").scalars.lan_down, "sensor.qnap_nas_eth2_download");
});

test("Synology security status unavailable: shown as unavailable, not as a security warning", () => {
  const el = new NasCard();
  el._hass = { states: {}, language: "en" };
  el._config = {};
  for (const [state, text] of [["unavailable", "Unavailable"], ["unknown", "Unknown"]]) {
    assert.equal(el._statusText({ state }, "synology"), text);
    assert.equal(el._statusText({ state }, "qnap"), text);
  }
  assert.equal(el._statusText({ state: "on" }, "synology"), "Warning");
  assert.equal(el._statusText({ state: "off" }, "synology"), "Normal");
});

test("Synology security status unavailable: the chip reads unavailable", async () => {
  const hass = await registryHass("synology");
  const id = "binary_sensor.diskstation_security_status";
  hass.states = { ...hass.states, [id]: { ...hass.states[id], state: "unavailable" } };
  for (const Cls of [NasCard, NasMiniCard]) {
    const el = new Cls();
    el._config = {};
    el._hass = hass;
    const html = el._render();
    assert.doesNotMatch(html, />Warning</);
    assert.match(html, />Unavailable</);
  }
});

test("reduced motion also stops the bar (both cards) and ring transitions", () => {
  const { FULL_STYLE, BASE_STYLE, MINI_STYLE } = load("nas-card.js", ["FULL_STYLE", "BASE_STYLE", "MINI_STYLE"]);
  // The rules inside the reduced-motion blocks of a stylesheet (one level of nesting).
  const reduced = (css) => [...css.matchAll(/@media \(prefers-reduced-motion: reduce\) \{((?:[^{}]*\{[^}]*\})*)\s*\}/g)].map((m) => m[1]).join(" ");
  for (const css of [`${BASE_STYLE}${FULL_STYLE}`, `${BASE_STYLE}${MINI_STYLE}`]) {
    assert.match(reduced(css), /\.bar > div[^{]*\{[^}]*transition: none/);
  }
  // Rings and the spinner only exist on the full card.
  const full = reduced(`${BASE_STYLE}${FULL_STYLE}`);
  assert.match(full, /\.ring \.value[^{]*\{[^}]*transition: none/);
  assert.match(full, /\.spin \{ animation: none; \}/);
});

// Review pass 9 -------------------------------------------------------------------------------------

// The UGREEN mock with some states replaced (state and unit).
const ugreenWith = async (patch) => {
  const { states } = await import("../scripts/mock-states.mjs");
  const out = { ...states };
  for (const [id, [state, unit]] of Object.entries(patch))
    out[id] = { ...states[id], state: String(state), attributes: { ...states[id].attributes, unit_of_measurement: unit } };
  return out;
};
const CPU_T = "sensor.ugreen_nas_cpu_temperature";
const DISK_T = "sensor.ugreen_nas_pool_1_disk_1_temperature";
// Class of the element whose text is exactly `text` (the gauge, metric row or disk temperature holding it).
const tempOf = (html, re) => html.match(re);

test("temperatures in °F are shown in °F, and the thresholds apply to their °C value", async () => {
  // 124 °F = 51 °C (CPU, below 75 °C), 113 °F = 45 °C (disk, below 60 °C): no alert.
  const states = await ugreenWith({ [CPU_T]: [124, "°F"], [DISK_T]: [113, "°F"] });
  const full = new NasCard();
  full._config = {};
  full._hass = { states, language: "en" };
  const html = full._render();
  assert.match(html, /<b>124°F<\/b>/);
  assert.doesNotMatch(html, /°F<\/b>[\s\S]*?°C<\/b>|124°C|113°C/);
  const gauge = tempOf(html, /<div class="gauge clickable ([a-z]+)"[^>]*data-entity="sensor\.ugreen_nas_cpu_temperature"/);
  assert.equal(gauge[1], "ok");
  assert.match(html, /<span class="temp ok">113°F<\/span>/);
  // The ring is filled to the °C value (51 of 100), not to 124 (full).
  const ring = html.match(/data-entity="sensor\.ugreen_nas_cpu_temperature">\s*<svg class="ring ok"[\s\S]*?class="value" stroke-dasharray="([\d.]+) ([\d.]+)"/);
  assert.equal(Math.round((+ring[1] / +ring[2]) * 100), 51);
  const mini = new NasMiniCard();
  mini._config = {};
  mini._hass = { states, language: "en" };
  const m = mini._render();
  assert.match(m, /<div class="metric clickable ok" role="button" tabindex="0" data-entity="sensor\.ugreen_nas_cpu_temperature" title="Temp\.">[\s\S]*?width:51\.\d+%[\s\S]*?124°F/);
});

test("°F temperatures past the °C thresholds still raise the alerts; °C and unitless sensors are unchanged", async () => {
  // 176 °F = 80 °C (CPU warn), 158 °F = 70 °C (disk crit).
  let states = await ugreenWith({ [CPU_T]: [176, "°F"], [DISK_T]: [158, "°F"] });
  const el = new NasCard();
  el._config = {};
  el._hass = { states, language: "en" };
  let html = el._render();
  assert.match(html, /<div class="gauge clickable warn"[^>]*data-entity="sensor\.ugreen_nas_cpu_temperature"/);
  assert.match(html, /<span class="temp crit">158°F<\/span>/);
  // °C: 80 °C warns, as before.
  states = await ugreenWith({ [CPU_T]: [80, "°C"], [DISK_T]: [45, "°C"] });
  el._hass = { states, language: "en" };
  html = el._render();
  assert.match(html, /<div class="gauge clickable warn"[^>]*data-entity="sensor\.ugreen_nas_cpu_temperature"/);
  assert.match(html, /<b>80°C<\/b>/);
  assert.match(html, /<span class="temp ok">45°C<\/span>/);
  // No unit: °C (the integrations' native unit), unless Home Assistant runs in °F.
  states = await ugreenWith({ [CPU_T]: [50, undefined] });
  el._hass = { states, language: "en" };
  assert.match(el._render(), /<b>50°C<\/b>/);
  el._hass = { states, language: "en", config: { unit_system: { temperature: "°F" } } };
  assert.match(el._render(), /<b>50°F<\/b>/);
  // Kelvin: 350 K = 76.85 °C warns.
  states = await ugreenWith({ [CPU_T]: [350, "K"] });
  el._hass = { states, language: "en" };
  html = el._render();
  assert.match(html, /<b>350 K<\/b>/);
  assert.match(html, /<div class="gauge clickable warn"[^>]*data-entity="sensor\.ugreen_nas_cpu_temperature"/);
  // Unavailable: no value, no alert.
  states = await ugreenWith({ [CPU_T]: ["unavailable", "°F"], [DISK_T]: ["unknown", "°F"] });
  el._hass = { states, language: "en" };
  html = el._render();
  assert.match(html, /<div class="gauge clickable "[^>]*data-entity="sensor\.ugreen_nas_cpu_temperature"[\s\S]*?<b>—<\/b>/);
  assert.match(html, /<span class="temp ">—<\/span>/);
});

test("a server status without value reads the translated unavailable / unknown state, in every brand and card", async () => {
  const synoId = "binary_sensor.diskstation_security_status";
  const ugId = "sensor.ugreen_nas_server_status";
  const expected = { en: ["Unavailable", "Unknown"], fr: ["Indisponible", "Inconnu"], de: ["Nicht verfügbar", "Unbekannt"], sr: ["Недоступно", "Непознато"] };
  for (const brand of ["synology", "qnap", "ugreen"]) {
    const base = brand === "ugreen" ? { ...(await import("../scripts/mock-states.mjs")).mocks.ugreen } : await registryHass(brand);
    const id = { synology: synoId, qnap: "sensor.qnap_nas_status", ugreen: ugId }[brand];
    for (const [i, state] of ["unavailable", "unknown"].entries())
      for (const [language, words] of Object.entries(expected)) {
        const hass = { ...base, language, states: { ...base.states, [id]: { ...base.states[id], state } } };
        for (const Cls of [NasCard, NasMiniCard]) {
          const el = new Cls();
          el._config = {};
          el._hass = hass;
          const html = el._render();
          assert.ok(html.includes(`>${words[i]}<`) || html.includes(`&nbsp;${words[i]}<`), `${brand} ${Cls.name} ${language} ${state}`);
          assert.doesNotMatch(html, new RegExp(`>(&nbsp;)?${state}<`), `${brand} ${Cls.name} ${language} ${state}`);
          assert.doesNotMatch(html, />Warning</);
        }
      }
  }
});

test("a volume or disk status without value shows a neutral dot titled with the translated state, not a red one", async () => {
  const states = await ugreenWith({});
  const vol = "sensor.ugreen_nas_pool_1_volume_1_status";
  const disk = "sensor.ugreen_nas_pool_1_disk_1_status";
  states[vol] = { ...states[vol], state: "unavailable" };
  states[disk] = { ...states[disk], state: "unavailable" };
  const el = new NasCard();
  el._config = {};
  el._hass = { states, language: "fr" };
  const html = el._render();
  assert.match(html, /data-key="1-1"[\s\S]*?<span class="dot na" title="Indisponible"><\/span>/);
  assert.match(html, /<span class="dot na" title="Indisponible"><\/span><\/div>/);
  // A real problem still turns red.
  states[disk] = { ...states[disk], state: "Warning" };
  el._hass = { states, language: "fr" };
  assert.match(el._render(), /<span class="dot crit" title="Warning"><\/span><\/div>/);
});

// CSS rules of the cards, read from the stylesheets (the browser test measures the result).
const styles = () => load("nas-card.js", ["BASE_STYLE", "FULL_STYLE", "MINI_STYLE"]);
const rule = (css, sel) => {
  const esc = sel.replace(/[.*+?^${}()|[\]\\>]/g, "\\$&");
  return [...css.matchAll(new RegExp(`(?:^|[}\\s])${esc}\\s*\\{([^}]*)\\}`, "g"))].map((m) => m[1]).join(";");
};
const containerRules = (css) => [...css.matchAll(/@container[^{]*\{((?:[^{}]*\{[^}]*\})*)\s*\}/g)].map((m) => m[1]).join(" ");

test("narrow header: the title truncates but keeps a few characters, the status pill shrinks, buttons never do", () => {
  const { BASE_STYLE, FULL_STYLE, MINI_STYLE } = styles();
  assert.match(rule(BASE_STYLE, "ha-card"), /container-type: inline-size/);
  const titles = rule(BASE_STYLE, ".titles");
  assert.match(titles, /min-width: 0/);
  // The title block starts from nothing (flex-basis 0): it never takes the room of the pill or the buttons.
  assert.match(titles, /flex: 1 1 0/);
  const name = rule(BASE_STYLE, ".name");
  assert.match(name, /text-overflow: ellipsis/);
  assert.match(name, /min-width: \d+(\.\d+)?ch/);
  // The pill sits in the second column of the titles grid, at its whole width (auto) as long as the title keeps
  // its minimum (first column), and it shrinks (min-width: 0) rather than push the title out.
  assert.match(titles, /grid-template-columns: minmax\(\d+px, 1fr\) auto/);
  const chip = rule(BASE_STYLE, ".titles > .chip");
  assert.match(chip, /min-width: 0/);
  assert.match(chip, /overflow: hidden/);
  assert.match(rule(BASE_STYLE, ".chip .txt"), /text-overflow: ellipsis/);
  // Below the threshold, the pill only shows its dot.
  assert.match(containerRules(BASE_STYLE), /\.chip \.txt\s*\{[^}]*display: none/);
  for (const sel of [".zoom", ".brand-link, .nas-link", ".logo"]) assert.match(rule(BASE_STYLE, sel), /flex: none/, sel);
  // The mini card keeps the full-size header icon (40 px, 24 px icon): its style does not resize it.
  assert.match(rule(BASE_STYLE, ".logo"), /height: 40px; width: 40px/);
  assert.doesNotMatch(MINI_STYLE, /\.logo(\s+svg)?\s*\{/);
  // Full card below ~340 px: no picture, the volume detail under its bar, tags that shrink.
  const full = containerRules(`${BASE_STYLE}${FULL_STYLE}`);
  assert.match(full, /\.nas-link\s*\{[^}]*display: none/);
  assert.match(full, /\.vol \.detail\s*\{[^}]*grid-row: 3/);
  assert.match(rule(FULL_STYLE, ".row .tag"), /min-width: 0/);
  // Mini card footer: one line per item, the uptime goes first.
  assert.match(rule(MINI_STYLE, ".foot span"), /white-space: nowrap/);
  assert.match(containerRules(`${BASE_STYLE}${MINI_STYLE}`), /\.foot \[data-key="uptime"\]\s*\{[^}]*display: none/);
});

test("the status pill carries its text in aria-label, so the dot-only pill still reads it", async () => {
  const hass = await registryHass("synology");
  const el = new NasCard();
  el._config = {};
  el._hass = hass;
  assert.match(el._render(), /<span class="chip clickable ok" role="button" tabindex="0" data-entity="binary_sensor\.diskstation_security_status" title="Normal" aria-label="Normal"><span class="dot"><\/span><span class="txt">Normal<\/span><\/span>/);
});

test("mini card metric labels share one column sized to the longest label (subgrid, fixed fallback)", () => {
  const { MINI_STYLE } = styles();
  const metrics = rule(MINI_STYLE, ".metrics");
  assert.match(metrics, /display: grid/);
  assert.match(metrics, /grid-template-columns: 18px minmax\(64px, max-content\) minmax\(0, 1fr\) 56px/);
  const metric = rule(MINI_STYLE, ".metric");
  // The fixed columns stay first: a browser without subgrid keeps them.
  assert.match(metric, /grid-template-columns: 18px 64px 1fr 56px;\s*grid-template-columns: subgrid/);
  assert.match(metric, /grid-column: 1 \/ -1/);
});

test("status pill and disk temperature text mix their state color with the text color (contrast)", () => {
  const { BASE_STYLE, FULL_STYLE } = styles();
  const ink = /color: color-mix\(in srgb, var\(--c, var\(--nas-ok\)\) 40%, var\(--primary-text-color, #212121\)\)/;
  assert.match(rule(BASE_STYLE, ".chip"), ink);
  assert.match(rule(FULL_STYLE, ".disk .temp"), /color: color-mix\(in srgb, var\(--c, currentColor\) 40%, var\(--primary-text-color, #212121\)\)/);
  assert.match(rule(BASE_STYLE, ".warning"), /color: color-mix\(in srgb, var\(--nas-warn\) 40%, var\(--primary-text-color, #212121\)\)/);
  // The dot keeps the pure state color.
  assert.match(rule(BASE_STYLE, ".dot"), /background: var\(--c, var\(--nas-ok\)\)/);
});

test("the keyboard zoom gives the focus back to the button without scrolling the page", async () => {
  const el = await zoomCard();
  const calls = [];
  el.shadowRoot.querySelector = (sel) => (sel === ".zoom" ? { focus: (...args) => calls.push(args) } : null);
  // Keyboard activation (Enter / Space): no click count.
  el._zoomClick({ ...zoomButton(), detail: 0 });
  assert.equal(calls.length, 1);
  assert.deepEqual({ ...calls[0][0] }, { preventScroll: true });
  // A mouse click leaves the focus where the browser puts it.
  el._zoomClick(zoomButton());
  assert.equal(calls.length, 1);
});

test("the mini card footer status carries its full text in title and aria-label", async () => {
  const el = await zoomCard({ language: "pl" });
  const span = el.html.match(/<span class="clickable [^"]*"[^>]*data-key="status"[^>]*>/)?.[0];
  assert.ok(span, "status span");
  assert.match(span, /title="Normalny"/);
  assert.match(span, /aria-label="Normalny"/);
});

test("the full card asks for 9 columns at least (234 px on a phone), the mini card 6", async () => {
  const el = await zoomCard();
  assert.deepEqual({ ...el.getGridOptions() }, { columns: 6, min_columns: 6 });
  const full = new NasCard();
  assert.deepEqual({ ...full.getGridOptions() }, { columns: 12, min_columns: 9 });
});

test("header icon: the NAS icon in the status color, for every brand", async () => {
  const { mocks } = await import("../scripts/mock-states.mjs");
  const icon = (hass) => {
    const el = new NasCard();
    el._config = {};
    el._hass = { ...hass, language: "en" };
    return el._render().match(/<a class="brand-link"[^>]*><span class="logo (\w+)" aria-hidden="true"><svg /)?.[1];
  };
  for (const brand of ["ugreen", "synology", "qnap"]) assert.equal(icon(mocks[brand]), "ok", brand);
});

test("header icon: the brand logo as an embedded badge, for every brand", async () => {
  const { mocks } = await import("../scripts/mock-states.mjs");
  const badge = (hass) => {
    const el = new NasCard();
    el._config = {};
    el._hass = { ...hass, language: "en" };
    return el._render().match(/<span class="badge">(<svg viewBox="31\.54|<img src="data:image\/png)/)?.[1];
  };
  assert.match(badge(mocks.ugreen), /^<svg/);
  for (const brand of ["synology", "qnap"]) assert.match(badge(mocks[brand]), /^<img/, brand);
});

test("network tiles: 24 h sparkline from the recorder statistics, refreshed every 5 minutes, off with show_history: false", async () => {
  const { states } = await import("../scripts/mock-states.mjs");
  const calls = [];
  const el = new NasCard();
  el._config = {};
  el._hass = {
    states,
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
  el._update();
  assert.equal(calls.length, 1);
  assert.equal(calls[0].type, "recorder/statistics_during_period");
  assert.equal(calls[0].period, "5minute");
  assert.doesNotMatch(el.html, /class="spark"/);
  await new Promise((r) => setTimeout(r, 0));
  assert.match(el.html, /class="spark"/);
  el._update();
  assert.equal(calls.length, 1, "no new query within 5 minutes");
  el._histAt -= 5 * 60000 + 1;
  el._update();
  assert.equal(calls.length, 2);

  const off = new NasCard();
  off._config = { show_history: false };
  off._hass = el._hass;
  assert.doesNotMatch(off._render(), /class="spark"/);
  assert.equal(calls.length, 2);
});

test("mini card: the folded rates show as tiles with their 24 h curves", async () => {
  const { states } = await import("../scripts/mock-states.mjs");
  const el = new NasMiniCard();
  el._config = {};
  el._hass = {
    states,
    language: "en",
    callWS: async (msg) =>
      Object.fromEntries(msg.statistic_ids.map((id) => [id, [{ start: Date.now() - 600000, mean: 1 }, { start: Date.now() - 300000, mean: 3 }]])),
  };
  el._update = () => {
    el.html = el._render();
  };
  el.shadowRoot.querySelector = () => null;
  el._update();
  assert.match(el.html, /class="net"/);
  await new Promise((r) => setTimeout(r, 0));
  assert.match(el.html, /class="spark"/);
});

test("sparkline: points on a real 24 h time axis, the line breaks over missing data", () => {
  const now = Date.UTC(2026, 10, 7, 12);
  const H = 3600000;
  const pt = (h, v) => ({ t: now - h * H, v });
  // Every 5 minutes from 18 h to 12 h ago and from 6 h ago to now: two runs, nothing from 12 h to 6 h ago.
  const run = (from, to) => Array.from({ length: (from - to) * 12 + 1 }, (_, i) => pt(from - i / 12, 10 + (i % 7)));
  const svg = spark([...run(18, 12), ...run(6, 0)], now);
  const line = svg.match(/class="spark-l" d="([^"]+)"/)[1];
  // Each point at its time: 18 h ago is a quarter of the width, now is the right edge.
  assert.equal(line.split("M").filter(Boolean).length, 2);
  assert.match(line, /^M25\.00,/);
  assert.match(line, /L100\.00,[\d.]+$/);
  assert.match(line, /L50\.00,[\d.]+M75\.00,/);
  // The area closes each run on the baseline instead of bridging the gap.
  const area = svg.match(/class="spark-a" d="([^"]+)"/)[1];
  assert.equal(area.match(/Z/g).length, 2);
  assert.match(area, /^M25\.00,30L/);
  // Data from the last hours only: the curve starts at its time, not at the left edge.
  assert.match(spark([pt(6, 1), pt(5.9, 2), pt(5.8, 3)], now), /class="spark-l" d="M75\.00,/);
  // Isolated points draw nothing; fewer than two points, no sparkline.
  assert.equal(spark([pt(10, 1), pt(5, 2)], now), "");
  assert.equal(spark([pt(1, 1)], now), "");
});

test("sparkline: statistics rows become timed points (ms or ISO start), without empty means", () => {
  const start = Date.UTC(2026, 10, 7, 11, 55);
  assert.deepEqual(
    JSON.parse(JSON.stringify(histPoints([{ start, mean: 4 }, { start: new Date(start + 300000).toISOString(), mean: 5 }, { start, mean: null }]))),
    [
      { t: start + 300000, v: 4 },
      { t: start + 600000, v: 5 },
    ]
  );
  assert.deepEqual(JSON.parse(JSON.stringify(histPoints(undefined))), []);
});

test("thresholds: configurable per reading, the former values by default", async () => {
  const { states } = await import("../scripts/mock-states.mjs");
  const el = new NasCard();
  el._hass = { states, language: "en" };
  el._config = {};
  assert.deepEqual([el._level("cpu", 69), el._level("cpu", 70), el._level("cpu", 90)], ["ok", "warn", "crit"]);
  assert.deepEqual([el._level("ram", 80), el._level("ram", 95)], ["warn", "crit"]);
  assert.deepEqual([el._level("temperature", 75), el._level("disk_temperature", 60), el._level("volume", 90)], ["warn", "warn", "crit"]);
  assert.equal(el._level("cpu", null), "");
  el._config = { thresholds: { cpu: { warning: 20, critical: "50" }, volume: { critical: 95 }, ram: { warning: "" } } };
  assert.deepEqual([el._level("cpu", 19), el._level("cpu", 20), el._level("cpu", 50)], ["ok", "warn", "crit"]);
  assert.deepEqual([el._level("volume", 80), el._level("volume", 94), el._level("volume", 95)], ["warn", "warn", "crit"]);
  assert.equal(el._level("ram", 80), "warn", "an empty value keeps the default");
  // The mini card rows and the full card's volumes follow them.
  el._config = { thresholds: { volume: { warning: 10, critical: 20 } } };
  assert.match(el._render(), /<div class="vol clickable crit"/);
  const mini = new NasMiniCard();
  mini._hass = el._hass;
  mini._config = { thresholds: { cpu: { warning: 0, critical: 0 } } };
  assert.match(mini._render(), /<div class="metric clickable crit"[^>]*data-entity="sensor\.ugreen_nas_cpu_usage"/);
});

test("editor: thresholds prefilled with the defaults, only changed values kept in the YAML", () => {
  const ed = new NasCardEditor();
  ed._hass = { states: {}, language: "en" };
  ed._config = { type: "custom:nas-card", thresholds: { cpu: { warning: 60 } } };
  ed._form = {};
  ed._render();
  assert.deepEqual(JSON.parse(JSON.stringify(ed._form.data.thresholds.cpu)), { warning: 60, critical: 90 });
  assert.deepEqual(JSON.parse(JSON.stringify(ed._form.data.thresholds.volume)), { warning: 80, critical: 90 });
  const th = ed._form.schema.find((s) => s.name === "thresholds");
  assert.equal(th.type, "expandable");
  assert.equal(th.schema.map((g) => g.name).join(), "cpu,ram,temperature,disk_temperature,volume");
  assert.equal(th.schema[0].schema[0].label, "CPU · orange from");
  assert.equal(th.schema[2].schema[1].selector.number.unit_of_measurement, "°C");
  // Saving: the defaults and empty values are dropped, nothing left means no thresholds key.
  const all = JSON.parse(JSON.stringify(ed._form.data.thresholds));
  all.cpu.warning = 70;
  assert.equal(pruneThresholds(all), undefined);
  all.cpu.warning = 60;
  all.disk_temperature.critical = 65;
  all.ram.warning = "";
  assert.deepEqual(JSON.parse(JSON.stringify(pruneThresholds(all))), { cpu: { warning: 60 }, disk_temperature: { critical: 65 } });
});

test("Synology disk health: SMART status, bad sectors and remaining life thresholds turn the dot red", async () => {
  const hass = await registryHass("synology");
  const d1 = discover(hass, "").pools[1].disks.syno_d1;
  assert.equal(d1.smart, "sensor.diskstation_drive_1_status_smart");
  assert.equal(d1.bad_sectors, "binary_sensor.diskstation_drive_1_exceeded_max_bad_sectors");
  assert.equal(d1.low_life, "binary_sensor.diskstation_drive_1_below_min_remaining_life");
  const render = (patch) => {
    const states = { ...hass.states };
    for (const [id, state] of Object.entries(patch)) states[id] = { ...states[id], state };
    const el = new NasCard();
    el._config = {};
    el._hass = { ...hass, states };
    return el._render().match(/data-key="1-syno_d1"[\s\S]*?<span class="dot ([a-z]+)" title="([^"]*)">/).slice(1);
  };
  assert.deepEqual(render({}), ["ok", "normal"]);
  assert.deepEqual(render({ "sensor.diskstation_drive_1_status_smart": "abnormal" }), ["crit", "abnormal"]);
  assert.deepEqual(render({ "binary_sensor.diskstation_drive_1_exceeded_max_bad_sectors": "on" }), ["crit", "diskstation (Drive 1) Exceeded max bad sectors"]);
  assert.deepEqual(render({ "binary_sensor.diskstation_drive_1_below_min_remaining_life": "on" }), ["crit", "diskstation (Drive 1) Below min remaining life"]);
  // The status sensor unavailable: the other health entities still tell.
  assert.deepEqual(render({ "sensor.diskstation_drive_1_status": "unavailable" }), ["ok", "normal"]);
});

test("a volume or disk without any status entity shows no dot, not a green one", () => {
  const el = new NasCard();
  el._config = {};
  el._hass = { states: {}, language: "en" };
  const nas = { pools: { 1: { volumes: { 1: {} }, disks: { 1: {} } } } };
  assert.doesNotMatch(el._volumes(nas), /class="dot/);
  assert.doesNotMatch(el._disks(nas), /class="dot/);
});

test("sizes and rates use the decimal separator of the card's language", async () => {
  assert.equal(fmtBytes(1.5e9, "fr"), "1,5 GB");
  assert.equal(fmtBytes(1.25e12, "de"), "1,25 TB");
  assert.equal(fmtBytes(1e12, "fr"), "1 TB");
  assert.equal(fmtRate(1.5e6, "de"), "1,5 MB/s");
  assert.equal(fmtRate(2e6, "fr"), "2,0 MB/s");
  assert.equal(fmtRate(1.5e6), "1.5 MB/s");
  const el = new NasCard();
  el._config = { language: "fr" };
  el._hass = { ...(await registryHass("synology")), language: "en" };
  const html = el._render();
  assert.match(html, /24,5 MB\/s/);
  assert.match(html, /6,62 TB utilisé/);
});

test("Synology: update chip when DSM has an update, reboot button with a confirmation at the top of the card", async () => {
  const hass = await registryHass("synology");
  const nas = discover(hass, "");
  assert.equal(nas.scalars.update, "update.diskstation_dsm_update");
  assert.equal(nas.scalars.reboot, "button.diskstation_reboot"); // not the shutdown button
  const calls = [];
  const el = new NasCard();
  el._config = {};
  el._hass = { ...hass, callService: (...a) => calls.push(a) };
  el._update = () => {
    el.html = el._render();
  };
  el.shadowRoot.querySelector = () => null;
  el._update();
  assert.match(el.html, /class="chip upd clickable" role="button" tabindex="0" data-entity="update.diskstation_dsm_update">[\s\S]*Update available · DSM 7.2.2-72806 Update 4/);
  assert.match(el.html, /<button class="action" data-action="reboot" title="Restart the NAS" aria-label="Restart the NAS">/);
  assert.doesNotMatch(el.html, /class="backdrop"/);
  // The button opens the popup, at the top of the card (right after the header); cancel closes it.
  el._confirmReboot();
  assert.match(el.html, /<\/div><style>[\s\S]*?<div class="backdrop"[\s\S]*role="alertdialog" aria-modal="true"/);
  assert.ok(el.html.indexOf('class="backdrop"') < el.html.indexOf('class="content"'));
  el._closeDialog(true);
  assert.doesNotMatch(el.html, /class="backdrop"/);
  assert.equal(calls.length, 0);
  // OK presses the reboot button.
  el._confirmReboot();
  el._dialog.onOk();
  await Promise.resolve();
  assert.deepEqual(calls[0].slice(0, 2), ["button", "press"]);
  assert.deepEqual({ ...calls[0][2] }, { entity_id: "button.diskstation_reboot" });
  // No update: no chip; reboot button unavailable: disabled, and the popup does not open.
  const states = { ...hass.states };
  states["update.diskstation_dsm_update"] = { ...states["update.diskstation_dsm_update"], state: "off" };
  states["button.diskstation_reboot"] = { ...states["button.diskstation_reboot"], state: "unavailable" };
  el._hass = { ...hass, states };
  el._dialog = null;
  el._update();
  assert.doesNotMatch(el.html, /class="chip upd/);
  assert.match(el.html, /data-action="reboot"[^>]*disabled>/);
  el._confirmReboot();
  assert.equal(el._dialog, null);
});

test("mini card: update in the footer; a click outside closes the reboot popup without folding the card", async () => {
  const hass = await registryHass("synology");
  const el = new NasMiniCard();
  el._config = {};
  el._hass = hass;
  el._update = () => {
    el.html = el._render();
  };
  el.shadowRoot.querySelector = () => null;
  el._update();
  assert.match(el.html, /data-key="update" data-entity="update.diskstation_dsm_update" title="Update available · DSM 7.2.2-72806 Update 4"/);
  assert.doesNotMatch(el.html, /data-action="reboot"/); // compact view: no reboot button
  el._zoomClick(zoomButton());
  assert.match(el.html, /data-action="reboot"/);
  el._confirmReboot();
  const ev = click([node("div"), node("body")]);
  el._onDialogOutside(ev);
  el._onOutside(ev);
  assert.equal(el._dialog, null);
  assert.equal(el._zoomed, true);
  el._onOutside(click([node("div"), node("body")]));
  assert.equal(el._zoomed, false);
});

test("folding: a tap elsewhere (pointer) collapses the mini card, not a press in it released outside; leaving the page collapses it too", async () => {
  const el = await zoomCard({ language: "fr" });
  el.connectedCallback();
  el._zoomClick(zoomButton());
  assert.equal(el._zoomed, true);
  // Pressed in the card and released outside: it stays.
  el._onOutsideWatch.tap(click([node("div"), el, node("body")]));
  assert.equal(el._zoomed, true);
  // A tap on a spot that sends no click (iOS): the pointer alone collapses it.
  el._onOutsideWatch.tap(click([node("div"), node("body")]));
  assert.equal(el._zoomed, false);
  // Left zoomed and back on the page: compact.
  el._zoomClick(zoomButton());
  el.disconnectedCallback();
  el.connectedCallback();
  assert.equal(el._zoomed, false);
  el.disconnectedCallback();
});

test("reboot popup: Escape and Tab handled on the window, a double click on its button does not reopen it", async () => {
  const hass = await registryHass("synology");
  const el = new NasCard();
  el._config = {};
  el._hass = { ...hass, callService: () => {} };
  el._update = () => {
    el.html = el._render();
  };
  const focused = [];
  const btn = (name) => ({ name, focus: (opts) => focused.push([name, { ...opts }]) });
  const cancel = btn("cancel");
  const ok = btn("ok");
  const reboot = btn("reboot");
  el.shadowRoot.querySelectorAll = (sel) => (sel === ".modal button" && el._dialog ? [cancel, ok] : []);
  el.shadowRoot.querySelector = (sel) => (sel === ".modal .danger" ? ok : sel === '[data-action="reboot"]' ? reboot : null);
  el._update();
  assert.equal(window.on_keydown, undefined);
  el._confirmReboot();
  // The keyboard listener is on the window while the popup is open; the focus moves without scrolling the page.
  assert.equal(window.on_keydown, el._onKey);
  assert.deepEqual(focused.pop(), ["ok", { preventScroll: true }]);
  el.shadowRoot.activeElement = ok;
  let prevented = 0;
  const key = (k, shiftKey = false) => ({ key: k, shiftKey, preventDefault: () => prevented++, stopPropagation() {} });
  window.on_keydown(key("Tab"));
  assert.deepEqual(focused.pop(), ["cancel", { preventScroll: true }]);
  el.shadowRoot.activeElement = cancel;
  window.on_keydown(key("Tab", true));
  assert.deepEqual(focused.pop(), ["ok", { preventScroll: true }]);
  assert.equal(prevented, 2);
  window.on_keydown(key("Escape"));
  assert.equal(el._dialog, null);
  assert.equal(window.on_keydown, undefined);
  assert.deepEqual(focused.pop(), ["reboot", { preventScroll: true }]);
  // OK through a click, then the second click of the double click lands on the reboot button: ignored.
  const [onClick] = el.shadowRoot.listeners.click;
  const tap = (action) => {
    const n = { dataset: { action } };
    let stopped = false;
    onClick({ composedPath: () => [n], stopImmediatePropagation: () => (stopped = true) });
    return stopped;
  };
  // Closed by Escape just now: a click within the guard delay is ignored too.
  assert.equal(tap("reboot"), true);
  el._dialogClosedAt -= 1000;
  tap("reboot");
  assert.ok(el._dialog);
  assert.equal(tap("dialog-ok"), false);
  assert.equal(el._dialog, null);
  assert.equal(tap("reboot"), true);
  assert.equal(el._dialog, null);
  // After the guard delay, the button opens the popup again.
  el._dialogClosedAt -= 1000;
  tap("reboot");
  assert.ok(el._dialog);
});

test("volume and disk fallback names and fan speed unit follow the card's language", async () => {
  const el = new NasCard();
  el._config = { language: "fr" };
  el._hass = { states: {}, language: "en" };
  const nas = {
    pools: { 1: { volumes: { 2: {} }, disks: { 3: {} } } },
    fans: { 1: "sensor.fan1" },
    scalars: {},
  };
  el._hass.states["sensor.fan1"] = { entity_id: "sensor.fan1", state: "1250", attributes: {} };
  assert.match(el._volumes(nas), /<span class="grow">Volume 2<\/span>/);
  assert.match(el._disks(nas), /<span>Disque 3<\/span>/);
  assert.match(el._fans(nas), /1\u202f250 tr\/min|1\u00a0250 tr\/min/);
  el._config = { language: "de" };
  assert.match(el._disks(nas), /<span>Laufwerk 3<\/span>/);
  assert.match(el._fans(nas), /1\.250 U\/min/);
});

// ---------------------------------------------------------------------------
// UGREEN NAS integration v2026.10.1+: UGOS version id, update sensor, reboot button.
// ---------------------------------------------------------------------------

const ug = (entity_id, state, nas = "nas", extra = {}) => ({ entity_id, state: String(state), attributes: { UGNAS_device_id: nas, ...extra } });
const btn = (entity_id, state = "unknown") => ({ entity_id, state, attributes: { friendly_name: "Power Action: Reboot" } });
const statesOf = (...list) => Object.fromEntries(list.map((x) => [x.entity_id, x]));

test("UGREEN: UGOS version found under its former and its v2026.10.1 entity id", () => {
  const old = discover({ states: statesOf(ug("sensor.ugreen_nas_nas_ugos_version", "1.20.0", "v1")) }, "");
  assert.equal(old.scalars.version, "sensor.ugreen_nas_nas_ugos_version");
  // A NAS adopted under a prefix that does not end with "nas" (« Basement »).
  const renamed = discover({ states: statesOf(ug("sensor.basement_ugos_version", "1.21.0", "basement"), ug("sensor.basement_cpu_usage", 5, "basement")) }, "");
  assert.equal(renamed.scalars.version, "sensor.basement_ugos_version");
  assert.equal(renamed.scalars.update, undefined); // ugos_update_available is not the version
});

test("UGREEN: update chip while the Update Available sensor is True, with the available version", () => {
  const states = statesOf(
    ug("sensor.upd_nas_cpu_usage", 12, "upd_nas"),
    ug("sensor.upd_nas_update_available", "True", "upd_nas", { installed_version: "1.20.0.0142", available_version: "1.21.0.0050" })
  );
  assert.equal(discover({ states }, "").scalars.update, "sensor.upd_nas_update_available");
  const el = new NasCard();
  el._config = {};
  el._hass = { states, language: "en" };
  assert.match(el._render(), /data-entity="sensor.upd_nas_update_available">[\s\S]*Update available · 1.21.0.0050/);
  const mini = new NasMiniCard();
  mini._config = {};
  mini._hass = { states, language: "en" };
  assert.match(mini._render(), /data-key="update" data-entity="sensor.upd_nas_update_available" title="Update available · 1.21.0.0050"/);
  // Unknown available version: chip without version; False: no chip.
  el._hass = { states: { ...states, "sensor.upd_nas_update_available": ug("sensor.upd_nas_update_available", "True", "upd_nas", { available_version: "Unknown" }) }, language: "en" };
  assert.match(el._render(), /Update available<\/span>/);
  el._hass = { states: { ...states, "sensor.upd_nas_update_available": ug("sensor.upd_nas_update_available", "False", "upd_nas") }, language: "en" };
  assert.doesNotMatch(el._render(), /class="chip upd/);
});

test("UGREEN: reboot button of a single NAS, pressed after confirmation", async () => {
  const states = statesOf(ug("sensor.one_nas_cpu_usage", 12, "nas"), btn("button.one_nas_power_action_reboot"), btn("button.one_nas_power_action_shutdown"));
  const nas = discover({ states }, "");
  assert.equal(nas.scalars.reboot, "button.one_nas_power_action_reboot");
  const calls = [];
  const el = new NasCard();
  el._config = {};
  el._hass = { states, language: "en", callService: (...a) => calls.push(a) };
  el._update = () => {
    el.html = el._render();
  };
  el.shadowRoot.querySelector = () => null;
  el._update();
  assert.match(el.html, /<button class="action" data-action="reboot" title="Restart the NAS"/);
  el._confirmReboot();
  el._dialog.onOk();
  await Promise.resolve();
  assert.deepEqual({ ...calls[0][2] }, { entity_id: "button.one_nas_power_action_reboot" });
});

test("UGREEN: with several NAS, each gets its own reboot button (entity prefix, then device registry)", () => {
  const states = statesOf(
    ug("sensor.office_nas_cpu_usage", 1, "office_nas"),
    ug("sensor.basement_nas_cpu_usage", 2, "basement_nas"),
    btn("button.office_nas_power_action_reboot"),
    btn("button.basement_nas_power_action_reboot")
  );
  assert.equal(discover({ states }, "office_nas").scalars.reboot, "button.office_nas_power_action_reboot");
  assert.equal(discover({ states }, "basement_nas").scalars.reboot, "button.basement_nas_power_action_reboot");
  // Renamed ids: the device registry decides.
  const s2 = statesOf(ug("sensor.a_cpu_usage", 1, "office_nas"), ug("sensor.b_cpu_usage", 2, "basement_nas"), btn("button.x_power_action_reboot"), btn("button.y_power_action_reboot"));
  const e = (id, device_id) => ({ entity_id: id, platform: "ugreen", device_id });
  const entities = Object.fromEntries(
    [e("sensor.a_cpu_usage", "dA"), e("sensor.b_cpu_usage", "dB"), e("button.x_power_action_reboot", "dB"), e("button.y_power_action_reboot", "dA")].map((x) => [x.entity_id, x])
  );
  const devices = { dA: { id: "dA" }, dB: { id: "dB" } };
  assert.equal(discover({ states: s2, entities, devices }, "office_nas").scalars.reboot, "button.y_power_action_reboot");
  assert.equal(discover({ states: s2, entities, devices }, "basement_nas").scalars.reboot, "button.x_power_action_reboot");
  // No match at all: no reboot button rather than another NAS's.
  const s3 = statesOf(ug("sensor.c_cpu_usage", 1, "c_nas"), ug("sensor.d_cpu_usage", 2, "d_nas"), btn("button.z_power_action_reboot"));
  assert.equal(discover({ states: s3 }, "c_nas").scalars.reboot, undefined);
});

// #74: FRITZ!Box Tools links the NAS device (merged by MAC address) to the mesh repeater it goes
// through. The root must stay within the Synology integration, or the repeater becomes the NAS.
const fritzHass = async (configEntries) => {
  const base = await registryHass("synology");
  const devices = structuredClone(base.devices);
  devices.repeater = { id: "repeater", name: "CarPort", model: "FRITZ!Repeater 1610 Outdoor", sw_version: "8.20", via_device_id: "box" };
  devices.box = { id: "box", name: "FRITZ!Box 7590", model: "FRITZ!Box 7590" };
  devices.syno_nas = { ...devices.syno_nas, via_device_id: "repeater" };
  if (configEntries) {
    for (const d of Object.values(devices)) d.config_entries = ["syno"];
    devices.syno_nas.config_entries = ["syno", "fritz"];
    devices.repeater.config_entries = devices.box.config_entries = ["fritz"];
  }
  return { ...base, devices };
};

test("Synology NAS behind a FRITZ! mesh repeater: the NAS stays the root (#74)", async () => {
  for (const configEntries of [true, false]) {
    const hass = await fritzHass(configEntries);
    const nas = discover(hass, "");
    assert.equal(nas.nasId, "syno_nas");
    assert.equal(nas.info.model, "DS923+");
    assert.equal(nas.scalars.cpu_usage, "sensor.diskstation_cpu_utilization_total");
    assert.equal(nas.scalars.ram_usage, "sensor.diskstation_memory_usage_real");
    assert.equal(nas.scalars.sys_temp, "sensor.diskstation_temperature");
    assert.equal(Object.keys(nas.pools[1].disks).length, 4); // no phantom disk from the NAS temperature
    assert.equal(discover(hass, "syno_nas").nasId, "syno_nas");
  }
});

test("nas option: the device name of a Synology or QNAP NAS, device ids still read (#74)", async () => {
  const hass = await registryHass("synology");
  const { NasCard: Card, NasCardEditor } = load("nas-card.js", ["NasCard", "NasCardEditor"]);
  assert.equal(discover(hass, "diskstation").nasId, "syno_nas");
  assert.equal(discover(hass, "DiskStation").nasId, "syno_nas");
  assert.equal(discover(hass, "syno_nas").nasId, "syno_nas");
  assert.equal(discover(hass, "other").nasId, null);
  assert.deepEqual({ ...Card.getStubConfig(hass) }, { nas: "diskstation" });
  const ed = new NasCardEditor();
  ed._hass = hass;
  ed._config = { nas: "syno_nas" }; // written by an earlier version
  ed._render();
  assert.equal(ed._form.data.nas, "diskstation");
  assert.equal(JSON.stringify(ed._schema()[0].selector.select.options), JSON.stringify([{ value: "diskstation", label: "diskstation" }]));
  // Two NAS of the same name: the device id tells them apart.
  const twin = structuredClone(hass);
  twin.devices.syno_nas2 = { ...twin.devices.syno_nas, id: "syno_nas2" };
  twin.entities["sensor.twin_cpu"] = { entity_id: "sensor.twin_cpu", platform: "synology_dsm", device_id: "syno_nas2", translation_key: "cpu_total_load" };
  assert.equal(discover(twin, "diskstation").nasId, null);
  assert.equal(discover(twin, "syno_nas2").nasId, "syno_nas2");
});

test("fallback labels number Synology volumes and disks keyed by device id, keep QNAP bays (#74)", async () => {
  const qnap = await registryHass("qnap");
  const card = new NasCard();
  card._config = {};
  card._hass = qnap;
  assert.match(card._disks(discover(qnap, "")), /Disk 0:1</);
  const syno = await registryHass("synology");
  const id = "630cf136dbad6481f0e2c1a7b2d3e4f5";
  const h = structuredClone(syno);
  h.devices[id] = { id, via_device_id: "syno_nas" }; // no name
  h.entities["sensor.nameless_disk_status"] = { entity_id: "sensor.nameless_disk_status", platform: "synology_dsm", device_id: id, translation_key: "disk_status" };
  card._hass = h;
  const html = card._disks(discover(h, ""));
  assert.doesNotMatch(html, new RegExp(`<span>[^<]*${id}`)); // shown labels only (data-key keeps the id)
  assert.match(html, />Disk 5</);
});

// RAID state: UGREEN pools (UGOS codes as words), Synology volumes (DSM volume status); QNAP reports none.
test("RAID state: a chip per volume on the full card, the worst unhealthy one in the mini card's footer", async () => {
  const states = await ugreenWith({});
  const pool1 = "sensor.ugreen_nas_pool_1_status";
  const pool2 = "sensor.ugreen_nas_pool_2_status_2";
  assert.ok(states[pool1] && states[pool2]);
  const full = new NasCard();
  full._config = {};
  full._hass = { states, language: "en" };
  let html = full._render();
  // Healthy: a green chip next to the RAID level, the volume's own status dot kept.
  assert.match(html, new RegExp(`<span class="chip raid clickable ok"[^>]*data-entity="${pool1}" title="RAID1 · Normal"`));
  assert.match(html, /data-key="1-1"[\s\S]*?<span class="dot ok"/);
  const mini = new NasMiniCard();
  mini._config = {};
  mini._hass = { states, language: "en" };
  assert.doesNotMatch(mini._render(), /data-key="raid"/);

  // Rebuilding (orange) on one pool, degraded (red) on the other: the footer shows the red one, translated.
  states[pool1] = { ...states[pool1], state: "Rebuilding" };
  states[pool2] = { ...states[pool2], state: "Degraded" };
  full._hass = { states, language: "fr" };
  html = full._render();
  assert.match(html, /<span class="chip raid clickable warn"[^>]*><span class="dot"><\/span><span class="txt">Reconstruction<\/span>/);
  assert.match(html, /<span class="chip raid clickable crit"[^>]*><span class="dot"><\/span><span class="txt">Dégradé<\/span>/);
  mini._hass = { states, language: "fr" };
  assert.match(mini._render(), new RegExp(`class="clickable raid crit"[^>]*data-key="raid" data-entity="${pool2}"[^>]*>.*RAID1 · Dégradé`));

  // A task the card has no word for keeps the integration's own, in orange; no value is neutral.
  states[pool1] = { ...states[pool1], state: "Data organizing" };
  states[pool2] = { ...states[pool2], state: "unavailable" };
  full._hass = { states, language: "en" };
  html = full._render();
  assert.match(html, /chip raid clickable warn[^>]*><span class="dot"><\/span><span class="txt">Data organizing</);
  assert.match(html, /chip raid clickable na[^>]*><span class="dot"><\/span><span class="txt">Unavailable</);
  mini._hass = { states, language: "en" };
  assert.match(mini._render(), /class="clickable raid warn"[^>]*>.*RAID1 · Data organizing/);
});

test("RAID state: a Synology volume's status is its RAID chip, shown once; QNAP volumes have none", async () => {
  const hass = await registryHass("synology");
  const vol = "sensor.diskstation_volume_1_status";
  const full = new NasCard();
  full._config = {};
  full._hass = hass;
  let html = full._render();
  assert.match(html, new RegExp(`<span class="chip raid clickable ok"[^>]*data-entity="${vol}"`));
  // No status dot beside it any more: the same entity would show twice.
  assert.doesNotMatch(html, /class="vol[^"]*"[^>]*>\s*<div class="row">\s*<span class="dot/);
  hass.states[vol] = { ...hass.states[vol], state: "degraded" };
  html = full._render();
  assert.match(html, /chip raid clickable crit[^>]*><span class="dot"><\/span><span class="txt">Degraded</);
  const mini = new NasMiniCard();
  mini._config = {};
  mini._hass = hass;
  assert.match(mini._render(), new RegExp(`class="clickable raid crit"[^>]*data-entity="${vol}"[^>]*>.*RAID · Degraded`));

  const qnap = await registryHass("qnap");
  full._hass = qnap;
  assert.doesNotMatch(full._render(), /chip raid/);
});

test("ASUSTOR discovery: scalars, fans, volume, disks and the first interface's rates from the device registry", async () => {
  const hass = await registryHass("asustor");
  const nas = discover(hass, "");
  assert.equal(nas.brand, "asustor");
  assert.equal(nas.nasId, "asus_nas");
  assert.equal(nas.info.model, "AS5304T");
  const sc = nas.scalars;
  assert.equal(sc.cpu_usage, "sensor.asustor_nas_cpu_usage");
  assert.equal(sc.ram_usage, "sensor.asustor_nas_memory_usage");
  assert.equal(sc.ram_total, "sensor.asustor_nas_memory_total");
  assert.equal(sc.ram_available, "sensor.asustor_nas_memory_available");
  assert.equal(sc.cpu_temp, "sensor.asustor_nas_cpu_temperature");
  assert.equal(sc.sys_temp, "sensor.asustor_nas_system_temperature");
  assert.equal(sc.runtime, "sensor.asustor_nas_uptime");
  assert.equal(sc.update, "update.asustor_nas_adm");
  assert.equal(sc.lan_down, "sensor.asustor_nas_eth0_receive_rate"); // first interface
  assert.equal(sc.lan_up, "sensor.asustor_nas_eth0_transmit_rate");
  assert.deepEqual({ ...nas.fans }, { 1: "sensor.asustor_nas_fan_speed_1", 2: "sensor.asustor_nas_fan_speed_2" });
  const vols = Object.values(nas.pools[1].volumes);
  assert.equal(vols.length, 1);
  assert.equal(vols[0].level, "sensor.asustor_nas_volume_1_raid_level");
  assert.equal(vols[0].labelText, "Volume 1"); // the NAS name prefix of ha-asustor's device names is left out
  assert.equal(vols[0].filesystem, "sensor.asustor_nas_volume_1_filesystem");
  const disks = Object.values(nas.pools[1].disks);
  assert.equal(disks.length, 2);
  assert.equal(disks[0].modelText, "ST8000VN004");
  assert.equal(disks[0].labelText, "Disk 1");
  assert.equal(disks[0].smart, "sensor.asustor_nas_disk_1_health");
});

test("a volume with only its free space and percentage gets a total and a used size (ASUSTOR)", async () => {
  const hass = await registryHass("asustor");
  const vol = Object.values(discover(hass, "").pools[1].volumes)[0];
  const u = volumeUsage(hass, vol);
  assert.equal(Math.round(u.pct * 10) / 10, 62.5);
  assert.equal(u.total, 16e12); // 6 TB free = 37.5 % of 16 TB
  assert.equal(u.used, 10e12);
});

test("ASUSTOR card: ADM version, uptime from days, RAID chip, idle disk healthy, fans, rates in Mbit/s", async () => {
  const hass = await registryHass("asustor");
  const el = new NasCard();
  el._config = {};
  el._hass = hass;
  const html = el._render();
  assert.match(html, /ADM 5\.1\.0\.RN42/);
  assert.match(html, /Uptime: 12 d 7 h/);
  assert.match(html, /<span class="tag">RAID5<\/span>/);
  assert.match(html, /<span class="tag">btrfs<\/span>/);
  assert.match(html, /chip raid clickable ok/);
  assert.match(html, /Update available/);
  assert.doesNotMatch(html, /newer version/); // ha-asustor only says "newer version": no version number to show
  assert.match(html, /1,?120 rpm/);
  assert.match(html, /19\.1 MB\/s/); // 152.4 Mbit/s
  assert.doesNotMatch(html, /dot crit/); // "Idle" is not a disk problem
  hass.states["sensor.asustor_nas_volume_1_status"] = { ...hass.states["sensor.asustor_nas_volume_1_status"], state: "Degraded" };
  assert.match(el._render(), /chip raid clickable crit[^>]*><span class="dot"><\/span><span class="txt">Degraded</);
});

test("ASUSTOR pictures: one drawing per family, bay count from the model, FS6706T is ASUSTOR, not Synology", () => {
  const { nasSvg, NAS_MODELS } = load("nas-card.js", ["nasSvg", "NAS_MODELS"]);
  const trays = (svg) => (svg.match(/class="t"/g) || []).length;
  // Lockerstor and the AS50…AS70 ranges: one tray per bay, vertical up to 6 bays, two columns of horizontal trays from 8.
  assert.equal(trays(nasSvg("AS6602T", "asustor")), 2);
  assert.equal(trays(nasSvg("AS6604T", "asustor")), 4);
  assert.equal(trays(nasSvg("AS6706T", "asustor")), 6);
  assert.equal(trays(nasSvg("AS6806T", "asustor")), 6);
  assert.doesNotMatch(nasSvg("AS6806T", "asustor"), /width="84"/); // 6 bays stay vertical, as on the photos
  assert.equal(trays(nasSvg("AS6808T", "asustor")), 8);
  assert.equal(trays(nasSvg("AS7110T", "asustor")), 10);
  assert.equal(trays(nasSvg("AS-202T", "asustor")), 2);
  assert.equal(trays(nasSvg("AS-608T", "asustor")), 8);
  assert.match(nasSvg("AS6604T", "asustor"), /#101a22/); // display from 4 bays
  assert.doesNotMatch(nasSvg("AS6602T", "asustor"), /#101a22/);
  // Drivestor has a closed front (no tray); Drivestor Pro, Nimbustor and AS40 show one glossy tray per disk.
  for (const m of ["AS1102T", "AS1104T", "AS3202T"]) assert.equal(trays(nasSvg(m, "asustor")), 0, m);
  for (const [m, n] of [["AS3302T", 2], ["AS3304T", 4], ["AS4002T", 2], ["AS4004T", 4], ["AS5202T", 2], ["AS5304T", 4], ["AS5402T", 2], ["AS5404T", 4]])
    assert.equal(trays(nasSvg(m, "asustor")), n, m);
  const width = (svg) => +svg.match(/viewBox="0 0 (\d+)/)[1];
  assert.ok(width(nasSvg("AS1104T", "asustor")) > width(nasSvg("AS1102T", "asustor")));
  assert.ok(width(nasSvg("AS5304T", "asustor")) > width(nasSvg("AS5202T", "asustor")));
  assert.match(nasSvg("AS1102T", "asustor"), /pattern/);
  // Rackmounts: one row of bays for 1U, a grid of four columns above.
  assert.equal(trays(nasSvg("AS6204RS", "asustor")), 4);
  assert.equal(trays(nasSvg("AS6212RD", "asustor")), 12);
  assert.equal(trays(nasSvg("AS7224RDX", "asustor")), 24);
  assert.equal(trays(nasSvg("AS-604RS", "asustor")), 4);
  // Flashstor: a flat box, the FS6712X a thin slab; FS is ASUSTOR's only when the integration says so.
  assert.equal(trays(nasSvg("FS6706T", "asustor")), 0);
  assert.ok(width(nasSvg("FS6712X", "asustor")) > width(nasSvg("FS6812X", "asustor")));
  assert.match(nasSvg("FS6706T", "asustor"), /data-nas="asustor"/);
  assert.doesNotMatch(nasSvg("FS6706T", "synology"), /data-nas="asustor"/);
  // Every model of the editor list is recognised, without the brand too (except the FS prefix).
  for (const m of NAS_MODELS.asustor.filter((x) => !/^FS/.test(x))) assert.match(nasSvg(m), /data-nas="asustor"/, m);
});
