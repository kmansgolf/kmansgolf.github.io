// range-app.js — App state, auth, navigation, session flow, UI

// ═══════════════════════════════════════════
//  STATE
// ═══════════════════════════════════════════
let CU = null;
let selCombines = new Set();
let combineVer = 'short';
let sessionType = 'standard';
let combineType = 'skill'; // 'skill' (gate drill) | 'performance' (hole in play)
let _skillProfile = null;
let sessionQueue = [];
let sessionResults = {};
let runnerState = { qIdx: 0, sIdx: 0 };
let sessionInProgress = false;

// ═══════════════════════════════════════════
//  ACTIVE SESSION PERSISTENCE
// ═══════════════════════════════════════════
function saveActiveSession() {
  if (!sessionInProgress || !sessionQueue.length) {
    localStorage.removeItem('range_active_session');
    return;
  }
  const data = {
    selCombines: [...selCombines],
    combineVer, sessionType, combineType,
    sessionQueue, sessionResults, runnerState,
    sessionInProgress,
    savedAt: new Date().toISOString()
  };
  try {
    localStorage.setItem('range_active_session', JSON.stringify(data));
  } catch(e) { console.error('Failed to save active session', e); }
}

function loadActiveSession() {
  try {
    const saved = localStorage.getItem('range_active_session');
    if (!saved) return false;
    const data = JSON.parse(saved);
    if (!data.sessionInProgress || !data.sessionQueue?.length) return false;

    selCombines = new Set(data.selCombines || []);
    combineVer      = data.combineVer      ?? 'short';
    sessionType     = data.sessionType     ?? 'standard';
    combineType     = data.combineType     ?? 'skill';
    sessionQueue    = data.sessionQueue    ?? [];
    sessionResults  = data.sessionResults  ?? {};
    runnerState     = data.runnerState     ?? { qIdx: 0, sIdx: 0 };
    sessionInProgress = true;
    return true;
  } catch(e) {
    console.error('Failed to load active session', e);
    return false;
  }
}

function clearActiveSession() {
  localStorage.removeItem('range_active_session');
}

// ═══════════════════════════════════════════
//  NAVIGATION GUARDS
// ═══════════════════════════════════════════

// Browser back button guard
window.addEventListener('popstate', function() {
  if (sessionInProgress) {
    history.pushState(null, '', location.href);
    if (confirm('You have an active session in progress. Leave and lose your data?')) {
      sessionInProgress = false;
      clearActiveSession();
      history.back();
    }
  }
});
// Push a state on load so popstate fires on first back press
history.pushState(null, '', location.href);

// Page unload guard
window.addEventListener('beforeunload', function(e) {
  if (sessionInProgress) {
    e.preventDefault();
    e.returnValue = 'You have an active session. Leave and lose your data?';
    return e.returnValue;
  }
});

// Intercept kmansgolf logo tap mid-session
document.addEventListener('click', function(e) {
  const link = e.target.closest('a[href="/"]');
  if (link && sessionInProgress) {
    e.preventDefault();
    if (confirm('You have an active session in progress. Leave and lose your data?')) {
      sessionInProgress = false;
      clearActiveSession();
      window.location.href = '/';
    }
  }
});

// ═══════════════════════════════════════════
//  STORAGE / AUTH
// ═══════════════════════════════════════════
const sk = u => 'range_' + u.toLowerCase();
const loadU = u => { try { return JSON.parse(localStorage.getItem(sk(u))); } catch { return null; } };
const saveU = d => localStorage.setItem(sk(d.username), JSON.stringify(d));
const hashPin = p => { let h = 0; for (const c of p) h = (Math.imul(31, h) + c.charCodeAt(0)) | 0; return h.toString(36); };

function switchTab(t) {
  document.getElementById('lt-in').classList.toggle('on', t === 'in');
  document.getElementById('lt-new').classList.toggle('on', t === 'new');
  document.getElementById('lf-in').style.display = t === 'in' ? 'block' : 'none';
  document.getElementById('lf-new').style.display = t === 'new' ? 'block' : 'none';
}

function doLogin() {
  const u = document.getElementById('li-u').value.trim().toLowerCase();
  const p = document.getElementById('li-p').value.trim();
  const e = document.getElementById('li-e');
  if (!u || !p) { e.textContent = 'Enter username and PIN.'; return; }
  const d = loadU(u);
  if (!d) { e.textContent = 'Username not found.'; return; }
  if (d.pin !== hashPin(p)) { e.textContent = 'Incorrect PIN.'; return; }
  e.textContent = ''; CU = d;
  sessionStorage.setItem('range_session_user', d.username);
  enterApp();
}

function showForgotPin() {
  document.getElementById('forgot-pin-panel').style.display = 'block';
  document.getElementById('lf-in').style.display = 'none';
}

function hideForgotPin() {
  document.getElementById('forgot-pin-panel').style.display = 'none';
  document.getElementById('lf-in').style.display = 'block';
}

function doResetPin() {
  const u = document.getElementById('fp-user').value.trim().toLowerCase();
  const code = document.getElementById('fp-code').value.trim().toUpperCase();
  const pin  = document.getElementById('fp-pin').value.trim();
  const pin2 = document.getElementById('fp-pin2').value.trim();
  const e = document.getElementById('fp-e');
  if (!u || !code || !pin) { e.textContent = 'All fields required.'; return; }
  const d = loadU(u);
  if (!d) { e.textContent = 'Username not found.'; return; }
  if (!d.recoveryCode || d.recoveryCode !== hashPin(code)) { e.textContent = 'Recovery code incorrect.'; return; }
  if (!/^\d{4}$/.test(pin)) { e.textContent = 'PIN must be 4 digits.'; return; }
  if (pin !== pin2) { e.textContent = 'PINs do not match.'; return; }
  d.pin = hashPin(pin);
  localStorage.setItem(sk(u), JSON.stringify(d));
  e.textContent = '';
  hideForgotPin();
  document.getElementById('li-u').value = u;
  document.getElementById('li-e').textContent = '✅ PIN reset — sign in now.';
  document.getElementById('li-e').style.color = 'var(--gr)';
}

const RESERVED_USERNAMES = ['kmansgolf','kman','admin','test','guest','demo','system','range','bunker','fairway'];

function genRecoveryCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I confusion
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function doCreate() {
  const name = document.getElementById('ca-n').value.trim();
  const user = document.getElementById('ca-u').value.trim().toLowerCase();
  const hcp  = parseInt(document.getElementById('ca-h').value);
  const pin  = document.getElementById('ca-p').value.trim();
  const pin2 = document.getElementById('ca-p2').value.trim();
  const e    = document.getElementById('ca-e');
  if (!name || !user || !pin) { e.textContent = 'All fields required.'; return; }
  if (!/^[a-z0-9_]{3,20}$/.test(user)) { e.textContent = 'Username: 3–20 chars, letters/numbers/underscore only.'; return; }
  if (RESERVED_USERNAMES.includes(user)) { e.textContent = 'That username is reserved. Please choose another.'; return; }
  if (!/^\d{4}$/.test(pin)) { e.textContent = 'PIN must be 4 digits.'; return; }
  if (pin !== pin2) { e.textContent = 'PINs do not match.'; return; }
  if (loadU(user)) { e.textContent = 'Username already taken.'; return; }

  const recoveryCode = genRecoveryCode();
  CU = {
    username: user, name, hcp,
    pin: hashPin(pin),
    recoveryCode: hashPin(recoveryCode), // stored hashed
    sessions: [], aimpointMode: false,
    firstRun: true,
    created: Date.now()
  };
  saveU(CU);
  e.textContent = '';

  // Show recovery code before entering app
  showRecoveryCode(recoveryCode);
}

function showRecoveryCode(code) {
  const overlay = document.getElementById('recovery-overlay');
  document.getElementById('recovery-code-display').textContent = code;
  overlay.style.display = 'flex';
}

function dismissRecoveryCode() {
  document.getElementById('recovery-overlay').style.display = 'none';
  sessionStorage.setItem('range_session_user', CU.username);
  enterApp();
}

function doLogout() {
  if (!confirm('Sign out?')) return;
  clearActiveSession();
  sessionStorage.removeItem('range_session_user');
  CU = null;
  document.getElementById('app-header').style.display = 'none';
  goTo('s-login');
}

// ═══════════════════════════════════════════
//  APP ENTRY
// ═══════════════════════════════════════════
function enterApp(tab) {
  document.getElementById('app-header').style.display = 'block';
  buildWarmup();
  refreshHome();
  if (loadActiveSession()) {
    setActiveTab('tab-practice');
    renderRunner();
    goTo('s-runner');
  } else if (tab === 'practice') {
    navTo('s-practice', 'tab-practice');
  } else if (tab === 'history') {
    navTo('s-history', 'tab-history');
  } else if (tab === 'profile') {
    navTo('s-profile', 'tab-profile');
  } else if (tab === 'tempo') {
    navTo('s-tempo', 'tab-tempo');
  } else if (CU?.firstRun) {
    showFirstRun();
  } else {
    goTo('s-home');
  }
}

function showFirstRun() {
  document.getElementById('firstrun-overlay').style.display = 'flex';
}

function dismissFirstRun() {
  document.getElementById('firstrun-overlay').style.display = 'none';
  CU.firstRun = false;
  saveU(CU);
  goTo('s-home');
}

function goTo(id) {
  document.querySelectorAll('.scr').forEach(s => s.classList.remove('on'));
  const el = document.getElementById(id);
  if (el) el.classList.add('on');
}

function setActiveTab(tabId) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  const tab = document.getElementById(tabId);
  if (tab) tab.classList.add('active');
}

function navTo(id, tabId) {
  // Stop tempo if leaving it
  if (tabId && tabId !== 'tab-tempo' && (t_playing || t_countingIn)) t_haltAll(), t_syncPlayBtn();
  if (tabId) setActiveTab(tabId);
  if (id === 's-practice') {
    if (sessionInProgress) {
      renderRunner();
      goTo('s-runner');
    } else {
      goToPractice();
    }
  } else if (id === 's-history') { buildHistory(); goTo(id); }
  else if (id === 's-profile') { buildProfile(); goTo(id); }
  else if (id === 's-tempo') { goTo(id); }
  else if (id === 's-games') { renderGamesList(); goTo(id); }
  else { refreshHome(); goTo(id); }
}

// ═══════════════════════════════════════════
//  HOME
// ═══════════════════════════════════════════
function hcpLbl(h) {
  return { 0: 'Scratch+', 3: '1–5', 7: '6–10', 12: '11–15', 17: '16–20', 22: '21–25', 27: '26–30', 35: '31+' }[h] ?? h;
}
function calcStreak(sessions) {
  if (!sessions.length) return 0;
  const days = [...new Set(sessions.map(s => new Date(s.date).toDateString()))].sort((a, b) => new Date(b) - new Date(a));
  let streak = 0, ref = new Date(); ref.setHours(0, 0, 0, 0);
  for (const d of days) {
    const day = new Date(d); day.setHours(0, 0, 0, 0);
    if ((ref - day) / 86400000 <= 1) { streak++; ref = day; } else break;
  }
  return streak;
}
function refreshHome() {
  if (!CU) return;
  const d = new Date();
  document.getElementById('hdate').textContent = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  document.getElementById('hname').textContent = CU.name.split(' ')[0];
  document.getElementById('hhcp').textContent = 'Handicap: ' + hcpLbl(CU.hcp);
  const sess = CU.sessions || [];
  document.getElementById('h-ses').textContent = sess.length;
  document.getElementById('h-str').textContent = calcStreak(sess);
  let bp = null, bc = null;
  sess.forEach(s => (s.results || []).forEach(r => {
    if (r.cid === 'putting' && (bp === null || r.score > bp)) bp = r.score;
    if (r.cid === 'chipping' && (bc === null || r.score > bc)) bc = r.score;
  }));
  document.getElementById('h-bp').textContent = bp !== null ? bp + '/36' : '—';
  document.getElementById('h-bc').textContent = bc !== null ? bc + '/36' : '—';

  // Resume banner
  const rb = document.getElementById('resume-banner');
  if (sessionInProgress && sessionQueue.length > 0) {
    const curId = sessionQueue[runnerState.qIdx];
    const stns = getStations(curId);
    const combName = curId === 'putting' ? 'Putting Combine' : 'Chipping Combine';
    const icon = curId === 'putting' ? '⛳' : '🏌️';
    rb.innerHTML = `<div class="resumebanner">
      <div class="resumeinfo">
        <div class="resumetit">${icon} ${combName} in progress</div>
        <div class="resumesub">Station ${runnerState.sIdx + 1} of ${stns.length} — tap to continue</div>
      </div>
      <button class="btn sm" onclick="resumeSession()">Resume →</button>
    </div>`;
  } else {
    rb.innerHTML = '';
  }

  const THRESHOLD = 6;
  const weight = calcSessionWeight(sess);
  const n = document.getElementById('thresh-notice');
  if (weight < P2_THRESHOLD_PTS) {
    const pct = Math.round((weight / P2_THRESHOLD_PTS) * 100);
    n.innerHTML = `<div class="thcard"><div class="thtit">📊 Building Your Skill Profile</div><div class="thbarw"><div class="thbarf" style="width:${pct}%"></div></div><div class="thsub">${weight}/${P2_THRESHOLD_PTS} session points — game prescriptions unlock soon (short=1pt, long=2pts)</div></div>`;
  } else {
    n.innerHTML = '';
  }

  buildSkillProfileCard();

  const cc = document.getElementById('home-combines');
  cc.innerHTML = '';
  let bestPutt = null, bestChip = null;
  sess.forEach(s => (s.results || []).forEach(r => {
    if (r.cid === 'putting'  && (bestPutt === null || r.score > bestPutt)) bestPutt = r.score;
    if (r.cid === 'chipping' && (bestChip === null || r.score > bestChip)) bestChip = r.score;
  }));
  cc.innerHTML = `<div class="crow" onclick="navTo('s-practice','tab-practice')">
    <div style="flex:1">
      <div class="cnam">Combines</div>
      <div style="display:flex;gap:16px;margin-top:6px">
        <div><div style="font-family:var(--fc);font-size:10px;letter-spacing:1px;text-transform:uppercase;color:var(--d)">⛳ Putting</div><div class="cbval" style="font-size:16px">${bestPutt !== null ? bestPutt+'/36' : '—'}</div></div>
        <div><div style="font-family:var(--fc);font-size:10px;letter-spacing:1px;text-transform:uppercase;color:var(--d)">🏌️ Chipping</div><div class="cbval" style="font-size:16px">${bestChip !== null ? bestChip+'/36' : '—'}</div></div>
      </div>
    </div>
    <div style="font-family:var(--fc);font-size:22px;color:var(--d)">›</div>
  </div>`;
}


