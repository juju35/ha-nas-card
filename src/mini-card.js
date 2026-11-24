// ---------------------------------------------------------------------------
// Mini card
// ---------------------------------------------------------------------------
import { ICONS } from "./core.js";
import { bootAge, durationSeconds, esc, fmtRate, fmtUptime, svgIcon, toBps } from "./helpers.js";
import { discover, volumeUsage } from "./entity-discovery-2.js";
import { BANNER_STYLE, BASE_STYLE, inDialog, spark, watchOutside } from "./shared-styles.js";
import { NasCard } from "./full-card.js";

// Download / upload tiles with their 24 h curve: the network section of the full card, the rates row of the mini card.
export const NET_STYLE = `
  .net { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; }
  .tile { display: flex; align-items: center; gap: 8px; padding: 6px 10px; border-radius: 10px;
          background: var(--secondary-background-color, rgba(127,127,127,.08)); position: relative; overflow: hidden; }
  .tile > :not(.spark) { position: relative; }
  /* 24 h curve in its own 24 px band under the icon and the text, never behind them. */
  .tile:has(> .spark) { padding-bottom: 30px; }
  .tile .spark { position: absolute; inset: auto 0 0; width: 100%; height: 24px; pointer-events: none; }
  .spark-a { fill: color-mix(in srgb, var(--c) 12%, transparent); }
  .spark-l { fill: none; stroke: color-mix(in srgb, var(--c) 50%, transparent); stroke-width: 1.2; vector-effect: non-scaling-stroke; }
  .tile .icon { color: var(--c, var(--nas-accent)); }
  .tile .k { font-size: 11px; color: var(--secondary-text-color); }
  .tile .v { font-size: 14px; font-weight: 500; }
  .tile.up { --c: var(--info-color, #039be5); }
  .tile.down { --c: var(--nas-accent); }
  /* A narrow card (a mini card on 6 columns of a phone): one tile per line, so that each rate keeps its whole text. */
  @container (max-width: 260px) { .net { grid-template-columns: minmax(0, 1fr); } }
`;

export const MINI_STYLE = `
  .nas { height: 44px; width: auto; flex: none; max-width: 35%; object-fit: contain; }
  .nas-link { max-width: 35%; }
  /* The status shows in the footer. */
  .trow > .chip { display: none; }
  .name { font-size: 16px; }
  .content { padding: 0 12px 12px; display: flex; flex-direction: column; gap: 8px; }
  /* One label column for all the rows, as wide as the longest label (subgrid); without subgrid, the fixed columns. */
  .metrics { display: grid; grid-template-columns: 18px minmax(64px, max-content) minmax(0, 1fr) 56px; gap: 8px; }
  .metric { grid-column: 1 / -1; display: grid; grid-template-columns: 18px 64px 1fr 56px; grid-template-columns: subgrid;
            align-items: center; gap: 8px; font-size: 13px; }
  .metric > span:first-of-type { white-space: nowrap; }
  .metric .icon { color: var(--secondary-text-color); }
  .metric .v { text-align: right; font-weight: 500; }
  /* 24 h curve of the CPU and RAM rows, behind the bar only: it never crosses the label or the value. */
  .metric { position: relative; isolation: isolate; }
  .metric .spark { position: absolute; grid-area: 1 / 3 / 2 / 4; inset: -3px 0; width: 100%; height: calc(100% + 6px); z-index: -1; pointer-events: none; }
  /* The items wrap rather than truncate the status when they do not fit on one line. */
  .foot { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 4px 8px; font-size: 12px; color: var(--secondary-text-color); margin-top: 2px; }
  .foot span { display: inline-flex; align-items: center; gap: 2px; white-space: nowrap; }
  .foot > span { flex: none; }
  .foot > [data-key="status"] { flex: 0 1 auto; min-width: 0; overflow: hidden; }
  .foot > [data-key="network"] { flex: 0 1 auto; min-width: 0; flex-wrap: wrap; justify-content: flex-end; column-gap: 8px; }
  .foot .txt { display: block; min-width: 0; overflow: hidden; text-overflow: ellipsis; }
  .foot .icon { width: 14px; height: 14px; }
  .foot > .raid { flex: 0 1 auto; min-width: 0; overflow: hidden; font-weight: 500; color: color-mix(in srgb, var(--c) 40%, var(--primary-text-color, #212121)); }
  .foot > .upd { flex: 0 1 auto; min-width: 0; overflow: hidden; color: color-mix(in srgb, var(--c) 40%, var(--primary-text-color, #212121)); font-weight: 500; }
  /* Narrow mini card: the uptime goes first, then the picture. */
  @container (max-width: 340px) { .foot [data-key="uptime"] { display: none; } }
  @container (max-width: 220px) { .nas-link { display: none; } .header > .nas { display: none; } }
  /* Very narrow mini card (6 columns on a phone, about 156 px): icon, bar and value; the label stays for screen
     readers (and in the row's title). */
  @container (max-width: 200px) {
    .metrics { grid-template-columns: 18px minmax(0, 1fr) auto; }
    .metric { grid-template-columns: 18px minmax(0, 1fr) auto; grid-template-columns: subgrid; position: relative; }
    .metric > span:first-of-type { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
    .metric .spark { grid-area: 1 / 2 / 2 / 3; }
  }
`;

