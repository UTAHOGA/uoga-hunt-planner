// -----------------------------
// UOGA Hunt Planner - Stable Baseline
// -----------------------------

let huntData = [];
let selectedHunt = null;
let selectedUnit = null;
const APP_BUILD = 'build-2026-03-16-01';

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

const DWR_MAPSERVER = 'https://dwrmapserv.utah.gov/dwrarcgis/rest/services/HuntBoundary/HUNT_BOUNDARY_PROD/MapServer';
const DWR_HUNT_BOUNDARY_LAYER = `${DWR_MAPSERVER}/0`;
const DWR_HUNT_NUMBER_TO_BOUNDARIES = 'https://dwrapps.utah.gov/huntboundary/HuntNumberToBoundaries';

const UNIT_CENTER_LOOKUP = {
  'beaver-east': [38.28, -112.48],
  'book-cliffs': [39.72, -109.35],
  'cache': [41.78, -111.62],
  'chalk-creek-east': [40.88, -111.07],
  'diamond-mountain': [40.42, -109.18],
  'fillmore-oak-creek': [38.95, -112.33],
  fishlake: [38.62, -111.78],
  monroe: [38.47, -112.05],
  'manti-san-rafael': [39.12, -111.12],
  nebo: [39.88, -111.74],
  'pine-valley': [37.45, -113.44],
  'plateau-boulder-kaiparowits': [37.88, -111.42],
  'plateau-thousand-lakes': [38.17, -111.36],
  'south-slope-bonanza': [40.16, -110.22],
  'south-slope-vernal': [40.46, -109.56],
  'west-desert-south': [38.78, -113.42]
};

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
const resultsTrayEl = document.querySelector('.results');
const toggleResultsTrayBtn = document.getElementById('toggleResultsTray');

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

function getUsfsLabel(properties) {
  const p = properties || {};
  return firstNonEmpty(
    p.FORESTNAME,
    p.FORESTNAMECOMMON,
    p.FORESTSHORTNAME,
    p.UNIT_NAME,
    p.UNITNAME,
    p.ADMIN_NAME,
    p.NAME,
    p.LABEL,
    'US Forest Service Unit'
  );
}

function getBlmLabel(properties) {
  const p = properties || {};
  const label = firstNonEmpty(
    p.ADMU_NAME,
    p.ADMU_DISPLAY_NAME,
    p.ADMIN_ST_NAME,
    p.OFFICE_NAME,
    p.DISTRICT_NAME,
    p.PARENT_NAME,
    p.ADM_UNIT_CD,
    p.ADMIN_UNIT,
    p.FIELD_OFFICE,
    p.NAME,
    'BLM Utah Administrative Unit'
  );

  return label
    .replace(/\s+field\s+office$/i, ' District')
    .replace(/\s+district\s+office$/i, ' District')
    .replace(/\s+office$/i, '')
    .trim();
}

function getFieldPreview(properties, preferredKeys = []) {
  const p = properties || {};
  const keys = Object.keys(p);
  if (!keys.length) return '';

  const ordered = [
    ...preferredKeys.filter(key => key in p),
    ...keys.filter(key => !preferredKeys.includes(key))
  ];

  return ordered
    .slice(0, 6)
    .map(key => `${key}: ${safe(p[key]).trim() || '[blank]'}`)
    .join(' | ');
}

