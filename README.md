# Football Auction — Mobile Multiplayer

## What it does
- Real players on separate phones; no AI teams.
- One host creates a room and shares the 5-character room code.
- 2–12 teams.
- €200M per team.
- 20 seconds per player.
- €5M bid increments.
- Bids sync live using Socket.IO.
- Bid during the last 5 seconds extends the timer to 5 seconds.
- Player photos are fetched from Wikipedia's public page-summary thumbnails when available.

## Run it
Install Node.js 18+.

In this folder:
    npm install
    npm start

Then open:
    http://localhost:3000

For friends on the same Wi-Fi, find the host computer's LAN IP (for example 192.168.1.5) and have them open:
    http://192.168.1.5:3000

For friends on different networks, deploy this folder to a Node.js host that supports WebSockets (for example Render, Railway, Fly.io, or another Node hosting service), then share the deployed HTTPS URL.

The server is authoritative for bids, budgets and the timer.