// The mini card extends the full card: its zoom button (top right, `zoom: false` removes it) switches it to the
// full card's content, same configuration, and back; a click anywhere outside the card brings it back too.
export class NasMiniCard extends NasCard {
  static getConfigElement() {
    return document.createElement("nas-mini-card-editor");
  }

  constructor() {
    super();
    this._zoomed = false;
    this.shadowRoot.addEventListener("click", (ev) => this._zoomClick(ev));
    // A click outside the card, and not in a dialog opened from it, brings it back to the compact view.
    this._onOutside = (ev) => {
      // The click that closed the reboot confirmation popup only closes the popup.
      if (this._dialogClosedBy === ev) return;
      if (this._zoomed && !ev.composedPath().includes(this) && !inDialog(ev)) this._setZoom(false);
    };
  }

  connectedCallback() {
    super.connectedCallback();
    (this._onOutsideWatch ??= watchOutside(this, (ev) => this._onOutside(ev))).on();
    // Back on the page after leaving it: rendered again in its default state.
    this._update?.();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._onOutsideWatch?.off();
    // Left (another dashboard view, a conditional card hidden): back to the default state, so that the card does
    // not come back unfolded or with its popup open.
    this._zoomed = false;
  }

  getCardSize() {
    return this._zoomed ? super.getCardSize() : 3;
  }

  getGridOptions() {
    return this._zoomed ? super.getGridOptions() : { columns: 6, min_columns: 6 };
  }

  _setZoom(zoomed) {
    this._zoomed = zoomed;
    // The reboot button is only on the zoomed view: folding drops its popup.
    if (!zoomed && this._dialog) {
      this._dialog = null;
      window.removeEventListener("keydown", this._onKey);
    }
    this._update(this._sig);
  }

  // A click on the zoom button: never a tap on anything else of the card.
  _zoomClick(ev) {
    if (!ev.target?.closest?.(".zoom")) return;
    ev.stopPropagation();
    this._setZoom(!this._zoomed);
    // Keyboard use (Enter / Space: no click count) keeps the focus on the button, without scrolling the page.
    if (ev.detail === 0) this.shadowRoot.querySelector(".zoom")?.focus({ preventScroll: true });
  }

  _compactHeader() {
    return !this._zoomed;
  }

  _zoomButton() {
    if (this._config.zoom === false) return "";
    const z = this._zoomed;
    return `<button class="zoom" title="${esc(this._t(z ? "zoom_out" : "zoom_in"))}">${svgIcon(z ? ICONS.collapse : ICONS.expand)}</button>`;
  }

