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
  {name:'High Press', formations:['4-3-3','3-4-3'], needs:['CF','WF','CMF'], traits:['pace','stamina']},
  {name:'Counter Attack', formations:['4-2-3-1','4-4-2'], needs:['CF','WF','DMF'], traits:['pace','finishing']},
  {name:'Direct Football', formations:['4-4-2','3-5-2'], needs:['CF','CB','DMF'], traits:['strength','aerial']},
  {name:'Defensive Block', formations:['5-3-2','4-5-1'], needs:['CB','DMF','GK'], traits:['defending','strength']}
];
const MENTALITIES = ['Money-Minded','Loyal','Competitive','European Ambition','Star','Playing-Time Focused','Home-Oriented','Career-Minded','Team-Oriented'];
const MANAGERS = [
  // === TIER 1: REAL-WORLD ELITE (DIV 1) ===
  ['Pep Guardiola', 'Possession', 96, 15, 1, 'Tiki-Taka Mastermind', 'Pioneer of fluid positional play, inverted full-backs, and relentless ball retention.', false],
  ['Carlo Ancelotti', 'Direct Football', 95, 14, 1, 'The European Master', 'Master of player psychology, calm authority, and devastating transitional moments.', false],
  ['Jurgen Klopp', 'High Press', 95, 14, 1, 'Heavy Metal Gegenpresser', 'Demands relentless intensity, suffocating high-pressing traps, and volcanic passion.', false],
  ['Zinedine Zidane', 'Possession', 93, 13, 1, 'Galáctico Whisperer', 'Effortless big-game aura, clutch Champions League mastery, and midfield balance.', false],
  ['Xabi Alonso', 'High Press', 92, 12, 1, 'The Invincible Architect', 'Surgical tactical symmetry, high-pressing overload, and wing-back domination.', false],
  ['Hansi Flick', 'High Press', 92, 12, 1, 'Hyper-Direct Pressing General', 'Blistering vertical velocity, suffocating offside lines, and ruthless attacking volume.', false],
  ['Lionel Scaloni', 'High Press', 92, 11, 1, 'World Cup Champion', 'Adaptable tactical pragmatism, defensive solidarity, and player brotherhood.', false],
  ['Mikel Arteta', 'Possession', 91, 11, 1, 'Positional Play Perfectionist', 'Dominant territorial control, suffocating set-piece dominance, and strict discipline.', false],
  ['Simone Inzaghi', 'Counter Attack', 91, 10, 1, '3-5-2 Transition Genius', 'Master of sweeping counter-attacks, fluid center-back overlaps, and cup knockout magic.', false],
  ['Diego Simeone', 'Defensive Block', 90, 11, 1, 'Cholismo High Priest', 'Granite-solid low block, fierce emotional intensity, and blood-and-sweat defending.', false],
  ['Luis Enrique', 'Possession', 90, 10, 1, 'Vertical Possession Maestro', 'Relentless dynamic passing, wide 1v1 wingers, and bold attacking ideology.', false],
  ['Antonio Conte', 'Defensive Block', 90, 11, 1, 'Drill-Sergeant Perfectionist', 'Iron-fisted physical conditioning, robotic automation patterns, and wing-back warfare.', false],
  ['Jose Mourinho', 'Defensive Block', 89, 10, 1, 'The Special One', 'Pragmatic master of mind games, defensive resilience, and ruthless counter-punches.', false],
  ['Ruben Amorim', 'Counter Attack', 89, 9, 1, 'High-Line Counter Specialist', 'Modern 3-4-3 pressing and explosive diagonal transitions.', false],
  ['Julian Nagelsmann', 'High Press', 89, 10, 1, 'Tactical Prodigy', 'Asymmetrical pressing shapes, high tactical versatility, and speed of thought.', false],
  ['Unai Emery', 'Counter Attack', 88, 8, 1, 'European Cup Specialist', 'Meticulous video preparation, compact mid-block traps, and lightning counters.', false],

  // === TIER 2: CONTINENTAL TACTICIANS (DIV 1 - 2) - FICTIONAL & EXPERIENCED ===
  ['Cesare Marchetti', 'Defensive Block', 86, 7, 2, 'The Grand Strategist', 'Veteran Italian tactician revered for unbreakable backlines and stoic defensive structure.', true],
  ['Henrik Lindqvist', 'Possession', 84, 6, 2, 'Nordic Data Architect', 'Analytical Danish coach who pioneered algorithmic positional overloads.', true],
  ['Gonzalo "El Halcón" Romero', 'High Press', 83, 5.5, 2, 'South American Firebrand', 'Roaring touchline intensity, demanding non-stop forward pressing and rapid tackles.', true],
  ['Cedric Beaumont', 'Counter Attack', 82, 5, 2, 'French Transition Artist', 'Turns organized mid-blocks into lightning-fast 3-pass breakaway goals.', true],
  ['Stefan Petrovic', 'Direct Football', 81, 4.5, 2, 'Balkan Strongman', 'Disciplined, physically imposing side dominating second balls and aerial crosses.', true],
  ['Tiago Barreto', 'Possession', 80, 4, 2, 'Iberian Passmaster', 'Smooth technical passing combinations and intelligent positional rotation.', true],

  // === TIER 3: PROMOTION SPECIALISTS (DIV 2 - 3) - FICTIONAL & AFFORDABLE (₹1.9M - ₹2.8M) ===
  ['Babatunde Adeleke', 'High Press', 77, 2.8, 3, 'The Energy Dynamo', 'West African high-workrate tactician whose teams out-run and out-fight all opponents.', true],
  ['Alonso De la Cruz', 'Direct Football', 76, 2.5, 3, 'Aerial Battle Commander', 'Dominates lower-tier scraps through physicality, target-man headers, and set pieces.', true],
  ['Javier Solano', 'Possession', 75, 2.3, 3, 'Technical Futsal Guru', 'Teaches fearless short passing and composed escape routes under heavy lower-league pressure.', true],
  ['Dmitri Voronin', 'Defensive Block', 75, 2.2, 3, 'The Iron Curtain', 'Concedes the fewest goals in the league through disciplined, resolute low-block defending.', true],
  ['Siddharth Rao', 'Possession', 74, 2.0, 3, 'The Modern Visionary', 'Methodical coach renowned for transforming modest squads into attractive passing machines.', true],
  ['Marco Valenti', 'Counter Attack', 73, 1.9, 3, 'The Pragmatic Hunter', 'Master of 1-0 away wins, disciplined defensive shields, and ruthless counter-strikes.', true],

  // === TIER 4: GRASSROOTS & LOWER-LEAGUE GRINDERS (DIV 3 - 4) - FICTIONAL & BUDGET-FRIENDLY (₹0.8M - ₹1.5M) ===
  ['Rajesh "Iron Wall" Nair', 'Defensive Block', 72, 1.5, 4, 'Kerala Wall Organizer', 'Rugged lower-league hero famous for heroic goal-line clearances, warrior spirit, and set-piece headers.', true],
  ['Kenji Takahashi', 'High Press', 71, 1.4, 4, 'Stamina & Discipline Guru', 'Tireless running schedules, synchronised pressing triggers, and relentless work ethic.', true],
  ['Viktor Dahl', 'Defensive Block', 71, 1.3, 4, 'Zonal Fortress Builder', 'Swedish defensive disciplinarian who constructs impenetrable compact banks of four.', true],
  ['Callum MacLeod', 'Direct Football', 70, 1.2, 4, 'Scottish Pitch Battler', 'Loves muddy pitches, fearless slide tackles, and direct route-one deliveries to a target man.', true],
  ['Mateo Morales', 'Possession', 70, 1.2, 4, 'Grassroots Youth Mentor', 'Patient academy coach who rapidly develops young talent and instills confident ball retention.', true],
  ['Lucas "Tiki" Santana', 'Possession', 69, 1.1, 4, 'Favela Maestro', 'Teaches youngsters silky touch and composure even in physical lower-league dogfights.', true],
  ['Kwame Mensah', 'High Press', 69, 1.0, 4, 'High-Octane Fighter', 'Demands relentless work-rate, fierce determination, and lightning wing turnovers.', true],
  ['Liam O\'Connor', 'Direct Football', 68, 0.9, 4, 'Promotion Scrap Veteran', 'No-nonsense gaffer who knows every scrap, trick, and long-throw tactic in the book.', true],
  ['Sunil Mukherjee', 'Counter Attack', 67, 0.8, 4, 'The Giant Slayer', 'Specialist in shocking higher-ranked sides with disciplined compactness and rapid breaks.', true],
  ['Arthur Pendelton', 'Direct Football', 66, 0.8, 4, 'Old-School Gaffer', 'Traditional English gaffer who demands pride, crunching tackles, and 90 minutes of pure grit.', true]
];

