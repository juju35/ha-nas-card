// ---------------------------------------------------------------------------
// Entity discovery — registry integrations (Synology DSM, QNAP)
// ---------------------------------------------------------------------------
//
// These integrations tag no attribute on their states: their entities are found through the entity
// registry (platform), typed by their language-independent translation_key, and grouped per NAS
// through the device registry. Synology attaches volumes and disks to child devices of the NAS;
// QNAP keeps everything on one device and tells volumes and drives apart in the entity names.
import { num, toBytes } from "./helpers.js";
import { discoverUgreen } from "./entity-discovery.js";

export const REGISTRY_PLATFORMS = { synology: "synology_dsm", qnap: "qnap", asustor: "asustor" };
// Brands whose volumes, disks and network interfaces are child devices of the NAS device.
export const CHILD_DEVICE_BRANDS = new Set(["synology", "asustor"]);

// NAS-level translation_key → scalar slot.
export const SYNO_SCALARS = {
  cpu_total_load: "cpu_usage",
  memory_real_usage: "ram_usage",
  memory_total_real: "ram_total",
  memory_available_real: "ram_available",
  temperature: "sys_temp",
  network_up: "lan_up",
  network_down: "lan_down",
};
export const QNAP_SCALARS = {
  cpu_usage: "cpu_usage",
  cpu_temp: "cpu_temp",
  system_temp: "sys_temp",
  memory_percent_used: "ram_usage",
  memory_used: "ram_used",
  memory_size: "ram_total",
  status: "server_status",
  uptime: "boot",
};
// ASUSTOR (ha-asustor, SNMP): fan_speed / fan_speed_n and cpu_temperature(_n) / system_temperature(_n) are handled by
// their prefix (the "_n" variants exist when the NAS has several fans or sensors); the update entity is its "adm" one.
export const ASUSTOR_SCALARS = {
  cpu_usage: "cpu_usage",
  memory_usage: "ram_usage",
  memory_total: "ram_total",
  memory_available: "ram_available",
  uptime: "runtime",
  cpu_model: "cpu_model",
};
export const ASUSTOR_TEMPS = { cpu_temperature: "cpu_temp", system_temperature: "sys_temp" };
// Volume and disk translation_key → per-device slot (Synology prefixes volume_/disk_, QNAP volume_/drive_).
export const VOLUME_KEYS = {
  volume_percentage_used: "used_pct",
  volume_size_used: "used_size",
  volume_size_total: "total_size",
  volume_size_free: "available_size",
  volume_status: "status",
  // ASUSTOR
  volume_usage: "used_pct",
  volume_used: "used_size",
  volume_total: "total_size",
  volume_free: "available_size",
  volume_raid_level: "level",
  volume_filesystem: "filesystem",
};
export const DISK_KEYS = {
  disk_temp: "temperature",
  disk_status: "status",
  disk_smart_status: "smart",
  disk_exceed_bad_sector_thr: "bad_sectors",
  disk_below_remain_life_thr: "low_life",
  drive_temp: "temperature",
  drive_smart_status: "status",
  // ASUSTOR
  disk_temperature: "temperature",
  disk_health: "smart",
  disk_size: "size",
};
// ASUSTOR: translation_key of the rates of a network interface (a child device) → network tile.
export const ASUSTOR_RATES = { if_receive_rate: "lan_down", if_transmit_rate: "lan_up" };
// Default object id of Synology's translation-key-less temperature sensors ("…_temperature", or
// "…_temp" in older installs), de-duplicated or not.
export const TEMP_ID_RE = /_temp(?:erature)?(?:_\d+)?$/;

// Registry lookups are cached on the registry objects, which Home Assistant replaces whenever an
// entity or a device changes (the states are read again on every discovery through the mapped ids).
export let _registries = { entities: null, devices: null, cache: new Map() };
export const registryCache = (hass) => {
  if (_registries.entities !== hass.entities || _registries.devices !== hass.devices)
    _registries = { entities: hass.entities, devices: hass.devices, cache: new Map() };
  return _registries.cache;
};

