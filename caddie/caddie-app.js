// ── caddie-app.js ─────────────────────────────────────────────────────────
// UI layer: event handlers, DOM updates, tab switching, theme, init.
// Depends on caddie-data.js and caddie-engine.js.
// ─────────────────────────────────────────────────────────────────────────

// ── TAB NAV ───────────────────────────────────────────────────────────────
function switchTab(tab) {
  ['weld','mental','strategy'].forEach(t => {
    document.getElementById('tab-'    + t).classList.toggle('active', t === tab);
    document.getElementById('screen-' + t).classList.toggle('active', t === tab);
  });
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
  if (!confirm('Clear Mental Scorecard and Round Awareness for this round?')) return;
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
function tiger5Increment(key) {
  if (!(key in tiger5)) return;
  tiger5[key]++;
  tiger5Save();
  _renderTiger5();
}

function _renderTiger5() {
  ['threeputt','doubles','penalties','wedgebogey','missedupdown'].forEach(k => {
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
  applyTheme(localStorage.getItem('range_theme') || 'dark');
  _renderMental();
  _renderTiger5();
})();
