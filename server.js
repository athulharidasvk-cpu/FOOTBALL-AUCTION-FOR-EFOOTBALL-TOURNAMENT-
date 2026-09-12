const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

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

const STARTING_BUDGET = 500;

const MAX_TEAMS = 12;

const MAX_SQUAD = 18;

const AUCTION_TIME = 20;

const BID_INCREMENT = 5;

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

    timerInterval: null
  };
}

initGlobalRoom();

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

    host: room.host,

    season: currentSeason,

    transferWindowOpen:

      transferWindowOpen,

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
      room.teams[teamName].socketId =
        socket.id;
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

      room.teams[teamName] = {
        budget:
          STARTING_BUDGET,

        players: [],

        socketId:
          socket.id,

        season:
          currentSeason,

        transferOffers: []
      };
    }

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

      const randomIndex =
        Math.floor(
          Math.random() *
          available.length
        );

      room.currentPlayer =
        available[randomIndex];

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
            room.currentBid
        }
      );

      managerMessage(
        socket.roomCode,

        `🔥 ${room.currentPlayer.name} is now on the market! Starting bid: ₹${room.currentBid}M.`
      );

      startTimer(
        socket.roomCode
      );

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

        "🔄 Auction reset! Every manager has ₹500M again."
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

    broadcastLeagueState(GLOBAL_ROOM);

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
    broadcastLeagueState(GLOBAL_ROOM);

    managerMessage(
      GLOBAL_ROOM,
      `⚽ Full league season simulated! ${res.totalMatchesSimulated} matches completed.`
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

    managerMessage(
      GLOBAL_ROOM,
      `🌍 Welcome to Season ${currentSeason}! Promotions and relegations applied. New fixtures scheduled!`
    );

    io.to(GLOBAL_ROOM).emit("seasonChanged", {
      season: currentSeason,
      transferWindowOpen: transferWindowOpen
    });

    broadcastState(GLOBAL_ROOM);
    broadcastLeagueState(GLOBAL_ROOM);
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

  
