// range-engine.js — Shared audio context, tempo engine, skill profile engine

// ═══════════════════════════════════════════
//  SHARED AUDIO CONTEXT
//  Singleton — tempo uses it today; any future
//  Range audio feature should call getAudioCtx()
//  rather than constructing its own.
// ═══════════════════════════════════════════
let _sharedAudioCtx = null;
function getAudioCtx() {
  if (!_sharedAudioCtx) {
    _sharedAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return _sharedAudioCtx;
}

// ═══════════════════════════════════════════
//  TEMPO STATE  (all vars prefixed t_ to avoid
//  collision with Range session state)
// ═══════════════════════════════════════════
let t_mode      = 'full';
let t_presetIdx = 2;       // default: Tour Std
let t_restGap   = 4.0;     // seconds between cycles

let t_playing    = false;
let t_countingIn = false;

let t_cycleTimer    = null;
let t_countinTimer  = null;
let t_countinBackTime = null; // captured at count-in start — never changes mid-count

// ── Helpers ───────────────────────────────────────────────────────────────
function t_getRatio()     { return t_mode === 'full' ? 3 : 2; }
function t_getTotalTime() { return TEMPO_PRESETS[t_mode][t_presetIdx].total; }
function t_getBackTime()  { const r = t_getRatio(); return t_getTotalTime() * (r / (r + 1)); }
function t_getDownTime()  { const r = t_getRatio(); return t_getTotalTime() * (1 / (r + 1)); }

// ── Audio ──────────────────────────────────────────────────────────────────
// type: 0 = takeaway, 1 = top, 2 = impact
function t_playTone(type, when) {
  const ctx = getAudioCtx();

  if (t_mode === 'putt') {
    // Putting: soft sine tones — pendulum feel, no crack
    const puttCfg = {
      0: { freq: 260, freq2: 200, gain: 0.25, attack: 0.005, decay: 0.18 },
      1: { freq: 220, freq2: 180, gain: 0.15, attack: 0.004, decay: 0.12 },
      2: { freq: 300, freq2: 240, gain: 0.28, attack: 0.004, decay: 0.14 },
    };
    const c = puttCfg[type];
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
  const c = cfg[type];
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

function t_playCountinTone(when) {
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

// ── Cycle scheduler ────────────────────────────────────────────────────────
// setTimeout chain anchored to audioCtx.currentTime — no drift.
// onPhase(phase): 'takeaway'|'top'|'impact'|'rest' — UI callback
function t_scheduleCycle(startAt, onPhase) {
  if (!t_playing) return;

  const ctx      = getAudioCtx();
  const backTime = t_getBackTime();
  const total    = t_getTotalTime();
  const gap      = t_restGap;

  t_playTone(0, startAt);            // takeaway
  t_playTone(1, startAt + backTime); // top
  t_playTone(2, startAt + total);    // impact

  const now       = ctx.currentTime;
  const tTakeaway = Math.max(0, (startAt - now) * 1000);
  const tTop      = Math.max(0, (startAt + backTime - now) * 1000);
  const tImpact   = Math.max(0, (startAt + total - now) * 1000);
  const tRest     = tImpact + 80;
  const tNext     = Math.max(0, (startAt + total + gap - now) * 1000);

  setTimeout(() => { if (t_playing) onPhase('takeaway'); }, tTakeaway);
  setTimeout(() => { if (t_playing) onPhase('top');      }, tTop);
  setTimeout(() => { if (t_playing) onPhase('impact');   }, tImpact);
  setTimeout(() => { if (t_playing) onPhase('rest');     }, tRest);

  t_cycleTimer = setTimeout(() => {
    if (!t_playing) return;
    t_scheduleCycle(ctx.currentTime + 0.02, onPhase);
  }, tNext);
}

// ── Count-in ───────────────────────────────────────────────────────────────
// Captures backTime at call time so preset changes mid-count don't glitch.
function t_startCountin(onComplete) {
  t_countingIn      = true;
  t_countinBackTime = t_getBackTime(); // capture now — immutable for this count-in

  const ctx     = getAudioCtx();
  const countAt = ctx.currentTime + 0.05;
  t_playCountinTone(countAt);

  const waitMs = (t_countinBackTime + 0.05) * 1000;
  t_countinTimer = setTimeout(() => {
    if (!t_countingIn) return;
    t_countingIn      = false;
    const firstBeat   = countAt + (t_countinBackTime || t_getBackTime());
    t_countinBackTime = null;
    onComplete(firstBeat);
  }, waitMs);
}

function t_cancelCountin() {
  clearTimeout(t_countinTimer);
  t_countingIn      = false;
  t_countinBackTime = null;
}

function t_stopCycle() {
  clearTimeout(t_cycleTimer);
  t_playing = false;
}

// ── Public stop-all (called by tab-switch guard) ───────────────────────────
function t_haltAll() {
  if (t_countingIn) t_cancelCountin();
  t_stopCycle();
  t_playing = false;
}

// ═══════════════════════════════════════════
//  SKILL PROFILE ENGINE
// ═══════════════════════════════════════════

const P2_THRESHOLD_PTS = 6; // short=1pt, long=2pts

function calcSessionWeight(sessions) {
  return (sessions || []).reduce((a, s) => a + (s.ver === 'long' ? 2 : 1), 0);
}

// Handicap bracket index: 0=scratch, 1=1-5, 2=6-10, 3=11-15, 4=16-20, 5=21+
function hcpBracket(hcp) {
  if (hcp <= 0) return 0;
  if (hcp <= 3) return 1;
  if (hcp <= 7) return 2;
  if (hcp <= 12) return 3;
  if (hcp <= 17) return 4;
  return 5;
}

// Benchmarks per dimension [scratch,1-5,6-10,11-15,16-20,21+]
const BENCHMARKS = {
  shortPutt:      [0.90, 0.82, 0.74, 0.68, 0.60, 0.52],
  speedControl:   [0.72, 0.62, 0.52, 0.44, 0.36, 0.28],
  breakReading:   [0.68, 0.57, 0.47, 0.40, 0.33, 0.25],
  scoringRange:   [0.45, 0.35, 0.28, 0.22, 0.17, 0.13],
  chipDistance:   [3.8,  3.4,  3.0,  2.6,  2.2,  1.8 ],
  shortGame:      [4.0,  3.6,  3.2,  2.8,  2.4,  2.0 ],
  lieVersatility: [0.85, 0.78, 0.70, 0.60, 0.50, 0.40],
  clubVersatility:[4,    3,    3,    2,    2,    1   ],
  // AimPoint: avg absolute error in % slope (lower = better)
  // Benchmarks = target max avg error per bracket
  apCalibration:  [0.3,  0.4,  0.5,  0.6,  0.7,  0.8 ],
};

// Station→dimension mapping for putting
// Stations 0-11 in PUTTING array
const PUTT_STN_DIM = {
  0: ['shortPutt'],
  1: ['shortPutt','speedControl'],
  2: ['shortPutt','breakReading'],
  3: ['shortPutt','breakReading'],
  4: ['scoringRange'],
  5: ['scoringRange','speedControl'],
  6: ['scoringRange','breakReading'],
  7: ['scoringRange','breakReading'],
  8: ['scoringRange'],
  9: ['scoringRange','speedControl'],
  10:['scoringRange','breakReading'],
  11:['scoringRange','breakReading'],
};

function calcSkillProfile(sessions, hcp) {
  const br = hcpBracket(hcp);

  // Separate gate sessions from performance sessions
  const gateSessions = sessions.filter(s => s.combineType === 'skill');
  const perfSessions = sessions.filter(s => s.combineType !== 'skill'); // includes legacy sessions

  // ── Performance (hole-in-play) putting data ──────────────
  const puttStnData = {}; // stnIdx → {made, total}
  perfSessions.forEach(s => {
    const shots = s.ver === 'long' ? 3 : 2;
    (s.results || []).forEach(r => {
      if (r.cid !== 'putting') return;
      (r.stationScores || []).forEach((ss, i) => {
        if (!ss) return;
        if (!puttStnData[i]) puttStnData[i] = { made: 0, total: 0 };
        puttStnData[i].made  += ss.score;
        puttStnData[i].total += shots;
      });
    });
  });

  // ── Gate putting data ─────────────────────────────────────
  // Per station: lineAcc (% center), paceAcc (% in zone)
  const gateStnData = {}; // stnIdx → {lineC, lineTotal, paceZ, paceTotal}
  gateSessions.forEach(s => {
    (s.results || []).forEach(r => {
      if (r.cid !== 'putting') return;
      (r.stationScores || []).forEach((ss, i) => {
        if (!ss) return;
        if (!gateStnData[i]) gateStnData[i] = { lineC: 0, lineTotal: 0, paceZ: 0, paceTotal: 0 };
        (ss.shotResults || []).forEach(shot => {
          if (!shot || !shot.startsWith('G-')) return;
          const [, line, pace] = shot.split('-');
          gateStnData[i].lineTotal++;
          gateStnData[i].paceTotal++;
          if (line === 'C') gateStnData[i].lineC++;
          if (pace === 'Z') gateStnData[i].paceZ++;
        });
      });
    });
  });

  // ── Chipping data ─────────────────────────────────────────
  const chipStnData = {};
  sessions.forEach(s => {
    const shots = s.ver === 'long' ? 3 : 2;
    (s.results || []).forEach(r => {
      if (r.cid !== 'chipping') return;
      (r.stationScores || []).forEach((ss, i) => {
        if (!ss) return;
        if (!chipStnData[i]) chipStnData[i] = { pts: 0, shots: 0 };
        chipStnData[i].pts   += ss.score;
        chipStnData[i].shots += shots;
      });
    });
  });

  // ── Putting dimension helpers ─────────────────────────────
  // Gate-aware: if gate data exists for these stations, use it. Otherwise fall back to perf make%.
  function gateLineAcc(indices) {
    let c = 0, t = 0;
    indices.forEach(i => {
      if (gateStnData[i]) { c += gateStnData[i].lineC; t += gateStnData[i].lineTotal; }
    });
    return t >= 5 ? c / t : null;
  }
  function gatePaceAcc(indices) {
    let z = 0, t = 0;
    indices.forEach(i => {
      if (gateStnData[i]) { z += gateStnData[i].paceZ; t += gateStnData[i].paceTotal; }
    });
    return t >= 5 ? z / t : null;
  }
  function perfPuttAvg(indices) {
    let made = 0, total = 0;
    indices.forEach(i => {
      if (puttStnData[i]) { made += puttStnData[i].made; total += puttStnData[i].total; }
    });
    return total > 0 ? made / total : null;
  }

  // Station groups by condition type
  const DOWNHILL_STNS  = [1, 5, 9];   // downhill stations across all distances
  const SIDEHILL_STNS  = [2, 3, 6, 7, 10, 11]; // breaking stations
  const SHORT_STNS     = [0, 1, 2, 3]; // 3ft
  const SCORING_STNS   = [4, 5, 6, 7, 8, 9, 10, 11]; // 6ft+

  // For each dimension: prefer gate data when available, fall back to perf
  const hasGateData = Object.keys(gateStnData).length > 0;

  const shortPutt    = hasGateData
    ? (() => { const l = gateLineAcc(SHORT_STNS), p = gatePaceAcc(SHORT_STNS); return (l!==null&&p!==null) ? (l+p)/2 : l||p||perfPuttAvg(SHORT_STNS); })()
    : perfPuttAvg(SHORT_STNS);

  const speedControl = hasGateData
    ? gatePaceAcc(DOWNHILL_STNS) ?? perfPuttAvg(DOWNHILL_STNS)
    : perfPuttAvg(DOWNHILL_STNS);

  const breakReading = hasGateData
    ? gateLineAcc(SIDEHILL_STNS) ?? perfPuttAvg(SIDEHILL_STNS)
    : perfPuttAvg(SIDEHILL_STNS);

  const scoringRange = hasGateData
    ? (() => { const l = gateLineAcc(SCORING_STNS), p = gatePaceAcc(SCORING_STNS); return (l!==null&&p!==null) ? (l+p)/2 : l||p||perfPuttAvg(SCORING_STNS); })()
    : perfPuttAvg(SCORING_STNS);

  // ── Chipping dimensions ───────────────────────────────────
  function chipAvgPts(indices) {
    let pts = 0, shots = 0;
    indices.forEach(i => {
      if (chipStnData[i]) { pts += chipStnData[i].pts; shots += chipStnData[i].shots; }
    });
    return shots > 0 ? pts / shots : null;
  }

  const chipDistance   = chipAvgPts([0,1,2,3,4,5,6,7,8,9,10,11]);
  const shortGame      = chipAvgPts([0,1,2,3,4,5]);
  const tightAvg       = chipAvgPts([0,2,6,9]);
  const roughAvg       = chipAvgPts([1,3,7,10]);
  const lieVersatility = (tightAvg && roughAvg && tightAvg > 0) ? roughAvg / tightAvg : null;

  const clubsUsed = new Set();
  sessions.forEach(s => {
    (s.results || []).filter(r => r.cid === 'chipping').forEach(r => {
      (r.stationScores || []).forEach(ss => { if (ss?.club) clubsUsed.add(ss.club); });
    });
  });
  const clubVersatility = clubsUsed.size;

  // ── Rating helper ─────────────────────────────────────────
  function rate(dim, actual) {
    if (actual === null) return null;
    const bench = BENCHMARKS[dim][br];
    if (actual >= bench * 1.05) return 'strength';
    if (actual >= bench * 0.88) return 'ontrack';
    return 'weakness';
  }

  // ── AimPoint calibration ──────────────────────────────────
  let apCalibration = null;
  let apErrCount = 0;
  let apUnderCount = 0;
  let apOverCount  = 0;
  if (CU?.aimpointMode) {
    const errors = [];
    sessions.forEach(s => {
      (s.results || []).filter(r => r.cid === 'putting').forEach(r => {
        (r.stationScores || []).forEach(ss => {
          if (!ss?.feltSlope || !ss?.actualSlope) return;
          const felt   = parseFloat(ss.feltSlope   === '4+' ? '4' : ss.feltSlope);
          const actual = parseFloat(ss.actualSlope  === '4+' ? '4' : ss.actualSlope);
          if (!isNaN(felt) && !isNaN(actual)) {
            errors.push(Math.abs(felt - actual));
            if (felt < actual) apUnderCount++;
            else if (felt > actual) apOverCount++;
          }
        });
      });
    });
    apErrCount = errors.length;
    if (apErrCount >= 5) apCalibration = errors.reduce((a, b) => a + b, 0) / apErrCount;
  }

  const apBench = BENCHMARKS.apCalibration[br];
  let apRating = null;
  if (apCalibration !== null) {
    if (apCalibration <= apBench * 0.8)       apRating = 'strength';
    else if (apCalibration <= apBench * 1.15) apRating = 'ontrack';
    else                                       apRating = 'weakness';
  }
  const apTendency = apUnderCount > apOverCount * 1.5 ? 'under-reader'
                   : apOverCount  > apUnderCount * 1.5 ? 'over-reader'
                   : 'consistent';

  return {
    shortPutt:     { val: shortPutt,     rating: rate('shortPutt', shortPutt),     bench: BENCHMARKS.shortPutt[br],     gateSource: hasGateData },
    speedControl:  { val: speedControl,  rating: rate('speedControl', speedControl), bench: BENCHMARKS.speedControl[br],  gateSource: hasGateData },
    breakReading:  { val: breakReading,  rating: rate('breakReading', breakReading), bench: BENCHMARKS.breakReading[br],  gateSource: hasGateData },
    scoringRange:  { val: scoringRange,  rating: rate('scoringRange', scoringRange), bench: BENCHMARKS.scoringRange[br],  gateSource: hasGateData },
    chipDistance:  { val: chipDistance,  rating: rate('chipDistance', chipDistance), bench: BENCHMARKS.chipDistance[br]  },
    shortGame:     { val: shortGame,     rating: rate('shortGame', shortGame),       bench: BENCHMARKS.shortGame[br]     },
    lieVersatility:{ val: lieVersatility,rating: rate('lieVersatility', lieVersatility), bench: BENCHMARKS.lieVersatility[br] },
    clubVersatility:{ val: clubVersatility, rating: clubVersatility >= BENCHMARKS.clubVersatility[br] ? 'strength' : clubVersatility >= BENCHMARKS.clubVersatility[br] - 1 ? 'ontrack' : 'weakness', bench: BENCHMARKS.clubVersatility[br] },
    apCalibration: { val: apCalibration, rating: apRating, bench: apBench, errCount: apErrCount, tendency: apTendency },
  };
}

// ── Prescription mapping ─────────────────────
const PRESCRIPTIONS = {
  speedControl:   { game:'Clock Face',   icon:'🕐', why:'Focuses on downhill pace — your weakest putting skill' },
  breakReading:   { game:'Ladder',       icon:'🪜', why:'Forces commitment on all break types 3ft → 6ft → 10ft' },
  shortPutt:      { game:"Molinari's 8", icon:'🎖️', why:'Builds 5ft automaticity — the range where short putts live' },
  scoringRange:   { game:'7 Up',         icon:'7️⃣', why:'Pure lag and scoring range competition from 20ft+' },
  chipDistance:   { game:'Darts',        icon:'🎯', why:'Proximity scoring trains distance control directly' },
  lieVersatility: { game:'Dollar Signs', icon:'💰', why:'Rewards precision from varied lies — penalises missing the green' },
  shortGame:      { game:'Par 18',       icon:'⛳', why:'9-hole chip-and-putt directly tests your short range game' },
  clubVersatility:{ game:'Dollar Signs', icon:'💰', why:'Forces you to experiment with different lofts for each shot' },
  apCalibration:  { game:'AimPoint Calibration', icon:'📐', why:'Spend 10 mins on the practice green with your slope tool — guess first, verify second' },
};

function getTopWeaknesses(profile) {
  return Object.entries(profile)
    .filter(([, d]) => d.rating === 'weakness' && d.val !== null)
    .map(([key, d]) => {
      const bench = d.bench || 1;
      const deficit = bench > 0 ? (bench - d.val) / bench : 0;
      return { key, deficit, data: d };
    })
    .sort((a, b) => b.deficit - a.deficit);
}

// ── Skill Improve station generator ──────────
function generateSkillImproveStations(combineId, profile) {
  const fullList = combineId === 'putting' ? PUTTING : CHIPPING;

  // Score each station by how weakly its dimensions perform
  function stationWeakScore(idx) {
    if (combineId === 'putting') {
      const dims = PUTT_STN_DIM[idx] || [];
      let score = 0;
      dims.forEach(d => {
        if (profile[d]?.rating === 'weakness') score += 2;
        else if (profile[d]?.rating === 'ontrack') score += 1;
      });
      return score;
    } else {
      // Chipping: map station to dimensions
      const chipMap = {
        0:'shortGame',1:'lieVersatility',2:'shortGame',3:'lieVersatility',
        4:'shortGame', 5:'lieVersatility',6:'chipDistance',7:'lieVersatility',
        8:'chipDistance',9:'chipDistance',10:'lieVersatility',11:'chipDistance'
      };
      const dim = chipMap[idx];
      if (!dim) return 0;
      if (profile[dim]?.rating === 'weakness') return 2;
      if (profile[dim]?.rating === 'ontrack') return 1;
      return 0;
    }
  }

  // Score all 12 stations
  const scored = fullList.map((stn, i) => ({ stn, i, score: stationWeakScore(i) }));
  scored.sort((a, b) => b.score - a.score);

  // Pick 6 weakness stations + 2 strength anchors
  const weakPool    = scored.filter(s => s.score >= 1).slice(0, 6);
  const strengthPool= scored.filter(s => s.score === 0).slice(0, 2);
  const selected    = [...weakPool, ...strengthPool];

  // Shuffle — no two same-distance stations consecutive
  const shuffle = arr => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  let result = shuffle([...selected]);

  // Attempt to prevent consecutive same-distance stations (chipping)
  if (combineId === 'chipping') {
    const distances = [5,5,10,10,10,10,20,20,20,30,30,30];
    for (let pass = 0; pass < 10; pass++) {
      let ok = true;
      for (let i = 1; i < result.length; i++) {
        if (distances[result[i].i] === distances[result[i-1].i]) { ok = false; break; }
      }
      if (ok) break;
      result = shuffle([...result]);
    }
  }

  return result.map(r => r.stn);
}

// ── Render Skill Profile card on home ────────
function buildSkillProfileCard() {
  const el = document.getElementById('skill-profile-section');
  if (!el) return;
  const sessions = CU?.sessions || [];
  const weight = calcSessionWeight(sessions);
  if (weight < P2_THRESHOLD_PTS) { el.innerHTML = ''; return; }

  const profile = calcSkillProfile(sessions, CU.hcp);

  const DIMS = [
    { section:'PUTTING', key:'shortPutt',      label:'Short Putts (3ft)',      fmt: d => d.val !== null ? Math.round(d.val*100)+'%' : '—' },
    { key:'speedControl',   label:'Speed Control (downhill)',  fmt: d => d.val !== null ? Math.round(d.val*100)+'%' : '—' },
    { key:'breakReading',   label:'Break Reading',              fmt: d => d.val !== null ? Math.round(d.val*100)+'%' : '—' },
    { key:'scoringRange',   label:'Scoring Range (6ft+)',       fmt: d => d.val !== null ? Math.round(d.val*100)+'%' : '—' },
    { section:'CHIPPING', key:'chipDistance',  label:'Distance Control',        fmt: d => d.val !== null ? d.val.toFixed(1)+' pts/shot' : '—' },
    { key:'shortGame',      label:'Short Game (5–10 yds)',      fmt: d => d.val !== null ? d.val.toFixed(1)+' pts/shot' : '—' },
    { key:'lieVersatility', label:'Lie Versatility',            fmt: d => d.val !== null ? Math.round(d.val*100)+'% of tight' : '—' },
    { key:'clubVersatility',label:'Club Variety',               fmt: d => d.val !== null ? d.val+' clubs used' : '—' },
    ...(CU?.aimpointMode ? [
      { section:'AIMPOINT', key:'apCalibration', label:'Slope Calibration',
        fmt: d => {
          if (d.val === null) return d.errCount < 5 ? `${d.errCount}/5 readings` : '—';
          const tend = d.tendency === 'under-reader' ? '📉 Under-reading' : d.tendency === 'over-reader' ? '📈 Over-reading' : '✅ Consistent';
          return `±${d.val.toFixed(2)}% avg · ${tend}`;
        }
      }
    ] : []),
  ];

  const weaknesses = getTopWeaknesses(profile);
  const summary = weaknesses.length === 0 ? '🟢 All dimensions on track' :
    `🔴 ${weaknesses.length} weakness${weaknesses.length > 1 ? 'es' : ''} detected`;

  let dimsHTML = '';
  DIMS.forEach(dim => {
    if (dim.section) {
      dimsHTML += `<div class="sp-section">${dim.section}</div>`;
    }
    const d = profile[dim.key];
    if (!d) return;
    const dotCls = d.rating === 'strength' ? 'sp-dot-gr' : d.rating === 'ontrack' ? 'sp-dot-gd' : 'sp-dot-re';
    const ratTxt = d.rating === 'strength' ? 'Strength' : d.rating === 'ontrack' ? 'On Track' : 'Weakness';
    const ratCol = d.rating === 'strength' ? 'var(--gr)' : d.rating === 'ontrack' ? 'var(--g)' : 'var(--re)';
    // AimPoint bar is inverted — lower error = fuller bar
    const isAP = dim.key === 'apCalibration';
    let barPct;
    if (isAP) {
      barPct = d.val !== null && d.bench > 0 ? Math.min(100, Math.round((1 - d.val / (d.bench * 2)) * 100)) : 0;
    } else {
      barPct = d.val !== null && d.bench > 0 ? Math.min(100, Math.round(d.val / d.bench * 100)) : 0;
    }
    const barCol = d.rating === 'strength' ? 'var(--gr)' : d.rating === 'ontrack' ? 'var(--g)' : 'var(--re)';
    dimsHTML += `<div class="sp-dim">
      <div class="sp-dot ${dotCls}"></div>
      <div class="sp-dname">${dim.label}</div>
      <div style="display:flex;align-items:center;gap:8px">
        <div class="sp-bar-wrap"><div class="sp-bar" style="width:${barPct}%;background:${barCol}"></div></div>
        <div class="sp-dval">${dim.fmt(d)}</div>
      </div>
    </div>`;
  });

  el.innerHTML = `<div class="sp-card" id="sp-card-main">
    <div class="sp-hdr" onclick="document.getElementById('sp-card-main').classList.toggle('open')">
      <div>
        <div class="sp-title">📊 Skill Profile</div>
        <div class="sp-sub">${summary}</div>
      </div>
      <div class="sp-arr">▼</div>
    </div>
    <div class="sp-body">${dimsHTML}</div>
  </div>`;
}

// ── Render Prescription card in session setup ─
function buildPrescriptionCard() {
  const el = document.getElementById('rx-section');
  if (!el) return;
  const sessions = CU?.sessions || [];
  const weight = calcSessionWeight(sessions);
  if (weight < P2_THRESHOLD_PTS) { el.innerHTML = ''; return; }

  const profile = calcSkillProfile(sessions, CU.hcp);
  const weaknesses = getTopWeaknesses(profile);
  if (!weaknesses.length) { el.innerHTML = ''; return; }

  const top = weaknesses[0];
  const rx  = PRESCRIPTIONS[top.key];
  if (!rx) { el.innerHTML = ''; return; }

  const DIM_LABELS = {
    shortPutt:'Short Putts', speedControl:'Downhill Speed Control',
    breakReading:'Break Reading', scoringRange:'Scoring Range',
    chipDistance:'Chipping Distance Control', shortGame:'Short Game (5–10 yds)',
    lieVersatility:'Lie Versatility', clubVersatility:'Club Versatility'
  };

  el.innerHTML = `<div class="rx-card">
    <div class="rx-lbl">🎯 Focus Area Today</div>
    <div class="rx-weak">Your weakest area: <strong style="color:var(--re)">${DIM_LABELS[top.key]}</strong></div>
    <div class="rx-game">
      <div class="rx-game-ico">${rx.icon}</div>
      <div>
        <div class="rx-game-name">${rx.game}</div>
        <div class="rx-game-why">${rx.why}</div>
      </div>
    </div>
  </div>`;
}
