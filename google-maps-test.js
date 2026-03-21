const GOOGLE_MAPS_API_KEY = 'AIzaSyC7XqvddiUy5weRDwsGBpVfW0sodNr9kUw';
const BOUNDARY_SOURCE = 'https://json.uoga.workers.dev/hunt-boundaries';
const HUNT_DATA_SOURCES = [
  './data/Utah_Hunt_Planner_Master_BuckDeer_Pages_43_53.json',
  './data/Utah_Hunt_Planner_Master_Pronghorn.json',
  './data/Utah_Hunt_Planner_Master_Moose.json',
  './data/Utah_Hunt_Planner_Master_BighornSheep.json',
  './data/Utah_Hunt_Planner_Master_MountainGoat.json',
  './data/Utah_Hunt_Planner_Master_Bison.json',
  './data/Utah_Hunt_Planner_Master_BlackBear.json',
  './data/Utah_Hunt_Planner_Master_BullElk.json',
  './data/Utah_Hunt_Planner_Master_GeneralElk.json',
  './data/Utah_Hunt_Planner_Master_SpikeElk.json',
  './data/Utah_Hunt_Planner_Master_SpecialElk.json',
  './data/Utah_Hunt_Planner_Master_AntlerlessElk.json'
];

let map;
let huntData = [];
let boundaryData = null;
let visibleFeatureIds = new Set();
let infoWindow;

const speciesFilter = document.getElementById('speciesFilter');
const searchInput = document.getElementById('searchInput');
const mapTypeSelect = document.getElementById('mapTypeSelect');
const resetBtn = document.getElementById('resetBtn');
const statsText = document.getElementById('statsText');
const selectedText = document.getElementById('selectedText');
const huntList = document.getElementById('huntList');
const selectedTitleMap = document.getElementById('selectedTitleMap');
const selectedMetaMap = document.getElementById('selectedMetaMap');
const huntCountMap = document.getElementById('huntCountMap');

function safe(v) {
  return String(v ?? '');
}

function firstNonEmpty(...values) {
  for (const value of values) {
    const text = safe(value).trim();
    if (text) return text;
  }
  return '';
}

