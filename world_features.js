const fs = require('fs');
const path = require('path');
const Module = require('module');

const ROOT = __dirname;
const PUBLIC = path.join(ROOT, 'public');
const SAVE = path.join(ROOT, 'world_career_progress.json');
const PLAYERS_FILE = path.join(PUBLIC, 'players.js');

const COUNTRIES = [
  ['England','Premier Division','Championship','League One','League Two'],
  ['Spain','La Liga','Segunda Division','Primera RFEF','Segunda RFEF'],
  ['Germany','Bundesliga','2. Bundesliga','3. Liga','Regionalliga'],
  ['Italy','Serie A','Serie B','Serie C','Serie D'],
  ['France','Ligue 1','Ligue 2','National','National 2'],
  ['Portugal','Primeira Liga','Liga 2','Liga 3','Campeonato'],
  ['Netherlands','Eredivisie','Eerste Divisie','Tweede Divisie','Derde Divisie'],
  ['Belgium','Pro League','Challenger Pro','National 1','National 2'],
  ['Türkiye','Super Lig','1. Lig','2. Lig','3. Lig'],
  ['Saudi Arabia','Saudi Pro League','First Division','Second Division','Third Division'],
  ['India','Indian Super League','I-League','I-League 2','Regional League'],
  ['Brazil','Serie A','Serie B','Serie C','Serie D'],
  ['Argentina','Liga Profesional','Primera Nacional','Primera B','Primera C'],
  ['Japan','J1 League','J2 League','J3 League','Regional League'],
  ['South Korea','K League 1','K League 2','K4 League','K5 League'],
  ['USA','MLS','USL Championship','USL League One','USL League Two'],
  ['Mexico','Liga MX','Liga de Expansion','Liga Premier','Liga TDP'],
  ['Australia','A-League','NPL Australia','NPL 2','State League'],
  ['Scotland','Premiership','Championship','League One','League Two'],
  ['Austria','Bundesliga','2. Liga','Regionalliga','Landesliga']
];

const CLUB_NAMES = {
  England:['North London FC','Manchester Blue','Merseyside Red','West London United','Midlands City','Tyne Athletic','South Coast FC','Yorkshire United'],
  Spain:['Madrid CF','Catalunya FC','Sevilla Athletic','Valencia Club','Bilbao United','Vigo FC','Madrid Rovers','Andalucia FC'],
  Germany:['Munich FC','Dortmund United','Leverkusen 04','Berlin Athletic','Frankfurt FC','Leipzig City','Hamburg SV','Stuttgart 1893'],
  Italy:['Turin FC','Milano Rosso','Milano Nero','Roma Capital','Napoli Blue','Florence FC','Bologna Athletic','Bergamo United'],
  France:['Paris FC','Marseille Athletic','Lyon United','Monaco City','Lille OSC','Nice FC','Rennes FC','Lens Athletic'],
  Portugal:['Lisbon Eagles','Porto Athletic','Braga FC','Guimaraes United','Coimbra FC','Faro City','Madeira FC','Setubal United'],
  Netherlands:['Amsterdam FC','Rotterdam Athletic','Eindhoven United','Utrecht City','Arnhem FC','Groningen FC','Alkmaar Athletic','Twente United'],
  Belgium:['Brussels FC','Antwerp United','Bruges Athletic','Liege FC','Ghent City','Genk United','Charleroi FC','Leuven Athletic'],
  Türkiye:['Istanbul Red','Istanbul Blue','Ankara FC','Izmir Athletic','Trabzon United','Bursa City','Adana FC','Antalya United'],
  'Saudi Arabia':['Riyadh FC','Jeddah United','Dammam Athletic','Mecca City','Medina FC','Al Khobar United','Abha FC','Taif Athletic'],
  India:['Mumbai City','Kolkata United','Kerala Athletic','Goa FC','Bengaluru United','Chennai FC','Delhi Athletic','Hyderabad City'],
  Brazil:['Rio FC','Sao Paulo Athletic','Flamengo City','Minas United','Bahia FC','Gremio Athletic','Parana FC','Pernambuco United'],
  Argentina:['Buenos Aires FC','Cordoba Athletic','Rosario United','Avellaneda City','Mendoza FC','La Plata Athletic','Tucuman United','Santa Fe FC'],
  Japan:['Tokyo FC','Osaka Athletic','Yokohama United','Kobe City','Nagoya FC','Saitama Athletic','Kyoto United','Hiroshima FC'],
  'South Korea':['Seoul FC','Busan United','Incheon Athletic','Daegu City','Jeonbuk FC','Ulsan United','Daejeon Athletic','Suwon FC'],
  USA:['New York City FC','Los Angeles Athletic','Miami United','Seattle FC','Texas City','Boston Athletic','Chicago United','Atlanta FC'],
  Mexico:['Mexico City FC','Monterrey United','Guadalajara Athletic','Puebla FC','Tijuana City','Toluca United','Leon FC','Veracruz Athletic'],
  Australia:['Sydney FC','Melbourne United','Brisbane Athletic','Perth City','Adelaide FC','Newcastle United','Canberra Athletic','Wellington FC'],
  Scotland:['Glasgow FC','Edinburgh United','Aberdeen Athletic','Dundee City','Hearts United','Hibernian FC','Fife Athletic','Highland FC'],
  Austria:['Vienna FC','Salzburg United','Graz Athletic','Linz City','Innsbruck FC','Klagenfurt United','Altach Athletic','Wolfsberg FC']
};

