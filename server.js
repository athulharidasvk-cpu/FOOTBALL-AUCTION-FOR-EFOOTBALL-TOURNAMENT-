const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const fs = require("fs");

const SAVE_FILE_PATH = path.join(__dirname, "saved_game_progress.json");

const app = express();

// Enable CORS for all incoming requests (supports Render, local, and preview domains)
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;

// =====================================================
// PLAYER DATABASE
// =====================================================

const rawPlayers = require("./public/players.js");

// Remove duplicate players
const players = rawPlayers.filter(
  (player, index, array) =>
    index ===
    array.findIndex(
      p =>
        String(p.name).toLowerCase().trim() ===
        String(player.name).toLowerCase().trim()
    )
);

// =====================================================
// CONSTANTS
// =====================================================

// Small starter budget for Division 3 clubs (manageable & challenging)
const STARTING_BUDGET = 50;

const MAX_TEAMS = 12;

const MAX_SQUAD = 18;

const AUCTION_TIME = 20;

const BID_INCREMENT = 2;

// Contract settings
const CONTRACT_YEARS = 3;

// Example:
// Auction price = ₹180M
// Salary = ₹25M/year approximately
//
// Salary is calculated separately from auction price.
const SALARY_RATE = 0.1388889;

// Release clause:
// ₹180M auction price -> approximately ₹300M clause
const RELEASE_CLAUSE_MULTIPLIER = 1.6666667;

// =====================================================
// GAME SETTINGS & LEAGUE
// =====================================================

let currentSeason = 1;

let transferWindowOpen = true;
let transferWindowType = "summer"; // "summer" | "winter" | "closed"

const { LeagueManager, INITIAL_CLUBS } = require("./league.js");

const league = new LeagueManager(currentSeason);

// =====================================================
// ROOMS
// =====================================================

const rooms = {};

const GLOBAL_ROOM = "MAIN";

function initGlobalRoom() {
  rooms[GLOBAL_ROOM] = {
    host: null,

    teams: {},

    soldPlayers: new Set(),

    currentPlayer: null,

    currentBid: 0,

    currentBidder: null,

    auctionRunning: false,

    timer: AUCTION_TIME,

    timerInterval: null,

    isSoloMode: true
  };
}

// -----------------------------------------------------
// PERSISTENT PROGRESS SAVE & LOAD ENGINE
// -----------------------------------------------------

function saveGameProgressToFile() {
  try {
    const room = rooms[GLOBAL_ROOM];
    if (!room) return;

    const payload = {
      version: "1.1.0",
      savedAt: new Date().toISOString(),
      season: currentSeason,
      transferWindowOpen: transferWindowOpen,
      transferWindowType: transferWindowType,
      isSoloMode: Boolean(room.isSoloMode !== false),
      host: room.host,
      soldPlayers: Array.from(room.soldPlayers || []),
      teams: {}
    };

    for (const [name, t] of Object.entries(room.teams || {})) {
      payload.teams[name] = {
        budget: Number(t.budget) || STARTING_BUDGET,
        players: Array.isArray(t.players) ? t.players : [],
        season: t.season || currentSeason,
        transferOffers: Array.isArray(t.transferOffers) ? t.transferOffers : [],
        customLogo: t.customLogo || null,
        crestSvg: t.crestSvg || null,
        crestConfig: t.crestConfig || null,
        managerPhoto: t.managerPhoto || "/manager_photo.jpg",
        managerName: t.managerName || "Athul V V",
        lastSaved: new Date().toISOString()
      };
    }

    fs.writeFileSync(SAVE_FILE_PATH, JSON.stringify(payload, null, 2), "utf8");
  } catch (err) {
    console.error("Failed to save progress to file:", err.message);
  }
}

function loadGameProgressFromFile() {
  try {
    if (!fs.existsSync(SAVE_FILE_PATH)) return false;
    const content = fs.readFileSync(SAVE_FILE_PATH, "utf8");
    if (!content.trim()) return false;
    const data = JSON.parse(content);
    const room = rooms[GLOBAL_ROOM];
    if (!room) return false;

    if (Array.isArray(data.soldPlayers)) {
      room.soldPlayers = new Set(data.soldPlayers);
    }
    if (data.season) {
      currentSeason = Number(data.season) || 1;
    }
    if (typeof data.transferWindowOpen === "boolean") {
      transferWindowOpen = data.transferWindowOpen;
    }
    if (data.transferWindowType) {
      transferWindowType = data.transferWindowType;
    }
    if (typeof data.isSoloMode === "boolean") {
      room.isSoloMode = data.isSoloMode;
    }
    if (data.host) {
      room.host = data.host;
    }
    if (data.teams && typeof data.teams === "object") {
      for (const [tName, tData] of Object.entries(data.teams)) {
        const rawBudget = Number(tData.budget);
        const budgetVal = (Number.isFinite(rawBudget) && rawBudget > 0 && rawBudget <= 100) ? rawBudget : STARTING_BUDGET;
        room.teams[tName] = {
          budget: budgetVal,
          players: Array.isArray(tData.players) ? tData.players : [],
          socketId: null,
          season: tData.season || currentSeason,
          transferOffers: Array.isArray(tData.transferOffers) ? tData.transferOffers : [],
          customLogo: tData.customLogo || null,
          crestSvg: tData.crestSvg || null,
          crestConfig: tData.crestConfig || null,
          managerPhoto: tData.managerPhoto || "/manager_photo.jpg",
          managerName: tData.managerName || "Athul V V"
        };
      }
      console.log(`[SaveEngine] Restored ${Object.keys(room.teams).length} clubs and progress from disk.`);
    }
    return true;
  } catch (err) {
    console.error("Failed to load progress from file:", err.message);
    return false;
  }
}

initGlobalRoom();
loadGameProgressFromFile();

// =====================================================
// STATIC FILES
// =====================================================

app.use(express.json());

app.use(express.static(path.join(__dirname, "public")));
app.use("/d3", express.static(path.join(__dirname, "node_modules", "d3", "dist")));
app.use("/three", express.static(path.join(__dirname, "node_modules", "three", "build")));

// =====================================================
// HELPER FUNCTIONS
// =====================================================

function getRoom(socket) {
  return rooms[GLOBAL_ROOM] || null;
}

// -----------------------------------------------------
// NORMALIZE PLAYER NAME
// -----------------------------------------------------

function normalizeName(name) {
  return String(name || "")
    .toLowerCase()
    .trim();
}

// -----------------------------------------------------
// AVAILABLE PLAYERS
// -----------------------------------------------------

function getAvailablePlayers(room) {
  return players.filter(player => {
    const name = normalizeName(player.name);

    return !room.soldPlayers.has(name);
  });
}

// -----------------------------------------------------
// USER PURCHASING POWER & AFFORDABLE PLAYERS
// -----------------------------------------------------

function getUserPurchasingPower(room, requestingSocket) {
  const teams = room.teams || {};
  const teamEntries = Object.entries(teams);
  if (teamEntries.length === 0) return STARTING_BUDGET;

  // In Solo mode, the human manager's current budget is the active buying power
  if (room.isSoloMode !== false && requestingSocket?.teamName && teams[requestingSocket.teamName]) {
    const soloBudget = Number(teams[requestingSocket.teamName].budget);
    return Number.isFinite(soloBudget) ? Math.max(0, soloBudget) : STARTING_BUDGET;
  }

  // In Multiplayer mode, consider all active user teams' money (highest balance available to buy players)
  const budgets = teamEntries.map(([_, t]) => Number(t.budget) || 0);
  const maxBudget = Math.max(...budgets, 0);
  return maxBudget > 0 ? maxBudget : STARTING_BUDGET;
}

function getAffordablePlayers(room, maxBudget) {
  const available = getAvailablePlayers(room);
  const budgetCap = maxBudget !== undefined ? maxBudget : getUserPurchasingPower(room);
  return available.filter(player => (Number(player.base) || 5) <= budgetCap);
}

// -----------------------------------------------------
// ROUND NUMBER
// -----------------------------------------------------

function getPlayerContract(player, price) {
  const auctionPrice = Number(price) || 0;

  const salary = Math.max(
    1,
    Math.round(auctionPrice * SALARY_RATE)
  );

  const releaseClause = Math.max(
    auctionPrice,
    Math.round(
      auctionPrice * RELEASE_CLAUSE_MULTIPLIER
    )
  );

  return {
    startSeason: currentSeason,

    endSeason:
      currentSeason + CONTRACT_YEARS - 1,

    years: CONTRACT_YEARS,

    salary: salary,

    releaseClause: releaseClause,

    status: "active"
  };
}

// -----------------------------------------------------
// CREATE SOLD PLAYER
// -----------------------------------------------------

function createContractPlayer(player, price) {
  return {
    ...player,

    price: price,

    contract: getPlayerContract(
      player,
      price
    )
  };
}

// -----------------------------------------------------
// BASE STARTER TEAM GENERATOR (DIVISION 3 ROSTER)
// -----------------------------------------------------

