// -----------------------------
// UOGA Hunt Planner - Stable Baseline
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
    unitsServed: 'beaver-east,fishlake,manti-san-rafael,monroe,fillmore,nebo',
    forestDistricts: 'Fishlake NF - Richfield; Manti-La Sal NF - Sanpete'
  }
];

const DWR_MAPSERVER = 'https://dwrmapserv.utah.gov/arcgis/rest/services/hunt/Boundaries_and_Tables/MapServer';
const DWR_HUNT_TABLE = `${DWR_MAPSERVER}/1`;

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

function safe(v) {
  return String(v ?? '');
}

function firstNonEmpty(...values) {
  for (const v of values) {
    const s = safe(v).trim();
    if (s) return s;
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

function normalizeUrl(url) {
  const raw = safe(url).trim();
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw)) return raw;
  return `https://${raw}`;
}

function slugify(v) {
  return safe(v)
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function formatPhone(phone) {
  const d = safe(phone).replace(/\D/g, '');
  if (d.length === 10) return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  return safe(phone);
}

function getHuntCode(h) {
  return firstNonEmpty(h.huntCode, h.hunt_code, h.HuntCode, h.code, h.Code);
}

function getHuntTitle(h) {
  return firstNonEmpty(h.title, h.Title, h.huntTitle, h.hunt_title, getHuntCode(h));
}

function getUnitCode(h) {
  return firstNonEmpty(h.unitCode, h.unit_code, h.UnitCode, h.UNIT_CODE, h.unit, h.Unit);
}

function getUnitName(h) {
  return firstNonEmpty(h.unitName, h.unit_name, h.UnitName, h.UNIT_NAME, getUnitCode(h));
}

function getUnitValue(h) {
  return firstNonEmpty(getUnitCode(h), getUnitName(h));
}

function getSpeciesRaw(h) {
  return firstNonEmpty(h.species, h.Species, h.SPECIES);
}

function getSpeciesList(h) {
  return getSpeciesRaw(h)
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
}

function getSex(h) {
  return firstNonEmpty(h.sex, h.Sex, h.SEX);
}

function getWeapon(h) {
  return firstNonEmpty(h.weapon, h.Weapon, h.WEAPON);
}

function getHuntType(h) {
  return firstNonEmpty(h.huntType, h.HuntType, h.hunt_type, h.type, h.Type);
}

function getDates(h) {
  return firstNonEmpty(h.seasonLabel, h.seasonDates, h.dates, h.Dates);
}

function getRegion(h) {
  return firstNonEmpty(h.region, h.Region, h.REGION);
}

function getHuntLat(h) {
  const n = Number(firstNonEmpty(h.centroidLat, h.centerLat, h.lat, h.latitude, h.y));
  return Number.isFinite(n) ? n : null;
}

function getHuntLng(h) {
  const n = Number(firstNonEmpty(h.centroidLng, h.centerLng, h.lng, h.lon, h.longitude, h.x));
  return Number.isFinite(n) ? n : null;
}

function matchesFilter(selected, value) {
  const s = safe(selected).trim().toLowerCase();
  const v = safe(value).trim().toLowerCase();
  if (!s || s === 'all' || s === 'all species') return true;
  if (!v) return false;
  if (s === v) return true;
  if (s === 'buck/bull' && (v === 'buck' || v === 'bull' || v === 'buck/bull')) return true;
  return v.includes(s) || s.includes(v);
}

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
    { maxZoom: 19, attribution: 'Tiles &copy; Esri' }
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
let liveLayerSource = 'none';
let huntResultsLimit = 100;
let liveFilterToken = 0;

async function loadHuntData() {
  const res = await fetch('./data/Utah_Hunt_Planner_Master_BuckDeer_Pages_43_53.json', { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to load hunt data: ${res.status}`);
  const data = await res.json();

  if (Array.isArray(data)) huntData = data;
  else if (Array.isArray(data.records)) huntData = data.records;
  else if (Array.isArray(data.data)) huntData = data.data;
  else huntData = [];

  if (!huntData.length) throw new Error('No hunt records found in JSON.');
}

function getFilteredHunts() {
  const search = safe(searchInput?.value).trim().toLowerCase();
  const species = safe(speciesFilter?.value || 'All Species');
  const sex = safe(sexFilter?.value || 'All');
  const weapon = safe(weaponFilter?.value || 'All');
  const huntType = safe(huntTypeFilter?.value || 'All');
  const unit = safe(unitFilter?.value || '');

  return huntData.filter(h => {
    const title = getHuntTitle(h).toLowerCase();
    const code = getHuntCode(h).toLowerCase();
    const unitName = getUnitName(h).toLowerCase();
    const unitCode = getUnitCode(h).toLowerCase();

    const searchOk =
      !search ||
      title.includes(search) ||
      code.includes(search) ||
      unitName.includes(search) ||
      unitCode.includes(search);

    const speciesOk =
      species === 'All Species' ||
      getSpeciesList(h).map(x => x.toLowerCase()).includes(species.toLowerCase());

    const sexOk = matchesFilter(sex, getSex(h));
    const weaponOk = matchesFilter(weapon, getWeapon(h));
    const huntTypeOk = matchesFilter(huntType, getHuntType(h));

    const unitOk =
      !unit ||
      getUnitValue(h) === unit ||
      getUnitName(h) === unit ||
      getUnitCode(h) === unit;

    return searchOk && speciesOk && sexOk && weaponOk && huntTypeOk && unitOk;
  });
}

function populateSpecies() {
  if (!speciesFilter) return;
  const previous = speciesFilter.value || 'All Species';
  const set = new Set(['All Species']);

  huntData.forEach(h => {
    getSpeciesList(h).forEach(s => set.add(s));
  });

  const options = Array.from(set).sort((a, b) => {
    if (a === 'All Species') return -1;
    if (b === 'All Species') return 1;
    return a.localeCompare(b);
  });

  speciesFilter.innerHTML = options
    .map(v => `<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`)
    .join('');

  speciesFilter.value = options.includes(previous) ? previous : 'All Species';
}

function populateUnits() {
  if (!unitFilter) return;
  const previous = unitFilter.value || '';
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

  unitFilter.value = options.some(([value]) => value === previous) ? previous : '';
}

function getSelectedOutfitters() {
  if (!selectedHunt) return [];

  const codeSlug = slugify(getUnitCode(selectedHunt));
  const nameSlug = slugify(getUnitName(selectedHunt));
  const valueSlug = slugify(getUnitValue(selectedHunt));

  return outfitters
    .filter(o => {
      const served = safe(o.unitsServed).split(',').map(x => slugify(x));
      return served.includes(codeSlug) || served.includes(nameSlug) || served.includes(valueSlug);
    })
    .filter(o => {
      const cert = safe(o.certLevel).toUpperCase();
      if (cert === 'CPO' && toggleCPO && !toggleCPO.checked) return false;
      if (cert === 'CPG' && toggleCPG && !toggleCPG.checked) return false;
      return true;
    });
}

function buildLiveHuntUnitsLayer() {
  if (!window.L || !window.L.esri) return;

  if (liveHuntUnitsLayer) {
    try { map.removeLayer(liveHuntUnitsLayer); } catch (e) {}
  }

  const fallback = () => {
    liveHuntUnitsLayer = L.esri.featureLayer({
      url: 'https://services.arcgis.com/ZzrwjTRez6FJiOq4/ArcGIS/rest/services/Hunting_Units/FeatureServer/0',
      style: () => ({ color: '#8b5f2b', weight: 1.5, fillColor: '#d7c4a3', fillOpacity: 0.18 })
    });
    liveLayerSource = 'fallback';
    if (toggleLiveUnits?.checked) liveHuntUnitsLayer.addTo(map);
  };

  try {
    liveHuntUnitsLayer = L.esri.dynamicMapLayer({
      url: DWR_MAPSERVER,
      layers: [0],
      opacity: 0.9
    });
    liveLayerSource = 'dwr';

    liveHuntUnitsLayer.on('error', () => fallback());

    if (toggleLiveUnits?.checked) liveHuntUnitsLayer.addTo(map);
  } catch (e) {
    fallback();
  }
}

function buildUSFSLayer() {
  if (!window.L || !window.L.esri) return;
  if (usfsDistrictLayer) {
    try { map.removeLayer(usfsDistrictLayer); } catch (e) {}
  }

  usfsDistrictLayer = L.esri.featureLayer({
    url: 'https://apps.fs.usda.gov/arcx/rest/services/EDW/EDW_RangerDistricts_01/MapServer/1',
    style: () => ({ color: '#3f6fa8', weight: 2, fillOpacity: 0.02 })
  });

  usfsDistrictLayer.bindPopup(layer => {
    const p = layer.feature?.properties || {};
    return `<b>${escapeHtml(firstNonEmpty(p.FORESTNAME, 'USFS'))}</b><br>${escapeHtml(firstNonEmpty(p.DISTRICTNAME, 'District'))}`;
  });

  if (toggleUSFS?.checked) usfsDistrictLayer.addTo(map);
}

function buildBLMLayer() {
  if (!window.L || !window.L.esri) return;
  if (blmDistrictLayer) {
    try { map.removeLayer(blmDistrictLayer); } catch (e) {}
  }

  blmDistrictLayer = L.esri.featureLayer({
    url: 'https://gis.blm.gov/utarcgis/rest/services/AdminBoundaries/BLM_UT_ADMU/FeatureServer/0',
    style: () => ({ color: '#7c5ea7', weight: 2, fillOpacity: 0.02 })
  });

  blmDistrictLayer.bindPopup(layer => {
    const p = layer.feature?.properties || {};
    return `<b>BLM Utah</b><br>${escapeHtml(firstNonEmpty(p.ADMIN_UNIT, p.FIELD_OFFICE, p.NAME, 'Administrative Unit'))}`;
  });

  if (toggleBLM?.checked) blmDistrictLayer.addTo(map);
}

function applyLiveBoundaryWhere(whereClause) {
  if (!liveHuntUnitsLayer) return;

  if (liveLayerSource === 'dwr' && typeof liveHuntUnitsLayer.setLayerDefs === 'function') {
    liveHuntUnitsLayer.setLayerDefs({ 0: whereClause || 'Status = 1' });
    if (typeof liveHuntUnitsLayer.redraw === 'function') liveHuntUnitsLayer.redraw();
    return;
  }

  if (liveLayerSource === 'fallback' && typeof liveHuntUnitsLayer.setWhere === 'function') {
    liveHuntUnitsLayer.setWhere('1=1');
  }
}

function chunk(items, size) {
  const out = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

async function queryBoundaryNamesAndIds(huntCodes) {
  const names = new Set();
  const ids = new Set();
  const chunks = chunk(huntCodes, 80);

  for (const pack of chunks) {
    const sql = pack.map(c => `'${safe(c).replace(/'/g, "''")}'`).join(',');
    const where = `HUNT_NUMBER IN (${sql})`;
    const url = `${DWR_HUNT_TABLE}/query?where=${encodeURIComponent(where)}&outFields=BOUNDARY_NAME,BOUNDARYID&returnDistinctValues=true&f=json`;

    const res = await fetch(url);
    if (!res.ok) throw new Error(`DWR table query failed: ${res.status}`);
    const data = await res.json();
    const features = Array.isArray(data.features) ? data.features : [];

    features.forEach(f => {
      const n = safe(f?.attributes?.BOUNDARY_NAME).trim();
      const i = safe(f?.attributes?.BOUNDARYID).trim();
      if (n) names.add(n);
      if (i) ids.add(i);
    });
  }

  return { names, ids };
}

