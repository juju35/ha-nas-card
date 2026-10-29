/*
 * NAS Card for Home Assistant (UGREEN, Synology, QNAP)
 * https://github.com/juju35/ha-nas-card
 *
 * Lovelace cards for the UGREEN NAS integration
 * (https://github.com/Tom-Bom-badil/home-assistant_ugreen-nas), the Synology DSM integration and
 * the QNAP integration. UGREEN entities are discovered through their UGNAS_device_id attribute;
 * Synology and QNAP entities through the entity and device registries.
 */

const VERSION = "__VERSION__";

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
  // mdi:arrow-expand and mdi:arrow-collapse, the mini card's zoom button.
  expand: "M10,21V19H6.41L10.91,14.5L9.5,13.09L5,17.59V14H3V21H10M14.5,10.91L19,6.41V10H21V3H14V5H17.59L13.09,9.5L14.5,10.91Z",
  collapse: "M19.5,3.09L15,7.59V4H13V11H20V9H16.41L20.91,4.5L19.5,3.09M4,13V15H7.59L3.09,19.5L4.5,20.91L9,16.41V20H11V13H4Z",
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
    no_nas: "No NAS entities found. Is a supported integration (UGREEN NAS, Synology DSM or QNAP) installed?",
    unknown_nas: "NAS not found",
    status_ok: "Normal",
    status_problem: "Warning",
    cpu_fan: "CPU fan",
    device_fan: "Fan",
    zoom_in: "Show the full card",
    zoom_out: "Back to the compact view",
    // Editor
    nas: "NAS (UGREEN, Synology DSM or QNAP device)",
    title: "Title (optional, defaults to the NAS name)",
    show_image: "Show NAS picture",
    image: "NAS picture (model or image URL)",
    image_helper: "Automatic from the model reported by the integration",
    image_auto: "Automatic",
    show_system: "Show system (CPU, RAM, temperature)",
    show_network: "Show network",
    show_volumes: "Show volumes",
    show_disks: "Show disks",
    show_fans: "Show fans",
    show_storage: "Show storage",
    zoom: "Zoom button",
    zoom_helper: "Switches the mini card to the full card and back",
    url: "NAS interface URL (click on the NAS picture)",
    url_helper: "Automatic from Home Assistant when empty (UGREEN, Synology); set it for QNAP, e.g. http://192.168.1.10:8080",
    brand_url: "Brand website URL (click on the logo)",
    brand_url_helper: "Official website of the brand when empty",
    open_nas: "Open the NAS interface",
    open_brand: "Open the {brand} website",
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
    uptime: "Temps de fonctionnement\u00a0:",
    download: "Réception",
    upload: "Envoi",
    used: "utilisés",
    of: "sur",
    hours: "h",
    days: "j",
    minutes: "min",
    no_nas: "Aucune entité NAS trouvée. Une intégration prise en charge (UGREEN NAS, Synology DSM ou QNAP) est-elle installée ?",
    unknown_nas: "NAS introuvable",
    status_ok: "Normal",
    status_problem: "Alerte",
    cpu_fan: "Ventilateur CPU",
    device_fan: "Ventilateur",
    zoom_in: "Afficher la carte complète",
    zoom_out: "Revenir à la vue compacte",
    nas: "NAS (appareil UGREEN, Synology DSM ou QNAP)",
    title: "Titre (facultatif, nom du NAS par défaut)",
    show_image: "Afficher l'illustration du NAS",
    image: "Illustration du NAS (modèle ou URL d'image)",
    image_helper: "Automatique selon le modèle remonté par l'intégration",
    image_auto: "Automatique",
    show_system: "Afficher le système (CPU, RAM, température)",
    show_network: "Afficher le réseau",
    show_volumes: "Afficher les volumes",
    show_disks: "Afficher les disques",
    show_fans: "Afficher les ventilateurs",
    show_storage: "Afficher le stockage",
    zoom: "Bouton zoom",
    zoom_helper: "Bascule la mini-carte en carte complète, et inversement",
    url: "URL de l'interface du NAS (clic sur l'illustration)",
    url_helper: "Automatique depuis Home Assistant si vide (UGREEN, Synology) ; à renseigner pour QNAP, ex. http://192.168.1.10:8080",
    brand_url: "URL du site de la marque (clic sur le logo)",
    brand_url_helper: "Site officiel de la marque si vide",
    open_nas: "Ouvrir l'interface du NAS",
    open_brand: "Ouvrir le site {brand}",
    language: "Langue",
    lang_auto: "Automatique",
  },
  de: {
    cpu: "CPU",
    ram: "RAM",
    temperature: "Temp.",
    network: "Netzwerk",
    storage: "Speicher",
    volumes: "Volumes",
    disks: "Laufwerke",
    fans: "Lüfter",
    uptime: "Betriebszeit:",
    download: "Download",
    upload: "Upload",
    used: "belegt",
    of: "von",
    hours: "h",
    days: "T",
    minutes: "min",
    no_nas: "Keine NAS-Entitäten gefunden. Ist eine unterstützte Integration (UGREEN NAS, Synology DSM oder QNAP) installiert?",
    unknown_nas: "NAS nicht gefunden",
    status_ok: "Normal",
    status_problem: "Warnung",
    cpu_fan: "CPU-Lüfter",
    device_fan: "Lüfter",
    zoom_in: "Vollständige Karte anzeigen",
    zoom_out: "Zurück zur kompakten Ansicht",
    nas: "NAS (UGREEN-, Synology-DSM- oder QNAP-Gerät)",
    title: "Titel (optional, standardmäßig der NAS-Name)",
    show_image: "NAS-Bild anzeigen",
    image: "NAS-Bild (Modell oder Bild-URL)",
    image_helper: "Automatisch anhand des von der Integration gemeldeten Modells",
    image_auto: "Automatisch",
    show_system: "System anzeigen (CPU, RAM, Temperatur)",
    show_network: "Netzwerk anzeigen",
    show_volumes: "Volumes anzeigen",
    show_disks: "Laufwerke anzeigen",
    show_fans: "Lüfter anzeigen",
    show_storage: "Speicher anzeigen",
    zoom: "Zoom-Schaltfläche",
    zoom_helper: "Wechselt von der Mini-Karte zur vollständigen Karte und zurück",
    url: "URL der NAS-Oberfläche (Klick auf das NAS-Bild)",
    url_helper: "Wenn leer, automatisch aus Home Assistant (UGREEN, Synology); für QNAP angeben, z. B. http://192.168.1.10:8080",
    brand_url: "URL der Hersteller-Website (Klick auf das Logo)",
    brand_url_helper: "Wenn leer, die offizielle Website des Herstellers",
    open_nas: "NAS-Oberfläche öffnen",
    open_brand: "Website von {brand} öffnen",
    language: "Sprache",
    lang_auto: "Automatisch",
  },
  es: {
    cpu: "CPU",
    ram: "RAM",
    temperature: "Temp.",
    network: "Red",
    storage: "Espacio",
    volumes: "Volúmenes",
    disks: "Discos",
    fans: "Ventiladores",
    uptime: "Tiempo activo:",
    download: "Descarga",
    upload: "Subida",
    used: "usados",
    of: "de",
    hours: "h",
    days: "d",
    minutes: "min",
    no_nas: "No se han encontrado entidades de NAS. ¿Está instalada una integración compatible (UGREEN NAS, Synology DSM o QNAP)?",
    unknown_nas: "NAS no encontrado",
    status_ok: "Normal",
    status_problem: "Alerta",
    cpu_fan: "Ventilador de la CPU",
    device_fan: "Ventilador",
    zoom_in: "Mostrar la tarjeta completa",
    zoom_out: "Volver a la vista compacta",
    nas: "NAS (dispositivo UGREEN, Synology DSM o QNAP)",
    title: "Título (opcional, por defecto el nombre del NAS)",
    show_image: "Mostrar la imagen del NAS",
    image: "Imagen del NAS (modelo o URL de imagen)",
    image_helper: "Automática según el modelo indicado por la integración",
    image_auto: "Automática",
    show_system: "Mostrar el sistema (CPU, RAM, temperatura)",
    show_network: "Mostrar la red",
    show_volumes: "Mostrar los volúmenes",
    show_disks: "Mostrar los discos",
    show_fans: "Mostrar los ventiladores",
    show_storage: "Mostrar el almacenamiento",
    zoom: "Botón de zoom",
    zoom_helper: "Cambia la minitarjeta a la tarjeta completa y viceversa",
    url: "URL de la interfaz del NAS (clic en la imagen del NAS)",
    url_helper: "Automática desde Home Assistant si está vacía (UGREEN, Synology); indícala para QNAP, p. ej. http://192.168.1.10:8080",
    brand_url: "URL del sitio web de la marca (clic en el logotipo)",
    brand_url_helper: "Sitio web oficial de la marca si está vacía",
    open_nas: "Abrir la interfaz del NAS",
    open_brand: "Abrir el sitio web de {brand}",
    language: "Idioma",
    lang_auto: "Automático",
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

// Data sizes follow Home Assistant's UnitOfInformation: kB/MB/GB/TB/PB are decimal (powers of 1000) and
// KiB/MiB/GiB/TiB/PiB binary (powers of 1024), as the frontend converts them. Displayed sizes use decimal units,
// so a sensor reported in GB or TB reads the same on the card as in Home Assistant.
const UNIT_FACTORS = {
  b: 1, kb: 1e3, mb: 1e6, gb: 1e9, tb: 1e12, pb: 1e15,
  kib: 1024, mib: 1024 ** 2, gib: 1024 ** 3, tib: 1024 ** 4, pib: 1024 ** 5,
};

const toBytes = (s) => {
  const v = num(s);
  if (v === null) return null;
  const unit = String(s.attributes?.unit_of_measurement || "B").toLowerCase();
  return v * (UNIT_FACTORS[unit] ?? 1);
};

const fmtBytes = (b) => {
  if (b === null || b === undefined) return "—";
  const units = ["B", "kB", "MB", "GB", "TB", "PB"];
  let i = 0;
  while (b >= 1000 && i < units.length - 1) {
    b /= 1000;
    i++;
  }
  const v = b >= 100 || i === 0 ? b.toFixed(0) : b.toFixed(b >= 10 ? 1 : 2);
  return `${v.includes(".") ? v.replace(/\.?0+$/, "") : v} ${units[i]}`;
};

// "used / total" for the RAM gauge: the used figure drops its unit only when both share it
// ("1.5 / 2 GB", but "800 MB / 2 GB").
const ramPair = (used, total) => {
  const u = fmtBytes(used);
  const tot = fmtBytes(total);
  const [uv, uu] = u.split(" ");
  return uu === tot.split(" ")[1] ? `${uv} / ${tot}` : `${u} / ${tot}`;
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

// Age in seconds of a boot timestamp sensor (Synology "Last boot", QNAP "Uptime").
const bootAge = (s) => {
  const ts = s && Date.parse(s.state);
  return Number.isFinite(ts) ? Math.max(0, Math.round((Date.now() - ts) / 1000)) : null;
};

// OS line of the subtitle: UGOS comes from its own sensor, the Synology firmware string already
// spells out DSM, and QNAP firmware starts with "h" on QuTS hero.
const osVersion = (v, brand) => (!v ? null : brand === "qnap" ? `${/^h/i.test(v) ? "QuTS hero" : "QTS"} ${v}` : v);

const isOk = (s) => !s || /^(normal|ok|good|healthy|on|false)$/i.test(String(s.state));

// Server status: UGREEN and QNAP report a word, Synology a safety binary sensor (on = issue found).
const statusOk = (nas, s) => (nas.brand === "synology" && s ? String(s.state) === "off" : isOk(s));

const level = (v, warn, crit) => (v === null ? "" : v >= crit ? "crit" : v >= warn ? "warn" : "ok");

const svgIcon = (path, cls = "") => `<svg class="icon ${cls}" viewBox="0 0 24 24"><path d="${path}"/></svg>`;

// NAS pictures: drawn illustrations, one per brand and form factor, picked from the model reported
// by the integration. Tower: control strip on the left + one tray per bay; each brand keeps its own
// colors (DXP aluminium, DH white, Synology black, QNAP graphite with a copper strip).
const PALETTES = {
  dxp: { top: "#c9ccd0", bottom: "#7d8288", front: "#2a2d31", tray: "#3a3e44", handle: "#4c5158", mark: "#c9ccd0" },
  dh: { top: "#f2f2f0", bottom: "#d9d9d6", front: "#e6e6e3", tray: "#d0d0cc", handle: "#b5b5b0", mark: "#888" },
  synology: { top: "#45484c", bottom: "#17181a", front: "#101113", tray: "#1e2023", handle: "#34373b", mark: "#6b6f74" },
  qnap: { top: "#3c3f44", bottom: "#1c1e21", front: "#17181b", tray: "#24262a", handle: "#3a3d42", mark: "#8d9196", accent: "#c8a46a" },
};
const towerSvg = (bays, p) => {
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
const rackSvg = (bays, p) => {
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
const flatSvg = () => {
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
const NAS_MODELS = {
  ugreen: ["DXP2800", "DXP4800", "DXP4800 Plus", "DXP480T Plus", "DXP6800 Pro", "DXP8800 Plus", "DH2300", "DH4300 Plus"],
  synology: [
    "DS124", "DS223", "DS223j", "DS224+", "DS225+", "DS423", "DS423+", "DS425+", "DS723+", "DS923+", "DS925+",
    "DS1522+", "DS1621+", "DS1821+", "DS1825+", "DS2422+", "RS422+", "RS822+", "RS1221+", "RS2423+",
  ],
  qnap: [
    "TS-133", "TS-233", "TS-433", "TS-264", "TS-464", "TS-664", "TS-473A", "TS-673A", "TS-873A", "TS-h973AX",
    "TVS-h674", "TVS-h874", "HS-264", "TS-873AeU", "TS-1264U-RP",
  ],
};
// Bay counts from the model names. Synology: the leading digits are not always the bay count
// (DS723+ has 2 bays, DS923+ has 4, DS1522+ has 5), so known families are mapped.
const synoBays = (m) => {
  const d = m.match(/^(?:DS|DVA|FS)(\d{3,4})/);
  if (!d) return 4;
  const n = d[1];
  if (n.length === 4) return { 15: 5, 16: 6, 18: 8, 24: 12, 36: 12 }[n.slice(0, 2)] ?? 6;
  return { 1: 1, 2: 2, 3: 2, 4: 4, 6: 6, 7: 2, 9: 4 }[n[0]] ?? 4;
};
const synoRackBays = (m) => {
  const d = m.match(/^RS(\d{3,4})/);
  return d && d[1].length === 4 ? ({ 12: 8, 13: 8 }[d[1].slice(0, 2)] ?? 12) : 4;
};
// QNAP: the digits before the last two are the bay count (TS-233 → 2, TS-873A → 8, TS-1264U → 12).
const qnapBays = (m) => {
  const d = m.match(/(\d{3,4})/);
  return d ? Math.min(d[1].length === 4 ? +d[1].slice(0, 2) : +d[1][0] || 4, 12) : 4;
};
const brandOfModel = (m) =>
  /^(DXP|DH)\d/.test(m) ? "ugreen" : /^(DS|RS|FS|SA|DVA)\d/.test(m) ? "synology" : /^(TS|TVS|TBS|HS|TR)-?\w*\d/.test(m) ? "qnap" : null;
const nasSvg = (model, brand) => {
  const m = String(model || "").toUpperCase().replace(/\s+/g, "");
  const b = brandOfModel(m) || brand || "ugreen";
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
const nasPicture = (image, model, brand) =>
  /^(https?:|\/|data:)/.test(image || "") ? image : `data:image/svg+xml,${encodeURIComponent(nasSvg(image || model, brand))}`;

// Brand logo next to the title. The UGREEN mark stays embedded; the Synology and QNAP marks load
// from the Home Assistant brand images CDN (the one the HA interface itself uses for integration
// logos). Both marks are grayscale, so dark mode simply inverts them.
const BRAND_DOMAINS = { synology: "synology_dsm", qnap: "qnap" };
const BRAND_NAMES = { ugreen: "UGREEN", synology: "Synology", qnap: "QNAP" };
const BRAND_SITES = { ugreen: "https://nas.ugreen.com", synology: "https://www.synology.com", qnap: "https://www.qnap.com" };
// Only web addresses become links (a configuration_url can also be a homeassistant:// path).
const webUrl = (u) => (/^https?:\/\//i.test(String(u || "").trim()) ? String(u).trim() : null);
// The NAS web interface: the configuration_url of the NAS device in the device registry (set by the
// UGREEN NAS and Synology DSM integrations, the "Visit" link of the device page), found from any of
// its entities through the device's root (pools, volumes and disks are child devices).
const deviceUrl = (hass, nas) => {
  if (nas.info?.url) return webUrl(nas.info.url);
  const id = Object.values(nas.scalars)[0];
  const deviceId = id && hass.entities?.[id]?.device_id;
  return deviceId ? webUrl(rootDevice(hass, deviceId)?.configuration_url) : null;
};
// Picture choices of the editor: sorted by brand, then by model (numbers in natural order), each
// label prefixed with its brand; the value stays the bare model name.
const modelOptions = () =>
  Object.keys(NAS_MODELS)
    .sort((a, b) => BRAND_NAMES[a].localeCompare(BRAND_NAMES[b], "en", { sensitivity: "base" }))
    .flatMap((b) =>
      [...NAS_MODELS[b]]
        .sort((x, y) => x.localeCompare(y, "en", { numeric: true, sensitivity: "base" }))
        .map((m) => ({ value: m, label: `${BRAND_NAMES[b]} ${m}` }))
    );
const logo = (brand, dark) => {
  if (BRAND_DOMAINS[brand])
    return `<img class="logo brand${dark ? " inverted" : ""}" src="https://brands.home-assistant.io/${BRAND_DOMAINS[brand]}/icon.png" alt="${BRAND_NAMES[brand]}">`;
  return ugreenLogo(dark);
};
// UGREEN logo. The bottom of the gradient is lightened in dark mode, the original
// near-black end would blend into the card background.
const ugreenLogo = (dark) => `<svg class="logo" viewBox="31.54 11.44 86.93 129.63" role="img" aria-label="UGREEN">
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

/** List the NAS of every supported integration: UGREEN (UGNAS_device_id values) first, then the
 * NAS devices of the registry integrations (Synology DSM, QNAP). */
const listNas = (hass) => {
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
      const d = hass.devices[rootId];
      list.push({ value: rootId, label: d.name_by_user || d.name || rootId });
    }
  return list;
};

// Candidate entity ids: the entities of the integration in the entity registry (plus entries whose
// platform is unknown), cached on the registry object (replaced only when it changes), not on
// hass.states, replaced on every state change. The cached list may be empty: on an install without
// the UGREEN integration (Synology/QNAP only) no state is a candidate, instead of scanning every
// state on each state change. Only without a usable registry is every state a candidate.
const UGNAS_PLATFORM = "ugreen";
let _registry = { entities: null, ids: [] };
const candidateIds = (hass) => {
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
const ugnasIds = (hass) => {
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
const discoverUgreen = (hass, nasId) => {
  const all = ugnasIds(hass);
  const key = `${nasId || ""}\n${all.join(",")}`;
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
    _cache.set(key, nas);
    _lastGood.set(nas.nasId, nas);
    _lastGood.set(nasId || "", nas);
    return nas;
  }
  return offlineUgreen(hass, nasId) || nas;
};

// Last mapping found for each UGREEN NAS (and for the default NAS under ""). When the integration's
// coordinator fails (NAS rebooting or unreachable), every entity turns unavailable and Home Assistant
// drops UGNAS_device_id from it, so nothing carries the NAS id any more: the last mapping is served
// again, the card then shows its values as unavailable instead of a setup warning. Only while the
// mapped entities still in the states are all UGREEN candidates of the registry and none of them
// carries the attribute (a NAS id found elsewhere, or a removed integration, is not served from here).
const _lastGood = new Map();
const mappedIds = (nas) => {
  const ids = [...Object.values(nas.scalars), ...Object.values(nas.fans)];
  for (const pool of Object.values(nas.pools)) {
    for (const [k, v] of Object.entries(pool)) if (k !== "volumes" && k !== "disks") ids.push(v);
    for (const group of [pool.volumes, pool.disks]) for (const slot of Object.values(group)) ids.push(...Object.values(slot));
  }
  return ids;
};
const offlineUgreen = (hass, nasId) => {
  const nas = _lastGood.get(nasId || "");
  if (!nas) return null;
  const candidates = new Set(candidateIds(hass));
  const present = mappedIds(nas).filter((id) => hass.states[id]);
  const offline = present.length > 0 && present.every((id) => candidates.has(id) && !hass.states[id].attributes?.UGNAS_device_id);
  return offline ? nas : null;
};

// ---------------------------------------------------------------------------
// Entity discovery — registry integrations (Synology DSM, QNAP)
// ---------------------------------------------------------------------------
//
// These integrations tag no attribute on their states: their entities are found through the entity
// registry (platform), typed by their language-independent translation_key, and grouped per NAS
// through the device registry. Synology attaches volumes and disks to child devices of the NAS;
// QNAP keeps everything on one device and tells volumes and drives apart in the entity names.

const REGISTRY_PLATFORMS = { synology: "synology_dsm", qnap: "qnap" };

// NAS-level translation_key → scalar slot.
const SYNO_SCALARS = {
  cpu_total_load: "cpu_usage",
  memory_real_usage: "ram_usage",
  memory_total_real: "ram_total",
  memory_available_real: "ram_available",
  temperature: "sys_temp",
  network_up: "lan_up",
  network_down: "lan_down",
};
const QNAP_SCALARS = {
  cpu_usage: "cpu_usage",
  cpu_temp: "cpu_temp",
  system_temp: "sys_temp",
  memory_percent_used: "ram_usage",
  memory_used: "ram_used",
  memory_size: "ram_total",
  status: "server_status",
  uptime: "boot",
};
// Volume and disk translation_key → per-device slot (Synology prefixes volume_/disk_, QNAP volume_/drive_).
const VOLUME_KEYS = {
  volume_percentage_used: "used_pct",
  volume_size_used: "used_size",
  volume_size_total: "total_size",
  volume_size_free: "available_size",
  volume_status: "status",
};
const DISK_KEYS = { disk_temp: "temperature", disk_status: "status", drive_temp: "temperature", drive_smart_status: "status" };

// Registry lookups are cached on the registry objects, which Home Assistant replaces whenever an
// entity or a device changes (the states are read again on every discovery through the mapped ids).
let _registries = { entities: null, devices: null, cache: new Map() };
const registryCache = (hass) => {
  if (_registries.entities !== hass.entities || _registries.devices !== hass.devices)
    _registries = { entities: hass.entities, devices: hass.devices, cache: new Map() };
  return _registries.cache;
};

const rootDevice = (hass, id) => {
  let d = hass.devices?.[id];
  for (let i = 0; d?.via_device_id && hass.devices[d.via_device_id] && i < 4; i++) d = hass.devices[d.via_device_id];
  return d;
};

/** The NAS of one registry integration: root device id → sorted entity ids (NAS and child devices). */
const registryRoots = (hass, brand) => {
  const cache = registryCache(hass);
  const key = `roots\n${brand}`;
  if (cache.has(key)) return cache.get(key);
  const byRoot = new Map();
  if (hass.entities && hass.devices) {
    for (const [id, e] of Object.entries(hass.entities)) {
      if (e?.platform !== REGISTRY_PLATFORMS[brand] || !e.device_id) continue;
      const root = rootDevice(hass, e.device_id);
      if (!root) continue;
      if (!byRoot.has(root.id)) byRoot.set(root.id, []);
      byRoot.get(root.id).push(id);
    }
    for (const ids of byRoot.values()) ids.sort();
  }
  cache.set(key, byRoot);
  return byRoot;
};

// The specific volume or drive of a QNAP entity only shows in its name, where the integration
// inserts it ({monitor_device}): the words an entity does not share with the others of its
// translation_key group are that insert, whatever the language.
const monitorOf = (names, i) => {
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
const parenOf = (name) => (String(name || "").match(/\(([^()]*)\)[^()]*$/) || [])[1] ?? null;
// Trailing parenthesized part of a device name ("hostname (Volume 1)" → "Volume 1").
const deviceLabel = (name) => (String(name || "").match(/\(([^()]*)\)\s*$/) || [])[1];

const set = (obj, k, id) => {
  if (!(k in obj)) obj[k] = id;
};

/** Map the entities of one Synology DSM or QNAP NAS to the structure the cards render. */
const discoverRegistry = (hass, brand, nasId) => {
  const cache = registryCache(hass);
  const key = `${brand}\n${nasId || ""}`;
  if (cache.has(key)) return cache.get(key);

  const byRoot = registryRoots(hass, brand);
  const rootId = nasId ? (byRoot.has(nasId) ? nasId : null) : ([...byRoot.keys()].sort()[0] ?? null);
  const nas = { brand, nasId: rootId, scalars: {}, fans: {}, pools: {}, info: null };
  if (!rootId) {
    cache.set(key, nas);
    return nas;
  }
  const dev = hass.devices[rootId];
  nas.info = { name: dev.name_by_user || dev.name, model: dev.model, version: dev.sw_version, url: dev.configuration_url };
  const SCALARS_BY_KEY = brand === "synology" ? SYNO_SCALARS : QNAP_SCALARS;
  const pool = (nas.pools[1] = { volumes: {}, disks: {} });
  const groups = {};

  for (const id of byRoot.get(rootId)) {
    const e = hass.entities[id];
    const tk = e.translation_key;
    if (brand === "synology" && e.device_id !== rootId) {
      // Child device of the NAS: a volume or a disk, labelled and (for disks) modelled by its device.
      const d = hass.devices[e.device_id];
      if (tk in VOLUME_KEYS) set((pool.volumes[e.device_id] ??= { labelText: deviceLabel(d?.name) }), VOLUME_KEYS[tk], id);
      else if (tk in DISK_KEYS)
        set((pool.disks[e.device_id] ??= { labelText: deviceLabel(d?.name), modelText: d?.model }), DISK_KEYS[tk], id);
    } else if (brand === "synology" && tk === "status" && id.startsWith("binary_sensor.")) {
      set(nas.scalars, "server_status", id); // Security status: a safety binary sensor, on = issue found.
    } else if (tk in SCALARS_BY_KEY) {
      set(nas.scalars, SCALARS_BY_KEY[tk], id);
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
const discover = (hass, nasId) => {
  const ugreen = discoverUgreen(hass, nasId);
  if (ugreen.nasId) return ugreen;
  for (const brand of Object.keys(REGISTRY_PLATFORMS)) {
    const nas = discoverRegistry(hass, brand, nasId);
    if (nas.nasId) return nas;
  }
  return ugreen;
};

/** Compute used/total bytes of a volume from the raw sensors (fallback to the human ones). */
const volumeUsage = (hass, vol) => {
  const st = (k) => vol[k] && hass.states[vol[k]];
  let total = toBytes(st("total_size_raw")) ?? toBytes(st("total_size"));
  let used = toBytes(st("used_size_raw")) ?? toBytes(st("used_size"));
  const avail = toBytes(st("available_size_raw")) ?? toBytes(st("available_size"));
  if (used === null && total !== null && avail !== null) used = total - avail;
  if (total === null && used !== null && avail !== null) total = used + avail;
  // Unknown used space: no percentage (shown as "—"), rather than an empty bar at 0 %.
  let pct = total && used !== null ? Math.min(100, Math.max(0, (used / total) * 100)) : null;
  // Synology and QNAP report the percentage directly: it completes whichever size is missing.
  const direct = num(st("used_pct"));
  if (pct === null && direct !== null) {
    pct = Math.min(100, Math.max(0, direct));
    if (used === null && total !== null) used = (total * pct) / 100;
    else if (total === null && used !== null && pct > 0) total = (used * 100) / pct;
  }
  return { total, used, pct };
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
  :host { --nas-accent: #00b46e; --nas-ok: var(--success-color, #43a047); --nas-warn: var(--warning-color, #ffa600); --nas-crit: var(--error-color, #db4437); }
  ha-card { overflow: hidden; }
  .icon { width: 18px; height: 18px; fill: currentColor; flex: none; }
  .muted { color: var(--secondary-text-color); }
  .clickable { cursor: pointer; }
  [role="button"]:focus-visible { outline: 2px solid var(--primary-color, #03a9f4); outline-offset: 2px; }
  .ok { --c: var(--nas-ok); } .warn { --c: var(--nas-warn); } .crit { --c: var(--nas-crit); }
  .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--c, var(--nas-ok)); flex: none; display: inline-block; }
  .chip { display: inline-flex; align-items: center; gap: 4px; padding: 1px 8px; border-radius: 12px; font-size: 11px; font-weight: 500;
          background: color-mix(in srgb, var(--c, var(--nas-ok)) 15%, transparent); color: var(--c, var(--nas-ok)); }
  .bar { height: 4px; border-radius: 3px; background: var(--divider-color, rgba(127,127,127,.25)); overflow: hidden; }
  .bar > div { height: 100%; border-radius: 3px; background: var(--c, var(--nas-accent)); transition: width .6s ease; }
  .header { display: flex; align-items: center; gap: 10px; padding: 12px 12px 8px; }
  /* The status pill sits right of the title, centred on the title line; the subtitle keeps the title's width. */
  .titles { flex: 1; min-width: 0; display: grid; grid-template-columns: minmax(0, 1fr) auto; }
  .titles > .name, .titles > .sub { grid-column: 1; }
  .titles > .chip { grid-area: 1 / 2; align-self: center; margin-left: 10px; white-space: nowrap; }
  .logo { height: 40px; width: 40px; flex: none; align-self: flex-start; }
  .brand-link, .nas-link { display: flex; flex: none; border-radius: 8px; }
  .brand-link { align-self: flex-start; }
  .brand-link:focus-visible, .nas-link:focus-visible { outline: 2px solid var(--primary-color, #03a9f4); outline-offset: 2px; }
  .nas-link .nas { max-width: 100%; }
  .logo.brand { object-fit: contain; }
  .logo.brand.inverted { filter: invert(1); }
  .name { font-size: 16px; font-weight: 500; line-height: 1.25; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .sub { font-size: 12px; color: var(--secondary-text-color); overflow: hidden; }
  /* Model and UGOS version on one line when they fit, else one per line: the "·" separator that starts a line
     sits in the negative margin, clipped by .sub. */
  .sub .parts { display: flex; flex-wrap: wrap; margin-left: -12px; }
  .sub .parts span { min-width: 0; max-width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .sub .parts span::before { content: "·"; display: inline-block; width: 12px; text-align: center; }
  .warning { padding: 16px; color: var(--nas-warn); }
  .zoom { all: unset; flex: none; cursor: pointer; width: 24px; height: 24px; margin: -4px -4px -4px 0;
          border-radius: 50%; display: grid; place-items: center; color: var(--secondary-text-color); }
  .zoom .icon { width: 16px; height: 16px; }
  .zoom:hover { background: color-mix(in srgb, var(--secondary-text-color) 16%, transparent); color: var(--primary-text-color); }
  .zoom:focus-visible { outline: 2px solid var(--primary-color, #03a9f4); outline-offset: 1px; }
`;
// A click inside a dialog (more-info opened from the card, say) is not a click outside the card.
const inDialog = (ev) => ev.composedPath().some((n) => ["ha-more-info-dialog", "ha-dialog", "dialog"].includes(n.localName));

class NasBase extends HTMLElement {
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

  // Server status as shown: the healthy words of the integrations ("Normal", "good") go through
  // the translations, any other value is shown as reported. The Synology safety binary sensor has
  // no word at all: both of its states are translated.
  _statusText(status, brand) {
    if (brand === "synology") return this._t(String(status.state) === "off" ? "status_ok" : "status_problem");
    return /^(normal|good|healthy|ok)$/i.test(String(status.state)) ? this._t("status_ok") : status.state;
  }

  _t(key) {
    return t(this._hass, this._config, key);
  }

  // The three gauge readings, shared by the full card and the mini card: CPU temperature when the
  // integration reports one, system temperature otherwise.
  _vitals(sc) {
    const tempId = sc.cpu_temp || sc.sys_temp;
    return { cpu: num(this._s(sc.cpu_usage)), ram: num(this._s(sc.ram_usage)), tempId, temp: num(this._s(tempId)) };
  }

  _s(id) {
    return id ? this._hass.states[id] : undefined;
  }

  // What the render depends on: language, dark mode, the registries (registry integrations are
  // rediscovered when an entity or a device changes) and the states of the NAS entities.
  _signature() {
    const h = this._hass;
    const sig = [h.language, h.locale?.language, h.themes?.darkMode, h.entities, h.devices];
    const nas = discover(h, this._config.nas);
    sig.push(nas);
    if (!nas.nasId) return sig;
    // The uptime computed from a boot timestamp (Synology, QNAP) ages with the clock, not with a
    // state: tie the signature to the minute so the text refreshes with the next state change.
    if (nas.scalars.boot && num(this._s(nas.scalars.runtime)) === null) sig.push(Math.floor(Date.now() / 60000));
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
    const ok = statusOk(nas, status);
    const name = c.title || this._s(sc.name)?.state || nas.info?.name || `${BRAND_NAMES[nas.brand]} NAS`;
    const model = this._s(sc.model)?.state || nas.info?.model;
    const version = this._s(sc.version)?.state;
    const os = version ? `UGOS ${version}` : osVersion(nas.info?.version, nas.brand);
    // The compact mini card shares its header with the NAS picture: the model alone, the OS version zoomed in.
    const sub = [model, os && !this._compactHeader() ? os : null].filter(Boolean);
    return `
      <div class="header">
        ${this._link(webUrl(c.brand_url) || BRAND_SITES[nas.brand], this._t("open_brand").replace("{brand}", BRAND_NAMES[nas.brand]), "brand-link", logo(nas.brand, this._hass.themes?.darkMode))}
        <div class="titles">
          <div class="name">${esc(name)}</div>
          <div class="sub"><div class="parts">${sub.map((x) => `<span>${esc(x)}</span>`).join("")}</div></div>
          ${
            status
              ? `<span class="chip clickable ${ok ? "ok" : "warn"}" role="button" tabindex="0" data-entity="${status.entity_id}" title="${esc(
                  this._s(sc.system_message)?.state || ""
                )}"><span class="dot"></span>${esc(this._statusText(status, nas.brand))}</span>`
              : ""
          }
        </div>
        ${
          c.show_image !== false
            ? this._link(
                webUrl(c.url) || deviceUrl(this._hass, nas),
                this._t("open_nas"),
                "nas-link",
                `<img class="nas" src="${esc(nasPicture(c.image, model, nas.brand))}" alt="${esc(model || "NAS")}">`
              )
            : ""
        }
        ${this._zoomButton()}
      </div>`;
  }

  // Content wrapped in a link opening in a new tab, or left as is without an address.
  _link(href, title, cls, content) {
    return href
      ? `<a class="${cls}" href="${esc(href)}" target="_blank" rel="noopener noreferrer" title="${esc(title)}">${content}</a>`
      : content;
  }

  // Whether the header is the mini card's compact one (model only in the subtitle, no status pill).
  _compactHeader() {
    return false;
  }

  // Button at the far right of the header: only the mini card has one.
  _zoomButton() {
    return "";
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
  .nas-link { max-width: 40%; }
  .content { padding: 0 12px 12px; display: flex; flex-direction: column; gap: 12px; }
  .section-title { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 500; text-transform: uppercase;
                   letter-spacing: .04em; color: var(--secondary-text-color); margin-bottom: 6px; }
  .section-title .icon { width: 16px; height: 16px; }
  .gauges { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
  .gauge { display: flex; flex-direction: column; align-items: center; position: relative; }
  .ring { width: 60px; height: 60px; transform: rotate(-90deg); }
  .ring circle { fill: none; stroke-width: 6; }
  .ring .track { stroke: var(--divider-color, rgba(127,127,127,.25)); }
  .ring .value { stroke: var(--c, var(--nas-accent)); stroke-linecap: round; transition: stroke-dasharray .6s ease; }
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
  .tile .icon { color: var(--c, var(--nas-accent)); }
  .tile .k { font-size: 11px; color: var(--secondary-text-color); }
  .tile .v { font-size: 14px; font-weight: 500; }
  .tile.up { --c: var(--info-color, #039be5); }
  .tile.down { --c: var(--nas-accent); }
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

class NasCard extends NasBase {
  static getConfigElement() {
    return document.createElement("nas-card-editor");
  }

  static getStubConfig(hass) {
    // The NAS this card shows without nas (the first of the editor's list).
    const nas = hass ? discover(hass, "").nasId : null;
    return nas ? { nas } : {};
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
    // Without an entity there is no more-info to open: no button role, no tab stop.
    const act = id ? ` role="button" tabindex="0" data-entity="${id}"` : "";
    return `<div class="gauge ${id ? "clickable " : ""}${cls}"${act}>
      ${ring(value, cls)}
      <div class="val">${svgIcon(icon)}<b>${display}</b></div>
      <div class="lbl">${label}</div>
    </div>`;
  }

  _system(nas) {
    const sc = nas.scalars;
    const { cpu, ram, tempId, temp } = this._vitals(sc);
    const ramTotal = toBytes(this._s(sc.ram_total));
    const ramAvail = toBytes(this._s(sc.ram_available));
    const ramUsed =
      toBytes(this._s(sc.ram_used)) ??
      (ramTotal !== null && ramAvail !== null ? ramTotal - ramAvail : ramTotal !== null && ram !== null ? (ramTotal * ram) / 100 : null);
    const ramLabel = ramUsed !== null && ramTotal !== null ? `${this._t("ram")} · ${ramPair(ramUsed, ramTotal)}` : this._t("ram");
    const runtime = num(this._s(sc.runtime)) ?? bootAge(this._s(sc.boot));
    const facts = [];
    if (runtime !== null)
      facts.push(
        `<span class="clickable" role="button" tabindex="0" data-entity="${sc.runtime || sc.boot}">${svgIcon(ICONS.timer)}${this._t("uptime")} ${fmtUptime(
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
          tempId,
          sc.cpu_temp ? `${this._t("temperature")} ${this._t("cpu")}` : this._t("temperature"),
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
    // A tile without its sensor (e.g. QNAP without upload rate) opens no more-info: not focusable.
    const tile = (id, cls, icon, k) =>
      `<div class="tile ${id ? `clickable ${cls}" role="button" tabindex="0" data-entity="${id}"` : `${cls}"`}>${svgIcon(icon)}<div><div class="k">${k}</div><div class="v">${fmtRate(
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
        const label = this._s(vol.label)?.state || vol.labelText || `Volume ${multi ? `${pn}-${vn}` : vn}`;
        const fs = this._s(vol.filesystem)?.state;
        const cls = level(u.pct, 80, 90);
        rows.push(`<div class="vol clickable ${cls}" role="button" tabindex="0" data-key="${esc(`${pn}-${vn}`)}" data-entity="${vol.used_size_raw || vol.used_size || vol.used_pct || ""}">
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
        items.push(`<div class="disk clickable" role="button" tabindex="0" data-key="${esc(`${pn}-${dn}`)}" data-entity="${d.temperature || d.status || ""}">
          <div class="top">${svgIcon(ICONS.disk)}<span>${esc(this._s(d.label)?.state || d.labelText || `Disk ${dn}`)}</span>
            <span class="dot ${isOk(status) ? "ok" : "crit"}" title="${esc(status?.state || "")}"></span></div>
          <div class="model">${esc(this._s(d.model)?.state || d.modelText || "")}</div>
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
  .logo { height: 32px; width: 32px; }
  .nas { height: 44px; width: auto; flex: none; max-width: 35%; object-fit: contain; }
  .nas-link { max-width: 35%; }
  /* The status shows in the footer. */
  .titles > .chip { display: none; }
  .name { font-size: 16px; }
  .content { padding: 0 12px 12px; display: flex; flex-direction: column; gap: 8px; }
  .metric { display: grid; grid-template-columns: 18px 64px 1fr 56px; align-items: center; gap: 8px; font-size: 13px; }
  .metric .icon { color: var(--secondary-text-color); }
  .metric .v { text-align: right; font-weight: 500; }
  .foot { display: flex; justify-content: space-between; align-items: center; gap: 8px; font-size: 12px; color: var(--secondary-text-color); margin-top: 2px; }
  .foot span { display: inline-flex; align-items: center; gap: 2px; }
  .foot .icon { width: 14px; height: 14px; }
`;

// The mini card extends the full card: its zoom button (top right, `zoom: false` removes it) switches it to the
// full card's content, same configuration, and back; a click anywhere outside the card brings it back too.
class NasMiniCard extends NasCard {
  static getConfigElement() {
    return document.createElement("nas-mini-card-editor");
  }

  constructor() {
    super();
    this._zoomed = false;
    this.shadowRoot.addEventListener("click", (ev) => this._zoomClick(ev));
    // A click outside the card, and not in a dialog opened from it, brings it back to the compact view.
    this._onOutside = (ev) => {
      if (this._zoomed && !ev.composedPath().includes(this) && !inDialog(ev)) this._setZoom(false);
    };
  }

  connectedCallback() {
    document.addEventListener("click", this._onOutside, true);
  }

  disconnectedCallback() {
    document.removeEventListener("click", this._onOutside, true);
  }

  getCardSize() {
    return this._zoomed ? super.getCardSize() : 3;
  }

  getGridOptions() {
    return this._zoomed ? super.getGridOptions() : { columns: 6, min_columns: 6 };
  }

  _setZoom(zoomed) {
    this._zoomed = zoomed;
    this._update(this._sig);
  }

  // A click on the zoom button: never a tap on anything else of the card.
  _zoomClick(ev) {
    if (!ev.target?.closest?.(".zoom")) return;
    ev.stopPropagation();
    this._setZoom(!this._zoomed);
    // Keyboard use (Enter / Space: no click count) keeps the focus on the button.
    if (ev.detail === 0) this.shadowRoot.querySelector(".zoom")?.focus();
  }

  _compactHeader() {
    return !this._zoomed;
  }

  _zoomButton() {
    if (this._config.zoom === false) return "";
    const z = this._zoomed;
    return `<button class="zoom" title="${esc(this._t(z ? "zoom_out" : "zoom_in"))}">${svgIcon(z ? ICONS.collapse : ICONS.expand)}</button>`;
  }

  _metric(id, icon, label, pct, display, cls) {
    // Rows without an entity (the aggregated storage row) open no more-info: not focusable.
    const act = id ? ` role="button" tabindex="0" data-entity="${id}"` : "";
    return `<div class="metric ${id ? "clickable " : ""}${cls}"${act}>
      ${svgIcon(icon)}<span>${label}</span>
      <div class="bar"><div style="width:${pct === null ? 0 : Math.max(0, Math.min(100, pct))}%"></div></div>
      <span class="v">${display}</span>
    </div>`;
  }

  _render() {
    if (this._zoomed) return super._render();
    const nas = discover(this._hass, this._config.nas);
    if (!nas.nasId) return this._noNas();
    const c = this._config;
    const sc = nas.scalars;
    const status = this._s(sc.server_status);
    const { cpu, ram, tempId, temp } = this._vitals(sc);
    const rows = [];
    rows.push(this._metric(sc.cpu_usage, ICONS.cpu, this._t("cpu"), cpu, cpu === null ? "—" : `${Math.round(cpu)}%`, level(cpu, 70, 90)));
    rows.push(this._metric(sc.ram_usage, ICONS.ram, this._t("ram"), ram, ram === null ? "—" : `${Math.round(ram)}%`, level(ram, 80, 95)));
    rows.push(
      this._metric(tempId, ICONS.temp, this._t("temperature"), temp, temp === null ? "—" : `${Math.round(temp)}°C`, level(temp, 75, 90))
    );
    if (c.show_storage !== false) {
      let used = 0;
      let total = 0;
      const pcts = [];
      for (const pool of Object.values(nas.pools))
        for (const vol of Object.values(pool.volumes)) {
          const u = volumeUsage(this._hass, vol);
          // A volume whose used space is unknown is left out of both totals.
          if (u.total && u.used !== null) {
            total += u.total;
            used += u.used;
          } else if (u.pct !== null) pcts.push(u.pct);
        }
      // Sizes when they are known; the mean of the percentages when only those are (QNAP).
      const pct = total ? (used / total) * 100 : pcts.length ? pcts.reduce((a, b) => a + b, 0) / pcts.length : null;
      if (pct !== null)
        rows.push(this._metric("", ICONS.database, this._t("storage"), pct, `${pct.toFixed(0)}%`, level(pct, 80, 90)));
    }
    const foot = [];
    if (status)
      foot.push(
        `<span class="clickable ${statusOk(nas, status) ? "ok" : "warn"}" role="button" tabindex="0" data-key="status" data-entity="${status.entity_id}"><span class="dot"></span>&nbsp;${esc(
          this._statusText(status, nas.brand)
        )}</span>`
      );
    if (c.show_network !== false && (sc.lan_down || sc.lan_up))
      foot.push(
        `<span class="clickable" role="button" tabindex="0" data-key="network" data-entity="${sc.lan_down || sc.lan_up}">${svgIcon(ICONS.down)}${fmtRate(toBps(this._s(sc.lan_down)))}&nbsp;&nbsp;${svgIcon(
          ICONS.up
        )}${fmtRate(toBps(this._s(sc.lan_up)))}</span>`
      );
    const runtime = num(this._s(sc.runtime)) ?? bootAge(this._s(sc.boot));
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

class NasEditorBase extends HTMLElement {
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

  // Boolean options, all on by default.
  _toggles() {
    return ["show_image", ...this.constructor.toggles];
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
        name: "image",
        selector: {
          select: {
            mode: "dropdown",
            custom_value: true,
            options: [
              { value: "", label: tr("image_auto") },
              ...modelOptions(),
            ],
          },
        },
      },
      { name: "url", selector: { text: { type: "url" } } },
      { name: "brand_url", selector: { text: { type: "url" } } },
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
              { value: "de", label: "Deutsch" },
              { value: "es", label: "Español" },
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
      this._form.computeHelper = (s) => STRINGS[lang(this._hass, this._config)][`${s.name}_helper`];
      this._form.addEventListener("value-changed", (ev) => {
        ev.stopPropagation();
        const config = { ...ev.detail.value };
        for (const [k, v] of Object.entries(config)) {
          // Keep the YAML minimal: drop empty values and toggles left at their default (true).
          if (v === "" || v === undefined || v === null || (this._toggles().includes(k) && v === true)) delete config[k];
        }
        this._config = config;
        this.dispatchEvent(new CustomEvent("config-changed", { detail: { config }, bubbles: true, composed: true }));
      });
      this.appendChild(this._form);
    }
    const data = { ...this._config };
    for (const name of this._toggles()) if (data[name] === undefined) data[name] = true;
    // Without nas (hand-written YAML), show the NAS the card shows: saving the form then keeps it.
    if (!data.nas && this._hass) data.nas = discover(this._hass, "").nasId || undefined;
    this._form.hass = this._hass;
    this._form.data = data;
    this._form.schema = this._schema();
  }
}

class NasCardEditor extends NasEditorBase {
  static get toggles() {
    return ["show_system", "show_network", "show_volumes", "show_disks", "show_fans"];
  }
}

class NasMiniCardEditor extends NasEditorBase {
  static get toggles() {
    return ["show_storage", "show_network", "zoom"];
  }
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

const define = (name, cls) => {
  if (!customElements.get(name)) customElements.define(name, cls);
};
define("nas-card", NasCard);
define("nas-mini-card", NasMiniCard);
define("nas-card-editor", NasCardEditor);
define("nas-mini-card-editor", NasMiniCardEditor);
// `custom:ugreen-nas-card` / `custom:ugreen-nas-mini-card`: the former types, kept so that existing
// dashboards keep working (a custom element class registers only once, so they are empty subclasses).
define("ugreen-nas-card", class extends NasCard {});
define("ugreen-nas-mini-card", class extends NasMiniCard {});

window.customCards = window.customCards || [];
for (const card of [
  {
    type: "nas-card",
    name: "NAS Card",
    description: "Monitor a UGREEN, Synology or QNAP NAS: CPU, RAM, temperatures, volumes, disks, network and fans.",
  },
  {
    type: "nas-mini-card",
    name: "NAS Mini Card",
    description: "Compact NAS overview (UGREEN, Synology, QNAP): CPU, RAM, temperature, storage and network.",
  },
]) {
  if (!window.customCards.some((c) => c.type === card.type))
    window.customCards.push({ ...card, preview: true, documentationURL: "https://github.com/juju35/ha-nas-card" });
}

console.info(
  `%c NAS-CARD %c v${VERSION} `,
  "color: white; background: #00b46e; font-weight: 700;",
  "color: #00b46e; background: white; font-weight: 700;"
);
