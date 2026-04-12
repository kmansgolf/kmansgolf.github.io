// ── COURSE DATA ──────────────────────────────────────────────────────
const COURSES = [
  // ── COLUMBUS CITY (CRPD) ─────────────────────────────────────────
  { id:'champions', name:'Champions Golf Course', location:'Columbus, OH', emoji:'🏆',
    scorecardUrl:'https://crpdgolf.com/golf-courses/champions-golf-course/',
    tees:[
    { name:'Black', color:'#555',    par:70, yards:6536, rating:70.8, slope:125, holes:[{par:4,yds:392},{par:3,yds:150},{par:4,yds:400},{par:4,yds:365},{par:3,yds:150},{par:4,yds:410},{par:5,yds:530},{par:4,yds:358},{par:4,yds:410},{par:3,yds:217},{par:4,yds:440},{par:4,yds:394},{par:4,yds:407},{par:4,yds:411},{par:5,yds:524},{par:4,yds:399},{par:3,yds:189},{par:4,yds:390}]},
    { name:'Blue',  color:'#1a4a9a', par:70, yards:6222, rating:69.6, slope:122, holes:[{par:4,yds:378},{par:3,yds:142},{par:4,yds:371},{par:4,yds:355},{par:3,yds:136},{par:4,yds:398},{par:5,yds:520},{par:4,yds:345},{par:4,yds:395},{par:3,yds:199},{par:4,yds:423},{par:4,yds:366},{par:4,yds:394},{par:4,yds:391},{par:5,yds:484},{par:4,yds:385},{par:3,yds:162},{par:4,yds:378}]},
    { name:'White', color:'#888',    par:70, yards:5886, rating:67.9, slope:120, holes:[{par:4,yds:366},{par:3,yds:135},{par:4,yds:325},{par:4,yds:347},{par:3,yds:123},{par:4,yds:375},{par:5,yds:500},{par:4,yds:323},{par:4,yds:388},{par:3,yds:176},{par:4,yds:401},{par:4,yds:348},{par:4,yds:365},{par:4,yds:370},{par:5,yds:460},{par:4,yds:375},{par:3,yds:147},{par:4,yds:362}]},
    { name:'Orange',color:'#e07820', par:72, yards:5046, rating:68.4, slope:117, holes:[{par:4,yds:296},{par:3,yds:129},{par:4,yds:257},{par:4,yds:306},{par:3,yds:110},{par:4,yds:300},{par:5,yds:435},{par:4,yds:260},{par:4,yds:375},{par:3,yds:112},{par:4,yds:380},{par:4,yds:285},{par:4,yds:300},{par:4,yds:310},{par:5,yds:401},{par:4,yds:315},{par:3,yds:140},{par:4,yds:335}]},
    { name:'Purple',color:'#7c3aed', par:72, yards:2200, rating:48.0, slope:90,  holes:[{par:4,yds:150},{par:3,yds:80},{par:4,yds:150},{par:4,yds:140},{par:3,yds:35},{par:4,yds:150},{par:5,yds:200},{par:4,yds:100},{par:5,yds:150},{par:3,yds:70},{par:5,yds:130},{par:4,yds:105},{par:4,yds:130},{par:4,yds:140},{par:5,yds:200},{par:4,yds:100},{par:3,yds:55},{par:4,yds:115}]}
  ]},
  { id:'raymond', name:'Raymond Memorial GC', location:'Columbus, OH', emoji:'🌳',
    scorecardUrl:'https://crpdgolf.com/golf-courses/raymond-memorial/',
    tees:[
    { name:'Blue',   color:'#1a4a9a', par:72, yards:6864, rating:72.8, slope:121, holes:[{par:5,yds:489},{par:4,yds:433},{par:4,yds:416},{par:4,yds:359},{par:3,yds:175},{par:5,yds:460},{par:4,yds:447},{par:3,yds:187},{par:4,yds:401},{par:4,yds:420},{par:5,yds:496},{par:4,yds:420},{par:3,yds:216},{par:4,yds:438},{par:4,yds:362},{par:5,yds:552},{par:3,yds:198},{par:4,yds:395}]},
    { name:'White',  color:'#888',    par:72, yards:6452, rating:70.9, slope:117, holes:[{par:5,yds:481},{par:4,yds:407},{par:4,yds:390},{par:4,yds:332},{par:3,yds:162},{par:5,yds:431},{par:4,yds:422},{par:3,yds:174},{par:4,yds:378},{par:4,yds:405},{par:5,yds:462},{par:4,yds:400},{par:3,yds:196},{par:4,yds:407},{par:4,yds:329},{par:5,yds:523},{par:3,yds:173},{par:4,yds:380}]},
    { name:'Gold',   color:'#d4a017', par:72, yards:5990, rating:68.8, slope:112, holes:[{par:5,yds:474},{par:4,yds:378},{par:4,yds:365},{par:4,yds:312},{par:3,yds:156},{par:5,yds:406},{par:4,yds:391},{par:3,yds:155},{par:4,yds:305},{par:4,yds:385},{par:5,yds:434},{par:4,yds:380},{par:3,yds:155},{par:4,yds:377},{par:4,yds:312},{par:5,yds:482},{par:3,yds:159},{par:4,yds:364}]},
    { name:'Orange', color:'#e07820', par:72, yards:5171, rating:65.0, slope:105, holes:[{par:5,yds:402},{par:4,yds:314},{par:4,yds:301},{par:4,yds:299},{par:3,yds:152},{par:5,yds:395},{par:4,yds:289},{par:3,yds:107},{par:4,yds:266},{par:4,yds:285},{par:5,yds:420},{par:4,yds:325},{par:3,yds:135},{par:4,yds:272},{par:4,yds:306},{par:5,yds:468},{par:3,yds:148},{par:4,yds:287}]},
    { name:'Purple', color:'#7c3aed', par:72, yards:3400, rating:59.0, slope:92,  holes:[{par:5,yds:250},{par:4,yds:200},{par:4,yds:200},{par:4,yds:200},{par:3,yds:100},{par:5,yds:250},{par:4,yds:200},{par:3,yds:100},{par:4,yds:200},{par:4,yds:200},{par:5,yds:250},{par:4,yds:200},{par:3,yds:100},{par:4,yds:200},{par:4,yds:200},{par:5,yds:250},{par:3,yds:100},{par:4,yds:200}]}
  ]},
  { id:'airport', name:'Airport Golf Course', location:'Columbus, OH', emoji:'✈️',
    scorecardUrl:'https://crpdgolf.com/golf-courses/airport-golf-course/',
    tees:[
    { name:'Black', color:'#555',    par:72, yards:6318, rating:68.7, slope:113, holes:[{par:5,yds:447},{par:4,yds:353},{par:3,yds:161},{par:4,yds:371},{par:4,yds:394},{par:5,yds:558},{par:4,yds:305},{par:3,yds:205},{par:4,yds:410},{par:5,yds:454},{par:4,yds:352},{par:3,yds:144},{par:4,yds:389},{par:4,yds:360},{par:5,yds:522},{par:4,yds:391},{par:3,yds:127},{par:4,yds:375}]},
    { name:'Blue',  color:'#1a4a9a', par:72, yards:6026, rating:67.4, slope:110, holes:[{par:5,yds:412},{par:4,yds:339},{par:3,yds:147},{par:4,yds:357},{par:4,yds:381},{par:5,yds:538},{par:4,yds:298},{par:3,yds:193},{par:4,yds:390},{par:5,yds:440},{par:4,yds:340},{par:3,yds:133},{par:4,yds:375},{par:4,yds:345},{par:5,yds:508},{par:4,yds:376},{par:3,yds:114},{par:4,yds:340}]},
    { name:'White', color:'#888',    par:72, yards:5626, rating:65.4, slope:105, holes:[{par:5,yds:403},{par:4,yds:319},{par:3,yds:121},{par:4,yds:327},{par:4,yds:339},{par:5,yds:515},{par:4,yds:286},{par:3,yds:173},{par:4,yds:367},{par:5,yds:412},{par:4,yds:322},{par:3,yds:118},{par:4,yds:349},{par:4,yds:326},{par:5,yds:476},{par:4,yds:347},{par:3,yds:99},{par:4,yds:327}]},
    { name:'Orange',color:'#e07820', par:72, yards:4817, rating:61.8, slope:98,  holes:[{par:5,yds:299},{par:4,yds:271},{par:3,yds:87},{par:4,yds:289},{par:4,yds:305},{par:5,yds:470},{par:4,yds:248},{par:3,yds:145},{par:4,yds:326},{par:5,yds:365},{par:4,yds:268},{par:3,yds:90},{par:4,yds:276},{par:4,yds:287},{par:5,yds:424},{par:4,yds:309},{par:3,yds:67},{par:4,yds:291}]},
    { name:'Purple',color:'#7c3aed', par:72, yards:2689, rating:50.0, slope:80,  holes:[{par:5,yds:200},{par:4,yds:150},{par:3,yds:87},{par:4,yds:150},{par:4,yds:150},{par:5,yds:200},{par:4,yds:150},{par:3,yds:145},{par:4,yds:150},{par:5,yds:200},{par:4,yds:150},{par:3,yds:90},{par:4,yds:150},{par:4,yds:150},{par:5,yds:200},{par:4,yds:150},{par:3,yds:67},{par:4,yds:150}]}
  ]},
  { id:'mentel', name:'Mentel Memorial GC', location:'Galloway, OH', emoji:'🌿',
    scorecardUrl:'https://crpdgolf.com/golf-courses/mentel-memorial/',
    tees:[
    { name:'Black', color:'#555',    par:72, yards:7014, rating:72.4, slope:126, holes:[{par:4,yds:401},{par:5,yds:530},{par:5,yds:562},{par:4,yds:393},{par:3,yds:228},{par:4,yds:430},{par:4,yds:423},{par:3,yds:208},{par:4,yds:435},{par:4,yds:432},{par:5,yds:547},{par:3,yds:181},{par:5,yds:526},{par:4,yds:381},{par:4,yds:386},{par:3,yds:186},{par:4,yds:395},{par:4,yds:370}]},
    { name:'Blue',  color:'#1a4a9a', par:72, yards:6602, rating:70.5, slope:122, holes:[{par:4,yds:379},{par:5,yds:510},{par:5,yds:540},{par:4,yds:373},{par:3,yds:208},{par:4,yds:400},{par:4,yds:393},{par:3,yds:189},{par:4,yds:418},{par:4,yds:402},{par:5,yds:522},{par:3,yds:161},{par:5,yds:490},{par:4,yds:351},{par:4,yds:366},{par:3,yds:170},{par:4,yds:380},{par:4,yds:350}]},
    { name:'White', color:'#888',    par:72, yards:6224, rating:68.7, slope:117, holes:[{par:4,yds:361},{par:5,yds:492},{par:5,yds:513},{par:4,yds:356},{par:3,yds:192},{par:4,yds:379},{par:4,yds:376},{par:3,yds:139},{par:4,yds:401},{par:4,yds:379},{par:5,yds:500},{par:3,yds:144},{par:5,yds:467},{par:4,yds:333},{par:4,yds:343},{par:3,yds:159},{par:4,yds:356},{par:4,yds:334}]},
    { name:'Orange',color:'#e07820', par:72, yards:5600, rating:65.3, slope:108, holes:[{par:4,yds:320},{par:5,yds:445},{par:5,yds:455},{par:4,yds:315},{par:3,yds:155},{par:4,yds:335},{par:4,yds:335},{par:3,yds:115},{par:4,yds:358},{par:4,yds:340},{par:5,yds:450},{par:3,yds:115},{par:5,yds:415},{par:4,yds:295},{par:4,yds:305},{par:3,yds:128},{par:4,yds:335},{par:4,yds:305}]},
    { name:'Purple',color:'#7c3aed', par:72, yards:4200, rating:59.8, slope:87,  holes:[{par:4,yds:255},{par:5,yds:365},{par:5,yds:380},{par:4,yds:255},{par:3,yds:115},{par:4,yds:265},{par:4,yds:265},{par:3,yds:95},{par:4,yds:280},{par:4,yds:265},{par:5,yds:365},{par:3,yds:95},{par:5,yds:330},{par:4,yds:230},{par:4,yds:240},{par:3,yds:100},{par:4,yds:260},{par:4,yds:240}]}
  ]},
  { id:'turnberry', name:'Turnberry Golf Course', location:'Pickerington, OH', emoji:'🏰',
    scorecardUrl:'https://crpdgolf.com/golf-courses/turnberry-golf-course/',
    tees:[
    { name:'Black', color:'#555',    par:72, yards:6775, rating:72.4, slope:128, holes:[{par:5,yds:525},{par:4,yds:362},{par:3,yds:159},{par:4,yds:337},{par:5,yds:508},{par:4,yds:392},{par:3,yds:182},{par:4,yds:375},{par:4,yds:441},{par:4,yds:385},{par:4,yds:413},{par:5,yds:510},{par:3,yds:207},{par:4,yds:413},{par:4,yds:451},{par:3,yds:215},{par:4,yds:384},{par:5,yds:516}]},
    { name:'Blue',  color:'#1a4a9a', par:72, yards:6161, rating:69.9, slope:124, holes:[{par:5,yds:500},{par:4,yds:337},{par:3,yds:136},{par:4,yds:303},{par:5,yds:481},{par:4,yds:354},{par:3,yds:148},{par:4,yds:321},{par:4,yds:425},{par:4,yds:348},{par:4,yds:354},{par:5,yds:483},{par:3,yds:172},{par:4,yds:370},{par:4,yds:416},{par:3,yds:186},{par:4,yds:351},{par:5,yds:476}]},
    { name:'White', color:'#888',    par:72, yards:5868, rating:68.4, slope:121, holes:[{par:5,yds:485},{par:4,yds:325},{par:3,yds:125},{par:4,yds:291},{par:5,yds:475},{par:4,yds:337},{par:3,yds:134},{par:4,yds:300},{par:4,yds:410},{par:4,yds:325},{par:4,yds:325},{par:5,yds:469},{par:3,yds:160},{par:4,yds:358},{par:4,yds:385},{par:3,yds:170},{par:4,yds:339},{par:5,yds:455}]},
    { name:'Orange',color:'#e07820', par:72, yards:5440, rating:66.5, slope:115, holes:[{par:5,yds:477},{par:4,yds:314},{par:3,yds:112},{par:4,yds:271},{par:5,yds:455},{par:4,yds:317},{par:3,yds:114},{par:4,yds:273},{par:4,yds:401},{par:4,yds:295},{par:4,yds:295},{par:5,yds:459},{par:3,yds:139},{par:4,yds:338},{par:4,yds:365},{par:3,yds:160},{par:4,yds:254},{par:5,yds:401}]},
    { name:'Purple',color:'#7c3aed', par:73, yards:3812, rating:62.0, slope:102, holes:[{par:5,yds:340},{par:4,yds:225},{par:3,yds:110},{par:4,yds:172},{par:5,yds:320},{par:4,yds:205},{par:3,yds:110},{par:4,yds:162},{par:4,yds:270},{par:4,yds:205},{par:4,yds:200},{par:5,yds:330},{par:3,yds:130},{par:4,yds:210},{par:4,yds:250},{par:3,yds:53},{par:4,yds:210},{par:5,yds:310}]}
  ]},
  // ── DUBLIN / AREA ─────────────────────────────────────────────────
  { id:'dublin', name:'Golf Club of Dublin', location:'Dublin, OH', emoji:'🍀',
    scorecardUrl:'https://www.golfclubofdublin.com/scorecard/',
    tees:[
    { name:'Blue',  color:'#1a4a9a', par:72, yards:6928, rating:72.9, slope:135, holes:[{par:4,yds:408},{par:3,yds:175},{par:4,yds:418},{par:4,yds:417},{par:5,yds:500},{par:5,yds:534},{par:4,yds:320},{par:3,yds:193},{par:4,yds:436},{par:5,yds:556},{par:4,yds:474},{par:4,yds:335},{par:5,yds:568},{par:3,yds:163},{par:4,yds:412},{par:4,yds:385},{par:3,yds:230},{par:4,yds:404}]},
    { name:'Green', color:'#2d7a4f', par:72, yards:6364, rating:70.0, slope:130, holes:[{par:4,yds:374},{par:3,yds:149},{par:4,yds:377},{par:4,yds:370},{par:5,yds:455},{par:5,yds:502},{par:4,yds:310},{par:3,yds:168},{par:4,yds:400},{par:5,yds:527},{par:4,yds:440},{par:4,yds:312},{par:5,yds:521},{par:3,yds:145},{par:4,yds:377},{par:4,yds:371},{par:3,yds:191},{par:4,yds:375}]},
    { name:'White', color:'#888',    par:72, yards:5992, rating:68.4, slope:127, holes:[{par:4,yds:354},{par:3,yds:129},{par:4,yds:364},{par:4,yds:348},{par:5,yds:435},{par:5,yds:483},{par:4,yds:287},{par:3,yds:152},{par:4,yds:380},{par:5,yds:506},{par:4,yds:392},{par:4,yds:294},{par:5,yds:494},{par:3,yds:130},{par:4,yds:357},{par:4,yds:357},{par:3,yds:175},{par:4,yds:355}]},
    { name:'Gold',  color:'#d4a017', par:72, yards:5277, rating:64.9, slope:112, holes:[{par:4,yds:295},{par:3,yds:115},{par:4,yds:315},{par:4,yds:340},{par:5,yds:400},{par:5,yds:430},{par:4,yds:268},{par:3,yds:135},{par:4,yds:327},{par:5,yds:430},{par:4,yds:330},{par:4,yds:280},{par:5,yds:420},{par:3,yds:110},{par:4,yds:274},{par:4,yds:332},{par:3,yds:150},{par:4,yds:326}]},
    { name:'Red',   color:'#c00',    par:72, yards:4706, rating:62.4, slope:108, holes:[{par:4,yds:279},{par:3,yds:105},{par:4,yds:305},{par:4,yds:291},{par:5,yds:348},{par:5,yds:421},{par:4,yds:258},{par:3,yds:127},{par:4,yds:255},{par:5,yds:410},{par:4,yds:280},{par:4,yds:229},{par:5,yds:345},{par:3,yds:84},{par:4,yds:266},{par:4,yds:266},{par:3,yds:135},{par:4,yds:302}]}
  ]},
  { id:'safari', name:'Safari Golf Club', location:'Powell, OH', emoji:'🦒',
    scorecardUrl:'https://www.safarigc.com/',
    tees:[
    { name:'Blue',  color:'#1a4a9a', par:72, yards:6845, rating:72.2, slope:121, holes:[{par:4,yds:391},{par:5,yds:518},{par:4,yds:358},{par:4,yds:379},{par:4,yds:386},{par:4,yds:345},{par:4,yds:424},{par:3,yds:194},{par:4,yds:369},{par:4,yds:446},{par:3,yds:194},{par:4,yds:467},{par:5,yds:522},{par:4,yds:391},{par:5,yds:520},{par:3,yds:148},{par:4,yds:373},{par:4,yds:420}]},
    { name:'White', color:'#888',    par:72, yards:6144, rating:68.8, slope:114, holes:[{par:4,yds:352},{par:5,yds:468},{par:4,yds:325},{par:4,yds:344},{par:4,yds:352},{par:4,yds:312},{par:4,yds:388},{par:3,yds:170},{par:4,yds:335},{par:4,yds:405},{par:3,yds:170},{par:4,yds:425},{par:5,yds:475},{par:4,yds:355},{par:5,yds:474},{par:3,yds:128},{par:4,yds:339},{par:4,yds:380}]},
    { name:'Gold',  color:'#d4a017', par:72, yards:5626, rating:66.2, slope:108, holes:[{par:4,yds:319},{par:5,yds:430},{par:4,yds:291},{par:4,yds:308},{par:4,yds:315},{par:4,yds:278},{par:4,yds:350},{par:3,yds:145},{par:4,yds:300},{par:4,yds:360},{par:3,yds:145},{par:4,yds:380},{par:5,yds:430},{par:4,yds:318},{par:5,yds:430},{par:3,yds:108},{par:4,yds:302},{par:4,yds:342}]},
    { name:'Red',   color:'#c00',    par:72, yards:4861, rating:67.1, slope:115, holes:[{par:4,yds:270},{par:5,yds:370},{par:4,yds:245},{par:4,yds:265},{par:4,yds:272},{par:4,yds:238},{par:4,yds:302},{par:3,yds:118},{par:4,yds:258},{par:4,yds:310},{par:3,yds:118},{par:4,yds:340},{par:5,yds:370},{par:4,yds:272},{par:5,yds:370},{par:3,yds:88},{par:4,yds:260},{par:4,yds:295}]}
  ]},
  { id:'darby', name:'Darby Creek Golf Course', location:'Marysville, OH', emoji:'🌊',
    scorecardUrl:'https://www.darbycreekgolf.com/',
    tees:[
    { name:'Black', color:'#555',    par:72, yards:7074, rating:74.1, slope:136, holes:[{par:4,yds:369},{par:4,yds:423},{par:3,yds:189},{par:5,yds:558},{par:4,yds:359},{par:5,yds:520},{par:3,yds:172},{par:4,yds:434},{par:4,yds:460},{par:4,yds:335},{par:3,yds:194},{par:4,yds:426},{par:4,yds:462},{par:5,yds:502},{par:4,yds:436},{par:3,yds:211},{par:5,yds:549},{par:4,yds:475}]},
    { name:'Blue',  color:'#1a4a9a', par:72, yards:6661, rating:72.2, slope:133, holes:[{par:4,yds:347},{par:4,yds:398},{par:3,yds:170},{par:5,yds:530},{par:4,yds:340},{par:5,yds:493},{par:3,yds:160},{par:4,yds:412},{par:4,yds:436},{par:4,yds:315},{par:3,yds:180},{par:4,yds:404},{par:4,yds:440},{par:5,yds:477},{par:4,yds:413},{par:3,yds:196},{par:5,yds:520},{par:4,yds:450}]},
    { name:'White', color:'#888',    par:72, yards:6176, rating:69.9, slope:124, holes:[{par:4,yds:320},{par:4,yds:368},{par:3,yds:153},{par:5,yds:490},{par:4,yds:314},{par:5,yds:459},{par:3,yds:144},{par:4,yds:383},{par:4,yds:405},{par:4,yds:292},{par:3,yds:163},{par:4,yds:375},{par:4,yds:408},{par:5,yds:442},{par:4,yds:384},{par:3,yds:178},{par:5,yds:483},{par:4,yds:420}]},
    { name:'Gold',  color:'#d4a017', par:72, yards:5466, rating:66.6, slope:118, holes:[{par:4,yds:280},{par:4,yds:320},{par:3,yds:128},{par:5,yds:430},{par:4,yds:272},{par:5,yds:400},{par:3,yds:120},{par:4,yds:336},{par:4,yds:358},{par:4,yds:252},{par:3,yds:138},{par:4,yds:330},{par:4,yds:360},{par:5,yds:388},{par:4,yds:340},{par:3,yds:152},{par:5,yds:425},{par:4,yds:377}]},
    { name:'Red',   color:'#c00',    par:72, yards:5200, rating:65.5, slope:115, holes:[{par:4,yds:255},{par:4,yds:293},{par:3,yds:112},{par:5,yds:395},{par:4,yds:248},{par:5,yds:368},{par:3,yds:108},{par:4,yds:305},{par:4,yds:328},{par:4,yds:228},{par:3,yds:120},{par:4,yds:300},{par:4,yds:330},{par:5,yds:358},{par:4,yds:310},{par:3,yds:138},{par:5,yds:390},{par:4,yds:348}]}
  ]},
  { id:'westchester', name:'Westchester Golf Course', location:'Canal Winchester, OH', emoji:'🏡',
    scorecardUrl:'https://westchestergolfcourse.com/',
    tees:[
    { name:'Black', color:'#555',    par:72, yards:7120, rating:73.8, slope:140, holes:[{par:5,yds:534},{par:3,yds:229},{par:4,yds:402},{par:4,yds:405},{par:5,yds:528},{par:4,yds:433},{par:3,yds:156},{par:4,yds:371},{par:4,yds:380},{par:4,yds:401},{par:5,yds:556},{par:3,yds:202},{par:4,yds:387},{par:5,yds:592},{par:4,yds:380},{par:4,yds:489},{par:3,yds:213},{par:4,yds:462}]},
    { name:'Blue',  color:'#1a4a9a', par:72, yards:6754, rating:72.0, slope:134, holes:[{par:5,yds:510},{par:3,yds:208},{par:4,yds:382},{par:4,yds:385},{par:5,yds:505},{par:4,yds:412},{par:3,yds:142},{par:4,yds:355},{par:4,yds:355},{par:4,yds:382},{par:5,yds:530},{par:3,yds:185},{par:4,yds:368},{par:5,yds:565},{par:4,yds:360},{par:4,yds:465},{par:3,yds:195},{par:4,yds:440}]},
    { name:'White', color:'#888',    par:72, yards:6320, rating:70.1, slope:130, holes:[{par:5,yds:480},{par:3,yds:188},{par:4,yds:360},{par:4,yds:362},{par:5,yds:478},{par:4,yds:390},{par:3,yds:128},{par:4,yds:332},{par:4,yds:330},{par:4,yds:358},{par:5,yds:502},{par:3,yds:165},{par:4,yds:348},{par:5,yds:535},{par:4,yds:338},{par:4,yds:438},{par:3,yds:178},{par:4,yds:418}]},
    { name:'Green', color:'#2d7a4f', par:72, yards:5625, rating:70.6, slope:121, holes:[{par:5,yds:430},{par:3,yds:155},{par:4,yds:312},{par:4,yds:315},{par:5,yds:425},{par:4,yds:342},{par:3,yds:108},{par:4,yds:288},{par:4,yds:290},{par:4,yds:315},{par:5,yds:448},{par:3,yds:138},{par:4,yds:302},{par:5,yds:475},{par:4,yds:292},{par:4,yds:388},{par:3,yds:148},{par:4,yds:360}]},
    { name:'Gold',  color:'#d4a017', par:72, yards:5163, rating:60.2, slope:104, holes:[{par:5,yds:390},{par:3,yds:130},{par:4,yds:278},{par:4,yds:282},{par:5,yds:380},{par:4,yds:305},{par:3,yds:90},{par:4,yds:255},{par:4,yds:258},{par:4,yds:280},{par:5,yds:400},{par:3,yds:118},{par:4,yds:268},{par:5,yds:425},{par:4,yds:258},{par:4,yds:348},{par:3,yds:122},{par:4,yds:326}]},
    { name:'Orange',color:'#e07820', par:72, yards:3816, rating:60.2, slope:104, holes:[{par:5,yds:280},{par:3,yds:95},{par:4,yds:198},{par:4,yds:202},{par:5,yds:275},{par:4,yds:218},{par:3,yds:62},{par:4,yds:182},{par:4,yds:183},{par:4,yds:200},{par:5,yds:285},{par:3,yds:82},{par:4,yds:188},{par:5,yds:302},{par:4,yds:180},{par:4,yds:245},{par:3,yds:85},{par:4,yds:230}]}
  ]},
  { id:'york', name:'York Golf Club', location:'Columbus, OH', emoji:'🦌',
    scorecardUrl:'https://www.yorkgc.com/',
    tees:[
    { name:'Black', color:'#555',    par:71, yards:6536, rating:71.7, slope:123, holes:[{par:4,yds:335},{par:4,yds:435},{par:3,yds:225},{par:4,yds:460},{par:5,yds:570},{par:5,yds:575},{par:3,yds:142},{par:4,yds:432},{par:4,yds:335},{par:4,yds:450},{par:3,yds:177},{par:5,yds:525},{par:3,yds:190},{par:5,yds:495},{par:4,yds:380},{par:3,yds:160},{par:4,yds:290},{par:4,yds:360}]},
    { name:'Blue',  color:'#1a4a9a', par:71, yards:6114, rating:69.4, slope:124, holes:[{par:4,yds:313},{par:4,yds:410},{par:3,yds:204},{par:4,yds:434},{par:5,yds:540},{par:5,yds:548},{par:3,yds:131},{par:4,yds:406},{par:4,yds:317},{par:4,yds:424},{par:3,yds:163},{par:5,yds:497},{par:3,yds:178},{par:5,yds:468},{par:4,yds:356},{par:3,yds:148},{par:4,yds:266},{par:4,yds:338}]},
    { name:'Green', color:'#2d7a4f', par:71, yards:5697, rating:67.7, slope:118, holes:[{par:4,yds:291},{par:4,yds:385},{par:3,yds:187},{par:4,yds:406},{par:5,yds:505},{par:5,yds:518},{par:3,yds:119},{par:4,yds:380},{par:4,yds:297},{par:4,yds:397},{par:3,yds:149},{par:5,yds:465},{par:3,yds:163},{par:5,yds:434},{par:4,yds:332},{par:3,yds:134},{par:4,yds:245},{par:4,yds:316}]},
    { name:'Gold',  color:'#d4a017', par:71, yards:5307, rating:66.2, slope:114, holes:[{par:4,yds:274},{par:4,yds:360},{par:3,yds:172},{par:4,yds:378},{par:5,yds:470},{par:5,yds:490},{par:3,yds:108},{par:4,yds:353},{par:4,yds:278},{par:4,yds:370},{par:3,yds:136},{par:5,yds:432},{par:3,yds:148},{par:5,yds:403},{par:4,yds:308},{par:3,yds:120},{par:4,yds:225},{par:4,yds:280}]},
    { name:'Silver',color:'#999',    par:71, yards:4621, rating:63.1, slope:110, holes:[{par:4,yds:236},{par:4,yds:315},{par:3,yds:148},{par:4,yds:330},{par:5,yds:410},{par:5,yds:430},{par:3,yds:90},{par:4,yds:308},{par:4,yds:242},{par:4,yds:322},{par:3,yds:115},{par:5,yds:375},{par:3,yds:125},{par:5,yds:352},{par:4,yds:265},{par:3,yds:102},{par:4,yds:193},{par:4,yds:245}]},
    { name:'Teal',  color:'#0d9488', par:71, yards:3097, rating:59.0, slope:100, holes:[{par:4,yds:158},{par:4,yds:215},{par:3,yds:95},{par:4,yds:225},{par:5,yds:280},{par:5,yds:300},{par:3,yds:68},{par:4,yds:210},{par:4,yds:162},{par:4,yds:218},{par:3,yds:78},{par:5,yds:252},{par:3,yds:82},{par:5,yds:240},{par:4,yds:178},{par:3,yds:68},{par:4,yds:128},{par:4,yds:168}]}
  ]},
  // ── SPRINGFIELD AREA ─────────────────────────────────────────────
  { id:'locust-maple', name:'Locust Hills – Maple', location:'Springfield, OH', emoji:'🍁',
    scorecardUrl:'https://locusthillsgc.com/',
    tees:[
    { name:'Black', color:'#555',    par:72, yards:6596, rating:70.2, slope:112, holes:[{par:5,yds:542},{par:3,yds:190},{par:5,yds:474},{par:4,yds:293},{par:3,yds:124},{par:4,yds:389},{par:4,yds:393},{par:3,yds:192},{par:5,yds:508},{par:5,yds:546},{par:3,yds:176},{par:4,yds:389},{par:4,yds:391},{par:5,yds:602},{par:4,yds:397},{par:3,yds:168},{par:4,yds:407},{par:4,yds:415}]},
    { name:'Blue',  color:'#1a4a9a', par:72, yards:6185, rating:68.4, slope:109, holes:[{par:5,yds:512},{par:3,yds:172},{par:5,yds:447},{par:4,yds:268},{par:3,yds:110},{par:4,yds:365},{par:4,yds:370},{par:3,yds:172},{par:5,yds:479},{par:5,yds:518},{par:3,yds:158},{par:4,yds:365},{par:4,yds:368},{par:5,yds:568},{par:4,yds:372},{par:3,yds:148},{par:4,yds:382},{par:4,yds:390}]},
    { name:'Silver',color:'#999',    par:72, yards:5327, rating:64.5, slope:99,  holes:[{par:5,yds:440},{par:3,yds:142},{par:5,yds:385},{par:4,yds:225},{par:3,yds:88},{par:4,yds:312},{par:4,yds:318},{par:3,yds:138},{par:5,yds:410},{par:5,yds:445},{par:3,yds:128},{par:4,yds:312},{par:4,yds:315},{par:5,yds:488},{par:4,yds:318},{par:3,yds:118},{par:4,yds:325},{par:4,yds:336}]},
    { name:'Gold',  color:'#d4a017', par:72, yards:4631, rating:61.7, slope:93,  holes:[{par:5,yds:380},{par:3,yds:110},{par:5,yds:328},{par:4,yds:190},{par:3,yds:68},{par:4,yds:268},{par:4,yds:272},{par:3,yds:110},{par:5,yds:355},{par:5,yds:385},{par:3,yds:102},{par:4,yds:268},{par:4,yds:270},{par:5,yds:420},{par:4,yds:272},{par:3,yds:95},{par:4,yds:278},{par:4,yds:288}]}
  ]},
  { id:'locust-locust', name:'Locust Hills – Locust', location:'Springfield, OH', emoji:'🌿',
    scorecardUrl:'https://locusthillsgc.com/',
    tees:[
    { name:'Black', color:'#555',    par:72, yards:6596, rating:70.2, slope:112, holes:[{par:5,yds:542},{par:3,yds:190},{par:5,yds:474},{par:4,yds:293},{par:3,yds:124},{par:4,yds:389},{par:4,yds:393},{par:3,yds:192},{par:5,yds:508},{par:5,yds:546},{par:3,yds:176},{par:4,yds:389},{par:4,yds:391},{par:5,yds:602},{par:4,yds:397},{par:3,yds:168},{par:4,yds:407},{par:4,yds:415}]},
    { name:'Blue',  color:'#1a4a9a', par:72, yards:6185, rating:68.4, slope:109, holes:[{par:5,yds:512},{par:3,yds:172},{par:5,yds:447},{par:4,yds:268},{par:3,yds:110},{par:4,yds:365},{par:4,yds:370},{par:3,yds:172},{par:5,yds:479},{par:5,yds:518},{par:3,yds:158},{par:4,yds:365},{par:4,yds:368},{par:5,yds:568},{par:4,yds:372},{par:3,yds:148},{par:4,yds:382},{par:4,yds:390}]},
    { name:'Silver',color:'#999',    par:72, yards:5327, rating:64.5, slope:99,  holes:[{par:5,yds:440},{par:3,yds:142},{par:5,yds:385},{par:4,yds:225},{par:3,yds:88},{par:4,yds:312},{par:4,yds:318},{par:3,yds:138},{par:5,yds:410},{par:5,yds:445},{par:3,yds:128},{par:4,yds:312},{par:4,yds:315},{par:5,yds:488},{par:4,yds:318},{par:3,yds:118},{par:4,yds:325},{par:4,yds:336}]},
    { name:'Gold',  color:'#d4a017', par:72, yards:4631, rating:61.7, slope:93,  holes:[{par:5,yds:380},{par:3,yds:110},{par:5,yds:328},{par:4,yds:190},{par:3,yds:68},{par:4,yds:268},{par:4,yds:272},{par:3,yds:110},{par:5,yds:355},{par:5,yds:385},{par:3,yds:102},{par:4,yds:268},{par:4,yds:270},{par:5,yds:420},{par:4,yds:272},{par:3,yds:95},{par:4,yds:278},{par:4,yds:288}]}
  ]},
  { id:'reid-north', name:'Reid Park – North', location:'Springfield, OH', emoji:'🌲',
    scorecardUrl:'https://www.golfreidpark.com/',
    tees:[
    { name:'Blue',  color:'#1a4a9a', par:72, yards:6772, rating:72.7, slope:136, holes:[{par:4,yds:394},{par:4,yds:398},{par:5,yds:539},{par:3,yds:201},{par:4,yds:402},{par:5,yds:600},{par:4,yds:363},{par:3,yds:193},{par:4,yds:376},{par:5,yds:509},{par:4,yds:357},{par:4,yds:420},{par:4,yds:434},{par:3,yds:178},{par:5,yds:511},{par:4,yds:374},{par:3,yds:172},{par:4,yds:351}]},
    { name:'White', color:'#888',    par:72, yards:6263, rating:70.3, slope:129, holes:[{par:4,yds:360},{par:4,yds:365},{par:5,yds:498},{par:3,yds:178},{par:4,yds:370},{par:5,yds:548},{par:4,yds:332},{par:3,yds:172},{par:4,yds:342},{par:5,yds:468},{par:4,yds:328},{par:4,yds:385},{par:4,yds:398},{par:3,yds:158},{par:5,yds:472},{par:4,yds:342},{par:3,yds:152},{par:4,yds:318}]},
    { name:'Red',   color:'#c00',    par:72, yards:5128, rating:68.3, slope:117, holes:[{par:4,yds:295},{par:4,yds:298},{par:5,yds:415},{par:3,yds:142},{par:4,yds:302},{par:5,yds:448},{par:4,yds:270},{par:3,yds:138},{par:4,yds:278},{par:5,yds:382},{par:4,yds:268},{par:4,yds:315},{par:4,yds:325},{par:3,yds:128},{par:5,yds:385},{par:4,yds:278},{par:3,yds:122},{par:4,yds:258}]}
  ]},
  { id:'reid-south', name:'Reid Park – South', location:'Springfield, OH', emoji:'☀️',
    scorecardUrl:'https://www.golfreidpark.com/',
    tees:[
    { name:'Blue',  color:'#1a4a9a', par:72, yards:6422, rating:69.0, slope:110, holes:[{par:4,yds:368},{par:4,yds:352},{par:5,yds:498},{par:3,yds:172},{par:4,yds:378},{par:5,yds:520},{par:4,yds:345},{par:3,yds:168},{par:4,yds:355},{par:4,yds:362},{par:3,yds:158},{par:5,yds:498},{par:4,yds:348},{par:4,yds:368},{par:3,yds:152},{par:5,yds:510},{par:4,yds:355},{par:4,yds:315}]},
    { name:'White', color:'#888',    par:72, yards:5900, rating:67.0, slope:105, holes:[{par:4,yds:338},{par:4,yds:322},{par:5,yds:462},{par:3,yds:152},{par:4,yds:348},{par:5,yds:482},{par:4,yds:318},{par:3,yds:148},{par:4,yds:328},{par:4,yds:332},{par:3,yds:138},{par:5,yds:462},{par:4,yds:318},{par:4,yds:338},{par:3,yds:135},{par:5,yds:472},{par:4,yds:325},{par:4,yds:285}]},
    { name:'Red',   color:'#c00',    par:72, yards:4950, rating:64.0, slope:100, holes:[{par:4,yds:278},{par:4,yds:262},{par:5,yds:385},{par:3,yds:122},{par:4,yds:288},{par:5,yds:398},{par:4,yds:258},{par:3,yds:118},{par:4,yds:268},{par:4,yds:272},{par:3,yds:112},{par:5,yds:382},{par:4,yds:258},{par:4,yds:275},{par:3,yds:108},{par:5,yds:388},{par:4,yds:262},{par:4,yds:228}]}
  ]},
  { id:'national-gl', name:'National Golf Links', location:'S. Charleston, OH', emoji:'🏴',
    scorecardUrl:'https://nationalgolflinks.org/',
    tees:[
    { name:'Black', color:'#555',    par:72, yards:7200, rating:74.2, slope:138, holes:[{par:4,yds:428},{par:4,yds:412},{par:5,yds:558},{par:3,yds:215},{par:4,yds:438},{par:4,yds:405},{par:5,yds:575},{par:3,yds:205},{par:4,yds:442},{par:4,yds:418},{par:3,yds:195},{par:5,yds:562},{par:4,yds:422},{par:4,yds:415},{par:3,yds:188},{par:5,yds:548},{par:4,yds:408},{par:4,yds:366}]},
    { name:'Blue',  color:'#1a4a9a', par:72, yards:6600, rating:71.5, slope:130, holes:[{par:4,yds:392},{par:4,yds:378},{par:5,yds:518},{par:3,yds:192},{par:4,yds:402},{par:4,yds:372},{par:5,yds:535},{par:3,yds:182},{par:4,yds:408},{par:4,yds:382},{par:3,yds:175},{par:5,yds:520},{par:4,yds:388},{par:4,yds:380},{par:3,yds:165},{par:5,yds:510},{par:4,yds:372},{par:4,yds:328}]},
    { name:'White', color:'#888',    par:72, yards:6000, rating:68.5, slope:122, holes:[{par:4,yds:355},{par:4,yds:342},{par:5,yds:468},{par:3,yds:168},{par:4,yds:365},{par:4,yds:338},{par:5,yds:488},{par:3,yds:162},{par:4,yds:372},{par:4,yds:348},{par:3,yds:155},{par:5,yds:472},{par:4,yds:352},{par:4,yds:345},{par:3,yds:148},{par:5,yds:462},{par:4,yds:338},{par:4,yds:298}]},
    { name:'Gold',  color:'#c8a000', par:72, yards:5400, rating:65.5, slope:115, holes:[{par:4,yds:318},{par:4,yds:305},{par:5,yds:418},{par:3,yds:142},{par:4,yds:328},{par:4,yds:302},{par:5,yds:432},{par:3,yds:142},{par:4,yds:332},{par:4,yds:312},{par:3,yds:135},{par:5,yds:422},{par:4,yds:315},{par:4,yds:308},{par:3,yds:128},{par:5,yds:412},{par:4,yds:302},{par:4,yds:268}]},
    { name:'Red',   color:'#c00',    par:72, yards:5100, rating:63.0, slope:108, holes:[{par:4,yds:295},{par:4,yds:282},{par:5,yds:392},{par:3,yds:128},{par:4,yds:305},{par:4,yds:278},{par:5,yds:405},{par:3,yds:128},{par:4,yds:308},{par:4,yds:288},{par:3,yds:122},{par:5,yds:395},{par:4,yds:292},{par:4,yds:285},{par:3,yds:115},{par:5,yds:385},{par:4,yds:278},{par:4,yds:248}]}
  ]},
  { id:'windy-knoll', name:'Windy Knoll Golf Club', location:'Springfield, OH', emoji:'💨',
    scorecardUrl:'https://www.windyknollgolfclub.com/scorecard/',
    tees:[
    { name:'Black',   color:'#555',    par:71, yards:6834, rating:71.9, slope:126, holes:[{par:4,yds:350},{par:4,yds:427},{par:3,yds:170},{par:4,yds:425},{par:5,yds:531},{par:4,yds:445},{par:3,yds:203},{par:4,yds:412},{par:5,yds:565},{par:4,yds:402},{par:3,yds:206},{par:5,yds:504},{par:3,yds:230},{par:4,yds:479},{par:5,yds:530},{par:4,yds:440},{par:4,yds:300},{par:3,yds:215}]},
    { name:'Grey',    color:'#888',    par:71, yards:6400, rating:70.1, slope:120, holes:[{par:4,yds:325},{par:4,yds:400},{par:3,yds:155},{par:4,yds:398},{par:5,yds:500},{par:4,yds:418},{par:3,yds:185},{par:4,yds:385},{par:5,yds:534},{par:4,yds:375},{par:3,yds:190},{par:5,yds:472},{par:3,yds:210},{par:4,yds:450},{par:5,yds:498},{par:4,yds:412},{par:4,yds:275},{par:3,yds:198}]},
    { name:'White',   color:'#aaa',    par:71, yards:5939, rating:67.8, slope:117, holes:[{par:4,yds:300},{par:4,yds:370},{par:3,yds:140},{par:4,yds:368},{par:5,yds:465},{par:4,yds:385},{par:3,yds:168},{par:4,yds:355},{par:5,yds:495},{par:4,yds:345},{par:3,yds:172},{par:5,yds:438},{par:3,yds:188},{par:4,yds:418},{par:5,yds:462},{par:4,yds:378},{par:4,yds:252},{par:3,yds:180}]},
    { name:'Gold',    color:'#c8a000', par:71, yards:5482, rating:64.5, slope:110, holes:[{par:4,yds:272},{par:4,yds:340},{par:3,yds:122},{par:4,yds:338},{par:5,yds:428},{par:4,yds:352},{par:3,yds:148},{par:4,yds:325},{par:5,yds:455},{par:4,yds:315},{par:3,yds:152},{par:5,yds:402},{par:3,yds:165},{par:4,yds:382},{par:5,yds:422},{par:4,yds:345},{par:4,yds:228},{par:3,yds:160}]},
    { name:'Burgundy',color:'#800020', par:71, yards:5101, rating:64.0, slope:108, holes:[{par:4,yds:248},{par:4,yds:312},{par:3,yds:108},{par:4,yds:308},{par:5,yds:395},{par:4,yds:322},{par:3,yds:132},{par:4,yds:298},{par:5,yds:418},{par:4,yds:288},{par:3,yds:135},{par:5,yds:368},{par:3,yds:148},{par:4,yds:352},{par:5,yds:388},{par:4,yds:315},{par:4,yds:205},{par:3,yds:140}]}
  ]}  ,
  { id:'snow-hill', name:'Snow Hill Country Club', location:'New Vienna, OH', emoji:'⛰️',
    scorecardUrl:'https://www.snowhillcountryclub.com/',
    tees:[
    { name:'Blue',   color:'#3b82f6', par:70, yards:6501, rating:71.8, slope:129, holes:[
      {par:5,yds:540,hcp:17},{par:3,yds:186,hcp:13},{par:5,yds:606,hcp:9},{par:4,yds:442,hcp:1},{par:4,yds:356,hcp:11},{par:3,yds:223,hcp:3},{par:4,yds:366,hcp:5},{par:3,yds:246,hcp:7},{par:4,yds:359,hcp:15},
      {par:4,yds:365,hcp:4},{par:4,yds:444,hcp:2},{par:3,yds:165,hcp:12},{par:4,yds:395,hcp:14},{par:4,yds:307,hcp:16},{par:3,yds:203,hcp:8},{par:5,yds:582,hcp:10},{par:4,yds:323,hcp:18},{par:4,yds:393,hcp:6}]},
    { name:'Gold',   color:'#c8a000', par:70, yards:5989, rating:69.8, slope:120, holes:[
      {par:5,yds:497,hcp:17},{par:3,yds:163,hcp:13},{par:5,yds:591,hcp:9},{par:4,yds:402,hcp:1},{par:4,yds:356,hcp:11},{par:3,yds:136,hcp:3},{par:4,yds:344,hcp:5},{par:3,yds:213,hcp:7},{par:4,yds:345,hcp:15},
      {par:4,yds:365,hcp:4},{par:4,yds:399,hcp:2},{par:3,yds:132,hcp:12},{par:4,yds:352,hcp:14},{par:4,yds:307,hcp:16},{par:3,yds:178,hcp:8},{par:5,yds:516,hcp:10},{par:4,yds:323,hcp:18},{par:4,yds:370,hcp:6}]},
    { name:'White',  color:'#aaa',    par:70, yards:5670, rating:68.5, slope:118, holes:[
      {par:5,yds:466,hcp:17},{par:3,yds:163,hcp:13},{par:5,yds:579,hcp:9},{par:4,yds:384,hcp:1},{par:4,yds:302,hcp:11},{par:3,yds:136,hcp:3},{par:4,yds:327,hcp:5},{par:3,yds:161,hcp:7},{par:4,yds:334,hcp:15},
      {par:4,yds:352,hcp:4},{par:4,yds:399,hcp:2},{par:3,yds:119,hcp:12},{par:4,yds:352,hcp:14},{par:4,yds:304,hcp:16},{par:3,yds:162,hcp:8},{par:5,yds:475,hcp:10},{par:4,yds:309,hcp:18},{par:4,yds:346,hcp:6}]},
    { name:'Red',    color:'#e74c3c', par:70, yards:4940, rating:69.1, slope:114, holes:[
      {par:5,yds:400,hcp:7},{par:3,yds:124,hcp:11},{par:5,yds:520,hcp:1},{par:4,yds:374,hcp:3},{par:4,yds:254,hcp:17},{par:3,yds:122,hcp:13},{par:4,yds:286,hcp:9},{par:3,yds:149,hcp:15},{par:4,yds:317,hcp:5},
      {par:4,yds:252,hcp:10},{par:4,yds:354,hcp:8},{par:3,yds:90,hcp:18},{par:4,yds:312,hcp:4},{par:4,yds:237,hcp:6},{par:3,yds:155,hcp:12},{par:5,yds:450,hcp:2},{par:4,yds:267,hcp:16},{par:4,yds:277,hcp:14}]}
  ]}
];