const MENTALITIES = ['Money-Minded','Loyal','Competitive','European Ambition','Star','Playing-Time Focused','Home-Oriented','Career-Minded','Team-Oriented'];
const WORLD_COMPETITIONS = [
  {name:'World Champions Tournament', cadence:2, level:'Elite', entrants:'Top 4 from each qualifying major league'},
  {name:'World Elite Cup', cadence:1, level:'Elite/Pro', entrants:'Top clubs outside Champions field'},
  {name:'World Challengers Cup', cadence:1, level:'Development', entrants:'Lower-division and emerging clubs'},
  {name:'Regional Promotion Cup', cadence:1, level:'Regional', entrants:'Lower-tier qualification winners'}
];

function clamp(n,a,b){return Math.max(a,Math.min(b,n));}
function hash(s){let h=0; for(const c of String(s)) h=(h*31+c.charCodeAt(0))|0; return Math.abs(h);}
function loadPlayers(){
  try { delete require.cache[require.resolve(PLAYERS_FILE)]; const p=require(PLAYERS_FILE); return Array.isArray(p)?p:[]; } catch(e){ return []; }
}
function pickMentality(seed){ return MENTALITIES[hash(seed)%MENTALITIES.length]; }
function clubSeed(country,div,i){ return `${country}-${div}-${i}`; }
function makeClub(country,div,i,name){
  const seed=clubSeed(country,div,i), rep=clamp(88-div*13+(hash(seed)%12)-6,38,96);
  return {id:seed,name,country,division:div,reputation:rep,fans:Math.round(12000+rep*2400+(hash(seed+'f')%9000)),fanSatisfaction:clamp(62+(hash(seed+'s')%30),35,98),morale:clamp(60+(hash(seed+'m')%34),40,96),cash:Math.round(25+rep*1.4+(hash(seed+'c')%30)),sponsor:Math.round(4+rep/12),stadiumLevel:1+Math.floor(rep/25),titles:0,promotions:0,relegations:0,history:[]};
}
function buildClubs(){
  const clubs=[];
  for(const [country,...divisions] of COUNTRIES){
    const names=CLUB_NAMES[country]||[];
    divisions.forEach((leagueName,di)=>{
      for(let i=0;i<8;i++) clubs.push(makeClub(country,di+1,i,names[i] ? (di?`${names[i]} ${di+1}`:names[i]):`${country} Club ${i+1} D${di+1}`));
    });
  }
  return clubs;
}

let state={version:1,season:1,careerMode:'solo',selectedCountry:'India',selectedLeague:'Indian Super League',selectedDivision:1,selectedClub:null,clubs:buildClubs(),news:[],market:[],offers:[],worldTournament:null};

function seedMarket(){
  const ps=loadPlayers();
  const selected=[]; const seen=new Set();
  for(const p of ps){
    const n=String(p.name||'').trim(); if(!n||seen.has(n.toLowerCase())) continue;
    seen.add(n.toLowerCase());
    const rating=Number(p.rating||p.overall||p.ovr||80); if(rating<72) continue;
    const club=String(p.club||p.team||'Free Agent');
    const price=Math.max(3,Math.round((Number(p.base)||rating/12)*1.2));
    selected.push({...p,name:n,rating,marketValue:price,askingPrice:price,mentality:pickMentality(n),mentalityStrength:72+(hash(n)%25),contractYears:1+(hash(n+'y')%4),salary:Math.max(1,Math.round(price*.12)),releaseClause:Math.max(price,Math.round(price*1.67)),ownerClub:club,form:clamp(65+(hash(n+'form')%35),50,99),status:'available',interest:{}});
    if(selected.length>=80) break;
  }
  state.market=selected;
}

