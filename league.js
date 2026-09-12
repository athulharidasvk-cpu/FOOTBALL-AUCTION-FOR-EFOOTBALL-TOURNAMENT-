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
// DEFAULT CLUB JERSEYS & KIT DESIGNER ENGINE
// =====================================================
const DEFAULT_CLUB_JERSEYS = {
  "Real Madrid": {
    kitName: "Home Galáctico Pure",
    primaryColor: "#ffffff",
    secondaryColor: "#0f172a",
    accentColor: "#f59e0b",
    pattern: "solid",
    collarStyle: "polo",
    sponsor: "Fly Emirates",
    badgeIcon: "👑",
    numberColor: "#0f172a"
  },
  "Manchester City": {
    kitName: "Sky Blue Celestial",
    primaryColor: "#38bdf8",
    secondaryColor: "#0f172a",
    accentColor: "#ffffff",
    pattern: "stripes",
    collarStyle: "crew",
    sponsor: "Etihad Airways",
    badgeIcon: "🏙️",
    numberColor: "#0f172a"
  },
  "Bayern Munich": {
    kitName: "Bavarian Crimson Pride",
    primaryColor: "#dc2626",
    secondaryColor: "#ffffff",
    accentColor: "#991b1b",
    pattern: "hoops",
    collarStyle: "v-neck",
    sponsor: "T-Mobile",
    badgeIcon: "🔴",
    numberColor: "#ffffff"
  },
  "Arsenal": {
    kitName: "Gunners Cannon White-Sleeve",
    primaryColor: "#ef4444",
    secondaryColor: "#ffffff",
    accentColor: "#facc15",
    pattern: "halves",
    collarStyle: "polo",
    sponsor: "Fly Emirates",
    badgeIcon: "🔴",
    numberColor: "#ffffff"
  },
  "Paris Saint-Germain": {
    kitName: "Hechter Classic Navy & Rouge",
    primaryColor: "#1e3a8a",
    secondaryColor: "#dc2626",
    accentColor: "#ffffff",
    pattern: "sash",
    collarStyle: "crew",
    sponsor: "Qatar Airways",
    badgeIcon: "🗼",
    numberColor: "#ffffff"
  },
  "Liverpool": {
    kitName: "Anfield Gold Pinstripe",
    primaryColor: "#b91c1c",
    secondaryColor: "#fbbf24",
    accentColor: "#ffffff",
    pattern: "pinstripes",
    collarStyle: "v-neck",
    sponsor: "Standard Chartered",
    badgeIcon: "🔴",
    numberColor: "#fbbf24"
  },
  "Barcelona": {
    kitName: "Blaugrana Heritage",
    primaryColor: "#1d4ed8",
    secondaryColor: "#be123c",
    accentColor: "#fbbf24",
    pattern: "stripes",
    collarStyle: "crew",
    sponsor: "Spotify",
    badgeIcon: "🔵",
    numberColor: "#fbbf24"
  },
  "Borussia Dortmund": {
    kitName: "Signal Iduna Cyber Yellow",
    primaryColor: "#facc15",
    secondaryColor: "#0f172a",
    accentColor: "#ffffff",
    pattern: "stripes",
    collarStyle: "v-neck",
    sponsor: "1&1",
    badgeIcon: "🟡",
    numberColor: "#0f172a"
  },
  "Atletico Madrid": {
    kitName: "Rojiblancos Passion",
    primaryColor: "#dc2626",
    secondaryColor: "#ffffff",
    accentColor: "#1e3a8a",
    pattern: "stripes",
    collarStyle: "crew",
    sponsor: "Riyadh Air",
    badgeIcon: "⚪",
    numberColor: "#1e3a8a"
  },
  "Juventus": {
    kitName: "Bianconeri Gold Edition",
    primaryColor: "#0f172a",
    secondaryColor: "#ffffff",
    accentColor: "#eab308",
    pattern: "stripes",
    collarStyle: "polo",
    sponsor: "Jeep",
    badgeIcon: "🦓",
    numberColor: "#eab308"
  },
  "AC Milan": {
    kitName: "Rossoneri Fire",
    primaryColor: "#dc2626",
    secondaryColor: "#0f172a",
    accentColor: "#fbbf24",
    pattern: "stripes",
    collarStyle: "v-neck",
    sponsor: "Fly Emirates",
    badgeIcon: "🔴",
    numberColor: "#ffffff"
  },
  "Napoli": {
    kitName: "Azzurri Marine",
    primaryColor: "#0284c7",
    secondaryColor: "#ffffff",
    accentColor: "#0369a1",
    pattern: "solid",
    collarStyle: "crew",
    sponsor: "MSC Cruises",
    badgeIcon: "🔵",
    numberColor: "#ffffff"
  },
  "Bayer Leverkusen": {
    kitName: "Werkself Cross",
    primaryColor: "#0f172a",
    secondaryColor: "#dc2626",
    accentColor: "#ffffff",
    pattern: "sash",
    collarStyle: "polo",
    sponsor: "Barmenia",
    badgeIcon: "🦁",
    numberColor: "#dc2626"
  },
  "Ajax": {
    kitName: "Amsterdam Total Red",
    primaryColor: "#ffffff",
    secondaryColor: "#dc2626",
    accentColor: "#facc15",
    pattern: "halves",
    collarStyle: "crew",
    sponsor: "Ziggo",
    badgeIcon: "⚔️",
    numberColor: "#dc2626"
  },
  "Benfica": {
    kitName: "Águias Vermelho",
    primaryColor: "#dc2626",
    secondaryColor: "#ffffff",
    accentColor: "#fbbf24",
    pattern: "solid",
    collarStyle: "v-neck",
    sponsor: "Fly Emirates",
    badgeIcon: "🦅",
    numberColor: "#ffffff"
  },
  "Sporting CP": {
    kitName: "Verde e Branco Hoops",
    primaryColor: "#15803d",
    secondaryColor: "#ffffff",
    accentColor: "#0f172a",
    pattern: "hoops",
    collarStyle: "polo",
    sponsor: "Betano",
    badgeIcon: "🦁",
    numberColor: "#ffffff"
  },
  "FC Porto": {
    kitName: "Dragão Stripes",
    primaryColor: "#1d4ed8",
    secondaryColor: "#ffffff",
    accentColor: "#f59e0b",
    pattern: "stripes",
    collarStyle: "v-neck",
    sponsor: "Betano",
    badgeIcon: "🐉",
    numberColor: "#ffffff"
  },
  "Marseille": {
    kitName: "Vélodrome Sky & White",
    primaryColor: "#ffffff",
    secondaryColor: "#0284c7",
    accentColor: "#facc15",
    pattern: "solid",
    collarStyle: "crew",
    sponsor: "CMA CGM",
    badgeIcon: "⚪",
    numberColor: "#0284c7"
  },
  "Aston Villa": {
    kitName: "Claret & Blue Heritage",
    primaryColor: "#831843",
    secondaryColor: "#38bdf8",
    accentColor: "#fbbf24",
    pattern: "halves",
    collarStyle: "v-neck",
    sponsor: "Betano",
    badgeIcon: "🦁",
    numberColor: "#ffffff"
  }
};

