<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>U.O.G.A. Hunt Planner - Vetted Outfitters</title>

  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />

  <style>
    :root {
      --bg: #f6f1e7;
      --panel: rgba(255, 252, 246, 0.95);
      --panel2: #fffdf8;
      --line: #caa98b;
      --text: #473526;
      --muted: #826d5b;
      --accent: #ba622d;
      --accent2: #d08d4f;
      --ok: #5f8f5a;
      --blue: #3653b3;
      --purple: #8b4f7d;
      --green: #476f2d;
      --red: #b24b4b;
      --shadow: 0 8px 24px rgba(78, 57, 33, .12);
    }

    * { box-sizing: border-box; }

    html, body {
      height: 100%;
      margin: 0;
      font-family: Georgia, "Times New Roman", serif;
      background: var(--bg);
      color: var(--text);
    }

    a { color: inherit; }

    .app {
      display: grid;
      grid-template-columns: 320px 1fr 320px;
      height: 100vh;
    }

    .sidebar, .results, .outfitters-panel {
      background: var(--panel);
      overflow: auto;
    }

    .sidebar {
      border-right: 1px solid var(--line);
      background: linear-gradient(180deg, rgba(255,252,246,.97), rgba(245,236,220,.97));
    }

    .results { border-left: none; }

    .outfitters-panel {
      border-left: 1px solid var(--line);
      background: linear-gradient(180deg, rgba(255,252,246,.97), rgba(245,236,220,.97));
    }

    .panel-inner { padding: 10px; }

    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 10px;
      padding: 6px 8px 10px;
    }

    .brand-badge {
      width: 34px;
      height: 34px;
      border-radius: 4px;
      background: linear-gradient(135deg, var(--accent), var(--accent2));
      color: #fffaf2;
      display: grid;
      place-items: center;
      font-weight: 800;
    }

    .brand h1 {
      margin: 0;
      font-size: 14px;
      line-height: 1.1;
    }

    .brand p {
      margin: 4px 0 0;
      color: var(--muted);
      font-size: 10px;
    }

    .section-title {
      margin: 10px 0 6px;
      padding: 4px 10px;
      border-radius: 4px;
      background: linear-gradient(180deg, #c96b33, #b25928);
      color: #fff6ed;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: .02em;
    }

    .section-title-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
    }

    .count-chip {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 40px;
      padding: 4px 10px;
      border-radius: 999px;
      border: 1px solid var(--line);
      background: var(--panel2);
      color: var(--text);
      font-size: 12px;
      font-weight: 700;
    }

    .field {
      display: grid;
      gap: 4px;
      margin-bottom: 6px;
    }

    .or-divider {
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 2px 0 6px;
    }

    .or-divider span {
      display: inline-block;
      padding: 1px 12px;
      border-radius: 999px;
      background: linear-gradient(180deg, #c96b33, #b25928);
      color: #fff6ed;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: .08em;
      box-shadow: 0 1px 2px rgba(78, 57, 33, .15);
    }

    .field-stack {
      background: rgba(255,255,255,.38);
      border: 1px solid #d7c3aa;
      border-radius: 6px;
      padding: 8px;
      box-shadow: inset 0 1px 0 rgba(255,255,255,.6);
    }

    .field label {
      font-size: 11px;
      color: var(--muted);
      padding-left: 3px;
    }

    input[type="text"], select {
      width: 100%;
      background: var(--panel2);
      border: 1px solid var(--line);
      color: var(--text);
      border-radius: 4px;
      padding: 6px 8px;
      height: 32px;
      font-size: 12px;
      outline: none;
      box-shadow: inset 0 1px 0 rgba(255,255,255,.6);
    }

    .hunt-select {
      appearance: none;
      background-image:
        linear-gradient(45deg, transparent 50%, #8d6849 50%),
        linear-gradient(135deg, #8d6849 50%, transparent 50%);
      background-position:
        calc(100% - 16px) calc(50% - 2px),
        calc(100% - 10px) calc(50% - 2px);
      background-size: 6px 6px, 6px 6px;
      background-repeat: no-repeat;
    }

    input[type="text"]:focus,
    select:focus {
      border-color: var(--accent);
    }

    .toggle-list {
      display: grid;
      gap: 4px;
      margin-top: 6px;
    }

    .toggle {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: var(--panel2);
      border: 1px solid var(--line);
      border-radius: 4px;
      padding: 6px 8px;
      font-size: 11px;
      box-shadow: inset 0 1px 0 rgba(255,255,255,.45);
    }

    .toggle input { transform: scale(1); }

    .actions {
      display: grid;
      gap: 6px;
      margin-top: 8px;
    }

    button {
      width: 100%;
      border: none;
      border-radius: 4px;
      padding: 7px 10px;
      font-weight: 700;
      cursor: pointer;
      font-size: 12px;
      font-family: inherit;
    }

    .btn-primary {
      background: linear-gradient(180deg, #c96b33, #b25928);
      color: #fffaf2;
    }

    .btn-secondary {
      background: var(--panel2);
      color: var(--text);
      border: 1px solid var(--line);
    }

    #map-wrap {
      position: relative;
      background: #d9d2c3;
      min-width: 0;
      min-height: 100vh;
      overflow: hidden;
    }

    #map {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
    }

    .map-overlay {
      position: absolute;
      top: 16px;
      left: 16px;
      right: 16px;
      z-index: 700;
      pointer-events: none;
      display: flex;
      justify-content: space-between;
      gap: 12px;
    }

    .overlay-card {
      pointer-events: auto;
      background: rgba(255,250,241,.92);
      border: 1px solid var(--line);
      color: var(--text);
      border-radius: 4px;
      padding: 8px 10px;
      box-shadow: var(--shadow);
      max-width: 420px;
      backdrop-filter: blur(6px);
    }

    .overlay-card h2 {
      margin: 0 0 6px;
      font-size: 14px;
    }

    .overlay-card p {
      margin: 0;
      color: var(--muted);
      font-size: 11px;
      line-height: 1.4;
    }

    .map-brand {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 290px;
    }

    .map-brand img {
      width: 74px;
      height: auto;
      object-fit: contain;
      display: block;
    }

    .map-brand h2 {
      margin: 0 0 3px;
      font-size: 18px;
      line-height: 1.1;
    }

    .map-brand p {
      margin: 0;
      font-size: 11px;
      color: var(--muted);
    }

    .result-card {
      background: var(--panel2);
      border: 1px solid var(--line);
      border-radius: 4px;
      padding: 10px;
      margin-bottom: 8px;
    }

    .result-card.selected {
      border-color: var(--accent);
      box-shadow: 0 0 0 1px rgba(255, 192, 0, 0.35) inset;
    }

    .result-card h3 {
      margin: 0 0 8px;
      font-size: 15px;
    }

    .pill-row {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 10px;
    }

    .pill {
      display: inline-block;
      padding: 6px 10px;
      border-radius: 999px;
      font-size: 11px;
      border: 1px solid var(--line);
      background: #f1e8da;
      color: var(--muted);
    }

    .pill.cert {
      color: #fffaf2;
      background: var(--accent);
      border-color: var(--accent);
      font-weight: 700;
    }

    .pill.verified {
      color: white;
      background: var(--ok);
      border-color: var(--ok);
      font-weight: 700;
    }

    .meta {
      display: grid;
      gap: 6px;
      color: var(--muted);
      font-size: 12px;
      margin-bottom: 12px;
    }

    .result-actions {
      display: flex;
      gap: 10px;
    }

    .result-actions a {
      text-decoration: none;
      text-align: center;
      flex: 1;
    }

    .small-note {
      color: var(--muted);
      font-size: 10px;
      line-height: 1.5;
      margin-top: 14px;
    }

    .result-meta-row {
      margin-top: 10px;
      color: var(--muted);
      font-size: 11px;
    }

    .empty {
      color: var(--muted);
      background: var(--panel2);
      border: 1px dashed var(--line);
      border-radius: 4px;
      padding: 12px;
      font-size: 12px;
      line-height: 1.5;
    }

    .leaflet-popup-content-wrapper,
    .leaflet-popup-tip {
      background: #f4ede0;
      color: var(--text);
    }

    .leaflet-container a {
      color: var(--accent);
    }

    .results {
      background: rgba(255,250,241,.94);
      position: absolute;
      left: 14px;
      right: 14px;
      bottom: 14px;
      z-index: 650;
      border: 2px solid #c96b33;
      border-radius: 6px;
      box-shadow: 0 10px 28px rgba(78, 57, 33, .18);
      max-height: 34vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .results .panel-inner {
      padding: 10px;
      overflow: auto;
    }

    .results-heading {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      padding: 8px 10px;
      border-bottom: 1px solid var(--line);
      background: linear-gradient(180deg, rgba(255,255,255,.65), rgba(240,228,209,.7));
    }

    .results-heading h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 700;
    }

    .results-heading-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .tray-toggle {
      width: auto;
      min-width: 38px;
      padding: 4px 10px;
      border-radius: 4px;
      background: rgba(255,255,255,.75);
      color: var(--accent);
      border: 1px solid var(--line);
      font-size: 16px;
      line-height: 1;
    }

    .table-like .result-card {
      display: grid;
      grid-template-columns: 1.3fr 0.9fr 0.8fr 0.9fr 1fr 1.2fr auto;
      gap: 8px;
      align-items: start;
      padding: 6px 10px;
      margin-bottom: 0;
      border-radius: 0;
      border-left: none;
      border-right: none;
      border-top: none;
      background: transparent;
      cursor: pointer;
      transition: background-color 120ms ease;
    }

    .table-like .result-card:hover {
      background: rgba(201, 107, 51, 0.08);
    }

    .table-like .result-card h3 {
      font-size: 12px;
      margin: 0;
      font-weight: 700;
    }

    .table-like .pill-row {
      display: contents;
      margin: 0;
    }

    .table-like .pill {
      border: none;
      background: transparent;
      padding: 0;
      border-radius: 0;
      font-size: 12px;
      color: var(--text);
    }

    .table-like .meta {
      display: contents;
      margin: 0;
      font-size: 12px;
      color: var(--text);
    }

    .table-like .meta div {
      display: block;
    }

    .table-like .result-actions {
      justify-content: flex-end;
      align-items: center;
    }

    .table-like .result-actions .btn-primary,
    .table-like .result-actions .btn-secondary {
      width: auto;
      min-width: 92px;
      padding: 6px 10px;
      font-size: 11px;
    }

    .results-columns {
      display: grid;
      grid-template-columns: 1.3fr 0.9fr 0.8fr 0.9fr 1fr 1.2fr auto;
      gap: 8px;
      padding: 6px 10px;
      border-bottom: 1px solid var(--line);
      font-size: 11px;
      font-weight: 700;
      color: var(--muted);
      background: rgba(226, 213, 193, .35);
    }

    .results-secondary {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-top: 10px;
    }

    .results.collapsed {
      max-height: 56px;
    }

    .results.collapsed .results-columns,
    .results.collapsed .panel-inner {
      display: none;
    }

    .outfitters-panel .panel-inner {
      padding: 10px;
    }

    .sidebar .section-title:first-of-type {
      margin-top: 0;
    }

    @media (max-width: 1200px) {
      .app {
        grid-template-columns: 300px 1fr;
        grid-template-rows: 1fr auto auto;
      }

      .sidebar {
        grid-column: 1;
        grid-row: 1;
      }

      #map-wrap {
        grid-column: 2;
        grid-row: 1;
        min-height: 60vh;
      }

      .results {
        position: static;
        grid-column: 1 / -1;
        grid-row: 2;
        border: none;
        border-top: 1px solid var(--line);
        border-radius: 0;
        max-height: 42vh;
      }

      .outfitters-panel {
        grid-column: 1 / -1;
        grid-row: 3;
        border-left: none;
        border-top: 1px solid var(--line);
      }
    }

    @media (max-width: 860px) {
      .app {
        grid-template-columns: 1fr;
        grid-template-rows: auto 55vh auto auto;
        height: auto;
      }

      .sidebar, .results, .outfitters-panel {
        border: none;
      }

      #map-wrap {
        position: relative;
        height: 55vh;
        min-height: 55vh;
      }

      .map-overlay {
        top: 10px;
        left: 10px;
        right: 10px;
      }

      .results {
        position: static;
        max-height: none;
        border-top: 1px solid var(--line);
        border-radius: 0;
      }

      .outfitters-panel {
        border-top: 1px solid var(--line);
      }

      .results-columns,
      .table-like .result-card,
      .results-secondary {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <div class="app">
    <aside class="sidebar">
      <div class="panel-inner">
        <div class="brand">
          <div class="brand-badge">UO</div>
          <div>
            <h1>U.O.G.A. Hunt Planner</h1>
            <p>Vetted Outfitters</p>
          </div>
        </div>

        <div class="section-title">Find a Hunt</div>
        <div class="field-stack">
          <div class="field">
            <label for="searchInput">Select by hunt number</label>
            <input id="searchInput" type="text" placeholder="Search hunt number, hunt name, or unit..." />
          </div>

          <div class="or-divider"><span>or</span></div>

          <div class="field">
            <label for="unitFilter">Select by hunt name or unit</label>
            <select id="unitFilter" class="hunt-select"></select>
          </div>

          <div class="or-divider"><span>or</span></div>

          <div class="field">
            <label for="speciesFilter">Species</label>
            <select id="speciesFilter" class="hunt-select"></select>
          </div>

          <div class="field">
            <label for="sexFilter">Gender</label>
            <select id="sexFilter" class="hunt-select">
              <option value="All">All</option>
              <option value="Buck">Buck</option>
              <option value="Buck/Bull">Buck/Bull</option>
              <option value="Antlerless">Antlerless</option>
              <option value="Either">Either</option>
            </select>
          </div>

          <div class="field">
            <label for="huntTypeFilter">Hunt Type</label>
            <select id="huntTypeFilter" class="hunt-select">
              <option value="All">All</option>
              <option value="General">General</option>
              <option value="Limited Entry">Limited Entry</option>
              <option value="Premium Limited Entry">Premium Limited Entry</option>
              <option value="Management">Management</option>
              <option value="Dedicated Hunter">Dedicated Hunter</option>
              <option value="Cactus Buck">Cactus Buck</option>
              <option value="Once-in-a-Lifetime">Once-in-a-Lifetime</option>
            </select>
          </div>

          <div class="field">
            <label for="weaponFilter">Weapon type (optional)</label>
            <select id="weaponFilter" class="hunt-select">
              <option value="All">All</option>
              <option value="Archery">Archery</option>
              <option value="Extended Archery">Extended Archery</option>
              <option value="Restricted Archery">Restricted Archery</option>
              <option value="Muzzleloader">Muzzleloader</option>
              <option value="Restricted Muzzleloader">Restricted Muzzleloader</option>
              <option value="Restricted Rifle">Restricted Rifle</option>
              <option value="Any Legal Weapon">Any Legal Weapon</option>
              <option value="HAMSS">HAMSS</option>
              <option value="Multiseason">Multiseason</option>
              <option value="Restricted Multiseason">Restricted Multiseason</option>
            </select>
          </div>

          <div class="field">
            <label for="basemapSelect">Change basemap</label>
            <select id="basemapSelect" class="hunt-select">
              <option value="osm">OpenStreetMap</option>
              <option value="topo">Terrain</option>
              <option value="sat">Satellite</option>
            </select>
          </div>
        </div>

        <div class="section-title">Add Map Data Layers</div>
        <div class="toggle-list">
          <div class="toggle"><span>Live Utah Hunt Units</span><input id="toggleLiveUnits" type="checkbox" checked /></div>
          <div class="toggle"><span>Hunt Unit Centers</span><input id="toggleUnits" type="checkbox" checked /></div>
          <div class="toggle"><span>USFS Forests</span><input id="toggleUSFS" type="checkbox" checked /></div>
          <div class="toggle"><span>BLM Districts</span><input id="toggleBLM" type="checkbox" checked /></div>
          <div class="toggle"><span>SITLA</span><input id="toggleSITLA" type="checkbox" /></div>
          <div class="toggle"><span>State Lands</span><input id="toggleState" type="checkbox" /></div>
          <div class="toggle"><span>Private Lands</span><input id="togglePrivate" type="checkbox" /></div>
        </div>

        <div class="section-title">U.O.G.A. Layers</div>
        <div class="toggle-list">
          <div class="toggle"><span>Vetted Outfitters</span><input id="toggleOutfitters" type="checkbox" checked /></div>
          <div class="toggle"><span>Certified Professional Outfitters</span><input id="toggleCPO" type="checkbox" checked /></div>
          <div class="toggle"><span>Certified Professional Guides</span><input id="toggleCPG" type="checkbox" checked /></div>
        </div>

        <div class="actions">
          <button id="openBoundaryBtn" class="btn-primary">Open Official Boundary</button>
          <button id="resetBtn" class="btn-secondary">Reset Planner</button>
        </div>

        <div class="small-note">
          Live now: Utah hunt-unit polygons, USFS forests, BLM districts, Utah ownership overlays, and vetted outfitter layer. Hunt records should load from your JSON file in the data folder through app.js.
        </div>
      </div>
    </aside>

    <main id="map-wrap">
      <div id="map"></div>
      <div class="map-overlay">
        <div class="overlay-card map-brand">
          <img
            src="https://static.wixstatic.com/media/43f827_24f00cd070494533955d4910eef3a2fb~mv2.jpg/v1/fill/w_207,h_105,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/Group%20945%20(1).jpg"
            alt="U.O.G.A. logo"
          />
          <div>
            <h2>U.O.G.A. Hunt Planner</h2>
            <p>Vetted Outfitters</p>
          </div>
        </div>

        <div class="overlay-card">
          <h2 id="selectedTitle">No hunt selected</h2>
          <p id="selectedMeta">Choose filters or click a hunt unit to load hunt and outfitter results.</p>
        </div>
      </div>

      <aside class="results">
        <div class="results-heading">
          <h3>Matching Hunts</h3>
          <div class="results-heading-actions">
            <span id="huntCount" class="count-chip">0</span>
            <button id="toggleResultsTray" type="button" class="tray-toggle" aria-label="Collapse hunt table">˅</button>
          </div>
        </div>

        <div class="results-columns">
          <span>Hunt Name</span>
          <span>Hunt Number</span>
          <span>Gender</span>
          <span>Species</span>
          <span>Weapon</span>
          <span>Hunt Type / Dates</span>
          <span>Action</span>
        </div>

        <div class="panel-inner">
          <div id="huntResults" class="empty table-like" style="margin-bottom:12px;">No hunt data loaded yet.</div>

          <div class="results-secondary">
            <div>
              <div class="section-title">Selected Area</div>
              <div id="areaInfo" class="empty" style="margin-bottom:12px;">Click a hunt unit or select one from the filter.</div>
            </div>

            <div>
              <div class="section-title">Map Click Info</div>
              <div id="clickInfo" class="empty" style="margin-bottom:12px;">Click the map to inspect the selected area.</div>
            </div>
          </div>
        </div>
      </aside>
    </main>

    <aside class="outfitters-panel">
      <div class="panel-inner">
        <div class="section-title">Vetted Outfitters</div>
        <div id="results"></div>
      </div>
    </aside>
  </div>

  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script src="https://unpkg.com/esri-leaflet@3.0.8/dist/esri-leaflet.js"></script>
  <script src="app.js"></script>
</body>
</html>
Commit that, then say go and I’ll send the full new [app.js](C:\DOWNLOADS\test website\app.js).


GO


Replace your entire [app.js](C:\DOWNLOADS\test website\app.js) with this:

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

const UNIT_CENTER_LOOKUP = {
  'beaver-east': [38.28, -112.48],
  'book-cliffs': [39.72, -109.35],
  cache: [41.78, -111.62],
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

const map = L.map('map', { zoomControl: true }).setView([39.3, -111.7], 6);

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
let usfsDistrictLayer = null;
let blmDistrictLayer = null;
let liveLayerSource = 'none';
let huntResultsLimit = 100;
let boundaryZoomToken = 0;

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
      style: () => ({ color: '#3653b3', weight: 3.2, fillColor: '#d6def7', fillOpacity: 0.42 })
    });
    liveLayerSource = 'fallback';
    liveHuntUnitsLayer.on('error', err => {
      console.error('Fallback hunt layer failed:', err);
    });
    if (toggleLiveUnits?.checked) liveHuntUnitsLayer.addTo(map);
  };

  try {
    liveHuntUnitsLayer = L.esri.featureLayer({
      url: `${DWR_MAPSERVER}/0`,
      style: () => ({ color: '#3653b3', weight: 3.2, fillColor: '#d6def7', fillOpacity: 0.42 })
    });
    liveLayerSource = 'dwr-feature';
    liveHuntUnitsLayer.on('error', err => {
      console.error('DWR hunt layer failed:', err);
      try { map.removeLayer(liveHuntUnitsLayer); } catch (e) {}
      fallback();
    });

    if (toggleLiveUnits?.checked) liveHuntUnitsLayer.addTo(map);
  } catch (e) {
    console.error('DWR hunt layer setup failed:', e);
    fallback();
  }
}

