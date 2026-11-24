// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
import { NO_VALUE } from "./entity-discovery.js";
import { CHILD_DEVICE_BRANDS, rootDevice } from "./entity-discovery-2.js";
import { STRINGS } from "./i18n/strings.js";

export const esc = (v) =>
  String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

export const lang = (hass, config) => {
  const l = (config?.language) || (hass && (hass.locale?.language || hass.language)) || "en";
  return STRINGS[l] ? l : STRINGS[l.split("-")[0]] ? l.split("-")[0] : "en";
};

// Locale for Intl/toLocale*: Home Assistant's full locale when its base matches the card's resolved language
// (keeps the region, e.g. pt-BR or de-CH), otherwise the resolved language. Home Assistant's "pt" is European
// Portuguese, which Intl would format as Brazilian, so bare "pt" becomes "pt-PT". sr-Latn stays as resolved.
export const fmtLang = (hass, config) => {
  const l = lang(hass, config);
  const ha = hass && (hass.locale?.language || hass.language);
  const loc = ha && ha.split("-")[0] === l ? ha : l;
  return loc === "pt" ? "pt-PT" : loc;
};

export const t = (hass, config, key) => STRINGS[lang(hass, config)][key] ?? STRINGS.en[key] ?? key;

export const num = (s) => {
  if (!s) return null;
  const v = parseFloat(s.state);
  return Number.isFinite(v) ? v : null;
};

// Data sizes follow Home Assistant's UnitOfInformation: kB/MB/GB/TB/PB are decimal (powers of 1000) and
// KiB/MiB/GiB/TiB/PiB binary (powers of 1024), as the frontend converts them. Displayed sizes use the ha-* cards'
// convention: powers of 1024 with binary prefixes (a 6.62 TB volume reads 6.02 TiB).
export const UNIT_FACTORS = {
  b: 1, kb: 1e3, mb: 1e6, gb: 1e9, tb: 1e12, pb: 1e15,
  kib: 1024, mib: 1024 ** 2, gib: 1024 ** 3, tib: 1024 ** 4, pib: 1024 ** 5,
};

export const toBytes = (s) => {
  const v = num(s);
  if (v === null) return null;
  const unit = String(s.attributes?.unit_of_measurement || "B").toLowerCase();
  return v * (UNIT_FACTORS[unit] ?? 1);
};

// Number with `min` to `max` decimals in the card's locale (fmtLang), e.g. "1,5" in French.
export const fmtNum = (v, loc, max, min = 0) =>
  new Intl.NumberFormat(loc || "en", { minimumFractionDigits: min, maximumFractionDigits: max }).format(v);

// Sizes (volumes, disks, RAM) in powers of 1024 with binary prefixes (KiB, MiB, GiB), like the other ha-* cards: up to
// 2 decimals under 10, 1 under 100, none above ("3.8 GiB", "980 MiB", "6.02 TiB").
export const fmtBytes = (b, loc) => {
  if (b === null || b === undefined) return "—";
  const units = ["B", "KiB", "MiB", "GiB", "TiB", "PiB"];
  let i = 0;
  while (b >= 1024 && i < units.length - 1) {
    b /= 1024;
    i++;
  }
  return `${fmtNum(b, loc, b >= 100 || i === 0 ? 0 : b >= 10 ? 1 : 2)} ${units[i]}`;
};

// "used / total" for the RAM gauge: the used figure drops its unit only when both share it
// ("1.5 / 2 GiB", but "800 MiB / 2 GiB").
export const ramPair = (used, total, loc) => {
  const u = fmtBytes(used, loc);
  const tot = fmtBytes(total, loc);
  const [uv, uu] = u.split(" ");
  return uu === tot.split(" ")[1] ? `${uv} / ${tot}` : `${u} / ${tot}`;
};

// Used RAM in bytes, from an explicit "used" sensor first, then from the usage percentage (so that the figure matches
// the gauge), and only then as total minus available. Synology's "available (real)" memory is DSM's free memory, without
// the buffers and the cache that its real usage percentage leaves out: total minus it counts the cache as used, and
// read « 3.5 / 3.8 GiB » beside a 20 % gauge (juju35/ha-nas-card#91).
export const ramUsedBytes = (used, total, avail, pct) => {
  if (used !== null) return used;
  if (total === null) return null;
  if (pct !== null) return (total * pct) / 100;
  return avail !== null ? total - avail : null;
};

// Rate in B/s from a sensor, whatever unit it is displayed in (the integration reports B/s, but the
// unit can be changed in Home Assistant).
export const RATE_FACTORS = {
  "b/s": 1, "bit/s": 1 / 8, "kbit/s": 125, "mbit/s": 125e3, "gbit/s": 125e6,
  "kb/s": 1e3, "mb/s": 1e6, "gb/s": 1e9, "kib/s": 1024, "mib/s": 1024 ** 2, "gib/s": 1024 ** 3,
};

export const toBps = (s) => {
  const v = num(s);
  if (v === null) return null;
  const unit = String(s.attributes?.unit_of_measurement || "B/s").toLowerCase();
  return v * (RATE_FACTORS[unit] ?? 1);
};

export const fmtRate = (bps, loc) => {
  if (bps === null || bps === undefined) return "—";
  const units = ["B/s", "kB/s", "MB/s", "GB/s"];
  let i = 0;
  while (bps >= 1000 && i < units.length - 1) {
    bps /= 1000;
    i++;
  }
  const d = bps >= 100 || i === 0 ? 0 : 1;
  return `${fmtNum(bps, loc, d, d)} ${units[i]}`;
};

export const fmtUptime = (sec, hass, config) => {
  if (sec === null) return "—";
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (d > 0) return `${d} ${t(hass, config, "days")} ${h} ${t(hass, config, "hours")}`;
  if (h > 0) return `${h} ${t(hass, config, "hours")} ${m} ${t(hass, config, "minutes")}`;
  return `${m} ${t(hass, config, "minutes")}`;
};

