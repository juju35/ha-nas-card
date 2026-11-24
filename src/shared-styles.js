// ---------------------------------------------------------------------------
// Shared styles
// ---------------------------------------------------------------------------
import { ICONS } from "./core.js";
import { BRAND_NAMES, BRAND_SITES, deviceUrl, durationSeconds, esc, fmtLang, headerIcon, level, nasPicture, nasSvg, num, osVersion, raidEntity, raidState, statusOk, svgIcon, t, temperature, thresholds, webUrl } from "./helpers.js";
import { nasArt, nasArtImage, nasIsNight, nasScene } from "./illustrated-header.js";
import { NO_VALUE, _lastText } from "./entity-discovery.js";
import { discover, fireMoreInfo, morph, sameSig, textWidth } from "./entity-discovery-2.js";

export let _nasUid = 0;

export const BASE_STYLE = `
  :host { --nas-accent: #00b46e; --nas-ok: var(--success-color, #43a047); --nas-warn: var(--warning-color, #ffa600); --nas-crit: var(--error-color, #db4437);
          --nas-na: var(--disabled-text-color, #9e9e9e); }
  /* The card is the container of the width queries below (narrow header, volume rows, mini card footer). */
  ha-card { overflow: hidden; position: relative; container-type: inline-size; container-name: nas-card; }
  /* A size container has no width of its own content: in a parent that sizes to its content (inline-block,
     grid auto column: button-card, layout-card) the card would fall to a few pixels. This empty, zero-height
     grid gives the card a natural (max-content) width of 400 px without any minimum (its min-content width
     is 0): in a "1fr 1fr" grid (grid card, horizontal-stack, layout-card), wrapped in a <div> or not, the card
     still shrinks to its column. contain-intrinsic-inline-size or a min-width on the host would be a minimum
     and overflow there. */
  :host::before { content: ""; display: grid; grid-template-columns: minmax(0, 400px); height: 0; }
  .icon { width: 18px; height: 18px; fill: currentColor; flex: none; }
  .muted { color: var(--secondary-text-color); }
  .clickable { cursor: pointer; }
  [role="button"]:focus-visible { outline: 2px solid var(--primary-color, #03a9f4); outline-offset: 2px; }
  .ok { --c: var(--nas-ok); } .warn { --c: var(--nas-warn); } .crit { --c: var(--nas-crit); } .na { --c: var(--nas-na); }
  .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--c, var(--nas-ok)); flex: none; display: inline-block; }
  /* The state color stays on the dot and the tint; the text mixes it with the text color to stay readable (>= 4.5:1). */
  .chip { display: inline-flex; align-items: center; gap: 4px; padding: 1px 8px; border-radius: 12px; font-size: 11px; font-weight: 500;
          background: color-mix(in srgb, var(--c, var(--nas-ok)) 15%, transparent);
          color: color-mix(in srgb, var(--c, var(--nas-ok)) 40%, var(--primary-text-color, #212121)); }
  .chip .txt { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .bar { height: 4px; border-radius: 3px; background: var(--divider-color, rgba(127,127,127,.25)); overflow: hidden; }
  .bar > div { height: 100%; border-radius: 3px; background: var(--c, var(--nas-accent)); transition: width .6s ease; }
  @media (prefers-reduced-motion: reduce) { .bar > div { transition: none; } }
  .header { display: flex; align-items: center; gap: 10px; padding: 12px 12px 8px; }
  /* Title row (both headers): the name, then the status pill right after it, only when the whole name and the whole
     label fit there (measured by the card, see _fitPill); else the pill takes a line of its own under the subtitle,
     and when even that does not fit, only its dot stays (its label in its title and for screen readers). */
  .titles { flex: 1 1 0; min-width: 0; display: flex; flex-direction: column; align-items: flex-start; }
  .titles > .name, .titles > .sub { align-self: stretch; }
  :host([hide-title]) .titles .name, :host([hide-subtitle]) .titles > .sub { display: none; }
  .trow { display: flex; align-items: center; gap: 8px; min-width: 0; align-self: stretch; }
  .trow > .name { flex: 0 1 auto; min-width: 4ch; }
  .trow > .chip { flex: none; white-space: nowrap; max-width: none; overflow: hidden; box-sizing: border-box; }
  .titles.below .trow { display: contents; }
  .titles.below .trow > .name { align-self: stretch; }
  .titles.below > .sub { order: 1; }
  .titles.below .trow > .chip { order: 2; align-self: flex-start; max-width: 100%; margin-top: 2px; }
  .titles.dot-only .chip { padding: 0; width: 16px; height: 16px; justify-content: center; }
  .titles.dot-only .chip .txt { display: none; }
  @container nas-card (max-width: 200px) { .chip .txt { display: none; } }
  .logo { height: 40px; width: 40px; flex: none; align-self: flex-start; border-radius: 50%; display: grid; place-items: center;
          color: var(--c, var(--nas-ok)); background: color-mix(in srgb, var(--c, var(--nas-ok)) 16%, transparent); }
  .logo svg { width: 24px; height: 24px; fill: currentColor; }
  .logo { position: relative; }
  .logo .badge { position: absolute; right: -4px; bottom: -4px; width: 18px; height: 18px; border-radius: 5px; padding: 2px; box-sizing: border-box;
                 display: grid; place-items: center; background: #fff;
                 box-shadow: 0 0 0 1px var(--divider-color, rgba(0,0,0,.12)), 0 0 0 3px var(--card-background-color, #fff); }
  .logo .badge svg, .logo .badge img { width: 100%; height: 100%; object-fit: contain; }
  .brand-link, .nas-link { display: flex; flex: none; border-radius: 8px; }
  .brand-link { border-radius: 50%; }
  .brand-link { align-self: flex-start; }
  .brand-link:focus-visible, .nas-link:focus-visible { outline: 2px solid var(--primary-color, #03a9f4); outline-offset: 2px; }
  .nas-link .nas { max-width: 100%; }
  .name { font-size: 16px; font-weight: 500; line-height: 1.25; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 4ch; }
  .sub { font-size: 12px; color: var(--secondary-text-color); overflow: hidden; }
  /* Model and UGOS version on one line when they fit, else one per line: the "·" separator that starts a line
     sits in the negative margin, clipped by .sub. */
  .sub .parts { display: flex; flex-wrap: wrap; margin-left: -12px; }
  .sub .parts span { min-width: 0; max-width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .sub .parts span::before { content: "·"; display: inline-block; width: 12px; text-align: center; }
  .warning { padding: 16px; color: color-mix(in srgb, var(--nas-warn) 40%, var(--primary-text-color, #212121)); }
  .zoom { all: unset; flex: none; cursor: pointer; width: 24px; height: 24px; margin: -4px -4px -4px 0;
          border-radius: 50%; display: grid; place-items: center; color: var(--secondary-text-color); }
  .zoom .icon { width: 16px; height: 16px; }
  .zoom:hover { background: color-mix(in srgb, var(--secondary-text-color) 16%, transparent); color: var(--primary-text-color); }
  .zoom:focus-visible { outline: 2px solid var(--primary-color, #03a9f4); outline-offset: 1px; }
  /* Reboot button, at the end of the system facts: round, tinted on hover, never filled. */
  .action { all: unset; flex: none; cursor: pointer; width: 24px; height: 24px; margin: -4px 0 -4px auto; border-radius: 50%;
            display: grid; place-items: center; color: var(--secondary-text-color); }
  .action .icon { width: 16px; height: 16px; }
  .action:hover { background: color-mix(in srgb, var(--nas-crit) 16%, transparent); color: var(--primary-text-color); }
  .action:focus-visible { outline: 2px solid var(--primary-color, #03a9f4); outline-offset: 1px; }
  .action:disabled { cursor: default; opacity: .4; }
  .action:disabled:hover { background: none; color: var(--secondary-text-color); }
  /* Update available: a chip in the accent color. */
  .upd { --c: var(--nas-accent); }
  .chip.upd .icon { width: 14px; height: 14px; color: inherit; }
`;