function findClub(name){return state.clubs.find(c=>c.name===name)||null;}
function clubScoreForPlayer(club,p){
  if(!club) return 0;
  let s=club.reputation*.45 + club.fanSatisfaction*.08 + club.morale*.08 + (club.division===1?12:club.division===2?6:0);
  const europe=club.reputation>=80?18:club.reputation>=65?8:0;
  if(p.mentality==='Money-Minded') s+=Math.min(18,club.cash/15);
  if(p.mentality==='Loyal') s+=p.ownerClub===club.name?24:0;
  if(p.mentality==='Competitive') s+=club.reputation*.15;
  if(p.mentality==='European Ambition') s+=europe;
  if(p.mentality==='Playing-Time Focused') s+=(club.division===1?-4:10);
  if(p.mentality==='Star') s+=club.reputation*.1;
  if(p.mentality==='Career-Minded') s+=europe+club.reputation*.1;
  return Math.round(clamp(s,0,99));
}
function interestMap(p){
  const top=state.clubs.map(c=>({club:c.name,score:clubScoreForPlayer(c,p)})).sort((a,b)=>b.score-a.score).slice(0,8);
  const map={}; top.forEach(x=>map[x.club]=x.score); return map;
}
function refreshInterests(){state.market.forEach(p=>p.interest=interestMap(p));}
function pushNews(text,type='Transfer News'){state.news.unshift({id:Date.now()+Math.random(),season:state.season,type,text}); state.news=state.news.slice(0,30);}
function save(){try{fs.writeFileSync(SAVE,JSON.stringify(state,null,2));}catch(e){}}
function load(){try{if(fs.existsSync(SAVE)){const d=JSON.parse(fs.readFileSync(SAVE,'utf8')); if(d&&d.clubs&&d.market){state={...state,...d}; return;}}}catch(e){} seedMarket(); refreshInterests(); pushNews('The global football world is ready for a new season.','World'); save();}
function ensureState(){if(!state.market.length)seedMarket(); refreshInterests();}

function clubForSelection(){
  if(state.selectedClub) return findClub(state.selectedClub);
  return state.clubs.find(c=>c.country===state.selectedCountry&&c.division===state.selectedDivision)||null;
}
function chooseCareer({country,league,division,club,mode}){
  const c=state.clubs.find(x=>x.name===club) || state.clubs.find(x=>x.country===country&&x.division===Number(division));
  if(country)state.selectedCountry=country;
  if(league)state.selectedLeague=league;
  if(division)state.selectedDivision=Number(division);
  if(c)state.selectedClub=c.name;
  if(mode)state.careerMode=mode;
  if(c) pushNews(`${c.name} begins Season ${state.season} in ${c.country}'s ${state.selectedLeague}.`,'Career');
  save(); return c;
}

