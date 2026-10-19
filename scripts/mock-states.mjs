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
