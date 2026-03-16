// -----------------------------
// Data stores
// -----------------------------
let huntData = [];
let selectedHunt = null;
let selectedUnit = null;

// -----------------------------
// Sample outfitter data
// -----------------------------
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
    unitsServed: 'beaver-east,fishlake,manti-san-rafael,monroe,fillmore,nebo',
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

function getHuntTitle(h) {
  return firstNonEmpty(h.title, h.huntCode);
}

function getHuntCode(h) {
  return firstNonEmpty(h.huntCode);
}

function getSpeciesRaw(h) {
  return firstNonEmpty(h.species);
}

function getSpeciesList(h) {
  const raw = getSpeciesRaw(h);
  if (!raw) return [];
  return raw.split(',').map(v => v.trim()).filter(Boolean);
}

function getSex(h) {
  return firstNonEmpty(h.sex);
}

function getWeapon(h) {
  return firstNonEmpty(h.weapon);
}

function getHuntType(h) {
  return firstNonEmpty(h.huntType);
}

function getSeasonDates(h) {
  return firstNonEmpty(h.seasonLabel, h.seasonDates, h.dates);
}

function getRegion(h) {
  return firstNonEmpty(h.region);
}

function getUnitCode(h) {
  return firstNonEmpty(h.unitCode);
}

function getUnitName(h) {
  return firstNonEmpty(h.unitName, h.unitCode);
}

function getUnitValue(h) {
  return firstNonEmpty(h.unitCode, h.unitName);
}

function getBoundaryLink(h) {
  return firstNonEmpty(h.boundaryLink);
}

function getOfficialBoundaryUrl(h) {
  const boundaryLink = getBoundaryLink(h);
  if (boundaryLink) return boundaryLink;
  const huntCode = getHuntCode(h);
  if (!huntCode) return 'https://dwrapps.utah.gov/huntboundary/hbstart';
  return `https://dwrapps.utah.gov/huntboundary/hbstart?HN=${encodeURIComponent(huntCode)}`;
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

// -----------------------------
// Load hunt data
// -----------------------------
async function loadHuntData() {
  const filePath = './data/Utah_Hunt_Planner_Master_BuckDeer_Pages_43_53.json';
  const response = await fetch(filePath, { cache: 'no-store' });

  if (!response.ok) {
    throw new Error(`Failed to load hunt data from ${filePath} (${response.status})`);
  }

  const data = await response.json();

  if (!data || !Array.isArray(data.records)) {
    throw new Error('JSON loaded, but records array was not found.');
  }

  huntData = data.records;

  if (!huntData.length) {
    throw new Error('Records array is empty.');
  }
}

// -----------------------------
// Filters
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

    return matchSearch && matchSpecies && matchSex && matchWeapon && matchHuntType && matchUnit;
  });
}

// -----------------------------
// Dropdown population
// -----------------------------
function populateSpecies() {
  if (!speciesFilter) return;

  const selected = speciesFilter.value || 'All Species';
  const set = new Set(['All Species']);

  huntData.forEach(h => {
    getSpeciesList(h).forEach(s => {
      if (s) set.add(s);
    });
  });

  const options = Array.from(set).sort((a, b) => {
    if (a === 'All Species') return -1;
    if (b === 'All Species') return 1;
    return a.localeCompare(b);
  });

  speciesFilter.innerHTML = options
    .map(v => `<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`)
    .join('');

  speciesFilter.value = options.includes(selected) ? selected : 'All Species';
}

function populateUnits() {
  if (!unitFilter) return;

  const selected = unitFilter.value || '';
  const units = new Map();

  getFilteredHunts().forEach(h => {
    const value = getUnitValue(h);
    const label = getUnitName(h) || value;
    if (!value) return;
    if (!units.has(value)) units.set(value, label);
  });

  const options = Array.from(units.entries()).sort((a, b) => a[1].localeCompare(b[1]));

  unitFilter.innerHTML = [
    '<option value="">All Units</option>',
    ...options.map(([value, label]) => `<option value="${escapeHtml(value)}">${escapeHtml(label)}</option>`)
  ].join('');

  if (options.some(([value]) => value === selected)) {
    unitFilter.value = selected;
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
      return served.includes(unitCodeSlug) || served.includes(unitNameSlug) || served.includes(unitValueSlug);
    })
    .filter(o => {
      const cert = safe(o.certLevel).toUpperCase();
      if (cert === 'CPO' && toggleCPO && !toggleCPO.checked) return false;
      if (cert === 'CPG' && toggleCPG && !toggleCPG.checked) return false;
      return true;
    });
}