  _metric(id, icon, label, pct, display, cls, hist = null) {
    // Rows without an entity (the aggregated storage row) open no more-info: not focusable.
    const act = id ? ` role="button" tabindex="0" data-entity="${id}"` : "";
    // The title gives the label back on a very narrow card, where only the icon shows.
    // The CPU and RAM rows draw their last 24 hours behind them, on a 0–100 % scale.
    return `<div class="metric ${id ? "clickable " : ""}${cls}"${act} title="${esc(label)}">${id ? spark(hist?.[id], Date.now(), 100) : ""}
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
    const { cpu, ram, tempId, temp, tempText } = this._vitals(sc);
    // With their 24 h curves, the rates get the full card's tiles above the footer; without, they stay in the footer.
    const netTiles = c.show_network !== false && c.show_history !== false && (sc.lan_down || sc.lan_up);
    // One statistics query: the CPU and RAM rows (always shown on the compact view) and the rates' tiles.
    const hist = this._histFor(sc, true, netTiles);
    const rows = [];
    rows.push(this._metric(sc.cpu_usage, ICONS.cpu, this._t("cpu"), cpu, cpu === null ? "—" : `${Math.round(cpu)}%`, this._level("cpu", cpu), hist));
    rows.push(this._metric(sc.ram_usage, ICONS.ram, this._t("ram"), ram, ram === null ? "—" : `${Math.round(ram)}%`, this._level("ram", ram), hist));
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
        rows.push(this._metric("", ICONS.database, this._t("storage"), pct, `${pct.toFixed(0)}%`, this._level("volume", pct)));
    }
    // Temperature after the storage, as on the System Monitor mini card.
    rows.push(
      this._metric(tempId, ICONS.temp, this._t("temperature"), temp, tempText, this._level("temperature", temp))
    );
    const foot = [];
    if (status) {
      // The full text in title and aria-label too: on a narrow card, the visible one may be truncated.
      const text = esc(this._statusText(status, nas.brand));
      foot.push(
        `<span class="clickable ${this._statusClass(nas, status)}" role="button" tabindex="0" data-key="status" data-entity="${status.entity_id}" title="${text}" aria-label="${text}"><span class="dot"></span>&nbsp;<span class="txt">${text}</span></span>`
      );
    }
    // A RAID that is not healthy (degraded, rebuilding…): the worst one, in its colour, opening its entity.
    const worst = this._worstRaid(nas);
    if (worst) {
      const r = worst;
      const text = esc(`${r.level || "RAID"} · ${this._raidText(r.rs)}`);
      foot.push(
        `<span class="clickable raid ${r.rs.cls}" role="button" tabindex="0" data-key="raid" data-entity="${r.id}" title="${text}" aria-label="${text}"><span class="dot"></span>&nbsp;<span class="txt">${text}</span></span>`
      );
    }
    if (c.show_network !== false && !netTiles && (sc.lan_down || sc.lan_up))
      // Each rate stays on one line; on a very narrow card, the upload rate goes under the download rate.
      foot.push(
        `<span class="clickable" role="button" tabindex="0" data-key="network" data-entity="${sc.lan_down || sc.lan_up}"><span class="rate">${svgIcon(ICONS.down)}${fmtRate(toBps(this._s(sc.lan_down)), this._loc())}</span><span class="rate">${svgIcon(
          ICONS.up
        )}${fmtRate(toBps(this._s(sc.lan_up)), this._loc())}</span></span>`
      );
    const runtime = durationSeconds(this._s(sc.runtime)) ?? bootAge(this._s(sc.boot));
    const upd = this._updateInfo(nas);
    if (upd) {
      const text = esc(`${upd.text}${upd.version ? ` · ${upd.version}` : ""}`);
      foot.push(
        `<span class="clickable upd" role="button" tabindex="0" data-key="update" data-entity="${upd.id}" title="${text}" aria-label="${text}">${svgIcon(ICONS.update)}<span class="txt">${esc(
          upd.version || upd.text
        )}</span></span>`
      );
    }
    if (runtime !== null) foot.push(`<span data-key="uptime">${svgIcon(ICONS.timer)}${fmtUptime(runtime, this._hass, this._config)}</span>`);
    return `<style>${BASE_STYLE}${MINI_STYLE}${NET_STYLE}${this._config.illustration === false ? "" : BANNER_STYLE}</style>
      <ha-card>
        ${this._header(nas)}
        <div class="content">
          <div class="metrics">${rows.join("")}</div>
          ${netTiles ? this._netTiles(sc, hist) : ""}
          ${foot.length ? `<div class="foot">${foot.join("")}</div>` : ""}
        </div>
      </ha-card>`;
  }
}
