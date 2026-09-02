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

const players1 = require("./public/players1.js");
const players2 = require("./public/players2.js");
const players3 = require("./public/players3.js");
const players4 = require("./public/players4.js");

const rawPlayers = [
  ...players1,
  ...players2,
  ...players3,
  ...players4
];

// Remove duplicate players
const players = rawPlayers.filter(
  (player, index, array) =>
    index ===
    array.findIndex(
      p =>
        p.name.toLowerCase().trim() ===
        player.name.toLowerCase().trim()
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

// =====================================================
// ROOMS
// =====================================================

const rooms = {};

// Example room:
//
// rooms["ABC123"] = {
//   host: socketId,
//   teams: {},
//   soldPlayers: Set(),
//   currentPlayer: null,
//   currentBid: 0,
//   currentBidder: null,
//   auctionRunning: false,
//   timer: 20,
//   timerInterval: null
// };

// =====================================================
// STATIC FILES
// =====================================================

app.use(express.static(path.join(__dirname, "public")));

// =====================================================
// HELPER FUNCTIONS
// =====================================================

function generateRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  let code = "";

  do {
    code = "";

    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
  } while (rooms[code]);

  return code;
}

function createRoom() {
  const code = generateRoomCode();

  rooms[code] = {
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

  return code;
}

function getRoom(socket) {
  if (!socket.roomCode) return null;

  return rooms[socket.roomCode] || null;
}

function getAvailablePlayers(room) {
  return players.filter(
    player =>
      !room.soldPlayers.has(
        player.name.toLowerCase().trim()
      )
  );
}

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

    host: room.host
  };
}

function broadcastState(roomCode) {
  const room = rooms[roomCode];

  if (!room) return;

  io.to(roomCode).emit(
    "gameState",
    getGameState(room)
  );
}

function managerMessage(roomCode, message) {
  io.to(roomCode).emit(
    "managerMessage",
    message
  );
}

