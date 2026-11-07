/*
 * NAS Card for Home Assistant (UGREEN, Synology, QNAP)
 * https://github.com/juju35/ha-nas-card
 *
 * Lovelace cards for the UGREEN NAS integration
 * (https://github.com/Tom-Bom-badil/home-assistant_ugreen-nas), the Synology DSM integration and
 * the QNAP integration. UGREEN entities are discovered through their UGNAS_device_id attribute;
 * Synology and QNAP entities through the entity and device registries.
 */

const VERSION = "__VERSION__";

const ICONS = {
  cpu: "M6,4H18V5H21V7H18V9H21V11H18V13H21V15H18V17H21V19H18V20H6V19H3V17H6V15H3V13H6V11H3V9H6V7H3V5H6V4M11,15V18H12V15H11M13,15V18H14V15H13M15,15V18H16V15H15Z",
  ram: "M17,17H7V7H17M21,11V9H19V7C19,5.89 18.1,5 17,5H15V3H13V5H11V3H9V5H7C5.89,5 5,5.89 5,7V9H3V11H5V13H3V15H5V17A2,2 0 0,0 7,19H9V21H11V19H13V21H15V19H17A2,2 0 0,0 19,17V15H21V13H19V11M13,13H11V11H13M15,9H9V15H15V9Z",
  temp: "M15 13V5A3 3 0 0 0 9 5V13A5 5 0 1 0 15 13M12 4A1 1 0 0 1 13 5V8H11V5A1 1 0 0 1 12 4Z",
  fan: "M12,11A1,1 0 0,0 11,12A1,1 0 0,0 12,13A1,1 0 0,0 13,12A1,1 0 0,0 12,11M12.5,2C17,2 17.11,5.57 14.75,6.75C13.76,7.24 13.32,8.29 13.13,9.22C13.61,9.42 14.03,9.73 14.35,10.13C18.05,8.13 22.03,8.92 22.03,12.5C22.03,17 18.46,17.1 17.28,14.73C16.78,13.74 15.72,13.3 14.79,13.11C14.59,13.59 14.28,14 13.88,14.34C15.87,18.03 15.08,22 11.5,22C7,22 6.91,18.42 9.27,17.24C10.25,16.75 10.69,15.71 10.89,14.79C10.4,14.59 9.97,14.27 9.65,13.87C5.96,15.85 2,15.07 2,11.5C2,7 5.56,6.89 6.74,9.26C7.24,10.25 8.29,10.68 9.22,10.87C9.41,10.39 9.73,9.97 10.14,9.65C8.15,5.96 8.94,2 12.5,2Z",
  down: "M9,4H15V12H19.84L12,19.84L4.16,12H9V4Z",
  up: "M15,20H9V12H4.16L12,4.16L19.84,12H15V20Z",
  disk: "M6,2H18A2,2 0 0,1 20,4V20A2,2 0 0,1 18,22H6A2,2 0 0,1 4,20V4A2,2 0 0,1 6,2M12,4A6,6 0 0,0 6,10C6,13.31 8.69,16 12.1,16L11.22,13.77C10.95,13.29 11.11,12.68 11.59,12.4L12.45,11.9C12.93,11.63 13.54,11.79 13.82,12.27L15.74,14.69C17.12,13.59 18,11.9 18,10A6,6 0 0,0 12,4M12,9A1,1 0 0,1 13,10A1,1 0 0,1 12,11A1,1 0 0,1 11,10A1,1 0 0,1 12,9M7,18A1,1 0 0,0 6,19A1,1 0 0,0 7,20A1,1 0 0,0 8,19A1,1 0 0,0 7,18M12.09,13.27L14.58,19.58L17.17,18.08L12.95,12.77L12.09,13.27Z",
  database: "M12,3C7.58,3 4,4.79 4,7C4,9.21 7.58,11 12,11C16.42,11 20,9.21 20,7C20,4.79 16.42,3 12,3M4,9V12C4,14.21 7.58,16 12,16C16.42,16 20,14.21 20,12V9C20,11.21 16.42,13 12,13C7.58,13 4,11.21 4,9M4,14V17C4,19.21 7.58,21 12,21C16.42,21 20,19.21 20,17V14C20,16.21 16.42,18 12,18C7.58,18 4,16.21 4,14Z",
  timer: "M12,20A7,7 0 0,1 5,13A7,7 0 0,1 12,6A7,7 0 0,1 19,13A7,7 0 0,1 12,20M19.03,7.39L20.45,5.97C20,5.46 19.55,5 19.04,4.56L17.62,6C16.07,4.74 14.12,4 12,4A9,9 0 0,0 3,13A9,9 0 0,0 12,22C17,22 21,17.97 21,13C21,10.88 20.26,8.93 19.03,7.39M11,14H13V8H11M15,1H9V3H15V1Z",
  // mdi:arrow-expand and mdi:arrow-collapse, the mini card's zoom button.
  expand: "M10,21V19H6.41L10.91,14.5L9.5,13.09L5,17.59V14H3V21H10M14.5,10.91L19,6.41V10H21V3H14V5H17.59L13.09,9.5L14.5,10.91Z",
  collapse: "M19.5,3.09L15,7.59V4H13V11H20V9H16.41L20.91,4.5L19.5,3.09M4,13V15H7.59L3.09,19.5L4.5,20.91L9,16.41V20H11V13H4Z",
  network: "M13,19H14A1,1 0 0,1 15,20H22V22H15A1,1 0 0,1 14,23H10A1,1 0 0,1 9,22H2V20H9A1,1 0 0,1 10,19H11V17H4A1,1 0 0,1 3,16V12A1,1 0 0,1 4,11H20A1,1 0 0,1 21,12V16A1,1 0 0,1 20,17H13V19M4,3H20A1,1 0 0,1 21,4V8A1,1 0 0,1 20,9H4A1,1 0 0,1 3,8V4A1,1 0 0,1 4,3M9,7H10V5H9V7M9,15H10V13H9V15M5,5V7H7V5H5M5,13V15H7V13H5Z",
};

