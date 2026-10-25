/*
 * UGREEN NAS Card for Home Assistant
 * https://github.com/juju35/ha-ugreen-nas-card
 *
 * Lovelace cards for the UGREEN NAS integration
 * (https://github.com/Tom-Bom-badil/home-assistant_ugreen-nas).
 * Entities are discovered automatically through their UGNAS_device_id attribute.
 */

const VERSION = "__VERSION__";
const IMG_NAS = "__IMG_NAS__";

const ICONS = {
  cpu: "M6,4H18V5H21V7H18V9H21V11H18V13H21V15H18V17H21V19H18V20H6V19H3V17H6V15H3V13H6V11H3V9H6V7H3V5H6V4M11,15V18H12V15H11M13,15V18H14V15H13M15,15V18H16V15H15Z",
  ram: "M17,17H7V7H17M21,11V9H19V7C19,5.89 18.1,5 17,5H15V3H13V5H11V3H9V5H7C5.89,5 5,5.89 5,7V9H3V11H5V13H3V15H5V17A2,2 0 0,0 7,19H9V21H11V19H13V21H15V19H17A2,2 0 0,0 19,17V15H21V13H19V11M13,13H11V11H13M15,9H9V15H15V9Z",
  temp: "M15 13V5A3 3 0 0 0 9 5V13A5 5 0 1 0 15 13M12 4A1 1 0 0 1 13 5V8H11V5A1 1 0 0 1 12 4Z",
  fan: "M12,11A1,1 0 0,0 11,12A1,1 0 0,0 12,13A1,1 0 0,0 13,12A1,1 0 0,0 12,11M12.5,2C17,2 17.11,5.57 14.75,6.75C13.76,7.24 13.32,8.29 13.13,9.22C13.61,9.42 14.03,9.73 14.35,10.13C18.05,8.13 22.03,8.92 22.03,12.5C22.03,17 18.46,17.1 17.28,14.73C16.78,13.74 15.72,13.3 14.79,13.11C14.59,13.59 14.28,14 13.88,14.34C15.87,18.03 15.08,22 11.5,22C7,22 6.91,18.42 9.27,17.24C10.25,16.75 10.69,15.71 10.89,14.79C10.4,14.59 9.97,14.27 9.65,13.87C5.96,15.85 2,15.07 2,11.5C2,7 5.56,6.89 6.74,9.26C7.24,10.25 8.29,10.68 9.22,10.87C9.41,10.39 9.73,9.97 10.14,9.65C8.15,5.96 8.94,2 12.5,2Z",
  down: "M9,4H15V12H19.84L12,19.84L4.16,12H9V4Z",
  up: "M15,20H9V12H4.16L12,4.16L19.84,12H15V20Z",
  disk: "M6,2H18A2,2 0 0,1 20,4V20A2,2 0 0,1 18,22H6A2,2 0 0,1 4,20V4A2,2 0 0,1 6,2M12,4A6,6 0 0,0 6,10C6,13.31 8.69,16 12.1,16L11.22,13.77C10.95,13.29 11.11,12.68 11.59,12.4L12.45,11.9C12.93,11.63 13.54,11.79 13.82,12.27L15.74,14.69C17.12,13.59 18,11.9 18,10A6,6 0 0,0 12,4M12,9A1,1 0 0,1 13,10A1,1 0 0,1 12,11A1,1 0 0,1 11,10A1,1 0 0,1 12,9M7,18A1,1 0 0,0 6,19A1,1 0 0,0 7,20A1,1 0 0,0 8,19A1,1 0 0,0 7,18M12.09,13.27L14.58,19.58L17.17,18.08L12.95,12.77L12.09,13.27Z",
  database: "M12,3C7.58,3 4,4.79 4,7C4,9.21 7.58,11 12,11C16.42,11 20,9.21 20,7C20,4.79 16.42,3 12,3M4,9V12C4,14.21 7.58,16 12,16C16.42,16 20,14.21 20,12V9C20,11.21 16.42,13 12,13C7.58,13 4,11.21 4,9M4,14V17C4,19.21 7.58,21 12,21C16.42,21 20,19.21 20,17V14C20,16.21 16.42,18 12,18C7.58,18 4,16.21 4,14Z",
  timer: "M12,20A7,7 0 0,1 5,13A7,7 0 0,1 12,6A7,7 0 0,1 19,13A7,7 0 0,1 12,20M19.03,7.39L20.45,5.97C20,5.46 19.55,5 19.04,4.56L17.62,6C16.07,4.74 14.12,4 12,4A9,9 0 0,0 3,13A9,9 0 0,0 12,22C17,22 21,17.97 21,13C21,10.88 20.26,8.93 19.03,7.39M11,14H13V8H11M15,1H9V3H15V1Z",
  network: "M13,19H14A1,1 0 0,1 15,20H22V22H15A1,1 0 0,1 14,23H10A1,1 0 0,1 9,22H2V20H9A1,1 0 0,1 10,19H11V17H4A1,1 0 0,1 3,16V12A1,1 0 0,1 4,11H20A1,1 0 0,1 21,12V16A1,1 0 0,1 20,17H13V19M4,3H20A1,1 0 0,1 21,4V8A1,1 0 0,1 20,9H4A1,1 0 0,1 3,8V4A1,1 0 0,1 4,3M9,7H10V5H9V7M9,15H10V13H9V15M5,5V7H7V5H5M5,13V15H7V13H5Z",
};