const AUTHENTIC_CLUBS = {
  'England': {
    1: ['Manchester City', 'Arsenal', 'Liverpool', 'Chelsea', 'Aston Villa', 'Tottenham Hotspur'],
    2: ['Manchester United', 'Newcastle United', 'West Ham United', 'Brighton & Hove Albion', 'Everton', 'Wolverhampton Wanderers'],
    3: ['Leicester City', 'Leeds United', 'Southampton FC', 'Sunderland AFC', 'Blackburn Rovers', 'Middlesbrough FC'],
    4: ['Derby County', 'Portsmouth FC', 'Sheffield Wednesday', 'Stoke City', 'Coventry City', 'Watford FC']
  },
  'Spain': {
    1: ['Real Madrid', 'FC Barcelona', 'Atletico Madrid', 'Athletic Club', 'Real Sociedad', 'Villarreal CF'],
    2: ['Real Betis', 'Sevilla FC', 'Girona FC', 'Valencia CF', 'RC Celta Vigo', 'CA Osasuna'],
    3: ['RCD Espanyol', 'RCD Mallorca', 'Rayo Vallecano', 'Getafe CF', 'UD Las Palmas', 'Real Valladolid'],
    4: ['Real Zaragoza', 'Sporting Gijon', 'Levante UD', 'Racing Santander', 'Cadiz CF', 'Malaga CF']
  },
  'Germany': {
    1: ['Bayern Munich', 'Bayer Leverkusen', 'Borussia Dortmund', 'RB Leipzig', 'Eintracht Frankfurt', 'VfB Stuttgart'],
    2: ['Borussia Monchengladbach', 'VfL Wolfsburg', 'SC Freiburg', 'TSG Hoffenheim', 'Werder Bremen', '1. FSV Mainz 05'],
    3: ['1. FC Koln', 'Hamburger SV', 'Hertha BSC', 'FC Schalke 04', 'Fortuna Dusseldorf', 'Hannover 96'],
    4: ['1. FC Nurnberg', '1. FC Kaiserslautern', 'Karlsruher SC', 'FC St. Pauli', 'Dynamo Dresden', 'Hansa Rostock']
  },
  'Italy': {
    1: ['Inter Milan', 'AC Milan', 'Juventus', 'SSC Napoli', 'Atalanta BC', 'AS Roma'],
    2: ['SS Lazio', 'ACF Fiorentina', 'Bologna FC', 'Torino FC', 'Genoa CFC', 'AC Monza'],
    3: ['Udinese Calcio', 'Cagliari Calcio', 'Parma Calcio', 'Hellas Verona', 'US Sassuolo', 'Empoli FC'],
    4: ['UC Sampdoria', 'Palermo FC', 'SSC Bari', 'Venezia FC', 'Spezia Calcio', 'US Cremonese']
  },
  'France': {
    1: ['Paris Saint-Germain', 'AS Monaco', 'Olympique Marseille', 'Olympique Lyon', 'LOSC Lille', 'Stade Rennais'],
    2: ['RC Lens', 'OGC Nice', 'Stade Brestois', 'Stade de Reims', 'Montpellier HSC', 'RC Strasbourg'],
    3: ['Toulouse FC', 'FC Nantes', 'AS Saint-Etienne', 'Girondins Bordeaux', 'AJ Auxerre', 'Angers SCO'],
    4: ['FC Lorient', 'FC Metz', 'ES Troyes AC', 'EA Guingamp', 'SC Bastia', 'SM Caen']
  },
  'India': {
    1: ['Kerala Blasters FC', 'Mohun Bagan Super Giant', 'Mumbai City FC', 'Bengaluru FC', 'FC Goa', 'East Bengal FC'],
    2: ['Chennaiyin FC', 'Odisha FC', 'NorthEast United FC', 'Jamshedpur FC', 'Hyderabad FC', 'Punjab FC'],
    3: ['Mohammedan SC', 'Churchill Brothers', 'Gokulam Kerala FC', 'Real Kashmir FC', 'Delhi FC', 'Sreenidi Deccan FC'],
    4: ['Inter Kashi', 'Rajasthan United', 'Aizawl FC', 'Shillong Lajong', 'Dempo SC', 'NEROCA FC']
  },
  'Saudi Arabia': {
    1: ['Al Hilal', 'Al Nassr', 'Al Ittihad', 'Al Ahli', 'Al Shabab', 'Al Ettifaq'],
    2: ['Al Taawoun', 'Al Fateh', 'Al Khaleej', 'Al Fayha', 'Al Wehda', 'Damac FC'],
    3: ['Al Raed', 'Al Riyadh', 'Al Hazem', 'Al Okhdood', 'Al Tai', 'Al Adalah'],
    4: ['Al Batin', 'Al Faisaly', 'Ohod FC', 'Hajer FC', 'Al Qadsiah', 'Al Jabalain']
  },
  'Brazil': {
    1: ['Flamengo', 'Palmeiras', 'Sao Paulo FC', 'Fluminense', 'Atletico Mineiro', 'Botafogo'],
    2: ['Corinthians', 'Gremio', 'Internacional', 'Santos FC', 'Cruzeiro', 'Vasco da Gama'],
    3: ['Bahia', 'Athletico Paranaense', 'Fortaleza EC', 'Red Bull Bragantino', 'Coritiba', 'Goias EC'],
    4: ['Sport Recife', 'Ceara SC', 'EC Vitoria', 'EC Juventude', 'Avai FC', 'Chapecoense']
  },
  'Argentina': {
    1: ['River Plate', 'Boca Juniors', 'Racing Club', 'Independiente', 'San Lorenzo', 'Velez Sarsfield'],
    2: ['Estudiantes LP', 'Newell\'s Old Boys', 'Rosario Central', 'Talleres Cordoba', 'Lanus', 'Argentinos Juniors'],
    3: ['Huracan', 'Gimnasia La Plata', 'Godoy Cruz', 'Belgrano Cordoba', 'Defensa y Justicia', 'Banfield'],
    4: ['Tigre', 'Colon Santa Fe', 'Union de Santa Fe', 'Platense', 'Central Cordoba', 'Sarmiento']
  },
  'Portugal': {
    1: ['SL Benfica', 'FC Porto', 'Sporting CP', 'SC Braga', 'Vitoria Guimaraes', 'FC Famalicao'],
    2: ['Rio Ave FC', 'Boavista FC', 'Gil Vicente FC', 'GD Estoril Praia', 'Moreirense FC', 'SC Farense'],
    3: ['Casa Pia AC', 'FC Arouca', 'CF Estrela da Amadora', 'CD Nacional', 'CD Santa Clara', 'CS Maritimo'],
    4: ['Portimonense SC', 'FC Vizela', 'GD Chaves', 'FC Pacos de Ferreira', 'Leixoes SC', 'CD Feirense']
  },
  'Netherlands': {
    1: ['AFC Ajax', 'PSV Eindhoven', 'Feyenoord Rotterdam', 'AZ Alkmaar', 'FC Twente', 'FC Utrecht'],
    2: ['SC Heerenveen', 'Sparta Rotterdam', 'Go Ahead Eagles', 'NEC Nijmegen', 'Fortuna Sittard', 'PEC Zwolle'],
    3: ['Heracles Almelo', 'Willem II', 'NAC Breda', 'FC Groningen', 'SBV Excelsior', 'RKC Waalwijk'],
    4: ['Vitesse Arnhem', 'FC Emmen', 'De Graafschap', 'ADO Den Haag', 'SC Cambuur', 'Roda JC']
  },
  'USA': {
    1: ['Inter Miami CF', 'LA Galaxy', 'Los Angeles FC', 'New York City FC', 'Atlanta United FC', 'Seattle Sounders FC'],
    2: ['Columbus Crew', 'FC Cincinnati', 'Philadelphia Union', 'Orlando City SC', 'New York Red Bulls', 'Nashville SC'],
    3: ['Portland Timbers', 'Houston Dynamo FC', 'Sporting Kansas City', 'Minnesota United FC', 'Real Salt Lake', 'Vancouver Whitecaps'],
    4: ['Austin FC', 'FC Dallas', 'Chicago Fire FC', 'Charlotte FC', 'San Jose Earthquakes', 'CF Montreal']
  }
};

