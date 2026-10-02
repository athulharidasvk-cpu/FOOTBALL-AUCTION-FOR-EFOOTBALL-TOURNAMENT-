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

const HISTORIC_DERBIES = [
  ['Real Madrid', 'FC Barcelona', 'El Clásico'],
  ['Real Madrid', 'Atlético Madrid', 'Madrid Derby'],
  ['Manchester City', 'Manchester United', 'Manchester Derby'],
  ['Arsenal', 'Tottenham Hotspur', 'North London Derby'],
  ['Liverpool', 'Everton', 'Merseyside Derby'],
  ['Bayern München', 'Borussia Dortmund', 'Der Klassiker'],
  ['Inter Milan', 'AC Milan', 'Derby della Madonnina'],
  ['Juventus', 'Inter Milan', "Derby d'Italia"],
  ['Paris Saint-Germain', 'Olympique de Marseille', 'Le Classique'],
  ['Mohun Bagan SG', 'East Bengal FC', 'Kolkata Derby'],
  ['Kerala Blasters FC', 'Bengaluru FC', 'Southern Derby'],
  ['Mumbai City FC', 'FC Goa', 'West Coast Derby']
];

function setupClubRivalries(clubs) {
  if (!Array.isArray(clubs)) return;

  // 1. Establish base fan satisfaction, popularity, and historic same-country derbies
  clubs.forEach(c => {
    c.fanSatisfaction = (c.fanSatisfaction !== undefined) ? c.fanSatisfaction : 78;
    c.popularity = (c.popularity !== undefined) ? c.popularity : Math.max(30, Math.min(99, Math.round((c.reputation || 60) * 0.85 + (5 - (c.division || 3)) * 3)));
    
    if (!c.rivalName) {
      const foundHistoric = HISTORIC_DERBIES.find(d => d[0] === c.name || d[1] === c.name);
      if (foundHistoric) {
        const targetRival = foundHistoric[0] === c.name ? foundHistoric[1] : foundHistoric[0];
        const rClub = clubs.find(x => x.name === targetRival);
        if (rClub) {
          c.rivalName = rClub.name;
          c.derbyName = foundHistoric[2];
          rClub.rivalName = c.name;
          rClub.derbyName = foundHistoric[2];
        }
      }
    }
  });

  // For any remaining clubs without same-tier rivals, pair within same country & division
  const countries = [...new Set(clubs.map(c => c.country))];
  countries.forEach(country => {
    for (let div = 1; div <= 4; div++) {
      const pool = clubs.filter(c => c.country === country && c.division === div && !c.rivalName);
      for (let i = 0; i < pool.length; i += 2) {
        if (i + 1 < pool.length) {
          const c1 = pool[i];
          const c2 = pool[i + 1];
          const dName = `${c1.name.split(' ')[0]} vs ${c2.name.split(' ')[0]} Derby`;
          c1.rivalName = c2.name;
          c1.derbyName = dName;
          c2.rivalName = c1.name;
          c2.derbyName = dName;
        } else if (pool.length === 1) {
          const other = clubs.find(c => c.country === country && c.division === div && c.name !== pool[0].name);
          if (other) {
            pool[0].rivalName = other.name;
            pool[0].derbyName = `${pool[0].name.split(' ')[0]} vs ${other.name.split(' ')[0]} Derby`;
          }
        }
      }
    }
  });

  // 2. MULTI-TIER RIVALRIES: Higher Division, Same Division, and Lower Division
  clubs.forEach(c => {
    c.rivals = c.rivals || {};
    const div = c.division || 3;

    // SAME DIVISION RIVAL
    const sameRivalObj = clubs.find(x => x.name === c.rivalName && x.name !== c.name);
    const sameDerby = c.derbyName || `${c.name.split(' ')[0]} vs ${(sameRivalObj?.name || 'Rival').split(' ')[0]} Derby`;
    const existingSameH2H = (c.rivals.same && c.rivals.same.h2h) || { played: 0, wins: 0, draws: 0, losses: 0 };
    c.rivals.same = {
      name: sameRivalObj ? sameRivalObj.name : (c.rivalName || 'League Rival'),
      division: sameRivalObj ? sameRivalObj.division : div,
      derbyName: sameDerby,
      badge: `⚔️ DIVISION ${div} NEMESIS`,
      tier: `Division ${div} League Nemesis`,
      backstory: `Direct league contenders fighting head-to-head for promotion and the division title.`,
      h2h: existingSameH2H
    };

    // HIGHER DIVISION RIVAL (Division 1 or 2 Goliath)
    let higherCandidates = clubs.filter(x => x.country === c.country && x.division < div && x.name !== c.name);
    if (!higherCandidates.length && div > 1) {
      higherCandidates = clubs.filter(x => x.division < div && x.name !== c.name);
    }
    if (!higherCandidates.length) {
      higherCandidates = clubs.filter(x => x.division === 1 && x.name !== c.name && x.name !== c.rivalName);
    }

    if (higherCandidates.length) {
      higherCandidates.sort((a, b) => (b.reputation || 70) - (a.reputation || 70));
      const higherClub = higherCandidates[0];
      const higherDerby = `${c.name.split(' ')[0]} vs ${higherClub.name.split(' ')[0]} David vs Goliath Clash`;
      const existingHigherH2H = (c.rivals.higher && c.rivals.higher.h2h) || { played: 0, wins: 0, draws: 0, losses: 0 };
      c.rivals.higher = {
        name: higherClub.name,
        division: higherClub.division,
        derbyName: higherDerby,
        badge: '👑 HIGHER DIVISION GOLIATH',
        tier: `Division ${higherClub.division} Goliath`,
        backstory: `Top-flight titans your supporters obsessively dream of shocking in domestic cup ties and future promotion showdowns.`,
        h2h: existingHigherH2H
      };
    }

    // LOWER DIVISION RIVAL (Division 4 Grassroots Underdog)
    let lowerCandidates = clubs.filter(x => x.country === c.country && x.division > div && x.name !== c.name);
    if (!lowerCandidates.length && div < 4) {
      lowerCandidates = clubs.filter(x => x.division > div && x.name !== c.name);
    }
    if (!lowerCandidates.length) {
      lowerCandidates = clubs.filter(x => x.division === 4 && x.name !== c.name && x.name !== c.rivalName);
    }

    if (lowerCandidates.length) {
      lowerCandidates.sort((a, b) => (a.reputation || 50) - (b.reputation || 50));
      const lowerClub = lowerCandidates[0];
      const lowerDerby = `${c.name.split(' ')[0]} vs ${lowerClub.name.split(' ')[0]} Grassroots Derby`;
      const existingLowerH2H = (c.rivals.lower && c.rivals.lower.h2h) || { played: 0, wins: 0, draws: 0, losses: 0 };
      c.rivals.lower = {
        name: lowerClub.name,
        division: lowerClub.division,
        derbyName: lowerDerby,
        badge: '🛡️ LOWER DIVISION GRASSROOTS',
        tier: `Division ${lowerClub.division} Underdog`,
        backstory: `Passionate regional underdogs who treat every fixture against your club as their personal cup final.`,
        h2h: existingLowerH2H
      };
    }
  });
}

function recordTransaction(c, amount, category, description, s) {
  if (!c || typeof amount !== 'number' || isNaN(amount)) return;
  c.transactions = Array.isArray(c.transactions) ? c.transactions : [];
  const balanceAfter = Math.round((c.cash || 0) * 10) / 10;
  const tx = {
    id: 'tx_' + Math.random().toString(36).slice(2, 9),
    timestamp: Date.now(),
    date: s ? `Season ${s.season || 1} · Matchday ${s.matchday || 0}` : 'Pre-Season',
    type: amount >= 0 ? 'income' : 'expense',
    amount: Math.abs(Math.round(amount * 10) / 10),
    category: category || 'general',
    description: description || 'Club financial transaction',
    balanceAfter
  };
  c.transactions.unshift(tx);
  if (c.transactions.length > 50) c.transactions.pop();
  return tx;
}

function calculateClubBudget(s, c) {
  if (!c) return null;
  const players = clubPlayers(s, c);
  const wageBillAnnual = Math.round((players.reduce((sum, p) => sum + (p.contract?.salary || 0.45), 0) + (c.manager?.salary || 0.4)) * 10) / 10;
  const wageBillPerMatch = Math.round((wageBillAnnual / 24) * 100) / 100;
  const projectedAttendance = c.lastProjectedAttendance || Math.round((c.stadium?.capacity || 15000) * 0.7);
  const ticketRevPerMatch = Math.round(((projectedAttendance * (c.ticketPrice || 400)) / 1000000) * 100) / 100;
  const merchRevPerMatch = Math.round(((projectedAttendance * (c.merchandise || 60) * 0.4) / 100000) * 100) / 100;
  const sponsorAnnual = c.sponsor ? (c.sponsor.value || 2.5) : 1.5;
  const sponsorPerMatch = Math.round((sponsorAnnual / 24) * 100) / 100;
  const projectedRevPerMatch = Math.round((ticketRevPerMatch + merchRevPerMatch + sponsorPerMatch) * 100) / 100;
  const netCashflowPerMatch = Math.round((projectedRevPerMatch - wageBillPerMatch) * 100) / 100;
  const projectedTurnoverAnnual = Math.round((projectedRevPerMatch * 24) * 10) / 10;
  const ffpRatio = projectedTurnoverAnnual > 0 ? Math.round((wageBillAnnual / projectedTurnoverAnnual) * 100) : 65;

  let ffpGrade = 'A';
  let ffpStatus = 'EXCELLENT';
  let ffpColor = '#22c55e';
  if (ffpRatio > 85 || (c.cash || 0) < 1.0) {
    ffpGrade = 'D';
    ffpStatus = 'FFP BREACH WARNING';
    ffpColor = '#ef4444';
  } else if (ffpRatio > 70) {
    ffpGrade = 'C';
    ffpStatus = 'MONITORED';
    ffpColor = '#f59e0b';
  } else if (ffpRatio > 55) {
    ffpGrade = 'B';
    ffpStatus = 'HEALTHY';
    ffpColor = '#06b6d4';
  }

  return {
    cash: Math.round((c.cash || 0) * 10) / 10,
    wageBillAnnual,
    wageBillPerMatch,
    projectedRevPerMatch,
    ticketRevPerMatch,
    merchRevPerMatch,
    sponsorPerMatch,
    sponsorAnnual,
    netCashflowPerMatch,
    projectedTurnoverAnnual,
    ffpRatio,
    ffpGrade,
    ffpStatus,
    ffpColor,
    transferWarChest: Math.max(0, Math.round((c.cash * 0.6) * 10) / 10),
    wageReserve: Math.max(0, Math.round((c.cash * 0.3) * 10) / 10),
    emergencyReserve: Math.max(0, Math.round((c.cash * 0.1) * 10) / 10)
  };
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
        let cash = 50;
        let ticketPrice = 450;
        let stadiumCap = 35000;
        if (div === 1) {
          cash = Math.round(45 + (rep * 0.65)); // ₹70M - ₹105M
          ticketPrice = Math.round(350 + rep * 4);
          stadiumCap = Math.max(28000, 50000 - i * 1500);
        } else if (div === 2) {
          cash = Math.round(15 + (rep * 0.22)); // ₹20M - ₹32M
          ticketPrice = Math.round(200 + rep * 2);
          stadiumCap = Math.max(16000, 28000 - i * 1000);
        } else if (div === 3) {
          cash = Math.round(4 + (rep * 0.08)); // ₹6M - ₹11M (realistic 3rd division budget!)
          ticketPrice = Math.round(100 + rep * 1.2);
          stadiumCap = Math.max(8000, 15000 - i * 600);
        } else {
          cash = Math.round(1.5 + (rep * 0.04)); // ₹2M - ₹4M (realistic 4th division budget!)
          ticketPrice = Math.round(70 + rep * 0.8);
          stadiumCap = Math.max(4000, 8000 - i * 400);
        }
        clubs.push({
          name:n,
          country,
          league,
          division:div,
          reputation:rep,
          fans:Math.round(15000+rep*2200/div),
          morale:75,
          stadium:{capacity:stadiumCap,condition:100,facilities:1},
          ticketPrice,
          merchandise:55,
          jersey:{quality:70,home:i%2===0?'#0b2545':'#b21e27',away:'#f4f7fb',third:'#1b3b22',pattern:'stripes',collar:'#ffffff',shorts:'#0b2545',socks:'#0b2545'},
          sponsor:null,
          manager:null,
          cash,
          players:[],
          history:{titles:0,cups:0,promotions:0,relegations:0},
          stats:{wins:0,draws:0,losses:0,points:0},
          online:false
        });
      }
    }
  });
  setupClubRivalries(clubs);
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

function getDivisionRatingRange(division) {
  switch (Number(division)) {
    case 1: return { min: 72, max: 82, avg: 76, name: 'Top Flight' };
    case 2: return { min: 66, max: 73, avg: 69, name: 'Championship' };
    case 4: return { min: 54, max: 62, avg: 58, name: 'Grassroots' };
    case 3:
    default: return { min: 60, max: 68, avg: 64, name: 'Regional Tier' };
  }
}

function rebalanceSquadToDivision(s, c) {
  if (!s || !c) return;
  const tier = getDivisionRatingRange(c.division || 3);
  c.players = Array.isArray(c.players) ? c.players : [];
  const eliteClubs = s.clubs.filter(x => x.division === 1 && x.name !== c.name);
  const validPlayerIds = [];
  const targetMax = c.division === 3 ? 65 : tier.max;
  const targetMin = tier.min;

  c.players.forEach(pid => {
    const p = player(s, pid);
    if (!p) return;
    if (p.rating > targetMax) {
      if (eliteClubs.length && Math.random() < 0.8) {
        const target = eliteClubs[Math.floor(Math.random() * eliteClubs.length)];
        p.ownerClub = target.name;
        target.players = Array.isArray(target.players) ? target.players : [];
        if (!target.players.includes(p.id)) target.players.push(p.id);
      } else {
        p.ownerClub = null;
        p.status = 'free_agent';
      }
      let repl = s.market.find(x => x.position === p.position && !x.ownerClub && !validPlayerIds.includes(x.id) && x.rating >= targetMin && x.rating <= targetMax);
      if (!repl) {
        const pId = 'p_div_' + Math.random().toString(36).slice(2, 9);
        const rating = Math.min(targetMax, Math.max(targetMin, Math.round(targetMin + Math.random() * (targetMax - targetMin))));
        const randFirst = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
        const randLast = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
        repl = {
          id: pId,
          name: `${randFirst} ${randLast}`,
          position: p.position,
          rating: rating,
          age: 20 + Math.floor(Math.random() * 8),
          nationality: c.country || 'International',
          ownerClub: c.name,
          askingPrice: Math.max(1, Math.round(rating * 0.18)),
          status: 'contracted',
          contract: { salary: Math.max(0.2, Math.round(rating * 0.025 * 10) / 10), years: 3 }
        };
        s.market.push(repl);
      } else {
        repl.ownerClub = c.name;
        repl.status = 'contracted';
      }
      validPlayerIds.push(repl.id);
    } else {
      p.ownerClub = c.name;
      p.status = 'contracted';
      validPlayerIds.push(p.id);
    }
  });

  c.players = validPlayerIds;
  if (c.players.length < 16) {
    seedSquad(c, s.market, 16);
  }
}

function seedSquad(clubObj, market, count = 16) {
  if (!clubObj) return;
  clubObj.players = Array.isArray(clubObj.players) ? clubObj.players : [];
  const tier = getDivisionRatingRange(clubObj.division || 3);
  const needed = ['GK','GK','CB','CB','CB','LB','RB','DMF','CMF','CMF','AMF','AMF','CF','CF','LWF','RWF'];
  needed.forEach(pos => {
    if (clubObj.players.length >= count) return;
    let p = market.find(x => x.position === pos && !x.ownerClub && !clubObj.players.includes(x.id) && x.rating >= tier.min && x.rating <= tier.max);
    if (!p) p = market.find(x => !x.ownerClub && !clubObj.players.includes(x.id) && x.rating >= tier.min && x.rating <= tier.max);
    if (p) {
      p.ownerClub = clubObj.name;
      p.status = 'contracted';
      if (!clubObj.players.includes(p.id)) clubObj.players.push(p.id);
    } else {
      const pId = 'p_seed_' + Math.random().toString(36).slice(2, 9);
      const rating = Math.min(tier.max, Math.max(tier.min, Math.round(tier.avg + (Math.random() * 5 - 2.5))));
      const randFirst = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
      const randLast = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
      const newP = {
        id: pId,
        name: `${randFirst} ${randLast}`,
        position: pos,
        rating: rating,
        age: 19 + Math.floor(Math.random() * 9),
        nationality: clubObj.country || 'International',
        ownerClub: clubObj.name,
        askingPrice: Math.max(1, Math.round(rating * 0.18)),
        status: 'contracted',
        contract: { salary: Math.max(0.2, Math.round(rating * 0.025 * 10) / 10), years: 3 }
      };
      market.push(newP);
      clubObj.players.push(pId);
    }
  });
}

function upgradeLegacyWorld(s) {
  if (!s || !Array.isArray(s.clubs) || !Array.isArray(s.market)) return s;
  if (s._upgraded) return s;
  s._upgraded = true;
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
    if (!Array.isArray(c.players) || c.players.length < 16) {
      c.players = c.players || [];
      seedSquad(c, s.market, 16);
    }
    (c.players || []).forEach(pid => {
      const p = player(s, pid);
      if (p && !p.ownerClub) {
        p.ownerClub = c.name;
        p.status = 'contracted';
      }
    });
    if (!c.jersey || typeof c.jersey !== 'object') {
      c.jersey = { quality: 75, home: '#10243b', away: '#f0f4f8', third: '#1b3b22', pattern: 'stripes' };
    }
    // Rebalance legacy club budgets to realistic division economics:
    if (c.division === 3 && c.cash > 10.5) {
      c.cash = 8.5;
    } else if (c.division === 4 && c.cash > 5) {
      c.cash = 3.5;
    } else if (c.division === 2 && c.cash > 28) {
      c.cash = Math.max(12, Math.min(22, Math.round(c.cash * 0.35)));
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
  // 4. Ensure rivalries, popularity & fan satisfaction
  setupClubRivalries(s.clubs);
  s.clubs.forEach(c => {
    if (!Array.isArray(c.transactions) || !c.transactions.length) {
      c.transactions = [{
        id: 'tx_init',
        timestamp: Date.now() - 3600000,
        date: 'Season 1 · Matchday 0',
        type: 'income',
        amount: Math.round((c.cash || 8.5) * 10) / 10,
        category: 'starting_capital',
        description: `Division ${c.division || 3} Boardroom Capital Allocation`,
        balanceAfter: Math.round((c.cash || 8.5) * 10) / 10
      }];
    }
  });
  // 5. Ensure player stats and untouchable status for big clubs
  if (Array.isArray(s.market)) {
    s.market.forEach(p => {
      p.merchandiseSales = p.merchandiseSales || 0;
      p.appearances = p.appearances || 0;
      p.goalsScored = p.goalsScored || 0;
      p.assists = p.assists || 0;
      p.cleanSheets = p.cleanSheets || 0;
      p.awards = Array.isArray(p.awards) ? p.awards : [];
      p.signingCost = p.signingCost || p.askingPrice || 5;
      if (p.ownerClub) {
        const oc = s.clubs.find(c => c.name === p.ownerClub);
        if (oc && (oc.division === 1 || (oc.reputation || 60) >= 78) && (p.rating >= 84)) {
          p.untouchable = true;
        }
      }
    });
  }
  s.awardsHistory = Array.isArray(s.awardsHistory) ? s.awardsHistory : [];
  s.tournamentHistory = Array.isArray(s.tournamentHistory) ? s.tournamentHistory : [];
  s.incomingOffers = Array.isArray(s.incomingOffers) ? s.incomingOffers : [];
  if (s.selectedClub) {
    const selC = club(s, s.selectedClub);
    if (selC) rebalanceSquadToDivision(s, selC);
  }
  if (s.selectedClub && (!s.incomingOffers || !s.incomingOffers.length)) {
    try { generateAiTransferApproaches(s, 2); } catch (e) {}
  }
  if (!s.uclTournament) {
    try { initiateUclTournament(s); } catch (e) {}
  }
  if (!s.europaTournament) {
    try { initiateEuropaTournament(s); } catch (e) {}
  }
  if (!s.domesticCup) {
    try { initiateDomesticCup(s); } catch (e) {}
  }
  if (!s.playoffs) {
    try { initiatePlayoffs(s); } catch (e) {}
  }
  if (!s.deadlineDay) {
    try { getDeadlineDayState(s); } catch (e) {}
  }
  return s;
}

function makeState(mode,code){
  const clubs=makeClubs(); const market=makeMarket();
  clubs.forEach(c => { seedSquad(c, market, 16); });
  return {mode,roomCode:code||null,season:1,transferWindowOpen:true,transferWindow:'summer',countries:COUNTRIES.map(x=>({country:x[0],leagues:[x[1]]})),clubs,market,managers:managerCatalog(),selectedClub:null,news:[],competitions:{worldChampionsEvery:2,lastTournament:0},pendingBattles:{},matchIds:{},awardsHistory:[],tournamentHistory:[],incomingOffers:[],globalTournament:null,serverClock:Date.now()};
}
function club(state,name){return state.clubs.find(c=>c.name===name);}
function getPlayerMap(state){
  if (!state) return new Map();
  if (!state._playerMap || !(state._playerMap instanceof Map) || state._playerMapMarketLen !== (state.market ? state.market.length : 0)) {
    const map = new Map();
    if (state.market) {
      for (let i = 0; i < state.market.length; i++) {
        const p = state.market[i];
        map.set(p.id, p);
        if (p.name) map.set(p.name.toLowerCase(), p);
      }
    }
    state._playerMap = map;
    state._playerMapMarketLen = state.market ? state.market.length : 0;
  }
  return state._playerMap;
}
function player(state,idOrName){
  if (!state || !idOrName) return null;
  const map = getPlayerMap(state);
  const found = map.get(idOrName) || map.get(String(idOrName).toLowerCase());
  if (found) return found;
  const sName = slug(idOrName);
  return state.market.find(p=>p.id===idOrName||slug(p.name)===sName);
}
function clubPlayers(state,c){
  if (!state || !c || !Array.isArray(c.players)) return [];
  const map = getPlayerMap(state);
  const res = [];
  for (let i = 0; i < c.players.length; i++) {
    const pid = c.players[i];
    const p = map.get(pid) || map.get(String(pid).toLowerCase()) || player(state, pid);
    if (p) res.push(p);
  }
  return res;
}
function addNews(state,text,type='world'){state.news.unshift({id:id('news'),season:state.season,type,text,at:new Date().toISOString()});state.news=state.news.slice(0,100);}
let persistTimeout = null;
function persist(){
  if (persistTimeout) return;
  persistTimeout = setTimeout(() => {
    persistTimeout = null;
    try {
      const data = {
        rooms: [...worldRooms.entries()].map(([k,v])=>[k,v]),
        solo: [...soloWorlds.entries()].map(([k,v])=>[k,v])
      };
      fs.writeFile(SAVE, JSON.stringify(data), err => {
        if (err) console.error('[WorldEngine] Persist error:', err.message);
      });
    } catch(e) {
      console.error('[WorldEngine]', e.message);
    }
  }, 100);
}
function persistSync(){
  try {
    const data = {
      rooms: [...worldRooms.entries()].map(([k,v])=>[k,v]),
      solo: [...soloWorlds.entries()].map(([k,v])=>[k,v])
    };
    fs.writeFileSync(SAVE, JSON.stringify(data));
  } catch(e){}
}
function createRoom(name,maxHumans,host){let code='';do{code=Math.random().toString(36).slice(2,8).toUpperCase()}while(worldRooms.has(code));const s=makeState('online',code);s.roomName=name||'Friends Football League';s.maxHumans=Math.min(20,Math.max(2,Number(maxHumans)||10));s.humans={};s.host=host||null;worldRooms.set(code,s);persist();return s;}
function createSolo(){const sid=id('solo');const s=makeState('solo',null);s.soloId=sid;soloWorlds.set(sid,s);persist();return s;}
function getWorld(ref){
  let w = null;
  if(ref?.room&&worldRooms.has(ref.room)) w = worldRooms.get(ref.room);
  else if(ref?.soloId&&soloWorlds.has(ref.soloId)) w = soloWorlds.get(ref.soloId);
  else if(!ref?.room && !ref?.soloId && soloWorlds.size > 0) {
    const allSolo = Array.from(soloWorlds.values());
    w = allSolo[allSolo.length - 1];
  }
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
    existing.division = 3; // Enforced starting tier: Division 3
    existing.fanSatisfaction = existing.fanSatisfaction || 80;
    existing.popularity = existing.popularity || Math.round((existing.reputation || 60) * 0.85 + 6);
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
    setupClubRivalries(s.clubs);
    if(s.mode==='online'&&managerId&&s.humans?.[managerId])s.humans[managerId].club=existing.name;
    addNews(s,`${existing.name} has appointed a new sovereign owner in Division 3.`,'club');
    persist();
    return existing;
  }
  const c={
    name:String(data.name).slice(0,30),
    country:data.country||'India',
    league:data.league||'ISL',
    division: 3, // Enforced starting tier: Division 3
    reputation:55,
    fans:12000,
    fanSatisfaction:80,
    popularity:52,
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
    cash: 8.5, // Realistic 3rd division starting budget
    players:[],
    history:{titles:0,cups:0,promotions:0,relegations:0},
    stats:{wins:0,draws:0,losses:0,points:0},
    online:true
  };
  s.clubs.push(c);
  s.selectedClub=c.name;
  setupClubRivalries(s.clubs);
  seedSquad(c, s.market, 16);
  recordTransaction(c, c.cash, 'starting_capital', 'Division 3 Boardroom Capital Allocation', s);
  if(s.mode==='online'&&managerId&&s.humans?.[managerId])s.humans[managerId].club=c.name;
  const higherRival = c.rivals?.higher?.name || 'Higher Division Giants';
  const lowerRival = c.rivals?.lower?.name || 'Local Grassroots Challengers';
  addNews(s,`${c.name} has been founded in ${c.country} Division 3 (₹8.5M Treasury, 16-man squad). Designated Rivals: ${higherRival} (Goliath) & ${lowerRival} (Grassroots).`,'club');
  persist();
  return c;
}
function chooseClub(s,name,managerId){
  const c=club(s,name);
  if(!c)return {error:'Club not found.'};
  s.selectedClub=c.name;
  c.online=true;
  c.division = 3; // Enforced starting tier: Division 3
  if (c.cash > 10.5) {
    c.cash = 8.5; // Enforced starting budget: 8.5M for Division 3
  }
  c.fanSatisfaction = c.fanSatisfaction || 80;
  c.popularity = c.popularity || Math.round((c.reputation || 60) * 0.85 + 6);
  setupClubRivalries(s.clubs);
  if (!c.transactions || !c.transactions.length) {
    recordTransaction(c, c.cash, 'starting_capital', 'Division 3 Boardroom Capital Allocation', s);
  }
  if(!c.players||c.players.length<16)seedSquad(c,s.market,16);
  rebalanceSquadToDivision(s, c);
  (c.players || []).forEach(pid => {
    const p = player(s, pid);
    if (p) {
      p.ownerClub = c.name;
      p.status = 'contracted';
    }
  });
  const myP = (c.players || []).map(pid => player(s, pid)).filter(Boolean);
  if (myP.length > 0) {
    c.rating = Math.round(myP.reduce((sum, p) => sum + (p.rating || 62), 0) / myP.length);
  }
  if(s.mode==='online'&&managerId&&s.humans?.[managerId])s.humans[managerId].club=c.name;
  persist();
  return c;
}
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
function releasePlayer(s,clubName,playerId){
  const c=club(s,clubName),p=player(s,playerId);
  if(!c||!p||p.ownerClub!==c.name)return {error:'Player not owned by this club.'};
  c.players=c.players.filter(x=>x!==p.id);
  p.ownerClub=null;
  p.loanClub=null;
  p.askingPrice=Math.max(2,Math.round(p.rating/20));
  
  const appearances = p.appearances || 0;
  const goals = p.goalsScored || 0;
  const cost = p.signingCost || p.askingPrice || 5;
  const merchSales = p.merchandiseSales || Math.round((Math.max(1, p.rating - 65) * 0.18 + appearances * 0.15) * 10) / 10;

  let verdict = 'SQUAD SERVANT';
  let verdictBadge = '⚖️ RESPECTED SERVANT';
  let verdictDesc = 'Fulfilled squad rotation duty professionally.';
  let fanSatDelta = 0;
  let fanReaction = 'Neutral Reaction from the Terraces';

  if (appearances < 4 && (cost >= 8 || (p.contract?.salary || 0) >= 1.8)) {
    verdict = 'EXPENSIVE FLOP';
    verdictBadge = '💥 EXPENSIVE FLOP';
    verdictDesc = `Cost ₹${cost}M and heavy wages but only managed ${appearances} appearances. Supporters celebrate clearing unproductive deadwood!`;
    fanSatDelta = +6;
    fanReaction = 'Supporters Rejoice (+6% Fan Satisfaction)';
  } else if (appearances <= 1 && p.rating <= 72) {
    verdict = 'SQUAD FLOP';
    verdictBadge = '❌ SQUAD FLOP';
    verdictDesc = `Failed to leave any mark on matchdays. Departure cleans up wage bill.`;
    fanSatDelta = +2;
    fanReaction = 'Supporters Relieved (+2% Fan Satisfaction)';
  } else if (appearances >= 8 || goals >= 5) {
    verdict = 'CULT HERO';
    verdictBadge = '🔥 CULT HERO / FAN FAVORITE';
    verdictDesc = `Delivered memorable moments, ${goals} goals, and ₹${merchSales}M in shirt sales. Supporters are heartbroken to see an icon depart!`;
    fanSatDelta = -8;
    fanReaction = 'Supporters Mourn (-8% Fan Satisfaction)';
  } else if (merchSales >= 3.0) {
    verdict = 'COMMERCIAL SUCCESS';
    verdictBadge = '💰 MERCHANDISE SENSATION';
    verdictDesc = `Massive retail success! Generated ₹${merchSales}M in official shirt and merchandise sales.`;
    fanSatDelta = +1;
    fanReaction = 'Supporters Pleased (+1% Fan Satisfaction)';
  }

  c.fanSatisfaction = Math.max(10, Math.min(100, (c.fanSatisfaction || 78) + fanSatDelta));

  addNews(s, `${p.name} released by ${c.name}. Legacy Verdict: ${verdictBadge}. ${fanReaction}.`, 'transfer');
  persist();
  return {
    player: p,
    verdict,
    verdictBadge,
    verdictDesc,
    fanReaction,
    fanSatisfaction: c.fanSatisfaction,
    merchSales,
    appearances,
    goals
  };
}
function updatePlayerSalary(s, clubName, playerId, newSalary, signingBonus = 0) {
  const c = club(s, clubName);
  if (!c) return { error: 'Club not found.' };
  const p = player(s, playerId);
  if (!p) return { error: 'Player not found.' };
  if (p.ownerClub !== c.name) return { error: 'Player is not owned by this club.' };

  const parsedSalary = Math.max(0.2, Math.round(Number(newSalary) * 10) / 10);
  const parsedBonus = Math.max(0, Math.round(Number(signingBonus) * 10) / 10);

  if (parsedBonus > 0 && (c.cash || 0) < parsedBonus) {
    return { error: `Insufficient treasury funds! Club cash is ₹${c.cash}M, needed ₹${parsedBonus}M.` };
  }

  const oldSalary = p.contract?.salary || Math.max(0.4, Math.round((p.askingPrice || 5) * 0.15 * 10) / 10);
  p.contract = p.contract || {};
  p.contract.salary = parsedSalary;
  p.contract.years = Math.max(1, (p.contract.years || 2) + 1);

  if (parsedBonus > 0) {
    c.cash = Math.max(0, Math.round(((c.cash || 0) - parsedBonus) * 10) / 10);
    recordTransaction(c, -parsedBonus, 'transfers', `Contract extension bonus: ${p.name}`, s);
  }

  const diff = Math.round((parsedSalary - oldSalary) * 10) / 10;
  recordTransaction(c, 0, 'commercial', `Wage adjusted for ${p.name}: ₹${parsedSalary}M/yr (${diff >= 0 ? '+' : ''}₹${diff}M)`, s);
  addNews(s, `${c.name} finalized contract extension for ${p.name} on ₹${parsedSalary}M/yr wage terms.`, 'transfer');

  c.morale = Math.min(100, Math.max(20, (c.morale || 80) + (diff >= 0 ? 3 : -2)));
  persist();
  return {
    ok: true,
    player: p,
    oldSalary,
    newSalary: parsedSalary,
    signingBonus: parsedBonus,
    club: c,
    budget: calculateClubBudget(s, c)
  };
}
function sellPlayer(s,clubName,playerId,asking){const c=club(s,clubName),p=player(s,playerId);if(!c||!p||p.ownerClub!==c.name)return {error:'Player not owned by this club.'};p.askingPrice=Math.max(1,money(asking)||p.askingPrice);return startBattle(s,'FREE_MARKET_BUYER',p.id,p.askingPrice,p.contract.salary,p.contract.years,'sell');}
function match(s,homeName,awayName,opts={}){
  const h=club(s,homeName),a=club(s,awayName);
  if(!h||!a)return {error:'Clubs not found.'};
  const mid=id('match');
  const isCup = !!opts.isCup;

  // Multi-tier derby detection: same-division, higher-division giant, or lower-division underdog
  let isDerby = (h.rivalName === a.name || a.rivalName === h.name);
  let derbyTier = 'same';
  let derbyTitle = h.derbyName || a.derbyName || `${h.name} vs ${a.name} Derby`;

  if (h.rivals) {
    if (h.rivals.higher?.name === a.name) {
      isDerby = true;
      derbyTier = 'higher';
      derbyTitle = h.rivals.higher.derbyName || `${h.name} vs ${a.name} Goliath Clash`;
    } else if (h.rivals.lower?.name === a.name) {
      isDerby = true;
      derbyTier = 'lower';
      derbyTitle = h.rivals.lower.derbyName || `${h.name} vs ${a.name} Grassroots Derby`;
    } else if (h.rivals.same?.name === a.name) {
      isDerby = true;
      derbyTier = 'same';
      derbyTitle = h.rivals.same.derbyName || derbyTitle;
    }
  } else if (a.rivals) {
    if (a.rivals.higher?.name === h.name) {
      isDerby = true;
      derbyTier = 'higher';
      derbyTitle = a.rivals.higher.derbyName || `${a.name} vs ${h.name} Goliath Clash`;
    } else if (a.rivals.lower?.name === h.name) {
      isDerby = true;
      derbyTier = 'lower';
      derbyTitle = a.rivals.lower.derbyName || `${a.name} vs ${h.name} Grassroots Derby`;
    }
  }

  const compName = opts.competitionName || (isCup ? `${h.country || 'National'} FA Cup · Knockout Tie` : (isDerby ? `🔥 ${derbyTitle}` : `Division ${h.division} League`));
  
  const getRating = c => {
    const players = clubPlayers(s, c);
    const squadOvr = players.length ? Math.round(players.reduce((sum, p) => sum + (p.rating || 70), 0) / players.length) : (c.reputation || 65);
    return 40 + (squadOvr * 0.4) + ((c.reputation || 65) * 0.2) + ((c.morale || 70) * 0.1);
  };

  const hr = getRating(h);
  const ar = getRating(a);
  let hg = Math.max(0, Math.min(6, Math.floor(Math.random() * 2.8 + (hr > ar ? 0.8 : 0))));
  let ag = Math.max(0, Math.min(6, Math.floor(Math.random() * 2.8 + (ar > hr ? 0.8 : 0))));

  let penalties = null;
  let cupWinner = null;
  if (isCup && hg === ag) {
    const hp = 3 + Math.floor(Math.random() * 3);
    let ap = 3 + Math.floor(Math.random() * 3);
    if (hp === ap) ap = (Math.random() > 0.5) ? hp - 1 : hp + 1;
    penalties = { home: hp, away: ap };
    cupWinner = hp > ap ? h.name : a.name;
  } else if (isCup) {
    cupWinner = hg > ag ? h.name : a.name;
  }

  // Update stats if it is a LEAGUE match:
  if (!isCup) {
    h.stats.wins += hg > ag ? 1 : 0;
    h.stats.draws += hg === ag ? 1 : 0;
    h.stats.losses += hg < ag ? 1 : 0;
    h.stats.points += hg > ag ? 3 : hg === ag ? 1 : 0;

    a.stats.wins += ag > hg ? 1 : 0;
    a.stats.draws += hg === ag ? 1 : 0;
    a.stats.losses += ag < hg ? 1 : 0;
    a.stats.points += ag > hg ? 3 : ag === hg ? 1 : 0;
  } else {
    // Domestic Cup prize money & trophy tracking
    if (opts.cupStage === 'FA Cup Final') {
      const winnerClub = (cupWinner === h.name) ? h : a;
      winnerClub.history.cups = (winnerClub.history.cups || 0) + 1;
      winnerClub.cash = Math.round((winnerClub.cash + 8) * 10) / 10;
      recordTransaction(winnerClub, 8, 'cup_prize', 'FA Cup Champions Prize Money!', s);
      addNews(s, `🏆 ${winnerClub.name} are crowned FA Cup Champions! Awarded ₹8M in prize money!`, 'competition');
    } else {
      const winnerClub = (cupWinner === h.name) ? h : a;
      winnerClub.cash = Math.round((winnerClub.cash + 1.5) * 10) / 10;
      recordTransaction(winnerClub, 1.5, 'cup_prize', `FA Cup Knockout Prize (${opts.cupStage || 'Progress'})`, s);
    }
  }

  let attendance = Math.min(h.stadium.capacity, Math.round(h.stadium.capacity * (0.45 + (h.reputation||60) / 220 + (h.fans||15000) / 300000)));
  if (isDerby) attendance = h.stadium.capacity; // Packed to rafters!
  const revPerTicket = Math.max(90, h.ticketPrice || 200);
  let revenue = Math.round((attendance * revPerTicket / 1000000) * 10) / 10;
  if (isDerby) revenue = Math.round(revenue * 1.25 * 10) / 10; // 25% derby surge
  h.cash = Math.round((h.cash + revenue) * 10) / 10;
  recordTransaction(h, revenue, 'ticket_sales', `Matchday Gate Revenue vs ${a.name} (${attendance.toLocaleString()} attendance)`, s);
  h.lastAttendance = attendance;
  h.lastRevenue = revenue;
  h.morale = Math.max(30, Math.min(100, h.morale + (hg > ag ? 4 : hg === ag ? 1 : -4)));

  // Fan satisfaction and rivalry dynamics
  if (isDerby) {
    // Update Head-to-Head across all rival tiers
    [h, a].forEach(clubItem => {
      if (!clubItem.rivals) return;
      const oppName = (clubItem.name === h.name) ? a.name : h.name;
      const isWinner = (clubItem.name === h.name) ? (hg > ag || cupWinner === h.name) : (ag > hg || cupWinner === a.name);
      const isDraw = hg === ag && !cupWinner;
      ['same', 'higher', 'lower'].forEach(tierKey => {
        const r = clubItem.rivals[tierKey];
        if (r && r.name === oppName) {
          r.h2h = r.h2h || { played: 0, wins: 0, draws: 0, losses: 0 };
          r.h2h.played += 1;
          if (isWinner) r.h2h.wins += 1;
          else if (isDraw) r.h2h.draws += 1;
          else r.h2h.losses += 1;
        }
      });
    });

    if (hg > ag || cupWinner === h.name) {
      h.fanSatisfaction = Math.min(100, (h.fanSatisfaction || 75) + 18);
      a.fanSatisfaction = Math.max(10, (a.fanSatisfaction || 75) - 18);
      h.morale = Math.min(100, h.morale + 12);
      a.morale = Math.max(25, a.morale - 12);
      h.cash = Math.round((h.cash + 1.5) * 10) / 10;
      recordTransaction(h, 1.5, 'derby_bonus', `Derby Victory Prize: ${derbyTitle}`, s);
      if (derbyTier === 'higher' && h.division > a.division) {
        h.cash = Math.round((h.cash + 1.5) * 10) / 10;
        h.fanSatisfaction = Math.min(100, (h.fanSatisfaction || 75) + 10);
        recordTransaction(h, 1.5, 'derby_bonus', `Giant-Killing Goliath Sensation vs ${a.name}!`, s);
      }
      if (!opts.isAiOnly) addNews(s, `💥 DERBY GLORY: ${h.name} triumph over rivals ${a.name} in ${derbyTitle}! (+18% Fan Satisfaction, +₹1.5M Bonus)`, 'match');
    } else if (ag > hg || cupWinner === a.name) {
      a.fanSatisfaction = Math.min(100, (a.fanSatisfaction || 75) + 18);
      h.fanSatisfaction = Math.max(10, (h.fanSatisfaction || 75) - 18);
      a.morale = Math.min(100, a.morale + 12);
      h.morale = Math.max(25, h.morale - 12);
      a.cash = Math.round((a.cash + 1.5) * 10) / 10;
      recordTransaction(a, 1.5, 'derby_bonus', `Derby Glory Away Victory vs ${h.name}`, s);
      if (derbyTier === 'higher' && a.division > h.division) {
        a.cash = Math.round((a.cash + 1.5) * 10) / 10;
        a.fanSatisfaction = Math.min(100, (a.fanSatisfaction || 75) + 10);
        recordTransaction(a, 1.5, 'derby_bonus', `Giant-Killing Goliath Sensation vs ${h.name}!`, s);
      }
      if (!opts.isAiOnly) addNews(s, `💥 DERBY GLORY: ${a.name} conquer rivals ${h.name} on away soil in ${derbyTitle}! (+18% Fan Satisfaction, +₹1.5M Bonus)`, 'match');
    } else {
      if (!opts.isAiOnly) addNews(s, `⚖️ DERBY DEADLOCK: ${h.name} and ${a.name} battle to a fierce ${hg}-${ag} stalemate in ${derbyTitle}.`, 'match');
    }
  } else if (!isCup) {
    if (hg > ag) {
      h.fanSatisfaction = Math.min(100, (h.fanSatisfaction || 75) + 3);
      a.fanSatisfaction = Math.max(10, (a.fanSatisfaction || 75) - 3);
    } else if (ag > hg) {
      a.fanSatisfaction = Math.min(100, (a.fanSatisfaction || 75) + 3);
      h.fanSatisfaction = Math.max(10, (h.fanSatisfaction || 75) - 3);
    }
  }

  // Update player appearances, goals, assists, clean sheets, and merchandise sales
  const hPlayers = clubPlayers(s, h).slice(0, 11);
  const aPlayers = clubPlayers(s, a).slice(0, 11);
  [...hPlayers, ...aPlayers].forEach(p => {
    p.appearances = (p.appearances || 0) + 1;
    p.awards = Array.isArray(p.awards) ? p.awards : [];
    const addMerch = Math.round((Math.max(0, (p.rating || 65) - 60) * 0.005 + ((p.form || 70) / 100) * 0.004) * 100) / 100;
    p.merchandiseSales = Math.round(((p.merchandiseSales || 0) + addMerch) * 10) / 10;
  });

  if (hg > 0 && hPlayers.length > 0) {
    const hAttackers = hPlayers.filter(p => ['CF', 'LWF', 'RWF', 'AMF', 'SS', 'ST'].includes(p.position));
    const hScorers = hAttackers.length ? hAttackers : hPlayers;
    for (let g = 0; g < hg; g++) {
      const scorer = hScorers[Math.floor(Math.random() * hScorers.length)];
      scorer.goalsScored = (scorer.goalsScored || 0) + 1;
      const hPlaymakers = hPlayers.filter(p => p.id !== scorer.id && ['CMF', 'AMF', 'DMF', 'LWF', 'RWF'].includes(p.position));
      if (hPlaymakers.length && Math.random() < 0.75) {
        const assister = hPlaymakers[Math.floor(Math.random() * hPlaymakers.length)];
        assister.assists = (assister.assists || 0) + 1;
      }
    }
  }

  if (ag > 0 && aPlayers.length > 0) {
    const aAttackers = aPlayers.filter(p => ['CF', 'LWF', 'RWF', 'AMF', 'SS', 'ST'].includes(p.position));
    const aScorers = aAttackers.length ? aAttackers : aPlayers;
    for (let g = 0; g < ag; g++) {
      const scorer = aScorers[Math.floor(Math.random() * aScorers.length)];
      scorer.goalsScored = (scorer.goalsScored || 0) + 1;
      const aPlaymakers = aPlayers.filter(p => p.id !== scorer.id && ['CMF', 'AMF', 'DMF', 'LWF', 'RWF'].includes(p.position));
      if (aPlaymakers.length && Math.random() < 0.75) {
        const assister = aPlaymakers[Math.floor(Math.random() * aPlaymakers.length)];
        assister.assists = (assister.assists || 0) + 1;
      }
    }
  }

  // Clean sheet tracking
  if (ag === 0 && hPlayers.length) {
    const hGk = hPlayers.find(p => p.position === 'GK') || hPlayers[0];
    hGk.cleanSheets = (hGk.cleanSheets || 0) + 1;
  }
  if (hg === 0 && aPlayers.length) {
    const aGk = aPlayers.find(p => p.position === 'GK') || aPlayers[0];
    aGk.cleanSheets = (aGk.cleanSheets || 0) + 1;
  }

  const matchRecord = {
    id: mid,
    home: h.name,
    away: a.name,
    homeGoals: hg,
    awayGoals: ag,
    isCup,
    isDerby,
    derbyName: isDerby ? derbyTitle : null,
    competitionName: compName,
    cupStage: opts.cupStage || null,
    penalties,
    cupWinner,
    attendance,
    revenue,
    season: s.season
  };

  s.matchIds[mid] = matchRecord;
  if (!opts.isAiOnly && !isDerby) {
    addNews(s, `[${isCup ? 'FA CUP' : 'LEAGUE'}] ${h.name} ${hg}-${ag} ${a.name}${penalties ? ` (${penalties.home}-${penalties.away} pens)` : ''}. Gate: ₹${revenue}M.`, 'match');
  }
  return matchRecord;
}

