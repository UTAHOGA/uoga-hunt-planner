// -----------------------------
// Data stores
// -----------------------------
let huntData = [];
let selectedHunt = null;
let selectedUnit = null;

const outfitters = [
  {
    listingName: 'Wild Eyez Outfitters',
    listingType: 'Outfitter',
    certLevel: 'CPO',
    verificationStatus: 'Verified',
    website: 'https://www.wildeyez.net',
    phone: '4358516480',
    email: 'tyler@wildeyez.net',
    species: 'Elk, Mule Deer',
    region: 'Utah',
    city: 'Manti',
    unitsServed: 'beaver-east,fishlake',
    forestDistricts: 'Fishlake NF - Richfield; Manti-La Sal NF - Sanpete'
  }
];

// -----------------------------
// DOM refs
// -----------------------------
const searchInput = document.getElementById('searchInput');
const speciesFilter = document.getElementById('speciesFilter');
const sexFilter = document.getElementById('sexFilter');
const weaponFilter = document.getElementById('weaponFilter');
const huntTypeFilter = document.getElementById('huntTypeFilter');
const unitFilter = document.getElementById('unitFilter');
const basemapSelect = document.getElementById('basemapSelect');

const toggleLiveUnits = document.getElementById('toggleLiveUnits');
const toggleUnits = document.getElementById('toggleUnits');
const toggleUSFS = document.getElementById('toggleUSFS');
const toggleBLM = document.getElementById('toggleBLM');
const toggleSITLA = document.getElementById('toggleSITLA');
const toggleState = document.getElementById('toggleState');
const togglePrivate = document.getElementById('togglePrivate');

const toggleOutfitters = document.getElementById('toggleOutfitters');
const toggleCPO = document.getElementById('toggleCPO');
const toggleCPG = document.getElementById('toggleCPG');

const openBoundaryBtn = document.getElementById('openBoundaryBtn');
const resetBtn = document.getElementById('resetBtn');

const selectedTitle = document.getElementById('selectedTitle');
const selectedMeta = document.getElementById('selectedMeta');
const huntResultsEl = document.getElementById('huntResults');
const resultsEl = document.getElementById('results');
const areaInfoEl = document.getElementById('areaInfo');
const clickInfoEl = document.getElementById('clickInfo');

// -----------------------------
// Helpers
// -----------------------------
function safe(value) {
  return String(value ?? '');
}

function escapeHtml(value) {
  return safe(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function normalizeUrl(url) {
  const raw = safe(url).trim();
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw)) return raw;
  return `https://${raw}`;
}

function formatPhone(phone) {
  const digits = safe(phone).replace(/\D/g, '');
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return safe(phone);
}

