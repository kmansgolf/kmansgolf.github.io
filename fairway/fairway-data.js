// Only make API calls when hosted (not local file)
const IS_HOSTED = location.protocol === 'https:' || location.hostname === 'localhost';
const WORKER_URL = 'https://kmansgolf.kemiman74.workers.dev';

window.addEventListener('unhandledrejection', e => { e.preventDefault(); });
window.addEventListener('error', e => {
  if (e.message === 'Script error.') e.preventDefault();
});

const {useState,useEffect,useRef,useCallback} = React;
const h = React.createElement;

// ── CONSTANTS ─────────────────────────────────────────────────────────────────
const ALL_TOUR_OPTIONS = [
  {value:"", label:"Select Tour"},
  {value:"regular.columbus", label:"Regular Tour"},
  {value:"senior.columbus",  label:"Senior Tour"},
];
const REGULAR_MEMBERS = [{"id":"45924","name":"Anderson, Todd","flight":"C"},{"id":"57516","name":"Archer, Michael","flight":"D"},{"id":"38126","name":"Arosemena, Che","flight":"B"},{"id":"51099","name":"Bal, Amol","flight":"D"},{"id":"59601","name":"Barker, Jonathan","flight":"A"},{"id":"47128","name":"Beadle, Jamie","flight":"C"},{"id":"61543","name":"Beaver, Brandon","flight":"A"},{"id":"61020","name":"Beck, Joshua","flight":"A"},{"id":"36635","name":"Berry, Chris","flight":"C"},{"id":"60359","name":"Betscher, Wes","flight":"D"},{"id":"57321","name":"Blackburn, Alexander","flight":"Champ"},{"id":"62635","name":"Boyd, Christopher","flight":"C"},{"id":"16378","name":"Boyed, Brian","flight":"A"},{"id":"47964","name":"Brooks, Shay","flight":"Champ"},{"id":"41832","name":"Brown, Jeremy","flight":"A"},{"id":"15242","name":"Brown, Kevin","flight":"B"},{"id":"18670","name":"Burlison, Tom","flight":"A"},{"id":"33406","name":"Burns, Scott","flight":"B"},{"id":"23431","name":"Byrd, Rhoshaun","flight":"A"},{"id":"17648","name":"Campbell, Rich","flight":"Champ"},{"id":"56035","name":"Canlas, Andrew","flight":"C"},{"id":"51627","name":"Cartee, Tyler","flight":"A"},{"id":"54529","name":"Chanatry, Michael","flight":"B"},{"id":"53395","name":"Coyle, Michael","flight":"Champ"},{"id":"62192","name":"Crossfield, Keegan","flight":"D"},{"id":"17772","name":"Crossfield, Kyle","flight":"A"},{"id":"19811","name":"Crossfield, Les","flight":"D"},{"id":"62609","name":"Cuda, Nicolas","flight":"B"},{"id":"58937","name":"Culler, Joe","flight":"A"},{"id":"29736","name":"Curtis, Jack Henry","flight":"Champ"},{"id":"62661","name":"Davis, Dustin","flight":"D"},{"id":"55154","name":"Deitsch, Rylee","flight":"A"},{"id":"40014","name":"Detty, Peter","flight":"A"},{"id":"57777","name":"Di Biase, Joseph","flight":"B"},{"id":"54425","name":"Dilger, Mike","flight":"B"},{"id":"60987","name":"Ducay, Jeff","flight":"D"},{"id":"61830","name":"Earles, Bob","flight":"A"},{"id":"61896","name":"Edwards, Adrienne","flight":"D-W"},{"id":"59377","name":"Edwards, Nathan","flight":"B"},{"id":"58080","name":"Elmore, Ian","flight":"C"},{"id":"57239","name":"Elmore, Jordan","flight":"B"},{"id":"56761","name":"Eveland, Eric","flight":"B"},{"id":"32128","name":"Fleming, Tim","flight":"D"},{"id":"2459","name":"Fryman, John","flight":"Champ"},{"id":"49228","name":"Gaitanos, Gregory","flight":"A"},{"id":"14476","name":"Gardner, Kyle","flight":"A"},{"id":"30164","name":"Gilliland, Steve","flight":"B"},{"id":"54427","name":"Green, Keith","flight":"B"},{"id":"45436","name":"Gregory, Jeff","flight":"C"},{"id":"62256","name":"Grootegoed, Logan","flight":"D"},{"id":"21294","name":"Haney, Brian","flight":"A"},{"id":"62827","name":"Harmon, Raymond","flight":"A"},{"id":"46979","name":"Hohenstein, Cory","flight":"B"},{"id":"49710","name":"Hopkins, Draven","flight":"A"},{"id":"62764","name":"Hurt, Chris","flight":"C"},{"id":"57705","name":"Irwin, Zachary","flight":"B"},{"id":"59971","name":"Jackson, Nathaniel","flight":"D"},{"id":"51522","name":"Janes, Rush","flight":"A"},{"id":"22892","name":"Jenkins, Tim","flight":"B"},{"id":"18701","name":"Jordan, Tom","flight":"B"},{"id":"44674","name":"Joshi, Ballal","flight":"C"},{"id":"2582","name":"Kahari, Cham","flight":"B"},{"id":"62839","name":"Kirtley, Andrew","flight":"A"},{"id":"49764","name":"Knox, Brad","flight":"B"},{"id":"62591","name":"Kondagari, Shrihan","flight":"Champ"},{"id":"44459","name":"Krishna, Manju","flight":"C"},{"id":"54645","name":"Kristy, Brandon","flight":"B"},{"id":"53679","name":"Lanfear, Jerry","flight":"B"},{"id":"59474","name":"Lee, Harvey","flight":"D"},{"id":"8321","name":"Lee, Hyo Seung","flight":"A"},{"id":"62949","name":"Lee, Youngmi","flight":"D-W"},{"id":"47631","name":"Lewis, Dan","flight":"B"},{"id":"59262","name":"Lloyd, Dillon","flight":"C"},{"id":"25236","name":"Lumbatis, Frank","flight":"A"},{"id":"55097","name":"Mansfield, Kevin","flight":"C"},{"id":"56787","name":"Maxson, Evan","flight":"A"},{"id":"62090","name":"McGuckin, Zach","flight":"A"},{"id":"53946","name":"Miller, Greg","flight":"B"},{"id":"23464","name":"Miller, Josh","flight":"C"},{"id":"24275","name":"Novak, Butch","flight":"C"},{"id":"60352","name":"Pancake, Christian","flight":"C"},{"id":"57696","name":"Pantangco, Marvin","flight":"B"},{"id":"49053","name":"Phares, Shaun","flight":"B"},{"id":"36628","name":"Phillips, Steve","flight":"A"},{"id":"53739","name":"Pond, Jeffrey","flight":"B"},{"id":"62816","name":"Prieto, Carlos","flight":"D"},{"id":"62903","name":"Racano, Michael","flight":"D"},{"id":"18307","name":"Reeder, Rex","flight":"A"},{"id":"49144","name":"Rider, Kevin","flight":"A"},{"id":"35242","name":"Rinehart, Travis","flight":"A"},{"id":"51332","name":"Robinson, Jeff","flight":"A"},{"id":"57639","name":"Rosenthal, Brett","flight":"A"},{"id":"59476","name":"Roush, Jeremy","flight":"A"},{"id":"26462","name":"Ruksujjar, Sammy","flight":"A"},{"id":"55788","name":"Ruzicho, Andy","flight":"B"},{"id":"59103","name":"Samant, Abhish","flight":"B"},{"id":"57697","name":"Scott, Kristian","flight":"B"},{"id":"25034","name":"Sears, Travis","flight":"A"},{"id":"59720","name":"Sharrock, Kristopher","flight":"B"},{"id":"58054","name":"Shaw, Phillip","flight":"D"},{"id":"59926","name":"Shields, Eric","flight":"A"},{"id":"20511","name":"Shim, Rob","flight":"A"},{"id":"21229","name":"Shoulders, Dana","flight":"A"},{"id":"58109","name":"Siders, Derek","flight":"C"},{"id":"48295","name":"Siders, Jim","flight":"C"},{"id":"53697","name":"Snodgrass, Eric","flight":"Champ"},{"id":"55746","name":"Spellman, Seth","flight":"B"},{"id":"56817","name":"Strope, Andrew","flight":"Champ"},{"id":"62097","name":"Tank, Jordan","flight":"B"},{"id":"45774","name":"Tinajero, Miguel","flight":"A"},{"id":"56711","name":"Tomechak, Michael","flight":"C"},{"id":"58973","name":"Tumey, Darrell","flight":"D"},{"id":"30281","name":"VanHoose, Mitch","flight":"C"},{"id":"62594","name":"Varney, Nathan","flight":"C"},{"id":"62002","name":"Vexler, Kyle","flight":"C"},{"id":"34022","name":"Waligura, Jade","flight":"A"},{"id":"62990","name":"Walker, Matthew","flight":"C"},{"id":"43884","name":"Walker, Stephen","flight":"A"},{"id":"46277","name":"Yeager, David","flight":"B"},{"id":"41989","name":"Zehnder, Donald","flight":"A"},{"id":"19869","name":"Zipay, Jeff","flight":"A"}];
const SENIOR_MEMBERS = [{"id":"19549","name":"Alexander, Ron","flight":"Champ"},{"id":"14076","name":"Basinger, Jeff","flight":"A"},{"id":"17120","name":"Benavides, Roberto","flight":"D"},{"id":"15182","name":"Blair, Dwight","flight":"D"},{"id":"20264","name":"Boger, Shane","flight":"B"},{"id":"16259","name":"Brown, Kevin","flight":"C"},{"id":"13274","name":"Burlison, Tom","flight":"A"},{"id":"21227","name":"Burns, Scott","flight":"B"},{"id":"21191","name":"Butler, Toby","flight":"B"},{"id":"12175","name":"Campbell, Rich","flight":"Champ"},{"id":"20525","name":"Canfield, Joe","flight":"Champ"},{"id":"20677","name":"Davis, Harold","flight":"C"},{"id":"19342","name":"Desmond, Terry","flight":"A"},{"id":"20348","name":"Di Biase, Joseph","flight":"B"},{"id":"17322","name":"Efta, Thomas","flight":"B"},{"id":"19474","name":"Fryman, John","flight":"Champ"},{"id":"17324","name":"Gibson, Michael","flight":"B"},{"id":"17874","name":"Heckman, Craig","flight":"A"},{"id":"19335","name":"Holahan, Scott","flight":"Champ"},{"id":"18233","name":"Honeycutt, Rick","flight":"C"},{"id":"14081","name":"Hooshangi, Jaymee","flight":"C"},{"id":"13448","name":"Jenkins, Tim","flight":"C"},{"id":"15343","name":"Jochum, Mark","flight":"C"},{"id":"21224","name":"Jordan, Thomas","flight":"B"},{"id":"20976","name":"Lanfear, Jerry","flight":"B"},{"id":"15859","name":"Link, John","flight":"Champ"},{"id":"12937","name":"Lumbatis, Frank","flight":"A"},{"id":"17888","name":"Luzio, Chris","flight":"D"},{"id":"17956","name":"Mansfield, Kevin","flight":"B"},{"id":"20145","name":"Maxwell, Bradley","flight":"A"},{"id":"15481","name":"Maynard, Garrett","flight":"B"},{"id":"20885","name":"McElwee, Jason","flight":"D"},{"id":"17641","name":"Meeks, Gavin","flight":"A"},{"id":"17490","name":"Montgomery, John","flight":"B"},{"id":"19528","name":"Mowery, Jerry","flight":"Champ"},{"id":"15628","name":"Myers, Michael","flight":"B"},{"id":"17198","name":"Myricks, Dalon","flight":"B"},{"id":"20370","name":"Newcomb, Michael","flight":"C"},{"id":"10654","name":"Novak, Butch","flight":"D"},{"id":"12721","name":"Parsley, Joseph","flight":"B"},{"id":"8413","name":"Picking, Kenneth","flight":"B"},{"id":"21022","name":"Polick, Brian","flight":"Champ"},{"id":"17817","name":"Pond, Jeffrey","flight":"B"},{"id":"21265","name":"Racano, Michael","flight":"D"},{"id":"13790","name":"Riley, Steve","flight":"B"},{"id":"11172","name":"Ruksujjar, Sam","flight":"A"},{"id":"20259","name":"Scheiderer, Dean","flight":"C"},{"id":"20552","name":"Scott, Kristian","flight":"A"},{"id":"21164","name":"Shim, Rob","flight":"C"},{"id":"17424","name":"Shoulders, Dana","flight":"A"},{"id":"15287","name":"Siders, Jim","flight":"C"},{"id":"9096","name":"Smialek, Richard","flight":"B"},{"id":"20437","name":"Snodgrass, Eric","flight":"Champ"},{"id":"17226","name":"Stonebraker, Jonathan","flight":"B"},{"id":"17484","name":"Thomas, Terry","flight":"D"},{"id":"18100","name":"Tumey, Darrell","flight":"D"},{"id":"19347","name":"Tunison, Bub","flight":"B"},{"id":"18193","name":"Widman, Thomas","flight":"B"},{"id":"14894","name":"Yeager, David","flight":"C"},{"id":"10764","name":"Zipay, Jeff","flight":"A"}];

