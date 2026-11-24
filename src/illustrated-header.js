// ---------------------------------------------------------------------------
// Illustrated header: the NAS drawing of the card, big, on a server-room wall, a concrete strip at the bottom.
// ---------------------------------------------------------------------------
import { esc } from "./helpers.js";

// Night picture: forced by illustration_theme, else Home Assistant's dark mode alone (a light theme keeps the day
// picture after sunset).
export const nasIsNight = (hass, config) => {
  const theme = config?.illustration_theme;
  if (theme === "night") return true;
  if (theme === "day") return false;
  return !!hass?.themes?.darkMode;
};
// The scene is 200 × 80; the NAS stands on the strip at its right, as big as its box allows (a tower up to 52 high,
// a flat or rackmount model up to 140 wide).
export const NAS_ART_BOX = { right: 194, w: 140, h: 52 };
// The card's drawing inlined in the scene, so its drive LEDs take the status colour: its ids get the card's suffix
// (several cards on a page never share a gradient), its green LEDs the class the stylesheet colours and blinks.
export const nasArt = (svg, uid) => {
  const [, , vw, vh] = (svg.match(/viewBox="([^"]+)"/)?.[1] ?? "0 0 100 100").split(/\s+/).map(Number);
  const k = Math.min(NAS_ART_BOX.w / vw, NAS_ART_BOX.h / vh);
  const w = +(vw * k).toFixed(1), h = +(vh * k).toFixed(1);
  const body = svg
    .replace(/\bid="([^"]+)"/g, `id="$1-${uid}"`)
    .replace(/url\(#([^)]+)\)/g, `url(#$1-${uid})`)
    .replace(/fill="#43c463"/g, 'class="led" fill="#43c463"')
    .replace(/^<svg\b[^>]*?viewBox="([^"]+)"[^>]*>/, (_m, vb) => `<svg class="nas-art" viewBox="${vb}" x="${NAS_ART_BOX.right - w}" y="${80 - h}" width="${w}" height="${h}">`);
  return { body, x: NAS_ART_BOX.right - w, y: 80 - h, w };
};
// A picture given as a URL keeps its own file, fitted in the same box.
export const nasArtImage = (href) => ({
  body: `<image class="nas-art" href="${esc(href)}" x="${NAS_ART_BOX.right - NAS_ART_BOX.w}" y="${80 - NAS_ART_BOX.h}" width="${NAS_ART_BOX.w}" height="${NAS_ART_BOX.h}" preserveAspectRatio="xMaxYMax meet"/>`,
  x: NAS_ART_BOX.right - NAS_ART_BOX.w / 2, y: 80 - NAS_ART_BOX.h, w: NAS_ART_BOX.w / 2,
});
// The wall's network: a data cable coming down from the cable tray into a small switch, then along the wall to the
// NAS (flowing while it is online), the switch's LEDs and an alert mark at the NAS's top left corner (clear of the zoom button) in the status colour.
export const nasScene = (uid, art, state) => {
  const end = art ? Math.max(60, art.x + 6) : 120;
  const alert = art && (state === "warn" || state === "crit")
    ? `<g class="alert"><circle cx="${(art.x + 2).toFixed(1)}" cy="${(art.y - 1).toFixed(1)}" r="5" fill="var(--led)" stroke="#fff" stroke-width="1"/><rect x="${(art.x + 1.4).toFixed(1)}" y="${(art.y - 4).toFixed(1)}" width="1.2" height="3.6" rx=".6" fill="#fff"/><circle cx="${(art.x + 2).toFixed(1)}" cy="${(art.y + 1.4).toFixed(1)}" r=".75" fill="#fff"/></g>`
    : "";
  return `<svg class="scene" viewBox="0 0 200 80" preserveAspectRatio="xMaxYMax meet" aria-hidden="true"><defs><radialGradient id="nas-glow-${uid}"><stop offset="0" class="glow-c glow-in"/><stop offset="1" class="glow-c" stop-opacity="0"/></radialGradient></defs><ellipse cx="${art ? (art.x + art.w / 2).toFixed(1) : 150}" cy="50" rx="62" ry="34" fill="url(#nas-glow-${uid})"/><path class="wire" d="M10 8 V40"/><path class="flow" d="M10 8 V40"/><path class="wire" d="M29 36 V75 H${end.toFixed(1)}"/><path class="flow" d="M29 36 V75 H${end.toFixed(1)}"/><rect class="box" x="18" y="20" width="22" height="16" rx="2"/><circle class="led" cx="24" cy="28" r="1.4"/><circle class="led" cx="29" cy="28" r="1.4"/><circle class="led" cx="34" cy="28" r="1.4"/>${art ? `<g class="device">${art.body}</g>` : ""}${alert}</svg>`;
};
