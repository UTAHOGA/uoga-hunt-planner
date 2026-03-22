Here are both files in full, separated into index.html and app.js.

I have verified that all the code is here, the Cloudflare links are in place, the "Squirrel Cage" loader is wired up, and the renderOutfitters() function at the bottom of the JavaScript is completely repaired.

1. index.html
Copy this code and save it as index.html.

HTML

<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>U.O.G.A. Hunt Planner - Utah Vetted Outfitters</title>

  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <link rel="stylesheet" href="https://cesium.com/downloads/cesiumjs/releases/1.135/Build/Cesium/Widgets/widgets.css" />

  <script>
    (function () {
      function forceTop() {
        window.scrollTo(0, 0);
        if (document.documentElement) document.documentElement.scrollTop = 0;
        if (document.body) document.body.scrollTop = 0;
      }

      try {
        if ('scrollRestoration' in history) {
          history.scrollRestoration = 'manual';
        }
      } catch (e) {}

      window.addEventListener('DOMContentLoaded', forceTop, { once: true });
      window.addEventListener('load', function () {
        forceTop();
        setTimeout(forceTop, 0);
        setTimeout(forceTop, 120);
        setTimeout(forceTop, 400);
      }, { once: true });
      window.addEventListener('pageshow', forceTop);
      window.addEventListener('beforeunload', forceTop);
    })();
  </script>

  <style>
    :root {
      --bg: #f6f1e7;
      --panel: rgba(255, 252, 246, 0.95);
      --panel2: #fffdf8;
      --line: #b9906f;
      --text: #24170f;
      --muted: #49372a;
      --font-display: Georgia, "Times New Roman", serif;
      --font-ui: "Segoe UI", "Helvetica Neue", Arial, sans-serif;
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
      font-family: var(--font-ui);
      background: var(--bg);
      color: var(--text);
      font-variant-numeric: lining-nums tabular-nums;
      font-feature-settings: "lnum" 1, "tnum" 1;
    }

    /* --- SQUIRREL CAGE LOADER --- */
    .loading-overlay {
      position: fixed;
      inset: 0;
      background: rgba(246, 241, 231, 0.85);
      backdrop-filter: blur(4px);
      z-index: 9999;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      transition: opacity 0.4s ease, visibility 0.4s ease;
    }
    
    .loading-overlay.hidden {
      opacity: 0;
      visibility: hidden;
      pointer-events: none;
    }

    .squirrel-cage {
      width: 64px;
      height: 64px;
      border: 6px solid #e7dfd1;
      border-top-color: #c96b33;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin-bottom: 16px;
    }

    .loading-text {
      font-family: var(--font-display);
      font-size: 20px;
      color: #7d4320;
      font-weight: bold;
      letter-spacing: 0.05em;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* --- EXISTING STYLES --- */
    .brand h1, .map-brand h2, .overlay-card h2, .results-heading h3, .table-like .result-card h3, .hunt-official-card h4, .google-head h3, .about-dialog-head h3 { font-family: var(--font-display); }
    a { color: inherit; }
    .app { display: grid; grid-template-columns: 280px 1fr 280px; min-height: 100vh; }
    .sidebar, .results, .outfitters-panel { background: var(--panel); overflow: auto; }
    .sidebar { border-right: 1px solid var(--line); background: linear-gradient(180deg, rgba(255,252,246,.97), rgba(245,236,220,.97)); }
    .results { border-left: none; }
    .outfitters-panel { border-left: 1px solid var(--line); background: linear-gradient(180deg, rgba(255,252,246,.97), rgba(245,236,220,.97)); }
    .panel-inner { padding: 6px; }
    .brand { display: block; text-align: center; margin-bottom: 6px; padding: 4px 6px 8px; }
    .brand h1 { margin: 0; font-size: 24px; line-height: 1.04; }
    .brand-rail-note { margin: 4px 0 0; color: #8d4b24; font-size: 12px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
    .section-title { margin: 10px 0 6px; padding: 6px 12px; border-radius: 4px; background: linear-gradient(180deg, #c96b33, #b25928); color: #fff6ed; font-size: 15px; font-weight: 700; letter-spacing: .02em; }
    .rail-section { margin-bottom: 6px; border: 1px solid #d4b290; border-radius: 6px; background: rgba(255,255,255,.40); overflow: hidden; box-shadow: inset 0 1px 0 rgba(255,255,255,.5); }
    .rail-summary { display: flex; align-items: center; justify-content: space-between; gap: 10px; list-style: none; cursor: pointer; padding: 8px 10px; background: linear-gradient(180deg, #c96b33, #b25928); color: #fff6ed; font-size: 16px; font-weight: 700; letter-spacing: .03em; user-select: none; }
    .rail-summary::-webkit-details-marker { display: none; }
    .rail-summary::after { content: "▾"; font-size: 12px; line-height: 1; transition: transform 140ms ease; }
    .rail-section:not([open]) .rail-summary::after { transform: rotate(-90deg); }
    .rail-body { padding: 6px; background: rgba(255,252,246,.72); }
    .section-title-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
    .count-chip { display: inline-flex; align-items: center; justify-content: center; min-width: 40px; padding: 4px 10px; border-radius: 999px; border: 1px solid var(--line); background: var(--panel2); color: var(--text); font-size: 15px; font-weight: 700; }
    .hunt-hover-tooltip, .leaflet-tooltip.hunt-hover-tooltip { border: 0; border-radius: 0; background: transparent !important; color: #2e2216; box-shadow: none !important; font-family: var(--font-ui); font-size: 12px; font-weight: 800; line-height: 1.2; padding: 0 !important; margin: 0; text-shadow: 0 1px 0 rgba(255,255,255,0.95), 0 0 8px rgba(255,255,255,0.9), 0 0 14px rgba(255,255,255,0.75); }
    .hunt-hover-tooltip:before, .leaflet-tooltip.hunt-hover-tooltip:before, .leaflet-tooltip-top.hunt-hover-tooltip:before, .leaflet-tooltip-bottom.hunt-hover-tooltip:before, .leaflet-tooltip-left.hunt-hover-tooltip:before, .leaflet-tooltip-right.hunt-hover-tooltip:before { display: none !important; border: 0 !important; }
    .hunt-hover-label-marker { background: transparent !important; border: 0 !important; }
    .hunt-hover-label-text { display: inline-block; color: #2e2216; font-family: var(--font-ui); font-size: 12px; font-weight: 800; line-height: 1.2; white-space: nowrap; text-shadow: 0 1px 0 rgba(255,255,255,0.95), 0 0 8px rgba(255,255,255,0.9), 0 0 14px rgba(255,255,255,0.75); pointer-events: none; }
    .federal-badge-marker { background: transparent; border: 0; }
    .federal-badge-shell { display: flex; flex-direction: column; align-items: center; gap: 6px; transform: translateY(-2px); }
    .federal-badge-logo { width: 40px; height: 40px; object-fit: contain; filter: drop-shadow(0 4px 8px rgba(30, 22, 12, 0.28)); pointer-events: none; }
    .federal-badge-name { max-width: 128px; padding: 4px 8px; border-radius: 10px; border: 1px solid rgba(77, 49, 23, 0.16); background: rgba(255, 255, 255, 0.98); box-shadow: 0 6px 14px rgba(41, 27, 12, 0.16); color: #332111; font-size: 11px; font-weight: 900; letter-spacing: 0.01em; line-height: 1.15; text-align: center; white-space: normal; pointer-events: none; }
    .outfitter-logo-pin { background: transparent; border: 0; }
    .outfitter-logo-pin-shell { position: relative; width: 44px; height: 58px; pointer-events: none; }
    .outfitter-logo-pin-base { position: absolute; left: 7px; top: 20px; width: 30px; height: 30px; background: linear-gradient(180deg, #c87025 0%, #9f5319 100%); border: 2px solid rgba(88, 45, 14, 0.82); border-radius: 50% 50% 50% 0; transform: rotate(-45deg); box-shadow: 0 4px 10px rgba(61, 31, 10, 0.28); }
    .outfitter-logo-pin-center { position: absolute; left: 8px; top: 8px; width: 28px; height: 28px; border-radius: 50%; background: rgba(255, 255, 255, 0.98); border: 2px solid rgba(88, 45, 14, 0.22); box-shadow: 0 4px 10px rgba(36, 21, 10, 0.22); overflow: hidden; display: flex; align-items: center; justify-content: center; }
    .outfitter-logo-pin-center img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .field { display: grid; gap: 3px; margin-bottom: 5px; }
    .or-divider { display: flex; align-items: center; justify-content: center; margin: 1px 0 4px; }
    .or-divider span { display: inline-block; padding: 1px 12px; border-radius: 999px; background: linear-gradient(180deg, #c96b33, #b25928); color: #fff6ed; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; box-shadow: 0 1px 2px rgba(78, 57, 33, .15); }
    .field-stack { background: rgba(255,255,255,.38); border: 1px solid #d7c3aa; border-radius: 6px; padding: 6px; box-shadow: inset 0 1px 0 rgba(255,255,255,.6); }
    .field label { font-size: 12px; color: var(--muted); padding-left: 3px; }
    input[type="text"], select { width: 100%; background: var(--panel2); border: 1px solid var(--line); color: var(--text); border-radius: 4px; padding: 6px 10px; height: 34px; font-size: 12px; outline: none; box-shadow: inset 0 1px 0 rgba(255,255,255,.6); }
    .hunt-select { appearance: none; background-image: linear-gradient(45deg, transparent 50%, #8d6849 50%), linear-gradient(135deg, #8d6849 50%, transparent 50%); background-position: calc(100% - 16px) calc(50% - 2px), calc(100% - 10px) calc(50% - 2px); background-size: 6px 6px, 6px 6px; background-repeat: no-repeat; }
    input[type="text"]:focus, select:focus { border-color: var(--accent); }
    .toggle-list { display: grid; gap: 4px; margin-top: 4px; }
    .toggle { display: flex; align-items: center; justify-content: space-between; background: var(--panel2); border: 1px solid var(--line); border-radius: 4px; padding: 6px 10px; font-size: 12px; box-shadow: inset 0 1px 0 rgba(255,255,255,.45); }
    .toggle input { transform: scale(1.1); }
    .brand-service { margin-top: 6px; padding: 8px; border: 1px solid #b25928; border-radius: 8px; background: linear-gradient(180deg, rgba(201,107,51,.10), rgba(240,226,202,.96)); box-shadow: 0 8px 18px rgba(120, 72, 27, 0.10), inset 0 1px 0 rgba(255,255,255,.55); }
    .brand-service-title { margin: 0 0 4px; text-align: center; font-size: 12px; font-weight: 800; letter-spacing: .10em; color: #8d4b24; text-transform: uppercase; }
    .brand-service-subtitle { margin: 0 0 6px; text-align: center; color: var(--muted); font-size: 11px; line-height: 1.35; }
    .actions { display: grid; gap: 6px; margin-top: 8px; }
    button { width: 100%; border: none; border-radius: 4px; padding: 9px 12px; font-weight: 700; cursor: pointer; font-size: 15px; font-family: inherit; }
    .btn-primary { background: linear-gradient(180deg, #c96b33, #b25928); color: #fffaf2; }
    .btn-secondary { background: var(--panel2); color: var(--text); border: 1px solid var(--line); }
    #map-wrap { position: relative; background: #d9d2c3; min-width: 0; min-height: 100vh; overflow: hidden; }
    #map { position: absolute; inset: 0; width: 100%; height: 100%; }
    .map-overlay { position: absolute; top: 16px; left: 78px; right: 16px; z-index: 700; pointer-events: none; display: flex; justify-content: space-between; gap: 8px; align-items: flex-start; }
    .map-top-actions { position: absolute; top: 16px; left: 50%; transform: translateX(-50%); z-index: 760; pointer-events: none; display: flex; flex-direction: column; align-items: center; gap: 8px; width: min(320px, calc(100% - 140px)); }
    .map-top-actions button { pointer-events: auto; width: auto; min-width: 168px; padding: 9px 16px; border-radius: 999px; box-shadow: 0 10px 24px rgba(78, 57, 33, .18); font-size: 14px; letter-spacing: .02em; }
    .map-overlay-left { display: flex; flex-direction: column; gap: 8px; width: min(24vw, 330px); max-width: 330px; }
    .map-overlay-right { margin-left: 12px; width: min(24vw, 330px); max-width: 330px; display: flex; flex-direction: column; gap: 8px; align-items: stretch; }
    .overlay-card { pointer-events: auto; background: rgba(255,250,241,.92); border: 1px solid var(--line); color: var(--text); border-radius: 8px; padding: 7px 9px; box-shadow: 0 10px 24px rgba(78, 57, 33, .16); max-width: 100%; backdrop-filter: blur(6px); }
    .overlay-card h2 { margin: 0 0 6px; font-size: 16px; }
    .overlay-card p { margin: 0; color: var(--muted); font-size: 13px; line-height: 1.5; }
    .map-detail-card { max-height: calc(100vh - 120px); overflow: auto; padding: 0; border-radius: 10px; background: rgba(252, 247, 238, 0.96); box-shadow: 0 12px 28px rgba(78, 57, 33, .16); }
    .map-detail-card .section-title { margin: 0; border-radius: 10px 10px 0 0; padding: 8px 11px; font-size: 13px; letter-spacing: .03em; }
    .map-detail-body { padding: 10px 11px; }
    .map-detail-card #areaInfoMap .hunt-official-card { padding: 10px; }
    .map-brand { display: flex; align-items: center; gap: 8px; min-width: 250px; justify-content: center; }
    .map-brand img { width: 54px; height: auto; object-fit: contain; display: block; }
    .map-brand h2 { margin: 0; font-size: 16px; line-height: 1.1; text-align: center; }
    .map-brand p { margin: 2px 0 0; font-size: 14px; line-height: 1.1; color: var(--text); text-align: center; }
    .map-brand-copy { display: grid; gap: 4px; justify-items: center; text-align: center; }
    .result-card { background: var(--panel2); border: 1px solid var(--line); border-radius: 4px; padding: 10px; margin-bottom: 6px; }
    .result-card.selected { border-color: var(--accent); box-shadow: 0 0 0 1px rgba(255, 192, 0, 0.35) inset; }
    .result-card h3 { margin: 0 0 8px; font-size: 15px; }
    .pill-row { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 10px; }
    .pill { display: inline-block; padding: 6px 10px; border-radius: 999px; font-size: 13px; border: 1px solid var(--line); background: #f1e8da; color: var(--muted); }
    .pill.cert { color: #fffaf2; background: var(--accent); border-color: var(--accent); font-weight: 700; }
    .pill.verified { color: white; background: var(--ok); border-color: var(--ok); font-weight: 700; }
    .meta { display: grid; gap: 6px; color: var(--muted); font-size: 12px; margin-bottom: 12px; }
    .result-actions { display: flex; gap: 10px; }
    .result-actions a { text-decoration: none; text-align: center; flex: 1; }
    .small-note { color: var(--muted); font-size: 11px; line-height: 1.35; margin-top: 14px; }
    .about-modal { position: fixed; inset: 0; z-index: 5000; display: none; align-items: center; justify-content: center; padding: 24px; background: rgba(44, 28, 17, 0.42); }
    .about-modal.is-open { display: flex; }
    .about-dialog { width: min(760px, 94vw); max-height: 72vh; overflow: auto; border: 2px solid #c26a34; border-radius: 10px; background: #fffdf8; box-shadow: 0 20px 40px rgba(45, 28, 14, 0.25); }
    .about-dialog-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 16px; border-bottom: 1px solid #d9c1a8; background: linear-gradient(180deg, rgba(255,255,255,.92), rgba(245,236,220,.96)); }
    .about-dialog-head h3 { margin: 0; font-size: 24px; }
    .about-dialog-body { padding: 16px 18px 18px; color: var(--text); font-size: 15px; line-height: 1.5; }
    .about-dialog-actions { display: flex; justify-content: flex-end; padding: 0 18px 16px; }
    .empty { color: var(--muted); background: var(--panel2); border: 1px dashed var(--line); border-radius: 4px; padding: 12px; font-size: 14px; line-height: 1.5; }
    .results { background: rgba(255,250,241,.94); position: absolute; left: 14px; right: 14px; bottom: 14px; z-index: 650; border: 2px solid #c96b33; border-radius: 6px; box-shadow: 0 10px 28px rgba(78, 57, 33, .18); max-height: 34vh; overflow: hidden; display: flex; flex-direction: column; }
    .results .panel-inner { padding: 10px; overflow: auto; }
    .results-heading { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 8px 10px; border-bottom: 1px solid var(--line); background: linear-gradient(180deg, rgba(255,255,255,.65), rgba(240,228,209,.7)); }
    .results-heading h3 { margin: 0; font-size: 21px; font-weight: 700; }
    .table-like .result-card { display: grid; grid-template-columns: 1.15fr 1fr 0.9fr 0.8fr 0.9fr 1fr 1.2fr auto; gap: 10px; align-items: start; padding: 8px 10px; margin-bottom: 0; border-radius: 0; border-left: none; border-right: none; border-top: none; background: transparent; cursor: pointer; transition: background-color 120ms ease; }
    .table-like .result-card:hover { background: rgba(201, 107, 51, 0.08); }
    .results-columns { display: grid; grid-template-columns: 1.15fr 1fr 0.9fr 0.8fr 0.9fr 1fr 1.2fr auto; gap: 10px; padding: 8px 12px; border-bottom: 1px solid var(--line); font-size: 14px; font-weight: 700; color: var(--text); background: rgba(226, 213, 193, .35); }
    .results.collapsed { max-height: 56px; }
    .results.collapsed .results-columns, .results.collapsed .panel-inner { display: none; }
    .mobile-selected { display: none; margin-top: 10px; padding: 10px; border: 1px solid var(--line); border-radius: 6px; background: var(--panel2); box-shadow: inset 0 1px 0 rgba(255,255,255,.5); }
    .selected-summary { border: 1px solid var(--line); border-radius: 10px; background: linear-gradient(180deg, rgba(255,252,246,.92), rgba(244,233,214,.96)); box-shadow: inset 0 1px 0 rgba(255,255,255,.55); padding: 12px 14px; }
    .selected-summary.is-active { border-color: #b25928; box-shadow: 0 8px 18px rgba(120, 72, 27, 0.12), inset 0 1px 0 rgba(255,255,255,.6); background: linear-gradient(180deg, rgba(255,251,243,.98), rgba(240,226,202,.98)); }
    .google-section { padding: 10px 14px; border-top: 1px solid var(--line); background: linear-gradient(180deg, rgba(255,252,246,.98), rgba(245,236,220,.95)); }
    .google-shell { width: 100%; max-width: calc(100vw - 640px); margin: 0 auto; border: 1px solid var(--line); border-radius: 8px; background: var(--panel); box-shadow: var(--shadow); overflow: hidden; }
    .google-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 8px 10px; border-bottom: 1px solid var(--line); background: linear-gradient(180deg, rgba(255,255,255,.72), rgba(240,228,209,.78)); }
    .google-frame-wrap { background: #e7dfd1; min-height: 440px; }
    .cesium-frame { display: block; width: 100%; height: 560px; border: none; background: linear-gradient(180deg, #d8d2c6, #ece4d7); }

    @media (max-width: 1200px) {
      .app { grid-template-columns: 300px 1fr; grid-template-rows: 1fr auto auto; }
      .google-shell { max-width: 100%; }
      .sidebar { grid-column: 1; grid-row: 1; }
      #map-wrap { grid-column: 2; grid-row: 1; min-height: 60vh; }
      .results { position: static; grid-column: 1 / -1; grid-row: 2; border: none; border-top: 1px solid var(--line); border-radius: 0; max-height: 42vh; }
      .outfitters-panel { grid-column: 1 / -1; grid-row: 3; border-left: none; border-top: 1px solid var(--line); }
    }
    @media (max-width: 860px) {
      .app { grid-template-columns: 1fr; grid-template-rows: auto 52vh auto auto; height: auto; }
      .sidebar, .results, .outfitters-panel { border: none; }
      #map-wrap { position: relative; height: 52vh; min-height: 52vh; }
      .map-overlay { display: none; }
      .mobile-selected { display: block; }
      .results, .outfitters-panel { display: none; }
      .google-frame-wrap, .cesium-frame { min-height: 420px; height: 420px; }
    }
    @media (max-width: 560px) {
      html, body { max-width: 100%; overflow-x: hidden; }
      #map-wrap { height: 48vh; min-height: 48vh; }
    }
  </style>
</head>
<body>
  
  <div id="loadingOverlay" class="loading-overlay">
    <div class="squirrel-cage"></div>
    <div class="loading-text">Loading Hunt Data...</div>
  </div>

  <div class="app">
    <aside class="sidebar">
      <div class="panel-inner">
        <details class="rail-section" open>
          <summary class="rail-summary">Find a Hunt</summary>
          <div class="rail-body">
            <div class="field-stack">
          <div class="field">
            <label for="searchInput">Select by hunt number</label>
            <input id="searchInput" type="text" placeholder="Search hunt number, hunt name, or unit..." />
          </div>

          <div class="or-divider"><span>or</span></div>

          <div class="field">
            <label for="unitFilter">Unit</label>
            <select id="unitFilter" class="hunt-select"></select>
          </div>

          <div class="or-divider"><span>or</span></div>

          <div class="field">
            <label for="speciesFilter">Species</label>
            <select id="speciesFilter" class="hunt-select"></select>
          </div>

          <div class="field">
            <label for="sexFilter">Sex</label>
            <select id="sexFilter" class="hunt-select">
              <option value="All">All</option>
              <option value="Buck">Buck</option>
              <option value="Bull">Bull</option>
              <option value="Antlerless">Antlerless</option>
              <option value="Either Sex">Either Sex</option>
            </select>
          </div>

          <div class="field">
            <label for="huntTypeFilter">Hunt Type</label>
            <select id="huntTypeFilter" class="hunt-select">
              <option value="All">All</option>
              <option value="General">General Season</option>
              <option value="Youth">Youth</option>
              <option value="Limited Entry">Limited Entry</option>
              <option value="Premium Limited Entry">Premium Limited Entry</option>
              <option value="Management">Management</option>
              <option value="Dedicated Hunter">Dedicated Hunter</option>
              <option value="Cactus Buck">Cactus Buck</option>
              <option value="Once-in-a-Lifetime">Once-in-a-Lifetime</option>
            </select>
          </div>

          <div class="field">
            <label for="huntCategoryFilter">Hunt Class</label>
            <select id="huntCategoryFilter" class="hunt-select">
              <option value="All">All</option>
              <option value="Mature Bull">Mature Bull</option>
              <option value="General Bull">General Bull</option>
              <option value="Spike Only">Spike Only</option>
              <option value="Youth">Youth</option>
              <option value="Extended Archery">Extended Archery</option>
              <option value="Private Land Only">Private Land Only</option>
              <option value="Antlerless">Antlerless</option>
            </select>
          </div>

          <div class="field">
            <label for="weaponFilter">Weapon Type</label>
            <select id="weaponFilter" class="hunt-select">
              <option value="All">All</option>
              <option value="Any Legal Weapon">Any Legal Weapon</option>
              <option value="Archery">Archery</option>
              <option value="Extended Archery">Extended Archery</option>
              <option value="Restricted Archery">Restricted Archery</option>
              <option value="Muzzleloader">Muzzleloader</option>
              <option value="Restricted Muzzleloader">Restricted Muzzleloader</option>
              <option value="Restricted Rifle">Restricted Rifle</option>
              <option value="HAMSS">HAMSS</option>
              <option value="Multiseason">Multiseason</option>
              <option value="Restricted Multiseason">Restricted Multiseason</option>
            </select>
          </div>

            </div>
          </div>
        </details>

        <details class="rail-section" open>
          <summary class="rail-summary">Map View</summary>
          <div class="rail-body">
            <div class="field-stack">
          <div class="field">
            <label for="basemapSelect">Basemap</label>
            <select id="basemapSelect" class="hunt-select">
              <option value="usgs">Terrain</option>
              <option value="natgeo">Roadmap</option>
              <option value="sat">Satellite</option>
            </select>
          </div>
            </div>
          </div>
        </details>

        <details class="rail-section" open>
          <summary class="rail-summary">Outfitter Vetting</summary>
          <div class="rail-body">
            <div class="brand-service" style="margin-top:0;">
              <div class="brand-service-title">OUTFITTER VETTING</div>
              <div class="brand-service-subtitle">U.O.G.A. member tools for trusted outfitter discovery and land-reference context.</div>
              <div class="section-title" style="text-align:center; margin-top:0;">U.O.G.A. Land Layers</div>
              <div class="toggle-list" style="margin-top:0;">
                <div class="toggle"><span>Live Utah Hunt Units</span><input id="toggleLiveUnits" type="checkbox" checked /></div>
                <div class="toggle"><span>USFS Forests</span><input id="toggleUSFS" type="checkbox" checked /></div>
                <div class="toggle"><span>BLM Districts</span><input id="toggleBLM" type="checkbox" checked /></div>
                <div class="toggle"><span>SITLA</span><input id="toggleSITLA" type="checkbox" /></div>
                <div class="toggle"><span>State Lands</span><input id="toggleState" type="checkbox" /></div>
                <div class="toggle"><span>Private Lands</span><input id="togglePrivate" type="checkbox" /></div>
              </div>
              <div class="toggle-list">
                <div class="toggle"><span>Vetted Outfitters</span><input id="toggleOutfitters" type="checkbox" checked /></div>
              </div>
            </div>
          </div>
        </details>

        <div class="actions">
          <button id="openBoundaryBtn" class="btn-primary">Hunt Details</button>
          <button id="resetBtn" class="btn-secondary">Reset Planner</button>
        </div>

        <div class="small-note">
          Select a hunt to update details and vetted outfitter results.
        </div>

        <div class="mobile-selected">
          <div class="section-title">Selected Hunt</div>
          <div id="selectedSummaryMobile" class="selected-summary" style="margin-top:6px;">
            <div class="selected-summary-head">
              <div class="selected-summary-label">Selected Hunt</div>
              <div id="selectedRefMobile" class="selected-summary-ref">Reference</div>
            </div>
            <h3 id="selectedTitleMobile" class="selected-summary-title">No hunt selected</h3>
            <p id="selectedMetaMobile" class="selected-summary-meta">Choose filters or click a hunt unit to load hunt and outfitter results.</p>
          </div>
        </div>

        <div class="mobile-sections">
          <div class="section-title section-title-row">
            <span>Matching Hunts</span>
            <span id="huntCountMobile" class="count-chip">0</span>
          </div>
          <div id="huntResultsMobile" class="empty table-like" style="margin-bottom:12px;">No hunt data loaded yet.</div>

          <div class="section-title">Hunt Details</div>
          <div id="areaInfoMobile" class="empty" style="margin-bottom:12px;">Click a hunt unit or select one from the filter.</div>

          <div class="section-title">Vetted Outfitters</div>
          <div id="resultsMobile" class="empty">Select a hunt or unit to load outfitter results.</div>
        </div>
      </div>
    </aside>

    <main id="map-wrap">
      <div id="map"></div>
      <div class="map-top-actions">
        <div class="overlay-card map-brand">
          <img
            src="https://static.wixstatic.com/media/43f827_24f00cd070494533955d4910eef3a2fb~mv2.jpg/v1/fill/w_207,h_105,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/Group%20945%20(1).jpg"
            alt="U.O.G.A. logo"
          />
          <div class="map-brand-copy">
            <h2>U.O.G.A. Hunt Planner</h2>
            <p>Utah Vetted Outfitters</p>
          </div>
        </div>
        <button id="openAboutBtn" class="btn-secondary" data-action="open-about">Instructions</button>
      </div>
      <div class="map-overlay">
        <div class="map-overlay-left">
          <div id="selectedSummaryDesktop" class="overlay-card selected-summary">
            <div class="selected-summary-head">
              <div class="selected-summary-label">Selected Hunt</div>
              <div id="selectedRef" class="selected-summary-ref">Reference</div>
            </div>
            <h2 id="selectedTitle" class="selected-summary-title">No hunt selected</h2>
            <p id="selectedMeta" class="selected-summary-meta">Choose filters or click a hunt unit to load hunt and outfitter results.</p>
          </div>
        </div>
        <div class="map-overlay-right">
          <div class="overlay-card map-detail-card">
            <div class="section-title">U.O.G.A. Hunt Planner Details</div>
            <div class="map-detail-body">
              <div id="areaInfoMap" class="empty">Click a hunt unit or select one from the filter.</div>
            </div>
          </div>
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
          <span>Unit</span>
          <span>Hunt Number</span>
          <span>Sex</span>
          <span>Species</span>
          <span>Weapon</span>
          <span>Hunt Type / Dates</span>
          <span>Action</span>
        </div>
        <div class="panel-inner">
          <div id="huntResults" class="empty table-like" style="margin-bottom:12px;">No hunt data loaded yet.</div>

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

  <section class="google-section dwr-section">
    <div class="google-shell">
      <div class="google-head">
        <div>
          <h3>Cesium 3D Scout View</h3>
          <div id="cesiumMeta" class="google-meta">Showing a general Utah 3D scouting view. Select a hunt to fly to that unit.</div>
        </div>
        <div class="google-head-actions">
          <button id="toggleCesiumPanelBtn" type="button">Expand Panel</button>
        </div>
      </div>
      <div class="google-frame-wrap">
        <div id="cesiumContainer" class="cesium-frame" aria-label="Cesium 3D scouting view"></div>
      </div>
      <div class="cesium-controls">
        <button id="cesiumZoomBtn" type="button" class="btn-primary">Zoom To Hunt</button>
        <button id="cesiumTiltBtn" type="button" class="btn-secondary">Tilt View</button>
        <button id="cesiumResetBtn" type="button" class="btn-secondary">Reset Utah</button>
        <button id="cesiumTerrainBtn" type="button" class="btn-secondary">Terrain Relief</button>
      </div>
      <div id="cesiumNotice" class="cesium-note">3D scouting is live. This section uses free imagery right now; adding true mountain terrain relief later will require a terrain service connection.</div>
    </div>
  </section>

  <section class="google-section">
    <div class="google-shell">
      <div class="google-head">
        <div>
          <h3>Utah DWR Official Hunt Details</h3>
          <div id="dwrBoundaryMeta" class="google-meta">Showing the official state hunt details. Select a hunt, then use the hunt info button to load that source here.</div>
        </div>
        <div class="google-head-actions">
          <button id="toggleDwrPanelBtn" type="button">Expand Panel</button>
        </div>
      </div>
      <div id="dwrBoundarySnapshot" class="panel-inner" style="display:none;"></div>
      <div class="google-frame-wrap">
        <iframe
          id="dwrBoundaryEmbed"
          class="google-frame"
          loading="lazy"
          referrerpolicy="no-referrer-when-downgrade"
          src="https://dwrapps.utah.gov/huntboundary/hbstart"
          title="Official hunt reference view"
        ></iframe>
      </div>
    </div>
  </section>

  <div id="aboutModal" class="about-modal" aria-hidden="true">
    <div class="about-dialog" role="dialog" aria-modal="true" aria-labelledby="aboutModalTitle">
      <div class="about-dialog-head">
        <h3 id="aboutModalTitle">Welcome To The U.O.G.A. Hunt Planner</h3>
        <button id="closeAboutBtn" type="button" class="btn-secondary">Close</button>
      </div>
      <div class="about-dialog-body">
        <p><strong>Start here:</strong> this planner is built to help you find a hunt, review the unit, and connect with vetted outfitters in one place.</p>
        <ol class="brand-steps" style="margin-bottom:14px;">
          <li><strong>Find a hunt</strong> with the filters on the left.</li>
          <li><strong>Select a hunt</strong> from the list or click a unit on the map.</li>
          <li><strong>Read Hunt Details</strong> on the main map.</li>
          <li><strong>Review Vetted Outfitters</strong> on the right.</li>
          <li><strong>Turn on Land Layers</strong> when you want access and ownership context.</li>
        </ol>
        <p><strong>Optional:</strong> use <strong>Cesium 3D Scout View</strong> for extra terrain review.</p>
      </div>
      <div class="about-dialog-actions">
        <button id="aboutOkBtn" type="button" class="btn-primary">OK</button>
      </div>
    </div>
  </div>

  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script src="https://unpkg.com/esri-leaflet@3.0.8/dist/esri-leaflet.js"></script>
  <script src="https://cesium.com/downloads/cesiumjs/releases/1.135/Build/Cesium/Cesium.js"></script>
  <script src="app.js"></script>
</body>
</html>
2. app.js
Copy this code and save it as app.js.

JavaScript

// -----------------------------
// UOGA Hunt Planner - Stable Baseline
// -----------------------------

let huntData = [];
let selectedHunt = null;
let selectedUnit = null;
const APP_BUILD = 'build-2026-03-22-118';
const FEDERAL_BADGE_MIN_ZOOM = 8;
const CESIUM_ION_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIxMjBiODg4NS1mMDNkLTRjNTYtOGQxZi1jMmY4ZjdhMTIxMGIiLCJpZCI6NDA3MDE1LCJpYXQiOjE3NzQwODk2NzF9.2nojSCO46EKYlLpsj3YQ5fGDj_z92PjmL-w1mdhfHfI';

let outfitters = [
  {
    listingName: 'Wild Eyez Outfitters',
    listingType: 'Outfitter',
    certLevel: 'CPO',
    verificationStatus: 'Vetted',
    website: 'https://www.wildeyez.net',
    phone: '4358516480',
    email: 'tyler@wildeyez.net',
    speciesServed: 'Elk, Mule Deer',
    region: 'Utah',
    city: 'Manti',
    unitsServed: 'beaver-east,fishlake,manti-san-rafael,monroe,fillmore,nebo',
    blmDistricts: 'Richfield',
    usfsForests: 'Fishlake NF - Richfield; Manti-La Sal NF - Sanpete'
  }
];
const OUTFITTERS_DATA_SOURCES = [
  './data/outfitters.json',
  './data/outfitters.json.json'
];

const DWR_MAPSERVER =
  'https://dwrmapserv.utah.gov/dwrarcgis/rest/services/HuntBoundary/HUNT_BOUNDARY_PROD/MapServer';
const DWR_HUNT_BOUNDARY_LAYER = `${DWR_MAPSERVER}/0`;
const DWR_HUNT_INFO_TABLE =
  'https://dwrmapserv.utah.gov/arcgis/rest/services/hunt/Boundaries_and_Tables/MapServer/1/query';
const LOCAL_HUNT_BOUNDARIES_PATH = 'https://json.uoga.workers.dev/hunt-boundaries';

// --- CLOUDFLARE JSON SOURCES ---
const CLOUDFLARE_BASE = 'https://json.uoga.workers.dev';

const HUNT_DATA_SOURCES = [
  { label: 'Buck Deer', required: true, candidates: [`${CLOUDFLARE_BASE}/Utah_Hunt_Planner_Master_BuckDeer_Pages_43_53.json`] },
  { label: 'Pronghorn', required: false, candidates: [`${CLOUDFLARE_BASE}/Utah_Hunt_Planner_Master_Pronghorn.json`] },
  { label: 'Moose', required: false, candidates: [`${CLOUDFLARE_BASE}/Utah_Hunt_Planner_Master_Moose.json`] },
  { label: 'Bighorn Sheep', required: false, candidates: [`${CLOUDFLARE_BASE}/Utah_Hunt_Planner_Master_BighornSheep.json`] },
  { label: 'Mountain Goat', required: false, candidates: [`${CLOUDFLARE_BASE}/Utah_Hunt_Planner_Master_MountainGoat.json`] },
  { label: 'Bison', required: false, candidates: [`${CLOUDFLARE_BASE}/Utah_Hunt_Planner_Master_Bison.json`] },
  { label: 'Black Bear', required: false, candidates: [`${CLOUDFLARE_BASE}/Utah_Hunt_Planner_Master_BlackBear.json`] },
  { label: 'Turkey', required: false, candidates: [`${CLOUDFLARE_BASE}/Utah_Hunt_Planner_Master_Turkey.json`] },
  { label: 'Cougar', required: false, candidates: [`${CLOUDFLARE_BASE}/Utah_Hunt_Planner_Master_Cougar.json`] },
  { label: 'Bull Elk', required: false, candidates: [`${CLOUDFLARE_BASE}/Utah_Hunt_Planner_Master_BullElk.json`] },
  { label: 'General Elk', required: false, candidates: [`${CLOUDFLARE_BASE}/Utah_Hunt_Planner_Master_GeneralElk.json`] },
  { label: 'Spike Elk', required: false, candidates: [`${CLOUDFLARE_BASE}/Utah_Hunt_Planner_Master_SpikeElk.json`] },
  { label: 'Antlerless Elk', required: false, candidates: [`${CLOUDFLARE_BASE}/Utah_Hunt_Planner_Master_AntlerlessElk.json`] },
  { label: 'Special Elk', required: false, candidates: [`${CLOUDFLARE_BASE}/Utah_Hunt_Planner_Master_SpecialElk.json`] }
];

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

const OUTFITTER_CITY_LOOKUP = {
  blanding: [37.624, -109.478],
  beaver: [38.2769, -112.6411],
  cedarcity: [37.6775, -113.0619],
  'cedar city': [37.6775, -113.0619],
  delta: [39.3527, -112.5772],
  duchesne: [40.1633, -110.4010],
  ephraim: [39.3597, -111.5863],
  escalante: [37.7703, -111.6027],
  ferron: [39.0930, -111.1299],
  fillmore: [38.9688, -112.3233],
  gunnison: [39.1555, -111.8199],
  heber: [40.5070, -111.4138],
  'heber city': [40.5070, -111.4138],
  kanab: [37.0475, -112.5263],
  kamas: [40.6430, -111.2807],
  loa: [38.4022, -111.6358],
  manti: [39.2683, -111.6369],
  moab: [38.5733, -109.5498],
  monroe: [38.6291, -112.1202],
  monticello: [37.8711, -109.3429],
  'mount pleasant': [39.5461, -111.4552],
  nephi: [39.7103, -111.8358],
  panguitch: [37.8228, -112.4358],
  price: [39.5994, -110.8107],
  richfield: [38.7725, -112.0849],
  roosevelt: [40.2994, -109.9888],
  salina: [38.9583, -111.8597],
  'spanish fork': [40.1149, -111.6549],
  springville: [40.1652, -111.6108],
  'st george': [37.0965, -113.5684],
  'st. george': [37.0965, -113.5684],
  vernal: [40.4555, -109.5287]
};

const USFS_BADGE_URL = 'https://static.wixstatic.com/media/43f827_8a0c98ae96b644eca819113c1cfa0fc2~mv2.png';
const BLM_BADGE_URL = 'https://static.wixstatic.com/media/43f827_5f1586f9c5b54340a1f8e50ec128188d~mv2.png';

const HUNT_TYPE_ORDER = [
  'General', 'Youth', 'Limited Entry', 'Premium Limited Entry', 'Management',
  'Dedicated Hunter', 'Cactus Buck', 'Once-in-a-Lifetime', 'Antlerless'
];

const HUNT_CATEGORY_ORDER = [
  'Mature Bull', 'General Bull', 'Spike Only', 'Youth', 'Extended Archery',
  'Private Land Only', 'Antlerless', 'Pronghorn', 'Moose', 'Rocky Mountain Bighorn',
  'Desert Bighorn', 'Mountain Goat', 'Bison', 'Turkey', 'Cougar', 'Conservation',
  'Pursuit', 'Spot and Stalk', 'Control', 'CWMU', 'Select Areas', 'Statewide Permit'
];

const SEX_ORDER = ['Buck', 'Bull', 'Antlerless', 'Either Sex'];
const WEAPON_ORDER = [
  'Any Legal Weapon', 'Archery', 'Extended Archery', 'Restricted Archery',
  'Muzzleloader', 'Restricted Muzzleloader', 'Restricted Rifle', 'HAMSS',
  'Multiseason', 'Restricted Multiseason'
];

const HUNT_BOUNDARY_NAME_OVERRIDES = {
  DB1503: ['Manti, San Rafael'], DB1533: ['Manti, San Rafael'], DB1504: ['Nebo'], DB1534: ['Nebo'],
  DB1510: ['Monroe'], DB1540: ['Monroe'], DB1506: ['Fillmore'], DB1536: ['Fillmore'],
  EA1220: ['Manti, North', 'Manti, South', 'Manti, West', 'Manti, Central', 'Manti, Mohrland-Stump Flat', 'Manti, Horn Mtn', 'Manti, Gordon Creek-Price Canyon', 'Manti, Ferron Canyon'],
  EA1221: ['Fishlake/Thousand Lakes', 'Fishlake/Thousand Lakes East', 'Fishlake/Thousand Lakes West'],
  EA1258: ['La Sal Mtns', 'Dolores Triangle', 'La Sal, La Sal Mtns-North']
};

const searchInput = document.getElementById('searchInput');
const speciesFilter = document.getElementById('speciesFilter');
const sexFilter = document.getElementById('sexFilter');
const weaponFilter = document.getElementById('weaponFilter');
const huntTypeFilter = document.getElementById('huntTypeFilter');
const huntCategoryFilter = document.getElementById('huntCategoryFilter');
const unitFilter = document.getElementById('unitFilter');
const basemapSelect = document.getElementById('basemapSelect');

const toggleLiveUnits = document.getElementById('toggleLiveUnits');
const toggleUSFS = document.getElementById('toggleUSFS');
const toggleBLM = document.getElementById('toggleBLM');
const toggleSITLA = document.getElementById('toggleSITLA');
const toggleState = document.getElementById('toggleState');
const togglePrivate = document.getElementById('togglePrivate');

const toggleOutfitters = document.getElementById('toggleOutfitters');

const openBoundaryBtn = document.getElementById('openBoundaryBtn');
const openAboutBtn = document.getElementById('openAboutBtn');
const resetBtn = document.getElementById('resetBtn');

const selectedTitle = document.getElementById('selectedTitle');
const selectedMeta = document.getElementById('selectedMeta');
const selectedRef = document.getElementById('selectedRef');
const selectedTitleMobile = document.getElementById('selectedTitleMobile');
const selectedMetaMobile = document.getElementById('selectedMetaMobile');
const selectedRefMobile = document.getElementById('selectedRefMobile');
const selectedSummaryDesktop = document.getElementById('selectedSummaryDesktop');
const selectedSummaryMobile = document.getElementById('selectedSummaryMobile');
const dwrBoundaryEmbed = document.getElementById('dwrBoundaryEmbed');
const dwrBoundaryMeta = document.getElementById('dwrBoundaryMeta');
const dwrBoundarySnapshot = document.getElementById('dwrBoundarySnapshot');
const cesiumContainer = document.getElementById('cesiumContainer');
const cesiumMeta = document.getElementById('cesiumMeta');
const cesiumNotice = document.getElementById('cesiumNotice');
const cesiumZoomBtn = document.getElementById('cesiumZoomBtn');
const cesiumTiltBtn = document.getElementById('cesiumTiltBtn');
const cesiumResetBtn = document.getElementById('cesiumResetBtn');
const cesiumTerrainBtn = document.getElementById('cesiumTerrainBtn');
const dwrShell = dwrBoundaryEmbed?.closest('.google-shell') || null;
const cesiumShell = cesiumContainer?.closest('.google-shell') || null;
const toggleCesiumPanelBtn = document.getElementById('toggleCesiumPanelBtn');
const aboutModal = document.getElementById('aboutModal');
const closeAboutBtn = document.getElementById('closeAboutBtn');
const aboutOkBtn = document.getElementById('aboutOkBtn');

let cesiumViewer = null;
let cesiumSelectionEntity = null;
let cesiumBoundaryDataSource = null;
let cesiumTerrainEnabled = false;
let cesiumTilted = false;
let cesiumViewRequestId = 0;
const remoteHuntInfoCache = new Map();
const toggleDwrPanelBtn = document.getElementById('toggleDwrPanelBtn');
const huntResultsEl = document.getElementById('huntResults');
const huntResultsMobileEl = document.getElementById('huntResultsMobile');
const resultsEl = document.getElementById('results');
const resultsMobileEl = document.getElementById('resultsMobile');
const areaInfoMobileEl = document.getElementById('areaInfoMobile');
const areaInfoMapEl = document.getElementById('areaInfoMap');
const huntCountEl = document.getElementById('huntCount');
const huntCountMobileEl = document.getElementById('huntCountMobile');
const resultsTrayEl = document.querySelector('.results');
const toggleResultsTrayBtn = document.getElementById('toggleResultsTray');
const mapWrapEl = document.getElementById('map-wrap');

function safe(v) { return String(v ?? ''); }

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
  return safe(v).trim().toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function listify(value) {
  if (Array.isArray(value)) return value.map(v => safe(v).trim()).filter(Boolean);
  return safe(value).split(/[;,|]/).map(v => safe(v).trim()).filter(Boolean);
}

function splitEmailList(value) {
  if (Array.isArray(value)) return value.map(v => safe(v).trim()).filter(Boolean);
  return safe(value).split(/[\s,;|]+/).map(v => safe(v).trim()).filter(v => v && v.includes('@'));
}

function splitOwnerList(value) {
  if (Array.isArray(value)) return value.map(v => safe(v).trim()).filter(Boolean);
  return safe(value).split(/[;|]/).map(v => safe(v).trim()).filter(Boolean);
}

function splitPhoneList(value) {
  if (Array.isArray(value)) return value.map(v => safe(v).trim()).filter(Boolean);
  const raw = safe(value).trim();
  if (!raw) return [];
  const matches = raw.match(/(?:\+?1[\s.-]*)?(?:\(?\d{3}\)?[\s.-]*)\d{3}[\s.-]*\d{4}/g);
  if (matches && matches.length) {
    return matches.map(v => safe(v).trim()).filter(Boolean);
  }
  return [raw];
}

function slugList(value) { return listify(value).map(slugify).filter(Boolean); }

function formatPhone(phone) {
  const d = safe(phone).replace(/\D/g, '');
  if (d.length === 10) return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  return safe(phone);
}

function formatPhoneList(phone) {
  return splitPhoneList(phone).map(formatPhone).filter(Boolean).join(', ');
}

function getOutfitterCityCenter(outfitter) {
  const rawCity = safe(outfitter?.city).trim().toLowerCase();
  if (!rawCity) return null;
  return (
    OUTFITTER_CITY_LOOKUP[rawCity] ||
    OUTFITTER_CITY_LOOKUP[rawCity.replace(/\./g, '')] ||
    OUTFITTER_CITY_LOOKUP[rawCity.replace(/\s+/g, '')] ||
    null
  );
}

function getOutfitterLogoUrl(outfitter) {
  const url = normalizeUrl(outfitter?.logoUrl || outfitter?.logo || outfitter?.imageUrl);
  return url || '';
}

function createOutfitterMarkerIcon(outfitter) {
  const logoUrl = getOutfitterLogoUrl(outfitter);
  if (!logoUrl) return null;
  const safeLogoUrl = escapeHtml(logoUrl);
  return L.divIcon({
    className: 'outfitter-logo-pin',
    iconSize: [44, 58],
    iconAnchor: [22, 52],
    popupAnchor: [0, -46],
    html: `
      <div class="outfitter-logo-pin-shell">
        <div class="outfitter-logo-pin-base"></div>
        <div class="outfitter-logo-pin-center">
          <img src="${safeLogoUrl}" alt="${escapeHtml(outfitter?.listingName || 'Outfitter')}">
        </div>
      </div>
    `
  });
}

function setSelectedDisplay(title, meta, reference = '') {
  const resolvedTitle = safe(title).trim() || 'No hunt selected';
  const resolvedMeta = safe(meta).trim() || 'Choose filters or click a hunt unit to load hunt and outfitter results.';
  const resolvedReference = safe(reference).trim() || 'Reference';
  const hasSelection = resolvedTitle.toLowerCase() !== 'no hunt selected';

  if (selectedTitle) selectedTitle.textContent = resolvedTitle;
  if (selectedMeta) selectedMeta.textContent = resolvedMeta;
  if (selectedRef) selectedRef.textContent = hasSelection ? resolvedReference : 'Reference';
  if (selectedTitleMobile) selectedTitleMobile.textContent = resolvedTitle;
  if (selectedMetaMobile) selectedMetaMobile.textContent = resolvedMeta;
  if (selectedRefMobile) selectedRefMobile.textContent = hasSelection ? resolvedReference : 'Reference';
  if (selectedSummaryDesktop) selectedSummaryDesktop.classList.toggle('is-active', hasSelection);
  if (selectedSummaryMobile) selectedSummaryMobile.classList.toggle('is-active', hasSelection);
}

function getDwrPlannerUrl(hunt = null) {
  const huntCode = safe(hunt?.huntCode || hunt?.code).trim();
  if (huntCode) return `https://dwrapps.utah.gov/huntboundary/hbstart?HN=${encodeURIComponent(huntCode)}`;
  return 'https://dwrapps.utah.gov/huntboundary/hbstart';
}

function getDwrHuntInfoUrl(hunt = null) {
  const huntCode = safe(getHuntCode(hunt)).trim();
  if (huntCode) return `https://dwrapps.utah.gov/huntboundary/PrintABoundary?HN=${encodeURIComponent(huntCode)}`;
  return getDwrPlannerUrl(hunt);
}

async function fetchRemoteHuntInfo(hunt) {
  const huntCode = safe(getHuntCode(hunt)).trim();
  if (!huntCode) return null;

  const now = Date.now();
  const cached = remoteHuntInfoCache.get(huntCode);
  if (cached && (now - cached.fetchedAt) < 5 * 60 * 1000) {
    return cached.data;
  }

  const url =
    `${DWR_HUNT_INFO_TABLE}?` +
    `where=${encodeURIComponent(`HUNT_NUMBER='${huntCode.replace(/'/g, "''")}'`)}` +
    '&outFields=BOUNDARY_NAME,SEASON,BOUNDARYID,HUNT_NUMBER' +
    '&returnGeometry=false' +
    '&f=json';

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Remote hunt info query failed: ${response.status}`);
  }

  const payload = await response.json();
  const features = Array.isArray(payload?.features) ? payload.features : [];
  const rows = features.map(feature => feature?.attributes || {});

  const data = {
    huntCode,
    seasons: Array.from(new Set(rows.map(r => safe(r.SEASON).trim()).filter(Boolean))),
    boundaryNames: Array.from(new Set(rows.map(r => safe(r.BOUNDARY_NAME).trim()).filter(Boolean))),
    boundaryIds: Array.from(new Set(rows.map(r => safe(r.BOUNDARYID).trim()).filter(Boolean)))
  };

  remoteHuntInfoCache.set(huntCode, {
    fetchedAt: now,
    data
  });

  return data;
}

function getEffectiveSeasonText(hunt, remoteInfo = null) {
  const remoteSeasons = Array.isArray(remoteInfo?.seasons) ? remoteInfo.seasons.filter(Boolean) : [];
  if (remoteSeasons.length) return remoteSeasons.join(' | ');
  return safe(getDates(hunt)).trim();
}

function getSelectedBoundaryFeaturesForHunt(hunt = selectedHunt) {
  if (!hunt) return [];
  const matchSets = buildBoundaryMatchSets(hunt);
  return filterBoundaryFeatures(matchSets.names, matchSets.ids);
}

async function refreshSelectedHuntOfficialInfo(hunt = selectedHunt) {
  if (!hunt) return;

  try {
    const remoteInfo = await fetchRemoteHuntInfo(hunt);
    if (!selectedHunt || getHuntCode(selectedHunt) !== getHuntCode(hunt)) return;
    renderAreaInfo(remoteInfo);
  } catch (error) {
    console.warn('Remote hunt info refresh failed:', error);
  }
}

function updateDwrBoundaryEmbed(hunt = null, options = {}) {
  if (!dwrBoundaryEmbed) return;

  const src = options.forceFrame && hunt ? getDwrHuntInfoUrl(hunt) : getDwrPlannerUrl(hunt);
  const frameWrap = dwrBoundaryEmbed.closest('.google-frame-wrap');

  if (hunt) {
    if (dwrBoundarySnapshot) {
      dwrBoundarySnapshot.style.display = 'block';
      dwrBoundarySnapshot.innerHTML = `
        <div class="dwr-snapshot-card">
          <h4>${escapeHtml(getHuntTitle(hunt) || getHuntCode(hunt))}</h4>
          <div class="dwr-snapshot-grid">
            <div><strong>Hunt Number:</strong><br>${escapeHtml(getHuntCode(hunt) || 'N/A')}</div>
            <div><strong>Unit:</strong><br>${escapeHtml(getUnitName(hunt) || getUnitValue(hunt) || 'N/A')}</div>
            <div><strong>Species:</strong><br>${escapeHtml(getSpeciesRaw(hunt) || 'N/A')}</div>
            <div><strong>Sex:</strong><br>${escapeHtml(getSex(hunt) || 'N/A')}</div>
            <div><strong>Weapon:</strong><br>${escapeHtml(getWeapon(hunt) || 'N/A')}</div>
            <div><strong>Hunt Type:</strong><br>${escapeHtml(getHuntType(hunt) || 'N/A')}</div>
            <div><strong>Dates:</strong><br>${escapeHtml(getDates(hunt) || 'N/A')}</div>
          </div>
          <div class="dwr-snapshot-actions">
            <button type="button" class="btn-primary" data-action="load-dwr-map-here">Load Full Hunt Info Here</button>
            <a href="${escapeHtml(src)}" target="_blank" rel="noopener noreferrer">
              <button type="button" class="btn-secondary">Open Full Hunt Info in New Tab</button>
            </a>
          </div>
        </div>
      `;
    }
    if (frameWrap && !options.forceFrame) frameWrap.style.display = 'none';
  } else {
    if (dwrBoundarySnapshot) {
      dwrBoundarySnapshot.style.display = 'none';
      dwrBoundarySnapshot.innerHTML = '';
    }
    if (frameWrap) frameWrap.style.display = '';
    dwrBoundaryEmbed.src = src;
  }

  if (options.forceFrame) {
    if (frameWrap) frameWrap.style.display = '';
    dwrBoundaryEmbed.src = src;
  }

  if (dwrBoundaryMeta) {
    dwrBoundaryMeta.textContent = hunt
      ? `Showing a hunt info snapshot for ${getUnitName(hunt) || getHuntTitle(hunt)}. Load the full official hunt details here when you want the long-form unit information.`
      : 'Showing the official state hunt reference. Select a hunt, then use the hunt info button to load the full hunt details here.';
  }

  if (options.scrollIntoView) {
    (dwrBoundarySnapshot || dwrBoundaryEmbed).scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function initCesiumViewer() {
  if (!cesiumContainer || !window.Cesium) return;

  const C = window.Cesium;

  try {
    if (CESIUM_ION_TOKEN) {
      C.Ion.defaultAccessToken = CESIUM_ION_TOKEN;
    }

    cesiumViewer = new C.Viewer('cesiumContainer', {
      animation: false,
      timeline: false,
      geocoder: false,
      baseLayerPicker: false,
      sceneModePicker: true,
      homeButton: true,
      navigationHelpButton: false,
      fullscreenButton: true,
      infoBox: false,
      selectionIndicator: false,
      scene3DOnly: true,
      terrainProvider: new C.EllipsoidTerrainProvider(),
      baseLayer: false
    });

    cesiumViewer.imageryLayers.addImageryProvider(
      new C.UrlTemplateImageryProvider({
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        credit: 'Esri'
      })
    );

    cesiumViewer.imageryLayers.addImageryProvider(
      new C.UrlTemplateImageryProvider({
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places_Alternate/MapServer/tile/{z}/{y}/{x}',
        credit: 'Esri'
      })
    );

    cesiumViewer.scene.globe.enableLighting = true;
    cesiumViewer.scene.screenSpaceCameraController.enableCollisionDetection = true;
    cesiumViewer.camera.setView({
      destination: C.Cartesian3.fromDegrees(-111.7, 39.3, 1800000)
    });

    if (cesiumNotice) {
      cesiumNotice.textContent = CESIUM_ION_TOKEN
        ? '3D scouting is live with Cesium. This panel can be upgraded further with terrain and more advanced 3D services as needed.'
        : '3D scouting is live. This section uses free imagery right now; adding true mountain terrain relief later will require a terrain service connection.';
    }

    updateCesiumControlLabels();
  } catch (error) {
    console.error('Failed to initialize Cesium viewer:', error);
    if (cesiumMeta) {
      cesiumMeta.textContent = 'Cesium 3D view could not be initialized in this browser.';
    }
    if (cesiumNotice) {
      cesiumNotice.textContent = 'Cesium did not finish loading here. The rest of the planner is still working normally.';
    }
  }
}

function getCesiumSelectedCenter(hunt = selectedHunt) {
  if (!hunt) return null;
  const boundaryCenter = getSelectedBoundaryCenter(hunt);
  if (boundaryCenter && isLikelyUtahCoordinate(boundaryCenter.lat, boundaryCenter.lng)) {
    return boundaryCenter;
  }
  const trustedCenter = getTrustedUnitCenter(hunt);
  const lat = getHuntLat(hunt);
  const lng = getHuntLng(hunt);
  const hasValidTrustedCenter = Array.isArray(trustedCenter) && isLikelyUtahCoordinate(trustedCenter[0], trustedCenter[1]);
  const hasValidHuntCenter = isLikelyUtahCoordinate(lat, lng);
  const centerLat = hasValidTrustedCenter ? trustedCenter[0] : hasValidHuntCenter ? lat : null;
  const centerLng = hasValidTrustedCenter ? trustedCenter[1] : hasValidHuntCenter ? lng : null;
  if (!Number.isFinite(centerLat) || !Number.isFinite(centerLng)) return null;
  return { lat: centerLat, lng: centerLng };
}

function updateCesiumControlLabels() {
  if (cesiumTiltBtn) {
    cesiumTiltBtn.textContent = cesiumTilted ? 'Flatten View' : 'Tilt View';
  }
  if (cesiumTerrainBtn) {
    cesiumTerrainBtn.textContent = cesiumTerrainEnabled ? 'Terrain Relief On' : 'Terrain Relief';
  }
}

async function enableCesiumTerrainRelief() {
  if (!cesiumViewer || !window.Cesium) return;

  const C = window.Cesium;

  if (!CESIUM_ION_TOKEN) {
    if (cesiumNotice) {
      cesiumNotice.textContent = 'Terrain Relief is ready, but it needs a Cesium ion terrain token in app.js before true mountain relief can load.';
    }
    return;
  }

  try {
    C.Ion.defaultAccessToken = CESIUM_ION_TOKEN;
    const terrainProvider = typeof C.createWorldTerrainAsync === 'function'
      ? await C.createWorldTerrainAsync()
      : C.createWorldTerrain();
    cesiumViewer.scene.terrainProvider = terrainProvider;
    cesiumTerrainEnabled = true;
    if (cesiumNotice) {
      cesiumNotice.textContent = 'Terrain Relief is enabled. Cesium is now using a terrain service to add real mountain shape and relief.';
    }
    updateCesiumControlLabels();
    updateCesiumView(selectedHunt);
  } catch (error) {
    console.error('Failed to enable Cesium terrain:', error);
    if (cesiumNotice) {
      cesiumNotice.textContent = 'Terrain Relief could not be enabled. Check the Cesium terrain token and connection, then try again.';
    }
  }
}

function resetCesiumView() {
  if (!cesiumViewer || !window.Cesium) return;
  const C = window.Cesium;
  cesiumTilted = false;
  updateCesiumControlLabels();
  cesiumViewer.camera.flyTo({
    destination: C.Cartesian3.fromDegrees(-111.7, 39.3, 1800000),
    orientation: {
      heading: 0,
      pitch: C.Math.toRadians(-65),
      roll: 0
    },
    duration: 1.4
  });
  if (cesiumMeta) {
    cesiumMeta.textContent = 'Showing a general Utah 3D scouting view. Select a hunt to fly to that unit.';
  }
}

function zoomCesiumToSelectedHunt() {
  if (!selectedHunt) {
    if (cesiumNotice) {
      cesiumNotice.textContent = 'Select a hunt first, then use Zoom To Hunt to focus the 3D scouting view.';
    }
    return;
  }
  updateCesiumView(selectedHunt);
}

async function syncCesiumBoundaryOutline(hunt, requestId) {
  if (!cesiumViewer || !window.Cesium) return;
  const C = window.Cesium;

  if (cesiumBoundaryDataSource) {
    try {
      cesiumViewer.dataSources.remove(cesiumBoundaryDataSource, true);
    } catch (error) {
      console.warn('Failed to remove previous Cesium boundary data source:', error);
    }
    cesiumBoundaryDataSource = null;
  }

  if (!hunt) return;

  const features = getSelectedBoundaryFeaturesForHunt(hunt).filter(feature => feature?.geometry);
  if (!features.length) return;

  const geojson = {
    type: 'FeatureCollection',
    features: features.map(feature => ({
      type: 'Feature',
      geometry: feature.geometry,
      properties: {
        name: getBoundaryFeatureName(feature) || getUnitName(hunt) || getHuntCode(hunt) || 'Selected Hunt Boundary'
      }
    }))
  };

  try {
    const dataSource = await C.GeoJsonDataSource.load(geojson, {
      stroke: C.Color.fromCssColorString('#c96b33'),
      fill: C.Color.fromCssColorString('#c96b33').withAlpha(0.08),
      strokeWidth: 3,
      clampToGround: false
    });

    if (requestId !== cesiumViewRequestId) {
      return;
    }

    dataSource.entities.values.forEach(entity => {
      if (entity.polygon) {
        entity.polygon.outline = true;
        entity.polygon.outlineColor = C.Color.fromCssColorString('#fff6ed');
        entity.polygon.outlineWidth = 2;
      }
      if (entity.polyline) {
        entity.polyline.width = 4;
        entity.polyline.material = C.Color.fromCssColorString('#c96b33');
      }
    });

    cesiumBoundaryDataSource = dataSource;
    cesiumViewer.dataSources.add(dataSource);
  } catch (error) {
    console.warn('Failed to load selected hunt outline into Cesium:', error);
  }
}

function toggleCesiumTilt() {
  if (!cesiumViewer || !window.Cesium) return;
  const C = window.Cesium;
  const center = getCesiumSelectedCenter(selectedHunt);
  const destination = center
    ? C.Cartesian3.fromDegrees(center.lng, center.lat, cesiumTerrainEnabled ? 180000 : 300000)
    : C.Cartesian3.fromDegrees(-111.7, 39.3, 1800000);

  cesiumTilted = !cesiumTilted;
  updateCesiumControlLabels();

  cesiumViewer.camera.flyTo({
    destination,
    orientation: {
      heading: 0,
      pitch: C.Math.toRadians(cesiumTilted ? -28 : -65),
      roll: 0
    },
    duration: 1.2
  });
}

function updateCesiumView(hunt = null) {
  if (!cesiumViewer || !window.Cesium) return;

  const C = window.Cesium;
  const requestId = ++cesiumViewRequestId;

  if (cesiumSelectionEntity) {
    cesiumViewer.entities.remove(cesiumSelectionEntity);
    cesiumSelectionEntity = null;
  }

  if (cesiumBoundaryDataSource) {
    try {
      cesiumViewer.dataSources.remove(cesiumBoundaryDataSource, true);
    } catch (error) {
      console.warn('Failed to clear Cesium boundary data source:', error);
    }
    cesiumBoundaryDataSource = null;
  }

  if (!hunt) {
    cesiumViewer.camera.flyTo({
      destination: C.Cartesian3.fromDegrees(-111.7, 39.3, 1800000),
      orientation: {
        heading: 0,
        pitch: C.Math.toRadians(-65),
        roll: 0
      },
      duration: 1.2
    });
    cesiumTilted = false;
    updateCesiumControlLabels();
    if (cesiumMeta) {
      cesiumMeta.textContent = 'Showing a general Utah 3D scouting view. Select a hunt to fly to that unit.';
    }
    return;
  }

  const center = getCesiumSelectedCenter(hunt);
  const centerLat = center?.lat ?? null;
  const centerLng = center?.lng ?? null;

  if (!Number.isFinite(centerLat) || !Number.isFinite(centerLng)) {
    if (cesiumMeta) {
      cesiumMeta.textContent = `Cesium 3D could not find a reliable center for ${getUnitName(hunt) || getHuntTitle(hunt)}.`;
    }
    return;
  }

  cesiumSelectionEntity = cesiumViewer.entities.add({
    position: C.Cartesian3.fromDegrees(centerLng, centerLat, 0),
    point: {
      pixelSize: 12,
      color: C.Color.fromCssColorString('#c96b33'),
      outlineColor: C.Color.fromCssColorString('#fff6ed'),
      outlineWidth: 2
    },
    label: {
      text: getUnitName(hunt) || getHuntTitle(hunt) || 'Selected Hunt',
      font: '600 14px Georgia, serif',
      fillColor: C.Color.fromCssColorString('#2f1f12'),
      outlineColor: C.Color.WHITE,
      outlineWidth: 3,
      style: C.LabelStyle.FILL_AND_OUTLINE,
      verticalOrigin: C.VerticalOrigin.TOP,
      pixelOffset: new C.Cartesian2(0, 16),
      disableDepthTestDistance: Number.POSITIVE_INFINITY
    }
  });

  cesiumViewer.flyTo(cesiumSelectionEntity, {
    duration: 1.6,
    offset: new C.HeadingPitchRange(0, C.Math.toRadians(cesiumTilted ? -28 : -55), cesiumTerrainEnabled ? 180000 : 300000)
  });

  if (cesiumMeta) {
    cesiumMeta.textContent = `Showing a 3D scouting view for ${getUnitName(hunt) || getHuntTitle(hunt)}. This panel uses free imagery and follows the selected hunt.`;
  }

  void syncCesiumBoundaryOutline(hunt, requestId);
}

function setHtml(targets, html) {
  targets.filter(Boolean).forEach(el => {
    el.innerHTML = html;
  });
}

function toggleEmbeddedPanel(buttonEl, frameEl) {
  const shell = frameEl?.closest('.google-shell');
  if (!shell || !buttonEl) return;
  shell.classList.toggle('expanded');
  buttonEl.textContent = shell.classList.contains('expanded') ? 'Collapse Panel' : 'Expand Panel';
}

function setAboutModalOpen(isOpen) {
  if (!aboutModal) return;
  aboutModal.classList.toggle('is-open', isOpen);
  aboutModal.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
  document.body.style.overflow = isOpen ? 'hidden' : '';
}

function setText(targets, value) {
  targets.filter(Boolean).forEach(el => {
    el.textContent = value;
  });
}

function attachHuntResultsInteraction(container) {
  if (!container) return;
  container.addEventListener('click', e => {
    const target = e.target;
    if (!(target instanceof HTMLElement)) return;

    const actionEl = target.closest('[data-action]');
    if (actionEl) {
      const action = actionEl.getAttribute('data-action');
      if (action === 'select-hunt') {
        const code = actionEl.getAttribute('data-hunt-code');
        if (code) selectHuntByCode(code);
      }
    if (action === 'show-more-hunts') {
      huntResultsLimit += 100;
      renderHuntResults();
    }
      return;
    }

    const card = target.closest('.result-card');
    if (!card) return;
    const button = card.querySelector('[data-hunt-code]');
    const code = button?.getAttribute('data-hunt-code');
    if (code) selectHuntByCode(code);
  });
}

function getUsfsLabel(properties, feature = null) {
  const p = properties || {};
  const label = firstNonEmpty(
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

  const normalized = label
    .replace(/^Manti-La Sal National Forest$/i, 'Manti LaSal USFS')
    .replace(/^Fishlake National Forest$/i, 'Fishlake USFS')
    .replace(/^Dixie National Forest$/i, 'Dixie USFS')
    .replace(/^Ashley National Forest$/i, 'Ashley USFS')
    .replace(/^Uinta-Wasatch-Cache National Forest$/i, 'Uintah USFS')
    .replace(/ National Forest$/i, ' USFS')
    .trim();

  if (normalized !== 'Manti LaSal USFS' || !feature?.geometry) return normalized;

  if (pointInGeometry({ lat: 39.28, lng: -111.33 }, feature.geometry)) return 'Manti LaSal USFS';
  if (pointInGeometry({ lat: 38.58, lng: -109.23 }, feature.geometry)) return 'LaSals USFS';
  if (pointInGeometry({ lat: 38.02, lng: -109.35 }, feature.geometry)) return 'Manti LaSal USFS';
  return normalized;
}

function normalizeBlmDistrictName(value) {
  const raw = safe(value).trim();
  if (!raw) return '';
  const normalized = raw
    .replace(/\s+field\s+office$/i, '')
    .replace(/\s+district\s+office$/i, ' District')
    .replace(/\s+office$/i, '')
    .replace(/\s+/g, ' ')
    .trim();

  const slug = slugify(normalized);
  const exactMap = {
    richfield: 'Color Country District',
    fillmore: 'West Desert District',
    'salt-lake': 'West Desert District',
    'salt-lake-city': 'West Desert District',
    cedarcity: 'Color Country District',
    'cedar-city': 'Color Country District',
    'st-george': 'Color Country District',
    'green-river': 'Green River District',
    vernal: 'Green River District',
    price: 'Green River District',
    moab: 'Canyon Country District',
    monticello: 'Canyon Country District',
    kanab: 'Paria River District',
    'grand-staircase-kanab': 'Paria River District',
    'grand-staircase': 'Paria River District',
    'west-desert-district': 'West Desert District',
    'green-river-district': 'Green River District',
    'color-country-district': 'Color Country District',
    'paria-river-district': 'Paria River District',
    'canyon-country-district': 'Canyon Country District'
  };

  return exactMap[slug] || normalized;
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

  const districtName = normalizeBlmDistrictName(label);
  if (!districtName) return '';
  if (/ BLM$/i.test(districtName)) return districtName;
  return `${districtName} BLM`;
}

function getRingArea(ring = []) {
  let area = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = Number(ring[i]?.[1]);
    const yi = Number(ring[i]?.[0]);
    const xj = Number(ring[j]?.[1]);
    const yj = Number(ring[j]?.[0]);
    if (![xi, yi, xj, yj].every(Number.isFinite)) continue;
    area += (xj * yi) - (xi * yj);
  }
  return Math.abs(area / 2);
}

function getRingCentroid(ring = []) {
  if (!Array.isArray(ring) || ring.length < 3) return null;

  let areaAccumulator = 0;
  let lngAccumulator = 0;
  let latAccumulator = 0;

  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const lng1 = Number(ring[j]?.[1]);
    const lat1 = Number(ring[j]?.[0]);
    const lng2 = Number(ring[i]?.[1]);
    const lat2 = Number(ring[i]?.[0]);
    if (![lng1, lat1, lng2, lat2].every(Number.isFinite)) continue;
    const cross = (lng1 * lat2) - (lng2 * lat1);
    areaAccumulator += cross;
    lngAccumulator += (lng1 + lng2) * cross;
    latAccumulator += (lat1 + lat2) * cross;
  }

  if (Math.abs(areaAccumulator) < 1e-9) return null;

  return [
    latAccumulator / (3 * areaAccumulator),
    lngAccumulator / (3 * areaAccumulator)
  ];
}

function getRepresentativePolygonRing(geometry) {
  if (!geometry) return null;
  const { type, coordinates, rings } = geometry;
  if (type === 'Polygon' && Array.isArray(coordinates?.[0])) {
    return coordinates[0];
  }
  if (type === 'MultiPolygon' && Array.isArray(coordinates)) {
    let bestRing = null;
    let bestArea = -Infinity;
    coordinates.forEach(poly => {
      const ring = poly?.[0];
      const area = getRingArea(ring);
      if (area > bestArea) {
        bestArea = area;
        bestRing = ring;
      }
    });
    return bestRing;
  }
  if (Array.isArray(rings?.[0])) {
    let bestRing = null;
    let bestArea = -Infinity;
    rings.forEach(ring => {
      const area = getRingArea(ring);
      if (area > bestArea) {
        bestArea = area;
        bestRing = ring;
      }
    });
    return bestRing;
  }
  return null;
}

function getFeatureBoundsCenter(feature) {
  const geometry = feature?.geometry;
  if (!geometry) return null;
  const bounds = {
    minLat: Infinity,
    maxLat: -Infinity,
    minLng: Infinity,
    maxLng: -Infinity
  };

  if (Array.isArray(geometry.coordinates)) {
    extendBoundsFromCoordinates(bounds, geometry.coordinates);
  } else if (Array.isArray(geometry.rings)) {
    extendBoundsFromCoordinates(bounds, geometry.rings);
  } else if (Array.isArray(geometry.paths)) {
    extendBoundsFromCoordinates(bounds, geometry.paths);
  }

  if (![bounds.minLat, bounds.maxLat, bounds.minLng, bounds.maxLng].every(Number.isFinite)) {
    return null;
  }

  const boundsCenter = [(bounds.minLat + bounds.maxLat) / 2, (bounds.minLng + bounds.maxLng) / 2];
  if (pointInGeometry({ lat: boundsCenter[0], lng: boundsCenter[1] }, geometry)) {
    return boundsCenter;
  }

  const ring = getRepresentativePolygonRing(geometry);
  const centroid = getRingCentroid(ring);
  if (centroid && pointInGeometry({ lat: centroid[0], lng: centroid[1] }, geometry)) {
    return centroid;
  }

  if (Array.isArray(ring) && Array.isArray(ring[0]) && ring[0].length >= 2) {
    return [Number(ring[0][0]), Number(ring[0][1])];
  }

  return boundsCenter;
}

function getFeatureMarkerKey(feature, fallbackLabel = '') {
  const props = feature?.properties || feature?.attributes || {};
  return firstNonEmpty(
    props.OBJECTID,
    props.OBJECTID_1,
    props.ADMU_ID,
    props.GLOBALID,
    props.FID,
    fallbackLabel
  ).toString();
}

const FEDERAL_BADGE_ANCHORS = {
  'Ashley USFS': [
    [40.55, -109.86]
  ],
  'Dixie USFS': [
    [37.69, -112.86]
  ],
  'Fishlake USFS': [
    [38.44, -112.00]
  ],
  'Manti LaSal USFS': [
    [39.34, -111.22],
    [37.75, -109.56]
  ],
  'LaSals USFS': [
    [38.66, -108.93]
  ],
  'Uintah USFS': [
    [40.10, -111.54]
  ],
  'Wasatch USFS': [
    [40.56, -111.06]
  ],
  'Cache USFS': [
    [41.68, -111.57]
  ],
  'West Desert District BLM': [
    [40.58, -113.62]
  ],
  'Green River District BLM': [
    [39.70, -109.74]
  ],
  'Color Country District BLM': [
    [38.92, -113.42]
  ],
  'Paria River District BLM': [
    [37.15, -111.89]
  ],
  'Canyon Country District BLM': [
    [38.66, -109.78]
  ]
};

function getPreferredFederalBadgeCenter(label, feature, labelUsage) {
  const candidates = FEDERAL_BADGE_ANCHORS[safe(label).trim()] || [];
  if (!candidates.length) return null;

  const usedIndexes = labelUsage.get(label) || new Set();
  for (let i = 0; i < candidates.length; i++) {
    if (usedIndexes.has(i)) continue;
    const [lat, lng] = candidates[i];
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    usedIndexes.add(i);
    labelUsage.set(label, usedIndexes);
    return [lat, lng];
  }

  for (let i = 0; i < candidates.length; i++) {
    const [lat, lng] = candidates[i];
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    return [lat, lng];
  }

  return null;
}

function createFederalBadgeIcon(iconUrl, label) {
  const zoom = map?.getZoom?.() ?? 6;
  const showLabel = zoom >= 9;
  const iconSize = showLabel ? [132, 86] : [44, 44];
  const iconAnchor = showLabel ? [66, 43] : [22, 22];
  const safeLabel = escapeHtml(label || '');
  const safeIconUrl = escapeHtml(iconUrl || '');
  return L.divIcon({
    className: 'federal-badge-marker',
    iconSize,
    iconAnchor,
    html: `
      <div class="federal-badge-shell">
        <img src="${safeIconUrl}" alt="${safeLabel}" class="federal-badge-logo">
        ${showLabel ? `<div class="federal-badge-name">${safeLabel}</div>` : ''}
      </div>
    `
  });
}

function getRenderedLayerCenter(layer, feature) {
  if (layer && typeof layer.getBounds === 'function') {
    try {
      const bounds = layer.getBounds();
      if (bounds && typeof bounds.getCenter === 'function') {
        const center = bounds.getCenter();
        if (Number.isFinite(center?.lat) && Number.isFinite(center?.lng)) {
          return [center.lat, center.lng];
        }
      }
    } catch (e) {}
  }

  if (layer && typeof layer.getLatLng === 'function') {
    try {
      const center = layer.getLatLng();
      if (Number.isFinite(center?.lat) && Number.isFinite(center?.lng)) {
        return [center.lat, center.lng];
      }
    } catch (e) {}
  }

  return getFeatureBoundsCenter(feature);
}

function clearFederalBadgeMarkers(badgeLayer, badgeMap) {
  if (badgeLayer) {
    try { badgeLayer.clearLayers(); } catch (e) {}
  }
  badgeMap.clear();
}

function rebuildFederalBadgesFromFeatureLayer(featureLayer, badgeLayer, badgeMap, labelGetter, iconUrl) {
  if (!featureLayer || !badgeLayer) return;
  clearFederalBadgeMarkers(badgeLayer, badgeMap);
  const labelUsage = new Map();

  const renderLayerBadge = layer => {
    const feature = layer?.feature;
    if (!feature) return;
    const label = labelGetter(feature?.properties || feature?.attributes || {}, feature);
    addFederalBadgeMarker(feature, label, badgeLayer, badgeMap, iconUrl, layer, labelUsage);
  };

  if (typeof featureLayer.eachFeature === 'function') {
    featureLayer.eachFeature(renderLayerBadge);
  }

  if (!badgeMap.size && typeof featureLayer.eachLayer === 'function') {
    featureLayer.eachLayer(renderLayerBadge);
  }

  if (!badgeMap.size && featureLayer._layers) {
    Object.values(featureLayer._layers).forEach(renderLayerBadge);
  }
}

function addFederalBadgeMarker(feature, label, badgeLayer, badgeMap, iconUrl, renderedLayer = null, labelUsage = new Map()) {
  if (!badgeLayer || !feature) return;
  const key = getFeatureMarkerKey(feature, label);
  if (!key) return;

  if (label === 'Manti LaSal USFS') {
    const anchors = FEDERAL_BADGE_ANCHORS[label] || [];
    anchors.forEach((center, index) => {
      if (!Array.isArray(center) || center.length < 2) return;
      const markerKey = `${key}:manti-${index}`;
      if (badgeMap.has(markerKey)) return;
      const marker = L.marker(center, {
        icon: createFederalBadgeIcon(iconUrl, label),
        pane: 'federalBadgePane',
        interactive: false,
        keyboard: false,
        zIndexOffset: -50
      });
      badgeMap.set(markerKey, marker);
      badgeLayer.addLayer(marker);
    });
    return;
  }

  if (label === 'Uintah USFS') {
    const primaryAnchors = FEDERAL_BADGE_ANCHORS[label] || [];
    const wasatchAnchors = FEDERAL_BADGE_ANCHORS['Wasatch USFS'] || [];
    const cacheAnchors = FEDERAL_BADGE_ANCHORS['Cache USFS'] || [];
    [...primaryAnchors.map((center, index) => ({ center, markerLabel: label, markerKey: `${key}:uwc-${index}` })),
     ...wasatchAnchors.map((center, index) => ({ center, markerLabel: 'Wasatch USFS', markerKey: `${key}:wasatch-${index}` })),
     ...cacheAnchors.map((center, index) => ({ center, markerLabel: 'Cache USFS', markerKey: `${key}:cache-${index}` }))]
      .forEach(({ center, markerLabel, markerKey }) => {
        if (!Array.isArray(center) || center.length < 2) return;
        if (badgeMap.has(markerKey)) return;
        const marker = L.marker(center, {
          icon: createFederalBadgeIcon(iconUrl, markerLabel),
          pane: 'federalBadgePane',
          interactive: false,
          keyboard: false,
          zIndexOffset: -50
        });
        badgeMap.set(markerKey, marker);
        badgeLayer.addLayer(marker);
      });
    return;
  }

  if (label === 'Cache USFS') {
    const anchors = FEDERAL_BADGE_ANCHORS[label] || [];
    anchors.forEach((center, index) => {
      if (!Array.isArray(center) || center.length < 2) return;
      const markerKey = `${key}:cache-dup-${index}`;
      if (badgeMap.has(markerKey)) return;
      const marker = L.marker(center, {
        icon: createFederalBadgeIcon(iconUrl, label),
        pane: 'federalBadgePane',
        interactive: false,
        keyboard: false,
        zIndexOffset: -50
      });
      badgeMap.set(markerKey, marker);
      badgeLayer.addLayer(marker);
    });
    return;
  }

  if (badgeMap.has(key)) return;
  const center = getPreferredFederalBadgeCenter(label, feature, labelUsage);
  if (!center) return;
  const marker = L.marker(center, {
    icon: createFederalBadgeIcon(iconUrl, label),
    pane: 'federalBadgePane',
    interactive: false,
    keyboard: false,
    zIndexOffset: -50
  });
  badgeMap.set(key, marker);
  badgeLayer.addLayer(marker);
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
  const raw = firstNonEmpty(h.sex, h.Sex, h.SEX);
  if (safe(raw).trim().toLowerCase() !== 'buck/bull') return raw;

  const speciesList = getSpeciesList(h).map(s => s.toLowerCase());
  if (speciesList.includes('elk')) return 'Bull';
  if (speciesList.includes('mule deer') || speciesList.includes('deer')) return 'Buck';
  return 'Buck/Bull';
}

function getWeapon(h) {
  return firstNonEmpty(h.weapon, h.Weapon, h.WEAPON);
}

function getHuntType(h) {
  return firstNonEmpty(h.huntType, h.HuntType, h.hunt_type, h.type, h.Type);
}

function getHuntCategory(h) {
  const tagged = firstNonEmpty(h.huntCategory, h.HuntCategory, h.hunt_category);
  if (tagged) return tagged;

  const species = getSpeciesList(h).map(s => s.toLowerCase());
  const title = getHuntTitle(h).toLowerCase();
  const huntType = getHuntType(h).toLowerCase();

  if (title.includes('antlerless elk-control') || title.includes('antlerless elk control')) return 'Antlerless';
  if (title.includes('antlerless')) return 'Antlerless';
  if (title.includes('private-lands-only') || title.includes('private lands only')) return 'Private Land Only';
  if (title.includes('extended archery')) return 'Extended Archery';
  if (title.includes('spike')) return 'Spike Only';
  if (huntType.includes('youth') || title.includes('youth')) return 'Youth';
  if (huntType.includes('mature bull')) return 'Mature Bull';
  if (species.includes('elk') && huntType.includes('general')) return 'General Bull';
  return getHuntType(h) || '';
}

function getDates(h) {
  return firstNonEmpty(h.seasonLabel, h.seasonDates, h.dates, h.Dates);
}

function getRegion(h) {
  return firstNonEmpty(h.region, h.Region, h.REGION);
}

function isProvisionalRecord(h) {
  const guide = firstNonEmpty(h.sourceGuide, h.SourceGuide, h.source_guide);
  return guide.toLowerCase().includes('used provisionally');
}

function getProvisionalNote(h) {
  return isProvisionalRecord(h) ? 'Provisional: based on 2025 field regulations until 2026 field regs are published.' : '';
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

  return;
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
  return v.includes(s) || s.includes(v);
}

function getHuntBoundaryStyle() {
  const zoom = map.getZoom();
  if (zoom <= 6) {
    return { color: '#3653b3', weight: 1.2, fillColor: '#d6def7', fillOpacity: 0.12 };
  }

  if (zoom <= 8) {
    return { color: '#3653b3', weight: 2, fillColor: '#d6def7', fillOpacity: 0.18 };
  }

  return { color: '#3653b3', weight: 3.2, fillColor: '#d6def7', fillOpacity: 0.28 };
}

function updateMapAppearance() {
  if (!mapWrapEl || !basemapSelect) return;
  const isTerrainLike = ['usgs', 'outdoor', 'topo'].includes(basemapSelect.value);
  mapWrapEl.classList.toggle('terrain-boost', isTerrainLike);
  if (dwrShell) dwrShell.classList.remove('terrain-sync');
  if (cesiumShell) cesiumShell.classList.toggle('terrain-sync', isTerrainLike);
}

const map = L.map('map', { zoomControl: true, doubleClickZoom: false }).setView([39.3, -111.7], 6);

map.createPane('blmPane');
map.getPane('blmPane').style.zIndex = 430;
map.createPane('usfsPane');
map.getPane('usfsPane').style.zIndex = 440;
map.createPane('huntPane');
map.getPane('huntPane').style.zIndex = 445;
map.createPane('selectedHuntPane');
map.getPane('selectedHuntPane').style.zIndex = 450;
map.createPane('federalBadgePane');
map.getPane('federalBadgePane').style.zIndex = 447;

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
  natgeo: L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}',
    { maxZoom: 16, attribution: 'Tiles &copy; Esri' }
  ),
  outdoor: L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    { maxZoom: 19, attribution: 'Tiles &copy; Esri' }
  ),
  usgs: L.tileLayer(
    'https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer/tile/{z}/{y}/{x}',
    { maxZoom: 16, attribution: 'Tiles &copy; USGS' }
  ),
  positron: L.layerGroup([
    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png',
      {
        maxZoom: 20,
        subdomains: 'abcd',
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
      }
    ),
    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png',
      {
        maxZoom: 20,
        subdomains: 'abcd',
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
      }
    )
  ]),
  light: L.layerGroup([
    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
      { maxZoom: 16, attribution: 'Tiles &copy; Esri' }
    ),
    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
      { maxZoom: 16, attribution: 'Labels &copy; Esri' }
    )
  ]),
  sat: L.layerGroup([
    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      { maxZoom: 19, attribution: 'Tiles &copy; Esri' }
    ),
    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places_Alternate/MapServer/tile/{z}/{y}/{x}',
      { maxZoom: 19, attribution: 'Labels &copy; Esri' }
    )
  ])
};

basemaps.usgs.addTo(map);

const unitCenterLayer = L.layerGroup().addTo(map);
const outfitterLayer = L.layerGroup().addTo(map);
const sitlaLayer = L.layerGroup().addTo(map);
const stateLayer = L.layerGroup().addTo(map);
const privateLayer = L.layerGroup().addTo(map);
const utahOutlineLayer = L.layerGroup().addTo(map);

let liveHuntUnitsLayer = null;
let selectedBoundaryLayer = null;
let usfsDistrictLayer = null;
let blmDistrictLayer = null;
let usfsBadgeLayer = null;
let blmBadgeLayer = null;
let liveLayerSource = 'none';
let huntBoundaryData = null;
let huntResultsLimit = 100;
let liveFilterToken = 0;
let boundaryZoomToken = 0;
let boundaryHoverTooltip = null;
let suppressNextMapClickInfo = false;
let usfsBadgeMarkers = new Map();
let blmBadgeMarkers = new Map();

async function loadHuntData() {
  const merged = [];
  const loadedLabels = [];

  for (const source of HUNT_DATA_SOURCES) {
    let data = null;
    let lastStatus = 'not-started';

    for (const url of source.candidates) {
      const res = await fetch(url, { cache: 'no-store' });
      lastStatus = res.status;
      if (!res.ok) continue;
      data = await res.json();
      break;
    }

    if (!data) {
      if (source.required) {
        throw new Error(`Failed to load ${source.label} hunt data: ${lastStatus}`);
      }
      continue;
    }

    let records = [];
    if (Array.isArray(data)) records = data;
    else if (Array.isArray(data.records)) records = data.records;
    else if (Array.isArray(data.data)) records = data.data;

    if (!records.length) {
      if (source.required) {
        throw new Error(`No hunt records found in ${source.label} JSON.`);
      }
      continue;
    }

    merged.push(...records);
    loadedLabels.push(source.label);
  }

  const deduped = [];
  const seenKeys = new Set();
  merged.forEach(record => {
    const code = safe(getHuntCode(record)).trim();
    const unit = safe(getUnitCode(record) || getUnitName(record)).trim();
    const weapon = safe(getWeapon(record)).trim();
    const dates = safe(getDates(record)).trim();
    const boundaryId = safe(firstNonEmpty(record.boundaryId, record.BoundaryID, record.boundaryID)).trim();
    const key = [code, unit, weapon, dates, boundaryId].join('||') || JSON.stringify(record);
    if (seenKeys.has(key)) return;
    seenKeys.add(key);
    deduped.push(record);
  });

  huntData = deduped;

  if (!huntData.length) throw new Error('No hunt records found in any JSON source.');
  console.log('Loaded hunt datasets:', loadedLabels.join(', '));
}

async function loadOutfittersData() {
  for (const url of OUTFITTERS_DATA_SOURCES) {
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) continue;
      const data = await res.json();
      if (!Array.isArray(data)) continue;
      outfitters = data.map(o => ({
        listingName: safe(o.listingName || o.name).trim(),
        listingType: safe(o.listingType || 'Outfitter').trim(),
        certLevel: safe(o.certLevel).trim(),
        verificationStatus: safe(o.verificationStatus || 'Vetted').trim(),
        website: safe(o.website).trim(),
        logoUrl: normalizeUrl(o.logoUrl || o.logo || o.imageUrl),
        phone: splitPhoneList(o.phone),
        email: splitEmailList(o.email),
        region: safe(o.region).trim(),
        city: safe(o.city).trim(),
        ownerName: splitOwnerList(o.ownerName),
        speciesServed: Array.isArray(o.speciesServed) ? o.speciesServed.join(', ') : safe(o.speciesServed || o.species).trim(),
        unitsServed: Array.isArray(o.unitsServed) ? o.unitsServed.join(', ') : safe(o.unitsServed).trim(),
        blmDistricts: listify(o.blmDistricts).map(normalizeBlmDistrictName).filter(Boolean).join(', '),
        usfsForests: Array.isArray(o.usfsForests) ? o.usfsForests.join(', ') : safe(o.usfsForests || o.forestDistricts).trim()
      })).filter(o => o.listingName);
      console.log('Loaded outfitter dataset:', url);
      return;
    } catch (error) {
      console.warn('Outfitter data load attempt failed:', url, error);
    }
  }
}

async function loadBoundaryData() {
  const res = await fetch(LOCAL_HUNT_BOUNDARIES_PATH, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to load boundary data: ${res.status}`);

  const data = await res.json();
  if (!Array.isArray(data?.features) || !data.features.length) {
    throw new Error('No hunt boundary features found in local boundary file.');
  }

  huntBoundaryData = data;
}

function setBuildMarker() {
  if (!selectedHunt) {
    setSelectedDisplay(
      'No hunt selected',
      `Choose filters or click a hunt unit to load hunt and outfitter results. (${APP_BUILD})`
    );
  }
}

function forcePageTop() {
  try {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  } catch {}

  window.scrollTo({ top: 0, left: 0, behavior: 'auto' });

  const scrollingElement = document.scrollingElement || document.documentElement || document.body;
  if (scrollingElement) scrollingElement.scrollTop = 0;
  if (document.documentElement) document.documentElement.scrollTop = 0;
  if (document.body) document.body.scrollTop = 0;
}

function hasActiveHuntFilters() {
  return Boolean(
    safe(searchInput?.value).trim() ||
    safe(speciesFilter?.value) !== 'All Species' ||
    safe(sexFilter?.value) !== 'All' ||
    safe(weaponFilter?.value) !== 'All' ||
    safe(huntTypeFilter?.value) !== 'All' ||
    safe(huntCategoryFilter?.value) !== 'All' ||
    safe(unitFilter?.value).trim()
  );
}

function normalizeSpeciesLabel(value) {
  const text = safe(value).trim();
  if (!text) return '';
  if (text.toLowerCase() === 'mule deer') return 'Deer';
  return text;
}

function getSpeciesDisplayList(h) {
  return Array.from(new Set(getSpeciesList(h).map(normalizeSpeciesLabel).filter(Boolean)));
}

function getSpeciesDisplay(h) {
  return getSpeciesDisplayList(h)[0] || normalizeSpeciesLabel(getSpeciesRaw(h));
}

function getNormalizedSex(valueOrHunt) {
  const raw = typeof valueOrHunt === 'string' ? safe(valueOrHunt).trim() : getSex(valueOrHunt);
  const hunt = typeof valueOrHunt === 'object' ? valueOrHunt : null;
  const title = hunt ? getHuntTitle(hunt).toLowerCase() : '';
  const species = hunt ? getSpeciesDisplay(hunt).toLowerCase() : '';

  if (title.includes("hunter's choice") || title.includes('hunters choice') || title.includes('either sex')) return 'Either Sex';
  if (raw === 'Either') return 'Either Sex';
  if (raw === 'Buck/Bull') {
    if (species.includes('deer') || species.includes('pronghorn')) return 'Buck';
    if (species.includes('elk') || species.includes('moose')) return 'Bull';
    return 'Either Sex';
  }
  if (raw === 'Doe' || raw === 'Cow' || raw === 'Ewe') return 'Antlerless';
  return raw;
}

function getFilteredHunts() {
  return getMatrixFilteredHunts();
}

function isSelectedHuntInCurrentMatrix(hunt = selectedHunt) {
  if (!hunt) return false;
  const selectedCode = safe(getHuntCode(hunt)).trim().toLowerCase();
  if (!selectedCode) return false;
  return getFilteredHunts().some(item => safe(getHuntCode(item)).trim().toLowerCase() === selectedCode);
}

function getMatrixFilteredHunts(excludeKey = '') {
  const search = safe(searchInput?.value).trim().toLowerCase();
  const species = safe(speciesFilter?.value || 'All Species');
  const sex = safe(sexFilter?.value || 'All');
  const weapon = safe(weaponFilter?.value || 'All');
  const huntType = safe(huntTypeFilter?.value || 'All');
  const huntCategory = safe(huntCategoryFilter?.value || 'All');
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
      excludeKey === 'species' ||
      species === 'All Species' ||
      getSpeciesDisplayList(h).map(x => x.toLowerCase()).includes(species.toLowerCase());

    const sexOk = excludeKey === 'sex' || matchesFilter(sex, getNormalizedSex(h));
    const weaponOk = excludeKey === 'weapon' || matchesFilter(weapon, getWeapon(h));
    const huntTypeOk = excludeKey === 'huntType' || matchesFilter(huntType, getHuntType(h));
    const huntCategoryOk = excludeKey === 'huntCategory' || matchesFilter(huntCategory, getHuntCategory(h));

    const unitOk =
      excludeKey === 'unit' ||
      !unit ||
      getUnitValue(h) === unit ||
      getUnitName(h) === unit ||
      getUnitCode(h) === unit;

    return searchOk && speciesOk && sexOk && weaponOk && huntTypeOk && huntCategoryOk && unitOk;
  });
}

function populateSpecies() {
  if (!speciesFilter) return;
  const previous = speciesFilter.value || 'All Species';
  const set = new Set(['All Species']);

  getMatrixFilteredHunts('species').forEach(h => {
    getSpeciesDisplayList(h).forEach(s => set.add(s));
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

function populateSexes() {
  if (!sexFilter) return;
  const previous = sexFilter.value || 'All';
  const values = Array.from(new Set(
    getMatrixFilteredHunts('sex')
      .map(h => safe(getNormalizedSex(h)).trim())
      .filter(Boolean)
  ));
  sortWithPreferredOrder(values, SEX_ORDER);

  const options = ['All', ...values];
  sexFilter.innerHTML = options
    .map(value => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`)
    .join('');

  sexFilter.value = options.includes(previous) ? previous : 'All';
}

function sortWithPreferredOrder(values, preferredOrder) {
  const rank = new Map(preferredOrder.map((value, index) => [value, index]));
  return values.sort((a, b) => {
    const aRank = rank.has(a) ? rank.get(a) : Number.MAX_SAFE_INTEGER;
    const bRank = rank.has(b) ? rank.get(b) : Number.MAX_SAFE_INTEGER;
    if (aRank !== bRank) return aRank - bRank;
    return a.localeCompare(b);
  });
}

function getHuntTypeLabel(value) {
  return value === 'General' ? 'General Season' : value;
}

function populateHuntTypes() {
  if (!huntTypeFilter) return;
  const previous = huntTypeFilter.value || 'All';
  const values = Array.from(new Set(
    getMatrixFilteredHunts('huntType').map(h => safe(getHuntType(h)).trim()).filter(Boolean)
  ));
  sortWithPreferredOrder(values, HUNT_TYPE_ORDER);

  huntTypeFilter.innerHTML = [
    '<option value="All">All</option>',
    ...values.map(value => `<option value="${escapeHtml(value)}">${escapeHtml(getHuntTypeLabel(value))}</option>`)
  ].join('');

  huntTypeFilter.value = values.includes(previous) ? previous : 'All';
}

function populateHuntCategories() {
  if (!huntCategoryFilter) return;
  const previous = huntCategoryFilter.value || 'All';
  const values = Array.from(new Set(
    getMatrixFilteredHunts('huntCategory').map(h => safe(getHuntCategory(h)).trim()).filter(Boolean)
  ));
  sortWithPreferredOrder(values, HUNT_CATEGORY_ORDER);

  huntCategoryFilter.innerHTML = [
    '<option value="All">All</option>',
    ...values.map(value => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`)
  ].join('');

  huntCategoryFilter.value = values.includes(previous) ? previous : 'All';
}

function populateWeapons() {
  if (!weaponFilter) return;
  const previous = weaponFilter.value || 'All';
  const values = Array.from(new Set(
    getMatrixFilteredHunts('weapon').map(h => safe(getWeapon(h)).trim()).filter(Boolean)
  ));
  sortWithPreferredOrder(values, WEAPON_ORDER);

  const options = ['All', ...values];
  weaponFilter.innerHTML = options
    .map(value => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`)
    .join('');

  weaponFilter.value = options.includes(previous) ? previous : 'All';
}

function refreshSelectionMatrix() {
  populateSpecies();
  populateSexes();
  populateHuntTypes();
  populateHuntCategories();
  populateWeapons();
  populateUnits();
}

function populateUnits() {
  if (!unitFilter) return;
  const previous = unitFilter.value || '';
  const units = new Map();

  getMatrixFilteredHunts('unit').forEach(h => {
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
  if (!selectedHunt || !isSelectedHuntInCurrentMatrix(selectedHunt)) return [];

  const codeSlug = slugify(getUnitCode(selectedHunt));
  const nameSlug = slugify(getUnitName(selectedHunt));
  const valueSlug = slugify(getUnitValue(selectedHunt));
  const huntSpecies = [
    slugify(getSpeciesRaw(selectedHunt)),
    slugify(getSpeciesDisplay(selectedHunt))
  ].filter(Boolean);

  return outfitters
    .filter(o => {
      const served = slugList(o.unitsServed);
      return served.includes(codeSlug) || served.includes(nameSlug) || served.includes(valueSlug);
    })
    .filter(o => {
      const servedSpecies = slugList(o.speciesServed || o.species);
      if (!servedSpecies.length || !huntSpecies.length) return true;
      return servedSpecies.some(species => huntSpecies.includes(species));
    });
}

function getBoundaryFeatureAttributes(feature) {
  return feature?.attributes || feature?.properties || {};
}

function getBoundaryFeatureId(feature) {
  const attrs = getBoundaryFeatureAttributes(feature);
  return safe(firstNonEmpty(attrs.BoundaryID, attrs.BOUNDARYID, attrs.boundaryId)).trim();
}

function getBoundaryFeatureName(feature) {
  const attrs = getBoundaryFeatureAttributes(feature);
  return safe(firstNonEmpty(attrs.Boundary_Name, attrs.BOUNDARY_NAME, attrs.boundaryName)).trim();
}

function getBoundarySourceFeatures() {
  return Array.isArray(huntBoundaryData?.features) ? huntBoundaryData.features : [];
}

function extendBoundsFromCoordinates(bounds, coordinates) {
  if (!Array.isArray(coordinates)) return;

  if (coordinates.length >= 2 && Number.isFinite(Number(coordinates[0])) && Number.isFinite(Number(coordinates[1]))) {
    const lng = Number(coordinates[0]);
    const lat = Number(coordinates[1]);
    if (isLikelyUtahCoordinate(lat, lng)) {
      bounds.minLat = Math.min(bounds.minLat, lat);
      bounds.maxLat = Math.max(bounds.maxLat, lat);
      bounds.minLng = Math.min(bounds.minLng, lng);
      bounds.maxLng = Math.max(bounds.maxLng, lng);
    }
    return;
  }

  coordinates.forEach(child => extendBoundsFromCoordinates(bounds, child));
}

function getBoundaryGeometryCenter(feature) {
  const geometry = feature?.geometry;
  const bounds = {
    minLat: Infinity,
    maxLat: -Infinity,
    minLng: Infinity,
    maxLng: -Infinity
  };

  if (!geometry) return null;

  if (Array.isArray(geometry.coordinates)) {
    extendBoundsFromCoordinates(bounds, geometry.coordinates);
  } else if (Array.isArray(geometry.rings)) {
    extendBoundsFromCoordinates(bounds, geometry.rings);
  } else if (Array.isArray(geometry.paths)) {
    extendBoundsFromCoordinates(bounds, geometry.paths);
  }

  if (![bounds.minLat, bounds.maxLat, bounds.minLng, bounds.maxLng].every(Number.isFinite)) {
    return null;
  }

  return {
    lat: (bounds.minLat + bounds.maxLat) / 2,
    lng: (bounds.minLng + bounds.maxLng) / 2
  };
}

function getSelectedBoundaryCenter(hunt = selectedHunt) {
  if (!hunt) return null;

  const matchSets = buildBoundaryMatchSets(hunt);
  const features = getBoundarySourceFeatures().filter(feature => {
    const featureId = getBoundaryFeatureId(feature);
    const featureName = getBoundaryFeatureName(feature).trim().toLowerCase();
    return matchSets.names.has(featureName) || (featureId && matchSets.ids.has(featureId));
  });

  if (!features.length) return null;

  const aggregateBounds = {
    minLat: Infinity,
    maxLat: -Infinity,
    minLng: Infinity,
    maxLng: -Infinity
  };

  features.forEach(feature => {
    const geometry = feature?.geometry;
    if (!geometry) return;
    if (Array.isArray(geometry.coordinates)) {
      extendBoundsFromCoordinates(aggregateBounds, geometry.coordinates);
    } else if (Array.isArray(geometry.rings)) {
      extendBoundsFromCoordinates(aggregateBounds, geometry.rings);
    } else if (Array.isArray(geometry.paths)) {
      extendBoundsFromCoordinates(aggregateBounds, geometry.paths);
    }
  });

  if (![aggregateBounds.minLat, aggregateBounds.maxLat, aggregateBounds.minLng, aggregateBounds.maxLng].every(Number.isFinite)) {
    return null;
  }

  return {
    lat: (aggregateBounds.minLat + aggregateBounds.maxLat) / 2,
    lng: (aggregateBounds.minLng + aggregateBounds.maxLng) / 2
  };
}

function canSelectBoundaryByDoubleClick() {
  return !toggleUSFS?.checked && !toggleBLM?.checked;
}

function findMatchingHuntsForBoundaryFeature(feature) {
  const featureId = getBoundaryFeatureId(feature);
  const featureName = getBoundaryFeatureName(feature).trim().toLowerCase();
  const candidates = getFilteredHunts();

  return candidates.filter(hunt => {
    const matchSets = buildBoundaryMatchSets(hunt);
    return matchSets.names.has(featureName) || (featureId && matchSets.ids.has(featureId));
  });
}

function buildBoundaryChoicePopup(feature, matches) {
  const boundaryName = escapeHtml(safe(getBoundaryFeatureName(feature)).trim() || 'Selected Hunt Unit');
  const rows = matches
    .slice()
    .sort((a, b) => {
      const aCode = safe(getHuntCode(a));
      const bCode = safe(getHuntCode(b));
      return aCode.localeCompare(bCode);
    })
    .map(hunt => {
      const code = safe(getHuntCode(hunt));
      const title = escapeHtml(getHuntTitle(hunt) || code || boundaryName);
      const weapon = escapeHtml(getWeapon(hunt) || 'N/A');
      const season = escapeHtml(getEffectiveSeasonText(hunt) || 'N/A');
      const codeEscaped = escapeHtml(code);
      return `
        <tr>
          <td class="hunt-choice-code">${codeEscaped}</td>
          <td class="hunt-choice-title">${title}</td>
          <td class="hunt-choice-weapon">${weapon}</td>
          <td class="hunt-choice-season">${season}</td>
          <td class="hunt-choice-action">
            <button type="button" class="hunt-choice-select" data-hunt-code="${codeEscaped}">Select</button>
          </td>
        </tr>
      `;
    })
    .join('');

  return `
    <div class="hunt-choice-popup">
      <div class="hunt-choice-kicker">${boundaryName}</div>
      <div class="hunt-choice-heading">Matching Hunts</div>
      <div class="hunt-choice-table-wrap">
        <table class="hunt-choice-table">
          <thead>
            <tr>
              <th>Ref</th>
              <th>Hunt</th>
              <th>Weapon</th>
              <th>Dates</th>
              <th></th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  `;
}

function wireBoundaryChoicePopup(popup) {
  const popupEl = popup?.getElement?.();
  if (!popupEl) return;
  const selectionMode = safe(popup?.options?.selectionMode).trim() || 'initial';
  popupEl.querySelectorAll('.hunt-choice-select').forEach(btn => {
    btn.addEventListener('click', evt => {
      evt.preventDefault();
      evt.stopPropagation();
      const code = safe(btn.getAttribute('data-hunt-code')).trim();
      if (!code) return;
      selectHuntByCode(code, { selectionMode });
      try { map.closePopup(); } catch (e) {}
    });
  });
}

function isLandOverlayPopupOpen() {
  return false;
}

function openBoundaryChoicePopup(layer, feature, evt, options = {}) {
  const matches = findMatchingHuntsForBoundaryFeature(feature);
  if (!matches.length) return;

  L.DomEvent.stopPropagation(evt);
  if (evt.originalEvent) {
    L.DomEvent.preventDefault(evt.originalEvent);
    L.DomEvent.stopPropagation(evt.originalEvent);
  }

  suppressNextMapClickInfo = true;
  const popupLatLng = options.centered && map && typeof map.getCenter === 'function'
    ? map.getCenter()
    : evt.latlng;
  const popup = L.popup({
    className: 'hunt-choice-popup-wrap',
    maxWidth: 560,
    minWidth: 420,
    autoPan: true,
    keepInView: true,
    selectionMode: options.selectionMode || 'initial'
  })
    .setLatLng(popupLatLng)
    .setContent(buildBoundaryChoicePopup(feature, matches));
  popup.openOn(map);
  setTimeout(() => wireBoundaryChoicePopup(popup), 0);
}

function panToSelectedBoundary() {
  if (!selectedHunt || !map) return;
  const boundaryCenter = getSelectedBoundaryCenter(selectedHunt);
  const huntLat = getHuntLat(selectedHunt);
  const huntLng = getHuntLng(selectedHunt);
  const trustedCenter = getTrustedUnitCenter(selectedHunt);
  const center =
    (boundaryCenter && [boundaryCenter.lat, boundaryCenter.lng]) ||
    (Number.isFinite(huntLat) && Number.isFinite(huntLng) ? [huntLat, huntLng] : null) ||
    trustedCenter ||
    null;
  if (!center) return;
  map.panTo(center, {
    animate: true,
    duration: 1.2,
    easeLinearity: 0.22
  });
}

function pointInRing(latlng, ring) {
  const x = Number(latlng.lng);
  const y = Number(latlng.lat);
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = Number(ring[i][1]);
    const yi = Number(ring[i][0]);
    const xj = Number(ring[j][1]);
    const yj = Number(ring[j][0]);
    const intersects = ((yi > y) !== (yj > y)) &&
      (x < ((xj - xi) * (y - yi)) / ((yj - yi) || 1e-12) + xi);
    if (intersects) inside = !inside;
  }
  return inside;
}

function pointInPolygon(latlng, polygon) {
  if (!Array.isArray(polygon) || !polygon.length) return false;
  if (!pointInRing(latlng, polygon[0] || [])) return false;
  for (let i = 1; i < polygon.length; i++) {
    if (pointInRing(latlng, polygon[i] || [])) return false;
  }
  return true;
}

function pointInGeometry(latlng, geometry) {
  const type = geometry?.type;
  const coords = geometry?.coordinates;
  if (type === 'Polygon' && coords) return pointInPolygon(latlng, coords);
  if (type === 'MultiPolygon' && coords) return coords.some(poly => pointInPolygon(latlng, poly));
  if (Array.isArray(geometry?.rings)) return pointInPolygon(latlng, geometry.rings);
  return false;
}

function findBoundaryLayerAtLatLng(latlng) {
  if (!liveHuntUnitsLayer || !latlng) return null;
  let found = null;
  liveHuntUnitsLayer.eachLayer(layer => {
    if (found) return;
    const feature = layer?.feature;
    if (feature?.geometry && pointInGeometry(latlng, feature.geometry)) {
      found = layer;
    }
  });
  return found;
}

function hideBoundaryHoverTooltip() {
  if (!boundaryHoverTooltip) return;
  try { map.removeLayer(boundaryHoverTooltip); } catch (e) {}
  boundaryHoverTooltip = null;
}

function updateBoundaryHoverTooltip(latlng) {
  if (!map || !latlng || !liveHuntUnitsLayer || !map.hasLayer(liveHuntUnitsLayer)) {
    hideBoundaryHoverTooltip();
    return;
  }

  const layer = findBoundaryLayerAtLatLng(latlng);
  const boundaryLabel = safe(getBoundaryFeatureName(layer?.feature)).trim();
  if (!boundaryLabel) {
    hideBoundaryHoverTooltip();
    return;
  }

  if (!boundaryHoverTooltip) {
    boundaryHoverTooltip = L.marker(latlng, {
      pane: 'markerPane',
      interactive: false,
      keyboard: false,
      zIndexOffset: 900,
      icon: L.divIcon({
        className: 'hunt-hover-label-marker',
        iconSize: [1, 1],
        iconAnchor: [0, 14],
        html: `<span class="hunt-hover-label-text">${escapeHtml(boundaryLabel)}</span>`
      })
    });
  } else if (boundaryHoverTooltip.setIcon) {
    boundaryHoverTooltip.setIcon(L.divIcon({
      className: 'hunt-hover-label-marker',
      iconSize: [1, 1],
      iconAnchor: [0, 14],
      html: `<span class="hunt-hover-label-text">${escapeHtml(boundaryLabel)}</span>`
    }));
  }

  boundaryHoverTooltip.setLatLng(latlng);
  if (!map.hasLayer(boundaryHoverTooltip)) {
    boundaryHoverTooltip.addTo(map);
  }
}

function isBoundaryFeatureSelected(feature) {
  if (!selectedHunt || !feature) return false;
  const matchSets = buildBoundaryMatchSets(selectedHunt);
  const featureId = getBoundaryFeatureId(feature);
  const featureName = safe(getBoundaryFeatureName(feature)).trim().toLowerCase();
  return matchSets.names.has(featureName) || (featureId && matchSets.ids.has(featureId));
}

function getBoundaryFeatureStyle(feature) {
  if (isBoundaryFeatureSelected(feature)) {
    return {
      color: '#6d3bbd',
      weight: 2.4,
      fillColor: '#b89af4',
      fillOpacity: 0.18,
      opacity: 1
    };
  }
  return getHuntBoundaryStyle();
}

function updateInteractivePanePriority() {
  if (!map || !map.getPane) return;
  const huntPane = map.getPane('huntPane');
  if (huntPane) {
    huntPane.style.zIndex = '445';
  }
}

function renderLiveHuntUnitsFeatures(features) {
  if (!window.L) return;

  if (liveHuntUnitsLayer) {
    try { map.removeLayer(liveHuntUnitsLayer); } catch (e) {}
  }

  if (!features.length) {
    liveHuntUnitsLayer = null;
    return;
  }

  liveHuntUnitsLayer = L.geoJSON(
    { type: 'FeatureCollection', features },
    {
      pane: 'huntPane',
      style: feature => getBoundaryFeatureStyle(feature),
      onEachFeature: (feature, layer) => {
        layer.on('click', evt => {
          if (selectedHunt) return;
          openBoundaryChoicePopup(layer, feature, evt, { centered: true, selectionMode: 'initial' });
        });
      }
    }
  );

  liveHuntUnitsLayer.eachLayer(layer => {
    if (isBoundaryFeatureSelected(layer?.feature) && typeof layer.bringToFront === 'function') {
      layer.bringToFront();
    }
  });

  liveLayerSource = 'local-boundary-file';
  if (toggleLiveUnits?.checked) liveHuntUnitsLayer.addTo(map);
  updateInteractivePanePriority();
}

function shouldRenderAllBoundaries() {
  return false;
}

function buildLiveHuntUnitsLayer() {
  const features = getBoundarySourceFeatures();
  if (!features.length) return;
  renderLiveHuntUnitsFeatures([]);
}

function buildUSFSLayer() {
  if (!window.L || !window.L.esri) return;
  if (usfsDistrictLayer) {
    try { map.removeLayer(usfsDistrictLayer); } catch (e) {}
  }
  if (usfsBadgeLayer) {
    try { map.removeLayer(usfsBadgeLayer); } catch (e) {}
  }
  usfsBadgeLayer = L.layerGroup();
  clearFederalBadgeMarkers(usfsBadgeLayer, usfsBadgeMarkers);

  usfsDistrictLayer = L.esri.featureLayer({
    url: 'https://apps.fs.usda.gov/arcx/rest/services/EDW/EDW_ForestSystemBoundaries_01/MapServer/0',
    pane: 'usfsPane',
    where: "FORESTNAME IN ('Ashley National Forest','Dixie National Forest','Fishlake National Forest','Manti-La Sal National Forest','Uinta-Wasatch-Cache National Forest')",
    style: () => ({ color: '#476f2d', weight: 2.5, fillOpacity: 0.02 })
  });

  usfsDistrictLayer.on('load', () => {
    rebuildFederalBadgesFromFeatureLayer(usfsDistrictLayer, usfsBadgeLayer, usfsBadgeMarkers, getUsfsLabel, USFS_BADGE_URL);
  });

  updateContextualLandOverlayVisibility();
}

function buildBLMLayer() {
  if (!window.L || !window.L.esri) return;
  if (blmDistrictLayer) {
    try { map.removeLayer(blmDistrictLayer); } catch (e) {}
  }
  if (blmBadgeLayer) {
    try { map.removeLayer(blmBadgeLayer); } catch (e) {}
  }
  blmBadgeLayer = L.layerGroup();
  clearFederalBadgeMarkers(blmBadgeLayer, blmBadgeMarkers);

  blmDistrictLayer = L.esri.featureLayer({
    url: 'https://gis.blm.gov/utarcgis/rest/services/AdminBoundaries/BLM_UT_ADMU/FeatureServer/0',
    pane: 'blmPane',
    style: () => ({ color: '#b9722f', weight: 2.3, fillOpacity: 0.02 })
  });

  blmDistrictLayer.on('load', () => {
    rebuildFederalBadgesFromFeatureLayer(blmDistrictLayer, blmBadgeLayer, blmBadgeMarkers, getBlmLabel, BLM_BADGE_URL);
  });

  updateContextualLandOverlayVisibility();
}

function applyLiveBoundaryWhere(whereClause) {
  if (!toggleLiveUnits?.checked) return;

  if (selectedHunt) return;
  if (!hasActiveHuntFilters()) {
    renderLiveHuntUnitsFeatures([]);
    return;
  }

  renderLiveHuntUnitsFeatures(getFilteredBoundaryFeatures());
}

function shouldShowContextualLandOverlay() {
  if (!map) return false;
  return !!selectedHunt || hasActiveHuntFilters();
}

function updateContextualLandOverlayVisibility() {
  const show = shouldShowContextualLandOverlay();
  const showFederalBadges = !!map && (map.getZoom?.() ?? 0) >= FEDERAL_BADGE_MIN_ZOOM;

  if (usfsDistrictLayer) {
    if (toggleUSFS?.checked && show) {
      if (!map.hasLayer(usfsDistrictLayer)) usfsDistrictLayer.addTo(map);
      if (showFederalBadges) {
        rebuildFederalBadgesFromFeatureLayer(usfsDistrictLayer, usfsBadgeLayer, usfsBadgeMarkers, getUsfsLabel, USFS_BADGE_URL);
        setTimeout(() => rebuildFederalBadgesFromFeatureLayer(usfsDistrictLayer, usfsBadgeLayer, usfsBadgeMarkers, getUsfsLabel, USFS_BADGE_URL), 250);
        if (!map.hasLayer(usfsBadgeLayer)) usfsBadgeLayer.addTo(map);
      } else if (usfsBadgeLayer && map.hasLayer(usfsBadgeLayer)) {
        map.removeLayer(usfsBadgeLayer);
      }
    } else if (map.hasLayer(usfsDistrictLayer)) {
      map.removeLayer(usfsDistrictLayer);
      if (usfsBadgeLayer && map.hasLayer(usfsBadgeLayer)) map.removeLayer(usfsBadgeLayer);
    }
  }

  if (blmDistrictLayer) {
    if (toggleBLM?.checked && show) {
      if (!map.hasLayer(blmDistrictLayer)) blmDistrictLayer.addTo(map);
      if (showFederalBadges) {
        rebuildFederalBadgesFromFeatureLayer(blmDistrictLayer, blmBadgeLayer, blmBadgeMarkers, getBlmLabel, BLM_BADGE_URL);
        setTimeout(() => rebuildFederalBadgesFromFeatureLayer(blmDistrictLayer, blmBadgeLayer, blmBadgeMarkers, getBlmLabel, BLM_BADGE_URL), 250);
        if (!map.hasLayer(blmBadgeLayer)) blmBadgeLayer.addTo(map);
      } else if (blmBadgeLayer && map.hasLayer(blmBadgeLayer)) {
        map.removeLayer(blmBadgeLayer);
      }
    } else if (map.hasLayer(blmDistrictLayer)) {
      map.removeLayer(blmDistrictLayer);
      if (blmBadgeLayer && map.hasLayer(blmBadgeLayer)) map.removeLayer(blmBadgeLayer);
    }
  }
}

function clearSelectedBoundaryLayer() {
  if (!selectedBoundaryLayer) return;
  try { map.removeLayer(selectedBoundaryLayer); } catch (e) {}
  selectedBoundaryLayer = null;
}

async function renderSelectedBoundaryOnly(whereClause) {
  clearSelectedBoundaryLayer();
  return true;
}

function renderUtahOutline() {
  utahOutlineLayer.clearLayers();

  const utahBounds = [
    [37.0, -114.05],
    [42.0, -114.05],
    [42.0, -111.05],
    [41.0, -111.05],
    [41.0, -109.04],
    [37.0, -109.04],
    [37.0, -114.05]
  ];

  L.polygon(utahBounds, {
    color: '#a36a2f',
    weight: 2,
    fill: false,
    opacity: 0.85
  }).addTo(utahOutlineLayer);
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
  const huntCode = safe(getHuntCode(hunt)).trim();
  const names = new Set();
  const ids = new Set();

  const overrideNames = HUNT_BOUNDARY_NAME_OVERRIDES[huntCode] || [];
  overrideNames.forEach(name => names.add(name));

  getBoundaryNameCandidates(hunt).forEach(name => names.add(name));

  if (huntCode) {
    try {
      const url =
        `${DWR_HUNT_INFO_TABLE}?` +
        `where=${encodeURIComponent(`HUNT_NUMBER='${huntCode.replace(/'/g, "''")}'`)}` +
        '&outFields=BOUNDARY_NAME,BOUNDARYID' +
        '&returnGeometry=false' +
        '&f=json';

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Hunt info table query failed: ${response.status}`);
      }

      const payload = await response.json();
      const features = Array.isArray(payload?.features) ? payload.features : [];

      features.forEach(feature => {
        const attrs = feature?.attributes || {};
        const boundaryName = safe(attrs.BOUNDARY_NAME).trim();
        const boundaryId = safe(attrs.BOUNDARYID).trim();
        if (boundaryName) names.add(boundaryName);
        if (boundaryId) ids.add(boundaryId);
      });
    } catch (err) {
      console.warn('Hunt info table lookup failed, using local boundary name matching only.', err);
    }
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
    const localFeatures = getSelectedBoundaryFeaturesForHunt(selectedHunt);
    if (Array.isArray(localFeatures) && localFeatures.length) {
      const tempLayer = L.geoJSON(localFeatures);
      const localBounds = tempLayer.getBounds();
      if (localBounds && localBounds.isValid()) {
        const looserBounds = localBounds.pad(0.16);
        const mapWidth = map.getSize ? map.getSize().x : window.innerWidth;
        const isDesktopLayout = mapWidth >= 1100;
        const paddingTopLeft = isDesktopLayout ? [260, 70] : [12, 12];
        const paddingBottomRight = isDesktopLayout ? [360, 170] : [12, 12];

        if (typeof map.flyToBounds === 'function') {
          map.flyToBounds(looserBounds.isValid() ? looserBounds : localBounds, {
            paddingTopLeft,
            paddingBottomRight,
            maxZoom: 8,
            duration: 2.8,
            easeLinearity: 0.18
          });
        } else {
          map.fitBounds(looserBounds.isValid() ? looserBounds : localBounds, {
            paddingTopLeft,
            paddingBottomRight,
            maxZoom: 8
          });
        }
        return;
      }
    }

    const huntCode = getHuntCode(selectedHunt);
    if (!huntCode) {
      map.setView([39.3, -111.7], 7);
      return;
    }

    const { names, ids } = await queryBoundaryNamesAndIds(selectedHunt);
    if (token !== boundaryZoomToken) return;

    const where = buildBoundaryFilterSql(names, ids);
    console.log('selected hunt', getHuntCode(selectedHunt), Array.from(names), Array.from(ids), where);
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

    const bounds = [
      [ymin, xmin],
      [ymax, xmax]
    ];
    const mapWidth = map.getSize ? map.getSize().x : window.innerWidth;
    const isDesktopLayout = mapWidth >= 1100;
    const paddingTopLeft = isDesktopLayout ? [260, 70] : [12, 12];
    const paddingBottomRight = isDesktopLayout ? [360, 170] : [12, 12];

    if (typeof map.flyToBounds === 'function') {
      map.flyToBounds(bounds, {
        paddingTopLeft,
        paddingBottomRight,
        maxZoom: 8,
        duration: 2.8,
        easeLinearity: 0.18
      });
    } else {
      map.fitBounds(bounds, {
        paddingTopLeft,
        paddingBottomRight,
        maxZoom: 8
      });
    }
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

function buildBoundaryMatchSets(hunt) {
  const names = new Set();
  const ids = new Set();

  const huntCode = safe(getHuntCode(hunt)).trim();
  const overrideNames = HUNT_BOUNDARY_NAME_OVERRIDES[huntCode] || [];
  overrideNames.forEach(name => names.add(name.trim().toLowerCase()));

  getBoundaryNameCandidates(hunt).forEach(name => names.add(safe(name).trim().toLowerCase()));

  getBoundarySourceFeatures().forEach(feature => {
    const featureId = getBoundaryFeatureId(feature);
    const featureName = getBoundaryFeatureName(feature).toLowerCase();
    if (overrideNames.some(name => safe(name).trim().toLowerCase() === featureName)) {
      if (featureId) ids.add(featureId);
    }
  });

  return { names, ids };
}

function filterBoundaryFeatures(names, ids) {
  const nameSet = new Set(Array.from(names).map(name => safe(name).trim().toLowerCase()));
  const idSet = new Set(Array.from(ids).map(id => safe(id).trim()));

  return getBoundarySourceFeatures().filter(feature => {
    const featureName = getBoundaryFeatureName(feature).toLowerCase();
    const featureId = getBoundaryFeatureId(feature);
    return nameSet.has(featureName) || idSet.has(featureId);
  });
}

function getFilteredBoundaryFeatures() {
  const mergedNames = new Set();
  const mergedIds = new Set();

  getFilteredHunts().forEach(hunt => {
    const matchSets = buildBoundaryMatchSets(hunt);
    matchSets.names.forEach(name => mergedNames.add(name));
    matchSets.ids.forEach(id => mergedIds.add(id));
  });

  if (!mergedNames.size && !mergedIds.size) return [];
  return filterBoundaryFeatures(mergedNames, mergedIds);
}

async function refreshLiveBoundaryFilter() {
  const token = ++liveFilterToken;

  if (!toggleLiveUnits?.checked) {
    clearSelectedBoundaryLayer();
    if (liveHuntUnitsLayer && map.hasLayer(liveHuntUnitsLayer)) {
      map.removeLayer(liveHuntUnitsLayer);
    }
    return;
  }

  if (!liveHuntUnitsLayer) buildLiveHuntUnitsLayer();
  if (liveHuntUnitsLayer && !map.hasLayer(liveHuntUnitsLayer)) {
    liveHuntUnitsLayer.addTo(map);
  }

  if (!selectedHunt) {
    clearSelectedBoundaryLayer();
    applyLiveBoundaryWhere('1=1');
    return;
  }

  try {
    const remote = await queryBoundaryNamesAndIds(selectedHunt);
    if (token !== liveFilterToken) return;

    const filtered = getFilteredBoundaryFeatures();
    renderLiveHuntUnitsFeatures(filtered);
    await renderSelectedBoundaryOnly();
  } catch (err) {
    console.error('Boundary filter failed:', err);
    renderLiveHuntUnitsFeatures(getFilteredBoundaryFeatures());
    await renderSelectedBoundaryOnly();
  }
}
  
function renderOwnershipPlaceholders() {
  sitlaLayer.clearLayers();
  stateLayer.clearLayers();
  privateLayer.clearLayers();

  if (toggleSITLA?.checked) {
    L.circleMarker([39.05, -111.9], { radius: 7, color: '#4f9d62', fillColor: '#4f9d62', fillOpacity: 0.35, weight: 2 })
      .addTo(sitlaLayer)
      .bindPopup('<b>SITLA</b><br>U.O.G.A. reference layer for trust lands.');
  }
  if (toggleState?.checked) {
    L.circleMarker([40.1, -111.9], { radius: 7, color: '#2b8f9a', fillColor: '#2b8f9a', fillOpacity: 0.35, weight: 2 })
      .addTo(stateLayer)
      .bindPopup('<b>State Lands</b><br>U.O.G.A. reference layer for state-managed land context.');
  }
  if (togglePrivate?.checked) {
    L.circleMarker([38.9, -111.2], { radius: 7, color: '#9a3e3e', fillColor: '#9a3e3e', fillOpacity: 0.35, weight: 2 })
      .addTo(privateLayer)
      .bindPopup('<b>Private Lands</b><br>U.O.G.A. reference layer for private-land awareness.');
  }
}

function renderUnitCenters() {
  unitCenterLayer.clearLayers();
  return;
}

function renderHuntResults() {
  if (!huntResultsEl && !huntResultsMobileEl) return;
  const selectedCode = selectedHunt ? getHuntCode(selectedHunt) : '';
  const filtered = getFilteredHunts().filter(h => {
    if (!selectedCode) return true;
    return getHuntCode(h) !== selectedCode;
  });
  const total = filtered.length;
  const shown = Math.min(huntResultsLimit, total);

  setText([huntCountEl, huntCountMobileEl], String(total));

  if (!total) {
    setHtml([huntResultsEl, huntResultsMobileEl], '<div class="empty">No hunts match the current filters.</div>');
    return;
  }

  const html = filtered.slice(0, shown).map(h => {
    const code = getHuntCode(h);
    const title = getHuntTitle(h) || getUnitName(h) || code || 'Untitled Hunt';
    const unitName = getUnitName(h) || getUnitValue(h) || 'N/A';
    return `
      <div class="result-card">
        <h3>${escapeHtml(title)}</h3>
        <div>${escapeHtml(unitName)}</div>
        <div>${escapeHtml(code)}</div>
        <div>${escapeHtml(getNormalizedSex(h) || 'N/A')}</div>
        <div>${escapeHtml(getSpeciesDisplay(h) || 'N/A')}</div>
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

  setHtml(
    [huntResultsEl, huntResultsMobileEl],
    `${html}<div class="result-meta-row">Showing ${shown} of ${total} matching hunts.</div>${more}`
  );
}

function renderAreaInfo(remoteInfo = null) {
  if (!areaInfoMapEl && !areaInfoMobileEl) return;

  if (!selectedHunt) {
    setHtml([areaInfoMapEl, areaInfoMobileEl], 'Click a hunt unit or select one from the filter.');
    return;
  }

  const officialNote = getProvisionalNote(selectedHunt);
  const seasonText = getEffectiveSeasonText(selectedHunt, remoteInfo);
  const huntCode = escapeHtml(getHuntCode(selectedHunt) || '');
  const species = escapeHtml(getSpeciesDisplay(selectedHunt) || 'N/A');
  const sex = escapeHtml(getNormalizedSex(selectedHunt) || 'N/A');
  const weapon = escapeHtml(getWeapon(selectedHunt) || 'N/A');
  const huntType = escapeHtml(getHuntTypeLabel(getHuntType(selectedHunt)) || 'N/A');
  const seasonEscaped = escapeHtml(seasonText || 'N/A');

  setHtml([areaInfoMapEl, areaInfoMobileEl], `
    <div class="hunt-official-card">
      <div class="hunt-official-shell">
        <div class="hunt-official-main">
          <div class="hunt-official-grid">
            <div><strong>Hunt Number:</strong><br>${huntCode || 'N/A'}</div>
            <div><strong>Species:</strong><br>${species}</div>
            <div><strong>Sex:</strong><br>${sex}</div>
            <div><strong>Hunt Type:</strong><br>${huntType}</div>
          </div>
          <div class="hunt-official-bar">Weapon Type</div>
          <div class="hunt-official-block">${weapon}</div>
          <div class="hunt-official-bar">Season Dates</div>
          <div class="hunt-official-block">${seasonEscaped}</div>
          <div class="hunt-official-bar">Notes</div>
          <div class="hunt-official-block">
            This is the active hunt on your U.O.G.A. planner map. Boundary highlighting and vetted outfitter matching follow this selection.
            ${officialNote ? `<br><br>${escapeHtml(officialNote)}` : ''}
          </div>
        </div>
        <div class="hunt-official-side">
          <div class="hunt-official-actions">
            <button type="button" class="btn-primary" data-action="load-dwr-map-here" data-hunt-code="${huntCode}">Hunt Details</button>
          </div>
        </div>
      </div>
    </div>
  `);
}

function renderOutfitters() {
  outfitterLayer.clearLayers();
  if (toggleOutfitters && !toggleOutfitters.checked) return;
  if (!selectedHunt || !isSelectedHuntInCurrentMatrix(selectedHunt)) return;

  const matches = getSelectedOutfitters();
  const baseLat = getHuntLat(selectedHunt);
  const baseLng = getHuntLng(selectedHunt);
  const trustedCenter = getTrustedUnitCenter(selectedHunt);
  const centerLat = isLikelyUtahCoordinate(baseLat, baseLng) ? baseLat : trustedCenter?.[0];
  const centerLng = isLikelyUtahCoordinate(baseLat, baseLng) ? baseLng : trustedCenter?.[1];
  if (!Number.isFinite(centerLat) || !Number.isFinite(centerLng)) return;

  const cityOffsets = new Map();

  matches.forEach((o, i) => {
    const cityCenter = getOutfitterCityCenter(o);
    const cityKey = safe(o.city).trim().toLowerCase() || `fallback-${i}`;
    const cityIndex = cityOffsets.get(cityKey) || 0;
    cityOffsets.set(cityKey, cityIndex + 1);

    const useLat = cityCenter?.[0] ?? centerLat;
    const useLng = cityCenter?.[1] ?? centerLng;
    const markerLat = useLat + cityIndex * 0.012;
    const markerLng = useLng + cityIndex * 0.012;
    const customIcon = createOutfitterMarkerIcon(o);
    const marker = L.marker([markerLat, markerLng], customIcon ? { icon: customIcon } : undefined).addTo(outfitterLayer);
    marker.bindPopup(`
      <b>${escapeHtml(o.listingName)}</b><br>
      ${escapeHtml(o.certLevel)} | ${escapeHtml(o.verificationStatus)}<br>
      ${escapeHtml(o.city)}<br>
      <a href="${escapeHtml(normalizeUrl(o.website))}" target="_blank" rel="noopener noreferrer">Visit Website</a>
    `);
  });
}

function renderOutfitterResults() {
  if (!resultsEl && !resultsMobileEl) return;

  if (!selectedHunt || !isSelectedHuntInCurrentMatrix(selectedHunt)) {
    setHtml([resultsEl, resultsMobileEl], '<div class="empty">Select a hunt or unit to load outfitter results.</div>');
    return;
  }

  const matches = getSelectedOutfitters();
  if (!matches.length) {
    setHtml(
      [resultsEl, resultsMobileEl],
      `<div class="empty">No outfitters currently loaded for ${escapeHtml(getUnitName(selectedHunt) || getUnitValue(selectedHunt))}.</div>`
    );
    return;
  }

  setHtml([resultsEl, resultsMobileEl], matches.map(o => `
    <div class="result-card">
      <h3>${escapeHtml(o.listingName)}</h3>
      <div class="pill-row">
        <span class="pill cert">${escapeHtml(o.certLevel || 'Member')}</span>
        <span class="pill verified">${escapeHtml(o.verificationStatus || 'Listed')}</span>
      </div>
      <div class="meta">
        <div><strong>City:</strong> ${escapeHtml(o.city)}</div>
        <div><strong>Species:</strong> ${escapeHtml(o.speciesServed || o.species || 'N/A')}</div>
        <div><strong>Phone:</strong> ${escapeHtml(formatPhoneList(o.phone) || 'N/A')}</div>
        <div><strong>Hunt Units:</strong> ${escapeHtml(listify(o.unitsServed).join(', ') || 'N/A')}</div>
        <div><strong>BLM Districts:</strong> ${escapeHtml(listify(o.blmDistricts).join(', ') || 'N/A')}</div>
        <div><strong>USFS Forests:</strong> ${escapeHtml(listify(o.usfsForests || o.forestDistricts).join(', ') || 'N/A')}</div>
      </div>
      <div class="result-actions">
        <a href="${escapeHtml(normalizeUrl(o.website))}" target="_blank" rel="noopener noreferrer">
          <button type="button" class="btn-primary">Visit Website</button>
        </a>
      </div>
    </div>
  `).join(''));
}

function selectUnitByValue(unitValue, options = {}) {
  const hunt = huntData.find(h => {
    return getUnitValue(h) === unitValue || getUnitName(h) === unitValue || getUnitCode(h) === unitValue;
  });

  if (!hunt) return;

  selectedHunt = hunt;
  selectedUnit = unitValue;

  if (unitFilter) unitFilter.value = unitValue;
  setSelectedDisplay(
    getUnitName(hunt) || unitValue,
    [
      getSpeciesDisplay(hunt),
      getUnitName(hunt) || getUnitCode(hunt),
      getRegion(hunt)
    ].filter(Boolean).join(' • '),
    getHuntCode(hunt) || 'Reference'
  );

  renderAreaInfo();
  renderOutfitters();
  renderOutfitterResults();
  renderHuntResults();
  updateCesiumView(hunt);
  updateDwrBoundaryEmbed(hunt);
  refreshLiveBoundaryFilter();
  updateInteractivePanePriority();
  refreshSelectedHuntOfficialInfo(hunt);
}

function selectHuntByCode(huntCode, options = {}) {
  const hunt = huntData.find(h => getHuntCode(h) === huntCode);
  if (!hunt) return;

  selectedHunt = hunt;
  selectedUnit = getUnitValue(hunt);
  setSelectedDisplay(
    getHuntTitle(hunt) || getUnitName(hunt) || huntCode,
    [
      getSpeciesDisplay(hunt),
      getUnitName(hunt) || getUnitCode(hunt),
      getRegion(hunt)
    ].filter(Boolean).join(' • '),
    getHuntCode(hunt) || huntCode || 'Reference'
  );

  renderAreaInfo();
  renderOutfitters();
  renderOutfitterResults();
  renderHuntResults();
  updateCesiumView(hunt);
  updateDwrBoundaryEmbed(hunt);
  refreshLiveBoundaryFilter();
  updateInteractivePanePriority();
  refreshSelectedHuntOfficialInfo(hunt);
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
  if (huntCategoryFilter) huntCategoryFilter.value = 'All';
  if (unitFilter) unitFilter.value = '';

  refreshSelectionMatrix();

  setBuildMarker();

  map.setView([39.3, -111.7], 6);

  renderUnitCenters();
  renderOwnershipPlaceholders();
  renderAreaInfo();
  renderOutfitters();
  renderOutfitterResults();
  renderHuntResults();
  updateCesiumView();
  updateDwrBoundaryEmbed();
  refreshLiveBoundaryFilter();
}

[searchInput, speciesFilter, sexFilter, weaponFilter, huntTypeFilter, huntCategoryFilter].forEach(el => {
  if (!el) return;
  const handler = () => {
    huntResultsLimit = 100;
    refreshSelectionMatrix();
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
      setBuildMarker();
      renderAreaInfo();
      renderOutfitters();
      renderOutfitterResults();
      renderHuntResults();
      updateCesiumView();
      updateDwrBoundaryEmbed();
      refreshLiveBoundaryFilter();
      return;
    }
    selectUnitByValue(unitFilter.value);
  });
}

if (basemapSelect) {
  basemapSelect.value = 'usgs';
  updateMapAppearance();
  basemapSelect.addEventListener('change', () => {
    Object.values(basemaps).forEach(layer => {
      if (map.hasLayer(layer)) map.removeLayer(layer);
    });
    (basemaps[basemapSelect.value] || basemaps.usgs).addTo(map);
    updateMapAppearance();
    updateCesiumView(selectedHunt);

    if (toggleLiveUnits?.checked && !liveHuntUnitsLayer) buildLiveHuntUnitsLayer();
    if (toggleLiveUnits?.checked && liveHuntUnitsLayer) liveHuntUnitsLayer.addTo(map);
    updateContextualLandOverlayVisibility();
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
    updateContextualLandOverlayVisibility();
  });
}

if (toggleBLM) {
  toggleBLM.addEventListener('change', () => {
    if (!blmDistrictLayer) return;
    updateContextualLandOverlayVisibility();
  });
}

[toggleSITLA, toggleState, togglePrivate].forEach(el => {
  if (!el) return;
  el.addEventListener('change', renderOwnershipPlaceholders);
});

if (toggleOutfitters) {
  toggleOutfitters.addEventListener('change', () => {
    renderOutfitters();
    renderOutfitterResults();
  });
}

if (openBoundaryBtn) {
  openBoundaryBtn.addEventListener('click', () => {
    updateDwrBoundaryEmbed(selectedHunt, { scrollIntoView: true });
  });
}

if (openAboutBtn) {
  openAboutBtn.addEventListener('click', () => {
    setAboutModalOpen(true);
  });
}

if (closeAboutBtn) {
  closeAboutBtn.addEventListener('click', () => {
    setAboutModalOpen(false);
  });
}

if (aboutOkBtn) {
  aboutOkBtn.addEventListener('click', () => {
    setAboutModalOpen(false);
    try {
      localStorage.setItem('uogaHuntPlannerInfoSeen', '1');
    } catch (e) {}
  });
}

if (toggleDwrPanelBtn) {
  toggleDwrPanelBtn.addEventListener('click', () => {
    toggleEmbeddedPanel(toggleDwrPanelBtn, dwrBoundaryEmbed);
  });
}

if (toggleCesiumPanelBtn) {
  toggleCesiumPanelBtn.addEventListener('click', () => {
    toggleEmbeddedPanel(toggleCesiumPanelBtn, cesiumContainer);
    if (cesiumViewer) {
      window.setTimeout(() => cesiumViewer.resize(), 200);
    }
  });
}

if (cesiumZoomBtn) {
  cesiumZoomBtn.addEventListener('click', () => {
    zoomCesiumToSelectedHunt();
  });
}

if (cesiumTiltBtn) {
  cesiumTiltBtn.addEventListener('click', () => {
    toggleCesiumTilt();
  });
}

if (cesiumResetBtn) {
  cesiumResetBtn.addEventListener('click', () => {
    resetCesiumView();
  });
}

if (cesiumTerrainBtn) {
  cesiumTerrainBtn.addEventListener('click', async () => {
    await enableCesiumTerrainRelief();
  });
}

if (resetBtn) resetBtn.addEventListener('click', resetPlanner);

if (toggleResultsTrayBtn && resultsTrayEl) {
  toggleResultsTrayBtn.addEventListener('click', () => {
    resultsTrayEl.classList.toggle('collapsed');
    toggleResultsTrayBtn.textContent = resultsTrayEl.classList.contains('collapsed') ? '˄' : '˅';
  });
}

attachHuntResultsInteraction(huntResultsEl);
attachHuntResultsInteraction(huntResultsMobileEl);

document.addEventListener('click', e => {
  const target = e.target;
  if (!(target instanceof HTMLElement)) return;
  if (target === aboutModal) {
    setAboutModalOpen(false);
    return;
  }
  const unitBtn = target.closest('.js-select-unit');
  if (unitBtn) {
    const unitValue = safe(unitBtn.getAttribute('data-unit')).trim();
    if (unitValue) selectUnitByValue(unitValue);
    return;
  }
  const dwrBtn = target.closest('[data-action="load-dwr-map-here"]');
  if (dwrBtn) {
    updateDwrBoundaryEmbed(selectedHunt, { forceFrame: true, scrollIntoView: true });
  }
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && aboutModal?.classList.contains('is-open')) {
    setAboutModalOpen(false);
  }
});

map.on('mousemove', e => {
  updateBoundaryHoverTooltip(e.latlng);
});

map.on('mouseout', () => {
  hideBoundaryHoverTooltip();
});

map.on('dblclick', evt => {
  if (!selectedHunt || isLandOverlayPopupOpen()) return;
  const layer = findBoundaryLayerAtLatLng(evt.latlng);
  if (!layer?.feature) return;
  openBoundaryChoicePopup(layer, layer.feature, evt, { centered: true, selectionMode: 'switch' });
});

map.on('zoomend', () => {
  hideBoundaryHoverTooltip();
  refreshLiveBoundaryFilter();
  updateContextualLandOverlayVisibility();
  if (selectedBoundaryLayer && typeof selectedBoundaryLayer.setStyle === 'function') {
    selectedBoundaryLayer.setStyle({
      color: '#6d3bbd',
      weight: 2.4,
      fillColor: '#b89af4',
      fillOpacity: 0.18,
      opacity: 1
    });
  }
});

(async function init() {
  const loadingOverlay = document.getElementById('loadingOverlay');

  try {
    forcePageTop();

    if (speciesFilter) speciesFilter.innerHTML = '<option value="All Species">Loading...</option>';
    if (unitFilter) unitFilter.innerHTML = '<option value="">Loading...</option>';
    if (toggleUSFS) toggleUSFS.checked = true;
    if (toggleBLM) toggleBLM.checked = true;
    setBuildMarker();

    await loadHuntData();
    await loadOutfittersData();
    await loadBoundaryData();

    refreshSelectionMatrix();

    buildLiveHuntUnitsLayer();
    buildUSFSLayer();
    buildBLMLayer();

    await refreshLiveBoundaryFilter();

    renderUtahOutline();
    renderUnitCenters();
    renderOwnershipPlaceholders();
    renderAreaInfo();
    renderOutfitters();
    renderOutfitterResults();
    renderHuntResults();
    initCesiumViewer();
    updateCesiumView();
    updateDwrBoundaryEmbed();
    
    try {
      if (!localStorage.getItem('uogaHuntPlannerInfoSeen')) {
        setAboutModalOpen(true);
      }
    } catch (e) {
      setAboutModalOpen(true);
    }
    window.setTimeout(() => map.invalidateSize(), 0);
    if (cesiumViewer) {
      window.setTimeout(() => cesiumViewer.resize(), 0);
    }

    // Hide the squirrel cage once everything successfully loads!
    if (loadingOverlay) {
      loadingOverlay.classList.add('hidden');
    }

  } catch (err) {
    console.error('Init failed:', err);

    // Hide the squirrel cage even if it fails, so we can see the error
    if (loadingOverlay) {
      loadingOverlay.classList.add('hidden');
    }

    if (speciesFilter) speciesFilter.innerHTML = '<option value="All Species">Load Failed</option>';
    if (unitFilter) unitFilter.innerHTML = '<option value="">Load Failed</option>';

    setHtml([huntResultsEl, huntResultsMobileEl], `<div class="empty">Failed to load hunt data: ${escapeHtml(err.message || String(err))}</div>`);
    setHtml([resultsEl, resultsMobileEl], `<div class="empty">Initialization error: ${escapeHtml(err.message || String(err))}</div>`);
    setHtml([areaInfoMapEl, areaInfoMobileEl], 'App failed to initialize. Open browser console for details.');
    setBuildMarker();
    window.setTimeout(() => map.invalidateSize(), 0);
  }
  window.addEventListener('load', () => {
    forcePageTop();
    setTimeout(forcePageTop, 0);
    setTimeout(forcePageTop, 150);
  });

  window.addEventListener('pageshow', () => {
    forcePageTop();
    setTimeout(forcePageTop, 0);
    setTimeout(forcePageTop, 150);
  });
})();