function getNextFixture(s) {
  const user = club(s, s?.selectedClub);
  if (!user) return null;
  const matchday = (s.matchday || 0) + 1;

  let isGlobalCup = false;
  let gtOpponent = null;
  let gtStage = '';

  if (!s.globalTournament && (s.season % 2 === 0 || s.matchday >= 5)) {
    try { initiateGlobalTournament(s); } catch (e) {}
  }

  if (s.globalTournament && s.globalTournament.status !== 'completed') {
    const gt = s.globalTournament;
    let userInGroup = null;
    if (gt.status === 'groups') {
      ['A', 'B', 'C', 'D'].forEach(k => {
        if (gt.groups[k]?.standings.some(x => x.clubName === user.name)) {
          userInGroup = k;
        }
      });
      if (userInGroup) {
        if (matchday % 3 === 0 && (gt.currentRound || 1) <= 3) {
          isGlobalCup = true;
          gtStage = `Group ${userInGroup} · Matchday ${gt.currentRound || 1}`;
          const grp = gt.groups[userInGroup];
          const clubsInGroup = grp.standings;
          let pairs = [];
          if (gt.currentRound === 1) pairs = [[0, 1], [2, 3]];
          else if (gt.currentRound === 2) pairs = [[0, 2], [1, 3]];
          else pairs = [[0, 3], [1, 2]];
          const userIdx = clubsInGroup.findIndex(x => x.clubName === user.name);
          const pair = pairs.find(p => p.includes(userIdx));
          if (pair) {
            const oppIdx = pair[0] === userIdx ? pair[1] : pair[0];
            gtOpponent = club(s, clubsInGroup[oppIdx]?.clubName);
          }
        }
      }
    } else if (gt.status === 'knockout') {
      const ko = gt.knockout;
      let userKoMatch = null;
      let koStageName = '';
      if (ko.quarterFinals?.length && ko.quarterFinals.some(m => !m.completed && (m.home === user.name || m.away === user.name))) {
        userKoMatch = ko.quarterFinals.find(m => !m.completed && (m.home === user.name || m.away === user.name));
        koStageName = 'Quarter-Final';
      } else if (ko.semiFinals?.length && ko.semiFinals.some(m => !m.completed && (m.home === user.name || m.away === user.name))) {
        userKoMatch = ko.semiFinals.find(m => !m.completed && (m.home === user.name || m.away === user.name));
        koStageName = 'Semi-Final';
      } else if (ko.final && !ko.final.completed && (ko.final.home === user.name || ko.final.away === user.name)) {
        userKoMatch = ko.final;
        koStageName = 'Grand Final';
      }
      if (userKoMatch && (matchday % 3 === 0)) {
        isGlobalCup = true;
        gtStage = koStageName;
        const oppName = userKoMatch.home === user.name ? userKoMatch.away : userKoMatch.home;
        gtOpponent = club(s, oppName);
      }
    }
  }

  let compType = 'league';
  let compLabel = 'REGULAR LEAGUE MATCH';
  let compBadgeColor = '#38bdf8';
  let compStage = `Matchday ${Math.ceil(matchday * 0.75)}`;
  let opp = null;
  let winBonus = 0.5;
  let stakes = '+3 Points in Division Standings';

  if (isGlobalCup && gtOpponent) {
    compType = 'global_cup';
    compLabel = 'GLOBAL CLUB WORLD CUP';
    compBadgeColor = '#f59e0b';
    compStage = gtStage;
    opp = gtOpponent;
    winBonus = 12.5;
    stakes = `Global Cup Group/Knockout Progression · ₹${winBonus}M Bonus`;
  } else if ((user.division === 1 || (user.reputation || 60) >= 80) && (matchday % 4 === 0)) {
    compType = 'champions_league';
    compLabel = 'UEFA CHAMPIONS LEAGUE';
    compBadgeColor = '#818cf8';
    compStage = matchday <= 8 ? `Group Stage · MD ${Math.ceil(matchday / 4)}` : matchday === 12 ? 'Quarter-Final' : 'European Semi-Final';
    winBonus = 8.0;
    stakes = 'European Prestige & Continental Progression';
    const foreignPool = s.clubs.filter(c => c.name !== user.name && c.country !== user.country && c.division === 1);
    opp = foreignPool[matchday % (foreignPool.length || 1)] || s.clubs.find(c => c.name !== user.name);
  } else if (user.division === 2 && (matchday % 4 === 0)) {
    compType = 'conference_league';
    compLabel = 'UEFA CONFERENCE LEAGUE';
    compBadgeColor = '#10b981';
    compStage = matchday <= 8 ? `Group Stage · MD ${Math.ceil(matchday / 4)}` : 'Knockout Playoff';
    winBonus = 4.0;
    stakes = 'Continental Conference Advancement';
    const foreignPool = s.clubs.filter(c => c.name !== user.name && c.country !== user.country && c.division <= 2);
    opp = foreignPool[matchday % (foreignPool.length || 1)] || s.clubs.find(c => c.name !== user.name);
  } else if (matchday % 4 === 0) {
    compType = 'domestic_cup';
    compLabel = 'DOMESTIC FA CUP';
    compBadgeColor = '#ef4444';
    compStage = matchday === 4 ? 'Round of 16' : matchday === 8 ? 'Quarter-Final' : matchday === 12 ? 'Semi-Final' : 'Cup Final';
    winBonus = 2.0;
    stakes = 'Knockout Cup Tie · Single-Leg Elimination';
    const cupPool = s.clubs.filter(c => c.name !== user.name && c.country === user.country);
    opp = cupPool[matchday % (cupPool.length || 1)] || s.clubs.find(c => c.name !== user.name);
  } else {
    const leagueClubs = s.clubs.filter(c => c.country === user.country && c.division === user.division && c.name !== user.name);
    const rival = leagueClubs.find(c => c.name === user.rivalName);
    if (rival && (matchday === 3 || matchday === 7 || matchday === 11)) {
      opp = rival;
      stakes = `🔥 HEATED LOCAL DERBY vs ${rival.name} (+3 Pts & Fan Pride)`;
    } else {
      opp = leagueClubs[matchday % (leagueClubs.length || 1)] || s.clubs.find(c => c.name !== user.name);
    }
  }

  if (!opp) opp = s.clubs.find(c => c.name !== user.name) || { name: 'Rival FC', country: user.country, division: user.division, reputation: 60 };

  const isHome = matchday % 2 !== 0;
  const oppPlayers = clubPlayers(s, opp);
  const oppOvr = oppPlayers.length ? Math.round(oppPlayers.reduce((a, b) => a + b.rating, 0) / oppPlayers.length) : (opp.reputation || 60);
  const oppKeyPlayer = oppPlayers.sort((a, b) => b.rating - a.rating)[0];

  const userPlayers = clubPlayers(s, user);
  const userOvr = userPlayers.length ? Math.round(userPlayers.reduce((a, b) => a + b.rating, 0) / userPlayers.length) : 64;

  return {
    matchday,
    compType,
    compLabel,
    compBadgeColor,
    compStage,
    fullTitle: `${compLabel} · ${compStage}`,
    isHome,
    stadium: isHome ? (user.stadium?.name || `${user.name} Ground`) : (opp.stadium?.name || `${opp.name} Arena`),
    homeTeam: isHome ? user.name : opp.name,
    awayTeam: isHome ? opp.name : user.name,
    userTeam: {
      name: user.name,
      division: user.division,
      rating: userOvr,
      crest: user.crest || 'crest_lion',
      jersey: user.jersey || { home: '#0f172a' }
    },
    opponent: {
      name: opp.name,
      country: opp.country,
      division: opp.division,
      reputation: opp.reputation || 60,
      crest: opp.crest || 'crest_lion',
      jersey: opp.jersey || { home: '#1e293b' },
      rating: oppOvr,
      keyPlayer: oppKeyPlayer ? { name: oppKeyPlayer.name, rating: oppKeyPlayer.rating, position: oppKeyPlayer.position } : null
    },
    stakes,
    winBonus
  };
}

function simulate(s){
  const user = club(s, s.selectedClub);
  if (!user) return { error: 'Choose a club first.' };

  const fixture = getNextFixture(s);
  if (!fixture) return { error: 'Fixture schedule unavailable.' };

  s.matchday = (s.matchday || 0) + 1;
  let matchResult = null;
  const otherResults = [];

  if (fixture.compType === 'global_cup') {
    matchResult = match(s, fixture.homeTeam, fixture.awayTeam, {
      isCup: true,
      competitionName: fixture.fullTitle
    });

    const gt = s.globalTournament;
    if (gt && gt.status === 'groups') {
      const gKeys = ['A', 'B', 'C', 'D'];
      gKeys.forEach(gKey => {
        const grp = gt.groups[gKey];
        if (!grp) return;
        const clubsInGroup = grp.standings;
        let pairs = [];
        if (gt.currentRound === 1) pairs = [[0, 1], [2, 3]];
        else if (gt.currentRound === 2) pairs = [[0, 2], [1, 3]];
        else pairs = [[0, 3], [1, 2]];

        pairs.forEach(([i1, i2]) => {
          const c1Name = clubsInGroup[i1].clubName;
          const c2Name = clubsInGroup[i2].clubName;
          if ((c1Name === fixture.homeTeam && c2Name === fixture.awayTeam) || (c2Name === fixture.homeTeam && c1Name === fixture.awayTeam)) {
            const s1 = clubsInGroup[i1];
            const s2 = clubsInGroup[i2];
            const hg = c1Name === fixture.homeTeam ? matchResult.homeGoals : matchResult.awayGoals;
            const ag = c1Name === fixture.homeTeam ? matchResult.awayGoals : matchResult.homeGoals;
            s1.played++; s2.played++;
            s1.gf += hg; s1.ga += ag; s1.gd = s1.gf - s1.ga;
            s2.gf += ag; s2.ga += hg; s2.gd = s2.gf - s2.ga;
            if (hg > ag) { s1.won++; s1.points += 3; s2.lost++; }
            else if (hg < ag) { s2.won++; s2.points += 3; s1.lost++; }
            else { s1.drawn++; s2.drawn++; s1.points++; s2.points++; }
          } else {
            const res = match(s, c1Name, c2Name, { isCup: true, competitionName: `Global Cup · Group ${gKey}`, isAiOnly: true });
            otherResults.push({ home: c1Name, away: c2Name, homeGoals: res.homeGoals, awayGoals: res.awayGoals });
            const s1 = clubsInGroup[i1];
            const s2 = clubsInGroup[i2];
            s1.played++; s2.played++;
            s1.gf += res.homeGoals; s1.ga += res.awayGoals; s1.gd = s1.gf - s1.ga;
            s2.gf += res.awayGoals; s2.ga += res.homeGoals; s2.gd = s2.gf - s2.ga;
            if (res.homeGoals > res.awayGoals) { s1.won++; s1.points += 3; s2.lost++; }
            else if (res.homeGoals < res.awayGoals) { s2.won++; s2.points += 3; s1.lost++; }
            else { s1.drawn++; s2.drawn++; s1.points++; s2.points++; }
          }
        });
        grp.standings.sort((a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf);
      });

      gt.currentRound = (gt.currentRound || 1) + 1;
      if (gt.currentRound > 3) {
        gt.status = 'knockout';
        const qf = [];
        const topClubs = [];
        ['A', 'B', 'C', 'D'].forEach(k => {
          topClubs.push(gt.groups[k].standings[0].clubName);
          topClubs.push(gt.groups[k].standings[1].clubName);
        });
        qf.push({ id: 'gt_qf_1', home: topClubs[0], away: topClubs[3], homeGoals: null, awayGoals: null, completed: false });
        qf.push({ id: 'gt_qf_2', home: topClubs[2], away: topClubs[1], homeGoals: null, awayGoals: null, completed: false });
        qf.push({ id: 'gt_qf_3', home: topClubs[4], away: topClubs[7], homeGoals: null, awayGoals: null, completed: false });
        qf.push({ id: 'gt_qf_4', home: topClubs[6], away: topClubs[5], homeGoals: null, awayGoals: null, completed: false });
        gt.knockout.quarterFinals = qf;
        addNews(s, '🌍 GLOBAL CUP: Group Stage concludes! Quarter-Final matchups are officially drawn.', 'competition');
      }
    }

    if ((matchResult.home === user.name && matchResult.homeGoals > matchResult.awayGoals) || (matchResult.away === user.name && matchResult.awayGoals > matchResult.homeGoals)) {
      recordTransaction(user, fixture.winBonus, 'tournament_prize', `Global Cup Victory: ${fixture.compStage}`, s);
      addNews(s, `🏆 GLOBAL CUP WIN: ${user.name} triumph in the Global Cup (+₹${fixture.winBonus}M Prize Money)!`, 'club');
    }
  } else if (fixture.compType === 'champions_league' || fixture.compType === 'conference_league') {
    matchResult = match(s, fixture.homeTeam, fixture.awayTeam, {
      isCup: true,
      competitionName: fixture.fullTitle
    });
    if ((matchResult.home === user.name && matchResult.homeGoals > matchResult.awayGoals) || (matchResult.away === user.name && matchResult.awayGoals > matchResult.homeGoals)) {
      recordTransaction(user, fixture.winBonus, 'continental_prize', `${fixture.compLabel} Victory Bonus`, s);
      addNews(s, `⭐ EUROPEAN GLORY: ${user.name} victorious against ${fixture.opponent.name} (+₹${fixture.winBonus}M)!`, 'club');
    }
  } else if (fixture.compType === 'domestic_cup') {
    matchResult = match(s, fixture.homeTeam, fixture.awayTeam, {
      isCup: true,
      cupStage: fixture.compStage,
      competitionName: fixture.fullTitle
    });
    if ((matchResult.home === user.name && matchResult.homeGoals > matchResult.awayGoals) || (matchResult.away === user.name && matchResult.awayGoals > matchResult.homeGoals)) {
      recordTransaction(user, fixture.winBonus, 'cup_prize', `FA Cup Victory: ${fixture.compStage}`, s);
    }
    const cupPool = s.clubs.filter(c => c.name !== fixture.homeTeam && c.name !== fixture.awayTeam && c.country === user.country);
    for (let i = 0; i < Math.min(4, cupPool.length - 1); i += 2) {
      const c1 = cupPool[i];
      const c2 = cupPool[i + 1];
      if (c1 && c2) {
        const res = match(s, c1.name, c2.name, { isCup: true, cupStage: fixture.compStage, competitionName: fixture.fullTitle, isAiOnly: true });
        otherResults.push({ home: c1.name, away: c2.name, homeGoals: res.homeGoals, awayGoals: res.awayGoals, penalties: res.penalties });
      }
    }
  } else {
    // League match
    matchResult = match(s, fixture.homeTeam, fixture.awayTeam, {
      isCup: false,
      competitionName: fixture.fullTitle,
      roundNumber: Math.ceil(s.matchday * 0.75)
    });

    const leagueClubs = s.clubs.filter(c => c.country === user.country && c.division === user.division && c.name !== fixture.homeTeam && c.name !== fixture.awayTeam);
    for (let i = 0; i < leagueClubs.length; i += 2) {
      if (i + 1 < leagueClubs.length) {
        const c1 = leagueClubs[i];
        const c2 = leagueClubs[i + 1];
        const res = match(s, c1.name, c2.name, { isCup: false, competitionName: fixture.fullTitle, roundNumber: Math.ceil(s.matchday * 0.75), isAiOnly: true });
        otherResults.push({ home: c1.name, away: c2.name, homeGoals: res.homeGoals, awayGoals: res.awayGoals });
      }
    }
  }

  matchResult.fixture = fixture;
  matchResult.compLabel = fixture.compLabel;
  matchResult.compType = fixture.compType;
  matchResult.compBadgeColor = fixture.compBadgeColor;
  matchResult.compStage = fixture.compStage;
  matchResult.otherResults = otherResults;

  if (s.transferWindowOpen && Math.random() < 0.45) {
    try { generateAiTransferApproaches(s, 1); } catch (err) {}
  }

  const nextFixture = getNextFixture(s);
  matchResult.nextFixture = nextFixture;

  if (s.managerCareer && matchResult) {
    try {
      updateManagerReputationAfterMatch(s, user, matchResult, fixture.compType !== 'league');
    } catch (e) {}
  }

  persist();
  return matchResult;
}

function createCustomPlayer(s, clubName, data) {
  const c = club(s, clubName);
  if (!c) return { error: 'Club not found.' };

  const name = String(data?.name || '').trim();
  if (!name || name.length < 2) return { error: 'Valid player name required (at least 2 characters).' };

  const pos = normalizePosition(data?.position || 'CF');
  const age = Math.max(16, Math.min(25, Number(data?.age) || 19));
  const nationality = String(data?.nationality || c.country || 'International').slice(0, 25);
  const style = String(data?.style || 'Poacher');

  // Division-scaled rating & academy development fee
  let maxRating = 72;
  let devCost = 0.5;
  if (c.division === 1) { maxRating = 83; devCost = 2.0; }
  else if (c.division === 2) { maxRating = 77; devCost = 1.0; }
  else if (c.division === 3) { maxRating = 72; devCost = 0.5; }
  else { maxRating = 68; devCost = 0.2; }

  const requestedRating = Math.max(62, Math.min(maxRating, Number(data?.rating) || (maxRating - 1)));
  if (c.cash < devCost) {
    return { error: `Need ₹${devCost}M in club treasury for youth academy graduation. Club has ₹${money(c.cash)}M.` };
  }

  c.cash = Math.max(0, Math.round((c.cash - devCost) * 10) / 10);

  const pid = `p_custom_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const salary = Math.max(0.3, Math.round(requestedRating * 0.04 * 10) / 10);
  const askingPrice = Math.max(1.5, Math.round((requestedRating - 58) * 0.7));

  const newPlayer = {
    id: pid,
    name,
    position: pos,
    rating: requestedRating,
    form: 82,
    age,
    nationality,
    askingPrice,
    ownerClub: c.name,
    loanClub: null,
    contract: {
      years: 4,
      salary,
      releaseClause: Math.round(askingPrice * 2.6)
    },
    mentality: data?.mentality || 'High Workrate',
    mentalityStrength: 85,
    playingTime: 80,
    personality: style,
    isCustomAcademy: true
  };

  s.market.unshift(newPlayer);
  c.players = c.players || [];
  c.players.push(pid);

  addNews(s, `🌟 ${c.name} promotes Academy Prodigy ${name} (${pos}, ${requestedRating} OVR, Age ${age}) to the first team!`, 'club');
  persist();
  return { player: newPlayer, club: c };
}

function dispatchScout(s, clubName, mission = {}) {
  const c = club(s, clubName);
  if (!c) return { error: 'Club not found.' };

  const cost = c.division === 1 ? 1.2 : c.division === 2 ? 0.6 : 0.25;
  if (c.cash < cost) {
    return { error: `Scouting mission costs ₹${cost}M. Club funds: ₹${money(c.cash)}M.` };
  }
  c.cash = Math.max(0, Math.round((c.cash - cost) * 10) / 10);
  recordTransaction(c, -cost, 'scouting_fee', `Chief Scout Dossier Fee (${focus.toUpperCase()})`, s);

  const focus = mission.focus || 'all';
  let candidates = s.market.filter(p => p.ownerClub !== c.name);
  if (focus === 'wonderkids') {
    candidates = candidates.filter(p => p.age <= 21);
  } else if (focus === 'bargains') {
    candidates = candidates.filter(p => p.askingPrice <= (c.division <= 2 ? 14 : 5));
  } else if (focus === 'attackers') {
    candidates = candidates.filter(p => ['CF', 'LWF', 'RWF'].includes(p.position));
  } else if (focus === 'midfielders') {
    candidates = candidates.filter(p => ['CMF', 'DMF', 'AMF'].includes(p.position));
  } else if (focus === 'defenders') {
    candidates = candidates.filter(p => ['CB', 'LB', 'RB', 'GK'].includes(p.position));
  }

  if (candidates.length < 5) {
    candidates = s.market.filter(p => p.ownerClub !== c.name);
  }

  const shuffled = [...candidates].sort(() => 0.5 - Math.random()).slice(0, 5);
  const reports = shuffled.map(p => {
    const potBonus = p.age <= 21 ? 8 + Math.floor(Math.random() * 7) : p.age <= 24 ? 4 + Math.floor(Math.random() * 4) : 1;
    const potential = Math.min(95, p.rating + potBonus);
    const recGrade = potential >= 88 ? 'A+ MUST SIGN' : potential >= 82 ? 'A TARGET' : p.askingPrice <= 4 ? 'A- BARGAIN' : 'B SQUAD DEPTH';
    
    return {
      player: p,
      potential: `${potential - 2}-${potential + 2}`,
      recommendationGrade: recGrade,
      estimatedWage: Math.max(0.4, Math.round((p.askingPrice || 5) * 0.16 * 10) / 10),
      scoutComment: potential >= 88 ? 'World-class ceiling. Exceptional acceleration and ball control. Priority target.' :
                    p.age <= 20 ? 'High-upside youth prospect with explosive ceiling. Will develop rapidly.' :
                    'Consistent performer ideally suited for tactical chemistry.'
    };
  });

  addNews(s, `🔭 ${c.name} Chief Scout completed dossier for ${focus.toUpperCase()}. 5 scouted targets submitted.`, 'scout');
  persist();
  return { cost, reports, treasury: c.cash };
}

function negotiateTransfer(s, buyerName, playerId, offer = {}) {
  const buyer = club(s, buyerName);
  const p = player(s, playerId);
  if (!buyer || !p) return { error: 'Club or player not found.' };

  const fee = Number(offer.fee) || 0;
  const salary = Number(offer.salary) || 0;
  const years = Number(offer.years) || 3;
  const seller = p.ownerClub ? club(s, p.ownerClub) : null;

  if (buyer.cash < fee) {
    return { error: `Insufficient treasury! Club has ₹${money(buyer.cash)}M, offer is ₹${money(fee)}M.` };
  }

  const askingFee = p.askingPrice || 10;
  const expectedSal = Math.max(1, Math.round(askingFee * 0.18));

  // RULE 1: Big Club Star Protection & Franchise Untouchables
  const isBigSeller = seller && (seller.division === 1 || (seller.reputation || 60) >= 78);
  const isUntouchable = p.untouchable || (p.rating >= 84) || (isBigSeller && p.rating >= 82);

  if (isBigSeller && isUntouchable) {
    p.untouchable = true;

    // Condition A: World-class stars will never drop to Division 2, 3, or 4
    if (buyer.division >= 2) {
      return {
        status: 'refused_prestige',
        message: `🚫 Untouchable Superstar: ${seller.name} and ${p.name} rejected your approach! "${p.name} (OVR ${p.rating}) is the untouchable franchise icon of our European campaign. World-class players will NEVER drop to Division ${buyer.division} football."`,
        player: p
      };
    }

    // Condition B: Squad lockdown quota (big clubs will not dismantle their squad by selling multiple marquee stars)
    seller.soldBigPlayersCount = seller.soldBigPlayersCount || 0;
    if (seller.soldBigPlayersCount >= 1) {
      return {
        status: 'refused_quota',
        message: `🚫 Squad Lockdown: ${seller.name} board issued a firm statement: "We have already sanctioned one marquee superstar sale this window and refuse to dismantle our core squad. ${p.name} is strictly NOT FOR SALE."`,
        player: p
      };
    }

    // Condition C: Astronomical buyout required for an untouchable
    const buyout = Math.round(askingFee * 2.5);
    if (fee < buyout) {
      return {
        status: 'refused_untouchable',
        message: `🔒 Franchise Superstar: ${seller.name} declared ${p.name} an Untouchable Icon. Only triggering their world-record buyout clause of ₹${buyout}M and record wages would open discussions.`,
        player: p,
        buyout
      };
    }
  }

  // Realistic third/fourth division ambition rejection for other players:
  if (p.rating >= 82 && buyer.division >= 3 && fee < p.askingPrice * 1.5) {
    return {
      status: 'rejected_division',
      message: `🚫 Player Rejected Terms: "${p.name} commands top-flight European prestige. My agent refuses to consider Division ${buyer.division} football unless you provide a record marquee package of at least ₹${Math.round(p.askingPrice * 1.6)}M fee and ₹${Math.round(p.askingPrice * 0.35)}M/yr salary!"`,
      player: p
    };
  }

  // RULE 2: Transfer Hijacking Alert!
  // When agreement conditions are met and it's not already a counter-hijack, 35% chance a rival clubs tries to hijack the transfer!
  if (fee >= askingFee && salary >= expectedSal && !offer.isCounterHijack && Math.random() < 0.35) {
    const pool = s.clubs.filter(c => c.name !== buyer.name && (!seller || c.name !== seller.name) && c.division <= buyer.division);
    const hijacker = (buyer.rivalName && Math.random() < 0.6 && s.clubs.find(c => c.name === buyer.rivalName))
      ? s.clubs.find(c => c.name === buyer.rivalName)
      : (pool[Math.floor(Math.random() * pool.length)] || s.clubs[0]);

    const hijackFee = Math.round(fee * 1.25);
    const hijackSalary = Math.round(salary * 1.3);

    return {
      status: 'hijacked',
      player: p,
      hijacker: hijacker.name,
      hijackFee,
      hijackSalary,
      yourBid: { fee, salary, years },
      message: `🚨 TRANSFER HIJACK ALERT! ${hijacker.name} have launched a shock 11th-hour hijack! They have tabled an offer of ₹${hijackFee}M with ₹${hijackSalary}M/yr salary at the player's medical! Match and outbid them to save the deal, or concede!`
    };
  }

  // CASE 1: Full acceptance!
  if (fee >= askingFee && salary >= expectedSal) {
    if (seller) {
      seller.players = seller.players.filter(x => x !== p.id);
      seller.cash = Math.round((seller.cash + fee) * 10) / 10;
      recordTransaction(seller, fee, 'player_sale', `Transfer Sale: ${p.name} sold to ${buyer.name}`, s);
      if (isUntouchable) seller.soldBigPlayersCount = (seller.soldBigPlayersCount || 0) + 1;
    }
    buyer.players.push(p.id);
    buyer.cash = Math.max(0, Math.round((buyer.cash - fee) * 10) / 10);
    recordTransaction(buyer, -fee, 'player_purchase', `Transfer Signing Fee: ${p.name} (from ${seller ? seller.name : 'Free Agent'})`, s);
    buyer.fanSatisfaction = Math.min(100, (buyer.fanSatisfaction || 78) + (offer.isCounterHijack ? 12 : p.rating >= 78 ? 6 : 3));

    p.ownerClub = buyer.name;
    p.loanClub = null;
    p.contract = { years, salary, releaseClause: Math.round(fee * 1.8) };
    p.signingCost = fee;
    p.appearances = 0;
    p.goalsScored = 0;
    p.merchandiseSales = 0;

    if (offer.isCounterHijack) {
      addNews(s, `🚨 HIJACK THWARTED! ${buyer.name} outbid rivals to dramatically sign ${p.name} for ₹${fee}M! Supporters celebrate the triumph! (+12% Fan Satisfaction)`, 'transfer');
    } else {
      addNews(s, `✍️ OFFICIAL: ${p.name} has completed a transfer to ${buyer.name} for ₹${fee}M on a ${years}-year contract!`, 'transfer');
    }
    if (s.managerCareer) {
      const repBoost = p.rating >= 80 ? 3 : p.rating >= 75 ? 2 : 1;
      s.managerCareer.reputation = Math.min(100, (s.managerCareer.reputation || 28) + repBoost);
      s.managerCareer.boardConfidence = Math.min(99, (s.managerCareer.boardConfidence || 85) + 2);
      s.managerCareer.careerHistory = s.managerCareer.careerHistory || [];
      s.managerCareer.careerHistory.unshift({
        season: s.season || 1,
        club: buyer.name,
        event: `Signed transfer target ${p.name} (OVR ${p.rating}) for ₹${fee}M (+${repBoost} Rep)`
      });
      if (s.managerCareer.careerHistory.length > 50) s.managerCareer.careerHistory.pop();
    }
    persist();
    return {
      status: 'accepted',
      player: p,
      fee,
      salary,
      years,
      fanSatisfaction: buyer.fanSatisfaction,
      message: offer.isCounterHijack ?
        `💥 HIJACK THWARTED! You matched and outbid rivals to secure ${p.name}! (+12% Fan Satisfaction)` :
        `Agreement reached! ${p.name} and ${seller ? seller.name : 'representatives'} accepted the ₹${fee}M transfer.`
    };
  }

  // CASE 2: Counter-offer!
  if (fee >= Math.round(askingFee * 0.65)) {
    const counterFee = Math.max(fee + 1, Math.round(askingFee * (0.95 + (Math.random() * 0.1 - 0.05))));
    const counterSal = Math.max(salary, Math.round(expectedSal * (1.05 + (Math.random() * 0.1))));
    const rivalClubs = ['Arsenal', 'Borussia Dortmund', 'Al Hilal', 'Napoli', 'Aston Villa', 'Sporting CP'];
    const hasRival = Math.random() > 0.4;
    const rival = hasRival ? rivalClubs[Math.floor(Math.random() * rivalClubs.length)] : null;

    return {
      status: 'countered',
      player: p,
      yourBid: { fee, salary, years },
      counterFee,
      counterSalary: counterSal,
      counterYears: years,
      rivalOffer: rival ? { club: rival, fee: counterFee + 1 } : null,
      message: `${seller ? seller.name : 'Selling Club'} countered your ₹${fee}M offer: Demanding ₹${counterFee}M transfer fee and ₹${counterSal}M/yr wage.${rival ? ` Warning: ${rival} are preparing a competing bid!` : ''}`
    };
  }

  // CASE 3: Lowball rejection
  return {
    status: 'lowball_rejected',
    message: `❌ Insulting Bid: ${seller ? seller.name : 'Player representatives'} rejected your ₹${fee}M bid. "Our player is valued at ₹${askingFee}M. Submit a serious offer or negotiations are terminated."`,
    player: p
  };
}

