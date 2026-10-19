# Changelog

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
