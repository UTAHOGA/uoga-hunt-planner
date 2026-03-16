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
const huntCountEl = document.getElementById('huntCount');

// -----------------------------
// Helpers
// -----------------------------
function safe(value) {
  return String(value ?? '');
}

function normalizeToken(value) {
  return safe(value).trim().toLowerCase().replace(/\s+/g, ' ');
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

function matchesFilterValue(selectedValue, recordValue) {
  const selected = normalizeToken(selectedValue);
  const record = normalizeToken(recordValue);

  if (!selected || selected === 'all' || selected === 'all species') return true;
  if (!record) return false;
  if (selected === record) return true;

  // Treat Buck/Bull as a parent category that includes Buck/Bull variants.
  if (selected === 'buck/bull' && (record === 'buck' || record === 'bull' || record === 'buck/bull')) {
    return true;
  }

  return record.includes(selected) || selected.includes(record);
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
const sitlaLayer = L.layerGroup().addTo(map);
const stateLayer = L.layerGroup().addTo(map);
const privateLayer = L.layerGroup().addTo(map);

let liveHuntUnitsLayer = null;
let usfsDistrictLayer = null;
let blmDistrictLayer = null;
let huntResultsLimit = 100;
let filteredHuntsCache = { key: null, data: [] };
let filterDebounceTimer = null;

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
function getFilterSignature() {
  return JSON.stringify({
    search: safe(searchInput?.value).trim().toLowerCase(),
    species: safe(speciesFilter?.value || 'All Species'),
    sex: safe(sexFilter?.value || 'All'),
    weapon: safe(weaponFilter?.value || 'All'),
    huntType: safe(huntTypeFilter?.value || 'All'),
    unit: safe(unitFilter?.value || '')
  });
}

function queueFilterRender() {
  if (filterDebounceTimer) {
    window.clearTimeout(filterDebounceTimer);
  }

  filterDebounceTimer = window.setTimeout(() => {
    huntResultsLimit = 100;
    filteredHuntsCache.key = null;
    populateUnits();
    renderUnitCenters();
    renderHuntResults();
  }, 120);
}

function getFilteredHunts() {
  const signature = getFilterSignature();
  if (filteredHuntsCache.key === signature) {
    return filteredHuntsCache.data;
  }

  const search = safe(searchInput?.value).trim().toLowerCase();
  const species = safe(speciesFilter?.value || 'All Species');
  const sex = safe(sexFilter?.value || 'All');
  const weapon = safe(weaponFilter?.value || 'All');
  const huntType = safe(huntTypeFilter?.value || 'All');
  const unitValue = safe(unitFilter?.value || '');

  const filtered = huntData.filter(h => {
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

    const matchSex = matchesFilterValue(sex, sexValue);

    const matchWeapon = matchesFilterValue(weapon, weaponValue);

    const matchHuntType = matchesFilterValue(huntType, huntTypeValue);

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

  filteredHuntsCache = {
    key: signature,
    data: filtered
  };

  return filtered;
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

  const applyFallbackLayer = () => {
    if (liveHuntUnitsLayer) {
      try { map.removeLayer(liveHuntUnitsLayer); } catch (e) { /* noop */ }
    }

    liveHuntUnitsLayer = L.esri.featureLayer({
      url: 'https://services.arcgis.com/ZzrwjTRez6FJiOq4/ArcGIS/rest/services/Hunting_Units/FeatureServer/0',
      style: () => ({
        color: '#ffc000',
        weight: 2,
        fillOpacity: 0.08
      })
    });

    if (toggleLiveUnits?.checked) liveHuntUnitsLayer.addTo(map);
    console.warn('Using fallback live hunt units layer.');
  };

  // Use the official DWR map service as the primary source for live boundaries.
  liveHuntUnitsLayer = L.esri.dynamicMapLayer({
    url: 'https://dwrmapserv.utah.gov/arcgis/rest/services/hunt/Boundaries_and_Tables/MapServer',
    layers: [0],
    opacity: 0.85
  });

  liveHuntUnitsLayer.on('loading', () => {
    console.log('Loading live Utah hunt units layer...');
  });

  liveHuntUnitsLayer.on('load', () => {
    console.log('Live Utah hunt units layer loaded.');
  });

  liveHuntUnitsLayer.on('error', err => {
    console.error('Live hunt units layer error:', err);
    applyFallbackLayer();
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
  let renderedCount = 0;

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
      <button type="button" class="btn-primary js-select-unit" data-unit="${escapeHtml(unitValue)}">
        Select Unit
      </button>
    `);

    marker.on('click', () => selectUnitByValue(unitValue));
    renderedCount += 1;
  });

  // Fallback for hunt tables that have no unit centroid coordinates.
  if (renderedCount === 0 && filtered.length > 0) {
    const units = new Map();

    filtered.forEach(h => {
      const value = getUnitValue(h);
      const label = getUnitName(h) || value;
      if (!value) return;
      if (!units.has(value)) units.set(value, label);
    });

    const list = Array.from(units.entries())
      .sort((a, b) => a[1].localeCompare(b[1]))
      .slice(0, 60);

    if (!list.length) return;

    const html = list.map(([value, label]) => `
      <div style="margin:0 0 8px 0;">
        <button type="button" class="btn-primary js-select-unit" data-unit="${escapeHtml(value)}">
          ${escapeHtml(label)}
        </button>
      </div>
    `).join('');

    L.marker(map.getCenter(), { opacity: 0 })
      .addTo(unitCenterLayer)
      .bindPopup(`
        <div style="min-width:220px;max-height:280px;overflow:auto;">
          <strong>Filtered Hunt Units</strong>
          <div style="margin-top:10px;">${html}</div>
        </div>
      `)
      .openPopup();
  }
}

function renderHuntResults() {
  if (!huntResultsEl) return;

  const filtered = getFilteredHunts();
  const total = filtered.length;
  const shown = Math.min(huntResultsLimit, total);

  if (huntCountEl) huntCountEl.textContent = String(total);

  if (!total) {
    huntResultsEl.innerHTML = '<div class="empty">No hunts match the current filters.</div>';
    return;
  }

  const cardsHtml = filtered.slice(0, shown).map(h => {
    const huntCode = getHuntCode(h);
    const title = getHuntTitle(h) || getUnitName(h) || huntCode || 'Untitled Hunt';
    const unitName = getUnitName(h) || 'Unknown Unit';
    const isSelected = selectedHunt && getHuntCode(selectedHunt) === huntCode;

    return `
      <div class="result-card ${isSelected ? 'selected' : ''}">
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
          <button
            type="button"
            class="btn-primary"
            data-hunt-code="${escapeHtml(huntCode)}"
            data-action="select-hunt"
          >
            Select Hunt
          </button>
        </div>
      </div>
    `;
  }).join('');

  const moreHtml = shown < total
    ? `
      <div class="result-actions">
        <button type="button" class="btn-secondary" data-action="show-more-hunts">
          Show more hunts (${shown} of ${total})
        </button>
      </div>
    `
    : '';

  huntResultsEl.innerHTML = `
    ${cardsHtml}
    <div class="result-meta-row">Showing ${shown} of ${total} matching hunts.</div>
    ${moreHtml}
  `;
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
  huntResultsLimit = 100;
  filteredHuntsCache.key = null;

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

  const handler = () => queueFilterRender();

  el.addEventListener('input', handler);
  el.addEventListener('change', handler);
});

if (unitFilter) {
  unitFilter.addEventListener('change', () => {
    huntResultsLimit = 100;
    filteredHuntsCache.key = null;

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
    const selectedLink = normalizeUrl(selectedHunt?.boundaryLink);
    const fallback = 'https://dwrapps.utah.gov/huntboundary/hbstart';
    window.open(selectedLink || fallback, '_blank', 'noopener,noreferrer');
  });
}

if (resetBtn) {
  resetBtn.addEventListener('click', resetPlanner);
}

if (huntResultsEl) {
  huntResultsEl.addEventListener('click', e => {
    const target = e.target;
    if (!(target instanceof HTMLElement)) return;

    const actionBtn = target.closest('button[data-action]');
    if (!actionBtn) return;

    const action = actionBtn.dataset.action;
    if (action === 'select-hunt') {
      const huntCode = safe(actionBtn.dataset.huntCode).trim();
      if (huntCode) selectHuntByCode(huntCode);
      return;
    }

    if (action === 'show-more-hunts') {
      huntResultsLimit += 100;
      renderHuntResults();
    }
  });
}

document.addEventListener('click', e => {
  const target = e.target;
  if (!(target instanceof HTMLElement)) return;

  const unitBtn = target.closest('.js-select-unit');
  if (!unitBtn) return;

  const unitValue = safe(unitBtn.getAttribute('data-unit')).trim();
  if (unitValue) selectUnitByValue(unitValue);
});

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
After you commit this on GitHub, hard refresh the site (Ctrl+F5).


so the usfs district boundaries are correct and the blm boundaries but not the hunt unit boundaries.  visit the website:  https://dwrapps.utah.gov/huntboundary/hbstart.   We are trying to duplicate the selction criteria of that website with a google maps baselayer,  then implement the usfs district boundaries and the blm boundaries and then tie in the utah outfitters that have special use permits to operate on those federal lands


Searched web for dwrapps.utah.gov/huntboundary/hbstart selection criteria species sex weapon hunt type
Searched web for https://dwrapps.utah.gov/huntboundary/
Searched web for site:dwrapps.utah.gov/huntboundary/hbstart HN=
Searched web for https://dwrapps.utah.gov/huntboundary/hbstart
Searched web for https://dwrmapserv.utah.gov/arcgis/rest/services/hunt/Boundaries_and_Tables/MapServer/0
Searched web for https://dwrmapserv.utah.gov/arcgis/rest/services/hunt/Boundaries_and_Tables/MapServer/1/query?where=HUNT_NUMBER%3D%27DB1519%27&outFields=HUNT_NUMBER,BOUNDARYID,BOUNDARY_NAME,SEASON&f=pjson
I’m implementing the actual DWR-style hunt selection logic now: mapping filtered hunt codes to BOUNDARYID via the DWR hunt table, then filtering the boundary layer to only those polygons. This should make hunt units match your selections.

Edited
app.js
+
-
Context automatically compacted
You want this done the right way: match DWR hunt selection behavior first, then keep USFS/BLM overlays, then wire outfitters to those federal-land contexts. I’m going to inspect your current app.js, verify how DWR’s selector is structured, and then give you one paste-ready corrected file.

Ran Get-Content -Path app.js | Select-Object -Skip 260 -First 260


Ran Get-ChildItem -Force; Write-Host '---'; Get-Content -Path app.js -TotalCount 260


Ran Get-Content -Path app.js | Select-Object -Skip 520 -First 260


Ran Get-Content -Path app.js | Select-Object -Skip 780 -First 260


Ran Get-Content -Path app.js | Select-Object -Skip 1040 -First 260


I’m now verifying the exact DWR boundary service fields so the hunt layer matches their selector logic (not just drawing generic polygons). Then I’ll hand you a single corrected app.js to paste.

Searched web for dwrmapserv.utah.gov hunt Boundaries_and_Tables MapServer 0 fields BOUNDARYID
Searched web for https://dwrmapserv.utah.gov/arcgis/rest/services/hunt/Boundaries_and_Tables/MapServer/layers
Searched web for https://dwrapps.utah.gov/huntboundary/
I found the exact DWR table fields (HUNT_NUMBER and BOUNDARYID) needed to match their selector logic. I’m wiring that join directly now so hunt filters drive the correct boundary polygons instead of generic unit outlines.

Edited
app.js
+
-
Edited
app.js
+
-
Edited
app.js
+
-
Edited
app.js
+
-
Edited
app.js
+
-
Ran node --check app.js


I’ve completed the boundary-join fix: your filtered hunts now query DWR’s HUNT_NUMBER -> BOUNDARYID table and apply that as a live boundary filter on layer 0. I’m sending you a single paste-ready app.js next.

Ran Get-Content -Raw app.js


Worked for 3m 40s
Replace your entire app.js in GitHub with this:

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
const huntCountEl = document.getElementById('huntCount');

// -----------------------------
// Helpers
// -----------------------------
function safe(value) {
  return String(value ?? '');
}

function normalizeToken(value) {
  return safe(value).trim().toLowerCase().replace(/\s+/g, ' ');
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

function matchesFilterValue(selectedValue, recordValue) {
  const selected = normalizeToken(selectedValue);
  const record = normalizeToken(recordValue);

  if (!selected || selected === 'all' || selected === 'all species') return true;
  if (!record) return false;
  if (selected === record) return true;

  // Treat Buck/Bull as a parent category that includes Buck/Bull variants.
  if (selected === 'buck/bull' && (record === 'buck' || record === 'bull' || record === 'buck/bull')) {
    return true;
  }

  return record.includes(selected) || selected.includes(record);
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
const sitlaLayer = L.layerGroup().addTo(map);
const stateLayer = L.layerGroup().addTo(map);
const privateLayer = L.layerGroup().addTo(map);

let liveHuntUnitsLayer = null;
let usfsDistrictLayer = null;
let blmDistrictLayer = null;
let huntResultsLimit = 100;
let filteredHuntsCache = { key: null, data: [] };
let filterDebounceTimer = null;
let liveBoundaryFilterToken = 0;
let liveLayerSource = 'none';

const DWR_BOUNDARY_MAPSERVER_URL =
  'https://dwrmapserv.utah.gov/arcgis/rest/services/hunt/Boundaries_and_Tables/MapServer';
const DWR_HUNT_INFO_TABLE_URL = `${DWR_BOUNDARY_MAPSERVER_URL}/1`;

function chunkArray(items, chunkSize) {
  const chunks = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    chunks.push(items.slice(i, i + chunkSize));
  }
  return chunks;
}

function escapeSqlString(value) {
  return safe(value).replace(/'/g, "''");
}

function isNumericId(value) {
  return /^-?\d+$/.test(safe(value).trim());
}

async function queryBoundaryIdsForHuntCodes(huntCodes) {
  const uniqueCodes = Array.from(
    new Set(huntCodes.map(code => safe(code).trim()).filter(Boolean))
  );

  if (!uniqueCodes.length) return new Set();

  const boundaryIds = new Set();
  const codeChunks = chunkArray(uniqueCodes, 80);

  for (const codes of codeChunks) {
    const quotedCodes = codes.map(code => `'${escapeSqlString(code)}'`).join(',');
    const where = `HUNT_NUMBER IN (${quotedCodes})`;

    const queryUrl =
      `${DWR_HUNT_INFO_TABLE_URL}/query?where=${encodeURIComponent(where)}` +
      '&outFields=BOUNDARYID' +
      '&returnDistinctValues=true' +
      '&f=json';

    const response = await fetch(queryUrl);
    if (!response.ok) {
      throw new Error(`DWR hunt-info query failed: ${response.status}`);
    }

    const payload = await response.json();
    const features = Array.isArray(payload.features) ? payload.features : [];

    features.forEach(feature => {
      const value = safe(feature?.attributes?.BOUNDARYID).trim();
      if (value) boundaryIds.add(value);
    });
  }

  return boundaryIds;
}

function getFilteredHuntCodes() {
  const codes = new Set();
  getFilteredHunts().forEach(h => {
    const code = getHuntCode(h);
    if (code) codes.add(code);
  });
  return Array.from(codes);
}

function getSelectedOrFilteredHuntCodes() {
  if (selectedHunt) {
    const code = getHuntCode(selectedHunt);
    if (code) return [code];
  }
  return getFilteredHuntCodes();
}

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
function getFilterSignature() {
  return JSON.stringify({
    search: safe(searchInput?.value).trim().toLowerCase(),
    species: safe(speciesFilter?.value || 'All Species'),
    sex: safe(sexFilter?.value || 'All'),
    weapon: safe(weaponFilter?.value || 'All'),
    huntType: safe(huntTypeFilter?.value || 'All'),
    unit: safe(unitFilter?.value || '')
  });
}

function queueFilterRender() {
  if (filterDebounceTimer) {
    window.clearTimeout(filterDebounceTimer);
  }

  filterDebounceTimer = window.setTimeout(() => {
    huntResultsLimit = 100;
    filteredHuntsCache.key = null;
    populateUnits();
    renderUnitCenters();
    renderHuntResults();
    refreshLiveHuntUnitFilter();
  }, 120);
}

function getFilteredHunts() {
  const signature = getFilterSignature();
  if (filteredHuntsCache.key === signature) {
    return filteredHuntsCache.data;
  }

  const search = safe(searchInput?.value).trim().toLowerCase();
  const species = safe(speciesFilter?.value || 'All Species');
  const sex = safe(sexFilter?.value || 'All');
  const weapon = safe(weaponFilter?.value || 'All');
  const huntType = safe(huntTypeFilter?.value || 'All');
  const unitValue = safe(unitFilter?.value || '');

  const filtered = huntData.filter(h => {
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

    const matchSex = matchesFilterValue(sex, sexValue);
    const matchWeapon = matchesFilterValue(weapon, weaponValue);
    const matchHuntType = matchesFilterValue(huntType, huntTypeValue);

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

  filteredHuntsCache = {
    key: signature,
    data: filtered
  };

  return filtered;
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

  const options = Array.from(units.entries()).sort((a, b) => a[1].localeCompare(b[1]));

  console.log('Unit options:', options);

  unitFilter.innerHTML = [
    '<option value="">All Units</option>',
    ...options.map(([value, label]) => `<option value="${escapeHtml(value)}">${escapeHtml(label)}</option>`)
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
      const served = safe(o.unitsServed).split(',').map(v => slugify(v));
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

  const applyFallbackLayer = () => {
    if (liveHuntUnitsLayer) {
      try { map.removeLayer(liveHuntUnitsLayer); } catch (e) {}
    }

    liveHuntUnitsLayer = L.esri.featureLayer({
      url: 'https://services.arcgis.com/ZzrwjTRez6FJiOq4/ArcGIS/rest/services/Hunting_Units/FeatureServer/0',
      style: () => ({
        color: '#ffc000',
        weight: 2,
        fillOpacity: 0.08
      })
    });

    liveLayerSource = 'fallback';

    if (toggleLiveUnits?.checked) liveHuntUnitsLayer.addTo(map);
    console.warn('Using fallback live hunt units layer.');
  };

  liveHuntUnitsLayer = L.esri.dynamicMapLayer({
    url: 'https://dwrmapserv.utah.gov/arcgis/rest/services/hunt/Boundaries_and_Tables/MapServer',
    layers: [0],
    opacity: 0.85
  });
  liveLayerSource = 'dwr';

  liveHuntUnitsLayer.on('loading', () => {
    console.log('Loading live Utah hunt units layer...');
  });

  liveHuntUnitsLayer.on('load', () => {
    console.log('Live Utah hunt units layer loaded.');
  });

  liveHuntUnitsLayer.on('error', err => {
    console.error('Live hunt units layer error:', err);
    applyFallbackLayer();
  });

  if (toggleLiveUnits?.checked) liveHuntUnitsLayer.addTo(map);
}

function applyLiveBoundaryWhereClause(whereClause) {
  if (!liveHuntUnitsLayer) return;

  const where = safe(whereClause).trim() || 'Status = 1';

  if (liveLayerSource === 'dwr' && typeof liveHuntUnitsLayer.setLayerDefs === 'function') {
    liveHuntUnitsLayer.setLayerDefs({ 0: where });
    if (typeof liveHuntUnitsLayer.redraw === 'function') {
      liveHuntUnitsLayer.redraw();
    }
    return;
  }

  if (liveLayerSource === 'fallback' && typeof liveHuntUnitsLayer.setWhere === 'function') {
    liveHuntUnitsLayer.setWhere('1=1');
  }
}

async function refreshLiveHuntUnitFilter() {
  const token = ++liveBoundaryFilterToken;

  if (!liveHuntUnitsLayer || liveLayerSource !== 'dwr') return;

  const huntCodes = getSelectedOrFilteredHuntCodes();
  if (!huntCodes.length) {
    applyLiveBoundaryWhereClause('1=0');
    return;
  }

  try {
    const boundaryIds = await queryBoundaryIdsForHuntCodes(huntCodes);
    if (token !== liveBoundaryFilterToken) return;

    if (!boundaryIds.size) {
      applyLiveBoundaryWhereClause('1=0');
      return;
    }

    const values = Array.from(boundaryIds);
    const numericIds = values.filter(isNumericId).map(v => Number(v));

    if (numericIds.length === values.length) {
      applyLiveBoundaryWhereClause(`BoundaryID IN (${numericIds.join(',')})`);
      return;
    }

    const quoted = values.map(v => `'${escapeSqlString(v)}'`).join(',');
    applyLiveBoundaryWhereClause(`BoundaryID IN (${quoted})`);
  } catch (err) {
    console.error('Failed to refresh live hunt boundary filter:', err);
    applyLiveBoundaryWhereClause('Status = 1');
  }
}

function buildUSFSLayer() {
  if (!window.L?.esri) return;

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
  if (!window.L?.esri) return;

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
    }).addTo(sitlaLayer).bindPopup('<b>SITLA</b><br>Placeholder layer until real SITLA data is added.');
  }

  if (toggleState?.checked) {
    L.circleMarker([40.1, -111.9], {
      radius: 8,
      color: '#2aa198',
      weight: 2,
      fillColor: '#2aa198',
      fillOpacity: 0.35
    }).addTo(stateLayer).bindPopup('<b>State Lands</b><br>Placeholder layer until real state-land data is added.');
  }

  if (togglePrivate?.checked) {
    L.circleMarker([38.9, -111.2], {
      radius: 8,
      color: '#b24b4b',
      weight: 2,
      fillColor: '#b24b4b',
      fillOpacity: 0.35
    }).addTo(privateLayer).bindPopup('<b>Private Lands</b><br>Placeholder layer until real private-land data is added.');
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
  let renderedCount = 0;

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
      <button type="button" class="btn-primary js-select-unit" data-unit="${escapeHtml(unitValue)}">
        Select Unit
      </button>
    `);

    marker.on('click', () => selectUnitByValue(unitValue));
    renderedCount += 1;
  });

  if (renderedCount === 0 && filtered.length > 0) {
    const units = new Map();

    filtered.forEach(h => {
      const value = getUnitValue(h);
      const label = getUnitName(h) || value;
      if (!value) return;
      if (!units.has(value)) units.set(value, label);
    });

    const list = Array.from(units.entries())
      .sort((a, b) => a[1].localeCompare(b[1]))
      .slice(0, 60);

    if (!list.length) return;

    const html = list.map(([value, label]) => `
      <div style="margin:0 0 8px 0;">
        <button type="button" class="btn-primary js-select-unit" data-unit="${escapeHtml(value)}">
          ${escapeHtml(label)}
        </button>
      </div>
    `).join('');

    L.marker(map.getCenter(), { opacity: 0 })
      .addTo(unitCenterLayer)
      .bindPopup(`
        <div style="min-width:220px;max-height:280px;overflow:auto;">
          <strong>Filtered Hunt Units</strong>
          <div style="margin-top:10px;">${html}</div>
        </div>
      `)
      .openPopup();
  }
}

function renderHuntResults() {
  if (!huntResultsEl) return;

  const filtered = getFilteredHunts();
  const total = filtered.length;
  const shown = Math.min(huntResultsLimit, total);

  if (huntCountEl) huntCountEl.textContent = String(total);

  if (!total) {
    huntResultsEl.innerHTML = '<div class="empty">No hunts match the current filters.</div>';
    return;
  }

  const cardsHtml = filtered.slice(0, shown).map(h => {
    const huntCode = getHuntCode(h);
    const title = getHuntTitle(h) || getUnitName(h) || huntCode || 'Untitled Hunt';
    const unitName = getUnitName(h) || 'Unknown Unit';
    const isSelected = selectedHunt && getHuntCode(selectedHunt) === huntCode;

    return `
      <div class="result-card ${isSelected ? 'selected' : ''}">
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
          <button
            type="button"
            class="btn-primary"
            data-hunt-code="${escapeHtml(huntCode)}"
            data-action="select-hunt"
          >
            Select Hunt
          </button>
        </div>
      </div>
    `;
  }).join('');

  const moreHtml = shown < total
    ? `
      <div class="result-actions">
        <button type="button" class="btn-secondary" data-action="show-more-hunts">
          Show more hunts (${shown} of ${total})
        </button>
      </div>
    `
    : '';

  huntResultsEl.innerHTML = `
    ${cardsHtml}
    <div class="result-meta-row">Showing ${shown} of ${total} matching hunts.</div>
    ${moreHtml}
  `;
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
  refreshLiveHuntUnitFilter();
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
  refreshLiveHuntUnitFilter();
}

window.selectUnitByValue = selectUnitByValue;
window.selectHuntByCode = selectHuntByCode;

// -----------------------------
// Reset
// -----------------------------
function resetPlanner() {
  selectedHunt = null;
  selectedUnit = null;
  huntResultsLimit = 100;
  filteredHuntsCache.key = null;

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
  refreshLiveHuntUnitFilter();
}

// -----------------------------
// Events
// -----------------------------
[searchInput, speciesFilter, sexFilter, weaponFilter, huntTypeFilter].forEach(el => {
  if (!el) return;

  const handler = () => queueFilterRender();

  el.addEventListener('input', handler);
  el.addEventListener('change', handler);
});

if (unitFilter) {
  unitFilter.addEventListener('change', () => {
    huntResultsLimit = 100;
    filteredHuntsCache.key = null;

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
      refreshLiveHuntUnitFilter();
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
    if (toggleLiveUnits.checked) {
      liveHuntUnitsLayer.addTo(map);
      refreshLiveHuntUnitFilter();
    } else {
      map.removeLayer(liveHuntUnitsLayer);
    }
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
    const selectedLink = normalizeUrl(selectedHunt?.boundaryLink);
    const fallback = 'https://dwrapps.utah.gov/huntboundary/hbstart';
    window.open(selectedLink || fallback, '_blank', 'noopener,noreferrer');
  });
}

if (resetBtn) {
  resetBtn.addEventListener('click', resetPlanner);
}

if (huntResultsEl) {
  huntResultsEl.addEventListener('click', e => {
    const target = e.target;
    if (!(target instanceof HTMLElement)) return;

    const actionBtn = target.closest('button[data-action]');
    if (!actionBtn) return;

    const action = actionBtn.dataset.action;
    if (action === 'select-hunt') {
      const huntCode = safe(actionBtn.dataset.huntCode).trim();
      if (huntCode) selectHuntByCode(huntCode);
      return;
    }

    if (action === 'show-more-hunts') {
      huntResultsLimit += 100;
      renderHuntResults();
    }
  });
}

document.addEventListener('click', e => {
  const target = e.target;
  if (!(target instanceof HTMLElement)) return;

  const unitBtn = target.closest('.js-select-unit');
  if (!unitBtn) return;

  const unitValue = safe(unitBtn.getAttribute('data-unit')).trim();
  if (unitValue) selectUnitByValue(unitValue);
});

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
    await refreshLiveHuntUnitFilter();

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