function advanceSeason(s){
  s.season++;
  s.transferWindowOpen = true;
  s.transferWindow = 'summer';

  const promotions = [];
  const relegations = [];
  let userVerdict = null;
  const user = club(s, s.selectedClub);

  // Group clubs by country:
  const countries = [...new Set(s.clubs.map(c => c.country))];
  countries.forEach(country => {
    const countryClubs = s.clubs.filter(c => c.country === country);
    
    // Sort clubs in each division:
    const divTables = {};
    for (let d = 1; d <= 4; d++) {
      divTables[d] = countryClubs.filter(c => c.division === d).sort((a, b) => {
        if (b.stats.points !== a.stats.points) return b.stats.points - a.stats.points;
        if (b.stats.wins !== a.stats.wins) return b.stats.wins - a.stats.wins;
        return (b.reputation || 60) - (a.reputation || 60);
      });
    }

    // 1. Division 1: Champion & Relegations
    const d1 = divTables[1] || [];
    if (d1.length > 0) {
      const champ = d1[0];
      champ.history.titles = (champ.history.titles || 0) + 1;
      champ.cash = Math.round((champ.cash + 25.0) * 10) / 10; // ₹25M Champion Prize
      champ.fanSatisfaction = Math.min(100, (champ.fanSatisfaction || 78) + 30);
      addNews(s, `🏆 ${champ.name} are crowned Division 1 Champions of ${country}! Awarded ₹25M prize money!`, 'season');

      // Bottom 2 relegated to Division 2
      const d1Relegated = d1.slice(-2);
      d1Relegated.forEach(c => {
        c.division = 2;
        c.history.relegations = (c.history.relegations || 0) + 1;
        c.reputation = Math.max(45, c.reputation - 6);
        c.fanSatisfaction = Math.max(15, (c.fanSatisfaction || 78) - 30);
        relegations.push({ club: c.name, from: 1, to: 2, country });
        addNews(s, `⚠️ RELEGATION: ${c.name} have been relegated from Division 1 to Division 2.`, 'season');
      });
    }

    // 2. Division 2: Promotions & Relegations
    const d2 = divTables[2] || [];
    if (d2.length > 0) {
      // Top 2 promoted to Division 1
      const d2Promoted = d2.slice(0, 2);
      d2Promoted.forEach(c => {
        c.division = 1;
        c.history.promotions = (c.history.promotions || 0) + 1;
        c.reputation += 8;
        c.cash = Math.round((c.cash + 15.0) * 10) / 10; // ₹15M Promotion Prize
        c.fanSatisfaction = Math.min(100, (c.fanSatisfaction || 78) + 30);
        promotions.push({ club: c.name, from: 2, to: 1, prize: 15.0, country });
        addNews(s, `🎉 PROMOTION: ${c.name} promoted to Division 1! Awarded ₹15M windfall!`, 'season');
      });

      // Bottom 2 relegated to Division 3
      const d2Relegated = d2.slice(-2);
      d2Relegated.forEach(c => {
        c.division = 3;
        c.history.relegations = (c.history.relegations || 0) + 1;
        c.reputation = Math.max(35, c.reputation - 5);
        c.fanSatisfaction = Math.max(15, (c.fanSatisfaction || 78) - 25);
        relegations.push({ club: c.name, from: 2, to: 3, country });
        addNews(s, `⚠️ RELEGATION: ${c.name} have been relegated from Division 2 to Division 3.`, 'season');
      });
    }

    // 3. Division 3: Promotions & Relegations
    const d3 = divTables[3] || [];
    if (d3.length > 0) {
      // Top 2 promoted to Division 2
      const d3Promoted = d3.slice(0, 2);
      d3Promoted.forEach(c => {
        c.division = 2;
        c.history.promotions = (c.history.promotions || 0) + 1;
        c.reputation += 6;
        c.cash = Math.round((c.cash + 6.0) * 10) / 10; // ₹6M Promotion Prize
        c.fanSatisfaction = Math.min(100, (c.fanSatisfaction || 78) + 25);
        promotions.push({ club: c.name, from: 3, to: 2, prize: 6.0, country });
        addNews(s, `🎉 PROMOTION: ${c.name} promoted to Division 2! Awarded ₹6M prize!`, 'season');
      });

      // Bottom 2 relegated to Division 4
      const d3Relegated = d3.slice(-2);
      d3Relegated.forEach(c => {
        c.division = 4;
        c.history.relegations = (c.history.relegations || 0) + 1;
        c.reputation = Math.max(28, c.reputation - 5);
        c.fanSatisfaction = Math.max(15, (c.fanSatisfaction || 78) - 25);
        relegations.push({ club: c.name, from: 3, to: 4, country });
        addNews(s, `⚠️ RELEGATION: ${c.name} have been relegated from Division 3 to Division 4.`, 'season');
      });
    }

    // 4. Division 4: Top 2 promoted to Division 3
    const d4 = divTables[4] || [];
    if (d4.length > 0) {
      const d4Promoted = d4.slice(0, 2);
      d4Promoted.forEach(c => {
        c.division = 3;
        c.history.promotions = (c.history.promotions || 0) + 1;
        c.reputation += 4;
        c.cash = Math.round((c.cash + 2.5) * 10) / 10; // ₹2.5M Promotion Prize
        c.fanSatisfaction = Math.min(100, (c.fanSatisfaction || 78) + 20);
        promotions.push({ club: c.name, from: 4, to: 3, prize: 2.5, country });
        addNews(s, `🎉 PROMOTION: ${c.name} promoted to Division 3! Awarded ₹2.5M prize!`, 'season');
      });
    }
  });

  // Calculate User Club's outcome
  if (user) {
    const userProm = promotions.find(p => p.club === user.name);
    const userRel = relegations.find(r => r.club === user.name);
    if (userProm) {
      userVerdict = {
        type: 'promoted',
        title: `🎉 PROMOTION CONFIRMED! WE ARE GOING UP!`,
        from: userProm.from,
        to: userProm.to,
        prize: userProm.prize,
        summary: `Immense triumph! Finishing in the promotion spots earned ${user.name} promotion to Division ${userProm.to} and a ₹${userProm.prize}M prize payout!`
      };
    } else if (userRel) {
      userVerdict = {
        type: 'relegated',
        title: `⚠️ RELEGATION CONFIRMED: DROPPED DOWN`,
        from: userRel.from,
        to: userRel.to,
        prize: 0,
        summary: `Heartbreak! Finishing in the drop zone condemned ${user.name} to Division ${userRel.to}. The board demands an immediate promotion push next season.`
      };
    } else if (user.division === 1 && user.stats?.points > 0) {
      userVerdict = {
        type: 'champion',
        title: `🏆 LIFTING THE DIVISION 1 TITLE!`,
        from: 1,
        to: 1,
        prize: 25.0,
        summary: `${user.name} conquered the country to lift the prestigious Division 1 Championship Trophy and claim ₹25M in prize money!`
      };
    } else {
      userVerdict = {
        type: 'retained',
        title: `🛡️ SURVIVAL & CONSOLIDATION IN DIVISION ${user.division}`,
        from: user.division,
        to: user.division,
        prize: 1.0,
        summary: `${user.name} consolidated their status in Division ${user.division} for the upcoming campaign.`
      };
    }

    if (s.managerCareer) {
      s.managerCareer.careerHistory = s.managerCareer.careerHistory || [];
      if (userVerdict?.type === 'promoted') {
        s.managerCareer.promotions = (s.managerCareer.promotions || 0) + 1;
        s.managerCareer.reputation = Math.min(100, (s.managerCareer.reputation || 25) + 16);
        s.managerCareer.boardConfidence = 95;
        s.managerCareer.careerHistory.unshift({
          season: s.season - 1,
          club: user.name,
          division: user.division,
          event: `Promoted to Division ${user.division}! Massive managerial prestige boost.`
        });
      } else if (userVerdict?.type === 'champion') {
        s.managerCareer.titles = (s.managerCareer.titles || 0) + 1;
        s.managerCareer.reputation = Math.min(100, (s.managerCareer.reputation || 25) + 20);
        s.managerCareer.boardConfidence = 100;
        s.managerCareer.careerHistory.unshift({
          season: s.season - 1,
          club: user.name,
          division: 1,
          event: `Crowned Division 1 Champions of ${user.country}!`
        });
      }
      try { 
        refreshManagerJobOffers(s); 
        generateManagerApproaches(s, 2, { isSeasonAdvance: true });
      } catch (e) {}
    }
  }

  // Calculate Season Awards before resetting season statistics
  const seasonAwards = generateSeasonAwards(s, s.season);
  s.awardsHistory = s.awardsHistory || [];
  s.awardsHistory.unshift(seasonAwards);

  // Accumulate player shirt & merchandise sales for the season
  s.clubs.forEach(c => {
    (c.players || []).forEach(pid => {
      const p = player(s, pid);
      if (!p) return;
      const sales = Math.round((Math.max(0, (p.rating || 65) - 60) * 0.05 + ((p.form || 70) / 100) * 0.04) * 10) / 10;
      p.merchandiseSales = Math.round(((p.merchandiseSales || 0) + sales) * 10) / 10;
      p.form = Math.max(45, Math.min(98, p.form + (Math.random() * 12 - 5)));
      if (p.contract) p.contract.years = Math.max(0, p.contract.years - 1);
    });
    c.stats = { wins: 0, draws: 0, losses: 0, points: 0 };
    c.fans = Math.max(1000, Math.round(c.fans * (0.97 + ((c.reputation || 60) / 500))));
    c.morale = Math.max(55, Math.min(92, c.morale));
    c.soldBigPlayersCount = 0; // Reset transfer window sale quotas!
    if (c.sponsor) c.cash += c.sponsor.value;
    if (c.manager && c.manager.contractEnd < s.season) c.manager = null;
  });

  s.matchday = 0;
  s.lastSeasonVerdict = {
    season: s.season - 1,
    userVerdict,
    promotions,
    relegations,
    awards: seasonAwards
  };

  // Bi-annual Global Tournament for every league every 2 years:
  if (s.season % 2 === 0) {
    s.competitions.lastTournament = s.season;
    initiateGlobalTournament(s);
  }

  // Fresh competitions for Season:
  try {
    initiateUclTournament(s);
    initiateEuropaTournament(s);
    initiateDomesticCup(s);
    initiatePlayoffs(s);
  } catch (e) {}

  // Generate exciting AI transfer approaches for user players as transfer window opens!
  generateAiTransferApproaches(s, 2);

  addNews(s, `Season ${s.season} begins. Summer Transfer Window is OPEN. Other clubs are scouting your squad for transfer approaches!`, 'season');
  persist();
  return { season: s.season, verdict: s.lastSeasonVerdict, awards: seasonAwards, globalTournament: s.globalTournament, uclTournament: s.uclTournament };
}
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
  // Updating design marks kit as customized; ready to launch
  addNews(s,`${c.name} customized their official kit design. Ready for season launch.`,'club');
  persist();
  return c.jersey;
}

function launchJersey(s, clubName) {
  const c = club(s, clubName);
  if (!c) return { error: 'Club not found.' };
  if (!c.jersey) {
    c.jersey = {
      home: '#0b2545',
      away: '#e8edf4',
      third: '#163820',
      pattern: 'stripes',
      collar: '#ffffff',
      shorts: '#0b2545',
      quality: 75
    };
  }

  const quality = Number(c.jersey.quality) || 75;
  const fanSatisfaction = Number(c.fanSatisfaction) || 75;
  const rep = Number(c.reputation) || 55;
  const division = c.division || 3;

  const isHit = (quality >= 70 && fanSatisfaction >= 60) || quality >= 82;
  const verdict = isHit ? 'hit' : 'flop';

  let unitsSold = 0;
  let revenue = 0;
  let review = '';

  if (isHit) {
    const baseUnits = division === 1 ? 125000 : division === 2 ? 65000 : division === 3 ? 36000 : 16000;
    unitsSold = Math.round(
      baseUnits * (0.85 + (quality / 180) + (rep / 300) + (Math.random() * 0.2))
    );
    revenue = Math.round((unitsSold * 90) / 100000) / 10;
    review = `🔥 SENSATIONAL HIT JERSEY! Supporters flooded the club megastore and queued around the stadium concourse! Social media praised the stunning aesthetic design, and global distributors reported instant sell-outs across all sizes.`;
    c.fanSatisfaction = Math.min(100, fanSatisfaction + 6);
    c.popularity = Math.min(100, (c.popularity || 60) + 4);
    c.merchandise = Math.min(100, Math.round(quality * 0.7 + 25));
  } else {
    const baseUnits = division === 1 ? 28000 : division === 2 ? 14000 : division === 3 ? 6200 : 2800;
    unitsSold = Math.round(
      baseUnits * (0.6 + (quality / 300) + (Math.random() * 0.2))
    );
    revenue = Math.round((unitsSold * 45) / 100000) / 10;
    review = `⚠️ DISAPPOINTING FLOP JERSEY. Supporters protested the lack of craftsmanship and questionable styling. Unsold replica inventory is languishing in outlet clearance bins with heavy discounts.`;
    c.fanSatisfaction = Math.max(15, fanSatisfaction - 5);
    c.popularity = Math.max(15, (c.popularity || 60) - 2);
    c.merchandise = Math.max(15, Math.round(quality * 0.4 + 10));
  }

  c.cash = Math.round((c.cash + revenue) * 10) / 10;
  recordTransaction(
    c,
    revenue,
    'kit_sales',
    `Kit Launch: ${verdict.toUpperCase()} (${unitsSold.toLocaleString()} jerseys sold)`,
    s
  );

  addNews(
    s,
    verdict === 'hit'
      ? `👕 RETAIL SENSATION: ${c.name} launched their official season kit! Rated a certified HIT JERSEY, selling ${unitsSold.toLocaleString()} shirts and generating ₹${revenue}M in commercial revenue!`
      : `👕 RETAIL SLUMP: ${c.name} official kit launch designated a FLOP JERSEY. Weak retail reception generated only ${unitsSold.toLocaleString()} shirt sales.`,
    'club'
  );

  c.jersey.launched = true;
  c.jersey.launchedSeason = s.season;
  c.jersey.verdict = verdict;
  c.jersey.unitsSold = unitsSold;
  c.jersey.revenue = revenue;
  c.jersey.review = review;
  c.jersey.launchedAt = Date.now();

  persist();
  return {
    verdict,
    unitsSold,
    revenue,
    review,
    fanSatisfaction: c.fanSatisfaction,
    popularity: c.popularity,
    treasury: c.cash,
    jersey: c.jersey
  };
}
function sponsorshipOffers(s,clubName){const c=club(s,clubName);if(!c)return [];const base=Math.round(2+c.reputation/10+c.fans/100000);return ['Local Sports Brand','National Telecom','Global Sportswear','Energy Partner'].map((name,i)=>({id:`sp_${i}`,name,value:base*(i+1),years:i===3?3:1,objective:i===0?'Finish above current position':i===1?'Reach top 6':i===2?'Qualify for continental competition':'Win a trophy',bonus:base*(i+1)*2}));}
function signSponsor(s,clubName,offerId){
  const c=club(s,clubName),offers=sponsorshipOffers(s,clubName);
  const o=offers.find(x=>x.id===offerId);
  if(!c||!o)return {error:'Sponsor offer not found.'};
  c.sponsor=o;
  c.cash=Math.round((c.cash+o.value)*10)/10;
  recordTransaction(c, o.value, 'sponsor_income', `Sponsorship Deal: ${o.name} (${o.years}-Year Contract)`, s);
  addNews(s,`${c.name} signed a ${o.years}-season sponsorship with ${o.name}.`,'finance');
  persist();
  return c;
}

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
  return {
    ...s,
    clubs: s.clubs.map(c => ({
      ...c,
      budget: calculateClubBudget(s, c)
    })),
    recommendations: s.selectedClub ? managerRecommendations(s, s.selectedClub) : [],
    awardsHistory: s.awardsHistory || [],
    tournamentHistory: s.tournamentHistory || [],
    incomingOffers: s.incomingOffers || [],
    globalTournament: s.globalTournament || null,
    uclTournament: s.uclTournament || null,
    europaTournament: s.europaTournament || null,
    domesticCup: s.domesticCup || null,
    playoffs: s.playoffs || null,
    deadlineDay: s.deadlineDay || null,
    international: s.international || null,
    derbyHistory: s.derbyHistory || {}
  };
}

// =============================================================
// GLOBAL SEASON AWARDS & TEAM OF THE SEASON ENGINE
// =============================================================
function generateSeasonAwards(s, seasonNum) {
  const contractedPlayers = [];
  s.clubs.forEach(c => {
    (c.players || []).forEach(pid => {
      const p = player(s, pid);
      if (p) {
        contractedPlayers.push({ p, club: c });
      }
    });
  });

  if (!contractedPlayers.length) return null;

  const getPerfScore = (item) => {
    const { p, club: c } = item;
    const base = (p.rating || 70) * 1.5;
    const form = ((p.form || 75) - 60) * 0.4;
    const goals = (p.goalsScored || 0) * 3.5;
    const assists = (p.assists || 0) * 2.5;
    const cleanSheets = (p.cleanSheets || 0) * (p.position === 'GK' ? 4.0 : 2.5);
    const divWeight = c.division === 1 ? 14 : c.division === 2 ? 8 : c.division === 3 ? 3 : 0;
    const repWeight = ((c.reputation || 60) - 50) * 0.15;
    const champBonus = (c.stats?.points > 20 || (c.history?.titles || 0) > 0) ? 8 : 0;
    return base + form + goals + assists + cleanSheets + divWeight + repWeight + champBonus;
  };

  const ranked = [...contractedPlayers].sort((a, b) => getPerfScore(b) - getPerfScore(a));

  // 1. Ballon d'Or / Global Footballer of the Year
  const topCandidates = ranked.slice(0, 5).map((item, idx) => {
    const score = Math.round(getPerfScore(item));
    const votes = Math.round(520 - (idx * 70) + (Math.random() * 25));
    return {
      rank: idx + 1,
      id: item.p.id,
      name: item.p.name,
      rating: item.p.rating,
      position: item.p.position,
      nationality: item.p.nationality || 'International',
      club: item.club.name,
      country: item.club.country,
      division: item.club.division,
      goals: item.p.goalsScored || 0,
      assists: item.p.assists || 0,
      cleanSheets: item.p.cleanSheets || 0,
      votes,
      points: score
    };
  });

  const ballonDorWinner = topCandidates[0];
  const pWinner = player(s, ballonDorWinner.id);
  if (pWinner) {
    pWinner.awards = pWinner.awards || [];
    pWinner.awards.unshift(`🏆 Season ${seasonNum} Ballon d'Or Winner`);
    pWinner.rating = Math.min(99, (pWinner.rating || 75) + 2);
    pWinner.askingPrice = Math.round((pWinner.askingPrice || 20) * 1.35);
    pWinner.form = 95;
    const winClub = club(s, ballonDorWinner.club);
    if (winClub) {
      winClub.history = winClub.history || {};
      winClub.history.awards = (winClub.history.awards || 0) + 1;
    }
  }

  // 2. World Golden Boot (Top Goalscorer)
  const scorers = [...contractedPlayers].filter(x => (x.p.goalsScored || 0) > 0).sort((a, b) => (b.p.goalsScored || 0) - (a.p.goalsScored || 0));
  const goldenBoot = scorers.length ? {
    id: scorers[0].p.id,
    name: scorers[0].p.name,
    club: scorers[0].club.name,
    country: scorers[0].club.country,
    goals: scorers[0].p.goalsScored || 0,
    rating: scorers[0].p.rating
  } : {
    id: ballonDorWinner.id,
    name: ballonDorWinner.name,
    club: ballonDorWinner.club,
    country: ballonDorWinner.country,
    goals: Math.max(10, ballonDorWinner.goals || 12),
    rating: ballonDorWinner.rating
  };
  const pGb = player(s, goldenBoot.id);
  if (pGb) {
    pGb.awards = pGb.awards || [];
    pGb.awards.unshift(`👟 Season ${seasonNum} World Golden Boot`);
  }

  // 3. World Golden Glove (Best Goalkeeper)
  const goalkeepers = contractedPlayers.filter(x => x.p.position === 'GK').sort((a, b) => getPerfScore(b) - getPerfScore(a));
  const goldenGlove = goalkeepers.length ? {
    id: goalkeepers[0].p.id,
    name: goalkeepers[0].p.name,
    club: goalkeepers[0].club.name,
    country: goalkeepers[0].club.country,
    cleanSheets: goalkeepers[0].p.cleanSheets || 0,
    rating: goalkeepers[0].p.rating
  } : null;
  if (goldenGlove) {
    const pGk = player(s, goldenGlove.id);
    if (pGk) {
      pGk.awards = pGk.awards || [];
      pGk.awards.unshift(`🧤 Season ${seasonNum} World Golden Glove`);
    }
  }

  // 4. World Playmaker Award (Best Midfielder)
  const playmakers = contractedPlayers.filter(x => ['AMF', 'CMF', 'DMF'].includes(x.p.position)).sort((a, b) => getPerfScore(b) - getPerfScore(a));
  const playmaker = playmakers.length ? {
    id: playmakers[0].p.id,
    name: playmakers[0].p.name,
    club: playmakers[0].club.name,
    position: playmakers[0].p.position,
    rating: playmakers[0].p.rating
  } : null;
  if (playmaker) {
    const pPm = player(s, playmaker.id);
    if (pPm) {
      pPm.awards = pPm.awards || [];
      pPm.awards.unshift(`🎯 Season ${seasonNum} World Playmaker of the Year`);
    }
  }

  // 5. World Golden Boy (Best U21 Player)
  const u21s = contractedPlayers.filter(x => (x.p.age || 25) <= 21).sort((a, b) => getPerfScore(b) - getPerfScore(a));
  const goldenBoy = u21s.length ? {
    id: u21s[0].p.id,
    name: u21s[0].p.name,
    club: u21s[0].club.name,
    age: u21s[0].p.age,
    rating: u21s[0].p.rating
  } : null;
  if (goldenBoy) {
    const pGbBoy = player(s, goldenBoy.id);
    if (pGbBoy) {
      pGbBoy.awards = pGbBoy.awards || [];
      pGbBoy.awards.unshift(`💎 Season ${seasonNum} World Golden Boy`);
      pGbBoy.rating = Math.min(96, (pGbBoy.rating || 72) + 2);
    }
  }

  // 6. Per-League / Per-Division Awards & Team of the Season (TOTS)
  const leagueAwards = [];
  const countries = [...new Set(s.clubs.map(c => c.country))];

  countries.forEach(country => {
    for (let div = 1; div <= 4; div++) {
      const divClubs = s.clubs.filter(c => c.country === country && c.division === div);
      if (!divClubs.length) continue;

      const divPlayers = [];
      divClubs.forEach(c => {
        (c.players || []).forEach(pid => {
          const p = player(s, pid);
          if (p) divPlayers.push({ p, club: c });
        });
      });

      if (divPlayers.length < 11) continue;
      divPlayers.sort((a, b) => getPerfScore(b) - getPerfScore(a));

      const mvp = divPlayers[0];
      const pMvp = player(s, mvp.p.id);
      if (pMvp) {
        pMvp.awards = pMvp.awards || [];
        pMvp.awards.unshift(`🥇 S${seasonNum} ${country} D${div} Player of the Season`);
      }

      const divScorers = [...divPlayers].sort((a, b) => (b.p.goalsScored || 0) - (a.p.goalsScored || 0));
      const lgb = divScorers[0];

      const bestGk = divPlayers.find(x => x.p.position === 'GK') || divPlayers[divPlayers.length - 1];
      const bestDefs = divPlayers.filter(x => ['CB', 'LB', 'RB', 'FB'].includes(x.p.position)).slice(0, 4);
      const bestMids = divPlayers.filter(x => ['CMF', 'AMF', 'DMF', 'LMF', 'RMF'].includes(x.p.position)).slice(0, 3);
      const bestAtts = divPlayers.filter(x => ['CF', 'WF', 'LWF', 'RWF', 'SS', 'ST'].includes(x.p.position)).slice(0, 3);

      const totsXI = [
        bestGk,
        ...bestDefs,
        ...bestMids,
        ...bestAtts
      ].filter(Boolean).map(x => ({
        id: x.p.id,
        name: x.p.name,
        position: x.p.position,
        rating: x.p.rating,
        club: x.club.name,
        goals: x.p.goalsScored || 0
      }));

      totsXI.forEach(tPlayer => {
        const targetP = player(s, tPlayer.id);
        if (targetP) {
          targetP.awards = targetP.awards || [];
          if (!targetP.awards.some(a => a.includes(`S${seasonNum} ${country} D${div} Best XI`))) {
            targetP.awards.unshift(`⭐ S${seasonNum} ${country} D${div} Best XI`);
          }
        }
      });

      leagueAwards.push({
        country,
        division: div,
        leagueName: div === 1 ? (COUNTRIES.find(x => x[0] === country)?.[1] || `${country} Division 1`) : `${country} Division ${div}`,
        mvp: {
          id: mvp.p.id,
          name: mvp.p.name,
          club: mvp.club.name,
          rating: mvp.p.rating,
          position: mvp.p.position
        },
        goldenBoot: {
          id: lgb.p.id,
          name: lgb.p.name,
          club: lgb.club.name,
          goals: lgb.p.goalsScored || 0
        },
        tots: totsXI
      });
    }
  });

  const fullAwardsRecord = {
    season: seasonNum,
    timestamp: Date.now(),
    global: {
      ballonDor: {
        winner: ballonDorWinner,
        podium: topCandidates
      },
      goldenBoot,
      goldenGlove,
      playmaker,
      goldenBoy
    },
    leagues: leagueAwards
  };

  addNews(s, `🌟 AWARDS GALA: ${ballonDorWinner.name} (${ballonDorWinner.club}) wins the Season ${seasonNum} Ballon d'Or! Full league Best XIs announced.`, 'season');
  return fullAwardsRecord;
}