// Devices hosting entities of one platform (cached with the registries).
export const platformDevices = (hass, platform) => {
  const cache = registryCache(hass);
  const key = `devices\n${platform}`;
  if (!cache.has(key)) {
    const ids = new Set();
    for (const e of Object.values(hass.entities || {})) if (e?.platform === platform && e.device_id) ids.add(e.device_id);
    cache.set(key, ids);
  }
  return cache.get(key);
};

// Root device of the NAS: up the via_device chain while the parent belongs to the same integration.
// Other integrations link devices too (#74: FRITZ!Box Tools puts network clients, the NAS merged in
// by its MAC address, behind the mesh repeater they go through; the merged NAS device then carries
// the FRITZ!Box config entry as well). A parent hosting no entity of the platform is another
// integration's device and ends the chain.
export const rootDevice = (hass, id, platform) => {
  let d = hass.devices?.[id];
  for (let i = 0; d?.via_device_id && i < 4; i++) {
    const p = hass.devices[d.via_device_id];
    if (!p || (platform && !platformDevices(hass, platform).has(p.id))) break;
    d = p;
  }
  return d;
};

// Home Assistant device id (registry key), never shown as a label.
export const DEVICE_ID_RE = /^[0-9a-f]{32}$/;

export const naturalOrder = (a, b) => a.localeCompare(b, "en", { numeric: true });

// `nas` option of a Synology DSM or QNAP NAS: the name of its device (as shown in Home Assistant,
// renamed or not), readable in the YAML; the device id only when another NAS has the same name.
// Device ids written by earlier versions are still read.
export const deviceName = (d) => String(d?.name_by_user || d?.name || "").trim();
export const sameName = (a, b) => a.toLocaleLowerCase() === b.toLocaleLowerCase();
export const allRegistryRoots = (hass) => Object.keys(REGISTRY_PLATFORMS).flatMap((b) => [...registryRoots(hass, b).keys()]);
export const registryNasValue = (hass, rootId) => {
  const name = deviceName(hass.devices[rootId]);
  if (!name) return rootId;
  const twins = allRegistryRoots(hass).filter((id) => sameName(deviceName(hass.devices[id]), name));
  return twins.length === 1 ? name : rootId;
};
// `nas` value of a discovered NAS (UGREEN: its UGNAS_device_id).
export const nasValue = (hass, nas) => (nas.nasId && nas.brand !== "ugreen" ? registryNasValue(hass, nas.nasId) : nas.nasId);
export const resolveRoot = (hass, byRoot, nas) => {
  if (byRoot.has(nas)) return nas;
  const want = String(nas).trim();
  const named = [...byRoot.keys()].filter((id) => sameName(deviceName(hass.devices[id]), want));
  return named.length === 1 ? named[0] : null;
};

/** The NAS of one registry integration: root device id → sorted entity ids (NAS and child devices). */
export const registryRoots = (hass, brand) => {
  const cache = registryCache(hass);
  const key = `roots\n${brand}`;
  if (cache.has(key)) return cache.get(key);
  const byRoot = new Map();
  if (hass.entities && hass.devices) {
    for (const [id, e] of Object.entries(hass.entities)) {
      if (e?.platform !== REGISTRY_PLATFORMS[brand] || !e.device_id) continue;
      const root = rootDevice(hass, e.device_id, REGISTRY_PLATFORMS[brand]);
      if (!root) continue;
      if (!byRoot.has(root.id)) byRoot.set(root.id, []);
      byRoot.get(root.id).push(id);
    }
    // Numeric order: bay 10 after bay 9 ("drive_10_…" sorts before "drive_1_…" as plain strings),
    // eth10 after eth2. Synology and QNAP slots are created, and then shown, in this order.
    for (const ids of byRoot.values()) ids.sort(naturalOrder);
  }
  cache.set(key, byRoot);
  return byRoot;
};

