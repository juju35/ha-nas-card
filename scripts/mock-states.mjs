// Mock Home Assistant states shaped like the UGREEN NAS integration, used to render screenshots.
const A = (cat, unit, extra = {}) => ({
  UGNAS_global_id: "UGREEN NAS",
  UGNAS_device_id: "ugreen_nas",
  UGNAS_part_category: cat,
  ...(unit ? { unit_of_measurement: unit } : {}),
  ...extra,
});

const raw = {
  nas_name: ["ugreen-nas", A("Device")],
  nas_model: ["DXP480T Plus", A("Device")],
  nas_ugos_version: ["1.20.0.0142", A("Device")],
  server_status: ["Normal", A("Status")],
  system_message: ["The system is running normally.", A("Status")],
  cpu_model: ["12th Gen Intel(R) Core(TM) i5-1235U", A("Hardware")],
  cpu_usage: ["23.4", A("Status", "%")],
  cpu_temperature: ["51", A("Status", "°C", { device_class: "temperature" })],
  ram_usage: ["40.5", A("Status", "%")],
  ram_usage_used_gb: ["25.34", A("Status", "GB")],
  ram_total_size: ["64", A("Hardware", "GB")],
  total_runtime: ["882011", A("Status", "s")],
  overall_lan_upload_raw: ["2348000", A("Status", "B/s")],
  overall_lan_download_raw: ["48475000", A("Status", "B/s")],
  cpu_fan: ["1374", A("Status", "rpm")],
  device_fan_1: ["1748", A("Status", "rpm")],
  device_fan_2: ["1781", A("Status", "rpm")],
};

const pools = [
  { n: 1, used: 1013243199488, disks: [[1, "M.2 Hard Drive 1", 51, 9569], [2, "M.2 Hard Drive 2", 49, 9567]] },
  { n: 2, used: 1356206473216, disks: [[1, "M.2 Hard Drive 3", 47, 9347], [2, "M.2 Hard Drive 4", 62, 9346]] },
];
const total = 1983876431872;
for (const p of pools) {
  raw[`pool_${p.n}_label`] = [`Storage Pool ${p.n}`, A("Pools")];
  raw[`pool_${p.n}_level`] = ["raid1", A("Pools")];
  raw[`pool_${p.n}_status`] = ["Normal", A("Pools")];
  raw[`pool_${p.n}_volume_1_label`] = [`Volume ${p.n}`, A("Volumes")];
  raw[`pool_${p.n}_volume_1_status`] = ["Normal", A("Volumes")];
  raw[`pool_${p.n}_volume_1_filesystem`] = ["btrfs", A("Volumes")];
  raw[`pool_${p.n}_volume_1_total_size_raw`] = [String(total), A("Volumes", "B")];
  raw[`pool_${p.n}_volume_1_used_size_raw`] = [String(p.used), A("Volumes", "B")];
  raw[`pool_${p.n}_volume_1_available_size_raw`] = [String(total - p.used), A("Volumes", "B")];
  for (const [d, label, temp, hours] of p.disks) {
    const k = `pool_${p.n}_disk_${d}`;
    raw[`${k}_label`] = [label, A("Disks")];
    raw[`${k}_model`] = ["Samsung SSD 990 EVO Plus 2TB", A("Disks")];
    raw[`${k}_status`] = ["Normal", A("Disks")];
    raw[`${k}_size`] = ["1.82", A("Disks", "TB")];
    raw[`${k}_temperature`] = [String(temp), A("Status", "°C")];
    raw[`${k}_power_on_hours`] = [String(hours), A("Disks", "h")];
  }
}

export const states = {};
for (const [key, [state, attributes]] of Object.entries(raw)) {
  // Some installs carry a de-duplication suffix (_2): mix both forms to exercise discovery.
  const id = `sensor.ugreen_nas_${key}${key.startsWith("pool_2") ? "_2" : ""}`;
  states[id] = { entity_id: id, state, attributes };
}

// ---------------------------------------------------------------------------
// Synology DSM and QNAP mocks: entities typed by translation_key in the entity registry and
// grouped through the device registry, the way the core integrations register them.
// ---------------------------------------------------------------------------

