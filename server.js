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

// Football World is attached directly here as well as through the Render
// preload scripts. This makes the World API work even if Render starts the
// app with `node server.js` instead of the package.json start command.
try {
  require("./world_v4_recovery");
  const worldV4 = require("./world_v4_preload");
  worldV4.attachApp(app);
  worldV4.attachIO(io);
  console.log("[FootballWorld] World routes and Socket.IO attached directly.");
} catch (err) {
  console.error("[FootballWorld] Failed to attach World engine:", err.message);
}

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