// -----------------------------
// Layers
// -----------------------------
function buildLiveHuntUnitsLayer() {
  // Use dynamicMapLayer instead of featureLayer.
  // It renders the actual DWR hunt boundary service as a map image,
  // which is much more reliable for a static site.
  if (!window.L?.esri) {
    console.error('Esri Leaflet not loaded.');
    return;
  }

  if (liveHuntUnitsLayer) {
    try {
      map.removeLayer(liveHuntUnitsLayer);
    } catch (e) {
      // ignore
    }
  }

  liveHuntUnitsLayer = L.esri.dynamicMapLayer({
    url: 'https://dwrmapserv.utah.gov/arcgis/rest/services/hunt/Boundaries_and_Tables/MapServer',
    opacity: 0.85,
    layers: [0]
  });

  if (toggleLiveUnits?.checked) {
    liveHuntUnitsLayer.addTo(map);
  }
}

function buildUSFSLayer() {
  if (!window.L?.esri) return;

  if (usfsDistrictLayer) {
    try {
      map.removeLayer(usfsDistrictLayer);
    } catch (e) {
      // ignore
    }
  }

  usfsDistrictLayer = L.esri.featureLayer({
    url: 'https://apps.fs.usda.gov/arcx/rest/services/EDW/EDW_RangerDistricts_01/MapServer/1',
    style: function () {
      return {
        color: '#4fa3ff',
        weight: 2,
        fillOpacity: 0.03
      };
    }
  });

  if (toggleUSFS?.checked) {
    usfsDistrictLayer.addTo(map);
  }
}

function buildBLMLayer() {
  if (!window.L?.esri) return;

  if (blmDistrictLayer) {
    try {
      map.removeLayer(blmDistrictLayer);
    } catch (e) {
      // ignore
    }
  }

  blmDistrictLayer = L.esri.featureLayer({
    url: 'https://gis.blm.gov/utarcgis/rest/services/AdminBoundaries/BLM_UT_ADMU/FeatureServer/0',
    style: function () {
      return {
        color: '#9b59b6',
        weight: 2,
        fillOpacity: 0.03
      };
    }
  });

  if (toggleBLM?.checked) {
    blmDistrictLayer.addTo(map);
  }
}

function renderOwnershipPlaceholders() {
  sitlaLayer.clearLayers();
  stateLayer.clearLayers();
  privateLayer.clearLayers();

  if (toggleSITLA?.checked) {
    L.marker([39.15, -111.7]).addTo(sitlaLayer).bindPopup('SITLA layer placeholder');
  }

  if (toggleState?.checked) {
    L.marker([39.05, -111.4]).addTo(stateLayer).bindPopup('State lands layer placeholder');
  }

  if (togglePrivate?.checked) {
    L.marker([38.95, -111.2]).addTo(privateLayer).bindPopup('Private lands layer placeholder');
  }
}

// -----------------------------
// Renderers
// -----------------------------
function renderUnitCenters() {
  unitCenterLayer.clearLayers();

  if (toggleUnits && !toggleUnits.checked) return;

  const units = new Map();

  getFilteredHunts().forEach(h => {
    const value = getUnitValue(h);
    const label = getUnitName(h) || value;
    if (!value) return;
    if (!units.has(value)) units.set(value, label);
  });

  const list = Array.from(units.entries()).sort((a, b) => a[1].localeCompare(b[1]));

  if (!list.length) return;

  const html = list.map(([value, label]) => {
    return `
      <div style="margin-bottom:8px;">
        <button
          type="button"
          style="width:100%;padding:8px;border-radius:8px;border:1px solid #273243;background:#18212d;color:#edf2f7;cursor:pointer;"
          onclick="window.selectUnitByValue(${JSON.stringify(value)})"
        >
          ${escapeHtml(label)}
        </button>
      </div>
    `;
  }).join('');

  const marker = L.marker([39.3, -111.7], { opacity: 0 }).addTo(unitCenterLayer);
  marker.bindPopup(`
    <div style="min-width:220px;max-height:300px;overflow:auto;">
      <b>Filtered Hunt Units</b>
      <div style="margin-top:10px;">${html}</div>
    </div>
  `);
}