// Build a fast lookup map by ID across both tours
const MEMBER_MAP = {};
REGULAR_MEMBERS.forEach(m=>{ MEMBER_MAP[m.id]={...m,tour:"regular",region:"columbus"}; });
SENIOR_MEMBERS.forEach(m=>{ MEMBER_MAP[m.id]={...m,tour:"senior",region:"columbus"}; });

// Keep backward compat
const ID_REGION_MAP = {
  17956:{tour:"senior",  region:"columbus", name:"Mansfield, Kevin"},
  55097:{tour:"regular", region:"columbus", name:"Mansfield, Kevin"},
  12721:{tour:"senior",  region:"columbus", name:"Parsley, Joe"},
};
const TOUR_DOMAINS = {regular:"amateurgolftour.net",senior:"senioramateurgolftour.net"};
const SCHEDULE = {
  regular:[
    {date:"2026-04-12",course:"Springfield Country Club",tid:17975},
    {date:"2026-04-20",course:"NCR South",tid:17992},
    {date:"2026-05-11",course:"New Albany Country Club",tid:17976},
    {date:"2026-05-24",course:"The Virtues Golf Club",tid:17977},
    {date:"2026-06-01",course:"Rattlesnake Ridge GC",tid:18234},
    {date:"2026-06-13",course:"Delaware Golf Club",tid:17978},
    {date:"2026-06-28",course:"Cumberland Trail Golf Club",tid:17979},
    {date:"2026-07-13",course:"The Lakes Golf & CC",tid:17980},
    {date:"2026-07-26",course:"Apple Valley Golf Course",tid:17981},
    {date:"2026-08-02",course:"Denison Golf Course",tid:17982},
    {date:"2026-09-06",course:"Darby Creek Golf Course",tid:17983},
    {date:"2026-09-12",course:"Urbana Country Club",tid:18276},
    {date:"2026-09-19",course:"Lancaster CC / Lancaster GC",tid:18272,twoDay:true,endDate:"2026-09-20"},
  ],
  senior:[
    {date:"2026-04-11",course:"Urbana Country Club",tid:6303},
    {date:"2026-04-20",course:"NCR South",tid:6335},
    {date:"2026-05-10",course:"Cumberland Trail Golf Club",tid:6291},
    {date:"2026-05-23",course:"The Virtues Golf Club",tid:6292},
    {date:"2026-06-08",course:"Miami Valley GC",tid:6337},
    {date:"2026-06-27",course:"Delaware Golf Club",tid:6294},
    {date:"2026-07-12",course:"Denison Golf Course",tid:6295},
    {date:"2026-07-25",course:"Cumberland Trail Golf Club",tid:6296},
    {date:"2026-08-08",course:"Darby Creek Golf Course",tid:6298,twoDay:true,endDate:"2026-08-09"},
    {date:"2026-08-16",course:"Lancaster Golf Club",tid:5744},
    {date:"2026-09-13",course:"Majestic Springs GC",tid:5963},
  ],
};

