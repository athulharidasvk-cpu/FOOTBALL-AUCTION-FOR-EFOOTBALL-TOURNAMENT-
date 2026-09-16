const fs = require('fs');
const path = require('path');

const SAVE = path.join(__dirname, 'football_world_saves.json');
const worldRooms = new Map();
const soloWorlds = new Map();

const COUNTRIES = [
  ['England','Premier League'],['Spain','La Liga'],['Italy','Serie A'],['Germany','Bundesliga'],
  ['France','Ligue 1'],['Portugal','Liga Portugal'],['Netherlands','Eredivisie'],['Belgium','Belgian Pro League'],
  ['Scotland','Scottish Premiership'],['Turkey','Super Lig'],['Brazil','Serie A'],['Argentina','Liga Profesional'],
  ['USA','MLS'],['Mexico','Liga MX'],['Japan','J1 League'],['South Korea','K League 1'],
  ['India','ISL'],['Australia','A-League'],['Saudi Arabia','Saudi Pro League'],['UAE','UAE Pro League']
];
const STYLES = [
  {name:'Possession', formations:['4-3-3','4-2-3-1'], needs:['CMF','AMF','FB'], traits:['technical','passing']},
  {name:'High Press', formations:['4-3-3','4-2-3-1'], needs:['CF','WF','CMF'], traits:['pace','stamina']},
  {name:'Counter Attack', formations:['4-2-3-1','4-4-2'], needs:['CF','WF','DMF'], traits:['pace','finishing']},
  {name:'Direct Football', formations:['4-4-2','3-5-2'], needs:['CF','CB','DMF'], traits:['strength','aerial']},
  {name:'Defensive Block', formations:['5-3-2','4-5-1'], needs:['CB','DMF','GK'], traits:['defending','strength']}
];
const MENTALITIES = ['Money-Minded','Loyal','Competitive','European Ambition','Star','Playing-Time Focused','Home-Oriented','Career-Minded','Team-Oriented'];
const MANAGERS = [
  ['Marco Silva','Possession',87,8],['Daniel Costa','High Press',90,10],['Jonas Weber','Counter Attack',85,7],['Rafael Torres','Direct Football',82,6],
  ['Arjun Menon','Possession',80,5],['Liam Carter','Defensive Block',88,9],['Kenji Mori','High Press',84,6],['Victor Almeida','Counter Attack',91,11],
  ['Noah Fischer','Possession',83,7],['Samuel Okoro','Direct Football',86,8],['Milan Petrovic','Defensive Block',84,7],['Ethan Brooks','High Press',79,5]
];

