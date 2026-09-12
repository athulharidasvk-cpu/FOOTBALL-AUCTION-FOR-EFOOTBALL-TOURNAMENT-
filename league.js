// league.js - Multi-division League, Fixtures, Simulation & Promotion/Relegation

let ALL_PLAYERS = [];
try {
  ALL_PLAYERS = require("./public/players.js");
} catch (e) {
  ALL_PLAYERS = [];
}

const INITIAL_CLUBS = {
  1: [
    { name: "Real Madrid", rating: 89, logo: "👑", isAi: true },
    { name: "Manchester City", rating: 88, logo: "🏙️", isAi: true },
    { name: "Bayern Munich", rating: 87, logo: "🔴", isAi: true },
    { name: "Arsenal", rating: 86, logo: "🔴", isAi: true },
    { name: "Paris Saint-Germain", rating: 86, logo: "🗼", isAi: true },
    { name: "Liverpool", rating: 87, logo: "🔴", isAi: true }
  ],
  2: [
    { name: "Borussia Dortmund", rating: 83, logo: "🟡", isAi: true },
    { name: "Atletico Madrid", rating: 83, logo: "⚪", isAi: true },
    { name: "Juventus", rating: 82, logo: "🦓", isAi: true },
    { name: "AC Milan", rating: 82, logo: "🔴", isAi: true },
    { name: "Napoli", rating: 81, logo: "🔵", isAi: true },
    { name: "Bayer Leverkusen", rating: 83, logo: "🦁", isAi: true }
  ],
  3: [
    { name: "Ajax", rating: 79, logo: "⚔️", isAi: true },
    { name: "Benfica", rating: 79, logo: "🦅", isAi: true },
    { name: "Sporting CP", rating: 78, logo: "🦁", isAi: true },
    { name: "FC Porto", rating: 78, logo: "🐉", isAi: true },
    { name: "Marseille", rating: 77, logo: "⚪", isAi: true },
    { name: "Aston Villa", rating: 79, logo: "🦁", isAi: true }
  ]
};

// =====================================================
// ARCH RIVALRIES (DERBIES)
// =====================================================

const RIVALRIES = [
  { teams: ["Real Madrid", "Atletico Madrid"], derby: "El Derbi Madrileño", desc: "Madrid Grudge Derby", chant: "¡Hala Madrid vs Aúpa Atleti!", intensity: "Extreme" },
  { teams: ["Real Madrid", "Manchester City"], derby: "European Super-Clash", desc: "Champions of Europe Showdown", chant: "Tactical masterclass vs Royal pedigree!", intensity: "Maximum" },
  { teams: ["Manchester City", "Liverpool"], derby: "The Premier Titan Derby", desc: "Modern English Championship Duel", chant: "Heavyweight Premier League clash!", intensity: "Maximum" },
  { teams: ["Arsenal", "Manchester City"], derby: "Premier League Title Rivalry", desc: "Arteta vs Guardiola Masterclass", chant: "Title clash at boiling point!", intensity: "High" },
  { teams: ["Arsenal", "Liverpool"], derby: "North vs Merseyside", desc: "Classic English Football Duel", chant: "Historic heavyweight battle!", intensity: "High" },
  { teams: ["Bayern Munich", "Borussia Dortmund"], derby: "Der Klassiker", desc: "Germany's Biggest Football Rivalry", chant: "Mia San Mia vs Echte Liebe!", intensity: "Extreme" },
  { teams: ["AC Milan", "Juventus"], derby: "Derby dei Campioni", desc: "Italy's Most Decorated Giants", chant: "San Siro vs Allianz Stadium prestige!", intensity: "Extreme" },
  { teams: ["Juventus", "Napoli"], derby: "Derby del Sole", desc: "North vs South Italian Grudge Clash", chant: "Fierce Italian passion & hostility!", intensity: "High" },
  { teams: ["Bayer Leverkusen", "Bayern Munich"], derby: "Deutscher Meister Clash", desc: "Invincibles vs Bavarian Hegemony", chant: "Battle for German supremacy!", intensity: "High" },
  { teams: ["Benfica", "Sporting CP"], derby: "Derby de Lisboa", desc: "The Eternal Lisbon Derby", chant: "Lisbon split in two!", intensity: "Extreme" },
  { teams: ["FC Porto", "Benfica"], derby: "O Clássico", desc: "Portugal's Heated Clash of Pride", chant: "Dragões vs Águias!", intensity: "Extreme" },
  { teams: ["Paris Saint-Germain", "Marseille"], derby: "Le Classique", desc: "France's Fiercest Football Derby", chant: "Capital money vs South Coast pride!", intensity: "Extreme" },
  { teams: ["Ajax", "Benfica"], derby: "European Legacy Derby", desc: "Historic European Cup Winners", chant: "Total Football vs Lisbon Pride!", intensity: "High" },
  { teams: ["Aston Villa", "Arsenal"], derby: "English Heritage Rivalry", desc: "Top Four European Qualification Duel", chant: "Villa Park vs Emirates intensity!", intensity: "High" },
  { teams: ["Borussia Dortmund", "Bayer Leverkusen"], derby: "Ruhr-Rhineland Duel", desc: "High-Octane Attacking Thriller", chant: "Aggressive, fast attacking football!", intensity: "High" }
];

// Realistic superstar players for AI clubs
const AI_STARS = {
  "Real Madrid": ["Vinícius Jr.", "Kylian Mbappé", "Jude Bellingham", "Rodrygo", "Luka Modrić", "Federico Valverde"],
  "Manchester City": ["Erling Haaland", "Kevin De Bruyne", "Phil Foden", "Bernardo Silva", "Rodri", "Jérémy Doku"],
  "Bayern Munich": ["Harry Kane", "Jamal Musiala", "Leroy Sané", "Thomas Müller", "Serge Gnabry", "Michael Olise"],
  "Arsenal": ["Bukayo Saka", "Martin Ødegaard", "Gabriel Martinelli", "Kai Havertz", "Declan Rice", "Leandro Trossard"],
  "Paris Saint-Germain": ["Ousmane Dembélé", "Bradley Barcola", "Vitinha", "Gonçalo Ramos", "Marco Asensio", "Achraf Hakimi"],
  "Liverpool": ["Mohamed Salah", "Luis Díaz", "Darwin Núñez", "Diogo Jota", "Dominik Szoboszlai", "Cody Gakpo"],
  "Borussia Dortmund": ["Serhou Guirassy", "Julian Brandt", "Donyell Malen", "Karim Adeyemi", "Marcel Sabitzer", "Jamie Gittens"],
  "Atletico Madrid": ["Antoine Griezmann", "Julián Álvarez", "Alexander Sørloth", "Rodrigo De Paul", "Ángel Correa"],
  "Juventus": ["Dušan Vlahović", "Kenan Yıldız", "Teun Koopmeiners", "Federico Chiesa", "Manuel Locatelli"],
  "AC Milan": ["Rafael Leão", "Álvaro Morata", "Christian Pulisic", "Theo Hernández", "Ruben Loftus-Cheek"],
  "Napoli": ["Khvicha Kvaratskhelia", "Romelu Lukaku", "Matteo Politano", "Giacomo Raspadori", "Frank Anguissa"],
  "Bayer Leverkusen": ["Florian Wirtz", "Victor Boniface", "Jeremie Frimpong", "Álex Grimaldo", "Patrik Schick"],
  "Ajax": ["Brian Brobbey", "Steven Berghuis", "Mika Godts", "Kenneth Taylor", "Chuba Akpom"],
  "Benfica": ["Ángel Di María", "Vangelis Pavlidis", "Orkun Kökçü", "Fredrik Aursnes", "Kerem Aktürkoğlu"],
  "Sporting CP": ["Viktor Gyökeres", "Francisco Trincão", "Pedro Gonçalves", "Morten Hjulmand", "Geovany Quenda"],
  "FC Porto": ["Wenderson Galeno", "Evanilson", "Pepê", "Nico González", "Francisco Conceição"],
  "Marseille": ["Mason Greenwood", "Elye Wahi", "Amine Harit", "Pierre-Emile Højbjerg", "Adrien Rabiot"],
  "Aston Villa": ["Ollie Watkins", "Leon Bailey", "Morgan Rogers", "John McGinn", "Jhon Durán"]
};