// The illustrated header (illustration: true, the default), 90 px on both cards: the title over the server-room
// wall at the left, the scene (200 × 80, the NAS at its right) drawn at the banner's height to the right edge,
// the concrete strip edge to edge at the bottom. Day and night walls; the status colours the icon, the drive LEDs,
// the switch LEDs and the glow.
export const BANNER_STYLE = `
  .header.banner { display: block; position: relative; height: 90px; padding: 0; overflow: hidden; --g: 10px;
                  /* The NAS art gives way first, so that the title and the whole status pill fit beside it. */
                  --art-w: clamp(96px, calc(100% - 240px), min(200px, 62%));
    --wall: #e7eaee; --line: #d6dbe1; --tray: #c4cbd3; --box: #fff; --box-edge: #c4cbd3; --wire: #b9c0c8; --flow: #2f80ed; --glow: #fff;
    color: #17222e;
    background: linear-gradient(var(--tray), var(--tray)) 0 6.5px / 100% 3px no-repeat,
      repeating-linear-gradient(to bottom, transparent 0 19.6px, var(--line) 19.6px 20.4px), var(--wall); }
  .header.banner.night { --wall: #232a36; --line: #2e3746; --tray: #3a4456; --box: #2e3746; --box-edge: #455066; --wire: #3d4759;
    --flow: #5b9cff; --glow: var(--led); color: #fff; }
  .banner.st-ok { --led: #43c463; } .banner.st-warn { --led: #f5a623; } .banner.st-crit { --led: #e53935; } .banner.st-na { --led: #8a929c; }
  .banner .scene, .banner > .nas-link { position: absolute; right: 0; bottom: var(--g); height: calc(100% - var(--g)); width: var(--art-w); }
  .banner > .nas-link { display: block; border-radius: 0; max-width: none; }
  .banner > .nas-link > .scene { position: static; display: block; width: 100%; height: 100%; }
  .banner .glow-c { stop-color: var(--glow); }
  .banner .glow-in { stop-opacity: .55; }
  .banner.night .glow-in { stop-opacity: .16; }
  .banner.st-na .glow-in { stop-opacity: .3; }
  .banner.night.st-na .glow-in { stop-opacity: 0; }
  .banner .wire { fill: none; stroke: var(--wire); stroke-width: 1.6; }
  .banner .flow { fill: none; stroke: var(--flow); stroke-width: 1.6; stroke-dasharray: 3 4; animation: nas-flow 1s linear infinite; }
  .banner.st-na .flow { display: none; }
  .banner .box { fill: var(--box); stroke: var(--box-edge); }
  .banner .led { fill: var(--led); }
  .banner.st-ok .led { animation: nas-blink 1.6s steps(2) infinite; }
  .banner.st-ok .led:nth-of-type(2n) { animation-delay: .5s; }
  .banner.st-warn .led { animation: nas-blink 1s steps(2) infinite; }
  .banner.st-crit .led { animation: nas-blink .5s steps(2) infinite; }
  .banner .alert { animation: nas-pulse 1.2s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
  .banner.night .device { filter: brightness(.88); }
  .banner.st-na .device { filter: saturate(.35) brightness(.85); opacity: .85; }
  .banner.night.st-na .device { filter: saturate(.35) brightness(.6); }
  @keyframes nas-blink { 50% { opacity: .25; } }
  @keyframes nas-flow { to { stroke-dashoffset: -14; } }
  @keyframes nas-pulse { 50% { transform: scale(1.15); } }
  @media (prefers-reduced-motion: reduce) { .banner .flow, .banner .led, .banner .alert { animation: none; } }
  .banner .head { position: absolute; z-index: 1; left: 0; top: 0; bottom: var(--g); right: var(--art-w); display: flex; align-items: center;
                  gap: 10px; padding: 0 6px 0 12px; min-width: 0; }
  .banner .brand-link, .banner .logo { align-self: center; }
  .banner .logo { background: rgba(255,255,255,.62); box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--c, var(--nas-ok)) 28%, transparent); }
  .banner.night .logo { background: rgba(255,255,255,.12); color: color-mix(in srgb, var(--c, var(--nas-ok)) 78%, #fff);
                        box-shadow: inset 0 0 0 1px rgba(255,255,255,.14); }
  .banner .logo .badge { box-shadow: 0 0 0 1px rgba(13,42,69,.16), 0 1px 3px rgba(13,42,69,.18); }
  .banner .titles { display: flex; flex-direction: column; align-items: flex-start; gap: 1px; }
  .banner .titles > .name, .banner .titles > .sub { align-self: stretch; }
  .banner .sub { color: #46566a; line-height: 16px; max-height: 16px; }
  .banner.night .sub { color: rgba(255,255,255,.78); }
  .banner .titles { flex: 1 1 0; min-width: 0; }
  .banner .trow > .chip { display: inline-flex; }
  .banner .chip { line-height: 16px;
                  background: color-mix(in srgb, var(--c, var(--nas-ok)) 18%, rgba(255,255,255,.78));
                  color: color-mix(in srgb, var(--c, var(--nas-ok)) 45%, #0d2a45); }
  .banner.night .chip { background: color-mix(in srgb, var(--c, var(--nas-ok)) 30%, rgba(8,18,38,.55));
                        color: color-mix(in srgb, var(--c, var(--nas-ok)) 35%, #ffffff); }
  .banner .chip .dot { width: 7px; height: 7px; }
  @container nas-card (max-width: 200px) {
    .banner .chip { padding: 0; width: 16px; height: 16px; justify-content: center; }
  }
  /* Detail button (mini card): a small frosted round button in the banner's top right corner. */
  .banner .zoom { position: absolute; z-index: 2; top: 5px; right: 5px; margin: 0; width: 24px; height: 24px; color: #33506b;
                  background: rgba(255,255,255,.55); box-shadow: inset 0 0 0 1px rgba(255,255,255,.7); -webkit-backdrop-filter: blur(4px); backdrop-filter: blur(4px); }
  .banner.night .zoom { color: #fff; background: rgba(255,255,255,.12); box-shadow: inset 0 0 0 1px rgba(255,255,255,.2); }
  .banner .zoom:hover { background: rgba(255,255,255,.75); color: #33506b; }
  .banner.night .zoom:hover { background: rgba(255,255,255,.22); color: #fff; }
  .banner .ground { position: absolute; left: 0; right: 0; bottom: 0; height: var(--g); background: #9aa1a9; box-shadow: inset 0 2px 0 #b5bbc2; }
  .banner.night .ground { background: #2c323b; box-shadow: inset 0 2px 0 #3a424e; }
  .banner ~ .content { padding-top: 12px; }
  /* Narrow card: no room for the scene beside the text, the wall alone stays. */
  @container (max-width: 300px) { .banner .scene, .banner > .nas-link { display: none; } .banner .head { right: 0; } .banner:has(> .zoom) .head { padding-right: 34px; } }
`;

