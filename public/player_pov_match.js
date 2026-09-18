// public/player_pov_match.js - First-Person Player POV Matchday Simulation Engine
// Full 3D Player Perspective, Eye-Level Camera, Boot/Kick Animations, Ball Physics, Teammate Passing & Stadium Atmosphere

(function(global) {
  'use strict';

  // --- AUDIO SYNTHESIZER (Web Audio API) ---
  class MatchAudioSynth {
    constructor() {
      this.ctx = null;
      this.crowdGain = null;
      this.ambientNode = null;
    }

    init() {
      if (this.ctx) return;
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioCtx();
      } catch (e) {
        console.warn("AudioContext not supported", e);
      }
    }

    startCrowdAmbiance() {
      this.init();
      if (!this.ctx) return;
      if (this.ambientNode) return;

      try {
        // Synthesize pinkish stadium crowd murmur
        const bufferSize = this.ctx.sampleRate * 2;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          data[i] = (b0 + b1 + b2) * 0.12;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        noise.loop = true;

        const filter = this.ctx.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.value = 450;
        filter.Q.value = 1.2;

        this.crowdGain = this.ctx.createGain();
        this.crowdGain.gain.value = 0.18;

        noise.connect(filter);
        filter.connect(this.crowdGain);
        this.crowdGain.connect(this.ctx.destination);

        noise.start(0);
        this.ambientNode = noise;
      } catch (e) {
        // audio fail safe
      }
    }

    stopCrowdAmbiance() {
      if (this.ambientNode) {
        try { this.ambientNode.stop(); } catch(e){}
        this.ambientNode = null;
      }
    }

    playKick(power = 1.0) {
      this.init();
      if (!this.ctx) return;
      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const now = this.ctx.currentTime;
        osc.type = "triangle";
        osc.frequency.setValueAtTime(160 + power * 40, now);
        osc.frequency.exponentialRampToValueAtTime(35, now + 0.12);
        gain.gain.setValueAtTime(0.4 * power, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.12);
      } catch(e) {}
    }

    playWhistle() {
      this.init();
      if (!this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(2600, now);
        osc.frequency.setValueAtTime(2900, now + 0.08);
        osc.frequency.setValueAtTime(2600, now + 0.16);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.35);
      } catch(e) {}
    }

    playGoalCheer() {
      this.init();
      if (!this.ctx) return;
      try {
        if (this.crowdGain) {
          const now = this.ctx.currentTime;
          this.crowdGain.gain.cancelScheduledValues(now);
          this.crowdGain.gain.setValueAtTime(0.65, now);
          this.crowdGain.gain.exponentialRampToValueAtTime(0.18, now + 3.5);
        }
        this.playWhistle();
      } catch(e) {}
    }

    playCallSound() {
      this.init();
      if (!this.ctx) return;
      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const now = this.ctx.currentTime;
        osc.type = "sine";
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.08);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.12);
      } catch(e) {}
    }
  }

  // --- POV MATCH GAME ENGINE ---
  class PlayerPovEngine {
    constructor() {
      this.audio = new MatchAudioSynth();
      this.canvas = null;
      this.ctx = null;
      this.animId = null;
      this.isRunning = false;
      this.isPaused = false;

      // Pitch dimensions (meters)
      this.pitchLength = 105;
      this.pitchWidth = 68;
      this.goalWidth = 7.32;
      this.goalHeight = 2.44;

      // Active Match Info
      this.matchData = {
        homeTeam: "Home Club",
        awayTeam: "Away Club",
        divisionId: 1,
        round: 1,
        fixtureIndex: 0,
        homeScore: 0,
        awayScore: 0,
        minute: 0,
        second: 0
      };

      // Player POV State
      this.player = {
        name: "You (Captain)",
        position: "ST",
        ovr: 88,
        number: 9,
        club: "Home Club",
        isHome: true,
        x: 0, // center x (-34 to 34)
        y: -12, // length y (-52.5 to 52.5, attack towards +52.5)
        eyeHeight: 1.72,
        angle: 0, // facing direction (radians)
        vx: 0,
        vy: 0,
        speed: 4.8,
        sprintSpeed: 8.4,
        isSprinting: false,
        stamina: 100,
        walkPhase: 0,
        kickAnimation: 0, // 0 to 1
        kickType: "shoot", // "shoot" or "pass"
        hasBall: true,
        // Match Performance Stats
        rating: 7.0,
        goals: 0,
        assists: 0,
        shots: 0,
        shotsOnTarget: 0,
        passesCompleted: 0,
        distanceRun: 0 // meters
      };

      // Football (3D Ball)
      this.ball = {
        x: 0,
        y: -10.5,
        z: 0.11, // radius ~11cm
        vx: 0,
        vy: 0,
        vz: 0,
        radius: 0.22,
        inGoal: false,
        lastTouch: "player"
      };

      // AI Players (Teammates & Opponents)
      this.teammates = [];
      this.opponents = [];
      this.goalkeeper = null;

      // Input Controls
      this.keys = {};
      this.shotPower = 0;
      this.isChargingShot = false;
      this.mouseTurnSpeed = 0.0035;

      // UI Banner & Commentary
      this.bannerText = "";
      this.bannerSub = "";
      this.bannerTimer = 0;
      this.commentary = "Welcome to the pitch! Match kicked off.";

      this.lastTimestamp = performance.now();

      // Bind input handlers
      this.handleKeyDown = this.handleKeyDown.bind(this);
      this.handleKeyUp = this.handleKeyUp.bind(this);
      this.handleMouseMove = this.handleMouseMove.bind(this);
      this.loop = this.loop.bind(this);
    }

    initCanvas() {
      this.canvas = document.getElementById("povMatchCanvas");
      if (!this.canvas) return false;
      this.ctx = this.canvas.getContext("2d");
      this.resizeCanvas();
      window.addEventListener("resize", () => this.resizeCanvas());
      return true;
    }

    resizeCanvas() {
      if (!this.canvas) return;
      const rect = this.canvas.parentElement.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      this.canvas.width = (rect.width || 800) * dpr;
      this.canvas.height = (rect.height || 520) * dpr;
      this.ctx.scale(dpr, dpr);
      this.viewWidth = rect.width || 800;
      this.viewHeight = rect.height || 520;
    }

    startMatch(fixtureInfo = {}) {
      if (!this.initCanvas()) return;

      this.matchData = {
        homeTeam: fixtureInfo.homeTeam || "Athul FC",
        awayTeam: fixtureInfo.awayTeam || "Kochi FC",
        divisionId: fixtureInfo.divisionId || 1,
        round: fixtureInfo.round || 1,
        fixtureIndex: fixtureInfo.fixtureIndex || 0,
        homeScore: 0,
        awayScore: 0,
        minute: 1,
        second: 0
      };

      // Resolve player
      const userClub = window.myTeam || this.matchData.homeTeam;
      const isHome = (userClub.toLowerCase() === this.matchData.homeTeam.toLowerCase());
      const playerSquad = (window.mySquad && window.mySquad.length > 0) ? window.mySquad : null;
      let chosenPlayer = null;
      if (playerSquad) {
        chosenPlayer = playerSquad.find(p => ["CF", "ST", "LW", "RW", "AMF", "SS"].includes(p.position)) || playerSquad[0];
      }

      this.player = {
        name: chosenPlayer ? chosenPlayer.name : (window.managerName || "You (Star Striker)"),
        position: chosenPlayer ? chosenPlayer.position : "ST",
        ovr: chosenPlayer ? (chosenPlayer.overall || chosenPlayer.rating || 86) : 88,
        number: chosenPlayer ? (chosenPlayer.number || 9) : 9,
        club: userClub,
        isHome: isHome,
        x: 0,
        y: -12,
        eyeHeight: 1.72,
        angle: 0,
        vx: 0,
        vy: 0,
        speed: 4.8,
        sprintSpeed: 8.5,
        isSprinting: false,
        stamina: 100,
        walkPhase: 0,
        kickAnimation: 0,
        kickType: "shoot",
        hasBall: true,
        rating: 7.2,
        goals: 0,
        assists: 0,
        shots: 0,
        shotsOnTarget: 0,
        passesCompleted: 0,
        distanceRun: 0
      };

      // Reset Ball
      this.ball = {
        x: 0,
        y: -10.8,
        z: 0.12,
        vx: 0,
        vy: 0,
        vz: 0,
        radius: 0.22,
        inGoal: false,
        lastTouch: "player"
      };

      this.setupSquads();

      // UI
      this.updateHudDom();
      this.bindControls();
      this.audio.startCrowdAmbiance();
      this.audio.playWhistle();

      this.isRunning = true;
      this.isPaused = false;
      this.lastTimestamp = performance.now();
      cancelAnimationFrame(this.animId);
      this.animId = requestAnimationFrame(this.loop);

      this.triggerCommentary(`⚽ Kickoff! You are in possession for ${this.player.club}! Attack the goal!`);
    }

    setupSquads() {
      // 4 Teammates
      this.teammates = [
        { name: "Saka", pos: "RW", num: 7, x: 18, y: 15, baseAngle: 0, color: "#3b82f6" },
        { name: "De Bruyne", pos: "CAM", num: 17, x: -6, y: 2, baseAngle: 0, color: "#3b82f6" },
        { name: "Bellingham", pos: "CM", num: 5, x: 8, y: -10, baseAngle: 0, color: "#3b82f6" },
        { name: "Vinicius", pos: "LW", num: 11, x: -20, y: 18, baseAngle: 0, color: "#3b82f6" }
      ];

      // 4 Defenders + 1 GK
      this.opponents = [
        { name: "Van Dijk", pos: "CB", num: 4, x: -8, y: 32, color: "#ef4444" },
        { name: "Saliba", pos: "CB", num: 2, x: 8, y: 30, color: "#ef4444" },
        { name: "Walker", pos: "RB", num: 2, x: 22, y: 25, color: "#ef4444" },
        { name: "Davies", pos: "LB", num: 19, x: -22, y: 26, color: "#ef4444" }
      ];

      this.goalkeeper = {
        name: "Courtois",
        pos: "GK",
        num: 1,
        x: 0,
        y: 51.5, // on goal line
        color: "#f59e0b",
        diveX: 0,
        diveY: 0
      };
    }

    bindControls() {
      window.removeEventListener("keydown", this.handleKeyDown);
      window.removeEventListener("keyup", this.handleKeyUp);
      window.addEventListener("keydown", this.handleKeyDown);
      window.addEventListener("keyup", this.handleKeyUp);

      if (this.canvas) {
        this.canvas.removeEventListener("mousemove", this.handleMouseMove);
        this.canvas.addEventListener("mousemove", this.handleMouseMove);
        // Mouse click shoot
        this.canvas.onmousedown = (e) => {
          if (e.button === 0) this.startChargeShot();
        };
        this.canvas.onmouseup = (e) => {
          if (e.button === 0) this.releaseChargeShot();
        };
      }
    }

    handleKeyDown(e) {
      if (!this.isRunning || this.isPaused) return;
      this.keys[e.code] = true;

      // Space / KeyK: Shoot Charge
      if ((e.code === "Space" || e.code === "KeyK") && !this.isChargingShot) {
        this.startChargeShot();
      }

      // KeyF / KeyJ: Pass
      if (e.code === "KeyF" || e.code === "KeyJ") {
        this.passBall();
      }

      // KeyE / KeyC: Call for Ball
      if (e.code === "KeyE" || e.code === "KeyC") {
        this.callForBall();
      }

      // KeyP: Pause
      if (e.code === "KeyP") {
        this.togglePause();
      }
    }

    handleKeyUp(e) {
      this.keys[e.code] = false;
      if (e.code === "Space" || e.code === "KeyK") {
        this.releaseChargeShot();
      }
    }

    handleMouseMove(e) {
      if (!this.isRunning || this.isPaused) return;
      if (e.buttons === 1 || e.buttons === 2) {
        // Drag turn
        this.player.angle += e.movementX * this.mouseTurnSpeed;
      }
    }

    // --- ACTIONS ---
    startChargeShot() {
      if (!this.player.hasBall) return;
      this.isChargingShot = true;
      this.shotPower = 0.1;
    }

    releaseChargeShot() {
      if (!this.isChargingShot) return;
      this.isChargingShot = false;
      if (!this.player.hasBall) return;

      const power = Math.min(1.0, Math.max(0.2, this.shotPower));
      this.executeShot(power);
      this.shotPower = 0;
    }

    executeShot(power) {
      this.player.hasBall = false;
      this.player.kickAnimation = 1.0;
      this.player.kickType = "shoot";
      this.player.shots += 1;

      // Calculate shot direction based on camera angle and goal vector
      const forwardX = Math.sin(this.player.angle);
      const forwardY = Math.cos(this.player.angle);

      // Shot speed (18 to 34 m/s)
      const speed = 16 + power * 18;
      this.ball.vx = forwardX * speed;
      this.ball.vy = forwardY * speed;
      // Elevation based on power
      this.ball.vz = 2.5 + power * 5.2;

      this.audio.playKick(power);
      this.triggerCommentary(`🚀 Powerful strike by ${this.player.name}! Flying towards goal!`);

      // Opponent Goalkeeper reacts
      this.reactGoalkeeper(this.ball);
    }

    passBall() {
      if (!this.player.hasBall) return;
      this.player.hasBall = false;
      this.player.kickAnimation = 0.8;
      this.player.kickType = "pass";

      // Find nearest teammate in front
      let target = null;
      let bestScore = -999;
      for (const mate of this.teammates) {
        const dx = mate.x - this.player.x;
        const dy = mate.y - this.player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        // dot product with facing vector
        const fx = Math.sin(this.player.angle);
        const fy = Math.cos(this.player.angle);
        const dot = (dx * fx + dy * fy) / (dist || 1);
        if (dot > 0.3 && dist > 3 && dist < 45) {
          const score = dot * 20 - dist * 0.2;
          if (score > bestScore) {
            bestScore = score;
            target = mate;
          }
        }
      }

      if (!target) {
        // Just pass forward
        const fx = Math.sin(this.player.angle);
        const fy = Math.cos(this.player.angle);
        this.ball.vx = fx * 14;
        this.ball.vy = fy * 14;
        this.ball.vz = 0.5;
      } else {
        const dx = target.x - this.ball.x;
        const dy = target.y - this.ball.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        this.ball.vx = (dx / dist) * 16;
        this.ball.vy = (dy / dist) * 16;
        this.ball.vz = 0.4;
        this.player.passesCompleted += 1;
        this.player.rating = Math.min(10, this.player.rating + 0.1);
        this.triggerCommentary(`👟 Crisp pass to ${target.name}!`);
      }

      this.audio.playKick(0.6);
    }

    callForBall() {
      this.audio.playCallSound();
      this.triggerCommentary(`🗣️ "${this.player.name} calling for the ball!"`);

      // If ball is free or with teammate, pass towards player!
      if (!this.player.hasBall) {
        setTimeout(() => {
          if (!this.isRunning) return;
          const dx = this.player.x - this.ball.x;
          const dy = this.player.y - this.ball.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 3) {
            this.ball.vx = (dx / dist) * 15;
            this.ball.vy = (dy / dist) * 15;
            this.ball.vz = 0.4;
            this.audio.playKick(0.6);
            this.triggerCommentary(`🎯 Perfect through ball delivered to your feet!`);
          }
        }, 300);
      }
    }

    reactGoalkeeper(ball) {
      if (!this.goalkeeper) return;
      // Target where ball crosses goal line y = 52.5
      if (ball.vy > 3) {
        const timeToGoal = (52.5 - ball.y) / ball.vy;
        const targetX = ball.x + ball.vx * timeToGoal;
        const targetZ = ball.z + ball.vz * timeToGoal - 0.5 * 9.81 * timeToGoal * timeToGoal;

        setTimeout(() => {
          // Goalkeeper dives towards targetX
          const clampedX = Math.max(-this.goalWidth / 2 - 0.5, Math.min(this.goalWidth / 2 + 0.5, targetX));
          this.goalkeeper.diveX = clampedX;
          // Dive save chance depends on player OVR and shot power
          const saveChance = (Math.abs(clampedX) > (this.goalWidth / 2 - 0.8)) ? 0.35 : 0.65;
          if (Math.random() < saveChance && targetZ < 2.3 && targetZ > 0) {
            // Save!
            setTimeout(() => {
              if (this.ball.inGoal) return;
              this.ball.vx = (Math.random() - 0.5) * 8;
              this.ball.vy = -12;
              this.ball.vz = 4;
              this.player.shotsOnTarget += 1;
              this.triggerCommentary(`🧤 WHAT A SAVE by ${this.goalkeeper.name}! Pushed away!`);
            }, timeToGoal * 850);
          }
        }, 150);
      }
    }

    // --- GAMEPLAY LOOP & PHYSICS ---
    loop(timestamp) {
      if (!this.isRunning) return;
      const dt = Math.min(0.05, (timestamp - this.lastTimestamp) / 1000);
      this.lastTimestamp = timestamp;

      if (!this.isPaused) {
        this.update(dt);
      }
      this.render();

      this.animId = requestAnimationFrame(this.loop);
    }

    update(dt) {
      // 1. Clock & Match Timeline
      this.matchData.second += dt * 3.5; // ~3.5x accelerated match clock
      if (this.matchData.second >= 60) {
        this.matchData.second = 0;
        this.matchData.minute += 1;
        this.updateScoreboardDom();
        if (this.matchData.minute >= 90) {
          this.finishMatch();
          return;
        }
      }

      // 2. Shot Charging
      if (this.isChargingShot) {
        this.shotPower = Math.min(1.0, this.shotPower + dt * 1.2);
        const powerBar = document.getElementById("povPowerMeterFill");
        if (powerBar) powerBar.style.width = `${Math.round(this.shotPower * 100)}%`;
      } else {
        const powerBar = document.getElementById("povPowerMeterFill");
        if (powerBar) powerBar.style.width = `0%`;
      }

      // 3. Player Movement & Steering
      this.player.isSprinting = Boolean(this.keys["ShiftLeft"] || this.keys["ShiftRight"] || this.touchSprint);
      const moveSpeed = this.player.isSprinting && this.player.stamina > 10 ? this.player.sprintSpeed : this.player.speed;

      if (this.player.isSprinting && this.player.stamina > 0) {
        this.player.stamina = Math.max(0, this.player.stamina - dt * 9);
      } else {
        this.player.stamina = Math.min(100, this.player.stamina + dt * 6);
      }

      // Turning
      if (this.keys["KeyA"] || this.keys["ArrowLeft"]) {
        this.player.angle -= dt * 2.4;
      }
      if (this.keys["KeyD"] || this.keys["ArrowRight"]) {
        this.player.angle += dt * 2.4;
      }

      // Forward/Back strafe
      let moveForward = 0;
      let moveStrafe = 0;
      if (this.keys["KeyW"] || this.keys["ArrowUp"]) moveForward += 1;
      if (this.keys["KeyS"] || this.keys["ArrowDown"]) moveForward -= 1;

      // Virtual joystick
      if (this.joystickVector) {
        moveForward = -this.joystickVector.y;
        moveStrafe = this.joystickVector.x;
      }

      const isMoving = (moveForward !== 0 || moveStrafe !== 0);
      if (isMoving) {
        const forwardX = Math.sin(this.player.angle);
        const forwardY = Math.cos(this.player.angle);
        const rightX = Math.cos(this.player.angle);
        const rightY = -Math.sin(this.player.angle);

        const dx = (forwardX * moveForward + rightX * moveStrafe) * moveSpeed * dt;
        const dy = (forwardY * moveForward + rightY * moveStrafe) * moveSpeed * dt;

        this.player.x = Math.max(-33, Math.min(33, this.player.x + dx));
        this.player.y = Math.max(-51, Math.min(51, this.player.y + dy));

        this.player.walkPhase += dt * (this.player.isSprinting ? 14 : 9);
        this.player.distanceRun += Math.sqrt(dx * dx + dy * dy);
      }

      // Kick animation decay
      if (this.player.kickAnimation > 0) {
        this.player.kickAnimation = Math.max(0, this.player.kickAnimation - dt * 3.5);
      }

      // 4. Ball Physics
      if (this.player.hasBall) {
        // Dribble ball right at boots
        const leadDist = 1.15;
        this.ball.x = this.player.x + Math.sin(this.player.angle) * leadDist;
        this.ball.y = this.player.y + Math.cos(this.player.angle) * leadDist;
        this.ball.z = 0.12;
        this.ball.vx = 0;
        this.ball.vy = 0;
        this.ball.vz = 0;
      } else {
        // Free ball movement
        this.ball.x += this.ball.vx * dt;
        this.ball.y += this.ball.vy * dt;
        this.ball.z += this.ball.vz * dt;

        // Gravity
        if (this.ball.z > 0.12) {
          this.ball.vz -= 9.81 * dt;
        } else {
          this.ball.z = 0.12;
          if (this.ball.vz < -1.5) {
            this.ball.vz = -this.ball.vz * 0.62; // bounce
          } else {
            this.ball.vz = 0;
          }
        }

        // Rolling friction
        this.ball.vx *= (1 - dt * 0.45);
        this.ball.vy *= (1 - dt * 0.45);

        // Check player pickup ball
        const pDist = Math.hypot(this.player.x - this.ball.x, this.player.y - this.ball.y);
        if (pDist < 1.4 && this.ball.z < 1.2 && !this.ball.inGoal) {
          this.player.hasBall = true;
          this.ball.vx = 0;
          this.ball.vy = 0;
          this.ball.vz = 0;
        }

        // Goal Check (Target Goal is at y = +52.5, width 7.32m, height 2.44m)
        if (this.ball.y >= 52.4 && Math.abs(this.ball.x) <= (this.goalWidth / 2) && this.ball.z <= this.goalHeight && !this.ball.inGoal) {
          this.triggerGoalEvent(true);
        }

        // Own goal / Away goal check at y = -52.5
        if (this.ball.y <= -52.4 && Math.abs(this.ball.x) <= (this.goalWidth / 2) && this.ball.z <= this.goalHeight && !this.ball.inGoal) {
          this.triggerGoalEvent(false);
        }

        // Out of bounds / reset
        if (Math.abs(this.ball.x) > 35 || Math.abs(this.ball.y) > 54) {
          this.resetBallToPlayer();
        }
      }

      // 5. Teammates & Opponents AI
      this.updateSquadAi(dt);

      // 6. Update HUD elements
      this.updateHudDom();
    }

    updateSquadAi(dt) {
      // Teammates move forward into space
      for (const mate of this.teammates) {
        const targetY = Math.min(42, this.player.y + 14);
        mate.y += (targetY - mate.y) * dt * 0.4;
      }

      // Opponents close down when player has ball
      for (const opp of this.opponents) {
        if (this.player.hasBall) {
          const dx = this.player.x - opp.x;
          const dy = this.player.y - opp.y;
          const dist = Math.hypot(dx, dy);
          if (dist > 2.5) {
            opp.x += (dx / dist) * dt * 2.8;
            opp.y += (dy / dist) * dt * 2.8;
          } else if (dist <= 1.2 && Math.random() < 0.05) {
            // Tackle!
            this.player.hasBall = false;
            this.ball.vx = (Math.random() - 0.5) * 10;
            this.ball.vy = -8;
            this.triggerCommentary(`⚠️ ${opp.name} slides in with a crunching tackle!`);
          }
        }
      }

      // Goalkeeper tracking
      if (this.goalkeeper) {
        const targetX = Math.max(-3.2, Math.min(3.2, this.ball.x * 0.45));
        this.goalkeeper.x += (targetX - this.goalkeeper.x) * dt * 3.5;
      }
    }

    triggerGoalEvent(isPlayerGoal) {
      this.ball.inGoal = true;
      this.audio.playGoalCheer();

      if (isPlayerGoal) {
        this.matchData.homeScore += 1;
        this.player.goals += 1;
        this.player.shotsOnTarget += 1;
        this.player.rating = Math.min(10, this.player.rating + 1.2);
        this.showBanner("⚽ GOOOOAL!", `Magnificent finish by ${this.player.name}!`, `${this.matchData.homeTeam} ${this.matchData.homeScore} - ${this.matchData.awayScore} ${this.matchData.awayTeam}`);
        this.triggerCommentary(`🎉 SENSATIONAL GOAL! ${this.player.name} finds the back of the net! Stadium erupts!`);
      } else {
        this.matchData.awayScore += 1;
        this.showBanner("⚡ OPPONENT GOAL", `${this.matchData.awayTeam} strike back!`, `${this.matchData.homeTeam} ${this.matchData.homeScore} - ${this.matchData.awayScore} ${this.matchData.awayTeam}`);
      }

      this.updateScoreboardDom();

      // Reset to kickoff after 3.2 seconds
      setTimeout(() => {
        if (!this.isRunning) return;
        this.ball.inGoal = false;
        this.player.x = 0;
        this.player.y = -10;
        this.player.angle = 0;
        this.player.hasBall = true;
        this.setupSquads();
        this.audio.playWhistle();
      }, 3200);
    }

    resetBallToPlayer() {
      this.ball.x = this.player.x;
      this.ball.y = this.player.y + 1.2;
      this.ball.z = 0.12;
      this.ball.vx = 0;
      this.ball.vy = 0;
      this.ball.vz = 0;
      this.player.hasBall = true;
      this.triggerCommentary("Ball recovered on the pitch. Keep attacking!");
    }

    showBanner(title, sub, extra) {
      const banner = document.getElementById("povEventBanner");
      if (banner) {
        const titleEl = document.getElementById("povBannerTitle");
        const subEl = document.getElementById("povBannerSubtitle");
        const extraEl = document.getElementById("povBannerExtra");
        if (titleEl) titleEl.innerText = title;
        if (subEl) subEl.innerText = sub;
        if (extraEl) extraEl.innerText = extra;
        banner.style.display = "block";
        clearTimeout(this.bannerTimer);
        this.bannerTimer = setTimeout(() => {
          banner.style.display = "none";
        }, 3000);
      }
    }

    triggerCommentary(text) {
      this.commentary = text;
      const el = document.getElementById("povCommentaryTicker");
      if (el) {
        el.innerText = text;
        el.classList.remove("flash");
        void el.offsetWidth;
        el.classList.add("flash");
      }
    }

    // --- 3D PROJECTION & RENDERING ---
    project3D(wx, wy, wz) {
      // Relative to player eye
      const dx = wx - this.player.x;
      const dy = wy - this.player.y;
      const dz = wz - this.player.eyeHeight;

      // Rotate around player camera heading
      const cosT = Math.cos(-this.player.angle);
      const sinT = Math.sin(-this.player.angle);

      const rx = dx * cosT - dy * sinT; // transverse (left/right)
      const ry = dx * sinT + dy * cosT; // forward distance

      if (ry <= 0.4) return null; // behind camera or too close

      const fov = 420;
      const cx = this.viewWidth / 2;
      const cy = this.viewHeight / 2 + 10;

      // Head bobbing offset
      const bob = Math.sin(this.player.walkPhase) * (this.player.isSprinting ? 5.5 : 3.0);
      const sway = Math.cos(this.player.walkPhase * 0.5) * (this.player.isSprinting ? 3.5 : 1.8);

      const sx = cx + (rx / ry) * fov + sway;
      const sy = cy - (dz / ry) * fov + bob;
      const scale = fov / ry;

      return { sx, sy, scale, depth: ry };
    }

    render() {
      if (!this.ctx) return;
      const ctx = this.ctx;
      const W = this.viewWidth;
      const H = this.viewHeight;

      ctx.clearRect(0, 0, W, H);

      // 1. Stadium Sky & Floodlights
      const skyGrad = ctx.createLinearGradient(0, 0, 0, H * 0.5);
      skyGrad.addColorStop(0, "#030712");
      skyGrad.addColorStop(0.5, "#0b192c");
      skyGrad.addColorStop(1, "#152e4d");
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, W, H * 0.5);

      // Stadium Grandstands (Tiers of animated crowd dots)
      this.renderStadiumGrandstands(ctx, W, H);

      // 2. Pitch Floor (3D receding grass stripes)
      this.renderPitchFloor(ctx, W, H);

      // 3. Pitch Markings (Lines, Circles, Penalty Box)
      this.renderPitchMarkings(ctx);

      // 4. Goal Frame & Ri-ppling Net
      this.renderGoalFrame(ctx);

      // 5. Entities (Opponents, Teammates, Goalkeeper, Ball) - Sorted by depth
      this.renderPitchEntities(ctx);

      // 6. First-Person Player Model (Boots, Arms, Kicking Animation)
      this.renderFirstPersonBoots(ctx, W, H);

      // 7. Tactical Aim Reticle & Mini-Radar
      this.renderTargetCrosshair(ctx, W, H);
      this.renderMiniRadar(ctx);
    }

    renderStadiumGrandstands(ctx, W, H) {
      const horizonY = H * 0.44;

      // Grandstand background structure
      ctx.fillStyle = "#0c1524";
      ctx.fillRect(0, horizonY - 110, W, 110);

      // Animated multi-colored crowd pixels
      const time = performance.now() * 0.002;
      ctx.save();
      for (let x = 10; x < W; x += 12) {
        for (let y = horizonY - 95; y < horizonY - 12; y += 8) {
          const wave = Math.sin(time + x * 0.05 + y * 0.02);
          if (wave > -0.2) {
            ctx.fillStyle = (x % 24 === 0) ? "#ef4444" : ((x % 36 === 0) ? "#3b82f6" : "#f1f5f9");
            ctx.fillRect(x, y, 4, 4);
          }
        }
      }

      // LED Perimeter Advertising Boards
      const ledGrad = ctx.createLinearGradient(0, horizonY - 14, 0, horizonY);
      ledGrad.addColorStop(0, "#fbbf24");
      ledGrad.addColorStop(1, "#d97706");
      ctx.fillStyle = ledGrad;
      ctx.fillRect(0, horizonY - 14, W, 14);

      ctx.fillStyle = "#000";
      ctx.font = "bold 9px sans-serif";
      ctx.fillText("⚽ FOOTBALL AUCTION • PREMIER LEAGUE • TRANSFER MARKET • POV ARENA", 20, horizonY - 4);

      // Floodlight beams
      ctx.fillStyle = "rgba(255, 255, 255, 0.035)";
      ctx.beginPath();
      ctx.moveTo(W * 0.1, 0);
      ctx.lineTo(W * 0.4, horizonY);
      ctx.lineTo(W * 0.05, horizonY);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(W * 0.9, 0);
      ctx.lineTo(W * 0.95, horizonY);
      ctx.lineTo(W * 0.6, horizonY);
      ctx.fill();

      ctx.restore();
    }

    renderPitchFloor(ctx, W, H) {
      // Grass striping bands from y = -52 to +52
      const bandCount = 18;
      const bandLength = 105 / bandCount;

      for (let i = 0; i < bandCount; i++) {
        const yStart = -52.5 + i * bandLength;
        const yEnd = yStart + bandLength;

        // 4 corners of the grass stripe
        const p1 = this.project3D(-34, yStart, 0);
        const p2 = this.project3D(34, yStart, 0);
        const p3 = this.project3D(34, yEnd, 0);
        const p4 = this.project3D(-34, yEnd, 0);

        if (!p1 || !p2 || !p3 || !p4) continue;

        ctx.fillStyle = (i % 2 === 0) ? "#15803d" : "#166534";
        ctx.beginPath();
        ctx.moveTo(p1.sx, p1.sy);
        ctx.lineTo(p2.sx, p2.sy);
        ctx.lineTo(p3.sx, p3.sy);
        ctx.lineTo(p4.sx, p4.sy);
        ctx.closePath();
        ctx.fill();
      }
    }

    renderPitchMarkings(ctx) {
      ctx.save();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.78)";
      ctx.lineWidth = 2.5;

      const draw3DLine = (x1, y1, x2, y2) => {
        const a = this.project3D(x1, y1, 0);
        const b = this.project3D(x2, y2, 0);
        if (a && b) {
          ctx.beginPath();
          ctx.moveTo(a.sx, a.sy);
          ctx.lineTo(b.sx, b.sy);
          ctx.stroke();
        }
      };

      // Outer Pitch Boundaries
      draw3DLine(-34, -52.5, 34, -52.5);
      draw3DLine(34, -52.5, 34, 52.5);
      draw3DLine(34, 52.5, -34, 52.5);
      draw3DLine(-34, 52.5, -34, -52.5);

      // Halfway Line
      draw3DLine(-34, 0, 34, 0);

      // Opponent Penalty Box (at y = 52.5, width 40.3m, length 16.5m)
      draw3DLine(-20.1, 52.5, -20.1, 36);
      draw3DLine(-20.1, 36, 20.1, 36);
      draw3DLine(20.1, 36, 20.1, 52.5);

      // 6-yard Box
      draw3DLine(-9.1, 52.5, -9.1, 47);
      draw3DLine(-9.1, 47, 9.1, 47);
      draw3DLine(9.1, 47, 9.1, 52.5);

      // Penalty Spot
      const spot = this.project3D(0, 41.5, 0);
      if (spot) {
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(spot.sx, spot.sy, Math.max(2, spot.scale * 0.18), 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    renderGoalFrame(ctx) {
      // Goal at y = 52.5, x: -3.66 to +3.66, height: 2.44
      const pLeft = this.project3D(-3.66, 52.5, 0);
      const pRight = this.project3D(3.66, 52.5, 0);
      const pTopLeft = this.project3D(-3.66, 52.5, 2.44);
      const pTopRight = this.project3D(3.66, 52.5, 2.44);

      // Goal Net Back (y = 54.5)
      const pNetTL = this.project3D(-3.66, 54.5, 2.3);
      const pNetTR = this.project3D(3.66, 54.5, 2.3);
      const pNetBL = this.project3D(-3.66, 54.5, 0);
      const pNetBR = this.project3D(3.66, 54.5, 0);

      if (!pLeft || !pRight || !pTopLeft || !pTopRight) return;

      ctx.save();

      // Draw Net Mesh
      if (pNetTL && pNetTR && pNetBL && pNetBR) {
        ctx.fillStyle = "rgba(240, 240, 240, 0.18)";
        ctx.beginPath();
        ctx.moveTo(pTopLeft.sx, pTopLeft.sy);
        ctx.lineTo(pTopRight.sx, pTopRight.sy);
        ctx.lineTo(pNetTR.sx, pNetTR.sy);
        ctx.lineTo(pNetTL.sx, pNetTL.sy);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = "rgba(220, 220, 220, 0.12)";
        ctx.beginPath();
        ctx.moveTo(pNetTL.sx, pNetTL.sy);
        ctx.lineTo(pNetTR.sx, pNetTR.sy);
        ctx.lineTo(pNetBR.sx, pNetBR.sy);
        ctx.lineTo(pNetBL.sx, pNetBL.sy);
        ctx.closePath();
        ctx.fill();
      }

      // Goalposts & Crossbar
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = Math.max(3, pLeft.scale * 0.12);
      ctx.lineCap = "round";

      ctx.beginPath();
      // Left Post
      ctx.moveTo(pLeft.sx, pLeft.sy);
      ctx.lineTo(pTopLeft.sx, pTopLeft.sy);
      // Crossbar
      ctx.lineTo(pTopRight.sx, pTopRight.sy);
      // Right Post
      ctx.lineTo(pRight.sx, pRight.sy);
      ctx.stroke();

      ctx.restore();
    }

    renderPitchEntities(ctx) {
      const entities = [];

      // Add Teammates
      for (const t of this.teammates) {
        entities.push({ type: "player", data: t, x: t.x, y: t.y, z: 0, isTeammate: true });
      }

      // Add Opponents
      for (const o of this.opponents) {
        entities.push({ type: "player", data: o, x: o.x, y: o.y, z: 0, isTeammate: false });
      }

      // Add Goalkeeper
      if (this.goalkeeper) {
        entities.push({ type: "player", data: this.goalkeeper, x: this.goalkeeper.x, y: this.goalkeeper.y, z: 0, isGk: true });
      }

      // Add Ball
      entities.push({ type: "ball", data: this.ball, x: this.ball.x, y: this.ball.y, z: this.ball.z });

      // Sort back-to-front by forward depth distance
      entities.forEach(ent => {
        const proj = this.project3D(ent.x, ent.y, ent.z);
        ent.proj = proj;
      });

      const visible = entities.filter(e => e.proj !== null);
      visible.sort((a, b) => b.proj.depth - a.proj.depth);

      for (const ent of visible) {
        if (ent.type === "player") {
          this.renderPlayerSprite(ctx, ent);
        } else if (ent.type === "ball") {
          this.renderBallSprite(ctx, ent);
        }
      }
    }

    renderPlayerSprite(ctx, ent) {
      const p = ent.proj;
      const pData = ent.data;
      const height = p.scale * 1.8;
      const width = height * 0.42;

      ctx.save();

      // Shadow on pitch
      const shadowProj = this.project3D(ent.x, ent.y, 0);
      if (shadowProj) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
        ctx.beginPath();
        ctx.ellipse(shadowProj.sx, shadowProj.sy, width * 0.7, width * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // Body / Kit
      const kitColor = ent.isTeammate ? "#3b82f6" : (ent.isGk ? "#f59e0b" : "#ef4444");
      ctx.fillStyle = kitColor;
      // Torso
      ctx.fillRect(p.sx - width / 2, p.sy - height * 0.75, width, height * 0.45);

      // Shorts
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(p.sx - width / 2, p.sy - height * 0.3, width, height * 0.2);

      // Legs / Socks
      ctx.fillStyle = kitColor;
      ctx.fillRect(p.sx - width * 0.4, p.sy - height * 0.1, width * 0.3, height * 0.1);
      ctx.fillRect(p.sx + width * 0.1, p.sy - height * 0.1, width * 0.3, height * 0.1);

      // Head
      ctx.fillStyle = "#fbcfe8";
      ctx.beginPath();
      ctx.arc(p.sx, p.sy - height * 0.86, width * 0.35, 0, Math.PI * 2);
      ctx.fill();

      // Player Label / Squad Number above head
      ctx.fillStyle = "#ffffff";
      ctx.font = `bold ${Math.max(9, Math.round(p.scale * 0.14))}px sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(`${pData.name} #${pData.num}`, p.sx, p.sy - height - 4);

      ctx.restore();
    }

    renderBallSprite(ctx, ent) {
      const p = ent.proj;
      const b = ent.data;
      const r = Math.max(3, p.scale * b.radius);

      ctx.save();

      // Ball Shadow
      const shadowProj = this.project3D(b.x, b.y, 0);
      if (shadowProj) {
        const sRadius = Math.max(2, r * (1 - Math.min(0.8, b.z * 0.15)));
        ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
        ctx.beginPath();
        ctx.ellipse(shadowProj.sx, shadowProj.sy, sRadius * 1.1, sRadius * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // Shaded Football Sphere
      const grad = ctx.createRadialGradient(p.sx - r * 0.3, p.sy - r * 0.3, r * 0.1, p.sx, p.sy, r);
      grad.addColorStop(0, "#ffffff");
      grad.addColorStop(0.7, "#e2e8f0");
      grad.addColorStop(1, "#475569");

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.sx, p.sy, r, 0, Math.PI * 2);
      ctx.fill();

      // Ball Pentagons
      ctx.fillStyle = "#0f172a";
      ctx.beginPath();
      ctx.arc(p.sx, p.sy, r * 0.35, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    renderFirstPersonBoots(ctx, W, H) {
      ctx.save();

      const phase = this.player.walkPhase;
      const isSprinting = this.player.isSprinting;
      const kick = this.player.kickAnimation;

      // Stride offsets for left and right boots
      const leftStride = Math.sin(phase) * (isSprinting ? 40 : 25);
      const rightStride = Math.sin(phase + Math.PI) * (isSprinting ? 40 : 25);

      const bootYBase = H - 35;
      const leftBootX = W * 0.38 + Math.cos(phase * 0.5) * 8;
      const rightBootX = W * 0.62 - Math.cos(phase * 0.5) * 8;

      let leftBootY = bootYBase + leftStride;
      let rightBootY = bootYBase + rightStride;

      // Kick swing on right boot
      if (kick > 0) {
        rightBootY -= kick * 75;
      }

      // Draw Left Boot
      this.drawBoot(ctx, leftBootX, leftBootY, "#10b981", "#059669");

      // Draw Right Boot (Striking Boot)
      this.drawBoot(ctx, rightBootX, rightBootY, "#10b981", "#059669");

      // First-person hands / arms when sprinting or calling
      if (isSprinting || kick > 0) {
        ctx.fillStyle = "#fbcfe8";
        // Left hand pumping
        ctx.beginPath();
        ctx.ellipse(W * 0.22, H - 90 + leftStride * 0.6, 22, 12, -0.4, 0, Math.PI * 2);
        ctx.fill();

        // Right hand pumping
        ctx.beginPath();
        ctx.ellipse(W * 0.78, H - 90 + rightStride * 0.6, 22, 12, 0.4, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    drawBoot(ctx, x, y, primaryColor, studColor) {
      ctx.save();
      // Boot shadow
      ctx.fillStyle = "rgba(0,0,0,0.3)";
      ctx.beginPath();
      ctx.ellipse(x, y + 25, 28, 10, 0, 0, Math.PI * 2);
      ctx.fill();

      // Boot Upper
      ctx.fillStyle = primaryColor;
      ctx.beginPath();
      ctx.moveTo(x - 22, y + 10);
      ctx.lineTo(x - 14, y - 28);
      ctx.lineTo(x + 16, y - 20);
      ctx.lineTo(x + 28, y + 15);
      ctx.closePath();
      ctx.fill();

      // White Speed Stripes
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(x - 8, y - 18);
      ctx.lineTo(x + 8, y + 6);
      ctx.stroke();

      // Metallic Gold Studs
      ctx.fillStyle = studColor;
      ctx.fillRect(x - 18, y + 15, 6, 5);
      ctx.fillRect(x + 14, y + 15, 6, 5);

      ctx.restore();
    }

    renderTargetCrosshair(ctx, W, H) {
      if (!this.player.hasBall) return;

      const cx = W / 2;
      const cy = H * 0.46;

      ctx.save();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.45)";
      ctx.lineWidth = 1.5;

      ctx.beginPath();
      ctx.arc(cx, cy, 18, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(cx - 24, cy);
      ctx.lineTo(cx - 10, cy);
      ctx.moveTo(cx + 10, cy);
      ctx.lineTo(cx + 24, cy);
      ctx.moveTo(cx, cy - 24);
      ctx.lineTo(cx, cy - 10);
      ctx.moveTo(cx, cy + 10);
      ctx.lineTo(cx, cy + 24);
      ctx.stroke();

      // Reticle hint
      ctx.fillStyle = "#fef08a";
      ctx.font = "10px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("TARGET RETICLE", cx, cy - 28);

      ctx.restore();
    }

    renderMiniRadar(ctx) {
      const rw = 120;
      const rh = 80;
      const rx = 16;
      const ry = this.viewHeight - rh - 16;

      ctx.save();
      // Radar background
      ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
      ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
      ctx.lineWidth = 1;
      ctx.fillRect(rx, ry, rw, rh);
      ctx.strokeRect(rx, ry, rw, rh);

      // Halfway line
      ctx.beginPath();
      ctx.moveTo(rx, ry + rh / 2);
      ctx.lineTo(rx + rw, ry + rh / 2);
      ctx.stroke();

      // Coordinate converter
      const toRadarX = (wx) => rx + ((wx + 34) / 68) * rw;
      const toRadarY = (wy) => ry + ((52.5 - wy) / 105) * rh;

      // Teammates (Blue dots)
      ctx.fillStyle = "#60a5fa";
      for (const t of this.teammates) {
        ctx.beginPath();
        ctx.arc(toRadarX(t.x), toRadarY(t.y), 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Opponents (Red dots)
      ctx.fillStyle = "#f87171";
      for (const o of this.opponents) {
        ctx.beginPath();
        ctx.arc(toRadarX(o.x), toRadarY(o.y), 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Ball (Yellow dot)
      ctx.fillStyle = "#facc15";
      ctx.beginPath();
      ctx.arc(toRadarX(this.ball.x), toRadarY(this.ball.y), 3, 0, Math.PI * 2);
      ctx.fill();

      // Player POV (Bright Green dot + FOV Cone)
      const px = toRadarX(this.player.x);
      const py = toRadarY(this.player.y);

      ctx.fillStyle = "#22c55e";
      ctx.beginPath();
      ctx.arc(px, py, 4, 0, Math.PI * 2);
      ctx.fill();

      // Cone of vision
      ctx.strokeStyle = "rgba(34, 197, 94, 0.6)";
      ctx.beginPath();
      const fovAngle = 0.55;
      const coneLen = 16;
      ctx.moveTo(px, py);
      ctx.lineTo(px + Math.sin(this.player.angle - fovAngle) * coneLen, py - Math.cos(this.player.angle - fovAngle) * coneLen);
      ctx.moveTo(px, py);
      ctx.lineTo(px + Math.sin(this.player.angle + fovAngle) * coneLen, py - Math.cos(this.player.angle + fovAngle) * coneLen);
      ctx.stroke();

      ctx.restore();
    }

    // --- DOM UPDATES ---
    updateScoreboardDom() {
      const scoreEl = document.getElementById("povScoreDisplay");
      const clockEl = document.getElementById("povMatchClock");
      const homeNameEl = document.getElementById("povHomeName");
      const awayNameEl = document.getElementById("povAwayName");

      if (scoreEl) scoreEl.innerText = `${this.matchData.homeScore} - ${this.matchData.awayScore}`;
      if (clockEl) clockEl.innerText = `${this.matchData.minute}' (${this.matchData.minute < 45 ? 'H1' : 'H2'})`;
      if (homeNameEl) homeNameEl.innerText = this.matchData.homeTeam;
      if (awayNameEl) awayNameEl.innerText = this.matchData.awayTeam;
    }

    updateHudDom() {
      const staminaFill = document.getElementById("povStaminaFill");
      if (staminaFill) staminaFill.style.width = `${Math.round(this.player.stamina)}%`;

      const ratingEl = document.getElementById("povPlayerRating");
      if (ratingEl) ratingEl.innerText = `${this.player.rating.toFixed(1)} ★`;

      const goalsEl = document.getElementById("povPlayerGoals");
      if (goalsEl) goalsEl.innerText = `${this.player.goals}`;

      const assistsEl = document.getElementById("povPlayerAssists");
      if (assistsEl) assistsEl.innerText = `${this.player.assists}`;

      const kmEl = document.getElementById("povPlayerDistance");
      if (kmEl) kmEl.innerText = `${(this.player.distanceRun / 1000).toFixed(2)} km`;

      const nameEl = document.getElementById("povPlayerNameCard");
      if (nameEl) nameEl.innerText = `${this.player.name} (${this.player.position} #${this.player.number} • ${this.player.ovr} OVR)`;
    }

    togglePause() {
      this.isPaused = !this.isPaused;
      const pauseBtn = document.getElementById("povPauseBtn");
      if (pauseBtn) pauseBtn.innerText = this.isPaused ? "▶️ RESUME" : "⏸️ PAUSE";
    }

    finishMatch() {
      this.isRunning = false;
      cancelAnimationFrame(this.animId);
      this.audio.stopCrowdAmbiance();
      this.audio.playWhistle();

      // Submit result to server socket
      if (window.socket && window.socket.emit) {
        window.socket.emit("reportPovMatchResult", {
          divisionId: this.matchData.divisionId,
          round: this.matchData.round,
          fixtureIndex: this.matchData.fixtureIndex,
          homeTeam: this.matchData.homeTeam,
          awayTeam: this.matchData.awayTeam,
          homeScore: this.matchData.homeScore,
          awayScore: this.matchData.awayScore,
          playerStats: {
            name: this.player.name,
            goals: this.player.goals,
            assists: this.player.assists,
            rating: this.player.rating
          }
        });
      }

      this.showBanner("🏁 FULL TIME!", `${this.matchData.homeTeam} ${this.matchData.homeScore} - ${this.matchData.awayScore} ${this.matchData.awayTeam}`, `Your Rating: ${this.player.rating.toFixed(1)} ★ • Goals: ${this.player.goals}`);

      setTimeout(() => {
        if (typeof showSaveToast === "function") {
          showSaveToast(`Match finished! Result: ${this.matchData.homeTeam} ${this.matchData.homeScore} - ${this.matchData.awayScore} ${this.matchData.awayTeam}`, "⚽");
        }
      }, 2500);
    }

    stop() {
      this.isRunning = false;
      this.isPaused = false;
      cancelAnimationFrame(this.animId);
      this.audio.stopCrowdAmbiance();
      window.removeEventListener("keydown", this.handleKeyDown);
      window.removeEventListener("keyup", this.handleKeyUp);
    }
  }

  // Expose global instance
  global.PlayerPovEngine = new PlayerPovEngine();

  // Helper entry points
  global.launchPlayerPovMatch = function(divisionId, round, fixtureIndex) {
    let fixture = null;
    if (window.leagueData && window.leagueData.divisions && window.leagueData.divisions[divisionId]) {
      const fixList = window.leagueData.divisions[divisionId].fixtures || [];
      const roundFix = fixList.filter(f => f.round === round);
      fixture = roundFix[fixtureIndex];
    }

    const modal = document.getElementById("playerPovModal");
    if (modal) {
      modal.style.display = "flex";
      global.PlayerPovEngine.startMatch({
        divisionId: divisionId || 1,
        round: round || 1,
        fixtureIndex: fixtureIndex || 0,
        homeTeam: fixture ? fixture.homeTeam : (window.myTeam || "Athul FC"),
        awayTeam: fixture ? fixture.awayTeam : "Kochi FC"
      });
    }
  };

  global.closePlayerPovModal = function() {
    const modal = document.getElementById("playerPovModal");
    if (modal) modal.style.display = "none";
    if (global.PlayerPovEngine) global.PlayerPovEngine.stop();
  };

})(window);