// ═══════════════════════════════════════════
//  SESSION SETUP
// ═══════════════════════════════════════════
function goToPractice() {
  if (!sessionInProgress) {
    selCombines.clear();
    updateCombineUI('putting');
    updateCombineUI('chipping');

    const sessions = CU?.sessions || [];
    const weight = calcSessionWeight(sessions);
    const aboveThreshold = weight >= P2_THRESHOLD_PTS;
    const stypeSection = document.getElementById('stype-section');

    if (aboveThreshold) {
      _skillProfile = calcSkillProfile(sessions, CU.hcp);
      if (stypeSection) stypeSection.style.display = 'block';
      setSessionType('skillimprove');
    } else {
      _skillProfile = null;
      if (stypeSection) stypeSection.style.display = 'none';
      sessionType = 'standard';
    }

    // Default to skill combine (gate drill)
    setCombineType('skill');
    buildPrescriptionCard();
    updateStartBtn();
  }
  setActiveTab('tab-practice');
  goTo('s-practice');
}


function toggleAccord(id) {
  document.getElementById(id).classList.toggle('open');
}
function setSessionType(type) {
  sessionType = type;
  document.getElementById('st-improve')?.classList.toggle('on', type === 'skillimprove');
  document.getElementById('st-standard')?.classList.toggle('on', type === 'standard');
  const desc = document.getElementById('stype-desc');
  const verSection = document.getElementById('ver-section');

  if (type === 'skillimprove') {
    if (desc) desc.textContent = '8 stations · 3 shots · weakness-weighted · randomised';
    if (verSection) verSection.style.display = 'none';
  } else {
    if (desc) desc.textContent = 'Standard combine — full coverage for benchmarking';
    if (verSection) verSection.style.display = 'block';
  }
  updateStartBtn();
}

function setCombineType(type) {
  combineType = type;
  document.getElementById('ct-skill')?.classList.toggle('on', type === 'skill');
  document.getElementById('ct-perf')?.classList.toggle('on', type === 'performance');
  const desc = document.getElementById('ctype-desc');
  if (desc) {
    desc.textContent = type === 'skill'
      ? 'Gate drill — 2 tees + back tee. Scores line and pace independently. Best for diagnosis and skill building.'
      : 'Hole in play — tracks makes and miss direction. Best for benchmarking against your handicap.';
  }
  // Hide short/full toggle for skill combine — always 3 shots
  const verSec = document.getElementById('ver-section');
  if (verSec) verSec.style.display = type === 'skill' ? 'none' : 'block';
  updateStartBtn();
}

function togCombine(id) {
  selCombines.has(id) ? selCombines.delete(id) : selCombines.add(id);
  updateCombineUI(id);
  updateStartBtn();
}

function updateCombineUI(id) {
  const chosen = selCombines.has(id);
  const chkbox = document.getElementById('chk-' + id);
  if (!chkbox) return;
  const mark = chkbox.querySelector('.chkmark');
  if (chosen) {
    chkbox.style.background = 'var(--g)';
    chkbox.style.borderColor = 'var(--g)';
    mark.style.display = 'inline';
  } else {
    chkbox.style.background = '';
    chkbox.style.borderColor = '';
    mark.style.display = 'none';
  }
  // Update duration label
  const durs = { putting: combineVer === 'short' ? '20m' : '35m', chipping: combineVer === 'short' ? '25m' : '40m' };
  const durEl = document.getElementById('dur-' + id);
  if (durEl) durEl.textContent = chosen ? durs[id] : '—';
}

function setVer(v) {
  combineVer = v;
  document.getElementById('vs').classList.toggle('on', v === 'short');
  document.getElementById('vl').classList.toggle('on', v === 'long');
  document.getElementById('verdesc').textContent = v === 'short'
    ? '6 stations · 2 shots each · ~20–25 min total'
    : '12 stations · 3 shots each · ~45–55 min total';
  // Refresh durations
  ['putting','chipping'].forEach(id => updateCombineUI(id));
  updateStartBtn();
}

function updateStartBtn() {
  const count = selCombines.size;
  const durs = { putting: combineVer === 'short' ? 20 : 35, chipping: combineVer === 'short' ? 25 : 40 };
  const total = [...selCombines].reduce((a, id) => a + (durs[id] || 0), 0);
  const btn = document.getElementById('start-btn');
  const td  = document.getElementById('sestim');
  // Update combines accordion subtitle
  const sub = document.getElementById('acc-combines-sub');
  if (count > 0) {
    btn.style.opacity = '1'; btn.style.pointerEvents = 'auto';
    td.innerHTML = `<span>${count}</span> selected · <span>~${total} min</span>`;
    if (sub) sub.textContent = [...selCombines].map(id => id === 'putting' ? 'Putting' : 'Chipping').join(' + ');
  } else {
    btn.style.opacity = '.4'; btn.style.pointerEvents = 'none';
    td.innerHTML = 'Select a combine above to begin';
    if (sub) sub.textContent = 'Select to start tracking';
  }
}

// ═══════════════════════════════════════════
//  WARMUP
// ═══════════════════════════════════════════
function buildWarmup() {
  const list = document.getElementById('warmup-list');
  list.innerHTML = '';
  WARMUP_DATA.forEach((ex, i) => {
    list.innerHTML += `<div class="wex"><div class="wnum">${i + 1}</div><div><div class="wname">${ex.name}</div><div class="wdesc">${ex.desc}</div><div class="wreps">${ex.reps}</div><a class="wlink" href="${ex.link}" target="_blank">Watch on YouTube (TPI)</a></div></div>`;
  });
}

// ═══════════════════════════════════════════
//  SESSION START
// ═══════════════════════════════════════════
function startSession() {
  sessionQueue = ['putting', 'chipping'].filter(id => selCombines.has(id));
  sessionResults = {};
  runnerState = { qIdx: 0, sIdx: 0 };
  sessionInProgress = true;
  startNextCombine();
}

function getStations(id) {
  if (sessionType === 'skillimprove' && _skillProfile) {
    return generateSkillImproveStations(id, _skillProfile);
  }
  const data = id === 'putting' ? PUTTING : CHIPPING;
  return combineVer === 'short' ? data.slice(0, 6) : data;
}

function startNextCombine() {
  if (runnerState.qIdx >= sessionQueue.length) { finishSession(); return; }
  const id = sessionQueue[runnerState.qIdx];
  runnerState.sIdx = 0;
  sessionResults[id] = { cid: id, stationScores: [], score: 0 };
  renderRunner();
  goTo('s-runner');
}

function confirmQuit() {
  if (confirm('Quit? Completed combine scores will be saved.')) {
    sessionInProgress = false;
    clearActiveSession();
    Object.keys(sessionResults).length > 0 ? finishSession() : goHome();
  }
}

// ═══════════════════════════════════════════
//  RUNNER RENDER
// ═══════════════════════════════════════════
function renderRunner() {
  const id = sessionQueue[runnerState.qIdx];
  const stns = getStations(id);
  const stn = stns[runnerState.sIdx];
  const numStns = stns.length;
  const isGate = id === 'putting' && combineType === 'skill';
  const shots = isGate ? 3 : (combineVer === 'short' ? 2 : stn.shots || 3);

  document.getElementById('run-title').textContent = id === 'putting'
    ? (isGate ? '🎯 SKILL COMBINE' : '📊 PERFORMANCE COMBINE')
    : 'CHIPPING COMBINE';
  document.getElementById('run-prog').textContent = `${runnerState.qIdx + 1}/${sessionQueue.length} combines`;
  document.getElementById('run-pf').style.width = (runnerState.sIdx / numStns * 100) + '%';

  const res = sessionResults[id];
  if (!res.stationScores[runnerState.sIdx]) {
    const defaultClub = id === 'chipping' ? getClubPref(stns[runnerState.sIdx].distance) : '';
    res.stationScores[runnerState.sIdx] = {
      score: 0, shotResults: new Array(shots).fill(null),
      club: defaultClub, feltSlope: '', actualSlope: '', isGate
    };
  }
  const sd = res.stationScores[runnerState.sIdx];
  _gateLine = null; _gatePace = null;

  document.getElementById('station-wrap').innerHTML = buildStationHTML(stn, runnerState.sIdx, numStns, shots, sd, id);

  const isLast = runnerState.sIdx === numStns - 1;
  const isLastCombine = runnerState.qIdx === sessionQueue.length - 1;
  document.getElementById('btn-prev').style.display = runnerState.sIdx > 0 ? 'flex' : 'none';
  document.getElementById('btn-next').textContent = isLast ? (isLastCombine ? '✓ Finish' : 'Next Combine →') : 'Next Station →';
}

// Gate scoring helpers
function gateScore(code) {
  if (!code || !code.startsWith('G-')) return 0;
  const [, line, pace] = code.split('-');
  const lineOk = line === 'C', paceOk = pace === 'Z';
  return lineOk && paceOk ? 3 : (lineOk || paceOk) ? 1 : 0;
}

function buildGatePuttScore(sd, shots) {
  const logged = sd.shotResults.filter(Boolean).length;
  const maxPts = shots * 3;
  const curPts = sd.shotResults.reduce((a, r) => a + (r ? gateScore(r) : 0), 0);
  const GLABELS = {
    'G-C-Z':'✓·✓','G-C-S':'✓·↓','G-C-P':'✓·↑',
    'G-L-Z':'←·✓','G-L-S':'←·↓','G-L-P':'←·↑',
    'G-R-Z':'→·✓','G-R-S':'→·↓','G-R-P':'→·↑'
  };
  const dotCls = r => { const s=gateScore(r); return 'gdot '+(s===3?'g30':s===1?'g10':'g00'); };
  const dots = sd.shotResults.map((r,i) => {
    const isNext = !r && logged === i;
    const cls = r ? dotCls(r) : (isNext ? 'gdot act' : 'gdot');
    return `<div class="${cls}">${r ? (GLABELS[r]||'?') : (i+1)}</div>`;
  }).join('');
  const lb = (v,lbl,type) => `<button class="gbtn${type==='line'&&_gateLine===v?' sel-line':type==='pace'&&_gatePace===v?' sel-pace':''}" onclick="selGate${type==='line'?'Line':'Pace'}('${v}')">${lbl}</button>`;
  let prevHTML = '';
  if (_gateLine || _gatePace) {
    const ll = {L:'← Left',C:'● Center',R:'→ Right'}[_gateLine]||'—';
    const pl = {S:'↓ Short',Z:'✓ Zone',P:'↑ Past'}[_gatePace]||'—';
    const ps = (_gateLine&&_gatePace) ? gateScore(`G-${_gateLine}-${_gatePace}`) : '—';
    const pc = ps===3?'var(--gr)':ps===1?'var(--g)':'var(--re)';
    prevHTML = `<div class="gate-preview"><div><div class="gate-prev-lbl">Line: <b style="color:var(--bl)">${ll}</b> &nbsp;·&nbsp; Pace: <b style="color:var(--g)">${pl}</b></div></div><div style="font-family:var(--fm);font-size:20px;color:${pc}">${ps==='—'?'—':ps+' pt'+(ps!==1?'s':'')}</div></div>`;
  }
  return `<div class="scorezone">
    <div style="font-family:var(--fc);font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--d);margin-bottom:8px">🎯 Log each shot — select line AND pace:</div>
    <div style="font-family:var(--fc);font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--bl);margin-bottom:6px">Line — through the gate?</div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-bottom:12px">
      ${lb('L','← Left','line')}${lb('C','● Center','line')}${lb('R','→ Right','line')}
    </div>
    <div style="font-family:var(--fc);font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--g);margin-bottom:6px">Pace — where did it stop?</div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-bottom:10px">
      ${lb('S','↓ Short','pace')}${lb('Z','✓ In Zone','pace')}${lb('P','↑ Past','pace')}
    </div>
    ${prevHTML}
    <button class="gate-submit${(_gateLine&&_gatePace)?' ready':''}" onclick="submitGateShot()">Log Shot</button>
    <div style="display:flex;gap:6px;align-items:center;margin-bottom:10px">
      <div style="display:flex;gap:5px">${dots}</div>
      <button class="btn gh sm" onclick="undoGateShot()" style="margin-left:auto">↩ Undo</button>
    </div>
    <div class="scoredisp"><div class="scorebig" style="color:${curPts>=maxPts*.67?'var(--gr)':curPts>=maxPts*.34?'var(--g)':'var(--re)'}">${curPts}/${maxPts}</div><div class="scorelbl">pts (✓+✓=3 · one right=1 · both wrong=0)</div></div>
  </div>`;
}