function makeTournament(){
  if(state.season%2!==0) return null;
  const major=state.clubs.filter(c=>c.division===1&&c.reputation>=65);
  const entrants=[];
  const byCountry={}; major.forEach(c=>(byCountry[c.country]??=[]).push(c));
  for(const country of Object.keys(byCountry)) entrants.push(...byCountry[country].sort((a,b)=>b.reputation-a.reputation).slice(0,4));
  const groups=[]; for(let i=0;i<entrants.length;i+=5) groups.push(entrants.slice(i,i+5));
  return {name:'World Champions Tournament',season:state.season,entrants:entrants.map(c=>c.name),groups:groups.map((g,i)=>({name:`Group ${String.fromCharCode(65+i)}`,clubs:g.map(c=>c.name)})),roundOf16:entrants.slice(0,16).map(c=>c.name),status:'Scheduled'};
}
function advanceSeason(){
  state.season++;
  state.clubs.forEach(c=>{
    const swing=(hash(c.name+state.season)%9)-4;
    c.morale=clamp(c.morale+swing,35,99); c.fanSatisfaction=clamp(c.fanSatisfaction+(c.morale>75?2:-2),25,99);
    c.cash=Math.max(0,Math.round(c.cash+c.sponsor+c.fans/25000-(c.reputation>80?6:3)));
    if(c.division>1 && hash(c.name+state.season)%100<10){c.division--;c.promotions++;c.reputation=clamp(c.reputation+3,1,99);pushNews(`${c.name} won promotion after a strong campaign.`,'League');}
    else if(c.division<4 && hash(c.name+'r'+state.season)%100<8){c.division++;c.relegations++;c.reputation=clamp(c.reputation-3,1,99);pushNews(`${c.name} was relegated and will rebuild next season.`,'League');}
    c.history.unshift({season:state.season,result:c.division===1?'Top-flight campaign':'Division '+c.division,rep:c.reputation}); c.history=c.history.slice(0,8);
  });
  state.market.forEach(p=>{p.form=clamp(p.form+(hash(p.name+state.season)%13)-6,45,99); if(p.contractYears>0)p.contractYears--; if(p.contractYears===0)p.status='free-agent';});
  state.worldTournament=makeTournament(); if(state.worldTournament)pushNews('The World Champions Tournament has opened for this two-season cycle.','Global Competition');
  pushNews(`Season ${state.season} is underway across ${COUNTRIES.length} countries.`,'World'); refreshInterests(); save();
}
function makeOffer(from,to,playerName,fee,salary,years){
  const p=state.market.find(x=>x.name===playerName); if(!p)return {error:'Player not found'};
  const buyer=findClub(from), seller=findClub(to)||findClub(p.ownerClub); if(!buyer)return {error:'Buyer club not found'};
  fee=Number(fee)||p.askingPrice; salary=Number(salary)||p.salary; years=Number(years)||3;
  const interest=(p.interest[from]||clubScoreForPlayer(buyer,p));
  const deadline=Date.now()+3*60*1000;
  const offer={id:'OFF-'+Date.now()+Math.random().toString(36).slice(2,7),from,to: seller?seller.name:to,player:playerName,fee,salary,years,interest,deadline,status:'pending'};
  state.offers.push(offer); pushNews(`${from} submitted an offer for ${playerName}: ₹${fee}M + ₹${salary}M/year.`,'Transfer Battle'); save(); return offer;
}
function decideOffer(id,decision,counter){
  const o=state.offers.find(x=>x.id===id); if(!o)return {error:'Offer not found'}; if(o.status!=='pending')return o;
  const p=state.market.find(x=>x.name===o.player); if(!p)return {error:'Player not found'};
  if(decision==='counter'){o.status='counter';o.fee=Number(counter?.fee)||o.fee;o.salary=Number(counter?.salary)||o.salary;save();return o;}
  if(decision==='reject'){o.status='rejected';save();return o;}
  const seller=findClub(o.to), buyer=findClub(o.from); if(!buyer)return {error:'Buyer missing'};
  const canBuy=o.fee<=buyer.cash+50; const willingness=clamp((o.interest||0)+o.salary*.7,0,130);
  if(!canBuy || willingness<55){o.status='rejected-player';pushNews(`${p.name} rejected the move to ${o.from} after negotiations.`,'Transfer Battle');save();return o;}
  if(seller)seller.cash+=o.fee;
  buyer.cash=Math.max(0,buyer.cash-o.fee); p.ownerClub=buyer.name;p.salary=o.salary;p.contractYears=o.years;p.releaseClause=Math.round(o.fee*1.67);p.status='contracted';o.status='accepted';
  state.offers.filter(x=>x.player===p.name&&x.status==='pending'&&x.id!==o.id).forEach(x=>x.status='hijacked');
  pushNews(`${p.name} completed a transfer to ${buyer.name} after a live negotiation battle.`,'Transfer Complete'); save(); return o;
}
function hijack(from,playerName,fee,salary,years){
  const p=state.market.find(x=>x.name===playerName); if(!p)return {error:'Player not found'};
  const target=state.offers.find(o=>o.player===playerName&&o.status==='pending');
  const to=target?target.to:p.ownerClub; const offer=makeOffer(from,to,playerName,fee,salary,years); if(offer.error)return offer;
  pushNews(`${from} hijacked negotiations for ${playerName} with an improved package.`,'Hijack Alert'); return offer;
}

load();

function apiSnapshot(){ensureState(); const selected=clubForSelection(); return {season:state.season,careerMode:state.careerMode,selectedCountry:state.selectedCountry,selectedLeague:state.selectedLeague,selectedDivision:state.selectedDivision,selectedClub:state.selectedClub,selectedClubData:selected,countries:COUNTRIES.map(([country,...leagues])=>({country,leagues})),clubs:state.clubs,competitions:WORLD_COMPETITIONS,worldTournament:state.worldTournament,market:state.market.map(p=>({...p})),offers:state.offers.map(o=>({...o})),news:state.news};}