function slugify(value) {
  return safe(value)
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function firstNonEmpty(...values) {
  for (const value of values) {
    const s = safe(value).trim();
    if (s) return s;
  }
  return '';
}

function firstFinite(...values) {
  for (const value of values) {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

// -----------------------------
// Hunt field mappers
// -----------------------------
function getHuntTitle(h) {
  return firstNonEmpty(
    h.title,
    h.Title,
    h.huntTitle,
    h.hunt_title,
    h.name,
    h.Name,
    h.huntCode,
    h.hunt_code,
    h.HuntCode
  );
}

function getHuntCode(h) {
  return firstNonEmpty(
    h.huntCode,
    h.hunt_code,
    h.HuntCode,
    h.code,
    h.Code,
    h.huntId,
    h.hunt_id
  );
}

function getSpeciesRaw(h) {
  return firstNonEmpty(
    h.species,
    h.Species,
    h.SPECIES,
    h.animal,
    h.Animal,
    h.ANIMAL
  );
}

function getSpeciesList(h) {
  const raw = getSpeciesRaw(h);
  if (!raw) return [];
  return raw
    .split(',')
    .map(v => v.trim())
    .filter(Boolean);
}

function getSex(h) {
  return firstNonEmpty(h.sex, h.Sex, h.SEX, h.gender, h.Gender);
}

function getWeapon(h) {
  return firstNonEmpty(
    h.weapon,
    h.Weapon,
    h.WEAPON,
    h.weaponType,
    h.weapon_type
  );
}

function getHuntType(h) {
  return firstNonEmpty(
    h.huntType,
    h.HuntType,
    h.hunt_type,
    h.type,
    h.Type
  );
}

function getSeasonDates(h) {
  return firstNonEmpty(
    h.seasonDates,
    h.SeasonDates,
    h.dates,
    h.Dates,
    h.dateRange,
    h.date_range
  );
}

function getRegion(h) {
  return firstNonEmpty(h.region, h.Region, h.REGION, h.area, h.Area);
}

function getUnitCode(h) {
  return firstNonEmpty(
    h.unitCode,
    h.unit_code,
    h.UnitCode,
    h.UNIT_CODE,
    h.unit,
    h.Unit,
    h.UNIT,
    h.unitId,
    h.unit_id
  );
}

function getUnitName(h) {
  return firstNonEmpty(
    h.unitName,
    h.unit_name,
    h.UnitName,
    h.UNIT_NAME,
    h.areaName,
    h.area_name,
    h.AreaName,
    getUnitCode(h)
  );
}

function getUnitValue(h) {
  return firstNonEmpty(getUnitCode(h), getUnitName(h));
}

function getHuntLat(h) {
  return firstFinite(
    h.centroidLat,
    h.centerLat,
    h.lat,
    h.latitude,
    h.Latitude,
    h.y,
    h.Y,
    h.CENTER_LAT,
    h.CENTROID_LAT
  );
}

function getHuntLng(h) {
  return firstFinite(
    h.centroidLng,
    h.centerLng,
    h.lng,
    h.lon,
    h.longitude,
    h.Longitude,
    h.x,
    h.X,
    h.CENTER_LON,
    h.CENTROID_LON
  );
}

// -----------------------------
// Map + layers
// -----------------------------
const map = L.map('map', { zoomControl: true }).setView([39.3, -111.7], 6);

const basemaps = {
  osm: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap'
  }),
  topo: L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
    maxZoom: 17,
    attribution: '&copy; OpenTopoMap'
  }),
  sat: L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    {
      maxZoom: 19,
      attribution: 'Tiles &copy; Esri'
    }
  )
};

basemaps.osm.addTo(map);

const unitCenterLayer = L.layerGroup().addTo(map);
const outfitterLayer = L.layerGroup().addTo(map);
// -----------------------------
// LIVE UTAH HUNT UNIT BOUNDARIES
// -----------------------------

liveHuntUnitsLayer = L.esri.featureLayer({
url: "https://dwrmapserv.utah.gov/arcgis/rest/services/hunt/Boundaries_and_Tables/MapServer/0",

style: function () {
return {
color: "#000",
weight: 1,
fillColor: "#ffc000",
fillOpacity: 0.25
};
}
});

liveHuntUnitsLayer.addTo(map);
const sitlaLayer = L.layerGroup().addTo(map);
const stateLayer = L.layerGroup().addTo(map);
const privateLayer = L.layerGroup().addTo(map);

let liveHuntUnitsLayer = null;
let usfsDistrictLayer = null;
let blmDistrictLayer = null;

// -----------------------------
// Load hunt data
// -----------------------------
async function loadHuntData() {
  const response = await fetch('./data/Utah_Hunt_Planner_Master_BuckDeer_Pages_43_53.json');

  if (!response.ok) {
    throw new Error(`Failed to load hunt data: ${response.status}`);
  }

  const data = await response.json();
  console.log('RAW JSON:', data);

  if (Array.isArray(data)) {
    huntData = data;
  } else if (Array.isArray(data.records)) {
    huntData = data.records;
  } else if (Array.isArray(data.data)) {
    huntData = data.data;
  } else if (Array.isArray(data.features)) {
    huntData = data.features.map(f => f.properties || f);
  } else {
    huntData = [];
    console.error('No usable array found in hunt JSON.');
  }

  console.log('Loaded hunts:', huntData.length);
  if (huntData.length) {
    console.log('First hunt record:', huntData[0]);
    console.log('First hunt keys:', Object.keys(huntData[0]));
  }
}