function buildPerfPuttScore(sd, shots) {
  const MISS_LABELS = {'S-L':'↙','S-C':'↓','S-R':'↘','L-L':'↖','L-C':'↑','L-R':'↗'};
  const dots = sd.shotResults.map((r,i) => {
    const isMade = r==='made', isMiss = r&&r!=='made';
    const isNext = !r && sd.shotResults.filter(Boolean).length===i;
    const cls = 'pdot'+(isMade?' made':isMiss?' miss':isNext?' act':'');
    return `<div class="${cls}" title="${r||''}">${isMade?'✓':isMiss?(MISS_LABELS[r]||'✕'):(i+1)}</div>`;
  }).join('');
  return `<div class="scorezone">
    <button class="made-btn" onclick="logPutt('made')">✓ &nbsp;Made It</button>
    <div class="miss-lbl">Or log a miss — select both:</div>
    <div class="miss-lbl" style="color:var(--or);margin-top:4px">Distance</div>
    <div class="miss-row" style="grid-template-columns:1fr 1fr">
      <button class="miss-btn" id="md-S" onclick="selDist('S')">↓ Short</button>
      <button class="miss-btn" id="md-L" onclick="selDist('L')">↑ Long</button>
    </div>
    <div class="miss-lbl" style="color:var(--re)">Direction</div>
    <div class="miss-row">
      <button class="miss-btn" id="mr-L" onclick="selDir('L')">← Left</button>
      <button class="miss-btn" id="mr-C" onclick="selDir('C')">● Center</button>
      <button class="miss-btn" id="mr-R" onclick="selDir('R')">→ Right</button>
    </div>
    <button class="submit-miss" id="submit-miss" onclick="submitMiss()">Log Miss</button>
    <div style="margin-top:12px;display:flex;justify-content:space-between;align-items:center">
      <div class="pdots" style="margin-bottom:0">${dots}</div>
      <button class="btn gh sm" onclick="undoPutt()">↩ Undo</button>
    </div>
    <div class="scoredisp" style="margin-top:12px"><div class="scorebig">${sd.score}/${shots}</div><div class="scorelbl">Makes this station</div></div>
  </div>`;
}

function buildStationHTML(stn, sIdx, total, shots, sd, cid) {
  const gateSetup = (cid==='putting' && sd.isGate) ? [
    'Remove the flag from the hole.',
    'Place 2 tees cup-width (4.25") at the near edge of the hole.',
    'Place 1 back tee 18" behind the hole (12" for downhill stations).',
    'Goal: pass through the gate AND stop before the back tee.'
  ] : [];
  const allSetup = [...gateSetup, ...stn.setup];
  const setupHTML = allSetup.map((s,i) =>
    `<li${i<gateSetup.length?' style="color:var(--g);font-weight:600"':''} >${s}</li>`
  ).join('');

  let scoreHTML = '';
  if (cid === 'putting') {
    scoreHTML = sd.isGate ? buildGatePuttScore(sd, shots) : buildPerfPuttScore(sd, shots);
    if (CU?.aimpointMode) scoreHTML += buildAPZone(sd);
  } else {
    const dots = sd.shotResults.map((r,i) => {
      const active = !r && sd.shotResults.filter(Boolean).length===i;
      return `<div class="cdot ${r||''} ${active?'act':''}">${i+1}</div>`;
    }).join('');
    const chipPts = sd.shotResults.reduce((a,r) => a+({z1:5,z2:3,z3:1,z4:0}[r]||0), 0);
    const maxPts = shots * 5;
    scoreHTML = `<div class="scorezone">
      <div class="fld"><label>Club Used</label>
        <select class="sel" id="club-sel" onchange="setClub(this.value)">
          <option value="">Select club...</option>
          <option value="7i" ${sd.club==='7i'?'selected':''}>7-Iron</option>
          <option value="8i" ${sd.club==='8i'?'selected':''}>8-Iron</option>
          <option value="9i" ${sd.club==='9i'?'selected':''}>9-Iron</option>
          <option value="PW" ${sd.club==='PW'?'selected':''}>Pitching Wedge (~46°)</option>
          <option value="GW" ${sd.club==='GW'?'selected':''}>Gap Wedge (~50°)</option>
          <option value="52" ${sd.club==='52'?'selected':''}>52° Wedge</option>
          <option value="54" ${sd.club==='54'?'selected':''}>54° Wedge</option>
          <option value="SW" ${sd.club==='SW'?'selected':''}>Sand Wedge (~56°)</option>
          <option value="58" ${sd.club==='58'?'selected':''}>58° Wedge</option>
          <option value="60" ${sd.club==='60'?'selected':''}>60° Lob Wedge</option>
        </select>
      </div>
      <div style="font-family:var(--fc);font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:var(--d);margin-bottom:8px">Tap proximity for each chip:</div>
      <div class="chipgrid">
        <button class="crb z1" onclick="logChip('z1')"><div class="ri">🎯</div>&lt;3ft</button>
        <button class="crb z2" onclick="logChip('z2')"><div class="ri">✅</div>3–6ft</button>
        <button class="crb z3" onclick="logChip('z3')"><div class="ri">⚠️</div>6–12ft</button>
        <button class="crb z4" onclick="logChip('z4')"><div class="ri">❌</div>Miss</button>
      </div>
      <div class="cdots">${dots}</div>
      <div class="scoredisp"><div class="scorebig" style="color:${chipPts>=maxPts*.67?'var(--gr)':chipPts>=maxPts*.34?'var(--g)':'var(--re)'}">${chipPts}/${maxPts}</div><div class="scorelbl">Proximity pts (5/3/1/0)</div></div>
      <button class="btn gh sm" onclick="undoChip()" style="margin-top:4px">↩ Undo Last</button>
    </div>`;
  }

  return `<div class="scard">
    <div class="shdr">
      <div class="snum">Station ${sIdx+1} of ${total} · ${shots} shots${sd.isGate?' · 🎯 Gate':''}</div>
      <div class="snam">${stn.name}</div>
      <div class="ssub">${stn.sub}</div>
    </div>
    <div class="ssetup">
      <div class="sslbl">📍 Setup Instructions</div>
      <ul class="ssteps">${setupHTML}</ul>
    </div>
    <div class="tipbox">
      <div class="tipico">💡</div>
      <div><div class="tiptxt">${stn.tip}</div><a class="tiplink" href="${stn.video}" target="_blank">Watch Video</a></div>
    </div>
    ${scoreHTML}
  </div>`;
}

function buildAPZone(sd) {
  const slopes = ['0','0.5','1','1.5','2','2.5','3','3.5','4+'];
  const feltBtns = slopes.map(s => `<button class="slopebtn ${sd.feltSlope===s?'on':''}" onclick="setFelt('${s}')">${s}%</button>`).join('');
  const actBtns  = slopes.map(s => `<button class="slopebtn ${sd.actualSlope===s?'on':''}" onclick="setActual('${s}')">${s}%</button>`).join('');

  // Calibration feedback when both are set
  let calHTML = '';
  if (sd.feltSlope && sd.actualSlope) {
    const felt   = parseFloat(sd.feltSlope === '4+' ? '4' : sd.feltSlope);
    const actual = parseFloat(sd.actualSlope === '4+' ? '4' : sd.actualSlope);
    const diff   = Math.abs(felt - actual);
    const under  = felt < actual;
    let cls, ico, msg;
    if (diff === 0) {
      cls='exact'; ico='🎯'; msg='Perfect read — exactly right';
    } else if (diff <= 0.5) {
      cls='close'; ico='✅'; msg=`Close — ${under?'slightly under':'slightly over'} by 0.5%`;
    } else if (diff <= 1.0) {
      cls='close'; ico='⚠️'; msg=`Off by ${diff}% — you ${under?'under':'over'}-read the slope`;
    } else {
      cls='off'; ico='❌'; msg=`Off by ${diff}% — you significantly ${under?'under':'over'}-read`;
    }
    const sign = felt < actual ? '−' : '+';
    calHTML = `<div class="ap-result ${cls}">
      <div class="ap-result-ico">${ico}</div>
      <div class="ap-result-txt">${msg}</div>
      <div class="ap-result-diff">${sign}${diff}%</div>
    </div>`;
  }

  return `<div class="apzone">
    <div class="aplbl">📐 AimPoint Mode</div>
    <div style="font-family:var(--fc);font-size:11px;color:var(--d);margin-bottom:6px">1. FEEL SLOPE WITH FEET (log first)</div>
    <div class="slopegrid" style="margin-bottom:10px">${feltBtns}</div>
    <div style="font-family:var(--fc);font-size:11px;color:var(--d);margin-bottom:6px">2. VERIFY WITH TOOL (log after measuring)</div>
    <div class="slopegrid" style="margin-bottom:6px">${actBtns}</div>
    ${calHTML}
  </div>`;
}

// ═══════════════════════════════════════════
//  SCORE LOGGING
// ═══════════════════════════════════════════
function getCurSD() {
  const id = sessionQueue[runnerState.qIdx];
  return sessionResults[id].stationScores[runnerState.sIdx];
}

// Gate temp selection state
let _gateLine = null;
let _gatePace = null;

function selGateLine(v) {
  _gateLine = (_gateLine === v) ? null : v;
  renderRunner(); saveActiveSession();
}
function selGatePace(v) {
  _gatePace = (_gatePace === v) ? null : v;
  renderRunner(); saveActiveSession();
}
function submitGateShot() {
  if (!_gateLine || !_gatePace) return;
  const sd = getCurSD();
  const next = sd.shotResults.findIndex(r => r === null);
  if (next === -1) return;
  const code = `G-${_gateLine}-${_gatePace}`;
  sd.shotResults[next] = code;
  sd.score = sd.shotResults.reduce((a, r) => a + (r ? gateScore(r) : 0), 0);
  _gateLine = null; _gatePace = null;
  renderRunner(); saveActiveSession();
}
function undoGateShot() {
  const sd = getCurSD();
  const last = sd.shotResults.map((r,i) => r!==null?i:-1).filter(i=>i>=0).pop();
  if (last === undefined) return;
  sd.shotResults[last] = null;
  sd.score = sd.shotResults.reduce((a, r) => a + (r ? gateScore(r) : 0), 0);
  _gateLine = null; _gatePace = null;
  renderRunner(); saveActiveSession();
}

// Performance putting temp state
let _missDist = null;
let _missDir  = null;

// Per-distance club preferences - persisted to user profile
// Keys are yard distances: '5','10','20','30'
function getClubPref(distYards) {
  return (CU?.clubPrefs || {})[distYards] || '';
}
function saveClubPref(distYards, club) {
  if (!CU) return;
  CU.clubPrefs = CU.clubPrefs || {};
  CU.clubPrefs[distYards] = club;
  saveU(CU);
}

function selDist(v) {
  _missDist = (_missDist === v) ? null : v;
  ['S','L'].forEach(d => {
    const el = document.getElementById('md-' + d);
    if (el) el.classList.toggle('sel-dist', _missDist === d);
  });
  _checkMissReady();
}

function selDir(v) {
  _missDir = (_missDir === v) ? null : v;
  ['L','C','R'].forEach(d => {
    const el = document.getElementById('mr-' + d);
    if (el) el.classList.toggle('sel-dir', _missDir === d);
  });
  _checkMissReady();
}

function _checkMissReady() {
  const btn = document.getElementById('submit-miss');
  if (!btn) return;
  const ready = _missDist !== null && _missDir !== null;
  btn.classList.toggle('ready', ready);
}

function submitMiss() {
  if (!_missDist || !_missDir) return;
  const sd = getCurSD();
  const next = sd.shotResults.findIndex(r => r === null);
  if (next === -1) return;
  // Store as "dist-dir" e.g. "S-L", "L-R", "C-C"
  const code = _missDist + '-' + _missDir;
  sd.shotResults[next] = code;
  // Made stays 0 — miss adds nothing to score
  _missDist = null;
  _missDir  = null;
  renderRunner(); saveActiveSession();
}

function logPutt(result) {
  // 'made' only — misses go through submitMiss()
  const sd = getCurSD();
  const next = sd.shotResults.findIndex(r => r === null);
  if (next === -1) return;
  sd.shotResults[next] = result;
  if (result === 'made') sd.score++;
  _missDist = null;
  _missDir  = null;
  renderRunner(); saveActiveSession();
}

function undoPutt() {
  const sd = getCurSD();
  const last = sd.shotResults.map((r, i) => r !== null ? i : -1).filter(i => i >= 0).pop();
  if (last === undefined) return;
  if (sd.shotResults[last] === 'made') sd.score--;
  sd.shotResults[last] = null;
  _missDist = null;
  _missDir  = null;
  renderRunner(); saveActiveSession();
}

function logChip(zone) {
  const sd = getCurSD();
  const next = sd.shotResults.findIndex(r => r === null);
  if (next === -1) return;
  sd.shotResults[next] = zone;
  sd.score += { z1: 5, z2: 3, z3: 1, z4: 0 }[zone] || 0;
  renderRunner(); saveActiveSession();
}

function undoChip() {
  const sd = getCurSD();
  const last = sd.shotResults.map((r, i) => r !== null ? i : -1).filter(i => i >= 0).pop();
  if (last === undefined) return;
  sd.score -= { z1: 5, z2: 3, z3: 1, z4: 0 }[sd.shotResults[last]] || 0;
  sd.shotResults[last] = null;
  renderRunner(); saveActiveSession();
}