function installExpress(app){
  if(app.__worldFeaturesInstalled)return; app.__worldFeaturesInstalled=true;
  app.use((req,res,next)=>{
    if((req.path==='/'||req.path==='/index.html') && req.method==='GET'){
      try{let html=fs.readFileSync(path.join(PUBLIC,'index.html'),'utf8'); const tag='<link rel="stylesheet" href="/world_features.css"><script src="/world_features_client.js"></script>'; if(!html.includes('/world_features_client.js')) html=html.replace('</head>',tag+'</head>'); return res.type('html').send(html);}catch(e){}
    }
    next();
  });
  app.get('/api/world/state',(req,res)=>res.json(apiSnapshot()));
  app.get('/api/world/leagues',(req,res)=>res.json({countries:COUNTRIES.map(([country,...leagues])=>({country,leagues}))}));
  app.get('/api/world/clubs',(req,res)=>res.json(state.clubs));
  app.get('/api/world/market',(req,res)=>{ensureState();res.json(state.market);});
  app.post('/api/world/career',(req,res)=>res.json({club:chooseCareer(req.body||{}),state:apiSnapshot()}));
  app.post('/api/world/offer',(req,res)=>res.json(makeOffer(req.body?.from,req.body?.to,req.body?.player,req.body?.fee,req.body?.salary,req.body?.years)));
  app.post('/api/world/hijack',(req,res)=>res.json(hijack(req.body?.from,req.body?.player,req.body?.fee,req.body?.salary,req.body?.years)));
  app.post('/api/world/offer/:id',(req,res)=>res.json(decideOffer(req.params.id,req.body?.decision,req.body)));
  app.post('/api/world/advance-season',(req,res)=>{advanceSeason();res.json(apiSnapshot());});
  app.post('/api/world/club/update',(req,res)=>{const c=findClub(req.body?.club);if(!c)return res.status(404).json({error:'Club not found'}); if(req.body.fans!=null)c.fans=clamp(Number(req.body.fans),0,999999999);if(req.body.morale!=null)c.morale=clamp(Number(req.body.morale),0,100);if(req.body.fanSatisfaction!=null)c.fanSatisfaction=clamp(Number(req.body.fanSatisfaction),0,100);if(req.body.reputation!=null)c.reputation=clamp(Number(req.body.reputation),1,100);save();res.json(c);});
}

function installSocket(io){
  if(io.__worldFeaturesInstalled)return; io.__worldFeaturesInstalled=true;
  io.on('connection',socket=>{
    socket.emit('worldState',apiSnapshot());
    socket.on('world:career',data=>{const c=chooseCareer(data||{});io.emit('worldState',apiSnapshot()); if(c)io.emit('worldNews',state.news[0]);});
    socket.on('world:offer',data=>{const o=makeOffer(data?.from,data?.to,data?.player,data?.fee,data?.salary,data?.years);io.emit('transferBattle',o);io.emit('worldState',apiSnapshot());});
    socket.on('world:hijack',data=>{const o=hijack(data?.from,data?.player,data?.fee,data?.salary,data?.years);io.emit('transferBattle',o);io.emit('worldState',apiSnapshot());});
    socket.on('world:offerDecision',data=>{const o=decideOffer(data?.id,data?.decision,data);io.emit('worldState',apiSnapshot()); if(o&&o.status==='accepted')io.emit('transferComplete',o);});
    socket.on('world:advanceSeason',()=>{advanceSeason();io.emit('worldState',apiSnapshot());});
  });
}

const originalLoad=Module._load;
Module._load=function(request,parent,isMain){
  if(request==='express'){
    const original=originalLoad.apply(this,arguments);
    if(original.__worldWrapped)return original;
    function wrappedExpress(...args){const app=original(...args);installExpress(app);return app;}
    Object.assign(wrappedExpress,original); wrappedExpress.__worldWrapped=true; return wrappedExpress;
  }
  if(request==='socket.io'){
    const original=originalLoad.apply(this,arguments); if(original.__worldWrapped)return original;
    const OriginalServer=original.Server;
    class WorldServer extends OriginalServer{constructor(...args){super(...args);installSocket(this);}}
    return {...original,Server:WorldServer,__worldWrapped:true};
  }
  return originalLoad.apply(this,arguments);
};
