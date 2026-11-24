// ---------------------------------------------------------------------------
// Entity discovery
// ---------------------------------------------------------------------------
import { REGISTRY_PLATFORMS, deviceName, registryNasValue, registryRoots, rootDevice, set } from "./entity-discovery-2.js";

// Entity ids end with the sensor key, optionally followed by "_<n>" when Home Assistant
// had to de-duplicate the id (e.g. sensor.ugreen_nas_cpu_usage_2).
export const SFX = "(?:_\\d+)?$";
export const SCALARS = {
  name: "nas_name",
  model: "nas_model",
  // "NAS UGOS Version" became "UGOS Version" in the integration's v2026.10.1 (same key, so existing
  // installs keep the old id); a NAS adopted since then gets "<prefix>_ugos_version".
  version: "(?:nas_)?ugos_version",
  server_status: "server_status",
  system_message: "system_message",
  cpu_usage: "cpu_usage",
  cpu_temp: "cpu_temperature",
  cpu_model: "cpu_model",
  ram_usage: "ram_usage",
  ram_used: "ram_usage_used_gb",
  ram_total: "ram_total_size",
  runtime: "total_runtime",
  lan_up: "overall_lan_upload_raw",
  lan_down: "overall_lan_download_raw",
  cpu_fan: "cpu_fan",
  update: "update_available", // "Update Available" (v2026.10.1): "True" while a newer UGOS is out.
};
export const SCALAR_RE = Object.entries(SCALARS).map(([k, key]) => [k, new RegExp(`(?:^|_)${key}${SFX}`)]);
// "Power Action: Reboot" button (integration v2026.05.1 and later). Buttons carry no UGNAS_device_id.
export const RE_REBOOT = new RegExp(`(?:^|_)power_action_reboot${SFX}`);
// "Power Action: Shutdown" button, found the same way (juju35/ha-nas-card#89).
export const RE_SHUTDOWN = new RegExp(`(?:^|_)power_action_shutdown${SFX}`);
// "Power Action: Wake Up" (UGREEN integration v2026.05.1+); works even when the NAS is off.
export const RE_WAKE = new RegExp(`(?:^|_)power_action_wake_up${SFX}`);
export const RE_FAN = new RegExp(`(?:^|_)device_fan_(\\d+)${SFX}`);
export const RE_POOL = new RegExp(`(?:^|_)pool_(\\d+)_(label|level|status|total_size|used_size|disk_count)${SFX}`);
export const RE_VOLUME = new RegExp(
  `(?:^|_)pool_(\\d+)_volume_(\\d+)_(label|status|health|total_size_raw|used_size_raw|available_size_raw|total_size|used_size|filesystem)${SFX}`
);
export const RE_DISK = new RegExp(
  `(?:^|_)pool_(\\d+)_disk_(\\d+)_(label|model|temperature|status|power_on_hours|size|type|slot)${SFX}`
);

export const _cache = new Map();

/** List the NAS of every supported integration: UGREEN (UGNAS_device_id values) first, then the
 * NAS devices of the registry integrations (Synology DSM, QNAP). */
export const listNas = (hass) => {
  const ids = new Map();
  // The editor renders on every hass change: go through the registry-backed candidates
  // (cached, usually a handful of entities) instead of scanning every state. Both lists follow the
  // order discover() picks its default NAS in (sorted entity ids, sorted root device ids), so the
  // first entry is the NAS a card without nas shows.
  for (const eid of ugnasIds(hass)) {
    const a = hass.states[eid].attributes;
    const id = a.UGNAS_device_id;
    if (!ids.has(id)) ids.set(id, a.UGNAS_global_id || id);
  }
  const list = [...ids.entries()].map(([value, label]) => ({ value, label }));
  for (const brand of Object.keys(REGISTRY_PLATFORMS))
    for (const rootId of [...registryRoots(hass, brand).keys()].sort()) {
      const label = deviceName(hass.devices[rootId]) || rootId;
      list.push({ value: registryNasValue(hass, rootId), label });
    }
  return list;
};

// Candidate entity ids: the entities of the integration in the entity registry (plus entries whose
// platform is unknown), cached on the registry object (replaced only when it changes), not on
// hass.states, replaced on every state change. The cached list may be empty: on an install without
// the UGREEN integration (Synology/QNAP only) no state is a candidate, instead of scanning every
// state on each state change. Only without a usable registry is every state a candidate.
export const UGNAS_PLATFORM = "ugreen";
export let _registry = { entities: null, ids: [] };
export const candidateIds = (hass) => {
  if (hass.entities && _registry.entities !== hass.entities) {
    const entries = Object.entries(hass.entities);
    // An empty registry tells us nothing: ids stays null and the states are scanned.
    const ids = entries.length
      ? entries.filter(([, e]) => e?.platform === UGNAS_PLATFORM || e?.platform == null).map(([id]) => id)
      : null;
    _registry = { entities: hass.entities, ids };
  }
  return hass.entities && _registry.ids ? _registry.ids : Object.keys(hass.states);
};

// Entity ids carrying UGNAS_device_id right now, re-read from the states on each call. HA leaves the
// attribute out while an entity is unavailable or restored at startup, so the list follows the attribute
// as it goes and comes back, and a result computed while an entity was missing is never reused once it
// is back.
export const ugnasIds = (hass) => {
  const states = hass.states;
  return candidateIds(hass)
    .filter((id) => states[id]?.attributes?.UGNAS_device_id)
    .sort();
};

/**
 * Map the entities of one UGREEN NAS to a structured object of entity ids. The result is cached on
 * the list of UGREEN NAS entity ids that currently carry the attribute, so the regex matching only
 * runs again when that list changes. An empty result (no NAS found) is not cached.
 */
