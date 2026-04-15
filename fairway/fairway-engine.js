// ── HELPERS ───────────────────────────────────────────────────────────────────
function getTodayTournament(tourType){
  const today=new Date().toISOString().split("T")[0];
  return SCHEDULE[tourType]?.find(t=>t.date===today)||null;
}
function getNextTournament(tourType){
  const today=new Date().toISOString().split("T")[0];
  return SCHEDULE[tourType]?.find(t=>t.date>today)||null;
}
function detectRegion(id){
  return MEMBER_MAP[String(id)] || MEMBER_MAP[String(parseInt(id))] || ID_REGION_MAP[parseInt(id)] || null;
}

function searchMembersLocal(query, tourFilter) {
  const q = query.trim().toLowerCase();
  if (!q || q.length < 2) return [];
  const results = [];
  if (!tourFilter || tourFilter === "regular") {
    REGULAR_MEMBERS.forEach(m => {
      if (m.name.toLowerCase().includes(q)) {
        results.push({...m, tour:"regular", region:"columbus"});
      }
    });
  }
  if (!tourFilter || tourFilter === "senior") {
    SENIOR_MEMBERS.forEach(m => {
      if (m.name.toLowerCase().includes(q)) {
        const exists = results.find(r => r.id === m.id);
        if (!exists) results.push({...m, tour:"senior", region:"columbus"});
      }
    });
  }
  return results.slice(0, 8);
}
function getWindDir(deg){
  const dirs=["N","NNE","NE","ENE","E","ESE","SE","SSE","S","SSW","SW","WSW","W","WNW","NW","NNW"];
  return dirs[Math.round(deg/22.5)%16];
}
function calcDifferential(score,rating,slope){
  return Math.round(((score-rating)*113/slope)*10)/10;
}
function ls(key,def){try{const v=localStorage.getItem(key);return v!==null?JSON.parse(v):def;}catch{return def;}}
function lsSet(key,val){try{localStorage.setItem(key,JSON.stringify(val));}catch{}}

// ── SHARED UI HELPERS ─────────────────────────────────────────────────────────
// Extract just Champ/A/B/C/D from flight name
function cleanFlight(flightStr) {
  if (!flightStr) return "—";
  const f = flightStr.toLowerCase();
  if (f.includes('champ')) return 'Champ';
  if (f.includes('d flight') || f.startsWith('d ') || f === 'd') return 'D';
  if (f.includes('c flight') || f.startsWith('c ') || f === 'c') return 'C';
  if (f.includes('b flight') || f.startsWith('b ') || f === 'b') return 'B';
  if (f.includes('a flight') || f.startsWith('a ') || f === 'a') return 'A';
  const first = flightStr.trim().charAt(0).toUpperCase();
  if (['A','B','C','D'].includes(first)) return first;
  return flightStr.replace(/\s*flight.*/i,'').trim() || "—";
}

// Check if a player name matches "me" or my group
function createPlayerMatcher(playerName, playerId, myGroupList) {
  const myLast = (playerName || ID_REGION_MAP[parseInt(playerId)]?.name || "").split(",")[0].toLowerCase();
  const myGroup = myGroupList || [];
  return function inMyGroup(name) {
    if (!name) return false;
    const nameLower = name.toLowerCase();
    return myGroup.some(p => p.toLowerCase() === nameLower) ||
           (myLast && nameLower.includes(myLast));
  };
}

// ── HTML TABLE HELPER ─────────────────────────────────────────────────────────
function extractTableValue(html, label) {
  const idx = html.indexOf(label);
  if (idx === -1) return '';
  const ts = html.indexOf('<td', idx + label.length);
  if (ts === -1) return '';
  const to = html.indexOf('>', ts) + 1;
  const tc = html.indexOf('</td>', to);
  if (tc === -1) return '';
  return html.substring(to, tc).replace(/<[^>]+>/g, '').replace(/&nbsp;/g, '').trim();
}