function createDiamondIcon() {
  return L.divIcon({
    className: 'hunt-center-icon',
    html: '<div style="width:14px;height:14px;background:#e5522b;border:3px solid #ffd84d;transform:rotate(45deg);box-sizing:border-box;"></div>',
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });
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

function getTrustedUnitCenter(h) {
  const candidates = [
    slugify(getUnitCode(h)),
    slugify(getUnitName(h)),
    slugify(getUnitValue(h))
  ].filter(Boolean);

  for (const key of candidates) {
    if (UNIT_CENTER_LOOKUP[key]) {
      return UNIT_CENTER_LOOKUP[key];
    }
  }

  return null;
}

function zoomToHuntSelection(hunt) {
  const lat = getHuntLat(hunt);
  const lng = getHuntLng(hunt);

  if (isLikelyUtahCoordinate(lat, lng)) {
    map.setView([lat, lng], 8);
    return;
  }

  const trustedCenter = getTrustedUnitCenter(hunt);
  if (trustedCenter) {
    map.setView(trustedCenter, 8);
    return;
  }

  zoomToSelectedBoundary();
}

function isLikelyUtahCoordinate(lat, lng) {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= 36.5 &&
    lat <= 42.5 &&
    lng >= -114.5 &&
    lng <= -108.5
  );
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

function getHuntBoundaryStyle() {
  const zoom = map.getZoom();

  if (zoom <= 6) {
    return { color: '#3653b3', weight: 1.2, fillColor: '#d6def7', fillOpacity: 0.18 };
  }

  if (zoom <= 8) {
    return { color: '#3653b3', weight: 2, fillColor: '#d6def7', fillOpacity: 0.28 };
  }

  return { color: '#3653b3', weight: 3.2, fillColor: '#d6def7', fillOpacity: 0.42 };
}

const map = L.map('map', { zoomControl: true }).setView([39.3, -111.7], 6);

map.createPane('blmPane');
map.getPane('blmPane').style.zIndex = 430;
map.createPane('usfsPane');
map.getPane('usfsPane').style.zIndex = 440;
map.createPane('huntPane');
map.getPane('huntPane').style.zIndex = 350;
map.createPane('selectedHuntPane');
map.getPane('selectedHuntPane').style.zIndex = 450;

const basemaps = {
  osm: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap'
  }),
  topo: L.layerGroup([
    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Terrain_Base/MapServer/tile/{z}/{y}/{x}',
      { maxZoom: 13, attribution: 'Tiles &copy; Esri' }
    ),
    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Reference_Overlay/MapServer/tile/{z}/{y}/{x}',
      { maxZoom: 19, attribution: 'Labels &copy; Esri' }
    )
  ]),
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
let selectedBoundaryLayer = null;
let usfsDistrictLayer = null;
let blmDistrictLayer = null;
let liveLayerSource = 'none';
let huntResultsLimit = 100;
let liveFilterToken = 0;
let boundaryZoomToken = 0;
let suppressNextMapClickInfo = false;
let overlayPrioritySource = '';
let overlayPriorityUntil = 0;

function setOverlayPriority(source, evt) {
  overlayPrioritySource = source;
  overlayPriorityUntil = Date.now() + 300;
  suppressNextMapClickInfo = true;

  if (evt?.originalEvent) {
    L.DomEvent.stopPropagation(evt.originalEvent);
  }
}

function shouldYieldToOverlay(source) {
  return overlayPriorityUntil > Date.now() && overlayPrioritySource && overlayPrioritySource !== source;
}

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

function setBuildMarker() {
  if (selectedMeta && !selectedHunt) {
    selectedMeta.textContent = `Choose filters or click a hunt unit to load hunt and outfitter results. (${APP_BUILD})`;
  }
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

  try {
      liveHuntUnitsLayer = L.esri.featureLayer({
        url: DWR_HUNT_BOUNDARY_LAYER,
        pane: 'huntPane',
        style: () => getHuntBoundaryStyle()
      });
    liveLayerSource = 'dwr-feature';
    liveHuntUnitsLayer.on('error', err => {
      console.error('DWR hunt layer failed:', err);
      liveHuntUnitsLayer = null;
      liveLayerSource = 'none';
    });

    if (toggleLiveUnits?.checked) liveHuntUnitsLayer.addTo(map);
  } catch (e) {
    console.error('DWR hunt layer setup failed:', e);
    liveHuntUnitsLayer = null;
    liveLayerSource = 'none';
  }
}