const STRINGS = {
  en: {
    cpu: "CPU",
    ram: "RAM",
    temperature: "Temp.",
    network: "Network",
    storage: "Storage",
    volumes: "Volumes",
    disks: "Disks",
    fans: "Fans",
    uptime: "Uptime:",
    download: "Download",
    upload: "Upload",
    used: "used",
    of: "of",
    hours: "h",
    days: "d",
    minutes: "min",
    no_nas: "No UGREEN NAS entities found. Is the UGREEN NAS integration installed?",
    unknown_nas: "NAS not found",
    status_ok: "Normal",
    cpu_fan: "CPU fan",
    device_fan: "Fan",
    // Editor
    nas: "NAS (UGREEN NAS integration device)",
    title: "Title (optional, defaults to the NAS name)",
    show_image: "Show NAS picture",
    show_system: "Show system (CPU, RAM, temperature)",
    show_network: "Show network",
    show_volumes: "Show volumes",
    show_disks: "Show disks",
    show_fans: "Show fans",
    show_storage: "Show storage",
    language: "Language",
    lang_auto: "Automatic",
  },
  fr: {
    cpu: "CPU",
    ram: "RAM",
    temperature: "Temp.",
    network: "Réseau",
    storage: "Stockage",
    volumes: "Volumes",
    disks: "Disques",
    fans: "Ventilateurs",
    uptime: "Allumé depuis",
    download: "Réception",
    upload: "Envoi",
    used: "utilisés",
    of: "sur",
    hours: "h",
    days: "j",
    minutes: "min",
    no_nas: "Aucune entité UGREEN NAS trouvée. L'intégration UGREEN NAS est-elle installée ?",
    unknown_nas: "NAS introuvable",
    status_ok: "Normal",
    cpu_fan: "Ventilateur CPU",
    device_fan: "Ventilateur",
    nas: "NAS (appareil de l'intégration UGREEN NAS)",
    title: "Titre (facultatif, nom du NAS par défaut)",
    show_image: "Afficher la photo du NAS",
    show_system: "Afficher le système (CPU, RAM, température)",
    show_network: "Afficher le réseau",
    show_volumes: "Afficher les volumes",
    show_disks: "Afficher les disques",
    show_fans: "Afficher les ventilateurs",
    show_storage: "Afficher le stockage",
    language: "Langue",
    lang_auto: "Automatique",
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const esc = (v) =>
  String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

const lang = (hass, config) => {
  const l = (config?.language) || (hass && (hass.locale?.language || hass.language)) || "en";
  return STRINGS[l] ? l : STRINGS[l.split("-")[0]] ? l.split("-")[0] : "en";
};

const t = (hass, config, key) => STRINGS[lang(hass, config)][key] ?? STRINGS.en[key] ?? key;

const num = (s) => {
  if (!s) return null;
  const v = parseFloat(s.state);
  return Number.isFinite(v) ? v : null;
};

const UNIT_FACTORS = { B: 1, KB: 1024, MB: 1024 ** 2, GB: 1024 ** 3, TB: 1024 ** 4, PB: 1024 ** 5 };

const toBytes = (s) => {
  const v = num(s);
  if (v === null) return null;
  const unit = String(s.attributes.unit_of_measurement || "B").toUpperCase().replace("IB", "B");
  return v * (UNIT_FACTORS[unit] ?? 1);
};

const fmtBytes = (b) => {
  if (b === null || b === undefined) return "—";
  const units = ["B", "KB", "MB", "GB", "TB", "PB"];
  let i = 0;
  while (b >= 1024 && i < units.length - 1) {
    b /= 1024;
    i++;
  }
  const v = b >= 100 || i === 0 ? b.toFixed(0) : b.toFixed(b >= 10 ? 1 : 2);
  return `${v.includes(".") ? v.replace(/\.?0+$/, "") : v} ${units[i]}`;
};

// Rate in B/s from a sensor, whatever unit it is displayed in (the integration reports B/s, but the
// unit can be changed in Home Assistant).
const RATE_FACTORS = {
  "b/s": 1, "bit/s": 1 / 8, "kbit/s": 125, "mbit/s": 125e3, "gbit/s": 125e6,
  "kb/s": 1e3, "mb/s": 1e6, "gb/s": 1e9, "kib/s": 1024, "mib/s": 1024 ** 2, "gib/s": 1024 ** 3,
};

const toBps = (s) => {
  const v = num(s);
  if (v === null) return null;
  const unit = String(s.attributes?.unit_of_measurement || "B/s").toLowerCase();
  return v * (RATE_FACTORS[unit] ?? 1);
};

const fmtRate = (bps) => {
  if (bps === null || bps === undefined) return "—";
  const units = ["B/s", "kB/s", "MB/s", "GB/s"];
  let i = 0;
  while (bps >= 1000 && i < units.length - 1) {
    bps /= 1000;
    i++;
  }
  return `${bps >= 100 || i === 0 ? bps.toFixed(0) : bps.toFixed(1)} ${units[i]}`;
};

const fmtUptime = (sec, hass, config) => {
  if (sec === null) return "—";
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (d > 0) return `${d} ${t(hass, config, "days")} ${h} ${t(hass, config, "hours")}`;
  if (h > 0) return `${h} ${t(hass, config, "hours")} ${m} ${t(hass, config, "minutes")}`;
  return `${m} ${t(hass, config, "minutes")}`;
};

const isOk = (s) => !s || /^(normal|ok|good|healthy|on|false)$/i.test(String(s.state));

const level = (v, warn, crit) => (v === null ? "" : v >= crit ? "crit" : v >= warn ? "warn" : "ok");

const svgIcon = (path, cls = "") => `<svg class="icon ${cls}" viewBox="0 0 24 24"><path d="${path}"/></svg>`;

// UGREEN logo. The bottom of the gradient is lightened in dark mode, the original
// near-black end would blend into the card background.
const logo = (dark) => `<svg class="logo" viewBox="31.54 11.44 86.93 129.63" role="img" aria-label="UGREEN">
  <defs><linearGradient id="ug-logo" x1="75" y1="10.18" x2="75" y2="137.54" gradientUnits="userSpaceOnUse">
    <stop offset="0" stop-color="#02f2a6"/><stop offset="1" stop-color="${dark ? "#0b8f5c" : "#001509"}"/>
  </linearGradient></defs>
  <path fill="url(#ug-logo)" d="M36.21,56.43c8.12,16.43,15.61,13.88,24.28,29.62V39.6c0-15.55-12.96-28.15-28.95-28.15v26.39c.26,5.25,.53,10.23,4.67,18.6Zm24.28,78.24v-24.2c.16-12.01-7.13-26.61-16.7-33.75-3.94-3.35-8-6.82-12.25-14.49v37.98c0,19.49,13.67,36.08,32.41,40.86-2.09-1.4-3.45-3.74-3.45-6.39ZM118.46,37.83V11.44c-15.99,0-28.95,12.6-28.95,28.15v46.45c4.25-7.68,8.31-11.15,12.26-14.5,9.57-7.12,16.86-21.77,16.7-33.72Zm-32.41,103.22c18.74-4.77,32.41-21.37,32.41-40.86,0,0,0-37.98,0-37.98-4.25,7.67-8.31,11.14-12.25,14.49-9.61,7.16-16.85,21.76-16.7,33.75v24.2c0,2.65-1.37,4.99-3.45,6.39Z"/>
</svg>`;

// ---------------------------------------------------------------------------
// Entity discovery
// ---------------------------------------------------------------------------

// Entity ids end with the sensor key, optionally followed by "_<n>" when Home Assistant
// had to de-duplicate the id (e.g. sensor.ugreen_nas_cpu_usage_2).
const SFX = "(?:_\\d+)?$";
const SCALARS = {
  name: "nas_name",
  model: "nas_model",
  version: "nas_ugos_version",
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
};
const SCALAR_RE = Object.entries(SCALARS).map(([k, key]) => [k, new RegExp(`(?:^|_)${key}${SFX}`)]);
const RE_FAN = new RegExp(`(?:^|_)device_fan_(\\d+)${SFX}`);
const RE_POOL = new RegExp(`(?:^|_)pool_(\\d+)_(label|level|status|total_size|used_size|disk_count)${SFX}`);
const RE_VOLUME = new RegExp(
  `(?:^|_)pool_(\\d+)_volume_(\\d+)_(label|status|health|total_size_raw|used_size_raw|available_size_raw|total_size|used_size|filesystem)${SFX}`
);
const RE_DISK = new RegExp(
  `(?:^|_)pool_(\\d+)_disk_(\\d+)_(label|model|temperature|status|power_on_hours|size|type|slot)${SFX}`
);

const _cache = new Map();

/** List the UGNAS_device_id values present in hass. */
const listNas = (hass) => {
  const ids = new Map();
  for (const s of Object.values(hass.states)) {
    const id = s.attributes?.UGNAS_device_id;
    if (id && !ids.has(id)) ids.set(id, s.attributes.UGNAS_global_id || id);
  }
  return [...ids.entries()].map(([value, label]) => ({ value, label }));
};

// Candidate entity ids: the entities of the integration in the entity registry, cached on the registry
// object (replaced only when it changes), not on hass.states, replaced on every state change. Without a
// registry entry for the integration, every state is a candidate.
const UGNAS_PLATFORM = "ugreen";
let _registry = { entities: null, ids: [] };
const candidateIds = (hass) => {
  if (hass.entities && _registry.entities !== hass.entities) {
    const ids = Object.keys(hass.entities).filter((id) => hass.entities[id]?.platform === UGNAS_PLATFORM);
    _registry = { entities: hass.entities, ids };
  }
  return hass.entities && _registry.ids.length ? _registry.ids : Object.keys(hass.states);
};

// Entity ids carrying UGNAS_device_id right now, re-read from the states on each call. HA leaves the
// attribute out while an entity is unavailable or restored at startup, so the list follows the attribute
// as it goes and comes back, and a result computed while an entity was missing is never reused once it
// is back.
const ugnasIds = (hass) => {
  const states = hass.states;
  return candidateIds(hass)
    .filter((id) => states[id]?.attributes?.UGNAS_device_id)
    .sort();
};

/**
 * Map the entities of one NAS to a structured object of entity ids. The result is cached on the list
 * of UGREEN NAS entity ids that currently carry the attribute, so the regex matching only runs again
 * when that list changes. An empty result (no NAS found) is not cached.
 */
const discover = (hass, nasId) => {
  const all = ugnasIds(hass);
  const key = `${nasId || ""}\n${all.join(",")}`;
  if (_cache.has(key)) return _cache.get(key);
  if (_cache.size > 8) _cache.clear();

  const nas = { scalars: {}, fans: {}, pools: {}, nasId: null };
  const entityIds = all.filter((id) => !nasId || hass.states[id].attributes.UGNAS_device_id === nasId);
  // Prefer the first NAS when none is configured.
  const first = entityIds.length ? hass.states[entityIds[0]].attributes.UGNAS_device_id : null;
  const set = (obj, k, id) => {
    if (!(k in obj)) obj[k] = id;
  };

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
  if (nas.nasId) _cache.set(key, nas);
  return nas;
};

/** Compute used/total bytes of a volume from the raw sensors (fallback to the human ones). */
const volumeUsage = (hass, vol) => {
  const st = (k) => vol[k] && hass.states[vol[k]];
  const total = toBytes(st("total_size_raw")) ?? toBytes(st("total_size"));
  let used = toBytes(st("used_size_raw")) ?? toBytes(st("used_size"));
  const avail = toBytes(st("available_size_raw"));
  if (used === null && total !== null && avail !== null) used = total - avail;
  // Unknown used space: no percentage (shown as "—"), rather than an empty bar at 0 %.
  return { total, used, pct: total && used !== null ? Math.min(100, Math.max(0, (used / total) * 100)) : null };
};

// Same values, compared by identity: used to skip a render when nothing the card shows has changed.
const sameSig = (a, b) => !!a && !!b && a.length === b.length && a.every((v, i) => v === b[i]);

// Patch the shadow DOM in place from the new HTML: nodes whose tag is unchanged are kept, so keyboard
// focus, hover, embedded pictures and CSS transitions survive an update, and only the changed text and
// attributes are written. Rows of a list carry a data-key (their entity or row id) and are matched by it,
// wherever they moved, so a focused row keeps its own data when the list is reordered (a node matched by
// position would be rewritten with the row taking its place, and Enter would act on that row). Nodes
// without a data-key are matched by position.
const patchAttrs = (cur, next) => {
  for (const { name } of [...cur.attributes]) if (!next.hasAttribute(name)) cur.removeAttribute(name);
  for (const { name, value } of next.attributes) if (cur.getAttribute(name) !== value) cur.setAttribute(name, value);
};
const keyOf = (n) => (n.nodeType === 1 ? n.getAttribute("data-key") : null);
const sameNode = (a, b) => !!a && a.nodeType === b.nodeType && a.nodeName === b.nodeName;
// Moves a kept node. moveBefore (where supported) keeps its focus; insertBefore drops it, which is safe:
// Enter then does nothing rather than act on another row.
const place = (parent, node, ref) => {
  if (node === ref) return;
  try {
    if (parent.moveBefore && node.parentNode === parent) return parent.moveBefore(node, ref);
  } catch (_e) {
    /* fall back to insertBefore */
  }
  parent.insertBefore(node, ref);
};
const patchChildren = (cur, next) => {
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
const morph = (root, html) => {
  const tpl = document.createElement("template");
  tpl.innerHTML = html;
  patchChildren(root, tpl.content);
};

const fireMoreInfo = (node, entityId) => {
  if (!entityId) return;
  node.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId }, bubbles: true, composed: true }));
};