// A boot time at a fixed age keeps the uptime text of the screenshots stable across runs.
const BOOT = new Date(Date.now() - (12 * 86400 + 7 * 3600 + 300) * 1000).toISOString();

const registryMock = (platform, device, deviceName, entries) => {
  const mock = { states: {}, entities: {}, devices: {} };
  mock.devices[device.id] = device;
  for (const [id, tk, state, attributes, deviceId] of entries) {
    const { name, ...attrs } = attributes;
    mock.states[id] = {
      entity_id: id,
      state: String(state),
      attributes: { friendly_name: `${deviceName} ${name}`, ...attrs },
    };
    mock.entities[id] = { entity_id: id, platform, device_id: deviceId || device.id, ...(tk ? { translation_key: tk } : {}) };
  }
  return mock;
};

const synoDevices = {
  syno_nas: {
    id: "syno_nas",
    name: "diskstation",
    manufacturer: "Synology",
    model: "DS923+",
    sw_version: "DSM 7.2.2-72806 Update 3",
    configuration_url: "https://192.168.1.20:5001",
    via_device_id: null,
  },
  syno_vol1: { id: "syno_vol1", name: "diskstation (Volume 1)", manufacturer: "Synology", model: "DS923+", via_device_id: "syno_nas" },
  syno_d1: { id: "syno_d1", name: "diskstation (Drive 1)", manufacturer: "WDC", model: "WD40EFPX-68C6CN0", via_device_id: "syno_nas" },
  syno_d2: { id: "syno_d2", name: "diskstation (Drive 2)", manufacturer: "WDC", model: "WD40EFPX-68C6CN0", via_device_id: "syno_nas" },
  syno_d3: { id: "syno_d3", name: "diskstation (Drive 3)", manufacturer: "WDC", model: "WD40EFPX-68C6CN0", via_device_id: "syno_nas" },
  syno_d4: { id: "syno_d4", name: "diskstation (Drive 4)", manufacturer: "WDC", model: "WD40EFPX-68C6CN0", via_device_id: "syno_nas" },
};
export const synology = registryMock("synology_dsm", synoDevices.syno_nas, "diskstation", [
  ["sensor.diskstation_cpu_utilization_total", "cpu_total_load", "14.8", { name: "CPU utilization (total)", unit_of_measurement: "%" }],
  ["sensor.diskstation_memory_usage_real", "memory_real_usage", "47.3", { name: "Memory usage (real)", unit_of_measurement: "%" }],
  ["sensor.diskstation_memory_total_real", "memory_total_real", "16384.0", { name: "Memory total (real)", unit_of_measurement: "MB" }],
  ["sensor.diskstation_memory_available_real", "memory_available_real", "8634.2", { name: "Memory available (real)", unit_of_measurement: "MB" }],
  ["sensor.diskstation_temperature", "temperature", "43", { name: "Temperature", unit_of_measurement: "°C", device_class: "temperature" }],
  ["sensor.diskstation_upload_throughput", "network_up", "812.4", { name: "Upload throughput", unit_of_measurement: "kB/s" }],
  ["sensor.diskstation_download_throughput", "network_down", "24518.7", { name: "Download throughput", unit_of_measurement: "kB/s" }],
  ["sensor.diskstation_last_boot", null, BOOT, { name: "Last boot", device_class: "timestamp" }],
  ["binary_sensor.diskstation_security_status", "status", "off", { name: "Security status", device_class: "safety" }],
  ["sensor.diskstation_volume_1_status", "volume_status", "normal", { name: "(Volume 1) Status" }, "syno_vol1"],
  ["sensor.diskstation_volume_1_volume_used", "volume_percentage_used", "63.1", { name: "(Volume 1) Volume used", unit_of_measurement: "%" }, "syno_vol1"],
  ["sensor.diskstation_volume_1_used_space", "volume_size_used", "6.62", { name: "(Volume 1) Used space", unit_of_measurement: "TB" }, "syno_vol1"],
  ["sensor.diskstation_drive_1_status", "disk_status", "normal", { name: "(Drive 1) Status" }, "syno_d1"],
  ["sensor.diskstation_drive_1_temperature", "disk_temp", "38", { name: "(Drive 1) Temperature", unit_of_measurement: "°C" }, "syno_d1"],
  ["sensor.diskstation_drive_2_status", "disk_status", "normal", { name: "(Drive 2) Status" }, "syno_d2"],
  ["sensor.diskstation_drive_2_temperature", "disk_temp", "39", { name: "(Drive 2) Temperature", unit_of_measurement: "°C" }, "syno_d2"],
  ["sensor.diskstation_drive_3_status", "disk_status", "normal", { name: "(Drive 3) Status" }, "syno_d3"],
  ["sensor.diskstation_drive_3_temperature", "disk_temp", "41", { name: "(Drive 3) Temperature", unit_of_measurement: "°C" }, "syno_d3"],
  ["sensor.diskstation_drive_4_status", "disk_status", "normal", { name: "(Drive 4) Status" }, "syno_d4"],
  ["sensor.diskstation_drive_4_temperature", "disk_temp", "37", { name: "(Drive 4) Temperature", unit_of_measurement: "°C" }, "syno_d4"],
]);
for (const d of Object.values(synoDevices)) synology.devices[d.id] = d;

