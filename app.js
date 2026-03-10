// -----------------------------
// Data stores
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
    unitsServed: 'beaver-east,fishlake',
    forestDistricts: 'Fishlake NF - Richfield; Manti-La Sal NF - Sanpete'
  }
];

// -----------------------------
// DOM refs
// -----------------------------
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

// -----------------------------
// Helpers
// -----------------------------
function safe(str) {
  return String(str ?? '');
}

function normalizeUrl(url) {
  const raw = safe(url).trim();
  if (!raw) return '';
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
  return `https://${raw}`;
}

function formatPhone(phone) {
  const digits = safe(phone).replace(/\D/g, '');
  if (digits.length === 10) {
    return `