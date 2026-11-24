// ---------------------------------------------------------------------------
// Full card
// ---------------------------------------------------------------------------
import { ICONS } from "./core.js";
import { bootAge, diskHealth, dotClass, durationSeconds, esc, fmtBytes, fmtRate, fmtUptime, num, raidEntity, raidState, ramPair, ramUsedBytes, svgIcon, temperature, toBps, toBytes } from "./helpers.js";
import { DEVICE_ID_RE, discover, nasValue, volumeUsage } from "./entity-discovery-2.js";
import { BANNER_STYLE, BASE_STYLE, HIST_REFRESH, HIST_WAIT, HIST_WINDOW, NasBase, histPoints, spark } from "./shared-styles.js";
import { NET_STYLE } from "./mini-card.js";

export const ring = (pct, cls) => {
  const r = 26;
  const c = 2 * Math.PI * r;
  const p = pct === null ? 0 : Math.max(0, Math.min(100, pct));
  return `<svg class="ring ${cls}" viewBox="0 0 64 64">
    <circle cx="32" cy="32" r="${r}" class="track"/>
    <circle cx="32" cy="32" r="${r}" class="value" stroke-dasharray="${((p / 100) * c).toFixed(1)} ${c.toFixed(1)}"/>
  </svg>`;
};

export const FULL_STYLE = `
  .nas { height: 48px; width: auto; flex: none; max-width: 40%; object-fit: contain; filter: drop-shadow(0 4px 6px rgba(0,0,0,.25)); }
  .nas-link { max-width: 40%; }
  /* Phone-wide card (a zoomed mini card, a full card on a phone): a smaller picture leaves the title and the
     status pill their room. */
  @container (max-width: 420px) { .nas, .nas-link { max-width: 28%; } }
  .content { padding: 0 12px 12px; display: flex; flex-direction: column; gap: 12px; }
  .section-title { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 500; text-transform: uppercase;
                   letter-spacing: .04em; color: var(--secondary-text-color); margin-bottom: 6px; }
  .section-title .icon { width: 16px; height: 16px; }
  .gauges { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
  .gauge { display: flex; flex-direction: column; align-items: center; position: relative; isolation: isolate; border-radius: 10px; overflow: hidden; }
  /* 24 h curve of the CPU and RAM gauges in its own 24 px band under the ring and the label, never behind the text. */
  .gauge:has(> .spark) { padding-bottom: 28px; }
  .gauge .spark { position: absolute; inset: auto 0 0; width: 100%; height: 24px; z-index: -1; pointer-events: none; }
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
  .facts > .power { margin-left: auto; gap: 4px; }
  .facts > .power > .action { display: grid; margin: -4px 0; }
  .vol { margin-bottom: 8px; display: grid; grid-template-columns: minmax(0, 1fr) auto; column-gap: 8px; align-items: center; }
  .vol .row { grid-column: 1; grid-row: 1; }
  .vol:last-child { margin-bottom: 0; }
  .row { display: flex; align-items: center; gap: 8px; font-size: 13px; }
  .row .grow { flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .row .tag { font-size: 11px; padding: 1px 6px; border-radius: 6px; background: var(--secondary-background-color, rgba(127,127,127,.12));
              color: var(--secondary-text-color); text-transform: uppercase; flex: 0 1 auto; min-width: 0; overflow: hidden;
              text-overflow: ellipsis; white-space: nowrap; }
  .row .chip.raid { flex: 0 1 auto; min-width: 0; text-transform: none; }
  /* On a narrow card the volume name keeps a readable width: the tags and the RAID chip give way first (the chip
     down to its dot, its whole state in its title). */
  .vol .row .grow { min-width: min(64px, 30%); }
  .vol .bar { margin: 4px 0 0; grid-column: 1 / -1; grid-row: 2; }
  .vol .detail { font-size: 11px; color: var(--secondary-text-color); display: flex; justify-content: flex-end; grid-column: 2; grid-row: 1; gap: 8px; }
  .disks { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 6px; }
  .disk { padding: 6px 8px; border-radius: 10px; background: var(--secondary-background-color, rgba(127,127,127,.08)); min-width: 0; }
  .disk .top { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 500; }
  .disk .top span:nth-child(2) { flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .disk .model { font-size: 11px; color: var(--secondary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin: 0 0 2px; }
  .disk .meta { display: flex; justify-content: space-between; font-size: 11px; }
  .disk .temp { color: color-mix(in srgb, var(--c, currentColor) 40%, var(--primary-text-color, #212121)); font-weight: 500; }
  .fans { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 6px; }
  .spin { animation: spin 1.6s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  @media (prefers-reduced-motion: reduce) { .spin { animation: none; } .ring .value { transition: none; } }
  /* Narrow card (6 columns of a sections view): no picture, so the title keeps its room, and each volume puts its
     detail under the bar, so its name keeps the row. */
  @container (max-width: 340px) {
    .nas-link { display: none; }
    .header > .nas { display: none; }
    .vol { grid-template-columns: minmax(0, 1fr); }
    .vol .detail { grid-column: 1 / -1; grid-row: 3; justify-content: space-between; margin-top: 2px; }
  }
`;

