# ha-ugreen-nas-card

[![HACS](https://img.shields.io/badge/HACS-Custom-41BDF5.svg)](https://github.com/hacs/integration)
[![HACS Validation](https://github.com/juju35/ha-ugreen-nas-card/actions/workflows/hacs.yml/badge.svg)](https://github.com/juju35/ha-ugreen-nas-card/actions/workflows/hacs.yml)
[![Validate](https://github.com/juju35/ha-ugreen-nas-card/actions/workflows/validate.yml/badge.svg)](https://github.com/juju35/ha-ugreen-nas-card/actions/workflows/validate.yml)
[![Release](https://img.shields.io/github/v/release/juju35/ha-ugreen-nas-card)](https://github.com/juju35/ha-ugreen-nas-card/releases/latest)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

<p align="center"><img src="images/models.svg" alt="Supported NAS models (UGREEN, Synology, QNAP)" width="760"></p>

Lovelace cards for Home Assistant to monitor UGREEN, Synology and QNAP NAS devices: CPU, RAM, temperatures, disks, RAID volumes and network at a glance.

The cards are built on top of the [UGREEN NAS integration](https://github.com/Tom-Bom-badil/home-assistant_ugreen-nas), the core [Synology DSM](https://www.home-assistant.io/integrations/synology_dsm/) integration and the core [QNAP](https://www.home-assistant.io/integrations/qnap/) integration: entities are **discovered automatically**, you don't have to pick them one by one.

[![Open your Home Assistant instance and open a repository inside the Home Assistant Community Store.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=juju35&repository=ha-ugreen-nas-card&category=plugin)

| UGREEN NAS Card | UGREEN NAS Mini Card |
|---|---|
| ![ugreen-nas-card](https://raw.githubusercontent.com/juju35/ha-ugreen-nas-card/main/screenshots/card.png) | ![ugreen-nas-mini-card](https://raw.githubusercontent.com/juju35/ha-ugreen-nas-card/main/screenshots/mini-card.png) |

## Features

- Two cards: a full **UGREEN NAS Card** and a compact **UGREEN NAS Mini Card** (also registered as `custom:nas-card` and `custom:nas-mini-card`)
- Zoom button at the top right of the mini card: it switches to the full card (gauges, network, volumes, disks and fans of the same NAS) and back; a click anywhere outside the card brings the compact view back
- Three integrations: **UGREEN NAS**, **Synology DSM** and **QNAP** — automatic entity discovery, several NAS supported (mix of brands included)
- CPU, RAM and CPU temperature gauges, uptime and CPU model
- Network download / upload rates
- Volumes with RAID level, filesystem, status and used space
- Disks with model, status, temperature, size and power-on hours
- Fans speed (CPU fan and case fans)
- Colors turn orange / red when a threshold is crossed (CPU, RAM, temperatures, volume usage)
- Click any value to open its Home Assistant history (more-info dialog)
- Visual editor in the dashboard UI for both cards (no YAML needed)
- Light and dark mode, English and French
- Brand logo next to the NAS name, adapted to dark mode, and a drawn picture of the NAS model (UGREEN DXP/DH, Synology DS/RS, QNAP TS/TVS/HS, rackmounts included)
- Single file, no external dependency: the NAS pictures and the UGREEN logo are embedded (the Synology and QNAP logos load from the [Home Assistant brand images CDN](https://brands.home-assistant.io), the one the HA interface itself uses)

## Prerequisites

Home Assistant 2024.8 or later, and at least one of:

- The [UGREEN NAS integration](https://github.com/Tom-Bom-badil/home-assistant_ugreen-nas) (available in HACS)
- The core [Synology DSM integration](https://www.home-assistant.io/integrations/synology_dsm/)
- The core [QNAP integration](https://www.home-assistant.io/integrations/qnap/)

## Installation

### Via HACS (recommended)

Click the button below to add the repository directly:

[![Add to HACS](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=juju35&repository=ha-ugreen-nas-card&category=plugin)

Then click **Download**, and reload your browser when HACS asks you to.

Or manually:

1. Open HACS → **⋮** (top right) → **Custom repositories**
2. Add `https://github.com/juju35/ha-ugreen-nas-card` — Type: **Dashboard**
3. Search for **UGREEN NAS Card** and click **Download**
4. Clear your browser cache and refresh

### Manual

1. Download `ugreen-nas-card.js` from the [latest release](https://github.com/juju35/ha-ugreen-nas-card/releases/latest)
2. Copy it to `/config/www/ugreen-nas-card.js`
3. Go to **Settings → Dashboards → ⋮ → Resources** → Add resource:
   - URL: `/local/ugreen-nas-card.js`
   - Type: **JavaScript Module**
4. Clear your browser cache and refresh

## Configuration

### Visual editor

Edit a dashboard, click **Add card** and search for **UGREEN NAS Card** or **UGREEN NAS Mini Card**. The NAS is preselected; pick another one in the list if you have several, set an optional title, choose the sections to display and the language. The preview updates live, and options left at their default are kept out of the generated YAML.

### Minimal

```yaml
type: custom:ugreen-nas-card
```

```yaml
type: custom:ugreen-nas-mini-card
```

`custom:nas-card` and `custom:nas-mini-card` are brand-neutral aliases of the same two cards:

```yaml
type: custom:nas-card
```

### Full options

```yaml
type: custom:ugreen-nas-card
nas: ugreen_nas
title: My NAS
show_image: true
image: DXP4800 Plus
show_system: true
show_network: true
show_volumes: true
show_disks: true
show_fans: true
language: fr
```

```yaml
type: custom:ugreen-nas-mini-card
nas: ugreen_nas
title: My NAS
show_image: true
image: DXP4800 Plus
show_storage: true
show_network: true
zoom: true
language: fr
```

### Options reference

| Option | Card | Default | Description |
|---|---|---|---|
| `nas` | both | First NAS found | NAS to display (only needed with several NAS): the `UGNAS_device_id` attribute for UGREEN, the NAS device id for Synology DSM and QNAP — pick it in the visual editor |
| `title` | both | NAS name | Card title |
| `show_image` | both | `true` | Show the NAS picture |
| `image` | both | NAS model | Picture to show: a model name (`DXP4800 Plus`, `DXP480T Plus`, `DH4300 Plus`, `DS923+`, `DS1821+`, `RS822+`, `TS-464`, `TVS-h674`, `TS-873AeU`…) or an image URL. By default the picture follows the model reported by the integration |
| `show_system` | full | `true` | CPU, RAM and temperature gauges, uptime, CPU model |
| `show_network` | both | `true` | Network download / upload |
| `show_volumes` | full | `true` | Volumes and used space |
| `show_disks` | full | `true` | Disks details |
| `show_fans` | full | `true` | Fans speed |
| `show_storage` | mini | `true` | Overall storage usage bar |
| `zoom` | mini | `true` | Zoom button at the top right: switches to the full card and back (`false` removes it) |
| `language` | both | Auto | Force language: `fr` or `en` (auto-detects from HA settings) |

## Screenshots

While the NAS is running, the card animates: the cooling fans spin at their live speed. It settles to a still card when they stop (and honours `prefers-reduced-motion`).

![cooling fans animation](screenshots/fans.gif)

| Light | Dark |
|---|---|
| ![card](screenshots/card.png) | ![card dark](screenshots/card-dark.png) |
| ![mini card](screenshots/mini-card.png) | ![mini card dark](screenshots/mini-card-dark.png) |
| ![mini card zoomed in](screenshots/mini-card-zoom.png) | ![mini card zoomed in dark](screenshots/mini-card-zoom-dark.png) |
| ![Synology card](screenshots/card-synology.png) | ![Synology card dark](screenshots/card-synology-dark.png) |
| ![QNAP card](screenshots/card-qnap.png) | ![QNAP card dark](screenshots/card-qnap-dark.png) |

| Synology mini card | QNAP mini card |
|---|---|
| ![Synology mini card](screenshots/mini-card-synology.png) | ![QNAP mini card](screenshots/mini-card-qnap.png) |

## How it works

**UGREEN NAS**: every entity created by the integration carries a `UGNAS_device_id` attribute. The cards use it to gather the entities of a NAS, then recognize each sensor from the end of its entity id (`cpu_usage`, `pool_1_volume_1_used_size_raw`, `pool_2_disk_1_temperature`…). Entity ids de-duplicated by Home Assistant (for example `sensor.ugreen_nas_cpu_usage_2`) are supported, and so are renamed devices. Volume sizes are read from the `*_raw` sensors (bytes) so that the used space is exact whatever the unit chosen by the integration.

**Synology DSM** and **QNAP**: the cards find the entities of these core integrations through the entity registry and recognize each sensor by its `translation_key`, so discovery does not depend on the language of your install or on renamed entities. Synology volumes and disks are child devices of the NAS in the device registry: their labels and disk models come from there, and the security binary sensor feeds the status pill. QNAP keeps everything on one device: volumes and drives are told apart by the identifier the integration inserts in the entity names (for example `DataVol1` or `0:1`).

Some useful sensors are disabled by default by these integrations — on QNAP, drive temperatures, SMART statuses and volume used space; on Synology, total volume sizes. Enable them in **Settings → Devices & services → entities** to fill the matching sections of the card (missing sizes are completed from the used percentage when possible).

Thresholds:

| Value | Orange | Red |
|---|---|---|
| CPU usage | 70 % | 90 % |
| RAM usage | 80 % | 95 % |
| CPU temperature | 75 °C | 90 °C |
| Disk temperature | 60 °C | 70 °C |
| Volume usage | 80 % | 90 % |

## Development

```bash
npm install
npm run build        # bundles src/ugreen-nas-card.js into dist/ugreen-nas-card.js
npm run check        # builds and checks the card (run in CI)
npm run screenshots  # renders the cards with mock data (scripts/mock-states.mjs) into screenshots/ (and fans.gif, needs ffmpeg)
```

`dist/` is not committed: `npm run build` creates it locally, CI builds it on every push, and the release workflow attaches the built file to the release, which is where HACS downloads it from.

### Releasing

1. Bump `version` in `package.json`
2. Add a `## <version>` section at the top of [CHANGELOG.md](CHANGELOG.md)
3. Push to `main`: the **Release** workflow builds the card, creates the tag and the GitHub release with the changelog section as notes, and attaches `ugreen-nas-card.js`

## Translations

The cards auto-detect the language from your Home Assistant settings. Currently supported:

| Language | Code |
|---|---|
| English | `en` |
| Français | `fr` |

Contributions for additional languages are welcome!

## License

[MIT](LICENSE)