// -----------------------------
// Filtering
// -----------------------------
function getFilteredHunts() {
  const search = safe(searchInput?.value).trim().toLowerCase();
  const species = safe(speciesFilter?.value || 'All Species');
  const sex = safe(sexFilter?.value || 'All');
  const weapon = safe(weaponFilter?.value || 'All');
  const huntType = safe(huntTypeFilter?.value || 'All');
  const unitValue = safe(unitFilter?.value || '');

  return huntData.filter(h => {
    const title = getHuntTitle(h).toLowerCase();
    const huntCode = getHuntCode(h).toLowerCase();
    const unitName = getUnitName(h).toLowerCase();
    const unitCode = getUnitCode(h).toLowerCase();
    const speciesList = getSpeciesList(h).map(s => s.toLowerCase());
    const sexValue = getSex(h).toLowerCase();
    const weaponValue = getWeapon(h).toLowerCase();
    const huntTypeValue = getHuntType(h).toLowerCase();

    const matchSearch =
      !search ||
      title.includes(search) ||
      huntCode.includes(search) ||
      unitName.includes(search) ||
      unitCode.includes(search);

    const matchSpecies =
      species === 'All Species' ||
      speciesList.includes(species.toLowerCase());

    const matchSex =
      sex === 'All' ||
      sexValue === sex.toLowerCase();

    const matchWeapon =
      weapon === 'All' ||
      weaponValue === weapon.toLowerCase();

    const matchHuntType =
      huntType === 'All' ||
      huntTypeValue === huntType.toLowerCase();

    const matchUnit =
      !unitValue ||
      getUnitValue(h) === unitValue ||
      getUnitName(h) === unitValue ||
      getUnitCode(h) === unitValue;

    return (
      matchSearch &&
      matchSpecies &&
      matchSex &&
      matchWeapon &&
      matchHuntType &&
      matchUnit
    );
  });
}

// -----------------------------
// Dropdowns
// -----------------------------
function populateSpecies() {
  if (!speciesFilter) return;

  const existingValue = speciesFilter.value || 'All Species';
  const speciesSet = new Set(['All Species']);

  huntData.forEach(h => {
    getSpeciesList(h).forEach(s => {
      if (s) speciesSet.add(s);
    });
  });

  const options = Array.from(speciesSet).sort((a, b) => {
    if (a === 'All Species') return -1;
    if (b === 'All Species') return 1;
    return a.localeCompare(b);
  });

  console.log('Species options:', options);

  speciesFilter.innerHTML = options
    .map(s => `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`)
    .join('');

  if (options.includes(existingValue)) {
    speciesFilter.value = existingValue;
  } else {
    speciesFilter.value = 'All Species';
  }
}

function populateUnits() {
  if (!unitFilter) return;

  const existingValue = unitFilter.value;
  const units = new Map();

  getFilteredHunts().forEach(h => {
    const value = getUnitValue(h);
    const label = getUnitName(h) || value;

    if (!value) return;
    if (!units.has(value)) units.set(value, label);
  });

  const options = Array.from(units.entries()).sort((a, b) => {
    return a[1].localeCompare(b[1]);
  });

  console.log('Unit options:', options);

  unitFilter.innerHTML = [
    '<option value="">All Units</option>',
    ...options.map(([value, label]) => {
      return `<option value="${escapeHtml(value)}">${escapeHtml(label)}</option>`;
    })
  ].join('');

  if (options.some(([value]) => value === existingValue)) {
    unitFilter.value = existingValue;
  } else {
    unitFilter.value = '';
  }
}

