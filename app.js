  'function') {
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
