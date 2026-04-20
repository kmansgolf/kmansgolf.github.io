// ── caddie-engine.js ──────────────────────────────────────────────────────
// Pure logic: audio engine, cycle scheduler, WELD calculator, mental tally,
// Tiger 5 mistake tracker.
// Reads from caddie-data.js. No direct DOM writes except via callbacks
// passed in from caddie-app.js (onPhase, onCycleEnd).
// ─────────────────────────────────────────────────────────────────────────

// ── TEMPO STATE ───────────────────────────────────────────────────────────
let mode      = 'full';
let presetIdx = 2;       // default: Tour Std
let restGap   = 4.0;     // seconds between cycles

let playing    = false;
let countingIn = false;

let _audioCtx      = null;
let _cycleTimer    = null;
let _countinTimer  = null;
let _countinBackTime = null; // captured at count-in start — never changes mid-count

// ── HELPERS ───────────────────────────────────────────────────────────────
function getRatio()     { return mode === 'full' ? 3 : 2; }
function getTotalTime() { return PRESETS[mode][presetIdx].total; }

function getBackTime() {
  const r = getRatio();
  return getTotalTime() * (r / (r + 1));
}
function getDownTime() {
  const r = getRatio();
  return getTotalTime() * (1 / (r + 1));
}

function getAudioCtx() {
  if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return _audioCtx;
}

// ── AUDIO ─────────────────────────────────────────────────────────────────
// type: 0 = takeaway, 1 = top, 2 = impact
function playTone(type, when) {
  const ctx = getAudioCtx();

  if (mode === 'putt') {
    // Putting: soft sine tones — pendulum feel, no crack
    const puttCfg = {
      0: { freq: 260, freq2: 200, gain: 0.25, attack: 0.005, decay: 0.18 },
      1: { freq: 220, freq2: 180, gain: 0.15, attack: 0.004, decay: 0.12 },
      2: { freq: 300, freq2: 240, gain: 0.28, attack: 0.004, decay: 0.14 },
    };
    const c   = puttCfg[type];
    const osc = ctx.createOscillator();
    const g   = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(c.freq, when);
    osc.frequency.exponentialRampToValueAtTime(c.freq2, when + c.decay);
    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(c.gain, when + c.attack);
    g.gain.exponentialRampToValueAtTime(0.001, when + c.decay);
    osc.connect(g); g.connect(ctx.destination);
    osc.start(when); osc.stop(when + c.decay + 0.02);
    return;
  }

  // Full / Short game: punchy click tones
  const cfg = {
    0: { freq: 180, freq2: 90,  gain: 0.55, attack: 0.002, decay: 0.12, type: 'sine'     },
    1: { freq: 320, freq2: 160, gain: 0.35, attack: 0.001, decay: 0.08, type: 'triangle' },
    2: { freq: 900, freq2: 450, gain: 0.70, attack: 0.001, decay: 0.06, type: 'square'   },
  };
  const c   = cfg[type];
  const osc = ctx.createOscillator();
  const g   = ctx.createGain();
  osc.type = c.type;
  osc.frequency.setValueAtTime(c.freq, when);
  osc.frequency.exponentialRampToValueAtTime(c.freq2, when + c.decay);
  g.gain.setValueAtTime(0, when);
  g.gain.linearRampToValueAtTime(c.gain, when + c.attack);
  g.gain.exponentialRampToValueAtTime(0.001, when + c.decay);
  osc.connect(g); g.connect(ctx.destination);
  osc.start(when); osc.stop(when + c.decay + 0.01);

  // Sub-click body on impact
  if (type === 2) {
    const n  = ctx.createOscillator();
    const ng = ctx.createGain();
    n.type = 'sawtooth';
    n.frequency.setValueAtTime(200, when);
    ng.gain.setValueAtTime(0.28, when);
    ng.gain.exponentialRampToValueAtTime(0.001, when + 0.03);
    n.connect(ng); ng.connect(ctx.destination);
    n.start(when); n.stop(when + 0.04);
  }
}

function playCountinTone(when) {
  const ctx = getAudioCtx();
  const osc = ctx.createOscillator();
  const g   = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(440, when);
  g.gain.setValueAtTime(0, when);
  g.gain.linearRampToValueAtTime(0.12, when + 0.003);
  g.gain.exponentialRampToValueAtTime(0.001, when + 0.07);
  osc.connect(g); g.connect(ctx.destination);
  osc.start(when); osc.stop(when + 0.08);
}