function generateBaseStarterSquad(clubName, season) {
  const baseTemplates = [
    { name: "M. Hansen", pos: "GK", rat: 73, style: "Shot Stopper" },
    { name: "D. O'Connor", pos: "RB", rat: 72, style: "Offensive Fullback" },
    { name: "K. Lindberg", pos: "CB", rat: 74, style: "Build Up" },
    { name: "T. Diallo", pos: "CB", rat: 73, style: "Destroyer" },
    { name: "F. Rossi", pos: "LB", rat: 71, style: "Defensive Fullback" },
    { name: "A. Kovacic", pos: "DMF", rat: 74, style: "Anchor" },
    { name: "L. Becker", pos: "CMF", rat: 74, style: "Box to Box" },
    { name: "N. Tanaka", pos: "AMF", rat: 73, style: "Creative Playmaker" },
    { name: "S. Santos", pos: "RWF", rat: 74, style: "Speedster" },
    { name: "J. Morales", pos: "CF", rat: 74, style: "Target Man" },
    { name: "E. Larsson", pos: "LWF", rat: 73, style: "Inside Forward" },
    // Bench Substitutes
    { name: "C. Mendez", pos: "GK", rat: 69, style: "Shot Stopper" },
    { name: "H. Bauer", pos: "CB", rat: 70, style: "Build Up" },
    { name: "Y. Benali", pos: "CMF", rat: 71, style: "Orchestrator" }
  ];

  return baseTemplates.map(p => ({
    name: `${p.name}`,
    club: clubName,
    position: p.pos,
    rating: p.rat,
    base: 5,
    price: 5,
    style: p.style,
    isBaseStarter: true,
    contract: {
      startSeason: season,
      endSeason: season + CONTRACT_YEARS - 1,
      years: CONTRACT_YEARS,
      salary: 2,
      releaseClause: 15,
      status: "active"
    }
  }));
}

// =====================================================
// SOLO CAREER AI BIDDING ENGINE
// =====================================================

let aiBidTimeout = null;

function clearAiBidding() {
  if (aiBidTimeout) {
    clearTimeout(aiBidTimeout);
    aiBidTimeout = null;
  }
}

const AI_BIDDER_CLUBS = [
  "Real Madrid",
  "Manchester City",
  "Bayern Munich",
  "Paris Saint-Germain",
  "Arsenal",
  "Liverpool",
  "Borussia Dortmund",
  "Atletico Madrid",
  "Juventus",
  "AC Milan",
  "Bayer Leverkusen",
  "Ajax",
  "Benfica",
  "Sporting CP",
  "FC Porto",
  "Aston Villa"
];

function scheduleAiAuctionParticipation(roomCode) {
  clearAiBidding();
  const room = rooms[roomCode];
  if (!room || !room.auctionRunning || !room.currentPlayer) return;
  if (room.isSoloMode === false) return;

  const player = room.currentPlayer;
  const base = Number(player.base) || 10;
  const rating = Number(player.rating) || 80;

  // Formulate 2-3 interested AI rivals
  const shuffled = [...AI_BIDDER_CLUBS].sort(() => 0.5 - Math.random());
  const interestedClubs = shuffled.slice(0, 3).map(club => {
    // Valuation scaled by player tier
    const multiplier = rating >= 89 ? (1.4 + Math.random() * 0.6) : (1.1 + Math.random() * 0.45);
    return {
      name: club,
      maxVal: Math.max(base + BID_INCREMENT, Math.round(base * multiplier))
    };
  });

  function triggerNextAiBid() {
    clearAiBidding();
    if (!room.auctionRunning || !room.currentPlayer) return;

    // Thinking delay between 2000ms and 3800ms
    const delay = Math.floor(Math.random() * 1800) + 2000;
    aiBidTimeout = setTimeout(() => {
      if (!room.auctionRunning || !room.currentPlayer) return;

      const eligible = interestedClubs.filter(
        c => c.name !== room.currentBidder && c.maxVal >= room.currentBid + BID_INCREMENT
      );

      if (eligible.length > 0) {
        const bidder = eligible[Math.floor(Math.random() * eligible.length)];
        const newBid = room.currentBid + BID_INCREMENT;

        room.currentBid = newBid;
        room.currentBidder = bidder.name;
        room.timer = AUCTION_TIME;

        io.to(roomCode).emit("bidUpdate", {
          currentBid: room.currentBid,
          currentBidder: room.currentBidder,
          timer: room.timer,
          isAi: true
        });

        managerMessage(
          roomCode,
          `🤖 ${bidder.name} placed a counter-bid of ₹${newBid}M for ${room.currentPlayer.name}!`
        );

        broadcastState(roomCode);

        // Schedule another potential bid if another rival club wants to contest
        triggerNextAiBid();
      }
    }, delay);
  }

  triggerNextAiBid();
}

// -----------------------------------------------------
// FIND TEAM THAT OWNS PLAYER
// -----------------------------------------------------

function findPlayerOwner(room, playerName) {
  const target = normalizeName(playerName);

  for (const teamName in room.teams) {
    const team = room.teams[teamName];

    if (!team || !Array.isArray(team.players)) {
      continue;
    }

    const found = team.players.find(
      player =>
        normalizeName(player.name) ===
        target
    );

    if (found) {
      return {
        teamName,
        player: found
      };
    }
  }

  return null;
}

// -----------------------------------------------------
// FIND PLAYER IN TEAM
// -----------------------------------------------------

function findPlayerInTeam(team, playerName) {
  if (!team || !Array.isArray(team.players)) {
    return null;
  }

  const target = normalizeName(playerName);

  return team.players.find(
    player =>
      normalizeName(player.name) === target
  );
}

// -----------------------------------------------------
// GAME STATE
// -----------------------------------------------------

function getGameState(room) {
  return {
    teams: room.teams,

    currentPlayer: room.currentPlayer,

    currentBid: room.currentBid,

    currentBidder: room.currentBidder,

    auctionRunning: room.auctionRunning,

    timer: room.timer,

    totalPlayers: players.length,

    remainingPlayers:
      getAvailablePlayers(room).length,

    purchasingPower:
      getUserPurchasingPower(room),

    affordablePlayers:
      getAffordablePlayers(room).length,

    host: room.host,

    season: currentSeason,

    transferWindowOpen:
      transferWindowOpen,

    transferWindowType:
      transferWindowType,

    isSoloMode:
      Boolean(room.isSoloMode !== false),

    rules: {
      startingBudget: STARTING_BUDGET,

      maxTeams: MAX_TEAMS,

      maxSquad: MAX_SQUAD,

      auctionTime: AUCTION_TIME,

      bidIncrement: BID_INCREMENT,

      contractYears: CONTRACT_YEARS,

      salaryRate: SALARY_RATE,

      releaseClauseMultiplier:
        RELEASE_CLAUSE_MULTIPLIER
    }
  };
}

// -----------------------------------------------------
// BROADCAST STATE
// -----------------------------------------------------

function broadcastState(roomCode) {
  const room = rooms[roomCode];

  if (!room) return;

  io.to(roomCode).emit(
    "gameState",
    getGameState(room)
  );
}

// -----------------------------------------------------
// BROADCAST LEAGUE STATE
// -----------------------------------------------------

function broadcastLeagueState(roomCode = GLOBAL_ROOM) {
  const room = rooms[roomCode] || rooms[GLOBAL_ROOM];
  if (room) {
    league.syncUserClubs(room.teams);
  }
  io.to(roomCode).emit("leagueState", league.getLeagueState());
}

// -----------------------------------------------------
// MANAGER MESSAGE
// -----------------------------------------------------

function managerMessage(roomCode, message) {
  io.to(roomCode).emit(
    "managerMessage",
    message
  );
}

// -----------------------------------------------------
// STOP TIMER
// -----------------------------------------------------

function stopTimer(room) {
  clearAiBidding();
  if (room.timerInterval) {
    clearInterval(room.timerInterval);

    room.timerInterval = null;
  }
}

// -----------------------------------------------------
// START TIMER
// -----------------------------------------------------

function startTimer(roomCode) {
  const room = rooms[roomCode];

  if (!room) return;

  stopTimer(room);

  room.timer = AUCTION_TIME;

  room.timerInterval = setInterval(() => {
    room.timer--;

    io.to(roomCode).emit(
      "timerUpdate",
      room.timer
    );

    if (room.timer <= 0) {
      finishAuction(roomCode);
    }
  }, 1000);
}

// =====================================================
// FINISH AUCTION
// =====================================================

function finishAuction(roomCode) {
  const room = rooms[roomCode];

  if (!room) return;

  stopTimer(room);

  if (!room.currentPlayer) return;

  room.auctionRunning = false;

  // ===================================================
  // PLAYER SOLD
  // ===================================================

  if (
    room.currentBidder &&
    room.teams[room.currentBidder]
  ) {
    const team =
      room.teams[room.currentBidder];

    // Make sure budget is sufficient
    if (
      room.currentBid <= team.budget &&
      team.players.length < MAX_SQUAD
    ) {
      const price = room.currentBid;

      team.budget -= price;

      const contractPlayer =
        createContractPlayer(
          room.currentPlayer,
          price
        );

      team.players.push(
        contractPlayer
      );

      room.soldPlayers.add(
        normalizeName(
          room.currentPlayer.name
        )
      );

      io.to(roomCode).emit(
        "playerSold",
        {
          player:
            room.currentPlayer,

          team:
            room.currentBidder,

          price: price,

          contract:
            contractPlayer.contract
        }
      );

      managerMessage(
        roomCode,

        `🔨 SOLD! ${room.currentPlayer.name} joins ${room.currentBidder} for ₹${price}M! Contract: ${CONTRACT_YEARS} seasons, salary ₹${contractPlayer.contract.salary}M/year, release clause ₹${contractPlayer.contract.releaseClause}M.`
      );

      saveGameProgressToFile();
    } else {
      io.to(roomCode).emit(
        "playerUnsold",
        {
          player:
            room.currentPlayer
        }
      );

      managerMessage(
        roomCode,

        `${room.currentPlayer.name} could not be sold because the winning team cannot complete the deal.`
      );
    }
  }

  // ===================================================
  // PLAYER WON BY AI OPPONENT CLUB (SOLO CAREER)
  // ===================================================

  else if (room.currentBidder) {
    const price = room.currentBid;
    room.soldPlayers.add(
      normalizeName(room.currentPlayer.name)
    );

    io.to(roomCode).emit(
      "playerSold",
      {
        player: room.currentPlayer,
        team: room.currentBidder,
        price: price,
        isAi: true
      }
    );

    managerMessage(
      roomCode,
      `🔨 SOLD! ${room.currentPlayer.name} signs for ${room.currentBidder} for ₹${price}M in a major rival coup!`
    );

    saveGameProgressToFile();
  }

  // ===================================================
  // NO BID
  // ===================================================

  else {
    room.soldPlayers.add(
      normalizeName(
        room.currentPlayer.name
      )
    );

    io.to(roomCode).emit(
      "playerUnsold",
      {
        player:
          room.currentPlayer
      }
    );

    managerMessage(
      roomCode,

      `${room.currentPlayer.name} received no bids and is unsold.`
    );
  }

  // ===================================================
  // RESET CURRENT AUCTION
  // ===================================================

  room.currentPlayer = null;

  room.currentBid = 0;

  room.currentBidder = null;

  room.timer = 0;

  broadcastState(roomCode);
  broadcastLeagueState(roomCode);
}

