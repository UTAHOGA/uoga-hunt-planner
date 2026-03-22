// CLEANED APP.JS — STABLE BASELINE

let huntData = [];
let selectedHunt = null;
let selectedUnit = null;

const APP_BUILD = 'clean-2026-03-21-99';

// ---------- BASIC MAP SETUP ----------
const map = L.map('map', {
  zoomControl: true,
  attributionControl: true
}).setView([39.4, -111.6], 7);

const basemaps = {
  topo: L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png'),
  satellite: L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
  )
};

basemaps.topo.addTo(map);

// ---------- UI ELEMENTS ----------
const speciesFilter = document.getElementById('speciesFilter');
const weaponFilter = document.getElementById('weaponFilter');
const seasonFilter = document.getElementById('seasonFilter');
const unitFilter = document.getElementById('unitFilter');

const resultsEl = document.getElementById('results');
const huntHeader = document.getElementById('huntHeader');

// ---------- SAFE HELPERS ----------
function safe(v) {
  return (v || '').toString().toLowerCase();
}

// ---------- LOAD DATA ----------
async function loadHunts() {
  try {
    const res = await fetch('https://json.uoga.workers.dev/hunt-boundaries');
    huntData = await res.json();
    renderHunts();
  } catch (e) {
    console.error('Failed to load hunts', e);
  }
}

// ---------- FILTER ----------
function filterHunts() {
  return huntData.filter(h => {
    if (speciesFilter && speciesFilter.value && safe(h.species) !== safe(speciesFilter.value)) return false;
    if (weaponFilter && weaponFilter.value && safe(h.weapon) !== safe(weaponFilter.value)) return false;
    if (seasonFilter && seasonFilter.value && safe(h.season) !== safe(seasonFilter.value)) return false;
    if (unitFilter && unitFilter.value && safe(h.unit) !== safe(unitFilter.value)) return false;
    return true;
  });
}

// ---------- RENDER ----------
function renderHunts() {
  if (!resultsEl) return;
  resultsEl.innerHTML = '';

  const hunts = filterHunts();

  hunts.forEach(h => {
    const div = document.createElement('div');
    div.className = 'hunt-item';
    div.textContent = `${h.species} - ${h.unit}`;
    div.onclick = () => selectHunt(h);
    resultsEl.appendChild(div);
  });
}

// ---------- SELECT ----------
function selectHunt(hunt) {
  selectedHunt = hunt;

  if (huntHeader) {
    huntHeader.innerHTML = `
      <b>${hunt.species}</b><br>
      Unit: ${hunt.unit}<br>
      Weapon: ${hunt.weapon}
    `;
  }

  if (hunt.geometry) {
    const layer = L.geoJSON(hunt.geometry);
    map.fitBounds(layer.getBounds());
  }
}

// ---------- EVENTS ----------
[speciesFilter, weaponFilter, seasonFilter, unitFilter].forEach(el => {
  if (!el) return;
  el.addEventListener('change', renderHunts);
});

// ---------- START ----------
loadHunts();