function stopTimer(room) {
  if (room.timerInterval) {
    clearInterval(room.timerInterval);

    room.timerInterval = null;
  }
}

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

  // PLAYER SOLD
  if (
    room.currentBidder &&
    room.teams[room.currentBidder]
  ) {
    const team =
      room.teams[room.currentBidder];

    // Make sure budget is sufficient
    if (room.currentBid <= team.budget) {
      team.budget -= room.currentBid;

      team.players.push({
        ...room.currentPlayer,
        price: room.currentBid
      });

      room.soldPlayers.add(
        room.currentPlayer.name
          .toLowerCase()
          .trim()
      );

      io.to(roomCode).emit(
        "playerSold",
        {
          player: room.currentPlayer,
          team: room.currentBidder,
          price: room.currentBid
        }
      );

      managerMessage(
        roomCode,
        `🔨 SOLD! ${room.currentPlayer.name} joins ${room.currentBidder} for ₹${room.currentBid}M!`
      );
    }
  }

  // NO BID
  else {
    room.soldPlayers.add(
      room.currentPlayer.name
        .toLowerCase()
        .trim()
    );

    io.to(roomCode).emit(
      "playerUnsold",
      {
        player: room.currentPlayer
      }
    );

    managerMessage(
      roomCode,
      `${room.currentPlayer.name} received no bids and is unsold.`
    );
  }

  room.currentPlayer = null;
  room.currentBid = 0;
  room.currentBidder = null;
  room.timer = 0;

  broadcastState(roomCode);
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
  // CREATE ROOM
  // ===================================================

  socket.on("createRoom", data => {
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

    const roomCode = createRoom();

    const room = rooms[roomCode];

    room.host = socket.id;

    room.teams[teamName] = {
      budget: STARTING_BUDGET,

      players: [],

      socketId: socket.id
    };

    socket.join(roomCode);

    socket.roomCode = roomCode;

    socket.teamName = teamName;

    socket.emit("roomCreated", {
      roomCode,
      teamName,
      host: true
    });

    managerMessage(
      roomCode,
      `🏟️ Room ${roomCode} created! Waiting for managers to join.`
    );

    broadcastState(roomCode);

    console.log(
      `Room ${roomCode} created by ${teamName}`
    );
  });

  // ===================================================
  // JOIN ROOM
  // ===================================================

  socket.on("joinRoom", data => {
    const roomCode = String(
      data?.roomCode || ""
    )
      .trim()
      .toUpperCase();

    const teamName = String(
      data?.teamName || ""
    ).trim();

    if (!roomCode || !teamName) {
      socket.emit(
        "errorMessage",
        "Enter a room code and team name."
      );

      return;
    }

    const room = rooms[roomCode];

    if (!room) {
      socket.emit(
        "errorMessage",
        "Room not found."
      );

      return;
    }

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

    if (room.auctionRunning) {
      socket.emit(
        "errorMessage",
        "The auction has already started."
      );

      return;
    }

    if (room.teams[teamName]) {
      socket.emit(
        "errorMessage",
        "That team name is already taken."
      );

      return;
    }

    room.teams[teamName] = {
      budget: STARTING_BUDGET,

      players: [],

      socketId: socket.id
    };

    socket.join(roomCode);

    socket.roomCode = roomCode;

    socket.teamName = teamName;

    socket.emit("roomJoined", {
      roomCode,
      teamName,
      host: room.host === socket.id
    });

    managerMessage(
      roomCode,
      `👋 ${teamName} has joined the auction!`
    );

    broadcastState(roomCode);

    console.log(
      `${teamName} joined room ${roomCode}`
    );
  });

  // ===================================================
  // REQUEST CURRENT STATE
  // ===================================================

  socket.on("requestState", () => {
    const room = getRoom(socket);

    if (!room) return;

    socket.emit(
      "gameState",
      getGameState(room)
    );
  });

  // ===================================================
  // START AUCTION
  // ===================================================

  socket.on("startAuction", () => {
    const room = getRoom(socket);

    if (!room) {
      socket.emit(
        "errorMessage",
        "Create or join a room first."
      );

      return;
    }

    // HOST ONLY
    if (room.host !== socket.id) {
      socket.emit(
        "errorMessage",
        "Only the host can start the auction."
      );

      return;
    }

    if (room.auctionRunning) {
      socket.emit(
        "errorMessage",
        "An auction is already running."
      );

      return;
    }

    const available =
      getAvailablePlayers(room);

    if (available.length === 0) {
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
      room.currentPlayer.base || 5;

    room.currentBidder = null;

    room.auctionRunning = true;

    io.to(socket.roomCode).emit(
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

    startTimer(socket.roomCode);

    broadcastState(socket.roomCode);
  });

  // ===================================================
  // PLACE BID
  // ===================================================

  socket.on("placeBid", data => {
    const room = getRoom(socket);

    if (!room) {
      socket.emit(
        "errorMessage",
        "Join a room first."
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
      !Number.isFinite(amount)
    ) {
      socket.emit(
        "errorMessage",
        "Enter a valid bid."
      );

      return;
    }

    if (
      amount <= room.currentBid
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

    // Require bids to increase by at least ₹5M
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

    room.currentBid = amount;

    room.currentBidder =
      teamName;

    // Reset timer
    room.timer = AUCTION_TIME;

    io.to(socket.roomCode).emit(
      "bidUpdate",
      {
        currentBid:
          room.currentBid,

        currentBidder:
          room.currentBidder,

        timer: room.timer
      }
    );

    // Manager reactions
    const base =
      room.currentPlayer.base || 5;

    if (
      amount >=
      base * 2.5
    ) {
      managerMessage(
        socket.roomCode,
        `⚠️ ${teamName}, that's a huge bid for ${room.currentPlayer.name}! Remember, you still need a complete squad.`
      );
    } else if (
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
  });

  // ===================================================
  // SKIP PLAYER
  // ===================================================

  socket.on("skipPlayer", () => {
    const room = getRoom(socket);

    if (!room) return;

    // HOST ONLY
    if (
      room.host !== socket.id
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
      room.currentPlayer.name
        .toLowerCase()
        .trim()
    );

    room.currentPlayer = null;

    room.currentBid = 0;

    room.currentBidder = null;

    room.auctionRunning = false;

    room.timer = 0;

    stopTimer(room);

    broadcastState(
      socket.roomCode
    );
  });

  // ===================================================
  // RESET GAME
  // ===================================================

  socket.on("resetGame", () => {
    const room = getRoom(socket);

    if (!room) return;

    // HOST ONLY
    if (
      room.host !== socket.id
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
      const teamName in room.teams
    ) {
      room.teams[teamName].budget =
        STARTING_BUDGET;

      room.teams[teamName].players =
        [];
    }

    room.currentPlayer = null;

    room.currentBid = 0;

    room.currentBidder = null;

    room.auctionRunning = false;

    room.timer = AUCTION_TIME;

    managerMessage(
      socket.roomCode,
      "🔄 Auction reset! Every manager has ₹500M again."
    );

    broadcastState(
      socket.roomCode
    );
  });

  // ===================================================
  // DISCONNECT
  // ===================================================

  socket.on("disconnect", () => {
    console.log(
      "Player disconnected:",
      socket.id
    );

    const room = getRoom(socket);

    if (!room) return;

    if (
      socket.teamName &&
      room.teams[socket.teamName]
    ) {
      room.teams[
        socket.teamName
      ].socketId = null;
    }

    broadcastState(
      socket.roomCode
    );
  });
});

// =====================================================
// SERVER
// =====================================================

server.listen(PORT, () => {
  console.log(
    `⚽ Football Auction Server running on port ${PORT}`
  );

  console.log(
    `Players loaded: ${players.length}`
  );
});