// Player ages lookup to power authentic Golden Boy (U-21) and Ballon d'Or awards
const PLAYER_AGES_DATABASE = {
  "Lamine Yamal": 17,
  "Pau Cubarsi": 18,
  "Endrick": 18,
  "Warren Zaire-Emery": 18,
  "Arda Guler": 19,
  "Kobbie Mainoo": 19,
  "Kenan Yildiz": 19,
  "Savinho": 20,
  "Gavi": 20,
  "Alejandro Balde": 21,
  "Jude Bellingham": 21,
  "Jamal Musiala": 21,
  "Florian Wirtz": 21,
  "Eduardo Camavinga": 21,
  "Jeremy Doku": 22,
  "Pedri": 22,
  "Cole Palmer": 22,
  "Bukayo Saka": 22,
  "Rodrygo": 23,
  "Phil Foden": 24,
  "Erling Haaland": 24,
  "Vinicius Junior": 24,
  "Vinícius Jr.": 24,
  "Kylian Mbappe": 25,
  "Kylian Mbappé": 25,
  "Federico Valverde": 26,
  "Martin Odegaard": 25,
  "Declan Rice": 25,
  "Rodri": 28,
  "Mohamed Salah": 32,
  "Kevin De Bruyne": 33,
  "Harry Kane": 31,
  "Robert Lewandowski": 36,
  "Antoine Griezmann": 33,
  "Luka Modric": 38,
  "Thibaut Courtois": 32,
  "Alisson Becker": 31,
  "Ederson": 31,
  "Marc-Andre ter Stegen": 32,
  "David Raya": 28,
  "Jan Oblak": 31,
  "Gianluigi Donnarumma": 25,
  "Manuel Neuer": 38,
  "Gregor Kobel": 26
};