const STRINGS = {
  en: {
    cpu: "CPU",
    ram: "RAM",
    temperature: "Temp.",
    network: "Network",
    storage: "Storage",
    volumes: "Volumes",
    disks: "Disks",
    fans: "Fans",
    uptime: "Uptime:",
    download: "Download",
    upload: "Upload",
    used: "used",
    of: "of",
    hours: "h",
    days: "d",
    minutes: "min",
    no_nas: "No NAS entities found. Is a supported integration (UGREEN NAS, Synology DSM or QNAP) installed?",
    unknown_nas: "NAS not found",
    status_ok: "Normal",
    status_problem: "Warning",
    unavailable: "Unavailable",
    unknown: "Unknown",
    cpu_fan: "CPU fan",
    device_fan: "Fan",
    zoom_in: "Show the full card",
    zoom_out: "Back to the compact view",
    // Editor
    nas: "NAS (UGREEN, Synology DSM or QNAP device)",
    title: "Title (optional, defaults to the NAS name)",
    show_image: "Show NAS picture",
    image: "NAS picture (model or image URL)",
    image_helper: "Automatic from the model reported by the integration",
    image_auto: "Automatic",
    show_system: "Show system (CPU, RAM, temperature)",
    show_network: "Show network",
    show_volumes: "Show volumes",
    show_disks: "Show disks",
    show_fans: "Show fans",
    show_history: "Show 24 h rate history",
    show_storage: "Show storage",
    zoom: "Zoom button",
    zoom_helper: "Switches the mini card to the full card and back",
    url: "NAS interface URL (click on the NAS picture)",
    url_helper: "Automatic from Home Assistant when empty (UGREEN, Synology); set it for QNAP, e.g. http://192.168.1.10:8080",
    brand_url: "Brand website URL (click on the logo)",
    brand_url_helper: "Official website of the brand when empty",
    open_nas: "Open the NAS interface",
    open_brand: "Open the {brand} website",
    language: "Language",
    lang_auto: "Automatic",
  },
  fr: {
    cpu: "CPU",
    ram: "RAM",
    temperature: "Temp.",
    network: "Réseau",
    storage: "Stockage",
    volumes: "Volumes",
    disks: "Disques",
    fans: "Ventilateurs",
    uptime: "Temps de fonctionnement\u00a0:",
    download: "Réception",
    upload: "Envoi",
    used: "utilisés",
    of: "sur",
    hours: "h",
    days: "j",
    minutes: "min",
    no_nas: "Aucune entité NAS trouvée. Une intégration prise en charge (UGREEN NAS, Synology DSM ou QNAP) est-elle installée ?",
    unknown_nas: "NAS introuvable",
    status_ok: "Normal",
    status_problem: "Alerte",
    unavailable: "Indisponible",
    unknown: "Inconnu",
    cpu_fan: "Ventilateur CPU",
    device_fan: "Ventilateur",
    zoom_in: "Afficher la carte complète",
    zoom_out: "Revenir à la vue compacte",
    nas: "NAS (appareil UGREEN, Synology DSM ou QNAP)",
    title: "Titre (facultatif, nom du NAS par défaut)",
    show_image: "Afficher l'illustration du NAS",
    image: "Illustration du NAS (modèle ou URL d'image)",
    image_helper: "Automatique selon le modèle remonté par l'intégration",
    image_auto: "Automatique",
    show_system: "Afficher le système (CPU, RAM, température)",
    show_network: "Afficher le réseau",
    show_volumes: "Afficher les volumes",
    show_disks: "Afficher les disques",
    show_fans: "Afficher les ventilateurs",
    show_history: "Afficher l’historique 24 h des débits",
    show_storage: "Afficher le stockage",
    zoom: "Bouton zoom",
    zoom_helper: "Bascule la mini-carte en carte complète, et inversement",
    url: "URL de l'interface du NAS (clic sur l'illustration)",
    url_helper: "Automatique depuis Home Assistant si vide (UGREEN, Synology) ; à renseigner pour QNAP, ex. http://192.168.1.10:8080",
    brand_url: "URL du site de la marque (clic sur le logo)",
    brand_url_helper: "Site officiel de la marque si vide",
    open_nas: "Ouvrir l'interface du NAS",
    open_brand: "Ouvrir le site {brand}",
    language: "Langue",
    lang_auto: "Automatique",
  },
  de: {
    cpu: "CPU",
    ram: "RAM",
    temperature: "Temp.",
    network: "Netzwerk",
    storage: "Speicher",
    volumes: "Volumes",
    disks: "Laufwerke",
    fans: "Lüfter",
    uptime: "Betriebszeit:",
    download: "Download",
    upload: "Upload",
    used: "belegt",
    of: "von",
    hours: "h",
    days: "T",
    minutes: "min",
    no_nas: "Keine NAS-Entitäten gefunden. Ist eine unterstützte Integration (UGREEN NAS, Synology DSM oder QNAP) installiert?",
    unknown_nas: "NAS nicht gefunden",
    status_ok: "Normal",
    status_problem: "Warnung",
    unavailable: "Nicht verfügbar",
    unknown: "Unbekannt",
    cpu_fan: "CPU-Lüfter",
    device_fan: "Lüfter",
    zoom_in: "Vollständige Karte anzeigen",
    zoom_out: "Zurück zur kompakten Ansicht",
    nas: "NAS (UGREEN-, Synology-DSM- oder QNAP-Gerät)",
    title: "Titel (optional, standardmäßig der NAS-Name)",
    show_image: "NAS-Bild anzeigen",
    image: "NAS-Bild (Modell oder Bild-URL)",
    image_helper: "Automatisch anhand des von der Integration gemeldeten Modells",
    image_auto: "Automatisch",
    show_system: "System anzeigen (CPU, RAM, Temperatur)",
    show_network: "Netzwerk anzeigen",
    show_volumes: "Volumes anzeigen",
    show_disks: "Laufwerke anzeigen",
    show_fans: "Lüfter anzeigen",
    show_history: "24-h-Verlauf der Raten anzeigen",
    show_storage: "Speicher anzeigen",
    zoom: "Zoom-Schaltfläche",
    zoom_helper: "Wechselt von der Mini-Karte zur vollständigen Karte und zurück",
    url: "URL der NAS-Oberfläche (Klick auf das NAS-Bild)",
    url_helper: "Wenn leer, automatisch aus Home Assistant (UGREEN, Synology); für QNAP angeben, z. B. http://192.168.1.10:8080",
    brand_url: "URL der Hersteller-Website (Klick auf das Logo)",
    brand_url_helper: "Wenn leer, die offizielle Website des Herstellers",
    open_nas: "NAS-Oberfläche öffnen",
    open_brand: "Website von {brand} öffnen",
    language: "Sprache",
    lang_auto: "Automatisch",
  },
  es: {
    cpu: "CPU",
    ram: "RAM",
    temperature: "Temp.",
    network: "Red",
    storage: "Espacio",
    volumes: "Volúmenes",
    disks: "Discos",
    fans: "Ventiladores",
    uptime: "Tiempo activo:",
    download: "Descarga",
    upload: "Subida",
    used: "usados",
    of: "de",
    hours: "h",
    days: "d",
    minutes: "min",
    no_nas: "No se han encontrado entidades de NAS. ¿Está instalada una integración compatible (UGREEN NAS, Synology DSM o QNAP)?",
    unknown_nas: "NAS no encontrado",
    status_ok: "Normal",
    status_problem: "Alerta",
    unavailable: "No disponible",
    unknown: "Desconocido",
    cpu_fan: "Ventilador de la CPU",
    device_fan: "Ventilador",
    zoom_in: "Mostrar la tarjeta completa",
    zoom_out: "Volver a la vista compacta",
    nas: "NAS (dispositivo UGREEN, Synology DSM o QNAP)",
    title: "Título (opcional, por defecto el nombre del NAS)",
    show_image: "Mostrar la imagen del NAS",
    image: "Imagen del NAS (modelo o URL de imagen)",
    image_helper: "Automática según el modelo indicado por la integración",
    image_auto: "Automática",
    show_system: "Mostrar el sistema (CPU, RAM, temperatura)",
    show_network: "Mostrar la red",
    show_volumes: "Mostrar los volúmenes",
    show_disks: "Mostrar los discos",
    show_fans: "Mostrar los ventiladores",
    show_history: "Mostrar el historial de 24 h de las velocidades",
    show_storage: "Mostrar el almacenamiento",
    zoom: "Botón de zoom",
    zoom_helper: "Cambia la minitarjeta a la tarjeta completa y viceversa",
    url: "URL de la interfaz del NAS (clic en la imagen del NAS)",
    url_helper: "Automática desde Home Assistant si está vacía (UGREEN, Synology); indícala para QNAP, p. ej. http://192.168.1.10:8080",
    brand_url: "URL del sitio web de la marca (clic en el logotipo)",
    brand_url_helper: "Sitio web oficial de la marca si está vacía",
    open_nas: "Abrir la interfaz del NAS",
    open_brand: "Abrir el sitio web de {brand}",
    language: "Idioma",
    lang_auto: "Automático",
  },
  sr: {
    cpu: "CPU",
    ram: "RAM",
    temperature: "Темп.",
    network: "Мрежа",
    storage: "Складиште",
    volumes: "Волумени",
    disks: "Дискови",
    fans: "Вентилатори",
    uptime: "Време рада:",
    download: "Преузимање",
    upload: "Слање",
    used: "искоришћено",
    of: "од",
    hours: "h",
    days: "d",
    minutes: "min",
    no_nas: "Нису пронађени NAS ентитети. Да ли је инсталирана подржана интеграција (UGREEN NAS, Synology DSM или QNAP)?",
    unknown_nas: "NAS није пронађен",
    status_ok: "Нормално",
    status_problem: "Упозорење",
    unavailable: "Недоступно",
    unknown: "Непознато",
    cpu_fan: "CPU вентилатор",
    device_fan: "Вентилатор",
    zoom_in: "Прикажи целу картицу",
    zoom_out: "Назад на компактни приказ",
    nas: "NAS (UGREEN, Synology DSM или QNAP уређај)",
    title: "Наслов (опционо, подразумевано је назив NAS-а)",
    show_image: "Прикажи слику NAS-а",
    image: "Слика NAS-а (модел или URL слике)",
    image_helper: "Аутоматски према моделу који пријављује интеграција",
    image_auto: "Аутоматски",
    show_system: "Прикажи систем (CPU, RAM, температура)",
    show_network: "Прикажи мрежу",
    show_volumes: "Прикажи волумене",
    show_disks: "Прикажи дискове",
    show_fans: "Прикажи вентилаторе",
    show_history: "Прикажи историју протока за 24 ч",
    show_storage: "Прикажи складиште",
    zoom: "Дугме за увећање",
    zoom_helper: "Пребацује мини картицу на пун приказ и назад",
    url: "URL интерфејса NAS-а (клик на слику NAS-а)",
    url_helper: "Ако је празно, аутоматски из Home Assistant-а (UGREEN, Synology); за QNAP га унесите, нпр. http://192.168.1.10:8080",
    brand_url: "URL веб-сајта бренда (клик на лого)",
    brand_url_helper: "Ако је празно, званични веб-сајт бренда",
    open_nas: "Отвори интерфејс NAS-а",
    open_brand: "Отвори веб-сајт {brand}",
    language: "Језик",
    lang_auto: "Аутоматски",
  },
  "sr-Latn": {
    cpu: "CPU",
    ram: "RAM",
    temperature: "Temp.",
    network: "Mreža",
    storage: "Skladište",
    volumes: "Volumeni",
    disks: "Diskovi",
    fans: "Ventilatori",
    uptime: "Vreme rada:",
    download: "Preuzimanje",
    upload: "Slanje",
    used: "iskorišćeno",
    of: "od",
    hours: "h",
    days: "d",
    minutes: "min",
    no_nas: "Nisu pronađeni NAS entiteti. Da li je instalirana podržana integracija (UGREEN NAS, Synology DSM ili QNAP)?",
    unknown_nas: "NAS nije pronađen",
    status_ok: "Normalno",
    status_problem: "Upozorenje",
    unavailable: "Nedostupno",
    unknown: "Nepoznato",
    cpu_fan: "CPU ventilator",
    device_fan: "Ventilator",
    zoom_in: "Prikaži celu karticu",
    zoom_out: "Nazad na kompaktni prikaz",
    nas: "NAS (UGREEN, Synology DSM ili QNAP uređaj)",
    title: "Naslov (opciono, podrazumevano je naziv NAS-a)",
    show_image: "Prikaži sliku NAS-a",
    image: "Slika NAS-a (model ili URL slike)",
    image_helper: "Automatski prema modelu koji prijavljuje integracija",
    image_auto: "Automatski",
    show_system: "Prikaži sistem (CPU, RAM, temperatura)",
    show_network: "Prikaži mrežu",
    show_volumes: "Prikaži volumene",
    show_disks: "Prikaži diskove",
    show_fans: "Prikaži ventilatore",
    show_history: "Prikaži istoriju protoka za 24 č",
    show_storage: "Prikaži skladište",
    zoom: "Dugme za uvećanje",
    zoom_helper: "Prebacuje mini karticu na pun prikaz i nazad",
    url: "URL interfejsa NAS-a (klik na sliku NAS-a)",
    url_helper: "Ako je prazno, automatski iz Home Assistant-a (UGREEN, Synology); za QNAP ga unesite, npr. http://192.168.1.10:8080",
    brand_url: "URL veb-sajta brenda (klik na logo)",
    brand_url_helper: "Ako je prazno, zvanični veb-sajt brenda",
    open_nas: "Otvori interfejs NAS-a",
    open_brand: "Otvori veb-sajt {brand}",
    language: "Jezik",
    lang_auto: "Automatski",
  },
  it: {
    cpu: "CPU",
    ram: "RAM",
    temperature: "Temp.",
    network: "Rete",
    storage: "Spazio",
    volumes: "Volumi",
    disks: "Dischi",
    fans: "Ventole",
    uptime: "Tempo di attività:",
    download: "Download",
    upload: "Upload",
    used: "utilizzati",
    of: "su",
    hours: "h",
    days: "g",
    minutes: "min",
    no_nas: "Nessuna entità NAS trovata. È installata un'integrazione supportata (UGREEN NAS, Synology DSM o QNAP)?",
    unknown_nas: "NAS non trovato",
    status_ok: "Normale",
    status_problem: "Avviso",
    unavailable: "Non disponibile",
    unknown: "Sconosciuto",
    cpu_fan: "Ventola CPU",
    device_fan: "Ventola",
    zoom_in: "Mostra la scheda completa",
    zoom_out: "Torna alla vista compatta",
    nas: "NAS (dispositivo UGREEN, Synology DSM o QNAP)",
    title: "Titolo (facoltativo, per impostazione predefinita il nome del NAS)",
    show_image: "Mostra l'immagine del NAS",
    image: "Immagine del NAS (modello o URL dell'immagine)",
    image_helper: "Automatica in base al modello indicato dall'integrazione",
    image_auto: "Automatica",
    show_system: "Mostra il sistema (CPU, RAM, temperatura)",
    show_network: "Mostra la rete",
    show_volumes: "Mostra i volumi",
    show_disks: "Mostra i dischi",
    show_fans: "Mostra le ventole",
    show_history: "Mostra lo storico 24 h delle velocità",
    show_storage: "Mostra l'archiviazione",
    zoom: "Pulsante zoom",
    zoom_helper: "Passa dalla mini scheda alla scheda completa e viceversa",
    url: "URL dell'interfaccia del NAS (clic sull'immagine del NAS)",
    url_helper: "Automatico da Home Assistant se vuoto (UGREEN, Synology); da indicare per QNAP, ad es. http://192.168.1.10:8080",
    brand_url: "URL del sito del marchio (clic sul logo)",
    brand_url_helper: "Sito ufficiale del marchio se vuoto",
    open_nas: "Apri l'interfaccia del NAS",
    open_brand: "Apri il sito di {brand}",
    language: "Lingua",
    lang_auto: "Automatica",
  },
  nl: {
    cpu: "CPU",
    ram: "RAM",
    temperature: "Temp.",
    network: "Netwerk",
    storage: "Opslag",
    volumes: "Volumes",
    disks: "Schijven",
    fans: "Ventilatoren",
    uptime: "Bedrijfstijd:",
    download: "Download",
    upload: "Upload",
    used: "gebruikt",
    of: "van",
    hours: "u",
    days: "d",
    minutes: "min",
    no_nas: "Geen NAS-entiteiten gevonden. Is een ondersteunde integratie (UGREEN NAS, Synology DSM of QNAP) geïnstalleerd?",
    unknown_nas: "NAS niet gevonden",
    status_ok: "Normaal",
    status_problem: "Waarschuwing",
    unavailable: "Niet beschikbaar",
    unknown: "Onbekend",
    cpu_fan: "CPU-ventilator",
    device_fan: "Ventilator",
    zoom_in: "Volledige kaart weergeven",
    zoom_out: "Terug naar de compacte weergave",
    nas: "NAS (UGREEN-, Synology DSM- of QNAP-apparaat)",
    title: "Titel (optioneel, standaard de naam van de NAS)",
    show_image: "Afbeelding van de NAS weergeven",
    image: "Afbeelding van de NAS (model of afbeeldings-URL)",
    image_helper: "Automatisch op basis van het model dat de integratie meldt",
    image_auto: "Automatisch",
    show_system: "Systeem weergeven (CPU, RAM, temperatuur)",
    show_network: "Netwerk weergeven",
    show_volumes: "Volumes weergeven",
    show_disks: "Schijven weergeven",
    show_fans: "Ventilatoren weergeven",
    show_history: "24-uursgeschiedenis van de snelheden weergeven",
    show_storage: "Opslag weergeven",
    zoom: "Zoomknop",
    zoom_helper: "Schakelt de minikaart over naar de volledige kaart en terug",
    url: "URL van de NAS-interface (klik op de afbeelding van de NAS)",
    url_helper: "Indien leeg automatisch vanuit Home Assistant (UGREEN, Synology); vul in voor QNAP, bijv. http://192.168.1.10:8080",
    brand_url: "URL van de website van het merk (klik op het logo)",
    brand_url_helper: "Indien leeg de officiële website van het merk",
    open_nas: "NAS-interface openen",
    open_brand: "Website van {brand} openen",
    language: "Taal",
    lang_auto: "Automatisch",
  },
  pt: {
    cpu: "CPU",
    ram: "RAM",
    temperature: "Temp.",
    network: "Rede",
    storage: "Espaço",
    volumes: "Volumes",
    disks: "Discos",
    fans: "Ventoinhas",
    uptime: "Tempo de atividade:",
    download: "Receção",
    upload: "Envio",
    used: "utilizados",
    of: "de",
    hours: "h",
    days: "d",
    minutes: "min",
    no_nas: "Nenhuma entidade de NAS encontrada. Está instalada uma integração suportada (UGREEN NAS, Synology DSM ou QNAP)?",
    unknown_nas: "NAS não encontrado",
    status_ok: "Normal",
    status_problem: "Aviso",
    unavailable: "Indisponível",
    unknown: "Desconhecido",
    cpu_fan: "Ventoinha CPU",
    device_fan: "Ventoinha",
    zoom_in: "Mostrar o cartão completo",
    zoom_out: "Voltar à vista compacta",
    nas: "NAS (dispositivo UGREEN, Synology DSM ou QNAP)",
    title: "Título (opcional, por predefinição o nome do NAS)",
    show_image: "Mostrar a imagem do NAS",
    image: "Imagem do NAS (modelo ou URL da imagem)",
    image_helper: "Automática segundo o modelo indicado pela integração",
    image_auto: "Automática",
    show_system: "Mostrar o sistema (CPU, RAM, temperatura)",
    show_network: "Mostrar a rede",
    show_volumes: "Mostrar os volumes",
    show_disks: "Mostrar os discos",
    show_fans: "Mostrar as ventoinhas",
    show_history: "Mostrar o histórico de 24 h dos débitos",
    show_storage: "Mostrar o armazenamento",
    zoom: "Botão de zoom",
    zoom_helper: "Alterna o minicartão para o cartão completo e vice-versa",
    url: "URL da interface do NAS (clique na imagem do NAS)",
    url_helper: "Automático a partir do Home Assistant se vazio (UGREEN, Synology); indique-o para QNAP, p. ex. http://192.168.1.10:8080",
    brand_url: "URL do site da marca (clique no logótipo)",
    brand_url_helper: "Site oficial da marca se vazio",
    open_nas: "Abrir a interface do NAS",
    open_brand: "Abrir o site da {brand}",
    language: "Idioma",
    lang_auto: "Automático",
  },
  pl: {
    cpu: "CPU",
    ram: "RAM",
    temperature: "Temp.",
    network: "Sieć",
    storage: "Miejsce",
    volumes: "Woluminy",
    disks: "Dyski",
    fans: "Wentylatory",
    uptime: "Czas działania:",
    download: "Pobieranie",
    upload: "Wysyłanie",
    used: "zajęte",
    of: "z",
    hours: "h",
    days: "d",
    minutes: "min",
    no_nas: "Nie znaleziono encji NAS. Czy zainstalowano obsługiwaną integrację (UGREEN NAS, Synology DSM lub QNAP)?",
    unknown_nas: "Nie znaleziono NAS",
    status_ok: "Normalny",
    status_problem: "Ostrzeżenie",
    unavailable: "Niedostępny",
    unknown: "Nieznany",
    cpu_fan: "Wentylator CPU",
    device_fan: "Wentylator",
    zoom_in: "Pokaż pełną kartę",
    zoom_out: "Wróć do widoku kompaktowego",
    nas: "NAS (urządzenie UGREEN, Synology DSM lub QNAP)",
    title: "Tytuł (opcjonalny, domyślnie nazwa NAS)",
    show_image: "Pokaż obraz NAS",
    image: "Obraz NAS (model lub URL obrazu)",
    image_helper: "Automatycznie według modelu zgłaszanego przez integrację",
    image_auto: "Automatycznie",
    show_system: "Pokaż system (CPU, RAM, temperatura)",
    show_network: "Pokaż sieć",
    show_volumes: "Pokaż woluminy",
    show_disks: "Pokaż dyski",
    show_fans: "Pokaż wentylatory",
    show_history: "Pokaż historię przepustowości z 24 h",
    show_storage: "Pokaż pamięć masową",
    zoom: "Przycisk powiększenia",
    zoom_helper: "Przełącza minikartę na pełną kartę i z powrotem",
    url: "URL interfejsu NAS (kliknięcie obrazu NAS)",
    url_helper: "Jeśli puste, automatycznie z Home Assistant (UGREEN, Synology); dla QNAP wpisz go, np. http://192.168.1.10:8080",
    brand_url: "URL strony marki (kliknięcie logo)",
    brand_url_helper: "Jeśli puste, oficjalna strona marki",
    open_nas: "Otwórz interfejs NAS",
    open_brand: "Otwórz stronę {brand}",
    language: "Język",
    lang_auto: "Automatycznie",
  },
  ro: {
    cpu: "CPU",
    ram: "RAM",
    temperature: "Temp.",
    network: "Rețea",
    storage: "Stocare",
    volumes: "Volume",
    disks: "Discuri",
    fans: "Ventilatoare",
    uptime: "Timp de funcționare:",
    download: "Descărcare",
    upload: "Încărcare",
    used: "utilizați",
    of: "din",
    hours: "h",
    days: "z",
    minutes: "min",
    no_nas: "Nu s-au găsit entități NAS. Este instalată o integrare compatibilă (UGREEN NAS, Synology DSM sau QNAP)?",
    unknown_nas: "NAS negăsit",
    status_ok: "Normal",
    status_problem: "Avertisment",
    unavailable: "Indisponibil",
    unknown: "Necunoscut",
    cpu_fan: "Ventilator CPU",
    device_fan: "Ventilator",
    zoom_in: "Afișează cardul complet",
    zoom_out: "Înapoi la vizualizarea compactă",
    nas: "NAS (dispozitiv UGREEN, Synology DSM sau QNAP)",
    title: "Titlu (opțional, implicit numele NAS-ului)",
    show_image: "Afișează imaginea NAS-ului",
    image: "Imaginea NAS-ului (model sau URL de imagine)",
    image_helper: "Automată după modelul raportat de integrare",
    image_auto: "Automată",
    show_system: "Afișează sistemul (CPU, RAM, temperatură)",
    show_network: "Afișează rețeaua",
    show_volumes: "Afișează volumele",
    show_disks: "Afișează discurile",
    show_fans: "Afișează ventilatoarele",
    show_history: "Afișează istoricul vitezelor pe 24 h",
    show_storage: "Afișează stocarea",
    zoom: "Buton de zoom",
    zoom_helper: "Comută minicardul la cardul complet și înapoi",
    url: "URL-ul interfeței NAS (clic pe imaginea NAS-ului)",
    url_helper: "Dacă este gol, automat din Home Assistant (UGREEN, Synology); completați-l pentru QNAP, de ex. http://192.168.1.10:8080",
    brand_url: "URL-ul site-ului mărcii (clic pe logo)",
    brand_url_helper: "Dacă este gol, site-ul oficial al mărcii",
    open_nas: "Deschide interfața NAS",
    open_brand: "Deschide site-ul {brand}",
    language: "Limbă",
    lang_auto: "Automată",
  },
  da: {
    cpu: "CPU",
    ram: "RAM",
    temperature: "Temp.",
    network: "Netværk",
    storage: "Lager",
    volumes: "Volumener",
    disks: "Diske",
    fans: "Blæsere",
    uptime: "Oppetid:",
    download: "Download",
    upload: "Upload",
    used: "brugt",
    of: "af",
    hours: "t",
    days: "d",
    minutes: "min",
    no_nas: "Ingen NAS-enheder fundet. Er en understøttet integration (UGREEN NAS, Synology DSM eller QNAP) installeret?",
    unknown_nas: "NAS ikke fundet",
    status_ok: "Normal",
    status_problem: "Advarsel",
    unavailable: "Utilgængelig",
    unknown: "Ukendt",
    cpu_fan: "CPU-blæser",
    device_fan: "Blæser",
    zoom_in: "Vis hele kortet",
    zoom_out: "Tilbage til kompakt visning",
    nas: "NAS (UGREEN-, Synology DSM- eller QNAP-enhed)",
    title: "Titel (valgfri, som standard NAS'ens navn)",
    show_image: "Vis billede af NAS'en",
    image: "Billede af NAS'en (model eller billed-URL)",
    image_helper: "Automatisk ud fra den model, integrationen rapporterer",
    image_auto: "Automatisk",
    show_system: "Vis system (CPU, RAM, temperatur)",
    show_network: "Vis netværk",
    show_volumes: "Vis volumener",
    show_disks: "Vis diske",
    show_fans: "Vis blæsere",
    show_history: "Vis 24-timers historik for hastigheder",
    show_storage: "Vis lager",
    zoom: "Zoomknap",
    zoom_helper: "Skifter fra minikortet til det fulde kort og tilbage",
    url: "URL til NAS-brugerfladen (klik på billedet af NAS'en)",
    url_helper: "Automatisk fra Home Assistant, hvis tom (UGREEN, Synology); angiv den for QNAP, f.eks. http://192.168.1.10:8080",
    brand_url: "URL til mærkets websted (klik på logoet)",
    brand_url_helper: "Mærkets officielle websted, hvis tom",
    open_nas: "Åbn NAS-brugerfladen",
    open_brand: "Åbn webstedet for {brand}",
    language: "Sprog",
    lang_auto: "Automatisk",
  },
  sv: {
    cpu: "CPU",
    ram: "RAM",
    temperature: "Temp.",
    network: "Nätverk",
    storage: "Lagring",
    volumes: "Volymer",
    disks: "Diskar",
    fans: "Fläktar",
    uptime: "Drifttid:",
    download: "Nedladdning",
    upload: "Uppladdning",
    used: "använt",
    of: "av",
    hours: "h",
    days: "d",
    minutes: "min",
    no_nas: "Inga NAS-entiteter hittades. Är en integration som stöds (UGREEN NAS, Synology DSM eller QNAP) installerad?",
    unknown_nas: "NAS hittades inte",
    status_ok: "Normal",
    status_problem: "Varning",
    unavailable: "Ej tillgänglig",
    unknown: "Okänd",
    cpu_fan: "CPU-fläkt",
    device_fan: "Fläkt",
    zoom_in: "Visa hela kortet",
    zoom_out: "Tillbaka till kompakt vy",
    nas: "NAS (UGREEN-, Synology DSM- eller QNAP-enhet)",
    title: "Titel (valfri, NAS-enhetens namn som standard)",
    show_image: "Visa bild av NAS-enheten",
    image: "Bild av NAS-enheten (modell eller bild-URL)",
    image_helper: "Automatiskt utifrån modellen som integrationen rapporterar",
    image_auto: "Automatisk",
    show_system: "Visa system (CPU, RAM, temperatur)",
    show_network: "Visa nätverk",
    show_volumes: "Visa volymer",
    show_disks: "Visa diskar",
    show_fans: "Visa fläktar",
    show_history: "Visa 24 h-historik för hastigheter",
    show_storage: "Visa lagring",
    zoom: "Zoomknapp",
    zoom_helper: "Växlar minikortet till hela kortet och tillbaka",
    url: "URL till NAS-gränssnittet (klick på bilden av NAS-enheten)",
    url_helper: "Automatiskt från Home Assistant om tom (UGREEN, Synology); ange den för QNAP, t.ex. http://192.168.1.10:8080",
    brand_url: "URL till märkets webbplats (klick på logotypen)",
    brand_url_helper: "Märkets officiella webbplats om tom",
    open_nas: "Öppna NAS-gränssnittet",
    open_brand: "Öppna webbplatsen för {brand}",
    language: "Språk",
    lang_auto: "Automatiskt",
  },
  bg: {
    cpu: "CPU",
    ram: "RAM",
    temperature: "Темп.",
    network: "Мрежа",
    storage: "Хранилище",
    volumes: "Томове",
    disks: "Дискове",
    fans: "Вентилатори",
    uptime: "Време на работа:",
    download: "Изтегляне",
    upload: "Качване",
    used: "използвани",
    of: "от",
    hours: "ч",
    days: "д",
    minutes: "мин",
    no_nas: "Не са намерени NAS обекти. Инсталирана ли е поддържана интеграция (UGREEN NAS, Synology DSM или QNAP)?",
    unknown_nas: "NAS не е намерен",
    status_ok: "Нормално",
    status_problem: "Предупреждение",
    unavailable: "Недостъпно",
    unknown: "Неизвестно",
    cpu_fan: "Вентилатор CPU",
    device_fan: "Вентилатор",
    zoom_in: "Покажи пълната карта",
    zoom_out: "Обратно към компактния изглед",
    nas: "NAS (устройство UGREEN, Synology DSM или QNAP)",
    title: "Заглавие (по избор, по подразбиране името на NAS)",
    show_image: "Показване на изображение на NAS",
    image: "Изображение на NAS (модел или URL на изображение)",
    image_helper: "Автоматично според модела, отчетен от интеграцията",
    image_auto: "Автоматично",
    show_system: "Показване на системата (CPU, RAM, температура)",
    show_network: "Показване на мрежата",
    show_volumes: "Показване на томовете",
    show_disks: "Показване на дисковете",
    show_fans: "Показване на вентилаторите",
    show_history: "Показване на 24-часовата история на скоростите",
    show_storage: "Показване на хранилището",
    zoom: "Бутон за мащабиране",
    zoom_helper: "Превключва от мини картата към пълната карта и обратно",
    url: "URL на интерфейса на NAS (щракване върху изображението на NAS)",
    url_helper: "Ако е празно, автоматично от Home Assistant (UGREEN, Synology); за QNAP го въведете, напр. http://192.168.1.10:8080",
    brand_url: "URL на уебсайта на марката (щракване върху логото)",
    brand_url_helper: "Ако е празно, официалният уебсайт на марката",
    open_nas: "Отвори интерфейса на NAS",
    open_brand: "Отвори уебсайта на {brand}",
    language: "Език",
    lang_auto: "Автоматично",
  },
  ru: {
    cpu: "CPU",
    ram: "RAM",
    temperature: "Темп.",
    network: "Сеть",
    storage: "Хранилище",
    volumes: "Тома",
    disks: "Диски",
    fans: "Вентиляторы",
    uptime: "Время работы:",
    download: "Приём",
    upload: "Передача",
    used: "занято",
    of: "из",
    hours: "ч",
    days: "д",
    minutes: "мин",
    no_nas: "Объекты NAS не найдены. Установлена ли поддерживаемая интеграция (UGREEN NAS, Synology DSM или QNAP)?",
    unknown_nas: "NAS не найден",
    status_ok: "Норма",
    status_problem: "Предупреждение",
    unavailable: "Недоступно",
    unknown: "Неизвестно",
    cpu_fan: "Вентилятор CPU",
    device_fan: "Вентилятор",
    zoom_in: "Показать полную карточку",
    zoom_out: "Вернуться к компактному виду",
    nas: "NAS (устройство UGREEN, Synology DSM или QNAP)",
    title: "Заголовок (необязательно, по умолчанию имя NAS)",
    show_image: "Показывать изображение NAS",
    image: "Изображение NAS (модель или URL изображения)",
    image_helper: "Автоматически по модели, сообщаемой интеграцией",
    image_auto: "Автоматически",
    show_system: "Показывать систему (CPU, RAM, температура)",
    show_network: "Показывать сеть",
    show_volumes: "Показывать тома",
    show_disks: "Показывать диски",
    show_fans: "Показывать вентиляторы",
    show_history: "Показать историю скоростей за 24 ч",
    show_storage: "Показывать хранилище",
    zoom: "Кнопка масштаба",
    zoom_helper: "Переключает мини-карточку на полную и обратно",
    url: "URL интерфейса NAS (нажатие на изображение NAS)",
    url_helper: "Если пусто, автоматически из Home Assistant (UGREEN, Synology); для QNAP укажите его, например http://192.168.1.10:8080",
    brand_url: "URL сайта производителя (нажатие на логотип)",
    brand_url_helper: "Если пусто, официальный сайт производителя",
    open_nas: "Открыть интерфейс NAS",
    open_brand: "Открыть сайт {brand}",
    language: "Язык",
    lang_auto: "Автоматически",
  },
  uk: {
    cpu: "CPU",
    ram: "RAM",
    temperature: "Темп.",
    network: "Мережа",
    storage: "Сховище",
    volumes: "Томи",
    disks: "Диски",
    fans: "Вентилятори",
    uptime: "Час роботи:",
    download: "Отримання",
    upload: "Надсилання",
    used: "зайнято",
    of: "з",
    hours: "год",
    days: "д",
    minutes: "хв",
    no_nas: "Об'єкти NAS не знайдено. Чи встановлено підтримувану інтеграцію (UGREEN NAS, Synology DSM або QNAP)?",
    unknown_nas: "NAS не знайдено",
    status_ok: "Норма",
    status_problem: "Попередження",
    unavailable: "Недоступно",
    unknown: "Невідомо",
    cpu_fan: "Вентилятор CPU",
    device_fan: "Вентилятор",
    zoom_in: "Показати повну картку",
    zoom_out: "Повернутися до компактного вигляду",
    nas: "NAS (пристрій UGREEN, Synology DSM або QNAP)",
    title: "Заголовок (необов'язково, за замовчуванням назва NAS)",
    show_image: "Показувати зображення NAS",
    image: "Зображення NAS (модель або URL зображення)",
    image_helper: "Автоматично за моделлю, яку повідомляє інтеграція",
    image_auto: "Автоматично",
    show_system: "Показувати систему (CPU, RAM, температура)",
    show_network: "Показувати мережу",
    show_volumes: "Показувати томи",
    show_disks: "Показувати диски",
    show_fans: "Показувати вентилятори",
    show_history: "Показати історію швидкостей за 24 год",
    show_storage: "Показувати сховище",
    zoom: "Кнопка масштабу",
    zoom_helper: "Перемикає міні-картку на повну картку й назад",
    url: "URL інтерфейсу NAS (натискання на зображення NAS)",
    url_helper: "Якщо порожньо, автоматично з Home Assistant (UGREEN, Synology); для QNAP вкажіть його, наприклад http://192.168.1.10:8080",
    brand_url: "URL сайту виробника (натискання на логотип)",
    brand_url_helper: "Якщо порожньо, офіційний сайт виробника",
    open_nas: "Відкрити інтерфейс NAS",
    open_brand: "Відкрити сайт {brand}",
    language: "Мова",
    lang_auto: "Автоматично",
  },
  hu: {
    cpu: "CPU",
    ram: "RAM",
    temperature: "Hőm.",
    network: "Hálózat",
    storage: "Tárhely",
    volumes: "Kötetek",
    disks: "Lemezek",
    fans: "Ventilátorok",
    uptime: "Üzemidő:",
    download: "Letöltés",
    upload: "Feltöltés",
    used: "foglalt",
    of: "/",
    hours: "ó",
    days: "n",
    minutes: "p",
    no_nas: "Nem található NAS-entitás. Telepítve van egy támogatott integráció (UGREEN NAS, Synology DSM vagy QNAP)?",
    unknown_nas: "A NAS nem található",
    status_ok: "Normál",
    status_problem: "Figyelmeztetés",
    unavailable: "Nem elérhető",
    unknown: "Ismeretlen",
    cpu_fan: "CPU-ventilátor",
    device_fan: "Ventilátor",
    zoom_in: "Teljes kártya megjelenítése",
    zoom_out: "Vissza a kompakt nézethez",
    nas: "NAS (UGREEN, Synology DSM vagy QNAP eszköz)",
    title: "Cím (nem kötelező, alapértelmezés szerint a NAS neve)",
    show_image: "NAS képének megjelenítése",
    image: "NAS képe (modell vagy kép URL-je)",
    image_helper: "Automatikus az integráció által jelentett modell alapján",
    image_auto: "Automatikus",
    show_system: "Rendszer megjelenítése (CPU, RAM, hőmérséklet)",
    show_network: "Hálózat megjelenítése",
    show_volumes: "Kötetek megjelenítése",
    show_disks: "Lemezek megjelenítése",
    show_fans: "Ventilátorok megjelenítése",
    show_history: "Sebességek 24 órás előzményeinek megjelenítése",
    show_storage: "Tárhely megjelenítése",
    zoom: "Nagyítás gomb",
    zoom_helper: "A mini kártyáról a teljes kártyára vált és vissza",
    url: "A NAS felületének URL-je (kattintás a NAS képére)",
    url_helper: "Ha üres, automatikusan a Home Assistantből (UGREEN, Synology); QNAP esetén adja meg, pl. http://192.168.1.10:8080",
    brand_url: "A márka webhelyének URL-je (kattintás a logóra)",
    brand_url_helper: "Ha üres, a márka hivatalos webhelye",
    open_nas: "A NAS felületének megnyitása",
    open_brand: "A(z) {brand} webhelyének megnyitása",
    language: "Nyelv",
    lang_auto: "Automatikus",
  },
  sk: {
    cpu: "CPU",
    ram: "RAM",
    temperature: "Tepl.",
    network: "Sieť",
    storage: "Úložisko",
    volumes: "Zväzky",
    disks: "Disky",
    fans: "Ventilátory",
    uptime: "Doba prevádzky:",
    download: "Sťahovanie",
    upload: "Odosielanie",
    used: "využité",
    of: "z",
    hours: "h",
    days: "d",
    minutes: "min",
    no_nas: "Nenašli sa žiadne entity NAS. Je nainštalovaná podporovaná integrácia (UGREEN NAS, Synology DSM alebo QNAP)?",
    unknown_nas: "NAS sa nenašiel",
    status_ok: "Normálny",
    status_problem: "Upozornenie",
    unavailable: "Nedostupné",
    unknown: "Neznáme",
    cpu_fan: "Ventilátor CPU",
    device_fan: "Ventilátor",
    zoom_in: "Zobraziť celú kartu",
    zoom_out: "Späť na kompaktné zobrazenie",
    nas: "NAS (zariadenie UGREEN, Synology DSM alebo QNAP)",
    title: "Názov (voliteľný, predvolene názov NAS)",
    show_image: "Zobraziť obrázok NAS",
    image: "Obrázok NAS (model alebo URL obrázka)",
    image_helper: "Automaticky podľa modelu hláseného integráciou",
    image_auto: "Automaticky",
    show_system: "Zobraziť systém (CPU, RAM, teplota)",
    show_network: "Zobraziť sieť",
    show_volumes: "Zobraziť zväzky",
    show_disks: "Zobraziť disky",
    show_fans: "Zobraziť ventilátory",
    show_history: "Zobraziť 24 h históriu rýchlostí",
    show_storage: "Zobraziť úložisko",
    zoom: "Tlačidlo priblíženia",
    zoom_helper: "Prepína minikartu na celú kartu a späť",
    url: "URL rozhrania NAS (kliknutie na obrázok NAS)",
    url_helper: "Ak je prázdne, automaticky z Home Assistant (UGREEN, Synology); pre QNAP ho zadajte, napr. http://192.168.1.10:8080",
    brand_url: "URL webovej stránky značky (kliknutie na logo)",
    brand_url_helper: "Ak je prázdne, oficiálna webová stránka značky",
    open_nas: "Otvoriť rozhranie NAS",
    open_brand: "Otvoriť webovú stránku {brand}",
    language: "Jazyk",
    lang_auto: "Automaticky",
  },
  cs: {
    cpu: "CPU",
    ram: "RAM",
    temperature: "Tepl.",
    network: "Síť",
    storage: "Úložiště",
    volumes: "Svazky",
    disks: "Disky",
    fans: "Ventilátory",
    uptime: "Doba provozu:",
    download: "Stahování",
    upload: "Odesílání",
    used: "využito",
    of: "z",
    hours: "h",
    days: "d",
    minutes: "min",
    no_nas: "Nebyly nalezeny žádné entity NAS. Je nainstalována podporovaná integrace (UGREEN NAS, Synology DSM nebo QNAP)?",
    unknown_nas: "NAS nenalezen",
    status_ok: "Normální",
    status_problem: "Varování",
    unavailable: "Nedostupné",
    unknown: "Neznámé",
    cpu_fan: "Ventilátor CPU",
    device_fan: "Ventilátor",
    zoom_in: "Zobrazit celou kartu",
    zoom_out: "Zpět na kompaktní zobrazení",
    nas: "NAS (zařízení UGREEN, Synology DSM nebo QNAP)",
    title: "Název (volitelný, výchozí je název NAS)",
    show_image: "Zobrazit obrázek NAS",
    image: "Obrázek NAS (model nebo URL obrázku)",
    image_helper: "Automaticky podle modelu hlášeného integrací",
    image_auto: "Automaticky",
    show_system: "Zobrazit systém (CPU, RAM, teplota)",
    show_network: "Zobrazit síť",
    show_volumes: "Zobrazit svazky",
    show_disks: "Zobrazit disky",
    show_fans: "Zobrazit ventilátory",
    show_history: "Zobrazit 24h historii rychlostí",
    show_storage: "Zobrazit úložiště",
    zoom: "Tlačítko přiblížení",
    zoom_helper: "Přepíná minikartu na celou kartu a zpět",
    url: "URL rozhraní NAS (kliknutí na obrázek NAS)",
    url_helper: "Pokud je prázdné, automaticky z Home Assistant (UGREEN, Synology); pro QNAP ho zadejte, např. http://192.168.1.10:8080",
    brand_url: "URL webu značky (kliknutí na logo)",
    brand_url_helper: "Pokud je prázdné, oficiální web značky",
    open_nas: "Otevřít rozhraní NAS",
    open_brand: "Otevřít web {brand}",
    language: "Jazyk",
    lang_auto: "Automaticky",
  },
  sl: {
    cpu: "CPU",
    ram: "RAM",
    temperature: "Temp.",
    network: "Omrežje",
    storage: "Shramba",
    volumes: "Nosilci",
    disks: "Diski",
    fans: "Ventilatorji",
    uptime: "Čas delovanja:",
    download: "Prejemanje",
    upload: "Pošiljanje",
    used: "porabljeno",
    of: "od",
    hours: "h",
    days: "d",
    minutes: "min",
    no_nas: "Ni najdenih entitet NAS. Ali je nameščena podprta integracija (UGREEN NAS, Synology DSM ali QNAP)?",
    unknown_nas: "NAS ni najden",
    status_ok: "Normalno",
    status_problem: "Opozorilo",
    unavailable: "Ni na voljo",
    unknown: "Neznano",
    cpu_fan: "Ventilator CPU",
    device_fan: "Ventilator",
    zoom_in: "Prikaži celotno kartico",
    zoom_out: "Nazaj na strnjeni pogled",
    nas: "NAS (naprava UGREEN, Synology DSM ali QNAP)",
    title: "Naslov (neobvezno, privzeto ime NAS)",
    show_image: "Prikaži sliko NAS",
    image: "Slika NAS (model ali URL slike)",
    image_helper: "Samodejno glede na model, ki ga sporoča integracija",
    image_auto: "Samodejno",
    show_system: "Prikaži sistem (CPU, RAM, temperatura)",
    show_network: "Prikaži omrežje",
    show_volumes: "Prikaži nosilce",
    show_disks: "Prikaži diske",
    show_fans: "Prikaži ventilatorje",
    show_history: "Prikaži 24-urno zgodovino hitrosti",
    show_storage: "Prikaži shrambo",
    zoom: "Gumb za povečavo",
    zoom_helper: "Preklopi mini kartico na celotno kartico in nazaj",
    url: "URL vmesnika NAS (klik na sliko NAS)",
    url_helper: "Če je prazno, samodejno iz Home Assistanta (UGREEN, Synology); za QNAP ga vnesite, npr. http://192.168.1.10:8080",
    brand_url: "URL spletnega mesta znamke (klik na logotip)",
    brand_url_helper: "Če je prazno, uradno spletno mesto znamke",
    open_nas: "Odpri vmesnik NAS",
    open_brand: "Odpri spletno mesto {brand}",
    language: "Jezik",
    lang_auto: "Samodejno",
  },
  lv: {
    cpu: "CPU",
    ram: "RAM",
    temperature: "Temp.",
    network: "Tīkls",
    storage: "Krātuve",
    volumes: "Sējumi",
    disks: "Diski",
    fans: "Ventilatori",
    uptime: "Darbības laiks:",
    download: "Lejupielāde",
    upload: "Augšupielāde",
    used: "izmantoti",
    of: "no",
    hours: "h",
    days: "d",
    minutes: "min",
    no_nas: "Netika atrastas NAS entītijas. Vai ir instalēta atbalstīta integrācija (UGREEN NAS, Synology DSM vai QNAP)?",
    unknown_nas: "NAS nav atrasts",
    status_ok: "Normāls",
    status_problem: "Brīdinājums",
    unavailable: "Nepieejams",
    unknown: "Nezināms",
    cpu_fan: "CPU ventilators",
    device_fan: "Ventilators",
    zoom_in: "Rādīt pilno karti",
    zoom_out: "Atpakaļ uz kompakto skatu",
    nas: "NAS (UGREEN, Synology DSM vai QNAP ierīce)",
    title: "Nosaukums (neobligāts, pēc noklusējuma NAS nosaukums)",
    show_image: "Rādīt NAS attēlu",
    image: "NAS attēls (modelis vai attēla URL)",
    image_helper: "Automātiski pēc integrācijas paziņotā modeļa",
    image_auto: "Automātiski",
    show_system: "Rādīt sistēmu (CPU, RAM, temperatūra)",
    show_network: "Rādīt tīklu",
    show_volumes: "Rādīt sējumus",
    show_disks: "Rādīt diskus",
    show_fans: "Rādīt ventilatorus",
    show_history: "Rādīt ātrumu 24 h vēsturi",
    show_storage: "Rādīt krātuvi",
    zoom: "Tālummaiņas poga",
    zoom_helper: "Pārslēdz mini karti uz pilno karti un atpakaļ",
    url: "NAS saskarnes URL (klikšķis uz NAS attēla)",
    url_helper: "Ja tukšs, automātiski no Home Assistant (UGREEN, Synology); QNAP gadījumā norādiet to, piem., http://192.168.1.10:8080",
    brand_url: "Zīmola tīmekļa vietnes URL (klikšķis uz logotipa)",
    brand_url_helper: "Ja tukšs, zīmola oficiālā tīmekļa vietne",
    open_nas: "Atvērt NAS saskarni",
    open_brand: "Atvērt {brand} tīmekļa vietni",
    language: "Valoda",
    lang_auto: "Automātiski",
  },
  el: {
    cpu: "CPU",
    ram: "RAM",
    temperature: "Θερμ.",
    network: "Δίκτυο",
    storage: "Χώρος",
    volumes: "Τόμοι",
    disks: "Δίσκοι",
    fans: "Ανεμιστήρες",
    uptime: "Χρόνος λειτουργίας:",
    download: "Λήψη",
    upload: "Αποστολή",
    used: "σε χρήση",
    of: "από",
    hours: "ώρ.",
    days: "ημ.",
    minutes: "λεπ.",
    no_nas: "Δεν βρέθηκαν οντότητες NAS. Είναι εγκατεστημένη μια υποστηριζόμενη ενσωμάτωση (UGREEN NAS, Synology DSM ή QNAP);",
    unknown_nas: "Το NAS δεν βρέθηκε",
    status_ok: "Κανονικό",
    status_problem: "Προειδοποίηση",
    unavailable: "Μη διαθέσιμο",
    unknown: "Άγνωστο",
    cpu_fan: "Ανεμιστήρας CPU",
    device_fan: "Ανεμιστήρας",
    zoom_in: "Εμφάνιση της πλήρους κάρτας",
    zoom_out: "Επιστροφή στη συμπαγή προβολή",
    nas: "NAS (συσκευή UGREEN, Synology DSM ή QNAP)",
    title: "Τίτλος (προαιρετικός, από προεπιλογή το όνομα του NAS)",
    show_image: "Εμφάνιση εικόνας του NAS",
    image: "Εικόνα του NAS (μοντέλο ή URL εικόνας)",
    image_helper: "Αυτόματα βάσει του μοντέλου που αναφέρει η ενσωμάτωση",
    image_auto: "Αυτόματα",
    show_system: "Εμφάνιση συστήματος (CPU, RAM, θερμοκρασία)",
    show_network: "Εμφάνιση δικτύου",
    show_volumes: "Εμφάνιση τόμων",
    show_disks: "Εμφάνιση δίσκων",
    show_fans: "Εμφάνιση ανεμιστήρων",
    show_history: "Εμφάνιση ιστορικού ταχυτήτων 24 ωρών",
    show_storage: "Εμφάνιση χώρου αποθήκευσης",
    zoom: "Κουμπί μεγέθυνσης",
    zoom_helper: "Εναλλάσσει τη μίνι κάρτα στην πλήρη κάρτα και αντίστροφα",
    url: "URL της διεπαφής του NAS (κλικ στην εικόνα του NAS)",
    url_helper: "Αν είναι κενό, αυτόματα από το Home Assistant (UGREEN, Synology)· για το QNAP συμπληρώστε το, π.χ. http://192.168.1.10:8080",
    brand_url: "URL του ιστότοπου της μάρκας (κλικ στο λογότυπο)",
    brand_url_helper: "Αν είναι κενό, ο επίσημος ιστότοπος της μάρκας",
    open_nas: "Άνοιγμα της διεπαφής του NAS",
    open_brand: "Άνοιγμα του ιστότοπου της {brand}",
    language: "Γλώσσα",
    lang_auto: "Αυτόματα",
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const esc = (v) =>
  String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

const lang = (hass, config) => {
  const l = (config?.language) || (hass && (hass.locale?.language || hass.language)) || "en";
  return STRINGS[l] ? l : STRINGS[l.split("-")[0]] ? l.split("-")[0] : "en";
};

// Locale for Intl/toLocale*: Home Assistant's full locale when its base matches the card's resolved language
// (keeps the region, e.g. pt-BR or de-CH), otherwise the resolved language. Home Assistant's "pt" is European
// Portuguese, which Intl would format as Brazilian, so bare "pt" becomes "pt-PT". sr-Latn stays as resolved.
const fmtLang = (hass, config) => {
  const l = lang(hass, config);
  const ha = hass && (hass.locale?.language || hass.language);
  const loc = ha && ha.split("-")[0] === l ? ha : l;
  return loc === "pt" ? "pt-PT" : loc;
};

const t = (hass, config, key) => STRINGS[lang(hass, config)][key] ?? STRINGS.en[key] ?? key;

const num = (s) => {
  if (!s) return null;
  const v = parseFloat(s.state);
  return Number.isFinite(v) ? v : null;
};

// Data sizes follow Home Assistant's UnitOfInformation: kB/MB/GB/TB/PB are decimal (powers of 1000) and
// KiB/MiB/GiB/TiB/PiB binary (powers of 1024), as the frontend converts them. Displayed sizes use decimal units,
// so a sensor reported in GB or TB reads the same on the card as in Home Assistant.
const UNIT_FACTORS = {
  b: 1, kb: 1e3, mb: 1e6, gb: 1e9, tb: 1e12, pb: 1e15,
  kib: 1024, mib: 1024 ** 2, gib: 1024 ** 3, tib: 1024 ** 4, pib: 1024 ** 5,
};

const toBytes = (s) => {
  const v = num(s);
  if (v === null) return null;
  const unit = String(s.attributes?.unit_of_measurement || "B").toLowerCase();
  return v * (UNIT_FACTORS[unit] ?? 1);
};

const fmtBytes = (b) => {
  if (b === null || b === undefined) return "—";
  const units = ["B", "kB", "MB", "GB", "TB", "PB"];
  let i = 0;
  while (b >= 1000 && i < units.length - 1) {
    b /= 1000;
    i++;
  }
  const v = b >= 100 || i === 0 ? b.toFixed(0) : b.toFixed(b >= 10 ? 1 : 2);
  return `${v.includes(".") ? v.replace(/\.?0+$/, "") : v} ${units[i]}`;
};

// "used / total" for the RAM gauge: the used figure drops its unit only when both share it
// ("1.5 / 2 GB", but "800 MB / 2 GB").
const ramPair = (used, total) => {
  const u = fmtBytes(used);
  const tot = fmtBytes(total);
  const [uv, uu] = u.split(" ");
  return uu === tot.split(" ")[1] ? `${uv} / ${tot}` : `${u} / ${tot}`;
};

// Rate in B/s from a sensor, whatever unit it is displayed in (the integration reports B/s, but the
// unit can be changed in Home Assistant).
const RATE_FACTORS = {
  "b/s": 1, "bit/s": 1 / 8, "kbit/s": 125, "mbit/s": 125e3, "gbit/s": 125e6,
  "kb/s": 1e3, "mb/s": 1e6, "gb/s": 1e9, "kib/s": 1024, "mib/s": 1024 ** 2, "gib/s": 1024 ** 3,
};

const toBps = (s) => {
  const v = num(s);
  if (v === null) return null;
  const unit = String(s.attributes?.unit_of_measurement || "B/s").toLowerCase();
  return v * (RATE_FACTORS[unit] ?? 1);
};

const fmtRate = (bps) => {
  if (bps === null || bps === undefined) return "—";
  const units = ["B/s", "kB/s", "MB/s", "GB/s"];
  let i = 0;
  while (bps >= 1000 && i < units.length - 1) {
    bps /= 1000;
    i++;
  }
  return `${bps >= 100 || i === 0 ? bps.toFixed(0) : bps.toFixed(1)} ${units[i]}`;
};

const fmtUptime = (sec, hass, config) => {
  if (sec === null) return "—";
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (d > 0) return `${d} ${t(hass, config, "days")} ${h} ${t(hass, config, "hours")}`;
  if (h > 0) return `${h} ${t(hass, config, "hours")} ${m} ${t(hass, config, "minutes")}`;
  return `${m} ${t(hass, config, "minutes")}`;
};

// Age in seconds of a boot timestamp sensor (Synology "Last boot", QNAP "Uptime").
const bootAge = (s) => {
  const ts = s && Date.parse(s.state);
  return Number.isFinite(ts) ? Math.max(0, Math.round((Date.now() - ts) / 1000)) : null;
};

// OS line of the subtitle: UGOS comes from its own sensor, the Synology firmware string already
// spells out DSM, and QNAP firmware starts with "h" on QuTS hero.
const osVersion = (v, brand) => (!v ? null : brand === "qnap" ? `${/^h/i.test(v) ? "QuTS hero" : "QTS"} ${v}` : v);

const isOk = (s) => !s || /^(normal|ok|good|healthy|on|false)$/i.test(String(s.state));

// Server status: UGREEN and QNAP report a word, Synology a safety binary sensor (on = issue found).
// An entity without value (NAS offline) is never "ok", whatever the brand.
const statusOk = (nas, s) => (s && NO_VALUE.has(s.state) ? false : nas.brand === "synology" && s ? String(s.state) === "off" : isOk(s));

const level = (v, warn, crit) => (v === null ? "" : v >= crit ? "crit" : v >= warn ? "warn" : "ok");

// Temperature of a sensor: Home Assistant converts temperature sensors to the unit of its unit system (or the
// one picked for the sensor), so the value is shown in its own unit (`unit_of_measurement`, else Home
// Assistant's temperature unit, else °C) and converted to °C for the thresholds and the gauges.
const temperature = (s, hass) => {
  const v = num(s);
  if (v === null) return { c: null, text: "—" };
  const unit = String(s.attributes?.unit_of_measurement || hass?.config?.unit_system?.temperature || "°C");
  const c = /^°?F$/i.test(unit) ? ((v - 32) * 5) / 9 : unit === "K" ? v - 273.15 : v;
  return { c, text: `${Math.round(v)}${unit.startsWith("°") ? "" : " "}${esc(unit)}` };
};

// Class of a status dot: no value (unavailable / unknown) is neither healthy nor a problem.
const dotClass = (s) => (s && NO_VALUE.has(s.state) ? "na" : isOk(s) ? "ok" : "crit");

const svgIcon = (path, cls = "") => `<svg class="icon ${cls}" viewBox="0 0 24 24"><path d="${path}"/></svg>`;

// NAS pictures: drawn illustrations, one per brand and form factor, picked from the model reported
// by the integration. Tower: control strip on the left + one tray per bay; each brand keeps its own
// colors (DXP aluminium, DH white, Synology black, QNAP graphite with a copper strip).
const PALETTES = {
  dxp: { top: "#c9ccd0", bottom: "#7d8288", front: "#2a2d31", tray: "#3a3e44", handle: "#4c5158", mark: "#c9ccd0" },
  dh: { top: "#f2f2f0", bottom: "#d9d9d6", front: "#e6e6e3", tray: "#d0d0cc", handle: "#b5b5b0", mark: "#888" },
  synology: { top: "#45484c", bottom: "#17181a", front: "#101113", tray: "#1e2023", handle: "#34373b", mark: "#6b6f74" },
  qnap: { top: "#3c3f44", bottom: "#1c1e21", front: "#17181b", tray: "#24262a", handle: "#3a3d42", mark: "#8d9196", accent: "#c8a46a" },
};
const towerSvg = (bays, p) => {
  const tw = 34, gap = 6, strip = 46, pad = 14, h = 150;
  const w = pad + strip + bays * tw + (bays - 1) * gap + pad;
  const { top, bottom, front, tray, handle, mark, accent } = p;
  const c = pad + strip / 2 - 2;
  let trays = "";
  for (let i = 0; i < bays; i++) {
    const x = pad + strip + i * (tw + gap);
    trays += `<rect x="${x}" y="22" width="${tw}" height="${h - 44}" rx="3" fill="${tray}"/><rect x="${x + tw / 2 - 5}" y="${h - 46}" width="10" height="16" rx="2" fill="${handle}"/><circle cx="${x + tw / 2}" cy="32" r="1.6" fill="#43c463"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h + 8}"><defs><linearGradient id="b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient></defs><ellipse cx="${w / 2}" cy="${h + 3}" rx="${w / 2 - 6}" ry="4" opacity=".25"/><rect width="${w}" height="${h}" rx="12" fill="url(#b)"/><rect x="8" y="10" width="${w - 16}" height="${h - 20}" rx="7" fill="${front}"/>${
    accent ? `<rect x="${pad - 3}" y="16" width="3.5" height="${h - 32}" rx="1.75" fill="${accent}"/>` : ""
  }<circle cx="${c}" cy="34" r="7" fill="none" stroke="${mark}" stroke-width="2"/><rect x="${c - 1}" y="26" width="2" height="7" fill="${mark}"/><rect x="${c - 6}" y="56" width="12" height="5" rx="1.5" fill="${handle}"/><rect x="${c - 6}" y="${h - 38}" width="12" height="7" rx="1.5" fill="${handle}"/>${trays}</svg>`;
};
// Rackmount models (Synology RS, QNAP models ending in U): short and wide, with rack ears.
const rackSvg = (bays, p) => {
  const n = Math.max(2, Math.min(bays, 12)), tw = 16, gap = 4, pad = 10, ear = 13, right = 42, h = 62;
  const w = ear + pad + n * tw + (n - 1) * gap + pad + right + ear;
  const { top, bottom, front, tray, handle, mark, accent } = p;
  const screw = (x, y) => `<circle cx="${x}" cy="${y}" r="2.4" fill="${tray}"/>`;
  let trays = "";
  for (let i = 0; i < n; i++) {
    const x = ear + pad + i * (tw + gap);
    trays += `<rect x="${x}" y="14" width="${tw}" height="${h - 28}" rx="2.5" fill="${tray}"/><rect x="${x + tw / 2 - 4}" y="${h - 24}" width="8" height="6" rx="1.5" fill="${handle}"/><circle cx="${x + tw / 2}" cy="20" r="1.4" fill="#43c463"/>`;
  }
  const c = w - ear - right / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h + 10}"><defs><linearGradient id="b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient></defs><ellipse cx="${w / 2}" cy="${h + 4}" rx="${w / 2 - 8}" ry="3.5" opacity=".25"/><rect x="0" y="6" width="${ear}" height="${h - 12}" rx="2" fill="${bottom}"/><rect x="${w - ear}" y="6" width="${ear}" height="${h - 12}" rx="2" fill="${bottom}"/>${screw(ear / 2, 14)}${screw(ear / 2, h - 14)}${screw(w - ear / 2, 14)}${screw(w - ear / 2, h - 14)}<rect x="${ear}" width="${w - 2 * ear}" height="${h}" rx="6" fill="url(#b)"/><rect x="${ear + 5}" y="6" width="${w - 2 * ear - 10}" height="${h - 12}" rx="4" fill="${front}"/>${
    accent ? `<rect x="${w - ear - right - 3}" y="12" width="3" height="${h - 24}" rx="1.5" fill="${accent}"/>` : ""
  }${trays}<circle cx="${c}" cy="${h / 2 - 8}" r="6" fill="none" stroke="${mark}" stroke-width="2"/><rect x="${c - 1}" y="${h / 2 - 15}" width="2" height="6" fill="${mark}"/><rect x="${c - 6}" y="${h / 2 + 8}" width="12" height="5" rx="1.5" fill="${handle}"/></svg>`;
};
// Flat all-flash NAS (DXP480T / DXP480T Plus) in parallel projection, like the product photos: each face is drawn
// flat in its own coordinates (front: u across, v down; side and top: z in depth) and placed with the same axes,
// so every edge stays parallel. Front axis (1, .03), depth axis (.85, -.06), vertical axis (0, 1).
const flatSvg = () => {
  const [X0, Y0] = [6, 10];
  const front = `matrix(1 .03 0 1 ${X0} ${Y0})`;
  const side = `matrix(.85 -.06 0 1 ${X0 + 200} ${Y0 + 6})`;
  const top = `matrix(1 .03 .85 -.06 ${X0} ${Y0})`;
  let vents = "";
  for (let i = 0; i < 16; i++) vents += `<rect x="${18 + i * 4.6}" y="9" width="2.2" height="15" rx=".8" fill="#2c2f33"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 104"><defs>\
<linearGradient id="f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b8bcc0"/><stop offset=".5" stop-color="#95999e"/><stop offset="1" stop-color="#72767b"/></linearGradient>\
<linearGradient id="k" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#95999e" stop-opacity="0"/><stop offset=".6" stop-color="#c6c9cd"/><stop offset="1" stop-color="#868a90"/></linearGradient>\
<linearGradient id="s" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7e8288"/><stop offset="1" stop-color="#565a5f"/></linearGradient>\
<linearGradient id="t" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c2c5c9"/><stop offset="1" stop-color="#dadcdf"/></linearGradient>\
<linearGradient id="c" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b9bcc0"/><stop offset="1" stop-color="#989ca1"/></linearGradient></defs>\
<ellipse cx="152" cy="97" rx="146" ry="5" opacity=".28"/>\
<g transform="${front}"><rect x="14" y="77" width="16" height="5" rx="1.5" fill="#111"/><rect x="170" y="77" width="16" height="5" rx="1.5" fill="#111"/></g>\
<g transform="${side}"><rect x="86" y="77" width="10" height="4" rx="1.5" fill="#111"/></g>\
<g transform="${top}"><rect width="200" height="100" rx="6" fill="url(#t)"/></g>\
<g transform="${side}"><rect width="100" height="78" rx="5" fill="url(#s)"/>${vents}</g>\
<g transform="${front}"><rect width="200" height="78" rx="5" fill="url(#f)"/>\
<rect x="184" width="16" height="78" fill="url(#k)"/>\
<rect x="1" y=".5" width="190" height="1.2" fill="#fff" opacity=".35"/>\
<path d="M0 40 H174 Q178 40 178 44 V78 H5 Q0 78 0 73 Z" fill="#141517"/>\
<rect x="6" y="45" width="112" height="30" rx="2" fill="url(#c)"/>\
<text x="62" y="61.5" text-anchor="middle" font-size="4.6" fill="#3a3d41" font-family="Arial, Helvetica, sans-serif" letter-spacing=".2">PROTECT WHAT YOU LOVE</text>\
<rect x="132" y="51" width="30" height="20" rx="5" fill="#26282c" stroke="#3a3d42" stroke-width="1.2"/>\
<circle cx="147" cy="61" r="4.3" fill="none" stroke="#f2f2f2" stroke-width="1.3"/></g></svg>`;
};
// Models offered in the editor; any other model string is matched by its family and bay count
// (DXP<bays>800, DH<bays>300, 480T, Synology DS/RS naming, QNAP TS/TVS/HS naming).
const NAS_MODELS = {
  ugreen: ["DXP2800", "DXP4800", "DXP4800 Plus", "DXP480T Plus", "DXP6800 Pro", "DXP8800 Plus", "DH2300", "DH4300 Plus"],
  synology: [
    "DS124", "DS223", "DS223j", "DS224+", "DS225+", "DS423", "DS423+", "DS425+", "DS723+", "DS923+", "DS925+",
    "DS1522+", "DS1621+", "DS1821+", "DS1825+", "DS2422+", "RS422+", "RS822+", "RS1221+", "RS2423+",
  ],
  qnap: [
    "TS-133", "TS-233", "TS-433", "TS-264", "TS-464", "TS-664", "TS-473A", "TS-673A", "TS-873A", "TS-h973AX",
    "TVS-h674", "TVS-h874", "HS-264", "TS-873AeU", "TS-1264U-RP",
  ],
};
// Bay counts from the model names. Synology: the leading digits are not always the bay count
// (DS723+ has 2 bays, DS923+ has 4, DS1522+ has 5), so known families are mapped.
const synoBays = (m) => {
  const d = m.match(/^(?:DS|DVA|FS)(\d{3,4})/);
  if (!d) return 4;
  const n = d[1];
  if (n.length === 4) return { 15: 5, 16: 6, 18: 8, 24: 12, 36: 12 }[n.slice(0, 2)] ?? 6;
  return { 1: 1, 2: 2, 3: 2, 4: 4, 6: 6, 7: 2, 9: 4 }[n[0]] ?? 4;
};
const synoRackBays = (m) => {
  const d = m.match(/^RS(\d{3,4})/);
  return d && d[1].length === 4 ? ({ 12: 8, 13: 8 }[d[1].slice(0, 2)] ?? 12) : 4;
};
// QNAP: the digits before the last two are the bay count (TS-233 → 2, TS-873A → 8, TS-1264U → 12).
const qnapBays = (m) => {
  const d = m.match(/(\d{3,4})/);
  return d ? Math.min(d[1].length === 4 ? +d[1].slice(0, 2) : +d[1][0] || 4, 12) : 4;
};
const brandOfModel = (m) =>
  /^(DXP|DH)\d/.test(m) ? "ugreen" : /^(DS|RS|FS|SA|DVA)\d/.test(m) ? "synology" : /^(TS|TVS|TBS|HS|TR)-?\w*\d/.test(m) ? "qnap" : null;
const nasSvg = (model, brand) => {
  const m = String(model || "").toUpperCase().replace(/\s+/g, "");
  const b = brandOfModel(m) || brand || "ugreen";
  if (b === "synology") return /^RS/.test(m) ? rackSvg(synoRackBays(m), PALETTES.synology) : towerSvg(synoBays(m), PALETTES.synology);
  if (b === "qnap") return /U(-RP)?$/.test(m) ? rackSvg(qnapBays(m), PALETTES.qnap) : towerSvg(qnapBays(m), PALETTES.qnap);
  if (/480T/.test(m)) return flatSvg();
  const dh = m.match(/^DH(\d)\d{3}/);
  if (dh) return towerSvg(+dh[1], PALETTES.dh);
  const dxp = m.match(/^DXP(\d)\d{3}/);
  return towerSvg(dxp ? +dxp[1] : 4, PALETTES.dxp);
};
// `image` option: a URL is used as is, anything else is a model name; by default the model reported
// by the integration decides, and the discovered brand backs up an unrecognized model string.
const nasPicture = (image, model, brand) =>
  /^(https?:|\/|data:)/.test(image || "") ? image : `data:image/svg+xml,${encodeURIComponent(nasSvg(image || model, brand))}`;

const BRAND_NAMES = { ugreen: "UGREEN", synology: "Synology", qnap: "QNAP" };
const BRAND_SITES = { ugreen: "https://nas.ugreen.com", synology: "https://www.synology.com", qnap: "https://www.qnap.com" };
// Only web addresses become links (a configuration_url can also be a homeassistant:// path).
const webUrl = (u) => (/^https?:\/\//i.test(String(u || "").trim()) ? String(u).trim() : null);
// The NAS web interface: the configuration_url of the NAS device in the device registry (set by the
// UGREEN NAS and Synology DSM integrations, the "Visit" link of the device page), found from any of
// its entities through the device's root (pools, volumes and disks are child devices).
const deviceUrl = (hass, nas) => {
  if (nas.info?.url) return webUrl(nas.info.url);
  const id = Object.values(nas.scalars)[0];
  const deviceId = id && hass.entities?.[id]?.device_id;
  return deviceId ? webUrl(rootDevice(hass, deviceId)?.configuration_url) : null;
};
// Picture choices of the editor: sorted by brand, then by model (numbers in natural order), each
// label prefixed with its brand; the value stays the bare model name.
const modelOptions = () =>
  Object.keys(NAS_MODELS)
    .sort((a, b) => BRAND_NAMES[a].localeCompare(BRAND_NAMES[b], "en", { sensitivity: "base" }))
    .flatMap((b) =>
      [...NAS_MODELS[b]]
        .sort((x, y) => x.localeCompare(y, "en", { numeric: true, sensitivity: "base" }))
        .map((m) => ({ value: m, label: `${BRAND_NAMES[b]} ${m}` }))
    );
// Header icon: the round NAS icon of the project page on the showcase site, in the status colour.
const NAS_ICON = "M4,5C2.89,5 2,5.89 2,7V17C2,18.11 2.89,19 4,19H20C21.11,19 22,18.11 22,17V7C22,5.89 21.11,5 20,5H4M4.5,7A1,1 0 0,1 5.5,8A1,1 0 0,1 4.5,9A1,1 0 0,1 3.5,8A1,1 0 0,1 4.5,7M7,7H20V17H7V7M8,8V16H11V8H8M12,8V16H15V8H12M16,8V16H19V8H16M9,9H10V10H9V9M13,9H14V10H13V9M17,9H18V10H17V9Z";
// Brand logo as a badge on the icon, on a white tile, embedded (no network): the UGREEN mark as SVG, the Synology and
// QNAP marks as 48 px PNG (images/synology.png, images/qnap.png scaled down).
const BRAND_LOGOS = {
  synology: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAHtUlEQVR42s1aX0hU2xr/rb13M1tzNCmRBJVpygnJoiELJO6RextPJ6O3oiDMh3rupaAgCMJjRH8o5kUKjuC9JyTIh3rzIa7eYJKiBw0zcGwssfFPhY7B6Oy9v/PQrH32nr1nZu+p0z0LFm5ludbvW9//71uAdYiG70MA+gC8BaACoB801cyZfQB+yYHNMhgAIfP9TwBDPxBwoTmUwYQMRpYP/K+Gf9QAKJmfPxq03dnddkQwA2t+yyxUMtPxgYwxEgSBRFEkSZJspyiKxBgrhhgjnt8M4sSMctWdWbDm5sY5aDeABEEgSZKKIWYtixMiZ8M/MnKmGCnLNwThq8RpmgYAkCQJfr8fW7duRW1tLSorK+HxeKCqKpLJJObn5xGPxzE1NYWFhYU/tVIUoaoqHA6u4BKAnwAMc3mKGlhV8CaMN75v3z6KRCI0MTFB6XSaCo2PHz/SkydP6OzZs1RdXW0SQRfiRACecen52UCZY/CBQIAePnxoAaiqKqXTactUFIU0TTOtnZ+fpwsXLpAgCLpouTCzBOAgAPzH6e1z8G1tbbS4uEhERJqmUTqdJlVVLQDthqZppCiKiVuDg4NUWVnphgiO9XcAeGcwW3kVDwC1tLRQKpUiIrIVmVwcUFXVlpi1tTUiIopGo1RaWkqCIDgRJ471PZyIDjeRPp+PpqamiIhIURQLcDuQ2YDtuLS6ukpERD09PRYdK0QIy3zkHZIkQVEUXLx4Ed3d3VAUBZIk/WkaiMDYV8MVi8Xw8uVLvH37FslkEiUlJairq0MoFEJjY6NlPf9dVVVIkoTm5ma8ePHClXUqePuMMfJ6vRSLxUjTNNNN8xt9/fo1HTlyhLxeb079OXz4ME1PT+scMw4ujn19fW65UNjpAKBQKGQCzEFomkbv3r0zmcRsb2z0wMFgkD5//mxRev6dSCSorKzMsWkVnDqsbdu2mRwX/2aM4cGDB5ibm4PX6wVjDKqqQlEUfaqqCiKCx+PBmzdvcOPGDQDA6uqqaU06ncamTZvQ0NDwNcZhBf0pBKcusLy8XJdXS/wtiiZ5zjUURYEgCOjv74cgCJBlGZIk6XPdunUQRRHBYNB0eXn10ykBKysrllsRBAFEhKNHj+LatWtIJBIQBAGCIEDTNBCRiSDOvXg8jtu3b8Pn8yGZTOLLly9IpVJYXl5GKpXC8+fPAeD7KDFXpubmZosOGJVxfHycDh48aPl/rgcuvKzbWdgKASBZlml6etpihbKJGhkZofPnz1NTU5MtaK7UuULuIqLUwoskSSIA1NXVldcDZ1uVV69e0b179+jUqVO0fft2232/A2ecJSuMMdq4cSPNzs7aeuLsUCJ7pNNpGh0dpTt37lA4HKbS0lKTmBaZ6DgjwKgLBw4c0G86FxGcA5wYu3WxWIyuX79OjY2NFp/zlxBgJOLYsWN6QKcoSl5C7Agy6lAqlaJIJEIbNmxw64HdE2A8YO/evRSNRi1i4jSszha18fFxXU9ccsK93HEiGGN0/PhxGh4etgDkMX8hgowh9fv376m+vt4tEcVpf/YBoVCIrly5QiMjI7p4ZRNkl5VlB3NPnz4lURSd5gXFE8A5YGdBtmzZQidOnKCenh4aHR21WKVcOsPXdXR0mMz3dyOAJzbG+o8xn7VzQowxCgaDdObMGRoYGKBkMmnr0TlhmqZRNBp1I0bOgBdT97GzKPX19RSJRGxzAk5UKpWi2tpap0Q4B1ZWVkY1NTW0c+dOam1tpY6OjoKWg3Mtm6BLly7lTE2JiNra2pya1cLW5vLlyzQ2NkYzMzO0srJiOvDWrVtu5JVEUSRRFEmWZUokEhZx4nrQ2dnpaN+84TQPndevX48dO3ZYYnvGGFpbW8EYMyU6+YaqqmCMIZVKYWZmBtXV1ZYcGQBkWXa0X96MgcfyQ0NDICIoiqL/TZIkMMawe/du7N+/H5qmmRL9fJfCGIMsy6ipqcm5LplMwk29Ma/yVlVV0dLSkoXdXH6fPXumB3z5wmFeHABAJ0+etNUBvn9LS8u364BROQcGBvQqnJ3S9fb2moBnx/xGJd+zZw8tLi5avDTfa25ujnw+n1ML6DwKzeWE+N+Gh4cpHA6Tx+Ox3Wvz5s107tw5Wl5etvUF/HLu3r3rOLBzVNjiOe7g4CDC4bClsMWVkyf3k5OTGBsbQyKRQDqdRkVFBfx+P3bt2oWKioqcxS2eRzc1NWFiYkI/t9DQnIgRY4wCgYB+e3accBKJ5oqHeHmxq6vLTVitOS7u8g3b29t18Ln6Aaqq6tFovvI6X8uj0cePH+t+ooDsm4q7v7strx86dIgWFhaKKq8bS+xGLvb395Msy7o1c1Be1wDcL7rB4ff76f79+5Z4Jld5PRcX4vE4nT592m3cZWpwiN/SYgqFQnTz5k0aGxvTRaHQ+PDhAz169Ig6OzupvLzcpGduW0zcDPwE4L/f0uRjjCEQCKChoQF1dXWoqqpCSUkJBEHA2toaPn36hNnZWcRiMUxOTmJpaamYRp+xydeaaUzqbdarWa1MV6FzMRldEUUsju2q8emBsdHd+1c2urlHLqIGZMTTm93ozn5qcPVv/NTgqtP3Ev/KNJH/Lo89/pfBlBN8ruc27QD+DSD+f3huE8+c3Z7vuc0fV3+X32ptc9MAAAAASUVORK5CYII=",
  qnap: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAGXklEQVR42u1Zb4hcVxX/nXvve2/evm5igpENqzHZIk0niCmRLOyHpoofpEr9Q3ehCC5auvkkCZvdbFKF54CylMmGEjBQxS9aRWaQYlEUhNakEGka9YNxoJSQpGA2VLPEysy8d9899/ihM2Xbrpud7Wab0D1wP8xlePf8zr977u8AG7IhH26h/7efpikBUN2NRqMhAFAul+V2KdNoNKhcLlP3vHq97gH0dB6laWruJAvXajUtInRLD6RpqiqViu/+npmZ+bT3fi8R7RaRj4vIPUQUiYjq1SorNR4RtQH8Syn1mlLqgrX2wtzcXBMARkdHdb1e5yUBdJUfHx8vDQwMHBSRcQB7wzAkorcwisj6xHTnPGYGM18lol85554+ceLE9aVAUFf5w4cP7ymVSs+GYbi3KAo45yAivMjab4O5XdIxUvc8ZYxRYRiiKIrreZ4fPHny5PPvBkEAMDk5uTsMw7Na6215nhcANBGpDzr+RUSIyGmtAyIS59wj1Wr1t4tBUK1W0+fPnz8bx/FIu90uiCi400qliLAxRnvvF7IsK586deoNEQERid65c+ejYRhO5nnORGRwBwoRKWZ2fX19ifc+O3fu3AsAzJkzZ7weGRl5Smv9Ke+9LK77K7CKA+DXYPWUXCKybXBw8JnTp097AGSIaB8zUy/KExGiKDJrkdTMDGstbvUtIqKOnvcODQ0NAng9TVNlAHzMe7/crfwe5UWknef5cwDsW3lGq6mxquOB+40xw845f4vCQd57McZE3vsBAK83Gg0yAHQvVUFrTcx8s1qtfmMt4vvIkSOPx3E87JzzK4gCUUoRM/d3N1abtCpN060A3pyfn6ft27evxgMGgGu1Wvf0ekl2PTU6Oor3U3VcpVJxndDrGUCapqhUKm5qasq/Hw8q3OWyAWADwAaADQAbAD7cANal/0/TVAFQjUZDarWaX2Xz98EAmJiYCCqVSrGo9+8CMqOjo/Kut8UdBYBEBMePH//k9PT0N40xWVEUL2qtG5VK5T8AMgCYmprSSZIYZn6bSOg0a3S7Aag0TVWHTVsyJMbGxqher1+anp7+BTNXkyT5YbvdvnH06NGXiehlAC9473938+ZNBvA1rfXnwjDUeZ6DmV2HXKA1B0BEsnXr1vahQ4dW5PZqtfoqgEdmZma+pJT6eZIkD2dZ9rD3viIiDSL6JYDvEpHK8/zrAL6dJMlHsiwDMy/rEbNKlsBcu3Zt97Fjx/7rnCNjzLJJ2fmPLoriFWvtfQB+EgTBV6y1rLUuR1H0A2stmPlPRPRTAA9mWfZFIppMkmSg3W7De89dECLiAaBer8OIiCWicKXcHzMDwEe99690eJvu3rLPUGb2QRAYY8zPLl269NiuXbu+E4bhU0VRSLPZLIgoDMPwIWPMQ3mevwrgZKvVelBEHlNKfS8Mw6DdbjtmVt77NxffA9eVUuiZBSYKlFIhEQUrXBEz6yiKvjU0NHQhz/OatfYLSql2EAShiLg8z32z2WQiui+KomfiOH5eRC5mWfZAURR/3LRpk2HmFoCrAFCr1bwior9oraXXMiarEABotVpOa12O47hBRKYoirKIXI2iyADwRKSLovDNZtMppXbHcfzrKIq+n+f5eLvdfpKILszNzb3RCQhRRPTsSkvWEsRwrwtEZKy17L2Poyj6g1LqqwsLC59h5r+XSiXTLaMdcL7ZbLooih4tlUp/tda+dOXKlc93RgACAOry5cu/sdaeLZVKWkSKdWLatPdesizjJEme3rJly5Pz8/P7nXN/6+jB3cc7EZlWq+UADMRx/NKOHTueqFQqrjvHoM5lcq/W+s9BEGzLsswBUOtE7goAlyRJ0Gq1flQUxXQURReVUkPW2nfwRCLiiQilUkm1Wq1Dc3Nzp9I0NTpNUzU7O7uwb9++32utPxtF0SeUUuS979LrXQpQOj3Mmi4RIWut7evrG2FmxcxPKKUOElHQoTsXFxjx3rsoir68f//+f8zOzl58x4DjwIEDZnh4+HEimhCRB9ZzwMHM2Lx5M27cuHGUmV/r7+9/zlq7FCsIpRSKomBmHl52xEREe5n5fgCDAPoBhLdrxEREopT6NzP/M0mStNls/jgMw2FrLS/R9vsgCExRFOff851araZxl8jExERwR41ZAag9e/bI2NgYr5bxw10yx96QDVkr+R9nF6j3KcYFGgAAAABJRU5ErkJggg==",
};
const UGREEN_LOGO = `<svg viewBox="31.54 11.44 86.93 129.63"><defs><linearGradient id="ug-logo" x1="75" y1="10.18" x2="75" y2="137.54" gradientUnits="userSpaceOnUse">
  <stop offset="0" stop-color="#02f2a6"/><stop offset="1" stop-color="#001509"/></linearGradient></defs>
  <path fill="url(#ug-logo)" d="M36.21,56.43c8.12,16.43,15.61,13.88,24.28,29.62V39.6c0-15.55-12.96-28.15-28.95-28.15v26.39c.26,5.25,.53,10.23,4.67,18.6Zm24.28,78.24v-24.2c.16-12.01-7.13-26.61-16.7-33.75-3.94-3.35-8-6.82-12.25-14.49v37.98c0,19.49,13.67,36.08,32.41,40.86-2.09-1.4-3.45-3.74-3.45-6.39ZM118.46,37.83V11.44c-15.99,0-28.95,12.6-28.95,28.15v46.45c4.25-7.68,8.31-11.15,12.26-14.5,9.57-7.12,16.86-21.77,16.7-33.72Zm-32.41,103.22c18.74-4.77,32.41-21.37,32.41-40.86,0,0,0-37.98,0-37.98-4.25,7.67-8.31,11.14-12.25,14.49-9.61,7.16-16.85,21.76-16.7,33.75v24.2c0,2.65-1.37,4.99-3.45,6.39Z"/></svg>`;
const brandBadge = (brand) =>
  `<span class="badge">${
    BRAND_LOGOS[brand] ? `<img src="${BRAND_LOGOS[brand]}" alt="">` : UGREEN_LOGO
  }</span>`;
const headerIcon = (cls, brand) =>
  `<span class="logo ${cls}" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="${NAS_ICON}"/></svg>${brand ? brandBadge(brand) : ""}</span>`;

// ---------------------------------------------------------------------------
// Entity discovery
// ---------------------------------------------------------------------------

// Entity ids end with the sensor key, optionally followed by "_<n>" when Home Assistant
// had to de-duplicate the id (e.g. sensor.ugreen_nas_cpu_usage_2).
const SFX = "(?:_\\d+)?$";
const SCALARS = {
  name: "nas_name",
  model: "nas_model",
  version: "nas_ugos_version",
  server_status: "server_status",
  system_message: "system_message",
  cpu_usage: "cpu_usage",
  cpu_temp: "cpu_temperature",
  cpu_model: "cpu_model",
  ram_usage: "ram_usage",
  ram_used: "ram_usage_used_gb",
  ram_total: "ram_total_size",
  runtime: "total_runtime",
  lan_up: "overall_lan_upload_raw",
  lan_down: "overall_lan_download_raw",
  cpu_fan: "cpu_fan",
};
const SCALAR_RE = Object.entries(SCALARS).map(([k, key]) => [k, new RegExp(`(?:^|_)${key}${SFX}`)]);
const RE_FAN = new RegExp(`(?:^|_)device_fan_(\\d+)${SFX}`);
const RE_POOL = new RegExp(`(?:^|_)pool_(\\d+)_(label|level|status|total_size|used_size|disk_count)${SFX}`);
const RE_VOLUME = new RegExp(
  `(?:^|_)pool_(\\d+)_volume_(\\d+)_(label|status|health|total_size_raw|used_size_raw|available_size_raw|total_size|used_size|filesystem)${SFX}`
);
const RE_DISK = new RegExp(
  `(?:^|_)pool_(\\d+)_disk_(\\d+)_(label|model|temperature|status|power_on_hours|size|type|slot)${SFX}`
);

const _cache = new Map();

/** List the NAS of every supported integration: UGREEN (UGNAS_device_id values) first, then the
 * NAS devices of the registry integrations (Synology DSM, QNAP). */
const listNas = (hass) => {
  const ids = new Map();
  // The editor renders on every hass change: go through the registry-backed candidates
  // (cached, usually a handful of entities) instead of scanning every state. Both lists follow the
  // order discover() picks its default NAS in (sorted entity ids, sorted root device ids), so the
  // first entry is the NAS a card without nas shows.
  for (const eid of ugnasIds(hass)) {
    const a = hass.states[eid].attributes;
    const id = a.UGNAS_device_id;
    if (!ids.has(id)) ids.set(id, a.UGNAS_global_id || id);
  }
  const list = [...ids.entries()].map(([value, label]) => ({ value, label }));
  for (const brand of Object.keys(REGISTRY_PLATFORMS))
    for (const rootId of [...registryRoots(hass, brand).keys()].sort()) {
      const d = hass.devices[rootId];
      list.push({ value: rootId, label: d.name_by_user || d.name || rootId });
    }
  return list;
};

// Candidate entity ids: the entities of the integration in the entity registry (plus entries whose
// platform is unknown), cached on the registry object (replaced only when it changes), not on
// hass.states, replaced on every state change. The cached list may be empty: on an install without
// the UGREEN integration (Synology/QNAP only) no state is a candidate, instead of scanning every
// state on each state change. Only without a usable registry is every state a candidate.
const UGNAS_PLATFORM = "ugreen";
let _registry = { entities: null, ids: [] };
const candidateIds = (hass) => {
  if (hass.entities && _registry.entities !== hass.entities) {
    const entries = Object.entries(hass.entities);
    // An empty registry tells us nothing: ids stays null and the states are scanned.
    const ids = entries.length
      ? entries.filter(([, e]) => e?.platform === UGNAS_PLATFORM || e?.platform == null).map(([id]) => id)
      : null;
    _registry = { entities: hass.entities, ids };
  }
  return hass.entities && _registry.ids ? _registry.ids : Object.keys(hass.states);
};

// Entity ids carrying UGNAS_device_id right now, re-read from the states on each call. HA leaves the
// attribute out while an entity is unavailable or restored at startup, so the list follows the attribute
// as it goes and comes back, and a result computed while an entity was missing is never reused once it
// is back.
const ugnasIds = (hass) => {
  const states = hass.states;
  return candidateIds(hass)
    .filter((id) => states[id]?.attributes?.UGNAS_device_id)
    .sort();
};

/**
 * Map the entities of one UGREEN NAS to a structured object of entity ids. The result is cached on
 * the list of UGREEN NAS entity ids that currently carry the attribute, so the regex matching only
 * runs again when that list changes. An empty result (no NAS found) is not cached.
 */
const discoverUgreen = (hass, nasId) => {
  const all = ugnasIds(hass);
  const key = `${nasId || ""}\n${all.join(",")}`;
  if (_cache.has(key)) return _cache.get(key);
  if (_cache.size > 8) _cache.clear();

  const nas = { brand: "ugreen", scalars: {}, fans: {}, pools: {}, nasId: null, info: null };
  const entityIds = all.filter((id) => !nasId || hass.states[id].attributes.UGNAS_device_id === nasId);
  // Prefer the first NAS when none is configured.
  const first = entityIds.length ? hass.states[entityIds[0]].attributes.UGNAS_device_id : null;

  for (const id of entityIds) {
    const a = hass.states[id].attributes;
    if (!nasId && a.UGNAS_device_id !== first) continue;
    nas.nasId = a.UGNAS_device_id;
    const obj = id.split(".")[1];
    let m;
    if ((m = obj.match(RE_DISK))) {
      const pool = (nas.pools[m[1]] ??= { volumes: {}, disks: {} });
      set((pool.disks[m[2]] ??= {}), m[3], id);
    } else if ((m = obj.match(RE_VOLUME))) {
      const pool = (nas.pools[m[1]] ??= { volumes: {}, disks: {} });
      set((pool.volumes[m[2]] ??= {}), m[3], id);
    } else if ((m = obj.match(RE_POOL))) {
      const pool = (nas.pools[m[1]] ??= { volumes: {}, disks: {} });
      set(pool, m[2], id);
    } else if ((m = obj.match(RE_FAN))) {
      set(nas.fans, m[1], id);
    } else {
      for (const [k, re] of SCALAR_RE) {
        if (re.test(obj)) {
          set(nas.scalars, k, id);
          break;
        }
      }
    }
  }
  if (nas.nasId) {
    _cache.set(key, nas);
    _lastGood.set(nas.nasId, nas);
    _lastGood.set(nasId || "", nas);
    return nas;
  }
  return offlineUgreen(hass, nasId) || nas;
};

// Last mapping found for each UGREEN NAS (and for the default NAS under ""). When the integration's
// coordinator fails (NAS rebooting or unreachable), every entity turns unavailable and Home Assistant
// drops UGNAS_device_id from it, so nothing carries the NAS id any more: the last mapping is served
// again, the card then shows its values as unavailable instead of a setup warning. Only while the
// mapped entities still in the states are all UGREEN candidates of the registry and none of them
// carries the attribute (a NAS id found elsewhere, or a removed integration, is not served from here).
const _lastGood = new Map();
// Last known text of the name and label entities, by entity id (see NasCard._text).
const _lastText = new Map();
const NO_VALUE = new Set(["unavailable", "unknown"]);
const mappedIds = (nas) => {
  const ids = [...Object.values(nas.scalars), ...Object.values(nas.fans)];
  for (const pool of Object.values(nas.pools)) {
    for (const [k, v] of Object.entries(pool)) if (k !== "volumes" && k !== "disks") ids.push(v);
    for (const group of [pool.volumes, pool.disks]) for (const slot of Object.values(group)) ids.push(...Object.values(slot));
  }
  return ids;
};
const offlineUgreen = (hass, nasId) => {
  const nas = _lastGood.get(nasId || "");
  if (!nas) return null;
  const candidates = new Set(candidateIds(hass));
  const present = mappedIds(nas).filter((id) => hass.states[id]);
  const offline = present.length > 0 && present.every((id) => candidates.has(id) && !hass.states[id].attributes?.UGNAS_device_id);
  return offline ? nas : null;
};

// ---------------------------------------------------------------------------
// Entity discovery — registry integrations (Synology DSM, QNAP)
// ---------------------------------------------------------------------------
//
// These integrations tag no attribute on their states: their entities are found through the entity
// registry (platform), typed by their language-independent translation_key, and grouped per NAS
// through the device registry. Synology attaches volumes and disks to child devices of the NAS;
// QNAP keeps everything on one device and tells volumes and drives apart in the entity names.

const REGISTRY_PLATFORMS = { synology: "synology_dsm", qnap: "qnap" };

// NAS-level translation_key → scalar slot.
const SYNO_SCALARS = {
  cpu_total_load: "cpu_usage",
  memory_real_usage: "ram_usage",
  memory_total_real: "ram_total",
  memory_available_real: "ram_available",
  temperature: "sys_temp",
  network_up: "lan_up",
  network_down: "lan_down",
};
const QNAP_SCALARS = {
  cpu_usage: "cpu_usage",
  cpu_temp: "cpu_temp",
  system_temp: "sys_temp",
  memory_percent_used: "ram_usage",
  memory_used: "ram_used",
  memory_size: "ram_total",
  status: "server_status",
  uptime: "boot",
};
// Volume and disk translation_key → per-device slot (Synology prefixes volume_/disk_, QNAP volume_/drive_).
const VOLUME_KEYS = {
  volume_percentage_used: "used_pct",
  volume_size_used: "used_size",
  volume_size_total: "total_size",
  volume_size_free: "available_size",
  volume_status: "status",
};
const DISK_KEYS = { disk_temp: "temperature", disk_status: "status", drive_temp: "temperature", drive_smart_status: "status" };

// Registry lookups are cached on the registry objects, which Home Assistant replaces whenever an
// entity or a device changes (the states are read again on every discovery through the mapped ids).
let _registries = { entities: null, devices: null, cache: new Map() };
const registryCache = (hass) => {
  if (_registries.entities !== hass.entities || _registries.devices !== hass.devices)
    _registries = { entities: hass.entities, devices: hass.devices, cache: new Map() };
  return _registries.cache;
};

const rootDevice = (hass, id) => {
  let d = hass.devices?.[id];
  for (let i = 0; d?.via_device_id && hass.devices[d.via_device_id] && i < 4; i++) d = hass.devices[d.via_device_id];
  return d;
};

const naturalOrder = (a, b) => a.localeCompare(b, "en", { numeric: true });

/** The NAS of one registry integration: root device id → sorted entity ids (NAS and child devices). */
const registryRoots = (hass, brand) => {
  const cache = registryCache(hass);
  const key = `roots\n${brand}`;
  if (cache.has(key)) return cache.get(key);
  const byRoot = new Map();
  if (hass.entities && hass.devices) {
    for (const [id, e] of Object.entries(hass.entities)) {
      if (e?.platform !== REGISTRY_PLATFORMS[brand] || !e.device_id) continue;
      const root = rootDevice(hass, e.device_id);
      if (!root) continue;
      if (!byRoot.has(root.id)) byRoot.set(root.id, []);
      byRoot.get(root.id).push(id);
    }
    // Numeric order: bay 10 after bay 9 ("drive_10_…" sorts before "drive_1_…" as plain strings),
    // eth10 after eth2. Synology and QNAP slots are created, and then shown, in this order.
    for (const ids of byRoot.values()) ids.sort(naturalOrder);
  }
  cache.set(key, byRoot);
  return byRoot;
};

// The specific volume or drive of a QNAP entity only shows in its name, where the integration
// inserts it ({monitor_device}): the words an entity does not share with the others of its
// translation_key group are that insert, whatever the language.
const monitorOf = (names, i) => {
  if (names.length < 2) return "";
  const words = names.map((n) => String(n || "").split(/\s+/));
  const w = words[i];
  let a = 0;
  while (a < w.length && words.every((o) => o[a] === w[a])) a++;
  let b = 0;
  while (b < w.length - a && words.every((o) => o[o.length - 1 - b] === w[w.length - 1 - b])) b++;
  return w.slice(a, w.length - b).join(" ");
};
// Trailing parenthesized insert of an entity name (QNAP volume names), doubling as the label.
const parenOf = (name) => (String(name || "").match(/\(([^()]*)\)[^()]*$/) || [])[1] ?? null;
// Trailing parenthesized part of a device name ("hostname (Volume 1)" → "Volume 1").
const deviceLabel = (name) => (String(name || "").match(/\(([^()]*)\)\s*$/) || [])[1];

const set = (obj, k, id) => {
  if (!(k in obj)) obj[k] = id;
};

/** Map the entities of one Synology DSM or QNAP NAS to the structure the cards render. */
const discoverRegistry = (hass, brand, nasId) => {
  const cache = registryCache(hass);
  const key = `${brand}\n${nasId || ""}`;
  if (cache.has(key)) return cache.get(key);

  const byRoot = registryRoots(hass, brand);
  const rootId = nasId ? (byRoot.has(nasId) ? nasId : null) : ([...byRoot.keys()].sort()[0] ?? null);
  const nas = { brand, nasId: rootId, scalars: {}, fans: {}, pools: {}, info: null };
  if (!rootId) {
    cache.set(key, nas);
    return nas;
  }
  const dev = hass.devices[rootId];
  nas.info = { name: dev.name_by_user || dev.name, model: dev.model, version: dev.sw_version, url: dev.configuration_url };
  const SCALARS_BY_KEY = brand === "synology" ? SYNO_SCALARS : QNAP_SCALARS;
  const pool = (nas.pools[1] = { volumes: {}, disks: {} });
  const groups = {};

  for (const id of byRoot.get(rootId)) {
    const e = hass.entities[id];
    const tk = e.translation_key;
    if (brand === "synology" && e.device_id !== rootId) {
      // Child device of the NAS: a volume or a disk, labelled and (for disks) modelled by its device.
      const d = hass.devices[e.device_id];
      if (tk in VOLUME_KEYS) set((pool.volumes[e.device_id] ??= { labelText: deviceLabel(d?.name) }), VOLUME_KEYS[tk], id);
      else if (tk in DISK_KEYS)
        set((pool.disks[e.device_id] ??= { labelText: deviceLabel(d?.name), modelText: d?.model }), DISK_KEYS[tk], id);
    } else if (brand === "synology" && tk === "status" && id.startsWith("binary_sensor.")) {
      set(nas.scalars, "server_status", id); // Security status: a safety binary sensor, on = issue found.
    } else if (tk in SCALARS_BY_KEY) {
      set(nas.scalars, SCALARS_BY_KEY[tk], id);
    } else if (brand === "qnap" && (tk in VOLUME_KEYS || tk in DISK_KEYS || tk === "network_rx" || tk === "network_tx")) {
      (groups[tk] ??= []).push(id);
    } else if (!tk && id.startsWith("sensor.") && hass.states[id]?.attributes?.device_class === "timestamp") {
      set(nas.scalars, "boot", id); // Synology "Last boot" carries no translation_key.
    }
  }

  if (brand === "qnap") {
    // Network: the first interface (sorted entity ids) feeds the two tiles.
    if (groups.network_rx) set(nas.scalars, "lan_down", groups.network_rx[0]);
    if (groups.network_tx) set(nas.scalars, "lan_up", groups.network_tx[0]);
    // Volumes and drives: the entities of one volume or drive are joined on the monitor insert of
    // their names; the insert in parentheses (volumes) doubles as the label.
    const nameOf = (id) => hass.states[id]?.attributes?.friendly_name || id.split(".")[1];
    const join = (tks, into) => {
      for (const tk of tks) {
        const ids = groups[tk] || [];
        const names = ids.map(nameOf);
        ids.forEach((id, i) => {
          const label = parenOf(names[i]);
          const mon = label ?? monitorOf(names, i);
          const slot = (into[mon || "1"] ??= {});
          if (label && !slot.labelText) slot.labelText = label;
          set(slot, (tk in VOLUME_KEYS ? VOLUME_KEYS : DISK_KEYS)[tk], id);
        });
      }
    };
    join(["volume_percentage_used", "volume_size_used", "volume_size_free"], pool.volumes);
    join(["drive_temp", "drive_smart_status"], pool.disks);
    // "Volume size" carries no insert in its name: it is only safe with a single volume.
    const volumes = Object.values(pool.volumes);
    if (groups.volume_size_total?.length === 1 && volumes.length === 1) set(volumes[0], "total_size", groups.volume_size_total[0]);
  }
  cache.set(key, nas);
  return nas;
};

/** Map the entities of one NAS, whatever its integration: the UGREEN integration first (its
 * entities carry the attribute), then the registry integrations; a configured nas picks
 * whichever integration knows it. */
const discover = (hass, nasId) => {
  const ugreen = discoverUgreen(hass, nasId);
  if (ugreen.nasId) return ugreen;
  for (const brand of Object.keys(REGISTRY_PLATFORMS)) {
    const nas = discoverRegistry(hass, brand, nasId);
    if (nas.nasId) return nas;
  }
  return ugreen;
};

/** Compute used/total bytes of a volume from the raw sensors (fallback to the human ones). */
const volumeUsage = (hass, vol) => {
  const st = (k) => vol[k] && hass.states[vol[k]];
  let total = toBytes(st("total_size_raw")) ?? toBytes(st("total_size"));
  let used = toBytes(st("used_size_raw")) ?? toBytes(st("used_size"));
  const avail = toBytes(st("available_size_raw")) ?? toBytes(st("available_size"));
  if (used === null && total !== null && avail !== null) used = total - avail;
  if (total === null && used !== null && avail !== null) total = used + avail;
  // Unknown used space: no percentage (shown as "—"), rather than an empty bar at 0 %.
  let pct = total && used !== null ? Math.min(100, Math.max(0, (used / total) * 100)) : null;
  // Synology and QNAP report the percentage directly: it completes whichever size is missing.
  const direct = num(st("used_pct"));
  if (pct === null && direct !== null) {
    pct = Math.min(100, Math.max(0, direct));
    if (used === null && total !== null) used = (total * pct) / 100;
    else if (total === null && used !== null && pct > 0) total = (used * 100) / pct;
  }
  return { total, used, pct };
};

// Same values, compared by identity: used to skip a render when nothing the card shows has changed.
const sameSig = (a, b) => !!a && !!b && a.length === b.length && a.every((v, i) => v === b[i]);

// Patch the shadow DOM in place from the new HTML: nodes whose tag is unchanged are kept, so keyboard
// focus, hover, embedded pictures and CSS transitions survive an update, and only the changed text and
// attributes are written. Rows of a list carry a data-key (their entity or row id) and are matched by it,
// wherever they moved, so a focused row keeps its own data when the list is reordered (a node matched by
// position would be rewritten with the row taking its place, and Enter would act on that row). Nodes
// without a data-key are matched by position.
const patchAttrs = (cur, next) => {
  for (const { name } of [...cur.attributes]) if (!next.hasAttribute(name)) cur.removeAttribute(name);
  for (const { name, value } of next.attributes) if (cur.getAttribute(name) !== value) cur.setAttribute(name, value);
};
const keyOf = (n) => (n.nodeType === 1 ? n.getAttribute("data-key") : null);
const sameNode = (a, b) => !!a && a.nodeType === b.nodeType && a.nodeName === b.nodeName;
// Moves a kept node. moveBefore (where supported) keeps its focus; insertBefore drops it, which is safe:
// Enter then does nothing rather than act on another row.
const place = (parent, node, ref) => {
  if (node === ref) return;
  try {
    if (parent.moveBefore && node.parentNode === parent) return parent.moveBefore(node, ref);
  } catch (_e) {
    /* fall back to insertBefore */
  }
  parent.insertBefore(node, ref);
};
const patchChildren = (cur, next) => {
  const old = [...cur.childNodes];
  const fresh = [...next.childNodes];
  const byKey = new Map();
  for (const o of old) {
    const k = keyOf(o);
    if (k !== null && !byKey.has(k)) byKey.set(k, o);
  }
  const used = new Set();
  fresh.forEach((n, i) => {
    const k = keyOf(n);
    let o = k !== null ? byKey.get(k) : old[i];
    if (!sameNode(o, n) || used.has(o) || (k === null && keyOf(o) !== null)) o = null;
    const ref = cur.childNodes[i] ?? null;
    if (!o) {
      cur.insertBefore(n, ref);
      return;
    }
    used.add(o);
    place(cur, o, ref);
    if (n.nodeType === 1) {
      patchAttrs(o, n);
      patchChildren(o, n);
    } else if (o.nodeValue !== n.nodeValue) o.nodeValue = n.nodeValue;
  });
  while (cur.childNodes.length > fresh.length) cur.removeChild(cur.lastChild);
};
const morph = (root, html) => {
  const tpl = document.createElement("template");
  tpl.innerHTML = html;
  patchChildren(root, tpl.content);
};

const fireMoreInfo = (node, entityId) => {
  if (!entityId) return;
  node.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId }, bubbles: true, composed: true }));
};

// ---------------------------------------------------------------------------
// Shared styles
// ---------------------------------------------------------------------------

const BASE_STYLE = `
  :host { --nas-accent: #00b46e; --nas-ok: var(--success-color, #43a047); --nas-warn: var(--warning-color, #ffa600); --nas-crit: var(--error-color, #db4437);
          --nas-na: var(--disabled-text-color, #9e9e9e); }
  /* The card is the container of the width queries below (narrow header, volume rows, mini card footer). */
  ha-card { overflow: hidden; container-type: inline-size; }
  /* A size container has no width of its own content: in a parent that sizes to its content (inline-block,
     grid auto column: button-card, layout-card) the card would fall to a few pixels. This empty, zero-height
     grid gives the card a natural (max-content) width of 400 px without any minimum (its min-content width
     is 0): in a "1fr 1fr" grid (grid card, horizontal-stack, layout-card), wrapped in a <div> or not, the card
     still shrinks to its column. contain-intrinsic-inline-size or a min-width on the host would be a minimum
     and overflow there. */
  :host::before { content: ""; display: grid; grid-template-columns: minmax(0, 400px); height: 0; }
  .icon { width: 18px; height: 18px; fill: currentColor; flex: none; }
  .muted { color: var(--secondary-text-color); }
  .clickable { cursor: pointer; }
  [role="button"]:focus-visible { outline: 2px solid var(--primary-color, #03a9f4); outline-offset: 2px; }
  .ok { --c: var(--nas-ok); } .warn { --c: var(--nas-warn); } .crit { --c: var(--nas-crit); } .na { --c: var(--nas-na); }
  .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--c, var(--nas-ok)); flex: none; display: inline-block; }
  /* The state color stays on the dot and the tint; the text mixes it with the text color to stay readable (>= 4.5:1). */
  .chip { display: inline-flex; align-items: center; gap: 4px; padding: 1px 8px; border-radius: 12px; font-size: 11px; font-weight: 500;
          background: color-mix(in srgb, var(--c, var(--nas-ok)) 15%, transparent);
          color: color-mix(in srgb, var(--c, var(--nas-ok)) 40%, var(--primary-text-color, #212121)); }
  .chip .txt { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .bar { height: 4px; border-radius: 3px; background: var(--divider-color, rgba(127,127,127,.25)); overflow: hidden; }
  .bar > div { height: 100%; border-radius: 3px; background: var(--c, var(--nas-accent)); transition: width .6s ease; }
  @media (prefers-reduced-motion: reduce) { .bar > div { transition: none; } }
  .header { display: flex; align-items: center; gap: 10px; padding: 12px 12px 8px; }
  /* The status pill sits right of the title, centred on the title line; the subtitle keeps the title's width.
     The pill keeps its whole label as long as the title keeps a few characters (the first column's minimum):
     only then does it truncate its text, and on a very narrow card it shows its dot alone. */
  .titles { flex: 1 1 0; min-width: 0; display: grid; grid-template-columns: minmax(48px, 1fr) auto; }
  .titles > .name, .titles > .sub { grid-column: 1; }
  .titles > .chip { grid-area: 1 / 2; align-self: center; margin-left: 10px; white-space: nowrap; min-width: 0; max-width: 100%;
                    overflow: hidden; box-sizing: border-box; }
  @container (max-width: 200px) { .chip .txt { display: none; } }
  .logo { height: 40px; width: 40px; flex: none; align-self: flex-start; border-radius: 50%; display: grid; place-items: center;
          color: var(--c, var(--nas-ok)); background: color-mix(in srgb, var(--c, var(--nas-ok)) 16%, transparent); }
  .logo svg { width: 24px; height: 24px; fill: currentColor; }
  .logo { position: relative; }
  .logo .badge { position: absolute; right: -4px; bottom: -4px; width: 18px; height: 18px; border-radius: 5px; padding: 2px; box-sizing: border-box;
                 display: grid; place-items: center; background: #fff;
                 box-shadow: 0 0 0 1px var(--divider-color, rgba(0,0,0,.12)), 0 0 0 3px var(--card-background-color, #fff); }
  .logo .badge svg, .logo .badge img { width: 100%; height: 100%; object-fit: contain; }
  .brand-link, .nas-link { display: flex; flex: none; border-radius: 8px; }
  .brand-link { border-radius: 50%; }
  .brand-link { align-self: flex-start; }
  .brand-link:focus-visible, .nas-link:focus-visible { outline: 2px solid var(--primary-color, #03a9f4); outline-offset: 2px; }
  .nas-link .nas { max-width: 100%; }
  .name { font-size: 16px; font-weight: 500; line-height: 1.25; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 4ch; }
  .sub { font-size: 12px; color: var(--secondary-text-color); overflow: hidden; }
  /* Model and UGOS version on one line when they fit, else one per line: the "·" separator that starts a line
     sits in the negative margin, clipped by .sub. */
  .sub .parts { display: flex; flex-wrap: wrap; margin-left: -12px; }
  .sub .parts span { min-width: 0; max-width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .sub .parts span::before { content: "·"; display: inline-block; width: 12px; text-align: center; }
  .warning { padding: 16px; color: color-mix(in srgb, var(--nas-warn) 40%, var(--primary-text-color, #212121)); }
  .zoom { all: unset; flex: none; cursor: pointer; width: 24px; height: 24px; margin: -4px -4px -4px 0;
          border-radius: 50%; display: grid; place-items: center; color: var(--secondary-text-color); }
  .zoom .icon { width: 16px; height: 16px; }
  .zoom:hover { background: color-mix(in srgb, var(--secondary-text-color) 16%, transparent); color: var(--primary-text-color); }
  .zoom:focus-visible { outline: 2px solid var(--primary-color, #03a9f4); outline-offset: 1px; }
`;
// A click inside a dialog (more-info opened from the card, say) is not a click outside the card.
const inDialog = (ev) => ev.composedPath().some((n) => ["ha-more-info-dialog", "ha-dialog", "dialog"].includes(n.localName));

// Sparkline of a series (24 h of rates), scaled from 0 to its peak; nothing under two points.
const HIST_REFRESH = 5 * 60000;
function spark(values) {
  if (!values || values.length < 2) return "";
  const peak = Math.max(...values) || 1;
  const pts = values.map((v, i) => `${((i / (values.length - 1)) * 100).toFixed(2)},${(30 - (Math.max(0, v) / peak) * 28).toFixed(2)}`).join("L");
  return `<svg class="spark" viewBox="0 0 100 30" preserveAspectRatio="none" aria-hidden="true"><path class="spark-a" d="M0,30L${pts}L100,30Z"/><path class="spark-l" d="M${pts}"/></svg>`;
}

class NasBase extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._html = "";
    this.shadowRoot.addEventListener("click", (ev) => {
      const el = ev.composedPath().find((n) => n.dataset?.entity);
      if (el) fireMoreInfo(this, el.dataset.entity);
    });
    // Keyboard access: Enter or Space on a focusable non-button element acts as a click.
    this.shadowRoot.addEventListener("keydown", (ev) => {
      if ((ev.key === "Enter" || ev.key === " ") && ev.target.getAttribute?.("role") === "button") {
        ev.preventDefault();
        ev.target.click();
      }
    });
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._config) return;
    // Render only when a state the card shows has changed, not on every state change of Home Assistant.
    const sig = this._signature();
    if (sameSig(sig, this._sig)) return;
    this._update(sig);
  }

  get hass() {
    return this._hass;
  }

  setConfig(config) {
    if (!config) throw new Error("Invalid configuration");
    this._config = { ...config };
    this._html = "";
    this._update();
  }

  // Server status as shown: the healthy words of the integrations ("Normal", "good") go through
  // the translations, any other value is shown as reported. The Synology safety binary sensor has
  // no word at all: both of its states are translated. Without value (NAS offline), every brand shows
  // the translated unavailable / unknown state rather than a security warning.
  _statusText(status, brand) {
    if (NO_VALUE.has(status.state)) return this._t(status.state);
    if (brand === "synology") return this._t(String(status.state) === "off" ? "status_ok" : "status_problem");
    return /^(normal|good|healthy|ok)$/i.test(String(status.state)) ? this._t("status_ok") : status.state;
  }

  // Class of the server status: healthy, problem, or no value (neutral).
  _statusClass(nas, status) {
    return NO_VALUE.has(status.state) ? "na" : statusOk(nas, status) ? "ok" : "warn";
  }

  // Title of a status dot (volume, disk): the reported state, translated when it has no value.
  _dotTitle(status) {
    return !status ? "" : NO_VALUE.has(status.state) ? this._t(status.state) : status.state;
  }

  _t(key) {
    return t(this._hass, this._config, key);
  }

  // The three gauge readings, shared by the full card and the mini card: CPU temperature when the
  // integration reports one, system temperature otherwise.
  _vitals(sc) {
    const tempId = sc.cpu_temp || sc.sys_temp;
    const { c, text } = temperature(this._s(tempId), this._hass);
    return { cpu: num(this._s(sc.cpu_usage)), ram: num(this._s(sc.ram_usage)), tempId, temp: c, tempText: text };
  }

  _s(id) {
    return id ? this._hass.states[id] : undefined;
  }

  // Text of an entity shown as a name or a label (NAS name and model, OS version, CPU model, volume
  // and disk labels): never "unavailable" / "unknown". While the entity has no value (UGREEN NAS
  // offline), the last value shown is kept, so the card still tells which NAS and which disk it is;
  // without one, null lets the caller fall back on its generic name.
  _text(id) {
    const s = this._s(id);
    if (!s) return null;
    if (!NO_VALUE.has(s.state) && s.state !== "") {
      _lastText.set(id, s.state);
      return s.state;
    }
    return _lastText.get(id) ?? null;
  }

  // What the render depends on: language, dark mode, the registries (registry integrations are
  // rediscovered when an entity or a device changes) and the states of the NAS entities.
  _signature() {
    const h = this._hass;
    const sig = [h.language, h.locale?.language, h.themes?.darkMode, h.entities, h.devices];
    const nas = discover(h, this._config.nas);
    sig.push(nas);
    if (!nas.nasId) return sig;
    // The uptime computed from a boot timestamp (Synology, QNAP) ages with the clock, not with a
    // state: tie the signature to the minute so the text refreshes with the next state change.
    if (nas.scalars.boot && num(this._s(nas.scalars.runtime)) === null) sig.push(Math.floor(Date.now() / 60000));
    const walk = (o) => {
      for (const v of Object.values(o)) {
        if (typeof v === "string") sig.push(h.states[v]);
        else if (v && typeof v === "object") walk(v);
      }
    };
    walk(nas.scalars);
    walk(nas.fans);
    walk(nas.pools);
    return sig;
  }

  _update(sig) {
    if (!this._hass || !this._config) return;
    this._sig = sig ?? this._signature();
    const html = this._render();
    if (html !== this._html) {
      this._html = html;
      morph(this.shadowRoot, html);
    }
  }

  _header(nas) {
    const sc = nas.scalars;
    const c = this._config;
    const status = this._s(sc.server_status);
    const statusText = status ? this._statusText(status, nas.brand) : "";
    // The system message (UGREEN) explains the status; without one, the pill's title repeats its text,
    // which the narrow pill (dot only) hides.
    const message = this._s(sc.system_message);
    const messageText = message && !NO_VALUE.has(message.state) ? message.state : "";
    const name = c.title || this._text(sc.name) || nas.info?.name || `${BRAND_NAMES[nas.brand]} NAS`;
    const model = this._text(sc.model) || nas.info?.model;
    const version = this._text(sc.version);
    const os = version ? `UGOS ${version}` : osVersion(nas.info?.version, nas.brand);
    // The compact mini card shares its header with the NAS picture: the model alone, the OS version zoomed in.
    const sub = [model, os && !this._compactHeader() ? os : null].filter(Boolean);
    return `
      <div class="header">
        ${this._link(webUrl(c.brand_url) || BRAND_SITES[nas.brand], this._t("open_brand").replace("{brand}", BRAND_NAMES[nas.brand]), "brand-link", headerIcon(status ? this._statusClass(nas, status) : "na", nas.brand))}
        <div class="titles">
          <div class="name">${esc(name)}</div>
          <div class="sub"><div class="parts">${sub.map((x) => `<span>${esc(x)}</span>`).join("")}</div></div>
          ${
            status
              ? `<span class="chip clickable ${this._statusClass(nas, status)}" role="button" tabindex="0" data-entity="${status.entity_id}" title="${esc(
                  messageText || statusText
                )}" aria-label="${esc(statusText)}"><span class="dot"></span><span class="txt">${esc(statusText)}</span></span>`
              : ""
          }
        </div>
        ${
          c.show_image !== false
            ? this._link(
                webUrl(c.url) || deviceUrl(this._hass, nas),
                this._t("open_nas"),
                "nas-link",
                `<img class="nas" src="${esc(nasPicture(c.image, model, nas.brand))}" alt="${esc(model || "NAS")}">`
              )
            : ""
        }
        ${this._zoomButton()}
      </div>`;
  }

  // Content wrapped in a link opening in a new tab, or left as is without an address.
  _link(href, title, cls, content) {
    return href
      ? `<a class="${cls}" href="${esc(href)}" target="_blank" rel="noopener noreferrer" title="${esc(title)}">${content}</a>`
      : content;
  }

  // Whether the header is the mini card's compact one (model only in the subtitle, no status pill).
  _compactHeader() {
    return false;
  }

  // Button at the far right of the header: only the mini card has one.
  _zoomButton() {
    return "";
  }

  _noNas() {
    return `<style>${BASE_STYLE}</style><ha-card><div class="warning">${esc(
      this._config.nas ? `${this._t("unknown_nas")}: ${this._config.nas}` : this._t("no_nas")
    )}</div></ha-card>`;
  }
}

// ---------------------------------------------------------------------------
// Full card
// ---------------------------------------------------------------------------

const ring = (pct, cls) => {
  const r = 26;
  const c = 2 * Math.PI * r;
  const p = pct === null ? 0 : Math.max(0, Math.min(100, pct));
  return `<svg class="ring ${cls}" viewBox="0 0 64 64">
    <circle cx="32" cy="32" r="${r}" class="track"/>
    <circle cx="32" cy="32" r="${r}" class="value" stroke-dasharray="${((p / 100) * c).toFixed(1)} ${c.toFixed(1)}"/>
  </svg>`;
};

const FULL_STYLE = `
  .nas { height: 48px; width: auto; flex: none; max-width: 40%; object-fit: contain; filter: drop-shadow(0 4px 6px rgba(0,0,0,.25)); }
  .nas-link { max-width: 40%; }
  .content { padding: 0 12px 12px; display: flex; flex-direction: column; gap: 12px; }
  .section-title { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 500; text-transform: uppercase;
                   letter-spacing: .04em; color: var(--secondary-text-color); margin-bottom: 6px; }
  .section-title .icon { width: 16px; height: 16px; }
  .gauges { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
  .gauge { display: flex; flex-direction: column; align-items: center; position: relative; }
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
  .net { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; }
  .tile { display: flex; align-items: center; gap: 8px; padding: 6px 10px; border-radius: 10px;
          background: var(--secondary-background-color, rgba(127,127,127,.08)); position: relative; overflow: hidden; }
  .tile > :not(.spark) { position: relative; }
  .tile .spark { position: absolute; left: 0; bottom: 0; width: 100%; height: 55%; pointer-events: none; }
  .spark-a { fill: color-mix(in srgb, var(--c) 12%, transparent); }
  .spark-l { fill: none; stroke: color-mix(in srgb, var(--c) 50%, transparent); stroke-width: 1.2; vector-effect: non-scaling-stroke; }
  .tile .icon { color: var(--c, var(--nas-accent)); }
  .tile .k { font-size: 11px; color: var(--secondary-text-color); }
  .tile .v { font-size: 14px; font-weight: 500; }
  .tile.up { --c: var(--info-color, #039be5); }
  .tile.down { --c: var(--nas-accent); }
  .vol { margin-bottom: 8px; display: grid; grid-template-columns: minmax(0, 1fr) auto; column-gap: 8px; align-items: center; }
  .vol .row { grid-column: 1; grid-row: 1; }
  .vol:last-child { margin-bottom: 0; }
  .row { display: flex; align-items: center; gap: 8px; font-size: 13px; }
  .row .grow { flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .row .tag { font-size: 11px; padding: 1px 6px; border-radius: 6px; background: var(--secondary-background-color, rgba(127,127,127,.12));
              color: var(--secondary-text-color); text-transform: uppercase; flex: 0 1 auto; min-width: 0; overflow: hidden;
              text-overflow: ellipsis; white-space: nowrap; }
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

class NasCard extends NasBase {
  static getConfigElement() {
    return document.createElement("nas-card-editor");
  }

  static getStubConfig(hass) {
    // The NAS this card shows without nas (the first of the editor's list).
    const nas = hass ? discover(hass, "").nasId : null;
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
    if (c.show_system !== false) parts.push(this._system(nas));
    if (c.show_network !== false) parts.push(this._network(nas));
    if (c.show_volumes !== false) parts.push(this._volumes(nas));
    if (c.show_disks !== false) parts.push(this._disks(nas));
    if (c.show_fans !== false) parts.push(this._fans(nas));
    return `<style>${BASE_STYLE}${FULL_STYLE}</style>
      <ha-card>
        ${this._header(nas)}
        <div class="content">${parts.filter(Boolean).join("")}</div>
      </ha-card>`;
  }

  _gauge(id, label, icon, value, display, cls) {
    // Without an entity there is no more-info to open: no button role, no tab stop.
    const act = id ? ` role="button" tabindex="0" data-entity="${id}"` : "";
    return `<div class="gauge ${id ? "clickable " : ""}${cls}"${act}>
      ${ring(value, cls)}
      <div class="val">${svgIcon(icon)}<b>${display}</b></div>
      <div class="lbl">${label}</div>
    </div>`;
  }

  _system(nas) {
    const sc = nas.scalars;
    const { cpu, ram, tempId, temp, tempText } = this._vitals(sc);
    const ramTotal = toBytes(this._s(sc.ram_total));
    const ramAvail = toBytes(this._s(sc.ram_available));
    const ramUsed =
      toBytes(this._s(sc.ram_used)) ??
      (ramTotal !== null && ramAvail !== null ? ramTotal - ramAvail : ramTotal !== null && ram !== null ? (ramTotal * ram) / 100 : null);
    const ramLabel = ramUsed !== null && ramTotal !== null ? `${this._t("ram")} · ${ramPair(ramUsed, ramTotal)}` : this._t("ram");
    const runtime = num(this._s(sc.runtime)) ?? bootAge(this._s(sc.boot));
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
    return `<div>
      <div class="gauges">
        ${this._gauge(sc.cpu_usage, this._t("cpu"), ICONS.cpu, cpu, cpu === null ? "—" : `${Math.round(cpu)}%`, level(cpu, 70, 90))}
        ${this._gauge(sc.ram_usage, ramLabel, ICONS.ram, ram, ram === null ? "—" : `${Math.round(ram)}%`, level(ram, 80, 95))}
        ${this._gauge(
          tempId,
          sc.cpu_temp ? `${this._t("temperature")} ${this._t("cpu")}` : this._t("temperature"),
          ICONS.temp,
          temp,
          tempText,
          level(temp, 75, 90)
        )}
      </div>
      ${facts.length ? `<div class="facts">${facts.join("")}</div>` : ""}
    </div>`;
  }

  _network(nas) {
    const sc = nas.scalars;
    if (!sc.lan_down && !sc.lan_up) return "";
    // A tile without its sensor (e.g. QNAP without upload rate) opens no more-info: not focusable.
    const hist = this._config.show_history === false ? null : this._history([sc.lan_down, sc.lan_up].filter(Boolean));
    const tile = (id, cls, icon, k) =>
      `<div class="tile ${id ? `clickable ${cls}" role="button" tabindex="0" data-entity="${id}"` : `${cls}"`}>${spark(hist?.[id])}${svgIcon(icon)}<div><div class="k">${k}</div><div class="v">${fmtRate(
        toBps(this._s(id))
      )}</div></div></div>`;
    return `<div>
      <div class="section-title">${svgIcon(ICONS.network)}${this._t("network")}</div>
      <div class="net">
        ${tile(sc.lan_down, "down", ICONS.down, this._t("download"))}
        ${tile(sc.lan_up, "up", ICONS.up, this._t("upload"))}
      </div>
    </div>`;
  }

  // 24 h of 5-minute means from the recorder's statistics, fetched again every 5 minutes. Returns what is
  // already there (nothing at first): the card renders again when the answer comes.
  _history(ids) {
    const key = ids.join(",");
    if (key && this._hass.callWS && (this._histKey !== key || Date.now() - this._histAt > HIST_REFRESH)) {
      this._histKey = key;
      this._histAt = Date.now();
      this._hass
        .callWS({
          type: "recorder/statistics_during_period",
          start_time: new Date(Date.now() - 864e5).toISOString(),
          statistic_ids: ids,
          period: "5minute",
          types: ["mean"],
        })
        .then((r) => {
          if (this._histKey !== key) return;
          this._hist = Object.fromEntries(ids.map((id) => [id, (r?.[id] || []).map((p) => p.mean).filter(Number.isFinite)]));
          this._update();
        })
        // No statistics (sensor without state_class, recorder off): try again in a minute, no sparkline meanwhile.
        .catch(() => {
          this._histAt = Date.now() - HIST_REFRESH + 60000;
        });
    }
    return this._histKey === key ? this._hist : null;
  }

  _volumes(nas) {
    const rows = [];
    // Volume numbers start again in each pool: with several pools, the fallback name carries the pool number.
    const multi = Object.keys(nas.pools).length > 1;
    for (const [pn, pool] of Object.entries(nas.pools)) {
      const raid = this._text(pool.level);
      for (const [vn, vol] of Object.entries(pool.volumes)) {
        const u = volumeUsage(this._hass, vol);
        const status = this._s(vol.status) || this._s(vol.health);
        const label = this._text(vol.label) || vol.labelText || `Volume ${multi ? `${pn}-${vn}` : vn}`;
        const fs = this._text(vol.filesystem);
        const cls = level(u.pct, 80, 90);
        rows.push(`<div class="vol clickable ${cls}" role="button" tabindex="0" data-key="${esc(`${pn}-${vn}`)}" data-entity="${vol.used_size_raw || vol.used_size || vol.used_pct || ""}">
          <div class="row">
            <span class="dot ${dotClass(status)}" title="${esc(this._dotTitle(status))}"></span>
            <span class="grow">${esc(label)}</span>
            ${raid ? `<span class="tag">${esc(raid)}</span>` : ""}
            ${fs ? `<span class="tag">${esc(fs)}</span>` : ""}
          </div>
          <div class="bar"><div style="width:${u.pct ?? 0}%"></div></div>
          <div class="detail">
            <span>${fmtBytes(u.used)} ${this._t("used")} ${this._t("of")} ${fmtBytes(u.total)}</span>
            <span>${u.pct === null ? "" : `${u.pct.toFixed(0)}%`}</span>
          </div>
        </div>`);
      }
    }
    if (!rows.length) return "";
    return `<div><div class="section-title">${svgIcon(ICONS.database)}${this._t("volumes")}</div>${rows.join("")}</div>`;
  }

  _disks(nas) {
    const items = [];
    for (const [pn, pool] of Object.entries(nas.pools)) {
      for (const [dn, d] of Object.entries(pool.disks)) {
        const status = this._s(d.status);
        const temp = temperature(this._s(d.temperature), this._hass);
        const hours = num(this._s(d.power_on_hours));
        const size = toBytes(this._s(d.size));
        items.push(`<div class="disk clickable" role="button" tabindex="0" data-key="${esc(`${pn}-${dn}`)}" data-entity="${d.temperature || d.status || ""}">
          <div class="top">${svgIcon(ICONS.disk)}<span>${esc(this._text(d.label) || d.labelText || `Disk ${dn}`)}</span>
            <span class="dot ${dotClass(status)}" title="${esc(this._dotTitle(status))}"></span></div>
          <div class="model">${esc(this._text(d.model) || d.modelText || "")}</div>
          <div class="meta">
            <span class="temp ${level(temp.c, 60, 70)}">${temp.text}</span>
            <span class="muted">${size !== null ? fmtBytes(size) : ""}${
              hours !== null ? ` · ${Math.round(hours).toLocaleString(fmtLang(this._hass, this._config))} ${this._t("hours")}` : ""
            }</span>
          </div>
        </div>`);
      }
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
      )}</div><div class="v">${rpm === null ? "—" : `${Math.round(rpm)} rpm`}</div></div></div>`;
    });
    return `<div><div class="section-title">${svgIcon(ICONS.fan)}${this._t("fans")}</div><div class="fans">${tiles.join(
      ""
    )}</div></div>`;
  }
}

// ---------------------------------------------------------------------------
// Mini card
// ---------------------------------------------------------------------------

const MINI_STYLE = `
  .nas { height: 44px; width: auto; flex: none; max-width: 35%; object-fit: contain; }
  .nas-link { max-width: 35%; }
  /* The status shows in the footer. */
  .titles > .chip { display: none; }
  .name { font-size: 16px; }
  .content { padding: 0 12px 12px; display: flex; flex-direction: column; gap: 8px; }
  /* One label column for all the rows, as wide as the longest label (subgrid); without subgrid, the fixed columns. */
  .metrics { display: grid; grid-template-columns: 18px minmax(64px, max-content) minmax(0, 1fr) 56px; gap: 8px; }
  .metric { grid-column: 1 / -1; display: grid; grid-template-columns: 18px 64px 1fr 56px; grid-template-columns: subgrid;
            align-items: center; gap: 8px; font-size: 13px; }
  .metric > span:first-of-type { white-space: nowrap; }
  .metric .icon { color: var(--secondary-text-color); }
  .metric .v { text-align: right; font-weight: 500; }
  /* The items wrap rather than truncate the status when they do not fit on one line. */
  .foot { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 4px 8px; font-size: 12px; color: var(--secondary-text-color); margin-top: 2px; }
  .foot span { display: inline-flex; align-items: center; gap: 2px; white-space: nowrap; }
  .foot > span { flex: none; }
  .foot > [data-key="status"] { flex: 0 1 auto; min-width: 0; overflow: hidden; }
  .foot > [data-key="network"] { flex: 0 1 auto; min-width: 0; flex-wrap: wrap; justify-content: flex-end; column-gap: 8px; }
  .foot .txt { display: block; min-width: 0; overflow: hidden; text-overflow: ellipsis; }
  .foot .icon { width: 14px; height: 14px; }
  /* Narrow mini card: the uptime goes first, then the picture. */
  @container (max-width: 340px) { .foot [data-key="uptime"] { display: none; } }
  @container (max-width: 220px) { .nas-link { display: none; } .header > .nas { display: none; } }
  /* Very narrow mini card (6 columns on a phone, about 156 px): icon, bar and value; the label stays for screen
     readers (and in the row's title). */
  @container (max-width: 200px) {
    .metrics { grid-template-columns: 18px minmax(0, 1fr) auto; }
    .metric { grid-template-columns: 18px minmax(0, 1fr) auto; grid-template-columns: subgrid; position: relative; }
    .metric > span:first-of-type { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
  }
`;

// The mini card extends the full card: its zoom button (top right, `zoom: false` removes it) switches it to the
// full card's content, same configuration, and back; a click anywhere outside the card brings it back too.
class NasMiniCard extends NasCard {
  static getConfigElement() {
    return document.createElement("nas-mini-card-editor");
  }

  constructor() {
    super();
    this._zoomed = false;
    this.shadowRoot.addEventListener("click", (ev) => this._zoomClick(ev));
    // A click outside the card, and not in a dialog opened from it, brings it back to the compact view.
    this._onOutside = (ev) => {
      if (this._zoomed && !ev.composedPath().includes(this) && !inDialog(ev)) this._setZoom(false);
    };
  }

  connectedCallback() {
    document.addEventListener("click", this._onOutside, true);
  }

  disconnectedCallback() {
    document.removeEventListener("click", this._onOutside, true);
  }

  getCardSize() {
    return this._zoomed ? super.getCardSize() : 3;
  }

  getGridOptions() {
    return this._zoomed ? super.getGridOptions() : { columns: 6, min_columns: 6 };
  }

  _setZoom(zoomed) {
    this._zoomed = zoomed;
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

  _metric(id, icon, label, pct, display, cls) {
    // Rows without an entity (the aggregated storage row) open no more-info: not focusable.
    const act = id ? ` role="button" tabindex="0" data-entity="${id}"` : "";
    // The title gives the label back on a very narrow card, where only the icon shows.
    return `<div class="metric ${id ? "clickable " : ""}${cls}"${act} title="${esc(label)}">
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
    const rows = [];
    rows.push(this._metric(sc.cpu_usage, ICONS.cpu, this._t("cpu"), cpu, cpu === null ? "—" : `${Math.round(cpu)}%`, level(cpu, 70, 90)));
    rows.push(this._metric(sc.ram_usage, ICONS.ram, this._t("ram"), ram, ram === null ? "—" : `${Math.round(ram)}%`, level(ram, 80, 95)));
    rows.push(
      this._metric(tempId, ICONS.temp, this._t("temperature"), temp, tempText, level(temp, 75, 90))
    );
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
        rows.push(this._metric("", ICONS.database, this._t("storage"), pct, `${pct.toFixed(0)}%`, level(pct, 80, 90)));
    }
    const foot = [];
    if (status) {
      // The full text in title and aria-label too: on a narrow card, the visible one may be truncated.
      const text = esc(this._statusText(status, nas.brand));
      foot.push(
        `<span class="clickable ${this._statusClass(nas, status)}" role="button" tabindex="0" data-key="status" data-entity="${status.entity_id}" title="${text}" aria-label="${text}"><span class="dot"></span>&nbsp;<span class="txt">${text}</span></span>`
      );
    }
    if (c.show_network !== false && (sc.lan_down || sc.lan_up))
      // Each rate stays on one line; on a very narrow card, the upload rate goes under the download rate.
      foot.push(
        `<span class="clickable" role="button" tabindex="0" data-key="network" data-entity="${sc.lan_down || sc.lan_up}"><span class="rate">${svgIcon(ICONS.down)}${fmtRate(toBps(this._s(sc.lan_down)))}</span><span class="rate">${svgIcon(
          ICONS.up
        )}${fmtRate(toBps(this._s(sc.lan_up)))}</span></span>`
      );
    const runtime = num(this._s(sc.runtime)) ?? bootAge(this._s(sc.boot));
    if (runtime !== null) foot.push(`<span data-key="uptime">${svgIcon(ICONS.timer)}${fmtUptime(runtime, this._hass, this._config)}</span>`);
    return `<style>${BASE_STYLE}${MINI_STYLE}</style>
      <ha-card>
        ${this._header(nas)}
        <div class="content">
          <div class="metrics">${rows.join("")}</div>
          ${foot.length ? `<div class="foot">${foot.join("")}</div>` : ""}
        </div>
      </ha-card>`;
  }
}

// ---------------------------------------------------------------------------
// Visual editors (ha-form)
// ---------------------------------------------------------------------------

class NasEditorBase extends HTMLElement {
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
    return ["show_image", ...this.constructor.toggles];
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
      {
        type: "grid",
        name: "",
        schema: [
          { name: "show_image", selector: { boolean: {} } },
          ...this.constructor.toggles.map((name) => ({ name, selector: { boolean: {} } })),
        ],
      },
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

  _render() {
    if (!this._hass || !this._config) return;
    if (!this._form) {
      this._form = document.createElement("ha-form");
      this._form.computeLabel = (s) => t(this._hass, this._config, s.name);
      this._form.computeHelper = (s) => STRINGS[lang(this._hass, this._config)][`${s.name}_helper`];
      this._form.addEventListener("value-changed", (ev) => {
        ev.stopPropagation();
        const config = { ...ev.detail.value };
        for (const [k, v] of Object.entries(config)) {
          // Keep the YAML minimal: drop empty values and toggles left at their default (true).
          if (v === "" || v === undefined || v === null || (this._toggles().includes(k) && v === true)) delete config[k];
        }
        this._config = config;
        this.dispatchEvent(new CustomEvent("config-changed", { detail: { config }, bubbles: true, composed: true }));
      });
      this.appendChild(this._form);
    }
    const data = { ...this._config };
    for (const name of this._toggles()) if (data[name] === undefined) data[name] = true;
    // Without nas (hand-written YAML), show the NAS the card shows: saving the form then keeps it.
    if (!data.nas && this._hass) data.nas = discover(this._hass, "").nasId || undefined;
    this._form.hass = this._hass;
    this._form.data = data;
    this._form.schema = this._schema();
  }
}

class NasCardEditor extends NasEditorBase {
  static get toggles() {
    return ["show_system", "show_network", "show_history", "show_volumes", "show_disks", "show_fans"];
  }
}

class NasMiniCardEditor extends NasEditorBase {
  static get toggles() {
    return ["show_storage", "show_network", "zoom"];
  }
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

const define = (name, cls) => {
  if (!customElements.get(name)) customElements.define(name, cls);
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