// -----------------------------
// Outfitter matching
// -----------------------------
function getSelectedOutfitters() {
  if (!selectedHunt) return [];

  const unitCodeSlug = slugify(getUnitCode(selectedHunt));
  const unitNameSlug = slugify(getUnitName(selectedHunt));
  const unitValueSlug = slugify(getUnitValue(selectedHunt));

  return outfitters
    .filter(o => {
      const served = safe(o.unitsServed)
        .split(',')
        .map(v => slugify(v));

      return (
        served.includes(unitCodeSlug) ||
        served.includes(unitNameSlug) ||
        served.includes(unitValueSlug)
      );
    })
    .filter(o => {
      const cert = safe(o.certLevel).toUpperCase();
      if (cert === 'CPO' && toggleCPO && !toggleCPO.checked) return false;
      if (cert === 'CPG' && toggleCPG && !toggleCPG.checked) return false;
      return true;
    });
}

// -----------------------------
// ESRI layers
// -----------------------------
function buildLiveHuntUnitsLayer() {
  if (!window.L?.esri) {
    console.warn('Esri Leaflet missing. Live hunt unit layer skipped.');
    return;
  }

  if (liveHuntUnitsLayer) map.removeLayer(liveHuntUnitsLayer);

  liveHuntUnitsLayer = L.esri.featureLayer({
    url: 'https://services.arcgis.com/ZzrwjTRez6FJiOq4/ArcGIS/rest/services/Hunting_Units/FeatureServer/0',
    style: () => ({
      color: '#ffc000',
      weight: 2,
      fillOpacity: 0.08
    })
  });

  liveHuntUnitsLayer.bindPopup(layer => {
    const p = layer.feature?.properties || {};
    const name = firstNonEmpty(p.UNIT_NAME, p.UnitName, p.NAME, 'Utah Hunt Unit');
    return `<b>${escapeHtml(name)}</b><br>Live Utah hunt-unit boundary`;
  });

  if (toggleLiveUnits?.checked) liveHuntUnitsLayer.addTo(map);
}

function buildUSFSLayer() {
  if (!window.L?.esri) {
    console.warn('Esri Leaflet missing. USFS layer skipped.');
    return;
  }

  if (usfsDistrictLayer) map.removeLayer(usfsDistrictLayer);

  usfsDistrictLayer = L.esri.featureLayer({
    url: 'https://apps.fs.usda.gov/arcx/rest/services/EDW/EDW_RangerDistricts_01/MapServer/1',
    style: () => ({
      color: '#4fa3ff',
      weight: 2,
      fillOpacity: 0.03
    })
  });

  usfsDistrictLayer.bindPopup(layer => {
    const p = layer.feature?.properties || {};
    const forest = firstNonEmpty(p.FORESTNAME, 'Forest Service');
    const district = firstNonEmpty(p.DISTRICTNAME, 'Ranger District');
    return `<b>${escapeHtml(forest)}</b><br>${escapeHtml(district)}`;
  });

  if (toggleUSFS?.checked) usfsDistrictLayer.addTo(map);
}

function buildBLMLayer() {
  if (!window.L?.esri) {
    console.warn('Esri Leaflet missing. BLM layer skipped.');
    return;
  }

  if (blmDistrictLayer) map.removeLayer(blmDistrictLayer);

  blmDistrictLayer = L.esri.featureLayer({
    url: 'https://gis.blm.gov/utarcgis/rest/services/AdminBoundaries/BLM_UT_ADMU/FeatureServer/0',
    style: () => ({
      color: '#9b59b6',
      weight: 2,
      fillOpacity: 0.03
    })
  });

  blmDistrictLayer.bindPopup(layer => {
    const p = layer.feature?.properties || {};
    const office = firstNonEmpty(p.ADMIN_UNIT, p.FIELD_OFFICE, p.NAME, 'BLM Utah Administrative Unit');
    return `<b>BLM Utah</b><br>${escapeHtml(office)}`;
  });

  if (toggleBLM?.checked) blmDistrictLayer.addTo(map);
}

