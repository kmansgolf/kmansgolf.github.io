// ═══ STATE ═══════════════════════════════════════════
let state = {
  players: [], games: [], bets: {}, currentHole: 0,
  pars: Array(18).fill(4), yardages: Array(18).fill(null),
  courseName: 'Round', teeName: '', roundDate: null,
  rabbit: { holder: null },
  wolf: { order: [0,1,2,3], picks: Array(18).fill(null) },
  money: []
};

// Global flag for active round (used by beforeunload guard)
let inRound = false;

// ═══ ACTIVE ROUND PERSISTENCE ════════════════════════
function saveActiveRound() {
  if (!state.players?.length) {
    localStorage.removeItem('bunker_active_round');
    inRound = false;
    return;
  }
  inRound = true;
  const data = {
    state: JSON.parse(JSON.stringify(state)),
    savedAt: new Date().toISOString()
  };
  try {
    localStorage.setItem('bunker_active_round', JSON.stringify(data));
  } catch(e) { console.error('Failed to save active round', e); }
}

function loadActiveRound() {
  try {
    const saved = localStorage.getItem('bunker_active_round');
    if (!saved) return false;
    const data = JSON.parse(saved);
    if (!data.state?.players?.length) return false;
    
    // Restore state
    Object.assign(state, data.state);
    inRound = true;
    
    // Show play view and render current hole
    showView('play');
    renderHole();
    updateHomeButtons();
    return true;
  } catch(e) { 
    console.error('Failed to load active round', e);
    return false;
  }
}

function clearActiveRound() {
  localStorage.removeItem('bunker_active_round');
  inRound = false;
}

// ═══ WIZARD ══════════════════════════════════════════
let wizardStep = 0;

function wizardNext() {
  if (wizardStep === 2) { startRound(); return; }
  wizardStep++;
  updateWizard();
}
function wizardBack() {
  if (wizardStep > 0) { wizardStep--; updateWizard(); }
}
function updateWizard() {
  document.querySelectorAll('.wizard-step').forEach((s,i) => s.classList.toggle('active', i===wizardStep));
  [0,1,2].forEach(i => {
    const dot = document.getElementById(`sd${i}`);
    dot.classList.remove('active','done');
    if (i < wizardStep) { dot.classList.add('done'); dot.textContent='✓'; }
    else if (i === wizardStep) { dot.classList.add('active'); dot.textContent=i+1; }
    else { dot.textContent=i+1; }
  });
  ['sl01','sl12'].forEach((id,i) => {
    const line = document.getElementById(id);
    if (line) line.classList.toggle('done', wizardStep > i);
  });
  document.getElementById('wizard-back').style.display = wizardStep > 0 ? 'block' : 'none';
  const nextBtn = document.getElementById('wizard-next');
  if (wizardStep === 2) { nextBtn.textContent = 'Tee It Up ⛳'; }
  else { nextBtn.textContent = 'Next →'; }
  // Wolf note on step 3
  const wolfOn = [...document.querySelectorAll('.game-toggle.selected')].some(e=>e.dataset.game==='wolf');
  const wolfNote = document.getElementById('wolf-order-note');
  if (wolfNote) wolfNote.style.display = (wizardStep===2 && wolfOn) ? 'block' : 'none';
}

// ═══ PLAYER PRESETS ══════════════════════════════════
const PRESET_PLAYERS = ['Kevin','Josh','Danny','Larry','Ryan'];
const COLORS = ['#e74c3c','#3498db','#f39c12','#9b59b6'];

function initPlayerSlots() {
  document.querySelectorAll('.player-slot').forEach(slot => {
    const i = +slot.dataset.slot;
    const colors = ['#e74c3c','#3498db','#f39c12','#9b59b6'];
    const savedName = localStorage.getItem(`player_slot_${i}`) || '';
    slot.innerHTML = `
      <div class="player-slot-wrap">
        <div class="player-slot-label" style="display:flex;align-items:center;gap:6px;">
          <span class="player-color-dot" style="background:${colors[i]}"></span>P${i+1}
        </div>
        <select class="player-select" id="psel${i}" onchange="onPlayerSelect(${i})">
        </select>
        <input class="player-custom-input" id="pcustom${i}" type="text" placeholder="Enter name…" maxlength="14"
          value="${savedName&&!PRESET_PLAYERS.includes(savedName)?savedName:''}"
          style="display:${savedName&&!PRESET_PLAYERS.includes(savedName)?'block':'none'}"
          oninput="localStorage.setItem('player_slot_${i}',this.value)">
      </div>`;
  });
  refreshAllPlayerDropdowns();
}

function getSelectedPresets() {
  // Returns array of preset names currently chosen (one per slot, ignoring custom/empty)
  return [0,1,2,3].map(i => {
    const sel = document.getElementById(`psel${i}`);
    return sel && PRESET_PLAYERS.includes(sel.value) ? sel.value : null;
  });
}

function refreshAllPlayerDropdowns() {
  const selected = getSelectedPresets();
  [0,1,2,3].forEach(i => {
    const sel = document.getElementById(`psel${i}`);
    if (!sel) return;
    const currentVal = sel.value;
    const savedName = localStorage.getItem(`player_slot_${i}`) || '';
    sel.innerHTML = '<option value="">— Select player —</option>';
    PRESET_PLAYERS.forEach(n => {
      // Show if: this slot's own pick, OR not picked by any other slot
      const takenByOther = selected.some((v, idx) => idx !== i && v === n);
      if (!takenByOther || currentVal === n) {
        const opt = document.createElement('option');
        opt.value = n;
        opt.textContent = n;
        if (currentVal === n || (savedName === n && !currentVal)) opt.selected = true;
        sel.appendChild(opt);
      }
    });
    const customOpt = document.createElement('option');
    customOpt.value = '__custom__';
    customOpt.textContent = '+ Custom name…';
    if (currentVal === '__custom__' || (savedName && !PRESET_PLAYERS.includes(savedName) && savedName !== '')) {
      customOpt.selected = true;
    }
    sel.appendChild(customOpt);
  });
}

function onPlayerSelect(i) {
  const sel = document.getElementById(`psel${i}`);
  const custom = document.getElementById(`pcustom${i}`);
  if (sel.value === '__custom__') {
    custom.style.display = 'block';
    custom.focus();
    localStorage.removeItem(`player_slot_${i}`);
  } else {
    custom.style.display = 'none';
    localStorage.setItem(`player_slot_${i}`, sel.value);
  }
  refreshAllPlayerDropdowns();
}

function getPlayerName(i) {
  const sel = document.getElementById(`psel${i}`);
  const custom = document.getElementById(`pcustom${i}`);
  if (!sel) return `Player ${i+1}`;
  if (sel.value === '__custom__') return custom.value.trim() || `Player ${i+1}`;
  return sel.value || `Player ${i+1}`;
}
const SCORE_LABELS = {'-2':'Eagle','-1':'Birdie','0':'Par','1':'Bogey','2':'Double','3':'Triple'};

// ── SETUP HELPERS ────────────────────────────────────────────────────
function toggleGame(el) { el.classList.toggle('selected'); updateWizard(); }

function startRound() {
  const names = [0,1,2,3].map(i => getPlayerName(i));
  const selectedGames = [...document.querySelectorAll('.game-toggle.selected')].map(el => el.dataset.game);

  state.players = names.map(n => ({ name: n, scores: Array(18).fill(null) }));
  state.games = selectedGames;
  state.bets = {
    skins: +document.getElementById('skins-bet').value || 1,
    rabbit: +document.getElementById('rabbit-bet').value || 2,
    wolf: +document.getElementById('wolf-bet').value || 0.25,
    nassau: +document.getElementById('nassau-bet').value || 1,
  };
  state.currentHole = 0;
  state.money = Array(4).fill(0);
  state.rabbit = { holder: null };
  state.wolf = { order: [0,1,2,3], picks: Array(18).fill(null) };
  state.roundDate = new Date().toISOString();

  // Load course pars if a course is selected
  if (selectedCourseId) {
    const course = COURSES.find(c => c.id === selectedCourseId);
    const tee = course.tees[selectedTeeIdx];
    state.pars = tee.holes.map(h => h.par);
    state.yardages = tee.holes.map(h => h.yds);
    state.courseName = course.name;
    state.teeName = `${tee.name} tees · ${tee.yards}y · ${tee.rating}/${tee.slope}`;
  } else {
    state.pars = Array(18).fill(4);
    state.yardages = Array(18).fill(null);
    state.courseName = 'Round';
    state.teeName = '';
  }

  const _hhl = document.getElementById('header-hole-label');
  if (_hhl) _hhl.textContent = (state.courseName && state.courseName !== 'Round' ? state.courseName + ' · ' : '') + (state.teeName || 'Hole 1 of 18');
  showView('play');
  renderHole();
  updateHeader('play');
  saveActiveRound();
}

// ── VIEW SWITCHING ───────────────────────────────────────────────────
function showView(id) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  updateHeader(id);
}

function navTo(id) {
  if (id === 'play' && !state.players?.length) return;
  if (id === 'scorecard-view') { renderScorecardTable(); }
  if (id === 'results-view') { renderResults(); }
  if (id === 'history-view') { renderHistory(); }
  showView(id);
}

function updateHeader(activeId) {
  const inRound = state.players?.length > 0;

  // Subtitle
  const subtitles = {
    'setup':          'New Round Setup',
    'play':           document.getElementById('header-hole-label')?.textContent || 'Hole 1 of 18',
    'scorecard-view': 'Scorecard',
    'results-view':   'Review & Confirm',
    'history-view':   'Leaderboard',
    'print-view':     'Print View',
  };
  const sub = document.getElementById('header-subtitle');
  if (sub) sub.textContent = subtitles[activeId] || '';

  // Tab map: tabId → viewId
  const tabs = {
    'tab-setup':    'setup',
    'tab-play':     'play',
    'tab-card':     'scorecard-view',
    'tab-results':  'results-view',
    'tab-history':  'history-view',
  };

  Object.entries(tabs).forEach(([tabId, viewId]) => {
    const tab = document.getElementById(tabId);
    if (!tab) return;
    // Active = current page
    tab.classList.toggle('active', viewId === activeId);
    // Disabled = requires active round but none exists
    const needsRound = ['tab-play','tab-card','tab-results'].includes(tabId);
    tab.classList.toggle('disabled', needsRound && !inRound);
  });
}

function updateHomeButtons() { updateHeader('setup'); }
function showHistory() { showView('history-view'); renderHistory(); }

function backToPlay() {
  if (state.players?.length > 0) {
    showView('play');
  } else {
    showView('setup');
    updateHomeButtons();
  }
}

function homeShowScorecard() {
  if (!state.players?.length) { alert('No round in progress.'); return; }
  showView('scorecard-view');
  renderScorecardTable();
}
function homeResumeRound() {
  if (!state.players?.length) { alert('No round in progress.'); return; }
  showView('play');
}
function updateHomeButtons() {
  const inProgress = state.players?.length > 0;
  const scBtn = document.getElementById('home-scorecard-btn');
  const resBtn = document.getElementById('home-resume-btn');
  if (scBtn) scBtn.style.display = inProgress ? '' : 'none';
  if (resBtn) resBtn.style.display = inProgress ? '' : 'none';
}
function newRound() {
  // Full reset so course picker starts fresh
  wizardStep = 0;
  selectedCourseId = null;
  selectedTeeIdx = 0;
  state = {
    players: [], games: [], bets: {},
    currentHole: 0,
    pars: Array(18).fill(4),
    yardages: Array(18).fill(null),
    courseName: 'Round', teeName: '', roundDate: null,
    rabbit: { holder: null },
    wolf: { picks: Array(18).fill(null) },
    money: []
  };
  clearActiveRound();
  // Clear course search input
  const cSearch = document.getElementById('course-search');
  if (cSearch) cSearch.value = '';
  filterCourseDropdown();
  updateWizard();
  showView('setup');
  updateHomeButtons();
}
function saveAndNewRound() { saveRound(); gistSync(); newRound(); }
function showPrintView() { showView('print-view'); renderPrintView(); }

function showLastRound() {
  const rounds = loadRounds();
  if (rounds.length === 0) { alert('No saved rounds yet.'); return; }
  renderResultsFromRound(rounds[0]);
  showView('results-view');
}

// ── AUTO-SAVE (on hole advance) ──────────────────────────────────────
function autoSaveRound() {
  // Only save if at least some scores entered
  const hasScores = state.players.some(p => p.scores.some(s => s !== null));
  if (!hasScores) return;
  saveRound();
}

// ── SAVE ROUND TO LOCALSTORAGE ───────────────────────────────────────
function saveRound() {
  const key = 'golf_rounds';
  let rounds = [];
  try { rounds = JSON.parse(localStorage.getItem(key) || '[]'); } catch(e) {}

  const money = calcTotalMoney();
  const gameMoney = {};
  if (state.games.includes('skins'))  gameMoney.skins  = calcSkinsMoney();
  if (state.games.includes('rabbit')) gameMoney.rabbit = calcRabbitMoney();
  if (state.games.includes('wolf'))   gameMoney.wolf   = calcWolfMoney();
  if (state.games.includes('nassau')) gameMoney.nassau = calcNassauMoney().total;

  const roundData = {
    id: state.roundDate || new Date().toISOString(),
    date: state.roundDate || new Date().toISOString(),
    courseName: state.courseName || 'Unknown Course',
    teeName: state.teeName || '',
    players: state.players.map((p,i) => ({
      name: p.name,
      scores: [...p.scores],
      money: money[i]
    })),
    pars: [...state.pars],
    games: [...state.games],
    bets: {...state.bets},
    gameMoney,
    holesPlayed: (state.players[0]?.scores||[]).filter(s=>s!==null).length,
    wolfPicks: state.games.includes('wolf') ? [...state.wolf.picks] : null
  };

  // Replace if same round (same id), otherwise append
  const existingIdx = rounds.findIndex(r => r.id === roundData.id);
  if (existingIdx >= 0) rounds[existingIdx] = roundData;
  else rounds.unshift(roundData);

  try { localStorage.setItem(key, JSON.stringify(rounds)); } catch(e) {}
}

// ── HISTORY / LEADERBOARD ────────────────────────────────────────────
function loadRounds() {
  try { return JSON.parse(localStorage.getItem('golf_rounds') || '[]'); } catch(e) { return []; }
}