function setClub(v) {
  const sd = getCurSD();
  sd.club = v;
  // Save preference for this distance so future stations pre-select it
  const id = sessionQueue[runnerState.qIdx];
  const stn = getStations(id)[runnerState.sIdx];
  if (stn?.distance) saveClubPref(stn.distance, v);
}
function setFelt(v) { getCurSD().feltSlope = v; renderRunner(); }
function setActual(v) { getCurSD().actualSlope = v; renderRunner(); }

// ═══════════════════════════════════════════
//  STATION NAVIGATION
// ═══════════════════════════════════════════
function nextStn() {
  const id = sessionQueue[runnerState.qIdx];
  const stns = getStations(id);
  if (runnerState.sIdx === stns.length - 1) {
    const res = sessionResults[id];
    res.score = res.stationScores.reduce((a, s) => a + (s?.score || 0), 0);
    runnerState.qIdx++;
    runnerState.sIdx = 0;
    startNextCombine();
  } else {
    runnerState.sIdx++;
    renderRunner();
  }
  saveActiveSession();
}

function prevStn() {
  if (runnerState.sIdx > 0) { runnerState.sIdx--; renderRunner(); saveActiveSession(); }
}

// ═══════════════════════════════════════════
//  FINISH SESSION
// ═══════════════════════════════════════════
function finishSession() {
  sessionInProgress = false;
  clearActiveSession();
  const results = Object.values(sessionResults);
  if (!results.length) { goHome(); return; }
  results.forEach(r => { if (!r.score) r.score = r.stationScores.reduce((a, s) => a + (s?.score || 0), 0); });
  const session = { date: Date.now(), ver: combineVer, sessionType, combineType, results };
  CU.sessions = CU.sessions || [];
  CU.sessions.push(session);
  saveU(CU);
  buildResults(session);
  goTo('s-results');
  refreshHome();
}

function buildResults(session) {
  const dateStr = new Date(session.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  document.getElementById('res-date').textContent = dateStr;

  const isGateSession = session.combineType === 'skill';

  const total = session.results.reduce((a, r) => a + r.score, 0);
  const maxTotal = session.results.reduce((a, r) => {
    const stns = r.cid === 'putting' ? PUTTING : CHIPPING;
    const stnCount = r.stationScores?.length || stns.length;
    const isGate = isGateSession && r.cid === 'putting';
    const shots = isGate ? 3 : (session.ver === 'short' ? 2 : 3);
    return a + stnCount * (isGate ? 3 : r.cid === 'putting' ? shots : shots * 5);
  }, 0);

  document.getElementById('res-score').textContent = total;
  document.getElementById('res-max').textContent = 'out of ' + maxTotal;

  const cont = document.getElementById('res-combines');
  cont.innerHTML = '';
  session.results.forEach(r => {
    const isGate = isGateSession && r.cid === 'putting';
    const stnCount = r.stationScores?.length || (r.cid === 'putting' ? PUTTING.length : CHIPPING.length);
    const shots = isGate ? 3 : (session.ver === 'short' ? 2 : 3);
    const maxS = stnCount * (isGate ? 3 : r.cid === 'putting' ? shots : shots * 5);
    const pct = maxS > 0 ? r.score / maxS : 0;
    const col = pct >= .75 ? 'var(--gr)' : pct >= .55 ? 'var(--g)' : pct >= .35 ? 'var(--or)' : 'var(--re)';
    const rat = pct >= .75 ? 'Strong 💪' : pct >= .55 ? 'Good 👍' : pct >= .35 ? 'Average' : 'Needs Work';
    const ico = r.cid === 'putting' ? '⛳' : '🏌️';
    const nm = r.cid === 'putting'
      ? (isGate ? '🎯 Putting — Skill Combine' : '📊 Putting — Performance')
      : 'Chipping Combine';

    // Station breakdown
    const stnList = r.cid === 'putting' ? PUTTING : CHIPPING;
    let stnsHTML = '';
    (r.stationScores || []).forEach((ss, i) => {
      const stn = stnList[i];
      if (!stn) return;
      const s = ss?.score || 0;
      const mx = isGate ? (ss?.shotResults?.length || shots) * 3 : shots * (r.cid === 'putting' ? 1 : 5);
      // For gate: show line and pace breakdown
      let detail = `${s}/${mx}`;
      if (isGate && ss?.shotResults) {
        const shots2 = ss.shotResults.filter(Boolean);
        const lineC = shots2.filter(r => r?.split('-')[1] === 'C').length;
        const paceZ = shots2.filter(r => r?.split('-')[2] === 'Z').length;
        const tot = shots2.length;
        if (tot > 0) detail = `${s}pts · L:${lineC}/${tot} P:${paceZ}/${tot}`;
      }
      stnsHTML += `<div class="rstnr"><div class="rstnl">${stn.name.split(' — ')[0]}</div><div class="rstns2">${detail}</div></div>`;
    });

    cont.innerHTML += `<div class="rcomb">
      <div class="rchdr"><div class="rcnam">${ico} ${nm}</div><div class="rcscr">${r.score}/${maxS}</div></div>
      <div class="rbar"><div class="rbarw"><div class="rbarf" style="width:${pct*100}%;background:${col}"></div></div><div class="rrat" style="color:${col}">${rat}</div></div>
      ${isGate ? `<div style="font-family:var(--fb);font-size:11px;color:var(--d);padding:6px 16px">L = Line through gate · P = Pace in zone · pts = 3+3+3 max per station</div>` : ''}
      <div class="rstns">${stnsHTML}</div>
    </div>`;
  });
}

function shareResults() {
  if (!CU) return;
  const s = CU.sessions[CU.sessions.length - 1];
  if (!s) return;
  const dateStr = new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  let text = `⛳ The Range — Practice Session\n📅 ${dateStr}\n👤 ${CU.name} (Hdcp: ${hcpLbl(CU.hcp)})\n\n`;
  s.results.forEach(r => {
    text += `${r.cid === 'putting' ? '⛳' : '🏌️'} ${r.cid === 'putting' ? 'Putting' : 'Chipping'}: ${r.score} pts\n`;
  });
  text += '\nkmansgolf.github.io/range';
  window.open('sms:?body=' + encodeURIComponent(text), '_blank');
}

// ═══════════════════════════════════════════
//  HISTORY
// ═══════════════════════════════════════════
function buildHistory() {
  const cont = document.getElementById('hist-list');
  const sessions = (CU?.sessions || []).slice().reverse();
  if (!sessions.length) {
    cont.innerHTML = `<div class="emp"><div class="emp-i">📋</div><div class="emp-t">No sessions yet</div><div class="emp-s">Complete a session to see your history here.</div></div>`;
    return;
  }

  const allSessions = (CU?.sessions || []);

  function trendFor(session, cid) {
    const idx = allSessions.indexOf(session);
    if (idx < 1) return null;
    const cur = session.results?.find(r => r.cid === cid);
    if (!cur) return null;
    // Only compare against same combine type for putting
    const sameCT = cid === 'putting'
      ? allSessions.slice(0, idx).filter(s => (s.combineType || 'skill') === (session.combineType || 'skill'))
      : allSessions.slice(0, idx);
    const priorScores = sameCT.flatMap(s => s.results || []).filter(r => r.cid === cid).map(r => r.score);
    if (!priorScores.length) return null;
    const avg = priorScores.reduce((a, b) => a + b, 0) / priorScores.length;
    const diff = cur.score - avg;
    if (diff > 1.5) return 'up';
    if (diff < -1.5) return 'dn';
    return 'eq';
  }

  cont.innerHTML = '';
  sessions.forEach(s => {
    const dateStr = new Date(s.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    const v = s.ver === 'short' ? 'Short' : 'Full';
    const isGate = s.combineType === 'skill';

    const chips = (s.results || []).map(r => {
      const ico  = r.cid === 'putting' ? '⛳' : '🏌️';
      const nm   = r.cid === 'putting' ? 'Putting' : 'Chipping';
      const trend = trendFor(s, r.cid);
      const trendHTML = trend === 'up' ? '<span class="trend-up">↑</span>'
                      : trend === 'dn' ? '<span class="trend-dn">↓</span>'
                      : trend === 'eq' ? '<span class="trend-eq">→</span>' : '';
      // Show gate badge on putting chips
      const gateTag = (r.cid === 'putting' && isGate)
        ? '<span style="font-family:var(--fc);font-size:9px;color:var(--g);margin-left:4px">🎯</span>' : '';
      return `<div class="hschip">${ico} ${nm}${gateTag} <span class="hschipsc">${r.score}</span>${trendHTML}</div>`;
    }).join('');

    const typeTag = s.sessionType === 'skillimprove'
      ? '<span style="font-family:var(--fc);font-size:10px;color:var(--gr);font-weight:700;margin-left:6px">Skill</span>'
      : '';

    cont.innerHTML += `<div class="hse">
      <div class="hshdr"><div class="hsdate">${dateStr}${typeTag}</div><div class="hsmeta">${v}${isGate ? ' · 🎯 Gate' : ' · 📊 Perf'}</div></div>
      <div class="hschips">${chips || '<span style="font-family:var(--fc);font-size:12px;color:var(--d)">No combines</span>'}</div>
    </div>`;
  });
}

// ═══════════════════════════════════════════
//  PROFILE
// ═══════════════════════════════════════════
function openGames() {
  navTo('s-games', 'tab-games');
}

function buildProfile() {
  if (!CU) return;
  const ini = CU.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  document.getElementById('prof-av').textContent = ini;
  document.getElementById('prof-nm').textContent = CU.name;
  document.getElementById('prof-mt').textContent = `Handicap: ${hcpLbl(CU.hcp)} · @${CU.username}`;
  document.getElementById('prof-hcp').value = CU.hcp;
  document.getElementById('ap-tog').classList.toggle('on', !!CU.aimpointMode);

  // AimPoint stats card
  const apCard = document.getElementById('ap-stats-card');
  const apBody = document.getElementById('ap-stats-body');
  if (CU.aimpointMode) {
    apCard.style.display = 'block';
    const sessions = CU.sessions || [];
    const weight = calcSessionWeight(sessions);
    if (weight < P2_THRESHOLD_PTS) {
      apBody.innerHTML = `<div style="font-family:var(--fb);font-size:13px;color:var(--d);line-height:1.5">Complete ${P2_THRESHOLD_PTS} session points to unlock AimPoint calibration stats.</div>`;
    } else {
      const profile = calcSkillProfile(sessions, CU.hcp);
      const ap = profile.apCalibration;
      if (ap.errCount < 5) {
        apBody.innerHTML = `<div style="font-family:var(--fb);font-size:13px;color:var(--d);line-height:1.5">Log slope % on at least 5 putting stations to see calibration stats. You have ${ap.errCount} so far.</div>`;
      } else {
        const tendencyLabel = ap.tendency === 'under-reader'
          ? '📉 You tend to <strong style="color:var(--re)">under-read slopes</strong> — your feet feel less break than is actually there'
          : ap.tendency === 'over-reader'
          ? '📈 You tend to <strong style="color:var(--or)">over-read slopes</strong> — your feet feel more break than is actually there'
          : '✅ Your reads are <strong style="color:var(--gr)">well calibrated</strong> — no consistent bias detected';
        const ratingColor = ap.rating === 'strength' ? 'var(--gr)' : ap.rating === 'ontrack' ? 'var(--g)' : 'var(--re)';
        apBody.innerHTML = `
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
            <div>
              <div style="font-family:var(--fm);font-size:36px;color:${ratingColor};line-height:1">±${ap.val.toFixed(2)}%</div>
              <div style="font-family:var(--fc);font-size:11px;color:var(--d);letter-spacing:1px;text-transform:uppercase;margin-top:2px">avg slope error</div>
            </div>
            <div style="text-align:right">
              <div style="font-family:var(--fm);font-size:20px;color:var(--g)">${ap.errCount}</div>
              <div style="font-family:var(--fc);font-size:11px;color:var(--d);letter-spacing:1px;text-transform:uppercase">readings</div>
            </div>
          </div>
          <div style="font-family:var(--fb);font-size:13px;color:var(--w);line-height:1.5;margin-bottom:10px">${tendencyLabel}</div>
          <div style="background:var(--nm);border-radius:8px;padding:10px 12px">
            <div style="font-family:var(--fc);font-size:11px;color:var(--d);letter-spacing:1px;text-transform:uppercase;margin-bottom:6px">Target for your handicap</div>
            <div style="font-family:var(--fb);font-size:13px;color:var(--w)">Average error below <strong style="color:var(--g)">±${ap.bench.toFixed(1)}%</strong> — keep guessing first, then verify.</div>
          </div>`;
      }
    }
  } else {
    apCard.style.display = 'none';
  }
}

function toggleTheme() {
  const current = localStorage.getItem('range_theme') || 'dark';
  applyTheme(current === 'light' ? 'dark' : 'light');
}

function applyTheme(theme) {
  const isLight = theme === 'light';
  const app = document.getElementById('app');
  const meta = document.getElementById('theme-meta');

  if (isLight) {
    app.setAttribute('data-theme', 'light');
    if (meta) meta.setAttribute('content', '#f2f2f4');
  } else {
    app.removeAttribute('data-theme');
    if (meta) meta.setAttribute('content', '#0d2340');
  }

  // Sync all theme button labels
  const label = isLight ? '🌙 Dark' : '☀️ Light';
  ['theme-btn', 'theme-btn-login'].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) btn.textContent = label;
  });

  // Sync profile toggle state
  const tog = document.getElementById('theme-tog');
  if (tog) tog.classList.toggle('on', isLight);
  const lbl = document.getElementById('theme-lbl');
  const sub = document.getElementById('theme-sub');
  if (lbl) lbl.textContent = isLight ? '🌙 Light Mode' : '🌙 Light Mode';
  if (sub) sub.textContent = isLight ? 'On — easier to read in bright sunlight' : 'Off — tap to switch for outdoor use';

  localStorage.setItem('range_theme', theme);
}