function renderHuntResults() {
  if (!huntResultsEl) return;

  const filtered = getFilteredHunts();

  if (!filtered.length) {
    huntResultsEl.innerHTML = '<div class="empty">No hunts match the current filters.</div>';
    return;
  }

  huntResultsEl.innerHTML = filtered.slice(0, 100).map(h => `
    <div class="result-card">
      <h3>${escapeHtml(getHuntTitle(h))}</h3>
      <div class="pill-row">
        <span class="pill">${escapeHtml(getSpeciesRaw(h))}</span>
        <span class="pill">${escapeHtml(getSex(h) || 'N/A')}</span>
        <span class="pill">${escapeHtml(getWeapon(h) || 'N/A')}</span>
        <span class="pill">${escapeHtml(getHuntType(h) || 'N/A')}</span>
      </div>
      <div class="meta">
        <div><strong>Unit:</strong> ${escapeHtml(getUnitName(h))}</div>
        <div><strong>Hunt Code:</strong> ${escapeHtml(getHuntCode(h))}</div>
        <div><strong>Dates:</strong> ${escapeHtml(getSeasonDates(h))}</div>
      </div>
      <div class="result-actions">
        <button type="button" class="btn-primary" onclick="window.selectHuntByCode(${JSON.stringify(getHuntCode(h))})">
          Select Hunt
        </button>
      </div>
    </div>
  `).join('');
}

function renderAreaInfo() {
  if (!areaInfoEl) return;

  if (!selectedHunt) {
    areaInfoEl.innerHTML = 'Click a hunt unit or select one from the filter.';
    return;
  }

  const officialUrl = getOfficialBoundaryUrl(selectedHunt);

  areaInfoEl.innerHTML = `
    <strong>Hunt:</strong> ${escapeHtml(getHuntTitle(selectedHunt))}<br>
    <strong>Unit:</strong> ${escapeHtml(getUnitName(selectedHunt))}<br>
    <strong>Species:</strong> ${escapeHtml(getSpeciesRaw(selectedHunt))}<br>
    <strong>Sex:</strong> ${escapeHtml(getSex(selectedHunt))}<br>
    <strong>Weapon:</strong> ${escapeHtml(getWeapon(selectedHunt))}<br>
    <strong>Hunt Type:</strong> ${escapeHtml(getHuntType(selectedHunt))}<br>
    <strong>Dates:</strong> ${escapeHtml(getSeasonDates(selectedHunt))}<br>
    <div style="margin-top:10px;">
      <a href="${escapeHtml(officialUrl)}" target="_blank" rel="noopener noreferrer">
        Open official DWR boundary for this hunt
      </a>
    </div>
  `;
}

