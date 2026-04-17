// ── caddie-app.js ─────────────────────────────────────────────────────────
// UI layer: event handlers, DOM updates, tab switching, theme, init.
// Depends on caddie-data.js and caddie-engine.js.
// ─────────────────────────────────────────────────────────────────────────

// ── TAB NAV ───────────────────────────────────────────────────────────────
function switchTab(tab) {
  ['tempo','weld','mental','strategy'].forEach(t => {
    document.getElementById('tab-'    + t).classList.toggle('active', t === tab);
    document.getElementById('screen-' + t).classList.toggle('active', t === tab);
  });
  if (tab !== 'tempo' && (playing || countingIn)) _stopAll();
}

// ── TEMPO UI ──────────────────────────────────────────────────────────────
function setMode(m) {
  const wasPlaying = playing || countingIn;
  if (wasPlaying) _stopAll();
  mode = m;
  ['full','short','putt'].forEach(id =>
    document.getElementById('mode-' + id).classList.toggle('active', id === m));
  presetIdx = Math.min(presetIdx, PRESETS[m].length - 1);
  buildPresetGrid();
  updateDisplay();
  if (wasPlaying) setTimeout(togglePlay, 120);
}

function buildPresetGrid() {
  const grid = document.getElementById('preset-grid');
  grid.innerHTML = PRESETS[mode].map((p, i) => `
    <button class="preset-btn ${i === presetIdx ? 'active' : ''}"
            onclick="selectPreset(${i})">
      <span class="preset-btn-name">${p.name}</span>
      <span class="preset-btn-time">${p.total.toFixed(2)}s</span>
    </button>
  `).join('');
}

function selectPreset(i) {
  const wasPlaying = playing || countingIn;
  if (wasPlaying) _stopAll();
  presetIdx = i;
  buildPresetGrid();
  updateDisplay();
  if (wasPlaying) setTimeout(togglePlay, 120);
}

function onGapSlider(val) {
  restGap = parseFloat(val);
  document.getElementById('gap-display').textContent = restGap.toFixed(1) + 's';
}

function updateDisplay() {
  const total  = getTotalTime();
  const backMs = Math.round(getBackTime() * 1000);
  const downMs = Math.round(getDownTime() * 1000);
  const ratio  = getRatio();
  const preset = PRESETS[mode][presetIdx];
  document.getElementById('swing-time-display').textContent = total.toFixed(2);
  document.getElementById('swing-time-tag').textContent     = preset.name;
  document.getElementById('detail-back').textContent        = backMs;
  document.getElementById('detail-down').textContent        = downMs;
  document.getElementById('detail-ratio').textContent       = ratio + ':1';
}

// Phase UI
function _setPhaseUI(phase) {
  const map = { takeaway:'phase-takeaway', top:'phase-top', impact:'phase-impact', rest:'phase-rest' };
  ['phase-takeaway','phase-top','phase-impact','phase-rest'].forEach(id =>
    document.getElementById(id).classList.remove('active-phase'));
  if (map[phase]) document.getElementById(map[phase]).classList.add('active-phase');
}

function _clearPhaseUI() {
  ['phase-takeaway','phase-top','phase-impact','phase-rest'].forEach(id =>
    document.getElementById(id).classList.remove('active-phase'));
}

// Play / Stop
function togglePlay() {
  if (countingIn) { _stopAll(); return; }

  playing = !playing;

  if (playing) {
    getAudioCtx().resume().then(() => {
      _setCountinUI(true);
      startCountin((firstBeat) => {
        _setCountinUI(false);
        document.getElementById('play-btn').classList.add('playing');
        scheduleCycle(firstBeat, _setPhaseUI);
      });
    });
  } else {
    _stopAll();
  }
}

function _stopAll() {
  if (countingIn) cancelCountin();
  stopCycle();
  playing = false;
  _clearPhaseUI();
  _setCountinUI(false);
  const btn = document.getElementById('play-btn');
  btn.classList.remove('playing','counting');
  document.getElementById('play-label').textContent = 'Start';
  document.getElementById('play-icon-svg').innerHTML =
    '<polygon points="5 3 19 12 5 21 5 3" fill="currentColor"/>';
}

function _setCountinUI(active) {
  const badge = document.getElementById('countin-badge');
  const pdisp = document.getElementById('phase-display');
  const btn   = document.getElementById('play-btn');
  const label = document.getElementById('play-label');
  if (active) {
    badge.classList.add('visible');
    pdisp.style.opacity = '0.3';
    btn.classList.add('counting');
    btn.classList.remove('playing');
    label.textContent = 'Stop';
    document.getElementById('play-icon-svg').innerHTML =
      '<rect x="6" y="4" width="4" height="16" fill="currentColor"/><rect x="14" y="4" width="4" height="16" fill="currentColor"/>';
  } else {
    badge.classList.remove('visible');
    pdisp.style.opacity = '1';
    btn.classList.remove('counting');
  }
}

// ── WELD UI ───────────────────────────────────────────────────────────────
function uiSetWindDir(d) {
  setWindDir(d);
  ['head','tail','cross','none'].forEach(id =>
    document.getElementById('wind-' + id).classList.toggle('active', id === d));
  _renderWeld();
}

function uiSetElevDir(d) {
  setElevDir(d);
  ['up','down','flat'].forEach(id =>
    document.getElementById('elev-' + id).classList.toggle('active', id === d));
  _renderWeld();
}

function uiSetLie(l) {
  setLie(l);
  ['fairway','light','thick','flyer'].forEach(id =>
    document.getElementById('lie-' + id).classList.toggle('active', id === l));
  _renderWeld();
}