function togAimpoint() {
  if (!CU) return;
  CU.aimpointMode = !CU.aimpointMode;
  saveU(CU); buildProfile();
}

function saveHcp() {
  if (!CU) return;
  CU.hcp = parseInt(document.getElementById('prof-hcp').value);
  saveU(CU); buildProfile(); refreshHome(); alert('Handicap updated!');
}

function savePin() {
  const p1 = document.getElementById('pin1').value;
  const p2 = document.getElementById('pin2').value;
  if (!/^\d{4}$/.test(p1)) { alert('PIN must be 4 digits.'); return; }
  if (p1 !== p2) { alert('PINs do not match.'); return; }
  CU.pin = hashPin(p1); saveU(CU);
  document.getElementById('pin1').value = '';
  document.getElementById('pin2').value = '';
  alert('PIN updated!');
}

function resumeSession() {
  setActiveTab('tab-practice');
  renderRunner();
  goTo('s-runner');
}

function goHome() {
  sessionInProgress = false;
  clearActiveSession();
  setActiveTab('tab-home');
  refreshHome();
  goTo('s-home');
}

document.addEventListener('DOMContentLoaded', () => {
  // Apply saved theme immediately — before login, so returning users see correct theme on login screen
  applyTheme(localStorage.getItem('range_theme') || 'dark');

  // Initialise Tempo UI (builds preset grid, sets display values)
  t_buildPresetGrid();
  t_updateDisplay();

  // Initialise Games list so it's ready when user navigates
  renderGamesList();

  // Rehydrate session after pull-to-refresh or page reload
  const savedUser = sessionStorage.getItem('range_session_user');
  if (savedUser) {
    const d = loadU(savedUser);
    if (d) {
      CU = d;
      // Handle ?tab= param (e.g. returning from Games page)
      const tab = new URLSearchParams(location.search).get('tab');
      enterApp(tab);
      return;
    } else {
      sessionStorage.removeItem('range_session_user');
    }
  }

  goTo('s-login');
});



