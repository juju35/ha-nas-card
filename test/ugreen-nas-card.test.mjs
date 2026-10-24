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
