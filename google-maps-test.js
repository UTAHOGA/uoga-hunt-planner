const GOOGLE_MAPS_API_KEY = 'AIzaSyC7XqvddiUy5weRDwsGBpVfW0sodNr9kUw';
const BOUNDARY_SOURCE = 'https://json.uoga.workers.dev/hunt-boundaries';
const HUNT_TYPE_ORDER = [
  'General',
  'Youth',
  'Limited Entry',
  'Premium Limited Entry',
  'Management',
  'Dedicated Hunter',
  'Cactus Buck',
  'Once-in-a-Lifetime',
  'Antlerless'
];
const HUNT_CATEGORY_ORDER = [
  'Mature Bull',
  'General Bull',
  'Spike Only',
  'Youth',
  'Extended Archery',
  'Private Land Only',
  'Antlerless',
  'Pronghorn',
  'Moose',
  'Rocky Mountain Bighorn',
  'Desert Bighorn',
  'Mountain Goat',
  'Bison',
  'Black Bear',
  'Harvest Objective',
  'Pursuit',
  'Statewide Permit'
];
const SEX_ORDER = ['Buck', 'Bull', 'Doe', 'Cow', 'Antlerless', 'Ram', 'Ewe', 'Either'];
const WEAPON_ORDER = [
  'Any Legal Weapon',
  'Archery',
  'Muzzleloader',
  'Any Weapon',
  'Shotgun',
  'Rifle',
  'Multiseason',
  'Pursuit'
];
const outfitterListings = [
  {
    listingName: 'Wild Eyez Outfitters',
    listingType: 'Outfitter',
    certLevel: 'CPO',
    species: 'Elk, Mule Deer',
    city: 'Manti',
    unitsServed: 'beaver-east,fishlake,manti-san-rafael,monroe,fillmore,nebo',
    lat: 39.2683,
    lng: -111.6369
  }
];
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
let placeholderOverlays = [];
let outfitterMarkers = [];
let selectedHunt = null;
let selectedBoundary = null;

const unitFilter = document.getElementById('unitFilter');
const speciesFilter = document.getElementById('speciesFilter');
const sexFilter = document.getElementById('sexFilter');
const huntTypeFilter = document.getElementById('huntTypeFilter');
const huntCategoryFilter = document.getElementById('huntCategoryFilter');
const weaponFilter = document.getElementById('weaponFilter');
const searchInput = document.getElementById('searchInput');
const mapTypeSelect = document.getElementById('mapTypeSelect');
const resetBtn = document.getElementById('resetBtn');
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
const statsText = document.getElementById('statsText');
const selectedText = document.getElementById('selectedText');
const clickInfoText = document.getElementById('clickInfoText');
const outfitterList = document.getElementById('outfitterList');
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

function getUnitValue(h) {
  return firstNonEmpty(h.unitName, h.unitCode);
}

function getSex(h) {
  return firstNonEmpty(h.sex, h.gender);
}

function getHuntType(h) {
  return firstNonEmpty(h.huntType, h.type);
}

function getHuntCategory(h) {
  return firstNonEmpty(h.huntCategory, h.category, getHuntType(h));
}