// =============================================================
// BI-ANNUAL GLOBAL TOURNAMENT (EVERY 2 YEARS)
// =============================================================
function initiateGlobalTournament(s) {
  const user = club(s, s.selectedClub);
  const d1Clubs = s.clubs.filter(c => c.division === 1);
  const selectedClubs = [];

  // Always include user club
  if (user) {
    selectedClubs.push(user);
  }

  // Champions & elite powerhouses across countries
  const countries = [...new Set(d1Clubs.map(c => c.country))];
  countries.forEach(cty => {
    const ctyClubs = d1Clubs.filter(c => c.country === cty);
    if (ctyClubs.length) {
      const topCty = ctyClubs.sort((a, b) => (b.stats?.points || 0) - (a.stats?.points || 0) || (b.reputation || 60) - (a.reputation || 60))[0];
      if (topCty && !selectedClubs.find(c => c.name === topCty.name)) {
        selectedClubs.push(topCty);
      }
    }
  });

  // Top up to 16 teams
  const remaining = s.clubs.filter(c => !selectedClubs.find(x => x.name === c.name)).sort((a, b) => (b.reputation || 60) - (a.reputation || 60));
  while (selectedClubs.length < 16 && remaining.length > 0) {
    selectedClubs.push(remaining.shift());
  }

  const shuffled = [...selectedClubs].sort(() => Math.random() - 0.5);
  const groupNames = ['A', 'B', 'C', 'D'];
  const groups = {};

  groupNames.forEach((gName, idx) => {
    const groupClubs = shuffled.slice(idx * 4, idx * 4 + 4);
    groups[gName] = {
      name: `Group ${gName}`,
      standings: groupClubs.map(c => ({
        clubName: c.name,
        country: c.country,
        division: c.division,
        reputation: c.reputation || 60,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        gf: 0,
        ga: 0,
        gd: 0,
        points: 0
      }))
    };
  });

  s.globalTournament = {
    edition: Math.max(1, Math.floor(s.season / 2)),
    season: s.season,
    name: 'Global Club World Championship',
    status: 'groups',
    currentRound: 1,
    groups,
    knockout: {
      quarterFinals: [],
      semiFinals: [],
      thirdPlace: null,
      final: null
    },
    champion: null,
    runnerUp: null,
    historyLog: []
  };

  addNews(s, `🌍 TOURNAMENT INAUGURATION: The Bi-Annual Global Club World Championship begins for Season ${s.season}! 16 elite clubs compete across 4 global groups.`, 'competition');
  persist();
  return s.globalTournament;
}

