// public/pls_match_game.js - Pro League Soccer (PLS) 2D Interactive Playable Football Match & Journey Engine

(function (global) {
  "use strict";

  // Canvas and Dimensions
  let canvas = null;
  let ctx = null;
  let animFrameId = null;
  let isRunning = false;
  let isPaused = false;

  // Pitch World Dimensions
  const PITCH_W = 1200;
  const PITCH_H = 760;
  const GOAL_W = 32;
  const GOAL_H = 150;

  // Journey Campaign Tiers
  const JOURNEY_STAGES = [
    {
      id: 1,
      tier: "Stage 1: Regional Championship",
      opponent: "Kochi FC",
      colors: { primary: "#ef4444", secondary: "#ffffff", shorts: "#450a0a" },
      difficulty: 0.85,
      rating: 74,
      reward: 12, // ₹12M
      stadium: "Jawaharlal Nehru Stadium",
      unlocked: true
    },
    {
      id: 2,
      tier: "Stage 2: Division Promotion Clash",
      opponent: "Borussia Dortmund",
      colors: { primary: "#fde100", secondary: "#000000", shorts: "#000000" },
      difficulty: 1.0,
      rating: 81,
      reward: 18, // ₹18M
      stadium: "Signal Iduna Park",
      unlocked: false
    },
    {
      id: 3,
      tier: "Stage 3: European Quarter-Final",
      opponent: "Paris Saint-Germain",
      colors: { primary: "#004170", secondary: "#da291c", shorts: "#004170" },
      difficulty: 1.15,
      rating: 86,
      reward: 25, // ₹25M
      stadium: "Parc des Princes",
      unlocked: false
    },
    {
      id: 4,
      tier: "Stage 4: Champions League Semi",
      opponent: "Bayern Munich",
      colors: { primary: "#dc052d", secondary: "#ffffff", shorts: "#dc052d" },
      difficulty: 1.25,
      rating: 89,
      reward: 30, // ₹30M
      stadium: "Allianz Arena",
      unlocked: false
    },
    {
      id: 5,
      tier: "Grand Final: World Club Cup",
      opponent: "Real Madrid",
      colors: { primary: "#ffffff", secondary: "#d4af37", shorts: "#ffffff" },
      difficulty: 1.4,
      rating: 93,
      reward: 45, // ₹45M + Champion Trophy
      stadium: "Santiago Bernabéu",
      unlocked: false
    }
  ];

  let currentStageIndex = 0;
  let currentStage = JOURNEY_STAGES[0];

  // Match State
  let matchTimeSeconds = 0;
  const HALF_DURATION_SECONDS = 45; // 45s per half in arcade time = 90s total match
  let matchHalf = 1; // 1 or 2 or 3 (finished)
  let homeScore = 0;
  let awayScore = 0;
  let lastScorer = null;
  let celebrationTimer = 0;
  let commentaryText = "Welcome to Pro League Soccer! Kick-off!";

  // Ball
  const ball = {
    x: PITCH_W / 2,
    y: PITCH_H / 2,
    z: 0,
    vx: 0,
    vy: 0,
    vz: 0,
    radius: 7,
    holder: null,
    lastKicker: null
  };

  // Teams & Players
  let homePlayers = [];
  let awayPlayers = [];
  let userControlledPlayer = null;

  // Input State
  const keys = {
    up: false,
    down: false,
    left: false,
    right: false,
    pass: false,
    shoot: false,
    through: false,
    sprint: false
  };

  let shotPower = 0;
  let isChargingShot = false;

  // Virtual Joystick State (Mobile / Touch)
  const touchJoystick = {
    active: false,
    touchId: null,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    dx: 0,
    dy: 0,
    radius: 50
  };

  // Camera Viewport
  const camera = {
    x: PITCH_W / 2,
    y: PITCH_H / 2,
    scale: 1.0
  };

  // Safe team name resolver preventing browser DOM id element clash
  function getUserTeamName() {
    if (typeof window.getActiveUserTeam === "function") {
      try {
        const val = window.getActiveUserTeam();
        if (typeof val === "string" && val.trim()) return val.trim();
      } catch (e) {}
    }
    if (typeof window.userClubName === "string" && window.userClubName.trim()) {
      return window.userClubName.trim();
    }
    if (typeof window.myTeam === "string" && window.myTeam.trim()) {
      return window.myTeam.trim();
    }
    const inputEl = document.getElementById("teamName");
    if (inputEl && typeof inputEl.value === "string" && inputEl.value.trim()) {
      return inputEl.value.trim();
    }
    const badgeEl = document.getElementById("myTeamBadge") || document.getElementById("myTeam");
    if (badgeEl && typeof badgeEl.innerText === "string") {
      const txt = badgeEl.innerText.trim();
      if (txt && txt !== "Not Joined" && txt !== "Not Connected") return txt;
    }
    try {
      const saved = localStorage.getItem("football_auction_saved_manager");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed.teamName === "string" && parsed.teamName.trim()) {
          return parsed.teamName.trim();
        }
      }
    } catch (e) {}
    return "Athul FC";
  }

  // Initialize Teams from User Club & Opponent
  function setupMatch(stageIndex = 0) {
    currentStageIndex = stageIndex;
    currentStage = JOURNEY_STAGES[stageIndex] || JOURNEY_STAGES[0];

    const userName = getUserTeamName();
    const userPlayers = (window.gameState?.teams?.[userName]?.players) || [];

    // Colors
    const homeKit = getClubColors(userName);
    const awayKit = currentStage.colors;

    homePlayers = createTeamRoster(true, userName, userPlayers, homeKit);
    awayPlayers = createTeamRoster(false, currentStage.opponent, [], awayKit);

    // Initial Positions
    resetPositionsForKickoff(true);

    homeScore = 0;
    awayScore = 0;
    matchTimeSeconds = 0;
    matchHalf = 1;
    celebrationTimer = 0;
    commentaryText = `Match started: ${userName} vs ${currentStage.opponent}!`;

    userControlledPlayer = homePlayers.find(p => !p.isGK && p.role === "ST") || homePlayers[10];

    updateScoreboardUI();
  }

  function getClubColors(name) {
    if (typeof JerseyStudio !== "undefined") {
      try {
        const design = typeof JerseyStudio.getCurrentDesign === "function"
          ? JerseyStudio.getCurrentDesign()
          : (JerseyStudio.currentDesign || null);
        if (design) {
          const primary = design.primaryColor || design.primary;
          if (primary) {
            return {
              primary: primary,
              secondary: design.secondaryColor || design.secondary || "#ffffff",
              shorts: design.shortsColor || design.shorts || design.secondary || "#0f2544"
            };
          }
        }
      } catch (e) {
        console.warn("Could not retrieve kit from JerseyStudio:", e);
      }
    }
    return { primary: "#0284c7", secondary: "#f59e0b", shorts: "#0f2544" };
  }

  function createTeamRoster(isHome, teamName, acquiredPlayers, kit) {
    const roles = [
      { role: "GK", name: "Goalkeeper", xRel: 0.08, yRel: 0.5 },
      { role: "LB", name: "Left Back", xRel: 0.22, yRel: 0.2 },
      { role: "CB1", name: "Center Back", xRel: 0.20, yRel: 0.4 },
      { role: "CB2", name: "Center Back", xRel: 0.20, yRel: 0.6 },
      { role: "RB", name: "Right Back", xRel: 0.22, yRel: 0.8 },
      { role: "LM", name: "Left Mid", xRel: 0.38, yRel: 0.22 },
      { role: "CM", name: "Central Mid", xRel: 0.36, yRel: 0.5 },
      { role: "RM", name: "Right Mid", xRel: 0.38, yRel: 0.78 },
      { role: "LW", name: "Left Winger", xRel: 0.55, yRel: 0.2 },
      { role: "ST", name: "Striker", xRel: 0.58, yRel: 0.5 },
      { role: "RW", name: "Right Winger", xRel: 0.55, yRel: 0.8 }
    ];

    return roles.map((spec, i) => {
      let displayName = spec.name;
      let rating = 78;
      if (acquiredPlayers && acquiredPlayers[i]) {
        displayName = acquiredPlayers[i].name || displayName;
        rating = acquiredPlayers[i].rating || acquiredPlayers[i].overall || 82;
      } else if (!isHome) {
        const defaultOppStars = [
          "Alisson", "Arnold", "Van Dijk", "Saliba", "Robertson",
          "Rodri", "De Bruyne", "Bellingham", "Saka", "Haaland", "Vinicius Jr"
        ];
        displayName = defaultOppStars[i] || `${spec.role} Star`;
        rating = currentStage.rating;
      }

      return {
        id: (isHome ? "home_" : "away_") + i,
        name: displayName,
        number: i === 0 ? 1 : (i === 9 ? 9 : (i === 10 ? 10 : i + 1)),
        isHome,
        isGK: i === 0,
        role: spec.role,
        xRel: spec.xRel,
        yRel: spec.yRel,
        x: isHome ? spec.xRel * PITCH_W : (1 - spec.xRel) * PITCH_W,
        y: spec.yRel * PITCH_H,
        vx: 0,
        vy: 0,
        speed: 3.2 + (rating - 70) * 0.04,
        stamina: 100,
        kit,
        facing: isHome ? 1 : -1,
        slideTimer: 0,
        kickCooldown: 0
      };
    });
  }

  function resetPositionsForKickoff(homeHasBall = true) {
    ball.x = PITCH_W / 2;
    ball.y = PITCH_H / 2;
    ball.z = 0;
    ball.vx = 0;
    ball.vy = 0;
    ball.vz = 0;
    ball.holder = null;

    homePlayers.forEach(p => {
      p.x = p.xRel * PITCH_W;
      p.y = p.yRel * PITCH_H;
      p.vx = 0;
      p.vy = 0;
    });

    awayPlayers.forEach(p => {
      p.x = (1 - p.xRel) * PITCH_W;
      p.y = p.yRel * PITCH_H;
      p.vx = 0;
      p.vy = 0;
    });

    if (homeHasBall) {
      const striker = homePlayers.find(p => p.role === "ST") || homePlayers[9];
      striker.x = PITCH_W / 2 - 8;
      striker.y = PITCH_H / 2;
      ball.holder = striker;
    } else {
      const striker = awayPlayers.find(p => p.role === "ST") || awayPlayers[9];
      striker.x = PITCH_W / 2 + 8;
      striker.y = PITCH_H / 2;
      ball.holder = striker;
    }
  }

  // Physics & Gameplay Loop
  function update(dt) {
    if (isPaused) return;

    // Match Clock Tick
    matchTimeSeconds += dt;
    const gameMinutes = Math.min(90, Math.floor((matchTimeSeconds / (HALF_DURATION_SECONDS * 2)) * 90));

    // Halftime / Fulltime checks
    if (matchHalf === 1 && matchTimeSeconds >= HALF_DURATION_SECONDS) {
      matchHalf = 2;
      commentaryText = "⏱️ Halftime whistle! Teams switch sides for the 2nd half.";
      resetPositionsForKickoff(false);
      showMatchPopup("HALFTIME", `${homeScore} - ${awayScore}`, "2nd Half Underway!");
    } else if (matchHalf === 2 && matchTimeSeconds >= HALF_DURATION_SECONDS * 2) {
      endMatch();
      return;
    }

    if (celebrationTimer > 0) {
      celebrationTimer -= dt;
      if (celebrationTimer <= 0) {
        resetPositionsForKickoff(lastScorer?.isHome ? false : true);
      }
      return; // Freeze movement during celebration
    }

    // Process User Input for Active Controlled Player
    handlePlayerInput();

    // AI Behaviors for all other players
    updateAI(homePlayers, true);
    updateAI(awayPlayers, false);

    // Ball Dynamics
    updateBall(dt);

    // Goal Post & Net Collisions
    checkGoalScored();

    // Smooth Camera Track
    camera.x += (ball.x - camera.x) * 0.1;
    camera.y += (ball.y - camera.y) * 0.1;

    // Keep camera bounds
    camera.x = Math.max(300, Math.min(PITCH_W - 300, camera.x));
    camera.y = Math.max(200, Math.min(PITCH_H - 200, camera.y));

    // Auto-switch controlled player to closest home player if ball is loose
    if (!ball.holder || !ball.holder.isHome) {
      findBestPlayerToControl();
    }

    updateScoreboardUI(gameMinutes);
  }

  function handlePlayerInput() {
    if (!userControlledPlayer) return;

    let moveX = 0;
    let moveY = 0;

    // Keyboard Input
    if (keys.up) moveY -= 1;
    if (keys.down) moveY += 1;
    if (keys.left) moveX -= 1;
    if (keys.right) moveX += 1;

    // Touch Joystick Override
    if (touchJoystick.active) {
      moveX = touchJoystick.dx;
      moveY = touchJoystick.dy;
    }

    // Normalization
    const len = Math.hypot(moveX, moveY);
    if (len > 0) {
      moveX /= len;
      moveY /= len;
      userControlledPlayer.facing = moveX >= 0 ? 1 : -1;
    }

    const isSprinting = keys.sprint && userControlledPlayer.stamina > 10;
    const currentSpeed = (isSprinting ? userControlledPlayer.speed * 1.45 : userControlledPlayer.speed);

    userControlledPlayer.vx = moveX * currentSpeed;
    userControlledPlayer.vy = moveY * currentSpeed;

    userControlledPlayer.x += userControlledPlayer.vx;
    userControlledPlayer.y += userControlledPlayer.vy;

    // Pitch Clamp
    userControlledPlayer.x = Math.max(20, Math.min(PITCH_W - 20, userControlledPlayer.x));
    userControlledPlayer.y = Math.max(20, Math.min(PITCH_H - 20, userControlledPlayer.y));

    // Shot Charging
    if (isChargingShot && ball.holder === userControlledPlayer) {
      shotPower = Math.min(100, shotPower + 2.5);
    }
  }

  function findBestPlayerToControl() {
    let closest = null;
    let minDist = Infinity;
    homePlayers.forEach(p => {
      if (p.isGK) return;
      const d = Math.hypot(p.x - ball.x, p.y - ball.y);
      if (d < minDist) {
        minDist = d;
        closest = p;
      }
    });
    if (closest) userControlledPlayer = closest;
  }

  function updateAI(team, isHome) {
    const isAttacking = (ball.holder && ball.holder.isHome === isHome);
    const targetGoalX = isHome ? PITCH_W : 0;
    const ownGoalX = isHome ? 0 : PITCH_W;

    team.forEach(p => {
      // Skip active human player
      if (isHome && p === userControlledPlayer) return;

      if (p.slideTimer > 0) p.slideTimer--;
      if (p.kickCooldown > 0) p.kickCooldown--;

      // Goalkeeper Special AI
      if (p.isGK) {
        handleGoalkeeperAI(p, isHome, ownGoalX);
        return;
      }

      // If this player currently possesses the ball
      if (ball.holder === p) {
        // AI with ball: move towards opposing goal or pass/shoot
        const dx = targetGoalX - p.x;
        const dy = PITCH_H / 2 - p.y;
        const distToGoal = Math.hypot(dx, dy);

        // Run towards goal
        p.vx = Math.sign(dx) * (p.speed * 0.85);
        p.vy = Math.sin(Date.now() * 0.003 + p.yRel) * (p.speed * 0.5);

        p.x += p.vx;
        p.y += p.vy;
        p.facing = Math.sign(p.vx) || 1;

        // Shoot if in range
        if (distToGoal < 260 && Math.random() < 0.04 && p.kickCooldown <= 0) {
          shootBall(p, 14 + Math.random() * 4);
          p.kickCooldown = 60;
        } else if (Math.random() < 0.02 && p.kickCooldown <= 0) {
          // Pass to open teammate
          passBall(p, false);
          p.kickCooldown = 50;
        }
        return;
      }

      // Outfield player without ball
      if (isAttacking) {
        // Support run forward
        const targetX = (p.xRel * PITCH_W) + (isHome ? 90 : -90);
        const targetY = p.yRel * PITCH_H;
        p.x += (targetX - p.x) * 0.03;
        p.y += (targetY - p.y) * 0.03;
      } else {
        // Defending: press ball if close, or mark back
        const distToBall = Math.hypot(ball.x - p.x, ball.y - p.y);
        if (distToBall < 180) {
          // Press ball carrier
          const dx = ball.x - p.x;
          const dy = ball.y - p.y;
          const len = Math.hypot(dx, dy) || 1;
          p.vx = (dx / len) * (p.speed * currentStage.difficulty);
          p.vy = (dy / len) * (p.speed * currentStage.difficulty);
          p.x += p.vx;
          p.y += p.vy;

          // Attempt tackle if close
          if (distToBall < 24 && ball.holder && ball.holder.isHome !== isHome) {
            tackleBall(p);
          }
        } else {
          // Return to tactical zone
          const targetX = isHome ? p.xRel * PITCH_W : (1 - p.xRel) * PITCH_W;
          const targetY = p.yRel * PITCH_H;
          p.x += (targetX - p.x) * 0.04;
          p.y += (targetY - p.y) * 0.04;
        }
      }

      // Pitch boundaries
      p.x = Math.max(20, Math.min(PITCH_W - 20, p.x));
      p.y = Math.max(20, Math.min(PITCH_H - 20, p.y));
    });
  }

  function handleGoalkeeperAI(p, isHome, ownGoalX) {
    const goalCenterY = PITCH_H / 2;
    // Follow ball Y within 6-yard box
    const targetY = Math.max(goalCenterY - 60, Math.min(goalCenterY + 60, ball.y));
    p.y += (targetY - p.y) * 0.12;
    p.x = isHome ? 32 : PITCH_W - 32;

    // Dive / Catch if ball comes directly into keeper range
    const distToBall = Math.hypot(p.x - ball.x, p.y - ball.y);
    if (distToBall < 36 && ball.z < 25) {
      // Save!
      ball.vx = isHome ? 8 : -8;
      ball.vy = (Math.random() - 0.5) * 6;
      ball.vz = 2;
      ball.holder = null;
      commentaryText = `🧤 SPECTACULAR SAVE by ${p.name}!`;
      triggerSoundEffect("save");
    }
  }

  function updateBall(dt) {
    if (ball.holder) {
      // Ball sticks to dribbler's feet
      ball.x = ball.holder.x + ball.holder.facing * 12;
      ball.y = ball.holder.y + 4;
      ball.z = 0;
      ball.vx = 0;
      ball.vy = 0;
      ball.vz = 0;
      return;
    }

    // Free ball physics
    ball.x += ball.vx;
    ball.y += ball.vy;
    ball.z += ball.vz;

    // Gravity
    if (ball.z > 0) {
      ball.vz -= 0.35; // gravity
    } else {
      ball.z = 0;
      ball.vz = -ball.vz * 0.6; // bounce
      if (Math.abs(ball.vz) < 0.5) ball.vz = 0;
    }

    // Rolling friction
    ball.vx *= 0.985;
    ball.vy *= 0.985;

    // Pitch touchline rebounds
    if (ball.y <= 12 || ball.y >= PITCH_H - 12) {
      ball.vy = -ball.vy * 0.8;
      ball.y = Math.max(14, Math.min(PITCH_H - 14, ball.y));
    }

    // Pick up loose ball if a player collides with it
    const allPlayers = [...homePlayers, ...awayPlayers];
    for (const p of allPlayers) {
      if (p.kickCooldown > 0) continue;
      const d = Math.hypot(p.x - ball.x, p.y - ball.y);
      if (d < 20 && ball.z < 18) {
        ball.holder = p;
        ball.lastKicker = p;
        if (p.isHome) userControlledPlayer = p;
        break;
      }
    }
  }

  function checkGoalScored() {
    const goalTop = (PITCH_H - GOAL_H) / 2;
    const goalBottom = goalTop + GOAL_H;

    // Left Goal (Away scores)
    if (ball.x <= 18 && ball.y >= goalTop && ball.y <= goalBottom && ball.z < 45) {
      awayScore++;
      lastScorer = awayPlayers.find(p => p === ball.lastKicker) || awayPlayers[9];
      celebrateGoal(false);
    }
    // Right Goal (Home scores)
    else if (ball.x >= PITCH_W - 18 && ball.y >= goalTop && ball.y <= goalBottom && ball.z < 45) {
      homeScore++;
      lastScorer = homePlayers.find(p => p === ball.lastKicker) || homePlayers[9];
      celebrateGoal(true);
    }
  }

  function celebrateGoal(isHomeScorer) {
    celebrationTimer = 3.5; // 3.5s freeze & celebration
    ball.vx = 0;
    ball.vy = 0;
    ball.holder = null;

    const scorerName = lastScorer?.name || "Star Forward";
    const teamTitle = isHomeScorer ? getUserTeamName() : currentStage.opponent;
    commentaryText = `⚽ GOOOOAL! What an unbelievable finish by ${scorerName}! (${teamTitle})`;

    triggerSoundEffect("goal");

    showMatchPopup(
      "⚽ GOOOOOAL!",
      `${scorerName} scores for ${teamTitle}!`,
      `${homeScore} - ${awayScore}`
    );

    // Confetti effect
    if (typeof confetti === "function") {
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    }
  }

  // Player Actions: Pass, Shoot, Through Ball, Tackle
  function executePass() {
    if (!userControlledPlayer || ball.holder !== userControlledPlayer) return;
    passBall(userControlledPlayer, false);
  }

  function executeThrough() {
    if (!userControlledPlayer || ball.holder !== userControlledPlayer) return;
    passBall(userControlledPlayer, true);
  }

  function startShootCharge() {
    if (!userControlledPlayer || ball.holder !== userControlledPlayer) return;
    isChargingShot = true;
    shotPower = 15;
  }

  function releaseShoot() {
    if (!isChargingShot || !userControlledPlayer || ball.holder !== userControlledPlayer) {
      isChargingShot = false;
      return;
    }
    isChargingShot = false;
    const finalPower = Math.max(12, Math.min(24, shotPower * 0.24));
    shootBall(userControlledPlayer, finalPower);
    shotPower = 0;
  }

  function executeTackle() {
    if (!userControlledPlayer) return;
    tackleBall(userControlledPlayer);
  }

  function passBall(passer, isThrough = false) {
    const teammates = passer.isHome ? homePlayers : awayPlayers;
    let bestMate = null;
    let maxScore = -Infinity;

    teammates.forEach(m => {
      if (m === passer || m.isGK) return;
      const dx = m.x - passer.x;
      const dy = m.y - passer.y;
      const dist = Math.hypot(dx, dy);

      // Prefer teammate in the direction player is facing
      const forwardDot = (dx * passer.facing);
      if (forwardDot < -10) return; // behind

      const score = forwardDot * 2 - dist;
      if (score > maxScore) {
        maxScore = score;
        bestMate = m;
      }
    });

    if (!bestMate) {
      // Kick forward
      ball.holder = null;
      ball.vx = passer.facing * 12;
      ball.vy = 0;
      ball.vz = 1;
      passer.kickCooldown = 25;
      return;
    }

    ball.holder = null;
    ball.lastKicker = passer;
    passer.kickCooldown = 25;

    const leadAhead = isThrough ? 45 * passer.facing : 0;
    const tx = bestMate.x + leadAhead;
    const ty = bestMate.y;

    const dx = tx - ball.x;
    const dy = ty - ball.y;
    const dist = Math.hypot(dx, dy) || 1;
    const speed = isThrough ? 14 : 11;

    ball.vx = (dx / dist) * speed;
    ball.vy = (dy / dist) * speed;
    ball.vz = 0.5;

    commentaryText = isThrough ? `⚡ Precision through ball by ${passer.name}!` : `Pass released to ${bestMate.name}`;
    triggerSoundEffect("kick");
  }

  function shootBall(shooter, power) {
    ball.holder = null;
    ball.lastKicker = shooter;
    shooter.kickCooldown = 35;

    const targetGoalX = shooter.isHome ? PITCH_W : 0;
    const targetY = (PITCH_H / 2) + (Math.random() - 0.5) * (GOAL_H * 0.7);

    const dx = targetGoalX - ball.x;
    const dy = targetY - ball.y;
    const dist = Math.hypot(dx, dy) || 1;

    ball.vx = (dx / dist) * power;
    ball.vy = (dy / dist) * power;
    ball.vz = Math.min(8, power * 0.35);

    commentaryText = `🚀 THUNDEROUS SHOT by ${shooter.name}!`;
    triggerSoundEffect("kick");
  }

  function tackleBall(tackler) {
    tackler.slideTimer = 20;
    tackler.kickCooldown = 30;

    // Slide burst
    tackler.vx = tackler.facing * (tackler.speed * 1.8);

    const distToBall = Math.hypot(tackler.x - ball.x, tackler.y - ball.y);
    if (distToBall < 36 && ball.holder && ball.holder !== tackler) {
      const victim = ball.holder;
      ball.holder = null;
      ball.vx = tackler.facing * 9 + (Math.random() - 0.5) * 4;
      ball.vy = (Math.random() - 0.5) * 8;
      ball.vz = 2;
      commentaryText = `🔥 Great sliding tackle by ${tackler.name} on ${victim.name}!`;
      triggerSoundEffect("kick");
    }
  }

  function triggerSoundEffect(type) {
    if (typeof getAudioCtx === "function") {
      const ctx = getAudioCtx();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === "kick") {
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.08);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.09);
      } else if (type === "goal") {
        if (typeof playWhistleSound === "function") playWhistleSound();
      } else if (type === "save") {
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(120, now + 0.15);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.16);
      }
    }
  }

  // Canvas Drawing / Render Loop
  function render() {
    if (!ctx || !canvas) return;

    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Camera Transformation
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    ctx.translate(cx - camera.x, cy - camera.y);

    // 1. Draw Football Pitch
    drawPitch(ctx);

    // 2. Draw Goals & Goal Nets
    drawGoals(ctx);

    // 3. Draw Players
    const allPlayers = [...homePlayers, ...awayPlayers].sort((a, b) => a.y - b.y);
    allPlayers.forEach(p => drawPlayer(ctx, p));

    // 4. Draw Ball
    drawBall(ctx);

    // 5. Draw Active Player Reticle & Shot Bar
    if (userControlledPlayer) {
      drawControlRing(ctx, userControlledPlayer);
    }

    ctx.restore();

    // 6. HUD / Radar Overlay
    drawRadar(ctx);
  }

  function drawPitch(c) {
    // Grass Background
    c.fillStyle = "#1e4e2b";
    c.fillRect(0, 0, PITCH_W, PITCH_H);

    // Alternating Mowed Grass Stripes
    const stripeW = 80;
    for (let x = 0; x < PITCH_W; x += stripeW * 2) {
      c.fillStyle = "#225932";
      c.fillRect(x, 0, stripeW, PITCH_H);
    }

    // Boundary Lines
    c.strokeStyle = "rgba(255, 255, 255, 0.85)";
    c.lineWidth = 3;
    c.strokeRect(18, 18, PITCH_W - 36, PITCH_H - 36);

    // Center Line
    c.beginPath();
    c.moveTo(PITCH_W / 2, 18);
    c.lineTo(PITCH_W / 2, PITCH_H - 18);
    c.stroke();

    // Center Circle
    c.beginPath();
    c.arc(PITCH_W / 2, PITCH_H / 2, 85, 0, Math.PI * 2);
    c.stroke();

    // Center Spot
    c.fillStyle = "#ffffff";
    c.beginPath();
    c.arc(PITCH_W / 2, PITCH_H / 2, 4, 0, Math.PI * 2);
    c.fill();

    // Penalty Areas (18-yard box)
    const boxH = 340;
    const boxW = 160;
    const boxY = (PITCH_H - boxH) / 2;

    // Left Box
    c.strokeRect(18, boxY, boxW, boxH);
    // Right Box
    c.strokeRect(PITCH_W - 18 - boxW, boxY, boxW, boxH);

    // 6-Yard Box
    const smallH = 170;
    const smallW = 60;
    const smallY = (PITCH_H - smallH) / 2;
    c.strokeRect(18, smallY, smallW, smallH);
    c.strokeRect(PITCH_W - 18 - smallW, smallY, smallW, smallH);

    // Penalty Spots
    c.beginPath();
    c.arc(125, PITCH_H / 2, 4, 0, Math.PI * 2);
    c.arc(PITCH_W - 125, PITCH_H / 2, 4, 0, Math.PI * 2);
    c.fill();

    // Corner Arcs
    c.beginPath();
    c.arc(18, 18, 18, 0, Math.PI / 2);
    c.arc(18, PITCH_H - 18, 18, -Math.PI / 2, 0);
    c.arc(PITCH_W - 18, 18, 18, Math.PI / 2, Math.PI);
    c.arc(PITCH_W - 18, PITCH_H - 18, 18, Math.PI, Math.PI * 1.5);
    c.stroke();
  }

  function drawGoals(c) {
    const goalY = (PITCH_H - GOAL_H) / 2;

    // Left Net
    c.fillStyle = "rgba(255, 255, 255, 0.2)";
    c.fillRect(0, goalY, 18, GOAL_H);
    c.strokeStyle = "#ffffff";
    c.lineWidth = 4;
    c.strokeRect(0, goalY, 18, GOAL_H);

    // Right Net
    c.fillRect(PITCH_W - 18, goalY, 18, GOAL_H);
    c.strokeRect(PITCH_W - 18, goalY, 18, GOAL_H);
  }

  function drawPlayer(c, p) {
    const shadowR = 10;
    // Ground Shadow
    c.fillStyle = "rgba(0, 0, 0, 0.35)";
    c.beginPath();
    c.ellipse(p.x, p.y + 12, shadowR, shadowR * 0.45, 0, 0, Math.PI * 2);
    c.fill();

    // Body
    c.save();
    c.translate(p.x, p.y);

    // Slide rotation
    if (p.slideTimer > 0) {
      c.rotate(p.facing * 0.6);
    }

    // Legs / Shorts
    c.fillStyle = p.kit.shorts;
    c.fillRect(-6, 2, 12, 8);

    // Jersey Shirt
    c.fillStyle = p.kit.primary;
    c.beginPath();
    c.roundRect(-9, -10, 18, 13, 3);
    c.fill();

    // Collar / Accent
    c.fillStyle = p.kit.secondary;
    c.fillRect(-4, -10, 8, 3);

    // Head
    c.fillStyle = "#fbcfe8"; // Skin tone
    c.beginPath();
    c.arc(0, -15, 6, 0, Math.PI * 2);
    c.fill();

    // Hair
    c.fillStyle = p.isGK ? "#f59e0b" : "#1e293b";
    c.beginPath();
    c.arc(0, -18, 5, Math.PI, Math.PI * 2);
    c.fill();

    // Jersey Number on Back
    c.fillStyle = p.kit.secondary;
    c.font = "bold 8px sans-serif";
    c.textAlign = "center";
    c.fillText(p.number, 0, -1);

    c.restore();

    // Player Name Tag
    c.fillStyle = "rgba(0, 0, 0, 0.75)";
    c.beginPath();
    c.roundRect(p.x - 28, p.y - 32, 56, 12, 3);
    c.fill();

    c.fillStyle = p.isHome ? "#38bdf8" : "#fca5a5";
    c.font = "bold 8px sans-serif";
    c.textAlign = "center";
    c.fillText(p.name.length > 9 ? p.name.substring(0, 9) + ".." : p.name, p.x, p.y - 23);
  }

  function drawBall(c) {
    const bHeight = ball.z;
    // Ball Shadow
    c.fillStyle = "rgba(0, 0, 0, 0.4)";
    c.beginPath();
    c.ellipse(ball.x, ball.y, ball.radius * 0.9, ball.radius * 0.4, 0, 0, Math.PI * 2);
    c.fill();

    // Floating Ball Body
    c.fillStyle = "#ffffff";
    c.beginPath();
    c.arc(ball.x, ball.y - bHeight, ball.radius, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = "#000000";
    c.lineWidth = 1;
    c.stroke();

    // Hexagon pattern
    c.fillStyle = "#111827";
    c.beginPath();
    c.arc(ball.x - 1, ball.y - bHeight - 1, 2.5, 0, Math.PI * 2);
    c.fill();
  }

  function drawControlRing(c, p) {
    // Reticle around feet
    c.strokeStyle = "#38bdf8";
    c.lineWidth = 2.5;
    c.beginPath();
    c.arc(p.x, p.y + 4, 18, 0, Math.PI * 2);
    c.stroke();

    // Inverted Triangle Indicator above head
    c.fillStyle = "#38bdf8";
    c.beginPath();
    c.moveTo(p.x, p.y - 36);
    c.lineTo(p.x - 5, p.y - 44);
    c.lineTo(p.x + 5, p.y - 44);
    c.closePath();
    c.fill();

    // Shot Charge Power Bar
    if (isChargingShot) {
      c.fillStyle = "rgba(0, 0, 0, 0.8)";
      c.fillRect(p.x - 22, p.y - 48, 44, 7);

      const pct = shotPower / 100;
      const barColor = pct < 0.6 ? "#10b981" : (pct < 0.85 ? "#f59e0b" : "#ef4444");
      c.fillStyle = barColor;
      c.fillRect(p.x - 21, p.y - 47, 42 * pct, 5);
    }
  }

  function drawRadar(c) {
    const rw = 160;
    const rh = 90;
    const rx = canvas.width - rw - 14;
    const ry = 14;

    // Background
    c.fillStyle = "rgba(7, 14, 24, 0.82)";
    c.strokeStyle = "rgba(56, 189, 248, 0.4)";
    c.lineWidth = 1.5;
    c.beginPath();
    c.roundRect(rx, ry, rw, rh, 6);
    c.fill();
    c.stroke();

    // Midfield line
    c.beginPath();
    c.moveTo(rx + rw / 2, ry);
    c.lineTo(rx + rw / 2, ry + rh);
    c.strokeStyle = "rgba(255, 255, 255, 0.2)";
    c.stroke();

    // Draw Home Players (Cyan Dots)
    c.fillStyle = "#38bdf8";
    homePlayers.forEach(p => {
      const px = rx + (p.x / PITCH_W) * rw;
      const py = ry + (p.y / PITCH_H) * rh;
      c.beginPath();
      c.arc(px, py, 2.5, 0, Math.PI * 2);
      c.fill();
    });

    // Draw Away Players (Red/Yellow Dots)
    c.fillStyle = "#ef4444";
    awayPlayers.forEach(p => {
      const px = rx + (p.x / PITCH_W) * rw;
      const py = ry + (p.y / PITCH_H) * rh;
      c.beginPath();
      c.arc(px, py, 2.5, 0, Math.PI * 2);
      c.fill();
    });

    // Ball Dot (Yellow)
    c.fillStyle = "#facc15";
    const bx = rx + (ball.x / PITCH_W) * rw;
    const by = ry + (ball.y / PITCH_H) * rh;
    c.beginPath();
    c.arc(bx, by, 3, 0, Math.PI * 2);
    c.fill();
  }

  function updateScoreboardUI(gameMinutes = 0) {
    const homeEl = document.getElementById("plsHomeName");
    const awayEl = document.getElementById("plsAwayName");
    const scoreEl = document.getElementById("plsScoreDisplay");
    const timeEl = document.getElementById("plsMatchClock");
    const tickerEl = document.getElementById("plsCommentaryTicker");

    if (homeEl) homeEl.innerText = getUserTeamName();
    if (awayEl) awayEl.innerText = currentStage.opponent;
    if (scoreEl) scoreEl.innerText = `${homeScore} - ${awayScore}`;
    if (timeEl) timeEl.innerText = `${gameMinutes}' (H${matchHalf})`;
    if (tickerEl) tickerEl.innerText = commentaryText;
  }

  function showMatchPopup(title, subtitle, extra) {
    const banner = document.getElementById("plsEventBanner");
    const titleEl = document.getElementById("plsBannerTitle");
    const subEl = document.getElementById("plsBannerSubtitle");
    const extraEl = document.getElementById("plsBannerExtra");

    if (!banner || !titleEl) return;
    titleEl.innerText = title;
    if (subEl) subEl.innerText = subtitle;
    if (extraEl) extraEl.innerText = extra;

    banner.classList.add("show");
    setTimeout(() => {
      banner.classList.remove("show");
    }, 2800);
  }

  function endMatch() {
    isPaused = true;
    const isWin = homeScore > awayScore;
    const isDraw = homeScore === awayScore;
    const userName = getUserTeamName();

    let prizeMoney = 0;
    if (isWin) {
      prizeMoney = currentStage.reward;
      // Unlock next stage
      if (JOURNEY_STAGES[currentStageIndex + 1]) {
        JOURNEY_STAGES[currentStageIndex + 1].unlocked = true;
      }
    } else if (isDraw) {
      prizeMoney = Math.round(currentStage.reward * 0.4);
    } else {
      prizeMoney = 2; // Appearance fee ₹2M
    }

    // Credit Treasury
    if (window.gameState?.teams?.[userName]) {
      window.gameState.teams[userName].budget = (window.gameState.teams[userName].budget || 500) + prizeMoney;
    }

    // Trigger save & cloud sync
    if (typeof saveCurrentPlayerProgress === "function") {
      saveCurrentPlayerProgress(false);
    }
    if (window.FirebaseCloud && typeof window.FirebaseCloud.saveClub === "function") {
      window.FirebaseCloud.saveClub({
        teamName: userName,
        budget: window.gameState?.teams?.[userName]?.budget || 500
      }).catch(e => console.warn(e));
    }

    showMatchPopup(
      isWin ? "🏆 VICTORY!" : (isDraw ? "🤝 DRAW" : "FULLTIME"),
      `Final Score: ${userName} ${homeScore} - ${awayScore} ${currentStage.opponent}`,
      `Earned ₹${prizeMoney}M Prize Money! (Added to Treasury)`
    );

    if (typeof showSaveToast === "function") {
      showSaveToast(`💰 Match Reward: +₹${prizeMoney}M added to ${userName} Treasury!`, "🏆");
    }

    renderJourneyMap();
  }

  // Animation Frame Loop
  let lastTime = performance.now();
  function gameLoop(now) {
    if (!isRunning) return;
    const dt = Math.min(0.1, (now - lastTime) / 1000);
    lastTime = now;

    update(dt);
    render();

    animFrameId = requestAnimationFrame(gameLoop);
  }

  function startMatchGame(stageIndex = 0) {
    canvas = document.getElementById("plsMatchCanvas");
    if (!canvas) return;
    ctx = canvas.getContext("2d");

    // Responsive Canvas Resizing
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    setupMatch(stageIndex);
    isPaused = false;
    isRunning = true;
    lastTime = performance.now();

    if (animFrameId) cancelAnimationFrame(animFrameId);
    animFrameId = requestAnimationFrame(gameLoop);

    // Ensure music keeps playing hype tracks!
    if (window.MusicEngine && !window.MusicEngine.isPlaying()) {
      window.MusicEngine.start();
    }
  }

  function pauseMatch() {
    isPaused = !isPaused;
    const btn = document.getElementById("plsPauseBtn");
    if (btn) btn.innerText = isPaused ? "▶️ RESUME" : "⏸️ PAUSE";
  }

  function restartMatch() {
    setupMatch(currentStageIndex);
    isPaused = false;
  }

  function stopMatchGame() {
    isRunning = false;
    if (animFrameId) {
      cancelAnimationFrame(animFrameId);
      animFrameId = null;
    }
    window.removeEventListener("resize", resizeCanvas);
  }

  function resizeCanvas() {
    if (!canvas) return;
    const container = canvas.parentElement;
    if (container) {
      canvas.width = container.clientWidth || 800;
      canvas.height = Math.max(380, Math.min(600, window.innerHeight * 0.58));
    }
  }

  // Bind Virtual Touch Joystick & Action Buttons
  function bindTouchControls() {
    const joyContainer = document.getElementById("plsJoystickZone");
    const joyKnob = document.getElementById("plsJoystickKnob");

    if (joyContainer && joyKnob) {
      const onTouchStart = (e) => {
        e.preventDefault();
        const touch = e.changedTouches[0];
        touchJoystick.active = true;
        touchJoystick.touchId = touch.identifier;
        const rect = joyContainer.getBoundingClientRect();
        touchJoystick.startX = rect.left + rect.width / 2;
        touchJoystick.startY = rect.top + rect.height / 2;
        updateJoystickPos(touch.clientX, touch.clientY);
      };

      const onTouchMove = (e) => {
        if (!touchJoystick.active) return;
        for (let i = 0; i < e.changedTouches.length; i++) {
          const touch = e.changedTouches[i];
          if (touch.identifier === touchJoystick.touchId) {
            updateJoystickPos(touch.clientX, touch.clientY);
            break;
          }
        }
      };

      const onTouchEnd = (e) => {
        for (let i = 0; i < e.changedTouches.length; i++) {
          if (e.changedTouches[i].identifier === touchJoystick.touchId) {
            touchJoystick.active = false;
            touchJoystick.dx = 0;
            touchJoystick.dy = 0;
            joyKnob.style.transform = "translate(0px, 0px)";
            break;
          }
        }
      };

      function updateJoystickPos(cx, cy) {
        let dx = cx - touchJoystick.startX;
        let dy = cy - touchJoystick.startY;
        const dist = Math.hypot(dx, dy);
        const maxR = touchJoystick.radius;

        if (dist > maxR) {
          dx = (dx / dist) * maxR;
          dy = (dy / dist) * maxR;
        }

        joyKnob.style.transform = `translate(${dx}px, ${dy}px)`;
        touchJoystick.dx = dx / maxR;
        touchJoystick.dy = dy / maxR;
      }

      joyContainer.addEventListener("touchstart", onTouchStart, { passive: false });
      window.addEventListener("touchmove", onTouchMove, { passive: false });
      window.addEventListener("touchend", onTouchEnd, { passive: false });
      window.addEventListener("touchcancel", onTouchEnd, { passive: false });
    }

    // Keyboard Bindings
    window.addEventListener("keydown", (e) => {
      const key = e.key.toLowerCase();
      if (key === "arrowup" || key === "w") keys.up = true;
      if (key === "arrowdown" || key === "s") keys.down = true;
      if (key === "arrowleft" || key === "a") keys.left = true;
      if (key === "arrowright" || key === "d") keys.right = true;

      if (key === "j" || key === "z" || e.code === "Space") {
        e.preventDefault();
        executePass();
      }
      if (key === "k" || key === "x") {
        e.preventDefault();
        startShootCharge();
      }
      if (key === "l" || key === "c") {
        e.preventDefault();
        executeThrough();
      }
      if (key === "shift" || key === "e") {
        keys.sprint = true;
        executeTackle();
      }
      if (key === "q") {
        findBestPlayerToControl();
      }
    });

    window.addEventListener("keyup", (e) => {
      const key = e.key.toLowerCase();
      if (key === "arrowup" || key === "w") keys.up = false;
      if (key === "arrowdown" || key === "s") keys.down = false;
      if (key === "arrowleft" || key === "a") keys.left = false;
      if (key === "arrowright" || key === "d") keys.right = false;

      if (key === "k" || key === "x") {
        releaseShoot();
      }
      if (key === "shift" || key === "e") {
        keys.sprint = false;
      }
    });
  }

  // Render Journey Campaign Road Map UI
  function renderJourneyMap() {
    const listEl = document.getElementById("journeyStagesList");
    if (!listEl) return;

    listEl.innerHTML = JOURNEY_STAGES.map((s, idx) => `
      <div class="journey-stage-card ${s.unlocked ? (idx === currentStageIndex ? 'current' : 'cleared') : 'locked'}">
        <div class="stage-badge-number">0${s.id}</div>
        <div class="stage-info-content">
          <div class="stage-title-row">
            <span class="stage-tier-title">${s.tier}</span>
            <span class="stage-reward-badge">💰 ₹${s.reward}M REWARD</span>
          </div>
          <div class="stage-matchup-row">
            <span class="stage-vs-team">vs <strong>${s.opponent}</strong></span>
            <span class="stage-rating-tag">OVR ${s.rating}</span>
            <span class="stage-stadium-name">🏟️ ${s.stadium}</span>
          </div>
        </div>
        <div class="stage-action-slot">
          ${s.unlocked ? `
            <button type="button" class="btn-play-stage" onclick="PLS_MatchGame.playStage(${idx})">
              <span>⚽ PLAY MATCH</span>
            </button>
          ` : `
            <div class="stage-locked-tag">🔒 LOCKED</div>
          `}
        </div>
      </div>
    `).join("");
  }

  // Public Interface
  global.PLS_MatchGame = {
    start: startMatchGame,
    pause: pauseMatch,
    restart: restartMatch,
    stop: stopMatchGame,
    playStage: (idx) => {
      startMatchGame(idx);
      const arenaModal = document.getElementById("plsGameModal");
      if (arenaModal) arenaModal.style.display = "flex";
    },
    pass: executePass,
    shootStart: startShootCharge,
    shootRelease: releaseShoot,
    through: executeThrough,
    tackle: executeTackle,
    initJourney: () => {
      bindTouchControls();
      renderJourneyMap();
    },
    getStages: () => JOURNEY_STAGES
  };

  document.addEventListener("DOMContentLoaded", () => {
    global.PLS_MatchGame.initJourney();
  });

})(window);