export class NasCard extends NasBase {
  static getConfigElement() {
    return document.createElement("nas-card-editor");
  }

  static getStubConfig(hass) {
    // The NAS this card shows without nas (the first of the editor's list).
    const nas = hass ? nasValue(hass, discover(hass, "")) : null;
    return nas ? { nas } : {};
  }

  getCardSize() {
    return 8;
  }

  // 9 columns: 234 px on a phone (narrower, the gauges and the tiles no longer fit).
  getGridOptions() {
    return { columns: 12, min_columns: 9 };
  }

  _render() {
    const nas = discover(this._hass, this._config.nas);
    if (!nas.nasId) return this._noNas();
    const c = this._config;
    const parts = [];
    const sys = c.show_system !== false;
    const net = c.show_network !== false;
    const hist = this._histFor(nas.scalars, sys, net);
    if (sys) parts.push(this._system(nas, hist));
    if (net) parts.push(this._network(nas, hist));
    if (c.show_volumes !== false) parts.push(this._volumes(nas));
    if (c.show_disks !== false) parts.push(this._disks(nas));
    if (c.show_fans !== false) parts.push(this._fans(nas));
    return `<style>${BASE_STYLE}${FULL_STYLE}${NET_STYLE}${this._config.illustration === false ? "" : BANNER_STYLE}</style>
      <ha-card>
        ${this._header(nas)}
        <div class="content">${parts.filter(Boolean).join("")}</div>
      </ha-card>`;
  }

  _gauge(id, label, icon, value, display, cls, hist = null) {
    // Without an entity there is no more-info to open: no button role, no tab stop.
    const act = id ? ` role="button" tabindex="0" data-entity="${id}"` : "";
    // The CPU and RAM gauges draw their last 24 hours behind them, on a 0–100 % scale.
    return `<div class="gauge ${id ? "clickable " : ""}${cls}"${act}>${id ? spark(hist?.[id], Date.now(), 100) : ""}
      ${ring(value, cls)}
      <div class="val">${svgIcon(icon)}<b>${display}</b></div>
      <div class="lbl">${label}</div>
    </div>`;
  }

  _system(nas, hist = null) {
    const sc = nas.scalars;
    const { cpu, ram, tempId, temp, tempText } = this._vitals(sc);
    const ramTotal = toBytes(this._s(sc.ram_total));
    const ramAvail = toBytes(this._s(sc.ram_available));
    const ramUsed = ramUsedBytes(toBytes(this._s(sc.ram_used)), ramTotal, ramAvail, ram);
    const ramLabel = ramUsed !== null && ramTotal !== null ? `${this._t("ram")} · ${ramPair(ramUsed, ramTotal, this._loc())}` : this._t("ram");
    const runtime = durationSeconds(this._s(sc.runtime)) ?? bootAge(this._s(sc.boot));
    const facts = [];
    if (runtime !== null)
      facts.push(
        `<span class="clickable" role="button" tabindex="0" data-entity="${sc.runtime || sc.boot}">${svgIcon(ICONS.timer)}${this._t("uptime")} ${fmtUptime(
          runtime,
          this._hass,
          this._config
        )}</span>`
      );
    const cpuModel = this._text(sc.cpu_model);
    if (cpuModel) facts.push(`<span>${svgIcon(ICONS.cpu)}${esc(cpuModel.replace(/\(R\)|\(TM\)/g, ""))}</span>`);
    const upd = this._updateInfo(nas);
    if (upd)
      facts.push(
        `<span class="chip upd clickable" role="button" tabindex="0" data-entity="${upd.id}">${svgIcon(ICONS.update)}${esc(upd.text)}${
          upd.version ? ` · ${esc(upd.version)}` : ""
        }</span>`
      );
    // The power buttons stay together at the end of the line (and wrap together).
    const power = this._rebootBtn(nas) + this._shutdownBtn(nas);
    if (power) facts.push(`<span class="power">${power}</span>`);
    return `<div>
      <div class="gauges">
        ${this._gauge(sc.cpu_usage, this._t("cpu"), ICONS.cpu, cpu, cpu === null ? "—" : `${Math.round(cpu)}%`, this._level("cpu", cpu), hist)}
        ${this._gauge(sc.ram_usage, ramLabel, ICONS.ram, ram, ram === null ? "—" : `${Math.round(ram)}%`, this._level("ram", ram), hist)}
        ${this._gauge(
          tempId,
          sc.cpu_temp ? `${this._t("temperature")} ${this._t("cpu")}` : this._t("temperature"),
          ICONS.temp,
          temp,
          tempText,
          this._level("temperature", temp)
        )}
      </div>
      ${facts.length ? `<div class="facts">${facts.join("")}</div>` : ""}
    </div>`;
  }