// =====================================================
// SOCKET CONNECTION
// =====================================================

io.on("connection", socket => {
  console.log(
    "Player connected:",
    socket.id
  );

  // ===================================================
  // JOIN TEAM
  // ===================================================

  socket.on("joinTeam", data => {
    const teamName = String(
      data?.teamName || ""
    ).trim();

    if (!teamName) {
      socket.emit(
        "errorMessage",
        "Enter your team name."
      );

      return;
    }

    const room =
      rooms[GLOBAL_ROOM];

    // -------------------------------------------------
    // EXISTING TEAM
    // -------------------------------------------------

    if (room.teams[teamName]) {
      room.teams[teamName].socketId = socket.id;
      if (data?.customLogo) room.teams[teamName].customLogo = data.customLogo;
      if (data?.crestSvg) room.teams[teamName].crestSvg = data.crestSvg;
      if (data?.crestConfig) room.teams[teamName].crestConfig = data.crestConfig;
      if (data?.managerPhoto) room.teams[teamName].managerPhoto = data.managerPhoto;
      if (data?.managerName) room.teams[teamName].managerName = data.managerName;

      // If existing team has empty squad but client provided saved squad progress, restore it
      if (
        (!room.teams[teamName].players || room.teams[teamName].players.length === 0) &&
        data?.savedProgress?.players &&
        Array.isArray(data.savedProgress.players) &&
        data.savedProgress.players.length > 0
      ) {
        room.teams[teamName].players = data.savedProgress.players;
        if (data.savedProgress.budget !== undefined) {
          room.teams[teamName].budget = Number(data.savedProgress.budget) || room.teams[teamName].budget;
        }
        data.savedProgress.players.forEach(p => {
          if (p && p.name) room.soldPlayers.add(normalizeName(p.name));
        });
      }

      // If still empty squad, grant base starter squad
      if (!room.teams[teamName].players || room.teams[teamName].players.length === 0) {
        room.teams[teamName].players = generateBaseStarterSquad(teamName, currentSeason);
        room.teams[teamName].players.forEach(p => {
          if (p && p.name) room.soldPlayers.add(normalizeName(p.name));
        });
      }
    }

    // -------------------------------------------------
    // NEW TEAM
    // -------------------------------------------------

    else {
      if (
        Object.keys(room.teams).length >=
        MAX_TEAMS
      ) {
        socket.emit(
          "errorMessage",
          "This room is full."
        );

        return;
      }

      // Check if client provided saved progress for this team
      let initialBudget = STARTING_BUDGET;
      let initialPlayers = [];
      if (data?.savedProgress) {
        if (data.savedProgress.budget !== undefined) {
          const raw = Number(data.savedProgress.budget);
          // Migrate old 500M budget down to realistic small starting budget
          if (raw > 100) {
            initialBudget = STARTING_BUDGET;
          } else {
            initialBudget = (Number.isFinite(raw) && raw > 0) ? raw : STARTING_BUDGET;
          }
        }
        if (Array.isArray(data.savedProgress.players)) {
          initialPlayers = data.savedProgress.players;
          initialPlayers.forEach(p => {
            if (p && p.name) room.soldPlayers.add(normalizeName(p.name));
          });
        }
      }

      // Every new user team receives a Division 3 Base Starter Squad (14 players)
      if (initialPlayers.length === 0) {
        initialPlayers = generateBaseStarterSquad(teamName, currentSeason);
        initialPlayers.forEach(p => {
          if (p && p.name) room.soldPlayers.add(normalizeName(p.name));
        });
      }

      room.teams[teamName] = {
        budget: initialBudget,

        players: initialPlayers,

        socketId: socket.id,

        season: currentSeason,

        transferOffers: [],

        customLogo: data?.customLogo || null,
        crestSvg: data?.crestSvg || null,
        crestConfig: data?.crestConfig || null,
        managerPhoto: data?.managerPhoto || "/manager_photo.jpg",
        managerName: data?.managerName || "Athul V V"
      };
    }

    saveGameProgressToFile();

    // -------------------------------------------------
    // FIRST PLAYER BECOMES HOST
    // -------------------------------------------------

    // Host is tracked by TEAM NAME, not socket.id, so the host
    // keeps control after a reconnect / page refresh (socket.id
    // changes on every new connection, but the team name does not).
    if (!room.host) {
      room.host = teamName;
    }

    socket.join(GLOBAL_ROOM);

    socket.roomCode =
      GLOBAL_ROOM;

    socket.teamName =
      teamName;

    socket.emit(
      "teamJoined",
      {
        teamName,

        host:
          room.host === teamName
      }
    );

    managerMessage(
      GLOBAL_ROOM,

      `👋 ${teamName} has joined the auction!`
    );

    broadcastState(
      GLOBAL_ROOM
    );

    league.syncUserClubs(room.teams);
    broadcastLeagueState(GLOBAL_ROOM);

    console.log(
      `${teamName} joined the auction`
    );
  });

  // ===================================================
  // REQUEST CURRENT STATE
  // ===================================================

  socket.on(
    "requestState",
    () => {
      const room =
        getRoom(socket);

      if (!room) return;

      socket.emit(
        "gameState",
        getGameState(room)
      );
    }
  );

  // ===================================================
  // START AUCTION
  // ===================================================

  socket.on(
    "startAuction",
    () => {
      const room =
        getRoom(socket);

      if (!room) {
        socket.emit(
          "errorMessage",
          "Join a team first."
        );

        return;
      }

      // HOST ONLY
      if (
        room.host !==
        socket.teamName
      ) {
        socket.emit(
          "errorMessage",
          "Only the host can start the auction."
        );

        return;
      }

      if (!transferWindowOpen) {
        socket.emit(
          "errorMessage",
          "🔒 The Transfer Window & Auction are CLOSED during competitive league matchdays! Reinforcements can be signed when the market opens during the Winter Transfer Window (after Round 5) or Summer Transfer Window (Pre-Season)."
        );

        return;
      }

      if (
        room.auctionRunning
      ) {
        socket.emit(
          "errorMessage",
          "An auction is already running."
        );

        return;
      }

      const available =
        getAvailablePlayers(
          room
        );

      if (
        available.length === 0
      ) {
        managerMessage(
          socket.roomCode,

          "🏆 All players have been auctioned!"
        );

        return;
      }

      // Consider all user total money and make players appear who they can buy with their balance
      const userPurchasingPower = getUserPurchasingPower(room, socket);
      const affordableCandidates = getAffordablePlayers(room, userPurchasingPower);

      let chosenPlayer;
      if (affordableCandidates.length > 0) {
        // Pick from players who the manager(s) can actually buy with their balance
        const randomIndex = Math.floor(Math.random() * affordableCandidates.length);
        chosenPlayer = affordableCandidates[randomIndex];
      } else {
        // If current balance is lower than all remaining players (e.g. balance < 5M),
        // pick the lowest valuation talent so it's as accessible as possible
        const sorted = [...available].sort(
          (a, b) => (Number(a.base) || 5) - (Number(b.base) || 5)
        );
        chosenPlayer = sorted[0];
        managerMessage(
          socket.roomCode,
          `💡 Scouting Advisory: Your remaining treasury (₹${userPurchasingPower}M) is below market valuations. Displaying lowest available tier: ${chosenPlayer.name} (Base ₹${chosenPlayer.base}M). Generate revenue through matchdays or player sales to bid higher!`
        );
      }

      room.currentPlayer = chosenPlayer;

      room.currentBid =
        Number(
          room.currentPlayer.base
        ) || 5;

      room.currentBidder =
        null;

      room.auctionRunning =
        true;

      io.to(
        socket.roomCode
      ).emit(
        "newPlayer",
        {
          player:
            room.currentPlayer,

          startingBid:
            room.currentBid,

          affordable:
            (Number(room.currentPlayer.base) || 5) <= userPurchasingPower,

          userPurchasingPower:
            userPurchasingPower
        }
      );

      managerMessage(
        socket.roomCode,

        `🔥 ${room.currentPlayer.name} (${room.currentPlayer.position} • ${room.currentPlayer.rating} ⭐) is on the market! Starting bid: ₹${room.currentBid}M (Matched to your ₹${userPurchasingPower}M budget range).`
      );

      startTimer(
        socket.roomCode
      );

      if (room.isSoloMode !== false) {
        scheduleAiAuctionParticipation(socket.roomCode);
      }

      broadcastState(
        socket.roomCode
      );
    }
  );

  // ===================================================
  // PLACE BID
  // ===================================================

  socket.on(
    "placeBid",
    data => {
      const room =
        getRoom(socket);

      if (!room) {
        socket.emit(
          "errorMessage",
          "Join a team first."
        );

        return;
      }

      if (!transferWindowOpen) {
        socket.emit(
          "errorMessage",
          "🔒 The transfer window is currently closed."
        );

        return;
      }

      if (
        !room.auctionRunning ||
        !room.currentPlayer
      ) {
        socket.emit(
          "errorMessage",
          "No active auction."
        );

        return;
      }

      const teamName =
        socket.teamName;

      if (
        !teamName ||
        !room.teams[teamName]
      ) {
        socket.emit(
          "errorMessage",
          "Join a team before bidding."
        );

        return;
      }

      const team =
        room.teams[teamName];

      if (
        team.players.length >=
        MAX_SQUAD
      ) {
        socket.emit(
          "errorMessage",
          "Your squad is full."
        );

        return;
      }

      const amount =
        Number(data?.amount);

      if (
        !Number.isFinite(
          amount
        )
      ) {
        socket.emit(
          "errorMessage",
          "Enter a valid bid."
        );

        return;
      }

      if (
        amount <=
        room.currentBid
      ) {
        socket.emit(
          "errorMessage",

          `Bid must be higher than ₹${room.currentBid}M.`
        );

        return;
      }

      if (
        amount >
        team.budget
      ) {
        socket.emit(
          "errorMessage",

          `You only have ₹${team.budget}M remaining.`
        );

        return;
      }

      if (
        amount <
        room.currentBid +
        BID_INCREMENT
      ) {
        socket.emit(
          "errorMessage",

          `Minimum next bid is ₹${room.currentBid + BID_INCREMENT}M.`
        );

        return;
      }

      room.currentBid =
        amount;

      room.currentBidder =
        teamName;

      // Reset timer
      room.timer =
        AUCTION_TIME;

      io.to(
        socket.roomCode
      ).emit(
        "bidUpdate",
        {
          currentBid:
            room.currentBid,

          currentBidder:
            room.currentBidder,

          timer:
            room.timer
        }
      );

      // -------------------------------------------------
      // MANAGER REACTIONS
      // -------------------------------------------------

      const base =
        Number(
          room.currentPlayer.base
        ) || 5;

      if (
        amount >=
        base * 2.5
      ) {
        managerMessage(
          socket.roomCode,

          `⚠️ ${teamName}, that's a huge bid for ${room.currentPlayer.name}! Remember, you still need a complete squad.`
        );
      }

      else if (
        amount >=
        team.budget * 0.6
      ) {
        managerMessage(
          socket.roomCode,

          `🧠 Manager warning: ${teamName} is spending heavily. Choose your next players carefully!`
        );
      }

      if (room.isSoloMode !== false) {
        scheduleAiAuctionParticipation(socket.roomCode);
      }

      broadcastState(
        socket.roomCode
      );
    }
  );

  // ===================================================
  // SKIP PLAYER
  // ===================================================

  socket.on(
    "skipPlayer",
    () => {
      const room =
        getRoom(socket);

      if (!room) return;

      // HOST ONLY
      if (
        room.host !==
        socket.teamName
      ) {
        socket.emit(
          "errorMessage",

          "Only the host can skip a player."
        );

        return;
      }

      if (
        !room.auctionRunning ||
        !room.currentPlayer
      ) {
        return;
      }

      managerMessage(
        socket.roomCode,

        `${room.currentPlayer.name}'s auction was skipped.`
      );

      room.soldPlayers.add(
        normalizeName(
          room.currentPlayer.name
        )
      );

      room.currentPlayer =
        null;

      room.currentBid =
        0;

      room.currentBidder =
        null;

      room.auctionRunning =
        false;

      room.timer =
        0;

      stopTimer(room);

      broadcastState(
        socket.roomCode
      );
    }
  );

  // ===================================================
  // RESET GAME
  // ===================================================

  socket.on(
    "resetGame",
    () => {
      const room =
        getRoom(socket);

      if (!room) return;

      // HOST ONLY
      if (
        room.host !==
        socket.teamName
      ) {
        socket.emit(
          "errorMessage",

          "Only the host can reset the game."
        );

        return;
      }

      stopTimer(room);

      room.soldPlayers.clear();

      for (
        const teamName in
        room.teams
      ) {
        room.teams[
          teamName
        ].budget =
          STARTING_BUDGET;

        room.teams[
          teamName
        ].players = [];

        room.teams[
          teamName
        ].season =
          currentSeason;

        room.teams[
          teamName
        ].transferOffers = [];
      }

      room.currentPlayer =
        null;

      room.currentBid =
        0;

      room.currentBidder =
        null;

      room.auctionRunning =
        false;

      room.timer =
        AUCTION_TIME;

      currentSeason = 1;

      transferWindowOpen =
        true;

      managerMessage(
        socket.roomCode,

        `🔄 Auction reset! Every manager has ₹${STARTING_BUDGET}M again.`
      );

      league.initSeason(1, INITIAL_CLUBS);
      league.syncUserClubs(room.teams);

      broadcastState(
        socket.roomCode
      );

      broadcastLeagueState(
        socket.roomCode
      );
    }
  );

  // ===================================================
  // RENEW CONTRACT
  // ===================================================

  socket.on(
    "renewContract",
    data => {
      const room =
        getRoom(socket);

      if (!room) return;

      const teamName =
        socket.teamName;
      if (
        !teamName ||
        !room.teams[teamName]
      ) {
        socket.emit(
          "errorMessage",
          "Join your team first."
        );

        return;
      }

      const playerName =
        String(
          data?.playerName || ""
        ).trim();

      const team =
        room.teams[teamName];

      const player =
        findPlayerInTeam(
          team,
          playerName
        );

      if (!player) {
        socket.emit(
          "errorMessage",
          "Player not found in your squad."
        );

        return;
      }

      if (
        !player.contract
      ) {
        socket.emit(
          "errorMessage",
          "This player has no contract information."
        );

        return;
      }

      const requestedYears =
        Math.max(
          1,
          Math.min(
            5,
            Number(
              data?.years
            ) || CONTRACT_YEARS
          )
        );

      const requestedSalary =
        Math.max(
          1,
          Number(
            data?.salary
          ) ||
          player.contract.salary
        );

      // Contract renewal requires
      // salary to be affordable.
      if (
        requestedSalary >
        team.budget
      ) {
        socket.emit(
          "errorMessage",

          `Renewal salary is too high. Your available budget is ₹${team.budget}M.`
        );

        return;
      }

      player.contract = {
        startSeason:
          currentSeason,

        endSeason:
          currentSeason +
          requestedYears -
          1,

        years:
          requestedYears,

        salary:
          requestedSalary,

        releaseClause:
          Math.max(
            player.contract.releaseClause,

            Math.round(
              player.price *
              RELEASE_CLAUSE_MULTIPLIER
            )
          ),

        status:
          "active"
      };

      managerMessage(
        socket.roomCode,

        `📝 ${player.name} renewed with ${teamName} for ${requestedYears} seasons at ₹${requestedSalary}M/year.`
      );

      io.to(
        socket.roomCode
      ).emit(
        "contractRenewed",
        {
          team:
            teamName,

          player:
            player
        }
      );

      broadcastState(
        socket.roomCode
      );
    }
  );

  // ===================================================
  // TRANSFER OFFER
  // ===================================================

  socket.on(
    "transferOffer",
    data => {
      const room =
        getRoom(socket);

      if (!room) return;

      if (
        !transferWindowOpen
      ) {
        socket.emit(
          "errorMessage",
          "The transfer window is closed."
        );

        return;
      }

      const buyerTeamName =
        socket.teamName;

      const sellerTeamName =
        String(
          data?.sellerTeam || ""
        ).trim();

      const playerName =
        String(
          data?.playerName || ""
        ).trim();

      const amount =
        Number(
          data?.amount
        );

      if (
        !buyerTeamName ||
        !room.teams[
          buyerTeamName
        ]
      ) {
        socket.emit(
          "errorMessage",
          "Join your team first."
        );

        return;
      }

      if (
        !sellerTeamName ||
        !room.teams[
          sellerTeamName
        ]
      ) {
        socket.emit(
          "errorMessage",
          "Seller team not found."
        );

        return;
      }

      if (
        buyerTeamName ===
        sellerTeamName
      ) {
        socket.emit(
          "errorMessage",
          "You cannot buy your own player."
        );

        return;
      }

      if (
        !Number.isFinite(
          amount
        ) ||
        amount <= 0
      ) {
        socket.emit(
          "errorMessage",
          "Enter a valid transfer fee."
        );

        return;
      }

      const seller =
        room.teams[
          sellerTeamName
        ];

      const buyer =
        room.teams[
          buyerTeamName
        ];

      const player =
        findPlayerInTeam(
          seller,
          playerName
        );

      if (!player) {
        socket.emit(
          "errorMessage",
          "That player is not owned by the selected team."
        );

        return;
      }

      if (
        buyer.players.length >=
        MAX_SQUAD
      ) {
        socket.emit(
          "errorMessage",
          "Your squad is full."
        );

        return;
      }

      if (
        amount >
        buyer.budget
      ) {
        socket.emit(
          "errorMessage",

          `You only have ₹${buyer.budget}M available.`
        );

        return;
      }

      const offer = {
        id:
          `${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 8)}`,

        from:
          buyerTeamName,

        to:
          sellerTeamName,

        playerName:
          player.name,

        amount:
          amount,

        season:
          currentSeason,

        status:
          "pending",

        createdAt:
          new Date().toISOString()
      };

      seller.transferOffers.push(
        offer
      );

      // Confirm to the buyer specifically that their offer went out.
      socket.emit(
        "transferOfferSent",
        {
          seller: sellerTeamName,
          playerName: player.name,
          amount: amount
        }
      );

      managerMessage(
        GLOBAL_ROOM,

        `📨 ${buyerTeamName} offered ₹${amount}M for ${player.name} from ${sellerTeamName}.`
      );

      io.to(
        GLOBAL_ROOM
      ).emit(
        "transferOfferReceived",
        offer
      );

      broadcastState(
        GLOBAL_ROOM
      );
    }
  );

  // ===================================================
  // ACCEPT TRANSFER
  // ===================================================

  socket.on(
    "acceptTransfer",
    data => {
      const room =
        getRoom(socket);

      if (!room) return;

      if (
        !transferWindowOpen
      ) {
        socket.emit(
          "errorMessage",
          "The transfer window is closed."
        );

        return;
      }

      const sellerTeamName =
        socket.teamName;

      const offerId =
        String(
          data?.offerId || ""
        );

      if (
        !sellerTeamName ||
        !room.teams[
          sellerTeamName
        ]
      ) {
        socket.emit(
          "errorMessage",
          "Join your team first."
        );

        return;
      }

      const seller =
        room.teams[
          sellerTeamName
        ];

      const offerIndex =
        seller.transferOffers.findIndex(
          offer =>
            offer.id ===
            offerId &&
            offer.status ===
            "pending"
        );

      if (
        offerIndex === -1
      ) {
        socket.emit(
          "errorMessage",
          "Transfer offer not found."
        );

        return;
      }

      const offer =
        seller.transferOffers[
          offerIndex
        ];

      const buyer =
        room.teams[
          offer.from
        ];

      if (!buyer) {
        socket.emit(
          "errorMessage",
          "Buying team no longer exists."
        );

        return;
      }

      if (
        buyer.budget <
        offer.amount
      ) {
        socket.emit(
          "errorMessage",
          "The buying team no longer has enough budget."
        );

        offer.status =
          "failed";

        return;
      }

      if (
        buyer.players.length >=
        MAX_SQUAD
      ) {
        socket.emit(
          "errorMessage",
          "The buying squad is full."
        );

        offer.status =
          "failed";

        return;
      }

      const player =
        findPlayerInTeam(
          seller,
          offer.playerName
        );

      if (!player) {
        socket.emit(
          "errorMessage",
          "Player is no longer available."
        );

        offer.status =
          "failed";

        return;
      }

      // ------------------------------------------------
      // COMPLETE TRANSFER
      // ------------------------------------------------

      seller.players =
        seller.players.filter(
          p =>
            normalizeName(
              p.name
            ) !==
            normalizeName(
              offer.playerName
            )
        );

      buyer.budget -=
        offer.amount;

      seller.budget +=
        offer.amount;

      player.contract =
        player.contract || {};

      player.contract.status =
        "active";

      buyer.players.push(
        player
      );

      offer.status =
        "accepted";

      managerMessage(
        GLOBAL_ROOM,

        `✅ TRANSFER COMPLETE! ${player.name} moves from ${sellerTeamName} to ${offer.from} for ₹${offer.amount}M.`
      );

      io.to(
        GLOBAL_ROOM
      ).emit(
        "transferCompleted",
        {
          player:
            player,

          from:
            sellerTeamName,

          to:
            offer.from,

          amount:
            offer.amount
        }
      );

      seller.transferOffers.splice(
        offerIndex,
        1
      );

      broadcastState(
        GLOBAL_ROOM
      );
    }
  );

  // ===================================================
  // REJECT TRANSFER
  // ===================================================

  socket.on(
    "rejectTransfer",
    data => {
      const room =
        getRoom(socket);

      if (!room) return;

      const sellerTeamName =
        socket.teamName;

      const offerId =
        String(
          data?.offerId || ""
        );

      if (
        !sellerTeamName ||
        !room.teams[
          sellerTeamName
        ]
      ) {
        return;
      }

      const seller =
        room.teams[
          sellerTeamName
        ];

      const offerIndex =
        seller.transferOffers.findIndex(
          offer =>
            offer.id ===
            offerId &&
            offer.status ===
            "pending"
        );

      if (
        offerIndex === -1
      ) {
        socket.emit(
          "errorMessage",
          "Transfer offer not found."
        );

        return;
      }

      const offer =
        seller.transferOffers[
          offerIndex
        ];

      offer.status =
        "rejected";

      managerMessage(
        GLOBAL_ROOM,

        `❌ ${sellerTeamName} rejected the ₹${offer.amount}M offer for ${offer.playerName}.`
      );

      io.to(
        GLOBAL_ROOM
      ).emit(
        "transferRejected",
        offer
      );

      seller.transferOffers.splice(
        offerIndex,
        1
      );

      broadcastState(
        GLOBAL_ROOM
      );
    }
  );

  // ===================================================
  // RELEASE CLAUSE BUY
  // ===================================================

  socket.on(
    "releaseClauseBuy",
    data => {
      const room =
        getRoom(socket);

      if (!room) return;

      if (
        !transferWindowOpen
      ) {
        socket.emit(
          "errorMessage",
          "The transfer window is closed."
        );

        return;
      }

      const buyerTeamName =
        socket.teamName;

      const playerName =
        String(
          data?.playerName || ""
        ).trim();

      if (
        !buyerTeamName ||
        !room.teams[
          buyerTeamName
        ]
      ) {
        socket.emit(
          "errorMessage",
          "Join your team first."
        );

        return;
      }

      const buyer =
        room.teams[
          buyerTeamName
        ];

      const owner =
        findPlayerOwner(
          room,
          playerName
        );

      if (!owner) {
        socket.emit(
          "errorMessage",
          "Player owner not found."
        );

        return;
      }

      if (
        owner.teamName ===
        buyerTeamName
      ) {
        socket.emit(
          "errorMessage",
          "You already own this player."
        );

        return;
      }

      const player =
        owner.player;

      const clause =
        Number(
          player.contract?.releaseClause
        ) || 0;

      if (clause <= 0) {
        socket.emit(
          "errorMessage",
          "This player has no valid release clause."
        );

        return;
      }

      if (
        buyer.budget <
        clause
      ) {
        socket.emit(
          "errorMessage",

          `You need ₹${clause}M to activate this release clause.`
        );

        return;
      }

      if (
        buyer.players.length >=
        MAX_SQUAD
      ) {
        socket.emit(
          "errorMessage",
          "Your squad is full."
        );

        return;
      }

      // ------------------------------------------------
      // TRANSFER
      // ------------------------------------------------

      const seller =
        room.teams[
          owner.teamName
        ];

      seller.players =
        seller.players.filter(
          p =>
            normalizeName(
              p.name
            ) !==
            normalizeName(
              player.name
            )
        );

      buyer.budget -=
        clause;

      seller.budget +=
        clause;

      player.contract.status =
        "active";

      buyer.players.push(
        player
      );

      managerMessage(
        GLOBAL_ROOM,

        `💥 RELEASE CLAUSE ACTIVATED! ${player.name} moves from ${owner.teamName} to ${buyerTeamName} for ₹${clause}M.`
      );

      io.to(
        GLOBAL_ROOM
      ).emit(
        "transferCompleted",
        {
          player:
            player,

          from:
            owner.teamName,

          to:
            buyerTeamName,

          amount:
            clause,

          releaseClause:
            true
        }
      );

      broadcastState(
        GLOBAL_ROOM
      );
    }
  );

  // ===================================================
  // SET TRANSFER WINDOW
  // ===================================================

  socket.on(
    "setTransferWindow",
    data => {
      const room =
        getRoom(socket);

      if (!room) return;

      if (
        room.host !==
        socket.teamName
      ) {
        socket.emit(
          "errorMessage",
          "Only the host can change the transfer window."
        );

        return;
      }

      transferWindowOpen =
        Boolean(
          data?.open
        );

      managerMessage(
        GLOBAL_ROOM,

        transferWindowOpen
          ? "🟢 Transfer window is now OPEN."
          : "🔴 Transfer window is now CLOSED."
      );

      broadcastState(
        GLOBAL_ROOM
      );
    }
  );

  // ===================================================
  // NEXT SEASON
  // ===================================================

  socket.on(
    "nextSeason",
    () => {
      const room =
        getRoom(socket);

      if (!room) return;

      if (
        room.host !==
        socket.teamName
      ) {
        socket.emit(
          "errorMessage",
          "Only the host can start the next season."
        );

        return;
      }

      if (
        room.auctionRunning
      ) {
        socket.emit(
          "errorMessage",
          "Finish the current auction first."
        );

        return;
      }

      // ------------------------------------------------
      // MOVE TO NEXT SEASON
      // ------------------------------------------------

      currentSeason++;

      transferWindowOpen =
        true;

      // ------------------------------------------------
      // CONTRACT CHECK
      // ------------------------------------------------

      for (
        const teamName in
        room.teams
      ) {
        const team =
          room.teams[
            teamName
          ];

        const expiredPlayers =
          [];

        for (
          const player of
          team.players
        ) {
          if (
            player.contract &&
            currentSeason >
            player.contract.endSeason
          ) {
            player.contract.status =
              "expired";

            expiredPlayers.push(
              player
            );
          }
        }

        // Remove expired players
        for (
          const expired of
          expiredPlayers
        ) {
          team.players =
            team.players.filter(
              player =>
                normalizeName(
                  player.name
                ) !==
                normalizeName(
                  expired.name
                )
            );

          managerMessage(
            GLOBAL_ROOM,

            `📄 ${expired.name}'s contract with ${teamName} has expired. The player is now a free agent.`
          );
        }

        // Clear old transfer offers
        team.transferOffers =
          [];
      }

      managerMessage(
        GLOBAL_ROOM,

        `🌍 SEASON ${currentSeason} has begun! Transfer window is OPEN.`
      );

      league.advanceToNextSeason(currentSeason, room.teams);

      io.to(
        GLOBAL_ROOM
      ).emit(
        "seasonChanged",
        {
          season:
            currentSeason,

          transferWindowOpen:
            transferWindowOpen
        }
      );

      broadcastState(
        GLOBAL_ROOM
      );

      broadcastLeagueState(
        GLOBAL_ROOM
      );
    }
  );

  // ===================================================
  // GET TEAM CONTRACTS
  // ===================================================

  socket.on(
    "getContracts",
    () => {
      const room =
        getRoom(socket);

      if (!room) return;

      const teamName =
        socket.teamName;

      if (
        !teamName ||
        !room.teams[
          teamName
        ]
      ) {
        socket.emit(
          "errorMessage",
          "Join a team first."
        );

        return;
      }

      const team =
        room.teams[
          teamName
        ];

      socket.emit(
        "contracts",
        {
          team:
            teamName,

          season:
            currentSeason,

          players:
            team.players.map(
              player => ({
                name:
                  player.name,

                price:
                  player.price,

                contract:
                  player.contract ||
                  null
              })
            )
        }
      );
    }
  );

  // ===================================================
  // GET TRANSFER OFFERS
  // ===================================================

  socket.on(
    "getTransferOffers",
    () => {
      const room =
        getRoom(socket);

      if (!room) return;

      const teamName =
        socket.teamName;

      if (
        !teamName ||
        !room.teams[
          teamName
        ]
      ) {
        socket.emit(
          "errorMessage",
          "Join a team first."
        );

        return;
      }

      socket.emit(
        "transferOffers",
        room.teams[
          teamName
        ].transferOffers
      );
    }
  );

  // ===================================================
  // DISCONNECT
  // ===================================================

  socket.on(
    "disconnect",
    () => {
      console.log(
        "Player disconnected:",
        socket.id
      );

      const room =
        getRoom(socket);

      if (!room) return;

      if (
        socket.teamName &&
        room.teams[
          socket.teamName
        ]
      ) {
        room.teams[
          socket.teamName
        ].socketId =
          null;
      }

      broadcastState(
        socket.roomCode ||
        GLOBAL_ROOM
      );
    }
  );

  // ===================================================
  // LEAGUE SOCKET EVENTS
  // ===================================================

  socket.on("requestLeagueState", () => {
    const room = getRoom(socket);
    if (room) {
      league.syncUserClubs(room.teams);
    }
    socket.emit("leagueState", league.getLeagueState());
  });

  // HOST-ONLY ROUND SIMULATION
  socket.on("simulateLeagueRound", () => {
    const room = getRoom(socket);
    if (!room) {
      socket.emit("errorMessage", "Join a team first.");
      return;
    }

    if (room.host !== socket.teamName) {
      socket.emit("errorMessage", "Only the host can simulate league matches.");
      return;
    }

    const res = league.simulateCurrentRound(room.teams);
    if (res.error) {
      socket.emit("errorMessage", res.error);
      return;
    }

    io.to(GLOBAL_ROOM).emit("leagueRoundSimulated", {
      round: res.round,
      matches: res.matches,
      rivalryMatches: res.rivalryMatches || [],
      isSeasonComplete: res.isSeasonComplete,
      seasonSummary: res.seasonSummary
    });

    // Automatic Transfer Window scheduling across the season:
    if (res.round === 1) {
      transferWindowOpen = false;
      transferWindowType = "closed";
      managerMessage(
        GLOBAL_ROOM,
        "🔒 Round 1 is underway! The Summer Transfer Window has CLOSED for the league season."
      );
    } else if (res.round === 5 && !res.isSeasonComplete) {
      transferWindowOpen = true;
      transferWindowType = "winter";
      managerMessage(
        GLOBAL_ROOM,
        "❄️ MID-SEASON BREAK! The WINTER TRANSFER WINDOW is now OPEN! Squad reinforcements and auctions unlocked!"
      );
    } else if (res.round === 6) {
      transferWindowOpen = false;
      transferWindowType = "closed";
      managerMessage(
        GLOBAL_ROOM,
        "🔒 Round 6 kicks off! The Winter Transfer Window has CLOSED for the championship run-in."
      );
    }

    if (res.isSeasonComplete) {
      transferWindowOpen = true;
      transferWindowType = "summer";
      managerMessage(
        GLOBAL_ROOM,
        "☀️ Campaign complete! The SUMMER TRANSFER WINDOW is OPEN for the upcoming season!"
      );
    }

    io.to(GLOBAL_ROOM).emit("transferWindowState", {
      transferWindowOpen,
      transferWindowType
    });

    broadcastLeagueState(GLOBAL_ROOM);
    broadcastState(GLOBAL_ROOM);
    saveGameProgressToFile();

    if (res.rivalryMatches && res.rivalryMatches.length > 0) {
      const topDerby = res.rivalryMatches[0];
      managerMessage(
        GLOBAL_ROOM,
        `🔥 ARCH RIVALS DRAMA: ${topDerby.homeTeam} ${topDerby.homeScore} - ${topDerby.awayScore} ${topDerby.awayTeam} in ${topDerby.derbyName}! Absolute passion on the pitch!`
      );
    } else {
      managerMessage(
        GLOBAL_ROOM,
        `⚽ Round ${res.round} simulated across all divisions!`
      );
    }

    if (res.isSeasonComplete && res.seasonSummary) {
      managerMessage(
        GLOBAL_ROOM,
        `🏆 Season ${res.seasonSummary.season} Finished! Champion: ${res.seasonSummary.champion}! Review final tables for promotion & relegation.`
      );
    }
  });

  // HOST-ONLY FULL SEASON SIMULATION
  socket.on("simulateFullSeason", () => {
    const room = getRoom(socket);
    if (!room) {
      socket.emit("errorMessage", "Join a team first.");
      return;
    }

    if (room.host !== socket.teamName) {
      socket.emit("errorMessage", "Only the host can simulate league matches.");
      return;
    }

    const res = league.simulateFullSeason(room.teams);
    transferWindowOpen = true;
    transferWindowType = "summer";

    io.to(GLOBAL_ROOM).emit("transferWindowState", {
      transferWindowOpen,
      transferWindowType
    });

    broadcastLeagueState(GLOBAL_ROOM);
    broadcastState(GLOBAL_ROOM);
    saveGameProgressToFile();

    managerMessage(
      GLOBAL_ROOM,
      `⚽ Full league season simulated! ${res.totalMatchesSimulated} matches completed. Summer Transfer Window is OPEN!`
    );

    if (res.seasonSummary) {
      managerMessage(
        GLOBAL_ROOM,
        `🏆 Champion: ${res.seasonSummary.champion}! Final promotion & relegation positions locked.`
      );
    }
  });

  // HOST-ONLY ADVANCE TO NEXT LEAGUE SEASON (APPLY PROMOTION & RELEGATION)
  socket.on("advanceLeagueSeason", () => {
    const room = getRoom(socket);
    if (!room) {
      socket.emit("errorMessage", "Join a team first.");
      return;
    }

    if (room.host !== socket.teamName) {
      socket.emit("errorMessage", "Only the host can advance to the next season.");
      return;
    }

    currentSeason++;
    const res = league.advanceToNextSeason(currentSeason, room.teams);
    transferWindowOpen = true;
    transferWindowType = "summer";

    managerMessage(
      GLOBAL_ROOM,
      `🌍 Welcome to Season ${currentSeason}! Promotions and relegations applied. Summer Transfer Window is OPEN!`
    );

    io.to(GLOBAL_ROOM).emit("seasonChanged", {
      season: currentSeason,
      transferWindowOpen: transferWindowOpen,
      transferWindowType: transferWindowType
    });

    io.to(GLOBAL_ROOM).emit("transferWindowState", {
      transferWindowOpen,
      transferWindowType
    });

    broadcastState(GLOBAL_ROOM);
    broadcastLeagueState(GLOBAL_ROOM);
    saveGameProgressToFile();
  });

  // ===================================================
  // SET GAME PLAY MODE (SOLO VS MULTIPLAYER)
  // ===================================================
  socket.on("setGameMode", data => {
    const room = getRoom(socket);
    if (!room) return;
    const isSolo = data?.mode === "solo";
    room.isSoloMode = isSolo;
    managerMessage(
      GLOBAL_ROOM,
      isSolo
        ? "🎮 Solo Career Mode Active: AI manager algorithms will contest auctions, submit bids, and compete across Division 1, 2, and 3."
        : "👥 Multiplayer Mode Active: Real connected managers participate in the auction room."
    );
    broadcastState(GLOBAL_ROOM);
    saveGameProgressToFile();
  });

  // ===================================================
  // TOGGLE TRANSFER WINDOW (HOST OVERRIDE)
  // ===================================================
  socket.on("toggleTransferWindow", () => {
    const room = getRoom(socket);
    if (!room) return;
    if (room.host && room.host !== socket.teamName) {
      socket.emit("errorMessage", "Only the executive host manager can toggle the transfer window.");
      return;
    }

    transferWindowOpen = !transferWindowOpen;
    if (transferWindowOpen) {
      transferWindowType = league.currentRound > 5 ? "winter" : "summer";
      managerMessage(
        GLOBAL_ROOM,
        `🟢 Transfer Window & Auction manually OPENED (${transferWindowType === "winter" ? "Winter" : "Summer"} Window).`
      );
    } else {
      transferWindowType = "closed";
      managerMessage(
        GLOBAL_ROOM,
        "🔴 Transfer Window & Auction manually CLOSED for league matchdays."
      );
    }

    io.to(GLOBAL_ROOM).emit("transferWindowState", {
      transferWindowOpen,
      transferWindowType
    });
    broadcastState(GLOBAL_ROOM);
    saveGameProgressToFile();
  });

  // ===================================================
  // STADIUM MANAGEMENT OPERATIONS
  // ===================================================

  socket.on("repairPitch", (data) => {
    const room = getRoom(socket);
    if (!room) {
      socket.emit("errorMessage", "Join a team first.");
      return;
    }
    const teamName = (data && data.teamName) || socket.teamName;
    if (!teamName) {
      socket.emit("errorMessage", "Invalid club specification.");
      return;
    }

    const res = league.repairPitch(teamName, room.teams);
    if (res.error) {
      socket.emit("errorMessage", res.error);
      return;
    }

    broadcastState(GLOBAL_ROOM);
    broadcastLeagueState(GLOBAL_ROOM);
    socket.emit("stadiumActionSuccess", res);
    managerMessage(GLOBAL_ROOM, `🏟️ ${teamName} completed pitch renovation! Stadium pitch restored to 100% pristine condition.`);
  });

  socket.on("expandStadium", (data) => {
    const room = getRoom(socket);
    if (!room) {
      socket.emit("errorMessage", "Join a team first.");
      return;
    }
    const teamName = (data && data.teamName) || socket.teamName;
    if (!teamName) {
      socket.emit("errorMessage", "Invalid club specification.");
      return;
    }

    const res = league.expandStadium(teamName, room.teams);
    if (res.error) {
      socket.emit("errorMessage", res.error);
      return;
    }

    broadcastState(GLOBAL_ROOM);
    broadcastLeagueState(GLOBAL_ROOM);
    socket.emit("stadiumActionSuccess", res);
    managerMessage(GLOBAL_ROOM, `🏗️ ${teamName} expanded stadium capacity to ${res.stadium.capacity.toLocaleString()} seats!`);
  });

  socket.on("upgradeFacilities", (data) => {
    const room = getRoom(socket);
    if (!room) {
      socket.emit("errorMessage", "Join a team first.");
      return;
    }
    const teamName = (data && data.teamName) || socket.teamName;
    if (!teamName) {
      socket.emit("errorMessage", "Invalid club specification.");
      return;
    }

    const res = league.upgradeFacilities(teamName, room.teams);
    if (res.error) {
      socket.emit("errorMessage", res.error);
      return;
    }

    broadcastState(GLOBAL_ROOM);
    broadcastLeagueState(GLOBAL_ROOM);
    socket.emit("stadiumActionSuccess", res);
    managerMessage(GLOBAL_ROOM, `⭐ ${teamName} upgraded facilities to Level ${res.stadium.facilitiesLevel}! Merchandise sales will increase.`);
  });

  // ===================================================
  // MANAGER HIRING & REPLACEMENT
  // ===================================================

  socket.on("hireManager", (data) => {
    const room = getRoom(socket);
    if (!room) {
      socket.emit("errorMessage", "Join a team first.");
      return;
    }
    const teamName = (data && data.teamName) || socket.teamName;
    const managerId = data && data.managerId;
    if (!teamName || !managerId) {
      socket.emit("errorMessage", "Select a manager candidate to hire.");
      return;
    }

    const res = league.hireManager(teamName, managerId, room.teams);
    if (res.error) {
      socket.emit("errorMessage", res.error);
      return;
    }

    broadcastState(GLOBAL_ROOM);
    broadcastLeagueState(GLOBAL_ROOM);
    socket.emit("managerHiredSuccess", res);
    managerMessage(GLOBAL_ROOM, `👔 BREAKING: ${teamName} has appointed ${res.manager.name} as Manager! Perk: ${res.manager.perk.name} activated.`);
  });

  // ===================================================
  // CUSTOM TEAM CREST & LOGO IDENTITY
  // ===================================================

  socket.on("updateTeamLogo", (data) => {
    const room = getRoom(socket);
    if (!room) return;
    const teamName = (data && data.teamName) || socket.teamName;
    if (!teamName || !room.teams[teamName]) return;

    if (data.customLogo) room.teams[teamName].customLogo = data.customLogo;
    if (data.crestSvg) room.teams[teamName].crestSvg = data.crestSvg;
    if (data.crestConfig) room.teams[teamName].crestConfig = data.crestConfig;

    league.syncUserClubs(room.teams);
    broadcastState(GLOBAL_ROOM);
    broadcastLeagueState(GLOBAL_ROOM);
    socket.emit("teamLogoUpdated", { teamName, customLogo: data.customLogo, crestSvg: data.crestSvg });
    managerMessage(GLOBAL_ROOM, `🎨 ${teamName} unveiled their new official club crest and visual identity!`);
  });

  // ===================================================
  // CUSTOM MANAGER PORTRAIT PHOTO
  // ===================================================

  socket.on("updateManagerPhoto", (data) => {
    const room = getRoom(socket);
    if (!room) return;
    const teamName = (data && data.teamName) || socket.teamName;
    if (!teamName || !room.teams[teamName]) return;

    if (data.managerPhoto) {
      room.teams[teamName].managerPhoto = data.managerPhoto;
      if (league.managers[teamName]) {
        league.managers[teamName].photo = data.managerPhoto;
      }
    }

    broadcastState(GLOBAL_ROOM);
    broadcastLeagueState(GLOBAL_ROOM);
    socket.emit("managerPhotoUpdated", { teamName, managerPhoto: data.managerPhoto });
    managerMessage(GLOBAL_ROOM, `📸 ${teamName} updated their head coach official touchline portrait!`);
  });

  // ===================================================
  // PLAYER INJURY REHABILITATION & MEDICAL WARD
  // ===================================================

  socket.on("acceleratePlayerRehab", (data) => {
    const room = getRoom(socket);
    if (!room) return;
    const teamName = (data && data.teamName) || socket.teamName;
    const injuryId = data && data.injuryId;
    if (!teamName || !injuryId) return;

    const res = league.accelerateRehab(teamName, injuryId, room.teams);
    if (res.error) {
      socket.emit("errorMessage", res.error);
      return;
    }

    broadcastState(GLOBAL_ROOM);
    broadcastLeagueState(GLOBAL_ROOM);
    socket.emit("rehabAcceleratedSuccess", res);
    managerMessage(GLOBAL_ROOM, `🏥 ${teamName} invested ₹2.5M in cryogenic rehabilitation for ${res.injury.playerName}!`);
  });

  socket.on("runLateFitnessTest", (data) => {
    const room = getRoom(socket);
    if (!room) return;
    const teamName = (data && data.teamName) || socket.teamName;
    const injuryId = data && data.injuryId;
    if (!teamName || !injuryId) return;

    const res = league.runLateFitnessTest(teamName, injuryId);
    broadcastLeagueState(GLOBAL_ROOM);
    socket.emit("fitnessTestResult", res);
  });

  // ===================================================
  // PLAYER SCOUTING NETWORK
  // ===================================================

  socket.on("dispatchScout", (data) => {
    const room = getRoom(socket);
    if (!room) {
      socket.emit("errorMessage", "Join a team first.");
      return;
    }
    const teamName = (data && data.teamName) || socket.teamName;
    const missionType = (data && data.missionType) || "wonderkids";

    const res = league.dispatchScout(teamName, missionType, room.teams);
    if (res.error) {
      socket.emit("errorMessage", res.error);
      return;
    }

    broadcastState(GLOBAL_ROOM);
    broadcastLeagueState(GLOBAL_ROOM);
    socket.emit("scoutReportsReceived", res);
    socket.emit("userMessage", `🔍 Chief Scout returned with ${res.dossiers.length} targets on ${missionType.toUpperCase()} mission!`);
  });

  // ===================================================
  // JERSEY CUSTOMIZATION & MERCHANDISE
  // ===================================================
  socket.on("saveJerseyDesign", (data) => {
    const room = getRoom(socket);
    if (!room) {
      socket.emit("errorMessage", "Join a team first.");
      return;
    }
    const teamName = (data && data.teamName) || socket.teamName;
    if (!teamName) {
      socket.emit("errorMessage", "No club specified.");
      return;
    }
    const res = league.saveJerseyDesign(teamName, data.jersey || {}, room.teams);
    if (res.error) {
      socket.emit("errorMessage", res.error);
      return;
    }
    broadcastLeagueState(GLOBAL_ROOM);
    saveGameProgressToFile();
    socket.emit("jerseySavedSuccess", res);
    socket.emit("userMessage", `🎨 ${teamName} kit updated! Aesthetic Rating: ${res.jersey.aestheticScore}/10 (${res.jersey.tier}) - Sales Multiplier: ${res.jersey.salesMultiplier}x!`);
  });

  socket.on("getJerseyDesign", (data) => {
    const teamName = (data && data.teamName) || socket.teamName;
    if (!teamName) return;
    const jersey = league.getJerseyDesign(teamName);
    socket.emit("jerseyDesignData", { teamName, jersey });
  });

  // ===================================================
  // INDIVIDUAL AWARDS & TROPHY CEREMONY
  // ===================================================
  socket.on("getSeasonAwards", () => {
    const room = getRoom(socket);
    const awards = league.calculateSeasonAwards(room?.teams || {});
    socket.emit("seasonAwardsData", awards);
  });

  socket.on("getTrophyCeremony", () => {
    const room = getRoom(socket);
    const ceremony = league.getTrophyCeremonyData(room?.teams || {});
    socket.emit("trophyCeremonyData", ceremony);
  });

  // ===================================================
  // PLAYER PROGRESS SAVING & RESTORATION
  // ===================================================

  socket.on("saveTeamProgress", (data, callback) => {
    const room = getRoom(socket);
    const teamName = (data && data.teamName) || socket.teamName;

    if (!room || !teamName || !room.teams[teamName]) {
      const err = { success: false, error: "Team not found or not connected." };
      socket.emit("teamProgressSaved", err);
      if (typeof callback === "function") callback(err);
      return;
    }

    const team = room.teams[teamName];

    if (data?.managerName) team.managerName = String(data.managerName).trim();
    if (data?.managerPhoto) team.managerPhoto = data.managerPhoto;
    if (data?.crestConfig) team.crestConfig = data.crestConfig;
    if (data?.crestSvg) team.crestSvg = data.crestSvg;
    if (data?.customLogo) team.customLogo = data.customLogo;
    if (data?.budget !== undefined) team.budget = Number(data.budget) || team.budget;
    if (Array.isArray(data?.players) && data.players.length > 0) {
      team.players = data.players;
      data.players.forEach(p => {
        if (p && p.name) room.soldPlayers.add(normalizeName(p.name));
      });
    }

    saveGameProgressToFile();

    const result = {
      success: true,
      teamName,
      managerName: team.managerName || "Athul V V",
      budget: team.budget,
      squadCount: team.players.length,
      savedAt: new Date().toISOString()
    };

    socket.emit("teamProgressSaved", result);
    if (typeof callback === "function") callback(result);
  });

  socket.on("getSavedTeamProgress", (data, callback) => {
    const room = getRoom(socket);
    const teamName = (data && data.teamName) || socket.teamName;

    if (!room || !teamName || !room.teams[teamName]) {
      const err = { success: false, error: "No saved team progress found." };
      socket.emit("savedTeamProgressData", err);
      if (typeof callback === "function") callback(err);
      return;
    }

    const team = room.teams[teamName];
    const payload = {
      success: true,
      teamName,
      managerName: team.managerName || "Athul V V",
      managerPhoto: team.managerPhoto || "/manager_photo.jpg",
      crestConfig: team.crestConfig,
      crestSvg: team.crestSvg,
      budget: team.budget,
      players: team.players,
      season: team.season || currentSeason
    };

    socket.emit("savedTeamProgressData", payload);
    if (typeof callback === "function") callback(payload);
  });

  socket.on("resetTeamProgress", (data, callback) => {
    const room = getRoom(socket);
    const teamName = (data && data.teamName) || socket.teamName;

    if (room && teamName && room.teams[teamName]) {
      const team = room.teams[teamName];
      // Free players from sold set
      if (Array.isArray(team.players)) {
        team.players.forEach(p => {
          if (p && p.name) room.soldPlayers.delete(normalizeName(p.name));
        });
      }
      team.budget = STARTING_BUDGET;
      team.players = [];
      saveGameProgressToFile();
      broadcastState(GLOBAL_ROOM);
    }

    const res = { success: true, teamName };
    socket.emit("teamProgressReset", res);
    if (typeof callback === "function") callback(res);
  });
});

