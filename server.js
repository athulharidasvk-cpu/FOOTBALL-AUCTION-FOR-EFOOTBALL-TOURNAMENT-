const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// ==========================
// PLAYER DATABASE
// ==========================
const rawPlayers = require("./public/players.js");

// Remove duplicate players automatically
const players = rawPlayers.filter(
  (player, index, array) =>
    index === array.findIndex(
      p => p.name.toLowerCase().trim() === player.name.toLowerCase().trim()
    )
);

// ==========================
// GAME DATA
// ==========================
const teams = {};
const soldPlayers = new Set();

let currentPlayer = null;
let currentBid = 0;
let currentBidder = null;
let auctionRunning = false;
let timer = 20;
let timerInterval = null;

// ==========================
// STATIC FILES
// ==========================
app.use(express.static(path.join(__dirname, "public")));

// ==========================
// HELPER FUNCTIONS
// ==========================

function getAvailablePlayers() {
  return players.filter(
    player => !soldPlayers.has(player.name.toLowerCase().trim())
  );
}

function getGameState() {
  return {
    teams,
    currentPlayer,
    currentBid,
    currentBidder,
    auctionRunning,
    timer,
    totalPlayers: players.length,
    remainingPlayers: getAvailablePlayers().length
  };
}

function broadcastState() {
  io.emit("gameState", getGameState());
}

function managerMessage(message) {
  io.emit("managerMessage", message);
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function startTimer() {
  stopTimer();

  timer = 20;

  timerInterval = setInterval(() => {
    timer--;

    io.emit("timerUpdate", timer);

    if (timer <= 0) {
      finishAuction();
    }
  }, 1000);
}

function finishAuction() {
  stopTimer();

  if (!currentPlayer) return;

  auctionRunning = false;

  if (currentBidder && teams[currentBidder]) {
    const team = teams[currentBidder];

    team.budget -= currentBid;

    team.players.push({
      ...currentPlayer,
      price: currentBid
    });

    soldPlayers.add(currentPlayer.name.toLowerCase().trim());

    io.emit("playerSold", {
      player: currentPlayer,
      team: currentBidder,
      price: currentBid
    });

    managerMessage(
      `SOLD! ${currentPlayer.name} joins ${currentBidder} for ₹${currentBid}M! Great signing, manager!`
    );
  } else {
    soldPlayers.add(currentPlayer.name.toLowerCase().trim());

    io.emit("playerUnsold", {
      player: currentPlayer
    });

    managerMessage(
      `${currentPlayer.name} receives no bids and remains available outside this auction.`
    );
  }

  currentPlayer = null;
  currentBid = 0;
  currentBidder = null;
  timer = 0;

  broadcastState();
}

// ==========================
// SOCKET CONNECTION
// ==========================

io.on("connection", socket => {
  console.log("Player connected:", socket.id);

  // Send current game state
  socket.emit("gameState", getGameState());

  // --------------------------
  // JOIN TEAM
  // --------------------------
  socket.on("joinTeam", data => {
    const teamName = String(data?.teamName || "").trim();

    if (!teamName) {
      socket.emit("errorMessage", "Enter a valid team name.");
      return;
    }

    // Check if name already exists
    if (!teams[teamName]) {
      teams[teamName] = {
        budget: 500,
        players: [],
        socketId: socket.id
      };

      managerMessage(
        `${teamName} has entered the auction! Use your budget wisely and build the strongest team possible.`
      );
    } else {
      teams[teamName].socketId = socket.id;
    }

    socket.teamName = teamName;

    broadcastState();
  });

  // --------------------------
  // START RANDOM AUCTION
  // --------------------------
  socket.on("startAuction", () => {
    if (auctionRunning) {
      socket.emit("errorMessage", "An auction is already running.");
      return;
    }

    const available = getAvailablePlayers();

    if (available.length === 0) {
      managerMessage("All players have been auctioned!");
      return;
    }

    const randomIndex = Math.floor(
      Math.random() * available.length
    );

    currentPlayer = available[randomIndex];

    currentBid = currentPlayer.base || 5;
    currentBidder = null;
    auctionRunning = true;

    io.emit("newPlayer", {
      player: currentPlayer,
      startingBid: currentBid
    });

    managerMessage(
      `New player on the market: ${currentPlayer.name}! Starting bid is ₹${currentBid}M. Think carefully before spending your budget.`
    );

    startTimer();
    broadcastState();
  });

  // --------------------------
  // PLACE BID
  // --------------------------
  socket.on("placeBid", data => {
    if (!auctionRunning || !currentPlayer) {
      socket.emit("errorMessage", "No active auction.");
      return;
    }

    const teamName = socket.teamName;

    if (!teamName || !teams[teamName]) {
      socket.emit("errorMessage", "Join a team before bidding.");
      return;
    }

    const amount = Number(data?.amount);

    if (!Number.isFinite(amount)) {
      socket.emit("errorMessage", "Enter a valid bid.");
      return;
    }

    if (amount <= currentBid) {
      socket.emit(
        "errorMessage",
        `Your bid must be higher than ₹${currentBid}M.`
      );
      return;
    }

    if (amount > teams[teamName].budget) {
      socket.emit(
        "errorMessage",
        `You only have ₹${teams[teamName].budget}M remaining.`
      );
      return;
    }

    currentBid = amount;
    currentBidder = teamName;

    // Reset timer after a bid
    timer = 20;

    io.emit("bidUpdate", {
      currentBid,
      currentBidder,
      timer
    });

    // Manager reacts to expensive bids
    const playerBase = currentPlayer.base || 5;
    const teamBudget = teams[teamName].budget;

    if (amount >= playerBase * 2.5) {
      managerMessage(
        `${teamName}, that's a huge amount for ${currentPlayer.name}! Don't spend all your money on one player — you still need a complete squad!`
      );
    }

    if (amount >= teamBudget * 0.6) {
      managerMessage(
        `Manager warning to ${teamName}: you're about to spend more than 60% of your budget on one player. Choose wisely!`
      );
    }

    broadcastState();
  });

  // --------------------------
  // SKIP CURRENT PLAYER
  // --------------------------
  socket.on("skipPlayer", () => {
    if (!auctionRunning || !currentPlayer) return;

    managerMessage(
      `${currentPlayer.name}'s auction has been skipped.`
    );

    soldPlayers.add(currentPlayer.name.toLowerCase().trim());

    currentPlayer = null;
    currentBid = 0;
    currentBidder = null;
    auctionRunning = false;
    timer = 0;

    stopTimer();
    broadcastState();
  });

  // --------------------------
  // RESET GAME
  // --------------------------
  socket.on("resetGame", () => {
    stopTimer();

    soldPlayers.clear();

    for (const teamName in teams) {
      teams[teamName].budget = 500;
      teams[teamName].players = [];
    }

    currentPlayer = null;
    currentBid = 0;
    currentBidder = null;
    auctionRunning = false;
    timer = 20;

    managerMessage(
      "The auction has been reset! Every manager starts again with ₹500M."
    );

    broadcastState();
  });

  // --------------------------
  // DISCONNECT
  // --------------------------
  socket.on("disconnect", () => {
    console.log("Player disconnected:", socket.id);

    if (
      socket.teamName &&
      teams[socket.teamName]
    ) {
      teams[socket.teamName].socketId = null;
    }

    broadcastState();
  });
});

// ==========================
// START SERVER
// ==========================

server.listen(PORT, () => {
  console.log(`Football Auction Server running on port ${PORT}`);
});