// ═══════════════════════════════════════════
//  EXPORT / IMPORT / TEST DATA
// ═══════════════════════════════════════════
function exportData() {
  if (!CU) return;
  const blob = new Blob([JSON.stringify(CU, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const date = new Date().toISOString().split('T')[0];
  a.href = url;
  a.download = `range-${CU.username}-${date}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importData() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target.result);
        if (!data.username || !data.pin) throw new Error('Invalid file');
        if (!confirm('This will overwrite your current data. Continue?')) return;
        saveU(data);
        CU = data;
        refreshHome();
        buildProfile();
        document.getElementById('import-status').textContent = '✅ Data restored successfully.';
        document.getElementById('import-status').style.color = 'var(--gr)';
      } catch {
        document.getElementById('import-status').textContent = '❌ Invalid file. Export from The Range only.';
        document.getElementById('import-status').style.color = 'var(--re)';
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

function loadTestData() {
  if (!CU) return;
  if (!confirm('Load demo session data into your account? This adds 8 practice sessions for testing.')) return;

  const DAY = 86400000;
  const now = Date.now();
  const ps = (shots, score) => ({ score, shotResults: shots, club: '', feltSlope: '', actualSlope: '', isGate: false });
  const ZONE_PTS = { z1:5, z2:3, z3:1, z4:0 };
  const cs = (shots, club) => ({ score: shots.reduce((a,z)=>a+(ZONE_PTS[z]||0),0), shotResults: shots, club, feltSlope:'', actualSlope:'' });

  const testSessions = [
    { date: now-21*DAY, ver:'short', sessionType:'standard', combineType:'skill', results:[
      { cid:'putting', score:7, stationScores:[ps(['made','made'],2),ps(['made','S-L'],1),ps(['C-R','made'],1),ps(['made','made'],2),ps(['S-C','made'],1),ps(['S-L','S-C'],0)] },
      { cid:'chipping', score:27, stationScores:[cs(['z1','z2'],'60'),cs(['z2','z3'],'SW'),cs(['z2','z1'],'SW'),cs(['z3','z3'],'SW'),cs(['z2','z3'],'SW'),cs(['z4','z3'],'SW')] }
    ]},
    { date: now-18*DAY, ver:'short', sessionType:'standard', combineType:'skill', results:[
      { cid:'putting', score:4, stationScores:[ps(['made','S-L'],1),ps(['S-C','S-C'],0),ps(['C-R','S-C'],0),ps(['made','made'],2),ps(['S-L','S-C'],0),ps(['S-C','made'],1)] },
      { cid:'chipping', score:24, stationScores:[cs(['z2','z3'],'60'),cs(['z3','z3'],'SW'),cs(['z1','z3'],'SW'),cs(['z3','z4'],'SW'),cs(['z2','z3'],'SW'),cs(['z3','z4'],'SW')] }
    ]},
    { date: now-15*DAY, ver:'short', sessionType:'standard', combineType:'skill', results:[
      { cid:'putting', score:8, stationScores:[ps(['made','made'],2),ps(['made','made'],2),ps(['C-R','made'],1),ps(['made','made'],2),ps(['S-C','made'],1),ps(['S-L','S-C'],0)] },
      { cid:'chipping', score:29, stationScores:[cs(['z1','z1'],'60'),cs(['z2','z2'],'SW'),cs(['z2','z2'],'SW'),cs(['z2','z3'],'SW'),cs(['z3','z3'],'SW'),cs(['z3','z4'],'SW')] }
    ]},
    { date: now-12*DAY, ver:'long', sessionType:'standard', combineType:'performance', results:[
      { cid:'putting', score:13, stationScores:[ps(['made','made','made'],3),ps(['made','S-L','made'],2),ps(['C-R','made','made'],2),ps(['made','made','made'],3),ps(['S-C','made','S-L'],1),ps(['S-L','S-C','made'],1),ps(['made','S-R','made'],2),ps(['S-L','S-C','S-L'],0)] },
      { cid:'chipping', score:55, stationScores:[cs(['z1','z2','z1'],'60'),cs(['z2','z2','z3'],'SW'),cs(['z1','z2','z2'],'SW'),cs(['z3','z2','z3'],'SW'),cs(['z2','z3','z3'],'SW'),cs(['z4','z3','z3'],'SW'),cs(['z1','z2','z2'],'52'),cs(['z2','z3','z3'],'52')] }
    ]},
    { date: now-9*DAY, ver:'short', sessionType:'standard', combineType:'skill', results:[
      { cid:'putting', score:9, stationScores:[ps(['made','made'],2),ps(['made','made'],2),ps(['made','made'],2),ps(['made','made'],2),ps(['S-C','made'],1),ps(['S-L','S-C'],0)] },
      { cid:'chipping', score:31, stationScores:[cs(['z1','z1'],'60'),cs(['z2','z2'],'SW'),cs(['z2','z1'],'SW'),cs(['z2','z2'],'SW'),cs(['z3','z2'],'SW'),cs(['z3','z4'],'SW')] }
    ]},
    { date: now-7*DAY, ver:'short', sessionType:'skillimprove', combineType:'skill', results:[
      { cid:'putting', score:6, stationScores:[ps(['made','made'],2),ps(['S-L','made'],1),ps(['made','made'],2),ps(['made','S-L'],1),ps(['S-C','S-C'],0),ps(['S-L','S-C'],0)] },
      { cid:'chipping', score:28, stationScores:[cs(['z1','z2'],'60'),cs(['z2','z3'],'SW'),cs(['z2','z2'],'SW'),cs(['z3','z3'],'SW'),cs(['z2','z3'],'52'),cs(['z3','z4'],'SW')] }
    ]},
    { date: now-4*DAY, ver:'short', sessionType:'skillimprove', combineType:'skill', results:[
      { cid:'putting', score:10, stationScores:[ps(['made','made'],2),ps(['made','made'],2),ps(['made','made'],2),ps(['made','made'],2),ps(['S-C','made'],1),ps(['S-L','made'],1)] },
      { cid:'chipping', score:33, stationScores:[cs(['z1','z1'],'60'),cs(['z2','z2'],'SW'),cs(['z1','z2'],'SW'),cs(['z2','z2'],'SW'),cs(['z2','z2'],'52'),cs(['z3','z3'],'SW')] }
    ]},
    { date: now-2*DAY, ver:'short', sessionType:'skillimprove', combineType:'skill', results:[
      { cid:'putting', score:10, stationScores:[ps(['made','made'],2),ps(['made','S-L'],1),ps(['C-R','made'],1),ps(['made','made'],2),ps(['made','S-C'],1),ps(['S-L','S-C'],0)] },
      { cid:'chipping', score:34, stationScores:[cs(['z1','z2'],'60'),cs(['z2','z2'],'SW'),cs(['z1','z2'],'SW'),cs(['z2','z3'],'SW'),cs(['z2','z3'],'52'),cs(['z3','z4'],'SW')] }
    ]}
  ];

  CU.sessions = [...(CU.sessions || []), ...testSessions];
  if (!CU.clubPrefs) CU.clubPrefs = { 5:'60', 10:'SW', 20:'52', 30:'PW' };
  saveU(CU);
  refreshHome();
  buildProfile();
  document.getElementById('import-status').textContent = '✅ 8 test sessions loaded.';
  document.getElementById('import-status').style.color = 'var(--gr)';
}

// ═══════════════════════════════════════════
//  TEMPO UI
// ═══════════════════════════════════════════
function t_setMode(m) {
  const wasPlaying = t_playing || t_countingIn;
  if (wasPlaying) { t_haltAll(); t_syncPlayBtn(); }
  t_mode = m;
  ['full','short','putt'].forEach(id =>
    document.getElementById('t-mode-' + id).classList.toggle('active', id === m));
  t_presetIdx = Math.min(t_presetIdx, TEMPO_PRESETS[m].length - 1);
  t_buildPresetGrid();
  t_updateDisplay();
  if (wasPlaying) setTimeout(t_togglePlay, 120);
}

function t_buildPresetGrid() {
  const grid = document.getElementById('t-preset-grid');
  if (!grid) return;
  grid.innerHTML = TEMPO_PRESETS[t_mode].map((p, i) => `
    <button class="t-preset-btn ${i === t_presetIdx ? 'active' : ''}"
            onclick="t_selectPreset(${i})">
      <span class="t-preset-name">${p.name}</span>
      <span class="t-preset-time">${p.total.toFixed(2)}s</span>
    </button>
  `).join('');
}

function t_selectPreset(i) {
  const wasPlaying = t_playing || t_countingIn;
  if (wasPlaying) { t_haltAll(); t_syncPlayBtn(); }
  t_presetIdx = i;
  t_buildPresetGrid();
  t_updateDisplay();
  if (wasPlaying) setTimeout(t_togglePlay, 120);
}

function t_onGapSlider(val) {
  t_restGap = parseFloat(val);
  const el = document.getElementById('t-gap-display');
  if (el) el.textContent = t_restGap.toFixed(1) + 's';
}

function t_updateDisplay() {
  const total  = t_getTotalTime();
  const backMs = Math.round(t_getBackTime() * 1000);
  const downMs = Math.round(t_getDownTime() * 1000);
  const ratio  = t_getRatio();
  const preset = TEMPO_PRESETS[t_mode][t_presetIdx];
  const setTxt = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  setTxt('t-swing-time', total.toFixed(2));
  setTxt('t-swing-tag',  preset.name);
  setTxt('t-back-ms',    backMs);
  setTxt('t-down-ms',    downMs);
  setTxt('t-ratio',      ratio + ':1');
}

function t_setPhaseUI(phase) {
  ['takeaway','top','impact','rest'].forEach(p => {
    const el = document.getElementById('t-phase-' + p);
    if (el) el.classList.toggle('active', p === phase);
  });
}

function t_clearPhaseUI() {
  ['takeaway','top','impact','rest'].forEach(p => {
    const el = document.getElementById('t-phase-' + p);
    if (el) el.classList.remove('active');
  });
}

function t_setCountinUI(active) {
  const badge = document.getElementById('t-countin-badge');
  const pdisp = document.getElementById('t-phase-display');
  const btn   = document.getElementById('t-play-btn');
  const lbl   = document.getElementById('t-play-label');
  const svg   = document.getElementById('t-play-svg');
  if (!btn) return;
  if (active) {
    if (badge) badge.classList.add('visible');
    if (pdisp) pdisp.style.opacity = '0.3';
    btn.classList.add('counting');
    btn.classList.remove('playing');
    if (lbl) lbl.textContent = 'Stop';
    if (svg) svg.innerHTML = '<rect x="6" y="4" width="4" height="16" fill="currentColor"/><rect x="14" y="4" width="4" height="16" fill="currentColor"/>';
  } else {
    if (badge) badge.classList.remove('visible');
    if (pdisp) pdisp.style.opacity = '1';
    btn.classList.remove('counting');
  }
}

function t_syncPlayBtn() {
  // Syncs play button to stopped state — called after t_haltAll()
  t_clearPhaseUI();
  t_setCountinUI(false);
  const btn = document.getElementById('t-play-btn');
  const lbl = document.getElementById('t-play-label');
  const svg = document.getElementById('t-play-svg');
  if (!btn) return;
  btn.classList.remove('playing', 'counting');
  if (lbl) lbl.textContent = 'Start';
  if (svg) svg.innerHTML = '<polygon points="5 3 19 12 5 21 5 3" fill="currentColor"/>';
}

function t_togglePlay() {
  if (t_countingIn) { t_haltAll(); t_syncPlayBtn(); return; }

  t_playing = !t_playing;

  if (t_playing) {
    getAudioCtx().resume().then(() => {
      t_setCountinUI(true);
      t_startCountin((firstBeat) => {
        t_setCountinUI(false);
        const btn = document.getElementById('t-play-btn');
        if (btn) btn.classList.add('playing');
        t_scheduleCycle(firstBeat, t_setPhaseUI);
      });
    });
  } else {
    t_haltAll();
    t_syncPlayBtn();
  }
}

// ── SWIPE DOWN TO REFRESH ─────────────────────────────────────────────────────
(function(){
  const REFRESH_SCREENS = ['s-home','s-history'];
  let ty=0, ready=false;
  const ind=document.createElement('div');
  ind.style.cssText='position:fixed;top:0;left:0;right:0;height:44px;display:flex;align-items:center;justify-content:center;font-family:Barlow Condensed,sans-serif;font-size:11px;letter-spacing:2px;color:#3ddc84;background:rgba(0,0,0,0.92);transform:translateY(-44px);transition:transform 0.2s ease;z-index:9999;pointer-events:none;';
  ind.textContent='↓ RELEASE TO REFRESH';
  document.body.appendChild(ind);
  document.addEventListener('touchstart',e=>{ty=e.touches[0].clientY;},{passive:true});
  document.addEventListener('touchmove',e=>{
    const active=document.querySelector('.scr.on');
    if(!active||!REFRESH_SCREENS.includes(active.id)) return;
    const scroll=active.querySelector('.sb');
    if(scroll&&scroll.scrollTop>0) return;
    const dy=e.touches[0].clientY-ty;
    if(dy>60){ind.style.transform='translateY(0)';ready=true;}
    else{ind.style.transform='translateY(-44px)';ready=false;}
  },{passive:true});
  document.addEventListener('touchend',()=>{
    ind.style.transform='translateY(-44px)';
    if(ready){ready=false;setTimeout(()=>location.reload(),200);}
  });
})();


// ═══════════════════════════════════════════
//  GAMES — DATA & LOGIC
//  Migrated from range-games.html
// ═══════════════════════════════════════════

const GAMES = [
  {
    id: 'clock', name: 'Clock Face', icon: '🕐',
    tagline: 'Make all 12 putts in a row around the hole. Miss one — start over.',
    category: 'putting', solo: true, multi: false, time: '15 min',
    rules: [
      'Place 12 balls in a circle around the hole at 3 feet — one on each hour.',
      'Putt each ball in sequence around the clock, clockwise or counterclockwise.',
      'Make all 12 in a row without missing.',
      'Miss any putt and restart from ball 1.',
      'Track how many attempts it takes to complete the drill.',
    ],
    scoring: [
      { label: 'Complete the drill', value: '12/12 ✓' },
      { label: 'Restart counter', value: 'Tracked' },
      { label: 'Best score', value: 'Fewest attempts' },
    ],
    exit: 'Do not leave until you complete all 12 in a row at least once. Tour pros target completing it in under 3 attempts.',
    youtubeSearch: 'https://www.youtube.com/results?search_query=clock+face+putting+drill+golf',
    screen: 'clock',
  },
  {
    id: 'ladder', name: 'Ladder', icon: '🪜',
    tagline: 'Start at 3 feet. Make it, step back. Miss, restart from the beginning.',
    category: 'putting', solo: true, multi: false, time: '15 min',
    rules: [
      'Place a tee at 3 feet, 6 feet, and 10 feet from a hole.',
      'Start at 3 feet. Make it — advance to 6 feet.',
      'Make it — advance to 10 feet.',
      'Make all three in sequence to complete the ladder.',
      'Miss at any distance — restart from 3 feet.',
    ],
    scoring: [
      { label: '3 ft made', value: 'Advance →' },
      { label: '6 ft made', value: 'Advance →' },
      { label: '10 ft made', value: 'Complete ✓' },
      { label: 'Any miss', value: 'Restart from 3ft' },
    ],
    exit: 'Complete the full 3→6→10 foot sequence without missing. Track attempts. Goal: complete in under 5 attempts.',
    youtubeSearch: 'https://www.youtube.com/results?search_query=golf+ladder+putting+drill+pressure+3+6+10+feet',
    screen: 'ladder',
  },
  {
    id: 'molinari', name: "Molinari's 8", icon: '🎖️',
    tagline: 'Make 8 consecutive 5-foot putts. Used by Francesco Molinari before The Open.',
    category: 'putting', solo: true, multi: false, time: '10 min',
    rules: [
      'Place a tee at 5 feet from the hole.',
      'Putt one ball at a time through your full pre-shot routine.',
      'Make 8 consecutive putts without missing.',
      'Miss any putt — restart the count from 0.',
      'Record how many attempts to reach 8 in a row.',
    ],
    scoring: [
      { label: 'Target streak', value: '8 in a row' },
      { label: 'Miss', value: 'Restart count' },
      { label: 'Best score', value: 'Fewest attempts' },
    ],
    exit: "Complete 8 consecutive 5-foot putts. Molinari did it in 9 attempts before winning The Open. What's your number?",
    youtubeSearch: 'https://www.youtube.com/results?search_query=Molinari+consecutive+5+foot+putts+drill+golf+pressure',
    screen: 'clock',
  },
  {
    id: 'sevenup', name: '7 Up', icon: '7️⃣',
    tagline: 'Lag putting competition. Get closest to the hole or make it to score. First to 7 wins.',
    category: 'putting', solo: false, multi: true, time: '20 min',
    rules: [
      'Each player lags from 20+ feet to a hole.',
      'The player closest to the pin after all putts "controls" the hole.',
      'If the closest player can win a point if another player 3-putts.',
      'Hole-out on the first putt = 2 points instantly.',
      'First player to reach exactly 7 points wins.',
    ],
    scoring: [
      { label: 'Hole-out (1 putt)', value: '+2 pts' },
      { label: 'Closest + other 3-putts', value: '+1 pt' },
      { label: 'Target', value: 'Exactly 7 pts' },
    ],
    exit: 'First to reach exactly 7 points wins the game.',
    youtubeSearch: 'https://www.youtube.com/results?search_query=7+up+golf+putting+game+multiplayer',
    screen: 'points',
  },
  {
    id: 'twentyone', name: '21', icon: '🃏',
    tagline: 'Putt between two holes. Made putt = 3 pts, 2-putt = 1 pt. First to exactly 21.',
    category: 'putting', solo: false, multi: true, time: '20 min',
    rules: [
      'Pick two holes on the practice green.',
      'All players putt from one hole toward the other.',
      'Hole-out on first putt = 3 points.',
      'Two-putt = 1 point.',
      'Three-putt or worse = 0 points.',
      'After each player holes out, rotate and putt the other direction.',
      'First player to reach EXACTLY 21 wins. Go over — you bust and drop to 15.',
    ],
    scoring: [
      { label: '1-putt (hole-out)', value: '+3 pts' },
      { label: '2-putt', value: '+1 pt' },
      { label: '3-putt+', value: '0 pts' },
      { label: 'Bust over 21', value: 'Drop to 15' },
    ],
    exit: 'First player to reach exactly 21 wins.',
    youtubeSearch: 'https://www.youtube.com/results?search_query=golf+putting+game+21+points+two+holes',
    screen: 'points',
  },
  {
    id: 'par18', name: 'Par 18', icon: '⛳',
    tagline: 'Play 9 holes of par-2 chip-and-putt. Shoot 18 or better to win.',
    category: 'chipping', solo: true, multi: true, time: '25 min',
    rules: [
      'Select 9 locations around the green — 3 easy, 3 medium, 3 hard.',
      'Each location is a par 2: chip on, then putt out.',
      'Play one ball, go through your full routine on every shot.',
      'Chip-in = birdie (1). Up-and-down = par (2). Three shots = bogey (3).',
      'With a partner, alternate who picks each location.',
      'Add up your total strokes across all 9 holes.',
    ],
    scoring: [
      { label: 'Chip-in (birdie)', value: '1 stroke' },
      { label: 'Up-and-down (par)', value: '2 strokes' },
      { label: 'Miss putt (bogey)', value: '3 strokes' },
      { label: 'Par score', value: '18 total' },
    ],
    exit: 'Goal is to shoot 18 (even par) or better. Play once per session — no mulligans. Score counts.',
    youtubeSearch: 'https://www.youtube.com/results?search_query=par+18+chipping+game+golf+practice',
    screen: 'par18',
  },
  {
    id: 'dollar', name: 'Dollar Signs', icon: '💰',
    tagline: 'Chip for imaginary money. Get it close to win, miss the green to lose.',
    category: 'chipping', solo: true, multi: false, time: '20 min',
    rules: [
      'Pick 5 chipping spots around the green.',
      'Hit 3 chips from each spot (15 shots total).',
      'Start with a $0 bankroll and track your running total.',
      'Chip-in = +$10. Inside 3 feet = +$2. On green = $0. Miss green = -$5.',
      'Goal: finish with a positive bankroll.',
    ],
    scoring: [
      { label: 'Chip-in', value: '+$10 💰' },
      { label: 'Inside 3 feet', value: '+$2' },
      { label: 'On green, outside 3ft', value: '$0' },
      { label: 'Miss the green', value: '-$5 ❌' },
    ],
    exit: 'Finish all 15 shots with a positive bankroll. If you go negative, run it again.',
    youtubeSearch: 'https://www.youtube.com/results?search_query=dollar+signs+chipping+game+golf+practice',
    screen: 'dollar',
  },
  {
    id: 'darts', name: 'Darts', icon: '🎯',
    tagline: 'Score points based on how close you chip to the pin. Aim for the bullseye.',
    category: 'chipping', solo: true, multi: true, time: '15 min',
    rules: [
      'Scatter 10 balls at various distances and locations around the green.',
      'Chip each ball toward a single pin target.',
      'Score is based on proximity to the hole.',
      'First to 50 points wins in multiplayer.',
      'Solo: track your score and try to beat it each session.',
    ],
    scoring: [
      { label: 'Inside 3 feet', value: '5 pts 🎯' },
      { label: 'Inside 6 feet', value: '3 pts' },
      { label: 'Inside 12 feet', value: '1 pt' },
      { label: 'Miss green', value: '-2 pts' },
      { label: 'Max possible', value: '50 pts' },
    ],
    exit: 'Solo: score 30+ points out of 50. Multiplayer: first to 50 total points across rounds.',
    youtubeSearch: 'https://www.youtube.com/results?search_query=darts+chipping+game+golf+proximity+scoring',
    screen: 'darts',
  },
  {
    id: 'fairway', name: 'Fairway Finder', icon: '🏌️',
    tagline: 'Create an imaginary fairway. Hit 9 shots. Score points for hitting it.',
    category: 'range', solo: true, multi: true, time: '20 min',
    rules: [
      'Imagine a 40-yard wide fairway using distant targets as your boundaries.',
      'Play 9 imaginary holes, choosing your club for each tee shot.',
      'Score points for finding the fairway. More points for harder clubs.',
      'Driver in fairway = 3 pts. Hybrid/fairway wood = 2 pts. Iron = 1 pt.',
      'Miss the fairway = 0 pts. In imaginary water = -1 pt.',
    ],
    scoring: [
      { label: 'Driver in fairway', value: '3 pts' },
      { label: 'Hybrid/FW in fairway', value: '2 pts' },
      { label: 'Iron in fairway', value: '1 pt' },
      { label: 'Miss fairway', value: '0 pts' },
      { label: 'Water/OB', value: '-1 pt' },
    ],
    exit: 'Solo: score 18+ points out of 27. Multiplayer: highest score after 9 holes wins.',
    youtubeSearch: 'https://www.youtube.com/results?search_query=fairway+finder+driving+range+game+golf+pressure+drill',
    screen: 'fairway',
  },
  {
    id: 'horse', name: 'H-O-R-S-E', icon: '🐴',
    tagline: 'Call the shot. Everyone has to match it. Miss — get a letter.',
    category: 'range', solo: false, multi: true, time: '25 min',
    rules: [
      'Player 1 calls a shot — club, target, shape (e.g. "fade 7-iron to the 150 flag").',
      'Everyone hits that exact shot.',
      'Player 1 sets the standard — only gets a letter if they miss their own call.',
      'Any other player who misses the shot gets a letter.',
      'First player to spell H-O-R-S-E is eliminated.',
      'Works with chipping, putting, or full swing shots.',
    ],
    scoring: [
      { label: 'Miss the called shot', value: 'Get a letter' },
      { label: 'Make the called shot', value: 'No letter' },
      { label: 'Spell H-O-R-S-E', value: 'Eliminated' },
      { label: 'Winner', value: 'Last player standing' },
    ],
    exit: 'Last player without spelling H-O-R-S-E wins. No time limit — play as long as it takes.',
    youtubeSearch: 'https://www.youtube.com/results?search_query=HORSE+game+golf+driving+range+multiplayer',
    screen: 'points',
  },
];

// ── Games State ──────────────────────────────────────────────────────────────
let currentGame = null;
let gPlayers = ['Me'];
let activeFilter = 'all';

// ── Sub-screen management ────────────────────────────────────────────────────
function showGScreen(name) {
  document.querySelectorAll('.g-screen').forEach(s => s.classList.remove('active'));
  const s = document.getElementById('screen-' + name);
  if (s) s.classList.add('active');
}

function confirmGameQuit() {
  if (confirm('Quit this game? Your score will not be saved.')) showGScreen('games');
}

// ── Games List ───────────────────────────────────────────────────────────────
function filterGames(cat, btn) {
  activeFilter = cat;
  document.querySelectorAll('.cat-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  renderGamesList();
}

function renderGamesList() {
  const container = document.getElementById('games-list');
  if (!container) return;
  const filtered = GAMES.filter(g => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'multi') return g.multi;
    return g.category === activeFilter;
  });
  container.innerHTML = '';
  filtered.forEach(g => {
    const badges = [];
    if (g.solo) badges.push('<span class="g-badge g-badge-solo">Solo</span>');
    if (g.multi) badges.push('<span class="g-badge g-badge-multi">Multiplayer</span>');
    badges.push(`<span class="g-badge g-badge-time">⏱ ${g.time}</span>`);
    const catBadge = g.category === 'putting' ? 'g-badge-putting' : g.category === 'chipping' ? 'g-badge-chipping' : 'g-badge-range';
    const catLabel = g.category === 'putting' ? '⛳ Putting' : g.category === 'chipping' ? '🏌️ Chipping' : '🎯 Range';
    badges.push(`<span class="g-badge ${catBadge}">${catLabel}</span>`);
    container.innerHTML += `
      <div class="game-card" onclick="openGame('${g.id}')">
        <div class="game-card-header">
          <div class="game-icon">${g.icon}</div>
          <div class="game-info">
            <div class="game-name">${g.name}</div>
            <div class="game-tagline">${g.tagline}</div>
          </div>
        </div>
        <div class="game-badges">${badges.join('')}</div>
      </div>`;
  });
}

// ── Game Detail ──────────────────────────────────────────────────────────────
function openGame(id) {
  currentGame = GAMES.find(g => g.id === id);
  document.getElementById('detail-header-title').textContent = currentGame.name.toUpperCase();
  document.getElementById('detail-icon').textContent = currentGame.icon;
  document.getElementById('detail-title').textContent = currentGame.name;
  document.getElementById('detail-sub').textContent = currentGame.tagline;
  const badges = [];
  if (currentGame.solo) badges.push('<span class="g-badge g-badge-solo">Solo</span>');
  if (currentGame.multi) badges.push('<span class="g-badge g-badge-multi">Multiplayer</span>');
  badges.push(`<span class="g-badge g-badge-time">⏱ ${currentGame.time}</span>`);
  document.getElementById('detail-badges').innerHTML = badges.join('');
  document.getElementById('detail-rules').innerHTML = currentGame.rules.map(r => `<li>${r}</li>`).join('');
  document.getElementById('detail-scoring').innerHTML = currentGame.scoring.map(s =>
    `<div class="scoring-row"><div class="scoring-label">${s.label}</div><div class="scoring-value" style="color:var(--g)">${s.value}</div></div>`
  ).join('');
  document.getElementById('detail-exit').textContent = currentGame.exit;
  document.getElementById('detail-watch-btn').href = currentGame.youtubeSearch;
  showGScreen('detail');
}

// ── Player Setup ─────────────────────────────────────────────────────────────
const G_PLAYER_COLORS = ['p1','p2','p3','p4'];
let gPlayerCount = 1;
let gPlayerNames = [''];

function goToPlayerSetup() {
  gPlayerCount = 1;
  gPlayerNames = [''];
  const isSolo = !currentGame.multi;
  document.getElementById('setup-desc').textContent = isSolo
    ? `${currentGame.name} is a solo game. Enter your name and start.`
    : `${currentGame.name} supports 2–4 players. Enter everyone's name before starting.`;
  renderGPlayerRows();
  document.getElementById('add-player-btn').style.display = (!isSolo && gPlayerCount < 4) ? 'flex' : 'none';
  showGScreen('setup');
}

function renderGPlayerRows() {
  const container = document.getElementById('player-rows');
  container.innerHTML = '';
  const colors = ['var(--g)','var(--gr)','var(--bl)','var(--or)'];
  for (let i = 0; i < gPlayerCount; i++) {
    container.innerHTML += `
      <div class="g-player-setup-row">
        <div class="g-player-number" style="background:${colors[i]};color:#000">${i+1}</div>
        <input class="inp" id="gp-name-${i}" type="text" placeholder="Player ${i+1} name"
          value="${gPlayerNames[i]||''}" autocomplete="off" oninput="gPlayerNames[${i}]=this.value">
        ${i > 0 ? `<button onclick="removeGPlayer(${i})" style="background:none;border:none;color:var(--re);font-size:20px;cursor:pointer;padding:4px">✕</button>` : ''}
      </div>`;
  }
  document.getElementById('add-player-btn').style.display =
    (currentGame.multi && gPlayerCount < 4) ? 'flex' : 'none';
}

function addPlayer() {
  if (gPlayerCount < 4) { gPlayerCount++; gPlayerNames.push(''); renderGPlayerRows(); }
}

function removeGPlayer(i) {
  gPlayerNames.splice(i, 1); gPlayerCount--;
  renderGPlayerRows();
}

function startGame() {
  gPlayers = [];
  for (let i = 0; i < gPlayerCount; i++) {
    const n = document.getElementById(`gp-name-${i}`)?.value?.trim() || `Player ${i+1}`;
    gPlayers.push(n);
  }
  if (currentGame.screen === 'par18') initPar18();
  else if (currentGame.id === 'clock' || currentGame.id === 'molinari') initClock();
  else if (currentGame.id === 'ladder') initLadder();
  else if (currentGame.id === 'dollar') initDollar();
  else if (currentGame.id === 'sevenup') initPoints('7up');
  else if (currentGame.id === 'twentyone') initPoints('21');
  else if (currentGame.id === 'horse') initPoints('horse');
  else if (currentGame.id === 'fairway') initFairway();
  else if (currentGame.id === 'darts') initDarts();
  else alert('Scorecard coming soon!');
}

// ── PAR 18 ───────────────────────────────────────────────────────────────────
const PAR18_HOLES = [
  'Easy – short chip','Easy – fringe','Easy – 10 yds',
  'Mid – 15 yds','Mid – rough','Mid – sidehill',
  'Hard – 20 yds','Hard – downhill','Hard – tight lie'
];
let par18Scores = [];

function initPar18() {
  par18Scores = gPlayers.map(() => new Array(9).fill(null));
  for (let p = 0; p < 4; p++) {
    const el = document.getElementById(`par18-h${p+1}name`);
    el.textContent = p < gPlayers.length ? gPlayers[p].substring(0,4).toUpperCase() : '—';
    el.style.opacity = p < gPlayers.length ? '1' : '0.3';
  }
  renderPar18();
  showGScreen('par18');
}

function renderPar18() {
  const container = document.getElementById('par18-rows');
  container.innerHTML = '';
  PAR18_HOLES.forEach((desc, h) => {
    let rowHTML = `<div class="par18-hole-row"><div class="par18-hole-num">${h+1}</div><div class="par18-desc">${desc}</div>`;
    for (let p = 0; p < 4; p++) {
      if (p < gPlayers.length) {
        const score = par18Scores[p][h];
        const cls = score===1?'birdie':score===2?'par':score===3?'bogey':score>=4?'double':'';
        rowHTML += `<button class="par18-score-btn ${cls}" onclick="cyclePar18(${p},${h})">${score||'—'}</button>`;
      } else {
        rowHTML += `<div class="par18-score-btn" style="opacity:0.2">—</div>`;
      }
    }
    rowHTML += `</div>`;
    container.innerHTML += rowHTML;
  });
  for (let p = 0; p < 4; p++) {
    const el = document.getElementById(`par18-t${p+1}`);
    if (p < gPlayers.length) {
      const total = par18Scores[p].reduce((a,v) => a+(v||0), 0);
      el.textContent = total || '—';
      el.style.color = total <= 18 ? 'var(--gr)' : total <= 22 ? 'var(--g)' : 'var(--re)';
    } else { el.textContent = '—'; }
  }
  const filled = par18Scores[0].filter(v => v !== null).length;
  document.getElementById('par18-progress').style.width = (filled/9*100)+'%';
  document.getElementById('par18-total-header').textContent = filled+' / 9';
}

function cyclePar18(player, hole) {
  const cur = par18Scores[player][hole];
  par18Scores[player][hole] = cur === null ? 1 : cur >= 5 ? null : cur + 1;
  renderPar18();
}

function checkPar18Winner() {
  const totals = gPlayers.map((p,i) => ({ name: p, score: par18Scores[i].reduce((a,v)=>a+(v||0),0) }));
  const winner = totals.reduce((a,b) => a.score <= b.score ? a : b);
  showGWinner(winner.name, `Shot ${winner.score} (Par 18)`, totals.map(t => `${t.name}: ${t.score}`).join(' · '));
}

// ── CLOCK FACE ───────────────────────────────────────────────────────────────
let clockMade = [];
let clockRestarts = 0;
let clockStreak = 0;

function initClock() {
  const total = currentGame.id === 'molinari' ? 8 : 12;
  clockMade = new Array(total).fill(null);
  clockRestarts = 0; clockStreak = 0;
  renderClock();
  showGScreen('clock');
}

function renderClock() {
  const total = clockMade.length;
  const face = document.getElementById('clock-face');
  face.innerHTML = '<div class="clock-hole">⛳</div>';
  const radius = 82;
  for (let i = 0; i < total; i++) {
    const angle = (i / total) * 2 * Math.PI - Math.PI / 2;
    const x = 50 + (radius / 110) * 50 * Math.cos(angle);
    const y = 50 + (radius / 110) * 50 * Math.sin(angle);
    const dot = document.createElement('div');
    dot.className = 'clock-dot' + (clockMade[i] === true ? ' made' : clockMade[i] === false ? ' missed' : '');
    dot.style.left = x + '%'; dot.style.top = y + '%';
    dot.textContent = clockMade[i] === true ? '✓' : (i+1);
    dot.onclick = () => tapClockDot(i);
    face.appendChild(dot);
  }
  document.getElementById('clock-streak').textContent = clockStreak;
  document.getElementById('clock-restarts').textContent = clockRestarts + ' restart' + (clockRestarts !== 1 ? 's' : '');
  document.getElementById('clock-attempt-label').textContent = `Attempt ${clockRestarts+1}`;
  const allMade = clockMade.every(v => v === true);
  document.getElementById('clock-status-text').textContent = allMade
    ? `✅ Complete! ${clockRestarts} restart${clockRestarts!==1?'s':''}. Outstanding!`
    : `Tap each ball as you putt it — made or missed. Make all ${total} in a row.`;
}

function tapClockDot(i) {
  const nextIdx = clockMade.findIndex(v => v === null);
  if (nextIdx !== i) return;
  const made = confirm(`Ball ${i+1}: Did you make it?`);
  clockMade[i] = made;
  if (made) {
    clockStreak++;
    if (clockMade.every(v => v === true)) { renderClock(); return; }
  } else {
    clockStreak = 0; clockRestarts++;
    setTimeout(() => { clockMade = new Array(clockMade.length).fill(null); renderClock(); }, 400);
  }
  renderClock();
}

function resetClock() { clockMade = new Array(clockMade.length).fill(null); clockStreak = 0; clockRestarts++; renderClock(); }

// ── LADDER ───────────────────────────────────────────────────────────────────
const LADDER_RUNGS = [3, 6, 10];
let ladderIndex = 0;
let ladderAttempts = 0;
let ladderStatus = [null, null, null];

function initLadder() {
  ladderIndex = 0; ladderAttempts = 1; ladderStatus = [null, null, null];
  renderLadder(); showGScreen('ladder');
}

function renderLadder() {
  const container = document.getElementById('ladder-rungs');
  container.innerHTML = '';
  LADDER_RUNGS.forEach((dist, i) => {
    const status = ladderStatus[i];
    const isActive = i === ladderIndex;
    const isLocked = i > ladderIndex;
    let cls = 'ladder-status';
    if (status === true) cls += ' made';
    else if (isActive) cls += ' active';
    else if (isLocked) cls += ' locked';
    const barWidth = status === true ? 100 : isActive ? 50 : 0;
    const barColor = status === true ? 'var(--gr)' : 'var(--g)';
    container.innerHTML += `
      <div class="ladder-rung">
        <div class="ladder-distance">${dist}ft</div>
        <div class="ladder-bar"><div class="ladder-bar-fill" style="width:${barWidth}%;background:${barColor}"></div></div>
        <div class="${cls}">${status===true?'✓':isActive?'→':isLocked?'🔒':''}</div>
      </div>`;
  });
  document.getElementById('ladder-current-dist').textContent = ladderIndex < LADDER_RUNGS.length ? LADDER_RUNGS[ladderIndex] + ' ft' : '✅ Complete!';
  document.getElementById('ladder-attempt-label').textContent = `Attempt ${ladderAttempts}`;
  document.getElementById('ladder-stats').textContent = ladderIndex > 0 ? `${ladderIndex}/${LADDER_RUNGS.length} rungs cleared` : 'Make your first putt to start climbing.';
}

function madeLadder() {
  ladderStatus[ladderIndex] = true;
  ladderIndex++;
  if (ladderIndex >= LADDER_RUNGS.length) {
    renderLadder();
    showGWinner(gPlayers[0], `Completed in ${ladderAttempts} attempts`, 'Ladder complete! 3ft → 6ft → 10ft ✓');
  } else { renderLadder(); }
}

function missedLadder() {
  ladderAttempts++;
  ladderIndex = 0;
  ladderStatus = [null, null, null];
  renderLadder();
}

// ── DOLLAR SIGNS ─────────────────────────────────────────────────────────────
const DOLLAR_SPOT_NAMES = ['Spot 1 — Short Chip','Spot 2 — Medium Chip','Spot 3 — Rough Lie','Spot 4 — Uphill','Spot 5 — Tight Lie'];
const DOLLAR_ACTIONS = [
  { label: 'Chip-In', cls: 'chip-in', value: 10 },
  { label: '< 3 ft',  cls: 'close',   value: 2  },
  { label: 'On Green',cls: 'on-green', value: 0  },
  { label: 'Miss Green',cls:'miss',    value: -5 },
];
let dollarBankroll = 0;
let dollarResults = [];

function initDollar() {
  dollarBankroll = 0;
  dollarResults = Array(5).fill(null).map(() => [null, null, null]);
  renderDollar();
  showGScreen('dollar');
}

function renderDollar() {
  const container = document.getElementById('dollar-spots');
  container.innerHTML = '';
  dollarResults.forEach((spot, si) => {
    const spotTotal = spot.reduce((a,v) => a + (v !== null ? DOLLAR_ACTIONS[v].value : 0), 0);
    const totalColor = spotTotal > 0 ? 'var(--gr)' : spotTotal < 0 ? 'var(--re)' : 'var(--d)';
    const ballsHTML = spot.map((ball, bi) =>
      `<div style="display:flex;flex-direction:column;gap:4px;flex:1">
        ${DOLLAR_ACTIONS.map((a,ai) =>
          `<button class="dollar-ball-btn ${a.cls}${ball===ai?' selected':''}" onclick="setDollarBall(${si},${bi},${ai})">${a.label}</button>`
        ).join('')}
      </div>`
    ).join('');
    container.innerHTML += `
      <div class="dollar-spot">
        <div class="dollar-spot-header">
          <div class="dollar-spot-name">${DOLLAR_SPOT_NAMES[si]}</div>
          <div class="dollar-spot-total" style="color:${totalColor}">${spotTotal > 0 ? '+' : ''}$${spotTotal}</div>
        </div>
        <div style="display:flex;gap:6px;margin-bottom:4px">
          <div style="font-family:var(--fc);font-size:11px;color:var(--d);flex:1;text-align:center">Ball 1</div>
          <div style="font-family:var(--fc);font-size:11px;color:var(--d);flex:1;text-align:center">Ball 2</div>
          <div style="font-family:var(--fc);font-size:11px;color:var(--d);flex:1;text-align:center">Ball 3</div>
        </div>
        <div style="display:flex;gap:6px">${ballsHTML}</div>
      </div>`;
  });
  dollarBankroll = dollarResults.flat().reduce((a,v) => a + (v !== null ? DOLLAR_ACTIONS[v].value : 0), 0);
  const bankEl = document.getElementById('dollar-bankroll');
  bankEl.textContent = (dollarBankroll >= 0 ? '+' : '') + '$' + dollarBankroll;
  bankEl.className = 'bankroll-amount ' + (dollarBankroll > 0 ? 'positive' : dollarBankroll < 0 ? 'negative' : 'zero');
  document.getElementById('dollar-bankroll-header').textContent = (dollarBankroll >= 0 ? '+' : '') + '$' + dollarBankroll;
  document.getElementById('dollar-bankroll-header').style.color = dollarBankroll >= 0 ? 'var(--gr)' : 'var(--re)';
}

function setDollarBall(spot, ball, action) {
  dollarResults[spot][ball] = dollarResults[spot][ball] === action ? null : action;
  renderDollar();
}

// ── POINTS GAMES (7 UP, 21, H-O-R-S-E) ──────────────────────────────────────
let pointsScores = [];
let pointsMode = '7up';
let pointsActivePlayer = 0;
let pointsHole = 1;
const HORSE_LETTERS = ['H','O','R','S','E'];

function initPoints(mode) {
  pointsMode = mode;
  pointsScores = gPlayers.map(() => 0);
  pointsActivePlayer = 0;
  pointsHole = 1;
  document.getElementById('points-game-name').textContent = mode === '7up' ? '7️⃣ 7 UP' : mode === '21' ? '🃏 21' : '🐴 H-O-R-S-E';
  renderPoints();
  showGScreen('points');
}

function renderPoints() {
  const colors = ['var(--g)','var(--gr)','var(--bl)','var(--or)'];
  const container = document.getElementById('points-players');
  container.innerHTML = '';
  const pointsTarget = pointsMode === '7up' ? 7 : pointsMode === '21' ? 21 : 5;
  gPlayers.forEach((name, i) => {
    const isActive = i === pointsActivePlayer;
    const score = pointsScores[i];
    const displayScore = pointsMode === 'horse' ? (HORSE_LETTERS.slice(0, score).join('') || '—') : score;
    const targetDisplay = pointsMode === 'horse' ? 'HORSE' : 'Target: ' + pointsTarget;
    container.innerHTML += `
      <div class="player-score-row ${isActive ? 'active-player' : ''}">
        <div class="player-score-indicator" style="background:${colors[i]}"></div>
        <div class="player-score-name">${name}</div>
        <div>
          <div class="player-score-pts" style="color:${colors[i]}">${displayScore}</div>
          <div class="player-score-target">${targetDisplay}</div>
        </div>
      </div>`;
  });
  document.getElementById('points-current-player-label').textContent = `SCORING FOR ${gPlayers[pointsActivePlayer].toUpperCase()}`;
  document.getElementById('points-hole-label').textContent = pointsMode === 'horse' ? `Call ${pointsHole}` : `Hole ${pointsHole}`;
  const btnContainer = document.getElementById('points-score-buttons');
  btnContainer.innerHTML = '';
  if (pointsMode === '7up') {
    [{ label: 'Hole-Out', pts: 2, cls: 'hole-in-one' }, { label: 'Won Hole', pts: 1, cls: 'birdie' }, { label: 'No Points', pts: 0, cls: 'par' }]
      .forEach(b => {
        btnContainer.innerHTML += `<button class="score-action-btn ${b.cls}" onclick="addPointsScore(${b.pts})">
          <div class="pts">${b.pts > 0 ? '+' : ''}${b.pts}</div><div>${b.label}</div></button>`;
      });
    document.getElementById('points-instruction').textContent = 'Lag to hole. Closest controls the hole. Hole-out = 2 pts instant.';
  } else if (pointsMode === '21') {
    [{ label: '1-Putt', pts: 3, cls: 'hole-in-one' }, { label: '2-Putt', pts: 1, cls: 'birdie' }, { label: '3-Putt+', pts: 0, cls: 'par' }]
      .forEach(b => {
        btnContainer.innerHTML += `<button class="score-action-btn ${b.cls}" onclick="addPointsScore(${b.pts})">
          <div class="pts">${b.pts > 0 ? '+' : ''}${b.pts}</div><div>${b.label}</div></button>`;
      });
    document.getElementById('points-instruction').textContent = 'Go over 21 — drop to 15. First to exactly 21 wins.';
  } else if (pointsMode === 'horse') {
    [{ label: 'Made It', cls: 'birdie' }, { label: 'Missed', cls: 'bogey' }]
      .forEach((b,i) => {
        btnContainer.innerHTML += `<button class="score-action-btn ${b.cls}" onclick="horseResult(${i===1})">
          <div class="pts">${i===0?'✓':'✕'}</div><div>${b.label}</div></button>`;
      });
    document.getElementById('points-instruction').textContent = 'Miss the called shot — get a letter. Spell H-O-R-S-E to be eliminated.';
  }
}

function addPointsScore(pts) {
  const pointsTarget = pointsMode === '7up' ? 7 : 21;
  pointsScores[pointsActivePlayer] += pts;
  if (pointsMode === '21' && pointsScores[pointsActivePlayer] > 21) pointsScores[pointsActivePlayer] = 15;
  checkPointsWinner();
}

function horseResult(missed) {
  if (missed) pointsScores[pointsActivePlayer]++;
  if (pointsScores[pointsActivePlayer] >= 5) {
    showGWinner(gPlayers.find((p,i) => pointsScores[i] < 5) || gPlayers[0], 'Last player standing', 'H-O-R-S-E Champion 🐴');
    return;
  }
  nextPointsPlayer();
}

function checkPointsWinner() {
  const score = pointsScores[pointsActivePlayer];
  const target = pointsMode === '7up' ? 7 : 21;
  if ((pointsMode === '7up' && score >= 7) || (pointsMode === '21' && score === 21)) {
    showGWinner(gPlayers[pointsActivePlayer], `${score} points`, pointsMode === '7up' ? '7 Up Champion!' : '21 Champion!');
    return;
  }
  nextPointsPlayer();
}

function nextPointsPlayer() {
  pointsActivePlayer = (pointsActivePlayer + 1) % gPlayers.length;
  if (pointsActivePlayer === 0) pointsHole++;
  renderPoints();
}

// ── FAIRWAY FINDER ───────────────────────────────────────────────────────────
const FF_CLUBS = ['Driver','Driver','Hybrid','3-Wood','Driver','Iron','Driver','Hybrid','Driver'];
let ffResults = new Array(9).fill(null);
let ffClubUsed = new Array(9).fill(null);

function initFairway() {
  ffResults = new Array(9).fill(null);
  ffClubUsed = [...FF_CLUBS];
  renderFairway();
  showGScreen('fairway');
}

function renderFairway() {
  const container = document.getElementById('ff-holes');
  container.innerHTML = '';
  let total = 0;
  for (let i = 0; i < 9; i++) {
    const res = ffResults[i];
    const club = ffClubUsed[i];
    let pts = '';
    if (res === 'fairway') {
      const p = club === 'Driver' ? 3 : (club === 'Hybrid' || club === '3-Wood') ? 2 : 1;
      pts = '+' + p; total += p;
    } else if (res === 'water') { pts = '-1'; total -= 1; }
    else if (res === 'miss') { pts = '0'; }
    container.innerHTML += `
      <div class="ff-hole-row">
        <div class="ff-hole-num">${i+1}</div>
        <div class="ff-hole-info">
          <div class="ff-club">${club}</div>
          <div class="ff-hit-miss">
            <button class="ff-btn fairway${res==='fairway'?' selected':''}" onclick="setFF(${i},'fairway')">Fairway</button>
            <button class="ff-btn miss${res==='miss'?' selected':''}" onclick="setFF(${i},'miss')">Miss</button>
            <button class="ff-btn miss${res==='water'?' selected':''}" style="${res==='water'?'background:var(--re);color:white':''}" onclick="setFF(${i},'water')">Water</button>
          </div>
        </div>
        <div class="ff-pts">${pts || '—'}</div>
      </div>`;
  }
  document.getElementById('ff-score-header').textContent = total + ' pts';
  document.getElementById('ff-score-header').style.color = total >= 18 ? 'var(--gr)' : 'var(--g)';
}

function setFF(hole, result) {
  ffResults[hole] = ffResults[hole] === result ? null : result;
  renderFairway();
}

// ── DARTS ────────────────────────────────────────────────────────────────────
const DART_ZONES = [
  { label: '< 3ft',  pts: 5,  cls: 'z1' },
  { label: '< 6ft',  pts: 3,  cls: 'z2' },
  { label: '< 12ft', pts: 1,  cls: 'z3' },
  { label: 'Miss',   pts: -2, cls: 'z4' },
];
let dartSelections = new Array(10).fill(null);

function initDarts() {
  dartSelections = new Array(10).fill(null);
  renderDarts();
  showGScreen('darts');
}

function renderDarts() {
  const container = document.getElementById('darts-chips');
  container.innerHTML = '';
  let total = 0;
  dartSelections.forEach((sel, i) => {
    if (sel !== null) total += DART_ZONES[sel].pts;
    const zonesHTML = DART_ZONES.map((z, zi) =>
      `<button class="dart-zone-btn ${z.cls}${sel===zi?' sel':''}" onclick="setDart(${i},${zi})">${z.label}<br><span style="font-family:var(--fm);font-size:12px">${z.pts>0?'+':''}${z.pts}</span></button>`
    ).join('');
    container.innerHTML += `
      <div class="darts-chip-row">
        <div class="dart-num">${i+1}</div>
        <div class="dart-zones">${zonesHTML}</div>
        <div class="dart-pts">${sel!==null ? (DART_ZONES[sel].pts>0?'+':'')+DART_ZONES[sel].pts : '—'}</div>
      </div>`;
  });
  document.getElementById('darts-total').textContent = total + ' / 50';
  document.getElementById('darts-score-header').textContent = total + ' pts';
  document.getElementById('darts-score-header').style.color = total >= 30 ? 'var(--gr)' : 'var(--g)';
}

function setDart(chip, zone) {
  dartSelections[chip] = dartSelections[chip] === zone ? null : zone;
  renderDarts();
}

// ── WINNER ───────────────────────────────────────────────────────────────────
let lastGWinnerData = {};

function showGWinner(name, score, detail) {
  lastGWinnerData = { name, score, detail };
  document.getElementById('winner-name').textContent = name;
  document.getElementById('winner-score').textContent = score;
  document.getElementById('winner-overlay').style.display = 'flex';
}

function playAgain() {
  document.getElementById('winner-overlay').style.display = 'none';
  startGame();
}

function returnToGames() {
  document.getElementById('winner-overlay').style.display = 'none';
  showGScreen('games');
}

function shareWinner() {
  const text = `⛳ The Range — ${currentGame?.name}\n🏆 Winner: ${lastGWinnerData.name}\n📊 ${lastGWinnerData.score}\n${lastGWinnerData.detail}\n\nkmansgolf.github.io/range`;
  window.open(`sms:?body=${encodeURIComponent(text)}`, '_blank');
}

function shareGame(type) {
  const text = `⛳ The Range — ${currentGame?.name} in progress\nkmansgolf.github.io/range`;
  window.open(`sms:?body=${encodeURIComponent(text)}`, '_blank');
}