function buildBoundaryFilterSql(names, ids) {
  const clauses = [];

  if (names.size) {
    const list = Array.from(names).map(n => `'${safe(n).replace(/'/g, "''")}'`).join(',');
    clauses.push(`Boundary_Name IN (${list})`);
  }

  if (ids.size) {
    const values = Array.from(ids);
    const allNum = values.every(v => /^-?\d+$/.test(v));
    if (allNum) clauses.push(`BOUNDARYID IN (${values.map(v => Number(v)).join(',')})`);
    else clauses.push(`BOUNDARYID IN (${values.map(v => `'${safe(v).replace(/'/g, "''")}'`).join(',')})`);
  }

  if (!clauses.length) return '1=0';
  if (clauses.length === 1) return clauses[0];
  return `(${clauses.join(' OR ')})`;
}

async function refreshLiveBoundaryFilter() {
  const token = ++liveFilterToken;

  if (!liveHuntUnitsLayer || liveLayerSource !== 'dwr') return;

  const codes = selectedHunt
    ? [getHuntCode(selectedHunt)].filter(Boolean)
    : Array.from(new Set(getFilteredHunts().map(h => getHuntCode(h)).filter(Boolean)));

  if (!codes.length) {
    applyLiveBoundaryWhere('1=0');
    return;
  }

  try {
    const { names, ids } = await queryBoundaryNamesAndIds(codes);
    if (token !== liveFilterToken) return;

    applyLiveBoundaryWhere(buildBoundaryFilterSql(names, ids));
  } catch (err) {
    console.error('Boundary filter failed:', err);
    applyLiveBoundaryWhere('Status = 1');
  }
}