// ---------------------------------------------------------------------------
// Shared styles
// ---------------------------------------------------------------------------

const BASE_STYLE = `
  :host { --ug-green: #00b46e; --ug-ok: var(--success-color, #43a047); --ug-warn: var(--warning-color, #ffa600); --ug-crit: var(--error-color, #db4437); }
  ha-card { overflow: hidden; }
  .icon { width: 18px; height: 18px; fill: currentColor; flex: none; }
  .muted { color: var(--secondary-text-color); }
  .clickable { cursor: pointer; }
  [role="button"]:focus-visible { outline: 2px solid var(--primary-color, #03a9f4); outline-offset: 2px; }
  .ok { --c: var(--ug-ok); } .warn { --c: var(--ug-warn); } .crit { --c: var(--ug-crit); }
  .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--c, var(--ug-ok)); flex: none; display: inline-block; }
  .chip { display: inline-flex; align-items: center; gap: 4px; padding: 1px 8px; border-radius: 12px; font-size: 11px; font-weight: 500;
          background: color-mix(in srgb, var(--c, var(--ug-ok)) 15%, transparent); color: var(--c, var(--ug-ok)); }
  .bar { height: 4px; border-radius: 3px; background: var(--divider-color, rgba(127,127,127,.25)); overflow: hidden; }
  .bar > div { height: 100%; border-radius: 3px; background: var(--c, var(--ug-green)); transition: width .6s ease; }
  .header { display: flex; align-items: center; gap: 10px; padding: 12px 12px 4px; }
  .titles { flex: 1; min-width: 0; }
  .logo { height: 40px; width: auto; flex: none; align-self: flex-start; }
  .name { font-size: 16px; font-weight: 500; line-height: 1.25; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .sub { font-size: 12px; color: var(--secondary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .warning { padding: 16px; color: var(--ug-warn); }
`;

