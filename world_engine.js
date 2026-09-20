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

function seedSquad(clubObj, market, count = 16) {
  if (!clubObj) return;
  clubObj.players = Array.isArray(clubObj.players) ? clubObj.players : [];
  const needed = ['GK','GK','CB','CB','CB','LB','RB','DMF','CMF','CMF','AMF','AMF','CF','CF','LWF','RWF'];
  needed.forEach(pos => {
    if (clubObj.players.length >= count) return;
    let p = market.find(x => x.position === pos && !x.ownerClub && !clubObj.players.includes(x.id));
    if (!p) p = market.find(x => !x.ownerClub && !clubObj.players.includes(x.id));
    if (p) {
      p.ownerClub = clubObj.name;
      p.status = 'contracted';
      if (!clubObj.players.includes(p.id)) clubObj.players.push(p.id);
    } else {
      const pId = 'p_seed_' + Math.random().toString(36).slice(2, 9);
      const rep = Number(clubObj.reputation) || 72;
      const rating = Math.min(84, Math.max(68, Math.round(rep * 0.95 + (Math.random() * 6 - 3))));
      const randFirst = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
      const randLast = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
      const newP = {
        id: pId,
        name: `${randFirst} ${randLast}`,
        position: pos,
        rating: rating,
        age: 20 + Math.floor(Math.random() * 9),
        nationality: clubObj.country || 'International',
        ownerClub: clubObj.name,
        askingPrice: Math.round(rating * 0.35),
        status: 'contracted',
        contract: { salary: Math.max(0.4, Math.round(rating * 0.05 * 10) / 10), years: 3 }
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
  if (s.selectedClub && (!s.incomingOffers || !s.incomingOffers.length)) {
    try { generateAiTransferApproaches(s, 2); } catch (e) {}
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
  if (!state._playerMap || state._playerMapMarketLen !== (state.market ? state.market.length : 0)) {
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
  (c.players || []).forEach(pid => {
    const p = player(s, pid);
    if (p) {
      p.ownerClub = c.name;
      p.status = 'contracted';
    }
  });
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

function simulate(s){
  const user = club(s, s.selectedClub);
  if (!user) return { error: 'Choose a club first.' };

  s.matchday = (s.matchday || 0) + 1;
  const isCup = (s.matchday % 4 === 0);
  
  let cupStage = 'FA Cup Round of 16';
  if (s.matchday === 4) cupStage = 'FA Cup Round of 16';
  else if (s.matchday === 8) cupStage = 'FA Cup Quarter-Final';
  else if (s.matchday === 12) cupStage = 'FA Cup Semi-Final';
  else if (s.matchday >= 16) cupStage = 'FA Cup Final';

  let matchResult = null;
  const otherResults = [];

  if (isCup) {
    // Domestic Knockout Cup Fixture!
    const cupPool = s.clubs.filter(c => c.name !== user.name && c.country === user.country);
    const opp = cupPool.length ? cupPool[Math.floor(Math.random() * cupPool.length)] : s.clubs.find(c => c.name !== user.name);
    if (!opp) return { error: 'No cup opponent available.' };

    matchResult = match(s, user.name, opp.name, {
      isCup: true,
      cupStage,
      competitionName: `${user.country} FA Cup · ${cupStage}`
    });

    // Simulate concurrent cup ties
    const remainingPool = cupPool.filter(c => c.name !== opp.name);
    for (let i = 0; i < Math.min(4, remainingPool.length - 1); i += 2) {
      const c1 = remainingPool[i];
      const c2 = remainingPool[i + 1];
      if (c1 && c2) {
        const res = match(s, c1.name, c2.name, {
          isCup: true,
          cupStage,
          competitionName: `${user.country} FA Cup · ${cupStage}`,
          isAiOnly: true
        });
        otherResults.push({ home: c1.name, away: c2.name, homeGoals: res.homeGoals, awayGoals: res.awayGoals, penalties: res.penalties });
      }
    }
  } else {
    // Regular League Fixture!
    const leagueClubs = s.clubs.filter(c => c.country === user.country && c.division === user.division);
    const availableOpponents = leagueClubs.filter(c => c.name !== user.name);
    if (!availableOpponents.length) return { error: 'No opponents found in division.' };

    let opp = null;
    const rivalInLeague = availableOpponents.find(c => c.name === user.rivalName);
    if (rivalInLeague && (s.matchday === 3 || s.matchday === 7 || Math.random() < 0.28)) {
      opp = rivalInLeague;
    } else {
      opp = availableOpponents[Math.floor(Math.random() * availableOpponents.length)];
    }
    const roundNumber = Math.ceil(s.matchday * 0.75);
    const compName = `${user.country} Division ${user.division} League · Matchday ${roundNumber}`;

    matchResult = match(s, user.name, opp.name, {
      isCup: false,
      competitionName: compName,
      roundNumber
    });

    // KEY FIX: Pair up ALL other clubs in the division and simulate their fixtures so AI league points update!
    const otherDivClubs = availableOpponents.filter(c => c.name !== opp.name);
    for (let i = otherDivClubs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [otherDivClubs[i], otherDivClubs[j]] = [otherDivClubs[j], otherDivClubs[i]];
    }

    for (let i = 0; i < otherDivClubs.length; i += 2) {
      if (i + 1 < otherDivClubs.length) {
        const c1 = otherDivClubs[i];
        const c2 = otherDivClubs[i + 1];
        const res = match(s, c1.name, c2.name, {
          isCup: false,
          competitionName: compName,
          roundNumber,
          isAiOnly: true
        });
        otherResults.push({ home: c1.name, away: c2.name, homeGoals: res.homeGoals, awayGoals: res.awayGoals });
      }
    }
  }

  matchResult.otherResults = otherResults;

  // Active AI approaches during season/transfer window:
  if (s.transferWindowOpen && Math.random() < 0.45) {
    try {
      generateAiTransferApproaches(s, 1);
    } catch (err) {
      console.warn('[WorldEngine] AI approach generation error:', err.message);
    }
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

  // Generate exciting AI transfer approaches for user players as transfer window opens!
  generateAiTransferApproaches(s, 2);

  addNews(s, `Season ${s.season} begins. Summer Transfer Window is OPEN. Other clubs are scouting your squad for transfer approaches!`, 'season');
  persist();
  return { season: s.season, verdict: s.lastSeasonVerdict, awards: seasonAwards, globalTournament: s.globalTournament };
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
    globalTournament: s.globalTournament || null
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

function roomsList(){return [...worldRooms.values()].map(s=>({code:s.roomCode,name:s.roomName,count:Object.values(s.humans||{}).filter(x=>x.online).length,max:s.maxHumans,host:s.host}));}
module.exports={worldRooms,soloWorlds,createRoom,createSolo,getWorld,joinRoom,leaveRoom,createClub,chooseClub,hiringManager:hireManager,hireManager,managerRecommendations,managerMeeting,setExpectation,startBattle,intervene,completeBattle,loan,releasePlayer,sellPlayer,updatePlayerSalary,simulate,advanceSeason,updateEconomy,updateJersey,launchJersey,sponsorshipOffers,signSponsor,createCustomPlayer,dispatchScout,negotiateTransfer,calculateClubBudget,recordTransaction,setupClubRivalries,globalState,roomsList,persist,upgradeLegacyWorld,generateSeasonAwards,initiateGlobalTournament,simulateGlobalTournamentRound,generateAiTransferApproaches,respondToIncomingOffer};