const FIRST_NAMES = ['Mateo','Gabriel','Lucas','Julian','Alejandro','Marcus','Bruno','Enzo','Rodrigo','Rafael','Kevin','Florian','Martin','Joshua','Benjamin','Declan','Bukayo','Phil','Alexis','Sunil','Sahal','Lallianzuala','Manvir','Ashique','Anirudh','Liston','Subhasish','Gurpreet','Nuno','Goncalo','Joao','Diogo','Santiago','Thiago','Federico','Matias','Nicolas','Viktor','Alexander','Rasmus'];
const LAST_NAMES = ['Silva','Santos','Fernandes','Alvarez','Martinez','Rossi','Schmidt','Mueller','Davies','Walker','Hernandez','Gomez','Diaz','Nunez','Mac Allister','Gakpo','Saka','Foden','Rice','Chhetri','Samad','Chhangte','Thapa','Singh','Colaco','Bose','Sandhu','Mendes','Ramos','Neves','Jota','Gimenez','Valverde','Romero','Isak','Hojlund','Sesko','Odegaard','Saliba','Bastoni'];

let realPlayersRaw = [];
try {
  realPlayersRaw = require('./public/players.js');
} catch (e) {
  try {
    realPlayersRaw = require(path.join(__dirname, 'public', 'players.js'));
  } catch (err) {
    realPlayersRaw = [];
  }
}