// ── COURSE SELECTOR ──────────────────────────────────────────────────
let selectedCourseId = null;
let selectedTeeIdx = 0;

function initCourseList() {
  buildCourseDropdown(COURSES);
}

function buildCourseDropdown(courses) {
  const sel = document.getElementById('course-select');
  if (!sel) return;
  const currentVal = sel.value;
  sel.innerHTML = '<option value="">— Select a course —</option>';
  const byLocation = {};
  courses.forEach(c => {
    if (!byLocation[c.location]) byLocation[c.location] = [];
    byLocation[c.location].push(c);
  });
  Object.entries(byLocation).forEach(([loc, list]) => {
    const grp = document.createElement('optgroup');
    grp.label = loc;
    list.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = `${c.emoji} ${c.name}`;
      if (selectedCourseId === c.id) opt.selected = true;
      grp.appendChild(opt);
    });
    sel.appendChild(grp);
  });
  // Restore value if it survived the filter
  if (currentVal) sel.value = currentVal;
}

function filterCourseDropdown() {
  const q = document.getElementById('course-search').value.toLowerCase().trim();
  const filtered = q ? COURSES.filter(c =>
    c.name.toLowerCase().includes(q) || c.location.toLowerCase().includes(q)
  ) : COURSES;
  buildCourseDropdown(filtered);
}

