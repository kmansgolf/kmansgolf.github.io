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
