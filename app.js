// create map
const map = L.map('map').setView([39.3, -111.7], 7);

// basemap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap'
}).addTo(map);


// LOAD HUNT DATA
let huntData = [];

fetch("./data/Utah_Hunt_Planner_Master_BuckDeer_Pages_43_53.json")
.then(res => res.json())
.then(data => {
    huntData = data.records;
    console.log("Loaded hunts:", huntData);
});


