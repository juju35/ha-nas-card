# Changelog

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

### 🐛 Fixes

- **UGREEN logo position**: in the full card it was centred on the whole title block, status chip included, so it sat below the NAS name. It is now aligned with the name and the model line.

## 1.1.1

| UGREEN NAS Card | UGREEN NAS Mini Card |
|---|---|
| ![ugreen-nas-card](https://raw.githubusercontent.com/juju35/ha-ugreen-nas-card/main/screenshots/card.png) | ![ugreen-nas-mini-card](https://raw.githubusercontent.com/juju35/ha-ugreen-nas-card/main/screenshots/mini-card.png) |

### 🎨 Changes

- **Larger UGREEN logo**, now left of the NAS name: 40 px in the full card and 32 px in the mini card, like the Roborock card.

## 1.1.0

| UGREEN NAS Card | UGREEN NAS Mini Card |
|---|---|
| ![ugreen-nas-card](https://raw.githubusercontent.com/juju35/ha-ugreen-nas-card/main/screenshots/card.png) | ![ugreen-nas-mini-card](https://raw.githubusercontent.com/juju35/ha-ugreen-nas-card/main/screenshots/mini-card.png) |

### ✨ Features

- **UGREEN logo** next to the NAS name, in the full card and the mini card. In dark mode the bottom of its gradient is lightened so it stays visible on dark backgrounds. The logo is embedded, no extra resource needed.

## 1.0.0

First release of the UGREEN NAS cards for Home Assistant, built for the [UGREEN NAS integration](https://github.com/Tom-Bom-badil/home-assistant_ugreen-nas).

| UGREEN NAS Card | UGREEN NAS Mini Card |
|---|---|
| ![ugreen-nas-card](https://raw.githubusercontent.com/juju35/ha-ugreen-nas-card/main/screenshots/card.png) | ![ugreen-nas-mini-card](https://raw.githubusercontent.com/juju35/ha-ugreen-nas-card/main/screenshots/mini-card.png) |

### ✨ Features

- **UGREEN NAS Card** (`custom:ugreen-nas-card`): CPU, RAM and CPU temperature gauges, uptime, network download / upload, volumes (RAID level, filesystem, status, used space), disks (model, status, temperature, size, power-on hours) and fans.
- **UGREEN NAS Mini Card** (`custom:ugreen-nas-mini-card`): compact overview with CPU, RAM, temperature, overall storage, status, network and uptime.
- **Automatic discovery** of the integration entities through their `UGNAS_device_id` attribute: no entity to pick, several NAS supported, de-duplicated ids (`_2`) handled.
- **Visual editor** for both cards: NAS, title, sections to display and language.
- Orange / red colors when CPU, RAM, temperatures or volume usage cross a threshold.
- Click any value to open its history (more-info dialog).
- Light and dark mode, English and French.
- Single file with no external dependency, the NAS picture is embedded.

### 📦 Installation

[![Open your Home Assistant instance and open a repository inside the Home Assistant Community Store.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=juju35&repository=ha-ugreen-nas-card&category=plugin)

Open the link above (or add `https://github.com/juju35/ha-ugreen-nas-card` as a **Dashboard** custom repository in HACS), click **Download**, then reload your browser. Manual install: copy `ugreen-nas-card.js` from the assets below to `/config/www/` and add `/local/ugreen-nas-card.js` as a JavaScript Module resource.

### 🚀 Quick start

```yaml
type: custom:ugreen-nas-card
```

```yaml
type: custom:ugreen-nas-mini-card
```

All options are described in the [README](https://github.com/juju35/ha-ugreen-nas-card#configuration).