function buildUSFSLayer() {
  if (!window.L || !window.L.esri) return;
  if (usfsDistrictLayer) {
    try { map.removeLayer(usfsDistrictLayer); } catch (e) {}
  }

  usfsDistrictLayer = L.esri.featureLayer({
    url: 'https://apps.fs.usda.gov/arcx/rest/services/EDW/EDW_ForestSystemBoundaries_01/MapServer/0',
    pane: 'usfsPane',
    where: "FORESTNAME IN ('Ashley National Forest','Dixie National Forest','Fishlake National Forest','Manti-La Sal National Forest','Uinta-Wasatch-Cache National Forest')",
    style: () => ({ color: '#476f2d', weight: 2.5, fillOpacity: 0.02 })
  });

  usfsDistrictLayer.bindPopup(layer => {
    const p = layer.feature?.properties || {};
    const forest = getUsfsLabel(p);
    const office = firstNonEmpty(p.REGION, p.FORESTNUM, 'US Forest Service');
    return `<b>${escapeHtml(forest)}</b><br>${escapeHtml(office)}`;
  });

  usfsDistrictLayer.on('click', evt => {
    setOverlayPriority('usfs', evt);
    const p = evt.layer?.feature?.properties || {};
    const forest = getUsfsLabel(p);
    const office = firstNonEmpty(p.REGION, p.FORESTNUM, 'US Forest Service');
    evt.layer.bindPopup(`<b>${escapeHtml(forest)}</b><br>${escapeHtml(office)}`).openPopup();
    if (clickInfoEl) {
      clickInfoEl.innerHTML = `<strong>USFS:</strong> ${escapeHtml(forest)}<br><span style="color:var(--muted);font-size:11px;">${escapeHtml(getFieldPreview(p, ['FORESTNAME', 'FORESTNUMBER', 'REGION']))}</span>`;
    }
  });

  if (toggleUSFS?.checked) usfsDistrictLayer.addTo(map);
  if (typeof usfsDistrictLayer.bringToFront === 'function') usfsDistrictLayer.bringToFront();
}

function buildBLMLayer() {
  if (!window.L || !window.L.esri) return;
  if (blmDistrictLayer) {
    try { map.removeLayer(blmDistrictLayer); } catch (e) {}
  }

  blmDistrictLayer = L.esri.featureLayer({
    url: 'https://gis.blm.gov/utarcgis/rest/services/AdminBoundaries/BLM_UT_ADMU/FeatureServer/0',
    pane: 'blmPane',
    style: () => ({ color: '#b9722f', weight: 2.3, fillOpacity: 0.02 })
  });

  blmDistrictLayer.bindPopup(layer => {
    const p = layer.feature?.properties || {};
    return `<b>BLM Utah</b><br>${escapeHtml(getBlmLabel(p))}`;
  });

  blmDistrictLayer.on('click', evt => {
    if (shouldYieldToOverlay('blm')) return;
    setOverlayPriority('blm', evt);
    const p = evt.layer?.feature?.properties || {};
    const unit = getBlmLabel(p);
    evt.layer.bindPopup(`<b>BLM Utah</b><br>${escapeHtml(unit)}`).openPopup();
    if (clickInfoEl) {
      clickInfoEl.innerHTML = `<strong>BLM:</strong> ${escapeHtml(unit)}<br><span style="color:var(--muted);font-size:11px;">${escapeHtml(getFieldPreview(p, ['ADMU_NAME', 'ADMU_DISPLAY_NAME', 'DISTRICT_NAME', 'OFFICE_NAME', 'PARENT_NAME', 'ADM_UNIT_CD']))}</span>`;
    }
  });

  if (toggleBLM?.checked) blmDistrictLayer.addTo(map);
}

function applyLiveBoundaryWhere(whereClause) {
  if (!liveHuntUnitsLayer || typeof liveHuntUnitsLayer.setWhere !== 'function') return;
  liveHuntUnitsLayer.setWhere(whereClause || '1=1');
}

function clearSelectedBoundaryLayer() {
  if (!selectedBoundaryLayer) return;
  try { map.removeLayer(selectedBoundaryLayer); } catch (e) {}
  selectedBoundaryLayer = null;
}