export const discoverUgreen = (hass, nasId) => {
  const all = ugnasIds(hass);
  const reboots = rebootIds(hass);
  const shutdowns = buttonIds(hass, RE_SHUTDOWN);
  const wakes = buttonIds(hass, RE_WAKE);
  const key = `${nasId || ""}\n${all.join(",")}\n${reboots.join(",")}\n${shutdowns.join(",")}\n${wakes.join(",")}`;
  if (_cache.has(key)) return _cache.get(key);
  if (_cache.size > 8) _cache.clear();

  const nas = { brand: "ugreen", scalars: {}, fans: {}, pools: {}, nasId: null, info: null };
  const entityIds = all.filter((id) => !nasId || hass.states[id].attributes.UGNAS_device_id === nasId);
  // Prefer the first NAS when none is configured.
  const first = entityIds.length ? hass.states[entityIds[0]].attributes.UGNAS_device_id : null;

  for (const id of entityIds) {
    const a = hass.states[id].attributes;
    if (!nasId && a.UGNAS_device_id !== first) continue;
    nas.nasId = a.UGNAS_device_id;
    const obj = id.split(".")[1];
    let m;
    if ((m = obj.match(RE_DISK))) {
      const pool = (nas.pools[m[1]] ??= { volumes: {}, disks: {} });
      set((pool.disks[m[2]] ??= {}), m[3], id);
    } else if ((m = obj.match(RE_VOLUME))) {
      const pool = (nas.pools[m[1]] ??= { volumes: {}, disks: {} });
      set((pool.volumes[m[2]] ??= {}), m[3], id);
    } else if ((m = obj.match(RE_POOL))) {
      const pool = (nas.pools[m[1]] ??= { volumes: {}, disks: {} });
      set(pool, m[2], id);
    } else if ((m = obj.match(RE_FAN))) {
      set(nas.fans, m[1], id);
    } else {
      for (const [k, re] of SCALAR_RE) {
        if (re.test(obj)) {
          set(nas.scalars, k, id);
          break;
        }
      }
    }
  }
  if (nas.nasId) {
    const reboot = ugreenReboot(hass, nas, all, reboots);
    if (reboot) nas.scalars.reboot = reboot;
    const shutdown = ugreenReboot(hass, nas, all, shutdowns);
    if (shutdown) nas.scalars.shutdown = shutdown;
    const wake = ugreenReboot(hass, nas, all, wakes);
    if (wake) nas.scalars.wake = wake;
    _cache.set(key, nas);
    _lastGood.set(nas.nasId, nas);
    _lastGood.set(nasId || "", nas);
    return nas;
  }
  return offlineUgreen(hass, nasId) || nas;
};

// UGREEN power buttons among the integration's entities: reboot (RE_REBOOT), shutdown (RE_SHUTDOWN).
export const buttonIds = (hass, re) =>
  candidateIds(hass)
    .filter((id) => id.startsWith("button.") && hass.states[id] && re.test(id.slice(7)))
    .sort();
export const rebootIds = (hass) => buttonIds(hass, RE_REBOOT);

// The reboot (or shutdown) button of one UGREEN NAS. Buttons carry no UGNAS_device_id: the button is the one on the NAS's
// device in the registry, else the one named after the NAS's entity prefix (UGNAS_device_id is that prefix),
// else the only one of a single-NAS install.
export const ugreenReboot = (hass, nas, all, reboots) => {
  if (!reboots.length) return undefined;
  const root = (id) => rootDevice(hass, hass.entities?.[id]?.device_id, hass.entities?.[id]?.platform)?.id;
  const nasRoot = mappedIds(nas).map(root).find(Boolean);
  if (nasRoot) {
    const same = reboots.find((id) => root(id) === nasRoot);
    if (same) return same;
  }
  const named = reboots.find((id) => id.slice(7).startsWith(`${nas.nasId}_`));
  if (named) return named;
  const single = new Set(all.map((id) => hass.states[id].attributes.UGNAS_device_id)).size === 1;
  return single && reboots.length === 1 && !(nasRoot && root(reboots[0])) ? reboots[0] : undefined;
};

// Last mapping found for each UGREEN NAS (and for the default NAS under ""). When the integration's
// coordinator fails (NAS rebooting or unreachable), every entity turns unavailable and Home Assistant
// drops UGNAS_device_id from it, so nothing carries the NAS id any more: the last mapping is served
// again, the card then shows its values as unavailable instead of a setup warning. Only while the
// mapped entities still in the states are all UGREEN candidates of the registry and none of them
// carries the attribute (a NAS id found elsewhere, or a removed integration, is not served from here).
export const _lastGood = new Map();
// Last known text of the name and label entities, by entity id (see NasCard._text).
export const _lastText = new Map();
export const NO_VALUE = new Set(["unavailable", "unknown"]);
export const mappedIds = (nas) => {
  const ids = [...Object.values(nas.scalars), ...Object.values(nas.fans)];
  for (const pool of Object.values(nas.pools)) {
    for (const [k, v] of Object.entries(pool)) if (k !== "volumes" && k !== "disks") ids.push(v);
    for (const group of [pool.volumes, pool.disks]) for (const slot of Object.values(group)) ids.push(...Object.values(slot));
  }
  return ids;
};
export const offlineUgreen = (hass, nasId) => {
  const nas = _lastGood.get(nasId || "");
  if (!nas) return null;
  const candidates = new Set(candidateIds(hass));
  const present = mappedIds(nas).filter((id) => hass.states[id]);
  const offline = present.length > 0 && present.every((id) => candidates.has(id) && !hass.states[id].attributes?.UGNAS_device_id);
  return offline ? nas : null;
};