// ── CYCLE SCHEDULER ───────────────────────────────────────────────────────
// setTimeout chain anchored to audioCtx.currentTime — no drift.
// onPhase(phase): 'takeaway' | 'top' | 'impact' | 'rest'  — UI callback
function scheduleCycle(startAt, onPhase) {
  if (!playing) return;

  const ctx      = getAudioCtx();
  const backTime = getBackTime();
  const downTime = getDownTime();
  const total    = getTotalTime();
  const gap      = restGap;

  playTone(0, startAt);               // takeaway
  playTone(1, startAt + backTime);    // top
  playTone(2, startAt + total);       // impact

  const now         = ctx.currentTime;
  const tTakeaway   = Math.max(0, (startAt - now) * 1000);
  const tTop        = Math.max(0, (startAt + backTime - now) * 1000);
  const tImpact     = Math.max(0, (startAt + total - now) * 1000);
  const tRest       = tImpact + 80;
  const tNext       = Math.max(0, (startAt + total + gap - now) * 1000);

  setTimeout(() => { if (playing) onPhase('takeaway'); }, tTakeaway);
  setTimeout(() => { if (playing) onPhase('top');      }, tTop);
  setTimeout(() => { if (playing) onPhase('impact');   }, tImpact);
  setTimeout(() => { if (playing) onPhase('rest');     }, tRest);

  _cycleTimer = setTimeout(() => {
    if (!playing) return;
    scheduleCycle(ctx.currentTime + 0.02, onPhase);
  }, tNext);
}

// ── COUNT-IN ──────────────────────────────────────────────────────────────
// Captures backTime at call time so preset changes mid-count don't glitch.
// onComplete(firstBeatTime): called when count-in finishes.
function startCountin(onComplete) {
  countingIn = true;
  _countinBackTime = getBackTime(); // capture now — immutable for this count-in

  const ctx     = getAudioCtx();
  const countAt = ctx.currentTime + 0.05;
  playCountinTone(countAt);

  const waitMs = (_countinBackTime + 0.05) * 1000;
  _countinTimer = setTimeout(() => {
    if (!countingIn) return;
    countingIn       = false;
    _countinBackTime = null;
    onComplete(countAt + _countinBackTime || countAt + getBackTime());
  }, waitMs);
}

function cancelCountin() {
  clearTimeout(_countinTimer);
  countingIn       = false;
  _countinBackTime = null;
}

function stopCycle() {
  clearTimeout(_cycleTimer);
  playing = false;
}

// ── WELD STATE & CALC ─────────────────────────────────────────────────────
let windDir = 'head';
let elevDir = 'up';
let lieType = 'fairway';

function setWindDir(d) { windDir = d; }
function setElevDir(d) { elevDir = d; }
function setLie(l)     { lieType = l; }

function calcWeld(rawDist, windSpd, elevFt) {
  if (!rawDist) return null;

  let windAdj = 0, aimNote = '';
  if (windDir === 'head')  windAdj = +windSpd;
  if (windDir === 'tail')  windAdj = -(windSpd / 2);
  if (windDir === 'cross' && windSpd > 0) {
    windAdj = 0;
    aimNote = `Aim ${Math.round(windSpd * 0.4)} yds into wind`;
  }

  let elevAdj = 0;
  if (elevDir === 'up')   elevAdj = +(elevFt / 3);
  if (elevDir === 'down') elevAdj = -(elevFt / 3);

  const lieAdj    = LIE_ADJ[lieType];
  const playsLike = Math.round(rawDist + windAdj + elevAdj + lieAdj);

  return {
    playsLike,
    aimNote,
    rows: [
      { key: 'Raw distance',                                        val: rawDist,              adj: 0        },
      { key: `Wind (${windDir}${windSpd ? ' ' + windSpd + 'mph' : ''})`, val: Math.round(windAdj), adj: Math.round(windAdj) },
      { key: `Elevation (${elevDir}${elevFt ? ' ' + elevFt + 'ft' : ''})`, val: Math.round(elevAdj), adj: Math.round(elevAdj) },
      { key: `Lie (${lieType})`,                                    val: lieAdj,               adj: lieAdj   },
    ],
  };
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
