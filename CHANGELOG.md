# Changelog

## 1.23.0 - 2026-11-11

### Features
- **ASUSTOR** (ha-asustor integration, SNMP): discovered like Synology DSM. CPU, RAM, CPU and system temperatures, uptime, CPU model, fans, the ADM update chip and « ADM x.y » under the name; volumes with RAID level, status (RAID chip), filesystem and used space; disks with temperature, status, SMART health, size and model; network rates of the first interface.
- ASUSTOR pictures: the 83 models of the manufacturer's resource page listed in the editor, each drawn after the product photos of its family (Drivestor, Drivestor Pro / Nimbustor, Lockerstor and AS50…AS70 with a display and trays, rackmounts, Flashstor).
- The editor and error texts name ASUSTOR in the 22 languages; the « url » hint tells to set it for ASUSTOR as for QNAP (neither integration provides a configuration URL). The brand logo comes from the Dashboard Icons collection.

### Fixes
- ASUSTOR volumes and disks are labelled « Volume 1 », « Disk 1 » instead of « NAS Volume 1 » / « NAS Disk 1 » (the NAS name prefix of the integration's device names is left out), so a narrow disk tile no longer cuts its name.
- The uptime of a duration sensor is converted from its own unit (Home Assistant shows ASUSTOR's in days).
- A volume known only by its free space and used percentage gets its total and used sizes deduced.
- A disk reported « Idle » is healthy.

## 1.22.0 - 2026-11-10

### Features
- **RAID state**: each volume of the full card shows its RAID state as a chip next to the RAID level — green while healthy, orange during a background task (syncing, rebuilding, repairing, checking, a drive being added or replaced…), red when degraded or crashed. A click opens the state's entity. Known states are translated in the 22 languages; any other keeps the integration's own word.
- Mini card: a RAID that is not healthy shows in the footer (« RAID1 · Degraded »), the worst one first, in its colour.
- UGREEN: from the storage pool status (the 15 UGOS states). Synology DSM: from the volume status, now shown once as the RAID chip instead of the volume's dot. QNAP's integration reports no RAID or volume state, so its volumes show none.

## 1.21.3 - 2026-11-10

### Changes
- Mini card: the temperature row now comes after the storage row (CPU, RAM, storage, temperature), as on the System Monitor mini card.

## 1.21.2 - 2026-11-10

### Fixes
- Synology DSM and QNAP behind a FRITZ! mesh repeater (#74): FRITZ!Box Tools links its network clients, the NAS device merged in by its MAC address, to the repeater they go through, and the card took that repeater for the NAS: wrong model and version under the name (« FRITZ!Repeater 1610 Outdoor · 8.20 »), empty CPU, RAM and temperature gauges, the NAS temperature shown as a ninth drive, the repeater (« CarPort ») in the editor's list and « NAS not found » with the NAS device id. The NAS is now the topmost device of its own integration.
- `nas` option of a Synology DSM or QNAP NAS: the visual editor writes the NAS's device name instead of its device id (the device id only when two NAS share a name); device ids written by earlier versions are still read and become the name when the card is saved again.
- A volume or drive without a « (…) » part in its device name is labelled with that name, and one without any name with its number, never with its device id.

## 1.21.1 - 2026-11-09

### Fixes
- Header on a phone-wide card (zoomed mini card, full card on a phone): the status pill, the model and the OS version were cut (« Nor… », « DXP48… », « UGOS … »). The model and the OS version now run under the status pill too, and the NAS picture takes at most 28 % of the width (instead of 40 %) on cards up to 420 px.

## 1.21.0 - 2026-11-09

### Features
- UGREEN: « Update available » chip with the new UGOS version while the integration's **Update Available** sensor is `True` (UGREEN NAS integration v2026.10.1 and later), on the full card and in the mini card's footer, like the DSM update on Synology.
- UGREEN: reboot button at the end of the system facts, with its confirmation popup, pressing the integration's **Power Action: Reboot** button (v2026.05.1 and later). With several NAS, each card uses the button of its own NAS (device registry, then entity prefix); the shutdown and wake-up buttons are never used.

### Fixes
- UGREEN: the UGOS version under the model was missing for a NAS adopted with the integration's v2026.10.1 or later, whose « NAS UGOS Version » sensor became « UGOS Version » (`<prefix>_ugos_version`) when the prefix does not end with « nas ». Both ids are read.

## 1.20.1 - 2026-11-09

### Fixes
- Translations: the cards are defined once the page's language file has arrived (at most 1.5 s; Home Assistant builds a card when its element gets defined), so the first render is already translated instead of English then redrawn; until a language file is in, a missing text reads the English one wherever the card has no fallback of its own.

## 1.20.0 - 2026-11-09

### Performance
- **Translations load on demand**: the bundle keeps English only (160 KB → 115 KB) and each other language is its own `nas-card.i18n.<lang>.js` file next to it, fetched the first time a card needs it. Home Assistant loads every dashboard resource on every dashboard, so each page used to download and parse all 22 languages to use one. Until a language file has arrived (a few milliseconds), texts fall back to English, and the cards redraw once it is there.

### Maintenance
- Build: `scripts/i18n-split.mjs` splits the built bundle and rebuilds every table from the split files to check them (the build fails on any difference); `src/` keeps every language as before.
- Release: every file of `dist/` is attached. Manual installation copies the translation files too.

## 1.19.1 - 2026-11-09

### Fixes
- Synology: the NAS temperature gauge and the disk temperatures were missing (#58). The integration registers its `temperature` and `disk_temp` sensors without a translation key, so they are now found by their temperature device class (or by their default entity id while the state is not loaded yet).

## 1.19.0 - 2026-11-08

### Features
- 24 h curves behind the CPU and RAM gauges (full card) and the CPU and RAM bars (mini card), on a 0–100 % scale, for UGREEN, Synology and QNAP.
- They come in the same recorder statistics query as the download / upload curves, follow `show_history` (now labelled « Show 24 h history ») and are not fetched with `show_system: false`.

## 1.18.1 - 2026-11-08

### Fixes
- Reboot popup: the second click of a double click on its button no longer reopens it, and Escape and Tab keep working even when the focus has left the card.
- The fallback names « Volume N » and « Disk N » and the fan speed unit are translated, and fan speeds use the card's number format.

## 1.18.0 - 2026-11-07

### Features
- Synology: an « Update available » chip shows the new DSM version when the NAS has an update (full card and mini card footer).
- Synology: a reboot button at the end of the system facts presses the NAS's Reboot button after a confirmation popup at the top of the card.

### Fixes
- Synology: a disk turns red when its SMART status is not normal or its bad sector or remaining life threshold is exceeded, not only on its status.
- A volume or disk without any status entity no longer shows a green dot.
- Sizes and rates use the decimal separator of the card's language (for example 1,5 TB in French).

## 1.17.0 - 2026-11-07

### Features
- Alert thresholds: the orange and red levels of CPU, RAM, temperatures, disk temperatures and volume usage can be set with `thresholds` (also in a folded section of the visual editor); the former values stay the defaults.
- 24 h curves: the download / upload curves place each point at its time over the last 24 hours and break where data is missing (NAS or recorder down), instead of spacing the points evenly and bridging the gap.

## 1.16.0 - 2026-11-07

### Features
- Mini card: the folded rates show as the full card's download / upload tiles with their last 24 hours, above the footer (`show_history`, now also in the mini card editor; `show_history: false` keeps the rates in the footer). On a narrow card the tiles go one per line.

## 1.15.0 - 2026-11-07

### Features
- Full card: the download and upload tiles draw their last 24 hours behind the rate (recorder 5-minute statistics, refreshed every 5 minutes). `show_history: false` turns it off (also in the visual editor).

## 1.14.2 - 2026-11-04

### Documentation
- README: images and links use absolute URLs, so the screenshots, icons, badges and links display in HACS (relative paths broke there).
- README: screenshots get a display size, so cards no longer show oversized in HACS and on GitHub.

## 1.14.1 - 2026-11-04

### Added
- Added Romanian, Danish, Swedish, Bulgarian, Russian, Ukrainian, Hungarian, Slovak, Czech, Slovenian, Latvian and Greek translations: `ro`, `da`, `sv`, `bg`, `ru`, `uk`, `hu`, `sk`, `cs`, `sl`, `lv` and `el`, picked automatically from the Home Assistant language or set with `language`, and offered in the visual editor.

## 1.14.0 - 2026-11-03

### Features
- Header: the brand logo (UGREEN, Synology or QNAP) is back as a badge on the round NAS icon, on the full card and the mini cards. The logos are embedded (no network request); the icon keeps its status colour.

## 1.13.9 - 2026-11-02

### Fixes
- Mini cards: the header icon keeps its full size (40 px) in the compact view, like the full card.

## 1.13.8 - 2026-11-02

### Changed
- Cards: the header shows the round NAS icon of the project's showcase page instead of the UGREEN, Synology or QNAP logo, tinted with the status color like the chip (green normal, orange warning, grey unavailable). Clicking it still opens the brand's website (`brand_url`). The Synology and QNAP logos are no longer loaded from the Home Assistant brand images.

## 1.13.7 - 2026-11-01

### Fixes
- **Temperatures in °F**: with Home Assistant in imperial units (or a sensor set to °F), CPU, system and disk temperatures read `124°F` instead of `124°C`, and the orange and red alerts apply to the °C value (124 °F = 51 °C is no longer red). Kelvin works too.
- **Unavailable status**: while the NAS is offline, the status pill and the mini card footer show "Unavailable" / "Unknown" in the card language, in grey, instead of the raw English `unavailable`. Volume and disk dots without a status turn grey instead of red.
- **Narrow cards**: on narrow cards, the full card keeps the NAS name and its volume names readable (the NAS picture is hidden, the volume details move under their bar, the RAID and file system tags no longer cover the sizes) and, below about 200 px, the status pill shrinks to its dot; the mini card keeps each footer item on one line and drops the uptime first.
- **Serbian mini card**: the "Складиште" label no longer runs into its bar: the labels column follows the longest label.
- **Readability**: the status pill text, disk temperatures and the setup warning mix their state color with the text color, for a contrast of at least 4.5:1 in light and dark themes (the colored dot is unchanged).
- **Phones**: the full card now asks for 9 columns at least in a sections view (6 columns on a phone, about 156 px, were too narrow for its gauges and tiles). The mini card works down to 6 columns on a phone: below about 200 px its rows keep their icon, bar and value (the label is in the row tooltip), and its footer puts the upload rate under the download rate instead of running past the card edge.
- **Status pill**: it shows its whole label ("Normal", "Unavailable"…) as long as the NAS name keeps a few characters (from 234 px upwards in all languages), and only truncates it when the room really runs out. The mini card footer status carries its full text in its tooltip.
- **Cards sized by their content**: in a container that takes the width of its content (grid `auto` column, inline-block wrapper, some layout-card or button-card setups), the cards take a width of 400 px instead of collapsing to a few pixels, and still shrink to their column in a two-column grid (grid card, horizontal stack, layout-card), even when wrapped in another element.
- **Keyboard**: zooming the mini card in or out with Enter or Space keeps the focus on the zoom button without scrolling the page.

### Maintenance
- `biome.json` schema aligned with Biome 2.6.4, the version used by pre-commit and CI.
- Screenshots: a PNG or GIF is only rewritten when its decoded pixels change, and the fan GIFs are deterministic (the card's own animations are now stepped frame by frame too).

## 1.13.6 - 2026-11-01

### Added
- Added Italian, Dutch, European Portuguese and Polish translations: `it`, `nl`, `pt` and `pl`, picked automatically from the Home Assistant language (`pt-BR` falls back to European Portuguese) or set with `language`, and offered in the visual editor.

## 1.13.5 - 2026-11-01

### Added
- Added Serbian (Cyrillic and Latin) translations: `sr` and `sr-Latn`, picked automatically from the Home Assistant language or set with `language`, and offered in the visual editor.

## 1.13.4 - 2026-10-29

### Fixes
- **Synology and QNAP NAS with ten bays or more**: drives (and volumes) are listed in bay order (`Drive 1` … `Drive 12`) instead of `Drive 10, 11, 12, 1, 2 …`. With several network interfaces, the QNAP network tiles follow the first one in numeric order (`eth2` before `eth10`).
- **Synology security status while the NAS is offline**: the status chip shows the unavailable state like UGREEN and QNAP, instead of a security "Warning".
- **Reduced motion**: with "reduce motion" enabled in the system, the usage bars and gauge rings no longer animate.

### Maintenance
- CI: Biome runs as a pre-commit hook too, and the Biome lint job reads its version from `.pre-commit-config.yaml`, so both stay on the same version.

## 1.13.3 - 2026-10-29

### Fixes
- **UGREEN NAS offline names**: while a UGREEN NAS is rebooting or unreachable, the cards keep showing its last known name, model, UGOS version, CPU model and volume and disk names (and the picture of its model) instead of "unavailable" everywhere. Names never seen since the dashboard was loaded fall back to the generic ones ("UGREEN NAS", "Volume 1", "Disk 1").

## 1.13.2 - 2026-10-29

### Fixes
- **UGREEN NAS offline**: while a UGREEN NAS is rebooting or unreachable, the cards keep their layout with unavailable values (`—`) instead of being replaced by a "NAS not found" or "No NAS entities found" warning. The warning still shows when the NAS was never seen online since the dashboard was loaded, or when its integration was removed.
- **Visual editor default NAS**: with several NAS and no `nas` in the configuration, the editor (and the configuration proposed when adding a card) now selects the NAS the card actually shows, so changing any option in the editor no longer switches the card to another NAS. The editor's NAS list follows the same order.

## 1.13.1 - 2026-10-29

### Fixes
- **QNAP volume and drive names with quotes**: a `"` in a volume or drive name no longer breaks the card markup.
- **RAM label units**: the used memory keeps its own unit when it differs from the total (`800 MB / 2 GB` instead of `800 / 2 GB`).
- **Network accessibility**: a download or upload tile without its sensor is no longer focusable nor shown as clickable, and the mini card network footer opens the upload sensor when there is no download sensor.
- **Spanish mini card**: the storage row label is shortened to "Espacio" so it no longer overflows onto its bar.
- **Size units aligned with Home Assistant**: `kB`, `MB`, `GB` and `TB` are now read and displayed as decimal units (powers of 1000), like Home Assistant and like the network rates already were; `KiB`, `MiB`, `GiB` and `TiB` stay binary. A sensor in GB or TB now reads the same on the card as in Home Assistant (a 16384 MB RAM total shows 16.4 GB instead of 16 GB).
- **French uptime label**: "Temps de fonctionnement :" instead of "Allumé depuis", with a colon like the other languages.

### Maintenance
- CI: the validate workflow installs Chromium's system libraries in a time-boxed, retried step; validate, release and screenshots workflows now fail explicitly when every apt attempt failed.
- CI: when the screenshots workflow pushes refreshed screenshots to a pull request, it re-runs the lint, validate and HACS checks on that commit (a push made with `GITHUB_TOKEN` does not trigger them by itself).

## 1.13.0 - 2026-10-28

### Features
- **German and Spanish translations**: the cards and the visual editor are now available in German (`de`) and Spanish (`es`), auto-detected from the Home Assistant language or forced with the `language` option (Deutsch and Español added to the editor's language selector).

## 1.12.1 - 2026-10-28

### Fixes
- **Performance on Synology/QNAP-only installs**: without any UGREEN entity in the registry, the cards no longer re-scan every state of the instance on each update; the visual editor's NAS list also walks the cached registry-backed candidates instead of all states.
- **Synology/QNAP uptime refreshed**: when the uptime comes from the boot timestamp, the card now refreshes it on the first Home Assistant update after each minute change instead of freezing until the boot sensor itself changes.
- **Accessibility**: gauges and mini-card metrics without an entity (e.g. the aggregated Storage row) are no longer focusable nor shown as clickable.

### Maintenance
- Internal CSS variables renamed from `--ug-*` to `--nas-accent` / `--nas-ok` / `--nas-warn` / `--nas-crit` (colors unchanged).
- CI: screenshots workflow safe for fork pull requests (artifact upload instead of push), release gated on `npm ci` + `npm test` with a concurrency group, Ruff stack removed (no Python files), `hacs/action` pinned on a release like the other actions, Dependabot updates for npm.

## 1.12.0 - 2026-10-27

### Features
- **Brand logo link**: a click on the logo opens the official website of the brand (UGREEN, Synology, QNAP) in a new tab; the `brand_url` option changes the address.
- **NAS interface link**: a click on the NAS picture opens the NAS web interface in a new tab. By default it is the configuration URL of the NAS device in Home Assistant (UGREEN NAS and Synology DSM integrations); the QNAP integration has none, so set the `url` option for a QNAP NAS.
- Both addresses can be set in the visual editor (« NAS interface URL », « Brand website URL »), left empty for the automatic ones. Only `http(s)://` addresses become links.

## 1.11.1 - 2026-10-27

### Changes
- The repository is now [`juju35/ha-nas-card`](https://github.com/juju35/ha-nas-card) (was `juju35/ha-ugreen-nas-card`): README links, badges, HACS buttons, screenshots and the card's documentation link point to the new address. GitHub redirects the old one; HACS custom repository users should re-add the repository under its new name.

## 1.11.0 - 2026-10-27

### Changes
- **Editor**: the NAS pictures are listed by brand (QNAP, Synology, UGREEN), then by model in natural order, each prefixed with its brand (« Synology DS923+ »); the YAML value stays the bare model name.
- **More models drawn**: 43 models across the three brands — Synology DS124, DS223(j), DS225+, DS423, DS425+, DS1825+, DS2422+, RS422+, RS2423+; QNAP TS-133, TS-433, TS-473A, TS-673A, TS-h973AX, TVS-h874, TS-1264U-RP — next to the existing ones.
- **Renamed to `nas-card` / `nas-mini-card`**: the cards are now registered as `custom:nas-card` and `custom:nas-mini-card` (editors `nas-card-editor` / `nas-mini-card-editor`) and show up as **NAS Card** / **NAS Mini Card** in the card picker and « NAS Card (UGREEN, Synology, QNAP) » in HACS. The former types `custom:ugreen-nas-card` / `custom:ugreen-nas-mini-card` stay registered as aliases: existing dashboards keep working.
- **The file is now `nas-card.js`** (was `ugreen-nas-card.js`): HACS installs it under the new name. If you added the dashboard resource by hand (`/hacsfiles/ha-ugreen-nas-card/ugreen-nas-card.js` or `/local/ugreen-nas-card.js`), point it to `nas-card.js`.
- **README** reworked for the three brands, on the model of ha-roborock-card: brand logos, screenshots per brand, one drawn-model gallery per brand (`images/models-<brand>.svg`, from `scripts/models-svg.mjs`), credits.

## 1.10.0 - 2026-10-27

### Features
- **Synology DSM and QNAP support**: the cards now also monitor NAS of the core [Synology DSM](https://www.home-assistant.io/integrations/synology_dsm/) and [QNAP](https://www.home-assistant.io/integrations/qnap/) integrations, next to UGREEN. Entities are discovered through the entity and device registries by `translation_key`, so discovery is language-independent; Synology volumes and disks come from the NAS child devices (labels and disk models included), the security binary sensor feeds the status pill, and QNAP volumes and drives are told apart by the identifier inserted in the entity names. Sizes missing from disabled sensors are completed from the used percentage.
- **Brand logos**: the header shows the logo of the NAS brand — UGREEN stays embedded, the Synology and QNAP marks load from the Home Assistant brand images CDN and are inverted in dark mode.
- **Model pictures**: drawn illustrations for the Synology (black towers, RS rackmounts) and QNAP (graphite towers with the copper strip, rackmounts for models ending in U) families, picked from the model reported by the integration; the editor's picture list covers the three brands and `images/models.svg` (regenerated by `scripts/models-svg.mjs`) shows them all.
- **Aliases**: the cards are also registered as `custom:nas-card` and `custom:nas-mini-card`.

### Maintenance
- Mock states, screenshots (Synology and QNAP captures, light and dark) and tests cover the registry-based discovery; `BRANDS_DIR` lets the screenshot script render the brand logos offline from a checkout of home-assistant/brands.

## 1.9.0 - 2026-10-26

### Fixes
- **Mini card**: the detail button now sits flush top-right and vertically centred on the header, matching the other cards (it was pinned to the top and pulled slightly left).

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