// In-card confirmation popup, at the top of the card so it stays in view when the card is long.
export const DIALOG_STYLE = `
  .backdrop { position: absolute; inset: 0; background: rgba(0,0,0,.45); display: flex; align-items: flex-start; justify-content: center;
              padding-top: 12px; box-sizing: border-box; z-index: 9; border-radius: inherit; }
  .modal { background: var(--card-background-color, #1c1c1c); color: var(--primary-text-color); width: min(92%, 340px); max-height: calc(100% - 24px);
           overflow: auto; box-sizing: border-box; border-radius: 14px; padding: 16px; box-shadow: 0 8px 30px rgba(0,0,0,.4);
           display: flex; flex-direction: column; gap: 10px; }
  .modal h3 { margin: 0; font-size: 16px; font-weight: 500; display: flex; align-items: center; gap: 8px; }
  .modal h3 .icon { width: 20px; height: 20px; color: var(--nas-crit); }
  .modal .hint { font-size: 13px; color: var(--secondary-text-color); line-height: 1.4; }
  .modal-actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 8px; margin-top: 2px; }
  .modal button.act { border: 0; border-radius: 8px; padding: 8px 14px; font: inherit; font-size: 13px; font-weight: 500; cursor: pointer; }
  .modal button.cancel { background: var(--secondary-background-color, rgba(127,127,127,.12)); color: var(--primary-text-color); }
  .modal button.danger { background: color-mix(in srgb, var(--nas-crit) 16%, transparent); color: var(--primary-text-color); }
  .modal button.cancel:hover { background: color-mix(in srgb, var(--secondary-text-color) 16%, var(--secondary-background-color, transparent)); }
  .modal button.danger:hover { background: color-mix(in srgb, var(--nas-crit) 26%, transparent); }
  .modal button.act:focus-visible { outline: 2px solid var(--primary-color, #03a9f4); outline-offset: 2px; }
`;
// A click inside a dialog (more-info opened from the card, say) is not a click outside the card.
// After the confirmation popup closes, clicks on the card are ignored for this long: the second click of a double
// click on its button would otherwise land on what lies under it (the reboot button, which would open it again).
export const CONFIRM_GUARD_MS = 400;

export const inDialog = (ev) => ev.composedPath().some((n) => ["ha-more-info-dialog", "ha-dialog", "dialog"].includes(n.localName));

