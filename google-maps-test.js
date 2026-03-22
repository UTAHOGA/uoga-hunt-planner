const GOOGLE_BASELINE_DEFAULT_CENTER = { lat: 39.2672138, lng: -111.6346885 };
const GOOGLE_BASELINE_DEFAULT_ZOOM = 8;
const LOCAL_HUNT_BOUNDARIES_PATH = 'https://json.uoga.workers.dev/hunt-boundaries';
const USFS_QUERY_URL = "https://apps.fs.usda.gov/arcx/rest/services/EDW/EDW_ForestSystemBoundaries_01/MapServer/0/query?where=" + encodeURIComponent("FORESTNAME IN ('Ashley National Forest','Dixie National Forest','Fishlake National Forest','Manti-La Sal National Forest','Uinta-Wasatch-Cache National Forest')") + "&outFields=FORESTNAME&returnGeometry=true&outSR=4326&f=geojson";
const BLM_QUERY_URL = 'https://gis.blm.gov/utarcgis/rest/services/AdminBoundaries/BLM_UT_ADMU/FeatureServer/0/query?where=1%3D1&outFields=*&returnGeometry=true&outSR=4326&f=geojson';

let googleBaselineMap = null;
let huntUnitsLayer = null;
let usfsLayer = null;
let blmLayer = null;
let utahFramePolyline = null;

const layerState = {
  huntUnitsLoaded: false,
  usfsLoaded: false,
  blmLoaded: false
};

function updateStatus(message) {
  const el = document.getElementById('status');
  if (el) el.textContent = message;
}

function getSelectedMapType() {
  const select = document.getElementById('mapTypeSelect');
  return select && select.value ? select.value : 'terrain';
}

function applyMapType(type) {
  if (!googleBaselineMap) return;
  googleBaselineMap.setMapTypeId(type);
  updateStatus(`Showing native Google ${type} basemap with the current overlays.`);
}

function ensureMap() {
  return googleBaselineMap && window.google && google.maps;
}

