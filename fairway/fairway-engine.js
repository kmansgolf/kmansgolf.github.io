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
  // Only search tours matching the current selection
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