// Course data with rating + slope added
const COURSES = {
  "Delaware Golf Club":        {par:71,yardage:6925,rating:72.8,slope:131,holes:[
    {h:1,par:4,yds:423,hcp:5},{h:2,par:4,yds:385,hcp:11},{h:3,par:4,yds:412,hcp:3},
    {h:4,par:5,yds:528,hcp:1},{h:5,par:3,yds:182,hcp:17},{h:6,par:5,yds:518,hcp:7},
    {h:7,par:4,yds:395,hcp:13},{h:8,par:3,yds:168,hcp:15},{h:9,par:4,yds:408,hcp:9},
    {h:10,par:4,yds:401,hcp:6},{h:11,par:4,yds:389,hcp:10},{h:12,par:4,yds:375,hcp:16},
    {h:13,par:5,yds:512,hcp:2},{h:14,par:3,yds:155,hcp:18},{h:15,par:4,yds:398,hcp:8},
    {h:16,par:4,yds:369,hcp:14},{h:17,par:4,yds:388,hcp:12},{h:18,par:3,yds:158,hcp:4},
  ]},
  "Springfield Country Club":  {par:72,yardage:6684,rating:71.9,slope:128,holes:[
    {h:1,par:4,yds:390,hcp:7},{h:2,par:5,yds:525,hcp:3},{h:3,par:3,yds:175,hcp:15},
    {h:4,par:4,yds:405,hcp:5},{h:5,par:5,yds:510,hcp:1},{h:6,par:4,yds:380,hcp:11},
    {h:7,par:4,yds:375,hcp:9},{h:8,par:4,yds:370,hcp:13},{h:9,par:3,yds:165,hcp:17},
    {h:10,par:4,yds:395,hcp:8},{h:11,par:4,yds:385,hcp:12},{h:12,par:5,yds:520,hcp:2},
    {h:13,par:3,yds:170,hcp:16},{h:14,par:4,yds:400,hcp:6},{h:15,par:4,yds:380,hcp:10},
    {h:16,par:3,yds:160,hcp:18},{h:17,par:5,yds:515,hcp:4},{h:18,par:4,yds:385,hcp:14},
  ]},
  "NCR South":                 {par:70,yardage:6720,rating:72.5,slope:133,holes:[
    {h:1,par:4,yds:410,hcp:5},{h:2,par:5,yds:530,hcp:1},{h:3,par:3,yds:180,hcp:13},
    {h:4,par:4,yds:395,hcp:7},{h:5,par:4,yds:385,hcp:9},{h:6,par:4,yds:375,hcp:11},
    {h:7,par:4,yds:370,hcp:3},{h:8,par:4,yds:365,hcp:15},{h:9,par:3,yds:160,hcp:17},
    {h:10,par:4,yds:400,hcp:6},{h:11,par:3,yds:170,hcp:14},{h:12,par:5,yds:520,hcp:2},
    {h:13,par:3,yds:155,hcp:18},{h:14,par:4,yds:390,hcp:8},{h:15,par:4,yds:380,hcp:10},
    {h:16,par:4,yds:370,hcp:12},{h:17,par:4,yds:360,hcp:16},{h:18,par:4,yds:355,hcp:4},
  ]},
  "The Virtues Golf Club":     {par:72,yardage:7243,rating:75.1,slope:138,holes:[
    {h:1,par:4,yds:435,hcp:9},{h:2,par:4,yds:420,hcp:5},{h:3,par:4,yds:410,hcp:11},
    {h:4,par:5,yds:545,hcp:1},{h:5,par:3,yds:195,hcp:17},{h:6,par:4,yds:425,hcp:7},
    {h:7,par:5,yds:540,hcp:3},{h:8,par:4,yds:415,hcp:13},{h:9,par:3,yds:185,hcp:15},
    {h:10,par:5,yds:550,hcp:2},{h:11,par:4,yds:430,hcp:6},{h:12,par:3,yds:190,hcp:16},
    {h:13,par:4,yds:425,hcp:8},{h:14,par:3,yds:185,hcp:18},{h:15,par:4,yds:420,hcp:10},
    {h:16,par:5,yds:545,hcp:4},{h:17,par:4,yds:415,hcp:12},{h:18,par:4,yds:410,hcp:14},
  ]},
  "Cumberland Trail Golf Club":{par:72,yardage:6837,rating:72.4,slope:129,holes:[
    {h:1,par:4,yds:418,hcp:7},{h:2,par:5,yds:532,hcp:3},{h:3,par:3,yds:178,hcp:15},
    {h:4,par:4,yds:405,hcp:5},{h:5,par:5,yds:525,hcp:1},{h:6,par:3,yds:172,hcp:17},
    {h:7,par:4,yds:398,hcp:9},{h:8,par:4,yds:388,hcp:11},{h:9,par:4,yds:382,hcp:13},
    {h:10,par:4,yds:408,hcp:6},{h:11,par:3,yds:168,hcp:16},{h:12,par:5,yds:528,hcp:2},
    {h:13,par:4,yds:402,hcp:8},{h:14,par:4,yds:392,hcp:10},{h:15,par:4,yds:385,hcp:12},
    {h:16,par:5,yds:522,hcp:4},{h:17,par:3,yds:165,hcp:18},{h:18,par:4,yds:395,hcp:14},
  ]},
  "Urbana Country Club":       {par:72,yardage:6849,rating:72.6,slope:130,holes:[
    {h:1,par:4,yds:425,hcp:6},{h:2,par:4,yds:412,hcp:10},{h:3,par:3,yds:182,hcp:16},
    {h:4,par:5,yds:538,hcp:2},{h:5,par:4,yds:408,hcp:8},{h:6,par:4,yds:398,hcp:12},
    {h:7,par:3,yds:175,hcp:18},{h:8,par:5,yds:530,hcp:4},{h:9,par:4,yds:405,hcp:14},
    {h:10,par:4,yds:415,hcp:5},{h:11,par:5,yds:535,hcp:1},{h:12,par:3,yds:178,hcp:17},
    {h:13,par:4,yds:410,hcp:9},{h:14,par:4,yds:400,hcp:11},{h:15,par:3,yds:172,hcp:15},
    {h:16,par:4,yds:405,hcp:7},{h:17,par:5,yds:528,hcp:3},{h:18,par:4,yds:412,hcp:13},
  ]},
  "Denison Golf Course":       {par:71,yardage:6559,rating:71.2,slope:125,holes:[
    {h:1,par:4,yds:398,hcp:7},{h:2,par:4,yds:385,hcp:11},{h:3,par:4,yds:375,hcp:9},
    {h:4,par:3,yds:168,hcp:17},{h:5,par:4,yds:392,hcp:5},{h:6,par:5,yds:518,hcp:1},
    {h:7,par:3,yds:162,hcp:15},{h:8,par:4,yds:380,hcp:13},{h:9,par:4,yds:377,hcp:3},
    {h:10,par:5,yds:522,hcp:2},{h:11,par:4,yds:388,hcp:8},{h:12,par:5,yds:515,hcp:4},
    {h:13,par:4,yds:382,hcp:10},{h:14,par:3,yds:165,hcp:16},{h:15,par:4,yds:390,hcp:6},
    {h:16,par:4,yds:378,hcp:12},{h:17,par:3,yds:158,hcp:18},{h:18,par:4,yds:381,hcp:14},
  ]},
  "Darby Creek Golf Course":   {par:72,yardage:7074,rating:73.8,slope:132,holes:[
    {h:1,par:4,yds:428,hcp:7},{h:2,par:4,yds:415,hcp:11},{h:3,par:3,yds:185,hcp:15},
    {h:4,par:5,yds:548,hcp:1},{h:5,par:4,yds:420,hcp:5},{h:6,par:5,yds:542,hcp:3},
    {h:7,par:3,yds:178,hcp:17},{h:8,par:4,yds:412,hcp:9},{h:9,par:4,yds:408,hcp:13},
    {h:10,par:4,yds:418,hcp:6},{h:11,par:3,yds:172,hcp:16},{h:12,par:4,yds:410,hcp:10},
    {h:13,par:4,yds:405,hcp:12},{h:14,par:5,yds:545,hcp:2},{h:15,par:4,yds:415,hcp:8},
    {h:16,par:3,yds:168,hcp:18},{h:17,par:5,yds:540,hcp:4},{h:18,par:4,yds:420,hcp:14},
  ]},
  "Miami Valley GC":           {par:71,yardage:6795,rating:72.3,slope:130,holes:[
    {h:1,par:5,yds:532,hcp:3},{h:2,par:4,yds:418,hcp:7},{h:3,par:5,yds:528,hcp:5},
    {h:4,par:4,yds:412,hcp:9},{h:5,par:3,yds:178,hcp:15},{h:6,par:4,yds:405,hcp:11},
    {h:7,par:4,yds:398,hcp:13},{h:8,par:3,yds:172,hcp:17},{h:9,par:4,yds:395,hcp:1},
    {h:10,par:4,yds:408,hcp:4},{h:11,par:4,yds:400,hcp:8},{h:12,par:4,yds:392,hcp:10},
    {h:13,par:3,yds:165,hcp:16},{h:14,par:4,yds:405,hcp:6},{h:15,par:5,yds:525,hcp:2},
    {h:16,par:4,yds:395,hcp:12},{h:17,par:3,yds:162,hcp:18},{h:18,par:4,yds:398,hcp:14},
  ]},
  "Rattlesnake Ridge GC":      {par:72,yardage:7012,rating:73.5,slope:134,holes:[
    {h:1,par:4,yds:425,hcp:9},{h:2,par:3,yds:182,hcp:15},{h:3,par:5,yds:538,hcp:1},
    {h:4,par:4,yds:418,hcp:5},{h:5,par:4,yds:410,hcp:7},{h:6,par:5,yds:542,hcp:3},
    {h:7,par:3,yds:175,hcp:17},{h:8,par:4,yds:408,hcp:11},{h:9,par:4,yds:402,hcp:13},
    {h:10,par:4,yds:415,hcp:8},{h:11,par:4,yds:405,hcp:10},{h:12,par:3,yds:170,hcp:16},
    {h:13,par:4,yds:410,hcp:6},{h:14,par:4,yds:400,hcp:12},{h:15,par:4,yds:395,hcp:14},
    {h:16,par:5,yds:545,hcp:2},{h:17,par:3,yds:165,hcp:18},{h:18,par:5,yds:540,hcp:4},
  ]},
  "New Albany Country Club":   {par:72,yardage:7133,rating:74.5,slope:137,holes:[
    {h:1,par:4,yds:438,hcp:7},{h:2,par:3,yds:192,hcp:15},{h:3,par:4,yds:428,hcp:5},
    {h:4,par:5,yds:552,hcp:1},{h:5,par:3,yds:185,hcp:17},{h:6,par:4,yds:432,hcp:9},
    {h:7,par:5,yds:548,hcp:3},{h:8,par:4,yds:425,hcp:11},{h:9,par:4,yds:418,hcp:13},
    {h:10,par:4,yds:428,hcp:6},{h:11,par:3,yds:182,hcp:16},{h:12,par:5,yds:545,hcp:2},
    {h:13,par:4,yds:422,hcp:8},{h:14,par:5,yds:548,hcp:4},{h:15,par:4,yds:418,hcp:10},
    {h:16,par:4,yds:412,hcp:12},{h:17,par:3,yds:178,hcp:18},{h:18,par:4,yds:425,hcp:14},
  ]},
  "Apple Valley Golf Course":  {par:72,yardage:6946,rating:72.9,slope:129,holes:[
    {h:1,par:4,yds:420,hcp:9},{h:2,par:4,yds:410,hcp:11},{h:3,par:5,yds:535,hcp:3},
    {h:4,par:4,yds:415,hcp:7},{h:5,par:3,yds:178,hcp:17},{h:6,par:5,yds:540,hcp:1},
    {h:7,par:3,yds:172,hcp:15},{h:8,par:4,yds:412,hcp:5},{h:9,par:4,yds:408,hcp:13},
    {h:10,par:5,yds:542,hcp:2},{h:11,par:4,yds:418,hcp:8},{h:12,par:5,yds:538,hcp:4},
    {h:13,par:3,yds:168,hcp:16},{h:14,par:4,yds:415,hcp:6},{h:15,par:4,yds:408,hcp:10},
    {h:16,par:3,yds:162,hcp:18},{h:17,par:4,yds:412,hcp:12},{h:18,par:4,yds:405,hcp:14},
  ]},
  "Majestic Springs GC":       {par:71,yardage:6464,rating:70.8,slope:124,holes:[
    {h:1,par:4,yds:385,hcp:7},{h:2,par:4,yds:378,hcp:9},{h:3,par:3,yds:162,hcp:17},
    {h:4,par:5,yds:515,hcp:1},{h:5,par:3,yds:155,hcp:15},{h:6,par:4,yds:382,hcp:5},
    {h:7,par:3,yds:158,hcp:13},{h:8,par:5,yds:512,hcp:3},{h:9,par:4,yds:375,hcp:11},
    {h:10,par:4,yds:388,hcp:6},{h:11,par:5,yds:518,hcp:2},{h:12,par:4,yds:380,hcp:8},
    {h:13,par:4,yds:375,hcp:10},{h:14,par:3,yds:155,hcp:16},{h:15,par:5,yds:510,hcp:4},
    {h:16,par:4,yds:378,hcp:12},{h:17,par:3,yds:152,hcp:18},{h:18,par:4,yds:381,hcp:14},
  ]},
  "Lancaster Country Club":    {par:72,yardage:6538,rating:71.5,slope:126,holes:[
    {h:1,par:4,yds:388,hcp:9},{h:2,par:5,yds:520,hcp:3},{h:3,par:4,yds:382,hcp:11},
    {h:4,par:3,yds:165,hcp:17},{h:5,par:5,yds:515,hcp:1},{h:6,par:4,yds:378,hcp:7},
    {h:7,par:3,yds:160,hcp:15},{h:8,par:4,yds:375,hcp:13},{h:9,par:4,yds:372,hcp:5},
    {h:10,par:4,yds:382,hcp:8},{h:11,par:4,yds:378,hcp:10},{h:12,par:4,yds:372,hcp:12},
    {h:13,par:3,yds:158,hcp:18},{h:14,par:5,yds:518,hcp:2},{h:15,par:3,yds:155,hcp:16},
    {h:16,par:5,yds:512,hcp:4},{h:17,par:4,yds:375,hcp:6},{h:18,par:4,yds:372,hcp:14},
  ]},
  "Lancaster Golf Club":       {par:72,yardage:6538,rating:71.5,slope:126,holes:[
    {h:1,par:4,yds:388,hcp:9},{h:2,par:5,yds:520,hcp:3},{h:3,par:4,yds:382,hcp:11},
    {h:4,par:3,yds:165,hcp:17},{h:5,par:5,yds:515,hcp:1},{h:6,par:4,yds:378,hcp:7},
    {h:7,par:3,yds:160,hcp:15},{h:8,par:4,yds:375,hcp:13},{h:9,par:4,yds:372,hcp:5},
    {h:10,par:4,yds:382,hcp:8},{h:11,par:4,yds:378,hcp:10},{h:12,par:4,yds:372,hcp:12},
    {h:13,par:3,yds:158,hcp:18},{h:14,par:5,yds:518,hcp:2},{h:15,par:3,yds:155,hcp:16},
    {h:16,par:5,yds:512,hcp:4},{h:17,par:4,yds:375,hcp:6},{h:18,par:4,yds:372,hcp:14},
  ]},
  "The Lakes Golf & CC":       {par:72,yardage:7140,rating:74.8,slope:139,private:true,holes:[]},
};