function slug(s){return String(s||'').toLowerCase().trim();}
function id(prefix='id'){return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}`;}
function money(n){return Math.max(0, Math.round(Number(n)||0));}
function styleFor(i){return STYLES[i % STYLES.length];}
function managerCatalog(){return MANAGERS.map((m,i)=>({id:`mgr_${i+1}`,name:m[0],style:m[1],rating:m[2],salary:m[3],reputation:m[2],contractYears:3,available:true}));}

function makeClubs(){
  const clubs=[];
  COUNTRIES.forEach(([country,league])=>{
    for(let div=1;div<=4;div++){
      for(let i=1;i<=6;i++){
        const n=`${country} ${div===1?'United':`Division ${div} ${i}`}`;
        const rep=Math.max(35,88-(div-1)*12-i);
        clubs.push({name:n,country,league,division:div,reputation:rep,fans:Math.round(12000+rep*1800/div),morale:72,stadium:{capacity:20000-(div-1)*3000,condition:100,facilities:1},ticketPrice:Math.round(300+rep*7),merchandise:55,jersey:{quality:65,home:'#10243b',away:'#e8edf4',third:'#253d59'},sponsor:null,manager:null,cash:25+rep/3,players:[],history:{titles:0,cups:0,promotions:0,relegations:0},stats:{wins:0,draws:0,losses:0,points:0},online:false});
      }
    }
  });
  return clubs;
}
function makePlayer(i){
  const positions=['GK','CB','RB','LB','DMF','CMF','AMF','RWF','LWF','CF'];
  const rating=68+(i%27);
  return {id:`p_${i}`,name:`World Player ${i}`,position:positions[i%positions.length],rating,form:60+(i%35),age:18+(i%17),askingPrice:Math.max(2,Math.round((rating-60)*0.9)),ownerClub:null,loanClub:null,contract:{years:3,salary:2+(i%8),releaseClause:Math.max(10,Math.round((rating-60)*1.8))},mentality:MENTALITIES[i%MENTALITIES.length],mentalityStrength:65+(i%31),playingTime:70,personality:STYLES[i%STYLES.length].name};
}
function makeMarket(){return Array.from({length:240},(_,i)=>makePlayer(i+1));}
function makeState(mode,code){
  const clubs=makeClubs(); const market=makeMarket();
  // populate AI clubs with a small roster
  clubs.forEach((c,ci)=>{for(let j=0;j<11;j++){const p=market[(ci*11+j)%market.length];p.ownerClub=c.name;c.players.push(p.id);}});
  return {mode,roomCode:code||null,season:1,transferWindowOpen:true,transferWindow:'summer',countries:COUNTRIES.map(x=>({country:x[0],leagues:[x[1]]})),clubs,market,managers:managerCatalog(),selectedClub:null,news:[],competitions:{worldChampionsEvery:2,lastTournament:0},pendingBattles:{},matchIds:{},serverClock:Date.now()};
}
function club(state,name){return state.clubs.find(c=>c.name===name);}
function player(state,idOrName){return state.market.find(p=>p.id===idOrName||slug(p.name)===slug(idOrName));}
function clubPlayers(state,c){return (c?.players||[]).map(x=>player(state,x)).filter(Boolean);}
function addNews(state,text,type='world'){state.news.unshift({id:id('news'),season:state.season,type,text,at:new Date().toISOString()});state.news=state.news.slice(0,100);}
function persist(){try{const data={rooms:[...worldRooms.entries()].map(([k,v])=>[k,v]),solo:[...soloWorlds.entries()].map(([k,v])=>[k,v])};fs.writeFileSync(SAVE,JSON.stringify(data));}catch(e){console.error('[WorldEngine]',e.message)}}
function createRoom(name,maxHumans,host){let code='';do{code=Math.random().toString(36).slice(2,8).toUpperCase()}while(worldRooms.has(code));const s=makeState('online',code);s.roomName=name||'Friends Football League';s.maxHumans=Math.min(20,Math.max(2,Number(maxHumans)||10));s.humans={};s.host=host||null;worldRooms.set(code,s);persist();return s;}
function createSolo(){const sid=id('solo');const s=makeState('solo',null);s.soloId=sid;soloWorlds.set(sid,s);persist();return s;}
function getWorld(ref){if(ref?.room&&worldRooms.has(ref.room))return worldRooms.get(ref.room);if(ref?.soloId&&soloWorlds.has(ref.soloId))return soloWorlds.get(ref.soloId);return null;}
function joinRoom(s,managerName){if(!s||Object.keys(s.humans).length>=s.maxHumans)return {error:'Room is full.'};const mid=id('mgruser');s.humans[mid]={id:mid,name:managerName||'Manager',club:null,online:true};if(!s.host)s.host=mid;persist();return {id:mid,state:s};}
function leaveRoom(s,mid){if(s?.humans?.[mid])s.humans[mid].online=false;persist();}
function createClub(s,data,managerId){if(!data?.name)return {error:'Club name required.'};if(club(s,data.name))return {error:'Club already exists.'};const c={name:String(data.name).slice(0,30),country:data.country||'India',league:data.league||'ISL',division:Number(data.division)||3,reputation:50,fans:5000,morale:75,stadium:{capacity:10000,condition:100,facilities:1},ticketPrice:500,merchandise:60,jersey:{quality:Number(data.quality)||75,home:data.home||'#10243b',away:data.away||'#e8edf4',third:data.third||'#253d59'},sponsor:null,manager:null,cash:50,players:[],history:{titles:0,cups:0,promotions:0,relegations:0},stats:{wins:0,draws:0,losses:0,points:0},online:true};s.clubs.push(c);s.selectedClub=c.name;if(s.mode==='online'&&managerId&&s.humans?.[managerId])s.humans[managerId].club=c.name;addNews(s,`${c.name} has been created in ${c.country}.`,'club');persist();return c;}
function chooseClub(s,name,managerId){const c=club(s,name);if(!c)return {error:'Club not found.'};s.selectedClub=c.name;c.online=true;if(s.mode==='online'&&managerId&&s.humans?.[managerId])s.humans[managerId].club=c.name;return c;}
function managerRecommendations(s,clubName){const c=club(s,clubName);if(!c)return [];const m=c.manager;if(!m)return [];const style=STYLES.find(x=>x.name===m.style)||STYLES[0];const owned=clubPlayers(s,c);return s.market.filter(p=>p.ownerClub!==c.name&&p.loanClub!==c.name).map(p=>{let score=0;if(style.needs.includes(p.position))score+=28;if(style.traits.includes('pace')&&p.rating>=82)score+=10;if(style.traits.includes('technical')&&p.rating>=82)score+=10;if(style.traits.includes('passing')&&['CMF','AMF','DMF'].includes(p.position))score+=8;score+=Math.max(0,p.form-65)*0.35;score+=Math.max(0,p.rating-75)*0.5;return {p,score};}).sort((a,b)=>b.score-a.score).slice(0,10).map(x=>x.p);
}
function hireManager(s,clubName,managerId){const c=club(s,clubName);const m=s.managers.find(x=>x.id===managerId);if(!c||!m)return {error:'Manager or club not found.'};if(c.cash<m.salary)return {error:`Need ₹${m.salary}M for manager salary.`};c.cash-=m.salary;c.manager={...m,contractEnd:s.season+m.contractYears-1};s.managers=s.managers.map(x=>x.id===m.id?{...x,available:false}:x);addNews(s,`${c.name} hired ${m.name}, a ${m.style} specialist.`,'manager');return {manager:c.manager,recommendations:managerRecommendations(s,c.name)};}
function interest(c,p,offer){let x=50;x+=(offer.salary||0)*1.2;x+=(offer.contractYears||3)*2;x+=c.reputation*0.25;if(c.division===1)x+=10;if(c.manager&&c.manager.style===p.personality)x+=8;if(p.mentality==='Money-Minded')x+=(offer.salary||0)*2;if(p.mentality==='Loyal'&&p.ownerClub)x+=p.ownerClub===c.name?35:-5;if(p.mentality==='European Ambition'&&c.reputation>80)x+=15;if(p.mentality==='Playing-Time Focused')x+=Math.max(0,100-(c.players.length*2));return Math.max(0,Math.min(100,Math.round(x)));}
function startBattle(s,buyerName,playerId,fee,salary,years,type='buy'){const p=player(s,playerId),buyer=club(s,buyerName);if(!p||!buyer)return {error:'Player or buyer not found.'};if(!s.transferWindowOpen)return {error:'Transfer window is closed.'};if(fee>buyer.cash)return {error:'Insufficient club funds.'};const battle={id:id('battle'),playerId:p.id,player:p.name,originalOwner:p.ownerClub,buyer:buyerName,offers:[{club:buyerName,fee,salary,years,interest:interest(buyer,p,{salary,contractYears:years})}],deadline:Date.now()+180000,status:'open',type};s.pendingBattles[battle.id]=battle;addNews(s,`${buyerName} opened negotiations for ${p.name}. Other clubs may intervene.`,'transfer');return battle;}
function intervene(s,battleId,clubName,fee,salary,years){const b=s.pendingBattles[battleId],c=club(s,clubName),p=b&&player(s,b.playerId);if(!b||b.status!=='open'||!c||!p)return {error:'Negotiation unavailable.'};if(fee>c.cash)return {error:'Insufficient funds.'};b.offers.push({club:clubName,fee,salary,years,interest:interest(c,p,{salary,contractYears:years}),at:Date.now()});addNews(s,`${clubName} has entered the race for ${p.name}.`,'transfer');return b;}
function completeBattle(s,battleId,chosenClub){const b=s.pendingBattles[battleId];if(!b||b.status!=='open')return {error:'Battle is closed.'};const p=player(s,b.playerId),old=club(s,p.ownerClub),buyer=club(s,chosenClub);if(!buyer)return {error:'Club not found.'};const offer=b.offers.find(o=>o.club===chosenClub);if(!offer)return {error:'Offer not found.'};const score=interest(buyer,p,offer);if(score<45)return {error:'Player rejected this move.'};if(offer.fee>buyer.cash)return {error:'Buyer can no longer afford the offer.'};if(old)old.players=old.players.filter(x=>x!==p.id);buyer.players.push(p.id);buyer.cash-=offer.fee;if(old)old.cash+=offer.fee;p.ownerClub=buyer.name;p.loanClub=null;p.contract={years:offer.years,salary:offer.salary,releaseClause:Math.max(offer.fee*1.6,offer.fee+10)};b.status='complete';addNews(s,`${p.name} joined ${buyer.name} for ₹${offer.fee}M.`,'transfer');return {player:p,battle:b};}
function loan(s,buyerName,playerId,months,fee,salaryShare){const p=player(s,playerId),buyer=club(s,buyerName),old=club(s,p?.ownerClub);if(!p||!buyer||!old)return {error:'Player or club not found.'};if(!s.transferWindowOpen)return {error:'Transfer window is closed.'};if(fee>buyer.cash)return {error:'Insufficient funds.'};if(old.name===buyer.name)return {error:'Player already belongs to this club.'};buyer.cash-=fee;old.cash+=fee;p.loanClub=buyer.name;p.loan={from:old.name,to:buyer.name,months:Number(months)||12,fee,salaryShare:Number(salaryShare)||50,endsSeason:s.season+1};addNews(s,`${p.name} joined ${buyer.name} on loan.`,'transfer');return p;}
function releasePlayer(s,clubName,playerId){const c=club(s,clubName),p=player(s,playerId);if(!c||!p||p.ownerClub!==c.name)return {error:'Player not owned by this club.'};c.players=c.players.filter(x=>x!==p.id);p.ownerClub=null;p.loanClub=null;p.askingPrice=Math.max(2,Math.round(p.rating/20));addNews(s,`${p.name} was released by ${c.name} and is now a free agent.`,'transfer');return p;}
function sellPlayer(s,clubName,playerId,asking){const c=club(s,clubName),p=player(s,playerId);if(!c||!p||p.ownerClub!==c.name)return {error:'Player not owned by this club.'};p.askingPrice=Math.max(1,money(asking)||p.askingPrice);return startBattle(s,'FREE_MARKET_BUYER',p.id,p.askingPrice,p.contract.salary,p.contract.years,'sell');}
function match(s,homeName,awayName){const h=club(s,homeName),a=club(s,awayName);if(!h||!a)return {error:'Clubs not found.'};const mid=id('match');if(s.matchIds[mid])return s.matchIds[mid];const hr=45+(h.reputation/15)+(h.morale/25)+(h.players.length/3);const ar=45+(a.reputation/15)+(a.morale/25)+(a.players.length/3);const hg=Math.max(0,Math.min(6,Math.floor(Math.random()*3+(hr>ar?1:0))));const ag=Math.max(0,Math.min(6,Math.floor(Math.random()*3+(ar>hr?1:0))));h.stats.wins+=hg>ag?1:0;h.stats.draws+=hg===ag?1:0;h.stats.losses+=hg<ag?1:0;a.stats.wins+=ag>hg?1:0;a.stats.draws+=hg===ag?1:0;a.stats.losses+=ag<hg?1:0;h.stats.points+=hg>ag?3:hg===ag?1:0;a.stats.points+=ag>hg?3:ag===hg?1:0;const attendance=Math.min(h.stadium.capacity,Math.round(h.stadium.capacity*(0.45+h.reputation/220+h.fans/300000)));const revenue=Math.round(attendance*h.ticketPrice/1000000*10)/10;h.cash+=revenue;h.lastAttendance=attendance;h.lastRevenue=revenue;h.morale=Math.max(30,Math.min(100,h.morale+(hg>ag?4:hg===ag?1:-4)));s.matchIds[mid]={id:mid,home:h.name,away:a.name,homeGoals:hg,awayGoals:ag,attendance,revenue,season:s.season};addNews(s,`${h.name} ${hg}-${ag} ${a.name}. Matchday revenue ₹${revenue}M.`,'match');return s.matchIds[mid];}
function simulate(s){const user=club(s,s.selectedClub);if(!user)return {error:'Choose a club first.'};const opponents=s.clubs.filter(c=>c.name!==user.name&&c.division===user.division);const opp=opponents[Math.floor(Math.random()*opponents.length)];if(!opp)return {error:'No opponent available.'};return match(s,user.name,opp.name);}
function advanceSeason(s){s.season++;s.transferWindowOpen=true;s.transferWindow='summer';s.clubs.forEach(c=>{c.stats={wins:0,draws:0,losses:0,points:0};c.fans=Math.max(1000,Math.round(c.fans*(0.97+(c.reputation/500))));c.morale=Math.max(55,Math.min(90,c.morale));c.players.forEach(pid=>{const p=player(s,pid);if(!p)return;p.form=Math.max(45,Math.min(98,p.form+(Math.random()*12-5)));if(p.contract)p.contract.years=Math.max(0,p.contract.years-1);});if(c.sponsor)c.cash+=c.sponsor.value;});s.clubs.forEach(c=>{if(c.manager&&c.manager.contractEnd<s.season)c.manager=null;});if(s.season%2===0){s.competitions.lastTournament=s.season;addNews(s,`World Champions Tournament qualification is now active for the top clubs from participating leagues.`,'competition');}addNews(s,`Season ${s.season} begins. Summer Transfer Window is OPEN.`,'season');persist();return s;}
function updateEconomy(s,clubName,data){const c=club(s,clubName);if(!c)return {error:'Club not found.'};if(data.ticketPrice!==undefined)c.ticketPrice=Math.max(50,money(data.ticketPrice));if(data.capacity){const cap=money(data.capacity);if(cap<c.stadium.capacity)return {error:'Capacity cannot be reduced here.'};const cost=Math.max(1,Math.round((cap-c.stadium.capacity)/5000*4));if(c.cash<cost)return {error:`Need ₹${cost}M for stadium expansion.`};c.cash-=cost;c.stadium.capacity=cap;}if(data.jerseyQuality!==undefined)c.jersey.quality=Math.max(10,Math.min(100,money(data.jerseyQuality)));const star=clubPlayers(s,c).reduce((m,p)=>Math.max(m,p.rating),0);const design=Math.max(0,c.jersey.quality);c.merchandise=Math.round(Math.min(100,design*0.65+star*0.35));const attendanceFactor=Math.max(0.25,1-Math.max(0,c.ticketPrice-500)/5000);c.lastProjectedAttendance=Math.round(Math.min(c.stadium.capacity,c.stadium.capacity*(0.35+c.reputation/200+c.merchandise/500)*attendanceFactor));return c;}
function sponsorshipOffers(s,clubName){const c=club(s,clubName);if(!c)return [];const base=Math.round(2+c.reputation/10+c.fans/100000);return ['Local Sports Brand','National Telecom','Global Sportswear','Energy Partner'].map((name,i)=>({id:`sp_${i}`,name,value:base*(i+1),years:i===3?3:1,objective:i===0?'Finish above current position':i===1?'Reach top 6':i===2?'Qualify for continental competition':'Win a trophy',bonus:base*(i+1)*2}));}
function signSponsor(s,clubName,offerId){const c=club(s,clubName),offers=sponsorshipOffers(s,clubName);const o=offers.find(x=>x.id===offerId);if(!c||!o)return {error:'Sponsor offer not found.'};c.sponsor=o;c.cash+=o.value;addNews(s,`${c.name} signed a ${o.years}-season sponsorship with ${o.name}.`,'finance');return c;}
function globalState(s){return {...s,clubs:s.clubs.map(c=>({...c,players:clubPlayers(s,c)})),recommendations:s.selectedClub?managerRecommendations(s,s.selectedClub):[]};}
function roomsList(){return [...worldRooms.values()].map(s=>({code:s.roomCode,name:s.roomName,count:Object.values(s.humans||{}).filter(x=>x.online).length,max:s.maxHumans,host:s.host}));}
module.exports={worldRooms,soloWorlds,createRoom,createSolo,getWorld,joinRoom,leaveRoom,createClub,chooseClub,hiringManager:hireManager,hireManager,managerRecommendations,startBattle,intervene,completeBattle,loan,releasePlayer,sellPlayer,simulate,advanceSeason,updateEconomy,sponsorshipOffers,signSponsor,globalState,roomsList,persist};