function buildUSFSLayer() {
  if (!window.L || !window.L.esri) return;
  if (usfsDistrictLayer) {
    try { map.removeLayer(usfsDistrictLayer); } catch (e) {}
  }

  usfsDistrictLayer = L.esri.featureLayer({
    url: 'https://apps.fs.usda.gov/arcx/rest/services/EDW/EDW_ForestSystemBoundaries_01/MapServer/0',
    where: "FORESTORGCODE IN ('01','04')",
    style: () => ({ color: '#476f2d', weight: 2.5, fillOpacity: 0.02 })
  });

  usfsDistrictLayer.bindPopup(layer => {
    const p = layer.feature?.properties || {};
    const forest = firstNonEmpty(p.FORESTNAME, p.FORESTNAMECOMMON, p.FORESTSHORTNAME, 'National Forest');
    const office = firstNonEmpty(p.REGION, p.FORESTNUM, 'US Forest Service');
    return `<b>${escapeHtml(forest)}</b><br>${escapeHtml(office)}`;
  });

  usfsDistrictLayer.on('click', evt => {
    const p = evt.layer?.feature?.properties || {};
    const forest = firstNonEmpty(p.FORESTNAME, p.FORESTNAMECOMMON, p.FORESTSHORTNAME, 'National Forest');
    if (clickInfoEl) {
      clickInfoEl.innerHTML = `<strong>USFS:</strong> ${escapeHtml(forest)}`;
    }
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
    style: () => ({ color: '#b9722f', weight: 2.3, fillOpacity: 0.02 })
  });

  blmDistrictLayer.bindPopup(layer => {
    const p = layer.feature?.properties || {};
    return `<b>BLM Utah</b><br>${escapeHtml(firstNonEmpty(p.ADMIN_UNIT, p.FIELD_OFFICE, p.NAME, 'Administrative Unit'))}`;
  });

  blmDistrictLayer.on('click', evt => {
    const p = evt.layer?.feature?.properties || {};
    const unit = firstNonEmpty(p.ADMIN_UNIT, p.FIELD_OFFICE, p.NAME, 'BLM Utah Administrative Unit');
    if (clickInfoEl) {
      clickInfoEl.innerHTML = `<strong>BLM:</strong> ${escapeHtml(unit)}`;
    }
  });

  if (toggleBLM?.checked) blmDistrictLayer.addTo(map);
}

