# Changelog

## 1.8.0 - 2026-10-26
### Fixes
- `toBytes()` now reads `unit_of_measurement` through optional chaining, like its twin `toBps()`. A Home Assistant state with a valid numeric `state` but no `attributes` object (rare but possible depending on the integration or after a restore) no longer throws during rendering.

## 1.7.0
### Changes
- The UGREEN logo in the header fits a 40 × 40 px box on the full card and a 32 × 32 px box on the mini card (zoomed in, the full card's 40 px), like the header icon of the other cards.
- The status pill ("Normal") sits in the header row, right of the title and before the NAS picture, instead of on its own line under the title.
- Mini card: the subtitle shows the NAS model only, no longer cut off by the NAS picture ("DXP480T Plus · UGOS 1.…"); zoomed in, it shows the model and the UGOS version like the full card. When both do not fit on one line next to the picture, the UGOS version goes to a second line instead of being cut off.
- Header geometry: the body starts 8 px below the header on both cards (was 4 px).
- The status pill is centred on the title line, not on the whole title block: it no longer sits low when the subtitle wraps the UGOS version to a second line (full card and zoomed-in mini card).

### Maintenance
- Test for the status pill position and the mini card subtitle.

## 1.6.1

### Fixes
- The DXP480T Plus illustration is closer to the real device, in parallel projection like the product photos (front, side and top share the same axes): aluminium front with the black lower band holding the grey drive cover and the power button, rounded vertical corner, darker side with its vent row, thin top face.

## 1.6.0

### What's new
- The NAS picture follows the model reported by the integration: drawn illustrations of the DXP2800, DXP4800 / 4800 Plus, DXP480T Plus, DXP6800 Pro, DXP8800 Plus, DH2300 and DH4300 Plus (other models are matched by their family: number of bays, DXP or DH series). They replace the single DXP480T Plus photo and keep the card lighter. New `image` option (in the visual editor) to pick another model or give an image URL.

### Fixes
- The UGREEN logo of the mini card is the same size as on the full card (40 px instead of 32 px).

## 1.5.0

### What's new
- Zoom button at the top right of the mini card: it shows the full card for the same NAS (gauges, uptime and CPU model, network, volumes, disks and fans), and a second click brings the compact view back. A click anywhere outside the card also folds it back; clicks on the card or in a dialog opened from it (more-info) do not. New `zoom` option (on by default, in the visual editor): `zoom: false` removes the button.

### Maintenance
- Tests for the zoom; light and dark screenshots of the zoomed-in mini card.

## 1.4.2

### Fixes
- A volume without a label sensor is named after its own number ("Volume 1", "Volume 2") instead of the pool number, so two volumes of the same pool no longer both show "Volume 1". With several pools, the name carries both numbers ("Volume 2-1").

### Maintenance
- Regression test for the volume name; the duplication check job runs on Node 22.

## 1.4.1

### Fixes
- When the NAS entities become unavailable and come back (NAS restarted, offline at startup), the card no longer stays on a missing sensor or on "No UGREEN NAS found" until the page is reloaded.
- When a list changes order (volumes, disks, fans, mini card footer), the keyboard focus stays on the same item instead of landing on another row. In browsers that cannot move an element without losing its focus, the focus is dropped rather than moved to another row.
- No more script error when a NAS entity has no state while the registry still lists it.

### Maintenance
- Browser tests (Chromium) for the in-place updates, run in CI, and regression tests for the discovery; a fresh page per screenshot; duplication check skips the tests.

## 1.4.0

### Fixes
- A volume whose used space is unknown no longer shows an empty bar at "0%": the percentage is left out and the used space shows "—". The mini card storage total only counts volumes whose used space is known.
- Upload and download rates follow the sensor unit (kB/s, MB/s, bit/s…) instead of always being read as B/s. With the integration default (B/s) nothing changes.
- The NAS is still found when its entities only get their attributes after the dashboard has loaded (NAS offline at startup).

### Changes
- The server status "Normal" is translated; any other status is shown as reported.
- The card only re-renders when something it shows changes, and updates the page in place: keyboard focus, hover and text selection survive updates, the bars, rings and chevrons animate again, and the NAS picture is not decoded again on every poll.
- Keyboard access: clickable items can be reached with Tab and opened with Enter or Space, with a visible focus outline.

### Maintenance
- CI hardened: actions pinned by commit SHA, read-only token permissions, Dependabot for action updates, duplication report annotated on pull requests.
- Unit tests (`npm test`, run in CI); discovery cached instead of being recomputed on every state change; unused sensors and strings removed.

## 1.3.1

### Maintenance
- Tooling only, no functional change: Biome linting, pre-commit and a Lint CI (duplication checks). Card source modernized (optional chaining, template literals), identical behavior.

## 1.3.0

### Changes
- More compact layout with the same information, like the other ha-* cards: 12 px card padding, 36 px header icon, 16 px name and 12 px subtitle, 11 px pills, tighter tiles and sections.
- NAS picture 64 → 48 px, gauges 84 → 60 px; volumes show the name, RAID level, file system and usage on one line; smaller disk details.
- The mini card picks up the smaller pills and subtitle.

## 1.2.3

### Changes
- HACS now asks for Home Assistant 2024.8 or later, the version that brought the sections view the card supports; the README says so under **Prerequisites**.

### Fixes
- "Uptime: 10 d" in English, without the French space before the colon.

### Maintenance
- CHANGELOG headings use the same plain English set as the other ha-* repositories.

## 1.2.2

### Maintenance
- Merged branches are deleted automatically (new `cleanup-branches` workflow). Nothing changes for users.

## 1.2.1

### Development
- The built card is no longer committed in `dist/`: CI builds it on every push, and the release workflow builds it and attaches it to the release, which is where HACS downloads it from. Nothing changes for users.

## 1.2.0

### Changes
- The warning color falls back to Home Assistant's default `#ffa600` (was `#ffa000`), like the other ha-* cards. The upload tile uses `--info-color` instead of a fixed blue.

### Development
- Releases are published when `version` in `package.json` has no tag yet: bump the version, add its CHANGELOG section and push, like the other ha-* repositories (the manual Release workflow run is no longer needed).
- Issue templates, stale workflow and a "Update release notes" workflow, shared with the other repositories.

## 1.1.2

### Fixes
- **UGREEN logo position**: in the full card it was centred on the whole title block, status chip included, so it sat below the NAS name. It is now aligned with the name and the model line.

## 1.1.1

| UGREEN NAS Card | UGREEN NAS Mini Card |
|---|---|
| ![ugreen-nas-card](https://raw.githubusercontent.com/juju35/ha-ugreen-nas-card/main/screenshots/card.png) | ![ugreen-nas-mini-card](https://raw.githubusercontent.com/juju35/ha-ugreen-nas-card/main/screenshots/mini-card.png) |

### Changes
- **Larger UGREEN logo**, now left of the NAS name: 40 px in the full card and 32 px in the mini card, like the Roborock card.

## 1.1.0

| UGREEN NAS Card | UGREEN NAS Mini Card |
|---|---|
| ![ugreen-nas-card](https://raw.githubusercontent.com/juju35/ha-ugreen-nas-card/main/screenshots/card.png) | ![ugreen-nas-mini-card](https://raw.githubusercontent.com/juju35/ha-ugreen-nas-card/main/screenshots/mini-card.png) |

### What's new
- **UGREEN logo** next to the NAS name, in the full card and the mini card. In dark mode the bottom of its gradient is lightened so it stays visible on dark backgrounds. The logo is embedded, no extra resource needed.

## 1.0.0

First release of the UGREEN NAS cards for Home Assistant, built for the [UGREEN NAS integration](https://github.com/Tom-Bom-badil/home-assistant_ugreen-nas).

| UGREEN NAS Card | UGREEN NAS Mini Card |
|---|---|
| ![ugreen-nas-card](https://raw.githubusercontent.com/juju35/ha-ugreen-nas-card/main/screenshots/card.png) | ![ugreen-nas-mini-card](https://raw.githubusercontent.com/juju35/ha-ugreen-nas-card/main/screenshots/mini-card.png) |

### What's new
- **UGREEN NAS Card** (`custom:ugreen-nas-card`): CPU, RAM and CPU temperature gauges, uptime, network download / upload, volumes (RAID level, filesystem, status, used space), disks (model, status, temperature, size, power-on hours) and fans.
- **UGREEN NAS Mini Card** (`custom:ugreen-nas-mini-card`): compact overview with CPU, RAM, temperature, overall storage, status, network and uptime.
- **Automatic discovery** of the integration entities through their `UGNAS_device_id` attribute: no entity to pick, several NAS supported, de-duplicated ids (`_2`) handled.
- **Visual editor** for both cards: NAS, title, sections to display and language.
- Orange / red colors when CPU, RAM, temperatures or volume usage cross a threshold.
- Click any value to open its history (more-info dialog).
- Light and dark mode, English and French.
- Single file with no external dependency, the NAS picture is embedded.

### Installation
[![Open your Home Assistant instance and open a repository inside the Home Assistant Community Store.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=juju35&repository=ha-ugreen-nas-card&category=plugin)

Open the link above (or add `https://github.com/juju35/ha-ugreen-nas-card` as a **Dashboard** custom repository in HACS), click **Download**, then reload your browser. Manual install: copy `ugreen-nas-card.js` from the assets below to `/config/www/` and add `/local/ugreen-nas-card.js` as a JavaScript Module resource.

### Quick start
```yaml
type: custom:ugreen-nas-card
```

```yaml
type: custom:ugreen-nas-mini-card
```

All options are described in the [README](https://github.com/juju35/ha-ugreen-nas-card#configuration).