const qnapDevice = {
  id: "qnap_nas",
  name: "qnap-nas",
  manufacturer: "QNAP",
  model: "TS-464",
  sw_version: "5.2.3.3006",
  via_device_id: null,
};
export const qnap = registryMock("qnap", qnapDevice, "qnap-nas", [
  ["sensor.qnap_nas_status", "status", "good", { name: "Status" }],
  ["sensor.qnap_nas_system_temperature", "system_temp", "39", { name: "System temperature", unit_of_measurement: "°C" }],
  ["sensor.qnap_nas_cpu_temperature", "cpu_temp", "52", { name: "CPU temperature", unit_of_measurement: "°C" }],
  ["sensor.qnap_nas_cpu_usage", "cpu_usage", "18.7", { name: "CPU usage", unit_of_measurement: "%" }],
  ["sensor.qnap_nas_memory_usage", "memory_percent_used", "36.4", { name: "Memory usage", unit_of_measurement: "%" }],
  ["sensor.qnap_nas_memory_used", "memory_used", "5.8", { name: "Memory used", unit_of_measurement: "GiB" }],
  ["sensor.qnap_nas_memory_size", "memory_size", "16.0", { name: "Memory size", unit_of_measurement: "GiB" }],
  ["sensor.qnap_nas_uptime", "uptime", BOOT, { name: "Uptime", device_class: "timestamp" }],
  ["sensor.qnap_nas_eth0_download", "network_rx", "186.2", { name: "eth0 download", unit_of_measurement: "Mbit/s" }],
  ["sensor.qnap_nas_eth0_upload", "network_tx", "18.4", { name: "eth0 upload", unit_of_measurement: "Mbit/s" }],
  ["sensor.qnap_nas_volume_used_datavol1", "volume_percentage_used", "71.2", { name: "Volume used (DataVol1)", unit_of_measurement: "%" }],
  ["sensor.qnap_nas_used_space_datavol1", "volume_size_used", "7372.8", { name: "Used space (DataVol1)", unit_of_measurement: "GiB" }],
  ["sensor.qnap_nas_free_space_datavol1", "volume_size_free", "2981.5", { name: "Free space (DataVol1)", unit_of_measurement: "GiB" }],
  ["sensor.qnap_nas_drive_0_1_temperature", "drive_temp", "34", { name: "Drive 0:1 temperature", unit_of_measurement: "°C" }],
  ["sensor.qnap_nas_drive_0_1_status", "drive_smart_status", "GOOD", { name: "Drive 0:1 status" }],
  ["sensor.qnap_nas_drive_0_2_temperature", "drive_temp", "36", { name: "Drive 0:2 temperature", unit_of_measurement: "°C" }],
  ["sensor.qnap_nas_drive_0_2_status", "drive_smart_status", "GOOD", { name: "Drive 0:2 status" }],
]);

// One mock Home Assistant per brand, the shape scripts/screenshots.mjs mounts the cards with.
export const mocks = {
  ugreen: { states },
  synology,
  qnap,
};