function escapeHtml(v) {
  return safe(v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getHuntCode(h) {
  return firstNonEmpty(h.huntCode, h.code);
}

function getHuntTitle(h) {
  return firstNonEmpty(h.title, getHuntCode(h));
}

function getUnitName(h) {
  return firstNonEmpty(h.unitName, h.unitCode);
}

function getSpecies(h) {
  return firstNonEmpty(h.species);
}

function getDates(h) {
  return firstNonEmpty(h.seasonLabel, h.seasonDates);
}

function getBoundaryIds(h) {
  return safe(firstNonEmpty(h.boundaryId, h.BoundaryID))
    .split(',')
    .map(v => v.trim())
    .filter(Boolean);
}

function getFilteredHunts() {
  const species = safe(speciesFilter.value);
  const search = safe(searchInput.value).trim().toLowerCase();

  return huntData.filter(hunt => {
    const speciesOk = species === 'All Species' || getSpecies(hunt) === species;
    const haystack = [
      getHuntCode(hunt),
      getHuntTitle(hunt),
      getUnitName(hunt),
      getSpecies(hunt)
    ].join(' ').toLowerCase();
    const searchOk = !search || haystack.includes(search);
    return speciesOk && searchOk;
  });
}

function populateSpecies() {
  const species = Array.from(new Set(huntData.map(getSpecies).filter(Boolean))).sort();
  speciesFilter.innerHTML = [
    '<option value="All Species">All Species</option>',
    ...species.map(value => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`)
  ].join('');
}

function renderStats() {
  const filtered = getFilteredHunts();
  statsText.innerHTML = [
    `${huntData.length} hunt records loaded.`,
    `${filtered.length} hunts match current filters.`,
    `${visibleFeatureIds.size} boundary polygons drawn.`
  ].join('<br>');
  if (huntCountMap) huntCountMap.textContent = String(filtered.length);
}

function renderHuntList(list) {
  if (!list.length) {
    huntList.innerHTML = 'No hunts match the current filters.';
    return;
  }

  const shown = list.slice(0, 30);
  huntList.innerHTML = shown.map(hunt => `
    <div class="hunt-card">
      <div><strong>${escapeHtml(getHuntTitle(hunt))}</strong></div>
      <div>${escapeHtml(getUnitName(hunt))}</div>
      <div>${escapeHtml(getSpecies(hunt))}</div>
      <div>${escapeHtml(getDates(hunt) || 'Season unavailable')}</div>
      <button type="button" data-hunt-code="${escapeHtml(getHuntCode(hunt))}">Zoom To Hunt</button>
    </div>
  `).join('');
}

function setSelectedText(html) {
  selectedText.innerHTML = html;
}

function setOverlaySelection(title, meta) {
  if (selectedTitleMap) selectedTitleMap.textContent = safe(title).trim() || 'No hunt selected';
  if (selectedMetaMap) selectedMetaMap.textContent = safe(meta).trim() || 'Click a hunt boundary to inspect it.';
}

function buildVisibleBoundarySet(filteredHunts) {
  const ids = new Set();
  filteredHunts.forEach(hunt => {
    getBoundaryIds(hunt).forEach(id => ids.add(id));
  });
  return ids;
}

function refreshMapData() {
  const filtered = getFilteredHunts();
  visibleFeatureIds = buildVisibleBoundarySet(filtered);

  map.data.setStyle(feature => {
    const id = safe(feature.getProperty('BoundaryID')).trim();
    if (!visibleFeatureIds.has(id)) {
      return {
        visible: false
      };
    }

    return {
      visible: true,
      fillColor: '#d08d4f',
      fillOpacity: 0.18,
      strokeColor: '#8f4d22',
      strokeWeight: 2
    };
  });

  renderStats();
  renderHuntList(filtered);
}

function zoomToHunt(huntCode) {
  const hunt = huntData.find(item => getHuntCode(item) === huntCode);
  if (!hunt) return;

  const ids = new Set(getBoundaryIds(hunt));
  const bounds = new google.maps.LatLngBounds();
  let hasBounds = false;

  map.data.forEach(feature => {
    const id = safe(feature.getProperty('BoundaryID')).trim();
    if (!ids.has(id)) return;

    feature.getGeometry().forEachLatLng(latLng => {
      bounds.extend(latLng);
      hasBounds = true;
    });
  });

  setSelectedText([
    `<strong>${escapeHtml(getHuntTitle(hunt))}</strong>`,
    escapeHtml(getUnitName(hunt)),
    escapeHtml(getSpecies(hunt)),
    escapeHtml(getDates(hunt) || 'Season unavailable')
  ].join('<br>'));
  setOverlaySelection(
    getHuntTitle(hunt),
    [getUnitName(hunt), getSpecies(hunt), getDates(hunt) || 'Season unavailable'].join(' • ')
  );

  if (hasBounds) map.fitBounds(bounds);
}

function attachBoundaryEvents() {
  map.data.addListener('click', event => {
    const boundaryId = safe(event.feature.getProperty('BoundaryID')).trim();
    const boundaryName = safe(event.feature.getProperty('Boundary_Name')).trim();
    const matches = getFilteredHunts().filter(hunt => getBoundaryIds(hunt).includes(boundaryId));

    const html = [
      `<strong>${escapeHtml(boundaryName || 'Selected boundary')}</strong>`,
      `${matches.length} matching hunt(s)`
    ];

    if (matches[0]) {
      html.push(escapeHtml(getHuntTitle(matches[0])));
      html.push(escapeHtml(getDates(matches[0]) || 'Season unavailable'));
      setOverlaySelection(
        getHuntTitle(matches[0]),
        [boundaryName || getUnitName(matches[0]), getSpecies(matches[0]), getDates(matches[0]) || 'Season unavailable'].join(' • ')
      );
    } else {
      setOverlaySelection(boundaryName || 'Selected boundary', `${matches.length} matching hunt(s)`);
    }

    setSelectedText(html.join('<br>'));

    const popupHtml = [
      `<div style="font-family:Georgia,serif;min-width:220px;">`,
      `<strong>${escapeHtml(boundaryName || 'Selected boundary')}</strong><br>`,
      `${matches.length} matching hunt(s)`,
      matches.slice(0, 5).map(hunt => `<div style="margin-top:6px;">${escapeHtml(getHuntTitle(hunt))}</div>`).join(''),
      `</div>`
    ].join('');

    infoWindow.setContent(popupHtml);
    infoWindow.setPosition(event.latLng);
    infoWindow.open({ map });
  });
}

async function loadHuntData() {
  const all = [];

  for (const path of HUNT_DATA_SOURCES) {
    try {
      const response = await fetch(path, { cache: 'no-store' });
      if (!response.ok) continue;
      const json = await response.json();
      const records = Array.isArray(json.records) ? json.records : [];
      all.push(...records);
    } catch (err) {
      console.warn('Skipped data source:', path, err);
    }
  }

  const seen = new Set();
  huntData = all.filter(record => {
    const key = [
      getHuntCode(record),
      getUnitName(record),
      firstNonEmpty(record.weapon),
      getDates(record),
      firstNonEmpty(record.boundaryId)
    ].join('||');

    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function loadBoundaryData() {
  const response = await fetch(BOUNDARY_SOURCE, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Boundary load failed: ${response.status}`);
  boundaryData = await response.json();
}

function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: { lat: 39.3, lng: -111.7 },
    zoom: 6,
    mapTypeId: mapTypeSelect.value,
    fullscreenControl: true,
    streetViewControl: false,
    mapTypeControl: true
  });

  infoWindow = new google.maps.InfoWindow();
  map.data.addGeoJson(boundaryData);
  attachBoundaryEvents();
  refreshMapData();
}