// Aesthetics Evaluation Algorithm
function evaluateJerseyAesthetics(jersey) {
  function hexToRgb(hex) {
    hex = (hex || "#ffffff").replace("#", "");
    if (hex.length === 3) hex = hex.split("").map(c => c + c).join("");
    const num = parseInt(hex, 16) || 0;
    return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
  }

  function getLuminance(rgb) {
    const a = [rgb.r, rgb.g, rgb.b].map(v => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
  }

  function contrastRatio(hex1, hex2) {
    const l1 = getLuminance(hexToRgb(hex1));
    const l2 = getLuminance(hexToRgb(hex2));
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
  }

  function rgbToHsl(rgb) {
    const r = rgb.r / 255, g = rgb.g / 255, b = rgb.b / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return { h: h * 360, s, l };
  }

  const primary = jersey.primaryColor || "#ffffff";
  const secondary = jersey.secondaryColor || "#0f172a";
  const accent = jersey.accentColor || "#f59e0b";
  const sponsorColor = jersey.numberColor || secondary;

  // 1. Contrast ratio between primary jersey and sponsor text
  const textContrast = contrastRatio(primary, sponsorColor);
  let contrastBonus = 0;
  if (textContrast >= 7.0) contrastBonus = 2.8; // WCAG AAA
  else if (textContrast >= 4.5) contrastBonus = 2.2; // WCAG AA
  else if (textContrast >= 3.0) contrastBonus = 1.0;
  else contrastBonus = -1.8; // Hard to read sponsor

  // 2. Color harmony calculation
  const hsl1 = rgbToHsl(hexToRgb(primary));
  const hsl2 = rgbToHsl(hexToRgb(secondary));
  const hsl3 = rgbToHsl(hexToRgb(accent));

  let hueDiff = Math.abs(hsl1.h - hsl2.h);
  if (hueDiff > 180) hueDiff = 360 - hueDiff;

  let harmonyScore = 2.0;
  // Complementary or classic high-energy contrast
  if (hueDiff >= 140 && hueDiff <= 200) harmonyScore += 1.8;
  // Analogous / Monochromatic harmony
  else if (hueDiff <= 40) harmonyScore += 1.5;
  // Classic athletic neutral pairings (white, black, navy, grey)
  if (hsl1.s < 0.15 || hsl2.s < 0.15) harmonyScore += 1.5;

  // Gold or bright accent bonus
  if ((hsl3.h >= 35 && hsl3.h <= 55 && hsl3.s > 0.6) || (hsl3.s < 0.15 && hsl3.l > 0.85)) {
    harmonyScore += 0.8;
  }

  // 3. Pattern styling bonus
  let patternBonus = 1.0;
  if (["stripes", "hoops", "halves", "sash", "pinstripes"].includes(jersey.pattern)) {
    patternBonus = 1.4;
  }
  if (jersey.collarStyle === "polo" || jersey.collarStyle === "v-neck") {
    patternBonus += 0.5;
  }
  if (jersey.sponsor && jersey.sponsor.trim().length > 0) {
    patternBonus += 0.5;
  }

  let totalRaw = 4.0 + contrastBonus + harmonyScore + patternBonus;
  let aestheticScore = Math.min(10.0, Math.max(2.5, Math.round(totalRaw * 10) / 10));

  let tier = "B-Tier";
  let multiplier = 1.0;
  let critique = "";

  if (aestheticScore >= 9.2) {
    tier = "S-Tier Masterpiece 💎";
    multiplier = 1.85 + (aestheticScore - 9.2) * 0.45; // 1.85x up to ~2.2x
    critique = "Haute couture masterpiece! Fans worldwide are queueing overnight outside club megastores. Instant cultural classic.";
  } else if (aestheticScore >= 8.2) {
    tier = "A-Tier Elite Drip 🔥";
    multiplier = 1.40 + (aestheticScore - 8.2) * 0.40; // 1.4x - 1.8x
    critique = "Brilliant design! Superb color harmony and crisp sponsor contrast make this one of the hottest kits of the season.";
  } else if (aestheticScore >= 7.0) {
    tier = "B-Tier Solid Classic ⭐";
    multiplier = 1.10 + (aestheticScore - 7.0) * 0.25; // 1.1x - 1.35x
    critique = "Sharp and dependable commercial kit. Strong fan reception with steady retail sales across stadium stores.";
  } else if (aestheticScore >= 5.5) {
    tier = "C-Tier Ordinary ⚠️";
    multiplier = 0.95;
    critique = "Average kit execution. Moderate sales; supporters feel the color coordination could be elevated.";
  } else {
    tier = "D-Tier Clashing 🚨";
    multiplier = 0.78;
    critique = "Fan backlash! Unreadable sponsor or conflicting color palettes lead to discounted shelf stock and memes online.";
  }

  multiplier = Math.round(multiplier * 100) / 100;

  return {
    aestheticScore,
    tier,
    salesMultiplier: multiplier,
    critique,
    contrastRatio: Math.round(textContrast * 10) / 10
  };
}

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
    this.jerseys = {};
    this.playerSeasonStats = {};
    this.seasonAwards = null;

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

    if (!this.jerseys[clubName]) {
      const def = DEFAULT_CLUB_JERSEYS[clubName] || {
        kitName: `${clubName} Home Kit`,
        primaryColor: "#1e3a8a",
        secondaryColor: "#ffffff",
        accentColor: "#f59e0b",
        pattern: "stripes",
        collarStyle: "crew",
        sponsor: "Emirates",
        badgeIcon: "⚽",
        numberColor: "#ffffff"
      };
      const evalRes = evaluateJerseyAesthetics(def);
      this.jerseys[clubName] = {
        ...def,
        ...evalRes,
        lastUpdatedRound: this.currentRound
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

    // Generate minute-by-minute timeline and match statistics
    const matchSimData = this.generateMatchTimelineAndStats(fixture, homeScore, awayScore, scorers, homeRating, awayRating, roomTeams);
    fixture.stats = matchSimData.stats;
    fixture.timeline = matchSimData.timeline;
    fixture.motm = matchSimData.motm;

    // Record stats for Ballon d'Or, Golden Glove, and individual awards
    this.updatePlayerStatsFromMatch(fixture, matchSimData, roomTeams);

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

    // Merchandise & Jersey Sales with Aesthetics Multiplier
    if (!this.jerseys[fixture.homeTeam]) {
      this.initClubExtras(fixture.homeTeam, fixture.division, homeRating);
    }
    const jersey = this.jerseys[fixture.homeTeam] || { salesMultiplier: 1.0, aestheticScore: 7.5, tier: "B-Tier" };
    const jerseyMultiplier = jersey.salesMultiplier || 1.0;
    const baseJerseyBuyers = Math.floor(attendance * (0.10 + Math.random() * 0.10));
    const facilitiesMultiplier = 1 + ((homeStad.facilitiesLevel || 3) - 3) * 0.15;
    const starMultiplier = (homeRating >= 88) ? 1.4 : (homeRating >= 85 ? 1.2 : 1.0);
    const jerseysSold = Math.floor(baseJerseyBuyers * facilitiesMultiplier * starMultiplier * jerseyMultiplier);

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
      jerseySalesMultiplier: jerseyMultiplier,
      jerseyAestheticScore: jersey.aestheticScore || 7.5,
      jerseyTier: jersey.tier || "B-Tier",
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

  // Generate authentic minute-by-minute timeline and match statistics
  generateMatchTimelineAndStats(fixture, homeScore, awayScore, scorers, homeRating, awayRating, roomTeams = {}) {
    const homeTeam = fixture.homeTeam;
    const awayTeam = fixture.awayTeam;

    const getClubStar = (team, role = "attacker") => {
      const uTeam = roomTeams[team];
      const squad = uTeam?.players || [];
      if (role === "gk") {
        const gk = squad.find(p => p.position === "GK");
        if (gk) return gk.name;
        const knownGk = {
          "Real Madrid": "Thibaut Courtois", "Manchester City": "Ederson", "Bayern Munich": "Manuel Neuer",
          "Arsenal": "David Raya", "Paris Saint-Germain": "Gianluigi Donnarumma", "Liverpool": "Alisson Becker",
          "Barcelona": "Marc-André ter Stegen", "Borussia Dortmund": "Gregor Kobel", "Atletico Madrid": "Jan Oblak",
          "Juventus": "Michele Di Gregorio", "AC Milan": "Mike Maignan", "Napoli": "Alex Meret",
          "Bayer Leverkusen": "Lukáš Hrádecký", "Ajax": "Remko Pasveer", "Benfica": "Anatoliy Trubin",
          "Sporting CP": "Franco Israel", "FC Porto": "Diogo Costa", "Marseille": "Gerónimo Rulli",
          "Aston Villa": "Emiliano Martínez"
        };
        return knownGk[team] || `${team} Goalkeeper`;
      }
      if (role === "mid") {
        const mid = squad.find(p => ["AMF", "CMF", "DMF"].includes(p.position));
        if (mid) return mid.name;
        const knownMids = {
          "Real Madrid": "Jude Bellingham", "Manchester City": "Kevin De Bruyne", "Bayern Munich": "Jamal Musiala",
          "Arsenal": "Martin Ødegaard", "Paris Saint-Germain": "Vitinha", "Liverpool": "Alexis Mac Allister",
          "Barcelona": "Pedri", "Borussia Dortmund": "Julian Brandt", "Atletico Madrid": "Rodrigo De Paul",
          "Juventus": "Teun Koopmeiners", "AC Milan": "Tijjani Reijnders", "Napoli": "Stanislav Lobotka",
          "Bayer Leverkusen": "Florian Wirtz", "Ajax": "Kenneth Taylor", "Benfica": "Orkun Kökçü",
          "Sporting CP": "Morten Hjulmand", "FC Porto": "Alan Varela", "Marseille": "Pierre-Emile Højbjerg",
          "Aston Villa": "John McGinn"
        };
        return knownMids[team] || `${team} Playmaker`;
      }
      if (role === "def") {
        const def = squad.find(p => ["CB", "LB", "RB"].includes(p.position));
        if (def) return def.name;
        const knownDefs = {
          "Real Madrid": "Antonio Rüdiger", "Manchester City": "Rúben Dias", "Bayern Munich": "Dayot Upamecano",
          "Arsenal": "William Saliba", "Paris Saint-Germain": "Marquinhos", "Liverpool": "Virgil van Dijk",
          "Barcelona": "Pau Cubarsí", "Borussia Dortmund": "Nico Schlotterbeck", "Atletico Madrid": "José Giménez",
          "Juventus": "Bremer", "AC Milan": "Théo Hernandez", "Napoli": "Giovanni Di Lorenzo",
          "Bayer Leverkusen": "Jonathan Tah", "Ajax": "Josip Šutalo", "Benfica": "Nicolás Otamendi",
          "Sporting CP": "Gonçalo Inácio", "FC Porto": "Nehuén Pérez", "Marseille": "Leonardo Balerdi",
          "Aston Villa": "Ezri Konsa"
        };
        return knownDefs[team] || `${team} Defender`;
      }
      if (squad.length > 0) {
        return squad[Math.floor(Math.random() * squad.length)].name;
      }
      return AI_STARS[team]?.[0] || `${team} Striker`;
    };

    const homeGk = getClubStar(homeTeam, "gk");
    const awayGk = getClubStar(awayTeam, "gk");

    // Match statistics calculation
    const ratingDiff = homeRating - awayRating;
    const homePoss = Math.min(68, Math.max(34, Math.round(50 + ratingDiff * 1.2 + (Math.random() * 6 - 3))));
    const awayPoss = 100 - homePoss;

    const homeShots = Math.max(homeScore + 3, Math.round(homeScore * 2.8 + Math.random() * 6 + 5));
    const awayShots = Math.max(awayScore + 2, Math.round(awayScore * 2.6 + Math.random() * 5 + 3));

    const homeOnTarget = Math.min(homeShots, homeScore + Math.floor(Math.random() * 4) + 2);
    const awayOnTarget = Math.min(awayShots, awayScore + Math.floor(Math.random() * 3) + 1);

    const homeXG = Math.round((homeScore * 0.72 + (homeShots - homeScore) * 0.08 + Math.random() * 0.25) * 100) / 100;
    const awayXG = Math.round((awayScore * 0.72 + (awayShots - awayScore) * 0.08 + Math.random() * 0.25) * 100) / 100;

    const homeCorners = Math.floor(Math.random() * 6) + 3;
    const awayCorners = Math.floor(Math.random() * 5) + 2;

    const homeFouls = Math.floor(Math.random() * 7) + 6;
    const awayFouls = Math.floor(Math.random() * 8) + 7;

    const homeYellows = Math.floor(Math.random() * 3);
    const awayYellows = Math.floor(Math.random() * 3) + (fixture.isRivalry ? 1 : 0);

    const homeSaves = Math.max(1, awayOnTarget - awayScore);
    const awaySaves = Math.max(1, homeOnTarget - homeScore);

    const homePasses = Math.floor(homePoss * 9.2 + Math.random() * 40);
    const awayPasses = Math.floor(awayPoss * 9.2 + Math.random() * 40);

    const homePassAcc = Math.min(94, Math.floor(79 + (homeRating / 12) + Math.random() * 5));
    const awayPassAcc = Math.min(94, Math.floor(79 + (awayRating / 12) + Math.random() * 5));

    const homeTackles = Math.floor(Math.random() * 8) + 12;
    const awayTackles = Math.floor(Math.random() * 8) + 12;

    const stats = {
      possession: { home: homePoss, away: awayPoss },
      shots: { home: homeShots, away: awayShots },
      shotsOnTarget: { home: homeOnTarget, away: awayOnTarget },
      xG: { home: homeXG, away: awayXG },
      corners: { home: homeCorners, away: awayCorners },
      fouls: { home: homeFouls, away: awayFouls },
      yellowCards: { home: homeYellows, away: awayYellows },
      redCards: { home: 0, away: 0 },
      saves: { home: homeSaves, away: awaySaves },
      passes: { home: homePasses, away: awayPasses },
      passAccuracy: { home: homePassAcc, away: awayPassAcc },
      tackles: { home: homeTackles, away: awayTackles }
    };

    // Build Minute-by-Minute Timeline Events
    const events = [];

    events.push({
      minute: 0,
      type: "kickoff",
      team: homeTeam,
      player: homeTeam,
      commentary: `Match begins! Referee signals kickoff as ${homeTeam} get the action underway at ${fixture.matchdayStats?.stadiumName || 'the stadium'}.`,
      icon: "📢",
      scoreHome: 0,
      scoreAway: 0
    });

    let currentHome = 0;
    let currentAway = 0;

    for (const sc of (scorers || [])) {
      const isHome = sc.team === homeTeam;
      if (isHome) currentHome++;
      else currentAway++;

      const assistMaker = getClubStar(sc.team, "mid");
      events.push({
        minute: sc.minute,
        type: "goal",
        team: sc.team,
        player: sc.scorer,
        secondaryPlayer: assistMaker,
        commentary: `⚽ GOOOOOAL! ${sc.scorer} finds the back of the net with an unstoppable strike! Precision assist by ${assistMaker}. [${currentHome} - ${currentAway}]`,
        icon: "⚽",
        scoreHome: currentHome,
        scoreAway: currentAway,
        isHighlight: true
      });
    }

    const sampleMinutes = [8, 15, 23, 31, 39, 44, 45, 52, 61, 70, 78, 86, 90];
    for (const min of sampleMinutes) {
      const exists = events.find(e => {
        const m = typeof e.minute === "string" ? 90 : e.minute;
        return Math.abs(m - min) <= 1;
      });
      if (exists) continue;

      if (min === 45) {
        events.push({
          minute: 45,
          type: "halftime",
          team: homeTeam,
          player: "Referee",
          commentary: `Half-time whistle blows. Players head down the tunnel for tactical briefing. Current score: ${homeTeam} ${currentHome} - ${currentAway} ${awayTeam}.`,
          icon: "⏸️",
          scoreHome: currentHome,
          scoreAway: currentAway
        });
        continue;
      }

      if (min === 61) {
        const subInHome = getClubStar(homeTeam, "mid");
        events.push({
          minute: 61,
          type: "sub",
          team: homeTeam,
          player: subInHome,
          commentary: `🔄 Tactical substitution for ${homeTeam}: Fresh legs introduced to intensify the press and maintain tempo.`,
          icon: "🔄",
          scoreHome: currentHome,
          scoreAway: currentAway
        });
        continue;
      }

      if (min === 70) {
        const subInAway = getClubStar(awayTeam, "mid");
        events.push({
          minute: 70,
          type: "sub",
          team: awayTeam,
          player: subInAway,
          commentary: `🔄 Tactical change for ${awayTeam}: Adjusting offensive shape aiming to stretch the backline.`,
          icon: "🔄",
          scoreHome: currentHome,
          scoreAway: currentAway
        });
        continue;
      }

      const rand = Math.random();
      if (rand < 0.28) {
        const attackingHome = Math.random() < (homePoss / 100);
        const attacker = attackingHome ? getClubStar(homeTeam, "attacker") : getClubStar(awayTeam, "attacker");
        const gk = attackingHome ? awayGk : homeGk;
        const defendingTeam = attackingHome ? awayTeam : homeTeam;
        events.push({
          minute: min,
          type: "save",
          team: defendingTeam,
          player: gk,
          secondaryPlayer: attacker,
          commentary: `🧤 Sensational reflex stop by ${gk}! ${attacker} unleashed a ferocious curling drive, but the goalkeeper parries it away safely!`,
          icon: "🧤",
          scoreHome: currentHome,
          scoreAway: currentAway
        });
      } else if (rand < 0.48) {
        const cardTeam = Math.random() < 0.5 ? homeTeam : awayTeam;
        const def = getClubStar(cardTeam, "def");
        events.push({
          minute: min,
          type: "card_yellow",
          team: cardTeam,
          player: def,
          commentary: `🟨 Caution issued! ${def} pulls down the counter-attacker with a cynical tactical foul. Yellow card shown.`,
          icon: "🟨",
          scoreHome: currentHome,
          scoreAway: currentAway
        });
      } else if (rand < 0.68) {
        const attTeam = Math.random() < 0.5 ? homeTeam : awayTeam;
        const shooter = getClubStar(attTeam, "attacker");
        events.push({
          minute: min,
          type: "woodwork",
          team: attTeam,
          player: shooter,
          commentary: `🎯 OFF THE WOODWORK! ${shooter} rattles the crossbar from outside the box! Millimeters away from glory!`,
          icon: "🎯",
          scoreHome: currentHome,
          scoreAway: currentAway
        });
      } else if (rand < 0.85) {
        const cornerTeam = Math.random() < 0.5 ? homeTeam : awayTeam;
        const taker = getClubStar(cornerTeam, "mid");
        events.push({
          minute: min,
          type: "corner",
          team: cornerTeam,
          player: taker,
          commentary: `🚩 Corner awarded to ${cornerTeam}. ${taker} whips an in-swinging delivery into the danger zone, headed away by the defense.`,
          icon: "🚩",
          scoreHome: currentHome,
          scoreAway: currentAway
        });
      } else {
        const counterTeam = Math.random() < 0.5 ? homeTeam : awayTeam;
        const runner = getClubStar(counterTeam, "attacker");
        events.push({
          minute: min,
          type: "chance",
          team: counterTeam,
          player: runner,
          commentary: `⚡ Rapid break by ${counterTeam}! ${runner} sprints clear down the wing, delivering a venomous low cross that gets cleared.`,
          icon: "⚡",
          scoreHome: currentHome,
          scoreAway: currentAway
        });
      }
    }

    events.push({
      minute: "90+2",
      type: "fulltime",
      team: homeTeam,
      player: "Referee",
      commentary: `Full-time whistle! An enthralling match concludes. Final score: ${homeTeam} ${homeScore} - ${awayScore} ${awayTeam}.`,
      icon: "🏁",
      scoreHome: homeScore,
      scoreAway: awayScore,
      isHighlight: true
    });

    events.sort((a, b) => {
      const minA = typeof a.minute === "string" ? 90 + parseInt(a.minute.replace("90+", "") || "1", 10) : a.minute;
      const minB = typeof b.minute === "string" ? 90 + parseInt(b.minute.replace("90+", "") || "1", 10) : b.minute;
      return minA - minB;
    });

    let motm = null;
    if (scorers && scorers.length > 0) {
      motm = {
        name: scorers[0].scorer,
        team: scorers[0].team,
        rating: 9.4,
        role: "Match Winner",
        impact: "Decisive match-winning performance with clinical finishing."
      };
    } else if (homeScore === 0 && awayScore === 0) {
      motm = {
        name: homeGk,
        team: homeTeam,
        rating: 9.1,
        role: "Goalkeeper",
        impact: "Heroic clean sheet with key reflex saves to preserve the draw."
      };
    } else {
      motm = {
        name: getClubStar(homeScore > awayScore ? homeTeam : awayTeam, "mid"),
        team: homeScore > awayScore ? homeTeam : awayTeam,
        rating: 8.8,
        role: "Midfield General",
        impact: "Controlled the tempo of the game with flawless passing distribution."
      };
    }

    return {
      stats,
      timeline: events,
      motm
    };
  }

  // Update individual player statistics for awards from match simulation
  updatePlayerStatsFromMatch(fixture, matchData, roomTeams = {}) {
    const { homeTeam, awayTeam, homeScore, awayScore, scorers, motm } = fixture;

    const getOrInitPlayer = (playerName, club, position = "CF") => {
      if (!this.playerSeasonStats[playerName]) {
        const age = PLAYER_AGES_DATABASE[playerName] || Math.floor(Math.random() * 8) + 21;
        this.playerSeasonStats[playerName] = {
          name: playerName,
          club,
          position,
          age,
          appearances: 0,
          goals: 0,
          assists: 0,
          cleanSheets: 0,
          saves: 0,
          goalsConceded: 0,
          ratingTotal: 0,
          avgRating: 7.0,
          motmCount: 0
        };
      }
      return this.playerSeasonStats[playerName];
    };

    for (const sc of (scorers || [])) {
      const p = getOrInitPlayer(sc.scorer, sc.team, "CF");
      p.goals += 1;
      p.appearances = Math.max(1, p.appearances + 1);
      p.ratingTotal += (Math.random() * 1.5 + 8.2);
    }

    for (const ev of (matchData.timeline || [])) {
      if (ev.type === "goal" && ev.secondaryPlayer) {
        const p = getOrInitPlayer(ev.secondaryPlayer, ev.team, "AMF");
        p.assists += 1;
        p.appearances = Math.max(1, p.appearances + 1);
        p.ratingTotal += (Math.random() * 1.2 + 7.8);
      }
    }

    const homeGkName = matchData.timeline.find(e => e.type === "save" && e.team === homeTeam)?.player || `${homeTeam} Goalkeeper`;
    const awayGkName = matchData.timeline.find(e => e.type === "save" && e.team === awayTeam)?.player || `${awayTeam} Goalkeeper`;

    const homeGk = getOrInitPlayer(homeGkName, homeTeam, "GK");
    homeGk.appearances += 1;
    homeGk.saves += matchData.stats?.saves?.home || 3;
    homeGk.goalsConceded += awayScore;
    if (awayScore === 0) homeGk.cleanSheets += 1;
    homeGk.ratingTotal += (awayScore === 0 ? 8.5 : 7.3);

    const awayGk = getOrInitPlayer(awayGkName, awayTeam, "GK");
    awayGk.appearances += 1;
    awayGk.saves += matchData.stats?.saves?.away || 3;
    awayGk.goalsConceded += homeScore;
    if (homeScore === 0) awayGk.cleanSheets += 1;
    awayGk.ratingTotal += (homeScore === 0 ? 8.5 : 7.3);

    if (motm && motm.name) {
      const motmP = getOrInitPlayer(motm.name, motm.team);
      motmP.motmCount += 1;
      motmP.ratingTotal += motm.rating || 9.0;
    }

    for (const key of Object.keys(this.playerSeasonStats)) {
      const p = this.playerSeasonStats[key];
      const games = Math.max(1, p.appearances || (p.goals > 0 ? 1 : 0));
      p.avgRating = Math.round((p.ratingTotal / (games + 0.4)) * 10) / 10;
      p.avgRating = Math.min(9.9, Math.max(6.0, p.avgRating));
    }
  }

  // Seed baseline star players for season awards before matches or at season start
  seedInitialPlayerStats() {
    const seedStars = [
      { name: "Kylian Mbappé", club: "Real Madrid", position: "CF", age: 25, goals: 7, assists: 3, cleanSheets: 0, saves: 0, goalsConceded: 0, appearances: 8, avgRating: 8.9, motmCount: 3 },
      { name: "Vinicius Junior", club: "Real Madrid", position: "LWF", age: 24, goals: 6, assists: 6, cleanSheets: 0, saves: 0, goalsConceded: 0, appearances: 8, avgRating: 8.9, motmCount: 2 },
      { name: "Erling Haaland", club: "Manchester City", position: "CF", age: 24, goals: 8, assists: 1, cleanSheets: 0, saves: 0, goalsConceded: 0, appearances: 8, avgRating: 8.8, motmCount: 3 },
      { name: "Jude Bellingham", club: "Real Madrid", position: "AMF", age: 21, goals: 4, assists: 5, cleanSheets: 0, saves: 0, goalsConceded: 0, appearances: 8, avgRating: 8.7, motmCount: 2 },
      { name: "Lamine Yamal", club: "Barcelona", position: "RWF", age: 17, goals: 5, assists: 7, cleanSheets: 0, saves: 0, goalsConceded: 0, appearances: 8, avgRating: 8.9, motmCount: 3 },
      { name: "Kevin De Bruyne", club: "Manchester City", position: "CMF", age: 33, goals: 3, assists: 8, cleanSheets: 0, saves: 0, goalsConceded: 0, appearances: 8, avgRating: 8.8, motmCount: 2 },
      { name: "Mohamed Salah", club: "Liverpool", position: "RWF", age: 32, goals: 7, assists: 4, cleanSheets: 0, saves: 0, goalsConceded: 0, appearances: 8, avgRating: 8.8, motmCount: 2 },
      { name: "Harry Kane", club: "Bayern Munich", position: "CF", age: 31, goals: 7, assists: 3, cleanSheets: 0, saves: 0, goalsConceded: 0, appearances: 8, avgRating: 8.7, motmCount: 2 },
      { name: "Jamal Musiala", club: "Bayern Munich", position: "AMF", age: 21, goals: 5, assists: 5, cleanSheets: 0, saves: 0, goalsConceded: 0, appearances: 8, avgRating: 8.8, motmCount: 2 },
      { name: "Florian Wirtz", club: "Bayer Leverkusen", position: "AMF", age: 21, goals: 4, assists: 6, cleanSheets: 0, saves: 0, goalsConceded: 0, appearances: 8, avgRating: 8.7, motmCount: 1 },
      { name: "Arda Güler", club: "Real Madrid", position: "AMF", age: 19, goals: 3, assists: 4, cleanSheets: 0, saves: 0, goalsConceded: 0, appearances: 7, avgRating: 8.4, motmCount: 1 },
      { name: "Kobbie Mainoo", club: "Manchester City", position: "CMF", age: 19, goals: 2, assists: 3, cleanSheets: 0, saves: 0, goalsConceded: 0, appearances: 7, avgRating: 8.2, motmCount: 1 },
      { name: "Rodri", club: "Manchester City", position: "DMF", age: 28, goals: 2, assists: 4, cleanSheets: 4, saves: 0, goalsConceded: 0, appearances: 8, avgRating: 8.8, motmCount: 2 },
      { name: "Thibaut Courtois", club: "Real Madrid", position: "GK", age: 32, goals: 0, assists: 0, cleanSheets: 5, saves: 31, goalsConceded: 5, appearances: 8, avgRating: 8.6, motmCount: 1 },
      { name: "Ederson", club: "Manchester City", position: "GK", age: 31, goals: 0, assists: 0, cleanSheets: 4, saves: 26, goalsConceded: 7, appearances: 8, avgRating: 8.4, motmCount: 0 },
      { name: "David Raya", club: "Arsenal", position: "GK", age: 28, goals: 0, assists: 0, cleanSheets: 5, saves: 28, goalsConceded: 6, appearances: 8, avgRating: 8.5, motmCount: 1 },
      { name: "Alisson Becker", club: "Liverpool", position: "GK", age: 31, goals: 0, assists: 0, cleanSheets: 4, saves: 27, goalsConceded: 7, appearances: 8, avgRating: 8.4, motmCount: 0 },
      { name: "Virgil van Dijk", club: "Liverpool", position: "CB", age: 33, goals: 1, assists: 1, cleanSheets: 4, saves: 0, goalsConceded: 7, appearances: 8, avgRating: 8.3, motmCount: 1 },
      { name: "Antonio Rüdiger", club: "Real Madrid", position: "CB", age: 31, goals: 1, assists: 0, cleanSheets: 5, saves: 0, goalsConceded: 5, appearances: 8, avgRating: 8.4, motmCount: 1 },
      { name: "Achraf Hakimi", club: "Paris Saint-Germain", position: "RB", age: 25, goals: 2, assists: 3, cleanSheets: 3, saves: 0, goalsConceded: 8, appearances: 8, avgRating: 8.3, motmCount: 0 },
      { name: "Théo Hernandez", club: "AC Milan", position: "LB", age: 26, goals: 2, assists: 4, cleanSheets: 3, saves: 0, goalsConceded: 9, appearances: 8, avgRating: 8.3, motmCount: 1 }
    ];

    for (const s of seedStars) {
      if (!this.playerSeasonStats[s.name]) {
        this.playerSeasonStats[s.name] = {
          ...s,
          ratingTotal: s.avgRating * s.appearances
        };
      }
    }
  }

  // Calculate Ballon d'Or, Golden Glove, Golden Boot, Playmaker, and Golden Boy awards
  calculateSeasonAwards(roomTeams = {}) {
    if (Object.keys(this.playerSeasonStats).length < 5) {
      this.seedInitialPlayerStats();
    }

    const allPlayers = Object.values(this.playerSeasonStats);
    const div1Leader = this.divisions[1]?.standings?.[0]?.name || "Real Madrid";

    // 1. BALLON D'OR
    const rankedBallon = [...allPlayers].sort((a, b) => {
      const scoreA = (a.avgRating * 14) + (a.goals * 4) + (a.assists * 3) + (a.motmCount * 6) + (a.cleanSheets * 4) + (a.club === div1Leader ? 20 : 0);
      const scoreB = (b.avgRating * 14) + (b.goals * 4) + (b.assists * 3) + (b.motmCount * 6) + (b.cleanSheets * 4) + (b.club === div1Leader ? 20 : 0);
      return scoreB - scoreA;
    });

    const ballonWinner = rankedBallon[0] || allPlayers[0];
    const ballonTop5 = rankedBallon.slice(0, 5).map((p, idx) => ({
      rank: idx + 1,
      player: p.name,
      club: p.club,
      position: p.position,
      goals: p.goals,
      assists: p.assists,
      rating: p.avgRating,
      motm: p.motmCount,
      votesPct: idx === 0 ? 46.2 : Math.max(9.5, Math.round((30 - idx * 6 + Math.random() * 2) * 10) / 10),
      trophyBadge: idx === 0 ? "🏆 BALLON D'OR WINNER" : `#${idx + 1} Nominee`
    }));

    // 2. GOLDEN GLOVE (Yashin Trophy)
    const gks = allPlayers.filter(p => p.position === "GK" || p.saves > 0 || p.cleanSheets > 0);
    const rankedGk = [...gks].sort((a, b) => {
      const scoreA = (a.cleanSheets * 12) + (a.saves * 0.9) - (a.goalsConceded * 1.5) + (a.avgRating * 6);
      const scoreB = (b.cleanSheets * 12) + (b.saves * 0.9) - (b.goalsConceded * 1.5) + (b.avgRating * 6);
      return scoreB - scoreA;
    });
    const gloveWinner = rankedGk[0] || { name: "Thibaut Courtois", club: "Real Madrid", cleanSheets: 6, saves: 32, savePct: 88, goalsConceded: 5 };
    const gloveTop3 = rankedGk.slice(0, 3).map((g, idx) => ({
      rank: idx + 1,
      player: g.name,
      club: g.club,
      cleanSheets: g.cleanSheets,
      saves: g.saves,
      goalsConceded: g.goalsConceded,
      savePct: g.saves > 0 ? Math.min(96, Math.round((g.saves / (g.saves + g.goalsConceded + 0.1)) * 100)) : 85
    }));

    // 3. GOLDEN BOOT
    const rankedScorers = [...allPlayers].sort((a, b) => b.goals - a.goals || b.assists - a.assists);
    const bootWinner = rankedScorers[0] || { name: "Erling Haaland", club: "Manchester City", goals: 8, assists: 2 };
    const bootTop5 = rankedScorers.slice(0, 5).map((p, idx) => ({
      rank: idx + 1,
      player: p.name,
      club: p.club,
      goals: p.goals,
      assists: p.assists,
      position: p.position
    }));

    // 4. PLAYMAKER AWARD (Assists)
    const rankedAssists = [...allPlayers].sort((a, b) => b.assists - a.assists || b.avgRating - a.avgRating);
    const assistWinner = rankedAssists[0] || { name: "Kevin De Bruyne", club: "Manchester City", assists: 8 };
    const assistTop5 = rankedAssists.slice(0, 5).map((p, idx) => ({
      rank: idx + 1,
      player: p.name,
      club: p.club,
      assists: p.assists,
      goals: p.goals
    }));

    // 5. GOLDEN BOY (Best U-21 Star)
    const youngPlayers = allPlayers.filter(p => (p.age || 25) <= 21);
    const rankedYoung = [...youngPlayers].sort((a, b) => {
      const scoreA = (a.avgRating * 12) + (a.goals * 4) + (a.assists * 3);
      const scoreB = (b.avgRating * 12) + (b.goals * 4) + (b.assists * 3);
      return scoreB - scoreA;
    });
    const goldenBoyWinner = rankedYoung[0] || { name: "Lamine Yamal", club: "Barcelona", age: 17, goals: 5, assists: 7 };
    const goldenBoyTop3 = rankedYoung.slice(0, 3).map((p, idx) => ({
      rank: idx + 1,
      player: p.name,
      club: p.club,
      age: p.age,
      goals: p.goals,
      assists: p.assists,
      rating: p.avgRating
    }));

    // 6. TEAM OF THE SEASON (TOTS XI in 4-3-3)
    const totsXI = {
      formation: "4-3-3",
      gk: gloveWinner.player || gloveWinner.name,
      gkClub: gloveWinner.club,
      lb: allPlayers.find(p => p.position === "LB")?.name || "Théo Hernandez",
      cb1: allPlayers.find(p => p.position === "CB")?.name || "Virgil van Dijk",
      cb2: allPlayers.filter(p => p.position === "CB")?.[1]?.name || "Antonio Rüdiger",
      rb: allPlayers.find(p => p.position === "RB")?.name || "Achraf Hakimi",
      dmf: allPlayers.find(p => p.position === "DMF")?.name || "Rodri",
      cmf: assistWinner.player || assistWinner.name,
      amf: ballonWinner.name || "Jude Bellingham",
      lwf: allPlayers.find(p => ["LW", "LWF"].includes(p.position))?.name || "Vinicius Junior",
      cf: bootWinner.player || bootWinner.name,
      rwf: goldenBoyWinner.player || goldenBoyWinner.name
    };

    this.seasonAwards = {
      season: this.season,
      ballonDor: {
        winner: ballonWinner,
        podium: ballonTop5,
        quote: "Transcendent individual brilliance and commanding leadership across Europe's elite grounds."
      },
      goldenGlove: {
        winner: gloveWinner,
        podium: gloveTop3,
        quote: "An impregnable fortress between the posts, defying the laws of physics with jaw-dropping saves."
      },
      goldenBoot: {
        winner: bootWinner,
        podium: bootTop5
      },
      playmaker: {
        winner: assistWinner,
        podium: assistTop5
      },
      goldenBoy: {
        winner: goldenBoyWinner,
        podium: goldenBoyTop3,
        quote: "The teenage sensation taking world football by storm with daring dribbles and clutch end-product."
      },
      teamOfTheSeason: totsXI,
      calculatedAtRound: this.currentRound
    };

    return this.seasonAwards;
  }

  // Save jersey kit design and evaluate aesthetics score
  saveJerseyDesign(clubName, jerseyData = {}, roomTeams = {}) {
    if (!clubName) return { error: "Club name is required." };
    if (!this.jerseys[clubName]) {
      this.initClubExtras(clubName, 1, 80);
    }
    const current = this.jerseys[clubName] || DEFAULT_CLUB_JERSEYS[clubName] || {};
    const updatedJersey = {
      kitName: jerseyData.kitName || current.kitName || `${clubName} Kit`,
      primaryColor: jerseyData.primaryColor || current.primaryColor || "#1e3a8a",
      secondaryColor: jerseyData.secondaryColor || current.secondaryColor || "#ffffff",
      accentColor: jerseyData.accentColor || current.accentColor || "#f59e0b",
      pattern: jerseyData.pattern || current.pattern || "stripes",
      collarStyle: jerseyData.collarStyle || current.collarStyle || "crew",
      sponsor: jerseyData.sponsor !== undefined ? jerseyData.sponsor : (current.sponsor || "Fly Emirates"),
      badgeIcon: jerseyData.badgeIcon || current.badgeIcon || "⚽",
      numberColor: jerseyData.numberColor || current.numberColor || jerseyData.secondaryColor || "#ffffff"
    };

    const evalRes = evaluateJerseyAesthetics(updatedJersey);
    const completeKit = {
      ...updatedJersey,
      ...evalRes,
      updatedAt: new Date().toISOString(),
      lastUpdatedRound: this.currentRound
    };

    this.jerseys[clubName] = completeKit;

    return {
      success: true,
      clubName,
      jersey: completeKit
    };
  }

  // Get current jersey kit design for a club
  getJerseyDesign(clubName) {
    if (!this.jerseys[clubName]) {
      this.initClubExtras(clubName, 1, 80);
    }
    return this.jerseys[clubName];
  }

  // Get trophy celebration data for champion team
  getTrophyCeremonyData(roomTeams = {}) {
    this.sortStandings(1);
    const div1 = this.divisions[1].standings;
    const champ = div1[0];
    const championName = champ?.name || "Real Madrid";
    const awards = this.calculateSeasonAwards(roomTeams);

    return {
      season: this.season,
      champion: championName,
      championLogo: champ?.logo || "👑",
      points: champ?.points || 0,
      played: champ?.played || 0,
      won: champ?.won || 0,
      drawn: champ?.drawn || 0,
      lost: champ?.lost || 0,
      goalDifference: champ?.goalDifference || 0,
      trophyName: "Division 1 European Champions Cup",
      captainName: (roomTeams[championName]?.players?.[0]?.name) || (AI_STARS[championName]?.[0]) || "Team Captain",
      ballonWinner: awards.ballonDor.winner,
      goldenBootWinner: awards.goldenBoot.winner,
      goldenGloveWinner: awards.goldenGlove.winner,
      ceremonyQuote: "GLORY BECOMES LEGEND! Confetti rains from the stadium rafters as the captain lifts the prestigious trophy into the sky!"
    };
  }

  // Calculate promotion and relegation lists based on current standings, plus champion trophy ceremony
  calculateSeasonSummary(roomTeams = {}) {
    this.sortStandings(1);
    this.sortStandings(2);
    this.sortStandings(3);

    const div1 = this.divisions[1].standings;
    const div2 = this.divisions[2].standings;
    const div3 = this.divisions[3].standings;

    const champClub = div1[0];
    const champion = champClub?.name || "None";
    const awards = this.calculateSeasonAwards(roomTeams);

    // Division 1: bottom 2 relegated to Division 2
    const d1Relegated = div1.slice(4, 6).map(s => s.name);

    // Division 2: top 2 promoted to Division 1, bottom 2 relegated to Division 3
    const d2Promoted = div2.slice(0, 2).map(s => s.name);
    const d2Relegated = div2.slice(4, 6).map(s => s.name);

    // Division 3: top 2 promoted to Division 2
    const d3Promoted = div3.slice(0, 2).map(s => s.name);

    const trophyCeremony = {
      season: this.season,
      champion,
      championLogo: champClub?.logo || "👑",
      championPoints: champClub?.points || 0,
      championGoalDiff: champClub?.goalDifference || 0,
      won: champClub?.won || 0,
      drawn: champClub?.drawn || 0,
      lost: champClub?.lost || 0,
      trophyName: "Division 1 European Champions Cup",
      captainName: (roomTeams[champion]?.players?.[0]?.name) || (AI_STARS[champion]?.[0]) || "Team Captain",
      ballonWinner: awards.ballonDor.winner,
      goldenBootWinner: awards.goldenBoot.winner,
      goldenGloveWinner: awards.goldenGlove.winner,
      ceremonyQuote: "GLORY BECOMES LEGEND! The crowd erupts into thunderous applause as fireworks illuminate the night sky!"
    };

    return {
      season: this.season,
      champion,
      trophyCeremony,
      awards,
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
    const summary = this.calculateSeasonSummary(roomTeams);

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
      jerseys: this.jerseys,
      seasonAwards: this.seasonAwards || this.calculateSeasonAwards(),
      playerSeasonStats: this.playerSeasonStats,
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
