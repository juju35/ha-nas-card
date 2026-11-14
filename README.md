# ha-nas-card

[![Marketplace](https://img.shields.io/badge/Marketplace-Custom-41BDF5.svg)](https://www.home-assistant.io/integrations/marketplace/)
[![HACS Validation](https://github.com/juju35/ha-nas-card/actions/workflows/hacs.yml/badge.svg)](https://github.com/juju35/ha-nas-card/actions/workflows/hacs.yml)
[![Validate](https://github.com/juju35/ha-nas-card/actions/workflows/validate.yml/badge.svg)](https://github.com/juju35/ha-nas-card/actions/workflows/validate.yml)
[![Lint](https://github.com/juju35/ha-nas-card/actions/workflows/lint.yml/badge.svg)](https://github.com/juju35/ha-nas-card/actions/workflows/lint.yml)
[![Release](https://img.shields.io/github/v/release/juju35/ha-nas-card)](https://github.com/juju35/ha-nas-card/releases/latest)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/juju35/ha-nas-card/blob/main/LICENSE)
[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-FFDD00?logo=buymeacoffee&logoColor=black)](https://buymeacoffee.com/julienstep9)

<p align="center"><img src="https://raw.githubusercontent.com/juju35/ha-nas-card/main/images/icon.svg" alt="NAS Card (UGREEN, Synology, QNAP)" width="120"></p>

<p align="center">
  <img src="https://raw.githubusercontent.com/juju35/ha-nas-card/main/images/ugreen.svg" alt="UGREEN" width="64">&nbsp;&nbsp;
  <img src="https://raw.githubusercontent.com/juju35/ha-nas-card/main/images/synology.png" alt="Synology" width="64">&nbsp;&nbsp;
  <img src="https://raw.githubusercontent.com/juju35/ha-nas-card/main/images/qnap.png" alt="QNAP" width="64">&nbsp;&nbsp;
  <img src="https://raw.githubusercontent.com/juju35/ha-nas-card/main/images/asustor.svg" alt="ASUSTOR" width="64">
</p>

Lovelace cards for Home Assistant to monitor NAS devices — [UGREEN](https://nas.ugreen.com), [Synology](https://www.synology.com), [QNAP](https://www.qnap.com) and [ASUSTOR](https://www.asustor.com): CPU, RAM, temperatures, disks, RAID volumes and network at a glance.

The cards are built on top of the [UGREEN NAS integration](https://github.com/Tom-Bom-badil/home-assistant_ugreen-nas), and of the [Synology DSM](https://www.home-assistant.io/integrations/synology_dsm/) and [QNAP](https://www.home-assistant.io/integrations/qnap/) integrations included in Home Assistant, and of the [ASUSTOR integration](https://github.com/aubierr/ha-asustor): entities are **discovered automatically**, you don't have to pick them one by one, and it works whatever your Home Assistant language.

[![Open your Home Assistant instance and open a repository inside the Marketplace.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/marketplace_repository/?owner=juju35&repository=ha-nas-card&category=plugin)

| <img src="https://raw.githubusercontent.com/juju35/ha-nas-card/main/images/ugreen.svg" alt="" width="20"> UGREEN | <img src="https://raw.githubusercontent.com/juju35/ha-nas-card/main/images/synology.png" alt="" width="20"> Synology |
|---|---|
| <picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/juju35/ha-nas-card/main/screenshots/card-dark.png"><img src="https://raw.githubusercontent.com/juju35/ha-nas-card/main/screenshots/card.png" alt="ugreen card" width="400"></picture> | <picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/juju35/ha-nas-card/main/screenshots/card-synology-dark.png"><img src="https://raw.githubusercontent.com/juju35/ha-nas-card/main/screenshots/card-synology.png" alt="synology card" width="400"></picture> |
| <picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/juju35/ha-nas-card/main/screenshots/mini-card-dark.png"><img src="https://raw.githubusercontent.com/juju35/ha-nas-card/main/screenshots/mini-card.png" alt="ugreen mini card" width="400"></picture> | <picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/juju35/ha-nas-card/main/screenshots/mini-card-synology-dark.png"><img src="https://raw.githubusercontent.com/juju35/ha-nas-card/main/screenshots/mini-card-synology.png" alt="synology mini card" width="400"></picture> |

| <img src="https://raw.githubusercontent.com/juju35/ha-nas-card/main/images/qnap.png" alt="" width="20"> QNAP | <img src="https://raw.githubusercontent.com/juju35/ha-nas-card/main/images/asustor.svg" alt="" width="20"> ASUSTOR |
|---|---|
| <picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/juju35/ha-nas-card/main/screenshots/card-qnap-dark.png"><img src="https://raw.githubusercontent.com/juju35/ha-nas-card/main/screenshots/card-qnap.png" alt="qnap card" width="400"></picture> | <picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/juju35/ha-nas-card/main/screenshots/card-asustor-dark.png"><img src="https://raw.githubusercontent.com/juju35/ha-nas-card/main/screenshots/card-asustor.png" alt="asustor card" width="400"></picture> |
| <picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/juju35/ha-nas-card/main/screenshots/mini-card-qnap-dark.png"><img src="https://raw.githubusercontent.com/juju35/ha-nas-card/main/screenshots/mini-card-qnap.png" alt="qnap mini card" width="400"></picture> | <picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/juju35/ha-nas-card/main/screenshots/mini-card-asustor-dark.png"><img src="https://raw.githubusercontent.com/juju35/ha-nas-card/main/screenshots/mini-card-asustor.png" alt="asustor mini card" width="400"></picture> |

## Features

- Two cards: a full **NAS Card** and a compact **NAS Mini Card**, of type `custom:nas-card` and `custom:nas-mini-card` (the former types `custom:ugreen-nas-card` and `custom:ugreen-nas-mini-card` keep working)
- Four integrations: **UGREEN NAS**, **Synology DSM**, **QNAP** and **ASUSTOR** ([ha-asustor](https://github.com/aubierr/ha-asustor), SNMP) — automatic discovery, several NAS supported, brands can be mixed
- CPU, RAM and temperature gauges, uptime and CPU model; the CPU and RAM gauges (and the mini card's CPU and RAM bars) draw their last 24 hours behind them, on a 0–100 % scale (recorder statistics)
- Network download / upload rates, with their last 24 hours drawn behind each tile, on the full card and the mini card (recorder statistics)
- Volumes with RAID level, filesystem, status and used space
- RAID state of each volume as a coloured chip: healthy (green), a background task such as syncing, rebuilding, repairing or checking (orange), degraded or crashed (red); the mini card shows the worst unhealthy one in its footer. From the storage pool status on UGREEN and the volume status on Synology DSM and ASUSTOR (QNAP's integration reports none)
- Disks with model, status, temperature, size and power-on hours; the status dot turns red on any disk problem (on Synology also the SMART status and the bad sector / remaining life thresholds); a volume or disk without status entity has no dot
- UGREEN and Synology: an « Update available » chip when UGOS or DSM has an update (click for its more-info dialog), and reboot and shutdown buttons at the end of the system facts, each with a confirmation popup at the top of the card
- Fans speed (CPU fan and case fans, UGREEN)
- Status pill: the server status (UGREEN, QNAP) or the security status (Synology); the ASUSTOR integration reports none
- Colors turn orange / red when a threshold is crossed (CPU, RAM, temperatures, volume usage)
- Detail button on the mini card (top right): it switches the mini card to the full card's content and back; a click anywhere outside the card brings the compact view back
- Click any value to open its Home Assistant history (more-info dialog)
- Round NAS icon next to the NAS name, in the status color (green when the NAS is normal, orange on a warning, grey when the status is unavailable), with the brand logo (UGREEN, Synology, QNAP or ASUSTOR) as a badge: a click opens the brand's website
- Click the NAS picture to open the NAS web interface (UGOS, DSM, QTS), found automatically from Home Assistant for UGREEN and Synology; both addresses can be changed in the visual editor
- Drawn NAS picture that follows the model: 43 models drawn across the three brands — towers by bay count, all-flash DXP480T, rackmounts (see [Screenshots](#screenshots)) — or your own picture
- Visual editor in the dashboard UI for both cards (no YAML needed), with the pictures listed by brand
- Light and dark mode, English, French, German, Spanish, Serbian (Cyrillic and Latin), Italian, Dutch, European Portuguese, Polish, Romanian, Danish, Swedish, Bulgarian, Russian, Ukrainian, Hungarian, Slovak, Czech, Slovenian, Latvian and Greek
- Single file, no external dependency: the NAS pictures are embedded

> **Moved**: this repository was `juju35/ha-ugreen-nas-card`. GitHub redirects the old address, but if you added it to the Marketplace from a link, remove it and add `https://github.com/juju35/ha-nas-card` instead.

## Supported integrations

| Integration | NAS | What the cards show |
|---|---|---|
| [UGREEN NAS](https://github.com/Tom-Bom-badil/home-assistant_ugreen-nas) (Marketplace) | UGREEN DXP and DH | Everything: CPU, RAM, temperatures, network, volumes, disks, **fans**, server status, UGOS version and update, reboot, link to UGOS |
| [Synology DSM](https://www.home-assistant.io/integrations/synology_dsm/) (built in) | Synology | CPU, RAM, temperature, network, volumes, disks (status, SMART, bad sectors, remaining life), security status, DSM version and update, reboot, link to DSM; no fans |
| [QNAP](https://www.home-assistant.io/integrations/qnap/) (built in) | QNAP | CPU, RAM, temperature, network, volumes, drives, server status, QTS / QuTS hero firmware; no fans |
| [ASUSTOR](https://github.com/aubierr/ha-asustor) (SNMP, custom) | ASUSTOR | CPU, RAM, temperatures, fans, network, volumes (RAID level and status), disks (SMART), ADM version and update; no server status, no reboot |

Several NAS are supported, and brands can be mixed. Some sensors of the Synology DSM, QNAP and ASUSTOR integrations are disabled by default, see [How it works](#how-it-works).

## Prerequisites

Home Assistant 2024.8 or later, and at least one of:

- the [UGREEN NAS integration](https://github.com/Tom-Bom-badil/home-assistant_ugreen-nas) (available in the Marketplace)
- the [Synology DSM integration](https://www.home-assistant.io/integrations/synology_dsm/) (included in Home Assistant)
- the [QNAP integration](https://www.home-assistant.io/integrations/qnap/) (included in Home Assistant)
- the [ASUSTOR integration](https://github.com/aubierr/ha-asustor) (custom integration, reads the NAS over SNMP: enable SNMP in ADM under **Services → SNMP** first)

## Installation

### Via the Marketplace (recommended)

Click the button below to add the repository directly:

[![Add to the Marketplace](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/marketplace_repository/?owner=juju35&repository=ha-nas-card&category=plugin)

Then click **Install**, and reload your browser when the Marketplace asks you to.

Or manually:

1. Open **Settings → Marketplace → Add from link** (top right; this needs a GitHub account connected)
2. Add `https://github.com/juju35/ha-nas-card` — Type: **Dashboard**
3. Open **NAS Card** and click **Install**
4. Clear your browser cache and refresh

### Manual

1. Download `nas-card.js` and the `nas-card.i18n.*.js` translation files from the [latest release](https://github.com/juju35/ha-nas-card/releases/latest)
2. Copy them all to `/config/www/` (without the translation files, the cards show in English)
3. Go to **Settings → Dashboards → ⋮ → Resources** → Add resource:
   - URL: `/local/nas-card.js`
   - Type: **JavaScript Module**
4. Clear your browser cache and refresh

## Configuration

### Visual editor

Edit a dashboard, click **Add card** and search for **NAS Card** or **NAS Mini Card**. The first NAS found is preselected; pick another one in the list if you have several (UGREEN, Synology, QNAP and ASUSTOR NAS are listed together), set an optional title, choose the picture (listed by brand: « QNAP TS-464 », « Synology DS923+ », « UGREEN DXP4800 Plus »…), the sections to display and the language. The preview updates live, and options left at their default are kept out of the generated YAML.

### Minimal

```yaml
type: custom:nas-card
```

```yaml
type: custom:nas-mini-card
```

### Full options

```yaml
type: custom:nas-card
nas: ugreen_nas
title: My NAS
show_image: true
image: DXP4800 Plus
url: http://192.168.1.10:9999
brand_url: https://nas.ugreen.com
show_system: true
show_network: true
show_volumes: true
show_disks: true
show_fans: true
thresholds:
  cpu:
    warning: 60
    critical: 85
  volume:
    critical: 95
language: fr
```

```yaml
type: custom:nas-mini-card
nas: ugreen_nas
title: My NAS
show_image: true
image: DS923+
show_storage: true
show_network: true
zoom: true
language: fr
```

### Options reference

| Option | Card | Default | Description |
|---|---|---|---|
| `nas` | both | First NAS found | NAS to display (only needed with several NAS): the `UGNAS_device_id` attribute for UGREEN, the NAS device name for Synology DSM, QNAP and ASUSTOR (its device id when two NAS share a name; device ids from earlier versions are still read) — pick it in the visual editor |
| `title` | both | NAS name | Card title |
| `show_title` | both | `true` | Show the title in the header (e.g. `false` under a section heading of your own) |
| `show_subtitle` | both | `true` | Show the subtitle under the title |
| `show_image` | both | `true` | Show the NAS picture |
| `image` | both | NAS model | Picture to show: a model name (`DXP4800 Plus`, `DXP480T Plus`, `DH4300 Plus`, `DS923+`, `DS1821+`, `RS822+`, `TS-464`, `TVS-h674`, `TS-873AeU`… — see the [drawn models](#screenshots)) or an image URL (e.g. `/local/my-nas.png`). By default the picture follows the model reported by the integration; an unknown model of a known family is drawn from its bay count |
| `url` | both | Device configuration URL | Web interface of the NAS, opened by a click on the NAS picture. By default the configuration URL of the NAS device in Home Assistant (the « Visit » link of the device page), set by the UGREEN NAS and Synology DSM integrations; the QNAP and ASUSTOR integrations have none, so set it for a QNAP or ASUSTOR NAS (e.g. `http://192.168.1.10:8080`) |
| `brand_url` | both | Brand website | Website opened by a click on the header icon: [nas.ugreen.com](https://nas.ugreen.com), [synology.com](https://www.synology.com), [qnap.com](https://www.qnap.com) or [asustor.com](https://www.asustor.com) by default |
| `show_system` | both | `true` | CPU, RAM and temperature gauges, uptime, CPU model |
| `show_network` | both | `true` | Network download / upload |
| `show_history` | both | `true` | 24 h curves behind the download / upload tiles (on the mini card, the rates then show as tiles above the footer instead of in it) and behind the CPU and RAM gauges and mini card bars (0–100 % scale), from the recorder's 5-minute statistics, fetched in one query (needs sensors with a `state_class`; a sensor without one simply gets no curve). Sections hidden with `show_system` / `show_network` are not fetched. Points sit at their time over the last 24 hours, and the curve breaks where data is missing |
| `show_shutdown` | both | `true` | The shutdown button beside the reboot button (UGREEN NAS **Power Action: Shutdown**, Synology DSM **Shutdown**), with its own confirmation popup; on the mini card, in its zoomed view |
| `show_volumes` | both | `true` | Volumes and used space |
| `show_disks` | both | `true` | Disks details |
| `show_fans` | both | `true` | Fans speed |
| `show_storage` | mini | `true` | Overall storage usage bar |
| `zoom` | mini | `true` | Detail button at the top right: switches to the full card and back (`false` removes it). The full card's options (`show_system`, `show_volumes`, `show_disks`, `show_fans`, thresholds…) apply to the zoomed view and are also set in the mini card's visual editor |
| `thresholds` | both | See [Thresholds](#thresholds) | Orange (`warning`) and red (`critical`) levels per reading: `cpu`, `ram`, `temperature` (CPU / system), `disk_temperature` and `volume` (volumes, and the mini card storage bar); set only the values to change |
| `language` | both | Auto | Force language: `en`, `fr`, `de`, `es`, `sr`, `sr-Latn`, `it`, `nl`, `pt`, `pl`, `ro`, `da`, `sv`, `bg`, `ru`, `uk`, `hu`, `sk`, `cs`, `sl`, `lv` or `el` (auto-detects from HA settings) |

## Screenshots

### <img src="https://raw.githubusercontent.com/juju35/ha-nas-card/main/images/ugreen.svg" alt="" width="24"> UGREEN

While the NAS is running, the card animates: the cooling fans spin at their live speed. It settles to a still card when they stop (and honours `prefers-reduced-motion`).

| Light | Dark |
|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-nas-card/main/screenshots/fans.gif" alt="cooling fans animation" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-nas-card/main/screenshots/fans-dark.gif" alt="cooling fans animation, dark theme" width="400"> |

| Light | Dark |
|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-nas-card/main/screenshots/card.png" alt="card" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-nas-card/main/screenshots/card-dark.png" alt="card dark" width="400"> |
| <img src="https://raw.githubusercontent.com/juju35/ha-nas-card/main/screenshots/mini-card.png" alt="mini card" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-nas-card/main/screenshots/mini-card-dark.png" alt="mini card dark" width="400"> |

Mini card zoomed in with its detail button (top right, click it again or anywhere outside the card to go back):

| Light | Dark |
|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-nas-card/main/screenshots/mini-card-zoom.png" alt="mini card zoomed in" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-nas-card/main/screenshots/mini-card-zoom-dark.png" alt="mini card zoomed in dark" width="400"> |

Drawn UGREEN models (aluminium DXP series, white DH series, flat all-flash DXP480T):

<p align="center"><img src="https://raw.githubusercontent.com/juju35/ha-nas-card/main/images/models-ugreen.svg" alt="UGREEN NAS pictures" width="760"></p>

### <img src="https://raw.githubusercontent.com/juju35/ha-nas-card/main/images/synology.png" alt="" width="24"> Synology

DS923+ set up with Synology DSM: the volume and the drives come from the NAS child devices, the pill shows the security status.

| Light | Dark |
|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-nas-card/main/screenshots/card-synology.png" alt="card synology" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-nas-card/main/screenshots/card-synology-dark.png" alt="card synology dark" width="400"> |
| <img src="https://raw.githubusercontent.com/juju35/ha-nas-card/main/screenshots/mini-card-synology.png" alt="mini card synology" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-nas-card/main/screenshots/mini-card-synology-dark.png" alt="mini card synology dark" width="400"> |

Drawn Synology models (black DS towers, RS rackmounts):

<p align="center"><img src="https://raw.githubusercontent.com/juju35/ha-nas-card/main/images/models-synology.svg" alt="Synology NAS pictures" width="760"></p>

### <img src="https://raw.githubusercontent.com/juju35/ha-nas-card/main/images/qnap.png" alt="" width="24"> QNAP

TS-464 set up with QNAP, with the drive temperatures and the volume used space enabled:

| Light | Dark |
|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-nas-card/main/screenshots/card-qnap.png" alt="card qnap" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-nas-card/main/screenshots/card-qnap-dark.png" alt="card qnap dark" width="400"> |
| <img src="https://raw.githubusercontent.com/juju35/ha-nas-card/main/screenshots/mini-card-qnap.png" alt="mini card qnap" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-nas-card/main/screenshots/mini-card-qnap-dark.png" alt="mini card qnap dark" width="400"> |

Drawn QNAP models (graphite towers with the copper strip, rackmounts for the models ending in U):

<p align="center"><img src="https://raw.githubusercontent.com/juju35/ha-nas-card/main/images/models-qnap.svg" alt="QNAP NAS pictures" width="760"></p>

### <img src="https://raw.githubusercontent.com/juju35/ha-nas-card/main/images/asustor.svg" alt="" width="24"> ASUSTOR

AS5304T set up with ha-asustor, with two fans and two network interfaces:

| Light | Dark |
|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-nas-card/main/screenshots/card-asustor.png" alt="card asustor" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-nas-card/main/screenshots/card-asustor-dark.png" alt="card asustor dark" width="400"> |
| <img src="https://raw.githubusercontent.com/juju35/ha-nas-card/main/screenshots/mini-card-asustor.png" alt="mini card asustor" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-nas-card/main/screenshots/mini-card-asustor-dark.png" alt="mini card asustor dark" width="400"> |

Drawn ASUSTOR models, all the 83 of the manufacturer's resource page, one drawing per product family after its product photos: Drivestor (closed front with a diamond texture, orange mark), Drivestor Pro and Nimbustor (glossy black front with one tray per disk, red lines), Lockerstor and the AS50…AS70 ranges (control strip with teal and blue lines, a display from 4 bays, vertical trays, two columns of horizontal trays from 8 bays), rackmounts (a row of bays for 1U, a grid of four columns above) and the flat Flashstor (a thin slab for the FS6712X). The bay count is the last two digits of the model number (AS5304T → 4, AS6708T → 8, FS6712X → 12), or the last digit of an older three-digit one (AS-604RS → 4). Older AS-… models have no photo and use the tray drawing:

<p align="center"><img src="https://raw.githubusercontent.com/juju35/ha-nas-card/main/images/models-asustor.svg" alt="ASUSTOR NAS pictures" width="760"></p>

## How it works

### UGREEN NAS

Every entity created by the integration carries a `UGNAS_device_id` attribute. The cards use it to gather the entities of a NAS, then recognize each sensor from the end of its entity id (`cpu_usage`, `pool_1_volume_1_used_size_raw`, `pool_2_disk_1_temperature`…). Entity ids de-duplicated by Home Assistant (for example `sensor.ugreen_nas_cpu_usage_2`) are supported, and so are renamed devices. Volume sizes are read from the `*_raw` sensors (bytes) so that the used space is exact whatever the unit chosen by the integration.

The UGOS version is read from `nas_ugos_version` or, for a NAS adopted with integration v2026.10.1 or later (where the sensor became « UGOS Version »), from `ugos_version`. The **Update Available** sensor (v2026.10.1 and later) shows an « Update available » chip with the new UGOS version while it is `True`. The **Power Action: Reboot** button (`power_action_reboot`, v2026.05.1 and later) adds the reboot button at the end of the system facts, with the same confirmation popup as on Synology; buttons carry no `UGNAS_device_id`, so the cards pick the one on the NAS's device, or the one named after its entity prefix. The **Power Action: Shutdown** button (`power_action_shutdown`) adds a shutdown button beside it, found the same way (`show_shutdown: false` hides it); the wake-up button is never used.

### Synology DSM and QNAP

The cards read the Home Assistant entity and device registries instead of entity ids: every entity of these integrations is matched by its `translation_key` (`cpu_total_load`, `memory_real_usage`, `volume_percentage_used`, `disk_temp`, `drive_temp`…) and by the device it belongs to. Entity ids can therefore be in any language or renamed without breaking the cards.

- **Synology DSM**: volumes and disks are child devices of the NAS; their labels and the disk models come from there. The security status binary sensor feeds the status pill (« Normal » / « Warning »), and the uptime comes from the **Last boot** sensor. The DSM version is shown under the model. A disk is shown in red when its status or SMART status is not normal, or when its **Exceeded max bad sectors** or **Below min remaining life** binary sensor is on. The DSM **update** entity of the NAS shows an « Update available » chip with the new version while it is on, the **Reboot** button (found by its `restart` device class) adds a reboot button at the end of the system facts, and the **Shutdown** button (`mdi:power`, no device class) a shutdown button beside it (`show_shutdown: false` hides it): each asks for a confirmation at the top of the card before pressing it.
- **QNAP**: everything sits on one device; volumes and drives are told apart by the identifier the integration inserts in the entity names (for example `DataVol1` or `0:1`). The first network interface feeds the network tiles, and the firmware is shown as QTS or QuTS hero.
- Some useful sensors are disabled by default by these integrations — on QNAP, drive temperatures, SMART statuses, memory sizes, network rates and volume used space; on Synology, total volume sizes; on ASUSTOR, the total and used volume sizes (deduced from the free space and the used percentage when disabled) and the disk sizes. Enable them in **Settings → Devices & services → Entities** to fill the matching sections of the card (missing sizes are completed from the used percentage when possible).
- Fans are not reported by these integrations: the fans section only shows on UGREEN and ASUSTOR NAS.

### ASUSTOR

The [ha-asustor](https://github.com/aubierr/ha-asustor) integration (SNMP) is discovered like Synology DSM: the NAS is the root device, and its volumes, disks and network interfaces are child devices. CPU, RAM, CPU and system temperatures, uptime (converted from the unit Home Assistant displays, days by default), CPU model, fans, the ADM update chip (« ADM x.y » under the name), a volume's RAID level, status (the RAID chip) and filesystem, and each disk's temperature, status, SMART health, size and model. The first network interface feeds the network tiles. Total and used volume sizes are disabled by default in the integration: they are deduced from the free space and the used percentage. No server status and no reboot button (the integration has none). The model pictures (AS…, FS…, rackmounts for AS…R…) are drawings.

### NAS pictures

The picture is drawn from the model reported by the integration, so a renamed NAS keeps the right picture: UGREEN DXP towers (aluminium) and DH towers (white) by bay count, the flat all-flash DXP480T; Synology DS towers with the bay count of their family (DS723+ has 2 bays, DS923+ 4, DS1522+ 5, DS1821+ 8…) and RS rackmounts; QNAP towers with the bay count of their name (TS-464 → 4) and rackmounts for the models ending in U (TS-873AeU, TS-1264U-RP). ASUSTOR towers (AS…, FS…) with the bay count of their number (AS5304T → 4) and rackmounts for AS…R… models. Use the `image` option to pick another one or your own.

### Units

Sizes and rates follow Home Assistant's units: `kB`, `MB`, `GB` and `TB` (and `kB/s`, `MB/s`…) are decimal (powers of 1000), `KiB`, `MiB`, `GiB` and `TiB` (and `KiB/s`, `MiB/s`…) are binary (powers of 1024), whatever unit you choose for a sensor in Home Assistant. The cards display decimal units, so a volume reported as `6.62 TB` reads `6.62 TB` on the card too.

### Thresholds

Default levels, changed with the `thresholds` option (or the **Alert thresholds** section of the visual editor):

| Value | Key | Orange (`warning`) | Red (`critical`) |
|---|---|---|---|
| CPU usage | `cpu` | 70 % | 90 % |
| RAM usage | `ram` | 80 % | 95 % |
| CPU / system temperature | `temperature` | 75 °C | 90 °C |
| Disk temperature | `disk_temperature` | 60 °C | 70 °C |
| Volume usage | `volume` | 80 % | 90 % |

```yaml
thresholds:
  temperature:
    warning: 70
  disk_temperature:
    warning: 50
    critical: 60
```

Temperatures are shown in the unit of their sensor, which follows your Home Assistant unit system (°C, °F or K); the temperature thresholds are in °C and apply to the converted value, so 124 °F (51 °C) stays green.

### Narrow cards

The full card fits down to 9 columns of a sections view (about 234 px on a phone), the mini card down to 6 columns (about 156 px on a phone). On narrow cards, the NAS picture is hidden (below about 340 px on the full card, 220 px on the mini card) so that the name keeps its room, the volume details move under their bar and the mini card drops the uptime from its footer, then puts its upload rate under the download rate. Below about 200 px, the status pill shrinks to its colored dot (its text stays in its tooltip) and the mini card rows keep their icon, bar and value (the label stays in their tooltip). In a container sized by its content (a grid `auto` column, an inline-block wrapper), the cards take a width of 400 px instead of collapsing.

## Development

```bash
npm install
npm run build              # bundles src/nas-card.js into dist/nas-card.js
npm run check              # builds and checks the card (run in CI)
node scripts/models-svg.mjs  # renders the drawn model galleries of the README into images/models-*.svg
npm run screenshots        # renders the cards with mock data (scripts/mock-states.mjs) into screenshots/ (and fans.gif / fans-dark.gif, needs ffmpeg)
```

`dist/` is not committed: `npm run build` creates it locally, CI builds it on every push, and the release workflow attaches the built file to the release, which is where the Marketplace installs it from.

### Releasing

1. Bump `version` in `package.json`
2. Add a `## <version>` section at the top of [CHANGELOG.md](https://github.com/juju35/ha-nas-card/blob/main/CHANGELOG.md)
3. Push to `main`: the **Release** workflow builds the card, creates the tag and the GitHub release with the changelog section as notes, and attaches `nas-card.js`

## Translations

The cards auto-detect the language from your Home Assistant settings. Currently supported:

| Language | Code |
|---|---|
| English | `en` |
| Français | `fr` |
| Deutsch | `de` |
| Español | `es` |
| Српски (Serbian, Cyrillic) | `sr` |
| Srpski (Serbian, Latin) | `sr-Latn` |
| Italiano | `it` |
| Nederlands | `nl` |
| Português (Portugal) | `pt` |
| Polski | `pl` |
| Română | `ro` |
| Dansk | `da` |
| Svenska | `sv` |
| Български | `bg` |
| Русский | `ru` |
| Українська | `uk` |
| Magyar | `hu` |
| Slovenčina | `sk` |
| Čeština | `cs` |
| Slovenščina | `sl` |
| Latviešu | `lv` |
| Ελληνικά | `el` |

Contributions for additional languages are welcome!

## Credits

UGREEN and its logo are trademarks of UGREEN Group; Synology, DSM and the Synology logo are trademarks of Synology Inc.; QNAP, QTS, QuTS hero and the QNAP logo are trademarks of QNAP Systems, Inc.; ASUSTOR, ADM and the ASUSTOR logo are trademarks of ASUSTOR Inc. The NAS pictures are drawings, not product photos. This project is not affiliated with UGREEN, Synology, QNAP or ASUSTOR.

## License

[MIT](https://github.com/juju35/ha-nas-card/blob/main/LICENSE)

## Support

If you find this project useful, you can support its development:

<a href="https://buymeacoffee.com/julienstep9"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me a Coffee" height="50"></a>