  _network(nas, hist = null) {
    const sc = nas.scalars;
    if (!sc.lan_down && !sc.lan_up) return "";
    // A tile without its sensor (e.g. QNAP without upload rate) opens no more-info: not focusable.
    return `<div>
      <div class="section-title">${svgIcon(ICONS.network)}${this._t("network")}</div>
      ${this._netTiles(sc, hist)}
    </div>`;
  }

  // The download and upload tiles, each with its last 24 hours behind the rate (`hist`, from `_histFor`).
  _netTiles(sc, hist) {
    const tile = (id, cls, icon, k) =>
      `<div class="tile ${id ? `clickable ${cls}" role="button" tabindex="0" data-entity="${id}"` : `${cls}"`}>${spark(hist?.[id])}${svgIcon(icon)}<div><div class="k">${k}</div><div class="v">${fmtRate(
        toBps(this._s(id)),
        this._loc()
      )}</div></div></div>`;
    return `<div class="net">
        ${tile(sc.lan_down, "down", ICONS.down, this._t("download"))}
        ${tile(sc.lan_up, "up", ICONS.up, this._t("upload"))}
      </div>`;
  }

  // The 24 h history of what the card draws, in one statistics query: the CPU and RAM percentages (`system`) and the
  // download / upload rates (`rates`). Null with show_history: false or when nothing is drawn.
  _histFor(sc, system, rates) {
    if (this._config.show_history === false) return null;
    const ids = [...(system ? [sc.cpu_usage, sc.ram_usage] : []), ...(rates ? [sc.lan_down, sc.lan_up] : [])].filter(Boolean);
    return ids.length ? this._history(ids) : null;
  }

  // 24 h of 5-minute means from the recorder's statistics, fetched again every 5 minutes. Returns what is
  // already there (nothing at first): the card renders again when the answer comes.
  _history(ids) {
    const key = ids.join(",");
    if (key && this._hass.callWS && (this._histKey !== key || Date.now() - this._histAt > HIST_REFRESH)) {
      // Other series: until their first answer (or failure), the curves already known stay and the new ones keep
      // their box (HIST_WAIT).
      if (this._histKey !== key) this._histWait = true;
      this._histKey = key;
      this._histAt = Date.now();
      this._hass
        .callWS({
          type: "recorder/statistics_during_period",
          start_time: new Date(Date.now() - HIST_WINDOW).toISOString(),
          statistic_ids: ids,
          period: "5minute",
          types: ["mean"],
        })
        .then((r) => {
          if (this._histKey !== key) return;
          this._histWait = false;
          this._hist = Object.fromEntries(ids.map((id) => [id, histPoints(r?.[id])]));
          this._update();
        })
        // No statistics (sensor without state_class, recorder off): try again in a minute, no sparkline meanwhile.
        .catch(() => {
          this._histAt = Date.now() - HIST_REFRESH + 60000;
          if (this._histKey !== key || !this._histWait) return;
          this._histWait = false;
          this._update();
        });
    }
    if (this._histKey !== key) return null;
    if (!this._histWait) return this._hist;
    return Object.fromEntries(ids.map((id) => [id, this._hist?.[id] ?? HIST_WAIT]));
  }

  _raidText(rs) {
    return rs.raw ?? this._t(rs.key);
  }

  // RAID state chip of a volume: dot and word in the state colour, opening the state's entity.
  _raidChip(id, rs, level) {
    const text = esc(this._raidText(rs));
    const title = esc(level ? `${level} · ${this._raidText(rs)}` : this._raidText(rs));
    return `<span class="chip raid clickable ${rs.cls}" role="button" tabindex="0" data-entity="${id}" title="${title}" aria-label="${title}"><span class="dot"></span><span class="txt">${text}</span></span>`;
  }