function renderHistory() {
  const content = document.getElementById('history-content');
  content.innerHTML = '';
  const rounds = loadRounds();

  // Season leaderboard — aggregate by player name
  const leaderMap = {};
  rounds.forEach(r => {
    r.players.forEach(p => {
      if (!leaderMap[p.name]) leaderMap[p.name] = { money: 0, strokes: 0, rounds: 0 };
      leaderMap[p.name].money += p.money || 0;
      leaderMap[p.name].strokes += p.scores.reduce((a,s)=>a+(s||0),0);
      leaderMap[p.name].rounds++;
    });
  });

  const leaderEntries = Object.entries(leaderMap).sort((a,b) => b[1].money - a[1].money);

  // Leaderboard card
  const lb = el('div','history-leaderboard');
  const lbTitle = el('div','history-leaderboard-title'); lbTitle.textContent = '🏆 Season Leaderboard';
  lb.appendChild(lbTitle);

  if (leaderEntries.length === 0) {
    lb.innerHTML += '<div style="color:var(--blue-soft);font-size:0.85rem;text-align:center;padding:10px 0;">No rounds saved yet</div>';
  } else {
    const medals = ['🥇','🥈','🥉'];
    leaderEntries.forEach(([name, stats], rank) => {
      const row = el('div','leaderboard-row');
      const moneyClass = stats.money > 0 ? 'pos' : stats.money < 0 ? 'neg' : 'zero';
      row.innerHTML = `
        <div class="lb-rank">${medals[rank] || (rank+1)}</div>
        <div class="lb-name">${name}</div>
        <div class="lb-stat">
          <div class="lb-money ${moneyClass}">${fmt(stats.money)}</div>
          <div class="lb-strokes">${stats.strokes > 0 ? stats.strokes + ' strokes' : ''}</div>
          <div class="lb-rounds">${stats.rounds} round${stats.rounds!==1?'s':''}</div>
        </div>`;
      lb.appendChild(row);
    });
  }
  content.appendChild(lb);

  // ── SEASON STATS ──
  if (rounds.length > 0) {
    renderSeasonStats(content);
  }

  // Round history list
  if (rounds.length > 0) {
    const histLabel = el('div','history-section-label'); histLabel.textContent = 'Round History';
    content.appendChild(histLabel);

    rounds.forEach((r, idx) => {
      const card = buildRoundCard(r, idx);
      content.appendChild(card);
    });

    const clearBtn = el('button','clear-history-btn');
    clearBtn.textContent = 'Clear All History';
    clearBtn.onclick = () => {
      if (confirm('Delete all saved rounds? This cannot be undone.')) {
        localStorage.removeItem('golf_rounds');
        renderHistory();
      }
    };
    content.appendChild(clearBtn);
  } else {
    const empty = el('div','history-empty');
    empty.innerHTML = '<div class="history-empty-icon">⛳</div><div>No rounds saved yet.<br>Complete a round and tap <b>Save &amp; New Round</b>.</div>';
    content.appendChild(empty);
  }

  // ── Gist sync at bottom as collapsible ──
  const syncWrap = el('div');
  syncWrap.style.cssText = 'margin:20px 0 8px;';
  const syncToggle = el('button');
  syncToggle.style.cssText = 'background:none;border:none;color:var(--muted);font-family:var(--font-display);font-size:0.65rem;letter-spacing:2px;text-transform:uppercase;cursor:pointer;padding:8px 0;width:100%;text-align:center;';
  syncToggle.textContent = '⚙ Sync Settings';
  const syncPanel = el('div');
  syncPanel.style.display = 'none';
  syncPanel.innerHTML = renderGistPanel();
  syncToggle.onclick = () => {
    const open = syncPanel.style.display !== 'none';
    syncPanel.style.display = open ? 'none' : 'block';
    syncToggle.textContent = open ? '⚙ Sync Settings' : '⚙ Hide Sync Settings';
  };
  syncWrap.appendChild(syncToggle);
  syncWrap.appendChild(syncPanel);
  content.appendChild(syncWrap);
}

function renderSeasonStats(content) {
  const seasonStats = calcSeasonStats();
  const playerNames = Object.keys(seasonStats);
  if (playerNames.length === 0) return;

  // Check which games have been played
  const hasWolf = playerNames.some(n => seasonStats[n].wolfRounds > 0);
  const hasSkins = playerNames.some(n => seasonStats[n].skinsRounds > 0);
  const hasRabbit = playerNames.some(n => seasonStats[n].rabbitRounds > 0);
  const hasNassau = playerNames.some(n => seasonStats[n].nassauRounds > 0);

  if (!hasWolf && !hasSkins && !hasRabbit && !hasNassau) return;

  const statsSection = el('div');
  statsSection.style.cssText = 'margin:16px 0;';

  const sTitle = el('div','history-section-label');
  sTitle.textContent = '📊 Season Stats';
  statsSection.appendChild(sTitle);

  // Collapsible stats panel
  const statsPanel = el('div');
  statsPanel.style.cssText = 'background:var(--navy-mid);border-radius:var(--r-md);overflow:hidden;';

  // Wolf season stats
  if (hasWolf) {
    const wolfSection = el('div');
    wolfSection.style.cssText = 'padding:14px;border-bottom:1px solid var(--border);';
    
    const wolfTitle = el('div');
    wolfTitle.style.cssText = 'font-family:var(--font-display);font-size:0.7rem;font-weight:700;letter-spacing:1.5px;color:var(--gold);margin-bottom:10px;';
    wolfTitle.textContent = '🐺 WOLF SEASON';
    wolfSection.appendChild(wolfTitle);

    const wolfGrid = el('div');
    wolfGrid.style.cssText = 'display:grid;grid-template-columns:repeat(2,1fr);gap:8px;';

    playerNames.sort((a,b) => seasonStats[b].totalMoney - seasonStats[a].totalMoney).forEach(name => {
      const ps = seasonStats[name];
      if (ps.wolfRounds === 0) return;
      
      const loneWinPct = ps.loneWolfAttempts > 0 
        ? Math.round(ps.loneWolfWins / ps.loneWolfAttempts * 100) 
        : 0;
      const pickedWinPct = ps.timesPicked > 0 
        ? Math.round(ps.timesPickedWon / ps.timesPicked * 100) 
        : 0;

      const cell = el('div');
      cell.style.cssText = 'background:var(--white);border-radius:var(--r);padding:10px;';
      cell.innerHTML = `
        <div style="font-weight:700;color:var(--text);margin-bottom:6px;">${name}</div>
        <div style="font-size:0.72rem;color:var(--muted);line-height:1.7;">
          <div>🐺 Lone Wolf: <span style="color:var(--text);">${ps.loneWolfWins}/${ps.loneWolfAttempts}</span> <span style="color:${loneWinPct >= 50 ? 'var(--green)' : 'var(--red)'};">(${loneWinPct}%)</span></div>
          <div>👆 Picked: <span style="color:var(--text);">${ps.timesPicked}x</span> <span style="color:${pickedWinPct >= 50 ? 'var(--green)' : 'var(--red)'};">(won ${pickedWinPct}%)</span></div>
        </div>`;
      wolfGrid.appendChild(cell);
    });

    wolfSection.appendChild(wolfGrid);
    statsPanel.appendChild(wolfSection);
  }

  // Skins season stats
  if (hasSkins) {
    const skinsSection = el('div');
    skinsSection.style.cssText = 'padding:14px;border-bottom:1px solid var(--border);';
    
    const skinsTitle = el('div');
    skinsTitle.style.cssText = 'font-family:var(--font-display);font-size:0.7rem;font-weight:700;letter-spacing:1.5px;color:var(--gold);margin-bottom:10px;';
    skinsTitle.textContent = '🎰 SKINS SEASON';
    skinsSection.appendChild(skinsTitle);

    const skinsGrid = el('div');
    skinsGrid.style.cssText = 'display:grid;grid-template-columns:repeat(4,1fr);gap:6px;text-align:center;';

    playerNames.sort((a,b) => seasonStats[b].totalSkinsWon - seasonStats[a].totalSkinsWon).forEach(name => {
      const ps = seasonStats[name];
      if (ps.skinsRounds === 0) return;
      
      const cell = el('div');
      cell.style.cssText = 'background:var(--white);border-radius:var(--r);padding:8px;';
      cell.innerHTML = `
        <div style="font-size:0.7rem;color:var(--text);font-weight:600;margin-bottom:4px;">${name}</div>
        <div style="font-size:1.3rem;font-weight:800;color:var(--gold);">${ps.totalSkinsWon}</div>
        <div style="font-size:0.6rem;color:var(--muted);">total skins</div>
        ${ps.biggestSkin > 1 ? `<div style="font-size:0.6rem;color:var(--amber);margin-top:2px;">🔥 ${ps.biggestSkin}-way best</div>` : ''}`;
      skinsGrid.appendChild(cell);
    });

    skinsSection.appendChild(skinsGrid);
    statsPanel.appendChild(skinsSection);
  }

  // Rabbit season stats
  if (hasRabbit) {
    const rabbitSection = el('div');
    rabbitSection.style.cssText = 'padding:14px;border-bottom:1px solid var(--border);';
    
    const rabbitTitle = el('div');
    rabbitTitle.style.cssText = 'font-family:var(--font-display);font-size:0.7rem;font-weight:700;letter-spacing:1.5px;color:var(--gold);margin-bottom:10px;';
    rabbitTitle.textContent = '🐇 RABBIT SEASON';
    rabbitSection.appendChild(rabbitTitle);

    const rabbitGrid = el('div');
    rabbitGrid.style.cssText = 'display:grid;grid-template-columns:repeat(4,1fr);gap:6px;text-align:center;';

    playerNames.sort((a,b) => seasonStats[b].timesHeldAtPayout - seasonStats[a].timesHeldAtPayout).forEach(name => {
      const ps = seasonStats[name];
      if (ps.rabbitRounds === 0) return;
      
      const cell = el('div');
      cell.style.cssText = 'background:var(--white);border-radius:var(--r);padding:8px;';
      cell.innerHTML = `
        <div style="font-size:0.7rem;color:var(--text);font-weight:600;margin-bottom:4px;">${name}</div>
        <div style="font-size:1.3rem;font-weight:800;color:var(--green);">${ps.timesHeldAtPayout}</div>
        <div style="font-size:0.6rem;color:var(--muted);">payouts</div>
        <div style="font-size:0.6rem;color:var(--amber);margin-top:2px;">${ps.steals} steals</div>`;
      rabbitGrid.appendChild(cell);
    });

    rabbitSection.appendChild(rabbitGrid);
    statsPanel.appendChild(rabbitSection);
  }

  // Nassau season stats
  if (hasNassau) {
    const nassauSection = el('div');
    nassauSection.style.cssText = 'padding:14px;';
    
    const nassauTitle = el('div');
    nassauTitle.style.cssText = 'font-family:var(--font-display);font-size:0.7rem;font-weight:700;letter-spacing:1.5px;color:var(--gold);margin-bottom:10px;';
    nassauTitle.textContent = '🏆 NASSAU SEASON';
    nassauSection.appendChild(nassauTitle);

    const nassauGrid = el('div');
    nassauGrid.style.cssText = 'display:grid;grid-template-columns:repeat(4,1fr);gap:6px;text-align:center;';

    const nassauWins = playerNames.map(n => ({name: n, wins: seasonStats[n].frontWins + seasonStats[n].backWins + seasonStats[n].overallWins, sweeps: seasonStats[n].sweeps}));
    nassauWins.sort((a,b) => b.wins - a.wins).forEach(({name, wins, sweeps}) => {
      const ps = seasonStats[name];
      if (ps.nassauRounds === 0) return;
      
      const cell = el('div');
      cell.style.cssText = 'background:var(--white);border-radius:var(--r);padding:8px;';
      cell.innerHTML = `
        <div style="font-size:0.7rem;color:var(--text);font-weight:600;margin-bottom:4px;">${name}</div>
        <div style="font-size:1.3rem;font-weight:800;color:var(--gold);">${wins}</div>
        <div style="font-size:0.6rem;color:var(--muted);">total wins</div>
        ${sweeps > 0 ? `<div style="font-size:0.6rem;color:var(--gold);margin-top:2px;">🧹 ${sweeps} sweeps</div>` : ''}`;
      nassauGrid.appendChild(cell);
    });

    nassauSection.appendChild(nassauGrid);
    statsPanel.appendChild(nassauSection);
  }

  statsSection.appendChild(statsPanel);
  content.appendChild(statsSection);
}

function buildRoundCard(r, idx) {
  const card = el('div','round-card');
  const dateStr = new Date(r.date).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
  const holesLabel = r.holesPlayed === 18 ? '18 holes' : `${r.holesPlayed} holes`;
  const teeLabel = r.teeName ? ` · ${r.teeName.split('·')[0].trim()}` : '';
  const gameIcons = {skins:'🎰 Skins', rabbit:'🐇 Rabbit', wolf:'🐺 Wolf', nassau:'🏆 Nassau'};

  const hdr = el('div','round-card-header');
  hdr.innerHTML = `
    <div>
      <div class="round-course">${r.courseName}</div>
      <div class="round-meta">${dateStr} · ${holesLabel}${teeLabel}</div>
    </div>
    <div style="display:flex;align-items:center;gap:10px;">
      <div style="text-align:right;">
        ${r.players.slice().sort((a,b)=>b.money-a.money).slice(0,1).map(p=>`<div style="font-family:var(--font-display);font-size:0.8rem;font-weight:700;color:var(--amber);">${p.name} ${fmt(p.money)}</div>`).join('')}
      </div>
      <span class="round-chevron">▼</span>
    </div>`;
  hdr.onclick = () => card.classList.toggle('open');
  card.appendChild(hdr);

  const body = el('div','round-card-body');

  // Money + scores per player
  const sortedPlayers = r.players.slice().sort((a,b)=>b.money-a.money);
  sortedPlayers.forEach(p => {
    const row = el('div','round-money-row');
    const total = p.scores.reduce((a,s)=>a+(s||0),0);
    const moneyClass = p.money > 0 ? 'pos' : p.money < 0 ? 'neg' : 'zero';
    row.innerHTML = `
      <div class="round-player-name">${p.name}</div>
      <div style="display:flex;align-items:center;gap:10px;">
        <div class="round-player-score">${total > 0 ? total + ' strokes' : '–'}</div>
        <div class="round-player-money ${moneyClass}">${fmt(p.money)}</div>
      </div>`;
    body.appendChild(row);
  });

  // Game breakdown chips
  if (r.games && r.games.length > 0) {
    const chips = el('div','round-game-chips');
    r.games.forEach(g => {
      const chip = el('div','round-game-chip');
      chip.textContent = gameIcons[g] || g;
      chips.appendChild(chip);
    });
    body.appendChild(chips);
  }

  // Hole-by-hole scorecard (collapsed by default within card)
  const scToggle = el('div');
  scToggle.style.cssText = 'padding:8px 14px;cursor:pointer;font-family:var(--font-display);font-size:0.65rem;letter-spacing:1.5px;color:var(--navy-light);font-weight:700;text-transform:uppercase;border-top:1px solid var(--border);display:flex;align-items:center;gap:6px;';
  scToggle.innerHTML = '📋 Scorecard <span style="color:var(--muted);font-weight:400;">(tap to expand)</span>';
  const scWrap = el('div','round-sc-wrap');
  scWrap.style.display = 'none';
  scToggle.onclick = () => {
    if (scWrap.style.display === 'none') {
      scWrap.style.display = 'block';
      scWrap.innerHTML = '';
      scWrap.appendChild(buildHistoryScorecardTable(r));
    } else {
      scWrap.style.display = 'none';
    }
  };
  body.appendChild(scToggle);
  body.appendChild(scWrap);

  // Edit hole buttons for saved round
  const editSec = el('div');
  editSec.style.cssText = 'padding:8px 14px;border-top:1px solid var(--border);';
  editSec.innerHTML = `<div style="font-family:var(--font-display);font-size:0.6rem;letter-spacing:1.5px;color:var(--muted);text-transform:uppercase;margin-bottom:6px;">✏️ Edit a hole</div>`;
  const hGrid = el('div');
  hGrid.style.cssText = 'display:grid;grid-template-columns:repeat(6,1fr);gap:4px;';
  for (let h = 0; h < 18; h++) {
    const hasScore = r.players.some(p => p.scores[h] !== null && p.scores[h] !== undefined);
    const btn = document.createElement('button');
    btn.textContent = `H${h+1}`;
    btn.style.cssText = `padding:5px 2px;font-family:var(--font-display);font-size:0.7rem;font-weight:700;border:1.5px solid ${hasScore?'var(--navy-light)':'var(--border)'};border-radius:var(--r);background:${hasScore?'var(--navy-mid)':'var(--white)'};color:${hasScore?'var(--gold)':'var(--muted)'};cursor:pointer;`;
    btn.onclick = () => openEditModal(h, r.id);
    hGrid.appendChild(btn);
  }
  editSec.appendChild(hGrid);
  body.appendChild(editSec);

  card.appendChild(body);
  return card;
}