// Sparkline of a series (24 h of rates, CPU or RAM): points placed by their time over the last 24 hours, scaled from
// 0 to `max` (100 for a percentage, values above it clamped), else to the series' peak; the line breaks where points are more than two periods apart (recorder off, NAS down). Nothing
// under two points.
export const HIST_REFRESH = 5 * 60000;
export const HIST_PERIOD = 5 * 60000;
export const HIST_WINDOW = 864e5;
// While the first history answer is on its way: the sparkline's box without a curve, so the card has its final height
// from the first render and does not grow (moving the page under it) when the statistics arrive.
export const HIST_WAIT = Object.freeze([]);
export function spark(points, now = Date.now(), max = 0) {
  if (points === HIST_WAIT) return `<svg class="spark" viewBox="0 0 100 30" preserveAspectRatio="none" aria-hidden="true"></svg>`;
  if (!points || points.length < 2) return "";
  const peak = max || Math.max(...points.map((p) => p.v)) || 1;
  const from = now - HIST_WINDOW;
  const x = (t) => Math.max(0, Math.min(100, ((t - from) / HIST_WINDOW) * 100)).toFixed(2);
  const y = (v) => (30 - (Math.min(Math.max(0, v), peak) / peak) * 28).toFixed(2);
  const runs = [[points[0]]];
  for (let i = 1; i < points.length; i++) {
    if (points[i].t - points[i - 1].t > 2 * HIST_PERIOD) runs.push([]);
    runs.at(-1).push(points[i]);
  }
  const segs = runs.filter((r) => r.length > 1);
  if (!segs.length) return "";
  const line = (r) => r.map((p) => `${x(p.t)},${y(p.v)}`).join("L");
  const area = segs.map((r) => `M${x(r[0].t)},30L${line(r)}L${x(r.at(-1).t)},30Z`).join("");
  return `<svg class="spark" viewBox="0 0 100 30" preserveAspectRatio="none" aria-hidden="true"><path class="spark-a" d="${area}"/><path class="spark-l" d="${segs
    .map((r) => `M${line(r)}`)
    .join("")}"/></svg>`;
}

// Points of a recorder statistics series: { t, v }, t at the end of the 5-minute period (start in ms, or an ISO
// string on older Home Assistant versions), without the periods that have no mean.
export const histPoints = (rows) =>
  (rows || [])
    .map((p) => ({ t: (typeof p.start === "number" ? p.start : Date.parse(p.start)) + HIST_PERIOD, v: p.mean }))
    .filter((p) => Number.isFinite(p.t) && Number.isFinite(p.v));

// "A click elsewhere" is caught on the pointer, not only on the click event: on iOS (Safari and the companion app)
// a tap on something that is not clickable (the background, an empty spot, a card with no action) sends no click to
// the page. The handler runs when the press and the release are both outside the card (a slider dragged out of the
// card does not count, and a scroll cancels the pointer); keyboard clicks (no click count) still go through the click
// event. The handler keeps its own checks (dialogs opened from the card…). `tap(ev)` is for the tests.
export const watchOutside = (card, handler) => {
  let downOutside = false;
  const outside = (ev) => !ev.composedPath().includes(card);
  const onDown = (ev) => {
    downOutside = outside(ev);
  };
  const onUp = (ev) => {
    if (downOutside && outside(ev)) handler(ev);
    downOutside = false;
  };
  const onClick = (ev) => {
    if (ev.detail === 0) handler(ev);
  };
  return {
    on() {
      document.addEventListener("pointerdown", onDown, true);
      document.addEventListener("pointerup", onUp, true);
      document.addEventListener("click", onClick, true);
    },
    off() {
      document.removeEventListener("pointerdown", onDown, true);
      document.removeEventListener("pointerup", onUp, true);
      document.removeEventListener("click", onClick, true);
    },
    tap(ev) {
      onDown(ev);
      onUp(ev);
    },
  };
};

// show_wake: false always overrides legacy MAC/target settings.
export const wakeEnabled = (config) =>
  config?.show_wake === true || (config?.show_wake !== false && Boolean(config?.wake_entity || config?.wake_mac));