function filterCourses() {} // no-op kept for compat

function selectCourse(id) {
  selectedCourseId = id || null;
  selectedTeeIdx = 0;
  renderTeePicker();
}

function renderTeePicker() {
  const wrap = document.getElementById('tee-picker-wrap');
  const opts = document.getElementById('tee-options');
  if (!selectedCourseId) { wrap.style.display = 'none'; return; }
  const course = COURSES.find(c => c.id === selectedCourseId);
  if (!course) { wrap.style.display = 'none'; return; }
  wrap.style.display = 'block';
  opts.innerHTML = '';

  // Scorecard link
  let linkEl = document.getElementById('course-scorecard-link');
  if (!linkEl) {
    linkEl = document.createElement('div');
    linkEl.id = 'course-scorecard-link';
    linkEl.style.cssText = 'margin-bottom:10px;font-size:0.78rem;';
    wrap.insertBefore(linkEl, opts);
  }
  if (course.scorecardUrl) {
    linkEl.innerHTML = `<a href="${course.scorecardUrl}" target="_blank" style="color:var(--gold);text-decoration:none;font-family:var(--font-display);letter-spacing:1px;">📄 View Official Scorecard ↗</a>`;
  } else {
    linkEl.innerHTML = '';
  }

  course.tees.forEach((t, i) => {
    const btn = document.createElement('button');
    btn.className = 'tee-btn' + (selectedTeeIdx === i ? ' active' : '');
    btn.innerHTML = `<span style="font-weight:700;">${t.name}</span> <span style="font-size:0.75em;opacity:0.85;">${t.yards}y · ${t.rating}/${t.slope} · Par ${t.par||72}</span>`;
    if (selectedTeeIdx === i) { btn.style.background = t.color; btn.style.borderColor = t.color; btn.style.color = '#fff'; }
    btn.onclick = (e) => { e.stopPropagation(); selectedTeeIdx = i; renderTeePicker(); };
    opts.appendChild(btn);
  });
}

