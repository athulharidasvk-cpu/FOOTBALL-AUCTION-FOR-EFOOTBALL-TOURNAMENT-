# Football Auction Pro — Mobile Multiplayer & League Manager

A full-stack real-time football management and auction platform built with Node.js, Express, Socket.IO, and vanilla web technologies.

## Features

- **Live Squad Auction Arena**:
  - Real-time multiplayer bidding powered by Socket.IO.
  - €200M starting budget per team with configurable increments.
  - Sniping protection (bids placed in the final 5 seconds extend the clock).
  - Authentic player database with ratings, dynamic stats, and public Wikipedia imagery.

- **League Championship (Divisions 1, 2 & 3)**:
  - Multi-division hierarchy featuring promotion, relegation, and European qualification.
  - Squad-rating-driven match simulation algorithm factoring in form, tactical roles, and home advantage.
  - Live table standings, goal differences, and head-to-head records.

- **Broadcast Match Center**:
  - Dual-club logos, crests, and stadium ambience presentation.
  - Chronological minute-by-minute live commentary feed tracking goals, cards, and tactical shifts.
  - Side-by-side comparative statistics: Possession %, Expected Goals (xG), Total Shots, Shots on Target, Corner Kicks, and Passing Accuracy %.
  - Scrubber timeline with interactive 1x, 2x, and 3x simulation speeds.

- **Official Kit Studio & Merchandise Commerce**:
  - Vector jersey designer with real-time collar styles, diagonal sashes, hoops, stripes, checkered patterns, and custom squad numbers and sponsor lettering.
  - Aesthetic scoring engine evaluating color harmony and contrast ratio (WCAG AA compliant).
  - Home matchday merchandise sales multiplier (up to 2.27x revenue boost based on kit design score).
  - One-tap prestige presets (Royal Gold, Blaugrana, Sky Blue, Rossoneri, Champion Noir, Stealth Cyan).

- **Season Awards Gala & Ballon d'Or**:
  - Season-end honors: Ballon d'Or, Yashin Trophy (Golden Glove), Golden Boot, Playmaker of the Year, and Golden Boy (U21).
  - Team of the Season (TOTS XI) 4-3-3 tactical showcase.

- **Cinematic Trophy Lifting Ceremony**:
  - Dynamic celebration modal featuring championship silverware, confetti particle physics, fireworks, and triumphant audio fanfares.

## Quick Start

### Requirements
- Node.js 18+

### Installation & Run

```bash
# 1. Install dependencies
npm install

# 2. Start the development server
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Architecture

- **Backend**: Node.js, Express, Socket.IO server (`server.js`, `league.js`).
- **Frontend**: Single-page application with responsive docking layout, SVG rendering engines, and Web Audio synthesizers (`public/index.html`, `public/match_center.js`, `public/jersey_studio.js`, `public/awards_trophy.js`).
- **Real-Time Synchronization**: Authoritative server for room codes, bids, budgets, timers, and league simulations.