async function fetchGeoJson(url) {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Layer request failed: ${response.status}`);
  }
  return response.json();
}

function clearDataLayer(mapDataLayer) {
  if (!mapDataLayer) return;
  mapDataLayer.forEach(feature => mapDataLayer.remove(feature));
}

function setDataLayerVisibility(mapDataLayer, visible) {
  if (!mapDataLayer) return;
  mapDataLayer.setMap(visible ? googleBaselineMap : null);
}

function styleHuntUnits() {
  if (!huntUnitsLayer) return;
  huntUnitsLayer.setStyle({
    strokeColor: '#3653b3',
    strokeOpacity: 0.9,
    strokeWeight: 2,
    fillColor: '#d6def7',
    fillOpacity: 0.06,
    clickable: false,
    zIndex: 2
  });
}

function styleUsfs() {
  if (!usfsLayer) return;
  usfsLayer.setStyle({
    strokeColor: '#476f2d',
    strokeOpacity: 0.95,
    strokeWeight: 2.2,
    fillColor: '#6f9e52',
    fillOpacity: 0.03,
    clickable: false,
    zIndex: 3
  });
}

function styleBlm() {
  if (!blmLayer) return;
  blmLayer.setStyle({
    strokeColor: '#b9722f',
    strokeOpacity: 0.95,
    strokeWeight: 2.1,
    fillColor: '#d5aa78',
    fillOpacity: 0.02,
    clickable: false,
    zIndex: 3
  });
}

async function ensureHuntUnitsLayer() {
  if (!ensureMap()) return;
  if (!huntUnitsLayer) {
    huntUnitsLayer = new google.maps.Data({ map: null });
    styleHuntUnits();
  }
  if (layerState.huntUnitsLoaded) return;
  updateStatus('Loading hunt unit boundaries…');
  const geojson = await fetchGeoJson(LOCAL_HUNT_BOUNDARIES_PATH);
  clearDataLayer(huntUnitsLayer);
  huntUnitsLayer.addGeoJson(geojson);
  styleHuntUnits();
  layerState.huntUnitsLoaded = true;
}

async function ensureUsfsLayer() {
  if (!ensureMap()) return;
  if (!usfsLayer) {
    usfsLayer = new google.maps.Data({ map: null });
    styleUsfs();
  }
  if (layerState.usfsLoaded) return;
  updateStatus('Loading USFS forest boundaries…');
  const geojson = await fetchGeoJson(USFS_QUERY_URL);
  clearDataLayer(usfsLayer);
  usfsLayer.addGeoJson(geojson);
  styleUsfs();
  layerState.usfsLoaded = true;
}

async function ensureBlmLayer() {
  if (!ensureMap()) return;
  if (!blmLayer) {
    blmLayer = new google.maps.Data({ map: null });
    styleBlm();
  }
  if (layerState.blmLoaded) return;
  updateStatus('Loading BLM district boundaries…');
  const geojson = await fetchGeoJson(BLM_QUERY_URL);
  clearDataLayer(blmLayer);
  blmLayer.addGeoJson(geojson);
  styleBlm();
  layerState.blmLoaded = true;
}

function ensureUtahFrame() {
  if (!ensureMap() || utahFramePolyline) return;
  const utahPath = [
    { lat: 37.0, lng: -114.05 },
    { lat: 42.0, lng: -114.05 },
    { lat: 42.0, lng: -111.05 },
    { lat: 41.0, lng: -111.05 },
    { lat: 41.0, lng: -109.04 },
    { lat: 37.0, lng: -109.04 },
    { lat: 37.0, lng: -114.05 }
  ];

  utahFramePolyline = new google.maps.Polyline({
    path: utahPath,
    geodesic: false,
    strokeColor: '#a36a2f',
    strokeOpacity: 0.95,
    strokeWeight: 2.4,
    clickable: false,
    map: null
  });
}

async function syncOverlays() {
  if (!ensureMap()) return;

  const toggleUtahFrame = document.getElementById('toggleUtahFrame');
  const toggleHuntUnits = document.getElementById('toggleHuntUnits');
  const toggleUSFS = document.getElementById('toggleUSFS');
  const toggleBLM = document.getElementById('toggleBLM');

  try {
    ensureUtahFrame();
    if (utahFramePolyline) {
      utahFramePolyline.setMap(toggleUtahFrame && toggleUtahFrame.checked ? googleBaselineMap : null);
    }

    if (toggleHuntUnits && toggleHuntUnits.checked) {
      await ensureHuntUnitsLayer();
      setDataLayerVisibility(huntUnitsLayer, true);
    } else {
      setDataLayerVisibility(huntUnitsLayer, false);
    }

    if (toggleUSFS && toggleUSFS.checked) {
      await ensureUsfsLayer();
      setDataLayerVisibility(usfsLayer, true);
    } else {
      setDataLayerVisibility(usfsLayer, false);
    }

    if (toggleBLM && toggleBLM.checked) {
      await ensureBlmLayer();
      setDataLayerVisibility(blmLayer, true);
    } else {
      setDataLayerVisibility(blmLayer, false);
    }

    updateStatus(`Showing native Google ${googleBaselineMap.getMapTypeId()} basemap with Utah overlays.`);
  } catch (error) {
    console.error('Overlay load failed:', error);
    updateStatus(`Overlay load failed: ${error.message}`);
  }
}

function resetUtahView() {
  if (!googleBaselineMap) return;
  googleBaselineMap.setCenter(GOOGLE_BASELINE_DEFAULT_CENTER);
  googleBaselineMap.setZoom(GOOGLE_BASELINE_DEFAULT_ZOOM);
  updateStatus(`Reset to Utah on native Google ${googleBaselineMap.getMapTypeId()} basemap.`);
}

function bindControls() {
  const typeSelect = document.getElementById('mapTypeSelect');
  if (typeSelect) {
    typeSelect.value = getSelectedMapType();
    typeSelect.addEventListener('change', () => applyMapType(typeSelect.value));
  }

  const resetBtn = document.getElementById('resetViewBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => resetUtahView());
  }

  ['toggleUtahFrame', 'toggleHuntUnits', 'toggleUSFS', 'toggleBLM'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('change', () => {
      void syncOverlays();
    });
  });
}

function initGoogleBaseline() {
  const mapEl = document.getElementById('map');
  if (!mapEl || !window.google || !google.maps) {
    updateStatus('Google Maps did not finish loading.');
    return;
  }

  googleBaselineMap = new google.maps.Map(mapEl, {
    center: GOOGLE_BASELINE_DEFAULT_CENTER,
    zoom: GOOGLE_BASELINE_DEFAULT_ZOOM,
    mapTypeId: getSelectedMapType(),
    streetViewControl: false,
    fullscreenControl: true,
    mapTypeControl: false,
    gestureHandling: 'greedy',
    clickableIcons: false,
    tilt: 0
  });

  googleBaselineMap.addListener('dragend', () => {
    updateStatus(`Viewing native Google ${googleBaselineMap.getMapTypeId()} basemap.`);
  });

  googleBaselineMap.addListener('zoom_changed', () => {
    updateStatus(`Viewing native Google ${googleBaselineMap.getMapTypeId()} basemap at zoom ${googleBaselineMap.getZoom()}.`);
  });

  bindControls();
  resetUtahView();
  void syncOverlays();
}

window.initGoogleBaseline = initGoogleBaseline;