// =====================================================
// AUTHENTIC STADIUMS DATABASE
// =====================================================
const STADIUM_DATABASE = {
  "Real Madrid": { name: "Santiago Bernabéu", capacity: 84700, condition: 97, pitchType: "Hybrid Desso Grass", facilitiesLevel: 5, ticketPrice: 75, renovationsCount: 0 },
  "Manchester City": { name: "Etihad Stadium", capacity: 53400, condition: 96, pitchType: "Reinforced Hybrid Turf", facilitiesLevel: 5, ticketPrice: 70, renovationsCount: 0 },
  "Bayern Munich": { name: "Allianz Arena", capacity: 75000, condition: 98, pitchType: "Hybrid Desso Grass", facilitiesLevel: 5, ticketPrice: 70, renovationsCount: 0 },
  "Arsenal": { name: "Emirates Stadium", capacity: 60700, condition: 95, pitchType: "Reinforced Natural Turf", facilitiesLevel: 4, ticketPrice: 75, renovationsCount: 0 },
  "Paris Saint-Germain": { name: "Parc des Princes", capacity: 48580, condition: 94, pitchType: "Hybrid Desso Grass", facilitiesLevel: 4, ticketPrice: 70, renovationsCount: 0 },
  "Liverpool": { name: "Anfield", capacity: 61270, condition: 93, pitchType: "Reinforced Natural Turf", facilitiesLevel: 4, ticketPrice: 68, renovationsCount: 0 },
  "Borussia Dortmund": { name: "Signal Iduna Park", capacity: 81365, condition: 92, pitchType: "Natural Meadow Grass", facilitiesLevel: 4, ticketPrice: 55, renovationsCount: 0 },
  "Atletico Madrid": { name: "Cívitas Metropolitano", capacity: 70460, condition: 95, pitchType: "Hybrid Desso Grass", facilitiesLevel: 4, ticketPrice: 60, renovationsCount: 0 },
  "Juventus": { name: "Allianz Stadium", capacity: 41500, condition: 94, pitchType: "Hybrid Desso Grass", facilitiesLevel: 4, ticketPrice: 65, renovationsCount: 0 },
  "AC Milan": { name: "San Siro", capacity: 75800, condition: 88, pitchType: "Natural Grass", facilitiesLevel: 3, ticketPrice: 60, renovationsCount: 0 },
  "Napoli": { name: "Stadio Diego Armando Maradona", capacity: 54720, condition: 86, pitchType: "Natural Grass", facilitiesLevel: 3, ticketPrice: 55, renovationsCount: 0 },
  "Bayer Leverkusen": { name: "BayArena", capacity: 30210, condition: 94, pitchType: "Reinforced Hybrid Turf", facilitiesLevel: 4, ticketPrice: 50, renovationsCount: 0 },
  "Ajax": { name: "Johan Cruyff Arena", capacity: 55865, condition: 93, pitchType: "Hybrid Desso Grass", facilitiesLevel: 4, ticketPrice: 48, renovationsCount: 0 },
  "Benfica": { name: "Estádio da Luz", capacity: 64640, condition: 92, pitchType: "Natural Grass", facilitiesLevel: 3, ticketPrice: 45, renovationsCount: 0 },
  "Sporting CP": { name: "Estádio José Alvalade", capacity: 50095, condition: 91, pitchType: "Natural Grass", facilitiesLevel: 3, ticketPrice: 45, renovationsCount: 0 },
  "FC Porto": { name: "Estádio do Dragão", capacity: 50033, condition: 90, pitchType: "Natural Grass", facilitiesLevel: 3, ticketPrice: 45, renovationsCount: 0 },
  "Marseille": { name: "Orange Vélodrome", capacity: 67390, condition: 90, pitchType: "Natural Grass", facilitiesLevel: 3, ticketPrice: 48, renovationsCount: 0 },
  "Aston Villa": { name: "Villa Park", capacity: 42680, condition: 89, pitchType: "Natural Grass", facilitiesLevel: 3, ticketPrice: 52, renovationsCount: 0 }
};

// =====================================================
// MANAGERS DATABASE
// =====================================================
const CLUB_MANAGERS = {
  "Real Madrid": { name: "Carlo Ancelotti", avatar: "🇮🇹", tactic: "Fluid Decisive Counters", formation: "4-3-3", boardConfidence: 94, jobStatus: "Untouchable", perk: { name: "Galáctico Composure", effect: "+15% Big Match Finishing" }, salary: 12 },
  "Manchester City": { name: "Pep Guardiola", avatar: "🇪🇸", tactic: "Tiki-Taka Positional Play", formation: "3-2-4-1", boardConfidence: 96, jobStatus: "Untouchable", perk: { name: "Positional Mastery", effect: "+18% Ball Retention & Control" }, salary: 16 },
  "Bayern Munich": { name: "Vincent Kompany", avatar: "🇧🇪", tactic: "Aggressive High-Line Press", formation: "4-2-3-1", boardConfidence: 86, jobStatus: "Secure", perk: { name: "Bavarian Dominance", effect: "+12% Physical Stamina & Pressing" }, salary: 9 },
  "Arsenal": { name: "Mikel Arteta", avatar: "🇪🇸", tactic: "Inverted Fullback Overload", formation: "4-3-3", boardConfidence: 90, jobStatus: "Untouchable", perk: { name: "Set-Piece Mastery", effect: "+20% Corner & Free Kick Danger" }, salary: 10 },
  "Paris Saint-Germain": { name: "Luis Enrique", avatar: "🇪🇸", tactic: "Vertical Possession Attack", formation: "4-3-3", boardConfidence: 85, jobStatus: "Secure", perk: { name: "Vertical Overload", effect: "+14% Through-Ball Penetration" }, salary: 11 },
  "Liverpool": { name: "Arne Slot", avatar: "🇳🇱", tactic: "High-Octane Direct Transition", formation: "4-2-3-1", boardConfidence: 92, jobStatus: "Untouchable", perk: { name: "Heavy-Metal Gegenpress", effect: "+15% Turnover Recovery Speed" }, salary: 10 },
  "Borussia Dortmund": { name: "Nuri Şahin", avatar: "🇹🇷", tactic: "Direct Attacking Flanks", formation: "4-2-3-1", boardConfidence: 80, jobStatus: "Secure", perk: { name: "Yellow Wall Passion", effect: "+15% Home Fan Roar Energy" }, salary: 7 },
  "Atletico Madrid": { name: "Diego Simeone", avatar: "🇦🇷", tactic: "Uncompromising Low Block", formation: "5-3-2", boardConfidence: 93, jobStatus: "Untouchable", perk: { name: "Cholismo Grit", effect: "+25% Defensive Clean Sheets" }, salary: 14 },
  "Juventus": { name: "Thiago Motta", avatar: "🇮🇹", tactic: "Dynamic Total Football", formation: "4-1-4-1", boardConfidence: 82, jobStatus: "Secure", perk: { name: "Dynamic Fluidity", effect: "+12% Passing Interchange" }, salary: 8 },
  "AC Milan": { name: "Paulo Fonseca", avatar: "🇵🇹", tactic: "Attacking Wide Transitions", formation: "4-2-3-1", boardConfidence: 76, jobStatus: "Under Pressure", perk: { name: "Wide Cross Accuracy", effect: "+10% Aerial Box Threat" }, salary: 7 },
  "Napoli": { name: "Antonio Conte", avatar: "🇮🇹", tactic: "Wingback High-Intensity Press", formation: "3-5-2", boardConfidence: 88, jobStatus: "Secure", perk: { name: "Relentless Work Rate", effect: "+18% Second-Half Pressure" }, salary: 11 },
  "Bayer Leverkusen": { name: "Xabi Alonso", avatar: "🇪🇸", tactic: "Invincible Wingback Flow", formation: "3-4-2-1", boardConfidence: 95, jobStatus: "Untouchable", perk: { name: "Neverkusen Magic", effect: "+25% 90+ Minute Equalizers" }, salary: 10 },
  "Ajax": { name: "Francesco Farioli", avatar: "🇮🇹", tactic: "Calculated Build-Up", formation: "4-3-3", boardConfidence: 80, jobStatus: "Secure", perk: { name: "De Toekomst Academy", effect: "+20% Wonderkid Form Boost" }, salary: 6 },
  "Benfica": { name: "Bruno Lage", avatar: "🇵🇹", tactic: "Direct Attacking Penetration", formation: "4-4-2", boardConfidence: 78, jobStatus: "Secure", perk: { name: "Luz Eagle Strike", effect: "+12% Box Finishing Rate" }, salary: 6 },
  "Sporting CP": { name: "Rúben Amorim", avatar: "🇵🇹", tactic: "Aggressive 3-Man Press", formation: "3-4-3", boardConfidence: 92, jobStatus: "Untouchable", perk: { name: "Leão Ferocity", effect: "+18% Striker Scoring Conversion" }, salary: 8 },
  "FC Porto": { name: "Vítor Bruno", avatar: "🇵🇹", tactic: "Physical High-Block", formation: "4-2-3-1", boardConfidence: 80, jobStatus: "Secure", perk: { name: "Dragão Intimidation", effect: "+15% Tackle Win Rate" }, salary: 6 },
  "Marseille": { name: "Roberto De Zerbi", avatar: "🇮🇹", tactic: "DeZerbi-Ball Bait & Sprint", formation: "4-2-3-1", boardConfidence: 82, jobStatus: "Secure", perk: { name: "Press-Resistant Flare", effect: "+16% Quick Breakaway Goals" }, salary: 8 },
  "Aston Villa": { name: "Unai Emery", avatar: "🇪🇸", tactic: "Precision Offside Trap", formation: "4-4-2", boardConfidence: 91, jobStatus: "Untouchable", perk: { name: "European Masterclass", effect: "+18% Big Opponent Upset Chance" }, salary: 9 }
};