function renderOwnershipPlaceholders() {
  sitlaLayer.clearLayers();
  stateLayer.clearLayers();
  privateLayer.clearLayers();

  if (toggleSITLA?.checked) {
    L.circleMarker([39.05, -111.9], {
      radius: 8,
      color: '#58a55c',
      weight: 2,
      fillColor: '#58a55c',
      fillOpacity: 0.35
    })
      .addTo(sitlaLayer)
      .bindPopup('<b>SITLA</b><br>Placeholder layer until real SITLA data is added.');
  }

  if (toggleState?.checked) {
    L.circleMarker([40.1, -111.9], {
      radius: 8,
      color: '#2aa198',
      weight: 2,
      fillColor: '#2aa198',
      fillOpacity: 0.35
    })
      .addTo(stateLayer)
      .bindPopup('<b>State Lands</b><br>Placeholder layer until real state-land data is added.');
  }

  if (togglePrivate?.checked) {
    L.circleMarker([38.9, -111.2], {
      radius: 8,
      color: '#b24b4b',
      weight: 2,
      fillColor: '#b24b4b',
      fillOpacity: 0.35
    })
      .addTo(privateLayer)
      .bindPopup('<b>Private Lands</b><br>Placeholder layer until real private-land data is added.');
  }
}

// -----------------------------
// Rendering
// -----------------------------
function renderUnitCenters() {
  unitCenterLayer.clearLayers();

  if (toggleUnits && !toggleUnits.checked) return;

  const filtered = getFilteredHunts();
  const seen = new Set();

  filtered.forEach(h => {
    const unitValue = getUnitValue(h);
    const unitName = getUnitName(h);
    const lat = getHuntLat(h);
    const lng = getHuntLng(h);

    if (!unitValue) return;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    if (seen.has(unitValue)) return;

    seen.add(unitValue);

    const marker = L.circleMarker([lat, lng], {
      radius: 7,
      color: '#ffc000',
      weight: 2,
      fillColor: '#ffc000',
      fillOpacity: 0.75
    }).addTo(unitCenterLayer);

    marker.bindPopup(`
      <b>${escapeHtml(unitName || unitValue)}</b><br>
      ${escapeHtml(getSpeciesRaw(h))}<br>
      <button type="button" onclick="window.selectUnitByValue(${JSON.stringify(unitValue)})">Select Unit</button>
    `);

    marker.on('click', () => selectUnitByValue(unitValue));
  });
}

