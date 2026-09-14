# ⚽ Football Auction & Matchday Tycoon (Godot 4 Edition)

A complete **Football Club Tycoon & Auction Simulation** game built for **Godot Engine 4 (v4.2+)**.

---

## 🌟 What's Included

1. **🔨 Live Player Auction Room (`res://scenes/Auction/AuctionRoom.tscn`)**:
   - Real-time 15-second bidding countdown.
   - Competitive AI clubs bidding based on funds and player ratings.
   - Increment bids (`+₹0.50 Cr`, `+₹1.00 Cr`, `+₹2.00 Cr`).
   - Live activity ticker and hammer-down purchase pipeline.

2. **📋 Tactical Squad Board (`res://scenes/Tactics/TacticsBoard.tscn`)**:
   - Interactive pitch with dynamic tactical node rendering.
   - Switch between **4-3-3 Attack**, **4-2-3-1 Solid**, and **3-5-2 Wing Play**.
   - Squad list with player overalls and positions.

3. **🏟️ Matchday Arena & Momentum Tracker (`res://scenes/Matchday/MatchArena.tscn`)**:
   - 2D pitch visualizer with real-time ball movement.
   - 90-minute digital broadcast clock with play, pause, and 2x fast-forward.
   - **Visual Team Momentum Indicator** (0% to 100%) calculated dynamically from recent match form.
   - **Streak Highlights**: Automatically flags winning streaks (`🔥 3W STREAK`), losing slumps (`❄️ 2L SLUMP`), and unbeaten runs (`🛡️ UNBEATEN`).
   - Minute-by-minute live commentary ticker with goal alerts!

4. **📁 Reusable Custom Resources & Singletons**:
   - `res://resources/PlayerData.gd`: Position, stats (PAC, SHO, PAS, DEF, PHY), price, club.
   - `res://resources/TeamData.gd`: Budget, colors, squad, form tracking, momentum logic.
   - `res://autoload/Database.gd`: Seeded international players and world-class clubs.
   - `res://autoload/GameManager.gd`: Global state, player transfers, fixture simulator.

---

## 🚀 How to Run in Godot 4

1. **Export / Download**:
   - In Google AI Studio Build, click **Settings > Export to GitHub** or **Download ZIP**.
2. **Open Godot 4**:
   - Open **Godot Engine 4.2+** (free at [godotengine.org](https://godotengine.org)).
   - Click **Import** in the Project Manager.
   - Browse to the `godot_project/` folder and select `project.godot`.
   - Click **Import & Edit**.
3. **Play the Game**:
   - Press **F5** (or the **Play** icon in the top-right corner) to launch the Main Menu!