function renderOwnershipPlaceholders() {
  sitlaLayer.clearLayers();
  stateLayer.clearLayers();
  privateLayer.clearLayers();

  if (toggleSITLA?.checked) {
    L.circleMarker([39.05, -111.9], { radius: 7, color: '#4f9d62', fillColor: '#4f9d62', fillOpacity: 0.35, weight: 2 })
      .addTo(sitlaLayer)
      .bindPopup('<b>SITLA</b><br>Placeholder layer');
  }
  if (toggleState?.checked) {
    L.circleMarker([40.1, -111.9], { radius: 7, color: '#2b8f9a', fillColor: '#2b8f9a', fillOpacity: 0.35, weight: 2 })
      .addTo(stateLayer)
      .bindPopup('<b>State Lands</b><br>Placeholder layer');
  }
  if (togglePrivate?.checked) {
    L.circleMarker([38.9, -111.2], { radius: 7, color: '#9a3e3e', fillColor: '#9a3e3e', fillOpacity: 0.35, weight: 2 })
      .addTo(privateLayer)
      .bindPopup('<b>Private Lands</b><br>Placeholder layer');
  }
}

function renderUnitCenters() {
  unitCenterLayer.clearLayers();
  if (toggleUnits && !toggleUnits.checked) return;

  const filtered = getFilteredHunts();
  const seen = new Set();
  let count = 0;

  filtered.forEach(h => {
    const key = getUnitValue(h);
    if (!key || seen.has(key)) return;
    seen.add(key);

    const lat = getHuntLat(h);
    const lng = getHuntLng(h);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

    const marker = L.circleMarker([lat, lng], {
      radius: 6,
      color: '#8b5f2b',
      weight: 2,
      fillColor: '#c68945',
      fillOpacity: 0.8
    }).addTo(unitCenterLayer);

    marker.bindPopup(`
      <b>${escapeHtml(getUnitName(h) || key)}</b><br>
      ${escapeHtml(getSpeciesRaw(h))}<br>
      <button type="button" class="btn-primary js-select-unit" data-unit="${escapeHtml(key)}">Select Unit</button>
    `);

    marker.on('click', () => selectUnitByValue(key));
    count += 1;
  });

  if (count === 0 && filtered.length) {
    const units = new Map();
    filtered.forEach(h => {
      const value = getUnitValue(h);
      const label = getUnitName(h) || value;
      if (!value) return;
      if (!units.has(value)) units.set(value, label);
    });

    const list = Array.from(units.entries()).sort((a, b) => a[1].localeCompare(b[1])).slice(0, 60);
    const html = list.map(([value, label]) => `
      <div style="margin-bottom:8px;">
        <button type="button" class="btn-primary js-select-unit" data-unit="${escapeHtml(value)}">${escapeHtml(label)}</button>
      </div>
    `).join('');

    L.marker(map.getCenter(), { opacity: 0 })
      .addTo(unitCenterLayer)
      .bindPopup(`<div style="min-width:220px;max-height:280px;overflow:auto;"><strong>Filtered Hunt Units</strong><div style="margin-top:10px;">${html}</div></div>`)
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

  const html = filtered.slice(0, shown).map(h => {
    const code = getHuntCode(h);
    const title = getHuntTitle(h) || getUnitName(h) || code || 'Untitled Hunt';
    const unit = getUnitName(h) || 'Unknown Unit';
    const isSelected = selectedHunt && getHuntCode(selectedHunt) === code;

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
          <div><strong>Unit:</strong> ${escapeHtml(unit)}</div>
          <div><strong>Hunt Code:</strong> ${escapeHtml(code)}</div>
          <div><strong>Dates:</strong> ${escapeHtml(getDates(h))}</div>
        </div>
        <div class="result-actions">
          <button type="button" class="btn-primary" data-action="select-hunt" data-hunt-code="${escapeHtml(code)}">Select Hunt</button>
        </div>
      </div>
    `;
  }).join('');

  const more = shown < total
    ? `<div class="result-actions"><button type="button" class="btn-secondary" data-action="show-more-hunts">Show more hunts (${shown} of ${total})</button></div>`
    : '';

  huntResultsEl.innerHTML = `${html}<div class="result-meta-row">Showing ${shown} of ${total} matching hunts.</div>${more}`;
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
    <strong>Dates:</strong> ${escapeHtml(getDates(selectedHunt))}
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

  matches.forEach((o, i) => {
    const marker = L.marker([baseLat + i * 0.03, baseLng + i * 0.03]).addTo(outfitterLayer);
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

function selectUnitByValue(unitValue) {
  const hunt = huntData.find(h => {
    return getUnitValue(h) === unitValue || getUnitName(h) === unitValue || getUnitCode(h) === unitValue;
  });

  if (!hunt) return;

  selectedHunt = hunt;
  selectedUnit = unitValue;

  if (unitFilter) unitFilter.value = unitValue;
  if (selectedTitle) selectedTitle.textContent = getUnitName(hunt) || unitValue;
  if (selectedMeta) selectedMeta.textContent = [getSpeciesRaw(hunt), getRegion(hunt)].filter(Boolean).join(' • ');

  const lat = getHuntLat(hunt);
  const lng = getHuntLng(hunt);
  if (Number.isFinite(lat) && Number.isFinite(lng)) map.setView([lat, lng], 8);

  renderAreaInfo();
  renderOutfitters();
  renderOutfitterResults();
  renderHuntResults();
  refreshLiveBoundaryFilter();
}

function selectHuntByCode(huntCode) {
  const hunt = huntData.find(h => getHuntCode(h) === huntCode);
  if (!hunt) return;

  selectedHunt = hunt;
  selectedUnit = getUnitValue(hunt);

  if (unitFilter) unitFilter.value = selectedUnit;
  if (selectedTitle) selectedTitle.textContent = getHuntTitle(hunt) || getUnitName(hunt) || huntCode;
  if (selectedMeta) selectedMeta.textContent = [getSpeciesRaw(hunt), getRegion(hunt)].filter(Boolean).join(' • ');

  const lat = getHuntLat(hunt);
  const lng = getHuntLng(hunt);
  if (Number.isFinite(lat) && Number.isFinite(lng)) map.setView([lat, lng], 8);

  renderAreaInfo();
  renderOutfitters();
  renderOutfitterResults();
  renderHuntResults();
  refreshLiveBoundaryFilter();
}

window.selectUnitByValue = selectUnitByValue;
window.selectHuntByCode = selectHuntByCode;

function resetPlanner() {
  selectedHunt = null;
  selectedUnit = null;
  huntResultsLimit = 100;

  if (searchInput) searchInput.value = '';
  if (speciesFilter) speciesFilter.value = 'All Species';
  if (sexFilter) sexFilter.value = 'All';
  if (weaponFilter) weaponFilter.value = 'All';
  if (huntTypeFilter) huntTypeFilter.value = 'All';
  if (unitFilter) unitFilter.value = '';

  populateUnits();

  if (selectedTitle) selectedTitle.textContent = 'No hunt selected';
  if (selectedMeta) selectedMeta.textContent = 'Choose filters or click a hunt unit to load hunt and outfitter results.';

  map.setView([39.3, -111.7], 6);

  renderUnitCenters();
  renderOwnershipPlaceholders();
  renderAreaInfo();
  renderOutfitters();
  renderOutfitterResults();
  renderHuntResults();
  refreshLiveBoundaryFilter();
}

[searchInput, speciesFilter, sexFilter, weaponFilter, huntTypeFilter].forEach(el => {
  if (!el) return;
  const handler = () => {
    huntResultsLimit = 100;
    populateUnits();
    renderUnitCenters();
    renderHuntResults();
    refreshLiveBoundaryFilter();
  };
  el.addEventListener('input', handler);
  el.addEventListener('change', handler);
});

if (unitFilter) {
  unitFilter.addEventListener('change', () => {
    huntResultsLimit = 100;
    if (!unitFilter.value) {
      selectedHunt = null;
      selectedUnit = null;
      if (selectedTitle) selectedTitle.textContent = 'No hunt selected';
      if (selectedMeta) selectedMeta.textContent = 'Choose filters or click a hunt unit to load hunt and outfitter results.';
      renderAreaInfo();
      renderOutfitters();
      renderOutfitterResults();
      renderHuntResults();
      refreshLiveBoundaryFilter();
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
      refreshLiveBoundaryFilter();
    } else {
      map.removeLayer(liveHuntUnitsLayer);
    }
  });
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

if (toggleUnits) toggleUnits.addEventListener('change', renderUnitCenters);

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
    window.open(selectedLink || 'https://dwrapps.utah.gov/huntboundary/hbstart', '_blank', 'noopener,noreferrer');
  });
}

if (resetBtn) resetBtn.addEventListener('click', resetPlanner);

if (huntResultsEl) {
  huntResultsEl.addEventListener('click', e => {
    const target = e.target;
    if (!(target instanceof HTMLElement)) return;
    const btn = target.closest('button[data-action]');
    if (!btn) return;

    const action = btn.dataset.action;
    if (action === 'select-hunt') {
      const huntCode = safe(btn.dataset.huntCode).trim();
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
  if (!clickInfoEl) return;
  clickInfoEl.innerHTML = `<strong>Map Click:</strong> ${e.latlng.lat.toFixed(5)}, ${e.latlng.lng.toFixed(5)}`;
});

(async function init() {
  try {
    if (speciesFilter) speciesFilter.innerHTML = '<option value="All Species">Loading...</option>';
    if (unitFilter) unitFilter.innerHTML = '<option value="">Loading...</option>';

    await loadHuntData();

    populateSpecies();
    populateUnits();

    buildLiveHuntUnitsLayer();
    buildUSFSLayer();
    buildBLMLayer();

    await refreshLiveBoundaryFilter();

    renderUnitCenters();
    renderOwnershipPlaceholders();
    renderAreaInfo();
    renderOutfitters();
    renderOutfitterResults();
    renderHuntResults();
  } catch (err) {
    console.error('Init failed:', err);

    if (speciesFilter) speciesFilter.innerHTML = '<option value="All Species">Load Failed</option>';
    if (unitFilter) unitFilter.innerHTML = '<option value="">Load Failed</option>';

    if (huntResultsEl) {
      huntResultsEl.innerHTML = `<div class="empty">Failed to load hunt data: ${escapeHtml(err.message || String(err))}</div>`;
    }
    if (resultsEl) {
      resultsEl.innerHTML = `<div class="empty">Initialization error: ${escapeHtml(err.message || String(err))}</div>`;
    }
    if (areaInfoEl) {
      areaInfoEl.innerHTML = 'App failed to initialize. Open browser console for details.';
    }
  }
})();