async function renderSelectedBoundaryOnly(whereClause) {
  clearSelectedBoundaryLayer();

  if (!whereClause || whereClause === '1=0') return;

  if (!window.L || !window.L.esri) return;

  selectedBoundaryLayer = L.esri.featureLayer({
    url: DWR_HUNT_BOUNDARY_LAYER,
    pane: 'selectedHuntPane',
    where: whereClause,
    style: () => ({
      color: '#1d3f91',
      weight: map.getZoom() <= 6 ? 2.2 : map.getZoom() <= 8 ? 3 : 4,
      fillColor: '#9cb4f2',
      fillOpacity: 0.18
    })
  });

  selectedBoundaryLayer.on('error', err => {
    console.error('Selected boundary layer failed:', err);
  });

  selectedBoundaryLayer.addTo(map);
}

function chunk(items, size) {
  const out = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

function titleCaseWords(value) {
  return safe(value)
    .split(/\s+/)
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function getBoundaryNameCandidates(hunt) {
  const names = new Set();
  const unitName = safe(getUnitName(hunt)).trim();
  const unitCode = safe(getUnitCode(hunt)).trim();

  function addNameVariants(value) {
    const base = safe(value).trim();
    if (!base) return;
    names.add(base);
    names.add(titleCaseWords(base));
    names.add(base.toUpperCase());
  }

  if (unitName) {
    addNameVariants(unitName);
    addNameVariants(unitName.replace(/\s*\/\s*/g, '/'));
    addNameVariants(unitName.replace(/\s*\/\s*/g, ', '));
    addNameVariants(unitName.replace(/\s*\/\s*/g, ' '));
  }

  if (unitCode) {
    const codeName = titleCaseWords(unitCode.replace(/-/g, ' '));
    if (codeName) {
      addNameVariants(codeName);
      addNameVariants(codeName.replace(/\s+East$/i, ', East'));
      addNameVariants(codeName.replace(/\s+West$/i, ', West'));
      addNameVariants(codeName.replace(/\s+North$/i, ', North'));
      addNameVariants(codeName.replace(/\s+South$/i, ', South'));
    }
  }

  return new Set(Array.from(names).filter(Boolean));
}

async function queryBoundaryNamesAndIds(hunt) {
  const ids = new Set();
  const names = getBoundaryNameCandidates(hunt);
  const huntCode = safe(getHuntCode(hunt)).trim();

  if (!huntCode) {
    return { names, ids };
  }

  try {
    const url = `${DWR_HUNT_NUMBER_TO_BOUNDARIES}?HN=${encodeURIComponent(huntCode)}`;
    const res = await fetch(url, { credentials: 'omit' });
    if (!res.ok) throw new Error(`HuntNumberToBoundaries query failed: ${res.status}`);
    const data = await res.json();
    const values = Array.isArray(data) ? data : [];

    values.forEach(v => {
      const i = safe(v).trim();
      if (i) ids.add(i);
    });
  } catch (err) {
    console.warn('Boundary ID lookup failed, using unit-name fallback.', err);
  }

  return { names, ids };
}

async function zoomToSelectedBoundary() {
  const token = ++boundaryZoomToken;

  if (!selectedHunt) {
    map.setView([39.3, -111.7], 7);
    return;
  }

  try {
    const huntCode = getHuntCode(selectedHunt);
    if (!huntCode) {
      map.setView([39.3, -111.7], 7);
      return;
    }

    const { names, ids } = await queryBoundaryNamesAndIds(selectedHunt);
    if (token !== boundaryZoomToken) return;

    const where = buildBoundaryFilterSql(names, ids);
    if (!where || where === '1=0') {
      map.setView([39.3, -111.7], 7);
      return;
    }

      const url =
        `${DWR_HUNT_BOUNDARY_LAYER}/query?` +
        `where=${encodeURIComponent(where)}` +
        '&returnExtentOnly=true' +
      '&outSR=4326' +
      '&f=json';

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Boundary extent query failed: ${response.status}`);
    }

    const payload = await response.json();
    if (token !== boundaryZoomToken) return;

    const extent = payload?.extent;
    const xmin = Number(extent?.xmin);
    const ymin = Number(extent?.ymin);
    const xmax = Number(extent?.xmax);
    const ymax = Number(extent?.ymax);

    const validUtahExtent =
      [xmin, ymin, xmax, ymax].every(Number.isFinite) &&
      xmin >= -114.75 &&
      xmax <= -108.25 &&
      ymin >= 36.5 &&
      ymax <= 42.5 &&
      xmin < xmax &&
      ymin < ymax;

    if (!validUtahExtent) {
      map.setView([39.3, -111.7], 7);
      return;
    }

    map.fitBounds(
      [
        [ymin, xmin],
        [ymax, xmax]
      ],
      { padding: [24, 24] }
    );
  } catch (err) {
    console.error('Boundary zoom failed:', err);
    map.setView([39.3, -111.7], 7);
  }
}

function buildBoundaryFilterSql(names, ids) {
  const clauses = [];

  if (names.size) {
    const list = Array.from(names)
      .map(n => `'${safe(n).trim().replace(/'/g, "''")}'`)
      .join(',');
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

  if (!selectedHunt) {
    clearSelectedBoundaryLayer();
    if (toggleLiveUnits?.checked && !liveHuntUnitsLayer) {
      buildLiveHuntUnitsLayer();
    }
    if (toggleLiveUnits?.checked && liveHuntUnitsLayer && !map.hasLayer(liveHuntUnitsLayer)) {
      liveHuntUnitsLayer.addTo(map);
    }
    applyLiveBoundaryWhere('1=1');
    return;
  }

  try {
    const huntCode = getHuntCode(selectedHunt);
    if (!huntCode) {
      applyLiveBoundaryWhere('1=1');
      return;
    }

    const { names, ids } = await queryBoundaryNamesAndIds(selectedHunt);
    if (token !== liveFilterToken) return;

    const where = buildBoundaryFilterSql(names, ids);
    if (!where || where === '1=0') {
      clearSelectedBoundaryLayer();
      applyLiveBoundaryWhere('1=1');
      return;
    }

    if (toggleLiveUnits?.checked) {
      if (!liveHuntUnitsLayer) buildLiveHuntUnitsLayer();
      if (liveHuntUnitsLayer && !map.hasLayer(liveHuntUnitsLayer)) liveHuntUnitsLayer.addTo(map);
      applyLiveBoundaryWhere('1=0');
    } else if (liveHuntUnitsLayer && map.hasLayer(liveHuntUnitsLayer)) {
      map.removeLayer(liveHuntUnitsLayer);
    }
    await renderSelectedBoundaryOnly(where);
  } catch (err) {
    console.error('Boundary filter failed:', err);
    clearSelectedBoundaryLayer();
    if (toggleLiveUnits?.checked && !liveHuntUnitsLayer) {
      buildLiveHuntUnitsLayer();
    }
    if (toggleLiveUnits?.checked && liveHuntUnitsLayer && !map.hasLayer(liveHuntUnitsLayer)) {
      liveHuntUnitsLayer.addTo(map);
    }
    applyLiveBoundaryWhere('1=1');
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
    if (!isLikelyUtahCoordinate(lat, lng)) return;

    const marker = L.marker([lat, lng], {
      icon: createDiamondIcon()
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
    const isSelected = selectedHunt && getHuntCode(selectedHunt) === code;

    return `
      <div class="result-card ${isSelected ? 'selected' : ''}">
        <h3>${escapeHtml(title)}</h3>
        <div>${escapeHtml(code)}</div>
        <div>${escapeHtml(getSex(h) || 'N/A')}</div>
        <div>${escapeHtml(getSpeciesRaw(h) || 'N/A')}</div>
        <div>${escapeHtml(getWeapon(h) || 'N/A')}</div>
        <div>${escapeHtml(getHuntType(h) || 'N/A')}<br><span style="color:var(--muted);">${escapeHtml(getDates(h))}</span></div>
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

  zoomToHuntSelection(hunt);

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

  zoomToHuntSelection(hunt);

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
  setBuildMarker();

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
      setBuildMarker();
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
  basemapSelect.value = 'osm';
  basemapSelect.addEventListener('change', () => {
    Object.values(basemaps).forEach(layer => {
      if (map.hasLayer(layer)) map.removeLayer(layer);
    });
    (basemaps[basemapSelect.value] || basemaps.osm).addTo(map);

    if (toggleLiveUnits?.checked && !liveHuntUnitsLayer) buildLiveHuntUnitsLayer();
    if (toggleLiveUnits?.checked && liveHuntUnitsLayer) liveHuntUnitsLayer.addTo(map);
    if (toggleUSFS?.checked && usfsDistrictLayer) usfsDistrictLayer.addTo(map);
    if (toggleBLM?.checked && blmDistrictLayer) blmDistrictLayer.addTo(map);
    if (toggleUSFS?.checked && usfsDistrictLayer && typeof usfsDistrictLayer.bringToFront === 'function') {
      usfsDistrictLayer.bringToFront();
    }
    if (selectedBoundaryLayer && typeof selectedBoundaryLayer.bringToFront === 'function') {
      selectedBoundaryLayer.bringToFront();
    }
  });
}

if (toggleLiveUnits) {
  toggleLiveUnits.addEventListener('change', () => {
    if (toggleLiveUnits.checked) {
      if (!liveHuntUnitsLayer) buildLiveHuntUnitsLayer();
      if (liveHuntUnitsLayer) liveHuntUnitsLayer.addTo(map);
      refreshLiveBoundaryFilter();
    } else {
      if (liveHuntUnitsLayer && map.hasLayer(liveHuntUnitsLayer)) {
        map.removeLayer(liveHuntUnitsLayer);
      }
    }
  });
}

if (toggleUSFS) {
  toggleUSFS.addEventListener('change', () => {
    if (!usfsDistrictLayer) return;
    if (toggleUSFS.checked) {
      usfsDistrictLayer.addTo(map);
      if (typeof usfsDistrictLayer.bringToFront === 'function') usfsDistrictLayer.bringToFront();
    } else {
      map.removeLayer(usfsDistrictLayer);
    }
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

if (toggleResultsTrayBtn && resultsTrayEl) {
  toggleResultsTrayBtn.addEventListener('click', () => {
    resultsTrayEl.classList.toggle('collapsed');
    toggleResultsTrayBtn.textContent = resultsTrayEl.classList.contains('collapsed') ? '˄' : '˅';
  });
}

if (huntResultsEl) {
  huntResultsEl.addEventListener('click', e => {
    const target = e.target;
    if (!(target instanceof HTMLElement)) return;

    const row = target.closest('.result-card');
    if (row && row instanceof HTMLElement) {
      const rowBtn = row.querySelector('button[data-action="select-hunt"]');
      if (rowBtn instanceof HTMLElement && !target.closest('button')) {
        const rowHuntCode = safe(rowBtn.getAttribute('data-hunt-code')).trim();
        if (rowHuntCode) {
          selectHuntByCode(rowHuntCode);
          return;
        }
      }
    }

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
  if (suppressNextMapClickInfo) {
    suppressNextMapClickInfo = false;
    return;
  }
  if (!clickInfoEl) return;
  clickInfoEl.innerHTML = `<strong>Map Click:</strong> ${e.latlng.lat.toFixed(5)}, ${e.latlng.lng.toFixed(5)}`;
});

map.on('zoomend', () => {
  if (liveHuntUnitsLayer && typeof liveHuntUnitsLayer.setStyle === 'function') {
    liveHuntUnitsLayer.setStyle(() => getHuntBoundaryStyle());
  }
  if (selectedBoundaryLayer && typeof selectedBoundaryLayer.setStyle === 'function') {
    selectedBoundaryLayer.setStyle({
      color: '#1d3f91',
      weight: map.getZoom() <= 6 ? 2.2 : map.getZoom() <= 8 ? 3 : 4,
      fillColor: '#9cb4f2',
      fillOpacity: 0.18
    });
  }
});

(async function init() {
  try {
    if (speciesFilter) speciesFilter.innerHTML = '<option value="All Species">Loading...</option>';
    if (unitFilter) unitFilter.innerHTML = '<option value="">Loading...</option>';
    setBuildMarker();

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
    window.setTimeout(() => map.invalidateSize(), 0);
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
    setBuildMarker();
    window.setTimeout(() => map.invalidateSize(), 0);
  }
})();