// Uptime in seconds of a duration sensor, whatever unit it is displayed in (ASUSTOR reports seconds, but Home
// Assistant shows it in days by default).
export const DURATION_FACTORS = { s: 1, sec: 1, min: 60, h: 3600, d: 86400, w: 604800 };
export const durationSeconds = (s) => {
  const v = num(s);
  return v === null ? null : v * (DURATION_FACTORS[String(s.attributes?.unit_of_measurement || "s").toLowerCase()] ?? 1);
};

// Age in seconds of a boot timestamp sensor (Synology "Last boot", QNAP "Uptime").
export const bootAge = (s) => {
  const ts = s && Date.parse(s.state);
  return Number.isFinite(ts) ? Math.max(0, Math.round((Date.now() - ts) / 1000)) : null;
};

// OS line of the subtitle: UGOS comes from its own sensor, the Synology firmware string already
// spells out DSM, and QNAP firmware starts with "h" on QuTS hero.
export const osVersion = (v, brand) =>
  !v ? null : brand === "qnap" ? `${/^h/i.test(v) ? "QuTS hero" : "QTS"} ${v}` : brand === "asustor" ? `ADM ${v}` : v;

export const isOk = (s) => !s || /^(normal|ok|good|healthy|safe|passed|idle|on|false)$/i.test(String(s.state));

// Server status: UGREEN and QNAP report a word, Synology a safety binary sensor (on = issue found).
// An entity without value (NAS offline) is never "ok", whatever the brand.
export const statusOk = (nas, s) => (s && NO_VALUE.has(s.state) ? false : nas.brand === "synology" && s ? String(s.state) === "off" : isOk(s));

export const level = (v, warn, crit) => (v === null ? "" : v >= crit ? "crit" : v >= warn ? "warn" : "ok");

// Default orange (warning) and red (critical) thresholds, in % or °C; `thresholds: { cpu: { warning, critical } }` overrides them.
export const THRESHOLDS = {
  cpu: [70, 90],
  ram: [80, 95],
  temperature: [75, 90],
  disk_temperature: [60, 70],
  volume: [80, 90],
};
export const thresholds = (config, metric) => {
  const set = config?.thresholds?.[metric] || {};
  const pick = (x, d) => (x === "" || x === null || x === undefined || !Number.isFinite(Number(x)) ? d : Number(x));
  return [pick(set.warning, THRESHOLDS[metric][0]), pick(set.critical, THRESHOLDS[metric][1])];
};

// Temperature of a sensor: Home Assistant converts temperature sensors to the unit of its unit system (or the
// one picked for the sensor), so the value is shown in its own unit (`unit_of_measurement`, else Home
// Assistant's temperature unit, else °C) and converted to °C for the thresholds and the gauges.
export const temperature = (s, hass) => {
  const v = num(s);
  if (v === null) return { c: null, text: "—" };
  const unit = String(s.attributes?.unit_of_measurement || hass?.config?.unit_system?.temperature || "°C");
  const c = /^°?F$/i.test(unit) ? ((v - 32) * 5) / 9 : unit === "K" ? v - 273.15 : v;
  return { c, text: `${Math.round(v)}${unit.startsWith("°") ? "" : " "}${esc(unit)}` };
};

// Class of a status dot: no value (unavailable / unknown) is neither healthy nor a problem.
export const dotClass = (s) => (s && NO_VALUE.has(s.state) ? "na" : isOk(s) ? "ok" : "crit");

// RAID state of a storage pool (UGREEN, its 15 UGOS codes as words) or of a Synology volume (DSM's volume status):
// healthy, a background task (sync, rebuild, repair, check, drive added or replaced…: orange), or a failure
// (degraded, crashed, corrupted: red). A known state is translated; any other keeps the integration's own word.
// QNAP's integration reports no RAID state.
export const RAID_STATES = [
  [/^(normal|healthy|good|ok)$/i, "ok", "status_ok"],
  [/degrad/i, "crit", "raid_degraded"],
  [/crash|corrupt|fault|fail|danger|broken|inactive/i, "crit", "raid_crashed"],
  [/rebuild/i, "warn", "raid_rebuilding"],
  [/repair/i, "warn", "raid_repairing"],
  [/sync/i, "warn", "raid_syncing"],
  [/check|scrub|consisten/i, "warn", "raid_checking"],
  [/^(warning|attention|abnormal)$/i, "warn", "status_problem"],
];
export const raidState = (s) => {
  if (!s) return null;
  if (NO_VALUE.has(s.state)) return { cls: "na", key: s.state };
  const word = String(s.state);
  const hit = RAID_STATES.find(([re]) => re.test(word));
  if (hit) return { cls: hit[1], key: hit[2] };
  // Another task in progress (creating, adding or replacing a drive, RAID upgrade…): orange, its own words.
  const raw = word.replace(/_/g, " ");
  return { cls: "warn", raw: raw.charAt(0).toUpperCase() + raw.slice(1) };
};
// Entity of a volume's RAID state: its pool's status (UGREEN), else the volume status of a Synology volume.
export const raidEntity = (nas, pool, vol) => pool.status || (CHILD_DEVICE_BRANDS.has(nas.brand) ? vol.status : undefined);

// Health of a disk: its status and SMART status words, plus the Synology bad sector and remaining life threshold
// binary sensors (on = problem). Any problem turns it red, titled with what is wrong; without any of these
// entities there is no health at all (null: no dot), and without any value it is neutral.
export const diskHealth = (hass, d) => {
  const st = (k) => (d[k] ? hass.states[d[k]] : undefined);
  const words = [st("status"), st("smart")].filter(Boolean);
  const flags = [st("bad_sectors"), st("low_life")].filter(Boolean);
  if (!words.length && !flags.length) return null;
  const problems = [
    ...words.filter((s) => !NO_VALUE.has(s.state) && !isOk(s)).map((s) => s.state),
    ...flags.filter((s) => s.state === "on").map((s) => s.attributes?.friendly_name || s.entity_id),
  ];
  if (problems.length) return { cls: "crit", title: problems.join(" · ") };
  const known = [...words, ...flags].find((s) => !NO_VALUE.has(s.state));
  return known ? { cls: "ok", title: (words.find((s) => !NO_VALUE.has(s.state)) || known).state } : { cls: "na", state: words[0] || flags[0] };
};