class UgreenNasBase extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._html = "";
    this.shadowRoot.addEventListener("click", (ev) => {
      const el = ev.composedPath().find((n) => n.dataset?.entity);
      if (el) fireMoreInfo(this, el.dataset.entity);
    });
    // Keyboard access: Enter or Space on a focusable non-button element acts as a click.
    this.shadowRoot.addEventListener("keydown", (ev) => {
      if ((ev.key === "Enter" || ev.key === " ") && ev.target.getAttribute?.("role") === "button") {
        ev.preventDefault();
        ev.target.click();
      }
    });
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._config) return;
    // Render only when a state the card shows has changed, not on every state change of Home Assistant.
    const sig = this._signature();
    if (sameSig(sig, this._sig)) return;
    this._update(sig);
  }

  get hass() {
    return this._hass;
  }

  setConfig(config) {
    if (!config) throw new Error("Invalid configuration");
    this._config = { ...config };
    this._html = "";
    this._update();
  }

  // Server status as shown: the integration's "Normal" goes through the translations, any other
  // value is shown as reported.
  _statusText(status) {
    return /^normal$/i.test(String(status.state)) ? this._t("status_ok") : status.state;
  }

  _t(key) {
    return t(this._hass, this._config, key);
  }

  _s(id) {
    return id ? this._hass.states[id] : undefined;
  }

  // What the render depends on: language, dark mode and the states of the NAS entities.
  _signature() {
    const h = this._hass;
    const sig = [h.language, h.locale?.language, h.themes?.darkMode];
    const nas = discover(h, this._config.nas);
    sig.push(nas);
    if (!nas.nasId) return sig;
    const walk = (o) => {
      for (const v of Object.values(o)) {
        if (typeof v === "string") sig.push(h.states[v]);
        else if (v && typeof v === "object") walk(v);
      }
    };
    walk(nas.scalars);
    walk(nas.fans);
    walk(nas.pools);
    return sig;
  }

  _update(sig) {
    if (!this._hass || !this._config) return;
    this._sig = sig ?? this._signature();
    const html = this._render();
    if (html !== this._html) {
      this._html = html;
      morph(this.shadowRoot, html);
    }
  }

  _header(nas) {
    const sc = nas.scalars;
    const c = this._config;
    const status = this._s(sc.server_status);
    const ok = isOk(status);
    const name = c.title || this._s(sc.name)?.state || "UGREEN NAS";
    const model = this._s(sc.model)?.state;
    const version = this._s(sc.version)?.state;
    const sub = [model, version ? `UGOS ${version}` : null].filter(Boolean).join(" · ");
    return `
      <div class="header">
        ${logo(this._hass.themes?.darkMode)}
        <div class="titles">
          <div class="name">${esc(name)}</div>
          <div class="sub">${esc(sub)}</div>
          ${
            status
              ? `<span class="chip clickable ${ok ? "ok" : "warn"}" role="button" tabindex="0" data-entity="${status.entity_id}" title="${esc(
                  this._s(sc.system_message)?.state || ""
                )}"><span class="dot"></span>${esc(this._statusText(status))}</span>`
              : ""
          }
        </div>
        ${c.show_image !== false ? `<img class="nas" src="${IMG_NAS}" alt="NAS">` : ""}
      </div>`;
  }

  _noNas() {
    return `<style>${BASE_STYLE}</style><ha-card><div class="warning">${esc(
      this._config.nas ? `${this._t("unknown_nas")}: ${this._config.nas}` : this._t("no_nas")
    )}</div></ha-card>`;
  }
}

// ---------------------------------------------------------------------------
// Full card
// ---------------------------------------------------------------------------

const ring = (pct, cls) => {
  const r = 26;
  const c = 2 * Math.PI * r;
  const p = pct === null ? 0 : Math.max(0, Math.min(100, pct));
  return `<svg class="ring ${cls}" viewBox="0 0 64 64">
    <circle cx="32" cy="32" r="${r}" class="track"/>
    <circle cx="32" cy="32" r="${r}" class="value" stroke-dasharray="${((p / 100) * c).toFixed(1)} ${c.toFixed(1)}"/>
  </svg>`;
};

const FULL_STYLE = `
  .nas { height: 48px; width: auto; flex: none; max-width: 40%; object-fit: contain; filter: drop-shadow(0 4px 6px rgba(0,0,0,.25)); }
  .titles .chip { margin-top: 4px; }
  .content { padding: 0 12px 12px; display: flex; flex-direction: column; gap: 12px; }
  .section-title { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 500; text-transform: uppercase;
                   letter-spacing: .04em; color: var(--secondary-text-color); margin-bottom: 6px; }
  .section-title .icon { width: 16px; height: 16px; }
  .gauges { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
  .gauge { display: flex; flex-direction: column; align-items: center; position: relative; }
  .ring { width: 60px; height: 60px; transform: rotate(-90deg); }
  .ring circle { fill: none; stroke-width: 6; }
  .ring .track { stroke: var(--divider-color, rgba(127,127,127,.25)); }
  .ring .value { stroke: var(--c, var(--ug-green)); stroke-linecap: round; transition: stroke-dasharray .6s ease; }
  .gauge .val { position: absolute; top: 0; height: 60px; display: flex; flex-direction: column; align-items: center; justify-content: center; }
  .gauge .val b { font-size: 14px; font-weight: 500; }
  .gauge .val .icon { width: 12px; height: 12px; color: var(--secondary-text-color); }
  .gauge .lbl { font-size: 12px; color: var(--secondary-text-color); margin-top: 0; text-align: center; }
  .facts { display: flex; flex-wrap: wrap; gap: 4px 12px; font-size: 12px; margin-top: 6px; }
  .facts > span { display: inline-flex; align-items: center; gap: 4px; }
  .facts .icon { width: 14px; height: 14px; color: var(--secondary-text-color); }
  .net { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; }
  .tile { display: flex; align-items: center; gap: 8px; padding: 6px 10px; border-radius: 10px;
          background: var(--secondary-background-color, rgba(127,127,127,.08)); }
  .tile .icon { color: var(--c, var(--ug-green)); }
  .tile .k { font-size: 11px; color: var(--secondary-text-color); }
  .tile .v { font-size: 14px; font-weight: 500; }
  .tile.up { --c: var(--info-color, #039be5); }
  .tile.down { --c: var(--ug-green); }
  .vol { margin-bottom: 8px; display: grid; grid-template-columns: minmax(0, 1fr) auto; column-gap: 8px; align-items: center; }
  .vol .row { grid-column: 1; grid-row: 1; }
  .vol:last-child { margin-bottom: 0; }
  .row { display: flex; align-items: center; gap: 8px; font-size: 13px; }
  .row .grow { flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .row .tag { font-size: 11px; padding: 1px 6px; border-radius: 6px; background: var(--secondary-background-color, rgba(127,127,127,.12));
              color: var(--secondary-text-color); text-transform: uppercase; }
  .vol .bar { margin: 4px 0 0; grid-column: 1 / -1; grid-row: 2; }
  .vol .detail { font-size: 11px; color: var(--secondary-text-color); display: flex; justify-content: flex-end; grid-column: 2; grid-row: 1; gap: 8px; }
  .disks { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 6px; }
  .disk { padding: 6px 8px; border-radius: 10px; background: var(--secondary-background-color, rgba(127,127,127,.08)); min-width: 0; }
  .disk .top { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 500; }
  .disk .top span:nth-child(2) { flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .disk .model { font-size: 11px; color: var(--secondary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin: 0 0 2px; }
  .disk .meta { display: flex; justify-content: space-between; font-size: 11px; }
  .disk .temp { color: var(--c, inherit); font-weight: 500; }
  .fans { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 6px; }
  .spin { animation: spin 1.6s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  @media (prefers-reduced-motion: reduce) { .spin { animation: none; } }
`;

class UgreenNasCard extends UgreenNasBase {
  static getConfigElement() {
    return document.createElement("ugreen-nas-card-editor");
  }

  static getStubConfig(hass) {
    const nas = hass ? listNas(hass)[0] : null;
    return nas ? { nas: nas.value } : {};
  }

  getCardSize() {
    return 8;
  }

  getGridOptions() {
    return { columns: 12, min_columns: 6 };
  }

  _render() {
    const nas = discover(this._hass, this._config.nas);
    if (!nas.nasId) return this._noNas();
    const c = this._config;
    const parts = [];
    if (c.show_system !== false) parts.push(this._system(nas));
    if (c.show_network !== false) parts.push(this._network(nas));
    if (c.show_volumes !== false) parts.push(this._volumes(nas));
    if (c.show_disks !== false) parts.push(this._disks(nas));
    if (c.show_fans !== false) parts.push(this._fans(nas));
    return `<style>${BASE_STYLE}${FULL_STYLE}</style>
      <ha-card>
        ${this._header(nas)}
        <div class="content">${parts.filter(Boolean).join("")}</div>
      </ha-card>`;
  }

  _gauge(id, label, icon, value, display, cls) {
    return `<div class="gauge clickable ${cls}" role="button" tabindex="0" data-entity="${id || ""}">
      ${ring(value, cls)}
      <div class="val">${svgIcon(icon)}<b>${display}</b></div>
      <div class="lbl">${label}</div>
    </div>`;
  }

  _system(nas) {
    const sc = nas.scalars;
    const cpu = num(this._s(sc.cpu_usage));
    const ram = num(this._s(sc.ram_usage));
    const temp = num(this._s(sc.cpu_temp));
    const ramUsed = toBytes(this._s(sc.ram_used));
    const ramTotal = toBytes(this._s(sc.ram_total));
    const ramLabel =
      ramUsed !== null && ramTotal !== null
        ? `${this._t("ram")} · ${fmtBytes(ramUsed).split(" ")[0]} / ${fmtBytes(ramTotal)}`
        : this._t("ram");
    const runtime = num(this._s(sc.runtime));
    const facts = [];
    if (runtime !== null)
      facts.push(
        `<span class="clickable" role="button" tabindex="0" data-entity="${sc.runtime}">${svgIcon(ICONS.timer)}${this._t("uptime")} ${fmtUptime(
          runtime,
          this._hass,
          this._config
        )}</span>`
      );
    const cpuModel = this._s(sc.cpu_model)?.state;
    if (cpuModel) facts.push(`<span>${svgIcon(ICONS.cpu)}${esc(cpuModel.replace(/\(R\)|\(TM\)/g, ""))}</span>`);
    return `<div>
      <div class="gauges">
        ${this._gauge(sc.cpu_usage, this._t("cpu"), ICONS.cpu, cpu, cpu === null ? "—" : `${Math.round(cpu)}%`, level(cpu, 70, 90))}
        ${this._gauge(sc.ram_usage, ramLabel, ICONS.ram, ram, ram === null ? "—" : `${Math.round(ram)}%`, level(ram, 80, 95))}
        ${this._gauge(
          sc.cpu_temp,
          `${this._t("temperature")} ${this._t("cpu")}`,
          ICONS.temp,
          temp,
          temp === null ? "—" : `${Math.round(temp)}°C`,
          level(temp, 75, 90)
        )}
      </div>
      ${facts.length ? `<div class="facts">${facts.join("")}</div>` : ""}
    </div>`;
  }

  _network(nas) {
    const sc = nas.scalars;
    if (!sc.lan_down && !sc.lan_up) return "";
    const tile = (id, cls, icon, k) =>
      `<div class="tile clickable ${cls}" role="button" tabindex="0" data-entity="${id || ""}">${svgIcon(icon)}<div><div class="k">${k}</div><div class="v">${fmtRate(
        toBps(this._s(id))
      )}</div></div></div>`;
    return `<div>
      <div class="section-title">${svgIcon(ICONS.network)}${this._t("network")}</div>
      <div class="net">
        ${tile(sc.lan_down, "down", ICONS.down, this._t("download"))}
        ${tile(sc.lan_up, "up", ICONS.up, this._t("upload"))}
      </div>
    </div>`;
  }

  _volumes(nas) {
    const rows = [];
    // Volume numbers start again in each pool: with several pools, the fallback name carries the pool number.
    const multi = Object.keys(nas.pools).length > 1;
    for (const [pn, pool] of Object.entries(nas.pools)) {
      const raid = this._s(pool.level)?.state;
      for (const [vn, vol] of Object.entries(pool.volumes)) {
        const u = volumeUsage(this._hass, vol);
        const status = this._s(vol.status) || this._s(vol.health);
        const label = this._s(vol.label)?.state || `Volume ${multi ? `${pn}-${vn}` : vn}`;
        const fs = this._s(vol.filesystem)?.state;
        const cls = level(u.pct, 80, 90);
        rows.push(`<div class="vol clickable ${cls}" role="button" tabindex="0" data-key="${pn}-${vn}" data-entity="${vol.used_size_raw || vol.used_size || ""}">
          <div class="row">
            <span class="dot ${isOk(status) ? "ok" : "crit"}"></span>
            <span class="grow">${esc(label)}</span>
            ${raid ? `<span class="tag">${esc(raid)}</span>` : ""}
            ${fs ? `<span class="tag">${esc(fs)}</span>` : ""}
          </div>
          <div class="bar"><div style="width:${u.pct ?? 0}%"></div></div>
          <div class="detail">
            <span>${fmtBytes(u.used)} ${this._t("used")} ${this._t("of")} ${fmtBytes(u.total)}</span>
            <span>${u.pct === null ? "" : `${u.pct.toFixed(0)}%`}</span>
          </div>
        </div>`);
      }
    }
    if (!rows.length) return "";
    return `<div><div class="section-title">${svgIcon(ICONS.database)}${this._t("volumes")}</div>${rows.join("")}</div>`;
  }

  _disks(nas) {
    const items = [];
    for (const [pn, pool] of Object.entries(nas.pools)) {
      for (const [dn, d] of Object.entries(pool.disks)) {
        const status = this._s(d.status);
        const temp = num(this._s(d.temperature));
        const hours = num(this._s(d.power_on_hours));
        const size = toBytes(this._s(d.size));
        items.push(`<div class="disk clickable" role="button" tabindex="0" data-key="${pn}-${dn}" data-entity="${d.temperature || d.status || ""}">
          <div class="top">${svgIcon(ICONS.disk)}<span>${esc(this._s(d.label)?.state || `Disk ${dn}`)}</span>
            <span class="dot ${isOk(status) ? "ok" : "crit"}" title="${esc(status?.state || "")}"></span></div>
          <div class="model">${esc(this._s(d.model)?.state || "")}</div>
          <div class="meta">
            <span class="temp ${level(temp, 60, 70)}">${temp === null ? "—" : `${Math.round(temp)}°C`}</span>
            <span class="muted">${size !== null ? fmtBytes(size) : ""}${
              hours !== null ? ` · ${Math.round(hours).toLocaleString(lang(this._hass, this._config))} ${this._t("hours")}` : ""
            }</span>
          </div>
        </div>`);
      }
    }
    if (!items.length) return "";
    return `<div><div class="section-title">${svgIcon(ICONS.disk)}${this._t("disks")}</div><div class="disks">${items.join(
      ""
    )}</div></div>`;
  }

  _fans(nas) {
    const sc = nas.scalars;
    const fans = [];
    if (sc.cpu_fan) fans.push([sc.cpu_fan, this._t("cpu_fan")]);
    for (const [n, id] of Object.entries(nas.fans)) fans.push([id, `${this._t("device_fan")} ${n}`]);
    if (!fans.length) return "";
    const tiles = fans.map(([id, label]) => {
      const rpm = num(this._s(id));
      return `<div class="tile clickable" role="button" tabindex="0" data-key="${id}" data-entity="${id}">${svgIcon(ICONS.fan, rpm ? "spin" : "")}<div><div class="k">${esc(
        label
      )}</div><div class="v">${rpm === null ? "—" : `${Math.round(rpm)} rpm`}</div></div></div>`;
    });
    return `<div><div class="section-title">${svgIcon(ICONS.fan)}${this._t("fans")}</div><div class="fans">${tiles.join(
      ""
    )}</div></div>`;
  }
}

// ---------------------------------------------------------------------------
// Mini card
// ---------------------------------------------------------------------------

const MINI_STYLE = `
  .header { padding: 12px 12px 4px; }
  .logo { height: 32px; }
  .nas { height: 44px; width: auto; flex: none; max-width: 35%; object-fit: contain; }
  .titles .chip { display: none; }
  .name { font-size: 16px; }
  .content { padding: 4px 12px 12px; display: flex; flex-direction: column; gap: 8px; }
  .metric { display: grid; grid-template-columns: 18px 64px 1fr 56px; align-items: center; gap: 8px; font-size: 13px; }
  .metric .icon { color: var(--secondary-text-color); }
  .metric .v { text-align: right; font-weight: 500; }
  .foot { display: flex; justify-content: space-between; align-items: center; gap: 8px; font-size: 12px; color: var(--secondary-text-color); margin-top: 2px; }
  .foot span { display: inline-flex; align-items: center; gap: 2px; }
  .foot .icon { width: 14px; height: 14px; }
`;

class UgreenNasMiniCard extends UgreenNasBase {
  static getConfigElement() {
    return document.createElement("ugreen-nas-mini-card-editor");
  }

  static getStubConfig(hass) {
    return UgreenNasCard.getStubConfig(hass);
  }

  getCardSize() {
    return 3;
  }

  getGridOptions() {
    return { columns: 6, min_columns: 6 };
  }

  _metric(id, icon, label, pct, display, cls) {
    return `<div class="metric clickable ${cls}" role="button" tabindex="0" data-entity="${id || ""}">
      ${svgIcon(icon)}<span>${label}</span>
      <div class="bar"><div style="width:${pct === null ? 0 : Math.max(0, Math.min(100, pct))}%"></div></div>
      <span class="v">${display}</span>
    </div>`;
  }

  _render() {
    const nas = discover(this._hass, this._config.nas);
    if (!nas.nasId) return this._noNas();
    const c = this._config;
    const sc = nas.scalars;
    const status = this._s(sc.server_status);
    const cpu = num(this._s(sc.cpu_usage));
    const ram = num(this._s(sc.ram_usage));
    const temp = num(this._s(sc.cpu_temp));
    const rows = [];
    rows.push(this._metric(sc.cpu_usage, ICONS.cpu, this._t("cpu"), cpu, cpu === null ? "—" : `${Math.round(cpu)}%`, level(cpu, 70, 90)));
    rows.push(this._metric(sc.ram_usage, ICONS.ram, this._t("ram"), ram, ram === null ? "—" : `${Math.round(ram)}%`, level(ram, 80, 95)));
    rows.push(
      this._metric(sc.cpu_temp, ICONS.temp, this._t("temperature"), temp, temp === null ? "—" : `${Math.round(temp)}°C`, level(temp, 75, 90))
    );
    if (c.show_storage !== false) {
      let used = 0;
      let total = 0;
      for (const pool of Object.values(nas.pools))
        for (const vol of Object.values(pool.volumes)) {
          const u = volumeUsage(this._hass, vol);
          // A volume whose used space is unknown is left out of both totals.
          if (u.total && u.used !== null) {
            total += u.total;
            used += u.used;
          }
        }
      if (total) {
        const pct = (used / total) * 100;
        rows.push(this._metric("", ICONS.database, this._t("storage"), pct, `${pct.toFixed(0)}%`, level(pct, 80, 90)));
      }
    }
    const foot = [];
    if (status)
      foot.push(
        `<span class="clickable ${isOk(status) ? "ok" : "warn"}" role="button" tabindex="0" data-key="status" data-entity="${status.entity_id}"><span class="dot"></span>&nbsp;${esc(
          this._statusText(status)
        )}</span>`
      );
    if (c.show_network !== false && (sc.lan_down || sc.lan_up))
      foot.push(
        `<span class="clickable" role="button" tabindex="0" data-key="network" data-entity="${sc.lan_down || ""}">${svgIcon(ICONS.down)}${fmtRate(toBps(this._s(sc.lan_down)))}&nbsp;&nbsp;${svgIcon(
          ICONS.up
        )}${fmtRate(toBps(this._s(sc.lan_up)))}</span>`
      );
    const runtime = num(this._s(sc.runtime));
    if (runtime !== null) foot.push(`<span data-key="uptime">${svgIcon(ICONS.timer)}${fmtUptime(runtime, this._hass, this._config)}</span>`);
    return `<style>${BASE_STYLE}${MINI_STYLE}</style>
      <ha-card>
        ${this._header(nas)}
        <div class="content">
          ${rows.join("")}
          ${foot.length ? `<div class="foot">${foot.join("")}</div>` : ""}
        </div>
      </ha-card>`;
  }
}

// ---------------------------------------------------------------------------
// Visual editors (ha-form)
// ---------------------------------------------------------------------------

class UgreenNasEditorBase extends HTMLElement {
  static get toggles() {
    return [];
  }

  setConfig(config) {
    this._config = { ...config };
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  _schema() {
    const nasOptions = this._hass ? listNas(this._hass) : [];
    const tr = (k) => t(this._hass, this._config, k);
    return [
      {
        name: "nas",
        selector: { select: { mode: "dropdown", custom_value: true, options: nasOptions } },
      },
      { name: "title", selector: { text: {} } },
      {
        type: "grid",
        name: "",
        schema: [
          { name: "show_image", selector: { boolean: {} } },
          ...this.constructor.toggles.map((name) => ({ name, selector: { boolean: {} } })),
        ],
      },
      {
        name: "language",
        selector: {
          select: {
            mode: "dropdown",
            options: [
              { value: "", label: tr("lang_auto") },
              { value: "en", label: "English" },
              { value: "fr", label: "Français" },
            ],
          },
        },
      },
    ];
  }

  _render() {
    if (!this._hass || !this._config) return;
    if (!this._form) {
      this._form = document.createElement("ha-form");
      this._form.computeLabel = (s) => t(this._hass, this._config, s.name);
      this._form.addEventListener("value-changed", (ev) => {
        ev.stopPropagation();
        const config = { ...ev.detail.value };
        for (const [k, v] of Object.entries(config)) {
          // Keep the YAML minimal: drop empty values and toggles left at their default (true).
          if (v === "" || v === undefined || v === null || (k.startsWith("show_") && v === true)) delete config[k];
        }
        this._config = config;
        this.dispatchEvent(new CustomEvent("config-changed", { detail: { config }, bubbles: true, composed: true }));
      });
      this.appendChild(this._form);
    }
    const data = { ...this._config };
    for (const name of ["show_image", ...this.constructor.toggles]) if (data[name] === undefined) data[name] = true;
    if (!data.nas && this._hass) data.nas = listNas(this._hass)[0]?.value;
    this._form.hass = this._hass;
    this._form.data = data;
    this._form.schema = this._schema();
  }
}

class UgreenNasCardEditor extends UgreenNasEditorBase {
  static get toggles() {
    return ["show_system", "show_network", "show_volumes", "show_disks", "show_fans"];
  }
}

class UgreenNasMiniCardEditor extends UgreenNasEditorBase {
  static get toggles() {
    return ["show_storage", "show_network"];
  }
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

const define = (name, cls) => {
  if (!customElements.get(name)) customElements.define(name, cls);
};
define("ugreen-nas-card", UgreenNasCard);
define("ugreen-nas-mini-card", UgreenNasMiniCard);
define("ugreen-nas-card-editor", UgreenNasCardEditor);
define("ugreen-nas-mini-card-editor", UgreenNasMiniCardEditor);

window.customCards = window.customCards || [];
for (const card of [
  {
    type: "ugreen-nas-card",
    name: "UGREEN NAS Card",
    description: "Monitor a UGREEN NAS: CPU, RAM, temperatures, volumes, disks, network and fans.",
  },
  {
    type: "ugreen-nas-mini-card",
    name: "UGREEN NAS Mini Card",
    description: "Compact UGREEN NAS overview: CPU, RAM, temperature, storage and network.",
  },
]) {
  if (!window.customCards.some((c) => c.type === card.type))
    window.customCards.push({ ...card, preview: true, documentationURL: "https://github.com/juju35/ha-ugreen-nas-card" });
}

console.info(
  `%c UGREEN-NAS-CARD %c v${VERSION} `,
  "color: white; background: #00b46e; font-weight: 700;",
  "color: #00b46e; background: white; font-weight: 700;"
);
