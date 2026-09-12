// public/awards_trophy.js - Season Individual Awards & Champion Trophy Lifting Ceremony

(function (global) {
  "use strict";

  let confettiCanvas = null;
  let confettiCtx = null;
  let confettiAnimId = null;
  let confettiParticles = [];

  // =====================================================
  // INDIVIDUAL AWARDS RENDERER
  // =====================================================

  function renderSeasonAwards(awardsData, targetContainer = "awardsSectionContent") {
    const container = typeof targetContainer === "string"
      ? document.getElementById(targetContainer)
      : targetContainer;
    if (!container) return;

    if (!awardsData || !awardsData.ballonDor) {
      container.innerHTML = `
        <div class="awards-empty-card">
          <span style="font-size: 42px;">🏆</span>
          <h3>Season In Progress</h3>
          <p>Complete matchday rounds to accumulate official player stats and crown the Ballon d'Or winner!</p>
        </div>
      `;
      return;
    }

    const b = awardsData.ballonDor;
    const gg = awardsData.goldenGlove;
    const gb = awardsData.goldenBoot;
    const pm = awardsData.playmaker;
    const gboy = awardsData.goldenBoy;
    const tots = awardsData.teamOfTheSeason || [];

    container.innerHTML = `
      <!-- BALLON D'OR PREMIER SPOTLIGHT -->
      <div class="ballon-dor-spotlight-card">
        <div class="ballon-dor-visual-column">
          <div class="trophy-gold-globe">
            <span class="globe-shine"></span>
            <span class="globe-emoji">🏆</span>
          </div>
          <div class="ballon-pedestal">
            <span>BALLON D'OR</span>
          </div>
          <div class="ballon-vote-share">${b.voteShare}% First-Place Votes</div>
        </div>

        <div class="ballon-dor-winner-details">
          <div class="ballon-crown-pill">👑 WORLD FOOTBALLER OF THE YEAR</div>
          <h2 class="ballon-winner-name">${escapeHtml(b.winner)}</h2>
          <div class="ballon-winner-club">
            <span>🛡️</span>
            <span>${escapeHtml(b.club)}</span>
            <span class="club-rating-tag">⭐ ${b.overallRating} OVR</span>
          </div>

          <div class="ballon-stats-grid">
            <div class="bstat-box">
              <span class="val">${b.goals}</span>
              <span class="lbl">Goals</span>
            </div>
            <div class="bstat-box">
              <span class="val">${b.assists}</span>
              <span class="lbl">Assists</span>
            </div>
            <div class="bstat-box">
              <span class="val" style="color: #38bdf8;">${b.averageRating}</span>
              <span class="lbl">Avg Rating</span>
            </div>
            <div class="bstat-box">
              <span class="val" style="color: #facc15;">${b.motmAwards}</span>
              <span class="lbl">MOTM Awards</span>
            </div>
          </div>

          <!-- TOP 5 PODIUM RANKINGS -->
          <div class="ballon-podium-list">
            <div class="podium-header">TOP BALLON D'OR NOMINEES</div>
            ${(b.nominees || []).map((nom, idx) => `
              <div class="podium-row ${idx === 0 ? 'rank-1' : ''}">
                <span class="podium-rank">#${idx + 1}</span>
                <span class="podium-name">${escapeHtml(nom.name)} (${escapeHtml(nom.club)})</span>
                <span class="podium-rating">⭐ ${nom.averageRating}</span>
                <div class="podium-vote-bar"><div class="vote-fill" style="width: ${nom.voteShare}%;"></div></div>
                <span class="podium-votes">${nom.voteShare}%</span>
              </div>
            `).join("")}
          </div>
        </div>
      </div>

      <!-- MAJOR INDIVIDUAL HONORS GRID -->
      <div class="honors-cards-grid">
        
        <!-- 1. GOLDEN GLOVE (YASHIN TROPHY) -->
        <div class="honor-card glove">
          <div class="honor-icon-wrapper glove-icon">🧤</div>
          <div class="honor-type">YASHIN TROPHY</div>
          <div class="honor-title">Golden Glove</div>
          <div class="honor-winner">${escapeHtml(gg.winner)}</div>
          <div class="honor-club">${escapeHtml(gg.club)}</div>
          <div class="honor-stats-row">
            <div><strong>${gg.cleanSheets}</strong> <span>Clean Sheets</span></div>
            <div><strong>${gg.saves}</strong> <span>Total Saves</span></div>
            <div><strong>${gg.savePercentage}%</strong> <span>Save Ratio</span></div>
          </div>
        </div>

        <!-- 2. GOLDEN BOOT (TOP SCORER) -->
        <div class="honor-card boot">
          <div class="honor-icon-wrapper boot-icon">⚽</div>
          <div class="honor-type">PICHICHI TROPHY</div>
          <div class="honor-title">Golden Boot</div>
          <div class="honor-winner">${escapeHtml(gb.winner)}</div>
          <div class="honor-club">${escapeHtml(gb.club)}</div>
          <div class="honor-stats-row">
            <div><strong style="color:#facc15;">${gb.goals}</strong> <span>Goals Scored</span></div>
            <div><strong>${gb.gamesPlayed}</strong> <span>Matches</span></div>
            <div><strong>${gb.conversionRate}%</strong> <span>Conversion</span></div>
          </div>
        </div>

        <!-- 3. PLAYMAKER OF THE YEAR -->
        <div class="honor-card playmaker">
          <div class="honor-icon-wrapper playmaker-icon">🎯</div>
          <div class="honor-type">VISIONARY TROPHY</div>
          <div class="honor-title">Playmaker of Year</div>
          <div class="honor-winner">${escapeHtml(pm.winner)}</div>
          <div class="honor-club">${escapeHtml(pm.club)}</div>
          <div class="honor-stats-row">
            <div><strong style="color:#38bdf8;">${pm.assists}</strong> <span>Assists</span></div>
            <div><strong>${pm.keyPasses}</strong> <span>Key Chances</span></div>
            <div><strong>${pm.passAccuracy}%</strong> <span>Pass Acc.</span></div>
          </div>
        </div>

        <!-- 4. GOLDEN BOY (U-21) -->
        <div class="honor-card golden-boy">
          <div class="honor-icon-wrapper boy-icon">🌟</div>
          <div class="honor-type">KOPA TROPHY</div>
          <div class="honor-title">Golden Boy (U-21)</div>
          <div class="honor-winner">${escapeHtml(gboy.winner)}</div>
          <div class="honor-club">${escapeHtml(gboy.club)} • Age ${gboy.age}</div>
          <div class="honor-stats-row">
            <div><strong style="color:#a855f7;">${gboy.rating}</strong> <span>Rating</span></div>
            <div><strong>${gboy.goals}</strong> <span>Goals</span></div>
            <div><strong>${gboy.assists}</strong> <span>Assists</span></div>
          </div>
        </div>

      </div>

      <!-- TEAM OF THE SEASON (TOTS XI) PITCH -->
      <div class="tots-pitch-section">
        <div class="tots-header">
          <div>
            <h3>⭐ Official Team of the Season (TOTS XI)</h3>
            <p>The 11 most dominant footballers in the championship in tactical 4-3-3 formation</p>
          </div>
          <span class="tots-formation-badge">4 - 3 - 3 ATTACK</span>
        </div>

        <div class="tots-pitch-stage">
          <div class="tots-formation-layer">
            ${renderTotsFormation(tots)}
          </div>
        </div>
      </div>
    `;
  }

  function renderTotsFormation(tots) {
    if (!tots || tots.length === 0) {
      return `<div style="text-align:center; color:#94a3b8; padding:30px;">TOTS players will be selected based on seasonal ratings.</div>`;
    }

    // Positions mapping in 4-3-3:
    // Row 1: Attack (LW, ST, RW)
    // Row 2: Midfield (LCM, CM, RCM)
    // Row 3: Defense (LB, LCB, RCB, RB)
    // Row 4: Goalkeeper (GK)
    let gk = tots.find(p => p.position === "GK") || tots[0];
    let defs = tots.filter(p => ["LB", "CB", "RB"].includes(p.position)).slice(0, 4);
    let mids = tots.filter(p => ["CM", "DMF", "AMF", "CMF"].includes(p.position)).slice(0, 3);
    let fwds = tots.filter(p => ["CF", "ST", "LW", "RW"].includes(p.position)).slice(0, 3);

    // Fallbacks if positions aren't filled
    if (defs.length < 4) defs = tots.slice(1, 5);
    if (mids.length < 3) mids = tots.slice(5, 8);
    if (fwds.length < 3) fwds = tots.slice(8, 11);

    function cardHtml(p) {
      if (!p) return "";
      return `
        <div class="tots-player-card">
          <div class="tots-card-gold-border">
            <span class="tots-rating">${p.rating || 90}</span>
            <span class="tots-pos">${p.position || "CF"}</span>
            <div class="tots-player-face">⚽</div>
            <div class="tots-player-name">${escapeHtml(p.name)}</div>
            <div class="tots-player-club">${escapeHtml(p.club)}</div>
          </div>
        </div>
      `;
    }

    return `
      <!-- FORWARDS LINE -->
      <div class="tots-pitch-row forwards">
        ${fwds.map(p => cardHtml(p)).join("")}
      </div>
      <!-- MIDFIELD LINE -->
      <div class="tots-pitch-row midfielders">
        ${mids.map(p => cardHtml(p)).join("")}
      </div>
      <!-- DEFENDERS LINE -->
      <div class="tots-pitch-row defenders">
        ${defs.map(p => cardHtml(p)).join("")}
      </div>
      <!-- GOALKEEPER -->
      <div class="tots-pitch-row goalkeeper">
        ${cardHtml(gk)}
      </div>
    `;
  }

  // =====================================================
  // CHAMPION TROPHY LIFTING CEREMONY
  // =====================================================

  function openTrophyCeremony(ceremonyData = null) {
    let modal = document.getElementById("trophyCeremonyModal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "trophyCeremonyModal";
      modal.className = "trophy-ceremony-overlay";
      document.body.appendChild(modal);
    }

    const c = ceremonyData || {
      champion: "Real Madrid",
      division: "Division 1",
      points: 26,
      won: 8,
      drawn: 2,
      lost: 0,
      goalDifference: 22,
      captain: "Luka Modrić",
      runnerUp: "Manchester City",
      prizeMoney: "₹50.0M",
      season: 1
    };

    modal.innerHTML = `
      <canvas id="trophyConfettiCanvas" class="trophy-confetti-canvas"></canvas>

      <div class="trophy-stage-podium">
        
        <!-- CLOSE BUTTON -->
        <button type="button" class="trophy-close-btn" onclick="AwardsTrophy.closeCeremony()">✕ EXIT CELEBRATION</button>

        <!-- FLOODLIGHT BEAMS -->
        <div class="stage-spotlight-left"></div>
        <div class="stage-spotlight-right"></div>
        <div class="stage-spotlight-center"></div>

        <!-- CEREMONY BANNER -->
        <div class="ceremony-header-banner">
          <div class="ceremony-tag">🏆 OFFICIAL TROPHY PRESENTATION</div>
          <h1 class="ceremony-title">${escapeHtml(c.champion)} ARE CHAMPIONS!</h1>
          <div class="ceremony-subtitle">Season ${c.season || 1} • ${escapeHtml(c.division)} Champions of the League</div>
        </div>

        <!-- ANIMATED 3D/SVG TROPHY LIFTING ELEMENT -->
        <div class="trophy-lift-container">
          <div class="trophy-sunburst-rays"></div>
          <div class="trophy-sparkle-layer">
            <span class="sparkle s1">✨</span>
            <span class="sparkle s2">⭐</span>
            <span class="sparkle s3">✨</span>
            <span class="sparkle s4">⭐</span>
          </div>

          <!-- LIFTING TROPHY ARTWORK -->
          <div class="animated-cup-figure">
            <div class="cup-ribbon left"></div>
            <div class="cup-ribbon right"></div>
            
            <svg viewBox="0 0 200 240" class="svg-championship-trophy" width="170" height="210">
              <defs>
                <linearGradient id="silverGoldCup" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#fff8db"/>
                  <stop offset="30%" stop-color="#facc15"/>
                  <stop offset="70%" stop-color="#ca8a04"/>
                  <stop offset="100%" stop-color="#854d0e"/>
                </linearGradient>
                <linearGradient id="silverChrome" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stop-color="#ffffff"/>
                  <stop offset="40%" stop-color="#e2e8f0"/>
                  <stop offset="70%" stop-color="#94a3b8"/>
                  <stop offset="100%" stop-color="#475569"/>
                </linearGradient>
                <filter id="cupGlow">
                  <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>

              <!-- Trophy Handles -->
              <path d="M 50 60 C 10 70, 10 130, 55 140 C 45 130, 45 80, 60 70 Z" fill="url(#silverGoldCup)" stroke="#fef08a" stroke-width="1.5"/>
              <path d="M 150 60 C 190 70, 190 130, 145 140 C 155 130, 155 80, 140 70 Z" fill="url(#silverGoldCup)" stroke="#fef08a" stroke-width="1.5"/>

              <!-- Main Goblet Body -->
              <path d="M 55 50 Q 100 45 145 50 L 140 130 Q 100 170 60 130 Z" fill="url(#silverGoldCup)" filter="url(#cupGlow)" stroke="#fef08a" stroke-width="2"/>
              <!-- Rim Trim -->
              <ellipse cx="100" cy="50" rx="45" ry="10" fill="url(#silverChrome)" stroke="#fef08a" stroke-width="1.5"/>
              <!-- Crown Crownlet on Front -->
              <text x="100" y="105" text-anchor="middle" font-size="28" fill="#ffffff">👑</text>
              <text x="100" y="125" text-anchor="middle" font-size="11" font-weight="900" font-family="-apple-system, sans-serif" fill="#ffffff" letter-spacing="1">CHAMPIONS</text>

              <!-- Stem & Pedestal -->
              <rect x="90" y="150" width="20" height="30" fill="url(#silverGoldCup)"/>
              <path d="M 75 180 L 125 180 L 135 210 L 65 210 Z" fill="url(#silverChrome)" stroke="#64748b" stroke-width="1"/>
              <!-- Base Plaque -->
              <rect x="60" y="210" width="80" height="20" rx="3" fill="#0f172a" stroke="#ca8a04" stroke-width="1.5"/>
              <text x="100" y="224" text-anchor="middle" font-size="8" font-weight="800" fill="#facc15">DIVISION 1</text>
            </svg>
          </div>

          <!-- CAPTAIN & SQUAD CELEBRATION -->
          <div class="captain-lift-tag">
            <span class="lift-hands">🙌</span>
            <span>CAPTAIN ${escapeHtml(c.captain).toUpperCase()} LIFTS THE TROPHY!</span>
            <span class="lift-hands">🙌</span>
          </div>
        </div>

        <!-- CHAMPION RECORD & STATS SUMMARY -->
        <div class="ceremony-stats-card">
          <div class="ceremony-stat">
            <div class="val" style="color: #facc15;">${c.points} PTS</div>
            <div class="lbl">Total Points</div>
          </div>
          <div class="ceremony-stat">
            <div class="val" style="color: #10b981;">${c.won}W - ${c.drawn}D - ${c.lost}L</div>
            <div class="lbl">Record (W-D-L)</div>
          </div>
          <div class="ceremony-stat">
            <div class="val" style="color: #38bdf8;">+${c.goalDifference} GD</div>
            <div class="lbl">Goal Difference</div>
          </div>
          <div class="ceremony-stat">
            <div class="val" style="color: #a855f7;">${c.prizeMoney || "₹50M"}</div>
            <div class="lbl">Prize Prize Pool</div>
          </div>
        </div>

      </div>
    `;

    modal.style.display = "flex";
    document.body.style.overflow = "hidden";

    // Launch celebratory fireworks & confetti
    startConfetti();

    // Play triumphant stadium fanfare synth
    playChampionshipFanfare();
  }

  function closeCeremony() {
    const modal = document.getElementById("trophyCeremonyModal");
    if (modal) modal.style.display = "none";
    document.body.style.overflow = "";
    stopConfetti();
  }

  // =====================================================
  // CONFETTI & FIREWORKS CANVASES
  // =====================================================

  function startConfetti() {
    confettiCanvas = document.getElementById("trophyConfettiCanvas");
    if (!confettiCanvas) return;
    confettiCtx = confettiCanvas.getContext("2d");

    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;

    confettiParticles = [];
    const colors = ["#facc15", "#f59e0b", "#38bdf8", "#ef4444", "#10b981", "#a855f7", "#ffffff"];

    for (let i = 0; i < 150; i++) {
      confettiParticles.push({
        x: Math.random() * confettiCanvas.width,
        y: Math.random() * confettiCanvas.height - confettiCanvas.height,
        w: Math.random() * 10 + 6,
        h: Math.random() * 6 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 3,
        vy: Math.random() * 4 + 3,
        rot: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 6
      });
    }

    function loop() {
      if (!confettiCtx || !confettiCanvas) return;
      confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);

      confettiParticles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.rotSpeed;

        if (p.y > confettiCanvas.height) {
          p.y = -20;
          p.x = Math.random() * confettiCanvas.width;
        }

        confettiCtx.save();
        confettiCtx.translate(p.x, p.y);
        confettiCtx.rotate((p.rot * Math.PI) / 180);
        confettiCtx.fillStyle = p.color;
        confettiCtx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        confettiCtx.restore();
      });

      confettiAnimId = requestAnimationFrame(loop);
    }

    loop();
  }

  function stopConfetti() {
    if (confettiAnimId) {
      cancelAnimationFrame(confettiAnimId);
      confettiAnimId = null;
    }
  }

  // Championship Fanfare synthesizer
  function playChampionshipFanfare() {
    if (typeof getAudioCtx !== "function") return;
    const ctx = getAudioCtx();
    if (!ctx) return;

    const notes = [
      { f: 523.25, t: 0.0, d: 0.25 }, // C5
      { f: 659.25, t: 0.28, d: 0.25 }, // E5
      { f: 783.99, t: 0.56, d: 0.35 }, // G5
      { f: 1046.50, t: 0.95, d: 0.70 } // C6 (long triumphant blast)
    ];

    const now = ctx.currentTime;
    notes.forEach(n => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(n.f, now + n.t);

      gain.gain.setValueAtTime(0.001, now + n.t);
      gain.gain.linearRampToValueAtTime(0.3, now + n.t + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + n.t + n.d);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + n.t);
      osc.stop(now + n.t + n.d);
    });
  }

  function escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function generateFallbackAwards(divisionData) {
    const div = divisionData || {};
    const standings = div.standings || [];
    const topClub = standings[0]?.name || "Real Madrid";
    const secondClub = standings[1]?.name || "Manchester City";

    return {
      season: div.currentSeason || 1,
      ballonDor: {
        winner: "Kylian Mbappé",
        club: topClub,
        position: "CF",
        overallRating: 92,
        voteShare: 68.4,
        goals: 12,
        assists: 5,
        avgRating: "8.9",
        keyMoments: "Match-winning hat-trick in El Clásico and led team in decisive moments."
      },
      goldenGlove: {
        winner: "Thibaut Courtois",
        club: topClub,
        cleanSheets: 6,
        saves: 28,
        savePercent: "84.2%"
      },
      goldenBoot: {
        winner: "Erling Haaland",
        club: secondClub,
        goals: 14,
        shotsOnTarget: 31,
        conversionRate: "42.5%"
      },
      playmaker: {
        winner: "Kevin De Bruyne",
        club: secondClub,
        assists: 8,
        keyPasses: 34,
        chancesCreated: 42
      },
      goldenBoy: {
        winner: "Lamine Yamal",
        club: "Barcelona",
        age: 17,
        goals: 5,
        assists: 6,
        dribblesCompleted: 38
      },
      teamOfTheSeason: [
        { name: "Courtois", pos: "GK", ovr: 90, club: topClub },
        { name: "Carvajal", pos: "RB", ovr: 86, club: topClub },
        { name: "Rüdiger", pos: "CB", ovr: 88, club: topClub },
        { name: "Rúben Dias", pos: "CB", ovr: 89, club: secondClub },
        { name: "Gvardiol", pos: "LB", ovr: 85, club: secondClub },
        { name: "Rodri", pos: "CDM", ovr: 91, club: secondClub },
        { name: "Bellingham", pos: "CM", ovr: 90, club: topClub },
        { name: "De Bruyne", pos: "CAM", ovr: 91, club: secondClub },
        { name: "Lamine Yamal", pos: "RW", ovr: 87, club: "Barcelona" },
        { name: "Haaland", pos: "ST", ovr: 91, club: secondClub },
        { name: "Mbappé", pos: "LW", ovr: 92, club: topClub }
      ]
    };
  }

  // Export API
  global.AwardsTrophy = {
    renderSeasonAwards,
    openTrophyCeremony,
    closeCeremony,
    generateFallbackAwards
  };

})(window);