export const svgIcon = (path, cls = "") => `<svg class="icon ${cls}" viewBox="0 0 24 24"><path d="${path}"/></svg>`;

// NAS pictures: drawn illustrations, one per brand and form factor, picked from the model reported
// by the integration. Tower: control strip on the left + one tray per bay; each brand keeps its own
// colors (DXP aluminium, DH white, Synology black, QNAP graphite with a copper strip).
export const PALETTES = {
  dxp: { top: "#c9ccd0", bottom: "#7d8288", front: "#2a2d31", tray: "#3a3e44", handle: "#4c5158", mark: "#c9ccd0" },
  dh: { top: "#f2f2f0", bottom: "#d9d9d6", front: "#e6e6e3", tray: "#d0d0cc", handle: "#b5b5b0", mark: "#888" },
  synology: { top: "#45484c", bottom: "#17181a", front: "#101113", tray: "#1e2023", handle: "#34373b", mark: "#6b6f74" },
  qnap: { top: "#3c3f44", bottom: "#1c1e21", front: "#17181b", tray: "#24262a", handle: "#3a3d42", mark: "#8d9196", accent: "#c8a46a" },
};
export const towerSvg = (bays, p) => {
  const tw = 34, gap = 6, strip = 46, pad = 14, h = 150;
  const w = pad + strip + bays * tw + (bays - 1) * gap + pad;
  const { top, bottom, front, tray, handle, mark, accent } = p;
  const c = pad + strip / 2 - 2;
  let trays = "";
  for (let i = 0; i < bays; i++) {
    const x = pad + strip + i * (tw + gap);
    trays += `<rect x="${x}" y="22" width="${tw}" height="${h - 44}" rx="3" fill="${tray}"/><rect x="${x + tw / 2 - 5}" y="${h - 46}" width="10" height="16" rx="2" fill="${handle}"/><circle cx="${x + tw / 2}" cy="32" r="1.6" fill="#43c463"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h + 8}"><defs><linearGradient id="b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient></defs><ellipse cx="${w / 2}" cy="${h + 3}" rx="${w / 2 - 6}" ry="4" opacity=".25"/><rect width="${w}" height="${h}" rx="12" fill="url(#b)"/><rect x="8" y="10" width="${w - 16}" height="${h - 20}" rx="7" fill="${front}"/>${
    accent ? `<rect x="${pad - 3}" y="16" width="3.5" height="${h - 32}" rx="1.75" fill="${accent}"/>` : ""
  }<circle cx="${c}" cy="34" r="7" fill="none" stroke="${mark}" stroke-width="2"/><rect x="${c - 1}" y="26" width="2" height="7" fill="${mark}"/><rect x="${c - 6}" y="56" width="12" height="5" rx="1.5" fill="${handle}"/><rect x="${c - 6}" y="${h - 38}" width="12" height="7" rx="1.5" fill="${handle}"/>${trays}</svg>`;
};
// Rackmount models (Synology RS, QNAP models ending in U): short and wide, with rack ears.
export const rackSvg = (bays, p) => {
  const n = Math.max(2, Math.min(bays, 12)), tw = 16, gap = 4, pad = 10, ear = 13, right = 42, h = 62;
  const w = ear + pad + n * tw + (n - 1) * gap + pad + right + ear;
  const { top, bottom, front, tray, handle, mark, accent } = p;
  const screw = (x, y) => `<circle cx="${x}" cy="${y}" r="2.4" fill="${tray}"/>`;
  let trays = "";
  for (let i = 0; i < n; i++) {
    const x = ear + pad + i * (tw + gap);
    trays += `<rect x="${x}" y="14" width="${tw}" height="${h - 28}" rx="2.5" fill="${tray}"/><rect x="${x + tw / 2 - 4}" y="${h - 24}" width="8" height="6" rx="1.5" fill="${handle}"/><circle cx="${x + tw / 2}" cy="20" r="1.4" fill="#43c463"/>`;
  }
  const c = w - ear - right / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h + 10}"><defs><linearGradient id="b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient></defs><ellipse cx="${w / 2}" cy="${h + 4}" rx="${w / 2 - 8}" ry="3.5" opacity=".25"/><rect x="0" y="6" width="${ear}" height="${h - 12}" rx="2" fill="${bottom}"/><rect x="${w - ear}" y="6" width="${ear}" height="${h - 12}" rx="2" fill="${bottom}"/>${screw(ear / 2, 14)}${screw(ear / 2, h - 14)}${screw(w - ear / 2, 14)}${screw(w - ear / 2, h - 14)}<rect x="${ear}" width="${w - 2 * ear}" height="${h}" rx="6" fill="url(#b)"/><rect x="${ear + 5}" y="6" width="${w - 2 * ear - 10}" height="${h - 12}" rx="4" fill="${front}"/>${
    accent ? `<rect x="${w - ear - right - 3}" y="12" width="3" height="${h - 24}" rx="1.5" fill="${accent}"/>` : ""
  }${trays}<circle cx="${c}" cy="${h / 2 - 8}" r="6" fill="none" stroke="${mark}" stroke-width="2"/><rect x="${c - 1}" y="${h / 2 - 15}" width="2" height="6" fill="${mark}"/><rect x="${c - 6}" y="${h / 2 + 8}" width="12" height="5" rx="1.5" fill="${handle}"/></svg>`;
};
// Flat all-flash NAS (DXP480T / DXP480T Plus) in parallel projection, like the product photos: each face is drawn
// flat in its own coordinates (front: u across, v down; side and top: z in depth) and placed with the same axes,
// so every edge stays parallel. Front axis (1, .03), depth axis (.85, -.06), vertical axis (0, 1).
export const flatSvg = () => {
  const [X0, Y0] = [6, 10];
  const front = `matrix(1 .03 0 1 ${X0} ${Y0})`;
  const side = `matrix(.85 -.06 0 1 ${X0 + 200} ${Y0 + 6})`;
  const top = `matrix(1 .03 .85 -.06 ${X0} ${Y0})`;
  let vents = "";
  for (let i = 0; i < 16; i++) vents += `<rect x="${18 + i * 4.6}" y="9" width="2.2" height="15" rx=".8" fill="#2c2f33"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 104"><defs>\
<linearGradient id="f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b8bcc0"/><stop offset=".5" stop-color="#95999e"/><stop offset="1" stop-color="#72767b"/></linearGradient>\
<linearGradient id="k" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#95999e" stop-opacity="0"/><stop offset=".6" stop-color="#c6c9cd"/><stop offset="1" stop-color="#868a90"/></linearGradient>\
<linearGradient id="s" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7e8288"/><stop offset="1" stop-color="#565a5f"/></linearGradient>\
<linearGradient id="t" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c2c5c9"/><stop offset="1" stop-color="#dadcdf"/></linearGradient>\
<linearGradient id="c" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b9bcc0"/><stop offset="1" stop-color="#989ca1"/></linearGradient></defs>\
<ellipse cx="152" cy="97" rx="146" ry="5" opacity=".28"/>\
<g transform="${front}"><rect x="14" y="77" width="16" height="5" rx="1.5" fill="#111"/><rect x="170" y="77" width="16" height="5" rx="1.5" fill="#111"/></g>\
<g transform="${side}"><rect x="86" y="77" width="10" height="4" rx="1.5" fill="#111"/></g>\
<g transform="${top}"><rect width="200" height="100" rx="6" fill="url(#t)"/></g>\
<g transform="${side}"><rect width="100" height="78" rx="5" fill="url(#s)"/>${vents}</g>\
<g transform="${front}"><rect width="200" height="78" rx="5" fill="url(#f)"/>\
<rect x="184" width="16" height="78" fill="url(#k)"/>\
<rect x="1" y=".5" width="190" height="1.2" fill="#fff" opacity=".35"/>\
<path d="M0 40 H174 Q178 40 178 44 V78 H5 Q0 78 0 73 Z" fill="#141517"/>\
<rect x="6" y="45" width="112" height="30" rx="2" fill="url(#c)"/>\
<text x="62" y="61.5" text-anchor="middle" font-size="4.6" fill="#3a3d41" font-family="Arial, Helvetica, sans-serif" letter-spacing=".2">PROTECT WHAT YOU LOVE</text>\
<rect x="132" y="51" width="30" height="20" rx="5" fill="#26282c" stroke="#3a3d42" stroke-width="1.2"/>\
<circle cx="147" cy="61" r="4.3" fill="none" stroke="#f2f2f2" stroke-width="1.3"/></g></svg>`;
};
// Models offered in the editor; any other model string is matched by its family and bay count
// (DXP<bays>800, DH<bays>300, 480T, Synology DS/RS naming, QNAP TS/TVS/HS naming).
export const NAS_MODELS = {
  ugreen: ["DXP2800", "DXP4800", "DXP4800 Plus", "DXP480T Plus", "DXP6800 Pro", "DXP8800 Plus", "DH2300", "DH4300 Plus"],
  synology: [
    "DS124", "DS223", "DS223j", "DS224+", "DS225+", "DS423", "DS423+", "DS425+", "DS723+", "DS923+", "DS925+",
    "DS1522+", "DS1621+", "DS1821+", "DS1825+", "DS2422+", "RS422+", "RS822+", "RS1221+", "RS2423+",
  ],
  asustor: [
    "AS1002T", "AS1004T", "AS1102T", "AS1102TL", "AS1104T", "AS1202T", "AS1204T", "AS3102T", "AS3104T", "AS3202T",
    "AS3204T", "AS3302T", "AS3304T", "AS4002T", "AS4004T", "AS5002T", "AS5004T", "AS5008T", "AS5010T", "AS5102T",
    "AS5104T", "AS5108T", "AS5110T", "AS5202T", "AS5304T", "AS5402T", "AS5404T", "AS6102T", "AS6104T", "AS6202T",
    "AS6204RD", "AS6204RS", "AS6204T", "AS6208T", "AS6210T", "AS6212RD", "AS6302T", "AS6404T", "AS6504RD", "AS6504RS",
    "AS6508T", "AS6510T", "AS6512RD", "AS6602T", "AS6604T", "AS6702T", "AS6704T", "AS6706T", "AS6804T", "AS6806T",
    "AS6808T", "AS6810T", "AS7004T", "AS7008T", "AS7009RD", "AS7009RDX", "AS7010T", "AS7012RD", "AS7012RDX",
    "AS7110T", "AS7112RDX", "AS7116RDX", "AS7212RDX", "AS7216RDX", "AS7224RDX", "AS-202T", "AS-202TE", "AS-204RS",
    "AS-204T", "AS-204TE", "AS-302T", "AS-304T", "AS-602T", "AS-604RD", "AS-604RS", "AS-606T", "AS-608T", "AS-609RD",
    "AS-609RS", "FS6706T", "FS6712X", "FS6806X", "FS6812X",
  ],
  qnap: [
    "TS-133", "TS-233", "TS-433", "TS-264", "TS-464", "TS-664", "TS-473A", "TS-673A", "TS-873A", "TS-h973AX",
    "TVS-h674", "TVS-h874", "HS-264", "TS-873AeU", "TS-1264U-RP",
  ],
};
// Bay counts from the model names. Synology: the leading digits are not always the bay count
// (DS723+ has 2 bays, DS923+ has 4, DS1522+ has 5), so known families are mapped.
export const synoBays = (m) => {
  const d = m.match(/^(?:DS|DVA|FS)(\d{3,4})/);
  if (!d) return 4;
  const n = d[1];
  if (n.length === 4) return { 15: 5, 16: 6, 18: 8, 24: 12, 36: 12 }[n.slice(0, 2)] ?? 6;
  return { 1: 1, 2: 2, 3: 2, 4: 4, 6: 6, 7: 2, 9: 4 }[n[0]] ?? 4;
};
export const synoRackBays = (m) => {
  const d = m.match(/^RS(\d{3,4})/);
  return d && d[1].length === 4 ? ({ 12: 8, 13: 8 }[d[1].slice(0, 2)] ?? 12) : 4;
};
// QNAP: the digits before the last two are the bay count (TS-233 → 2, TS-873A → 8, TS-1264U → 12).
export const qnapBays = (m) => {
  const d = m.match(/(\d{3,4})/);
  return d ? Math.min(d[1].length === 4 ? +d[1].slice(0, 2) : +d[1][0] || 4, 12) : 4;
};
// ASUSTOR: the last two digits of the four-digit number are the bay count (AS5304T → 4, AS6708T → 8, FS6712X → 12), the
// last digit of an older three-digit one (AS-604RS → 4, AS-609RS → 9); an "R" before the suffix is a rackmount model.
export const asustorBays = (m) => {
  const d = m.match(/(\d{4})/) || m.match(/(\d{3})/);
  return d ? +d[1].slice(2) || 4 : 4;
};
export const brandOfModel = (m) =>
  /^(DXP|DH)\d/.test(m) ? "ugreen" : /^(AS|LS)-?\d{3,4}/.test(m) ? "asustor" : /^(DS|RS|FS|SA|DVA)\d/.test(m) ? "synology" : /^(TS|TVS|TBS|HS|TR)-?\w*\d/.test(m) ? "qnap" : null;
// ASUSTOR drawings, one per product family, after the manufacturer's product photos: Drivestor (closed front with a
// diamond texture, orange mark, blue USB), Drivestor Pro and Nimbustor (glossy black front, control strip with red
// lines), Lockerstor and the older AS50…AS70 ranges (control strip with teal and blue lines, a display from 4 bays,
// vertical trays or two columns of horizontal trays from 8 bays), rackmounts, and the flat Flashstor.
export const asusSvg = (w, h, body, defs = "") =>
  `<svg xmlns="http://www.w3.org/2000/svg" data-nas="asustor" viewBox="0 0 ${w} ${h + 8}"><defs><linearGradient id="b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3b3f47"/><stop offset="1" stop-color="#14161a"/></linearGradient>${defs}</defs><ellipse cx="${w / 2}" cy="${h + 3}" rx="${w / 2 - 6}" ry="4" opacity=".25"/>${body}</svg>`;
export const ASUS = { tray: "#1b1d22", handle: "#30343b", front: "#0e0f12", red: "#d0242e", teal: "#2bb3c0", blue: "#2d6fe0", usb: "#2e7de8", led: "#43c463" };
export const asustorTextured = (bays) => {
  const w = bays <= 2 ? 98 : 150, h = 150;
  const defs = `<pattern id="d" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0H10M0 0V10" stroke="#2c3036" stroke-width="1.2" fill="none"/></pattern>`;
  return asusSvg(
    w, h,
    `<rect width="${w}" height="${h}" rx="10" fill="#17191d"/><rect width="${w}" height="${h}" rx="10" fill="url(#d)"/><rect x="${w - 34}" y="14" width="20" height="4" rx="2" fill="#d9822b"/><rect x="12" y="${h - 24}" width="9" height="5" rx="1.5" fill="${ASUS.usb}"/><rect x="2" y="${h - 8}" width="${w - 4}" height="6" rx="3" fill="${ASUS.front}"/>`,
    defs
  );
};
export const asustorGlossy = (bays) => {
  const n = bays <= 2 ? 2 : 4;
  const w = n === 2 ? 118 : 190, h = 150, s = 22, x0 = s + 16, gap = 4;
  const px = x0, pw = w - 12 - x0, tw = (pw - (n - 1) * gap) / n;
  let leds = "";
  for (let i = 0; i < 3; i++) leds += `<circle cx="21" cy="${52 + i * 8}" r="1.4" fill="${ASUS.led}"/>`;
  // One glossy tray per bay, side by side behind the dark front.
  let trays = "";
  for (let i = 0; i < n; i++) {
    const x = px + i * (tw + gap);
    trays += `<rect class="t" x="${x}" y="14" width="${tw}" height="${h - 28}" rx="3" fill="#07080a" stroke="#1d2025" stroke-width="1"/><rect x="${x + tw / 2 - 5}" y="${h - 44}" width="10" height="14" rx="2" fill="#16181c"/>`;
  }
  return asusSvg(
    w, h,
    `<rect width="${w}" height="${h}" rx="12" fill="url(#b)"/><rect x="6" y="6" width="${w - 12}" height="${h - 12}" rx="8" fill="#0b0c0e"/><rect x="10" y="12" width="${s}" height="2" fill="${ASUS.red}"/><rect x="10" y="${h - 14}" width="${s}" height="2" fill="${ASUS.red}"/><circle cx="21" cy="32" r="5" fill="none" stroke="#a3a8b0" stroke-width="1.6"/>${leds}<rect x="16" y="${h - 34}" width="10" height="5" rx="1" fill="${ASUS.usb}"/>${trays}<path d="M${px} 14H${px + pw * 0.55}L${px} ${h * 0.55}Z" fill="#fff" opacity=".06"/><rect x="${w - 40}" y="20" width="22" height="4" rx="2" fill="${ASUS.red}"/>`
  );
};
export const asustorTrays = (n) => {
  n = Math.max(2, Math.min(n, 10));
  const lcd = n >= 4;
  const horiz = n >= 8;
  const h = 150, strip = 40, pad = 12, top = lcd ? 42 : 22, bottom = h - 22;
  const tw = horiz ? 84 : 34, gap = 6;
  const cols = horiz ? 2 : n;
  const w = pad + strip + cols * tw + (cols - 1) * gap + pad;
  let trays = "";
  if (horiz) {
    const rows = n / 2, th = (bottom - top - (rows - 1) * 4) / rows;
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < 2; c++) {
        const x = pad + strip + c * (tw + gap), y = top + r * (th + 4);
        trays += `<rect class="t" x="${x}" y="${y}" width="${tw}" height="${th}" rx="2" fill="${ASUS.tray}"/><rect x="${x + tw - 18}" y="${y + th / 2 - 1.5}" width="11" height="3" rx="1" fill="${ASUS.handle}"/><circle cx="${x + 7}" cy="${y + th / 2}" r="1.3" fill="${ASUS.led}"/>`;
      }
  } else
    for (let i = 0; i < n; i++) {
      const x = pad + strip + i * (tw + gap);
      trays += `<rect class="t" x="${x}" y="${top}" width="${tw}" height="${bottom - top}" rx="3" fill="${ASUS.tray}"/><rect x="${x + tw / 2 - 5}" y="${bottom - 24}" width="10" height="16" rx="2" fill="${ASUS.handle}"/><circle cx="${x + tw / 2}" cy="${top + 10}" r="1.6" fill="${ASUS.led}"/>`;
    }
  const display = lcd
    ? `<rect x="${pad + strip}" y="14" width="${w - pad - strip - pad}" height="20" rx="3" fill="#101a22"/><rect x="${pad + strip + 8}" y="22" width="${Math.min(60, w - pad - strip - 30)}" height="2.4" rx="1" fill="${ASUS.teal}" opacity=".55"/>`
    : "";
  const c = pad + (strip - 10) / 2;
  return asusSvg(
    w, h,
    `<rect width="${w}" height="${h}" rx="12" fill="url(#b)"/><rect x="8" y="10" width="${w - 16}" height="${h - 20}" rx="7" fill="${ASUS.front}"/><rect x="${pad}" y="16" width="${strip - 10}" height="2" fill="${ASUS.teal}"/><rect x="${pad}" y="21" width="${strip - 10}" height="2" fill="${ASUS.blue}"/><circle cx="${c}" cy="46" r="5" fill="none" stroke="#a3a8b0" stroke-width="1.6"/><rect x="${c - 6}" y="${h - 38}" width="12" height="5" rx="1" fill="${ASUS.usb}"/>${display}${trays}`
  );
};
export const asustorRack = (n) => {
  const cols = n > 4 ? 4 : Math.max(2, n), rows = Math.min(Math.ceil(n / cols), 6);
  const tw = n > 4 ? 38 : 44, th = n > 4 ? 14 : 16, gap = 4, ear = 12, pad = 8, right = 34;
  const h = rows === 1 ? 34 : rows * th + (rows - 1) * gap + 2 * pad;
  const w = ear * 2 + pad * 2 + cols * tw + (cols - 1) * gap + right;
  let trays = "";
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const x = ear + pad + c * (tw + gap), y = (rows === 1 ? (h - th) / 2 : pad) + r * (th + gap);
      trays += `<rect class="t" x="${x}" y="${y}" width="${tw}" height="${th}" rx="2" fill="${ASUS.tray}"/><rect x="${x + tw - 12}" y="${y + th / 2 - 1.2}" width="8" height="2.4" rx="1" fill="${ASUS.handle}"/>`;
    }
  const cx = w - ear - right / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" data-nas="asustor" viewBox="0 0 ${w} ${h + 10}"><defs><linearGradient id="b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3b3f47"/><stop offset="1" stop-color="#14161a"/></linearGradient></defs><ellipse cx="${w / 2}" cy="${h + 4}" rx="${w / 2 - 8}" ry="3.5" opacity=".25"/><rect x="0" y="3" width="${ear}" height="${h - 6}" rx="2" fill="#14161a"/><rect x="${w - ear}" y="3" width="${ear}" height="${h - 6}" rx="2" fill="#14161a"/><rect x="${ear}" width="${w - 2 * ear}" height="${h}" rx="5" fill="url(#b)"/><rect x="${ear + 4}" y="3" width="${w - 2 * ear - 8}" height="${h - 6}" rx="3" fill="${ASUS.front}"/><rect x="${ear + 6}" y="3" width="26" height="2" fill="${ASUS.teal}"/>${trays}<circle cx="${cx}" cy="${h / 2}" r="4.5" fill="none" stroke="#a3a8b0" stroke-width="1.5"/></svg>`;
};
// Flashstor: a flat black box with two panels (the FS6712X is a thin slab on feet), red mark bottom right.
export const asustorSlab = (thin) => {
  if (thin) {
    const w = 260, h = 44;
    return asusSvg(w, h, `<rect x="4" y="6" width="${w - 8}" height="${h - 14}" rx="9" fill="url(#b)"/><rect x="10" y="12" width="${w - 20}" height="${h - 26}" rx="5" fill="${ASUS.front}"/><rect x="${w - 52}" y="${h / 2 - 1}" width="24" height="3" rx="1.5" fill="${ASUS.red}"/><rect x="26" y="${h - 8}" width="22" height="4" rx="2" fill="#0a0b0d"/><rect x="${w - 48}" y="${h - 8}" width="22" height="4" rx="2" fill="#0a0b0d"/>`);
  }
  const w = 190, h = 130;
  let vents = "";
  for (let i = 0; i < 9; i++) vents += `<rect x="${w / 2 + 10 + i * 8}" y="14" width="1.4" height="${h - 40}" fill="#fff" opacity=".07"/>`;
  return asusSvg(w, h, `<rect width="${w}" height="${h}" rx="9" fill="url(#b)"/><rect x="7" y="7" width="${w / 2 - 10}" height="${h - 14}" rx="4" fill="${ASUS.front}"/><rect x="${w / 2 + 3}" y="7" width="${w / 2 - 10}" height="${h - 14}" rx="4" fill="#121316"/>${vents}<circle cx="20" cy="${h - 18}" r="1.4" fill="#cfd3d8"/><circle cx="27" cy="${h - 18}" r="1.4" fill="#cfd3d8"/><circle cx="34" cy="${h - 18}" r="1.4" fill="#cfd3d8"/><circle cx="41" cy="${h - 18}" r="1.4" fill="#cfd3d8"/><rect x="${w - 36}" y="${h - 20}" width="22" height="4" rx="2" fill="${ASUS.red}"/>`);
};
export const asustorSvg = (m) => {
  const n = asustorBays(m);
  if (/^FS/.test(m)) return asustorSlab(/^FS6712/.test(m));
  if (/\d{3,4}R/.test(m)) return asustorRack(n);
  if (/^AS(10|11|12|31|32)\d{2}/.test(m)) return asustorTextured(n);
  if (/^AS(33|40|52|53|54)\d{2}/.test(m)) return asustorGlossy(n);
  return asustorTrays(n);
};
export const nasSvg = (model, brand) => {
  const m = String(model || "").toUpperCase().replace(/\s+/g, "");
  // FS is both a Synology and an ASUSTOR prefix (FS6706T): the discovered brand decides.
  const b = (/^FS\d/.test(m) && brand === "asustor" ? "asustor" : brandOfModel(m)) || brand || "ugreen";
  if (b === "asustor") return asustorSvg(m);
  if (b === "synology") return /^RS/.test(m) ? rackSvg(synoRackBays(m), PALETTES.synology) : towerSvg(synoBays(m), PALETTES.synology);
  if (b === "qnap") return /U(-RP)?$/.test(m) ? rackSvg(qnapBays(m), PALETTES.qnap) : towerSvg(qnapBays(m), PALETTES.qnap);
  if (/480T/.test(m)) return flatSvg();
  const dh = m.match(/^DH(\d)\d{3}/);
  if (dh) return towerSvg(+dh[1], PALETTES.dh);
  const dxp = m.match(/^DXP(\d)\d{3}/);
  return towerSvg(dxp ? +dxp[1] : 4, PALETTES.dxp);
};
// `image` option: a URL is used as is, anything else is a model name; by default the model reported
// by the integration decides, and the discovered brand backs up an unrecognized model string.
export const nasPicture = (image, model, brand) =>
  /^(https?:|\/|data:)/.test(image || "") ? image : `data:image/svg+xml,${encodeURIComponent(nasSvg(image || model, brand))}`;