const COURSE_COORDS = {
  "Delaware Golf Club":        {lat:40.2987,lng:-83.0680},
  "Springfield Country Club":  {lat:39.9245,lng:-83.8088},
  "NCR South":                 {lat:39.7234,lng:-84.2437},
  "The Virtues Golf Club":     {lat:39.9612,lng:-82.7048},
  "Cumberland Trail Golf Club":{lat:39.8534,lng:-82.3845},
  "Urbana Country Club":       {lat:40.1081,lng:-83.7527},
  "Denison Golf Course":       {lat:40.0693,lng:-82.5366},
  "Darby Creek Golf Course":   {lat:39.9851,lng:-83.2198},
  "Miami Valley GC":           {lat:39.7674,lng:-84.1896},
  "Rattlesnake Ridge GC":      {lat:39.8801,lng:-82.9123},
  "New Albany Country Club":   {lat:40.0822,lng:-82.7901},
  "Apple Valley Golf Course":  {lat:40.4156,lng:-82.3523},
  "Majestic Springs GC":       {lat:40.2198,lng:-83.1543},
  "Lancaster Country Club":    {lat:39.7198,lng:-82.5993},
  "Lancaster Golf Club":       {lat:39.7154,lng:-82.5887},
  "The Lakes Golf & CC":       {lat:40.0751,lng:-82.8459},
};