// The specific volume or drive of a QNAP entity only shows in its name, where the integration
// inserts it ({monitor_device}): the words an entity does not share with the others of its
// translation_key group are that insert, whatever the language.
export const monitorOf = (names, i) => {
  if (names.length < 2) return "";
  const words = names.map((n) => String(n || "").split(/\s+/));
  const w = words[i];
  let a = 0;
  while (a < w.length && words.every((o) => o[a] === w[a])) a++;
  let b = 0;
  while (b < w.length - a && words.every((o) => o[o.length - 1 - b] === w[w.length - 1 - b])) b++;
  return w.slice(a, w.length - b).join(" ");
};
// Trailing parenthesized insert of an entity name (QNAP volume names), doubling as the label.
export const parenOf = (name) => (String(name || "").match(/\(([^()]*)\)[^()]*$/) || [])[1] ?? null;
// Trailing parenthesized part of a device name ("hostname (Volume 1)" → "Volume 1").
// Without that part, the device name itself, never the device id (#74).
export const deviceLabel = (name) => (String(name || "").match(/\(([^()]*)\)\s*$/) || [])[1] ?? (String(name || "").trim() || undefined);

export const set = (obj, k, id) => {
  if (!(k in obj)) obj[k] = id;
};

/** Map the entities of one Synology DSM or QNAP NAS to the structure the cards render. */
export const discoverRegistry = (hass, brand, nasId) => {
  const cache = registryCache(hass);
  const key = `${brand}\n${nasId || ""}`;
  if (cache.has(key)) return cache.get(key);

  const byRoot = registryRoots(hass, brand);
  const rootId = nasId ? resolveRoot(hass, byRoot, nasId) : ([...byRoot.keys()].sort()[0] ?? null);
  const nas = { brand, nasId: rootId, scalars: {}, fans: {}, pools: {}, info: null };
  if (!rootId) {
    cache.set(key, nas);
    return nas;
  }
  const dev = hass.devices[rootId];
  nas.info = { name: dev.name_by_user || dev.name, model: dev.model, version: dev.sw_version, url: dev.configuration_url };
  const SCALARS_BY_KEY = { synology: SYNO_SCALARS, qnap: QNAP_SCALARS, asustor: ASUSTOR_SCALARS }[brand];
  const pool = (nas.pools[1] = { volumes: {}, disks: {} });
  const groups = {};
  // Label of a child device (a volume or a disk). ha-asustor names them "<NAS name> <part>" ("NAS Disk 1"): the NAS
  // name is left out, so that a narrow disk tile keeps "Disk 1" instead of cutting "NAS Disk…".
  const childLabel = (d) => {
    const name = String(d?.name_by_user || d?.name || "");
    const root = deviceName(dev);
    return deviceLabel(brand === "asustor" && root && name.toLowerCase().startsWith(`${root.toLowerCase()} `) ? name.slice(root.length + 1) : name);
  };

  for (const id of byRoot.get(rootId)) {
    const e = hass.entities[id];
    const tk = e.translation_key;
    // Synology's NAS and disk temperature sensors carry no translation_key (their name comes from
    // the temperature device class): they are told by that class, or by their id when the state
    // is not loaded yet.
    const isTemp = brand === "synology" && !tk && id.startsWith("sensor.") && (hass.states[id]?.attributes?.device_class === "temperature" || TEMP_ID_RE.test(id));
    if (CHILD_DEVICE_BRANDS.has(brand) && e.device_id !== rootId) {
      // Child device of the NAS: a volume or a disk, labelled and (for disks) modelled by its device.
      const d = hass.devices[e.device_id];
      if (brand === "asustor" && tk in ASUSTOR_RATES) set(nas.scalars, ASUSTOR_RATES[tk], id); // First interface feeds the tiles.
      else if (tk in VOLUME_KEYS) set((pool.volumes[e.device_id] ??= { labelText: childLabel(d) }), VOLUME_KEYS[tk], id);
      else if (tk in DISK_KEYS || isTemp)
        set((pool.disks[e.device_id] ??= { labelText: childLabel(d), modelText: d?.model }), isTemp ? "temperature" : DISK_KEYS[tk], id);
    } else if (isTemp) {
      set(nas.scalars, "sys_temp", id);
    } else if (brand === "synology" && tk === "status" && id.startsWith("binary_sensor.")) {
      set(nas.scalars, "server_status", id); // Security status: a safety binary sensor, on = issue found.
    } else if (brand === "asustor" && /^fan_speed(_n)?$/.test(tk)) {
      nas.fans[Object.keys(nas.fans).length + 1] = id; // Entities are sorted: fans stay in order.
    } else if (brand === "asustor" && /^(cpu|system)_temperature(_n)?$/.test(tk)) {
      set(nas.scalars, ASUSTOR_TEMPS[tk.replace(/_n$/, "")], id);
    } else if (tk in SCALARS_BY_KEY) {
      set(nas.scalars, SCALARS_BY_KEY[tk], id);
    } else if (e.device_id === rootId && id.startsWith("update.")) {
      set(nas.scalars, "update", id); // Synology DSM update.
    } else if (
      e.device_id === rootId &&
      id.startsWith("button.") &&
      (tk === "reboot" || hass.states[id]?.attributes?.device_class === "restart")
    ) {
      set(nas.scalars, "reboot", id); // Synology "Reboot" (restart device class; "Shutdown" has none).
    } else if (
      e.device_id === rootId &&
      id.startsWith("button.") &&
      (tk === "shutdown" || (!tk && (/_shutdown$/.test(id) || hass.states[id]?.attributes?.icon === "mdi:power")))
    ) {
      set(nas.scalars, "shutdown", id); // Synology "Shutdown": no translation key nor device class, mdi:power.
    } else if (brand === "qnap" && (tk in VOLUME_KEYS || tk in DISK_KEYS || tk === "network_rx" || tk === "network_tx")) {
      (groups[tk] ??= []).push(id);
    } else if (!tk && id.startsWith("sensor.") && hass.states[id]?.attributes?.device_class === "timestamp") {
      set(nas.scalars, "boot", id); // Synology "Last boot" carries no translation_key.
    }
  }

  if (brand === "qnap") {
    // Network: the first interface (sorted entity ids) feeds the two tiles.
    if (groups.network_rx) set(nas.scalars, "lan_down", groups.network_rx[0]);
    if (groups.network_tx) set(nas.scalars, "lan_up", groups.network_tx[0]);
    // Volumes and drives: the entities of one volume or drive are joined on the monitor insert of
    // their names; the insert in parentheses (volumes) doubles as the label.
    const nameOf = (id) => hass.states[id]?.attributes?.friendly_name || id.split(".")[1];
    const join = (tks, into) => {
      for (const tk of tks) {
        const ids = groups[tk] || [];
        const names = ids.map(nameOf);
        ids.forEach((id, i) => {
          const label = parenOf(names[i]);
          const mon = label ?? monitorOf(names, i);
          const slot = (into[mon || "1"] ??= {});
          if (label && !slot.labelText) slot.labelText = label;
          set(slot, (tk in VOLUME_KEYS ? VOLUME_KEYS : DISK_KEYS)[tk], id);
        });
      }
    };
    join(["volume_percentage_used", "volume_size_used", "volume_size_free"], pool.volumes);
    join(["drive_temp", "drive_smart_status"], pool.disks);
    // "Volume size" carries no insert in its name: it is only safe with a single volume.
    const volumes = Object.values(pool.volumes);
    if (groups.volume_size_total?.length === 1 && volumes.length === 1) set(volumes[0], "total_size", groups.volume_size_total[0]);
  }
  cache.set(key, nas);
  return nas;
};