// ── LEADERBOARD PARSER ────────────────────────────────────────────────────────
function parseLeaderboardHtml(lbHtml) {
  if (!lbHtml || lbHtml.length < 20) return { posted: false, flights: [], players: [] };

  // Course/date from lbTournamentName
  let course = '', date = '';
  const nameIdx = lbHtml.indexOf("class=\'lbTournamentName\'");
  const nameIdx2 = lbHtml.indexOf("class='lbTournamentName'");
  const ni = nameIdx > -1 ? nameIdx : nameIdx2;
  if (ni > -1) {
    const tdEnd = lbHtml.indexOf('</td>', ni);
    const raw = lbHtml.substring(ni, tdEnd).replace(/<br\s*\/?>/gi,'|').replace(/<[^>]+>/g,'');
    const parts = raw.split('|');
    course = (parts[0]||'').replace(/^[^>]*>/,'').trim();
    date   = (parts[1]||'').trim();
  }

  // Split on flight headers
  const sections = lbHtml.split(/Class='lbHoleHeader'/i);
  const flights = [];

  for (let i = 1; i < sections.length; i++) {
    const sec = sections[i];
    // Flight name — first td content
    const td1s = sec.indexOf('<td');
    const td1e = sec.indexOf('</td>', td1s);
    const flightName = td1s > -1
      ? sec.substring(td1s, td1e).replace(/<[^>]+>/g,'').trim()
      : '';

    // Player rows — split on <tr
    const players = [];
    const rows = sec.split('<tr');
    for (const row of rows) {
      const cells = [];
      let ci = 0;
      while (true) {
        const ts = row.indexOf('<td', ci);
        if (ts === -1) break;
        const te = row.indexOf('</td>', ts);
        if (te === -1) break;
        cells.push(row.substring(ts, te).replace(/<[^>]+>/g,'').trim());
        ci = te + 5;
      }
      if (cells.length < 5) continue;
      if (cells[0].toLowerCase() === 'position') continue;
      const pos = cells[0];
      if (!pos || pos === '&nbsp;') continue;
      players.push({
        pos, player: cells[1], total: cells[3], thru: cells[4],
        currently: cells[5] || '', flight: flightName,
      });
    }
    flights.push({ flight: flightName, players });
  }

  const allPlayers = flights.flatMap(f => f.players);
  return { posted: allPlayers.length > 0, course, date, flights, players: allPlayers };
}

// ── SKINS PARSER ──────────────────────────────────────────────────────────────
function parseSkinsHtml(html) {
  if (!html || html.length < 20) return { posted: false, sections: [], overallWinners: [] };
  const sections = [];
  const parts = html.split('<table');
  for (let i = 1; i < parts.length; i++) {
    const tbl = '<table' + parts[i];
    const h2s = tbl.indexOf('<h2'); const h2e = tbl.indexOf('</h2>', h2s);
    if (h2s === -1) continue;
    const name = tbl.substring(h2s, h2e).replace(/<[^>]+>/g,'').trim();
    const isSuperSection = name.toLowerCase().includes('super');
    const h3s = tbl.indexOf('<h3'); const h3e = tbl.indexOf('</h3>', h3s);
    const type = h3s > -1 ? tbl.substring(h3s, h3e).replace(/<[^>]+>/g,'').replace(/[()]/g,'').trim() : '';
    if (name.toLowerCase().startsWith('ctp')) {
      const pot = extractTableValue(tbl, 'Total CTP Pot');
      sections.push({ name, type:'CTP', pot, holes:[], winners:[], isSuperSection: false }); continue;
    }
    const pot      = extractTableValue(tbl, 'Total Skins Pot');
    const skinVal  = extractTableValue(tbl, 'Each Skin Value');
    const totSkins = extractTableValue(tbl, 'Total Skins');
    const buyIn    = extractTableValue(tbl, 'Game Buy In');
    const numPl    = extractTableValue(tbl, 'Total Players');
    const holes = [];
    const rows  = tbl.split('<tr');
    for (const row of rows) {
      const cells = [];
      let ci = 0;
      while (true) {
        const ts = row.indexOf('<td', ci); if (ts===-1) break;
        const te = row.indexOf('</td>', ts); if (te===-1) break;
        const val = row.substring(ts,te).replace(/<[^>]+>/g,'')
          .replace(/&nbsp;/g,'').replace(/&amp;/g,'&').trim();
        cells.push(val); ci = te+5;
      }
      if (cells.length < 4) continue;
      const holeNum = parseInt(cells[0]);
      if (!holeNum || holeNum < 1 || holeNum > 18) continue;
      const player = cells[1].trim();
      if (!player) continue;
      holes.push({ hole: holeNum, player, score: cells[2], type: cells[3]||'', isSuper: isSuperSection });
    }
    const sv = parseFloat((skinVal||'').replace(/[$,]/g,'')) || 0;
    const pt = {};
    holes.forEach(h => { 
      if (!pt[h.player]) pt[h.player]={skins:0,winnings:0,holes:[]};
      pt[h.player].skins++; 
      pt[h.player].winnings += sv;
      pt[h.player].holes.push({ hole: h.hole, isSuper: h.isSuper });
    });
    const winners = Object.entries(pt)
      .map(([name,v])=>({name,skins:v.skins,winnings:v.winnings,holes:v.holes}))
      .sort((a,b)=>b.skins-a.skins);
    sections.push({ name, type, pot, skinValue:skinVal, totalSkins:totSkins, buyIn, numPlayers:numPl, holes, winners, isSuperSection });
  }
  const aw = {};
  sections.filter(s=>s.type!=='CTP').forEach(s=>(s.holes||[]).forEach(h=>{
    if(!aw[h.player]) aw[h.player]={winnings:0,holes:[]};
    const sv = parseFloat((s.skinValue||'').replace(/[$,]/g,'')) || 0;
    aw[h.player].winnings += sv;
    aw[h.player].holes.push({ hole: h.hole, isSuper: h.isSuper });
  }));
  const overallWinners = Object.entries(aw)
    .map(([name,v])=>({name,winnings:v.winnings,holes:v.holes}))
    .sort((a,b)=>b.winnings-a.winnings);
  return { posted: sections.some(s=>s.holes?.length>0), sections, overallWinners };
}