function getWeapon(h) {
  return firstNonEmpty(h.weapon, h.weaponType);
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

function getSexLabel(value) {
  return value === 'Either' ? 'Either Sex' : value;
}

function getFilterState() {
  return {
    unit: safe(unitFilter.value),
    species: safe(speciesFilter.value),
    sex: safe(sexFilter.value),
    huntType: safe(huntTypeFilter.value),
    huntCategory: safe(huntCategoryFilter.value),
    weapon: safe(weaponFilter.value)
  };
}

function getFilteredHunts(options = {}) {
  const state = { ...getFilterState(), ...(options.overrides || {}) };
  const excluded = new Set(options.exclude || []);
  const search = safe(searchInput.value).trim().toLowerCase();

  return huntData.filter(hunt => {
    const unitOk = excluded.has('unit') || state.unit === 'All Units' || getUnitValue(hunt) === state.unit;
    const speciesOk = excluded.has('species') || state.species === 'All Species' || getSpecies(hunt) === state.species;
    const sexOk = excluded.has('sex') || state.sex === 'All' || getSex(hunt) === state.sex;
    const huntTypeOk = excluded.has('huntType') || state.huntType === 'All' || getHuntType(hunt) === state.huntType;
    const huntCategoryOk = excluded.has('huntCategory') || state.huntCategory === 'All' || getHuntCategory(hunt) === state.huntCategory;
    const weaponOk = excluded.has('weapon') || state.weapon === 'All' || getWeapon(hunt) === state.weapon;
    const haystack = [
      getHuntCode(hunt),
      getHuntTitle(hunt),
      getUnitName(hunt),
      getSpecies(hunt),
      getSex(hunt),
      getHuntType(hunt),
      getHuntCategory(hunt),
      getWeapon(hunt)
    ].join(' ').toLowerCase();
    const searchOk = options.ignoreSearch ? true : (!search || haystack.includes(search));
    return unitOk && speciesOk && sexOk && huntTypeOk && huntCategoryOk && weaponOk && searchOk;
  });
}

function sortWithPreferredOrder(values, preferredOrder) {
  const rank = new Map(preferredOrder.map((value, index) => [value, index]));
  return [...values].sort((a, b) => {
    const aRank = rank.has(a) ? rank.get(a) : Number.MAX_SAFE_INTEGER;
    const bRank = rank.has(b) ? rank.get(b) : Number.MAX_SAFE_INTEGER;
    if (aRank !== bRank) return aRank - bRank;
    return a.localeCompare(b);
  });
}

function getHuntTypeLabel(value) {
  return value === 'General' ? 'General Season' : value;
}

function populateSelect(select, values, allLabel = 'All', labelFn = value => value) {
  select.innerHTML = [
    `<option value="${escapeHtml(allLabel)}">${escapeHtml(allLabel)}</option>`,
    ...values.map(value => `<option value="${escapeHtml(value)}">${escapeHtml(labelFn(value))}</option>`)
  ].join('');
}

function populateSpecies() {
  const species = Array.from(new Set(huntData.map(getSpecies).filter(Boolean))).sort();
  populateSelect(speciesFilter, species, 'All Species');
}

function refreshDependentFilters() {
  const currentState = getFilterState();

  const unitValues = Array.from(new Set(getFilteredHunts({ exclude: ['unit'], ignoreSearch: true }).map(getUnitValue).filter(Boolean))).sort();
  const speciesValues = Array.from(new Set(getFilteredHunts({ exclude: ['species'], ignoreSearch: true }).map(getSpecies).filter(Boolean))).sort();
  const sexValues = sortWithPreferredOrder(Array.from(new Set(getFilteredHunts({ exclude: ['sex'], ignoreSearch: true }).map(getSex).filter(Boolean))), SEX_ORDER);
  const huntTypeValues = sortWithPreferredOrder(Array.from(new Set(getFilteredHunts({ exclude: ['huntType'], ignoreSearch: true }).map(getHuntType).filter(Boolean))), HUNT_TYPE_ORDER);
  const huntCategoryValues = sortWithPreferredOrder(Array.from(new Set(getFilteredHunts({ exclude: ['huntCategory'], ignoreSearch: true }).map(getHuntCategory).filter(Boolean))), HUNT_CATEGORY_ORDER);
  const weaponValues = sortWithPreferredOrder(Array.from(new Set(getFilteredHunts({ exclude: ['weapon'], ignoreSearch: true }).map(getWeapon).filter(Boolean))), WEAPON_ORDER);

  populateSelect(unitFilter, unitValues, 'All Units');
  populateSelect(speciesFilter, speciesValues, 'All Species');
  populateSelect(sexFilter, sexValues, 'All', getSexLabel);
  populateSelect(huntTypeFilter, huntTypeValues, 'All', getHuntTypeLabel);
  populateSelect(huntCategoryFilter, huntCategoryValues);
  populateSelect(weaponFilter, weaponValues);

  unitFilter.value = unitValues.includes(currentState.unit) ? currentState.unit : 'All Units';
  speciesFilter.value = speciesValues.includes(currentState.species) ? currentState.species : 'All Species';
  sexFilter.value = sexValues.includes(currentState.sex) ? currentState.sex : 'All';
  huntTypeFilter.value = huntTypeValues.includes(currentState.huntType) ? currentState.huntType : 'All';
  huntCategoryFilter.value = huntCategoryValues.includes(currentState.huntCategory) ? currentState.huntCategory : 'All';
  weaponFilter.value = weaponValues.includes(currentState.weapon) ? currentState.weapon : 'All';
}

function slugify(value) {
  return safe(value)
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function getOutfittersForHunt(hunt) {
  if (!hunt) return [];
  const unitSlug = slugify(getUnitValue(hunt));
  return outfitterListings.filter(listing => {
    const isCPO = listing.certLevel === 'CPO';
    const isCPG = listing.certLevel === 'CPG';
    if ((isCPO && !toggleCPO?.checked) || (isCPG && !toggleCPG?.checked)) return false;
    if (!toggleOutfitters?.checked) return false;
    const served = safe(listing.unitsServed).split(',').map(part => slugify(part.trim())).filter(Boolean);
    return unitSlug && served.includes(unitSlug);
  });
}

function renderOutfitterResults(hunt = null) {
  if (!outfitterList) return;
  const listings = getOutfittersForHunt(hunt);
  if (!hunt) {
    outfitterList.innerHTML = 'Select a hunt or boundary to load outfitter results.';
    return;
  }
  if (!listings.length) {
    outfitterList.innerHTML = 'No vetted outfitter listings match the current hunt and certification filters.';
    return;
  }
  outfitterList.innerHTML = listings.map(listing => `
    <div class="hunt-card">
      <h3>${escapeHtml(listing.listingName)}</h3>
      <div class="hunt-meta">
        <div><strong>Type:</strong> ${escapeHtml(listing.listingType)}</div>
        <div><strong>Certification:</strong> ${escapeHtml(listing.certLevel)}</div>
        <div><strong>City:</strong> ${escapeHtml(listing.city)}</div>
        <div><strong>Species:</strong> ${escapeHtml(listing.species)}</div>
      </div>
    </div>
  `).join('');
}

function setClickInfo(html) {
  if (clickInfoText) clickInfoText.innerHTML = html;
}

function setSelectedHuntState(hunt, sourceLabel = '') {
  selectedHunt = hunt || null;
  const label = sourceLabel ? `<em>${escapeHtml(sourceLabel)}</em><br>` : '';
  if (!hunt) {
    setSelectedText('Click a hunt boundary to inspect it.');
    setOverlaySelection('No hunt selected', 'Click a hunt boundary to inspect it.');
    renderOutfitterResults(null);
    return;
  }

  setSelectedText([
    label,
    `<strong>${escapeHtml(getHuntTitle(hunt))}</strong>`,
    escapeHtml(getUnitName(hunt)),
    escapeHtml(getSpecies(hunt)),
    escapeHtml(getSexLabel(getSex(hunt)) || 'N/A'),
    escapeHtml(getHuntTypeLabel(getHuntType(hunt)) || 'N/A'),
    escapeHtml(getHuntCategory(hunt) || 'N/A'),
    escapeHtml(getWeapon(hunt) || 'N/A'),
    escapeHtml(getDates(hunt) || 'Season unavailable')
  ].join('<br>'));
  setOverlaySelection(
    getHuntTitle(hunt),
    [getUnitName(hunt), getSpecies(hunt), getWeapon(hunt) || 'Weapon unavailable', getDates(hunt) || 'Season unavailable'].join(' • ')
  );
  renderOutfitterResults(hunt);
}

function renderStats() {
  const filtered = getFilteredHunts();
  statsText.innerHTML = [
    `${huntData.length} hunt records loaded.`,
    `${filtered.length} hunts match current filters.`,
    `${visibleFeatureIds.size} boundary polygons drawn.`,
    `Google build-out prototype using the same hunt data as the main planner.`,
    `Live hunt units are real. USFS, BLM, SITLA, State Lands, and Private Lands are currently mirrored as placeholder comparison layers.`
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
      <h3>${escapeHtml(getHuntTitle(hunt))}</h3>
      <div class="hunt-meta">
        <div><strong>Unit:</strong> ${escapeHtml(getUnitName(hunt) || 'N/A')}</div>
        <div><strong>Species:</strong> ${escapeHtml(getSpecies(hunt) || 'N/A')}</div>
        <div><strong>Sex:</strong> ${escapeHtml(getSexLabel(getSex(hunt)) || 'N/A')}</div>
        <div><strong>Type:</strong> ${escapeHtml(getHuntTypeLabel(getHuntType(hunt)) || 'N/A')}</div>
        <div><strong>Class:</strong> ${escapeHtml(getHuntCategory(hunt) || 'N/A')}</div>
        <div><strong>Weapon:</strong> ${escapeHtml(getWeapon(hunt) || 'N/A')}</div>
        <div><strong>Season:</strong> ${escapeHtml(getDates(hunt) || 'Season unavailable')}</div>
      </div>
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

function clearPlaceholderOverlays() {
  placeholderOverlays.forEach(overlay => overlay.setMap(null));
  placeholderOverlays = [];
}

function addPlaceholderMarker(config) {
  const marker = new google.maps.Marker({
    position: config.position,
    map,
    title: config.title,
    icon: {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 8,
      fillColor: config.color,
      fillOpacity: 0.45,
      strokeColor: config.color,
      strokeWeight: 2
    }
  });
  marker.addListener('click', () => {
    infoWindow.setContent(`<div style="font-family:Georgia,serif;"><strong>${escapeHtml(config.title)}</strong><br>${escapeHtml(config.note)}</div>`);
    infoWindow.open({ map, anchor: marker });
  });
  placeholderOverlays.push(marker);
}

function renderOwnershipPlaceholders() {
  clearPlaceholderOverlays();
  if (!map) return;

  if (toggleUSFS?.checked) {
    addPlaceholderMarker({ position: { lat: 39.55, lng: -111.9 }, title: 'USFS Forests', note: 'Placeholder comparison layer', color: '#466b3d' });
  }
  if (toggleBLM?.checked) {
    addPlaceholderMarker({ position: { lat: 39.15, lng: -112.35 }, title: 'BLM Districts', note: 'Placeholder comparison layer', color: '#8f6a2f' });
  }
  if (toggleSITLA?.checked) {
    addPlaceholderMarker({ position: { lat: 39.05, lng: -111.9 }, title: 'SITLA', note: 'Placeholder comparison layer', color: '#4f9d62' });
  }
  if (toggleState?.checked) {
    addPlaceholderMarker({ position: { lat: 40.1, lng: -111.9 }, title: 'State Lands', note: 'Placeholder comparison layer', color: '#2b8f9a' });
  }
  if (togglePrivate?.checked) {
    addPlaceholderMarker({ position: { lat: 38.9, lng: -111.2 }, title: 'Private Lands', note: 'Placeholder comparison layer', color: '#9a3e3e' });
  }
}

function clearOutfitterMarkers() {
  outfitterMarkers.forEach(marker => marker.setMap(null));
  outfitterMarkers = [];
}

function renderOutfitterMarkers() {
  clearOutfitterMarkers();
  if (!map || !toggleOutfitters?.checked) return;

  outfitterListings.forEach(listing => {
    const matchesAnyVisibleHunt = getFilteredHunts({ ignoreSearch: true }).some(hunt => getOutfittersForHunt(hunt).includes(listing));
    if (!matchesAnyVisibleHunt) return;

    const marker = new google.maps.Marker({
      position: { lat: listing.lat, lng: listing.lng },
      map,
      title: listing.listingName,
      icon: {
        path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
        scale: 6,
        fillColor: '#ba622d',
        fillOpacity: 0.95,
        strokeColor: '#7c3e18',
        strokeWeight: 2
      }
    });
    marker.addListener('click', () => {
      infoWindow.setContent([
        '<div style="font-family:Georgia,serif;min-width:220px;">',
        `<strong>${escapeHtml(listing.listingName)}</strong><br>`,
        `${escapeHtml(listing.listingType)}<br>`,
        `${escapeHtml(listing.certLevel)}<br>`,
        `${escapeHtml(listing.city)}<br>`,
        `${escapeHtml(listing.species)}`,
        '</div>'
      ].join(''));
      infoWindow.open({ map, anchor: marker });
    });
    outfitterMarkers.push(marker);
  });
}

function refreshMapData() {
  refreshDependentFilters();
  const filtered = getFilteredHunts();
  visibleFeatureIds = buildVisibleBoundarySet(filtered);

  map.data.setStyle(feature => {
    const id = safe(feature.getProperty('BoundaryID')).trim();
    if (!toggleUnits?.checked || !visibleFeatureIds.has(id)) {
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
  renderOwnershipPlaceholders();
  renderOutfitterMarkers();
  if (selectedHunt) {
    const refreshedSelected = filtered.find(hunt => getHuntCode(hunt) === getHuntCode(selectedHunt));
    setSelectedHuntState(refreshedSelected || null, refreshedSelected ? 'Selected hunt' : '');
  } else if (!selectedBoundary) {
    renderOutfitterResults(null);
  }
}

function zoomToHunt(huntCode) {
  const hunt = huntData.find(item => getHuntCode(item) === huntCode);
  if (!hunt) return;
  selectedBoundary = null;

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

  setSelectedHuntState(hunt, 'Selected hunt');
  setClickInfo(`Zoomed to <strong>${escapeHtml(getHuntTitle(hunt))}</strong>.`);

  if (hasBounds) map.fitBounds(bounds);
}

function attachBoundaryEvents() {
  map.data.addListener('click', event => {
    const boundaryId = safe(event.feature.getProperty('BoundaryID')).trim();
    const boundaryName = safe(event.feature.getProperty('Boundary_Name')).trim();
    const matches = getFilteredHunts().filter(hunt => getBoundaryIds(hunt).includes(boundaryId));
    selectedBoundary = { boundaryId, boundaryName };

    const html = [
      `<strong>${escapeHtml(boundaryName || 'Selected boundary')}</strong>`,
      `${matches.length} matching hunt(s)`
    ];

    if (matches[0]) {
      html.push(escapeHtml(getHuntTitle(matches[0])));
      html.push(escapeHtml(getDates(matches[0]) || 'Season unavailable'));
      setSelectedHuntState(matches[0], `Boundary click: ${boundaryName || 'Selected boundary'}`);
    } else {
      selectedHunt = null;
      setOverlaySelection(boundaryName || 'Selected boundary', `${matches.length} matching hunt(s)`);
      renderOutfitterResults(null);
    }

    setClickInfo(html.join('<br>'));

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
  unitFilter.addEventListener('change', refreshMapData);
  speciesFilter.addEventListener('change', refreshMapData);
  sexFilter.addEventListener('change', refreshMapData);
  huntTypeFilter.addEventListener('change', refreshMapData);
  huntCategoryFilter.addEventListener('change', refreshMapData);
  weaponFilter.addEventListener('change', refreshMapData);
  searchInput.addEventListener('input', refreshMapData);
  mapTypeSelect.addEventListener('change', () => {
    map.setMapTypeId(mapTypeSelect.value);
  });
  [
    toggleUnits,
    toggleUSFS,
    toggleBLM,
    toggleSITLA,
    toggleState,
    togglePrivate,
    toggleOutfitters,
    toggleCPO,
    toggleCPG
  ].forEach(control => {
    if (control) control.addEventListener('change', refreshMapData);
  });
  resetBtn.addEventListener('click', () => {
    unitFilter.value = 'All Units';
    speciesFilter.value = 'All Species';
    sexFilter.value = 'All';
    huntTypeFilter.value = 'All';
    huntCategoryFilter.value = 'All';
    weaponFilter.value = 'All';
    searchInput.value = '';
    if (toggleUnits) toggleUnits.checked = true;
    if (toggleUSFS) toggleUSFS.checked = false;
    if (toggleBLM) toggleBLM.checked = false;
    if (toggleSITLA) toggleSITLA.checked = false;
    if (toggleState) toggleState.checked = false;
    if (togglePrivate) togglePrivate.checked = false;
    if (toggleOutfitters) toggleOutfitters.checked = true;
    if (toggleCPO) toggleCPO.checked = true;
    if (toggleCPG) toggleCPG.checked = true;
    mapTypeSelect.value = 'roadmap';
    map.setMapTypeId('roadmap');
    map.setCenter({ lat: 39.3, lng: -111.7 });
    map.setZoom(6);
    selectedHunt = null;
    selectedBoundary = null;
    setSelectedText('Click a hunt boundary to inspect it.');
    setClickInfo('Click a hunt boundary to inspect it.');
    setOverlaySelection('No hunt selected', 'Click a hunt boundary to inspect it.');
    renderOutfitterResults(null);
    refreshMapData();
  });
  huntList.addEventListener('click', event => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const button = target.closest('button[data-hunt-code]');
    if (!button) return;
    zoomToHunt(button.getAttribute('data-hunt-code'));
  });
  if (openBoundaryBtn) {
    openBoundaryBtn.addEventListener('click', () => {
      if (!selectedHunt) return;
      const url = `https://dwrapps.utah.gov/huntboundary/PrintABoundary?HN=${encodeURIComponent(getHuntCode(selectedHunt))}`;
      window.open(url, '_blank', 'noopener');
    });
  }
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
    setClickInfo('Click a hunt boundary to inspect it.');
    renderOutfitterResults(null);
  } catch (err) {
    console.error(err);
    statsText.textContent = 'Google Maps test failed to initialize.';
    setSelectedText('Initialization failed. Check the API key, billing, and browser console.');
    setOverlaySelection('Initialization failed', 'Check the API key, billing, and browser console.');
    huntList.textContent = safe(err.message || err);
  }
})();