// =====================================================
// AVAILABLE FREE-AGENT MANAGERS MARKET
// =====================================================
const FREE_AGENT_MANAGERS = [
  { id: "klopp", name: "Jürgen Klopp", avatar: "🇩🇪", tactic: "Gegenpressing Heavy-Metal", formation: "4-3-3", wage: 14, rep: "World Class", perk: { name: "Heavy-Metal Roar", effect: "+22% Gegenpressing & +15% Fan Roar" }, desc: "Electrifying German tactician known for relentless pressing and inspiring players to die for the badge." },
  { id: "zidane", name: "Zinedine Zidane", avatar: "🇫🇷", tactic: "Galáctico Pragmatism & Freedom", formation: "4-3-3", wage: 15, rep: "Legendary", perk: { name: "Champions Aura", effect: "+25% Derby & Title Decider Win Bonus" }, desc: "3x consecutive Champions League champion who extracts transcendent form from superstar talents." },
  { id: "tuchel", name: "Thomas Tuchel", avatar: "🇩🇪", tactic: "Surgical Positional Structure", formation: "3-4-2-1", wage: 12, rep: "Tactical Elite", perk: { name: "Ironclad Fortress", effect: "+20% Defensive Clean Sheets" }, desc: "Detail-obsessed tactician adept at completely nullifying high-powered attacking opponents." },
  { id: "mourinho", name: "José Mourinho", avatar: "🇵🇹", tactic: "Special One Low Block & Counter", formation: "4-2-3-1", wage: 11, rep: "Serial Winner", perk: { name: "Siege Mentality", effect: "+25% Lethal Counter-Attack & Spite" }, desc: "The Special One transforms squads into ruthless defensive gladiators who punish every opponent error." },
  { id: "pochettino", name: "Mauricio Pochettino", avatar: "🇦🇷", tactic: "High-Energy Press & Youth Cultivation", formation: "4-2-3-1", wage: 10, rep: "Development Elite", perk: { name: "Youth Catalyst", effect: "+18% Wonderkid Growth & +10% Energy" }, desc: "Fosters intense pressing regimes and unlocks peak potential from rising young talents." },
  { id: "flick", name: "Hansi Flick", avatar: "🇩🇪", tactic: "Sextuple Blitzkrieg Overload", formation: "4-2-3-1", wage: 13, rep: "Attacking Mastermind", perk: { name: "High-Line Overwhelm", effect: "+22% Expected Goals & Rapid Attacks" }, desc: "Plays breathtaking, relentless forward-pressing football that overwhelms opposition defenses." },
  { id: "allegri", name: "Massimiliano Allegri", avatar: "🇮🇹", tactic: "Corto Muso Tactical Realism", formation: "3-5-2", wage: 9, rep: "Pragmatic Winner", perk: { name: "Corto Muso", effect: "+20% 1-0 Narrow Lead Preservation" }, desc: "Master of game management who values ruthless tactical discipline and low-risk defensive perfection." },
  { id: "southgate", name: "Gareth Southgate", avatar: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", tactic: "Composed Tournament Solidarity", formation: "4-3-3", wage: 8, rep: "Diplomatic Leader", perk: { name: "Squad Unity", effect: "+15% Morale Recovery & Harmony" }, desc: "Cultivates unbreakable dressing room harmony and solid defensive tournament structures." }
];

class LeagueManager {
  constructor(initialSeason = 1) {
    this.season = initialSeason;
    this.totalRounds = 10;
    this.currentRound = 1;
    this.isSeasonComplete = false;
    this.divisions = {};
    this.recentResults = [];
    this.lastSeasonSummary = null;

    this.stadiums = {};
    this.managers = {};
    this.finances = {};
    this.seasonAims = {};
    this.scoutReports = {};
    this.freeAgentManagers = [...FREE_AGENT_MANAGERS];

    this.initSeason(this.season, INITIAL_CLUBS);
  }

  // Initialize a new season with clubs
  initSeason(seasonNumber, divisionClubs) {
    this.season = seasonNumber;
    this.currentRound = 1;
    this.isSeasonComplete = false;
    this.recentResults = [];

    this.divisions = {
      1: {
        id: 1,
        name: "Division 1",
        shortName: "Div 1",
        tier: 1,
        relegationSlots: 2,
        promotionSlots: 0,
        clubs: JSON.parse(JSON.stringify(divisionClubs[1])),
        standings: [],
        fixtures: []
      },
      2: {
        id: 2,
        name: "Division 2",
        shortName: "Div 2",
        tier: 2,
        relegationSlots: 2,
        promotionSlots: 2,
        clubs: JSON.parse(JSON.stringify(divisionClubs[2])),
        standings: [],
        fixtures: []
      },
      3: {
        id: 3,
        name: "Division 3",
        shortName: "Div 3",
        tier: 3,
        relegationSlots: 0,
        promotionSlots: 2,
        clubs: JSON.parse(JSON.stringify(divisionClubs[3])),
        standings: [],
        fixtures: []
      }
    };

    // Initialize standings & fixtures for each division
    for (const divId of [1, 2, 3]) {
      const div = this.divisions[divId];
      div.standings = div.clubs.map(club => ({
        name: club.name,
        logo: club.logo || "⚽",
        rating: club.rating,
        isAi: club.isAi !== false,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 0,
        form: []
      }));

      div.fixtures = this.generateDoubleRoundRobin(div.clubs.map(c => c.name), divId);

      // Initialize club extras (stadium, manager, finances, season aims)
      for (const club of div.clubs) {
        this.initClubExtras(club.name, divId, club.rating);
      }
    }
  }

  // Initialize extra dimensions for a club: stadium, manager, finances, and season aims
  initClubExtras(clubName, divisionId = 1, rating = 80) {
    if (!this.stadiums[clubName]) {
      const baseStad = STADIUM_DATABASE[clubName];
      this.stadiums[clubName] = baseStad ? { ...baseStad } : {
        name: `${clubName} Arena`,
        capacity: 52000,
        condition: 92,
        pitchType: "Hybrid Desso Grass",
        facilitiesLevel: 3,
        ticketPrice: 60,
        renovationsCount: 0
      };
    }

    if (!this.managers[clubName]) {
      const baseMgr = CLUB_MANAGERS[clubName];
      this.managers[clubName] = baseMgr ? {
        ...baseMgr,
        boardConfidence: baseMgr.boardConfidence || 85,
        isUnderperforming: false
      } : {
        name: "Pep Guardiola",
        avatar: "🧑‍💼",
        tactic: "Fluid Possession & High Press",
        formation: "4-3-3",
        boardConfidence: 85,
        jobStatus: "Secure",
        perk: { name: "Tactical Acumen", effect: "+15% Tactical Balance & Control" },
        salary: 10,
        isUnderperforming: false
      };
    }

    if (!this.finances[clubName]) {
      this.finances[clubName] = {
        matchdayRevenue: 0,
        merchandiseRevenue: 0,
        tvRevenue: 0,
        totalRevenue: 0,
        squadWages: 0,
        maintenanceCosts: 0,
        netProfit: 0,
        jerseysSold: 0,
        topSellingJersey: AI_STARS[clubName]?.[0] || "Club Star"
      };
    }

    if (!this.seasonAims[clubName]) {
      let targetPos = 1;
      let targetName = "Win Division 1 Title 🏆";
      let minRevenue = 45;
      let desc = "The Board demands the Division 1 championship.";

      if (divisionId === 1) {
        if (rating >= 88) {
          targetPos = 1;
          targetName = "Win the Division 1 Title 🏆";
          minRevenue = 50;
          desc = "The Board expects to lift the Division 1 trophy this season.";
        } else if (rating >= 85) {
          targetPos = 3;
          targetName = "Champions League Top 3 ⭐";
          minRevenue = 40;
          desc = "Secure a European elite top 3 finish.";
        } else {
          targetPos = 4;
          targetName = "Avoid Relegation / Retain Tier 1 🛡️";
          minRevenue = 30;
          desc = "Fight to stay clear of the bottom 2 relegation zone.";
        }
      } else if (divisionId === 2) {
        if (rating >= 82) {
          targetPos = 2;
          targetName = "Promotion to Division 1 🚀";
          minRevenue = 25;
          desc = "Secure automatic promotion to Division 1.";
        } else {
          targetPos = 4;
          targetName = "Mid-Table Stability 🛡️";
          minRevenue = 20;
          desc = "Establish solid mid-table stability and avoid relegation.";
        }
      } else {
        targetPos = 2;
        targetName = "Promotion to Division 2 🚀";
        minRevenue = 15;
        desc = "Earn promotion to climb the league pyramid.";
      }

      this.seasonAims[clubName] = {
        targetPos,
        targetName,
        minRevenue,
        desc,
        boardSatisfaction: "Delighted 🌟",
        boardWarning: false
      };
    }
  }

  // Generates 10 rounds of double round-robin fixtures for 6 teams using circle method
  generateDoubleRoundRobin(teamNames, divisionId) {
    const teams = [...teamNames];
    const n = teams.length; // 6
    const rounds = [];
    const numRounds = (n - 1) * 2; // 10 rounds

    // First half (rounds 1 to 5)
    for (let r = 0; r < n - 1; r++) {
      const roundFixtures = [];
      for (let i = 0; i < n / 2; i++) {
        const homeIdx = (r + i) % (n - 1);
        let awayIdx = (n - 1 - i + r) % (n - 1);
        if (i === 0) {
          awayIdx = n - 1;
        }

        // Alternate home/away for the pivot team
        const homeTeam = (r % 2 === 1 && i === 0) ? teams[awayIdx] : teams[homeIdx];
        const awayTeam = (r % 2 === 1 && i === 0) ? teams[homeIdx] : teams[awayIdx];

        const fixture = {
          id: `d${divisionId}_r${r + 1}_m${i + 1}`,
          division: divisionId,
          round: r + 1,
          homeTeam,
          awayTeam,
          homeScore: null,
          awayScore: null,
          played: false,
          scorers: []
        };
        this.enrichFixtureRivalry(fixture);
        roundFixtures.push(fixture);
      }
      rounds.push(roundFixtures);
    }

    // Second half (rounds 6 to 10): exact reversed home/away matches
    for (let r = 0; r < n - 1; r++) {
      const roundFixtures = [];
      const firstLeg = rounds[r];
      for (let i = 0; i < firstLeg.length; i++) {
        const firstMatch = firstLeg[i];
        const fixture = {
          id: `d${divisionId}_r${r + n}_m${i + 1}`,
          division: divisionId,
          round: r + n,
          homeTeam: firstMatch.awayTeam,
          awayTeam: firstMatch.homeTeam,
          homeScore: null,
          awayScore: null,
          played: false,
          scorers: []
        };
        this.enrichFixtureRivalry(fixture);
        roundFixtures.push(fixture);
      }
      rounds.push(roundFixtures);
    }

    // Flatten to single array
    return rounds.flat();
  }

  // Get rivalry info between two teams
  getRivalryInfo(teamA, teamB) {
    if (!teamA || !teamB) return null;
    const nameA = teamA.trim().toLowerCase();
    const nameB = teamB.trim().toLowerCase();

    for (const r of RIVALRIES) {
      const rA = r.teams[0].toLowerCase();
      const rB = r.teams[1].toLowerCase();
      if ((rA === nameA && rB === nameB) || (rA === nameB && rB === nameA)) {
        return {
          isRivalry: true,
          derbyName: r.derby,
          derbyDesc: r.desc,
          derbyChant: r.chant,
          intensity: r.intensity
        };
      }
    }

    return null;
  }

  // Tag fixture with rivalry status
  enrichFixtureRivalry(fixture) {
    const rivalry = this.getRivalryInfo(fixture.homeTeam, fixture.awayTeam);
    if (rivalry) {
      fixture.isRivalry = true;
      fixture.derbyName = rivalry.derbyName;
      fixture.derbyDesc = rivalry.derbyDesc;
      fixture.derbyChant = rivalry.derbyChant;
      fixture.intensity = rivalry.intensity;
    } else {
      fixture.isRivalry = false;
      fixture.derbyName = null;
      fixture.derbyDesc = null;
      fixture.derbyChant = null;
      fixture.intensity = null;
    }
    return fixture;
  }

  // Calculate rating for any club (User squad or AI base)
  getClubRating(clubName, roomTeams = {}) {
    const userTeam = roomTeams[clubName];
    if (userTeam) {
      const players = Array.isArray(userTeam.players) ? userTeam.players : [];
      if (players.length === 0) {
        return 75; // Default base rating for user club before auction signings
      }

      // Sort players by rating descending
      const sorted = [...players].map(p => Number(p.rating) || 75).sort((a, b) => b - a);
      const top11 = sorted.slice(0, 11);
      // If fewer than 11 players, fill remaining with 72-rated squad players
      while (top11.length < 11) {
        top11.push(72);
      }

      const avg = Math.round(top11.reduce((sum, r) => sum + r, 0) / 11);
      const depthBonus = players.length >= 11 ? 1 : 0;
      return Math.min(99, Math.max(60, avg + depthBonus));
    }

    // Find AI club base rating in divisions
    for (const divId of [1, 2, 3]) {
      const found = this.divisions[divId].clubs.find(c => c.name.toLowerCase() === clubName.toLowerCase());
      if (found) return found.rating;
    }

    return 78;
  }

  // Synchronize user clubs from room.teams into the league
  syncUserClubs(roomTeams = {}) {
    if (!roomTeams) return;

    const userTeamNames = Object.keys(roomTeams);
    for (const teamName of userTeamNames) {
      let isAlreadyInDivision = false;
      let existingDivId = null;

      for (const divId of [1, 2, 3]) {
        const idx = this.divisions[divId].clubs.findIndex(c => c.name.toLowerCase() === teamName.toLowerCase());
        if (idx !== -1) {
          isAlreadyInDivision = true;
          existingDivId = divId;
          const club = this.divisions[divId].clubs[idx];
          club.isAi = false;
          club.rating = this.getClubRating(teamName, roomTeams);
          club.logo = "👤";

          // Also update in standings
          const standing = this.divisions[divId].standings.find(s => s.name.toLowerCase() === teamName.toLowerCase());
          if (standing) {
            standing.isAi = false;
            standing.rating = club.rating;
            standing.logo = "👤";
          }
          break;
        }
      }

      // If this is a new custom user club not already in any division,
      // place it into Division 1 by converting or swapping with the lowest rated AI club in Div 1
      if (!isAlreadyInDivision) {
        const div1 = this.divisions[1];
        // Find an AI club to replace in Division 1
        const aiClubIdx = div1.clubs.findIndex(c => c.isAi);
        if (aiClubIdx !== -1) {
          const replacedClub = div1.clubs[aiClubIdx];
          const oldName = replacedClub.name;

          // Replace club data
          div1.clubs[aiClubIdx] = {
            name: teamName,
            rating: this.getClubRating(teamName, roomTeams),
            logo: "👤",
            isAi: false
          };

          // Update standings
          const standingIdx = div1.standings.findIndex(s => s.name === oldName);
          if (standingIdx !== -1) {
            div1.standings[standingIdx].name = teamName;
            div1.standings[standingIdx].rating = div1.clubs[aiClubIdx].rating;
            div1.standings[standingIdx].logo = "👤";
            div1.standings[standingIdx].isAi = false;
          }

          // Update fixtures with new team name
          div1.fixtures.forEach(f => {
            if (f.homeTeam === oldName) f.homeTeam = teamName;
            if (f.awayTeam === oldName) f.awayTeam = teamName;
          });
        }
      }
    }

    // Refresh ratings for all standings
    for (const divId of [1, 2, 3]) {
      for (const standing of this.divisions[divId].standings) {
        standing.rating = this.getClubRating(standing.name, roomTeams);
      }
    }
  }

  // Simulate a single football match based on ratings and rivalry intensity
  simulateMatch(fixture, roomTeams = {}) {
    if (fixture.played) return fixture;

    this.enrichFixtureRivalry(fixture);

    const homeRating = this.getClubRating(fixture.homeTeam, roomTeams);
    const awayRating = this.getClubRating(fixture.awayTeam, roomTeams);

    // Home advantage: +2 rating
    const effectiveHomeRating = homeRating + 2;
    const ratingDiff = effectiveHomeRating - awayRating;

    // Expected goals based on rating differential
    // Neutral rating expected goals: ~1.5 for home, ~1.1 for away
    let expHome = 1.45 + (ratingDiff * 0.08);
    let expAway = 1.15 - (ratingDiff * 0.08);

    // Rivalry intensity boost: derby games have higher passion, open attack, and drama!
    if (fixture.isRivalry) {
      expHome += 0.25;
      expAway += 0.25;
    }

    expHome = Math.max(0.3, Math.min(4.8, expHome));
    expAway = Math.max(0.2, Math.min(4.2, expAway));

    // Goal generation using attack phases + volatility
    const sampleGoals = (exp, isDerby) => {
      let goals = 0;
      const prob = exp / 5.2;
      for (let i = 0; i < 5; i++) {
        if (Math.random() < prob) goals++;
      }
      // Derbies have a higher chance of dramatic high-scoring shootouts
      const surpriseChance = isDerby ? 0.28 : 0.15;
      if (Math.random() < surpriseChance && goals < 6) goals++;
      return goals;
    };

    const homeScore = sampleGoals(expHome, fixture.isRivalry);
    const awayScore = sampleGoals(expAway, fixture.isRivalry);

    // Goal scorers generation with realistic superstars
    const scorers = [];
    const getScorersForTeam = (teamName, score) => {
      const userTeam = roomTeams[teamName];
      const squad = userTeam?.players || [];
      const attackers = squad.filter(p => ["CF", "ST", "LW", "RW", "LWF", "RWF", "AMF", "SS"].includes(p.position));
      const pool = attackers.length > 0 ? attackers : squad;

      const aiStarPool = AI_STARS[teamName] || [];

      for (let g = 0; g < score; g++) {
        let minute = Math.floor(Math.random() * 88) + 2;
        // In rivalries, 25% chance of stoppage time winner/equalizer!
        if (fixture.isRivalry && Math.random() < 0.25 && g === score - 1) {
          const extra = Math.floor(Math.random() * 4) + 1;
          minute = `90+${extra}`;
        }

        let scorerName;
        if (pool.length > 0) {
          // User club player
          scorerName = pool[Math.floor(Math.random() * pool.length)].name;
        } else if (aiStarPool.length > 0) {
          // Authentic AI superstar
          scorerName = aiStarPool[Math.floor(Math.random() * aiStarPool.length)];
        } else {
          // Fallback
          const genericScorers = ["Star Striker", "Winger", "Midfielder", "Number 9", "Captain"];
          scorerName = `${teamName} ${genericScorers[Math.floor(Math.random() * genericScorers.length)]}`;
        }
        scorers.push({ team: teamName, scorer: scorerName, minute });
      }
    };

    getScorersForTeam(fixture.homeTeam, homeScore);
    getScorersForTeam(fixture.awayTeam, awayScore);
    scorers.sort((a, b) => {
      const minA = typeof a.minute === "string" ? 90 + parseInt(a.minute.replace("90+", "") || "1", 10) : a.minute;
      const minB = typeof b.minute === "string" ? 90 + parseInt(b.minute.replace("90+", "") || "1", 10) : b.minute;
      return minA - minB;
    });

    fixture.homeScore = homeScore;
    fixture.awayScore = awayScore;
    fixture.played = true;
    fixture.scorers = scorers;

    // Update standings for both clubs
    const div = this.divisions[fixture.division];
    const homeStanding = div.standings.find(s => s.name === fixture.homeTeam);
    const awayStanding = div.standings.find(s => s.name === fixture.awayTeam);

    if (homeStanding && awayStanding) {
      homeStanding.played += 1;
      awayStanding.played += 1;
      homeStanding.goalsFor += homeScore;
      homeStanding.goalsAgainst += awayScore;
      homeStanding.goalDifference = homeStanding.goalsFor - homeStanding.goalsAgainst;

      awayStanding.goalsFor += awayScore;
      awayStanding.goalsAgainst += homeScore;
      awayStanding.goalDifference = awayStanding.goalsFor - awayStanding.goalsAgainst;

      if (homeScore > awayScore) {
        homeStanding.won += 1;
        homeStanding.points += 3;
        homeStanding.form.unshift("W");

        awayStanding.lost += 1;
        awayStanding.form.unshift("L");
      } else if (homeScore === awayScore) {
        homeStanding.drawn += 1;
        homeStanding.points += 1;
        homeStanding.form.unshift("D");

        awayStanding.drawn += 1;
        awayStanding.points += 1;
        awayStanding.form.unshift("D");
      } else {
        awayStanding.won += 1;
        awayStanding.points += 3;
        awayStanding.form.unshift("W");

        homeStanding.lost += 1;
        homeStanding.form.unshift("L");
      }

      // Limit form history to 5 matches
      if (homeStanding.form.length > 5) homeStanding.form.pop();
      if (awayStanding.form.length > 5) awayStanding.form.pop();
    }

    // =====================================================
    // MATCHDAY ECONOMY, STADIUM WEAR & MERCHANDISE
    // =====================================================
    if (!this.stadiums[fixture.homeTeam]) {
      this.initClubExtras(fixture.homeTeam, fixture.division, homeRating);
    }
    const homeStad = this.stadiums[fixture.homeTeam];

    // Attendance calculation based on capacity, derby factor, and pitch health
    let attRate = 0.85;
    if (fixture.isRivalry) attRate += 0.12;
    if (homeStad.condition < 70) attRate -= 0.15;
    if (homeScore > awayScore) attRate += 0.05;
    attRate = Math.min(1.0, Math.max(0.45, attRate));

    const attendance = Math.min(homeStad.capacity, Math.floor(homeStad.capacity * attRate));

    // Match pitch condition wear
    const pitchWear = Math.floor(Math.random() * 3) + 2; // 2% to 4% wear per match
    homeStad.condition = Math.max(20, homeStad.condition - pitchWear);

    // Ticket Gate Revenue (₹ Millions)
    const ticketRevenue = Math.round(((attendance * (homeStad.ticketPrice || 60)) / 1000000) * 100) / 100;

    // Merchandise & Jersey Sales
    const baseJerseyBuyers = Math.floor(attendance * (0.10 + Math.random() * 0.10));
    const facilitiesMultiplier = 1 + ((homeStad.facilitiesLevel || 3) - 3) * 0.15;
    const starMultiplier = (homeRating >= 88) ? 1.4 : (homeRating >= 85 ? 1.2 : 1.0);
    const jerseysSold = Math.floor(baseJerseyBuyers * facilitiesMultiplier * starMultiplier);

    // Top selling shirt player
    const userTeam = roomTeams[fixture.homeTeam];
    const squad = userTeam?.players || [];
    const topJerseyPlayer = (squad.length > 0)
      ? squad.reduce((top, p) => ((p.rating || 0) > (top?.rating || 0) ? p : top), squad[0])?.name
      : (AI_STARS[fixture.homeTeam]?.[0] || `${fixture.homeTeam} Star`);

    const merchRevenue = Math.round(((jerseysSold * 1800 + attendance * 220) / 1000000) * 100) / 100;

    // Broadcast TV Rights by division
    const tvRightsByDiv = { 1: 6.0, 2: 3.5, 3: 2.0 };
    const tvRevenue = tvRightsByDiv[fixture.division] || 3.0;

    // Expenses: squad wages + stadium pitch maintenance
    const matchWages = Math.round((homeRating * 0.032) * 100) / 100;
    const maintenanceCost = 0.8;
    const totalExpenses = Math.round((matchWages + maintenanceCost) * 100) / 100;

    const netProfit = Math.round((ticketRevenue + merchRevenue + tvRevenue - totalExpenses) * 100) / 100;

    fixture.matchdayStats = {
      stadiumName: homeStad.name,
      stadiumCapacity: homeStad.capacity,
      stadiumCondition: homeStad.condition,
      attendance,
      attendancePct: Math.round((attendance / homeStad.capacity) * 100),
      ticketRevenue,
      merchRevenue,
      jerseysSold,
      topSellingJersey: topJerseyPlayer,
      tvRevenue,
      matchWages,
      maintenanceCost,
      netProfit
    };

    // Accumulate in club finances
    if (!this.finances[fixture.homeTeam]) {
      this.initClubExtras(fixture.homeTeam, fixture.division, homeRating);
    }
    const fin = this.finances[fixture.homeTeam];
    fin.matchdayRevenue = Math.round((fin.matchdayRevenue + ticketRevenue) * 100) / 100;
    fin.merchandiseRevenue = Math.round((fin.merchandiseRevenue + merchRevenue) * 100) / 100;
    fin.tvRevenue = Math.round((fin.tvRevenue + tvRevenue) * 100) / 100;
    fin.totalRevenue = Math.round((fin.totalRevenue + ticketRevenue + merchRevenue + tvRevenue) * 100) / 100;
    fin.squadWages = Math.round((fin.squadWages + matchWages) * 100) / 100;
    fin.maintenanceCosts = Math.round((fin.maintenanceCosts + maintenanceCost) * 100) / 100;
    fin.netProfit = Math.round((fin.netProfit + netProfit) * 100) / 100;
    fin.jerseysSold += jerseysSold;
    fin.topSellingJersey = topJerseyPlayer;

    // Credit net profit directly to user team budget if user club!
    if (roomTeams[fixture.homeTeam] && typeof roomTeams[fixture.homeTeam].budget === "number") {
      roomTeams[fixture.homeTeam].budget = Math.round((roomTeams[fixture.homeTeam].budget + netProfit) * 100) / 100;
    }

    // =====================================================
    // UPDATE MANAGERS' BOARD CONFIDENCE & JOB STATUS
    // =====================================================
    this.updateManagerConfidence(fixture.homeTeam, homeScore, awayScore, fixture.isRivalry, fixture.division);
    this.updateManagerConfidence(fixture.awayTeam, awayScore, homeScore, fixture.isRivalry, fixture.division);

    return fixture;
  }

  // Update board confidence and underperformance flags for a club's manager
  updateManagerConfidence(teamName, goalsFor, goalsAgainst, isDerby, divisionId) {
    if (!this.managers[teamName] || !this.seasonAims[teamName]) {
      this.initClubExtras(teamName, divisionId, 80);
    }
    const mgr = this.managers[teamName];
    const aim = this.seasonAims[teamName];
    if (!mgr || !aim) return;

    let delta = 0;
    if (goalsFor > goalsAgainst) {
      delta += 4;
      if (isDerby) delta += 3;
    } else if (goalsFor === goalsAgainst) {
      delta += 0;
    } else {
      delta -= 5;
      if (isDerby) delta -= 5;
    }

    // Check standing position vs aim targetPos
    const div = this.divisions[divisionId];
    if (div && div.standings) {
      const rank = div.standings.findIndex(s => s.name === teamName) + 1;
      if (rank > 0) {
        if (rank <= aim.targetPos) {
          delta += 2;
        } else {
          delta -= (rank - aim.targetPos) * 2;
        }
      }
    }

    mgr.boardConfidence = Math.max(10, Math.min(99, mgr.boardConfidence + delta));

    if (mgr.boardConfidence >= 88) {
      mgr.jobStatus = "Untouchable";
      mgr.isUnderperforming = false;
      aim.boardSatisfaction = "Delighted 🌟";
      aim.boardWarning = false;
    } else if (mgr.boardConfidence >= 70) {
      mgr.jobStatus = "Secure";
      mgr.isUnderperforming = false;
      aim.boardSatisfaction = "Satisfied 👍";
      aim.boardWarning = false;
    } else if (mgr.boardConfidence >= 50) {
      mgr.jobStatus = "Under Pressure";
      mgr.isUnderperforming = true;
      aim.boardSatisfaction = "Anxious ⚠️";
      aim.boardWarning = true;
    } else if (mgr.boardConfidence >= 30) {
      mgr.jobStatus = "In Danger";
      mgr.isUnderperforming = true;
      aim.boardSatisfaction = "Crisis / Ultimatum 🚨";
      aim.boardWarning = true;
    } else {
      mgr.jobStatus = "Sacking Imminent";
      mgr.isUnderperforming = true;
      aim.boardSatisfaction = "Termination Review ⛔";
      aim.boardWarning = true;
    }
  }

  // Pitch repair & renovation (costs ₹5M)
  repairPitch(clubName, roomTeams = {}) {
    if (!this.stadiums[clubName]) this.initClubExtras(clubName, 1, 80);
    const stad = this.stadiums[clubName];
    const cost = 5.0;

    const userTeam = roomTeams[clubName];
    if (userTeam) {
      if ((userTeam.budget || 0) < cost) {
        return { error: `Insufficient funds. Pitch renovation costs ₹${cost}M.` };
      }
      userTeam.budget = Math.round((userTeam.budget - cost) * 100) / 100;
    }

    stad.condition = 100;
    stad.pitchType = "Pristine Hybrid Desso Grass";
    stad.renovationsCount = (stad.renovationsCount || 0) + 1;

    return {
      success: true,
      message: `Pitch renovated at ${stad.name} to 100% pristine condition!`,
      stadium: stad,
      budget: userTeam?.budget
    };
  }

  // Stadium seating expansion (+5,000 capacity, costs ₹15M)
  expandStadium(clubName, roomTeams = {}) {
    if (!this.stadiums[clubName]) this.initClubExtras(clubName, 1, 80);
    const stad = this.stadiums[clubName];
    const cost = 15.0;

    const userTeam = roomTeams[clubName];
    if (userTeam) {
      if ((userTeam.budget || 0) < cost) {
        return { error: `Insufficient funds. Capacity expansion costs ₹${cost}M.` };
      }
      userTeam.budget = Math.round((userTeam.budget - cost) * 100) / 100;
    }

    stad.capacity += 5000;

    return {
      success: true,
      message: `${stad.name} expanded! New capacity is ${stad.capacity.toLocaleString()} seats.`,
      stadium: stad,
      budget: userTeam?.budget
    };
  }

  // Upgrade club facilities (costs ₹10M, max Lv 5)
  upgradeFacilities(clubName, roomTeams = {}) {
    if (!this.stadiums[clubName]) this.initClubExtras(clubName, 1, 80);
    const stad = this.stadiums[clubName];
    if ((stad.facilitiesLevel || 3) >= 5) {
      return { error: "Facilities are already at maximum Level 5 (World Class Elite)!" };
    }

    const cost = 10.0;
    const userTeam = roomTeams[clubName];
    if (userTeam) {
      if ((userTeam.budget || 0) < cost) {
        return { error: `Insufficient funds. Facilities upgrade costs ₹${cost}M.` };
      }
      userTeam.budget = Math.round((userTeam.budget - cost) * 100) / 100;
    }

    stad.facilitiesLevel = (stad.facilitiesLevel || 3) + 1;

    return {
      success: true,
      message: `Club facilities upgraded to Level ${stad.facilitiesLevel}! Merchandise revenue boosted by +15%.`,
      stadium: stad,
      budget: userTeam?.budget
    };
  }

  // Hire a replacement manager from the free agents market
  hireManager(clubName, freeAgentId, roomTeams = {}) {
    const candidate = this.freeAgentManagers.find(m => m.id === freeAgentId);
    if (!candidate) {
      return { error: "Manager candidate not found in free agent registry." };
    }

    const cost = candidate.wage || 10.0;
    const userTeam = roomTeams[clubName];
    if (userTeam) {
      if ((userTeam.budget || 0) < cost) {
        return { error: `Insufficient funds. ${candidate.name} demands ₹${cost}M signing package.` };
      }
      userTeam.budget = Math.round((userTeam.budget - cost) * 100) / 100;
    }

    this.managers[clubName] = {
      name: candidate.name,
      avatar: candidate.avatar,
      tactic: candidate.tactic,
      formation: candidate.formation,
      boardConfidence: 85,
      jobStatus: "Secure",
      perk: candidate.perk,
      salary: candidate.wage,
      isUnderperforming: false
    };

    if (this.seasonAims[clubName]) {
      this.seasonAims[clubName].boardWarning = false;
      this.seasonAims[clubName].boardSatisfaction = "Satisfied 👍";
    }

    return {
      success: true,
      message: `Official: ${candidate.name} appointed as manager of ${clubName}! Special Perk: ${candidate.perk.name} activated.`,
      manager: this.managers[clubName],
      budget: userTeam?.budget
    };
  }

  // Dispatch player scout mission
  dispatchScout(clubName, missionType = "wonderkids", roomTeams = {}) {
    const cost = 1.5;
    const userTeam = roomTeams[clubName];
    if (userTeam) {
      if ((userTeam.budget || 0) < cost) {
        return { error: `Insufficient funds. Scouting expedition costs ₹${cost}M.` };
      }
      userTeam.budget = Math.round((userTeam.budget - cost) * 100) / 100;
    }

    const pool = Array.isArray(ALL_PLAYERS) && ALL_PLAYERS.length > 0 ? ALL_PLAYERS : [];
    let candidates = [];

    if (missionType === "wonderkids") {
      // Known young wonderkids or high growth potential
      const wonderNames = ["Lamine Yamal", "Arda Guler", "Kobbie Mainoo", "Pau Cubarsi", "Eduardo Camavinga", "Warren Zaire-Emery", "Endrick", "Mathys Tel", "Rico Lewis", "Alejandro Balde", "Gavi", "Kenan Yildiz", "Evan Ferguson", "Bradley Barcola"];
      candidates = pool.filter(p => wonderNames.some(w => p.name.toLowerCase().includes(w.toLowerCase())));
      if (candidates.length < 4) {
        candidates = pool.filter(p => p.rating <= 85 && p.base <= 30);
      }
    } else if (missionType === "attackers") {
      candidates = pool.filter(p => ["CF", "ST", "LW", "RW", "LWF", "RWF"].includes(p.position) && p.rating >= 83);
    } else if (missionType === "defenders") {
      candidates = pool.filter(p => ["CB", "LB", "RB", "GK"].includes(p.position) && p.rating >= 83);
    } else { // bargains
      candidates = pool.filter(p => p.rating >= 82 && p.base <= 20);
    }

    // Shuffle and pick 4
    const shuffled = [...candidates].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 4);

    const dossiers = selected.map(p => {
      const potBonus = missionType === "wonderkids" ? Math.floor(Math.random() * 6) + 5 : Math.floor(Math.random() * 3) + 2;
      const potentialRating = Math.min(99, p.rating + potBonus);
      const grade = potentialRating >= 93 ? "A+" : (potentialRating >= 88 ? "A" : "B+");
      const releaseClause = Math.round(p.base * 1.55 * 10) / 10;

      const verdicts = [
        "Explosive acceleration with clinical composure inside the penalty box.",
        "Generational vision; controls match tempo with pinpoint distribution.",
        "Relentless physical pressing monster; dominant in both air and ground duels.",
        "Dead-ball specialist with unmatched tactical discipline."
      ];

      return {
        name: p.name,
        club: p.club,
        position: p.position,
        currentRating: p.rating,
        potentialRating,
        basePrice: p.base,
        releaseClause,
        grade,
        style: p.style || "Versatile",
        verdict: verdicts[Math.floor(Math.random() * verdicts.length)]
      };
    });

    this.scoutReports[clubName] = dossiers;

    return {
      success: true,
      message: `Chief Scout returned with 4 priority dossiers on ${missionType.toUpperCase()}!`,
      dossiers,
      budget: userTeam?.budget
    };
  }

  // Sort standings by points DESC, GD DESC, GF DESC, name ASC
  sortStandings(divisionId) {
    const div = this.divisions[divisionId];
    if (!div) return;

    div.standings.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
      if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
      return a.name.localeCompare(b.name);
    });
  }

  // Simulate all matches for the current round across Div 1, 2, and 3
  simulateCurrentRound(roomTeams = {}) {
    if (this.isSeasonComplete || this.currentRound > this.totalRounds) {
      return {
        error: "Season is already complete. Advance to the next season."
      };
    }

    this.syncUserClubs(roomTeams);

    const roundMatches = [];
    for (const divId of [1, 2, 3]) {
      const div = this.divisions[divId];
      const fixturesThisRound = div.fixtures.filter(f => f.round === this.currentRound && !f.played);

      for (const fixture of fixturesThisRound) {
        const simulated = this.simulateMatch(fixture, roomTeams);
        roundMatches.push(simulated);
      }

      this.sortStandings(divId);
    }

    this.recentResults = roundMatches;
    const completedRound = this.currentRound;
    const rivalryMatches = roundMatches.filter(m => m.isRivalry);

    if (this.currentRound >= this.totalRounds) {
      this.isSeasonComplete = true;
      this.lastSeasonSummary = this.calculateSeasonSummary();
    } else {
      this.currentRound += 1;
    }

    return {
      round: completedRound,
      matches: roundMatches,
      rivalryMatches,
      isSeasonComplete: this.isSeasonComplete,
      seasonSummary: this.lastSeasonSummary,
      leagueState: this.getLeagueState()
    };
  }

  // Simulate all remaining rounds of the current season
  simulateFullSeason(roomTeams = {}) {
    const allMatches = [];
    while (!this.isSeasonComplete && this.currentRound <= this.totalRounds) {
      const res = this.simulateCurrentRound(roomTeams);
      if (res.matches) {
        allMatches.push(...res.matches);
      }
    }

    return {
      totalMatchesSimulated: allMatches.length,
      isSeasonComplete: true,
      seasonSummary: this.lastSeasonSummary,
      leagueState: this.getLeagueState()
    };
  }

  // Calculate promotion and relegation lists based on current standings
  calculateSeasonSummary() {
    this.sortStandings(1);
    this.sortStandings(2);
    this.sortStandings(3);

    const div1 = this.divisions[1].standings;
    const div2 = this.divisions[2].standings;
    const div3 = this.divisions[3].standings;

    const champion = div1[0]?.name || "None";

    // Division 1: bottom 2 relegated to Division 2
    const d1Relegated = div1.slice(4, 6).map(s => s.name);

    // Division 2: top 2 promoted to Division 1, bottom 2 relegated to Division 3
    const d2Promoted = div2.slice(0, 2).map(s => s.name);
    const d2Relegated = div2.slice(4, 6).map(s => s.name);

    // Division 3: top 2 promoted to Division 2
    const d3Promoted = div3.slice(0, 2).map(s => s.name);

    return {
      season: this.season,
      champion,
      promotions: [
        { from: 2, to: 1, teams: d2Promoted },
        { from: 3, to: 2, teams: d3Promoted }
      ],
      relegations: [
        { from: 1, to: 2, teams: d1Relegated },
        { from: 2, to: 3, teams: d2Relegated }
      ]
    };
  }

  // Advance to next season: apply promotions & relegations, regenerate fixtures, reset standings
  advanceToNextSeason(newSeasonNumber, roomTeams = {}) {
    const summary = this.calculateSeasonSummary();

    // Map existing clubs with their data
    const allClubsMap = new Map();
    for (const divId of [1, 2, 3]) {
      for (const club of this.divisions[divId].clubs) {
        allClubsMap.set(club.name, club);
      }
    }

    // Build new division rosters
    const d1Clubs = [];
    const d2Clubs = [];
    const d3Clubs = [];

    // Div 1 retains top 4, gets top 2 from Div 2
    this.divisions[1].standings.slice(0, 4).forEach(s => d1Clubs.push(allClubsMap.get(s.name)));
    summary.promotions.find(p => p.to === 1).teams.forEach(name => d1Clubs.push(allClubsMap.get(name)));

    // Div 2 retains middle 2 (ranks 3, 4), gets bottom 2 from Div 1 and top 2 from Div 3
    this.divisions[2].standings.slice(2, 4).forEach(s => d2Clubs.push(allClubsMap.get(s.name)));
    summary.relegations.find(r => r.to === 2).teams.forEach(name => d2Clubs.push(allClubsMap.get(name)));
    summary.promotions.find(p => p.to === 2).teams.forEach(name => d2Clubs.push(allClubsMap.get(name)));

    // Div 3 retains bottom 4 (ranks 3, 4, 5, 6), gets bottom 2 from Div 2
    this.divisions[3].standings.slice(2, 6).forEach(s => d3Clubs.push(allClubsMap.get(s.name)));
    summary.relegations.find(r => r.to === 3).teams.forEach(name => d3Clubs.push(allClubsMap.get(name)));

    const newDivisionClubs = {
      1: d1Clubs.filter(Boolean),
      2: d2Clubs.filter(Boolean),
      3: d3Clubs.filter(Boolean)
    };

    // Re-initialize for new season
    this.initSeason(newSeasonNumber, newDivisionClubs);
    this.syncUserClubs(roomTeams);

    return {
      season: this.season,
      previousSummary: summary,
      leagueState: this.getLeagueState()
    };
  }

  // Get full league state
  getLeagueState() {
    this.sortStandings(1);
    this.sortStandings(2);
    this.sortStandings(3);

    return {
      season: this.season,
      currentRound: this.currentRound,
      totalRounds: this.totalRounds,
      isSeasonComplete: this.isSeasonComplete,
      recentResults: this.recentResults,
      lastSeasonSummary: this.lastSeasonSummary,
      stadiums: this.stadiums,
      managers: this.managers,
      finances: this.finances,
      seasonAims: this.seasonAims,
      freeAgentManagers: this.freeAgentManagers,
      scoutReports: this.scoutReports,
      divisions: {
        1: {
          id: 1,
          name: this.divisions[1].name,
          tier: 1,
          promotionSlots: 0,
          relegationSlots: 2,
          standings: this.divisions[1].standings,
          fixtures: this.divisions[1].fixtures
        },
        2: {
          id: 2,
          name: this.divisions[2].name,
          tier: 2,
          promotionSlots: 2,
          relegationSlots: 2,
          standings: this.divisions[2].standings,
          fixtures: this.divisions[2].fixtures
        },
        3: {
          id: 3,
          name: this.divisions[3].name,
          tier: 3,
          promotionSlots: 2,
          relegationSlots: 0,
          standings: this.divisions[3].standings,
          fixtures: this.divisions[3].fixtures
        }
      }
    };
  }

  // Get specific division state
  getDivisionState(divId) {
    const id = Number(divId);
    if (![1, 2, 3].includes(id)) return null;

    this.sortStandings(id);
    const div = this.divisions[id];

    return {
      season: this.season,
      currentRound: this.currentRound,
      totalRounds: this.totalRounds,
      isSeasonComplete: this.isSeasonComplete,
      division: {
        id: div.id,
        name: div.name,
        tier: div.tier,
        promotionSlots: div.promotionSlots,
        relegationSlots: div.relegationSlots,
        standings: div.standings,
        fixtures: div.fixtures
      }
    };
  }
}

module.exports = {
  LeagueManager,
  INITIAL_CLUBS
};