/** Map the entities of one NAS, whatever its integration: the UGREEN integration first (its
 * entities carry the attribute), then the registry integrations; a configured nas picks
 * whichever integration knows it. */
export const discover = (hass, nasId) => {
  const ugreen = discoverUgreen(hass, nasId);
  if (ugreen.nasId) return ugreen;
  for (const brand of Object.keys(REGISTRY_PLATFORMS)) {
    const nas = discoverRegistry(hass, brand, nasId);
    if (nas.nasId) return nas;
  }
  return ugreen;
};

/** Compute used/total bytes of a volume from the raw sensors (fallback to the human ones). */
export const volumeUsage = (hass, vol) => {
  const st = (k) => vol[k] && hass.states[vol[k]];
  let total = toBytes(st("total_size_raw")) ?? toBytes(st("total_size"));
  let used = toBytes(st("used_size_raw")) ?? toBytes(st("used_size"));
  const avail = toBytes(st("available_size_raw")) ?? toBytes(st("available_size"));
  if (used === null && total !== null && avail !== null) used = total - avail;
  if (total === null && used !== null && avail !== null) total = used + avail;
  // Unknown used space: no percentage (shown as "—"), rather than an empty bar at 0 %.
  let pct = total && used !== null ? Math.min(100, Math.max(0, (used / total) * 100)) : null;
  // Synology, QNAP and ASUSTOR report the percentage directly: it completes whichever size is missing.
  const direct = num(st("used_pct"));
  if (pct === null && direct !== null) {
    pct = Math.min(100, Math.max(0, direct));
    if (used === null && total !== null) used = (total * pct) / 100;
    else if (total === null && used !== null && pct > 0) total = (used * 100) / pct;
    // Only the free space and the percentage (ASUSTOR: used and total are disabled by default).
    else if (total === null && used === null && avail !== null && pct < 100) {
      total = (avail * 100) / (100 - pct);
      used = total - avail;
    }
  }
  return { total, used, pct };
};

