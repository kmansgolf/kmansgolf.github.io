// ── COUNTDOWN ─────────────────────────────────────────────────────────────────
// ── LEADERBOARD ───────────────────────────────────────────────────────────────
function LeaderboardTab({playerId, playerName, tourType, todayEvent, activeEvent: activeEventProp, nextEvent}){
  const activeEvent = activeEventProp || todayEvent || nextEvent;
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const [lastFetch,setLastFetch] = useState(null);

  const myName = playerName || ID_REGION_MAP[parseInt(playerId)]?.name || "";
  const myLast = myName.split(",")[0].toLowerCase();
  const myGroup = ls("gw_myGroup", []);
  const inMyGroup = (name) => myGroup.some(p=>p.toLowerCase()===name.toLowerCase()) ||
    (myLast && name.toLowerCase().includes(myLast));

  async function loadLeaderboard() {
    if (!activeEvent) return;
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${WORKER_URL}/leaderboard?tid=${activeEvent.tid}&tour=${tourType}`);
      if (!res.ok) throw new Error("Worker " + res.status);
      const payload = await res.json();
      if (payload.error) throw new Error(payload.error);
      // Parse the raw HTML client-side (uses global parseLeaderboardHtml from engine.js)
      const parsed = parseLeaderboardHtml(payload.raw || '');
      setData(parsed);
      setLastFetch(new Date());
    } catch(e) { setError(e.message); }
    setLoading(false);
  }

  useEffect(() => { loadLeaderboard(); }, [tourType, activeEvent?.tid]);

  // Auto-refresh every 2 min on tournament day
  useEffect(() => {
    if (!activeEvent) return;
    const iv = setInterval(loadLeaderboard, 2 * 60 * 1000);
    return () => clearInterval(iv);
  }, [tourType, activeEvent?.tid]);

  if (!activeEvent) return h("div",{className:"fw-tab-content"},
    h("div",{className:"fw-empty"},
      h("div",{className:"fw-empty-icon"},"📋"),
      h("div",{className:"fw-empty-title"},"No Tournament Today"),
      h("div",{className:"fw-empty-sub"},"Check the Schedule tab for upcoming events")
    )
  );

  return h("div",{className:"fw-tab-content"},
    lastFetch && h("div",{className:"fw-last-fetch"},"Updated "+lastFetch.toLocaleTimeString()),
    loading && !data && h("div",{className:"fw-status fw-status--muted"},"Loading leaderboard..."),
    error && h("div",{className:"fw-status fw-status--error"},"⚠ "+error),
    data && !data.posted && h("div",{className:"fw-status fw-status--muted",style:{padding:"16px 0"}},"Scores not yet posted for this tournament."),
    data && data.posted && h("div",null,
      h("div",{style:{fontWeight:700,fontSize:15,marginBottom:12}},data.course+" · "+data.date),
      [...(data.flights||[])].sort((a,b)=>{
        const aMe = a.players.some(r=>myLast&&r.player.toLowerCase().includes(myLast));
        const bMe = b.players.some(r=>myLast&&r.player.toLowerCase().includes(myLast));
        return aMe?-1:bMe?1:0;
      }).map((flight,fi)=>{
        if (!flight.players.length) return null;
        const isMine = flight.players.some(r=>myLast&&r.player.toLowerCase().includes(myLast));
        return h("div",{key:fi,style:{marginBottom:20}},
          h("div",{className:"fw-section-label"},(isMine?"⭐ ":"")+flight.flight),
          h("div",{style:{overflowX:"auto"}},
            h("table",{className:"fw-table"},
              h("thead",null,h("tr",null,["POS","PLAYER","TOTAL","THRU","NOW"].map(col=>
                h("th",{key:col,style:{textAlign:col==="PLAYER"?"left":"center"}},col)))),
              h("tbody",null,flight.players.map((r,i)=>{
                const me = (myLast && r.player.toLowerCase().includes(myLast)) || false;
                const gm = !me && inMyGroup(r.player);
                return h("tr",{key:i,className:me?"fw-row--me":gm?"fw-row--group":i%2===0?"fw-row--alt":""},
                  h("td",{style:{textAlign:"center",fontWeight:700}},r.pos),
                  h("td",{style:{fontWeight:(me||gm)?700:400}},r.player+(me?" ⭐":gm?" 👥":"")),
                  h("td",{style:{textAlign:"center",fontFamily:"var(--font-mono)"}},r.total),
                  h("td",{style:{textAlign:"center"}},r.thru),
                  h("td",{style:{textAlign:"center",fontSize:11}},r.currently||"—")
                );
              }))
            )
          )
        );
      }),
      h("button",{className:"fw-btn fw-btn--refresh",style:{width:"100%",marginTop:8},onClick:loadLeaderboard},"↻ Refresh")
    )
  );
}

// ── SKINS ─────────────────────────────────────────────────────────────────────
function SkinsTab({playerId, playerName, tourType, todayEvent, activeEvent: activeEventProp, nextEvent}){
  const activeEvent = activeEventProp || todayEvent || nextEvent;
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const [lastFetch,setLastFetch] = useState(null);

  const myName = playerName || ID_REGION_MAP[parseInt(playerId)]?.name || "";
  const myLast = myName.split(",")[0].toLowerCase();

  async function loadSkins() {
    if (!activeEvent) return;
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${WORKER_URL}/skins?tid=${activeEvent.tid}&tour=${tourType}`);
      if (!res.ok) throw new Error("Worker " + res.status);
      const payload = await res.json();
      if (payload.error) throw new Error(payload.error);
      const parsed = parseSkinsHtml(payload.raw || '');
      setData(parsed);
      setLastFetch(new Date());
    } catch(e) { setError(e.message); }
    setLoading(false);
  }

  function parseSkinsHtml(html) {
    if (!html || html.length < 20) return { posted: false, sections: [], overallWinners: [] };
    const sections = [];
    // Split on <table — each table is a flight section
    const parts = html.split('<table');
    for (let i = 1; i < parts.length; i++) {
      const tbl = '<table' + parts[i];
      // Section name from <h2>
      const h2s = tbl.indexOf('<h2'); const h2e = tbl.indexOf('</h2>', h2s);
      if (h2s === -1) continue;
      const name = tbl.substring(h2s, h2e).replace(/<[^>]+>/g,'').trim();
      // Check if this is a Super Skins section
      const isSuperSection = name.toLowerCase().includes('super');
      // Type from <h3>
      const h3s = tbl.indexOf('<h3'); const h3e = tbl.indexOf('</h3>', h3s);
      const type = h3s > -1 ? tbl.substring(h3s, h3e).replace(/<[^>]+>/g,'').replace(/[()]/g,'').trim() : '';
      // CTP — no holes
      if (name.toLowerCase().startsWith('ctp')) {
        const pot = extractVal(tbl, 'Total CTP Pot');
        sections.push({ name, type:'CTP', pot, holes:[], winners:[], isSuperSection: false }); continue;
      }
      // Summary values
      const pot      = extractVal(tbl, 'Total Skins Pot');
      const skinVal  = extractVal(tbl, 'Each Skin Value');
      const totSkins = extractVal(tbl, 'Total Skins');
      const buyIn    = extractVal(tbl, 'Game Buy In');
      const numPl    = extractVal(tbl, 'Total Players');
      // Hole rows
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
        // Keep hole as string to preserve "1a", "1b" etc
        const holeStr = cells[0].trim();
        const holeNum = parseInt(holeStr);
        if (!holeNum || holeNum < 1 || holeNum > 18) continue;
        const player = cells[1].trim();
        if (!player) continue;
        const skinType = cells[3] || '';
        holes.push({ hole: holeStr, player, score: cells[2], type: skinType, isSuper: isSuperSection });
      }
      // Per-player winnings
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
    // Overall winnings — track holes across all sections
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

  function extractVal(html, label) {
    const idx = html.indexOf(label);
    if (idx===-1) return '';
    const ts = html.indexOf('<td', idx+label.length);
    if (ts===-1) return '';
    const to = html.indexOf('>', ts)+1;
    const tc = html.indexOf('</td>', to);
    if (tc===-1) return '';
    return html.substring(to,tc).replace(/<[^>]+>/g,'').replace(/&nbsp;/g,'').trim();
  }

  useEffect(() => { loadSkins(); }, [tourType, activeEvent?.tid]);

  if (!activeEvent) return h("div",{className:"fw-tab-content"},
    h("div",{className:"fw-empty"},
      h("div",{className:"fw-empty-icon"},"💰"),
      h("div",{className:"fw-empty-title"},"No Tournament Today"),
      h("div",{className:"fw-empty-sub"},"Skins results are posted during and after each tournament")
    )
  );

  return h("div",{className:"fw-tab-content"},
    lastFetch && h("div",{className:"fw-last-fetch"},"Updated "+lastFetch.toLocaleTimeString()),
    loading && !data && h("div",{className:"fw-status fw-status--muted"},"Loading skins..."),
    error && h("div",{className:"fw-status fw-status--error"},"⚠ "+error),
    data && !data.posted && h("div",null,
      h("div",{style:{fontWeight:700,fontSize:15,marginBottom:8}},activeEvent.course),
      h("div",{className:"fw-status fw-status--muted"},"Skins results not yet posted. Check back mid-round."),
      h("button",{className:"fw-btn fw-btn--refresh",style:{width:"100%",marginTop:12},onClick:loadSkins},"↻ Check Again")
    ),
    data && data.posted && h("div",null,

      // ── Overall winners summary ──
      data.overallWinners?.length > 0 && h("div",{style:{marginBottom:20}},
        h("div",{className:"fw-section-label"},"TOTAL WINNINGS"),
        h("div",{style:{overflowX:"auto"}},
          h("table",{className:"fw-table"},
            h("thead",null,h("tr",null,
              h("th",{style:{textAlign:"left"}},"PLAYER"),
              h("th",{style:{textAlign:"center"}},"HOLES"),
              h("th",{style:{textAlign:"right"}},"WINNINGS")
            )),
            h("tbody",null,data.overallWinners.map((w,i)=>{
              const me = (playerId && w.id===String(playerId)) ||
                         (myLast && w.name.toLowerCase().includes(myLast));
              // Format holes: "4s 4 8 18s 18" with spaces, s = super
              const holesStr = (w.holes||[])
                .sort((a,b)=>{
                  const aNum = parseInt(a.hole) || 0;
                  const bNum = parseInt(b.hole) || 0;
                  return aNum - bNum;
                })
                .map(h=>h.hole+(h.isSuper?'s':''))
                .join('  ');
              return h("tr",{key:i,className:me?"fw-row--me":i%2===0?"fw-row--alt":""},
                h("td",{style:{fontWeight:me?700:400}},w.name+(me?" ⭐":"")),
                h("td",{style:{textAlign:"center",fontSize:12,color:"var(--muted)",fontFamily:"var(--font-mono)"}},holesStr||"—"),
                h("td",{style:{textAlign:"right",color:"var(--green)",fontWeight:700,fontFamily:"var(--font-mono)"}},
                  "$"+w.winnings.toFixed(0))
              );
            }))
          )
        ),
        h("div",{style:{fontSize:10,color:"var(--muted)",marginTop:6,fontStyle:"italic"}},"s = super skin")
      ),

      // ── Per-flight sections ──
      data.sections?.map((sec,si) => {
        if (sec.type === "CTP") return h("div",{key:si,style:{marginBottom:16}},
          h("div",{className:"fw-section-label"},sec.name),
          h("div",{style:{fontSize:13,color:"var(--muted)",padding:"6px 0"}},
            "Pot: "+(sec.pot||"—")+"  ·  "+sec.players+" players")
        );

        return h("div",{key:si,style:{marginBottom:24}},
          // Section header with pot info
          h("div",{style:{marginBottom:8}},
            h("div",{className:"fw-section-label"},sec.name),
            h("div",{style:{fontSize:11,color:"var(--muted)",marginTop:2}},
              sec.type+" · Pot: "+sec.pot+" · "+sec.skinValue+"/skin · "+sec.totalSkins+" skins")
          ),

          // Winners for this flight
          sec.winners?.length > 0 && h("div",{style:{marginBottom:10}},
            h("table",{className:"fw-table"},
              h("thead",null,h("tr",null,
                h("th",{style:{textAlign:"left"}},"WINNER"),
                h("th",{style:{textAlign:"center"}},"SKINS"),
                h("th",{style:{textAlign:"right"}},"WIN")
              )),
              h("tbody",null,sec.winners.map((w,i)=>{
                const me = myLast && w.name.toLowerCase().includes(myLast);
                return h("tr",{key:i,className:me?"fw-row--me":i%2===0?"fw-row--alt":""},
                  h("td",{style:{fontWeight:me?700:400}},w.name+(me?" ⭐":"")),
                  h("td",{style:{textAlign:"center",fontWeight:700}},w.skins),
                  h("td",{style:{textAlign:"right",color:"var(--green)",fontWeight:700,fontFamily:"var(--font-mono)"}},
                    "$"+w.winnings.toFixed(0))
                );
              }))
            )
          ),

          // Hole-by-hole for this flight
          sec.holes?.length > 0 && h("details",{style:{fontSize:12}},
            h("summary",{style:{color:"var(--muted)",cursor:"pointer",padding:"4px 0",userSelect:"none"}},
              "Hole-by-hole ("+sec.holes.length+" skins)"),
            h("table",{className:"fw-table",style:{marginTop:6}},
              h("thead",null,h("tr",null,
                h("th",{style:{textAlign:"center"}},"HOLE"),
                h("th",{style:{textAlign:"left"}},"PLAYER"),
                h("th",{style:{textAlign:"center"}},"SCORE"),
                h("th",{style:{textAlign:"center"}},"TYPE")
              )),
              h("tbody",null,sec.holes.map((r,i)=>{
                const me = (myLast && r.player.toLowerCase().includes(myLast)) || false;
                return h("tr",{key:i,className:me?"fw-row--me":i%2===0?"fw-row--alt":""},
                  h("td",{style:{textAlign:"center",fontWeight:700}},r.hole),
                  h("td",{style:{fontWeight:me?700:400}},r.player+(me?" ⭐":"")),
                  h("td",{style:{textAlign:"center"}},""+r.score),
                  h("td",{style:{textAlign:"center",color:"var(--muted)",fontSize:11}},r.type)
                );
              }))
            )
          )
        );
      }),

      h("button",{className:"fw-btn fw-btn--refresh",style:{width:"100%",marginTop:8},onClick:loadSkins},"↻ Refresh")
    )
  );
}

