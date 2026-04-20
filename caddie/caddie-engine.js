// © 2026 Kevin Mansfield. All rights reserved.
// ── caddie-engine.js ──────────────────────────────────────────────────────
// Pure logic: WELD calculator, mental tally, Tiger 5 mistake tracker.
// Reads from caddie-data.js. No DOM writes.
// ─────────────────────────────────────────────────────────────────────────

// ── WELD STATE & CALC ─────────────────────────────────────────────────────
let windDir = 'head';
let elevDir = 'up';
let lieType  = 'fairway';
let crossDir = 'none'; // 'none' | 'head' | 'tail' — diagonal modifier when windDir === 'cross'

function setWindDir(d)  { windDir  = d; }
function setElevDir(d)  { elevDir  = d; }
function setLie(l)      { lieType  = l; }
function setCrossDir(d) { crossDir = d; }

function calcWeld(rawDist, windSpd, elevFt) {
  if (!rawDist) return null;

  let windAdj = 0, aimNote = '';
  if (windDir === 'head')  windAdj = +windSpd;
  if (windDir === 'tail')  windAdj = -(windSpd / 2);
  if (windDir === 'cross' && windSpd > 0) {
    const lateralMult = crossDir !== 'none' ? 0.75 : 1.0;
    const driftFt     = Math.round(windSpd * lateralMult * rawDist / 100);
    const driftYds    = Math.round(driftFt / 3);
    aimNote = `Aim ${driftFt} ft (≈${driftYds} yds) into wind`;

    // Diagonal: partial distance adjustment for head/tail component
    if (crossDir === 'head') windAdj = +(windSpd * 0.25);
    if (crossDir === 'tail') windAdj = -(windSpd * 0.25 / 2);
  }

  let elevAdj = 0;
  if (elevDir === 'up')   elevAdj = +(elevFt / 3);
  if (elevDir === 'down') elevAdj = -(elevFt / 3);

  const lieAdj    = LIE_ADJ[lieType];
  const playsLike = Math.round(rawDist + windAdj + elevAdj + lieAdj);

  return {
    playsLike,
    aimNote,
    formula: buildFormulaString(rawDist, windAdj, elevAdj, lieAdj, playsLike),
    rows: [
      { key: 'Raw distance',                                        val: rawDist,              adj: 0        },
      { key: `Wind (${windDir}${windSpd ? ' ' + windSpd + 'mph' : ''})`, val: Math.round(windAdj), adj: Math.round(windAdj) },
      { key: `Elevation (${elevDir}${elevFt ? ' ' + elevFt + 'ft' : ''})`, val: Math.round(elevAdj), adj: Math.round(elevAdj) },
      { key: `Lie (${lieType})`,                                    val: lieAdj,               adj: lieAdj   },
    ],
  };
}

function buildFormulaString(raw, wind, elev, lie, result) {
  const parts = [`${raw}`];
  if (wind !== 0) parts.push((wind > 0 ? '+' : '') + Math.round(wind) + ' wind');
  if (elev !== 0) parts.push((elev > 0 ? '+' : '') + Math.round(elev) + ' elev');
  if (lie  !== 0) parts.push((lie  > 0 ? '+' : '') + lie              + ' lie');
  if (parts.length === 1) return ''; // no adjustments — skip formula line
  return parts.join(' ') + ' = ' + result + ' yds';
}

// ── MENTAL STATE & LOGIC ──────────────────────────────────────────────────
const MENTAL_KEY = 'caddie_mental_shots';

let mentalToggles = { calc: null, create: null, execute: null };
let shots = [];

function mentalLoad() {
  try {
    const raw = localStorage.getItem(MENTAL_KEY);
    if (raw) shots = JSON.parse(raw);
  } catch (e) {
    try {
      const raw = sessionStorage.getItem(MENTAL_KEY);
      if (raw) shots = JSON.parse(raw);
    } catch (_) { shots = []; }
  }
}

function mentalSave() {
  const data = JSON.stringify(shots);
  try {
    localStorage.setItem(MENTAL_KEY, data);
  } catch (e) {
    try { sessionStorage.setItem(MENTAL_KEY, data); } catch (_) {}
  }
}

function mentalLog() {
  const { calc, create, execute } = mentalToggles;
  if (calc === null && create === null && execute === null) return false;
  shots.push({ calc, create, execute, ts: Date.now() });
  mentalSave();
  mentalToggles = { calc: null, create: null, execute: null };
  return true;
}

function mentalClear() {
  shots = [];
  mentalToggles = { calc: null, create: null, execute: null };
  mentalSave();
}

function mentalTally() {
  let yes = 0, no = 0, total = 0;
  shots.forEach(s => ['calc','create','execute'].forEach(k => {
    if (s[k] !== null) { total++; if (s[k]) yes++; else no++; }
  }));
  return { yes, no, total, shots: shots.length, pct: total > 0 ? Math.round((yes / total) * 100) : null };
}

// ── TIGER 5 STATE & LOGIC ─────────────────────────────────────────────────
const TIGER5_KEY = 'caddie_tiger5';
const TIGER5_KEYS = ['threeputt', 'doubles', 'penalties', 'wedgebogey', 'missedupdown'];

let tiger5 = { threeputt: 0, doubles: 0, penalties: 0, wedgebogey: 0, missedupdown: 0 };

function tiger5Load() {
  try {
    const raw = localStorage.getItem(TIGER5_KEY);
    if (raw) tiger5 = Object.assign({ threeputt: 0, doubles: 0, penalties: 0, wedgebogey: 0, missedupdown: 0 }, JSON.parse(raw));
  } catch (e) {
    try {
      const raw = sessionStorage.getItem(TIGER5_KEY);
      if (raw) tiger5 = Object.assign({ threeputt: 0, doubles: 0, penalties: 0, wedgebogey: 0, missedupdown: 0 }, JSON.parse(raw));
    } catch (_) {}
  }
}

function tiger5Save() {
  const data = JSON.stringify(tiger5);
  try {
    localStorage.setItem(TIGER5_KEY, data);
  } catch (e) {
    try { sessionStorage.setItem(TIGER5_KEY, data); } catch (_) {}
  }
}

function tiger5Clear() {
  TIGER5_KEYS.forEach(k => { tiger5[k] = 0; });
  tiger5Save();
}

function tiger5Tally() {
  return TIGER5_KEYS.reduce((sum, k) => sum + tiger5[k], 0);
}
