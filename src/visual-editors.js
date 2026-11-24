// ---------------------------------------------------------------------------
// Visual editors (ha-form)
// ---------------------------------------------------------------------------
import { THRESHOLDS, lang, modelOptions, t, thresholds } from "./helpers.js";
import { listNas } from "./entity-discovery.js";
import { discover, nasValue } from "./entity-discovery-2.js";
import { wakeEnabled } from "./shared-styles.js";
import { STRINGS } from "./i18n/strings.js";

// The thresholds the YAML needs: values left empty or at their default are dropped (undefined when none is left).
export const pruneThresholds = (set) => {
  const out = {};
  for (const [m, [w, c]] of Object.entries(THRESHOLDS)) {
    const [warning, critical] = thresholds({ thresholds: set }, m);
    const kept = { ...(warning !== w && { warning }), ...(critical !== c && { critical }) };
    if (Object.keys(kept).length) out[m] = kept;
  }
  return Object.keys(out).length ? out : undefined;
};

export class NasEditorBase extends HTMLElement {
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
    return ["illustration", "show_title", "show_subtitle", "show_image", ...this.constructor.toggles];
  }

  _wakeTargetOptions() {
    const options = [{ value: "", label: t(this._hass, this._config, "wake_target_auto") }];
    const states = this._hass?.states || {};
    for (const [id, entity] of Object.entries(this._hass?.entities || {})) {
      if (!this._usableEditorWakeTarget(id, entity, states)) continue;
      options.push({ value: id, label: states[id]?.attributes?.friendly_name || id });
    }
    return [options[0], ...options.slice(1).sort((a, b) => a.label.localeCompare(b.label))];
  }

  _usableEditorWakeTarget(id, entity, states) {
    if (!/^(button|switch)\./.test(id) || !states[id] || states[id].state === "unavailable") return false;
    if (entity?.platform === "wake_on_lan") return true;
    if (id.startsWith("button.") && entity?.platform === "fritz")
      return /(?:^|_)wake_on_lan$/.test(entity.translation_key || id.slice(7));
    if (id.startsWith("button.") && entity?.platform === "ugreen")
      return /(?:^|_)power_action_wake_up(?:_\d+)?$/.test(id.slice(7));
    return false;
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
      { name: "show_wake", selector: { boolean: {} } },
      ...(wakeEnabled(this._config) ? [
        { name: "wake_entity", selector: { select: { mode: "dropdown", custom_value: true, options: this._wakeTargetOptions() } } },
        { name: "wake_mac", selector: { text: {} } },
        { name: "wake_broadcast", selector: { text: {} } },
      ] : []),
      { name: "online_entity", selector: { entity: { filter: { domain: "binary_sensor" } } } },
      {
        type: "grid",
        name: "",
        schema: [
          { name: "illustration", selector: { boolean: {} } },
          { name: "show_title", selector: { boolean: {} } },
          { name: "show_subtitle", selector: { boolean: {} } },
          { name: "show_image", selector: { boolean: {} } },
          ...this.constructor.toggles.map((name) => ({ name, selector: { boolean: {} } })),
        ],
      },
      ...(this._config?.illustration === false
        ? []
        : [
            {
              name: "illustration_theme",
              selector: { select: { mode: "dropdown", options: ["auto", "day", "night"].map((v) => ({ value: v, label: tr(`theme_${v}`) })) } },
            },
          ]),
      this._thresholdsSchema(),
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
              { value: "sr", label: "Српски" },
              { value: "sr-Latn", label: "Srpski (latinica)" },
              { value: "it", label: "Italiano" },
              { value: "nl", label: "Nederlands" },
              { value: "pt", label: "Português (Portugal)" },
              { value: "pl", label: "Polski" },
              { value: "ro", label: "Română" },
              { value: "da", label: "Dansk" },
              { value: "sv", label: "Svenska" },
              { value: "bg", label: "Български" },
              { value: "ru", label: "Русский" },
              { value: "uk", label: "Українська" },
              { value: "hu", label: "Magyar" },
              { value: "sk", label: "Slovenčina" },
              { value: "cs", label: "Čeština" },
              { value: "sl", label: "Slovenščina" },
              { value: "lv", label: "Latviešu" },
              { value: "el", label: "Ελληνικά" },
            ],
          },
        },
      },
    ];
  }

  // Alert thresholds, folded: an orange and a red value per reading (% or °C), prefilled with the defaults.
  _thresholdsSchema() {
    const tr = (k) => t(this._hass, this._config, k);
    const names = {
      cpu: tr("cpu"),
      ram: tr("ram"),
      temperature: tr("temperature"),
      disk_temperature: `${tr("disks")} · ${tr("temperature")}`,
      volume: tr("volumes"),
    };
    return {
      type: "expandable",
      name: "thresholds",
      title: tr("thresholds"),
      schema: Object.keys(THRESHOLDS).map((m) => {
        const unit = m.includes("temperature") ? "°C" : "%";
        const field = (name) => ({
          name,
          label: `${names[m]} · ${tr(`threshold_${name}`)}`,
          selector: { number: { min: 0, max: unit === "%" ? 100 : 150, step: 1, mode: "box", unit_of_measurement: unit } },
        });
        return { type: "grid", name: m, schema: [field("warning"), field("critical")] };
      }),
    };
  }

  _render() {
    if (!this._hass || !this._config) return;
    if (!this._form) {
      this._form = document.createElement("ha-form");
      this._form.computeLabel = (s) => s.label ?? t(this._hass, this._config, s.name);
      this._form.computeHelper = (s) => STRINGS[lang(this._hass, this._config)][`${s.name}_helper`] ?? STRINGS.en[`${s.name}_helper`];
      this._form.addEventListener("value-changed", (ev) => {
        ev.stopPropagation();
        const config = { ...ev.detail.value };
        for (const [k, v] of Object.entries(config)) {
          // Keep the YAML minimal: drop empty values and toggles left at their default (true).
          if (v === "" || v === undefined || v === null || (this._toggles().includes(k) && v === true)) delete config[k];
          else if (k === "illustration_theme" && v === "auto") delete config[k];
        }
        const th = pruneThresholds(config.thresholds);
        if (th) config.thresholds = th;
        else delete config.thresholds;
        this._config = config;
        this.dispatchEvent(new CustomEvent("config-changed", { detail: { config }, bubbles: true, composed: true }));
      });
      this.appendChild(this._form);
    }
    const data = { ...this._config };
    if (data.show_wake === undefined) data.show_wake = Boolean(data.wake_mac || data.wake_entity);
    for (const name of this._toggles()) if (data[name] === undefined) data[name] = true;
    if (!data.illustration_theme) data.illustration_theme = "auto";
    data.thresholds = Object.fromEntries(
      Object.keys(THRESHOLDS).map((m) => {
        const [warning, critical] = thresholds(this._config, m);
        return [m, { warning, critical }];
      })
    );
    // Without nas (hand-written YAML), show the NAS the card shows: saving the form then keeps it.
    // Registry NAS by their name in the form (a device id from earlier versions becomes the name on save).
    if (this._hass) data.nas = nasValue(this._hass, discover(this._hass, data.nas || "")) || data.nas || undefined;
    this._form.hass = this._hass;
    this._form.data = data;
    this._form.schema = this._schema();
  }
}

export class NasCardEditor extends NasEditorBase {
  static get toggles() {
    return ["show_system", "show_network", "show_history", "show_volumes", "show_disks", "show_fans", "show_shutdown"];
  }
}

export class NasMiniCardEditor extends NasEditorBase {
  static get toggles() {
    // The compact view's own toggles, then the full card's sections, shown by the zoomed view.
    return ["show_storage", "show_system", "show_network", "show_history", "show_volumes", "show_disks", "show_fans", "show_shutdown", "zoom"];
  }
}