// =====================================================
// API - FIREBASE CONFIG
// =====================================================

app.get("/api/firebase-config", (req, res) => {
  try {
    const configPath = path.join(__dirname, "firebase-applet-config.json");
    if (fs.existsSync(configPath)) {
      const raw = fs.readFileSync(configPath, "utf8");
      return res.json(JSON.parse(raw));
    }
  } catch (err) {
    console.error("Failed to read firebase config:", err);
  }
  res.status(404).json({ error: "Firebase config not found" });
});

// =====================================================
// API - STATUS
// =====================================================

app.get(
  "/api/status",
  (req, res) => {
    const room =
      rooms[GLOBAL_ROOM];

    res.json({
      status: "ok",
      season:
        currentSeason,

      transferWindowOpen:
        transferWindowOpen,

      auctionRunning:
        room.auctionRunning,

      currentPlayer:
        room.currentPlayer,

      teams:
        Object.keys(
          room.teams
        ).length,

      totalPlayers:
        players.length,

      remainingPlayers:
        getAvailablePlayers(
          room
        ).length
    });
  }
);

// =====================================================
// API - PLAYERS
// =====================================================

app.get(
  "/api/players",
  (req, res) => {
    res.json(
      players
    );
  }
);

// =====================================================
// API - TEAMS
// =====================================================