// Same values, compared by identity: used to skip a render when nothing the card shows has changed.
export const sameSig = (a, b) => !!a && !!b && a.length === b.length && a.every((v, i) => v === b[i]);

// Patch the shadow DOM in place from the new HTML: nodes whose tag is unchanged are kept, so keyboard
// focus, hover, embedded pictures and CSS transitions survive an update, and only the changed text and
// attributes are written. Rows of a list carry a data-key (their entity or row id) and are matched by it,
// wherever they moved, so a focused row keeps its own data when the list is reordered (a node matched by
// position would be rewritten with the row taking its place, and Enter would act on that row). Nodes
// without a data-key are matched by position.
export const patchAttrs = (cur, next) => {
  for (const { name } of [...cur.attributes]) if (!next.hasAttribute(name)) cur.removeAttribute(name);
  for (const { name, value } of next.attributes) if (cur.getAttribute(name) !== value) cur.setAttribute(name, value);
};
export const keyOf = (n) => (n.nodeType === 1 ? n.getAttribute("data-key") : null);
export const sameNode = (a, b) => !!a && a.nodeType === b.nodeType && a.nodeName === b.nodeName;
// Moves a kept node. moveBefore (where supported) keeps its focus; insertBefore drops it, which is safe:
// Enter then does nothing rather than act on another row.
export const place = (parent, node, ref) => {
  if (node === ref) return;
  try {
    if (parent.moveBefore && node.parentNode === parent) return parent.moveBefore(node, ref);
  } catch (_e) {
    /* fall back to insertBefore */
  }
  parent.insertBefore(node, ref);
};
export const patchChildren = (cur, next) => {
  const old = [...cur.childNodes];
  const fresh = [...next.childNodes];
  const byKey = new Map();
  for (const o of old) {
    const k = keyOf(o);
    if (k !== null && !byKey.has(k)) byKey.set(k, o);
  }
  const used = new Set();
  fresh.forEach((n, i) => {
    const k = keyOf(n);
    let o = k !== null ? byKey.get(k) : old[i];
    if (!sameNode(o, n) || used.has(o) || (k === null && keyOf(o) !== null)) o = null;
    const ref = cur.childNodes[i] ?? null;
    if (!o) {
      cur.insertBefore(n, ref);
      return;
    }
    used.add(o);
    place(cur, o, ref);
    if (n.nodeType === 1) {
      patchAttrs(o, n);
      patchChildren(o, n);
    } else if (o.nodeValue !== n.nodeValue) o.nodeValue = n.nodeValue;
  });
  while (cur.childNodes.length > fresh.length) cur.removeChild(cur.lastChild);
};
// The whole width of an element's text, in fractional pixels, even when it is cut with an ellipsis.
export const textWidth = (el) => {
  const range = document.createRange();
  range.selectNodeContents(el);
  return Math.max(el.scrollWidth, range.getBoundingClientRect().width);
};
export const morph = (root, html) => {
  const tpl = document.createElement("template");
  tpl.innerHTML = html;
  patchChildren(root, tpl.content);
};

export const fireMoreInfo = (node, entityId) => {
  if (!entityId) return;
  node.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId }, bubbles: true, composed: true }));
};
