// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------
import { pickerDefine } from "./card-picker.js";
import { VERSION } from "./core.js";
import { NasCard } from "./full-card.js";
import { NasMiniCard } from "./mini-card.js";
import { NasCardEditor, NasMiniCardEditor } from "./visual-editors.js";

export const define = (name, cls) => {
  if (!customElements.get(name)) pickerDefine(name, cls);
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