function applyLiveBoundaryWhere(whereClause) {
  if (!liveHuntUnitsLayer) return;

  if (liveLayerSource === 'dwr-feature' && typeof liveHuntUnitsLayer.setWhere === 'function') {
    liveHuntUnitsLayer.setWhere(whereClause || '1=1');
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

    const { names, ids } = await queryBoundaryNamesAndIds([huntCode]);
    if (token !== boundaryZoomToken) return;

    const where = buildBoundaryFilterSql(names, ids);
    if (!where || where === '1=0') {
      map.setView([39.3, -111.7], 7);
      return;
    }

    const url =
      `${DWR_MAPSERVER}/0/query?` +
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
  if (!liveHuntUnitsLayer) return;
  applyLiveBoundaryWhere('1=1');
}

function renderOwnershipPlaceholders() {
  sitlaLayer.clearLayers();
  stateLayer.clearLayers();
  privateLayer.clearLayers();

  if (toggleSITLA?.checked) {
    L.circleMarker([39.05, -111.9], {
      radius: 7,
      color: '#4f9d62',
      fillColor: '#4f9d62',
      fillOpacity: 0.35,
      weight: 2
    })
      .addTo(sitlaLayer)
      .bindPopup('<b>SITLA</b><br>Placeholder layer');
  }

  if (toggleState?.checked) {
    L.circleMarker([40.1, -111.9], {
      radius: 7,
      color: '#2b8f9a',
      fillColor: '#2b8f9a',
      fillOpacity: 0.35,
      weight: 2
    })
      .addTo(stateLayer)
      .bindPopup('<b>State Lands</b><br>Placeholder layer');
  }

  if (togglePrivate?.checked) {
    L.circleMarker([38.9, -111.2], {
      radius: 7,
      color: '#9a3e3e',
      fillColor: '#9a3e3e',
      fillOpacity: 0.35,
      weight: 2
    })
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

    const list = Array.from(units.entries())
      .sort((a, b) => a[1].localeCompare(b[1]))
      .slice(0, 60);

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
  basemapSelect.value = 'osm';
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
    window.setTimeout(() => map.invalidateSize(), 0);
  }
})();
