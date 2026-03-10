const map = L.map('map').setView([39.3, -111.7], 7);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap'
}).addTo(map);

let huntData = [];

fetch("./data/Utah_Hunt_Planner_Master_BuckDeer_Pages_43_53.json")
  .then(res => res.json())
  .then(data => {
    huntData = data.records;
    console.log("Loaded hunts:", huntData.length);
  });

// Live Utah hunt-unit layer
const liveHuntUnitsLayer = L.esri.featureLayer({
  url: "https://services.arcgis.com/ZzrwjTRez6FJiOq4/ArcGIS/rest/services/Hunting_Units/FeatureServer/0",
  style: function () {
    return {
      color: "#ffc000",
      weight: 2,
      fillOpacity: 0.08
    };
  }
}).addTo(map);

liveHuntUnitsLayer.bindPopup(function (layer) {
  const p = layer.feature?.properties || {};
  const unitName = p.UNIT_NAME || p.UnitName || p.NAME || "Utah Hunt Unit";
  return `<b>${unitName}</b>`;
});