export class NasBase extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._html = "";
    this._dialog = null;
    this._uid = ++_nasUid;
    this.shadowRoot.addEventListener("click", (ev) => {
      // Just closed: the rest of a double click on the popup's button does nothing (nor folds the mini card).
      if (!this._dialog && Date.now() - (this._dialogClosedAt ?? 0) < CONFIRM_GUARD_MS) {
        ev.stopImmediatePropagation();
        return;
      }
      const path = ev.composedPath();
      const action = path.find((n) => n.dataset?.action);
      // While the confirmation popup is open, only its own buttons and the backdrop act.
      if (this._dialog) {
        if (action?.dataset.action === "dialog-ok") {
          const run = this._dialog.onOk;
          this._closeDialog(true);
          run?.();
        } else if (action?.dataset.action === "dialog-cancel" || path[0] === action) {
          this._closeDialog(true);
        }
        return;
      }
      // The reboot and shutdown buttons open a confirmation popup before pressing the NAS's button.
      if (action?.dataset.action === "reboot" || action?.dataset.action === "shutdown") return this._confirmPower(action.dataset.action);
      const el = path.find((n) => n.dataset?.entity);
      if (el) fireMoreInfo(this, el.dataset.entity);
    });
    // Keyboard access: Enter or Space on a focusable non-button element acts as a click.
    this.shadowRoot.addEventListener("keydown", (ev) => {
      if ((ev.key === "Enter" || ev.key === " ") && ev.target.getAttribute?.("role") === "button") {
        ev.preventDefault();
        ev.target.click();
      }
    });
    // Escape closes the confirmation popup (as Cancel); Tab and Shift+Tab stay on its two buttons. Listened on the
    // window while the popup is open: a re-render or a click on its text can take the focus out of the card.
    this._onKey = (ev) => {
      if (!this._dialog) return;
      if (ev.key === "Tab") {
        const btns = [...this.shadowRoot.querySelectorAll(".modal button")];
        if (!btns.length) return;
        ev.preventDefault();
        const i = btns.indexOf(this.shadowRoot.activeElement);
        btns[(i + (ev.shiftKey ? -1 : 1) + btns.length) % btns.length].focus({ preventScroll: true });
      } else if (ev.key === "Escape") {
        ev.stopPropagation();
        this._closeDialog(true);
      }
    };
    // A click elsewhere on the page closes the confirmation popup (and only that: the mini card stays zoomed).
    this._onDialogOutside = (ev) => {
      if (this._dialog && !ev.composedPath().includes(this) && !inDialog(ev)) {
        this._dialogClosedBy = ev;
        this._closeDialog(false);
      }
    };
  }

  connectedCallback() {
    (this._onDialogOutsideWatch ??= watchOutside(this, (ev) => this._onDialogOutside(ev))).on();
    // A new width (or the web font loaded): the status pill is fitted again, in the next frame.
    if (typeof ResizeObserver === "function") {
      this._resize ??= new ResizeObserver((entries) => {
        const w = Math.round(entries.at(-1).contentRect.width);
        if (w === this._fitWidth) return;
        this._fitWidth = w;
        cancelAnimationFrame(this._fitFrame);
        this._fitFrame = requestAnimationFrame(() => this._fitPill());
      });
      this._resize.observe(this);
    }
    document.fonts?.ready?.then(() => this._fitPill());
    // The 24 h curves are fetched again every HIST_REFRESH even when no sensor of the card changes (a render only
    // happens on a new state), so that they do not grow old on a quiet NAS.
    if (typeof setInterval === "function") {
      clearInterval(this._histTimer);
      this._histTimer = setInterval(() => this._histTick(), HIST_REFRESH);
    }
    // Back on the page after leaving it: rendered again in its default state.
    this._update?.();
  }

  // Timer of the 24 h curves: renders again (which fetches the statistics anew) once they are older than HIST_REFRESH.
  _histTick() {
    if (this._histKey && this._hass && Date.now() - this._histAt > HIST_REFRESH) this._update?.();
  }

  disconnectedCallback() {
    if (this._histTimer) clearInterval(this._histTimer);
    this._histTimer = null;
    this._onDialogOutsideWatch?.off();
    this._resize?.disconnect();
    this._fitWidth = null;
    if (this._fitFrame) cancelAnimationFrame(this._fitFrame);
    // Left (another dashboard view, a conditional card hidden): back to the default state, so that the card does
    // not come back unfolded or with its popup open.
    this._dialog = null;
    window.removeEventListener("keydown", this._onKey);
  }

  // Presses a Home Assistant button entity. A failed call is logged (Home Assistant already shows a toast).
  _press(entityId) {
    Promise.resolve()
      .then(() => this._hass?.callService("button", "press", { entity_id: entityId }))
      .catch((err) => console.error("nas-card: button.press failed", err));
  }

  // A configured MAC uses the Home Assistant Wake on LAN integration, regardless of NAS vendor.
  _wakeMac() {
    const mac = String(this._config.wake_mac || "").trim();
    return /^(?:[\da-f]{2}:){5}[\da-f]{2}$/i.test(mac) || /^(?:[\da-f]{2}-){5}[\da-f]{2}$/i.test(mac) ? mac : null;
  }

  // Wake-up is opt-in. Existing configurations with a MAC or target remain compatible.
  _wakeEnabled() {
    return wakeEnabled(this._config);
  }

  _usableWakeEntity(id) {
    return /^(button|switch)\.[a-z0-9_]+$/.test(id || "") && this._s(id) && this._s(id).state !== "unavailable";
  }

  // Match a registered Wake-on-LAN target to this NAS by its MAC address, not by a guessed label.
  _macWakeEntity(domain) {
    const mac = this._wakeMac()?.replace(/[^a-f\d]/gi, "").toLowerCase();
    if (!mac) return null;
    const entries = this._hass?.entities || {};
    for (const [id, entry] of Object.entries(entries)) {
      if (!id.startsWith(`${domain}.`) || !this._usableWakeEntity(id)) continue;
      const isWake =
        entry?.platform === "wake_on_lan" ||
        (domain === "button" && entry?.platform === "fritz" && /(?:^|_)wake_on_lan$/.test(entry.translation_key || id.slice(7)));
      if (!isWake) continue;
      const device = this._hass?.devices?.[entry.device_id];
      const connections = device?.connections || [];
      if ([...connections].some(([kind, address]) => kind === "mac" && String(address).replace(/[^a-f\d]/gi, "").toLowerCase() === mac)) return id;
    }
    return null;
  }

  // Explicit button first, then the NAS's native UGREEN action, then a matching WOL / FRITZ!Box button.
  _wakeButton(nas) {
    const selected = this._config.wake_entity;
    if (selected?.startsWith("button.") && this._usableWakeEntity(selected)) return selected;
    if (this._usableWakeEntity(nas.scalars.wake)) return nas.scalars.wake;
    return this._macWakeEntity("button");
  }

  // An explicit switch takes priority over auto-discovered buttons.
  _wakeTarget(nas) {
    if (!this._wakeEnabled()) return null;
    const selected = this._config.wake_entity;
    if (selected?.startsWith("switch.") && this._usableWakeEntity(selected)) return { switch: selected };
    const button = this._wakeButton(nas);
    if (button) return { button };
    const wolSwitch = this._macWakeEntity("switch");
    if (wolSwitch) return { switch: wolSwitch };
    const mac = this._wakeMac();
    if (mac && this._hass?.services?.wake_on_lan?.send_magic_packet) return { mac };
    return null;
  }

  _hasWake(nas) {
    return Boolean(this._wakeTarget(nas));
  }

  // Find an existing Ping (ICMP) connectivity sensor for this NAS by its host or exact name.
  // Never use an unrelated Ping sensor (important on dashboards with multiple NAS devices).
  _autoPing(nas) {
    const normalized = (value) => String(value || "").toLowerCase().replace(/[^a-z\d]+/g, "_").replace(/^_|_$/g, "");
    const url = String(this._config.url || nas.info?.url || "");
    const host = url.match(/^\w+:\/\/([^/:?#]+)/)?.[1];
    const aliases = new Set([host, nas.info?.name, nas.nasId, this._config.nas, this._config.title].map(normalized).filter((v) => v.length >= 3));
    if (!aliases.size) return null;
    let best = null;
    let bestScore = 0;
    let tied = false;
    for (const [id, state] of Object.entries(this._hass?.states || {})) {
      if (!id.startsWith("binary_sensor.")) continue;
      const entry = this._hass?.entities?.[id];
      if (entry?.platform && entry.platform !== "ping") continue;
      if (!entry?.platform && state.attributes?.device_class !== "connectivity") continue;
      const device = this._hass?.devices?.[entry?.device_id];
      const names = [id.slice(14), state.attributes?.friendly_name, device?.name_by_user, device?.name, state.attributes?.host, state.attributes?.ip_address]
        .map(normalized).filter(Boolean);
      const score = Math.max(0, ...names.flatMap((name) => [...aliases].map((alias) =>
        name === alias ? 3 : name === `${alias}_ping` || name === `ping_${alias}` || name === `${alias}_connectivity` ? 2 : 0
      )));
      if (score > bestScore) {
        best = id;
        bestScore = score;
        tied = false;
      } else if (score && score === bestScore) {
        tied = true;
      }
    }
    return tied ? null : best;
  }

  // An explicit (existing) sensor wins, otherwise a matching Ping sensor is auto-discovered.
  _pingEntity(nas) {
    const requested = this._config.online_entity;
    if (requested && this._s(requested)) return requested;
    return this._autoPing(nas);
  }

  // On/off Ping sensors are authoritative; missing/unknown sensors fall back to NAS telemetry.
  _powerState(nas) {
    const ping = this._pingEntity(nas);
    const state = this._s(ping)?.state;
    if (state === "on") return "online";
    if (state === "off") return "offline";
    const sc = nas.scalars;
    const monitored = ["cpu_usage", "ram_usage", "sys_temp", "cpu_temp", "runtime", "boot", "lan_up", "lan_down", "server_status"]
      .map((key) => this._s(sc[key]))
      .filter(Boolean);
    if (monitored.some((s) => !NO_VALUE.has(s.state))) return "online";
    if (monitored.length && monitored.every((s) => s.state === "unavailable")) return "offline";
    return "unknown";
  }

  _wake(nas) {
    const target = this._wakeTarget(nas);
    if (!target) return;
    if (target.button) return this._press(target.button);
    if (target.switch) {
      Promise.resolve()
        .then(() => this._hass?.callService("switch", "turn_on", { entity_id: target.switch }))
        .catch((err) => console.error("nas-card: switch.turn_on failed", err));
      return;
    }
    const data = { mac: target.mac };
    if (this._config.wake_broadcast?.trim()) data.broadcast_address = this._config.wake_broadcast.trim();
    Promise.resolve()
      .then(() => this._hass?.callService("wake_on_lan", "send_magic_packet", data))
      .catch((err) => console.error("nas-card: Wake-on-LAN failed", err));
  }

  _confirmReboot() {
    return this._confirmPower("reboot");
  }

  // When offline, the existing reboot button confirms a wake-up instead.
  _confirmPower(kind) {
    const nas = discover(this._hass, this._config.nas);
    const offline = this._powerState(nas) === "offline";
    const wake = kind === "reboot" && offline && this._hasWake(nas);
    if (kind === "reboot" && offline && !wake) return;
    const action = wake ? "wake" : kind;
    const id = nas.scalars[kind];
    if (!wake && (!id || this._s(id)?.state === "unavailable")) return;
    this._dialog = {
      kind,
      icon: action === "reboot" ? ICONS.restart : ICONS.power,
      title: this._t(action),
      body: this._t(`${action}_confirm`),
      ok: this._t(`${action}_btn`),
      onOk: () => (wake ? this._wake(nas) : this._press(id)),
    };
    window.addEventListener("keydown", this._onKey);
    this._update();
    // After the re-render: the focus on the confirm button, without scrolling the page towards the card.
    this.shadowRoot.querySelector?.(".modal .danger")?.focus({ preventScroll: true });
  }

  // Closes the popup; `refocus` gives the focus back to the button that opened it (not after a click elsewhere on the page).
  _closeDialog(refocus) {
    if (!this._dialog) return;
    const kind = this._dialog.kind || "reboot";
    this._dialog = null;
    this._dialogClosedAt = Date.now();
    window.removeEventListener("keydown", this._onKey);
    this._update();
    if (refocus) this.shadowRoot.querySelector?.(`[data-action="${kind}"]`)?.focus({ preventScroll: true });
  }

  _dialogHtml() {
    const d = this._dialog;
    if (!d) return "";
    return `<style>${DIALOG_STYLE}</style><div class="backdrop" data-action="dialog-backdrop">
      <div class="modal" role="alertdialog" aria-modal="true" aria-labelledby="dlg-title" aria-describedby="dlg-body">
        <h3 id="dlg-title">${svgIcon(d.icon || ICONS.restart)}${esc(d.title)}</h3>
        <div class="hint" id="dlg-body">${esc(d.body)}</div>
        <div class="modal-actions">
          <button type="button" class="act cancel" data-action="dialog-cancel">${esc(this._t("cancel"))}</button>
          <button type="button" class="act danger" data-action="dialog-ok">${esc(d.ok)}</button>
        </div>
      </div>
    </div>`;
  }

  // One button serves reboot (online) and Wake-on-LAN (offline); preserves the old behaviour if WOL is unset.
  _rebootBtn(nas) {
    const id = nas.scalars.reboot;
    const offline = this._powerState(nas) === "offline";
    const wake = offline && this._hasWake(nas);
    if (!id && !wake) return "";
    // The "Wake-on-LAN unavailable" hint only appears when WOL is enabled but no target is usable;
    // a card without Wake-on-LAN keeps the plain restart button, as before.
    const wakeHint = offline && !wake && this._wakeEnabled();
    const label = esc(this._t(wake ? "wake" : wakeHint ? "wake_missing" : "reboot"));
    const disabled = !wake && (offline || this._s(id)?.state === "unavailable") ? " disabled" : "";
    return `<button class="action" data-action="reboot" title="${label}" aria-label="${label}"${disabled}>${svgIcon(wake ? ICONS.power : ICONS.restart)}</button>`;
  }

  // Round shutdown button beside it, when the NAS exposes a shutdown button (UGREEN NAS, Synology DSM) and
  // `show_shutdown` is not false.
  _shutdownBtn(nas) {
    const id = nas.scalars.shutdown;
    if (!id || this._config.show_shutdown === false) return "";
    const label = esc(this._t("shutdown"));
    const disabled = this._powerState(nas) === "offline" || this._s(id)?.state === "unavailable" ? " disabled" : "";
    return `<button class="action" data-action="shutdown" title="${label}" aria-label="${label}"${disabled}>${svgIcon(ICONS.power)}</button>`;
  }

  // Update available (Synology DSM update entity on, UGREEN "Update Available" sensor "True"): the version it
  // brings, for the update chip.
  _updateInfo(nas) {
    const u = this._s(nas.scalars.update);
    if (!u || !/^(on|true)$/i.test(String(u.state))) return null;
    const latest = u.attributes?.latest_version ?? u.attributes?.available_version;
    const version = latest && /\d/.test(String(latest)) ? String(latest) : "";
    return { id: u.entity_id, text: this._t("update_available"), version };
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
    // show_title / show_subtitle: the header's title / subtitle, hidden by the stylesheet
    this.toggleAttribute?.("hide-title", config.show_title === false);
    this.toggleAttribute?.("hide-subtitle", config.show_subtitle === false);
    this._html = "";
    this._update();
  }

  // Server status as shown: the healthy words of the integrations ("Normal", "good") go through
  // the translations, any other value is shown as reported. The Synology safety binary sensor has
  // no word at all: both of its states are translated. Without value (NAS offline), every brand shows
  // the translated unavailable / unknown state rather than a security warning.
  _statusText(status, brand) {
    if (NO_VALUE.has(status.state)) return this._t(status.state);
    if (brand === "synology") return this._t(String(status.state) === "off" ? "status_ok" : "status_problem");
    return /^(normal|good|healthy|ok)$/i.test(String(status.state)) ? this._t("status_ok") : status.state;
  }

  // Class of the server status: healthy, problem, or no value (neutral).
  _statusClass(nas, status) {
    return NO_VALUE.has(status.state) ? "na" : statusOk(nas, status) ? "ok" : "warn";
  }

  // Title of a status dot (volume, disk): the reported state, translated when it has no value.
  _dotTitle(status) {
    return !status ? "" : NO_VALUE.has(status.state) ? this._t(status.state) : status.state;
  }

  _t(key) {
    return t(this._hass, this._config, key);
  }

  // Locale of the numbers (decimal separator of the card's language).
  _loc() {
    return fmtLang(this._hass, this._config);
  }

  // Class of a reading against its thresholds (configured or default): ok, warn or crit.
  _level(metric, v) {
    return level(v, ...thresholds(this._config, metric));
  }

  // The three gauge readings, shared by the full card and the mini card: CPU temperature when the
  // integration reports one, system temperature otherwise.
  _vitals(sc) {
    const tempId = sc.cpu_temp || sc.sys_temp;
    const { c, text } = temperature(this._s(tempId), this._hass);
    return { cpu: num(this._s(sc.cpu_usage)), ram: num(this._s(sc.ram_usage)), tempId, temp: c, tempText: text };
  }

  _s(id) {
    return id ? this._hass.states[id] : undefined;
  }

  // Text of an entity shown as a name or a label (NAS name and model, OS version, CPU model, volume
  // and disk labels): never "unavailable" / "unknown". While the entity has no value (UGREEN NAS
  // offline), the last value shown is kept, so the card still tells which NAS and which disk it is;
  // without one, null lets the caller fall back on its generic name.
  _text(id) {
    const s = this._s(id);
    if (!s) return null;
    if (!NO_VALUE.has(s.state) && s.state !== "") {
      _lastText.set(id, s.state);
      return s.state;
    }
    return _lastText.get(id) ?? null;
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
    if (nas.scalars.boot && durationSeconds(this._s(nas.scalars.runtime)) === null) sig.push(Math.floor(Date.now() / 60000));
    const walk = (o) => {
      for (const v of Object.values(o)) {
        if (typeof v === "string") sig.push(h.states[v]);
        else if (v && typeof v === "object") walk(v);
      }
    };
    walk(nas.scalars);
    const ping = this._pingEntity(nas);
    if (ping) sig.push(h.states[ping]);
    const wol = this._wakeTarget(nas);
    const targetId = wol?.button || wol?.switch || this._config.wake_entity;
    if (targetId) sig.push(h.states[targetId]);
    sig.push(h.services?.wake_on_lan?.send_magic_packet);
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
    this._fitPill();
  }

  // The status pill goes right after the title only when the whole title and the whole label fit there; otherwise it
  // takes a line of its own under the subtitle (.titles.below, the subtitle on one line). When the label does not fit
  // that line either, or the banner has no room for the three lines above its strip, the pill keeps its dot only
  // (.titles.dot-only, back beside the title when the dot fits there). Measured after render, in every language.
  _fitPill() {
    // Home Assistant's <ha-card> (a Lit element) shows its content only from its first update, a microtask after it
    // is connected: measured before, everything is 0 px wide and the pill lands on the wrong line. Fitted then.
    const haCard = this.shadowRoot?.querySelector?.("ha-card");
    if (haCard && haCard.hasUpdated === false) {
      this._pillWait ??= (haCard.updateComplete?.then ? haCard.updateComplete : new Promise((r) => requestAnimationFrame(r))).then(() => {
        this._pillWait = null;
        this._fitPill();
      });
      return;
    }
    for (const t of this.shadowRoot?.querySelectorAll?.(".titles") || []) {
      const chip = t.querySelector(".trow > .chip");
      t.classList.remove("below", "dot-only");
      if (!chip?.getBoundingClientRect || !chip.getClientRects().length) continue;
      const row = chip.parentElement;
      const name = row.querySelector(".name");
      const fits = () => {
        const shown = name && getComputedStyle(name).display !== "none";
        const title = shown ? textWidth(name) + (parseFloat(getComputedStyle(row).columnGap) || 0) : 0;
        return title + chip.getBoundingClientRect().width <= row.getBoundingClientRect().width + 0.5;
      };
      if (fits()) continue;
      t.classList.add("below");
      const sub = t.querySelector(".sub");
      if (sub) sub.title = sub.textContent.trim();
      const text = chip.querySelector(".txt");
      const banner = t.closest(".banner");
      const tb = t.getBoundingClientRect();
      const bb = banner?.getBoundingClientRect();
      const ground = banner ? parseFloat(getComputedStyle(banner).getPropertyValue("--g")) || 0 : 0;
      const tall = !!bb && (tb.top < bb.top - 0.5 || tb.bottom > bb.bottom - ground + 0.5);
      if (!tall && !(text && text.scrollWidth > text.clientWidth + 0.5)) continue;
      t.classList.add("dot-only");
      t.classList.remove("below");
      if (!fits()) t.classList.add("below");
    }
  }

  // The worst RAID that is not healthy (degraded, rebuilding…), or null.
  _worstRaid(nas) {
    const raids = new Map();
    for (const pool of Object.values(nas.pools))
      for (const vol of Object.values(pool.volumes)) {
        const id = raidEntity(nas, pool, vol);
        if (id && !raids.has(id)) raids.set(id, { id, rs: raidState(this._s(id)), level: this._text(pool.level)?.toUpperCase() });
      }
    const rank = { crit: 2, warn: 1 };
    return [...raids.values()].filter((r) => r.rs && rank[r.rs.cls]).sort((a, b) => rank[b.rs.cls] - rank[a.rs.cls])[0] ?? null;
  }

  // State of the header icon and of the illustration: ok, warn (status problem or degraded RAID), crit (failed
  // RAID) or na (offline, no value).
  _headerState(nas, status) {
    if (this._powerState(nas) === "offline") return "na";
    let st = status ? this._statusClass(nas, status) : "ok";
    if (st === "na") return st;
    const raid = this._worstRaid(nas)?.rs.cls;
    if (raid === "crit") st = "crit";
    else if (raid === "warn" && st === "ok") st = "warn";
    return st;
  }

  _header(nas) {
    const sc = nas.scalars;
    const c = this._config;
    const status = this._s(sc.server_status);
    const statusText = status ? this._statusText(status, nas.brand) : "";
    // The system message (UGREEN) explains the status; without one, the pill's title repeats its text,
    // which the narrow pill (dot only) hides.
    const message = this._s(sc.system_message);
    const messageText = message && !NO_VALUE.has(message.state) ? message.state : "";
    const name = c.title || this._text(sc.name) || nas.info?.name || `${BRAND_NAMES[nas.brand]} NAS`;
    const model = this._text(sc.model) || nas.info?.model;
    const version = this._text(sc.version);
    const os = version ? `UGOS ${version}` : osVersion(nas.info?.version, nas.brand);
    // The compact mini card shares its header with the NAS picture: the model alone, the OS version zoomed in.
    const sub = [model, os && !this._compactHeader() ? os : null].filter(Boolean);
    const state = this._headerState(nas, status);
    const icon = this._link(webUrl(c.brand_url) || BRAND_SITES[nas.brand], this._t("open_brand").replace("{brand}", BRAND_NAMES[nas.brand]), "brand-link", headerIcon(state, nas.brand));
    const chip = status
      ? `<span class="chip clickable ${this._statusClass(nas, status)}" role="button" tabindex="0" data-entity="${status.entity_id}" title="${esc(
          messageText || statusText
        )}" aria-label="${esc(statusText)}"><span class="dot"></span><span class="txt">${esc(statusText)}</span></span>`
      : "";
    const nameHtml = `<div class="name">${esc(name)}</div>`;
    const subHtml = `<div class="sub"><div class="parts">${sub.map((x) => `<span>${esc(x)}</span>`).join("")}</div></div>`;
    const titles = `
        <div class="titles"><div class="trow">${nameHtml}${chip}</div>${subHtml}</div>`;
    const href = webUrl(c.url) || deviceUrl(this._hass, nas);
    if (c.illustration !== false) {
      // The illustrated header: the card's drawing of the model (or the picture given by URL) on the scene.
      let art = null;
      if (c.show_image !== false)
        art = /^(https?:|\/|data:)/.test(c.image || "") ? nasArtImage(c.image) : nasArt(nasSvg(c.image || model, nas.brand), this._uid);
      const scene = nasScene(this._uid, art, state);
      return `
      <div class="header banner st-${state}${nasIsNight(this._hass, c) ? " night" : ""}">
        ${art ? this._link(href, this._t("open_nas"), "nas-link", scene) : scene}
        <div class="head">${icon}${titles}</div>
        <div class="ground"></div>
        ${this._zoomButton()}
      </div>${this._dialogHtml()}`;
    }
    return `
      <div class="header">
        ${icon}${titles}
        ${
          c.show_image !== false
            ? this._link(href, this._t("open_nas"), "nas-link", `<img class="nas" src="${esc(nasPicture(c.image, model, nas.brand))}" alt="${esc(model || "NAS")}">`)
            : ""
        }
        ${this._zoomButton()}
      </div>${this._dialogHtml()}`;
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