function renderOutfitters() {
  outfitterLayer.clearLayers();

  if (toggleOutfitters && !toggleOutfitters.checked) return;
  if (!selectedHunt) return;

  const matches = getSelectedOutfitters();

  // Use simple Utah offsets near center since local hunt data has no coordinates.
  const baseLat = 39.3;
  const baseLng = -111.7;

  matches.forEach((o, idx) => {
    const marker = L.marker([baseLat + idx * 0.15, baseLng + idx * 0.15]).addTo(outfitterLayer);
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
    resultsEl.innerHTML = `<div class="empty">No outfitters currently loaded for ${escapeHtml(getUnitName(selectedHunt))}.</div>`;
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
  const hunt = huntData.find(h => {
    return getUnitValue(h) === unitValue || getUnitName(h) === unitValue || getUnitCode(h) === unitValue;
  });

  if (!hunt) return;

  selectedHunt = hunt;
  selectedUnit = unitValue;

  if (unitFilter) unitFilter.value = unitValue;
  if (selectedTitle) selectedTitle.textContent = getUnitName(hunt);
  if (selectedMeta) {
    selectedMeta.textContent = [getSpeciesRaw(hunt), getRegion(hunt)].filter(Boolean).join(' • ');
  }

  renderAreaInfo();
  renderOutfitters();
  renderOutfitterResults();
  renderHuntResults();

  if (clickInfoEl) {
    clickInfoEl.innerHTML = `
      <strong>Selected Unit:</strong> ${escapeHtml(getUnitName(hunt))}<br>
      <strong>Hunt Code:</strong> ${escapeHtml(getHuntCode(hunt))}
    `;
  }
}

function selectHuntByCode(huntCode) {
  const hunt = huntData.find(h => getHuntCode(h) === huntCode);
  if (!hunt) return;

  selectedHunt = hunt;
  selectedUnit = getUnitValue(hunt);

  if (unitFilter) unitFilter.value = selectedUnit;
  if (selectedTitle) selectedTitle.textContent = getHuntTitle(hunt);
  if (selectedMeta) {
    selectedMeta.textContent = [getSpeciesRaw(hunt), getRegion(hunt)].filter(Boolean).join(' • ');
  }

  renderAreaInfo();
  renderOutfitters();
  renderOutfitterResults();
  renderHuntResults();

  if (clickInfoEl) {
    clickInfoEl.innerHTML = `
      <strong>Selected Hunt:</strong> ${escapeHtml(getHuntTitle(hunt))}<br>
      <strong>Unit:</strong> ${escapeHtml(getUnitName(hunt))}
    `;
  }
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

  if (clickInfoEl) {
    clickInfoEl.innerHTML = 'Click the map to inspect the selected area.';
  }
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

    if (toggleLiveUnits?.checked && liveHuntUnitsLayer) map.addLayer(liveHuntUnitsLayer);
    if (toggleUSFS?.checked && usfsDistrictLayer) map.addLayer(usfsDistrictLayer);
    if (toggleBLM?.checked && blmDistrictLayer) map.addLayer(blmDistrictLayer);
  });
}

if (toggleLiveUnits) {
  toggleLiveUnits.addEventListener('change', () => {
    if (!liveHuntUnitsLayer) return;
    if (toggleLiveUnits.checked) map.addLayer(liveHuntUnitsLayer);
    else map.removeLayer(liveHuntUnitsLayer);
  });
}

if (toggleUnits) {
  toggleUnits.addEventListener('change', renderUnitCenters);
}

if (toggleUSFS) {
  toggleUSFS.addEventListener('change', () => {
    if (!usfsDistrictLayer) return;
    if (toggleUSFS.checked) map.addLayer(usfsDistrictLayer);
    else map.removeLayer(usfsDistrictLayer);
  });
}

if (toggleBLM) {
  toggleBLM.addEventListener('change', () => {
    if (!blmDistrictLayer) return;
    if (toggleBLM.checked) map.addLayer(blmDistrictLayer);
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
    if (selectedHunt) {
      window.open(getOfficialBoundaryUrl(selectedHunt), '_blank', 'noopener,noreferrer');
    } else {
      window.open('https://dwrapps.utah.gov/huntboundary/hbstart', '_blank', 'noopener,noreferrer');
    }
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

    if (clickInfoEl) {
      clickInfoEl.innerHTML = 'Click the map to inspect the selected area.';
    }
  } catch (err) {
    console.error('INIT FAILED:', err);

    if (speciesFilter) {
      speciesFilter.innerHTML = '<option value="All Species">Load Failed</option>';
    }

    if (unitFilter) {
      unitFilter.innerHTML = '<option value="">All Units</option>';
    }

    if (huntResultsEl) {
      huntResultsEl.innerHTML = `<div class="empty">Failed to load hunt data: ${escapeHtml(err.message || String(err))}</div>`;
    }

    if (resultsEl) {
      resultsEl.innerHTML = `<div class="empty">Initialization error: ${escapeHtml(err.message || String(err))}</div>`;
    }

    if (areaInfoEl) {
      areaInfoEl.innerHTML = 'App failed to initialize. Check the browser console for the exact error.';
    }
  }
})();