function renderHuntResults() {
  if (!huntResultsEl) return;

  const filtered = getFilteredHunts();

  if (!filtered.length) {
    huntResultsEl.innerHTML = '<div class="empty">No hunts match the current filters.</div>';
    return;
  }

  huntResultsEl.innerHTML = filtered.slice(0, 100).map(h => {
    const huntCode = getHuntCode(h);
    const title = getHuntTitle(h) || getUnitName(h) || huntCode || 'Untitled Hunt';
    const unitName = getUnitName(h) || 'Unknown Unit';

    return `
      <div class="result-card">
        <h3>${escapeHtml(title)}</h3>
        <div class="pill-row">
          <span class="pill">${escapeHtml(getSpeciesRaw(h) || 'Species N/A')}</span>
          <span class="pill">${escapeHtml(getSex(h) || 'Sex N/A')}</span>
          <span class="pill">${escapeHtml(getWeapon(h) || 'Weapon N/A')}</span>
          <span class="pill">${escapeHtml(getHuntType(h) || 'Type N/A')}</span>
        </div>
        <div class="meta">
          <div><strong>Unit:</strong> ${escapeHtml(unitName)}</div>
          <div><strong>Hunt Code:</strong> ${escapeHtml(huntCode)}</div>
          <div><strong>Dates:</strong> ${escapeHtml(getSeasonDates(h))}</div>
        </div>
        <div class="result-actions">
          <button type="button" class="btn-primary" onclick="window.selectHuntByCode(${JSON.stringify(huntCode)})">
            Select Hunt
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function renderAreaInfo() {
  if (!areaInfoEl) return;

  if (!selectedHunt) {
    areaInfoEl.innerHTML = 'Click a hunt unit or select one from the filter.';
    return;
  }

  areaInfoEl.innerHTML = `
    <strong>Hunt:</strong> ${escapeHtml(getHuntTitle(selectedHunt) || getHuntCode(selectedHunt))}<br>
    <strong>Unit:</strong> ${escapeHtml(getUnitName(selectedHunt) || getUnitValue(selectedHunt))}<br>
    <strong>Species:</strong> ${escapeHtml(getSpeciesRaw(selectedHunt))}<br>
    <strong>Sex:</strong> ${escapeHtml(getSex(selectedHunt))}<br>
    <strong>Weapon:</strong> ${escapeHtml(getWeapon(selectedHunt))}<br>
    <strong>Hunt Type:</strong> ${escapeHtml(getHuntType(selectedHunt))}<br>
    <strong>Dates:</strong> ${escapeHtml(getSeasonDates(selectedHunt))}<br>
    <small>Land-management context depends on the overlays you turn on.</small>
  `;
}

function renderOutfitters() {
  outfitterLayer.clearLayers();

  if (toggleOutfitters && !toggleOutfitters.checked) return;
  if (!selectedHunt) return;

  const matches = getSelectedOutfitters();
  const baseLat = getHuntLat(selectedHunt);
  const baseLng = getHuntLng(selectedHunt);

  if (!Number.isFinite(baseLat) || !Number.isFinite(baseLng)) return;

  matches.forEach((o, idx) => {
    const lat = baseLat + (idx * 0.03);
    const lng = baseLng + (idx * 0.03);

    const marker = L.marker([lat, lng]).addTo(outfitterLayer);

    marker.bindPopup(`
      <b>${escapeHtml(o.listingName)}</b><br>
      ${escapeHtml(o.certLevel)} | ${escapeHtml(o.verificationStatus)}<br>
      ${escapeHtml(o.city)}<br>
      <a href="${escapeHtml(normalizeUrl(o.website))}" target="_blank" rel="noopener noreferrer">Visit Website</a>
    `);
  });
}

function renderOutfitterResults() {
  if (!resultsEl) return;

  if (!selectedHunt) {
    resultsEl.innerHTML = '<div class="empty">Select a hunt or unit to load outfitter results.</div>';
    return;
  }

  const matches = getSelectedOutfitters();

  if (!matches.length) {
    resultsEl.innerHTML = `<div class="empty">No outfitters currently loaded for ${escapeHtml(getUnitName(selectedHunt) || getUnitValue(selectedHunt))}.</div>`;
    return;
  }

  resultsEl.innerHTML = matches.map(o => `
    <div class="result-card">
      <h3>${escapeHtml(o.listingName)}</h3>
      <div class="pill-row">
        <span class="pill cert">${escapeHtml(o.certLevel || 'Member')}</span>
        <span class="pill verified">${escapeHtml(o.verificationStatus || 'Listed')}</span>
      </div>
      <div class="meta">
        <div><strong>City:</strong> ${escapeHtml(o.city)}</div>
        <div><strong>Species:</strong> ${escapeHtml(o.species)}</div>
        <div><strong>Phone:</strong> ${escapeHtml(formatPhone(o.phone))}</div>
        <div><strong>Districts:</strong> ${escapeHtml(o.forestDistricts)}</div>
      </div>
      <div class="result-actions">
        <a href="${escapeHtml(normalizeUrl(o.website))}" target="_blank" rel="noopener noreferrer">
          <button type="button" class="btn-primary">Visit Website</button>
        </a>
      </div>
    </div>
  `).join('');
}

// -----------------------------
// Selection
// -----------------------------
function selectUnitByValue(unitValue) {
  const huntsForUnit = huntData.filter(h => {
    return (
      getUnitValue(h) === unitValue ||
      getUnitName(h) === unitValue ||
      getUnitCode(h) === unitValue
    );
  });

  if (!huntsForUnit.length) return;

  const chosen = huntsForUnit[0];
  selectedHunt = chosen;
  selectedUnit = unitValue;

  if (unitFilter) unitFilter.value = unitValue;
  if (selectedTitle) selectedTitle.textContent = getUnitName(chosen) || unitValue;
  if (selectedMeta) {
    selectedMeta.textContent = [getSpeciesRaw(chosen), getRegion(chosen)].filter(Boolean).join(' • ');
  }

  const lat = getHuntLat(chosen);
  const lng = getHuntLng(chosen);

  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    map.setView([lat, lng], 8);
  }

  renderAreaInfo();
  renderOutfitters();
  renderOutfitterResults();
  renderHuntResults();
}

function selectHuntByCode(huntCode) {
  const hunt = huntData.find(h => getHuntCode(h) === huntCode);
  if (!hunt) return;

  selectedHunt = hunt;
  selectedUnit = getUnitValue(hunt);

  if (unitFilter) unitFilter.value = selectedUnit;
  if (selectedTitle) {
    selectedTitle.textContent = getHuntTitle(hunt) || getUnitName(hunt) || huntCode;
  }
  if (selectedMeta) {
    selectedMeta.textContent = [getSpeciesRaw(hunt), getRegion(hunt)].filter(Boolean).join(' • ');
  }

  const lat = getHuntLat(hunt);
  const lng = getHuntLng(hunt);

  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    map.setView([lat, lng], 8);
  }

  renderAreaInfo();
  renderOutfitters();
  renderOutfitterResults();
  renderHuntResults();
}

window.selectUnitByValue = selectUnitByValue;
window.selectHuntByCode = selectHuntByCode;

// -----------------------------
// Reset
// -----------------------------
function resetPlanner() {
  selectedHunt = null;
  selectedUnit = null;

  if (searchInput) searchInput.value = '';
  if (speciesFilter) speciesFilter.value = 'All Species';
  if (sexFilter) sexFilter.value = 'All';
  if (weaponFilter) weaponFilter.value = 'All';
  if (huntTypeFilter) huntTypeFilter.value = 'All';
  if (unitFilter) unitFilter.value = '';

  populateUnits();

  if (selectedTitle) selectedTitle.textContent = 'No hunt selected';
  if (selectedMeta) {
    selectedMeta.textContent = 'Choose filters or click a hunt unit to load hunt and outfitter results.';
  }

  map.setView([39.3, -111.7], 6);

  renderUnitCenters();
  renderOwnershipPlaceholders();
  renderAreaInfo();
  renderOutfitters();
  renderOutfitterResults();
  renderHuntResults();
}

// -----------------------------
// Events
// -----------------------------
[searchInput, speciesFilter, sexFilter, weaponFilter, huntTypeFilter].forEach(el => {
  if (!el) return;

  const handler = () => {
    populateUnits();
    renderUnitCenters();
    renderHuntResults();
  };

  el.addEventListener('input', handler);
  el.addEventListener('change', handler);
});

if (unitFilter) {
  unitFilter.addEventListener('change', () => {
    if (!unitFilter.value) {
      selectedHunt = null;
      selectedUnit = null;

      if (selectedTitle) selectedTitle.textContent = 'No hunt selected';
      if (selectedMeta) {
        selectedMeta.textContent = 'Choose filters or click a hunt unit to load hunt and outfitter results.';
      }

      renderAreaInfo();
      renderOutfitters();
      renderOutfitterResults();
      renderHuntResults();
      return;
    }

    selectUnitByValue(unitFilter.value);
  });
}

if (basemapSelect) {
  basemapSelect.addEventListener('change', () => {
    Object.values(basemaps).forEach(layer => {
      if (map.hasLayer(layer)) map.removeLayer(layer);
    });

    (basemaps[basemapSelect.value] || basemaps.osm).addTo(map);

    if (toggleLiveUnits?.checked && liveHuntUnitsLayer) liveHuntUnitsLayer.addTo(map);
    if (toggleUSFS?.checked && usfsDistrictLayer) usfsDistrictLayer.addTo(map);
    if (toggleBLM?.checked && blmDistrictLayer) blmDistrictLayer.addTo(map);
  });
}

if (toggleLiveUnits) {
  toggleLiveUnits.addEventListener('change', () => {
    if (!liveHuntUnitsLayer) return;
    if (toggleLiveUnits.checked) liveHuntUnitsLayer.addTo(map);
    else map.removeLayer(liveHuntUnitsLayer);
  });
}

if (toggleUnits) {
  toggleUnits.addEventListener('change', renderUnitCenters);
}

if (toggleUSFS) {
  toggleUSFS.addEventListener('change', () => {
    if (!usfsDistrictLayer) return;
    if (toggleUSFS.checked) usfsDistrictLayer.addTo(map);
    else map.removeLayer(usfsDistrictLayer);
  });
}

if (toggleBLM) {
  toggleBLM.addEventListener('change', () => {
    if (!blmDistrictLayer) return;
    if (toggleBLM.checked) blmDistrictLayer.addTo(map);
    else map.removeLayer(blmDistrictLayer);
  });
}

[toggleSITLA, toggleState, togglePrivate].forEach(el => {
  if (!el) return;
  el.addEventListener('change', renderOwnershipPlaceholders);
});

[toggleOutfitters, toggleCPO, toggleCPG].forEach(el => {
  if (!el) return;
  el.addEventListener('change', () => {
    renderOutfitters();
    renderOutfitterResults();
  });
});

if (openBoundaryBtn) {
  openBoundaryBtn.addEventListener('click', () => {
    window.open('https://dwrapps.utah.gov/huntboundary/hbstart', '_blank', 'noopener,noreferrer');
  });
}

if (resetBtn) {
  resetBtn.addEventListener('click', resetPlanner);
}

map.on('click', e => {
  if (clickInfoEl) {
    clickInfoEl.innerHTML = `
      <strong>Map Click:</strong> ${e.latlng.lat.toFixed(5)}, ${e.latlng.lng.toFixed(5)}
    `;
  }
});

// -----------------------------
// Init
// -----------------------------
(async function init() {
  try {
    if (speciesFilter) {
      speciesFilter.innerHTML = '<option value="All Species">Loading...</option>';
    }
    if (unitFilter) {
      unitFilter.innerHTML = '<option value="">Loading...</option>';
    }

    await loadHuntData();

    populateSpecies();
    populateUnits();

    buildLiveHuntUnitsLayer();
    buildUSFSLayer();
    buildBLMLayer();

    renderUnitCenters();
    renderOwnershipPlaceholders();
    renderAreaInfo();
    renderOutfitters();
    renderOutfitterResults();
    renderHuntResults();

    console.log('App initialized successfully.');
  } catch (err) {
    console.error('App init failed:', err);

    if (speciesFilter) {
      speciesFilter.innerHTML = '<option value="All Species">Load Failed</option>';
    }

    if (unitFilter) {
      unitFilter.innerHTML = '<option value="">Load Failed</option>';
    }

    if (huntResultsEl) {
      huntResultsEl.innerHTML = `<div class="empty">Failed to load hunt data. ${escapeHtml(err.message || String(err))}</div>`;
    }

    if (resultsEl) {
      resultsEl.innerHTML = `<div class="empty">Initialization error: ${escapeHtml(err.message || String(err))}</div>`;
    }

    if (areaInfoEl) {
      areaInfoEl.innerHTML = 'App failed to initialize. Open the browser console and check the error.';
    }
  }
})();