function skipCourse() {
  selectedCourseId = null;
  selectedTeeIdx = 0;
  const sel = document.getElementById('course-select');
  if (sel) sel.value = '';
  const search = document.getElementById('course-search');
  if (search) { search.value = ''; buildCourseDropdown(COURSES); }
  document.getElementById('tee-picker-wrap').style.display = 'none';
}

document.addEventListener('DOMContentLoaded', () => { initCourseList(); initPlayerSlots(); updateWizard(); });

// ── UNSAVED DATA GUARD ────────────────────────────────────────────────────────
window.addEventListener('beforeunload', function(e) {
  if (inRound) {
    e.preventDefault();
    e.returnValue = 'You have an active round. Leave and lose unsaved data?';
    return e.returnValue;
  }
});
// Intercept kmansgolf logo tap mid-round
document.addEventListener('click', function(e) {
  const link = e.target.closest('a[href="/"]');
  if (link && inRound) {
    e.preventDefault();
    if (confirm('You have an active round. Leave and lose unsaved data?')) {
      window.location.href = '/';
    }
  }
});

// ── THEME TOGGLE ─────────────────────────────────────────────────────────────
function applyTheme(theme) {
  const isLight = theme === 'light';
  const attr = isLight ? 'light' : '';
  document.body.setAttribute('data-theme', attr);
  document.getElementById('app').setAttribute('data-theme', attr);
  const btn = document.getElementById('theme-btn');
  if (btn) btn.textContent = isLight ? '🌙 Dark' : '☀️ Light';
  const meta = document.getElementById('theme-meta');
  if (meta) meta.setAttribute('content', isLight ? '#faf8f4' : '#000000');
  localStorage.setItem('bunker_theme', theme);
}
function toggleTheme() {
  const current = localStorage.getItem('bunker_theme') || 'dark';
  applyTheme(current === 'light' ? 'dark' : 'light');
}
// ── SWIPE DOWN TO REFRESH (history tab only) ─────────────────────────────────
(function(){
  let ty=0, ready=false;
  const ind=document.createElement('div');
  ind.style.cssText='position:fixed;top:0;left:0;right:0;height:44px;display:flex;align-items:center;justify-content:center;font-family:Barlow Condensed,sans-serif;font-size:11px;letter-spacing:2px;color:#3ddc84;background:rgba(0,0,0,0.92);transform:translateY(-44px);transition:transform 0.2s ease;z-index:9999;pointer-events:none;';
  ind.textContent='↓ RELEASE TO REFRESH';
  document.body.appendChild(ind);
  document.addEventListener('touchstart',e=>{ty=e.touches[0].clientY;},{passive:true});
  document.addEventListener('touchmove',e=>{
    const active=document.querySelector('.view.active');
    if(!active||active.id!=='history-view') return;
    const scroll=active.querySelector('.play-content');
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

// Apply saved theme on load
(function() {
  const saved = localStorage.getItem('bunker_theme') || 'dark';
  applyTheme(saved);
})();