function _renderWeld() {
  const rawDist = parseFloat(document.getElementById('w-distance').value) || 0;
  const windSpd = parseFloat(document.getElementById('w-wind').value)     || 0;
  const elevFt  = parseFloat(document.getElementById('w-elev').value)     || 0;
  const result  = calcWeld(rawDist, windSpd, elevFt);

  if (!result) {
    document.getElementById('weld-result').textContent   = '—';
    document.getElementById('weld-breakdown').innerHTML  = '';
    document.getElementById('weld-aim-note').textContent = '';
    return;
  }

  document.getElementById('weld-result').textContent   = result.playsLike > 0 ? result.playsLike : '—';
  document.getElementById('weld-aim-note').textContent = result.aimNote;
  document.getElementById('weld-breakdown').innerHTML  = result.rows.map(r => {
    const sign   = r.adj > 0 ? '+' : '';
    const cls    = r.adj > 0 ? 'pos' : r.adj < 0 ? 'neg' : '';
    const valStr = r.key === 'Raw distance'
      ? r.val + ' yds'
      : (r.adj === 0 ? '±0' : sign + r.val + ' yds');
    return `<div class="weld-row">
      <span class="weld-row-key">${r.key}</span>
      <span class="weld-row-val ${cls}">${valStr}</span>
    </div>`;
  }).join('');
}

// ── MENTAL UI ─────────────────────────────────────────────────────────────
function cycleToggle(key) {
  const btn = document.getElementById(key + '-btn');
  const cur = mentalToggles[key];
  if (cur === null)      { mentalToggles[key] = true;  btn.classList.remove('no');  btn.classList.add('yes'); }
  else if (cur === true) { mentalToggles[key] = false; btn.classList.remove('yes'); btn.classList.add('no');  }
  else                   { mentalToggles[key] = null;  btn.classList.remove('yes','no'); }
}

function logShot() {
  if (!mentalLog()) return;
  _renderMental();
  ['calc','create','execute'].forEach(k =>
    document.getElementById(k + '-btn').classList.remove('yes','no'));
}

function clearMental() {
  const hasMental = shots.length > 0;
  const hasTiger5 = tiger5Tally() > 0;
  if (!hasMental && !hasTiger5) return;
  if (!confirm('Clear Mental Scorecard and Tiger 5 for this round?')) return;
  mentalClear();
  tiger5Clear();
  ['calc','create','execute'].forEach(k =>
    document.getElementById(k + '-btn').classList.remove('yes','no'));
  _renderMental();
  _renderTiger5();
}

function _renderMental() {
  const t = mentalTally();
  document.getElementById('tally-shots').textContent = t.shots;
  document.getElementById('tally-yes').textContent   = t.yes;
  document.getElementById('tally-no').textContent    = t.no;
  document.getElementById('tally-pct').textContent   = t.pct !== null ? t.pct + '%' : '—';

  const list = document.getElementById('shot-list');
  const card = document.getElementById('shot-list-card');
  card.style.display = shots.length ? '' : 'none';

  const labels = { calc:'C', create:'Cr', execute:'E' };
  list.innerHTML = shots.slice().reverse().map((s, ri) => {
    const i      = shots.length - ri;
    const keys   = ['calc','create','execute'];
    const badges = keys
      .filter(k => s[k] !== null)
      .map(k => `<span class="shot-badge ${s[k] ? 'y' : 'n'}">${labels[k]} ${s[k] ? 'Y' : 'N'}</span>`)
      .join('');
    const yes = keys.filter(k => s[k] === true).length;
    const tot = keys.filter(k => s[k] !== null).length;
    return `<div class="shot-item">
      <span class="shot-num">#${i}</span>
      <div class="shot-badges">${badges}</div>
      <span class="shot-score">${yes}/${tot}</span>
    </div>`;
  }).join('');
}

// ── TIGER 5 UI ────────────────────────────────────────────────────────────
// HTML calls this; it delegates to the engine then re-renders.
// Engine's tiger5Increment is defined in caddie-engine.js and does the
// actual state mutation + save. We shadow-call it here by inlining
// to avoid a naming collision (both files used the same name originally).
function tiger5Increment(key) {
  if (!(key in tiger5)) return;
  tiger5[key]++;
  tiger5Save();
  _renderTiger5();
}

function _renderTiger5() {
  ['threeputt','doubles','par5bogey','bogey150','doublechip'].forEach(k => {
    document.getElementById('t5-' + k).textContent = tiger5[k];
  });
  document.getElementById('tiger5-total').textContent = tiger5Tally();
}

// ── STRATEGY UI ───────────────────────────────────────────────────────────
function toggleStrat(section) {
  const body    = document.getElementById('strat-body-' + section);
  const chevron = document.getElementById('strat-chevron-' + section);
  const isOpen  = body.classList.toggle('open');
  chevron.textContent = isOpen ? '˅' : '›';
}

// ── THEME ─────────────────────────────────────────────────────────────────
function applyTheme(t) {
  const isLight = t === 'light';
  document.body.setAttribute('data-theme', isLight ? 'light' : '');
  document.getElementById('theme-toggle').textContent = isLight ? '🌙' : '☀️';
  document.getElementById('theme-meta').setAttribute('content', isLight ? '#f2f2f4' : '#000000');
  localStorage.setItem('range_theme', t);
}

function toggleTheme() {
  applyTheme((localStorage.getItem('range_theme') || 'dark') === 'light' ? 'dark' : 'light');
}

// ── INIT ──────────────────────────────────────────────────────────────────
(function init() {
  mentalLoad();
  tiger5Load();
  buildPresetGrid();
  updateDisplay();
  applyTheme(localStorage.getItem('range_theme') || 'dark');
  _renderMental();
  _renderTiger5();
})();