function simulateGlobalTournamentRound(s) {
  if (!s.globalTournament) {
    initiateGlobalTournament(s);
  }
  const t = s.globalTournament;
  if (t.status === 'completed') {
    return { error: `Current Global Tournament edition is completed. Next edition scheduled for Season ${t.season + 2}.` };
  }

  const user = club(s, s.selectedClub);
  let roundResults = [];

  if (t.status === 'groups') {
    const gKeys = ['A', 'B', 'C', 'D'];
    gKeys.forEach(gKey => {
      const grp = t.groups[gKey];
      const clubsInGroup = grp.standings;
      let pairs = [];
      if (t.currentRound === 1) pairs = [[0, 1], [2, 3]];
      else if (t.currentRound === 2) pairs = [[0, 2], [1, 3]];
      else pairs = [[0, 3], [1, 2]];

      pairs.forEach(([i1, i2]) => {
        const c1Name = clubsInGroup[i1].clubName;
        const c2Name = clubsInGroup[i2].clubName;
        const res = match(s, c1Name, c2Name, {
          isCup: true,
          competitionName: `Global Championship · Group ${gKey} MD${t.currentRound}`,
          isAiOnly: (user?.name !== c1Name && user?.name !== c2Name)
        });

        const s1 = clubsInGroup[i1];
        const s2 = clubsInGroup[i2];
        s1.played++; s2.played++;
        s1.gf += res.homeGoals; s1.ga += res.awayGoals; s1.gd = s1.gf - s1.ga;
        s2.gf += res.awayGoals; s2.ga += res.homeGoals; s2.gd = s2.gf - s2.ga;

        if (res.homeGoals > res.awayGoals) {
          s1.won++; s1.points += 3; s2.lost++;
        } else if (res.homeGoals < res.awayGoals) {
          s2.won++; s2.points += 3; s1.lost++;
        } else {
          s1.drawn++; s1.points += 1;
          s2.drawn++; s2.points += 1;
        }

        roundResults.push(res);
      });

      grp.standings.sort((a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf);
    });

    t.currentRound++;
    if (t.currentRound > 3) {
      t.status = 'quarter_finals';
      const qfPairs = [
        { home: t.groups['A'].standings[0].clubName, away: t.groups['B'].standings[1].clubName, label: 'QF 1 (1A vs 2B)' },
        { home: t.groups['B'].standings[0].clubName, away: t.groups['A'].standings[1].clubName, label: 'QF 2 (1B vs 2A)' },
        { home: t.groups['C'].standings[0].clubName, away: t.groups['D'].standings[1].clubName, label: 'QF 3 (1C vs 2D)' },
        { home: t.groups['D'].standings[0].clubName, away: t.groups['C'].standings[1].clubName, label: 'QF 4 (1D vs 2C)' }
      ];
      t.knockout.quarterFinals = qfPairs.map(p => ({
        ...p,
        homeGoals: null,
        awayGoals: null,
        winner: null,
        played: false
      }));
      addNews(s, `🌍 TOURNAMENT UPDATE: Group stage completed! 8 clubs advance to the Global Club World Championship Quarter-Finals!`, 'competition');
    }
  } else if (t.status === 'quarter_finals') {
    const winners = [];
    t.knockout.quarterFinals.forEach(qf => {
      const res = match(s, qf.home, qf.away, {
        isCup: true,
        cupStage: 'GCWC Quarter-Final',
        competitionName: `Global Championship · ${qf.label}`,
        isAiOnly: (user?.name !== qf.home && user?.name !== qf.away)
      });
      qf.homeGoals = res.homeGoals;
      qf.awayGoals = res.awayGoals;
      qf.penalties = res.penalties;
      qf.winner = res.cupWinner || (res.homeGoals > res.awayGoals ? qf.home : qf.away);
      qf.played = true;
      winners.push(qf.winner);
      roundResults.push(res);
    });

    t.status = 'semi_finals';
    t.knockout.semiFinals = [
      { home: winners[0], away: winners[2], label: 'Semi-Final 1', played: false },
      { home: winners[1], away: winners[3], label: 'Semi-Final 2', played: false }
    ];
    addNews(s, `🌍 TOURNAMENT SEMI-FINALS: ${winners.join(', ')} advance to the Global Club World Championship Final 4!`, 'competition');
  } else if (t.status === 'semi_finals') {
    const finalPairs = [];
    const losers = [];
    t.knockout.semiFinals.forEach(sf => {
      const res = match(s, sf.home, sf.away, {
        isCup: true,
        cupStage: 'GCWC Semi-Final',
        competitionName: `Global Championship · ${sf.label}`,
        isAiOnly: (user?.name !== sf.home && user?.name !== sf.away)
      });
      sf.homeGoals = res.homeGoals;
      sf.awayGoals = res.awayGoals;
      sf.penalties = res.penalties;
      sf.winner = res.cupWinner || (res.homeGoals > res.awayGoals ? sf.home : sf.away);
      sf.played = true;
      finalPairs.push(sf.winner);
      losers.push(sf.winner === sf.home ? sf.away : sf.home);
      roundResults.push(res);
    });

    t.status = 'final';
    t.knockout.thirdPlace = { home: losers[0], away: losers[1], played: false };
    t.knockout.final = { home: finalPairs[0], away: finalPairs[1], played: false };
    addNews(s, `🏆 GLOBAL GRAND FINAL: ${finalPairs[0]} vs ${finalPairs[1]} for the Global Club World Championship Trophy!`, 'competition');
  } else if (t.status === 'final') {
    const fRes = match(s, t.knockout.final.home, t.knockout.final.away, {
      isCup: true,
      cupStage: 'GCWC Grand Final',
      competitionName: `Global Championship · 🏆 GRAND FINAL`,
      isAiOnly: (user?.name !== t.knockout.final.home && user?.name !== t.knockout.final.away)
    });
    t.knockout.final.homeGoals = fRes.homeGoals;
    t.knockout.final.awayGoals = fRes.awayGoals;
    t.knockout.final.penalties = fRes.penalties;
    const champName = fRes.cupWinner || (fRes.homeGoals > fRes.awayGoals ? t.knockout.final.home : t.knockout.final.away);
    const runnerName = (champName === t.knockout.final.home) ? t.knockout.final.away : t.knockout.final.home;

    t.knockout.final.winner = champName;
    t.knockout.final.played = true;
    t.champion = champName;
    t.runnerUp = runnerName;
    t.status = 'completed';

    const champClub = club(s, champName);
    if (champClub) {
      champClub.cash = Math.round((champClub.cash + 50.0) * 10) / 10;
      champClub.reputation = Math.min(99, (champClub.reputation || 70) + 12);
      champClub.history = champClub.history || {};
      champClub.history.worldTrophies = (champClub.history.worldTrophies || 0) + 1;
      recordTransaction(champClub, 50.0, 'tournament_prize', '🏆 Global Club World Champions Prize Money!', s);
    }

    const runnerClub = club(s, runnerName);
    if (runnerClub) {
      runnerClub.cash = Math.round((runnerClub.cash + 25.0) * 10) / 10;
      recordTransaction(runnerClub, 25.0, 'tournament_prize', '🥈 Global Club Championship Runners-Up Prize', s);
    }

    s.tournamentHistory = s.tournamentHistory || [];
    s.tournamentHistory.unshift({
      edition: t.edition,
      season: t.season,
      champion: champName,
      runnerUp: runnerName,
      score: `${fRes.homeGoals}-${fRes.awayGoals}${fRes.penalties ? ` (${fRes.penalties.home}-${fRes.penalties.away} pens)` : ''}`,
      date: new Date().toISOString()
    });

    addNews(s, `👑 WORLD CHAMPIONS: ${champName} win the Global Club World Championship Trophy and claim ₹50M prize money!`, 'competition');
    roundResults.push(fRes);
  }

  persist();
  return { tournament: t, results: roundResults };
}

// =============================================================
// AI TRANSFER APPROACHES & INCOMING OFFERS FOR USER PLAYERS
// =============================================================
function generateAiTransferApproaches(s, forceCount = null) {
  const user = club(s, s.selectedClub);
  if (!user || !user.players || !user.players.length) return [];

  s.incomingOffers = s.incomingOffers || [];
  s.incomingOffers = s.incomingOffers.filter(o => o.status === 'pending');
  if (s.incomingOffers.length >= 4) return s.incomingOffers;

  const userPlayers = clubPlayers(s, user);
  if (!userPlayers.length) return [];

  const targets = userPlayers.filter(p => 
    (p.rating || 65) >= 72 || 
    (p.form || 70) >= 78 || 
    (p.goalsScored || 0) >= 2 || 
    ((p.age || 25) <= 21 && (p.rating || 65) >= 68) ||
    (p.contract && p.contract.years <= 1)
  );

  if (!targets.length) return s.incomingOffers;

  const otherClubs = s.clubs.filter(c => c.name !== user.name && (c.cash >= 8 || c.division <= 2));
  if (!otherClubs.length) return s.incomingOffers;

  const countToGenerate = forceCount !== null ? forceCount : (Math.random() < 0.65 ? 1 : 2);

  for (let i = 0; i < countToGenerate; i++) {
    const p = targets[Math.floor(Math.random() * targets.length)];
    if (s.incomingOffers.some(o => o.playerId === p.id && o.status === 'pending')) continue;

    const suitor = otherClubs[Math.floor(Math.random() * otherClubs.length)];
    const baseVal = Math.max(3, p.askingPrice || Math.round((p.rating || 70) * 0.45));
    const markup = 1.12 + (Math.random() * 0.38);
    const offeredFee = Math.round(baseVal * markup * 10) / 10;
    const offeredSalary = Math.round(((p.contract?.salary || 2.0) * 1.35) * 10) / 10;
    const isLoan = ((p.age || 25) <= 22 && Math.random() < 0.35);

    const reasons = [
      `${suitor.name} submitted an official transfer bid to sign ${p.name} as their marquee starter for the upcoming campaign.`,
      `Chief scouts from ${suitor.name} watched ${p.name} live and formally proposed a lucrative transfer package.`,
      `${suitor.name} are aggressively looking to reinforce their starting XI and identified ${p.name} as their prime target.`,
      `Following ${p.name}'s impressive performances, ${suitor.name} boardroom have submitted a formal cash bid.`
    ];

    const offer = {
      id: `offer_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      suitorClub: suitor.name,
      suitorCountry: suitor.country,
      suitorDivision: suitor.division,
      suitorReputation: suitor.reputation || 70,
      playerId: p.id,
      playerName: p.name,
      playerPosition: p.position,
      playerRating: p.rating,
      playerAge: p.age,
      playerValuation: p.askingPrice,
      fee: isLoan ? Math.max(1.5, Math.round(offeredFee * 0.15 * 10) / 10) : offeredFee,
      salary: offeredSalary,
      type: isLoan ? 'loan' : 'transfer',
      message: reasons[Math.floor(Math.random() * reasons.length)],
      playerStance: p.mentality === 'Loyal' ? 'Player loves your club, but is flattered by the inquiry.' :
                    p.mentality === 'Money-Minded' ? 'Player is heavily tempted by the lucrative wage package offered.' :
                    p.mentality === 'European Ambition' ? 'Player dreams of high-level continental silverware and requests consideration.' :
                    'Player remains professional and awaits your managerial decision.',
      createdAt: Date.now(),
      status: 'pending'
    };

    s.incomingOffers.unshift(offer);
    addNews(s, `📢 TRANSFER INQUIRY: ${suitor.name} have officially submitted a ₹${offer.fee}M ${offer.type} bid for ${p.name}!`, 'transfer');
  }

  persist();
  return s.incomingOffers;
}

function respondToIncomingOffer(s, offerId, decision, counterFee = null) {
  s.incomingOffers = s.incomingOffers || [];
  const offer = s.incomingOffers.find(o => o.id === offerId);
  if (!offer) return { error: 'Transfer offer not found or already expired.' };
  if (offer.status !== 'pending') return { error: `Offer is already marked as ${offer.status}.` };

  const user = club(s, s.selectedClub);
  const suitor = club(s, offer.suitorClub);
  const p = player(s, offer.playerId);

  if (!user || !p) return { error: 'Club or player not found.' };

  if (decision === 'accept') {
    offer.status = 'accepted';
    user.cash = Math.round((user.cash + offer.fee) * 10) / 10;
    recordTransaction(user, offer.fee, 'player_sale', `Official Sale: ${p.name} transferred to ${offer.suitorClub}`, s);

    user.players = (user.players || []).filter(id => id !== p.id);
    if (suitor) {
      suitor.players = suitor.players || [];
      suitor.players.push(p.id);
      suitor.cash = Math.max(0, Math.round((suitor.cash - offer.fee) * 10) / 10);
    }
    p.ownerClub = offer.suitorClub;
    p.contract = p.contract || {};
    p.contract.salary = offer.salary;
    p.contract.years = 3;

    addNews(s, `🤝 DEAL AGREED: ${user.name} accepted ₹${offer.fee}M bid from ${offer.suitorClub} for ${p.name}!`, 'transfer');
    if (s.managerCareer) {
      const repBoost = Math.max(1, Math.min(4, Math.round(offer.fee / 10)));
      s.managerCareer.reputation = Math.min(100, (s.managerCareer.reputation || 28) + repBoost);
      s.managerCareer.boardConfidence = Math.min(99, (s.managerCareer.boardConfidence || 85) + 3);
      s.managerCareer.careerHistory = s.managerCareer.careerHistory || [];
      s.managerCareer.careerHistory.unshift({
        season: s.season || 1,
        club: user.name,
        event: `Negotiated transfer sale of ${p.name} to ${offer.suitorClub} for ₹${offer.fee}M (+${repBoost} Rep)`
      });
      if (s.managerCareer.careerHistory.length > 50) s.managerCareer.careerHistory.pop();
    }
    persist();
    return {
      status: 'accepted',
      message: `Deal agreed! ${p.name} has moved to ${offer.suitorClub} for ₹${offer.fee}M. Cash has been wired to your club treasury.`,
      cashGained: offer.fee,
      player: p
    };
  }

  if (decision === 'reject') {
    offer.status = 'rejected';
    if (p.mentality === 'Money-Minded' || p.mentality === 'European Ambition') {
      p.morale = Math.max(50, (p.morale || 75) - 6);
      p.form = Math.max(55, (p.form || 75) - 5);
    } else {
      p.morale = Math.min(100, (p.morale || 75) + 6);
    }
    addNews(s, `🛑 BID REJECTED: ${user.name} turned down ${offer.suitorClub}'s ₹${offer.fee}M approach for ${p.name}.`, 'transfer');
    persist();
    return {
      status: 'rejected',
      message: `Offer firmly rejected. ${p.name} remains at your club.`,
      player: p
    };
  }

  if (decision === 'counter') {
    const counter = Number(counterFee) || (offer.fee * 1.25);
    if (counter <= offer.fee * 1.2) {
      offer.fee = Math.round(counter * 10) / 10;
      return respondToIncomingOffer(s, offerId, 'accept');
    } else if (counter <= offer.fee * 1.45) {
      const compromisedFee = Math.round(((offer.fee + counter) / 2) * 10) / 10;
      offer.fee = compromisedFee;
      return {
        status: 'counter_compromise',
        message: `${offer.suitorClub} responded: "We cannot meet ₹${counter}M, but we can offer a revised compromise of ₹${compromisedFee}M. Will you accept?"`,
        revisedFee: compromisedFee,
        offer
      };
    } else {
      offer.status = 'walked_away';
      addNews(s, `🚶 TALKS BROKE DOWN: ${offer.suitorClub} walked away from negotiations for ${p.name} due to unrealistic valuation demands.`, 'transfer');
      persist();
      return {
        status: 'walked_away',
        message: `${offer.suitorClub} representatives walked out: "Your counter-valuation of ₹${counter}M is exorbitant. Negotiations are closed."`,
        player: p
      };
    }
  }

  return { error: 'Unknown decision.' };
}

// =============================================================
// UEFA CHAMPIONS LEAGUE (UCL) COMPETITION ENGINE
// =============================================================
function initiateUclTournament(s) {
  if (s.uclTournament && s.uclTournament.season === s.season) return s.uclTournament;
  const user = club(s, s.selectedClub);
  const selectedClubs = [];

  if (user && (user.division === 1 || user.reputation >= 65)) {
    selectedClubs.push(user);
  }

  const marqueeClubs = [
    'Madrid CF', 'Catalunya FC', 'Munich FC', 'Paris FC', 
    'Manchester Blue', 'Merseyside Red', 'Milano Rosso', 'Turin FC', 
    'Lisbon Eagles', 'Amsterdam FC', 'Dortmund United', 'West London United', 
    'Milano Nero', 'Porto Athletic', 'Brussels FC', 'Vienna FC'
  ];
  marqueeClubs.forEach(mName => {
    const found = s.clubs.find(c => c.name === mName);
    if (found && !selectedClubs.find(c => c.name === found.name)) selectedClubs.push(found);
  });

  const pool = s.clubs.filter(c => c.division === 1 && !selectedClubs.find(x => x.name === c.name)).sort((a,b) => (b.reputation||60) - (a.reputation||60));
  while (selectedClubs.length < 16 && pool.length > 0) {
    selectedClubs.push(pool.shift());
  }

  const standings = selectedClubs.map(c => ({
    clubName: c.name,
    country: c.country,
    division: c.division,
    reputation: c.reputation || 70,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    gf: 0,
    ga: 0,
    gd: 0,
    points: 0,
    form: []
  }));

  s.uclTournament = {
    season: s.season,
    name: 'UEFA Champions League',
    trophy: '⭐ UEFA Champions League Trophy',
    status: 'league_phase',
    currentRound: 1,
    maxRounds: 4,
    standings,
    knockout: {
      quarterFinals: [],
      semiFinals: [],
      final: null
    },
    topScorers: [],
    champion: null,
    runnerUp: null
  };

  addNews(s, `⭐ UEFA CHAMPIONS LEAGUE DRAW: Season ${s.season} League Phase kicks off with 16 elite European clubs! ₹85M Grand Bounty on the line.`, 'competition');
  persist();
  return s.uclTournament;
}

function simulateUclRound(s) {
  if (!s.uclTournament || s.uclTournament.season !== s.season) initiateUclTournament(s);
  const u = s.uclTournament;
  if (u.status === 'completed') {
    return { error: 'Current UCL season edition is completed.' };
  }

  const user = club(s, s.selectedClub);
  const roundResults = [];

  if (u.status === 'league_phase') {
    const teams = u.standings;
    let pairs = [];
    if (u.currentRound === 1) {
      for (let i = 0; i < 16; i += 2) pairs.push([i, i + 1]);
    } else if (u.currentRound === 2) {
      for (let i = 0; i < 16; i += 4) { pairs.push([i, i + 2]); pairs.push([i + 1, i + 3]); }
    } else if (u.currentRound === 3) {
      for (let i = 0; i < 16; i += 4) { pairs.push([i, i + 3]); pairs.push([i + 1, i + 2]); }
    } else {
      pairs = [[0, 4], [1, 5], [2, 6], [3, 7], [8, 12], [9, 13], [10, 14], [11, 15]];
    }

    pairs.forEach(([i1, i2]) => {
      const c1 = teams[i1];
      const c2 = teams[i2];
      const res = match(s, c1.clubName, c2.clubName, {
        isCup: true,
        competitionName: `UEFA Champions League · League Phase MD${u.currentRound}`,
        isAiOnly: (user?.name !== c1.clubName && user?.name !== c2.clubName)
      });

      c1.played++; c2.played++;
      c1.gf += res.homeGoals; c1.ga += res.awayGoals; c1.gd = c1.gf - c1.ga;
      c2.gf += res.awayGoals; c2.ga += res.homeGoals; c2.gd = c2.gf - c2.ga;

      if (res.homeGoals > res.awayGoals) {
        c1.won++; c1.points += 3; c1.form.push('W');
        c2.lost++; c2.form.push('L');
      } else if (res.homeGoals < res.awayGoals) {
        c2.won++; c2.points += 3; c2.form.push('W');
        c1.lost++; c1.form.push('L');
      } else {
        c1.drawn++; c1.points += 1; c1.form.push('D');
        c2.drawn++; c2.points += 1; c2.form.push('D');
      }
      if (c1.form.length > 5) c1.form.shift();
      if (c2.form.length > 5) c2.form.shift();

      roundResults.push(res);
    });

    u.standings.sort((a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf);
    u.currentRound++;

    if (u.currentRound > u.maxRounds) {
      u.status = 'quarter_finals';
      const qfPairs = [
        { home: u.standings[0].clubName, away: u.standings[7].clubName, label: 'UCL QF 1 (1st vs 8th)' },
        { home: u.standings[1].clubName, away: u.standings[6].clubName, label: 'UCL QF 2 (2nd vs 7th)' },
        { home: u.standings[2].clubName, away: u.standings[5].clubName, label: 'UCL QF 3 (3rd vs 6th)' },
        { home: u.standings[3].clubName, away: u.standings[4].clubName, label: 'UCL QF 4 (4th vs 5th)' }
      ];
      u.knockout.quarterFinals = qfPairs.map(p => ({
        ...p,
        homeGoals: null,
        awayGoals: null,
        penalties: null,
        winner: null,
        played: false
      }));
      addNews(s, `⭐ UCL UPDATE: League Phase concluded! Top 8 clubs advance into the UEFA Champions League Quarter-Final bracket!`, 'competition');
    }
  } else if (u.status === 'quarter_finals') {
    const winners = [];
    u.knockout.quarterFinals.forEach(qf => {
      const res = match(s, qf.home, qf.away, {
        isCup: true,
        cupStage: 'UCL Quarter-Final',
        competitionName: `UCL · ${qf.label}`,
        isAiOnly: (user?.name !== qf.home && user?.name !== qf.away)
      });
      qf.homeGoals = res.homeGoals;
      qf.awayGoals = res.awayGoals;
      qf.penalties = res.penalties;
      qf.winner = res.cupWinner || (res.homeGoals > res.awayGoals ? qf.home : qf.away);
      qf.played = true;
      winners.push(qf.winner);
      roundResults.push(res);
    });
    u.status = 'semi_finals';
    u.knockout.semiFinals = [
      { home: winners[0], away: winners[2], label: 'UCL Semi-Final 1', played: false },
      { home: winners[1], away: winners[3], label: 'UCL Semi-Final 2', played: false }
    ];
    addNews(s, `⭐ UCL SEMI-FINALS: ${winners.join(', ')} qualify for the Champions League Final Four!`, 'competition');
  } else if (u.status === 'semi_finals') {
    const finalPairs = [];
    u.knockout.semiFinals.forEach(sf => {
      const res = match(s, sf.home, sf.away, {
        isCup: true,
        cupStage: 'UCL Semi-Final',
        competitionName: `UCL · ${sf.label}`,
        isAiOnly: (user?.name !== sf.home && user?.name !== sf.away)
      });
      sf.homeGoals = res.homeGoals;
      sf.awayGoals = res.awayGoals;
      sf.penalties = res.penalties;
      sf.winner = res.cupWinner || (res.homeGoals > res.awayGoals ? sf.home : sf.away);
      sf.played = true;
      finalPairs.push(sf.winner);
      roundResults.push(res);
    });
    u.status = 'final';
    u.knockout.final = { home: finalPairs[0], away: finalPairs[1], label: 'UCL Grand Final', played: false };
    addNews(s, `⭐ UCL GRAND FINAL: ${finalPairs[0]} vs ${finalPairs[1]} for the European Champions Crown!`, 'competition');
  } else if (u.status === 'final') {
    const fn = u.knockout.final;
    const res = match(s, fn.home, fn.away, {
      isCup: true,
      cupStage: 'UCL Grand Final',
      competitionName: 'UEFA Champions League · ⭐ GRAND FINAL',
      isAiOnly: (user?.name !== fn.home && user?.name !== fn.away)
    });
    fn.homeGoals = res.homeGoals;
    fn.awayGoals = res.awayGoals;
    fn.penalties = res.penalties;
    const champ = res.cupWinner || (res.homeGoals > res.awayGoals ? fn.home : fn.away);
    const runner = (champ === fn.home) ? fn.away : fn.home;
    fn.winner = champ;
    fn.played = true;
    u.champion = champ;
    u.runnerUp = runner;
    u.status = 'completed';

    const cClub = club(s, champ);
    if (cClub) {
      cClub.cash = Math.round((cClub.cash + 85.0) * 10) / 10;
      cClub.reputation = Math.min(99, (cClub.reputation || 70) + 15);
      cClub.trophyCabinet = cClub.trophyCabinet || [];
      cClub.trophyCabinet.unshift({ id: `ucl_s${s.season}`, type: 'ucl', name: 'UEFA Champions League Trophy', season: s.season, icon: '⭐' });
      recordTransaction(cClub, 85.0, 'tournament_prize', '⭐ UEFA Champions League Winners Prize Purse!', s);
    }
    const rClub = club(s, runner);
    if (rClub) {
      rClub.cash = Math.round((rClub.cash + 40.0) * 10) / 10;
      recordTransaction(rClub, 40.0, 'tournament_prize', '🥈 UEFA Champions League Runners-Up Prize', s);
    }
    addNews(s, `👑 EUROPEAN KINGS: ${champ} crowned UEFA Champions League Winners for Season ${s.season}, collecting ₹85.0M!`, 'competition');
    roundResults.push(res);
  }

  persist();
  return { ucl: u, results: roundResults };
}

// =============================================================
// EUROPA CHALLENGERS LEAGUE (EUROPA CUP) ENGINE
// =============================================================
function initiateEuropaTournament(s) {
  if (s.europaTournament && s.europaTournament.season === s.season) return s.europaTournament;
  const user = club(s, s.selectedClub);
  const uclTeams = s.uclTournament?.standings?.map(x => x.clubName) || [];
  
  let candidates = s.clubs.filter(c => !uclTeams.includes(c.name) && (c.division <= 2));
  if (user && !uclTeams.includes(user.name)) {
    candidates = [user, ...candidates.filter(c => c.name !== user.name)];
  }
  const selected = candidates.slice(0, 12);
  while (selected.length < 12) {
    const filler = s.clubs.find(c => !selected.find(x => x.name === c.name));
    if (filler) selected.push(filler); else break;
  }

  const grpA = selected.slice(0, 6).map(c => ({ clubName: c.name, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0 }));
  const grpB = selected.slice(6, 12).map(c => ({ clubName: c.name, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0 }));

  s.europaTournament = {
    season: s.season,
    name: 'Europa Challengers League',
    trophy: '🥈 Europa Challengers Cup',
    status: 'groups',
    currentRound: 1,
    maxRounds: 3,
    groups: { A: grpA, B: grpB },
    knockout: {
      semiFinals: [],
      final: null
    },
    champion: null,
    runnerUp: null
  };

  addNews(s, `🥈 EUROPA CHALLENGERS LEAGUE: Season ${s.season} group stages set! 12 top continental contenders battle for European glory & ₹35M.`, 'competition');
  persist();
  return s.europaTournament;
}

function simulateEuropaRound(s) {
  if (!s.europaTournament || s.europaTournament.season !== s.season) initiateEuropaTournament(s);
  const e = s.europaTournament;
  if (e.status === 'completed') return { error: 'Current Europa season edition is completed.' };

  const user = club(s, s.selectedClub);
  const roundResults = [];

  if (e.status === 'groups') {
    ['A', 'B'].forEach(gKey => {
      const g = e.groups[gKey];
      let pairs = [];
      if (e.currentRound === 1) pairs = [[0, 1], [2, 3], [4, 5]];
      else if (e.currentRound === 2) pairs = [[0, 2], [1, 4], [3, 5]];
      else pairs = [[0, 3], [1, 5], [2, 4]];

      pairs.forEach(([i1, i2]) => {
        if (!g[i1] || !g[i2]) return;
        const res = match(s, g[i1].clubName, g[i2].clubName, {
          isCup: true,
          competitionName: `Europa League · Group ${gKey} MD${e.currentRound}`,
          isAiOnly: (user?.name !== g[i1].clubName && user?.name !== g[i2].clubName)
        });
        g[i1].played++; g[i2].played++;
        g[i1].gf += res.homeGoals; g[i1].ga += res.awayGoals; g[i1].gd = g[i1].gf - g[i1].ga;
        g[i2].gf += res.awayGoals; g[i2].ga += res.homeGoals; g[i2].gd = g[i2].gf - g[i2].ga;

        if (res.homeGoals > res.awayGoals) { g[i1].won++; g[i1].points += 3; g[i2].lost++; }
        else if (res.homeGoals < res.awayGoals) { g[i2].won++; g[i2].points += 3; g[i1].lost++; }
        else { g[i1].drawn++; g[i1].points++; g[i2].drawn++; g[i2].points++; }
        roundResults.push(res);
      });
      g.sort((a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf);
    });

    e.currentRound++;
    if (e.currentRound > e.maxRounds) {
      e.status = 'semi_finals';
      e.knockout.semiFinals = [
        { home: e.groups.A[0].clubName, away: e.groups.B[1].clubName, label: 'Semi-Final 1 (1A vs 2B)', played: false },
        { home: e.groups.B[0].clubName, away: e.groups.A[1].clubName, label: 'Semi-Final 2 (1B vs 2A)', played: false }
      ];
      addNews(s, `🥈 EUROPA CUP SEMI-FINALS: Top 2 from Group A & B advance to the Knockout Semi-Finals!`, 'competition');
    }
  } else if (e.status === 'semi_finals') {
    const finalPairs = [];
    e.knockout.semiFinals.forEach(sf => {
      const res = match(s, sf.home, sf.away, {
        isCup: true,
        cupStage: 'Europa Semi-Final',
        competitionName: `Europa League · ${sf.label}`,
        isAiOnly: (user?.name !== sf.home && user?.name !== sf.away)
      });
      sf.homeGoals = res.homeGoals;
      sf.awayGoals = res.awayGoals;
      sf.penalties = res.penalties;
      sf.winner = res.cupWinner || (res.homeGoals > res.awayGoals ? sf.home : sf.away);
      sf.played = true;
      finalPairs.push(sf.winner);
      roundResults.push(res);
    });
    e.status = 'final';
    e.knockout.final = { home: finalPairs[0], away: finalPairs[1], label: 'Europa Cup Final', played: false };
    addNews(s, `🥈 EUROPA GRAND FINAL: ${finalPairs[0]} vs ${finalPairs[1]} for the Europa Challengers Cup!`, 'competition');
  } else if (e.status === 'final') {
    const fn = e.knockout.final;
    const res = match(s, fn.home, fn.away, {
      isCup: true,
      cupStage: 'Europa Cup Final',
      competitionName: 'Europa League · 🥈 GRAND FINAL',
      isAiOnly: (user?.name !== fn.home && user?.name !== fn.away)
    });
    fn.homeGoals = res.homeGoals;
    fn.awayGoals = res.awayGoals;
    fn.penalties = res.penalties;
    const champ = res.cupWinner || (res.homeGoals > res.awayGoals ? fn.home : fn.away);
    const runner = (champ === fn.home) ? fn.away : fn.home;
    fn.winner = champ;
    fn.played = true;
    e.champion = champ;
    e.runnerUp = runner;
    e.status = 'completed';

    const cClub = club(s, champ);
    if (cClub) {
      cClub.cash = Math.round((cClub.cash + 35.0) * 10) / 10;
      cClub.reputation = Math.min(99, (cClub.reputation || 65) + 8);
      cClub.trophyCabinet = cClub.trophyCabinet || [];
      cClub.trophyCabinet.unshift({ id: `europa_s${s.season}`, type: 'europa', name: 'Europa Challengers Cup', season: s.season, icon: '🥈' });
      recordTransaction(cClub, 35.0, 'tournament_prize', '🥈 Europa Challengers Cup Winners Prize!', s);
    }
    const rClub = club(s, runner);
    if (rClub) {
      rClub.cash = Math.round((rClub.cash + 18.0) * 10) / 10;
      recordTransaction(rClub, 18.0, 'tournament_prize', 'Europa Cup Runners-Up Prize', s);
    }
    addNews(s, `🥈 EUROPA CUP CHAMPIONS: ${champ} triumph in the Grand Final, banking ₹35.0M!`, 'competition');
    roundResults.push(res);
  }

  persist();
  return { europa: e, results: roundResults };
}

// =============================================================
// DOMESTIC FA CUP (NATIONAL CUP) ENGINE
// =============================================================
function initiateDomesticCup(s) {
  if (s.domesticCup && s.domesticCup.season === s.season) return s.domesticCup;
  const user = club(s, s.selectedClub);
  const country = user ? user.country : 'England';

  const ctyClubs = s.clubs.filter(c => c.country === country);
  const d1 = ctyClubs.filter(c => c.division === 1).slice(0, 4);
  const d2 = ctyClubs.filter(c => c.division === 2).slice(0, 4);
  const d3 = ctyClubs.filter(c => c.division === 3).slice(0, 4);
  const d4 = ctyClubs.filter(c => c.division === 4).slice(0, 4);

  let selected = [...d1, ...d2, ...d3, ...d4];
  if (user && !selected.find(x => x.name === user.name)) {
    selected[selected.length - 1] = user;
  }
  while (selected.length < 16) {
    const filler = s.clubs.find(c => !selected.find(x => x.name === c.name));
    if (filler) selected.push(filler); else break;
  }

  const shuffled = [...selected].sort(() => Math.random() - 0.5);
  const r16 = [];
  for (let i = 0; i < 16; i += 2) {
    r16.push({
      home: shuffled[i].name,
      away: shuffled[i + 1].name,
      homeDiv: shuffled[i].division,
      awayDiv: shuffled[i + 1].division,
      label: `Round of 16 Tie ${Math.floor(i / 2) + 1}`,
      homeGoals: null,
      awayGoals: null,
      penalties: null,
      winner: null,
      played: false
    });
  }

  s.domesticCup = {
    season: s.season,
    country,
    name: `${country} National FA Cup`,
    trophy: `🏆 ${country} FA Cup Trophy`,
    status: 'round_of_16',
    bracket: {
      roundOf16: r16,
      quarterFinals: [],
      semiFinals: [],
      final: null
    },
    champion: null,
    runnerUp: null
  };

  addNews(s, `🏆 FA CUP DRAW: The ${country} National FA Cup Round of 16 draw completed! All 4 tiers collide in knockout combat.`, 'competition');
  persist();
  return s.domesticCup;
}

function simulateDomesticCupRound(s) {
  if (!s.domesticCup || s.domesticCup.season !== s.season) initiateDomesticCup(s);
  const cup = s.domesticCup;
  if (cup.status === 'completed') return { error: 'Domestic Cup already completed this season.' };

  const user = club(s, s.selectedClub);
  const roundResults = [];

  if (cup.status === 'round_of_16') {
    const winners = [];
    cup.bracket.roundOf16.forEach(tie => {
      const res = match(s, tie.home, tie.away, {
        isCup: true,
        cupStage: 'National Cup R16',
        competitionName: `${cup.name} · ${tie.label}`,
        isAiOnly: (user?.name !== tie.home && user?.name !== tie.away)
      });
      tie.homeGoals = res.homeGoals;
      tie.awayGoals = res.awayGoals;
      tie.penalties = res.penalties;
      tie.winner = res.cupWinner || (res.homeGoals > res.awayGoals ? tie.home : tie.away);
      tie.played = true;
      winners.push(tie.winner);
      roundResults.push(res);
    });

    cup.status = 'quarter_finals';
    cup.bracket.quarterFinals = [
      { home: winners[0], away: winners[1], label: 'QF 1', played: false },
      { home: winners[2], away: winners[3], label: 'QF 2', played: false },
      { home: winners[4], away: winners[5], label: 'QF 3', played: false },
      { home: winners[6], away: winners[7], label: 'QF 4', played: false }
    ];
    addNews(s, `🏆 FA CUP QFs: 8 survivors progress into the National FA Cup Quarter-Finals!`, 'competition');
  } else if (cup.status === 'quarter_finals') {
    const winners = [];
    cup.bracket.quarterFinals.forEach(qf => {
      const res = match(s, qf.home, qf.away, {
        isCup: true,
        cupStage: 'National Cup QF',
        competitionName: `${cup.name} · ${qf.label}`,
        isAiOnly: (user?.name !== qf.home && user?.name !== qf.away)
      });
      qf.homeGoals = res.homeGoals;
      qf.awayGoals = res.awayGoals;
      qf.penalties = res.penalties;
      qf.winner = res.cupWinner || (res.homeGoals > res.awayGoals ? qf.home : qf.away);
      qf.played = true;
      winners.push(qf.winner);
      roundResults.push(res);
    });

    cup.status = 'semi_finals';
    cup.bracket.semiFinals = [
      { home: winners[0], away: winners[2], label: 'Semi-Final 1 (Wembley Arena)', played: false },
      { home: winners[1], away: winners[3], label: 'Semi-Final 2 (Wembley Arena)', played: false }
    ];
    addNews(s, `🏆 FA CUP SEMIS: The National FA Cup Final Four battle at the National Stadium!`, 'competition');
  } else if (cup.status === 'semi_finals') {
    const finalPairs = [];
    cup.bracket.semiFinals.forEach(sf => {
      const res = match(s, sf.home, sf.away, {
        isCup: true,
        cupStage: 'National Cup Semi-Final',
        competitionName: `${cup.name} · ${sf.label}`,
        isAiOnly: (user?.name !== sf.home && user?.name !== sf.away)
      });
      sf.homeGoals = res.homeGoals;
      sf.awayGoals = res.awayGoals;
      sf.penalties = res.penalties;
      sf.winner = res.cupWinner || (res.homeGoals > res.awayGoals ? sf.home : sf.away);
      sf.played = true;
      finalPairs.push(sf.winner);
      roundResults.push(res);
    });

    cup.status = 'final';
    cup.bracket.final = { home: finalPairs[0], away: finalPairs[1], label: 'Grand Cup Final', played: false };
    addNews(s, `🏆 FA CUP FINAL: ${finalPairs[0]} vs ${finalPairs[1]} square off in the National FA Cup Final!`, 'competition');
  } else if (cup.status === 'final') {
    const fn = cup.bracket.final;
    const res = match(s, fn.home, fn.away, {
      isCup: true,
      cupStage: 'National Cup Final',
      competitionName: `${cup.name} · 🏆 GRAND FINAL`,
      isAiOnly: (user?.name !== fn.home && user?.name !== fn.away)
    });
    fn.homeGoals = res.homeGoals;
    fn.awayGoals = res.awayGoals;
    fn.penalties = res.penalties;
    const champ = res.cupWinner || (res.homeGoals > res.awayGoals ? fn.home : fn.away);
    const runner = (champ === fn.home) ? fn.away : fn.home;
    fn.winner = champ;
    fn.played = true;
    cup.champion = champ;
    cup.runnerUp = runner;
    cup.status = 'completed';

    const cClub = club(s, champ);
    if (cClub) {
      cClub.cash = Math.round((cClub.cash + 22.0) * 10) / 10;
      cClub.reputation = Math.min(99, (cClub.reputation || 60) + 6);
      cClub.trophyCabinet = cClub.trophyCabinet || [];
      cClub.trophyCabinet.unshift({ id: `facup_s${s.season}`, type: 'cup', name: `${cup.country} FA Cup`, season: s.season, icon: '🏆' });
      recordTransaction(cClub, 22.0, 'tournament_prize', `🏆 ${cup.country} FA Cup Winners Silverware!`, s);
    }
    const rClub = club(s, runner);
    if (rClub) {
      rClub.cash = Math.round((rClub.cash + 10.0) * 10) / 10;
      recordTransaction(rClub, 10.0, 'tournament_prize', 'FA Cup Finalist Bounty', s);
    }
    addNews(s, `🏆 FA CUP HEROES: ${champ} win the ${cup.name} in dramatic fashion, taking ₹22.0M!`, 'competition');
    roundResults.push(res);
  }

  persist();
  return { cup, results: roundResults };
}

// =============================================================
// PROMOTION / RELEGATION PLAYOFF BRACKETS ENGINE
// =============================================================
function initiatePlayoffs(s) {
  if (s.playoffs && s.playoffs.season === s.season) return s.playoffs;
  const user = club(s, s.selectedClub);
  const country = user ? user.country : 'England';

  const d2Clubs = s.clubs.filter(c => c.country === country && c.division === 2).sort((a,b) => (b.stats?.points || 0) - (a.stats?.points || 0));
  const d3Clubs = s.clubs.filter(c => c.country === country && c.division === 3).sort((a,b) => (b.stats?.points || 0) - (a.stats?.points || 0));

  const d2Contenders = d2Clubs.slice(2, 6);
  const d3Contenders = d3Clubs.slice(2, 6);

  const d2Bracket = {
    division: 2,
    targetDivision: 1,
    name: 'Division 2 -> Division 1 Promotion Playoff',
    status: 'semi_finals',
    semiFinals: [
      { home: d2Contenders[0]?.name || 'Division 2 3rd', away: d2Contenders[3]?.name || 'Division 2 6th', label: 'SF 1 (3rd vs 6th)', played: false },
      { home: d2Contenders[1]?.name || 'Division 2 4th', away: d2Contenders[2]?.name || 'Division 2 5th', label: 'SF 2 (4th vs 5th)', played: false }
    ],
    final: null,
    winner: null
  };

  const d3Bracket = {
    division: 3,
    targetDivision: 2,
    name: 'Division 3 -> Division 2 Promotion Playoff',
    status: 'semi_finals',
    semiFinals: [
      { home: d3Contenders[0]?.name || 'Division 3 3rd', away: d3Contenders[3]?.name || 'Division 3 6th', label: 'SF 1 (3rd vs 6th)', played: false },
      { home: d3Contenders[1]?.name || 'Division 3 4th', away: d3Contenders[2]?.name || 'Division 3 5th', label: 'SF 2 (4th vs 5th)', played: false }
    ],
    final: null,
    winner: null
  };

  s.playoffs = {
    season: s.season,
    country,
    d2: d2Bracket,
    d3: d3Bracket
  };

  addNews(s, `⚔️ PLAYOFF BRACKETS: Promotion playoffs locked in! 4 clubs in Division 2 and Division 3 contest the high-stakes promotion finals.`, 'league');
  persist();
  return s.playoffs;
}

function simulatePlayoffsRound(s, targetTier = 2) {
  if (!s.playoffs || s.playoffs.season !== s.season) initiatePlayoffs(s);
  const p = targetTier === 2 ? s.playoffs.d2 : s.playoffs.d3;
  if (!p) return { error: 'Playoff division not found.' };
  if (p.status === 'completed') return { error: `${p.name} is already finished.` };

  const user = club(s, s.selectedClub);
  const roundResults = [];

  if (p.status === 'semi_finals') {
    const finalPairs = [];
    p.semiFinals.forEach(sf => {
      const res = match(s, sf.home, sf.away, {
        isCup: true,
        cupStage: 'Promotion Playoff Semi-Final',
        competitionName: `${p.name} · ${sf.label}`,
        isAiOnly: (user?.name !== sf.home && user?.name !== sf.away)
      });
      sf.homeGoals = res.homeGoals;
      sf.awayGoals = res.awayGoals;
      sf.penalties = res.penalties;
      sf.winner = res.cupWinner || (res.homeGoals > res.awayGoals ? sf.home : sf.away);
      sf.played = true;
      finalPairs.push(sf.winner);
      roundResults.push(res);
    });

    p.status = 'final';
    p.final = {
      home: finalPairs[0],
      away: finalPairs[1],
      label: '🏆 PLAYOFF FINAL (Promotion Showdown)',
      played: false
    };
    addNews(s, `⚔️ PLAYOFF FINAL: ${finalPairs[0]} vs ${finalPairs[1]} in the ₹100M Promotion Showdown!`, 'league');
  } else if (p.status === 'final') {
    const fn = p.final;
    const res = match(s, fn.home, fn.away, {
      isCup: true,
      cupStage: 'Promotion Playoff Final',
      competitionName: `${p.name} · 🏆 PLAYOFF FINAL`,
      isAiOnly: (user?.name !== fn.home && user?.name !== fn.away)
    });
    fn.homeGoals = res.homeGoals;
    fn.awayGoals = res.awayGoals;
    fn.penalties = res.penalties;
    const promotedClubName = res.cupWinner || (res.homeGoals > res.awayGoals ? fn.home : fn.away);
    fn.winner = promotedClubName;
    fn.played = true;
    p.winner = promotedClubName;
    p.status = 'completed';

    const pClub = club(s, promotedClubName);
    if (pClub) {
      pClub.division = p.targetDivision;
      pClub.promotions = (pClub.promotions || 0) + 1;
      const bounty = targetTier === 2 ? 15.0 : 8.0;
      pClub.cash = Math.round((pClub.cash + bounty) * 10) / 10;
      pClub.reputation = Math.min(99, (pClub.reputation || 60) + 4);
      recordTransaction(pClub, bounty, 'promotion_prize', `⬆️ Playoff Final Victory! Promoted to Division ${p.targetDivision}!`, s);
    }
    addNews(s, `⬆️ PLAYOFF GLORY: ${promotedClubName} WIN THE PLAYOFF FINAL AND ARE PROMOTED TO DIVISION ${p.targetDivision}!`, 'league');
    roundResults.push(res);
  }

  persist();
  return { playoffs: s.playoffs, results: roundResults };
}

// =============================================================
// DEADLINE DAY ENGINE: LIVE COUNTDOWN & BREAKING TICKER
// =============================================================
function getDeadlineDayState(s) {
  if (!s.deadlineDay) {
    s.deadlineDay = {
      hoursLeft: 10,
      active: true,
      newsTicker: [
        { time: '14:00', text: '🔥 BREAKING: Rumors swirl that Paris FC submitted a shock ₹80M bid for Madrid CF captain.' },
        { time: '15:30', text: '🩺 MEDICAL ALERT: South Coast FC agreement reached with star winger; player currently undergoing medical.' },
        { time: '17:00', text: '⚡ HIJACK ATTEMPT: Manchester Blue trying to gazump Bayern for top continental midfield maestro!' },
        { time: '18:45', text: '🚨 DEADLINE CLOCK: Less than 6 hours remaining before the official international transfer window closes!' }
      ]
    };
  }
  return s.deadlineDay;
}

function executeDeadlineDayAction(s, action, data) {
  const d = getDeadlineDayState(s);
  const user = club(s, s.selectedClub);

  if (action === 'advance_hour') {
    if (d.hoursLeft > 0) d.hoursLeft--;
    const randomClubs = s.clubs.filter(c => c.name !== user?.name);
    const c1 = randomClubs[Math.floor(Math.random() * randomClubs.length)]?.name || 'Rival Club';
    const c2 = randomClubs[Math.floor(Math.random() * randomClubs.length)]?.name || 'Continental Giant';
    const hourStr = `${24 - d.hoursLeft}:00`;

    const flashAlerts = [
      `⏰ ${hourStr} FLASH: ${c1} submit urgent ₹45M bid for ${c2} talisman as deadline looms!`,
      `🚨 ${hourStr} DRAMA: Private jet spotted in London — ${c1} pushing paperwork to beat midnight embargo!`,
      `📄 ${hourStr} OFFICIAL: Deal sheet submitted with league authorities with seconds to spare!`
    ];
    d.newsTicker.unshift({ time: hourStr, text: flashAlerts[Math.floor(Math.random() * flashAlerts.length)] });
    if (d.newsTicker.length > 15) d.newsTicker.pop();

    if (d.hoursLeft === 0) {
      d.active = false;
      addNews(s, `🕛 DEADLINE WINDOW SHUT: The international transfer window has officially closed! All rosters are sealed.`, 'transfer');
    }
    persist();
    return { ok: true, state: d };
  }

  if (action === 'panic_buy') {
    const p = s.market.find(x => x.id === data.playerId);
    if (!p) return { error: 'Player not found on market.' };
    const fee = Math.round((p.askingPrice || 10) * 1.25 * 10) / 10;
    if (user.cash < fee) return { error: `Insufficient funds for panic buy (Need ₹${fee}M).` };

    user.cash = Math.round((user.cash - fee) * 10) / 10;
    p.ownerClub = user.name;
    p.status = 'contracted';
    user.players.push(p.id);
    recordTransaction(user, -fee, 'transfer_fee', `⚡ Deadline Day Panic Buy: ${p.name} from market`, s);
    addNews(s, `⚡ BUZZER-BEATER SIGNING: ${user.name} beat the clock to capture ${p.name} for ₹${fee}M!`, 'transfer');
    d.newsTicker.unshift({ time: '23:58', text: `🚨 CONFIRMED DEAL: ${user.name} complete dramatic late deadline transfer for ${p.name}!` });
    persist();
    return { ok: true, player: p, fee };
  }

  return { error: 'Unknown deadline day action.' };
}

// =============================================================
// FEATURE A: ADVANCED TRANSFER STRUCTURES (SWAPS & CLAUSES)
// =============================================================
function executeSwapTransfer(s, userClubName, offeredPlayerId, targetPlayerId, additionalCash = 0) {
  const uClub = club(s, userClubName || s.selectedClub);
  const tPlayer = player(s, targetPlayerId);
  const oPlayer = player(s, offeredPlayerId);

  if (!uClub || !tPlayer || !oPlayer) return { error: 'Clubs or players not found for swap deal.' };
  if (oPlayer.ownerClub !== uClub.name) return { error: 'Offered player is not owned by your club.' };

  const sClub = club(s, tPlayer.ownerClub);
  const cash = Math.max(0, Number(additionalCash) || 0);

  if (cash > uClub.cash) return { error: `Insufficient club funds to include ₹${cash}M cash in the swap deal.` };

  // Execute swap
  uClub.players = (uClub.players || []).filter(id => id !== oPlayer.id);
  uClub.players.push(tPlayer.id);
  tPlayer.ownerClub = uClub.name;
  tPlayer.status = 'contracted';

  if (sClub) {
    sClub.players = (sClub.players || []).filter(id => id !== tPlayer.id);
    sClub.players.push(oPlayer.id);
    oPlayer.ownerClub = sClub.name;
    sClub.cash = Math.round((sClub.cash + cash) * 10) / 10;
  } else {
    oPlayer.ownerClub = 'Free Market';
  }

  uClub.cash = Math.round((uClub.cash - cash) * 10) / 10;
  if (cash > 0) {
    recordTransaction(uClub, -cash, 'transfer_fee', `🔄 Player Swap: Signed ${tPlayer.name} with ${oPlayer.name} + ₹${cash}M moving in exchange`, s);
  }
  addNews(s, `🔄 PLAYER SWAP COMPLETED: ${uClub.name} acquire ${tPlayer.name} (${tPlayer.rating} OVR) with ${oPlayer.name} (${oPlayer.rating} OVR) joining ${sClub ? sClub.name : 'the market'} (+₹${cash}M)!`, 'transfer');
  persist();
  return { ok: true, targetPlayer: tPlayer, offeredPlayer: oPlayer, cash };
}

// =============================================================
// FEATURE B: DRESSING ROOM REVOLTS & 1-ON-1 SUPERSTAR TALKS
// =============================================================
function getDressingRoomStatus(s, clubName) {
  const c = club(s, clubName || s.selectedClub);
  if (!c) return { hierarchy: {}, rebels: [], harmony: 85 };

  const squad = clubPlayers(s, c);
  const captains = squad.filter(p => (p.rating || 70) >= 84 || (p.age || 25) >= 29).slice(0, 3);
  const leaders = squad.filter(p => !captains.find(x => x.id === p.id) && ((p.rating || 70) >= 78 || (p.form || 70) >= 80)).slice(0, 5);
  const core = squad.filter(p => !captains.find(x => x.id === p.id) && !leaders.find(x => x.id === p.id)).slice(0, 10);

  const rebels = squad.filter(p => 
    (p.form && p.form < 60) || 
    (p.promisedStarts && p.promisedStarts > 0) ||
    ((p.contract && p.contract.years <= 1) && (p.rating || 70) >= 76)
  ).map(p => ({
    id: p.id,
    name: p.name,
    position: p.position,
    rating: p.rating,
    age: p.age,
    morale: p.form || 65,
    reason: (p.contract && p.contract.years <= 1) ? 'Demanding lucrative contract renewal or Champions League football' : (p.promisedStarts ? `Awaiting ${p.promisedStarts} guaranteed starting appearances` : 'Frustrated with tactical rotation and lack of regular minutes')
  }));

  if (rebels.length === 0 && squad.length > 5) {
    const candidate = squad.find(p => p.rating >= 75) || squad[0];
    rebels.push({
      id: candidate.id,
      name: candidate.name,
      position: candidate.position,
      rating: candidate.rating,
      age: candidate.age,
      morale: 62,
      reason: 'Discontent with squad rotation policy; seeks meeting with Head Coach'
    });
  }

  const harmony = Math.max(40, Math.min(99, Math.round(c.morale * 0.9 + (rebels.length === 0 ? 10 : -rebels.length * 6))));

  return {
    hierarchy: { captains, leaders, core },
    rebels,
    harmony,
    clubMorale: c.morale
  };
}

function resolveDressingRoomTalk(s, clubName, playerId, action) {
  const c = club(s, clubName || s.selectedClub);
  const p = player(s, playerId);
  if (!c || !p) return { error: 'Club or player not found.' };

  let message = '';
  if (action === 'promise_starts') {
    p.promisedStarts = 3;
    p.form = Math.min(99, (p.form || 70) + 12);
    c.morale = Math.min(99, c.morale + 4);
    message = `🤝 Pact Agreed: You promised ${p.name} regular starts in the next 3 fixtures. Player morale restored!`;
    addNews(s, `🗣️ DRESSING ROOM SUMMIT: ${c.name} manager held 1-on-1 summit with ${p.name}, guaranteeing key starting roles.`, 'board');
  } else if (action === 'pay_raise') {
    if (p.contract) {
      p.contract.salary = Math.round((p.contract.salary * 1.25) * 10) / 10;
      p.contract.years = (p.contract.years || 2) + 2;
    }
    p.form = Math.min(99, (p.form || 70) + 20);
    c.morale = Math.min(99, c.morale + 5);
    message = `✍️ Lucrative Terms: Extended ${p.name}'s contract by 2 seasons with a 25% pay bump. Unrest resolved!`;
    addNews(s, `💰 CONTRACT EXTENSION: ${p.name} committed their future to ${c.name} following private boardroom talks.`, 'transfer');
  } else if (action === 'fine_wages') {
    p.form = Math.max(45, (p.form || 70) - 10);
    c.morale = Math.max(50, c.morale - 2);
    c.cash = Math.round((c.cash + 0.3) * 10) / 10;
    message = `⚡ Strict Discipline: Fined ${p.name} 2 weeks' wages for insubordination. Squad discipline reinforced (+₹0.3M).`;
    addNews(s, `⚠️ DISCIPLINARY SANCTION: ${c.name} management issued a 2-week wage fine to ${p.name} for breach of code.`, 'board');
  } else if (action === 'armband') {
    p.form = Math.min(99, (p.form || 70) + 25);
    c.morale = Math.min(99, c.morale + 6);
    message = `👑 Vice-Captaincy Appointed: Awarded ${p.name} official leadership status. Loyalty secured!`;
    addNews(s, `👑 LEADERSHIP APPOINTMENT: ${p.name} named Vice-Captain of ${c.name} during dressing room address.`, 'board');
  }

  persist();
  return { ok: true, message, player: p, updatedDressingRoom: getDressingRoomStatus(s, c.name) };
}

// =============================================================
// FEATURE C: INTERNATIONAL MANAGEMENT MODE (DUAL ROLE)
// =============================================================
function getInternationalStatus(s, clubName) {
  const c = club(s, clubName || s.selectedClub);
  const managerRep = c?.reputation || 70;

  if (!s.international) {
    const nationPool = ['England', 'Brazil', 'France', 'Spain', 'Germany', 'Argentina', 'Portugal', 'Netherlands', 'Italy', 'India'];
    const offers = [
      { nation: nationPool[(s.season + 1) % nationPool.length], repRequired: 65, prestige: 'Tier 1 Football Powerhouse' },
      { nation: nationPool[(s.season + 3) % nationPool.length], repRequired: 70, prestige: 'Continental Heavyweight' },
      { nation: nationPool[(s.season + 5) % nationPool.length], repRequired: 60, prestige: 'Rising Global Contender' }
    ];

    s.international = {
      currentNation: managerRep >= 75 ? (c?.country || 'England') : null,
      availableOffers: offers,
      season: s.season,
      tournament: {
        name: 'World Nations Championship',
        status: 'quarter_finals',
        quarterFinals: [
          { home: 'England', away: 'Germany', homeGoals: null, awayGoals: null, played: false, winner: null },
          { home: 'Brazil', away: 'Spain', homeGoals: null, awayGoals: null, played: false, winner: null },
          { home: 'France', away: 'Portugal', homeGoals: null, awayGoals: null, played: false, winner: null },
          { home: 'Argentina', away: 'Netherlands', homeGoals: null, awayGoals: null, played: false, winner: null }
        ],
        semiFinals: [],
        final: null,
        champion: null
      }
    };
  }

  return s.international;
}

function acceptInternationalRole(s, nation) {
  const intl = getInternationalStatus(s);
  intl.currentNation = nation;
  addNews(s, `🌍 INTERNATIONAL APPOINTMENT: Congratulations! You have officially been appointed Head Manager of the ${nation} National Team!`, 'competition');
  persist();
  return { ok: true, nation, international: intl };
}

function simulateInternationalMatch(s) {
  const intl = getInternationalStatus(s);
  const t = intl.tournament;
  if (!t || t.status === 'completed') return { error: 'International tournament already concluded.' };

  const roundResults = [];
  if (t.status === 'quarter_finals') {
    const winners = [];
    t.quarterFinals.forEach(qf => {
      const hg = Math.floor(Math.random() * 4);
      let ag = Math.floor(Math.random() * 3);
      if (hg === ag) ag++;
      qf.homeGoals = hg;
      qf.awayGoals = ag;
      qf.winner = hg > ag ? qf.home : qf.away;
      qf.played = true;
      winners.push(qf.winner);
      roundResults.push(qf);
    });

    t.status = 'semi_finals';
    t.semiFinals = [
      { home: winners[0], away: winners[1], homeGoals: null, awayGoals: null, played: false, winner: null },
      { home: winners[2], away: winners[3], homeGoals: null, awayGoals: null, played: false, winner: null }
    ];
    addNews(s, `🌍 WORLD NATIONS SEMIS: ${winners.join(', ')} advance to the International Final Four!`, 'competition');
  } else if (t.status === 'semi_finals') {
    const finalPairs = [];
    t.semiFinals.forEach(sf => {
      const hg = Math.floor(Math.random() * 3) + 1;
      let ag = Math.floor(Math.random() * 3);
      if (hg === ag) ag++;
      sf.homeGoals = hg;
      sf.awayGoals = ag;
      sf.winner = hg > ag ? sf.home : sf.away;
      sf.played = true;
      finalPairs.push(sf.winner);
      roundResults.push(sf);
    });

    t.status = 'final';
    t.final = { home: finalPairs[0], away: finalPairs[1], homeGoals: null, awayGoals: null, played: false, winner: null };
    addNews(s, `🌍 WORLD NATIONS FINAL: ${finalPairs[0]} vs ${finalPairs[1]} for the International World Crown!`, 'competition');
  } else if (t.status === 'final') {
    const fn = t.final;
    const hg = Math.floor(Math.random() * 3) + 1;
    let ag = Math.floor(Math.random() * 2);
    if (hg === ag) ag++;
    fn.homeGoals = hg;
    fn.awayGoals = ag;
    fn.winner = hg > ag ? fn.home : fn.away;
    fn.played = true;
    t.champion = fn.winner;
    t.status = 'completed';

    addNews(s, `👑 INTERNATIONAL WORLD CHAMPIONS: ${fn.winner} lift the World Nations Championship Trophy!`, 'competition');
    roundResults.push(fn);
  }

  persist();
  return { ok: true, tournament: t, results: roundResults };
}

// =============================================================
// FEATURE D: VISUAL STADIUM BUILDER & FAN ULTRAS TIFOS
// =============================================================
function getStadiumVisualState(s, clubName) {
  const c = club(s, clubName || s.selectedClub);
  if (!c) return null;

  c.stadiumVisual = c.stadiumVisual || {
    roofLevel: 1,
    terraceLevel: 1,
    skyboxLevel: 1,
    ledLevel: 1,
    floodlightLevel: 1,
    activeTifo: 'rampant_lion'
  };

  return {
    club: c.name,
    capacity: c.stadiumCapacity || 25000,
    modules: c.stadiumVisual
  };
}

function upgradeStadiumModule(s, clubName, moduleType) {
  const c = club(s, clubName || s.selectedClub);
  if (!c) return { error: 'Club not found.' };

  c.stadiumVisual = c.stadiumVisual || { roofLevel: 1, terraceLevel: 1, skyboxLevel: 1, ledLevel: 1, floodlightLevel: 1, activeTifo: 'rampant_lion' };

  const costs = {
    roofLevel: 8.0,
    terraceLevel: 5.0,
    skyboxLevel: 7.0,
    ledLevel: 3.5,
    floodlightLevel: 3.0
  };

  const cost = costs[moduleType] || 5.0;
  if (c.cash < cost) return { error: `Insufficient club treasury funds (Need ₹${cost}M).` };

  c.cash = Math.round((c.cash - cost) * 10) / 10;
  c.stadiumVisual[moduleType] = (c.stadiumVisual[moduleType] || 1) + 1;
  c.reputation = Math.min(99, (c.reputation || 60) + 2);
  c.stadiumCapacity = (c.stadiumCapacity || 25000) + 2500;

  recordTransaction(c, -cost, 'facility_investment', `🏗️ Stadium Architectural Upgrade: ${moduleType} to Tier ${c.stadiumVisual[moduleType]}`, s);
  addNews(s, `🏗️ STADIUM EXPANSION: ${c.name} unveiled structural upgrades (${moduleType} Tier ${c.stadiumVisual[moduleType]}). New capacity: ${c.stadiumCapacity} fans!`, 'finance');
  persist();
  return { ok: true, state: c.stadiumVisual, capacity: c.stadiumCapacity, cash: c.cash };
}

function setStadiumTifo(s, clubName, tifo) {
  const c = club(s, clubName || s.selectedClub);
  if (!c) return { error: 'Club not found.' };

  c.stadiumVisual = c.stadiumVisual || { roofLevel: 1, terraceLevel: 1, skyboxLevel: 1, ledLevel: 1, floodlightLevel: 1, activeTifo: 'rampant_lion' };
  c.stadiumVisual.activeTifo = tifo;
  addNews(s, `🎨 ULTRAS DISPLAY: ${c.name} supporters unveiled a new stadium-wide choreography: '${tifo.toUpperCase()}'!`, 'fans');
  persist();
  return { ok: true, activeTifo: tifo };
}

// =============================================================
// FEATURE E: DERBY DAY & HISTORICAL HEAD-TO-HEAD ARCHIVES
// =============================================================
function getDerbyHeadToHead(s, clubName) {
  const c = club(s, clubName || s.selectedClub);
  if (!c) return null;

  const rival = club(s, c.rivalName) || s.clubs.find(x => x.country === c.country && x.division === c.division && x.name !== c.name);
  const rivalName = rival ? rival.name : 'Arch Rival FC';
  const derbyTitle = c.derbyName || `${c.name} vs ${rivalName} Classic`;

  const totalPlayed = 14 + (s.season * 2);
  const wins = Math.round(totalPlayed * 0.45);
  const draws = Math.round(totalPlayed * 0.25);
  const losses = totalPlayed - wins - draws;

  return {
    club: c.name,
    rival: rivalName,
    derbyTitle,
    record: {
      played: totalPlayed,
      wins,
      draws,
      losses,
      goalsFor: wins * 2 + draws + 8,
      goalsAgainst: losses * 2 + draws + 4,
      biggestWin: `${c.name} 4 - 0 ${rivalName}`,
      recentResults: [
        { season: s.season - 1, score: `${c.name} 2 - 1 ${rivalName}`, verdict: 'W' },
        { season: s.season - 1, score: `${rivalName} 1 - 1 ${c.name}`, verdict: 'D' },
        { season: s.season - 2, score: `${c.name} 3 - 0 ${rivalName}`, verdict: 'W' },
        { season: s.season - 2, score: `${rivalName} 2 - 0 ${c.name}`, verdict: 'L' }
      ]
    }
  };
}

// =============================================================
// MODULE 1: CUSTOM TACTICAL PLAYBOOKS & PHILOSOPHY PRESETS
// =============================================================
const TACTICAL_PRESETS = {
  gegenpress: {
    id: 'gegenpress',
    name: 'Gegenpress (Heavy Metal)',
    description: 'Relentless forward pressure upon losing possession. Fast transitions, aggressive counter-press, high defensive line.',
    pressing: 90,
    defensiveLine: 85,
    tempo: 85,
    width: 65,
    staminaDrain: 1.3,
    counterBonus: 1.25,
    icon: '⚡'
  },
  tikitaka: {
    id: 'tikitaka',
    name: 'Tiki-Taka (Positional Master)',
    description: 'Dominate possession through short triangular passing, patient probing, and rapid ball circulation in the opponent half.',
    pressing: 70,
    defensiveLine: 70,
    tempo: 45,
    width: 50,
    staminaDrain: 0.9,
    possessionBonus: 1.3,
    icon: '🎯'
  },
  catenaccio: {
    id: 'catenaccio',
    name: 'Catenaccio (Fortress Low Block)',
    description: 'Impenetrable deep defensive wall, rigid discipline, and devastating direct counter-attacks behind retreating opponents.',
    pressing: 35,
    defensiveLine: 25,
    tempo: 75,
    width: 40,
    staminaDrain: 0.8,
    defensiveBonus: 1.35,
    icon: '🛡️'
  },
  route_one: {
    id: 'route_one',
    name: 'Route One (Direct Target Man)',
    description: 'Bypass the midfield with long aerial diagonal balls to a physical target forward. Dominant set-pieces and second balls.',
    pressing: 55,
    defensiveLine: 45,
    tempo: 90,
    width: 75,
    staminaDrain: 1.0,
    aerialBonus: 1.3,
    icon: '🚀'
  },
  total_football: {
    id: 'total_football',
    name: 'Fluid Total Football',
    description: 'Dynamic interchangeable positions, overlapping wingbacks, and total creative freedom across all phases of play.',
    pressing: 75,
    defensiveLine: 80,
    tempo: 70,
    width: 85,
    staminaDrain: 1.15,
    creativityBonus: 1.25,
    icon: '🌊'
  }
};

function getTacticalPlaybookState(s, clubName) {
  const c = club(s, clubName || s.selectedClub);
  if (!c) return null;
  c.tactics = c.tactics || {
    preset: 'gegenpress',
    pressing: 85,
    defensiveLine: 75,
    tempo: 80,
    width: 65,
    instructions: ['trigger_press', 'work_ball_into_box', 'overlap_wingbacks']
  };
  return {
    club: c.name,
    tactics: c.tactics,
    presets: TACTICAL_PRESETS
  };
}

function updateTacticalPlaybook(s, clubName, playbookData) {
  const c = club(s, clubName || s.selectedClub);
  if (!c) return { error: 'Club not found' };
  c.tactics = {
    ...c.tactics,
    ...(playbookData || {})
  };
  addNews(s, `📋 ${c.name} manager implemented a new tactical blueprint: ${c.tactics.preset ? c.tactics.preset.toUpperCase() : 'Custom Tactical Identity'}.`, 'tactics');
  persist();
  return { success: true, tactics: c.tactics };
}

// =============================================================
// MODULE 2: SPORTS SCIENCE & MEDICAL REHABILITATION WING
// =============================================================
function getMedicalCenterState(s, clubName) {
  const c = club(s, clubName || s.selectedClub);
  if (!c) return null;
  const players = clubPlayers(s, c);

  c.medical = c.medical || {
    physioTier: 1,
    cryoChamber: false,
    hydroPool: false,
    injuries: []
  };

  if (!c.medical.injuries.length && players.length > 5) {
    const candidate = players[players.length - 2];
    if (candidate) {
      c.medical.injuries.push({
        playerId: candidate.id,
        playerName: candidate.name,
        position: candidate.position,
        type: 'Hamstring Strain',
        severity: 'Moderate',
        weeksRemaining: 2,
        fitToPlayRisk: 'High (70% re-injury chance)',
        cause: 'Overload in recent high-tempo match'
      });
    }
  }

  const riskRoster = players.map(p => {
    const injuryRisk = (p.stamina && p.stamina < 70) ? 'High' : (p.stamina && p.stamina < 85) ? 'Moderate' : 'Low';
    const isInjured = c.medical.injuries.some(inj => inj.playerId === p.id);
    return {
      id: p.id,
      name: p.name,
      position: p.position,
      rating: p.rating,
      stamina: p.stamina || Math.min(100, 75 + Math.floor(Math.random() * 20)),
      injuryRisk: isInjured ? 'Injured' : injuryRisk,
      isInjured
    };
  });

  return {
    club: c.name,
    medical: c.medical,
    riskRoster,
    upgrades: [
      { id: 'physio', name: 'Elite Orthopedic Physio Team', cost: 1.5, perk: 'Reduces all recovery times by 25%', active: c.medical.physioTier >= 2 },
      { id: 'cryo', name: 'Cryotherapy Recovery Pods', cost: 2.2, perk: 'Restores match stamina +15% faster after fixtures', active: !!c.medical.cryoChamber },
      { id: 'hydro', name: 'Hydrotherapy Rehabilitation Pool', cost: 3.0, perk: 'Virtually eliminates recurrence of muscle strains', active: !!c.medical.hydroPool }
    ]
  };
}

function executeMedicalAction(s, clubName, action, data) {
  const c = club(s, clubName || s.selectedClub);
  if (!c) return { error: 'Club not found' };
  c.medical = c.medical || { physioTier: 1, cryoChamber: false, hydroPool: false, injuries: [] };

  if (action === 'upgrade') {
    const upg = data.upgradeId;
    if (upg === 'physio') {
      if (c.cash < 1.5) return { error: 'Insufficient funds (₹1.5M required).' };
      c.cash = Math.round((c.cash - 1.5) * 10) / 10;
      c.medical.physioTier = 2;
      recordTransaction(c, 1.5, 'facility', 'Upgraded to Elite Orthopedic Physio Staff', s);
      addNews(s, `🏥 ${c.name} hired an Elite Sports Science and Physio team to safeguard squad fitness.`, 'club');
    } else if (upg === 'cryo') {
      if (c.cash < 2.2) return { error: 'Insufficient funds (₹2.2M required).' };
      c.cash = Math.round((c.cash - 2.2) * 10) / 10;
      c.medical.cryoChamber = true;
      recordTransaction(c, 2.2, 'facility', 'Installed Cryotherapy Recovery Chambers', s);
      addNews(s, `❄️ ${c.name} unveiled state-of-the-art Cryotherapy Pods at the training complex.`, 'club');
    } else if (upg === 'hydro') {
      if (c.cash < 3.0) return { error: 'Insufficient funds (₹3.0M required).' };
      c.cash = Math.round((c.cash - 3.0) * 10) / 10;
      c.medical.hydroPool = true;
      recordTransaction(c, 3.0, 'facility', 'Installed Hydrotherapy Rehabilitation Pool', s);
      addNews(s, `🏊 ${c.name} completed construction on an advanced Hydrotherapy Rehabilitation Pool.`, 'club');
    }
    persist();
    return { success: true, medical: c.medical, cash: c.cash };
  }

  if (action === 'treat_specialist') {
    const inj = c.medical.injuries.find(x => x.playerId === data.playerId);
    if (!inj) return { error: 'Player injury record not found.' };
    if (c.cash < 0.8) return { error: 'Specialist consultation fee of ₹0.8M required.' };
    c.cash = Math.round((c.cash - 0.8) * 10) / 10;
    inj.weeksRemaining = Math.max(0, inj.weeksRemaining - 2);
    if (inj.weeksRemaining === 0) {
      c.medical.injuries = c.medical.injuries.filter(x => x.playerId !== data.playerId);
      addNews(s, `🩺 ${inj.playerName} has fully recovered following private surgery in Zurich!`, 'medical');
    } else {
      addNews(s, `🩺 ${inj.playerName} recovery expedited by world specialist Dr. Muller (+2 weeks sooner).`, 'medical');
    }
    recordTransaction(c, 0.8, 'medical', `Specialist Clinic Treatment for ${inj.playerName}`, s);
    persist();
    return { success: true, medical: c.medical, cash: c.cash };
  }

  if (action === 'injection') {
    const inj = c.medical.injuries.find(x => x.playerId === data.playerId);
    if (!inj) return { error: 'Player injury not found.' };
    c.medical.injuries = c.medical.injuries.filter(x => x.playerId !== data.playerId);
    addNews(s, `💉 ${inj.playerName} was administered a painkiller injection to start this matchday! (High risk gamble)`, 'medical');
    persist();
    return { success: true, playerCleared: true };
  }

  return { error: 'Invalid medical action' };
}

// =============================================================
// MODULE 3: THE LOAN ARMY & WONDERKID DEVELOPMENT NETWORK
// =============================================================
function getLoanArmyState(s, clubName) {
  const c = club(s, clubName || s.selectedClub);
  if (!c) return null;
  c.loans = Array.isArray(c.loans) ? c.loans : [];

  if (!c.loans.length) {
    c.loans.push({
      id: 'loan_1',
      playerId: 'seed_loan_p1',
      playerName: 'Lucas Morales',
      position: 'AMF',
      rating: 74,
      potential: 86,
      destinationClub: 'Real Betis Balompié',
      league: 'La Liga (Spain)',
      status: 'Regular Starter',
      appearances: 14,
      goals: 5,
      assists: 4,
      ratingGrowth: '+2 OVR',
      recallClause: true,
      buyOption: 18.0
    });
  }

  const squad = clubPlayers(s, c);
  const eligibleLoanPlayers = squad.filter(p => (p.rating <= 79 || (p.age && p.age <= 21)));

  return {
    club: c.name,
    loans: c.loans,
    eligiblePlayers: eligibleLoanPlayers.map(p => ({
      id: p.id,
      name: p.name,
      position: p.position,
      rating: p.rating,
      age: p.age || 20
    }))
  };
}

function loanOutPlayer(s, clubName, playerId, destinationClub, terms) {
  const c = club(s, clubName || s.selectedClub);
  if (!c) return { error: 'Club not found' };
  const p = player(s, playerId);
  if (!p) return { error: 'Player not found' };

  c.loans = c.loans || [];
  const dest = destinationClub || 'Sunderland AFC';
  const role = terms?.role || 'Regular Starter';

  c.loans.push({
    id: `loan_${Date.now()}`,
    playerId: p.id,
    playerName: p.name,
    position: p.position,
    rating: p.rating,
    destinationClub: dest,
    league: 'Division 2',
    status: role,
    appearances: 0,
    goals: 0,
    assists: 0,
    ratingGrowth: '+0 OVR',
    recallClause: true,
    buyOption: Math.round((p.askingPrice || 8) * 1.6)
  });

  c.players = c.players.filter(pid => pid !== p.id);
  p.onLoan = true;
  p.loanClub = dest;

  const loanFee = Math.round((p.askingPrice || 8) * 0.15 * 10) / 10;
  c.cash = Math.round((c.cash + loanFee) * 10) / 10;
  recordTransaction(c, loanFee, 'loan_fee', `Loan fee received for ${p.name} from ${dest}`, s);
  addNews(s, `✈️ LOAN DEAL: ${p.name} joins ${dest} on a season-long development loan (+₹${loanFee}M loan fee).`, 'transfers');

  persist();
  return { success: true, loans: c.loans };
}

function recallLoanPlayer(s, clubName, playerId) {
  const c = club(s, clubName || s.selectedClub);
  if (!c) return { error: 'Club not found' };
  c.loans = c.loans || [];
  const idx = c.loans.findIndex(l => l.playerId === playerId || l.id === playerId);
  if (idx === -1) return { error: 'Active loan record not found.' };

  const loanRecord = c.loans[idx];
  c.loans.splice(idx, 1);

  const p = player(s, loanRecord.playerId);
  if (p) {
    p.onLoan = false;
    p.loanClub = null;
    p.rating = Math.min(94, p.rating + 1);
    if (!c.players.includes(p.id)) c.players.push(p.id);
  }

  addNews(s, `🔙 RECALL: ${c.name} exercised mid-season recall clause on ${loanRecord.playerName} from ${loanRecord.destinationClub}!`, 'transfers');
  persist();
  return { success: true, loans: c.loans, recalledPlayer: p };
}

// =============================================================
// MODULE 4: CLUB TAKEOVERS & MULTI-CLUB OWNERSHIP EMPIRE
// =============================================================
function getTakeoverAndEmpireState(s, clubName) {
  const c = club(s, clubName || s.selectedClub);
  if (!c) return null;

  c.ownership = c.ownership || {
    type: 'custodian',
    ownerName: `${c.name} Heritage Custodians`,
    model: 'Traditional Community Heritage',
    reputation: c.reputation || 70,
    fanLoyalty: 85,
    satelliteClubs: [
      { id: 'sat_1', name: 'Andean Wonderkids FC', country: 'Colombia', tier: 'Feeder Academy', talentOutput: '+1 Youth Prospect/Year' }
    ],
    activeBid: {
      id: 'bid_sovereign',
      consortium: 'Gulf Horizon Sovereign Wealth Fund',
      origin: 'Riyadh / Abu Dhabi',
      type: 'sovereign',
      cashPurse: 180.0,
      ambition: 'Immediate European Champions League Dominance',
      fanStance: 'Mixed (Thrilled by war chest, anxious about identity)',
      status: 'pending'
    }
  };

  return {
    club: c.name,
    ownership: c.ownership,
    availableSatellitesToBuy: [
      { id: 'sat_nordic', name: 'Nordic Stars IF', country: 'Sweden', cost: 12.0, perk: 'Elite Scouting in Scandinavia (+2 OVR to Youth Intakes)' },
      { id: 'sat_brazil', name: 'Santos Promessas', country: 'Brazil', cost: 20.0, perk: 'Direct pipeline to 5-star Samba dribblers' },
      { id: 'sat_algarve', name: 'Algarve Sporting', country: 'Portugal', cost: 15.0, perk: 'EU work permit fast-tracking gateway' }
    ]
  };
}

function executeTakeoverAction(s, clubName, action, data) {
  const c = club(s, clubName || s.selectedClub);
  if (!c) return { error: 'Club not found' };
  c.ownership = c.ownership || { type: 'custodian', ownerName: `${c.name} Trust`, satelliteClubs: [] };

  if (action === 'accept_bid') {
    const bid = c.ownership.activeBid;
    if (!bid) return { error: 'No active takeover bid on the table.' };

    c.ownership.type = bid.type;
    c.ownership.ownerName = bid.consortium;
    c.ownership.model = bid.type === 'sovereign' ? 'State-Backed Sovereign Investment' : 'Global Private Equity Group';
    c.cash = Math.round((c.cash + bid.cashPurse) * 10) / 10;
    c.reputation = Math.min(95, (c.reputation || 70) + 12);
    recordTransaction(c, bid.cashPurse, 'takeover_cash', `Hostile Takeover Cash Injection from ${bid.consortium}`, s);
    addNews(s, `🚨 OFFICIAL CLUB TAKEOVER: ${bid.consortium} has officially acquired ${c.name} with a gargantuan ₹${bid.cashPurse}M War Chest!`, 'board');
    c.ownership.activeBid = null;
    persist();
    return { success: true, ownership: c.ownership, cash: c.cash };
  }

  if (action === 'reject_bid') {
    const bid = c.ownership.activeBid;
    addNews(s, `🛡️ TAKEOVER REBUFFED: ${c.name} board and supporters officially rejected the buyout offer from ${bid?.consortium || 'investors'}.`, 'board');
    c.ownership.activeBid = null;
    c.fanSatisfaction = Math.min(100, (c.fanSatisfaction || 75) + 15);
    persist();
    return { success: true, ownership: c.ownership };
  }

  if (action === 'buy_satellite') {
    const cost = Number(data.cost || 15);
    if (c.cash < cost) return { error: `Insufficient treasury (₹${cost}M required).` };
    c.cash = Math.round((c.cash - cost) * 10) / 10;
    c.ownership.satelliteClubs = c.ownership.satelliteClubs || [];
    c.ownership.satelliteClubs.push({
      id: data.satelliteId,
      name: data.name,
      country: data.country,
      tier: 'Satellite Affiliate',
      perk: data.perk
    });
    recordTransaction(c, cost, 'empire_investment', `Purchased affiliate feeder club ${data.name}`, s);
    addNews(s, `🌐 MULTI-CLUB EMPIRE EXPANSION: ${c.name} completed the acquisition of ${data.name} (${data.country})!`, 'club');
    persist();
    return { success: true, ownership: c.ownership, cash: c.cash };
  }

  return { error: 'Unknown takeover action' };
}

// =============================================================
// MODULE 5: SUPER-AGENT SHOWDOWNS & CONTRACT CLAUSES MATRIX
// =============================================================
function getContractMatrixState(s, clubName) {
  const c = club(s, clubName || s.selectedClub);
  if (!c) return null;
  const players = clubPlayers(s, c);

  const AGENT_ARCHETYPES = [
    { type: 'ruthless', name: 'Jorge "The Shark" Mendes-Pina', trait: 'Demands hefty signing commissions and low buyout clauses' },
    { type: 'loyal', name: 'Marco Silva (Player Father)', trait: 'Values job security, club status, and happiness over raw wages' },
    { type: 'corporate', name: 'Stellar Sports Global Partners', trait: 'Demands structured performance incentives (clean sheets / Ballon d’Or)' }
  ];

  const contracts = players.map((p, idx) => {
    const agent = AGENT_ARCHETYPES[idx % AGENT_ARCHETYPES.length];
    p.clauses = p.clauses || {
      releaseClause: Math.round((p.askingPrice || 8) * (agent.type === 'ruthless' ? 1.3 : 1.8)),
      bonusGoalOrCleanSheet: 0.15,
      ballonDorBonus: 5.0,
      relegationWageCut: agent.type === 'ruthless' ? 'None (Protected)' : '35% Cut',
      agentFeePct: agent.type === 'ruthless' ? 15 : 7,
      agentType: agent.type,
      agentName: agent.name
    };
    return {
      id: p.id,
      name: p.name,
      position: p.position,
      rating: p.rating,
      salary: p.salary || 1.2,
      contractYears: p.contractYears || 3,
      clauses: p.clauses
    };
  });

  return {
    club: c.name,
    contracts
  };
}

function executeContractRenewal(s, clubName, playerId, clausesData) {
  const c = club(s, clubName || s.selectedClub);
  if (!c) return { error: 'Club not found' };
  const p = player(s, playerId);
  if (!p) return { error: 'Player not found' };

  const newWage = Math.round(Number(clausesData.salary || p.salary || 1.2) * 10) / 10;
  const newRelease = Math.round(Number(clausesData.releaseClause || 25));
  const agentFee = Math.round((newWage * 0.5) * 10) / 10;

  if (c.cash < agentFee) return { error: `Insufficient cash for Agent Commission (₹${agentFee}M).` };
  c.cash = Math.round((c.cash - agentFee) * 10) / 10;
  p.salary = newWage;
  p.contractYears = 4;
  p.clauses = {
    ...p.clauses,
    releaseClause: newRelease,
    bonusGoalOrCleanSheet: Number(clausesData.bonusGoalOrCleanSheet || 0.15),
    relegationWageCut: clausesData.relegationWageCut || '35% Cut'
  };

  recordTransaction(c, agentFee, 'agent_fee', `Contract extension & agent commission for ${p.name}`, s);
  addNews(s, `✍️ CONTRACT EXTENSION: ${p.name} penned a new 4-year deal with ${c.name} (Release clause locked at ₹${newRelease}M).`, 'transfers');
  persist();
  return { success: true, player: p, cash: c.cash };
}

// =============================================================
// MODULE 6: PRE-SEASON SUMMER GLOBAL TOURS & FRIENDLY CUPS
// =============================================================
const PRESEASON_DESTINATIONS = [
  {
    id: 'usa_cup',
    title: 'North American Champions Showcase',
    flag: '🇺🇸',
    cities: 'New York & Los Angeles',
    appearanceFee: 18.0,
    merchandiseBonus: 4.5,
    fansGained: 25000,
    opponents: ['New York City FC', 'LA Galaxy', 'Club América']
  },
  {
    id: 'asia_tour',
    title: 'East Asian Super Prestige Tour',
    flag: '🇯🇵',
    cities: 'Tokyo & Seoul',
    appearanceFee: 15.0,
    merchandiseBonus: 6.0,
    fansGained: 35000,
    opponents: ['Vissel Kobe', 'FC Seoul', 'Al-Hilal']
  },
  {
    id: 'gulf_invitational',
    title: 'Middle East Luxury Invitational',
    flag: '🇦🇪',
    cities: 'Dubai & Doha',
    appearanceFee: 24.0,
    merchandiseBonus: 3.0,
    fansGained: 15000,
    opponents: ['Al-Nassr', 'Al Ain FC', 'Flamengo']
  }
];

function getPreseasonTourState(s, clubName) {
  const c = club(s, clubName || s.selectedClub);
  if (!c) return null;
  return {
    club: c.name,
    season: s.season,
    completed: !!c.preseasonCompleted,
    destinations: PRESEASON_DESTINATIONS
  };
}

function simulatePreseasonTour(s, clubName, tourId) {
  const c = club(s, clubName || s.selectedClub);
  if (!c) return { error: 'Club not found' };
  if (c.preseasonCompleted) return { error: 'Pre-season tour has already been conducted for this summer!' };

  const tour = PRESEASON_DESTINATIONS.find(t => t.id === tourId) || PRESEASON_DESTINATIONS[0];
  const totalPayout = Math.round((tour.appearanceFee + tour.merchandiseBonus) * 10) / 10;

  c.cash = Math.round((c.cash + totalPayout) * 10) / 10;
  c.fans = (c.fans || 20000) + tour.fansGained;
  c.preseasonCompleted = true;

  const friendlyResults = tour.opponents.map(opp => {
    const myScore = Math.floor(Math.random() * 3) + 1;
    const oppScore = Math.floor(Math.random() * 2);
    return { opponent: opp, score: `${myScore} - ${oppScore}`, verdict: myScore >= oppScore ? 'W' : 'L' };
  });

  recordTransaction(c, totalPayout, 'commercial_tour', `Summer Pre-Season Tour: ${tour.title} (Fee + Merch)`, s);
  addNews(s, `✈️ TOUR COMPLETE: ${c.name} concluded the ${tour.title}! Banked ₹${totalPayout}M + ${tour.fansGained.toLocaleString()} new global fans!`, 'competition');
  persist();
  return {
    success: true,
    tour,
    payout: totalPayout,
    friendlyResults,
    cash: c.cash
  };
}

// =============================================================
// MODULE 7: CLUB HALL OF FAME & LEGENDS TESTIMONIAL MATCH
// =============================================================
function getHallOfFameState(s, clubName) {
  const c = club(s, clubName || s.selectedClub);
  if (!c) return null;

  c.hallOfFame = Array.isArray(c.hallOfFame) ? c.hallOfFame : [];

  if (!c.hallOfFame.length) {
    c.hallOfFame.push(
      {
        id: 'legend_1',
        name: 'Roberto Valente',
        era: '2014 - 2023',
        position: 'ST',
        retiredNumber: 9,
        appearances: 342,
        goals: 218,
        honors: ['2x League Titles', '1x European Trophy', 'Golden Boot 2019'],
        quote: 'My blood runs true for this badge and these supporters.'
      },
      {
        id: 'legend_2',
        name: 'Gennaro Conti',
        era: '2011 - 2021',
        position: 'CB',
        retiredNumber: 4,
        appearances: 410,
        goals: 24,
        honors: ['Club Captain for 7 years', '3x Domestic Cups', 'Clean Sheet Record'],
        quote: 'Defending this citadel was the honor of my lifetime.'
      }
    );
  }

  return {
    club: c.name,
    legends: c.hallOfFame
  };
}

function hostTestimonialMatch(s, clubName, legendId) {
  const c = club(s, clubName || s.selectedClub);
  if (!c) return { error: 'Club not found' };
  c.hallOfFame = c.hallOfFame || [];
  const legend = c.hallOfFame.find(l => l.id === legendId) || c.hallOfFame[0];

  const gateReceipts = 11.5;
  c.cash = Math.round((c.cash + gateReceipts) * 10) / 10;
  c.fanSatisfaction = 100;
  c.morale = 100;

  recordTransaction(c, gateReceipts, 'testimonial_gate', `Testimonial Benefit Match honoring ${legend.name}`, s);
  addNews(s, `🌟 LEGENDS TESTIMONIAL: ${c.name} stadium celebrated club icon ${legend.name} in an emotional 4-3 spectacle against World XI! (+₹11.5M gate)`, 'match');
  persist();
  return {
    success: true,
    score: `${c.name} 4 - 3 World Legends XI`,
    legendName: legend.name,
    revenue: gateReceipts,
    cash: c.cash
  };
}

// =============================================================
// MODULE 8: HALF-TIME TALKS & VAR REVIEW INCIDENTS
// =============================================================
function executeHalfTimeTalk(s, clubName, talkType) {
  const c = club(s, clubName || s.selectedClub);
  if (!c) return { error: 'Club not found' };

  let outcome = {};
  if (talkType === 'hairdryer') {
    const success = Math.random() > 0.35;
    if (success) {
      c.morale = Math.min(100, (c.morale || 70) + 12);
      outcome = {
        verdict: '🔥 Hairdryer Fired Up the Squad!',
        narrative: 'Teacups were thrown across the dressing room. Players emerged with fury in their eyes (+20% second-half work rate).',
        boost: 'attack'
      };
    } else {
      c.morale = Math.max(40, (c.morale || 70) - 8);
      outcome = {
        verdict: '⚡ Hairdryer Backfired!',
        narrative: 'Several senior players felt insulted and retreated into their shells. Morale took a dip.',
        boost: 'none'
      };
    }
  } else if (talkType === 'tactical') {
    outcome = {
      verdict: '📋 Masterclass Tactical Realignment',
      narrative: 'Instructed central pivot to double-mark their playmaker and commanded fullbacks to push high (+15% defensive composure).',
      boost: 'defense'
    };
  } else {
    c.morale = Math.min(100, (c.morale || 70) + 8);
    outcome = {
      verdict: '🗣️ Inspirational Dressing Room Rally',
      narrative: 'Calm, passionate reminder of what this shirt represents to the city. Squad rallied with renewed belief (+10% team chemistry).',
      boost: 'chemistry'
    };
  }
  return { success: true, outcome, morale: c.morale };
}

function generateVarReviewIncident(s, matchContext) {
  const incidents = [
    {
      type: 'offside',
      title: 'MARGINAL OFFSIDE CHECK',
      narrative: 'Checking potential offside by attacker shoulder blade millimeter line...',
      overturned: Math.random() > 0.45,
      impact: 'Goal disallowed for offside (0.04m margin)'
    },
    {
      type: 'penalty',
      title: 'POSSIBLE PENALTY REVIEW',
      narrative: 'Checking potential trailing leg trip inside the penalty box...',
      overturned: Math.random() > 0.4,
      impact: 'Penalty awarded to attacking side!'
    },
    {
      type: 'red_card',
      title: 'SERIOUS FOUL PLAY RED CARD CHECK',
      narrative: 'Reviewing studs-up lunging challenge near the touchline...',
      overturned: Math.random() > 0.5,
      impact: 'Straight Red Card issued for dangerous play!'
    }
  ];
  return incidents[Math.floor(Math.random() * incidents.length)];
}

// =============================================================
// MODULE 10: MANAGER CAREER & LOWER DIVISION APPOINTMENTS
// =============================================================
function getLowerDivisionClubs(s, country) {
  if (!s || !Array.isArray(s.clubs)) return [];
  let candidates = s.clubs.filter(c => c.division === 3 || c.division === 4);
  if (country && country !== 'all') {
    candidates = candidates.filter(c => c.country.toLowerCase() === country.toLowerCase());
  }
  return candidates.map(c => {
    const players = clubPlayers(s, c);
    const avgRating = players.length ? Math.round(players.reduce((sum, p) => sum + (p.rating || 60), 0) / players.length) : (c.division === 4 ? 64 : 68);
    const startingRep = c.division === 4 ? 20 : 28;
    return {
      name: c.name,
      country: c.country,
      league: c.league,
      division: c.division,
      reputation: c.reputation || (c.division === 4 ? 45 : 55),
      cash: Math.round((c.cash || (c.division === 4 ? 3.5 : 8.5)) * 10) / 10,
      fans: c.fans || (c.division === 4 ? 6500 : 14000),
      crest: c.crest || 'crest_shield',
      jersey: c.jersey || { home: '#10243b', away: '#ffffff' },
      rating: avgRating,
      playersCount: players.length || 16,
      managerStartingReputation: startingRep,
      tierLabel: c.division === 4 ? 'Division 4 · Grassroots Underdog' : 'Division 3 · Regional Contender',
      boardObjective: c.division === 4 
        ? 'Avoid relegation, establish tactical discipline, and ignite local passion.' 
        : 'Mount promotion charge, maintain top-half standing, and develop young prospects.',
      managerSalary: c.division === 4 ? '₹0.35M / yr' : '₹0.65M / yr'
    };
  });
}

function assignManagerToClub(s, clubName, managerName) {
  if (!s) return { error: 'World not found.' };
  let c = null;
  if (clubName) {
    c = club(s, clubName);
  }
  if (!c) {
    const lowerClubs = s.clubs.filter(x => x.division === 4 || x.division === 3);
    c = lowerClubs[Math.floor(Math.random() * lowerClubs.length)] || s.clubs[0];
  }
  if (!c) return { error: 'No available club found to assign.' };

  s.selectedClub = c.name;
  c.online = true;
  c.manager = c.manager || {};
  c.manager.name = (managerName && String(managerName).trim()) ? String(managerName).trim() : 'Head Coach';
  const startRep = c.division === 4 ? 22 : 28;
  c.manager.reputation = startRep;

  // Ensure squad is seeded
  if (!c.players || c.players.length < 16) {
    seedSquad(c, s.market, 16);
  }
  rebalanceSquadToDivision(s, c);
  setupClubRivalries(s.clubs);

  s.managerCareer = {
    name: c.manager.name,
    role: 'manager',
    reputation: startRep,
    tier: startRep < 35 ? 'Grassroots Tactician' : 'Rising Coach',
    matches: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    winRate: 0,
    promotions: 0,
    titles: 0,
    boardConfidence: 85,
    appointedSeason: s.season || 1,
    initialClub: c.name,
    initialDivision: c.division,
    jobOffers: [],
    careerHistory: [
      {
        season: s.season || 1,
        club: c.name,
        country: c.country,
        division: c.division,
        event: `Official Head Coach Appointment at ${c.name} (Division ${c.division})`
      }
    ]
  };

  refreshManagerJobOffers(s);
  addNews(s, `👔 OFFICIAL APPOINTMENT: ${s.managerCareer.name} has taken the hotseat as Head Coach of ${c.name} in Division ${c.division}! Mission: Climb from the lower leagues to the top of world football.`, 'manager');
  persist();
  return c;
}

function refreshManagerJobOffers(s) {
  if (!s || !s.managerCareer) return [];
  const mc = s.managerCareer;
  const currentClub = club(s, s.selectedClub);
  const currentDiv = currentClub ? currentClub.division : 3;
  const rep = mc.reputation || 25;

  if (rep < 35) mc.tier = 'Grassroots Tactician';
  else if (rep < 55) mc.tier = 'Rising Coach';
  else if (rep < 75) mc.tier = 'Respected Gaffer';
  else if (rep < 90) mc.tier = 'Elite Mastermind';
  else mc.tier = 'World-Class Legend';

  const offers = [];
  // Tier 1 Job Inquiries: Division 2 Clubs (Rep 36+)
  if (rep >= 36 && currentDiv > 2) {
    const div2Clubs = s.clubs.filter(c => c.division === 2 && c.name !== (currentClub ? currentClub.name : ''));
    if (div2Clubs.length > 0) {
      const candidates = [...div2Clubs].sort(() => 0.5 - Math.random()).slice(0, 2);
      candidates.forEach(c => {
        offers.push({
          id: 'offer_' + c.name.toLowerCase().replace(/[^a-z0-9]/g, '_'),
          club: c.name,
          country: c.country,
          league: c.league,
          division: c.division,
          tierBadge: 'DIVISION 2 PROMOTION CONTENDER',
          crest: c.crest || 'crest_shield',
          budget: Math.round((c.cash || 18) * 10) / 10,
          salary: '₹1.8M / yr',
          objective: 'Lead squad into Division 1 promotion contention',
          reputationRequired: 36,
          reputation: c.reputation || 68
        });
      });
    }
  }

  // Tier 2 Job Inquiries: Division 1 Clubs (Rep 58+)
  if (rep >= 58 && currentDiv > 1) {
    const div1Clubs = s.clubs.filter(c => c.division === 1 && (c.reputation || 70) < 86 && c.name !== (currentClub ? currentClub.name : ''));
    if (div1Clubs.length > 0) {
      const candidates = [...div1Clubs].sort(() => 0.5 - Math.random()).slice(0, 2);
      candidates.forEach(c => {
        offers.push({
          id: 'offer_' + c.name.toLowerCase().replace(/[^a-z0-9]/g, '_'),
          club: c.name,
          country: c.country,
          league: c.league,
          division: c.division,
          tierBadge: 'TOP FLIGHT DIVISION 1 CLUB',
          crest: c.crest || 'crest_shield',
          budget: Math.round((c.cash || 45) * 10) / 10,
          salary: '₹4.2M / yr',
          objective: 'Establish top-half presence & qualify for European competitions',
          reputationRequired: 58,
          reputation: c.reputation || 78
        });
      });
    }
  }

  // Tier 3 Job Inquiries: Elite Giants & Champions (Rep 78+)
  if (rep >= 78) {
    const eliteClubs = s.clubs.filter(c => c.division === 1 && (c.reputation || 70) >= 86 && c.name !== (currentClub ? currentClub.name : ''));
    if (eliteClubs.length > 0) {
      const candidates = [...eliteClubs].sort(() => 0.5 - Math.random()).slice(0, 2);
      candidates.forEach(c => {
        offers.push({
          id: 'offer_' + c.name.toLowerCase().replace(/[^a-z0-9]/g, '_'),
          club: c.name,
          country: c.country,
          league: c.league,
          division: c.division,
          tierBadge: '👑 CONTINENTAL & WORLD TITAN',
          crest: c.crest || 'crest_crown',
          budget: Math.round((c.cash || 85) * 10) / 10,
          salary: '₹12.5M / yr',
          objective: 'Win Champions League, Domestic League Title & World Trophies',
          reputationRequired: 78,
          reputation: c.reputation || 90
        });
      });
    }
  }

  mc.jobOffers = offers;
  return offers;
}

function generateManagerApproaches(s, forceCount = 1, context = {}) {
  if (!s || !s.managerCareer) return [];
  const mc = s.managerCareer;
  mc.approaches = mc.approaches || [];

  const currentClub = club(s, s.selectedClub);
  const currentDiv = currentClub ? currentClub.division : 3;
  const rep = mc.reputation || 25;

  const activeClubNames = new Set(mc.approaches.filter(a => a.status === 'pending' || a.status === 'stalled').map(a => a.club));
  if (currentClub) activeClubNames.add(currentClub.name);

  const availableClubs = s.clubs.filter(c => !activeClubNames.has(c.name));
  if (availableClubs.length === 0) return [];

  const approachesCreated = [];
  const countToCreate = Math.min(forceCount, availableClubs.length);

  for (let i = 0; i < countToCreate; i++) {
    let pool = [];
    let approachType = 'headhunt';

    if (context.oppName && availableClubs.some(c => c.name === context.oppName) && Math.random() < 0.6) {
      pool = availableClubs.filter(c => c.name === context.oppName);
      approachType = 'tactical_admiration';
    } else if (rep < 35) {
      pool = availableClubs.filter(c => c.division === currentDiv || c.division === Math.max(1, currentDiv - 1));
      approachType = Math.random() < 0.5 ? 'wealthy_project' : 'crisis_savior';
    } else if (rep < 60) {
      pool = availableClubs.filter(c => c.division <= currentDiv);
      approachType = Math.random() < 0.4 ? 'headhunt' : (Math.random() < 0.5 ? 'giant_rebuild' : 'tactical_admiration');
    } else {
      pool = availableClubs.filter(c => c.division === 1 || c.division === 2);
      approachType = Math.random() < 0.5 ? 'headhunt' : 'wealthy_project';
    }

    if (pool.length === 0) pool = availableClubs;
    const selectedClub = pool[Math.floor(Math.random() * pool.length)];
    if (!selectedClub) continue;
    activeClubNames.add(selectedClub.name);

    const div = selectedClub.division || 3;
    const baseBudget = Math.round((selectedClub.cash || (div === 4 ? 8 : div === 3 ? 18 : div === 2 ? 45 : 95)) * 10) / 10;
    const warChestOffered = Math.round((baseBudget * (0.85 + Math.random() * 0.45)) * 10) / 10;
    const baseSal = div === 4 ? 0.45 : div === 3 ? 1.2 : div === 2 ? 3.2 : 9.5;
    const salaryOffered = Math.round((baseSal * (0.9 + Math.random() * 0.35)) * 100) / 100;
    const contractYears = Math.floor(Math.random() * 3) + 2;

    const chairmen = [
      'Sir Reginald Vance', 'Maximilian Sterling', 'Don Alessandro Rossi', 'Chairman Arthur Davies',
      'Director Marcus Vance', 'President Elena Ramos', 'Lord Thomas Bradford', 'Sheikh Tariq Al-Mansoor'
    ];
    const chairman = chairmen[Math.floor(Math.random() * chairmen.length)];

    let letter = '';
    let title = '';
    let objective = '';
    let badge = '';

    if (approachType === 'tactical_admiration') {
      title = '🎯 TACTICAL ADMIRATION APPROACH';
      badge = 'TACTICAL MASTERCLASS';
      objective = div <= 2 ? 'Implement high-pressing philosophy & clinch European qualification' : 'Dominate league possession & secure promotion';
      letter = `Dear ${mc.name},\n\nFollowing our recent encounters and detailed scouting by our technical committee, our boardroom was thoroughly captivated by your tactical acumen and dressing-room leadership at ${currentClub ? currentClub.name : 'your club'}. We are officially offering you our head coaching position with an initial transfer war chest of ₹${warChestOffered}M to rebuild our squad in your tactical image.`;
    } else if (approachType === 'crisis_savior') {
      title = '🛡️ CRISIS RESCUE & REVIVAL APPROACH';
      badge = 'BOARDROOM RESCUE CALL';
      objective = 'Steer club out of crisis, stabilize squad morale & avoid relegation';
      letter = `Dear ${mc.name},\n\nOur club is currently at a critical crossroads. Following the dismissal of our previous manager, our board has identified you as the visionary coach capable of bringing discipline, tactical spine, and belief back to our dressing room. We are offering you a ${contractYears}-year contract, ₹${warChestOffered}M in squad reinforcement funds, and complete authority over tactical decisions.`;
    } else if (approachType === 'wealthy_project') {
      title = '💎 AMBITIOUS HIGH-BUDGET PROJECT';
      badge = 'EXPANSION WAR CHEST';
      objective = 'Fast-track promotion & challenge for silverware within 2 seasons';
      letter = `Dear ${mc.name},\n\nUnder our newly announced ownership structure, ${selectedClub.name} is preparing for an unprecedented era of investment. We want a dynamic, hungry head coach at the helm. We are pledging ₹${warChestOffered}M in immediate transfer funding alongside an attractive personal compensation package of ₹${salaryOffered}M per year.`;
    } else if (approachType === 'giant_rebuild') {
      title = '👑 RESTORATION OF GLORY INQUIRY';
      badge = 'SLEEPING GIANT REBUILD';
      objective = 'Restore club to glory, win domestic silverware & qualify for continental cups';
      letter = `Dear ${mc.name},\n\n${selectedClub.name} possesses rich heritage and millions of passionate supporters, but we need tactical modernization. Our committee views your achievements as the ideal foundation for our revival. We invite you to sign as Head Coach with full backing from our board.`;
    } else {
      title = '🚨 FORMAL HEADHUNTING APPROACH';
      badge = 'DIVISION ' + div + ' HEADHUNT';
      objective = div === 1 ? 'Contend for top 4 & international honors' : 'Lead promotion campaign and modernize player development';
      letter = `Dear ${mc.name},\n\nWe are formally approaching you regarding the Head Coach vacancy at ${selectedClub.name}. Your track record and tactical reputation have made you our primary target. We have prepared contract terms worth ₹${salaryOffered}M per year and a competitive transfer budget of ₹${warChestOffered}M.`;
    }

    const perks = [
      'Full Executive Veto on Outgoing Player Sales',
      'Guaranteed ₹' + Math.round(warChestOffered * 0.3) + 'M Mid-Season War Chest Injection',
      'Direct line to Chairman & Fast-Track Transfer Approval',
      'Enhanced Youth Academy Scout Influx'
    ];

    const newApproach = {
      id: 'app_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      club: selectedClub.name,
      crest: selectedClub.crest || 'crest_shield',
      country: selectedClub.country,
      league: selectedClub.league,
      division: div,
      reputation: selectedClub.reputation || 70,
      approachType,
      approachTitle: title,
      tierBadge: badge,
      chairmanName: chairman,
      letter,
      offeredBudget: warChestOffered,
      offeredSalary: salaryOffered,
      salaryFormatted: `₹${salaryOffered}M / yr`,
      contractYears,
      objective,
      perks: perks.slice(0, 2),
      status: 'pending',
      matchdayCreated: s.matchday || 1,
      seasonCreated: s.season || 1,
      createdAt: new Date().toISOString()
    };

    mc.approaches.unshift(newApproach);
    approachesCreated.push(newApproach);

    mc.jobOffers = mc.jobOffers || [];
    if (!mc.jobOffers.some(o => o.club === selectedClub.name)) {
      mc.jobOffers.unshift({
        id: newApproach.id,
        club: selectedClub.name,
        country: selectedClub.country,
        league: selectedClub.league,
        division: div,
        tierBadge: badge,
        crest: selectedClub.crest || 'crest_shield',
        budget: warChestOffered,
        salary: `₹${salaryOffered}M / yr`,
        objective,
        reputationRequired: rep,
        reputation: selectedClub.reputation || 70
      });
    }

    addNews(s, `🚨 MANAGERIAL APPROACH: ${selectedClub.name} has officially approached ${mc.name} with an ambitious offer to become their new Head Coach!`, 'manager');
  }

  if (approachesCreated.length > 0) {
    mc.latestApproachAlert = approachesCreated[0];
  }

  return approachesCreated;
}

function respondToManagerApproach(s, approachId, action) {
  if (!s) return { error: 'World not found.' };
  if (!s.managerCareer) return { error: 'No active manager career.' };
  const mc = s.managerCareer;
  mc.approaches = mc.approaches || [];
  const app = mc.approaches.find(a => a.id === approachId);
  if (!app) return { error: 'Approach not found.' };

  const currentClub = club(s, s.selectedClub);
  const target = club(s, app.club);
  if (!target) return { error: 'Target club not found.' };

  if (action === 'accept') {
    const prevClub = s.selectedClub;
    s.selectedClub = target.name;
    target.online = true;
    target.manager = target.manager || {};
    target.manager.name = mc.name;
    target.manager.reputation = mc.reputation;

    if (!target.players || target.players.length < 16) {
      seedSquad(target, s.market, 16);
    }
    rebalanceSquadToDivision(s, target);

    const bonusWarChest = Number(app.offeredBudget) || 15;
    target.cash = Math.round(((target.cash || 10) + bonusWarChest) * 10) / 10;

    mc.reputation = Math.min(100, (mc.reputation || 25) + 6);
    mc.boardConfidence = 90;
    mc.contract = {
      club: target.name,
      salary: app.offeredSalary || 2.0,
      salaryFormatted: app.salaryFormatted || `₹${app.offeredSalary || 2.0}M / yr`,
      yearsRemaining: app.contractYears || 3,
      expectations: app.objective || 'Win silverware & reach European qualification',
      releaseClause: Math.max(15, (target.division === 1 ? 50 : 25)),
      vetoPower: true,
      youthFunding: true,
      ratifiedSeason: s.season || 1,
      extraWarChestGranted: bonusWarChest
    };

    mc.careerHistory = mc.careerHistory || [];
    mc.careerHistory.unshift({
      season: s.season || 1,
      club: target.name,
      division: target.division,
      event: `Formal Approach Accepted: Appointed Head Coach of ${target.name} (Div ${target.division}) with ₹${bonusWarChest}M War Chest!`
    });

    app.status = 'accepted';
    mc.latestApproachAlert = null;
    refreshManagerJobOffers(s);

    addNews(s, `🚨 SENSATIONAL MANAGERIAL APPOINTMENT: ${mc.name} has officially accepted the high-profile approach from ${target.name} to take the reins as Head Coach with a massive ₹${bonusWarChest}M war chest!`, 'manager');
    persist();
    return {
      success: true,
      action: 'accepted',
      newClub: target,
      managerCareer: mc,
      message: `🎉 Deal Complete! You are now the official Head Coach of ${target.name} with an injected ₹${bonusWarChest}M transfer war chest.`
    };
  }

  if (action === 'leak') {
    app.status = 'leaked';
    const retentionWarChest = Math.round((currentClub ? (currentClub.division === 1 ? 12 : 6) : 5) * 10) / 10;
    if (currentClub) {
      currentClub.cash = Math.round(((currentClub.cash || 10) + retentionWarChest) * 10) / 10;
    }
    mc.boardConfidence = Math.min(100, (mc.boardConfidence || 85) + 4);
    if (mc.contract) {
      mc.contract.salary = Math.round(((mc.contract.salary || 1.0) * 1.15) * 100) / 100;
      mc.contract.salaryFormatted = `₹${mc.contract.salary}M / yr`;
      mc.contract.extraWarChestGranted = (mc.contract.extraWarChestGranted || 0) + retentionWarChest;
    }

    addNews(s, `💣 MEDIA BOMBSHELL: Details leak that ${app.club} attempted an audacious swoop for ${mc.name}! In response, ${currentClub ? currentClub.name : 'the board'} immediately pledged an extra ₹${retentionWarChest}M transfer funds and a salary increase to secure their manager's loyalty!`, 'manager');
    persist();
    return {
      success: true,
      action: 'leaked',
      message: `📰 Leaked to Media! The leak created massive press drama. Your current board at ${currentClub ? currentClub.name : 'the club'} panicked and immediately deposited ₹${retentionWarChest}M extra war chest and gave you a 15% salary raise to keep you!`,
      retentionFunds: retentionWarChest
    };
  }

  if (action === 'stall') {
    app.status = 'stalled';
    addNews(s, `⏳ MANAGERIAL INQUIRY DELAYED: ${mc.name} requested time before deciding on ${app.club}'s formal offer, remaining focused on current club commitments.`, 'manager');
    persist();
    return {
      success: true,
      action: 'stalled',
      message: `⏳ Decision Postponed! ${app.club} has agreed to wait 1 matchday for your final decision.`
    };
  }

  if (action === 'decline') {
    app.status = 'rejected';
    mc.boardConfidence = Math.min(100, (mc.boardConfidence || 85) + 6);
    addNews(s, `🛡️ MANAGERIAL LOYALTY: ${mc.name} has emphatically rejected a formal approach from ${app.club}, declaring complete allegiance to ${currentClub ? currentClub.name : 'the club'}! Fans and board rejoice.`, 'manager');
    persist();
    return {
      success: true,
      action: 'rejected',
      message: `❌ Approach Rejected! You pledged your loyalty to ${currentClub ? currentClub.name : 'your club'}. Board confidence increased to ${mc.boardConfidence}%.`
    };
  }

  return { error: 'Unknown action.' };
}

function solicitManagerApproaches(s) {
  if (!s) return { error: 'World not found.' };
  if (!s.managerCareer) getManagerCareerState(s);
  const mc = s.managerCareer;
  const created = generateManagerApproaches(s, 2, { solicited: true });
  addNews(s, `📡 MARKET INQUIRY: ${mc.name}'s representatives actively explored the market, triggering immediate formal headhunting inquiries from interested clubs!`, 'manager');
  persist();
  return {
    success: true,
    approaches: mc.approaches || [],
    createdCount: created.length,
    message: `${created.length} new clubs have submitted formal approaches to hire you!`
  };
}

function getManagerCareerState(s) {
  if (!s) return null;
  if (!s.managerCareer) {
    const c = s.selectedClub ? club(s, s.selectedClub) : null;
    const startRep = c ? (c.division === 4 ? 22 : c.division === 3 ? 28 : 50) : 25;
    s.managerCareer = {
      name: (c && c.manager && c.manager.name) ? c.manager.name : 'Head Coach',
      role: 'manager',
      reputation: startRep,
      tier: startRep < 35 ? 'Grassroots Tactician' : startRep < 55 ? 'Rising Coach' : 'Respected Gaffer',
      matches: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      winRate: 0,
      promotions: 0,
      titles: 0,
      boardConfidence: 85,
      jobOffers: [],
      approaches: [],
      careerHistory: c ? [
        { season: s.season || 1, club: c.name, division: c.division, event: 'Appointed Head Coach' }
      ] : []
    };
  }
  refreshManagerJobOffers(s);

  // Guarantee at least 1-2 active approaches from clubs wanting to hire the manager
  const mc = s.managerCareer;
  mc.approaches = mc.approaches || [];
  if (mc.approaches.filter(a => a.status === 'pending' || a.status === 'stalled').length === 0) {
    generateManagerApproaches(s, 2, { initial: true });
  }

  return {
    managerCareer: s.managerCareer,
    currentClub: s.selectedClub ? club(s, s.selectedClub) : null
  };
}

function acceptManagerJobOffer(s, targetClubName) {
  if (!s) return { error: 'World not found.' };
  if (!s.managerCareer) return { error: 'No active manager career.' };
  const target = club(s, targetClubName);
  if (!target) return { error: 'Target club not found.' };

  const prevClub = s.selectedClub;
  s.selectedClub = target.name;
  target.online = true;
  target.manager = target.manager || {};
  target.manager.name = s.managerCareer.name;
  target.manager.reputation = s.managerCareer.reputation;

  if (!target.players || target.players.length < 16) {
    seedSquad(target, s.market, 16);
  }
  rebalanceSquadToDivision(s, target);

  s.managerCareer.reputation = Math.min(100, (s.managerCareer.reputation || 25) + 5);
  s.managerCareer.boardConfidence = 88;
  s.managerCareer.careerHistory = s.managerCareer.careerHistory || [];
  s.managerCareer.careerHistory.unshift({
    season: s.season || 1,
    club: target.name,
    division: target.division,
    event: `Sensational Move: Appointed Head Coach of ${target.name} (Div ${target.division})`
  });

  refreshManagerJobOffers(s);
  addNews(s, `🚨 MAJOR MANAGERIAL APPOINTMENT: ${s.managerCareer.name} has officially accepted the managerial post at ${target.name} after a sensational climb!`, 'manager');
  persist();
  return { success: true, newClub: target, managerCareer: s.managerCareer };
}

function updateManagerReputationAfterMatch(s, user, matchResult, isCup) {
  if (!s || !s.managerCareer || !matchResult || !user) return;
  const mc = s.managerCareer;
  const isUserHome = matchResult.home === user.name;
  const userGoals = isUserHome ? matchResult.homeGoals : matchResult.awayGoals;
  const oppGoals = isUserHome ? matchResult.awayGoals : matchResult.homeGoals;
  const oppName = isUserHome ? matchResult.away : matchResult.home;
  const opp = club(s, oppName);

  mc.matches = (mc.matches || 0) + 1;
  const isWon = userGoals > oppGoals || (matchResult.cupWinner === user.name);
  const isDraw = userGoals === oppGoals && !matchResult.cupWinner;

  if (isWon) {
    mc.wins = (mc.wins || 0) + 1;
    let repGain = 2;
    if (matchResult.isDerby) repGain += 2;
    if (opp && opp.division < user.division) repGain += 3; // Giant-killing lower tier bonus!
    if (opp && (opp.reputation || 60) > (user.reputation || 60) + 10) repGain += 2;
    mc.reputation = Math.min(100, (mc.reputation || 25) + repGain);
    mc.boardConfidence = Math.min(100, (mc.boardConfidence || 85) + 3);
    if (user.manager) user.manager.reputation = mc.reputation;
  } else if (isDraw) {
    mc.draws = (mc.draws || 0) + 1;
    if (opp && opp.division < user.division) {
      mc.reputation = Math.min(100, (mc.reputation || 25) + 1);
    }
    mc.boardConfidence = Math.min(100, (mc.boardConfidence || 85) + 1);
  } else {
    mc.losses = (mc.losses || 0) + 1;
    if (opp && opp.division > user.division) {
      mc.reputation = Math.max(15, (mc.reputation || 25) - 1);
    }
    mc.boardConfidence = Math.max(20, (mc.boardConfidence || 85) - 3);
  }

  mc.winRate = Math.round((mc.wins / mc.matches) * 100);
  refreshManagerJobOffers(s);

  // Other clubs dynamically approach the manager!
  try {
    const shouldApproach = isWon
      ? (Math.random() < 0.50 || (mc.wins % 2 === 0))
      : (isDraw ? Math.random() < 0.35 : Math.random() < 0.20);
    if (shouldApproach) {
      generateManagerApproaches(s, 1, { oppName: isWon ? oppName : null });
    }
  } catch (err) {}
}

function getManagerContractState(s, clubName) {
  if (!s) return null;
  const c = club(s, clubName || s.selectedClub);
  if (!s.managerCareer) getManagerCareerState(s);
  const mc = s.managerCareer;
  if (!mc) return null;
  if (!mc.contract && c) {
    const div = c.division || 3;
    const baseSal = div === 4 ? 0.35 : div === 3 ? 0.65 : div === 2 ? 2.5 : 8.0;
    mc.contract = {
      club: c.name,
      salary: baseSal,
      salaryFormatted: `₹${baseSal}M / yr`,
      yearsRemaining: 2,
      expectations: div === 4 ? 'avoid_relegation' : div === 3 ? 'mid_table' : 'promotion',
      releaseClause: div === 4 ? 12 : div === 3 ? 25 : 60,
      vetoPower: false,
      youthFunding: false,
      ratifiedSeason: s.season || 1,
      extraWarChestGranted: 0
    };
  }
  return {
    contract: mc.contract,
    managerCareer: mc,
    club: c
  };
}

function negotiateManagerRole(s, clubName, isNewJob, offerId, demands, candidateName) {
  if (!s) return { error: 'World not found.' };
  let target = club(s, clubName || s.selectedClub);
  if (!target) {
    const lowerClubs = s.clubs.filter(x => x.division === 4 || x.division === 3);
    target = lowerClubs[0] || s.clubs[0];
  }
  if (!target) return { error: 'Target club not found.' };

  if (!s.managerCareer) {
    getManagerCareerState(s);
  }
  const mc = s.managerCareer;
  if (candidateName && String(candidateName).trim()) {
    mc.name = String(candidateName).trim();
  }

  const requestedSalary = Math.round(Number(demands?.salary || 0.5) * 100) / 100;
  const requestedWarChest = Math.round(Number(demands?.transferWarChest || 0) * 10) / 10;
  const contractYears = Math.min(5, Math.max(1, Number(demands?.contractYears || 2)));
  const expectations = demands?.expectations || 'balanced';
  const releaseClause = Number(demands?.releaseClause || 15);
  const vetoPower = !!demands?.vetoPower;
  const youthFunding = !!demands?.youthFunding;

  const div = target.division || 3;
  const maxReasonableWarChest = div === 4 ? 15 : div === 3 ? 28 : div === 2 ? 55 : 95;
  const baseSalaryCap = div === 4 ? 0.9 : div === 3 ? 1.8 : div === 2 ? 4.5 : 16.0;

  const currentRep = mc.reputation || 25;
  const repFactor = Math.max(0.6, currentRep / 45);
  const boardTrust = isNewJob ? 82 : (mc.boardConfidence || 80);

  const warChestExcess = Math.max(0, requestedWarChest - (maxReasonableWarChest * repFactor));
  const salaryExcess = Math.max(0, requestedSalary - (baseSalaryCap * repFactor));

  // If demands are wildly unrealistic for this division & reputation
  if (warChestExcess > 25 || salaryExcess > 8.0) {
    return {
      status: 'rejected',
      success: false,
      message: `The board of ${target.name} has rejected these demands! Chairman: "A request for ₹${requestedWarChest}M war chest and ₹${requestedSalary}M/yr salary exceeds our fiscal capacity for Division ${div}."`,
      targetClub: target.name
    };
  }

  // If demands are slightly elevated, board counters with a compromise
  if (warChestExcess > 4 || salaryExcess > 0.8 || (requestedWarChest > 10 && boardTrust < 65)) {
    const offeredWarChest = Math.round(Math.min(requestedWarChest * 0.65, maxReasonableWarChest * repFactor) * 10) / 10;
    const offeredSalary = Math.round(Math.min(requestedSalary * 0.75, baseSalaryCap * repFactor) * 100) / 100;
    return {
      status: 'counter',
      success: false,
      message: `The board of ${target.name} presents a counter-offer. Chairman: "We value your managerial acumen, but we must protect the balance sheet. We can offer ₹${offeredWarChest}M additional war chest and ₹${offeredSalary}M/yr salary on a ${Math.min(3, contractYears)}-year contract."`,
      counterProposal: {
        salary: offeredSalary,
        transferWarChest: offeredWarChest,
        contractYears: Math.min(3, contractYears),
        expectations,
        releaseClause: Math.max(8, releaseClause),
        vetoPower: currentRep >= 35 ? vetoPower : false,
        youthFunding
      },
      targetClub: target.name
    };
  }

  // Approved!
  const grantedWarChest = requestedWarChest;
  target.cash = Math.round(((target.cash || 10) + grantedWarChest) * 10) / 10;

  mc.contract = {
    club: target.name,
    salary: requestedSalary,
    salaryFormatted: `₹${requestedSalary}M / yr`,
    yearsRemaining: contractYears,
    expectations,
    releaseClause,
    vetoPower,
    youthFunding,
    ratifiedSeason: s.season || 1,
    extraWarChestGranted: grantedWarChest
  };

  if (youthFunding) {
    target.youthFacility = Math.min(5, (target.youthFacility || 2) + 1);
  }

  if (isNewJob) {
    const prevClub = s.selectedClub;
    s.selectedClub = target.name;
    target.online = true;
    target.manager = target.manager || {};
    target.manager.name = mc.name;
    target.manager.reputation = mc.reputation;
    if (!target.players || target.players.length < 16) {
      seedSquad(target, s.market, 16);
    }
    rebalanceSquadToDivision(s, target);
    setupClubRivalries(s.clubs);

    mc.reputation = Math.min(100, (mc.reputation || 25) + 4);
    mc.boardConfidence = Math.min(98, 85 + (expectations === 'rebuild' ? 6 : 2));
    mc.careerHistory = mc.careerHistory || [];
    mc.careerHistory.unshift({
      season: s.season || 1,
      club: target.name,
      division: target.division,
      event: `Contract Negotiated: Appointed Head Coach with ₹${grantedWarChest}M War Chest (${contractYears} yr deal, ₹${requestedSalary}M/yr)`
    });
    addNews(s, `🤝 MANAGERIAL ROLE RATIFIED: ${mc.name} successfully negotiated contract terms to take charge at ${target.name} with an injected ₹${grantedWarChest}M transfer war chest!`, 'manager');
  } else {
    mc.boardConfidence = Math.min(99, (mc.boardConfidence || 85) + 6);
    mc.reputation = Math.min(100, (mc.reputation || 25) + 3);
    mc.careerHistory = mc.careerHistory || [];
    mc.careerHistory.unshift({
      season: s.season || 1,
      club: target.name,
      division: target.division,
      event: `Contract Renegotiated: Extended terms with ₹${grantedWarChest}M fresh war chest (${contractYears} yrs, ₹${requestedSalary}M/yr)`
    });
    addNews(s, `📝 CONTRACT EXTENSION: ${mc.name} has committed his future to ${target.name} after securing a new ${contractYears}-year deal and ₹${grantedWarChest}M in squad investment!`, 'manager');
  }

  refreshManagerJobOffers(s);
  persist();
  return {
    status: 'accepted',
    success: true,
    message: `The board of ${target.name} has APPROVED all negotiated role terms! An extra ₹${grantedWarChest}M transfer war chest has been deposited directly into the club treasury.`,
    managerCareer: mc,
    contract: mc.contract,
    targetClub: target
  };
}

// =============================================================
// FEATURE: SOCCER CHAMPS NATIONAL TEAMS & INTERNATIONAL OFFERS
// =============================================================
const NATIONAL_TEAMS_DATA = [
  { country: 'Brazil', flag: '🇧🇷', federation: 'CBF · CONMEBOL', rank: 5, stars: 5, rating: 89, captain: 'Vinicius Jr', keyPlayers: ['Vinicius Jr', 'Rodrygo', 'Alisson', 'Guimarães', 'Endrick'], mandate: 'Win the World Championship & Bring Joga Bonito Back', bonus: 18.0, salary: 5.5, repReq: 50 },
  { country: 'Argentina', flag: '🇦🇷', federation: 'AFA · CONMEBOL', rank: 1, stars: 5, rating: 91, captain: 'Lionel Messi', keyPlayers: ['Lionel Messi', 'Lautaro Martínez', 'Julián Álvarez', 'Enzo Fernández', 'Dibu Martínez'], mandate: 'Defend World Crown & Conquer International Glory', bonus: 20.0, salary: 6.0, repReq: 60 },
  { country: 'France', flag: '🇫🇷', federation: 'FFF · UEFA', rank: 2, stars: 5, rating: 90, captain: 'Kylian Mbappé', keyPlayers: ['Kylian Mbappé', 'Griezmann', 'Camavinga', 'Tchouaméni', 'Saliba'], mandate: 'Dominate Europe & Lift International Silverware', bonus: 19.0, salary: 5.8, repReq: 55 },
  { country: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', federation: 'The FA · UEFA', rank: 4, stars: 4.5, rating: 88, captain: 'Jude Bellingham', keyPlayers: ['Jude Bellingham', 'Harry Kane', 'Bukayo Saka', 'Phil Foden', 'Declan Rice'], mandate: 'End 60 Years of Hurt & Bring Football Home', bonus: 16.0, salary: 5.0, repReq: 45 },
  { country: 'Spain', flag: '🇪🇸', federation: 'RFEF · UEFA', rank: 3, stars: 5, rating: 90, captain: 'Rodri', keyPlayers: ['Rodri', 'Lamine Yamal', 'Pedri', 'Nico Williams', 'Carvajal'], mandate: 'Tiki-Taka Domination & Continental Supremacy', bonus: 18.0, salary: 5.4, repReq: 52 },
  { country: 'Germany', flag: '🇩🇪', federation: 'DFB · UEFA', rank: 8, stars: 4.5, rating: 86, captain: 'Jamal Musiala', keyPlayers: ['Jamal Musiala', 'Florian Wirtz', 'Kimmich', 'Rüdiger', 'Havertz'], mandate: 'Restore German Tactical Efficiency & Silverware', bonus: 14.0, salary: 4.5, repReq: 40 },
  { country: 'Portugal', flag: '🇵🇹', federation: 'FPF · UEFA', rank: 7, stars: 4.5, rating: 87, captain: 'Cristiano Ronaldo', keyPlayers: ['Cristiano Ronaldo', 'Bruno Fernandes', 'Bernardo Silva', 'Rafael Leão', 'Rúben Dias'], mandate: 'Unleash World-Class Generation & Win the Gold', bonus: 15.0, salary: 4.8, repReq: 42 },
  { country: 'Netherlands', flag: '🇳🇱', federation: 'KNVB · UEFA', rank: 6, stars: 4, rating: 85, captain: 'Virgil van Dijk', keyPlayers: ['Virgil van Dijk', 'Frenkie de Jong', 'Cody Gakpo', 'Simons', 'Dumfries'], mandate: 'Total Football Revival & Deep Tournament Run', bonus: 12.0, salary: 4.0, repReq: 35 },
  { country: 'Italy', flag: '🇮🇹', federation: 'FIGC · UEFA', rank: 9, stars: 4, rating: 85, captain: 'Nicolò Barella', keyPlayers: ['Nicolò Barella', 'Bastoni', 'Donnarumma', 'Dimarco', 'Chiesa'], mandate: 'Ironclad Catenaccio & European Rejuvenation', bonus: 13.0, salary: 4.2, repReq: 38 },
  { country: 'Japan', flag: '🇯🇵', federation: 'JFA · AFC', rank: 15, stars: 3.5, rating: 82, captain: 'Kaoru Mitoma', keyPlayers: ['Kaoru Mitoma', 'Takefusa Kubo', 'Endo', 'Minamino', 'Tomiyasu'], mandate: 'Asian Supremacy & Historic World Cup Quarter-Final', bonus: 9.0, salary: 2.8, repReq: 28 },
  { country: 'USA', flag: '🇺🇸', federation: 'USSF · CONCACAF', rank: 16, stars: 3.5, rating: 81, captain: 'Christian Pulisic', keyPlayers: ['Christian Pulisic', 'Weston McKennie', 'Tyler Adams', 'Balogun', 'Dest'], mandate: 'Lead Golden Generation to Global Prominence', bonus: 8.5, salary: 2.6, repReq: 26 },
  { country: 'Nigeria', flag: '🇳🇬', federation: 'NFF · CAF', rank: 28, stars: 3.5, rating: 81, captain: 'Victor Osimhen', keyPlayers: ['Victor Osimhen', 'Lookman', 'Chukwueze', 'Iwobi', 'Bassey'], mandate: 'Conquer Africa & Unleash Super Eagles On The World', bonus: 8.0, salary: 2.5, repReq: 25 },
  { country: 'Morocco', flag: '🇲🇦', federation: 'FRMF · CAF', rank: 12, stars: 4, rating: 84, captain: 'Achraf Hakimi', keyPlayers: ['Achraf Hakimi', 'Ziyech', 'En-Nesyri', 'Bounou', 'Ounahi'], mandate: 'Atlas Lions Semifinal Standard & African Crown', bonus: 11.0, salary: 3.5, repReq: 32 },
  { country: 'Belgium', flag: '🇧🇪', federation: 'RBFA · UEFA', rank: 10, stars: 4, rating: 84, captain: 'Kevin De Bruyne', keyPlayers: ['Kevin De Bruyne', 'Lukaku', 'Doku', 'Tielemans', 'Onana'], mandate: 'Golden Generation Final Hurrah & Silverware', bonus: 11.5, salary: 3.6, repReq: 34 },
  { country: 'Croatia', flag: '🇭🇷', federation: 'HNS · UEFA', rank: 11, stars: 4, rating: 83, captain: 'Luka Modrić', keyPlayers: ['Luka Modrić', 'Kovačić', 'Gvardiol', 'Kramarić', 'Livaković'], mandate: 'Defy Odds & Clinch Ultimate International Glory', bonus: 10.0, salary: 3.2, repReq: 30 },
  { country: 'India', flag: '🇮🇳', federation: 'AIFF · AFC', rank: 99, stars: 2.5, rating: 73, captain: 'Sunil Chhetri', keyPlayers: ['Sunil Chhetri', 'Lallianzuala Chhangte', 'Sandesh Jhingan', 'Gurpreet Singh', 'Sahal Samad'], mandate: 'Asian Cup Miracles, Grassroots Boom & Top 60 Surge', bonus: 6.0, salary: 1.5, repReq: 20 }
];

function getNationalTeamState(s) {
  if (!s) return null;
  const mc = s.managerCareer || getManagerCareerState(s).managerCareer;
  const rep = mc.reputation || 25;

  s.nationalManagement = s.nationalManagement || {
    currentJob: null, // { country, flag, rank, stars, rating, mandate, contractYears, matches, wins, draws, losses, trophies: [] }
    offers: [],
    tournament: null,
    history: []
  };

  const nm = s.nationalManagement;

  // Refresh or generate realistic national team approaches
  const activeCountry = nm.currentJob ? nm.currentJob.country : null;
  const availableNations = NATIONAL_TEAMS_DATA.filter(n => n.country !== activeCountry);

  // Generate 2 to 4 active offers tailored to manager rep
  let validOffers = availableNations.filter(n => rep >= (n.repReq - 10));
  if (validOffers.length === 0) validOffers = availableNations.filter(n => n.rank >= 20 || n.country === 'India');

  // Keep pending offers fresh
  if (!nm.offers || nm.offers.length === 0) {
    const selectedNations = [...validOffers].sort(() => 0.5 - Math.random()).slice(0, 3);
    nm.offers = selectedNations.map(nat => ({
      id: 'nat_offer_' + nat.country.toLowerCase() + '_' + Date.now().toString(36),
      country: nat.country,
      flag: nat.flag,
      federation: nat.federation,
      rank: nat.rank,
      stars: nat.stars,
      rating: nat.rating,
      captain: nat.captain,
      keyPlayers: nat.keyPlayers,
      mandate: nat.mandate,
      salaryFormatted: `₹${nat.salary}M / yr (Federation Honorarium)`,
      salary: nat.salary,
      bonus: nat.bonus,
      repReq: nat.repReq,
      isQualified: rep >= nat.repReq,
      status: 'pending',
      letter: `Dear Manager ${mc.name},\n\nThe Executive Committee of the ${nat.federation} has closely reviewed your managerial triumphs. We formally invite you to accept the role of National Team Head Coach to lead our country in the upcoming World Championship. We fully support your concurrent club commitments in a dual-management capacity.`
    }));
  }

  // Ensure active tournament structure exists
  if (!nm.tournament || nm.tournament.status === 'completed') {
    const tourneyNations = ['Brazil', 'Argentina', 'France', 'England', 'Spain', 'Germany', 'Portugal', 'Netherlands', 'Italy', 'Japan', 'USA', 'Morocco', 'Croatia', 'Belgium', 'Nigeria', 'India'];
    nm.tournament = {
      name: 'FIFA World Nations Championship 🏆',
      status: 'quarter_finals',
      stage: 'Quarter-Finals',
      season: s.season || 1,
      bracket: [
        { id: 'qf1', stage: 'Quarter-Final', home: 'Argentina', away: 'Germany', homeGoals: null, awayGoals: null, played: false, winner: null },
        { id: 'qf2', stage: 'Quarter-Final', home: 'Brazil', away: 'Spain', homeGoals: null, awayGoals: null, played: false, winner: null },
        { id: 'qf3', stage: 'Quarter-Final', home: 'France', away: 'England', homeGoals: null, awayGoals: null, played: false, winner: null },
        { id: 'qf4', stage: 'Quarter-Final', home: 'Portugal', away: 'Netherlands', homeGoals: null, awayGoals: null, played: false, winner: null }
      ],
      champion: null
    };

    // If manager has a nation, insert their country into Quarter-Final 1!
    if (nm.currentJob) {
      nm.tournament.bracket[0].home = nm.currentJob.country;
    }
  }

  return {
    currentJob: nm.currentJob,
    offers: nm.offers,
    tournament: nm.tournament,
    history: nm.history || [],
    managerRep: rep
  };
}

function respondToNationalOffer(s, offerIdOrCountry, action) {
  if (!s) return { error: 'World not found.' };
  const nmState = getNationalTeamState(s);
  const nm = s.nationalManagement;
  const mc = s.managerCareer || getManagerCareerState(s).managerCareer;

  const offer = nm.offers.find(o => o.id === offerIdOrCountry || o.country.toLowerCase() === String(offerIdOrCountry).toLowerCase());
  if (!offer) return { error: 'National offer not found.' };

  if (action === 'accept') {
    const nationData = NATIONAL_TEAMS_DATA.find(n => n.country === offer.country) || offer;
    nm.currentJob = {
      country: nationData.country,
      flag: nationData.flag,
      federation: nationData.federation,
      rank: nationData.rank,
      stars: nationData.stars,
      rating: nationData.rating,
      captain: nationData.captain,
      keyPlayers: nationData.keyPlayers,
      mandate: nationData.mandate,
      salary: nationData.salary,
      salaryFormatted: `₹${nationData.salary}M / yr`,
      matches: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      trophies: [],
      appointedDate: new Date().toLocaleDateString(),
      contractYears: 4
    };

    mc.reputation = Math.min(100, (mc.reputation || 25) + 8);
    mc.boardConfidence = Math.min(100, (mc.boardConfidence || 85) + 5);
    mc.careerHistory = mc.careerHistory || [];
    mc.careerHistory.unshift({
      season: s.season || 1,
      club: nm.currentJob.country + ' National Team',
      event: `Appointed Head Coach of ${nm.currentJob.flag} ${nm.currentJob.country} National Team!`
    });

    offer.status = 'accepted';
    nm.offers = nm.offers.filter(o => o.id !== offer.id);

    // Update tournament bracket so current job nation is the flagship participant
    if (nm.tournament && nm.tournament.bracket) {
      nm.tournament.bracket[0].home = nm.currentJob.country;
    }

    addNews(s, `🌍 HISTORIC INTERNATIONAL APPOINTMENT: ${mc.name} has officially been confirmed as Head Coach of ${nationData.flag} ${nationData.country}! The manager will lead the nation concurrently with club football!`, 'manager');
    persist();
    return {
      success: true,
      action: 'accepted',
      currentJob: nm.currentJob,
      message: `🎉 Official Appointment! You are now the Head Coach of the ${nationData.flag} ${nationData.country} National Team!`
    };
  }

  if (action === 'decline') {
    offer.status = 'declined';
    nm.offers = nm.offers.filter(o => o.id !== offer.id);
    addNews(s, `🤝 INTERNATIONAL RESOLVE: ${mc.name} respectfully declined the coaching invitation from the ${offer.federation}, prioritizing club focus.`, 'manager');
    persist();
    return {
      success: true,
      action: 'declined',
      message: `You declined the offer from ${offer.country}.`
    };
  }

  return { error: 'Unknown action.' };
}

function simulateNationalTournamentMatch(s, keyMomentsGoals = null) {
  if (!s) return { error: 'World not found.' };
  const nmState = getNationalTeamState(s);
  const nm = s.nationalManagement;
  const t = nm.tournament;
  const cJob = nm.currentJob;

  if (!t || t.status === 'completed') {
    return { error: 'Tournament completed. Advance season or reset bracket.' };
  }

  const results = [];
  const currentMatches = t.bracket.filter(m => !m.played);
  if (currentMatches.length === 0) {
    return { error: 'No pending matches in active round.' };
  }

  currentMatches.forEach(m => {
    let hg = Math.floor(Math.random() * 4);
    let ag = Math.floor(Math.random() * 3);

    // If manager's national team is playing and key moments were scored, apply them!
    if (cJob && (m.home === cJob.country || m.away === cJob.country)) {
      if (typeof keyMomentsGoals === 'number') {
        if (m.home === cJob.country) hg = keyMomentsGoals;
        else ag = keyMomentsGoals;
      } else {
        // Boost for manager's national team
        if (m.home === cJob.country) hg = Math.max(hg, Math.floor(Math.random() * 3) + 1);
        if (m.away === cJob.country) ag = Math.max(ag, Math.floor(Math.random() * 3) + 1);
      }
    }

    if (hg === ag) {
      // Extra time / penalty decider for knockout
      if (Math.random() < 0.5) hg++;
      else ag++;
    }

    m.homeGoals = hg;
    m.awayGoals = ag;
    m.winner = hg > ag ? m.home : m.away;
    m.played = true;
    results.push(m);

    if (cJob) {
      if (m.home === cJob.country || m.away === cJob.country) {
        cJob.matches = (cJob.matches || 0) + 1;
        const userWon = m.winner === cJob.country;
        if (userWon) {
          cJob.wins = (cJob.wins || 0) + 1;
          s.managerCareer.reputation = Math.min(100, (s.managerCareer.reputation || 25) + 3);
        } else {
          cJob.losses = (cJob.losses || 0) + 1;
        }
      }
    }
  });

  // Advance stage
  if (t.stage === 'Quarter-Finals') {
    const winners = results.map(r => r.winner);
    t.stage = 'Semi-Finals';
    t.bracket = [
      { id: 'sf1', stage: 'Semi-Final', home: winners[0] || 'Brazil', away: winners[1] || 'Spain', homeGoals: null, awayGoals: null, played: false, winner: null },
      { id: 'sf2', stage: 'Semi-Final', home: winners[2] || 'France', away: winners[3] || 'Portugal', homeGoals: null, awayGoals: null, played: false, winner: null }
    ];
    addNews(s, `🌍 WORLD NATIONS SEMI-FINALS: ${winners.join(', ')} advance to the final four of the World Championship!`, 'competition');
  } else if (t.stage === 'Semi-Finals') {
    const winners = results.map(r => r.winner);
    t.stage = 'Final';
    t.bracket = [
      { id: 'final', stage: 'Grand Final', home: winners[0] || 'Brazil', away: winners[1] || 'France', homeGoals: null, awayGoals: null, played: false, winner: null }
    ];
    addNews(s, `🌍 WORLD NATIONS FINAL SET: ${winners[0]} vs ${winners[1]} will clash for the ultimate world crown!`, 'competition');
  } else if (t.stage === 'Final') {
    const champion = results[0]?.winner || 'Champions';
    t.stage = 'Completed';
    t.status = 'completed';
    t.champion = champion;

    if (cJob && champion === cJob.country) {
      cJob.trophies = cJob.trophies || [];
      cJob.trophies.push(`FIFA World Championship (Season ${s.season || 1})`);
      s.managerCareer.titles = (s.managerCareer.titles || 0) + 1;
      s.managerCareer.reputation = Math.min(100, (s.managerCareer.reputation || 25) + 15);
      addNews(s, `🏆 WORLD CHAMPIONS! ${cJob.country} managed by ${s.managerCareer.name} lift the World Championship Trophy! Unprecedented international glory!`, 'competition');
    } else {
      addNews(s, `🏆 WORLD CHAMPIONS: ${champion} triumph in the World Championship Final!`, 'competition');
    }
  }

  persist();
  return {
    success: true,
    results,
    tournament: t,
    currentJob: cJob
  };
}

// =============================================================
// FEATURE: SOCCER CHAMPS YOUTH SCOUT & WONDERKID SYSTEM
// =============================================================
const YOUTH_MASTER_SCOUTS = [
  { id: 'scout_samba', name: 'Mateo Silveira', title: 'South American Samba Scout', region: 'South America', tier: 'Master Scout', starRating: 5, hireCost: 1.2, specialty: 'Brazilian & Argentine Wingers · 5★ Flair & Finishing', bonusPotential: 6, avatar: '🇧🇷' },
  { id: 'scout_tactical', name: 'Hans Van Der Meer', title: 'Continental European Academy Sleuth', region: 'Europe', tier: 'Senior Scout', starRating: 4.5, hireCost: 1.0, specialty: 'Dutch & German Registas · Press Resistance & Vision', bonusPotential: 5, avatar: '🇳🇱' },
  { id: 'scout_dynamo', name: 'Amara Diop', title: 'West African Dynamo Pathfinder', region: 'Africa', tier: 'Senior Scout', starRating: 4.5, hireCost: 0.8, specialty: 'Lightning Strikers & Box-to-Box Powerhouses', bonusPotential: 5, avatar: '🇸🇳' },
  { id: 'scout_grassroots', name: 'Arthur Pendelton', title: 'British Grassroots Sleuth', region: 'Grassroots', tier: 'Scout Specialist', starRating: 4, hireCost: 0.5, specialty: 'Lower League Grit, High Determination & Defensive Rocks', bonusPotential: 4, avatar: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { id: 'scout_whisperer', name: 'Luciano "El Brujo" Castiglione', title: 'The Wonderkid Whisperer', region: 'Global Elite', tier: 'Legendary Master Scout', starRating: 5, hireCost: 2.2, specialty: 'Unearths Generational 92-96 POT Prodigies / Future Ballon d’Or Winners', bonusPotential: 8, avatar: '👑' }
];

const WONDERKID_POOLS = {
  'South America': [
    { name: 'Thiago Estevão', pos: 'RWF', nat: 'Brazil', age: 16, baseOvr: 68, basePot: 93, moniker: 'The Favela Magician', trait: 'Silky Elastico & Rapid Cutback', wage: 0.25 },
    { name: 'Mateo Rossi Romero', pos: 'CF', nat: 'Argentina', age: 17, baseOvr: 71, basePot: 94, moniker: 'The Next Batistuta', trait: 'Thunderous Volley & Ice In Veins', wage: 0.35 },
    { name: 'Lucas Beraldo Paez', pos: 'CAM', nat: 'Colombia', age: 16, baseOvr: 66, basePot: 91, moniker: 'Andean Playmaker', trait: 'Golden Vision & Dead-Ball Mastery', wage: 0.2 },
    { name: 'Felipe Santana', pos: 'LWF', nat: 'Brazil', age: 15, baseOvr: 65, basePot: 95, moniker: 'Generational Samba Star', trait: 'Explosive Acceleration & Dribbling Maestro', wage: 0.2 }
  ],
  'Europe': [
    { name: 'Kasper Lindqvist', pos: 'CMF', nat: 'Denmark', age: 17, baseOvr: 70, basePot: 92, moniker: 'The Nordic Regista', trait: 'Pinpoint 60-Yard Diagonal Passes', wage: 0.3 },
    { name: 'Julian Weidmann', pos: 'CAM', nat: 'Germany', age: 16, baseOvr: 69, basePot: 93, moniker: 'Space Investigator', trait: 'Flawless Half-Space Movement', wage: 0.25 },
    { name: 'Xavier Soler', pos: 'CB', nat: 'Spain', age: 17, baseOvr: 72, basePot: 91, moniker: 'La Masia Stopper', trait: 'Ball-Playing Defensive Commander', wage: 0.35 },
    { name: 'Antoine Boucher', pos: 'CF', nat: 'France', age: 16, baseOvr: 69, basePot: 94, moniker: 'The Lightning Finisher', trait: 'Breakaway Pace & Lethal Low Driven Finish', wage: 0.3 }
  ],
  'Africa': [
    { name: 'Malick Fofana', pos: 'CF', nat: 'Ivory Coast', age: 16, baseOvr: 70, basePot: 93, moniker: 'The Abidjan Rocket', trait: '96 Acceleration & Relentless Power', wage: 0.25 },
    { name: 'Samuel Chukwu', pos: 'RW', nat: 'Nigeria', age: 17, baseOvr: 68, basePot: 91, moniker: 'The Lagos Flyer', trait: 'Blistering Stepover & Direct Dribbling', wage: 0.22 },
    { name: 'Ibrahim Konaté', pos: 'DMF', nat: 'Mali', age: 18, baseOvr: 72, basePot: 92, moniker: 'The Midfield Wall', trait: 'Unstoppable Tackles & Iron Lungs', wage: 0.3 }
  ],
  'Grassroots': [
    { name: 'Leo "Jack" Sterling', pos: 'CF', nat: 'England', age: 16, baseOvr: 67, basePot: 90, moniker: 'The Street Scrapper', trait: 'Aggressive Pressing & Clinical Poaching', wage: 0.18 },
    { name: 'Callum O’Shea', pos: 'CB', nat: 'Ireland', age: 17, baseOvr: 68, basePot: 89, moniker: 'The Celtic Rock', trait: 'Dominant Aerial Duels & Fearless Blocks', wage: 0.2 }
  ],
  'Global Elite': [
    { name: 'Kenjiro "Ken" Endo', pos: 'CAM', nat: 'Japan', age: 16, baseOvr: 73, basePot: 96, moniker: 'The Shinjuku Prodigy', trait: 'Laser Accuracy, 99 Composure & World Wonderkid', wage: 0.4 },
    { name: 'Alessandro De Luca', pos: 'CF', nat: 'Italy', age: 16, baseOvr: 72, basePot: 95, moniker: 'The Golden Boy Phenom', trait: 'Postage Stamp Curler & Instinctive Flick', wage: 0.4 },
    { name: 'Mateo "El Pibe" Cruz', pos: 'RW', nat: 'Argentina', age: 15, baseOvr: 71, basePot: 96, moniker: 'The Heir to the Throne', trait: 'Left-Footed Magic, Telepathic Dribble & Wonderkid', wage: 0.38 }
  ]
};

function getYouthScoutState(s, clubName) {
  if (!s) return null;
  const c = club(s, clubName || s.selectedClub);
  if (!c) return null;

  c.youthSystem = c.youthSystem || {
    hiredScouts: [
      { ...YOUTH_MASTER_SCOUTS[0], hiredAt: 'Active Staff' }
    ],
    activeExpeditions: [],
    dossiers: [],
    academyPlayers: []
  };

  return {
    club: c.name,
    cash: c.cash,
    availableScouts: YOUTH_MASTER_SCOUTS,
    hiredScouts: c.youthSystem.hiredScouts,
    activeExpeditions: c.youthSystem.activeExpeditions,
    dossiers: c.youthSystem.dossiers,
    academyPlayers: c.youthSystem.academyPlayers
  };
}

function hireYouthScout(s, clubName, scoutId) {
  const c = club(s, clubName || s.selectedClub);
  if (!c) return { error: 'Club not found.' };
  const ys = getYouthScoutState(s, c.name);

  const scoutTemplate = YOUTH_MASTER_SCOUTS.find(sc => sc.id === scoutId);
  if (!scoutTemplate) return { error: 'Scout not found.' };

  if (c.youthSystem.hiredScouts.some(sc => sc.id === scoutId)) {
    return { error: 'Scout already on payroll.' };
  }

  if (c.cash < scoutTemplate.hireCost) {
    return { error: `Insufficient club treasury. Need ₹${scoutTemplate.hireCost}M, club has ₹${money(c.cash)}M.` };
  }

  c.cash = Math.max(0, Math.round((c.cash - scoutTemplate.hireCost) * 10) / 10);
  recordTransaction(c, -scoutTemplate.hireCost, 'staff_hire', `Hired Master Youth Scout: ${scoutTemplate.name}`, s);

  const newScout = { ...scoutTemplate, hiredAt: new Date().toLocaleDateString() };
  c.youthSystem.hiredScouts.push(newScout);

  addNews(s, `🔭 YOUTH SCOUT APPOINTMENT: ${c.name} has appointed ${scoutTemplate.name} (${scoutTemplate.title}) to lead global wonderkid scouting!`, 'club');
  persist();
  return {
    success: true,
    scout: newScout,
    youthState: getYouthScoutState(s, c.name),
    message: `Hired ${scoutTemplate.name}! Ready to dispatch on scouting missions.`
  };
}

function dispatchWonderkidExpedition(s, clubName, scoutId, region = 'South America') {
  const c = club(s, clubName || s.selectedClub);
  if (!c) return { error: 'Club not found.' };
  getYouthScoutState(s, c.name);

  const scout = c.youthSystem.hiredScouts.find(sc => sc.id === scoutId) || c.youthSystem.hiredScouts[0];
  const expeditionCost = scout ? Math.round(scout.hireCost * 0.4 * 10) / 10 : 0.4;

  if (c.cash < expeditionCost) {
    return { error: `Expedition mission requires ₹${expeditionCost}M operational funding. Club has ₹${money(c.cash)}M.` };
  }

  c.cash = Math.max(0, Math.round((c.cash - expeditionCost) * 10) / 10);
  recordTransaction(c, -expeditionCost, 'scouting_expedition', `Expedition to ${region} led by ${scout ? scout.name : 'Head Scout'}`, s);

  // Generate 2 to 3 genuine high-potential wonderkids
  const pool = WONDERKID_POOLS[region] || WONDERKID_POOLS['South America'];
  const shuffled = [...pool].sort(() => 0.5 - Math.random()).slice(0, 3);

  const newDossiers = shuffled.map(p => {
    const potVariance = Math.floor(Math.random() * 4);
    const potential = Math.min(97, p.basePot + (scout?.bonusPotential ? Math.floor(scout.bonusPotential * 0.4) : 0) + potVariance);
    const id = 'wk_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 4);

    return {
      id,
      name: p.name,
      position: p.pos,
      nationality: p.nat,
      age: p.age,
      rating: p.baseOvr,
      potentialStars: potential >= 94 ? 5 : potential >= 90 ? 4.5 : 4,
      potentialRange: `${potential - 2}-${potential + 2} POT`,
      potentialExact: potential,
      moniker: p.moniker,
      trait: p.trait,
      recommendedBy: scout ? scout.name : 'Youth Academy',
      signingFee: Math.round((p.wage * 2.8 + (potential >= 93 ? 1.2 : 0.5)) * 10) / 10,
      wage: p.wage,
      region,
      status: 'scouted',
      date: new Date().toLocaleDateString()
    };
  });

  c.youthSystem.dossiers.unshift(...newDossiers);
  if (c.youthSystem.dossiers.length > 15) {
    c.youthSystem.dossiers = c.youthSystem.dossiers.slice(0, 15);
  }

  addNews(s, `🌟 WONDERKID DOSSIER ARRIVES: Scout ${scout ? scout.name : 'Network'} unearths ${newDossiers.length} sensational teenage talents in ${region}!`, 'scout');
  persist();
  return {
    success: true,
    dossiers: newDossiers,
    expeditionCost,
    message: `Scouting expedition to ${region} returned with ${newDossiers.length} high-potential wonderkids!`
  };
}

function signWonderkid(s, clubName, wonderkidId, destination = 'academy') {
  const c = club(s, clubName || s.selectedClub);
  if (!c) return { error: 'Club not found.' };
  getYouthScoutState(s, c.name);

  const dossier = c.youthSystem.dossiers.find(d => d.id === wonderkidId);
  if (!dossier) return { error: 'Wonderkid dossier not found.' };

  const fee = dossier.signingFee || 0.8;
  if (c.cash < fee) {
    return { error: `Signing fee is ₹${fee}M. Club has ₹${money(c.cash)}M.` };
  }

  c.cash = Math.max(0, Math.round((c.cash - fee) * 10) / 10);
  recordTransaction(c, -fee, 'wonderkid_signing', `Signed Wonderkid ${dossier.name} (${dossier.potentialRange})`, s);

  dossier.status = destination === 'first_team' ? 'promoted' : 'in_academy';

  if (destination === 'first_team') {
    // Add directly to senior squad
    const playerObj = {
      id: 'p_wk_' + Date.now().toString(36),
      name: dossier.name,
      position: dossier.position,
      rating: dossier.rating,
      potential: dossier.potentialExact,
      age: dossier.age,
      nationality: dossier.nationality,
      wage: dossier.wage,
      askingPrice: Math.round(fee * 2.5 * 10) / 10,
      contractYears: 4,
      ownerClub: c.name,
      isWonderkid: true,
      trait: dossier.trait,
      moniker: dossier.moniker,
      morale: 95,
      fitness: 100
    };

    s.market.unshift(playerObj);
    c.players = c.players || [];
    c.players.push(playerObj.id);

    addNews(s, `✍️ SENIOR WONDERKID SIGNING: ${c.name} promotes 16-year-old phenom ${dossier.name} (${dossier.moniker}, ${dossier.potentialRange}) directly into the first team!`, 'transfer');
    persist();
    return {
      success: true,
      destination: 'first_team',
      player: playerObj,
      message: `Signed ${dossier.name} to the first team squad!`
    };
  } else {
    // Enrolled in Youth Academy
    const academyObj = {
      id: dossier.id,
      name: dossier.name,
      position: dossier.position,
      nationality: dossier.nationality,
      age: dossier.age,
      rating: dossier.rating,
      potentialExact: dossier.potentialExact,
      potentialRange: dossier.potentialRange,
      moniker: dossier.moniker,
      trait: dossier.trait,
      enrolledAtSeason: s.season || 1,
      developmentProgress: 15
    };

    c.youthSystem.academyPlayers.unshift(academyObj);
    addNews(s, `🏫 ACADEMY ENROLLMENT: ${c.name} secures signature of teenage wonderkid ${dossier.name} into the youth academy!`, 'club');
    persist();
    return {
      success: true,
      destination: 'academy',
      academyPlayer: academyObj,
      message: `Enrolled ${dossier.name} into your Youth Academy!`
    };
  }
}

function promoteAcademyWonderkid(s, clubName, academyPlayerId) {
  const c = club(s, clubName || s.selectedClub);
  if (!c) return { error: 'Club not found.' };
  getYouthScoutState(s, c.name);

  const idx = c.youthSystem.academyPlayers.findIndex(p => p.id === academyPlayerId);
  if (idx === -1) return { error: 'Academy wonderkid not found.' };

  const ap = c.youthSystem.academyPlayers[idx];
  // Promotion gives +2 OVR bump for graduation
  const gradOvr = Math.min(ap.potentialExact, ap.rating + 2);

  const playerObj = {
    id: 'p_grad_' + Date.now().toString(36),
    name: ap.name,
    position: ap.position,
    rating: gradOvr,
    potential: ap.potentialExact,
    age: ap.age,
    nationality: ap.nationality,
    wage: 0.35,
    askingPrice: 8.5,
    contractYears: 4,
    ownerClub: c.name,
    isWonderkid: true,
    trait: ap.trait,
    moniker: ap.moniker,
    morale: 95,
    fitness: 100
  };

  s.market.unshift(playerObj);
  c.players = c.players || [];
  c.players.push(playerObj.id);
  c.youthSystem.academyPlayers.splice(idx, 1);

  addNews(s, `🎓 ACADEMY GRADUATION: ${ap.name} (${gradOvr} OVR, ${ap.moniker}) officially promoted to ${c.name} first-team squad!`, 'club');
  persist();
  return {
    success: true,
    player: playerObj,
    message: `${ap.name} has graduated and joined the senior squad!`
  };
}

// =============================================================
// FEATURE: SOCCER CHAMPS KEY MOMENTS MATCH RECORDER
// =============================================================
function recordKeyMomentsMatch(s, payload = {}) {
  const user = club(s, s.selectedClub);
  if (!user) return { error: 'Choose a club first.' };

  const fixture = getNextFixture(s);
  if (!fixture) return { error: 'No upcoming fixture.' };

  const goalsScored = Math.max(0, Number(payload.goalsScored) || 0);
  const chancesPlayed = Math.max(1, Number(payload.chancesPlayed) || 3);
  const opp = fixture.opponent;

  // Simulate opponent goals based on their rating
  let oppGoals = 0;
  const oppChance = (opp.rating || 75) / 100;
  if (Math.random() < oppChance * 0.7) oppGoals++;
  if (Math.random() < oppChance * 0.35) oppGoals++;

  const userWon = goalsScored > oppGoals;
  const isDraw = goalsScored === oppGoals;

  s.matchday = (s.matchday || 0) + 1;

  const matchResult = {
    home: fixture.homeTeam,
    away: fixture.awayTeam,
    homeGoals: fixture.isHome ? goalsScored : oppGoals,
    awayGoals: fixture.isHome ? oppGoals : goalsScored,
    isCup: fixture.compType !== 'league',
    competitionName: fixture.fullTitle,
    compLabel: fixture.compLabel,
    compType: fixture.compType,
    compBadgeColor: fixture.compBadgeColor,
    compStage: fixture.compStage,
    fixture,
    keyMomentsPlayed: true,
    chancesPlayed,
    userGoalsScored: goalsScored,
    date: new Date().toISOString()
  };

  // Update manager career stats
  if (s.managerCareer) {
    const mc = s.managerCareer;
    mc.matches = (mc.matches || 0) + 1;
    if (userWon) {
      mc.wins = (mc.wins || 0) + 1;
      mc.reputation = Math.min(100, (mc.reputation || 25) + 4);
      mc.boardConfidence = Math.min(100, (mc.boardConfidence || 85) + 4);
      user.morale = Math.min(100, (user.morale || 75) + 6);
    } else if (isDraw) {
      mc.draws = (mc.draws || 0) + 1;
      mc.reputation = Math.min(100, (mc.reputation || 25) + 1);
    } else {
      mc.losses = (mc.losses || 0) + 1;
      mc.boardConfidence = Math.max(30, (mc.boardConfidence || 85) - 3);
      user.morale = Math.max(40, (user.morale || 75) - 4);
    }

    if (userWon && Math.random() < 0.5) {
      generateManagerApproaches(s, 1, { oppName: opp.name, postWin: true });
    }
  }

  // Update league standings if league match
  if (fixture.compType === 'league') {
    const userClubInTable = s.clubs.find(c => c.name === user.name);
    const oppClubInTable = s.clubs.find(c => c.name === opp.name);
    if (userClubInTable && oppClubInTable) {
      userClubInTable.played = (userClubInTable.played || 0) + 1;
      oppClubInTable.played = (oppClubInTable.played || 0) + 1;
      userClubInTable.gf = (userClubInTable.gf || 0) + goalsScored;
      userClubInTable.ga = (userClubInTable.ga || 0) + oppGoals;
      oppClubInTable.gf = (oppClubInTable.gf || 0) + oppGoals;
      oppClubInTable.ga = (oppClubInTable.ga || 0) + goalsScored;

      if (userWon) {
        userClubInTable.won = (userClubInTable.won || 0) + 1;
        userClubInTable.points = (userClubInTable.points || 0) + 3;
        oppClubInTable.lost = (oppClubInTable.lost || 0) + 1;
      } else if (isDraw) {
        userClubInTable.drawn = (userClubInTable.drawn || 0) + 1;
        userClubInTable.points = (userClubInTable.points || 0) + 1;
        oppClubInTable.drawn = (oppClubInTable.drawn || 0) + 1;
        oppClubInTable.points = (oppClubInTable.points || 0) + 1;
      } else {
        userClubInTable.lost = (userClubInTable.lost || 0) + 1;
        oppClubInTable.won = (oppClubInTable.won || 0) + 1;
        oppClubInTable.points = (oppClubInTable.points || 0) + 3;
      }
    }
  }

  const resultVerbiage = userWon ? 'SENSATIONAL TRIUMPH' : isDraw ? 'HONORS EVEN' : 'HEARTBREAKING REVERSE';
  addNews(s, `🕹️ SOCCER CHAMPS KEY MOMENTS: ${resultVerbiage}! ${user.name} finish ${matchResult.homeGoals}-${matchResult.awayGoals} vs ${opp.name}. You scored ${goalsScored} clutch goals from ${chancesPlayed} key moments!`, 'match');

  persist();
  return {
    success: true,
    matchResult,
    userWon,
    isDraw,
    goalsScored,
    oppGoals,
    nextFixture: getNextFixture(s)
  };
}

function roomsList(){return [...worldRooms.values()].map(s=>({code:s.roomCode,name:s.roomName,count:Object.values(s.humans||{}).filter(x=>x.online).length,max:s.maxHumans,host:s.host}));}
module.exports={worldRooms,soloWorlds,createRoom,createSolo,getWorld,joinRoom,leaveRoom,createClub,chooseClub,hiringManager:hireManager,hireManager,managerRecommendations,managerMeeting,setExpectation,startBattle,intervene,completeBattle,loan,releasePlayer,sellPlayer,updatePlayerSalary,simulate,getNextFixture,advanceSeason,updateEconomy,updateJersey,launchJersey,sponsorshipOffers,signSponsor,createCustomPlayer,dispatchScout,negotiateTransfer,calculateClubBudget,recordTransaction,setupClubRivalries,globalState,roomsList,persist,upgradeLegacyWorld,generateSeasonAwards,initiateGlobalTournament,simulateGlobalTournamentRound,generateAiTransferApproaches,respondToIncomingOffer,initiateUclTournament,simulateUclRound,initiateEuropaTournament,simulateEuropaRound,initiateDomesticCup,simulateDomesticCupRound,initiatePlayoffs,simulatePlayoffsRound,getDeadlineDayState,executeDeadlineDayAction,executeSwapTransfer,getDressingRoomStatus,resolveDressingRoomTalk,getInternationalStatus,acceptInternationalRole,simulateInternationalMatch,getStadiumVisualState,upgradeStadiumModule,setStadiumTifo,getDerbyHeadToHead,getTacticalPlaybookState,updateTacticalPlaybook,getMedicalCenterState,executeMedicalAction,getLoanArmyState,loanOutPlayer,recallLoanPlayer,getTakeoverAndEmpireState,executeTakeoverAction,getContractMatrixState,executeContractRenewal,getPreseasonTourState,simulatePreseasonTour,getHallOfFameState,hostTestimonialMatch,executeHalfTimeTalk,generateVarReviewIncident,getLowerDivisionClubs,assignManagerToClub,refreshManagerJobOffers,getManagerCareerState,acceptManagerJobOffer,updateManagerReputationAfterMatch,negotiateManagerRole,getManagerContractState,generateManagerApproaches,respondToManagerApproach,solicitManagerApproaches,getNationalTeamState,respondToNationalOffer,simulateNationalTournamentMatch,getYouthScoutState,hireYouthScout,dispatchWonderkidExpedition,signWonderkid,promoteAcademyWonderkid,recordKeyMomentsMatch};