// ── PAIRINGS ─────────────────────────────────────────────────────────────────

function PairingsTab({playerId, playerName, tourType, todayEvent, activeEvent: activeEventProp, nextEvent}) {
  const activeEvent = activeEventProp || todayEvent || nextEvent;
  const [pairings, setPairings] = useState(null);
  const [scores,   setScores]   = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [scoresLoading, setScoresLoading] = useState(false);
  const [errMsg,   setErrMsg]   = useState(null);
  const [lastFetch,setLastFetch]= useState(null);

  // Use searched playerName first, fall back to ID_REGION_MAP
  const myName = playerName || ID_REGION_MAP[parseInt(playerId)]?.name || "";
  const myLast = myName.split(",")[0].toLowerCase();
  const domain = TOUR_DOMAINS[tourType];

  // ── fetch pairings via Cloudflare Worker ──────────────────────────────────────
  async function loadPairings() {
    if (!activeEvent) return;
    setLoading(true); setErrMsg(null);
    try {
      const res = await fetch(`${WORKER_URL}/pairings?tid=${activeEvent.tid}&tour=${tourType}`);
      if (!res.ok) throw new Error("Worker " + res.status);
      const p = await res.json();
      setPairings(p);
      // Save my group to localStorage so leaderboard can highlight them
      if (p.posted && p.groups) {
        const myG = p.groups.find(g => g.players?.some(pl =>
          (playerId && pl.id === String(playerId)) ||
          (myLast && (pl.name||pl).toLowerCase().includes(myLast))
        ));
        if (myG) lsSet("gw_myGroup", myG.players.map(pl => pl.name||pl));
      }
    } catch(e) { setErrMsg("Fetch failed: "+e.message); }
    setLoading(false);
    setLastFetch(new Date());
  }

  // ── fetch live scores for my group from Worker leaderboard ───────────────────
  async function loadGroupScores(players) {
    if (!players || !players.length || !activeEvent) return;
    setScoresLoading(true);
    try {
      const res = await fetch(`${WORKER_URL}/leaderboard?tid=${activeEvent.tid}&tour=${tourType}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      // Build map of player name -> score data from leaderboard
      const map = {};
      (data.players || []).forEach(p => {
        if (p.player) map[p.player.toLowerCase()] = p;
      });
      // Match to our group players by last name
      const groupMap = {};
      players.forEach(name => {
        const lastName = (name.split(",")[0] || "").toLowerCase().trim();
        const found = Object.keys(map).find(k => k.includes(lastName) || lastName.includes(k.split(",")[0]));
        if (found) groupMap[name.toLowerCase()] = map[found];
      });
      setScores(groupMap);
    } catch {}
    setScoresLoading(false);
  }

  useEffect(() => { if (activeEvent) loadPairings(); }, [tourType, activeEvent?.tid]);

  // Auto-refresh scores every 5 min on tournament day
  useEffect(() => {
    if (!activeEvent || !pairings?.posted) return;
    const myGroup = pairings.groups?.find(g => g.players?.some(p =>
      (playerId && p.id === String(playerId)) ||
      (myLast && (p.name||p).toLowerCase().includes(myLast))
    ));
    const myGroupNames = myGroup?.players?.map(p => p.name||p) || [];
    if (myGroupNames.length) loadGroupScores(myGroupNames);
    const iv = setInterval(() => {
      if (myGroupNames.length) loadGroupScores(myGroupNames);
    }, 5 * 60 * 1000);
    return () => clearInterval(iv);
  }, [pairings]);

  // ── no tournament today — show schedule + pairings if posted ──
  if (!todayEvent) {
    const today2 = new Date().toISOString().split("T")[0];
    const next4 = (SCHEDULE[tourType]?.filter(t => t.date > today2) || []).slice(0, 4);

    // If pairings are already posted for next event, fall through to full pairings view below
    if (pairings?.posted) {
      // fall through — renders full pairings view
    } else {
      return h("div", {className:"fw-tab-content"},
        h("div", {className:"fw-card fw-card--dark",style:{marginBottom:16}},
          h("div", {className:"fw-card-body"},
          h("div", {className:"fw-card-title fw-card-title--light",style:{marginBottom:10}}, "NEXT 4 TOURNAMENTS"),
          next4.length === 0
            ? h("div", {className:"fw-status fw-status--muted"}, "No upcoming tournaments found.")
            : next4.map((ev,i) => {
                const d = new Date(ev.date+"T00:00:00");
                const daysOut = Math.round((d - new Date()) / (1000*60*60*24));
                const isNext = i===0;
                return h("div", {key:ev.date, style:{
                  display:"flex", justifyContent:"space-between", alignItems:"center",
                  background: isNext?"rgba(61,220,132,0.08)":"rgba(255,255,255,0.04)",
                  border: isNext?"1px solid rgba(61,220,132,0.3)":"1px solid rgba(255,255,255,0.06)",
                  borderRadius:7, padding:"9px 12px", marginBottom:6,
                }},
                  h("div", null,
                    h("div", {style:{fontSize:13,fontWeight:isNext?700:400,color:isNext?"var(--green)":"var(--text)"}}, ev.course),
                    h("div", {style:{display:"flex",gap:6,alignItems:"center",marginTop:2}},
                      h("span",{style:{fontSize:11,color:"var(--muted)"}},
                        d.toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"}) +
                        (ev.twoDay&&ev.endDate?" – "+new Date(ev.endDate+"T00:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric"}):"")
                      ),
                      ev.twoDay&&h("span",{style:{fontSize:9,fontWeight:700,padding:"1px 5px",borderRadius:3,
                        background:"rgba(96,165,250,0.15)",color:"#60a5fa"}},"2-DAY")
                    )
                  ),
                  h("div", {style:{fontSize:14,fontWeight:700,color:isNext?"var(--green)":"var(--muted)"}}, daysOut+"d")
                );
              })
        )),
        loading
          ? h("div", {style:{padding:"16px",textAlign:"center",color:"var(--muted)"}}, "Loading pairings…")
          : errMsg
          ? h("div", {className:"fw-status fw-status--error"}, errMsg)
          : !pairings
          ? h("div", {style:{padding:"16px",textAlign:"center",color:"var(--muted)",fontSize:13}},
              "Loading pairings for "+activeEvent?.course+"…")
          : h("div", {style:{padding:"16px",textAlign:"center",color:"var(--muted)",fontSize:13}},
              pairings.availableTournaments?.length > 0
                ? "Pairings not yet posted. Next available: " + pairings.availableTournaments[0]?.label
                : (pairings.message || "Pairings not yet posted — check back closer to tournament day.")
            )
      );
    }
  }

  // ── tournament day view ──
  // Match by member ID first (exact), then fall back to last name
  const myGroup = pairings?.groups?.find(g => g.players?.some(p =>
    (playerId && p.id === String(playerId)) ||
    (myLast && (p.name||p).toLowerCase().includes(myLast))
  ));
  const otherGroups = pairings?.groups?.filter(g => g !== myGroup) || [];

  function toParStr(n) {
    if (n === null || n === undefined) return null;
    if (n === 0) return "E";
    return n > 0 ? "+"+n : ""+n;
  }
  function toParColor(n) {
    if (n === null || n === undefined) return "#64748b";
    if (n < 0) return "#166534";
    if (n === 0) return "#475569";
    return "#dc2626";
  }

  function PlayerRow({player, isMe}) {
    const name = player.name || player;
    const flight = player.flight || "";
    const key = name.toLowerCase();
    const sc = scores?.[key] || scores?.[Object.keys(scores||{}).find(k=>k.includes(name.split(",")[0].toLowerCase()))];
    const started = sc && sc.thru && sc.thru !== "F";
    return h("div", {className:"fw-player-row "+(isMe?"fw-player-row--me":""),
      style:{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 13px",
        borderBottom:"1px solid rgba(255,255,255,0.06)"}},
      h("div", null,
        h("div", {className:"fw-player-name "+(isMe?"fw-player-name--me":""),style:{fontSize:14}},
          name + (isMe?" ⭐":"")),
        flight && h("div", {style:{fontSize:11,color:"var(--muted)",marginTop:2}}, flight+" Flight")
      ),
      started
        ? h("div", {className:"fw-score-chips"},
            h("div", {className:"fw-score-gross"}, sc.total),
            h("div", {style:{fontSize:11,color:"var(--muted)"}}, "thru "+sc.thru)
          )
        : h("div", {style:{fontSize:11,color:"var(--muted)"}}, scoresLoading?"…":"—")
    );
  }

  function GroupCard({group, isMyGroup}) {
    return h("div", {className:"fw-group "+(isMyGroup?"fw-group--mine":"")},
      h("div", {className:"fw-group-header "+(isMyGroup?"fw-group-header--mine":"")},
        h("div", null,
          h("div", {className:"fw-group-label "+(isMyGroup?"fw-group-label--mine":"")},
            (isMyGroup ? "⭐ MY GROUP — " : "")+"Group "+group.group),
          h("div", {className:"fw-group-meta "+(isMyGroup?"fw-group-meta--mine":"")},
            group.teeTime+"  ·  Hole "+group.startHole+(group.flight?" · "+group.flight+" Flight":""))
        ),
        isMyGroup && h("button", {
          onClick:()=>loadGroupScores(group.players), disabled:scoresLoading,
          className:"fw-btn fw-btn--ghost"},
          scoresLoading?"…":"↻ Scores")
      ),
      group.players?.map((p,i) => {
        const nm = p.name||p;
        const isme = (playerId && p.id === String(playerId)) ||
                     (myLast && nm.toLowerCase().includes(myLast));
        return h(PlayerRow, {key:i, player:p, isMe:isme});
      })
    );
  }

  return h("div", {className:"fw-tab-content"},
    !playerId && pairings?.posted && h("div",{className:"fw-pairings-note"},
      h("span",{style:{fontSize:16}},"👥"),
      h("div",{className:"fw-pairings-note-text"},
        h("span",null,"Showing "),h("strong",null,"all groups"),h("span",null," — search your name above to highlight your pairing")
      )
    ),
    h("div", {style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}},
      h("div", null,
        h("div", {style:{fontSize:16,fontWeight:700}}, activeEvent.course),
        !todayEvent && activeEvent && h("div", {style:{fontSize:11,color:"var(--muted)",marginTop:2}},
          "📅 Upcoming · "+activeEvent.date),
        pairings?.shotgun && h("div", {className:"fw-shotgun"}, "🎯 SHOTGUN START")
      ),
      h("div", {style:{display:"flex",gap:6}},
        h("button", {onClick:loadPairings, disabled:loading, className:"fw-btn fw-btn--primary"},
          loading?"…":"↻ Pairings"),
      )
    ),

    lastFetch && h("div", {className:"fw-last-fetch"},
      "Updated "+lastFetch.toLocaleTimeString()),

    errMsg && h("div", {className:"fw-status fw-status--error"}, errMsg),

    loading
      ? h("div", {style:{padding:"32px",textAlign:"center",color:"#64748b"}}, "Loading pairings…")
      : !pairings
      ? h("div", {style:{padding:"24px",textAlign:"center",color:"#64748b",fontSize:13}},
          "Tap ↻ Pairings to load today\'s groups.")
      : !pairings.posted
      ? h("div", {style:{padding:"24px",textAlign:"center",color:"#64748b",fontSize:13}},
          "Pairings not yet posted.")
      : h("div", null,
          myGroup && h(GroupCard, {group:myGroup, isMyGroup:true}),
          otherGroups.map((g,i) => h(GroupCard, {key:i, group:g, isMyGroup:false}))
        )
  );
}


// ── SPECTATOR ─────────────────────────────────────────────────────────────────
// Extract just Champ/A/B/C/D from flight name
function cleanFlight(flightStr) {
  if (!flightStr) return "—";
  const f = flightStr.toLowerCase();
  if (f.includes('champ')) return 'Champ';
  if (f.includes('d flight') || f.startsWith('d ') || f === 'd') return 'D';
  if (f.includes('c flight') || f.startsWith('c ') || f === 'c') return 'C';
  if (f.includes('b flight') || f.startsWith('b ') || f === 'b') return 'B';
  if (f.includes('a flight') || f.startsWith('a ') || f === 'a') return 'A';
  // Fallback: first letter if it's A-D
  const first = flightStr.trim().charAt(0).toUpperCase();
  if (['A','B','C','D'].includes(first)) return first;
  return flightStr.replace(/\s*flight.*/i,'').trim() || "—";
}

function StatChip({label,value,color,bg}){
  return h("div",{className:"fw-stat-chip",style:{background:bg}},
    h("div",{className:"fw-stat-label"},label),
    h("div",{className:"fw-stat-value",style:{color}},value)
  );
}

function SpectatorTab({tourType,todayEvent,activeEvent:watchActiveEvent,nextEvent}){
  const [watchList,      setWatchList]      = useState(()=>ls("gw_watchList",[]));
  const [nameInput,      setNameInput]      = useState("");
  const [watchSuggestions, setWatchSuggestions] = useState([]);
  const [selectedMember,   setSelectedMember]   = useState(null); // confirmed member from list
  const [notInList,        setNotInList]         = useState(false);
  const [playerData,     setPlayerData]     = useState({});
  const [loading,        setLoading]        = useState({});
  const [standings,      setStandings]      = useState(null);
  const [stdLoading,     setStdLoading]     = useState(false);
  const domain = TOUR_DOMAINS[tourType];

  useEffect(()=>{lsSet("gw_watchList",watchList);},[watchList]);
  useEffect(()=>{ if(watchActiveEvent?.tid) watchList.forEach(n=>fetchPlayer(n)); },[tourType, watchActiveEvent?.tid]);

  function handleWatchInput(val) {
    setNameInput(val);
    setSelectedMember(null);
    setNotInList(false);
    if (!val.trim() || val.length < 2) { setWatchSuggestions([]); return; }
    const results = searchMembersLocal(val, tourType);
    setWatchSuggestions(results);
  }

  function selectWatchMember(m) {
    setNameInput(m.name);
    setSelectedMember(m);
    setWatchSuggestions([]);
    setNotInList(false);
  }

  function addPlayer(){
    const name = nameInput.trim();
    if (!name) return;
    if (watchList.includes(name)) { setNameInput(""); setWatchSuggestions([]); return; }
    // If they typed something but it didn't match anyone, flag it
    if (!selectedMember && watchSuggestions.length === 0 && name.length > 2) {
      setNotInList(true);
      return;
    }
    setWatchList(p=>[...p, name]);
    setNameInput("");
    setSelectedMember(null);
    setWatchSuggestions([]);
    setNotInList(false);
    fetchPlayer(name);
  }

  function removePlayer(name){
    setWatchList(p=>p.filter(n=>n!==name));
    setPlayerData(p=>{const c2={...p};delete c2[name];return c2;});
  }

  async function fetchPlayer(name){
    if (!watchActiveEvent?.tid) return;
    setLoading(p=>({...p,[name]:true}));
    try{
      const res=await fetch(`${WORKER_URL}/leaderboard?tid=${watchActiveEvent.tid}&tour=${tourType}`);
      if(!res.ok) throw new Error();
      const payload=await res.json();
      // Parse raw HTML using global parseLeaderboardHtml from engine.js
      const lb = parseLeaderboardHtml(payload.raw||'');
      const nameLower=name.toLowerCase().split(",")[0];
      const found=(lb.players||[]).find(p=>
        p.player.toLowerCase().includes(nameLower)||
        nameLower.includes((p.player||'').toLowerCase().split(",")[0])
      );
      if(found){
        setPlayerData(p=>({...p,[name]:{
          found:true,
          leaderboard:{
            pos:found.pos,
            flight:found.flight,
            score:found.total,
            thru:found.thru,
            currently:found.currently,
          }
        }}));
      } else {
        setPlayerData(p=>({...p,[name]:{found:false}}));
      }
    }catch{
      setPlayerData(p=>({...p,[name]:{found:false,error:true}}));
    }
    setLoading(p=>({...p,[name]:false}));
  }

  async function fetchStandings(){
    // Standings scraping coming soon — Worker route not yet implemented
    setStdLoading(false);
  }

  function PlayerCard({name}){
    const data=playerData[name];
    const isLoading=loading[name];
    const initials=name.split(/[, ]+/).filter(Boolean).map(p=>p[0]).join("").slice(0,2).toUpperCase();
    const lb=data?.leaderboard;
    return h("div",{className:"fw-player-card",style:{marginBottom:10}},
      h("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}},
        h("div",{style:{display:"flex",alignItems:"center",gap:10}},
          h("div",{className:"fw-avatar"},initials),
          h("div",{className:"fw-player-card-name"},name)
        ),
        h("div",{style:{display:"flex",gap:6}},
          h("button",{onClick:()=>fetchPlayer(name),disabled:isLoading,
            className:"fw-btn fw-btn--refresh"},
            isLoading?"…":"↻"),
          h("button",{onClick:()=>removePlayer(name),
            className:"fw-btn fw-btn--danger"},"✕")
        )
      ),
      isLoading
        ? h("div",{style:{color:"#94a3b8",fontSize:13}},"Looking up "+name+"…")
        : !data
        ? h("div",{style:{color:"#94a3b8",fontSize:13}},"Tap ↻ to load")
        : data.error
        ? h("div",{style:{color:"#dc2626",fontSize:13}},"Fetch failed — tap ↻ to retry")
        : !data.found
        ? h("div",{className:"fw-status fw-status--muted"},watchActiveEvent?"Not in results yet":"No tournament selected")
        : h("div",{className:"fw-stat-chips"},
            h(StatChip,{label:"POS",value:"#"+lb?.pos,color:"#1e3a5f",bg:"#dbeafe"}),
            h(StatChip,{label:"FLIGHT",value:cleanFlight(lb?.flight),color:"#1e3a5f",bg:"#e0f2fe"}),
            h(StatChip,{label:"SCORE",value:lb?.score||"—",color:"#0f172a",bg:"#f1f5f9"}),
            h(StatChip,{label:"PTS",value:lb?.points||"—",color:"#166534",bg:"#dcfce7"}),
            lb?.earnings>0&&h(StatChip,{label:"$",value:"$"+lb.earnings,color:"#166534",bg:"#dcfce7"}),
            lb?.birdies>0&&h(StatChip,{label:"🐦",value:lb.birdies,color:"#1e40af",bg:"#dbeafe"}),
            data.skins?.count>0&&h(StatChip,{label:"SKINS",value:data.skins.count+" ($"+data.skins.amount+")",color:"#92400e",bg:"#fef3c7"})
          )
    );
  }

  return h("div",{className:"fw-tab-content"},
    h("div",{className:"fw-watch-add"},
      h("div",{className:"fw-watch-input-row"},
        h("input",{
          type:"text",placeholder:"Search member name…",
          value:nameInput,
          onChange:e=>handleWatchInput(e.target.value),
          onKeyDown:e=>e.key==="Enter"&&addPlayer(),
          className:"fw-input "+(selectedMember?"fw-input--valid":notInList?"fw-input--error":"")
        }),
        h("button",{onClick:addPlayer,className:"fw-btn fw-btn--gold"},
          "+ Add")
      ),
      selectedMember && h("div",{className:"fw-confirm"},
        "✓ "+selectedMember.name+" · "+selectedMember.tour+" · "+selectedMember.flight+" Flight"),
      notInList && h("div",{className:"fw-add-anyway"},
        h("span",null,"⚠ Not found in member list — they may not be playing today."),
        h("span",{
          onClick:()=>{
            const name=nameInput.trim();
            setWatchList(p=>[...p,name]);
            setNameInput("");setNotInList(false);fetchPlayer(name);
          },
          className:"fw-link"
        },"Add anyway")
      ),
      watchSuggestions.length>0 && h("div",{className:"fw-dropdown"},
        watchSuggestions.map((m,i)=>h("div",{key:i,
          onClick:()=>selectWatchMember(m),
          className:"fw-dropdown-item"},
          h("span",{className:"fw-dropdown-item-name"},m.name),
          h("div",{style:{display:"flex",gap:6,alignItems:"center"}},
            h("span",{className:"fw-dropdown-item-meta"},m.flight+" Flt"),
            h("span",{className:"fw-badge "+(m.tour==="senior"?"fw-badge--sr":"fw-badge--reg")},m.tour==="senior"?"SR":"REG")
          )
        ))
      )
    ),

    // Watch list
    watchList.length===0
      ? h("div",{className:"fw-empty"},
          h("div",{className:"fw-empty-icon"},"👁"),
          h("div",{className:"fw-empty-title"},"No players added yet"),
          h("div",{className:"fw-empty-sub"},"Type a name above and tap Add")
        )
      : watchList.map(name=>h(PlayerCard,{key:name,name})),

    // Season standings
    h("div",{style:{marginTop:8}},
      h("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",
        borderTop:"2px solid var(--border)",paddingTop:14,marginBottom:8}},
        h("div",{className:"fw-card-title fw-card-title--light"},"SEASON STANDINGS"),
        h("button",{onClick:fetchStandings,disabled:stdLoading,className:"fw-btn fw-btn--primary"},
          stdLoading?"…":standings?"↻ Refresh":"Load")
      ),
      !standings&&!stdLoading&&h("div",{className:"fw-status fw-status--muted",style:{paddingBottom:8}},"Tap Load to fetch current season standings"),
      standings&&h("div",{style:{overflowX:"auto"}},
        h("table",{className:"fw-table"},
          h("thead",null,h("tr",null,
            ["POS","PLAYER","PTS","EVENTS","WINS"].map(col=>
              h("th",{key:col,style:{textAlign:col==="PLAYER"?"left":"center"}},col)
            )
          )),
          h("tbody",null,standings.map((r,i)=>{
            const watched=watchList.some(n=>r.name.toLowerCase().includes(n.toLowerCase().split(",")[0]));
            return h("tr",{key:i,className:watched?"fw-row--watch":i%2===0?"fw-row--alt":""},
              h("td",{style:{textAlign:"center",fontWeight:700,color:"var(--slate)"}},r.pos),
              h("td",{style:{textAlign:"left",fontWeight:watched?700:400,
                color:watched?"#92400e":"var(--text)"}},r.name+(watched?" ⭐":"")),
              h("td",{style:{textAlign:"center",color:"var(--green)",fontWeight:700}},r.points),
              h("td",{style:{textAlign:"center"}},r.events),
              h("td",{style:{textAlign:"center"}},r.wins||0)
            );
          }))
        )
      )
    )
  );
}


// ── APP ───────────────────────────────────────────────────────────────────────
function App(){
  const [searchInput,   setSearchInput]   = useState(()=>ls("gw_searchInput",""));
  const [playerId,      setPlayerId]      = useState(()=>ls("gw_playerId",""));
  const [playerName,    setPlayerName]    = useState(()=>ls("gw_playerName",""));
  const [tourKey,       setTourKey]       = useState(()=>ls("gw_tourKey",""));
  const [tab,           setTab]           = useState("pairings");
  const [selectedTid,   setSelectedTid]   = useState(()=>ls("gw_selectedTid",""));
  const [suggestions,   setSuggestions]   = useState([]);

  const tourType    = (tourKey||"regular.columbus").split(".")[0];
  const todayEvent  = getTodayTournament(tourType);
  const nextEvent   = getNextTournament(tourType);
  const schedule    = SCHEDULE[tourType] || [];
  // selectedTid overrides auto-detection; fall back to today→next
  const activeEvent = schedule.find(t=>t.tid===parseInt(selectedTid)||t.tid===selectedTid)
                   || todayEvent || nextEvent;

  useEffect(()=>{lsSet("gw_searchInput",searchInput);},[searchInput]);
  useEffect(()=>{lsSet("gw_playerId",playerId);},[playerId]);
  useEffect(()=>{lsSet("gw_playerName",playerName);},[playerName]);
  useEffect(()=>{lsSet("gw_tourKey",tourKey);},[tourKey]);
  useEffect(()=>{lsSet("gw_selectedTid",selectedTid);},[selectedTid]);

  // Local member search — instant, no API needed
  function searchMembers(val) {
    if (!val || val.length < 2) { setSuggestions([]); return; }
    const results = searchMembersLocal(val, tourType);
    setSuggestions(results);
  }

  function handleSearch(val) {
    setSearchInput(val);
    setSuggestions([]);
    if (!val.trim()) { setPlayerId(""); setPlayerName(""); setSearchLoading(false); return; }

    // Numeric ID — check hardcoded map first, then accept as-is
    if (/^\d+$/.test(val.trim())) {
      const info = detectRegion(val.trim());
      if (info) {
        setPlayerId(val.trim());
        setPlayerName(info.name);
        setTourKey(`${info.tour}.${info.region}`);
      } else {
        setPlayerId(val.trim());
        setPlayerName("");
      }
      setSuggestions([]);
      return;
    }

    // Name search — instant local lookup
    searchMembers(val);
  }

  function selectSuggestion(s) {
    setSearchInput(s.name);
    setPlayerId(String(s.id));
    setPlayerName(s.name);
    setTourKey(`${s.tour}.${s.region||"columbus"}`);
    setSuggestions([]);
    setSearchLoading(false);
  }

  const TABS=[
    {key:"pairings",   label:"⛳ Pairings"},
    {key:"leaderboard",label:"🏆 Leaderboard"},
    {key:"skins",      label:"💰 Skins"},
    {key:"spectator",  label:"👁 Watch"},
  ];

  return h("div",{className:"fw-root"},
    h("div",{className:"fw-shell-fixed"},
      h("div",{className:"fw-header"},
        h("div",{className:"fw-header-inner",style:{justifyContent:"space-between",alignItems:"center",paddingBottom:"10px"}},
          h("a",{href:"/",style:{textDecoration:"none",display:"flex",alignItems:"baseline",gap:0}},
            h("span",{style:{fontFamily:"'Barlow Condensed',sans-serif",fontSize:"20px",fontWeight:800,letterSpacing:"-0.3px",color:"#f5f5f7"}},"kmans"),
            h("span",{style:{fontFamily:"'Barlow Condensed',sans-serif",fontSize:"20px",fontWeight:800,letterSpacing:"-0.3px",color:"#3ddc84"}},"golf"),
            h("span",{style:{fontFamily:"'Barlow Condensed',sans-serif",fontSize:"14px",color:"rgba(255,255,255,0.3)",margin:"0 6px"}},"·"),
            h("span",{style:{fontFamily:"'Barlow Condensed',sans-serif",fontSize:"14px",fontWeight:700,letterSpacing:"1px",color:"rgba(255,255,255,0.65)"}},"THE FAIRWAY")
          ),
          h("button",{id:"fw-theme-btn",onClick:fwToggleTheme,style:{background:"none",border:"0.5px solid rgba(255,255,255,0.2)",borderRadius:"16px",padding:"4px 10px",color:"#6e6e73",fontFamily:"'Barlow Condensed',sans-serif",fontSize:"11px",fontWeight:700,letterSpacing:"0.5px",cursor:"pointer",whiteSpace:"nowrap"}},"☀️")
        )
      ),

    // Setup bar
    h("div",{className:"fw-setup"},
      h("div",{className:"fw-field"},
        h("input",{
          type:"text",
          placeholder:"e.g. Mansfield or 55097",
          value:searchInput,
          onChange:e=>handleSearch(e.target.value),
          className:"fw-input "+(playerName?"fw-input--valid":"")
        }),
        playerName && h("div",{className:"fw-confirm"},
          "✓ "+playerName+" · ID "+playerId+" · "+( MEMBER_MAP[String(playerId)]?.flight||"") +" Flight"),
        !playerName && searchInput.length>1 && suggestions.length===0 && !(/^\d+$/.test(searchInput)) &&
          h("div",{className:"fw-no-match"},"No members found"),
        suggestions.length>0 && h("div",{className:"fw-dropdown"},
          suggestions.map(s=>h("div",{key:s.id,
            onClick:()=>selectSuggestion(s),
            className:"fw-dropdown-item"},
            h("span",{className:"fw-dropdown-item-name"},s.name),
            h("span",{className:"fw-dropdown-item-meta"},s.tour+" · "+s.id)
          ))
        )
      ),
      h("div",{style:{flexShrink:0}},
        h("select",{value:tourKey,onChange:e=>{setTourKey(e.target.value);setSelectedTid("");},className:"fw-select"},
          ALL_TOUR_OPTIONS.map(o=>h("option",{key:o.value,value:o.value},o.label))
        )
      )
    ),
    // Tournament selector row
    h("div",{className:"fw-setup",style:{paddingTop:0,paddingBottom:6}},
      h("div",{style:{width:"100%",fontSize:11,color:"var(--muted)",fontWeight:700,letterSpacing:"0.04em",marginBottom:4}},"TOURNAMENT"),
      h("select",{
        value: selectedTid || (activeEvent?.tid||""),
        onChange: e=>setSelectedTid(e.target.value),
        style:{width:"100%",background:"#2c2c2e",color:"#f5f5f7",border:"1px solid rgba(255,255,255,0.12)",
          borderRadius:6,padding:"6px 8px",fontSize:13,fontFamily:"var(--font-body)"}
      },
        schedule.map(t=>h("option",{key:t.tid,value:t.tid},
          t.date+" · "+t.course
        ))
      )
    ),

    // Countdown / today banner

    // Tabs
    h("div",{className:"fw-tabs"},
      TABS.map(t=>h("button",{key:t.key,onClick:()=>setTab(t.key),
        className:"fw-tab "+(tab===t.key?"fw-tab--active":"")},t.label))
    ),
      // Guest banner
      !playerName && h("div",{className:"fw-guest-banner"},
        h("div",{className:"fw-guest-dot"}),
        h("div",{className:"fw-guest-text"},"Viewing as guest"),
        h("div",{className:"fw-guest-cta",onClick:()=>document.querySelector('.fw-input')?.focus()},"ADD YOUR NAME →")
      ),
    ), // end fw-shell-fixed

    // Scrollable content
    h("div",{className:"fw-shell-scroll"},
      tab==="pairings"    &&h(PairingsTab,{playerId,playerName,tourType,todayEvent,activeEvent,nextEvent:getNextTournament(tourType)}),
      tab==="leaderboard" &&h(LeaderboardTab,{playerId,playerName,tourType,todayEvent,activeEvent,nextEvent:getNextTournament(tourType)}),
      tab==="skins"       &&h(SkinsTab,{playerId,playerName,tourType,todayEvent,activeEvent,nextEvent:getNextTournament(tourType)}),
      tab==="spectator"   &&h(SpectatorTab,{tourType,todayEvent,activeEvent,nextEvent:getNextTournament(tourType)}),
    )
  );
}

// Store theme globally so React button can read it
window._fwTheme = localStorage.getItem('range_theme') || 'dark';

function fwApplyTheme(t) {
  window._fwTheme = t;
  const isLight = t === 'light';
  document.body.setAttribute('data-theme', isLight ? 'light' : '');
  // Update button if it exists in DOM (React may have rendered it)
  const btn = document.getElementById('fw-theme-btn');
  if (btn) btn.textContent = isLight ? '🌙' : '☀️';
  // Store on body so button can read on render
  document.body.dataset.themeIcon = isLight ? '🌙' : '☀️';
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', isLight ? '#faf8f4' : '#000000');
  localStorage.setItem('range_theme', t);
}
function fwToggleTheme() {
  fwApplyTheme((localStorage.getItem('range_theme')||'dark')==='light'?'dark':'light');
}
// Apply on load
fwApplyTheme(localStorage.getItem('range_theme')||'dark');

ReactDOM.createRoot(document.getElementById("root")).render(h(App,null));

// Build timestamp
const _tsEl = document.createElement("div");
_tsEl.className = "fw-build-ts";
_tsEl.textContent = "Built: Apr 12, 2026 Skins+Pairings fix";
document.getElementById("root").appendChild(_tsEl);

// ── PULL TO REFRESH ──
(function(){
  const scrollEl = document.querySelector('.fw-shell-scroll');
  if(!scrollEl) return;

  // Inject indicator
  const indicator = document.createElement('div');
  indicator.className = 'ptr-indicator';
  indicator.innerHTML = '<div class="ptr-spinner" id="ptrSpinner"></div><div class="ptr-text" id="ptrText">PULL TO REFRESH</div>';
  scrollEl.prepend(indicator);

  let startY = 0;
  let pulling = false;
  let triggered = false;
  const threshold = 72;

  scrollEl.addEventListener('touchstart', e => {
    if(scrollEl.scrollTop === 0){
      startY = e.touches[0].clientY;
      pulling = true;
      triggered = false;
    }
  }, {passive:true});

  scrollEl.addEventListener('touchmove', e => {
    if(!pulling) return;
    const dist = e.touches[0].clientY - startY;
    if(dist > 10 && scrollEl.scrollTop === 0){
      const progress = Math.min(dist, threshold * 1.3);
      indicator.style.transform = `translateY(${Math.min(progress - 52, 0)}px)`;
      if(dist >= threshold && !triggered){
        triggered = true;
        document.getElementById('ptrText').textContent = 'RELEASE TO REFRESH';
        document.getElementById('ptrSpinner').classList.add('spin');
      } else if(dist < threshold){
        document.getElementById('ptrText').textContent = 'PULL TO REFRESH';
        document.getElementById('ptrSpinner').classList.remove('spin');
      }
    }
  }, {passive:true});

  scrollEl.addEventListener('touchend', () => {
    if(!pulling) return;
    pulling = false;
    if(triggered){
      indicator.classList.add('visible');
      document.getElementById('ptrText').textContent = 'REFRESHING…';
      setTimeout(() => { window.location.reload(); }, 500);
    } else {
      indicator.style.transform = '';
    }
  }, {passive:true});
})();

// ── THEME ─────────────────────────────────────────────────────────────────────

// ── SWIPE DOWN TO REFRESH ─────────────────────────────────────────────────────
(function(){
  let ty = 0, ready = false;
  const ind = document.createElement('div');
  ind.style.cssText = 'position:fixed;top:0;left:0;right:0;height:44px;display:flex;align-items:center;justify-content:center;font-family:Barlow Condensed,sans-serif;font-size:11px;letter-spacing:2px;color:#3ddc84;background:rgba(0,0,0,0.9);transform:translateY(-44px);transition:transform 0.2s ease;z-index:9999;pointer-events:none;';
  ind.textContent = '↓ RELEASE TO REFRESH';
  document.body.appendChild(ind);
  document.addEventListener('touchstart', e=>{ ty=e.touches[0].clientY; },{passive:true});
  document.addEventListener('touchmove', e=>{
    const scrollEl = document.querySelector('.fw-shell-scroll');
    if (scrollEl && scrollEl.scrollTop > 0) return;
    const dy = e.touches[0].clientY - ty;
    if (dy > 60){ ind.style.transform='translateY(0)'; ready=true; }
    else { ind.style.transform='translateY(-44px)'; ready=false; }
  },{passive:true});
  document.addEventListener('touchend', ()=>{
    ind.style.transform='translateY(-44px)';
    if(ready){ ready=false; setTimeout(()=>location.reload(),200); }
  });
})();