function slug(s){return String(s||'').toLowerCase().trim();}
function id(prefix='id'){return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}`;}
function money(n){return Math.max(0, Math.round(Number(n)||0));}
function styleFor(i){return STYLES[i % STYLES.length];}
function managerCatalog(){
  return MANAGERS.map((m,i)=>({
    id:`mgr_${i+1}`,
    name:m[0],
    style:m[1],
    rating:m[2],
    salary:m[3],
    minDivision: m[4] || (m[2] >= 90 ? 1 : m[2] >= 80 ? 2 : m[2] >= 72 ? 3 : 4),
    title: m[5] || (m[2] >= 90 ? 'World-Class Tactician' : m[2] >= 80 ? 'Continental Specialist' : m[2] >= 72 ? 'Promotion Specialist' : 'Grassroots Grinder'),
    bio: m[6] || '',
    isFictional: !!m[7],
    reputation:m[2],
    contractYears:3,
    available:true,
    status:'available',
    preferredFormations: m[1]==='Possession'?['4-3-3','4-2-3-1']:m[1]==='High Press'?['4-3-3','3-4-3']:m[1]==='Counter Attack'?['4-4-2','4-2-3-1']:m[1]==='Direct Football'?['4-4-2','3-5-2']:['5-3-2','4-5-1']
  }));
}

function makeClubs(){
  const clubs=[];
  COUNTRIES.forEach(([country,league])=>{
    const authCountry = AUTHENTIC_CLUBS[country] || {};
    for(let div=1;div<=4;div++){
      const divNames = authCountry[div] || [];
      for(let i=1;i<=6;i++){
        let n = divNames[i-1];
        if(!n) {
          const suffix = div === 1 ? 'City FC' : div === 2 ? 'United' : div === 3 ? 'Rovers' : 'Athletic';
          n = `${country} ${suffix} ${i}`;
        }
        const rep=Math.max(35,88-(div-1)*12-i);
        clubs.push({
          name:n,
          country,
          league,
          division:div,
          reputation:rep,
          fans:Math.round(15000+rep*2200/div),
          morale:75,
          stadium:{capacity:Math.max(12000, 32000-(div-1)*5000-i*400),condition:100,facilities:1},
          ticketPrice:Math.round(350+rep*8),
          merchandise:55,
          jersey:{quality:70,home:i%2===0?'#0b2545':'#b21e27',away:'#f4f7fb',third:'#1b3b22',pattern:'stripes',collar:'#ffffff',shorts:'#0b2545',socks:'#0b2545'},
          sponsor:null,
          manager:null,
          cash:35+rep,
          players:[],
          history:{titles:0,cups:0,promotions:0,relegations:0},
          stats:{wins:0,draws:0,losses:0,points:0},
          online:false
        });
      }
    }
  });
  return clubs;
}

function normalizePosition(pos) {
  const p = String(pos || '').toUpperCase();
  if (['CF', 'ST', 'SS'].includes(p)) return 'CF';
  if (['LW', 'LWF'].includes(p)) return 'LWF';
  if (['RW', 'RWF'].includes(p)) return 'RWF';
  if (['AMF', 'CAM'].includes(p)) return 'AMF';
  if (['CMF', 'CM'].includes(p)) return 'CMF';
  if (['DMF', 'CDM'].includes(p)) return 'DMF';
  if (['CB'].includes(p)) return 'CB';
  if (['LB', 'LWB'].includes(p)) return 'LB';
  if (['RB', 'RWB'].includes(p)) return 'RB';
  if (['GK'].includes(p)) return 'GK';
  return 'CMF';
}

function makePlayer(i, rp = null){
  const positions=['GK','CB','RB','LB','DMF','CMF','AMF','RWF','LWF','CF'];
  let name, position, rating, askingPrice, origClub = null;
  if (rp && rp.name) {
    name = rp.name;
    position = normalizePosition(rp.position);
    rating = Number(rp.rating) || 80;
    askingPrice = Math.max(3, rp.base || Math.round((rating-60)*1.4));
    origClub = rp.club || null;
  } else {
    const fn = FIRST_NAMES[i % FIRST_NAMES.length];
    const ln = LAST_NAMES[(i * 7) % LAST_NAMES.length];
    name = `${fn} ${ln}`;
    position = positions[i % positions.length];
    rating = 68 + (i % 25);
    askingPrice = Math.max(2, Math.round((rating-60)*1.1));
  }
  const salary = Math.max(1, Math.round(askingPrice * 0.16));
  return {
    id: `p_${i}`,
    name,
    position,
    rating,
    form: 65 + (i % 30),
    age: 19 + (i % 16),
    askingPrice,
    ownerClub: null,
    loanClub: null,
    contract: {
      years: 3,
      salary,
      releaseClause: Math.max(8, Math.round(askingPrice * 2.2))
    },
    mentality: MENTALITIES[i % MENTALITIES.length],
    mentalityStrength: 65 + (i % 31),
    playingTime: 75,
    personality: STYLES[i % STYLES.length].name,
    originalClub: origClub
  };
}

function makeMarket(){
  const market = [];
  let idx = 1;
  if (Array.isArray(realPlayersRaw) && realPlayersRaw.length > 0) {
    realPlayersRaw.forEach(rp => {
      market.push(makePlayer(idx++, rp));
    });
  }
  while (market.length < 320) {
    market.push(makePlayer(idx++));
  }
  return market;
}

function seedSquad(clubObj, market, count = 16) {
  if (!clubObj) return;
  const needed = ['GK','GK','CB','CB','CB','LB','RB','DMF','CMF','CMF','AMF','AMF','CF','CF','LWF','RWF'];
  needed.forEach(pos => {
    let p = market.find(x => x.position === pos && !x.ownerClub && !clubObj.players.includes(x.id));
    if (!p) p = market.find(x => !x.ownerClub && !clubObj.players.includes(x.id));
    if (p) {
      p.ownerClub = clubObj.name;
      p.status = 'contracted';
      if (!clubObj.players.includes(p.id)) clubObj.players.push(p.id);
    }
  });
}

function upgradeLegacyWorld(s) {
  if (!s || !Array.isArray(s.clubs) || !Array.isArray(s.market)) return s;
  // 1. Upgrade placeholder player names
  s.market.forEach((p, i) => {
    if (!p.name || p.name.startsWith('World Player')) {
      const rp = realPlayersRaw[i % (realPlayersRaw.length || 1)];
      if (rp && rp.name) {
        p.name = rp.name;
        p.position = normalizePosition(rp.position);
        p.rating = rp.rating || p.rating;
      } else {
        const fn = FIRST_NAMES[i % FIRST_NAMES.length];
        const ln = LAST_NAMES[(i * 7) % LAST_NAMES.length];
        p.name = `${fn} ${ln}`;
      }
    }
  });
  // 2. Upgrade placeholder club names
  s.clubs.forEach(c => {
    if (c.name.includes('Division')) {
      const auth = AUTHENTIC_CLUBS[c.country]?.[c.division];
      if (auth && auth.length) {
        const existing = s.clubs.map(x => x.name);
        const unused = auth.find(n => !existing.includes(n));
        if (unused) c.name = unused;
      }
    }
    if (!Array.isArray(c.players) || c.players.length < 11) {
      c.players = c.players || [];
      seedSquad(c, s.market, 16);
    }
    if (!c.jersey || typeof c.jersey !== 'object') {
      c.jersey = { quality: 75, home: '#10243b', away: '#f0f4f8', third: '#1b3b22', pattern: 'stripes' };
    }
  });
  // 3. Ensure manager statuses
  if (Array.isArray(s.managers)) {
    s.managers.forEach(m => {
      if (m.available === undefined) m.available = true;
      if (!m.status) m.status = m.available ? 'available' : 'hired';
    });
    // Add missing elite managers if catalog was smaller
    if (s.managers.length < MANAGERS.length) {
      const existingNames = s.managers.map(m => m.name);
      MANAGERS.forEach((m, i) => {
        if (!existingNames.includes(m[0])) {
          s.managers.push({
            id: `mgr_${s.managers.length + 1}`,
            name: m[0],
            style: m[1],
            rating: m[2],
            salary: m[3],
            minDivision: m[4] || (m[2] >= 90 ? 1 : m[2] >= 80 ? 2 : m[2] >= 72 ? 3 : 4),
            title: m[5] || (m[2] >= 90 ? 'World-Class Tactician' : m[2] >= 80 ? 'Continental Specialist' : m[2] >= 72 ? 'Promotion Specialist' : 'Grassroots Grinder'),
            bio: m[6] || '',
            isFictional: !!m[7],
            reputation: m[2],
            contractYears: 3,
            available: true,
            status: 'available',
            preferredFormations: m[1]==='Possession'?['4-3-3','4-2-3-1']:m[1]==='High Press'?['4-3-3','3-4-3']:m[1]==='Counter Attack'?['4-4-2','4-2-3-1']:m[1]==='Direct Football'?['4-4-2','3-5-2']:['5-3-2','4-5-1']
          });
        }
      });
    }
    // Backfill metadata for existing managers
    s.managers.forEach(mgr => {
      const match = MANAGERS.find(x => x[0] === mgr.name);
      if (match) {
        if (!mgr.minDivision) mgr.minDivision = match[4] || (match[2] >= 90 ? 1 : match[2] >= 80 ? 2 : match[2] >= 72 ? 3 : 4);
        if (!mgr.title) mgr.title = match[5] || '';
        if (!mgr.bio) mgr.bio = match[6] || '';
        if (mgr.isFictional === undefined) mgr.isFictional = !!match[7];
      }
    });
  }
  return s;
}

function makeState(mode,code){
  const clubs=makeClubs(); const market=makeMarket();
  clubs.forEach(c => { seedSquad(c, market, 16); });
  return {mode,roomCode:code||null,season:1,transferWindowOpen:true,transferWindow:'summer',countries:COUNTRIES.map(x=>({country:x[0],leagues:[x[1]]})),clubs,market,managers:managerCatalog(),selectedClub:null,news:[],competitions:{worldChampionsEvery:2,lastTournament:0},pendingBattles:{},matchIds:{},serverClock:Date.now()};
}
function club(state,name){return state.clubs.find(c=>c.name===name);}
function player(state,idOrName){return state.market.find(p=>p.id===idOrName||slug(p.name)===slug(idOrName));}
function clubPlayers(state,c){return (c?.players||[]).map(x=>player(state,x)).filter(Boolean);}
function addNews(state,text,type='world'){state.news.unshift({id:id('news'),season:state.season,type,text,at:new Date().toISOString()});state.news=state.news.slice(0,100);}
function persist(){try{const data={rooms:[...worldRooms.entries()].map(([k,v])=>[k,v]),solo:[...soloWorlds.entries()].map(([k,v])=>[k,v])};fs.writeFileSync(SAVE,JSON.stringify(data));}catch(e){console.error('[WorldEngine]',e.message)}}
function createRoom(name,maxHumans,host){let code='';do{code=Math.random().toString(36).slice(2,8).toUpperCase()}while(worldRooms.has(code));const s=makeState('online',code);s.roomName=name||'Friends Football League';s.maxHumans=Math.min(20,Math.max(2,Number(maxHumans)||10));s.humans={};s.host=host||null;worldRooms.set(code,s);persist();return s;}
function createSolo(){const sid=id('solo');const s=makeState('solo',null);s.soloId=sid;soloWorlds.set(sid,s);persist();return s;}
function getWorld(ref){
  let w = null;
  if(ref?.room&&worldRooms.has(ref.room)) w = worldRooms.get(ref.room);
  else if(ref?.soloId&&soloWorlds.has(ref.soloId)) w = soloWorlds.get(ref.soloId);
  if(w) upgradeLegacyWorld(w);
  return w;
}
function joinRoom(s,managerName){if(!s||Object.keys(s.humans).length>=s.maxHumans)return {error:'Room is full.'};const mid=id('mgruser');s.humans[mid]={id:mid,name:managerName||'Manager',club:null,online:true};if(!s.host)s.host=mid;persist();return {id:mid,state:s};}
function leaveRoom(s,mid){if(s?.humans?.[mid])s.humans[mid].online=false;persist();}
function createClub(s,data,managerId){
  if(!data?.name)return {error:'Club name required.'};
  const existing = club(s,data.name);
  if(existing){
    s.selectedClub=existing.name;
    existing.online=true;
    if(data.country)existing.country=data.country;
    if(data.division)existing.division=Number(data.division);
    if(data.home||data.away||data.pattern){
      existing.jersey={
        quality:Number(data.quality)||existing.jersey?.quality||75,
        home:data.home||existing.jersey?.home||'#10243b',
        away:data.away||existing.jersey?.away||'#e8edf4',
        third:data.third||existing.jersey?.third||'#253d59',
        pattern:data.pattern||existing.jersey?.pattern||'stripes',
        collar:data.collar||existing.jersey?.collar||'#ffffff',
        shorts:data.shorts||data.home||existing.jersey?.shorts||'#10243b',
        socks:data.socks||data.home||existing.jersey?.socks||'#10243b'
      };
    }
    if(data.crest)existing.crest=data.crest;
    if(!existing.players||existing.players.length<11)seedSquad(existing,s.market,16);
    if(s.mode==='online'&&managerId&&s.humans?.[managerId])s.humans[managerId].club=existing.name;
    addNews(s,`${existing.name} has appointed a new sovereign owner.`,'club');
    persist();
    return existing;
  }
  const c={
    name:String(data.name).slice(0,30),
    country:data.country||'India',
    league:data.league||'ISL',
    division:Number(data.division)||3,
    reputation:55,
    fans:12000,
    morale:75,
    stadium:{capacity:15000,condition:100,facilities:1},
    ticketPrice:400,
    merchandise:60,
    jersey:{
      quality:Number(data.quality)||75,
      home:data.home||'#10243b',
      away:data.away||'#e8edf4',
      third:data.third||'#253d59',
      pattern:data.pattern||'stripes',
      collar:data.collar||'#ffffff',
      shorts:data.shorts||data.home||'#10243b',
      socks:data.socks||data.home||'#10243b'
    },
    crest:data.crest||'crest_lion',
    sponsor:null,
    manager:null,
    cash:60,
    players:[],
    history:{titles:0,cups:0,promotions:0,relegations:0},
    stats:{wins:0,draws:0,losses:0,points:0},
    online:true
  };
  s.clubs.push(c);
  s.selectedClub=c.name;
  seedSquad(c, s.market, 16);
  if(s.mode==='online'&&managerId&&s.humans?.[managerId])s.humans[managerId].club=c.name;
  addNews(s,`${c.name} has been created in ${c.country} with a full 16-man squad.`,'club');
  persist();
  return c;
}
function chooseClub(s,name,managerId){const c=club(s,name);if(!c)return {error:'Club not found.'};s.selectedClub=c.name;c.online=true;if(!c.players||c.players.length<11)seedSquad(c,s.market,16);if(s.mode==='online'&&managerId&&s.humans?.[managerId])s.humans[managerId].club=c.name;return c;}
function managerRecommendations(s,clubName){const c=club(s,clubName);if(!c)return [];const m=c.manager;if(!m)return [];const style=STYLES.find(x=>x.name===m.style)||STYLES[0];const owned=clubPlayers(s,c);return s.market.filter(p=>p.ownerClub!==c.name&&p.loanClub!==c.name).map(p=>{let score=0;if(style.needs.includes(p.position))score+=28;if(style.traits.includes('pace')&&p.rating>=82)score+=10;if(style.traits.includes('technical')&&p.rating>=82)score+=10;if(style.traits.includes('passing')&&['CMF','AMF','DMF'].includes(p.position))score+=8;score+=Math.max(0,p.form-65)*0.35;score+=Math.max(0,p.rating-75)*0.5;return {p,score};}).sort((a,b)=>b.score-a.score).slice(0,10).map(x=>x.p);
}
function hireManager(s,clubName,managerId){
  const c=club(s,clubName);
  const m=s.managers.find(x=>x.id===managerId);
  if(!c||!m)return {error:'Manager or club not found.'};

  const minDiv = m.minDivision || (m.rating >= 90 ? 1 : m.rating >= 80 ? 2 : m.rating >= 72 ? 3 : 4);

  // Prestige gate: Elite managers (ratings 88+) require Division 1 or 2
  if (c.division > minDiv && m.rating >= 88 && c.reputation < 82) {
    return {
      error: `${m.name} declined the offer: "My continental reputation demands at least Division ${minDiv} football. In Division ${c.division}, lead ${c.name} through promotions first, or hire our talented Division ${c.division}-specialist managers (starting from ₹0.8M)!"`
    };
  }

  if(c.cash<m.salary)return {error:`Need ₹${m.salary}M for manager salary. Club cash is ₹${money(c.cash)}M. In Division ${c.division}, hire Division ${c.division}-specialist managers (starting from ₹0.8M)!`};
  c.cash-=m.salary;
  c.manager={...m,contractEnd:s.season+m.contractYears-1};
  s.managers=s.managers.map(x=>x.id===m.id?{...x,available:false,status:'hired'}:x);
  addNews(s,`${c.name} hired ${m.name} (${m.title || m.style + ' specialist'}) on a ${m.contractYears}-season contract.`,'manager');
  persist();
  return {manager:c.manager,recommendations:managerRecommendations(s,c.name)};
}
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
function updateEconomy(s,clubName,data){
  const c=club(s,clubName);
  if(!c)return {error:'Club not found.'};
  if(data.ticketPrice!==undefined)c.ticketPrice=Math.max(50,money(data.ticketPrice));
  if(data.capacity){
    const cap=money(data.capacity);
    if(cap<c.stadium.capacity)return {error:'Capacity cannot be reduced below current size.'};
    if(cap>c.stadium.capacity){
      const diff=cap-c.stadium.capacity;
      // Fixed transparent charge: ₹1M per 1,000 seats expanded
      const cost=Math.max(1, Math.round(diff/1000));
      if(c.cash<cost)return {error:`Need ₹${cost}M to expand stadium by ${diff.toLocaleString()} seats. Club cash is ₹${money(c.cash)}M.`};
      c.cash-=cost;
      c.stadium.capacity=cap;
      addNews(s,`${c.name} expanded stadium to ${cap.toLocaleString()} seats (+${diff.toLocaleString()}) for ₹${cost}M.`,'finance');
    }
  }
  if(data.jerseyQuality!==undefined)c.jersey.quality=Math.max(10,Math.min(100,money(data.jerseyQuality)));
  const star=clubPlayers(s,c).reduce((m,p)=>Math.max(m,p.rating),0);
  const design=Math.max(0,c.jersey.quality);
  c.merchandise=Math.round(Math.min(100,design*0.65+star*0.35));
  const attendanceFactor=Math.max(0.25,1-Math.max(0,c.ticketPrice-500)/5000);
  c.lastProjectedAttendance=Math.round(Math.min(c.stadium.capacity,c.stadium.capacity*(0.35+c.reputation/200+c.merchandise/500)*attendanceFactor));
  persist();
  return c;
}
function updateJersey(s,clubName,jerseyData){
  const c=club(s,clubName);
  if(!c)return {error:'Club not found.'};
  c.jersey={...c.jersey,...jerseyData};
  addNews(s,`${c.name} updated their official club kit colors and design.`,'club');
  persist();
  return c.jersey;
}
function sponsorshipOffers(s,clubName){const c=club(s,clubName);if(!c)return [];const base=Math.round(2+c.reputation/10+c.fans/100000);return ['Local Sports Brand','National Telecom','Global Sportswear','Energy Partner'].map((name,i)=>({id:`sp_${i}`,name,value:base*(i+1),years:i===3?3:1,objective:i===0?'Finish above current position':i===1?'Reach top 6':i===2?'Qualify for continental competition':'Win a trophy',bonus:base*(i+1)*2}));}
function signSponsor(s,clubName,offerId){const c=club(s,clubName),offers=sponsorshipOffers(s,clubName);const o=offers.find(x=>x.id===offerId);if(!c||!o)return {error:'Sponsor offer not found.'};c.sponsor=o;c.cash+=o.value;addNews(s,`${c.name} signed a ${o.years}-season sponsorship with ${o.name}.`,'finance');persist();return c;}

function managerMeeting(s, clubName){
  const c = club(s, clubName);
  if (!c) return { error: 'Club not found.' };
  if (!c.manager) return { error: 'No manager hired yet. Hire a manager first.' };
  
  const m = c.manager;
  const style = STYLES.find(x => x.name === m.style) || STYLES[0];
  const losses = c.stats?.losses || 0;
  const wins = c.stats?.wins || 0;
  const isUnderperforming = (losses > wins) || (c.morale < 70) || (c.stats?.points < 6 && (wins + losses + (c.stats?.draws||0)) >= 3);

  const excusesByStyle = {
    'Possession': [
      "Boss, the players are struggling to retain possession under pressure. Our pass completion in the final third drops when teams press us, and we're missing an elite playmaker who can dictate the tempo.",
      "Teams are parking the bus against our buildup. Without a creative number 10 who can thread needle passes, our possession is sterile."
    ],
    'High Press': [
      "The tactical intensity I demand requires relentless stamina. Right now, our squad drops off after the 65th minute, allowing opponents to punish us on the break. We need high-workrate athletes.",
      "Our pressing triggers are failing because the forward line isn't pressing in sync. We need energetic wingers with top pace."
    ],
    'Counter Attack': [
      "We're getting caught too high up the pitch and our defensive transition is too slow. We lack genuine breakaway pace on the flanks to punish opponents.",
      "When we win the ball back, our forward options are isolated. I desperately need a lethal finisher who can turn half-chances into goals."
    ],
    'Direct Football': [
      "We are losing second balls and physical duels in both boxes. Our current forwards are being bullied by opposing center-backs.",
      "The delivery from wide areas isn't meeting the aerial power we need. We lack physical presence in midfield and a target man up front."
    ],
    'Defensive Block': [
      "We are leaking soft goals from set pieces and crosses. Our defensive line lacks vocal leadership and commanding aerial dominance.",
      "Without an anchor defensive midfielder who can break up play in front of the back four, our defensive structure breaks down under sustained waves."
    ]
  };

  const styleExcuses = excusesByStyle[m.style] || excusesByStyle['Possession'];
  const excuse = isUnderperforming ? styleExcuses[0] : `Boss, the squad is performing steadily, but if we want to dominate and claim trophies, we must reinforce key positions before our rivals pull ahead.`;

  const demandedPositions = style.needs.slice(0, 2);
  const targets = s.market.filter(p => p.ownerClub !== c.name && demandedPositions.includes(p.position) && p.rating >= 80).slice(0, 4);

  return {
    manager: m,
    isUnderperforming,
    losses,
    wins,
    points: c.stats?.points || 0,
    morale: c.morale,
    excuse,
    demands: `I urgently need us to sign an elite ${demandedPositions.join(' and ')} to execute my ${m.style} system properly.`,
    neededPositions: demandedPositions,
    targets,
    currentExpectation: c.expectation || 'Secure Top 4 Continental Qualification',
    managerConfidence: m.confidence || 80
  };
}

function setExpectation(s, clubName, expectation, ownerStance){
  const c = club(s, clubName);
  if (!c) return { error: 'Club not found.' };
  c.expectation = expectation;

  if (c.manager) {
    if (ownerStance === 'back') {
      c.morale = Math.min(100, c.morale + 6);
      c.manager.confidence = Math.min(100, (c.manager.confidence || 80) + 10);
      addNews(s, `${c.name} owner fully backed manager ${c.manager.name} during an urgent summit. Target: ${expectation}.`, 'board');
    } else if (ownerStance === 'ultimatum') {
      c.morale = Math.max(40, c.morale - 5);
      c.manager.confidence = Math.max(30, (c.manager.confidence || 80) - 12);
      addNews(s, `${c.name} board issued a strict results ultimatum to ${c.manager.name}: '${expectation}' or departure.`, 'board');
    } else {
      c.morale = Math.min(100, c.morale + 2);
      addNews(s, `${c.name} agreed season objectives with ${c.manager.name}: ${expectation}.`, 'board');
    }
  }
  persist();
  return { club: c, expectation, manager: c.manager };
}

function globalState(s){
  if(s) upgradeLegacyWorld(s);
  return {...s,clubs:s.clubs.map(c=>({...c,players:clubPlayers(s,c)})),recommendations:s.selectedClub?managerRecommendations(s,s.selectedClub):[]};
}
function roomsList(){return [...worldRooms.values()].map(s=>({code:s.roomCode,name:s.roomName,count:Object.values(s.humans||{}).filter(x=>x.online).length,max:s.maxHumans,host:s.host}));}
module.exports={worldRooms,soloWorlds,createRoom,createSolo,getWorld,joinRoom,leaveRoom,createClub,chooseClub,hiringManager:hireManager,hireManager,managerRecommendations,managerMeeting,setExpectation,startBattle,intervene,completeBattle,loan,releasePlayer,sellPlayer,simulate,advanceSeason,updateEconomy,updateJersey,sponsorshipOffers,signSponsor,globalState,roomsList,persist,upgradeLegacyWorld};