  _volumes(nas) {
    const rows = [];
    // Volume numbers start again in each pool: with several pools, the fallback name carries the pool number.
    const multi = Object.keys(nas.pools).length > 1;
    for (const [pn, pool] of Object.entries(nas.pools)) {
      Object.entries(pool.volumes).forEach(([vn, vol], vi) => {
        const raid = this._text(pool.level) || this._text(vol.level); // ASUSTOR: the RAID level is a volume sensor.
        const raidUp = raid?.toUpperCase();
        // Synology keys volumes by device id: the fallback name numbers them in order instead.
        const vno = DEVICE_ID_RE.test(vn) ? String(vi + 1) : vn;
        const u = volumeUsage(this._hass, vol);
        const raidId = raidEntity(nas, pool, vol);
        const rs = raidState(this._s(raidId));
        // A Synology volume's status is its RAID state: shown once, as the RAID chip.
        const status = raidId && raidId === vol.status ? this._s(vol.health) : this._s(vol.status) || this._s(vol.health);
        const label = this._text(vol.label) || vol.labelText || this._t("volume_n").replace("{n}", multi ? `${pn}-${vno}` : vno);
        const fs = this._text(vol.filesystem);
        const cls = this._level("volume", u.pct);
        rows.push(`<div class="vol clickable ${cls}" role="button" tabindex="0" data-key="${esc(`${pn}-${vn}`)}" data-entity="${vol.used_size_raw || vol.used_size || vol.used_pct || ""}">
          <div class="row">
            ${status ? `<span class="dot ${dotClass(status)}" title="${esc(this._dotTitle(status))}"></span>` : ""}
            <span class="grow">${esc(label)}</span>
            ${raid ? `<span class="tag">${esc(raid)}</span>` : ""}
            ${rs ? this._raidChip(raidId, rs, raidUp) : ""}
            ${fs ? `<span class="tag">${esc(fs)}</span>` : ""}
          </div>
          <div class="bar"><div style="width:${u.pct ?? 0}%"></div></div>
          <div class="detail">
            <span>${fmtBytes(u.used, this._loc())} ${this._t("used")} ${this._t("of")} ${fmtBytes(u.total, this._loc())}</span>
            <span>${u.pct === null ? "" : `${u.pct.toFixed(0)}%`}</span>
          </div>
        </div>`);
      });
    }
    if (!rows.length) return "";
    return `<div><div class="section-title">${svgIcon(ICONS.database)}${this._t("volumes")}</div>${rows.join("")}</div>`;
  }

  _disks(nas) {
    const items = [];
    for (const [pn, pool] of Object.entries(nas.pools)) {
      Object.entries(pool.disks).forEach(([dn, d], di) => {
        const dno = DEVICE_ID_RE.test(dn) ? String(di + 1) : dn; // Synology keys disks by device id (QNAP by bay, « 0:1 »).
        const health = diskHealth(this._hass, d);
        const temp = temperature(this._s(d.temperature), this._hass);
        const hours = num(this._s(d.power_on_hours));
        const size = toBytes(this._s(d.size));
        items.push(`<div class="disk clickable" role="button" tabindex="0" data-key="${esc(`${pn}-${dn}`)}" data-entity="${d.temperature || d.status || ""}">
          <div class="top">${svgIcon(ICONS.disk)}<span>${esc(this._text(d.label) || d.labelText || this._t("disk_n").replace("{n}", dno))}</span>
            ${health ? `<span class="dot ${health.cls}" title="${esc(health.title ?? this._dotTitle(health.state))}"></span>` : ""}</div>
          <div class="model">${esc(this._text(d.model) || d.modelText || "")}</div>
          <div class="meta">
            <span class="temp ${this._level("disk_temperature", temp.c)}">${temp.text}</span>
            <span class="muted">${size !== null ? fmtBytes(size, this._loc()) : ""}${
              hours !== null ? ` · ${Math.round(hours).toLocaleString(this._loc())} ${this._t("hours")}` : ""
            }</span>
          </div>
        </div>`);
      });
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
      )}</div><div class="v">${rpm === null ? "—" : `${Math.round(rpm).toLocaleString(this._loc())} ${this._t("rpm")}`}</div></div></div>`;
    });
    return `<div><div class="section-title">${svgIcon(ICONS.fan)}${this._t("fans")}</div><div class="fans">${tiles.join(
      ""
    )}</div></div>`;
  }
}