export const BRAND_NAMES = { ugreen: "UGREEN", synology: "Synology", qnap: "QNAP", asustor: "ASUSTOR" };
export const BRAND_SITES = { ugreen: "https://nas.ugreen.com", synology: "https://www.synology.com", qnap: "https://www.qnap.com", asustor: "https://www.asustor.com" };
// Only web addresses become links (a configuration_url can also be a homeassistant:// path).
export const webUrl = (u) => (/^https?:\/\//i.test(String(u || "").trim()) ? String(u).trim() : null);
// The NAS web interface: the configuration_url of the NAS device in the device registry (set by the
// UGREEN NAS and Synology DSM integrations, the "Visit" link of the device page), found from any of
// its entities through the device's root (pools, volumes and disks are child devices).
export const deviceUrl = (hass, nas) => {
  if (nas.info?.url) return webUrl(nas.info.url);
  const id = Object.values(nas.scalars)[0];
  const deviceId = id && hass.entities?.[id]?.device_id;
  return deviceId ? webUrl(rootDevice(hass, deviceId, hass.entities[id].platform)?.configuration_url) : null;
};
// Picture choices of the editor: sorted by brand, then by model (numbers in natural order), each
// label prefixed with its brand; the value stays the bare model name.
export const modelOptions = () =>
  Object.keys(NAS_MODELS)
    .sort((a, b) => BRAND_NAMES[a].localeCompare(BRAND_NAMES[b], "en", { sensitivity: "base" }))
    .flatMap((b) =>
      [...NAS_MODELS[b]]
        .sort((x, y) => x.localeCompare(y, "en", { numeric: true, sensitivity: "base" }))
        .map((m) => ({ value: m, label: `${BRAND_NAMES[b]} ${m}` }))
    );
// Header icon: the round NAS icon of the project page on the showcase site, in the status colour.
export const NAS_ICON = "M4,5C2.89,5 2,5.89 2,7V17C2,18.11 2.89,19 4,19H20C21.11,19 22,18.11 22,17V7C22,5.89 21.11,5 20,5H4M4.5,7A1,1 0 0,1 5.5,8A1,1 0 0,1 4.5,9A1,1 0 0,1 3.5,8A1,1 0 0,1 4.5,7M7,7H20V17H7V7M8,8V16H11V8H8M12,8V16H15V8H12M16,8V16H19V8H16M9,9H10V10H9V9M13,9H14V10H13V9M17,9H18V10H17V9Z";
// Brand logo as a badge on the icon, on a white tile, embedded (no network): the UGREEN mark as SVG, the Synology and
// QNAP marks as 48 px PNG (images/synology.png, images/qnap.png scaled down).
export const BRAND_LOGOS = {
  synology: "data:image/png;base64,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",
  qnap: "data:image/png;base64,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",
};
// ASUSTOR: the mark of the Dashboard Icons collection (images/asustor.svg), embedded like the others.
BRAND_LOGOS.asustor = "data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20width=%22800%22%20height=%22800%22%20viewBox=%220%200%201024%201024%22%3E%3Ccircle%20cx=%22512%22%20cy=%22512%22%20r=%22512%22%20style=%22fill:%230052a4%22/%3E%3Cpath%20d=%22M240.3%20511.7h-16.9c-3%200-6%201.1-8.9%203.1-2.9%202.1-4.5%204.6-5%207.5l-1.4%208.7c-.6%203.9.6%207.5%203.7%2010.6%203%203.2%206.6%204.8%2010.6%204.8h11.9zm32.2-18.8-11.9%2071.4H208c-8.1%200-15-2.8-20.6-8.5-5.6-5.6-8.5-12.5-8.5-20.6%200-1.2.1-2.6.4-4.3l2.2-13.4c4.3-15.4%2013.8-23%2028.4-23h33.7c.7-4.4-.4-8.4-3.4-12.1s-6.7-5.5-11.2-5.5h-32.2l2.8-16.9h44.1c7.8%200%2014.6%202.8%2020.3%208.5%205.7%205.6%208.6%2012.4%208.6%2020.2.1%201.9%200%203.3-.1%204.2m109.9-33.1-3%2016.9h-45.8c-8%200-12.7%203.9-14.1%2011.8l35.8%2021.8q14.1%208.55%2014.1%2024.6c0%209.4-3.5%2017-10.4%2022.6-5.6%204.5-11.9%206.8-18.7%206.8H278l2.8-17.8h45.8c8.2%200%2013.1-4.2%2014.6-12.6l-36.3-20.2c-9.3-5.2-13.9-13.2-13.9-23.9q0-12.9%208.1-21.3c5.4-5.6%2012.4-8.5%2020.9-8.5h62.4zm104.2%200-13.7%2080.8c-1.2%206.5-4.6%2012.1-10.2%2016.7s-11.8%207-18.4%207H416c-8.1%200-15-2.8-20.5-8.2-5.6-5.5-8.3-12.3-8.3-20.4%200-1.6.2-3.3.4-5l11.7-70.8h29L417%20529.5c-.2.9-.3%201.7-.3%202.6%200%204.2%201.4%207.6%204.3%2010.3s6.4%204%2010.6%204c7.8%200%2012.4-4%2013.7-12.1l12-74.5zm99.8%200-3%2016.9H542c-8%200-12.7%203.9-14.1%2011.8l35.8%2021.8q14.1%208.55%2014.1%2024.6c0%209.4-3.5%2017-10.4%2022.6-5.6%204.5-11.9%206.8-18.7%206.8h-62.3l2.8-17.8H535c8.2%200%2013.1-4.2%2014.5-12.6l-36.3-20.2c-9.3-5.2-13.9-13.2-13.9-23.9%200-8.6%202.7-15.7%208.2-21.3%205.4-5.6%2012.4-8.5%2020.9-8.5h58zm79.5%200-3%2016.9h-29.3l-8.6%2052.7c0%20.9-.1%201.7-.1%202.6%200%203.9%201.4%207.3%204.4%2010.1q4.35%204.2%2010.2%204.2h11.7l-2.8%2017.8h-23.7c-8.1%200-15-2.8-20.5-8.5-5.6-5.6-8.4-12.5-8.4-20.6%200-1.8.2-3.5.4-5.2l14.8-87.7h28.6l-2.9%2017.6h29.2zm90.5%208.3c-5.7-5.5-12.5-8.3-20.5-8.3h-28.2c-6.8%200-13%202.1-18.5%206.2-5.5%204.2-8.8%209.6-10%2016.3l-7.8%2047.5c-.3%201.7-.4%203.5-.4%205.2%200%208.1%202.8%2015%208.4%2020.6s12.4%208.5%2020.5%208.5h27.8c6.9%200%2013.2-2.4%2018.8-7.2s8.9-10.6%2010.1-17.4l8-46.2c.3-1.6.5-3.3.5-5.2-.1-7.8-3-14.5-8.7-20m-12.3%2025.2-6.9%2040.6c-1.4%208.4-6.3%2012.6-14.4%2012.6-4.1%200-7.5-1.3-10.3-3.9s-3.8-5.8-3.8-9.9c0-.9.3-3%20.3-3l6.7-40.6c1.3-8%205.8-12%2013.4-12%204.5%200%2010.3.7%2013.5%203.8%203.1%203.2%202.2%207.9%201.5%2012.4m101-33.5-2.9%2016.9h-17q-12.45%200-14.4%2012.3L799%20564.3h-28.8l13.2-81.4c1-6.7%204.3-12.3%209.9-16.6s11.8-6.5%2018.6-6.5z%22%20style=%22fill:%23fff%22/%3E%3C/svg%3E";
export const UGREEN_LOGO = `<svg viewBox="31.54 11.44 86.93 129.63"><defs><linearGradient id="ug-logo" x1="75" y1="10.18" x2="75" y2="137.54" gradientUnits="userSpaceOnUse">
  <stop offset="0" stop-color="#02f2a6"/><stop offset="1" stop-color="#001509"/></linearGradient></defs>
  <path fill="url(#ug-logo)" d="M36.21,56.43c8.12,16.43,15.61,13.88,24.28,29.62V39.6c0-15.55-12.96-28.15-28.95-28.15v26.39c.26,5.25,.53,10.23,4.67,18.6Zm24.28,78.24v-24.2c.16-12.01-7.13-26.61-16.7-33.75-3.94-3.35-8-6.82-12.25-14.49v37.98c0,19.49,13.67,36.08,32.41,40.86-2.09-1.4-3.45-3.74-3.45-6.39ZM118.46,37.83V11.44c-15.99,0-28.95,12.6-28.95,28.15v46.45c4.25-7.68,8.31-11.15,12.26-14.5,9.57-7.12,16.86-21.77,16.7-33.72Zm-32.41,103.22c18.74-4.77,32.41-21.37,32.41-40.86,0,0,0-37.98,0-37.98-4.25,7.67-8.31,11.14-12.25,14.49-9.61,7.16-16.85,21.76-16.7,33.75v24.2c0,2.65-1.37,4.99-3.45,6.39Z"/></svg>`;
export const brandBadge = (brand) =>
  `<span class="badge">${
    BRAND_LOGOS[brand] ? `<img src="${BRAND_LOGOS[brand]}" alt="">` : UGREEN_LOGO
  }</span>`;
export const headerIcon = (cls, brand) =>
  `<span class="logo ${cls}" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="${NAS_ICON}"/></svg>${brand ? brandBadge(brand) : ""}</span>`;