function wireEvents() {
  speciesFilter.addEventListener('change', refreshMapData);
  searchInput.addEventListener('input', refreshMapData);
  mapTypeSelect.addEventListener('change', () => {
    map.setMapTypeId(mapTypeSelect.value);
  });
  resetBtn.addEventListener('click', () => {
    speciesFilter.value = 'All Species';
    searchInput.value = '';
    mapTypeSelect.value = 'roadmap';
    map.setMapTypeId('roadmap');
    map.setCenter({ lat: 39.3, lng: -111.7 });
    map.setZoom(6);
    setSelectedText('Click a hunt boundary to inspect it.');
    setOverlaySelection('No hunt selected', 'Click a hunt boundary to inspect it.');
    refreshMapData();
  });
  huntList.addEventListener('click', event => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const button = target.closest('button[data-hunt-code]');
    if (!button) return;
    zoomToHunt(button.getAttribute('data-hunt-code'));
  });
}

function loadGoogleMapsScript() {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(GOOGLE_MAPS_API_KEY)}`;
    script.async = true;
    script.defer = true;
    script.onload = resolve;
    script.onerror = () => reject(new Error('Google Maps failed to load.'));
    document.head.appendChild(script);
  });
}

(async function init() {
  try {
    await Promise.all([loadHuntData(), loadBoundaryData(), loadGoogleMapsScript()]);
    populateSpecies();
    initMap();
    wireEvents();
    setOverlaySelection('No hunt selected', 'Click a hunt boundary to inspect it.');
  } catch (err) {
    console.error(err);
    statsText.textContent = 'Google Maps test failed to initialize.';
    setSelectedText('Initialization failed. Check the API key, billing, and browser console.');
    setOverlaySelection('Initialization failed', 'Check the API key, billing, and browser console.');
    huntList.textContent = safe(err.message || err);
  }
})();