function buildHistoryScorecardTable(r) {
  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const tr1 = document.createElement('tr');
  ['Player','1','2','3','4','5','6','7','8','9','Out','10','11','12','13','14','15','16','17','18','In','Total'].forEach(h => {
    const th = document.createElement('th'); th.textContent = h; tr1.appendChild(th);
  });
  thead.appendChild(tr1);

  const parRow = document.createElement('tr');
  ['Par',...r.pars.slice(0,9), r.pars.slice(0,9).reduce((a,b)=>a+b,0),
   ...r.pars.slice(9), r.pars.slice(9).reduce((a,b)=>a+b,0),
   r.pars.reduce((a,b)=>a+b,0)].forEach(v => {
    const td = document.createElement('td'); td.textContent=v; td.style.color='var(--muted)'; parRow.appendChild(td);
  });
  thead.appendChild(parRow);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  r.players.forEach((p, pi) => {
    const tr = document.createElement('tr');
    const front9 = p.scores.slice(0,9).reduce((a,s)=>a+(s||0),0);
    const back9 = p.scores.slice(9).reduce((a,s)=>a+(s||0),0);
    const cells = [p.name, ...p.scores.slice(0,9), front9||'', ...p.scores.slice(9), back9||'', (front9+back9)||''];
    cells.forEach((v, ci) => {
      const td = document.createElement('td');
      if (ci === 0) { td.textContent = v; td.style.color = COLORS[pi % COLORS.length]; td.style.fontWeight = '700'; }
      else if (ci === 10 || ci === 20 || ci === 21) { td.textContent = v||''; td.style.fontWeight='700'; }
      else {
        const realIdx = ci < 10 ? ci-1 : ci === 20||ci===21 ? -1 : ci-11;
        if (realIdx >= 0 && realIdx < 18) {
          const sc = p.scores[realIdx];
          if (sc === null || sc === undefined) { td.textContent = '—'; td.className = 'cell-empty'; }
          else {
            const diff = sc - r.pars[realIdx];
            td.textContent = sc;
            if (diff <= -2) td.className = 'cell-eagle';
            else if (diff === -1) td.className = 'cell-birdie';
            else if (diff === 0) td.className = 'cell-par';
            else if (diff === 1) td.className = 'cell-bogey';
            else td.className = 'cell-double';
          }
        } else { td.textContent = v||''; }
      }
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  return table;
}

// ── RENDER HOLE ──────────────────────────────────────────────────────
function renderHole() {
  if (!state.players?.length) return;
  const h = state.currentHole;
  const hLabel = `Hole ${h+1} of 18`;
  const holeEl = document.getElementById('header-hole-label');
  if (holeEl) holeEl.textContent = hLabel;
  const subEl = document.getElementById('header-subtitle');
  if (subEl && document.getElementById('play').classList.contains('active')) subEl.textContent = hLabel;

  const content = document.getElementById('play-content');
  content.innerHTML = '';

  // Running totals bar
  content.appendChild(buildTotalsBar());

  // Hole nav
  const nav = el('div','hole-nav');
  const prevBtn = el('button','nav-btn'); prevBtn.textContent = '‹'; prevBtn.disabled = h === 0;
  prevBtn.onclick = () => { state.currentHole--; renderHole(); saveActiveRound(); };
  const center = el('div','hole-nav-center');
  const yds = state.yardages && state.yardages[h] ? `<div style="font-size:0.72rem;color:var(--muted);margin-top:2px;">${state.yardages[h]} yds</div>` : '';
  center.innerHTML = `<div class="hole-num">Hole ${h+1}</div><div class="hole-par">Par ${state.pars[h]}</div>${yds}`;
  const nextBtn = el('button','nav-btn'); nextBtn.textContent = '›'; nextBtn.disabled = h === 17;
  nextBtn.onclick = () => { autoSaveRound(); state.currentHole++; renderHole(); saveActiveRound(); };
  nav.append(prevBtn, center, nextBtn);
  content.appendChild(nav);

  // Par selector
  const parSel = el('div','par-selector');
  [3,4,5].forEach(p => {
    const btn = el('button','par-btn'); btn.textContent = `Par ${p}`;
    if (state.pars[h] === p) btn.classList.add('active');
    btn.onclick = () => { state.pars[h] = p; renderHole(); saveActiveRound(); };
    parSel.appendChild(btn);
  });
  content.appendChild(parSel);

  // Score card
  content.appendChild(buildScoreEntry(h));

  // Wolf partner picker (if wolf selected)
  if (state.games.includes('wolf')) {
    content.appendChild(buildWolfUI(h));
  }

  // Game status panels
  if (state.games.includes('rabbit')) content.appendChild(buildRabbitPanel(h));
  if (state.games.includes('skins'))  content.appendChild(buildSkinsPanel());
  if (state.games.includes('wolf'))   content.appendChild(buildWolfPanel());
  if (state.games.includes('nassau')) content.appendChild(buildNassauPanel());
}

function buildTotalsBar() {
  const bar = el('div','totals-bar');
  const title = el('h4'); title.textContent = 'Running Totals';
  const grid = el('div','totals-grid');
  state.players.forEach((p,i) => {
    const money = calcTotalMoney();
    const amt = money[i];
    const cell = el('div','total-cell');
    cell.innerHTML = `<div class="tc-name">${p.name}</div><div class="tc-amount ${amt>0?'pos':amt<0?'neg':'zero'}">${fmt(amt)}</div>`;
    grid.appendChild(cell);
  });
  bar.append(title, grid);
  return bar;
}

function buildScoreEntry(h) {
  const card = el('div','score-card');
  const hdr = el('div','score-header');
  hdr.innerHTML = '<div>Player</div><div style="text-align:center">Score</div><div style="text-align:center">+/-</div>';
  card.appendChild(hdr);

  state.players.forEach((p,i) => {
    const row = el('div','score-row');
    const nameCell = el('div','player-name-cell');
    const badge = el('span',`player-badge p${i}`);
    nameCell.append(badge, document.createTextNode(p.name));

    const stepper = el('div','score-stepper');
    const minus = el('button','stepper-btn'); minus.textContent = '−';
    const val = el('div','score-val'); val.textContent = p.scores[h] ?? '−';
    const plus = el('button','stepper-btn'); plus.textContent = '+';

    minus.onclick = () => {
      if (p.scores[h] === null) p.scores[h] = state.pars[h];
      else if (p.scores[h] > 1) p.scores[h]--;
      recalc(); renderHole(); saveActiveRound();
    };
    plus.onclick = () => {
      if (p.scores[h] === null) p.scores[h] = state.pars[h];
      else p.scores[h]++;
      recalc(); renderHole(); saveActiveRound();
    };
    stepper.append(minus, val, plus);

    const rel = el('div','score-rel');
    if (p.scores[h] !== null) {
      const diff = p.scores[h] - state.pars[h];
      rel.textContent = diff === 0 ? 'E' : diff > 0 ? `+${diff}` : `${diff}`;
      if (diff <= -2) { rel.className = 'score-rel eagle'; rel.textContent = diff===-1?'🐦':'🦅'; }
      else if (diff === -1) { rel.className = 'score-rel under'; }
      else if (diff === 0) rel.className = 'score-rel even';
      else rel.className = 'score-rel over';
    } else { rel.textContent = ''; }

    row.append(nameCell, stepper, rel);
    card.appendChild(row);
  });

  // Edit a previous hole
  if (h > 0) {
    const editLink = el('div');
    editLink.style.cssText = 'padding:7px 14px;font-size:0.73rem;color:var(--navy-light);cursor:pointer;border-top:1px solid var(--surface);text-align:center;font-family:var(--font-display);letter-spacing:.5px;text-decoration:underline;';
    editLink.textContent = `✏️ Edit hole ${h} scores`;
    editLink.onclick = () => openEditModal(h - 1, null);
    card.appendChild(editLink);
  }

  return card;
}

function buildWolfUI(h) {
  const wolfIdx = h % 4;
  const wolfName = state.players[wolfIdx].name;
  const pick = state.wolf.picks[h];
  const isLone = pick === null || pick === 'lone';

  const wrap = el('div','game-panel');
  wrap.classList.add('open');
  const hdr = el('div','game-panel-header');
  const partnerName = (!isLone && typeof pick === 'number') ? state.players[pick].name : null;
  const summaryText = isLone ? `${wolfName} is Lone Wolf 🐺` : `${wolfName} + ${partnerName}`;
  hdr.innerHTML = `<span class="gp-icon">🐺</span><span class="gp-title">Wolf Decision</span><span class="gp-summary c${wolfIdx}">${summaryText}</span>`;
  hdr.onclick = () => wrap.classList.toggle('open');
  const body = el('div','game-panel-body');

  const lbl = el('div','wolf-label'); 
  lbl.textContent = isLone ? `${wolfName} is going solo. Tap a player to pick a partner:` : `${wolfName} picked ${partnerName}. Tap again to go solo:`;
  const picker = el('div','wolf-picker');

  state.players.forEach((p,i) => {
    if (i === wolfIdx) {
      const btn = el('button','wolf-pick-btn wolf-is'); 
      btn.textContent = `${p.name} 🐺`;
      btn.disabled = true;
      picker.appendChild(btn);
      return;
    }
    const btn = el('button','wolf-pick-btn');
    btn.textContent = p.name;
    if (pick === i) btn.classList.add('picked');
    btn.onclick = () => {
      // Toggle: if already picked, go back to lone wolf (null)
      state.wolf.picks[h] = (state.wolf.picks[h] === i) ? null : i;
      recalc(); renderHole(); saveActiveRound();
    };
    picker.appendChild(btn);
  });

  body.append(lbl, picker);
  wrap.append(hdr, body);
  return wrap;
}

// ── GAME PANELS ──────────────────────────────────────────────────────
function buildRabbitPanel(h) {
  const panel = el('div','game-panel open');
  const rabbitState = calcRabbitState();
  const holder = rabbitState.holder;
  const segment = Math.floor(h / 6);
  const segmentEnd = (segment + 1) * 6 - 1;
  const payoutHole = segmentEnd + 1;

  const summary = holder !== null ? `${state.players[holder].name} holds 🐇` : 'Unclaimed';
  const hdr = el('div','game-panel-header');
  hdr.innerHTML = `<span class="gp-icon">🐇</span><span class="gp-title">Rabbit</span><span class="gp-summary">${summary}</span><span class="gp-chevron">▼</span>`;
  hdr.onclick = () => panel.classList.toggle('open');

  const body = el('div','game-panel-body');

  state.players.forEach((p,i) => {
    const row = el('div','status-row');
    const nameDiv = el('div','status-player');
    const badge = el('span',`player-badge p${i}`);
    nameDiv.append(badge, document.createTextNode(p.name));
    if (i === holder) {
      const tag = el('span','status-tag tag-holds'); tag.textContent = 'HOLDS';
      nameDiv.appendChild(tag);
    }
    const earnings = el('div','status-amount');
    const amt = calcRabbitMoney()[i];
    earnings.textContent = fmt(amt);
    earnings.className = `status-amount ${amt>0?'pos':amt<0?'neg':'zero'}`;
    row.append(nameDiv, earnings);
    body.appendChild(row);
  });

  if (h === segmentEnd) {
    const notice = el('div','payout-notice');
    notice.textContent = `💰 End of segment — payout after this hole!`;
    body.appendChild(notice);
  }

  const info = el('p'); info.style.cssText = 'font-size:0.75rem;color:var(--muted);margin-top:10px;';
  info.textContent = `Segments: 1-6 · 7-12 · 13-18. Ties don't move the rabbit.`;
  body.appendChild(info);

  panel.append(hdr, body);
  return panel;
}

function buildSkinsPanel() {
  const panel = el('div','game-panel');
  const skinData = calcSkins();
  const totalSkins = skinData.filter(s=>s!==null).length;
  const pending = skinData.filter(s=>s==='pending').length;

  const hdr = el('div','game-panel-header');
  hdr.innerHTML = `<span class="gp-icon">🎰</span><span class="gp-title">Skins</span><span class="gp-summary">${totalSkins} skin${totalSkins!==1?'s':''} won · ${pending} pending</span><span class="gp-chevron">▼</span>`;
  hdr.onclick = () => panel.classList.toggle('open');

  const body = el('div','game-panel-body');
  const money = calcSkinsMoney();
  state.players.forEach((p,i) => {
    const row = el('div','status-row');
    const nameDiv = el('div','status-player');
    const badge = el('span',`player-badge p${i}`);
    nameDiv.append(badge, document.createTextNode(p.name));
    const wins = skinData.filter(s=>s===i).length;
    if (wins > 0) {
      const tag = el('span','status-tag tag-skin'); tag.textContent = `${wins} skin${wins>1?'s':''}`;
      nameDiv.appendChild(tag);
    }
    const amt = el('div','status-amount');
    amt.textContent = fmt(money[i]);
    amt.className = `status-amount ${money[i]>0?'pos':money[i]<0?'neg':'zero'}`;
    row.append(nameDiv, amt);
    body.appendChild(row);
  });

  panel.append(hdr, body);
  return panel;
}

function buildWolfPanel() {
  const panel = el('div','game-panel open');
  const money = calcWolfMoney();
  const points = calcWolfPoints();
  
  // Find current leader for summary
  const maxPts = Math.max(...points);
  const leaders = state.players.filter((p,i) => points[i] === maxPts && maxPts > 0).map(p => p.name);
  const summaryText = maxPts > 0 
    ? `${leaders.join(' & ')} +${maxPts}pts` 
    : 'All square';
  
  const hdr = el('div','game-panel-header');
  hdr.innerHTML = `<span class="gp-icon">🐺</span><span class="gp-title">Wolf</span><span class="gp-summary">${summaryText}</span><span class="gp-chevron">▼</span>`;
  hdr.onclick = () => panel.classList.toggle('open');

  const body = el('div','game-panel-body');

  // Points + projected money per player
  state.players.forEach((p,i) => {
    const row = el('div','status-row');
    const nameDiv = el('div','status-player');
    const badge = el('span',`player-badge p${i}`);
    nameDiv.append(badge, document.createTextNode(p.name));
    const right = el('div'); right.style.cssText = 'display:flex;align-items:center;gap:10px;';
    const pts = el('div'); pts.style.cssText = `font-size:0.8rem;font-family:var(--font-display);color:var(--muted);`;
    pts.textContent = `${points[i] > 0 ? '+' : ''}${points[i]} pts`;
    const amt = el('div','status-amount');
    amt.textContent = fmt(money[i]);
    amt.className = `status-amount ${money[i]>0?'pos':money[i]<0?'neg':'zero'}`;
    right.append(pts, amt);
    row.append(nameDiv, right);
    body.appendChild(row);
  });

  // Simplified payouts (minimum transactions)
  const payouts = calcPayouts(money);
  if (payouts.length > 0) {
    const divider = el('div');
    divider.style.cssText = 'border-top:1px solid var(--border);margin:10px 0 8px;';
    body.appendChild(divider);
    
    const label = el('div');
    label.style.cssText = 'font-size:0.6rem;letter-spacing:2px;text-transform:uppercase;color:var(--green);padding:0 0 8px;font-family:var(--font-display);font-weight:700;';
    label.textContent = '✓ Quick Settle';
    body.appendChild(label);
    
    payouts.forEach(({from, to, amt}) => {
      const row = el('div');
      row.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:6px 0;';
      row.innerHTML = `
        <div style="display:flex;align-items:center;gap:6px;font-size:0.85rem;">
          <span style="color:${COLORS[from]};font-weight:600;">${state.players[from].name}</span>
          <span style="color:var(--muted);font-size:0.75rem;">→</span>
          <span style="color:${COLORS[to]};font-weight:600;">${state.players[to].name}</span>
        </div>
        <div style="font-family:var(--font-display);font-size:1rem;font-weight:800;color:var(--gold);">$${amt.toFixed(2).replace(/\.00$/,'')}</div>`;
      body.appendChild(row);
    });

    // Pairwise breakdown toggle
    const pairwise = buildPairwiseBreakdown(points, state.bets.wolf, state.players);
    if (pairwise.length > 0) {
      const toggleWrap = el('div');
      toggleWrap.style.cssText = 'margin-top:10px;border-top:1px solid var(--border);padding-top:8px;';
      
      const toggleBtn = el('div');
      toggleBtn.style.cssText = 'font-size:0.6rem;letter-spacing:1.5px;text-transform:uppercase;color:var(--muted);cursor:pointer;display:flex;align-items:center;gap:4px;';
      toggleBtn.innerHTML = '<span>Full Breakdown</span><span class="pw-chevron">▼</span>';
      
      const pairwiseBody = el('div');
      pairwiseBody.style.cssText = 'display:none;margin-top:8px;';
      
      pairwise.forEach(({fromName, toName, amount, pointDiff, from, to}) => {
        const pRow = el('div');
        pRow.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:4px 0;font-size:0.78rem;';
        pRow.innerHTML = `
          <div>
            <span style="color:${COLORS[from]};">${fromName}</span>
            <span style="color:var(--muted);"> → </span>
            <span style="color:${COLORS[to]};">${toName}</span>
            <span style="color:var(--muted);font-size:0.65rem;"> (${pointDiff}pt)</span>
          </div>
          <div style="color:var(--text);">$${amount.toFixed(2).replace(/\.00$/,'')}</div>`;
        pairwiseBody.appendChild(pRow);
      });

      toggleBtn.onclick = () => {
        const isOpen = pairwiseBody.style.display !== 'none';
        pairwiseBody.style.display = isOpen ? 'none' : 'block';
        toggleBtn.querySelector('.pw-chevron').textContent = isOpen ? '▼' : '▲';
      };

      toggleWrap.append(toggleBtn, pairwiseBody);
      body.appendChild(toggleWrap);
    }
  }

  panel.append(hdr, body);
  return panel;
}

function buildNassauPanel() {
  const panel = el('div','game-panel');
  const nassau = calcNassauMoney();
  const hdr = el('div','game-panel-header');
  hdr.innerHTML = `<span class="gp-icon">🏆</span><span class="gp-title">Nassau</span><span class="gp-summary">Front · Back · Total</span><span class="gp-chevron">▼</span>`;
  hdr.onclick = () => panel.classList.toggle('open');

  const body = el('div','game-panel-body');
  state.players.forEach((p,i) => {
    const row = el('div','status-row');
    const nameDiv = el('div','status-player');
    const badge = el('span',`player-badge p${i}`);
    nameDiv.append(badge, document.createTextNode(p.name));
    const amt = el('div','status-amount');
    amt.textContent = fmt(nassau.total[i]);
    amt.className = `status-amount ${nassau.total[i]>0?'pos':nassau.total[i]<0?'neg':'zero'}`;
    row.append(nameDiv, amt);
    body.appendChild(row);
  });

  panel.append(hdr, body);
  return panel;
}

// ── GAME CALCULATORS ─────────────────────────────────────────────────
function calcRabbitState() {
  if (!state.players?.length) return { holder: null };
  // Returns current holder at current hole
  let holder = null;
  const h = state.currentHole;
  for (let i = 0; i <= h; i++) {
    // Check if this is a payout hole — reset
    if (i > 0 && i % 6 === 0) holder = null;
    const scores = state.players.map(p => p.scores[i]);
    if (scores.some(s => s === null)) continue;
    const min = Math.min(...scores);
    const winners = scores.reduce((a,s,idx)=>s===min?[...a,idx]:a,[]);
    if (winners.length === 1) holder = winners[0]; // outright win
    // tie: holder unchanged
  }
  return { holder };
}

function calcRabbitMoney() {
  if (!state.players?.length) return Array(4).fill(0);
  const money = Array(4).fill(0);
  const bet = state.bets.rabbit;
  // Simulate all holes up to current
  let holder = null;
  const holesScored = state.currentHole;
  for (let i = 0; i <= holesScored; i++) {
    // Payout at end of holes 5, 11, 17 (0-indexed)
    if (i > 0 && i % 6 === 0) {
      // Payout the previous segment
      if (holder !== null) {
        // holder gets bet from each other player
        state.players.forEach((_,j) => {
          if (j !== holder) { money[j] -= bet; money[holder] += bet; }
        });
      }
      holder = null;
    }
    const scores = state.players.map(p => p.scores[i]);
    if (scores.some(s => s === null)) continue;
    const min = Math.min(...scores);
    const winners = scores.reduce((a,s,idx)=>s===min?[...a,idx]:a,[]);
    if (winners.length === 1) holder = winners[0];
  }
  // If we're at the very last hole of a segment and it's been scored, pay out
  const lastPlayed = state.currentHole;
  if ((lastPlayed + 1) % 6 === 0 && state.players[0]?.scores?.[lastPlayed] !== null) {
    if (holder !== null) {
      state.players.forEach((_,j) => {
        if (j !== holder) { money[j] -= bet; money[holder] += bet; }
      });
    }
  }
  return money;
}

// Skins: returns array per hole: null (not played), 'pending' (tie carried), or playerIdx
function calcSkins() {
  if (!state.players?.length) return Array(18).fill(null);
  const result = Array(18).fill(null);
  let carried = 0;
  for (let h = 0; h < 18; h++) {
    const scores = state.players.map(p => p.scores[h]);
    if (scores.some(s => s === null)) { if (carried > 0) result[h] = 'pending'; continue; }
    const min = Math.min(...scores);
    const winners = scores.reduce((a,s,i)=>s===min?[...a,i]:a,[]);
    if (winners.length === 1) {
      result[h] = winners[0];
      // carried skins go back to their holes retroactively — mark the winner
      for (let back = h-carried; back < h; back++) result[back] = winners[0];
      carried = 0;
    } else {
      result[h] = 'pending';
      carried++;
    }
  }
  return result;
}

function calcSkinsMoney() {
  if (!state.players?.length) return Array(4).fill(0);
  const money = Array(4).fill(0);
  const skins = calcSkins();
  const bet = state.bets.skins;
  // Count skins per player
  for (let h = 0; h < 18; h++) {
    const s = skins[h];
    if (typeof s === 'number') {
      // Winner gets bet from each loser
      state.players.forEach((_,j) => {
        if (j !== s) { money[j] -= bet; money[s] += bet; }
      });
    }
  }
  // Deduplicate: we assigned money per hole but carried skins have been resolved
  // Simple approach: count distinct won holes
  const moneyClean = Array(4).fill(0);
  const wonHoles = {}; // playerIdx -> set of holes they won
  for (let h = 0; h < 18; h++) {
    const s = skins[h];
    if (typeof s === 'number') {
      if (!wonHoles[s]) wonHoles[s] = new Set();
      wonHoles[s].add(h);
    }
  }
  // Each skin the winner collects from 3 others (but we count each hole once)
  // Count unique holes won per player
  const skinCounts = Array(4).fill(0);
  Object.keys(wonHoles).forEach(p => { skinCounts[+p] = wonHoles[+p].size; });
  const totalSkins = skinCounts.reduce((a,b)=>a+b,0);
  skinCounts.forEach((cnt, i) => {
    moneyClean[i] = cnt * bet * 3 - (totalSkins - cnt) * bet;
  });
  return moneyClean;
}

function calcWolfPoints() {
  if (!state.players?.length) return Array(4).fill(0);
  const points = Array(4).fill(0);
  for (let h = 0; h < 18; h++) {
    const scores = state.players.map(p => p.scores[h]);
    if (scores.some(s => s === null)) continue;
    const wolfIdx = h % 4;
    const pick = state.wolf.picks[h];
    // null or 'lone' = Lone Wolf (default behavior)
    if (pick === null || pick === 'lone') {
      const wolfScore = scores[wolfIdx];
      const others = [0,1,2,3].filter(i => i !== wolfIdx);
      const bestOther = Math.min(...others.map(i => scores[i]));
      if (wolfScore < bestOther) {
        // Lone wolf wins: wolf +4, opponents get nothing
        points[wolfIdx] += 4;
      } else if (wolfScore > bestOther) {
        // Lone wolf loses: each opponent +1, wolf gets nothing
        others.forEach(i => points[i] += 1);
      }
      // Tie: nobody gets points
    } else {
      const team1 = [wolfIdx, pick];
      const team2 = [0,1,2,3].filter(i => !team1.includes(i));
      const best1 = Math.min(...team1.map(i => scores[i]));
      const best2 = Math.min(...team2.map(i => scores[i]));
      if (best1 < best2) {
        // Wolf's team wins: +2 each, losers get nothing
        team1.forEach(i => points[i] += 2);
      } else if (best2 < best1) {
        // Other team wins: +2 each, losers get nothing
        team2.forEach(i => points[i] += 2);
      }
      // Tie: nobody gets points
    }
  }
  return points;
}

function calcWolfMoney() {
  if (!state.players?.length) return Array(4).fill(0);
  const points = calcWolfPoints();
  const bet = state.bets.wolf;
  const n = state.players.length;
  // Pairwise settlement: each player settles with every other based on point difference
  return points.map((myPoints, i) => {
    let total = 0;
    for (let j = 0; j < n; j++) {
      if (i !== j) total += (myPoints - points[j]) * bet;
    }
    return Math.round(total * 100) / 100;
  });
}

function calcNassauMoney() {
  if (!state.players?.length) return { front:Array(4).fill(0), back:Array(4).fill(0), overall:Array(4).fill(0), total:Array(4).fill(0) };
  const bet = state.bets.nassau;
  const front = Array(4).fill(0);
  const back = Array(4).fill(0);
  const overall = Array(4).fill(0);

  // front 9 (holes 0-8), back 9 (9-17), overall
  const totalFront = state.players.map(p => p.scores.slice(0,9).reduce((a,s)=>a+(s||0),0));
  const totalBack = state.players.map(p => p.scores.slice(9,18).reduce((a,s)=>a+(s||0),0));
  const totalAll = state.players.map(p => p.scores.reduce((a,s)=>a+(s||0),0));

  // For each of front/back/overall: lowest score wins from each other player
  const payNassau = (totals, moneyArr) => {
    // Only score if all holes in range have been played
    const min = Math.min(...totals.filter(t=>t>0));
    const winners = totals.reduce((a,t,i)=>t===min&&t>0?[...a,i]:a,[]);
    if (winners.length === 1) {
      const w = winners[0];
      state.players.forEach((_,j)=>{ if(j!==w){ moneyArr[j]-=bet; moneyArr[w]+=bet; } });
    }
  };

  // Only count if the 9 holes have actual scores
  const frontPlayed = (state.players[0]?.scores||[]).slice(0,9).filter(s=>s!==null).length;
  const backPlayed = (state.players[0]?.scores||[]).slice(9,18).filter(s=>s!==null).length;

  if (frontPlayed === 9) payNassau(totalFront, front);
  if (backPlayed === 9) payNassau(totalBack, back);
  if (frontPlayed === 9 && backPlayed === 9) payNassau(totalAll, overall);

  const total = front.map((f,i)=>f+back[i]+overall[i]);
  return { front, back, overall, total };
}

// Calculates minimum transactions to settle a money array
// Returns [{from, to, amt}]
function calcPayouts(money) {
  // Minimum transactions debt settlement
  const balances = money.map((amt, i) => ({ i, amt }));
  const debtors   = balances.filter(b => b.amt < 0).sort((a,b) => a.amt - b.amt);
  const creditors = balances.filter(b => b.amt > 0).sort((a,b) => b.amt - a.amt);
  const payouts = [];
  const d = debtors.map(b => ({ ...b, rem: Math.abs(b.amt) }));
  const cr = creditors.map(b => ({ ...b, rem: b.amt }));
  let di = 0, ci = 0;
  while (di < d.length && ci < cr.length) {
    const pay = Math.min(d[di].rem, cr[ci].rem);
    if (pay > 0.005) payouts.push({ from: d[di].i, to: cr[ci].i, amt: Math.round(pay * 100) / 100 });
    d[di].rem -= pay; cr[ci].rem -= pay;
    if (d[di].rem < 0.005) di++;
    if (cr[ci].rem < 0.005) ci++;
  }
  return payouts;
}

function pairwiseOwed(points, bet) {
  // Returns owes[i][j] = amount player i owes player j based on point difference
  // If i has fewer points than j, i owes j the difference × bet
  const n = points.length;
  const owes = Array.from({length:n}, () => Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      if (points[i] < points[j]) {
        owes[i][j] = Math.round((points[j] - points[i]) * bet * 100) / 100;
      }
    }
  }
  return owes;
}

// Build human-readable pairwise breakdown for display
function buildPairwiseBreakdown(points, bet, players) {
  const owes = pairwiseOwed(points, bet);
  const lines = [];
  for (let i = 0; i < players.length; i++) {
    for (let j = 0; j < players.length; j++) {
      if (owes[i][j] > 0) {
        lines.push({
          from: i,
          to: j,
          fromName: players[i].name,
          toName: players[j].name,
          amount: owes[i][j],
          pointDiff: points[j] - points[i]
        });
      }
    }
  }
  return lines;
}

// ═══ PER-ROUND STATS ══════════════════════════════════════════════════
function calcRoundStats() {
  if (!state.players?.length) return null;
  const stats = {
    wolf: state.games.includes('wolf') ? calcWolfStats() : null,
    skins: state.games.includes('skins') ? calcSkinsStats() : null,
    rabbit: state.games.includes('rabbit') ? calcRabbitStats() : null,
    nassau: state.games.includes('nassau') ? calcNassauStats() : null
  };
  return stats;
}

function calcWolfStats() {
  const n = state.players.length;
  const stats = state.players.map(() => ({
    timesWolf: 0,
    loneWolfAttempts: 0,
    loneWolfWins: 0,
    loneWolfLosses: 0,
    timesPicked: 0,
    timesPickedWon: 0,
    timesPickedLost: 0,
    partnersWith: {} // { playerIdx: { picked: n, won: n } }
  }));

  for (let h = 0; h < 18; h++) {
    const scores = state.players.map(p => p.scores[h]);
    if (scores.some(s => s === null)) continue;

    const wolfIdx = h % 4;
    const pick = state.wolf.picks[h];
    stats[wolfIdx].timesWolf++;

    if (pick === null || pick === 'lone') {
      // Lone wolf
      stats[wolfIdx].loneWolfAttempts++;
      const wolfScore = scores[wolfIdx];
      const others = [0,1,2,3].filter(i => i !== wolfIdx);
      const bestOther = Math.min(...others.map(i => scores[i]));
      if (wolfScore < bestOther) {
        stats[wolfIdx].loneWolfWins++;
      } else if (wolfScore > bestOther) {
        stats[wolfIdx].loneWolfLosses++;
      }
      // Tie = neither win nor loss
    } else {
      // Picked a partner
      const partnerIdx = pick;
      stats[partnerIdx].timesPicked++;
      
      // Track partner relationships
      if (!stats[wolfIdx].partnersWith[partnerIdx]) {
        stats[wolfIdx].partnersWith[partnerIdx] = { picked: 0, won: 0 };
      }
      stats[wolfIdx].partnersWith[partnerIdx].picked++;

      // Determine if they won
      const team1 = [wolfIdx, partnerIdx];
      const team2 = [0,1,2,3].filter(i => !team1.includes(i));
      const best1 = Math.min(...team1.map(i => scores[i]));
      const best2 = Math.min(...team2.map(i => scores[i]));
      
      if (best1 < best2) {
        stats[partnerIdx].timesPickedWon++;
        stats[wolfIdx].partnersWith[partnerIdx].won++;
      } else if (best2 < best1) {
        stats[partnerIdx].timesPickedLost++;
      }
    }
  }
  return stats;
}

function calcSkinsStats() {
  const skins = calcSkins();
  const stats = state.players.map(() => ({
    skinsWon: 0,
    biggestSkin: 0, // carryovers when won
    birdiesSkins: 0,
    parSkins: 0
  }));

  let carryover = 0;
  for (let h = 0; h < 18; h++) {
    const s = skins[h];
    if (s === 'carry') {
      carryover++;
    } else if (typeof s === 'number') {
      const skinValue = carryover + 1;
      stats[s].skinsWon++;
      if (skinValue > stats[s].biggestSkin) {
        stats[s].biggestSkin = skinValue;
      }
      // Check if birdie or par
      const score = state.players[s].scores[h];
      const par = state.pars[h];
      if (score < par) stats[s].birdiesSkins++;
      else if (score === par) stats[s].parSkins++;
      carryover = 0;
    }
  }
  return stats;
}

function calcRabbitStats() {
  const stats = state.players.map(() => ({
    timesHeldAtPayout: 0,
    steals: 0,
    chokes: 0, // had rabbit going into payout hole but lost it
    totalHolesHeld: 0
  }));

  let holder = null;
  let prevHolder = null;

  for (let h = 0; h < 18; h++) {
    const scores = state.players.map(p => p.scores[h]);
    if (scores.some(s => s === null)) continue;

    const low = Math.min(...scores);
    const winners = scores.reduce((a, s, i) => s === low ? [...a, i] : a, []);
    
    prevHolder = holder;
    
    if (winners.length === 1) {
      const winner = winners[0];
      if (holder !== winner && holder !== null) {
        // Steal!
        stats[winner].steals++;
      }
      holder = winner;
    }
    // Tie = holder keeps it (or stays null)

    if (holder !== null) {
      stats[holder].totalHolesHeld++;
    }

    // Payout holes: 6, 12, 18 (indices 5, 11, 17)
    if ((h === 5 || h === 11 || h === 17) && holder !== null) {
      stats[holder].timesHeldAtPayout++;
    }

    // Choke detection: had it going into payout hole but lost it on that hole
    if ((h === 5 || h === 11 || h === 17) && prevHolder !== null && holder !== prevHolder) {
      stats[prevHolder].chokes++;
    }
  }
  return stats;
}

function calcNassauStats() {
  const nassau = calcNassauMoney();
  const stats = state.players.map(() => ({
    frontWins: 0,
    backWins: 0,
    overallWins: 0,
    sweeps: 0
  }));

  // Determine winners for each segment
  const frontScores = state.players.map(p => p.scores.slice(0,9).reduce((a,s)=>a+(s||0),0));
  const backScores = state.players.map(p => p.scores.slice(9,18).reduce((a,s)=>a+(s||0),0));
  const overallScores = state.players.map(p => p.scores.reduce((a,s)=>a+(s||0),0));

  const frontPlayed = (state.players[0]?.scores||[]).slice(0,9).filter(s=>s!==null).length === 9;
  const backPlayed = (state.players[0]?.scores||[]).slice(9,18).filter(s=>s!==null).length === 9;

  let frontWinner = null, backWinner = null, overallWinner = null;

  if (frontPlayed) {
    const minFront = Math.min(...frontScores.filter(s=>s>0));
    const winners = frontScores.reduce((a,s,i) => s===minFront && s>0 ? [...a,i] : a, []);
    if (winners.length === 1) {
      frontWinner = winners[0];
      stats[frontWinner].frontWins++;
    }
  }

  if (backPlayed) {
    const minBack = Math.min(...backScores.filter(s=>s>0));
    const winners = backScores.reduce((a,s,i) => s===minBack && s>0 ? [...a,i] : a, []);
    if (winners.length === 1) {
      backWinner = winners[0];
      stats[backWinner].backWins++;
    }
  }

  if (frontPlayed && backPlayed) {
    const minOverall = Math.min(...overallScores.filter(s=>s>0));
    const winners = overallScores.reduce((a,s,i) => s===minOverall && s>0 ? [...a,i] : a, []);
    if (winners.length === 1) {
      overallWinner = winners[0];
      stats[overallWinner].overallWins++;
    }

    // Sweep check
    if (frontWinner !== null && frontWinner === backWinner && frontWinner === overallWinner) {
      stats[frontWinner].sweeps++;
    }
  }

  return stats;
}

// ═══ SEASON CUMULATIVE STATS ══════════════════════════════════════════
function calcSeasonStats() {
  const rounds = loadRounds();
  if (rounds.length === 0) return {};

  // Aggregate stats by player name
  const playerStats = {};

  rounds.forEach(r => {
    r.players.forEach((p, pIdx) => {
      if (!playerStats[p.name]) {
        playerStats[p.name] = {
          rounds: 0,
          totalMoney: 0,
          totalStrokes: 0,
          // Wolf
          wolfRounds: 0,
          timesWolf: 0,
          loneWolfAttempts: 0,
          loneWolfWins: 0,
          timesPicked: 0,
          timesPickedWon: 0,
          // Skins
          skinsRounds: 0,
          totalSkinsWon: 0,
          biggestSkin: 0,
          // Rabbit
          rabbitRounds: 0,
          timesHeldAtPayout: 0,
          steals: 0,
          // Nassau
          nassauRounds: 0,
          frontWins: 0,
          backWins: 0,
          overallWins: 0,
          sweeps: 0
        };
      }

      const ps = playerStats[p.name];
      ps.rounds++;
      ps.totalMoney += p.money || 0;
      ps.totalStrokes += p.scores.reduce((a,s)=>a+(s||0),0);

      // Reconstruct stats from saved round data
      // For Wolf, we need wolfPicks
      if (r.games?.includes('wolf') && r.wolfPicks) {
        ps.wolfRounds++;
        for (let h = 0; h < 18; h++) {
          const scores = r.players.map(pl => pl.scores[h]);
          if (scores.some(s => s === null)) continue;

          const wolfIdx = h % 4;
          const pick = r.wolfPicks[h];

          if (wolfIdx === pIdx) {
            ps.timesWolf++;
            if (pick === null || pick === 'lone') {
              ps.loneWolfAttempts++;
              const wolfScore = scores[wolfIdx];
              const others = [0,1,2,3].filter(i => i !== wolfIdx);
              const bestOther = Math.min(...others.map(i => scores[i]));
              if (wolfScore < bestOther) ps.loneWolfWins++;
            }
          }

          if (typeof pick === 'number' && pick === pIdx) {
            ps.timesPicked++;
            const team1 = [wolfIdx, pIdx];
            const team2 = [0,1,2,3].filter(i => !team1.includes(i));
            const best1 = Math.min(...team1.map(i => scores[i]));
            const best2 = Math.min(...team2.map(i => scores[i]));
            if (best1 < best2) ps.timesPickedWon++;
          }
        }
      }

      // Skins stats from round
      if (r.games?.includes('skins')) {
        ps.skinsRounds++;
        // Recalculate skins for this round
        let carryover = 0;
        for (let h = 0; h < 18; h++) {
          const scores = r.players.map(pl => pl.scores[h]);
          if (scores.some(s => s === null)) { carryover++; continue; }
          const low = Math.min(...scores);
          const winners = scores.reduce((a,s,i) => s===low ? [...a,i] : a, []);
          if (winners.length === 1) {
            if (winners[0] === pIdx) {
              ps.totalSkinsWon++;
              const skinVal = carryover + 1;
              if (skinVal > ps.biggestSkin) ps.biggestSkin = skinVal;
            }
            carryover = 0;
          } else {
            carryover++;
          }
        }
      }

      // Rabbit stats from round
      if (r.games?.includes('rabbit')) {
        ps.rabbitRounds++;
        let holder = null;
        for (let h = 0; h < 18; h++) {
          const scores = r.players.map(pl => pl.scores[h]);
          if (scores.some(s => s === null)) continue;
          const low = Math.min(...scores);
          const winners = scores.reduce((a,s,i) => s===low ? [...a,i] : a, []);
          if (winners.length === 1) {
            if (holder !== winners[0] && holder !== null && winners[0] === pIdx) {
              ps.steals++;
            }
            holder = winners[0];
          }
          if ((h === 5 || h === 11 || h === 17) && holder === pIdx) {
            ps.timesHeldAtPayout++;
          }
        }
      }

      // Nassau stats from round
      if (r.games?.includes('nassau')) {
        ps.nassauRounds++;
        const frontScores = r.players.map(pl => pl.scores.slice(0,9).reduce((a,s)=>a+(s||0),0));
        const backScores = r.players.map(pl => pl.scores.slice(9,18).reduce((a,s)=>a+(s||0),0));
        const overallScores = r.players.map(pl => pl.scores.reduce((a,s)=>a+(s||0),0));

        const minFront = Math.min(...frontScores.filter(s=>s>0));
        const minBack = Math.min(...backScores.filter(s=>s>0));
        const minOverall = Math.min(...overallScores.filter(s=>s>0));

        const fWinners = frontScores.reduce((a,s,i) => s===minFront && s>0 ? [...a,i] : a, []);
        const bWinners = backScores.reduce((a,s,i) => s===minBack && s>0 ? [...a,i] : a, []);
        const oWinners = overallScores.reduce((a,s,i) => s===minOverall && s>0 ? [...a,i] : a, []);

        if (fWinners.length === 1 && fWinners[0] === pIdx) ps.frontWins++;
        if (bWinners.length === 1 && bWinners[0] === pIdx) ps.backWins++;
        if (oWinners.length === 1 && oWinners[0] === pIdx) ps.overallWins++;
        if (fWinners.length === 1 && fWinners[0] === pIdx && 
            bWinners.length === 1 && bWinners[0] === pIdx &&
            oWinners.length === 1 && oWinners[0] === pIdx) {
          ps.sweeps++;
        }
      }
    });
  });

  return playerStats;
}

function calcTotalMoney() {
  if (!state.players?.length) return Array(4).fill(0);
  const money = Array(4).fill(0);
  if (state.games.includes('rabbit')) { const m = calcRabbitMoney(); m.forEach((v,i)=>money[i]+=v); }
  if (state.games.includes('skins'))  { const m = calcSkinsMoney(); m.forEach((v,i)=>money[i]+=v); }
  if (state.games.includes('wolf'))   { const m = calcWolfMoney(); m.forEach((v,i)=>money[i]+=v); }
  if (state.games.includes('nassau')) { const m = calcNassauMoney(); m.total.forEach((v,i)=>money[i]+=v); }
  return money;
}

// ═══ EDIT SCORE MODAL ════════════════════════════════
let editModal = { holeIdx: null, tempScores: [], roundId: null };

function openEditModal(holeIdx, roundId) {
  // roundId=null means current live round; roundId=string means history round
  editModal.holeIdx = holeIdx;
  editModal.roundId = roundId;
  const pars = roundId ? loadRounds().find(r=>r.id===roundId)?.pars || state.pars : state.pars;
  const players = roundId ? loadRounds().find(r=>r.id===roundId)?.players || [] : state.players.map(p=>({name:p.name,scores:[...p.scores]}));
  editModal.tempScores = players.map(p => p.scores[holeIdx] ?? null);
  const par = pars[holeIdx];
  document.getElementById('modal-title').textContent = `Edit Hole ${holeIdx+1}`;
  document.getElementById('modal-sub').textContent = `Par ${par}${roundId ? ' · Saved round' : ' · Current round'}`;
  const grid = document.getElementById('modal-score-grid');
  grid.innerHTML = '';
  players.forEach((p,i) => {
    const sc = editModal.tempScores[i];
    const cell = document.createElement('div');
    cell.style.cssText = 'text-align:center;';
    cell.innerHTML = `
      <div style="font-size:0.65rem;color:var(--muted);margin-bottom:5px;font-family:var(--font-display);font-weight:700;letter-spacing:.5px;text-transform:uppercase;">${p.name}</div>
      <div style="display:flex;align-items:center;justify-content:center;gap:4px;">
        <button onclick="editModalAdj(${i},-1)" style="width:32px;height:32px;border:1.5px solid var(--border);border-radius:var(--r);background:var(--surface);color:var(--navy);font-size:1.1rem;font-weight:700;cursor:pointer;">−</button>
        <div id="em-val-${i}" style="min-width:26px;text-align:center;font-size:1.1rem;font-weight:700;">${sc ?? '—'}</div>
        <button onclick="editModalAdj(${i},1)" style="width:32px;height:32px;border:1.5px solid var(--border);border-radius:var(--r);background:var(--surface);color:var(--navy);font-size:1.1rem;font-weight:700;cursor:pointer;">+</button>
      </div>`;
    grid.appendChild(cell);
  });
  document.getElementById('edit-modal').style.display = 'flex';
}

function editModalAdj(playerIdx, delta) {
  const cur = editModal.tempScores[playerIdx];
  const newVal = cur === null ? (delta>0?1:null) : Math.max(1, cur+delta);
  editModal.tempScores[playerIdx] = newVal;
  document.getElementById(`em-val-${playerIdx}`).textContent = newVal ?? '—';
}

function closeEditModal() {
  document.getElementById('edit-modal').style.display = 'none';
}

function saveEditModal() {
  const h = editModal.holeIdx;
  if (editModal.roundId) {
    // Edit a saved historical round
    const rounds = loadRounds();
    const rIdx = rounds.findIndex(r=>r.id===editModal.roundId);
    if (rIdx < 0) { closeEditModal(); return; }
    const r = rounds[rIdx];
    // Recalculate money with updated scores
    editModal.tempScores.forEach((sc,i) => { r.players[i].scores[h] = sc; });
    // Recompute money for that round (simplified: rebuild state-like object and recalc)
    // Use saved wolfPicks if available, otherwise default to all lone wolf (null)
    const wolfPicks = r.wolfPicks || Array(18).fill(null);
    const tempState = { players: r.players.map(p=>({name:p.name,scores:[...p.scores]})), games: r.games, bets: r.bets, pars: r.pars, currentHole:17, wolf:{picks:wolfPicks}, rabbit:{holder:null} };
    const savedState = JSON.parse(JSON.stringify(state));
    Object.assign(state, tempState);
    const newMoney = calcTotalMoney();
    const gameMoney = {};
    if(r.games.includes('skins')) gameMoney.skins=calcSkinsMoney();
    if(r.games.includes('rabbit')) gameMoney.rabbit=calcRabbitMoney();
    if(r.games.includes('wolf')) gameMoney.wolf=calcWolfMoney();
    if(r.games.includes('nassau')) gameMoney.nassau=calcNassauMoney().total;
    Object.assign(state, savedState);
    r.players.forEach((p,i) => { p.money = newMoney[i]; });
    r.gameMoney = gameMoney;
    r.holesPlayed = r.players[0].scores.filter(s=>s!==null).length;
    rounds[rIdx] = r;
    try { localStorage.setItem('golf_rounds', JSON.stringify(rounds)); } catch(e) {}
    gistSync();
    closeEditModal();
    renderHistory();
  } else {
    // Edit current live round
    editModal.tempScores.forEach((sc,i) => { state.players[i].scores[h] = sc; });
    closeEditModal();
    autoSaveRound();
    renderHole();
    saveActiveRound();
  }
}

// ═══ PRINT / CLEAN VIEW ══════════════════════════════
function renderPrintView() {
  const body = document.getElementById('print-body');
  body.innerHTML = '';
  const money = calcTotalMoney();
  const dateStr = state.roundDate ? new Date(state.roundDate).toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'}) : '';

  // Header
  const hdr = document.createElement('div');
  hdr.style.cssText = 'background:var(--navy);border-radius:var(--r-md);padding:14px 16px;margin-bottom:14px;';
  hdr.innerHTML = `
    <div style="font-family:var(--font-display);font-size:1.4rem;font-weight:800;letter-spacing:2px;color:var(--gold);">${state.courseName}</div>
    <div style="font-size:0.78rem;color:var(--blue-soft);margin-top:3px;">${dateStr}${state.teeName ? ' · '+state.teeName : ''}</div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:12px;">
      ${state.players.map((p,i)=>{const amt=money[i];return `<div style="background:rgba(255,255,255,0.07);border-radius:var(--r);padding:8px;text-align:center;"><div style="font-size:0.65rem;color:var(--blue-soft);font-family:var(--font-display);font-weight:700;letter-spacing:.5px;">${p.name}</div><div style="font-family:var(--font-display);font-size:1.2rem;font-weight:800;margin-top:2px;color:${amt>0?'#86efac':amt<0?'#fca5a5':'var(--blue-soft)'};">${fmt(amt)}</div></div>`;}).join('')}
    </div>`;
  body.appendChild(hdr);

  // Scorecard table
  const tableWrap = document.createElement('div');
  tableWrap.style.cssText = 'overflow-x:auto;margin-bottom:14px;';
  const table = document.createElement('table');
  table.style.cssText = 'min-width:460px;font-size:0.78rem;';
  const thead = document.createElement('thead');
  const tr1 = document.createElement('tr');
  ['Player','1','2','3','4','5','6','7','8','9','Out','10','11','12','13','14','15','16','17','18','In','Tot'].forEach(h=>{
    const th=document.createElement('th');th.textContent=h;tr1.appendChild(th);
  });
  thead.appendChild(tr1);
  const parRow = document.createElement('tr');
  ['Par',...state.pars.slice(0,9),state.pars.slice(0,9).reduce((a,b)=>a+b,0),...state.pars.slice(9),state.pars.slice(9).reduce((a,b)=>a+b,0),state.pars.reduce((a,b)=>a+b,0)].forEach(v=>{
    const td=document.createElement('td');td.textContent=v;td.style.cssText='color:var(--muted);font-size:0.75rem;';parRow.appendChild(td);
  });
  thead.appendChild(parRow);
  table.appendChild(thead);
  const tbody = document.createElement('tbody');
  state.players.forEach((p,pi)=>{
    const tr=document.createElement('tr');
    const f9=p.scores.slice(0,9).reduce((a,s)=>a+(s||0),0);
    const b9=p.scores.slice(9).reduce((a,s)=>a+(s||0),0);
    const cells=[p.name,...p.scores.slice(0,9),f9||'',...p.scores.slice(9),b9||'',(f9+b9)||''];
    cells.forEach((v,ci)=>{
      const td=document.createElement('td');
      if(ci===0){td.textContent=v;td.style.color=COLORS[pi%4];td.style.fontWeight='700';}
      else if(ci===10||ci===20||ci===21){td.textContent=v||'';td.style.fontWeight='700';td.style.background='rgba(240,192,64,0.08)';}
      else{
        const ri=ci<10?ci-1:ci===20||ci===21?-1:ci-11;
        if(ri>=0&&ri<18){const sc=p.scores[ri];if(sc===null){td.textContent='—';td.className='cell-empty';}else{const d=sc-state.pars[ri];td.textContent=sc;if(d<=-2)td.className='cell-eagle';else if(d===-1)td.className='cell-birdie';else if(d===0)td.className='cell-par';else if(d===1)td.className='cell-bogey';else td.className='cell-double';}}
        else{td.textContent=v||'';}
      }
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  tableWrap.appendChild(table);
  body.appendChild(tableWrap);

  // Game breakdown
  if (state.games.length > 0) {
    const bdTitle = document.createElement('div');
    bdTitle.style.cssText = 'font-family:var(--font-display);font-size:0.6rem;letter-spacing:2px;color:var(--slate);text-transform:uppercase;border-bottom:2px solid var(--border);padding-bottom:5px;margin-bottom:10px;';
    bdTitle.textContent = 'Game Breakdown';
    body.appendChild(bdTitle);
    const icons={skins:'🎰',rabbit:'🐇',wolf:'🐺',nassau:'🏆'};
    const names={skins:'Skins',rabbit:'Rabbit',wolf:'Wolf',nassau:'Nassau'};
    state.games.forEach(g=>{
      let gm;
      if(g==='skins')gm=calcSkinsMoney();
      else if(g==='rabbit')gm=calcRabbitMoney();
      else if(g==='wolf')gm=calcWolfMoney();
      else if(g==='nassau')gm=calcNassauMoney().total;
      const card=document.createElement('div');
      card.style.cssText='background:var(--white);border:1px solid var(--border);border-radius:var(--r);padding:10px 12px;margin-bottom:8px;box-shadow:var(--shadow-sm);';
      card.innerHTML=`<div style="font-family:var(--font-display);font-size:0.7rem;font-weight:700;letter-spacing:1px;color:var(--slate);text-transform:uppercase;margin-bottom:8px;">${icons[g]} ${names[g]}</div><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;">${state.players.map((p,i)=>{const amt=gm[i];return `<div style="text-align:center;"><div style="font-size:0.7rem;color:var(--muted);">${p.name}</div><div style="font-size:0.95rem;font-weight:700;color:${amt>0?'var(--green)':amt<0?'var(--red)':'var(--muted)'};">${fmt(amt)}</div></div>`;}).join('')}</div>`;
      body.appendChild(card);
    });
  }
}

// ═══ GITHUB GIST SYNC ════════════════════════════════
function getGistToken() { return localStorage.getItem('gist_token')||''; }
function getGistId()    { return localStorage.getItem('gist_id')||''; }
function setGistLog(msg, color='var(--muted)') {
  const el = document.getElementById('gist-log');
  if (el) { el.textContent = msg; el.style.color = color; }
}

async function gistSave() {
  const token = getGistToken();
  if (!token) { setGistLog('No token — enter your GitHub token first.','var(--red)'); return; }
  const rounds = loadRounds();
  const content = JSON.stringify(rounds, null, 2);
  setGistLog('Syncing…','var(--amber)');
  try {
    const existingId = getGistId();
    let url = 'https://api.github.com/gists';
    let method = 'POST';
    if (existingId) { url += '/'+existingId; method = 'PATCH'; }
    const res = await fetch(url, {
      method,
      headers:{'Authorization':'token '+token,'Content-Type':'application/json'},
      body: JSON.stringify({ description:'The Bunker — Round History', public:false, files:{'golf-rounds.json':{content}} })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!existingId) localStorage.setItem('gist_id', data.id);
    setGistLog('✓ Saved to Gist at '+new Date().toLocaleTimeString(),'var(--green)');
  } catch(e) { setGistLog('Error: '+e.message,'var(--red)'); }
}

async function gistLoad() {
  const token = getGistToken(), id = getGistId();
  if (!token || !id) { setGistLog('Token and Gist ID required.','var(--red)'); return; }
  setGistLog('Loading…','var(--amber)');
  try {
    const res = await fetch(`https://api.github.com/gists/${id}`, {headers:{'Authorization':'token '+token}});
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const content = data.files['golf-rounds.json']?.content;
    if (!content) throw new Error('File not found in Gist');
    const rounds = JSON.parse(content);
    localStorage.setItem('golf_rounds', JSON.stringify(rounds));
    setGistLog(`✓ Loaded ${rounds.length} rounds from Gist`,'var(--green)');
    renderHistory();
  } catch(e) { setGistLog('Error: '+e.message,'var(--red)'); }
}

function gistSync() {
  if (getGistToken()) gistSave();
}

function saveGistSettings() {
  const token = document.getElementById('gist-token-input')?.value?.trim();
  const id = document.getElementById('gist-id-input')?.value?.trim();
  if (token) localStorage.setItem('gist_token', token);
  if (id !== undefined) localStorage.setItem('gist_id', id);
  setGistLog('Settings saved.','var(--green)');
}

function renderGistPanel() {
  const token = getGistToken(), id = getGistId();
  return `
    <div style="background:var(--white);border:1px solid var(--border);border-radius:var(--r-md);padding:14px;margin-bottom:14px;box-shadow:var(--shadow-sm);">
      <div style="font-family:var(--font-display);font-size:0.6rem;letter-spacing:2px;color:var(--slate);text-transform:uppercase;border-bottom:2px solid var(--border);padding-bottom:5px;margin-bottom:10px;">☁️ GitHub Gist Sync</div>
      <div style="font-size:0.78rem;color:var(--muted);margin-bottom:10px;line-height:1.5;">
        Save your round history to a private GitHub Gist so it persists across devices. 
        <a href="https://github.com/settings/tokens/new?scopes=gist&description=The+Bunker" target="_blank" style="color:var(--navy-light);">Create a token here</a> (only needs <code>gist</code> scope).
      </div>
      <div style="display:flex;flex-direction:column;gap:7px;margin-bottom:10px;">
        <input id="gist-token-input" type="password" placeholder="GitHub token (ghp_…)" value="${token}" style="border:1.5px solid var(--border);border-radius:var(--r);padding:8px 10px;font-size:0.82rem;font-family:monospace;outline:none;color:var(--text);">
        <input id="gist-id-input" type="text" placeholder="Gist ID (leave blank for first save)" value="${id}" style="border:1.5px solid var(--border);border-radius:var(--r);padding:8px 10px;font-size:0.82rem;font-family:monospace;outline:none;color:var(--text);">
      </div>
      <div style="display:flex;gap:7px;flex-wrap:wrap;">
        <button onclick="saveGistSettings()" style="padding:8px 12px;background:var(--navy-mid);color:var(--gold);border:none;border-radius:var(--r);font-family:var(--font-display);font-size:0.75rem;font-weight:700;letter-spacing:1px;cursor:pointer;">Save Settings</button>
        <button onclick="gistSave()" style="padding:8px 12px;background:var(--green-bg);color:var(--green);border:1px solid var(--green);border-radius:var(--r);font-family:var(--font-display);font-size:0.75rem;font-weight:700;letter-spacing:1px;cursor:pointer;">↑ Push to Gist</button>
        <button onclick="gistLoad()" style="padding:8px 12px;background:var(--surface);color:var(--slate);border:1px solid var(--border);border-radius:var(--r);font-family:var(--font-display);font-size:0.75rem;font-weight:700;letter-spacing:1px;cursor:pointer;">↓ Pull from Gist</button>
      </div>
      <div id="gist-log" style="font-size:0.72rem;color:var(--muted);margin-top:7px;font-family:monospace;min-height:16px;"></div>
    </div>`;
}

// ═══════════════════════════════════════════════════════
function recalc() { /* state computed live */ }

// ── SCORECARD TABLE ──────────────────────────────────────────────────
function renderScorecardTable() {
  const wrap = document.getElementById('sc-table-wrap');
  wrap.innerHTML = '';
  const table = document.createElement('table');

  // Head
  const thead = document.createElement('thead');
  const tr1 = document.createElement('tr');
  ['Player','1','2','3','4','5','6','7','8','9','Out','10','11','12','13','14','15','16','17','18','In','Total'].forEach((h,i) => {
    const th = document.createElement('th');
    th.textContent = h;
    if (i===10||i===20||i===21) th.style.background='rgba(201,168,76,0.1)';
    tr1.appendChild(th);
  });
  thead.appendChild(tr1);

  // Par row
  const parRow = document.createElement('tr');
  const parCells = ['Par',...state.pars.slice(0,9), state.pars.slice(0,9).reduce((a,b)=>a+b,0),
                    ...state.pars.slice(9), state.pars.slice(9).reduce((a,b)=>a+b,0),
                    state.pars.reduce((a,b)=>a+b,0)];
  parCells.forEach((v,i) => {
    const td = document.createElement('td');
    td.textContent = v; td.style.color='var(--muted)'; td.style.fontSize='0.8rem';
    if(i===10||i===20||i===21) td.style.background='rgba(201,168,76,0.06)';
    parRow.appendChild(td);
  });
  thead.appendChild(parRow);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  state.players.forEach((p,pi) => {
    const tr = document.createElement('tr');
    const front9 = p.scores.slice(0,9).reduce((a,s)=>a+(s||0),0);
    const back9 = p.scores.slice(9).reduce((a,s)=>a+(s||0),0);
    const total = front9 + back9;
    const cells = [p.name, ...p.scores.slice(0,9), front9||'', ...p.scores.slice(9), back9||'', total||''];
    cells.forEach((v,ci) => {
      const td = document.createElement('td');
      if (ci === 0) { td.textContent = v; td.style.color=COLORS[pi]; td.style.fontWeight='700'; }
      else if (ci === 10 || ci === 20 || ci === 21) {
        td.textContent = v||''; td.style.background='rgba(201,168,76,0.06)'; td.style.fontWeight='700';
      } else {
        const hIdx = ci <= 9 ? ci-1 : ci-11;
        const score = p.scores[ci <= 9 ? ci-1 : ci-2]; // adjust for Out col
        const actualIdx = ci < 10 ? ci-1 : ci-11;
        const s = p.scores[ci < 10 ? ci-1 : ci === 20 ? 8 : ci-11]; // hacky but works
        const realIdx = ci < 10 ? ci - 1 : ci === 20 ? -1 : ci === 21 ? -1 : ci - 11;
        if (realIdx >= 0 && realIdx < 18) {
          const sc = p.scores[realIdx];
          if (sc === null) { td.textContent = '—'; td.className = 'cell-empty'; }
          else {
            const diff = sc - state.pars[realIdx];
            td.textContent = sc;
            if (diff <= -2) td.className = 'cell-eagle';
            else if (diff === -1) td.className = 'cell-birdie';
            else if (diff === 0) td.className = 'cell-par';
            else if (diff === 1) td.className = 'cell-bogey';
            else td.className = 'cell-double';
          }
        } else { td.textContent = v||'—'; }
      }
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);

  // Money footer
  const tfoot = document.createElement('tfoot');
  const mtr = document.createElement('tr');
  const money = calcTotalMoney();
  const mCells = ['Net',...Array(19).fill(''),...money.map(m=>fmt(m))];
  // Just show money at the end
  const mtr2 = document.createElement('tr');
  ['Money',...Array(20).fill(''), ...money.map(m=>fmt(m))].slice(0,22).forEach((v,i)=>{
    const td = document.createElement('td');
    if (i < 2 || i > 18) {
      td.textContent = v;
      if (i > 18) {
        const idx = i - 19;
        const amt = money[idx];
        td.style.color = amt > 0 ? 'var(--green-win)' : amt < 0 ? 'var(--red)' : 'var(--muted)';
      }
    }
    mtr2.appendChild(td);
  });

  // Simpler money row
  const moneyTr = document.createElement('tr');
  state.players.forEach((p,i) => {
    const td = document.createElement('td');
    td.colSpan = 1;
  });

  tfoot.appendChild(mtr);
  table.appendChild(tfoot);
  wrap.appendChild(table);

  // Money summary below
  const mSummary = document.createElement('div');
  mSummary.style.cssText = 'margin-top:20px;';
  mSummary.innerHTML = `<div style="font-size:0.65rem;letter-spacing:0.2em;text-transform:uppercase;color:var(--gold);margin-bottom:12px;">Money Summary</div>`;
  const mGrid = document.createElement('div');
  mGrid.style.cssText = 'display:grid;grid-template-columns:repeat(4,1fr);gap:10px;';
  state.players.forEach((p,i) => {
    const cell = document.createElement('div');
    cell.style.cssText = 'background:var(--bg2);border:1px solid var(--border);border-radius:4px;padding:12px;text-align:center;';
    const amt = money[i];
    cell.innerHTML = `<div style="font-size:0.75rem;color:var(--muted);margin-bottom:4px;">${p.name}</div><div style="font-family:var(--font-display);font-size:1.4rem;font-weight:800;color:${amt>0?'var(--green)':amt<0?'var(--red)':'var(--muted)'};">${fmt(amt)}</div>`;
    mGrid.appendChild(cell);
  });
  mSummary.appendChild(mGrid);
  wrap.appendChild(mSummary);
}

// ── RESULTS ──────────────────────────────────────────────────────────
function renderResultsFromRound(r) {
  const icons = {skins:'🎰',rabbit:'🐇',wolf:'🐺',nassau:'🏆'};
  const gnames = {skins:'Skins',rabbit:'Rabbit',wolf:'Wolf',nassau:'Nassau'};
  const content = document.getElementById('results-content');
  content.innerHTML = '';
  const dateStr = r.date ? new Date(r.date).toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'}) : '';
  const sub = el('div'); sub.style.cssText='text-align:center;padding:10px 14px 4px;font-size:0.78rem;color:var(--muted);';
  sub.textContent = [r.courseName, r.teeName, dateStr].filter(Boolean).join(' · ');
  content.appendChild(sub);
  const sorted = r.players.map((p,i)=>({...p,idx:i,total:(p.scores||[]).reduce((a,s)=>a+(s||0),0)})).sort((a,b)=>b.money-a.money);
  const card = el('div','results-card');
  ['🥇','🥈','🥉','4️⃣'].forEach((medal,rank)=>{
    const p=sorted[rank]; if(!p) return;
    const row=el('div','results-row');
    row.innerHTML=`<div class="rr-rank">${medal}</div><div class="rr-name" style="color:${COLORS[p.idx%4]}">${p.name}</div><div class="rr-score">${p.total>0?p.total+' strokes':'–'}</div><div class="rr-money ${p.money>0?'pos':p.money<0?'neg':'zero'}" style="color:${p.money>0?'var(--green-win)':p.money<0?'var(--red)':'var(--muted)'}">${fmt(p.money)}</div>`;
    card.appendChild(row);
  });
  content.appendChild(card);
  if (r.games && r.games.length > 0) {
    const breakdown=el('div'); breakdown.style.cssText='margin-top:16px;width:100%;';
    const bTitle=el('div'); bTitle.style.cssText='font-size:0.65rem;letter-spacing:0.2em;text-transform:uppercase;color:var(--gold);margin-bottom:10px;'; bTitle.textContent='Game Breakdown'; breakdown.appendChild(bTitle);
    r.games.forEach(g=>{
      const gm=(r.gameMoney&&r.gameMoney[g])?r.gameMoney[g]:Array(4).fill(0);
      const gCard=el('div'); gCard.style.cssText='background:var(--white);border:1px solid var(--border);border-radius:var(--r-md);padding:12px 14px;margin-bottom:8px;box-shadow:var(--shadow-sm);';
      gCard.innerHTML=`<div style="font-family:var(--font-display);font-size:0.75rem;font-weight:700;letter-spacing:1px;color:var(--slate);margin-bottom:8px;">${icons[g]||''} ${(gnames[g]||g).toUpperCase()}</div>`;
      const gGrid=el('div'); gGrid.style.cssText='display:grid;grid-template-columns:repeat(4,1fr);gap:6px;';
      r.players.forEach((p,i)=>{const amt=gm[i]||0;const c=el('div');c.style.cssText='text-align:center;';c.innerHTML=`<div style="font-size:0.7rem;color:var(--muted);">${p.name}</div><div style="font-size:1rem;font-weight:700;color:${amt>0?'var(--green)':amt<0?'var(--red)':'var(--muted)'};">${fmt(amt)}</div>`;gGrid.appendChild(c);});
      gCard.appendChild(gGrid); breakdown.appendChild(gCard);
    });
    const totalCard=el('div'); totalCard.style.cssText='background:var(--navy-mid);border:1px solid rgba(255,255,255,0.08);border-radius:var(--r-md);padding:12px 14px;margin-bottom:8px;';
    totalCard.innerHTML=`<div style="font-family:var(--font-display);font-size:0.75rem;font-weight:700;letter-spacing:1px;color:var(--gold);margin-bottom:8px;">💰 TOTAL</div>`;
    const totalGrid=el('div'); totalGrid.style.cssText='display:grid;grid-template-columns:repeat(4,1fr);gap:6px;';
    r.players.forEach((p,i)=>{const amt=p.money||0;const c=el('div');c.style.cssText='text-align:center;';c.innerHTML=`<div style="font-size:0.7rem;color:var(--blue-soft);">${p.name}</div><div style="font-family:var(--font-display);font-size:1.3rem;font-weight:800;color:${amt>0?'#86efac':amt<0?'#fca5a5':'var(--blue-soft)'};">${fmt(amt)}</div>`;totalGrid.appendChild(c);});
    totalCard.appendChild(totalGrid); breakdown.appendChild(totalCard);
    content.appendChild(breakdown);
  }
}

function renderResults() {
  if (!state.players || state.players.length === 0) return;
  const content = document.getElementById('results-content');
  content.innerHTML = '';

  // ── SECTION LABEL: Scorecard Review ──
  const scLabel = el('div');
  scLabel.style.cssText = 'font-size:0.65rem;letter-spacing:0.2em;text-transform:uppercase;color:var(--gold);margin-bottom:8px;font-family:var(--font-display);font-weight:700;';
  scLabel.textContent = '📋 Scorecard — Tap any score to edit';
  content.appendChild(scLabel);

  // ── INLINE EDITABLE SCORECARD TABLE ──
  const scWrap = el('div');
  scWrap.style.cssText = 'overflow-x:auto;margin-bottom:20px;border-radius:var(--r-md);box-shadow:var(--shadow-sm);';
  scWrap.appendChild(buildReviewScorecardTable());
  content.appendChild(scWrap);

  // ── MONEY SUMMARY ──
  renderResultsMoney(content);

  // ── ROUND STATS ──
  renderRoundStats(content);

  // ── CONFIRM & SAVE BUTTON ──
  const saveWrap = el('div');
  saveWrap.style.cssText = 'padding:16px 0 40px;text-align:center;';
  saveWrap.innerHTML = `
    <div style="font-size:0.78rem;color:var(--muted);margin-bottom:12px;">Everyone happy with the scorecard?</div>
    <button onclick="saveAndNewRound()" style="background:var(--gold);color:var(--navy);font-family:var(--font-display);font-size:1rem;font-weight:800;letter-spacing:2px;border:none;border-radius:var(--r-md);padding:16px 40px;cursor:pointer;box-shadow:0 4px 12px rgba(240,192,64,0.3);">✓ Confirm &amp; Save</button>`;
  content.appendChild(saveWrap);
}

function renderRoundStats(content) {
  const stats = calcRoundStats();
  if (!stats) return;

  const statsSection = el('div');
  statsSection.style.cssText = 'margin-top:20px;width:100%;';

  const sTitle = el('div');
  sTitle.style.cssText = 'font-size:0.65rem;letter-spacing:0.2em;text-transform:uppercase;color:var(--gold);margin-bottom:10px;font-family:var(--font-display);font-weight:700;';
  sTitle.textContent = '📊 Round Stats';
  statsSection.appendChild(sTitle);

  // Wolf stats
  if (stats.wolf) {
    const wolfCard = el('div');
    wolfCard.style.cssText = 'background:var(--white);border:1px solid var(--border);border-radius:var(--r-md);padding:14px;margin-bottom:10px;';
    
    const wolfTitle = el('div');
    wolfTitle.style.cssText = 'font-family:var(--font-display);font-size:0.75rem;font-weight:700;letter-spacing:1px;color:var(--slate);margin-bottom:10px;';
    wolfTitle.textContent = '🐺 WOLF STATS';
    wolfCard.appendChild(wolfTitle);

    const wolfGrid = el('div');
    wolfGrid.style.cssText = 'display:grid;grid-template-columns:repeat(2,1fr);gap:8px;';

    state.players.forEach((p, i) => {
      const ws = stats.wolf[i];
      const cell = el('div');
      cell.style.cssText = 'background:var(--surface);border-radius:var(--r);padding:10px;';
      
      const loneRecord = ws.loneWolfAttempts > 0 
        ? `${ws.loneWolfWins}-${ws.loneWolfLosses}-${ws.loneWolfAttempts - ws.loneWolfWins - ws.loneWolfLosses}`
        : '0-0-0';
      const pickedRecord = ws.timesPicked > 0
        ? `${ws.timesPickedWon}-${ws.timesPickedLost}-${ws.timesPicked - ws.timesPickedWon - ws.timesPickedLost}`
        : '0-0-0';

      cell.innerHTML = `
        <div style="font-weight:700;color:${COLORS[i]};margin-bottom:6px;">${p.name}</div>
        <div style="font-size:0.72rem;color:var(--muted);line-height:1.6;">
          <div>🐺 Lone: <span style="color:var(--text);">${loneRecord}</span> <span style="color:var(--muted);font-size:0.65rem;">(W-L-T)</span></div>
          <div>👆 Picked: <span style="color:var(--text);">${ws.timesPicked}x</span> ${ws.timesPicked > 0 ? `(won ${ws.timesPickedWon})` : ''}</div>
        </div>`;
      wolfGrid.appendChild(cell);
    });

    wolfCard.appendChild(wolfGrid);
    statsSection.appendChild(wolfCard);
  }

  // Skins stats
  if (stats.skins) {
    const skinsCard = el('div');
    skinsCard.style.cssText = 'background:var(--white);border:1px solid var(--border);border-radius:var(--r-md);padding:14px;margin-bottom:10px;';
    
    const skinsTitle = el('div');
    skinsTitle.style.cssText = 'font-family:var(--font-display);font-size:0.75rem;font-weight:700;letter-spacing:1px;color:var(--slate);margin-bottom:10px;';
    skinsTitle.textContent = '🎰 SKINS STATS';
    skinsCard.appendChild(skinsTitle);

    const skinsGrid = el('div');
    skinsGrid.style.cssText = 'display:grid;grid-template-columns:repeat(4,1fr);gap:6px;text-align:center;';

    state.players.forEach((p, i) => {
      const ss = stats.skins[i];
      const cell = el('div');
      cell.style.cssText = 'background:var(--surface);border-radius:var(--r);padding:8px;';
      cell.innerHTML = `
        <div style="font-size:0.7rem;color:${COLORS[i]};font-weight:600;margin-bottom:4px;">${p.name}</div>
        <div style="font-size:1.2rem;font-weight:800;color:var(--text);">${ss.skinsWon}</div>
        <div style="font-size:0.6rem;color:var(--muted);">skins</div>
        ${ss.biggestSkin > 1 ? `<div style="font-size:0.6rem;color:var(--amber);margin-top:2px;">🔥 ${ss.biggestSkin}-way</div>` : ''}`;
      skinsGrid.appendChild(cell);
    });

    skinsCard.appendChild(skinsGrid);
    statsSection.appendChild(skinsCard);
  }

  // Rabbit stats
  if (stats.rabbit) {
    const rabbitCard = el('div');
    rabbitCard.style.cssText = 'background:var(--white);border:1px solid var(--border);border-radius:var(--r-md);padding:14px;margin-bottom:10px;';
    
    const rabbitTitle = el('div');
    rabbitTitle.style.cssText = 'font-family:var(--font-display);font-size:0.75rem;font-weight:700;letter-spacing:1px;color:var(--slate);margin-bottom:10px;';
    rabbitTitle.textContent = '🐇 RABBIT STATS';
    rabbitCard.appendChild(rabbitTitle);

    const rabbitGrid = el('div');
    rabbitGrid.style.cssText = 'display:grid;grid-template-columns:repeat(4,1fr);gap:6px;text-align:center;';

    state.players.forEach((p, i) => {
      const rs = stats.rabbit[i];
      const cell = el('div');
      cell.style.cssText = 'background:var(--surface);border-radius:var(--r);padding:8px;';
      cell.innerHTML = `
        <div style="font-size:0.7rem;color:${COLORS[i]};font-weight:600;margin-bottom:4px;">${p.name}</div>
        <div style="font-size:1rem;font-weight:700;color:var(--text);">${rs.timesHeldAtPayout}</div>
        <div style="font-size:0.6rem;color:var(--muted);">payouts</div>
        <div style="font-size:0.6rem;color:var(--muted);margin-top:2px;">
          ${rs.steals > 0 ? `<span style="color:var(--green);">${rs.steals} steals</span>` : ''}
          ${rs.chokes > 0 ? `<span style="color:var(--red);"> ${rs.chokes} chokes</span>` : ''}
        </div>`;
      rabbitGrid.appendChild(cell);
    });

    rabbitCard.appendChild(rabbitGrid);
    statsSection.appendChild(rabbitCard);
  }

  // Nassau stats
  if (stats.nassau) {
    const nassauCard = el('div');
    nassauCard.style.cssText = 'background:var(--white);border:1px solid var(--border);border-radius:var(--r-md);padding:14px;margin-bottom:10px;';
    
    const nassauTitle = el('div');
    nassauTitle.style.cssText = 'font-family:var(--font-display);font-size:0.75rem;font-weight:700;letter-spacing:1px;color:var(--slate);margin-bottom:10px;';
    nassauTitle.textContent = '🏆 NASSAU STATS';
    nassauCard.appendChild(nassauTitle);

    const nassauGrid = el('div');
    nassauGrid.style.cssText = 'display:grid;grid-template-columns:repeat(4,1fr);gap:6px;text-align:center;';

    state.players.forEach((p, i) => {
      const ns = stats.nassau[i];
      const wins = ns.frontWins + ns.backWins + ns.overallWins;
      const cell = el('div');
      cell.style.cssText = 'background:var(--surface);border-radius:var(--r);padding:8px;';
      cell.innerHTML = `
        <div style="font-size:0.7rem;color:${COLORS[i]};font-weight:600;margin-bottom:4px;">${p.name}</div>
        <div style="font-size:1rem;font-weight:700;color:var(--text);">${wins}</div>
        <div style="font-size:0.6rem;color:var(--muted);">wins</div>
        ${ns.sweeps > 0 ? `<div style="font-size:0.6rem;color:var(--gold);margin-top:2px;">🧹 SWEEP</div>` : ''}`;
      nassauGrid.appendChild(cell);
    });

    nassauCard.appendChild(nassauGrid);
    statsSection.appendChild(nassauCard);
  }

  content.appendChild(statsSection);
}

function buildReviewScorecardTable() {
  const table = document.createElement('table');
  table.style.cssText = 'width:100%;border-collapse:collapse;font-size:0.78rem;';

  // Header row
  const thead = document.createElement('thead');
  const hrow = document.createElement('tr');
  hrow.style.background = 'var(--navy)';
  ['Player','1','2','3','4','5','6','7','8','9','OUT','10','11','12','13','14','15','16','17','18','IN','TOT'].forEach((h,i) => {
    const th = document.createElement('th');
    th.textContent = h;
    th.style.cssText = `padding:6px ${i===0?'10px':'4px'};color:var(--gold);font-family:var(--font-display);letter-spacing:1px;text-align:${i===0?'left':'center'};white-space:nowrap;${(i===10||i===20||i===21)?'background:rgba(240,192,64,0.15);':''}`;
    hrow.appendChild(th);
  });
  thead.appendChild(hrow);

  // Par row
  const parRow = document.createElement('tr');
  parRow.style.background = 'var(--navy-mid)';
  const parCells = ['Par',...state.pars.slice(0,9),
    state.pars.slice(0,9).reduce((a,b)=>a+b,0),
    ...state.pars.slice(9),
    state.pars.slice(9).reduce((a,b)=>a+b,0),
    state.pars.reduce((a,b)=>a+b,0)];
  parCells.forEach((v,i) => {
    const td = document.createElement('td');
    td.textContent = v;
    td.style.cssText = `padding:4px ${i===0?'10px':'4px'};color:var(--muted);text-align:${i===0?'left':'center'};font-size:0.72rem;${(i===10||i===20||i===21)?'background:rgba(240,192,64,0.08);':''}`;
    parRow.appendChild(td);
  });
  thead.appendChild(parRow);
  table.appendChild(thead);

  // Player rows
  const tbody = document.createElement('tbody');
  state.players.forEach((p, pi) => {
    const tr = document.createElement('tr');
    tr.style.background = pi % 2 === 0 ? 'var(--white)' : '#f8fafc';

    // Name cell
    const nameTd = document.createElement('td');
    nameTd.textContent = p.name;
    nameTd.style.cssText = `padding:6px 10px;font-weight:700;color:${COLORS[pi]};white-space:nowrap;`;
    tr.appendChild(nameTd);

    // Score cells for holes 1-9
    for (let h = 0; h < 9; h++) {
      tr.appendChild(makeReviewScoreCell(pi, h));
    }
    // OUT
    const outTd = document.createElement('td');
    const front = p.scores.slice(0,9).reduce((a,s)=>a+(s||0),0);
    outTd.textContent = front || '—';
    outTd.style.cssText = 'padding:6px 4px;text-align:center;font-weight:700;background:rgba(240,192,64,0.08);';
    tr.appendChild(outTd);

    // Score cells for holes 10-18
    for (let h = 9; h < 18; h++) {
      tr.appendChild(makeReviewScoreCell(pi, h));
    }
    // IN
    const inTd = document.createElement('td');
    const back = p.scores.slice(9).reduce((a,s)=>a+(s||0),0);
    inTd.textContent = back || '—';
    inTd.style.cssText = 'padding:6px 4px;text-align:center;font-weight:700;background:rgba(240,192,64,0.08);';
    tr.appendChild(inTd);

    // TOT
    const totTd = document.createElement('td');
    const tot = front + back;
    totTd.textContent = tot || '—';
    totTd.style.cssText = 'padding:6px 4px;text-align:center;font-weight:800;background:rgba(240,192,64,0.08);';
    tr.appendChild(totTd);

    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  return table;
}

function makeReviewScoreCell(pi, h) {
  const td = document.createElement('td');
  const sc = state.players[pi].scores[h];
  const par = state.pars[h];
  const diff = sc !== null ? sc - par : null;
  td.textContent = sc !== null ? sc : '—';
  td.style.cssText = 'padding:5px 4px;text-align:center;cursor:pointer;border-radius:3px;transition:background .15s;';
  if (sc !== null && diff !== null) {
    if (diff <= -2) td.style.cssText += 'background:#fef08a;color:#854d0e;font-weight:700;';
    else if (diff === -1) td.style.cssText += 'background:#bbf7d0;color:#166534;font-weight:700;';
    else if (diff === 0) td.style.cssText += 'color:var(--navy);';
    else if (diff === 1) td.style.cssText += 'color:var(--red);';
    else td.style.cssText += 'color:var(--red);font-weight:700;';
  } else {
    td.style.cssText += 'color:var(--muted);';
  }
  td.onclick = () => openReviewEditModal(pi, h);
  td.title = `Edit ${state.players[pi].name} hole ${h+1}`;
  return td;
}

function openReviewEditModal(pi, h) {
  // Remove any existing modal
  const existing = document.getElementById('review-edit-modal');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'review-edit-modal';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:999;display:flex;align-items:center;justify-content:center;padding:20px;';

  const modal = document.createElement('div');
  modal.style.cssText = 'background:var(--white);border-radius:var(--r-md);padding:24px 20px;width:100%;max-width:320px;box-shadow:0 20px 60px rgba(0,0,0,0.4);';

  const curScore = state.players[pi].scores[h] ?? state.pars[h];
  let tempScore = curScore;

  modal.innerHTML = `
    <div style="font-family:var(--font-display);font-size:0.65rem;letter-spacing:2px;text-transform:uppercase;color:var(--muted);margin-bottom:4px;">Edit Score</div>
    <div style="font-family:var(--font-display);font-size:1.1rem;font-weight:800;color:var(--navy);margin-bottom:16px;">${state.players[pi].name} — Hole ${h+1} (Par ${state.pars[h]})</div>
    <div style="display:flex;align-items:center;justify-content:center;gap:16px;margin-bottom:20px;">
      <button id="rev-minus" style="width:52px;height:52px;border-radius:50%;border:2px solid var(--border);background:var(--surface);font-size:1.5rem;cursor:pointer;display:flex;align-items:center;justify-content:center;">−</button>
      <div id="rev-score-display" style="font-family:var(--font-display);font-size:2.5rem;font-weight:800;color:var(--navy);min-width:60px;text-align:center;">${tempScore}</div>
      <button id="rev-plus" style="width:52px;height:52px;border-radius:50%;border:2px solid var(--border);background:var(--surface);font-size:1.5rem;cursor:pointer;display:flex;align-items:center;justify-content:center;">+</button>
    </div>
    <div style="display:flex;gap:10px;">
      <button id="rev-cancel" style="flex:1;padding:12px;border:1px solid var(--border);border-radius:var(--r);background:var(--surface);font-family:var(--font-display);font-size:0.85rem;letter-spacing:1px;cursor:pointer;">Cancel</button>
      <button id="rev-save" style="flex:2;padding:12px;border:none;border-radius:var(--r);background:var(--navy);color:var(--gold);font-family:var(--font-display);font-size:0.85rem;font-weight:700;letter-spacing:1px;cursor:pointer;">Save Score</button>
    </div>`;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  const display = document.getElementById('rev-score-display');
  document.getElementById('rev-minus').onclick = () => { if (tempScore > 1) { tempScore--; display.textContent = tempScore; } };
  document.getElementById('rev-plus').onclick  = () => { tempScore++; display.textContent = tempScore; };
  document.getElementById('rev-cancel').onclick = () => overlay.remove();
  document.getElementById('rev-save').onclick   = () => {
    state.players[pi].scores[h] = tempScore;
    overlay.remove();
    renderResults(); // re-render everything live
    saveActiveRound();
  };
  overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
}

function renderResultsMoney(content) {
  const money = calcTotalMoney();
  const totals = state.players.map((p,i) => ({
    name: p.name, idx: i,
    total: p.scores.reduce((a,s)=>a+(s||0),0),
    money: money[i]
  })).sort((a,b) => b.money - a.money);

  const card = el('div','results-card');
  const medals = ['🥇','🥈','🥉','4️⃣'];
  totals.forEach((p,rank) => {
    const row = el('div','results-row');
    row.innerHTML = `<div class="rr-rank">${medals[rank]}</div><div class="rr-name" style="color:${COLORS[p.idx]}">${p.name}</div><div class="rr-score">${p.total > 0 ? p.total + ' strokes' : '–'}</div><div class="rr-money ${p.money>0?'pos':p.money<0?'neg':'zero'}" style="color:${p.money>0?'var(--green-win)':p.money<0?'var(--red)':'var(--muted)'}">${fmt(p.money)}</div>`;
    card.appendChild(row);
  });
  content.appendChild(card);

  if (state.games.length > 0) {
    const breakdown = el('div'); breakdown.style.cssText = 'margin-top:16px;width:100%;';
    const bTitle = el('div'); bTitle.style.cssText = 'font-size:0.65rem;letter-spacing:0.2em;text-transform:uppercase;color:var(--gold);margin-bottom:10px;';
    bTitle.textContent = 'Game Breakdown'; breakdown.appendChild(bTitle);
    const icons = {skins:'🎰',rabbit:'🐇',wolf:'🐺',nassau:'🏆'};
    const names = {skins:'Skins',rabbit:'Rabbit',wolf:'Wolf',nassau:'Nassau'};
    state.games.forEach(g => {
      let gMoney;
      if (g==='skins') gMoney = calcSkinsMoney();
      else if (g==='rabbit') gMoney = calcRabbitMoney();
      else if (g==='wolf') gMoney = calcWolfMoney();
      else if (g==='nassau') gMoney = calcNassauMoney().total;
      const gCard = el('div'); gCard.style.cssText = 'background:var(--white);border:1px solid var(--border);border-radius:var(--r-md);padding:12px 14px;margin-bottom:8px;box-shadow:var(--shadow-sm);';
      gCard.innerHTML = `<div style="font-family:var(--font-display);font-size:0.75rem;font-weight:700;letter-spacing:1px;color:var(--slate);margin-bottom:8px;">${icons[g]} ${names[g].toUpperCase()}</div>`;
      const gGrid = el('div'); gGrid.style.cssText = 'display:grid;grid-template-columns:repeat(4,1fr);gap:6px;';
      state.players.forEach((p,i) => {
        const amt = gMoney[i];
        const cv = el('div'); cv.style.cssText = 'text-align:center;';
        cv.innerHTML = `<div style="font-size:0.7rem;color:var(--muted);">${p.name}</div><div style="font-size:1rem;font-weight:700;color:${amt>0?'var(--green)':amt<0?'var(--red)':'var(--muted)'};">${fmt(amt)}</div>`;
        gGrid.appendChild(cv);
      });
      gCard.appendChild(gGrid); breakdown.appendChild(gCard);
    });
    const totalCard = el('div'); totalCard.style.cssText = 'background:var(--navy-mid);border:1px solid rgba(255,255,255,0.08);border-radius:var(--r-md);padding:12px 14px;margin-bottom:8px;';
    totalCard.innerHTML = `<div style="font-family:var(--font-display);font-size:0.75rem;font-weight:700;letter-spacing:1px;color:var(--gold);margin-bottom:8px;">💰 TOTAL</div>`;
    const totalGrid = el('div'); totalGrid.style.cssText = 'display:grid;grid-template-columns:repeat(4,1fr);gap:6px;';
    state.players.forEach((p,i) => {
      const amt = money[i]; const cv = el('div'); cv.style.cssText = 'text-align:center;';
      cv.innerHTML = `<div style="font-size:0.7rem;color:var(--blue-soft);">${p.name}</div><div style="font-family:var(--font-display);font-size:1.3rem;font-weight:800;color:${amt>0?'#86efac':amt<0?'#fca5a5':'var(--blue-soft)'};">${fmt(amt)}</div>`;
      totalGrid.appendChild(cv);
    });
    totalCard.appendChild(totalGrid); breakdown.appendChild(totalCard); content.appendChild(breakdown);
  }

  // ── PAYOUT SECTION ──
  renderPayoutSection(content, money);
}

function renderPayoutSection(content, money) {
  const payoutSection = el('div');
  payoutSection.style.cssText = 'margin-top:20px;width:100%;';

  // Section title
  const pTitle = el('div');
  pTitle.style.cssText = 'font-size:0.65rem;letter-spacing:0.2em;text-transform:uppercase;color:var(--gold);margin-bottom:10px;font-family:var(--font-display);font-weight:700;';
  pTitle.textContent = '💸 Settlement';
  payoutSection.appendChild(pTitle);

  // ── SIMPLIFIED PAYOUTS (minimum transactions) ──
  const payouts = calcPayouts(money);
  if (payouts.length > 0) {
    const simpleCard = el('div');
    simpleCard.style.cssText = 'background:var(--navy-mid);border:1px solid rgba(255,255,255,0.08);border-radius:var(--r-md);padding:14px;margin-bottom:12px;';
    
    const simpleTitle = el('div');
    simpleTitle.style.cssText = 'font-family:var(--font-display);font-size:0.7rem;font-weight:700;letter-spacing:1.5px;color:var(--green);margin-bottom:10px;';
    simpleTitle.textContent = '✓ QUICK SETTLE';
    simpleCard.appendChild(simpleTitle);

    payouts.forEach(({from, to, amt}) => {
      const row = el('div');
      row.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.06);';
      row.innerHTML = `
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="color:${COLORS[from]};font-weight:700;">${state.players[from].name}</span>
          <span style="color:var(--muted);font-size:0.8rem;">→</span>
          <span style="color:${COLORS[to]};font-weight:700;">${state.players[to].name}</span>
        </div>
        <div style="font-family:var(--font-display);font-size:1.1rem;font-weight:800;color:var(--gold);">$${amt.toFixed(2).replace(/\.00$/,'')}</div>`;
      simpleCard.appendChild(row);
    });
    payoutSection.appendChild(simpleCard);
  } else {
    const noPayouts = el('div');
    noPayouts.style.cssText = 'background:var(--navy-mid);border:1px solid rgba(255,255,255,0.08);border-radius:var(--r-md);padding:14px;margin-bottom:12px;text-align:center;color:var(--muted);font-size:0.85rem;';
    noPayouts.textContent = 'All square — no payments needed!';
    payoutSection.appendChild(noPayouts);
  }

  // ── FULL PAIRWISE BREAKDOWN (collapsible) ──
  if (state.games.includes('wolf')) {
    const points = calcWolfPoints();
    const bet = state.bets.wolf;
    const pairwise = buildPairwiseBreakdown(points, bet, state.players);
    
    if (pairwise.length > 0) {
      const detailWrap = el('div');
      detailWrap.style.cssText = 'background:var(--white);border:1px solid var(--border);border-radius:var(--r-md);overflow:hidden;';
      
      const detailHeader = el('div');
      detailHeader.style.cssText = 'padding:12px 14px;cursor:pointer;display:flex;align-items:center;justify-content:space-between;';
      detailHeader.innerHTML = `
        <div style="font-family:var(--font-display);font-size:0.7rem;font-weight:700;letter-spacing:1.5px;color:var(--slate);">🐺 WOLF PAIRWISE BREAKDOWN</div>
        <span style="color:var(--muted);font-size:0.7rem;">▼</span>`;
      
      const detailBody = el('div');
      detailBody.style.cssText = 'display:none;padding:0 14px 14px;';
      
      pairwise.forEach(({fromName, toName, amount, pointDiff, from, to}) => {
        const row = el('div');
        row.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border);';
        row.innerHTML = `
          <div>
            <span style="color:${COLORS[from]};font-weight:600;font-size:0.85rem;">${fromName}</span>
            <span style="color:var(--muted);font-size:0.75rem;"> owes </span>
            <span style="color:${COLORS[to]};font-weight:600;font-size:0.85rem;">${toName}</span>
          </div>
          <div style="text-align:right;">
            <div style="font-weight:700;color:var(--text);">$${amount.toFixed(2).replace(/\.00$/,'')}</div>
            <div style="font-size:0.65rem;color:var(--muted);">${pointDiff}pt diff</div>
          </div>`;
        detailBody.appendChild(row);
      });

      detailHeader.onclick = () => {
        const isOpen = detailBody.style.display !== 'none';
        detailBody.style.display = isOpen ? 'none' : 'block';
        detailHeader.querySelector('span:last-child').textContent = isOpen ? '▼' : '▲';
      };

      detailWrap.append(detailHeader, detailBody);
      payoutSection.appendChild(detailWrap);
    }
  }

  content.appendChild(payoutSection);
}
// ── UTILS ────────────────────────────────────────────────────────────
function el(tag, cls) {
  const e = document.createElement(tag);
  if (cls) cls.split(' ').forEach(c => e.classList.add(c));
  return e;
}
function fmt(n) {
  if (n === 0) return '$0';
  const abs = Math.abs(n).toFixed(2).replace(/\.00$/,'');
  return (n > 0 ? '+$' : '-$') + abs;
}