app.get(
  "/api/teams",
  (req, res) => {
    const room =
      rooms[GLOBAL_ROOM];

    res.json(
      room.teams
    );
  }
);

// =====================================================
// API - CONTRACTS
// =====================================================

app.get(
  "/api/contracts/:team",
  (req, res) => {
    const room =
      rooms[GLOBAL_ROOM];

    const team =
      room.teams[
        req.params.team
      ];

    if (!team) {
      return res.status(404).json({
        error:
          "Team not found."
      });
    }

    res.json({
      team:
        req.params.team,

      season:
        currentSeason,

      players:
        team.players
    });
  }
);

// =====================================================
// API - TRANSFER MARKET
// =====================================================

app.get(
  "/api/transfers",
  (req, res) => {
    const room =
      rooms[GLOBAL_ROOM];

    const offers = [];

    for (
      const teamName in
      room.teams
    ) {
      const team =
        room.teams[
          teamName
        ];

      if (
        Array.isArray(
          team.transferOffers
        )
      ) {
        for (
          const offer of
          team.transferOffers
        ) {
          offers.push({
            ...offer,

            seller:
              teamName
          });
        }
      }
    }

    res.json({
      season:
        currentSeason,

      transferWindowOpen:
        transferWindowOpen,

      offers:
        offers
    });
  }
);

// =====================================================
// API - FREE AGENTS
// =====================================================

app.get(
  "/api/free-agents",
  (req, res) => {
    const room =
      rooms[GLOBAL_ROOM];

    const owned =
      new Set();

    for (
      const teamName in
      room.teams
    ) {
      const team =
        room.teams[
          teamName
        ];

      for (
        const player of
        team.players
      ) {
        owned.add(
          normalizeName(
            player.name
          )
        );
      }
    }

    const freeAgents =
      players.filter(
        player =>
          !owned.has(
            normalizeName(
              player.name
            )
          )
      );

    res.json(
      freeAgents
    );
  }
);

// =====================================================
// API - LEAGUE (ALL DIVISIONS)
// =====================================================

app.get("/api/league", (req, res) => {
  const room = rooms[GLOBAL_ROOM];
  if (room) {
    league.syncUserClubs(room.teams);
  }
  res.json(league.getLeagueState());
});

// =====================================================
// API - LEAGUE (SPECIFIC DIVISION: 1, 2, or 3)
// =====================================================

app.get("/api/league/:division", (req, res) => {
  const room = rooms[GLOBAL_ROOM];
  if (room) {
    league.syncUserClubs(room.teams);
  }
  const raw = String(req.params.division || "").toLowerCase().replace("div", "").trim();
  const divId = parseInt(raw, 10);
  const data = league.getDivisionState(divId);
  if (!data) {
    return res.status(404).json({
      error: `Division '${req.params.division}' not found. Please use 1, 2, or 3.`
    });
  }
  res.json(data);
});

app.get("/api/league-jerseys", (req, res) => {
  const room = rooms[GLOBAL_ROOM];
  if (room) league.syncUserClubs(room.teams);
  res.json({ jerseys: league.jerseys || {} });
});

app.get("/api/league-awards", (req, res) => {
  const room = rooms[GLOBAL_ROOM];
  const awards = league.calculateSeasonAwards(room?.teams || {});
  res.json(awards);
});

app.get("/api/league-trophy", (req, res) => {
  const room = rooms[GLOBAL_ROOM];
  const trophy = league.getTrophyCeremonyData(room?.teams || {});
  res.json(trophy);
});

// =====================================================
// SERVER
// =====================================================

server.listen(
  PORT,
  "0.0.0.0",
  () => {
    console.log(
      `⚽ Football Auction Server running on port ${PORT}`
    );

    console.log(
      `Players loaded: ${players.length}`
    );

    console.log(
      `Current season: ${currentSeason}`
    );

    console.log(
      `Transfer window: ${
        transferWindowOpen
          ? "OPEN"
          : "CLOSED"
      }`
    );
  }
);

  
