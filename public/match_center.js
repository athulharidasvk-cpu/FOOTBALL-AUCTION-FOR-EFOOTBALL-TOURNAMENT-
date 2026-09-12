// public/match_center.js - Broadcast Match Center with Team Logos & Minute-by-Minute Live Statistics

(function (global) {
  "use strict";

  // Match Center State
  let currentFixture = null;
  let matchTimeline = [];
  let fullStats = null;
  let currentMinute = 0;
  let isPlaying = false;
  let playbackInterval = null;
  let simSpeed = 2; // default speed multiplier
  let activeFilter = "all"; // all, goals, cards

  // Team Logo & Crest Database
  const CLUB_CRESTS = {
    "Real Madrid": { emoji: "👑", primary: "#ffffff", secondary: "#d4af37", stars: 5 },
    "Barcelona": { emoji: "🔵🔴", primary: "#991b1b", secondary: "#1e3a8a", stars: 5 },
    "Manchester City": { emoji: "🏙️", primary: "#38bdf8", secondary: "#0f172a", stars: 5 },
    "Bayern Munich": { emoji: "🛡️", primary: "#dc2626", secondary: "#ffffff", stars: 5 },
    "Arsenal": { emoji: "🔴⚪", primary: "#ef4444", secondary: "#ffffff", stars: 5 },
    "Liverpool": { emoji: "🦅", primary: "#b91c1c", secondary: "#10b981", stars: 5 },
    "Paris Saint-Germain": { emoji: "🗼", primary: "#1e3a8a", secondary: "#dc2626", stars: 5 },
    "Borussia Dortmund": { emoji: "🐝", primary: "#facc15", secondary: "#09090b", stars: 4.5 },
    "Juventus": { emoji: "🦓", primary: "#ffffff", secondary: "#09090b", stars: 4.5 },
    "Inter Milan": { emoji: "🐍", primary: "#1e40af", secondary: "#09090b", stars: 4.5 },
    "AC Milan": { emoji: "👹", primary: "#dc2626", secondary: "#09090b", stars: 4.5 },
    "Atletico Madrid": { emoji: "🔴⚪", primary: "#b91c1c", secondary: "#1e3a8a", stars: 4.5 },
    "Napoli": { emoji: "🌋", primary: "#0ea5e9", secondary: "#ffffff", stars: 4 },
    "Bayer Leverkusen": { emoji: "🦁", primary: "#dc2626", secondary: "#09090b", stars: 4.5 },
    "Ajax": { emoji: "⚔️", primary: "#ffffff", secondary: "#dc2626", stars: 4 },
    "Benfica": { emoji: "🦅", primary: "#dc2626", secondary: "#ffffff", stars: 4 },
    "Sporting CP": { emoji: "🦁", primary: "#16a34a", secondary: "#ffffff", stars: 4 },
    "FC Porto": { emoji: "🐉", primary: "#1d4ed8", secondary: "#ffffff", stars: 4 }
  };

  function getClubCrest(clubName) {
    if (CLUB_CRESTS[clubName]) return CLUB_CRESTS[clubName];
    // Hash based color
    let hash = 0;
    for (let i = 0; i < clubName.length; i++) hash = clubName.charCodeAt(i) + ((hash << 5) - hash);
    const hues = [210, 350, 140, 270, 45, 180];
    const hue = hues[Math.abs(hash) % hues.length];
    return {
      emoji: "⚽",
      primary: `hsl(${hue}, 80%, 50%)`,
      secondary: "#ffffff",
      stars: 4
    };
  }

  // Load a match fixture into the Match Center
  function loadMatchCenter(fixture, roomTeams = {}) {
    currentFixture = fixture;
    currentMinute = 0;
    stopPlayback();

    // Prepare match timeline and stats from fixture data or generate synthetic broadcast feed
    if (fixture.matchTimeline && fixture.matchStats) {
      matchTimeline = fixture.matchTimeline;
      fullStats = fixture.matchStats;
    } else {
      generateLocalTimelineAndStats(fixture, roomTeams);
    }

    // Populate Matchup Selector
    populateFixtureDropdown();

    // Update Stage UI
    renderMatchCenterStage();

    // Set initial clock to 0 and render minute 0 state
    updateMatchDisplay(0);

    // Auto-start playback
    startPlayback();
  }

  // Generate synthetic minute-by-minute timeline if server didn't pre-attach it
  function generateLocalTimelineAndStats(fixture, roomTeams) {
    const homeTeam = fixture.homeTeam || "Real Madrid";
    const awayTeam = fixture.awayTeam || "Barcelona";
    const homeFinal = fixture.played ? fixture.homeScore : 2;
    const awayFinal = fixture.played ? fixture.awayScore : 1;

    matchTimeline = [];
    matchTimeline.push({
      minute: 1,
      type: "kickoff",
      team: homeTeam,
      player: homeTeam,
      description: "Referee blows the whistle for kick-off! The stadium erupts with noise.",
      homeScore: 0,
      awayScore: 0
    });

    // Spread goals into timeline
    const scorers = fixture.scorers || [
      { scorer: "Vinícius Jr.", minute: 23, team: homeTeam },
      { scorer: "Robert Lewandowski", minute: 52, team: awayTeam },
      { scorer: "Jude Bellingham", minute: 86, team: homeTeam }
    ];

    let currentHome = 0;
    let currentAway = 0;

    for (let m = 2; m <= 90; m++) {
      // Check if goal at this minute
      const goal = scorers.find(s => s.minute === m);
      if (goal) {
        if (goal.team === homeTeam) currentHome++;
        else currentAway++;

        matchTimeline.push({
          minute: m,
          type: "goal",
          team: goal.team,
          player: goal.scorer,
          description: `⚽ GOOOAAAL! ${goal.scorer} finds the back of the net with an unstoppable strike!`,
          homeScore: currentHome,
          awayScore: currentAway
        });
      } else if (m === 45) {
        matchTimeline.push({
          minute: 45,
          type: "halftime",
          team: "both",
          player: "Referee",
          description: `⏱️ Half-time whistle blown. Teams head to the tunnel. Score: ${homeTeam} ${currentHome} - ${currentAway} ${awayTeam}`,
          homeScore: currentHome,
          awayScore: currentAway
        });
      } else if (m % 7 === 0) {
        const isHome = Math.random() > 0.45;
        const actingTeam = isHome ? homeTeam : awayTeam;
        const events = [
          { type: "shot", desc: `💥 Fierce shot unleashed from 22 yards! Just misses the top post.` },
          { type: "save", desc: `🧤 Spectacular diving save by the goalkeeper to tip it over the bar!` },
          { type: "foul", desc: `⚠️ Crunching tackle in midfield. Referee awards a free kick.` },
          { type: "corner", desc: `🚩 Whipped cross deflected behind for a dangerous corner.` },
          { type: "attack", desc: `⚡ Rapid counter-attack down the flank carving through defense.` }
        ];
        const ev = events[Math.floor(Math.random() * events.length)];
        matchTimeline.push({
          minute: m,
          type: ev.type,
          team: actingTeam,
          player: actingTeam,
          description: `${actingTeam}: ${ev.desc}`,
          homeScore: currentHome,
          awayScore: currentAway
        });
      } else if (m === 34 || m === 68) {
        const isHome = m === 34;
        const cardTeam = isHome ? awayTeam : homeTeam;
        matchTimeline.push({
          minute: m,
          type: "yellow_card",
          team: cardTeam,
          player: "Defensive Anchor",
          description: `🟨 Tactical foul to prevent a break. Yellow card issued!`,
          homeScore: currentHome,
          awayScore: currentAway
        });
      }
    }

    matchTimeline.push({
      minute: 90,
      type: "fulltime",
      team: "both",
      player: "Referee",
      description: `🏁 FULL-TIME WHISTLE! An exhilarating contest concludes: ${homeTeam} ${currentHome} - ${currentAway} ${awayTeam}!`,
      homeScore: currentHome,
      awayScore: currentAway
    });

    // Ensure final scores match fixture
    fullStats = {
      possession: { home: 54, away: 46 },
      shots: { home: Math.max(12, currentHome * 4), away: Math.max(8, currentAway * 3) },
      shotsOnTarget: { home: currentHome + 4, away: currentAway + 3 },
      xg: { home: (currentHome * 0.72 + 0.5).toFixed(2), away: (currentAway * 0.65 + 0.4).toFixed(2) },
      passes: { home: 512, away: 438 },
      passAccuracy: { home: 88, away: 82 },
      tackles: { home: 18, away: 16 },
      saves: { home: 4, away: 5 },
      corners: { home: 6, away: 4 },
      fouls: { home: 9, away: 12 },
      yellowCards: { home: 1, away: 2 },
      redCards: { home: 0, away: 0 },
      motm: scorers[0] ? { name: scorers[0].scorer, team: scorers[0].team, rating: "9.2" } : { name: "Captain", team: homeTeam, rating: "8.8" },
      merchSales: {
        jerseysSold: 1450,
        salesMultiplier: 1.5,
        matchRevenue: "₹2.9M"
      }
    };
  }

  // Render the Match Center Stage
  let activeContainer = null;

  function renderMatchCenterStage(customContainer = null) {
    if (customContainer) {
      activeContainer = customContainer;
    }
    const container = activeContainer || document.getElementById("match3dCanvasContainer");
    if (!container) return;

    const homeCrest = getClubCrest(currentFixture.homeTeam);
    const awayCrest = getClubCrest(currentFixture.awayTeam);

    container.innerHTML = `
      <div class="match-broadcast-container">
        
        <!-- TOP STADIUM AMBIENCE & CREST BANNER -->
        <div class="match-stage-backdrop">
          <div class="spotlight-left" style="background: radial-gradient(circle, ${homeCrest.primary}33 0%, transparent 70%);"></div>
          <div class="spotlight-right" style="background: radial-gradient(circle, ${awayCrest.primary}33 0%, transparent 70%);"></div>
          
          <!-- TEAM LOGOS SHOWCASE -->
          <div class="match-teams-showcase">
            <!-- HOME CLUB CREST -->
            <div class="club-crest-card home">
              <div class="crest-emblem-wrapper" style="box-shadow: 0 0 30px ${homeCrest.primary}55; border-color: ${homeCrest.primary};">
                <span class="crest-emoji">${homeCrest.emoji}</span>
              </div>
              <div class="crest-club-name">${currentFixture.homeTeam}</div>
              <div class="crest-stars">⭐⭐⭐⭐⭐</div>
              <div class="crest-status-badge">HOME CLUB</div>
            </div>

            <!-- SCORE & LIVE BROADCAST CLOCK -->
            <div class="scoreboard-center-pod">
              <div class="match-status-pill" id="matchLiveStateBadge">1ST HALF</div>
              <div class="scoreboard-digital-digits">
                <span id="scoreDisplayHome">0</span>
                <span class="digital-colon">:</span>
                <span id="scoreDisplayAway">0</span>
              </div>
              <div class="match-clock-digital" id="matchDigitalClock">0'</div>
              <div class="match-venue-pill">🏟️ ${escapeHtml(currentFixture.matchdayStats?.stadiumName || "Stadium Grand Arena")}</div>
            </div>

            <!-- AWAY CLUB CREST -->
            <div class="club-crest-card away">
              <div class="crest-emblem-wrapper" style="box-shadow: 0 0 30px ${awayCrest.primary}55; border-color: ${awayCrest.primary};">
                <span class="crest-emoji">${awayCrest.emoji}</span>
              </div>
              <div class="crest-club-name">${currentFixture.awayTeam}</div>
              <div class="crest-stars">⭐⭐⭐⭐⭐</div>
              <div class="crest-status-badge">AWAY CLUB</div>
            </div>
          </div>
        </div>

        <!-- SCRUBBER & TIMELINE PROGRESS BAR -->
        <div class="match-scrubber-bar">
          <span class="scrub-label">0'</span>
          <input type="range" id="matchMinuteScrubber" min="0" max="90" value="0" 
                 oninput="MatchCenter.seekMinute(this.value)" 
                 class="match-progress-slider">
          <span class="scrub-label">90'</span>
        </div>

        <!-- SPLIT PANEL: LIVE MINUTE-BY-MINUTE FEED & DYNAMIC STATS -->
        <div class="match-data-grid">
          
          <!-- LEFT: MINUTE-BY-MINUTE COMMENTARY / EVENTS TICKER -->
          <div class="match-timeline-panel">
            <div class="panel-header">
              <div class="panel-title-tag">
                <span>⏱️</span>
                <span>MINUTE-BY-MINUTE LIVE FEED</span>
              </div>
              <div class="timeline-filters">
                <button type="button" class="tfilter-btn active" id="tf_all" onclick="MatchCenter.setFilter('all')">All</button>
                <button type="button" class="tfilter-btn" id="tf_goals" onclick="MatchCenter.setFilter('goals')">⚽ Goals</button>
                <button type="button" class="tfilter-btn" id="tf_cards" onclick="MatchCenter.setFilter('cards')">🟨 Discipline</button>
              </div>
            </div>

            <div class="timeline-events-scroll" id="timelineEventsScroll">
              <!-- Dynamically populated minute entries -->
            </div>
          </div>

          <!-- RIGHT: LIVE DYNAMIC STATISTICS & MERCH REVENUE -->
          <div class="match-stats-panel">
            <div class="panel-header">
              <div class="panel-title-tag">
                <span>📊</span>
                <span>MATCHDAY STATISTICS & IMPACT</span>
              </div>
              <span class="live-pulse-dot" title="Live sync"></span>
            </div>

            <!-- STATS METRICS -->
            <div class="stats-comparison-card" id="statsComparisonCard">
              <!-- Dynamic comparison bars -->
            </div>

            <!-- MOTM & MERCHANDISE EXTRA TILE -->
            <div class="match-motm-merch-row" id="matchMotmMerchRow">
              <!-- MOTM & Jersey Sales -->
            </div>
          </div>

        </div>

      </div>
    `;

    // Hook up play/pause button in top header
    const btnPlay = document.getElementById("btnMatch3dPlay");
    if (btnPlay) {
      btnPlay.innerHTML = "⏸️ Pause";
    }
  }

  // Update Match state to a specific minute
  function updateMatchDisplay(minute) {
    currentMinute = parseInt(minute, 10);

    // Update digital clock
    const clockEl = document.getElementById("matchDigitalClock");
    if (clockEl) clockEl.innerText = `${currentMinute}'`;

    const hudClock = document.getElementById("hudMatchClock");
    if (hudClock) hudClock.innerText = `${currentMinute}'`;

    // Update scrubber slider
    const scrub = document.getElementById("matchMinuteScrubber");
    if (scrub && parseInt(scrub.value, 10) !== currentMinute) {
      scrub.value = currentMinute;
    }

    // Determine current score up to this minute
    let homeScore = 0;
    let awayScore = 0;
    const eventsUpToNow = matchTimeline.filter(e => e.minute <= currentMinute);
    eventsUpToNow.forEach(e => {
      if (e.type === "goal") {
        if (e.team === currentFixture.homeTeam) homeScore++;
        else awayScore++;
      }
    });

    // Update score display
    const hScore = document.getElementById("scoreDisplayHome");
    const aScore = document.getElementById("scoreDisplayAway");
    if (hScore) hScore.innerText = homeScore;
    if (aScore) aScore.innerText = awayScore;

    const hudHome = document.getElementById("hudScoreHome");
    const hudAway = document.getElementById("hudScoreAway");
    if (hudHome) hudHome.innerText = homeScore;
    if (hudAway) hudAway.innerText = awayScore;

    // Update Match Status Badge
    const stateBadge = document.getElementById("matchLiveStateBadge");
    if (stateBadge) {
      if (currentMinute === 0) stateBadge.innerText = "PRE-MATCH";
      else if (currentMinute < 45) stateBadge.innerText = "1ST HALF";
      else if (currentMinute === 45) stateBadge.innerText = "HALF-TIME";
      else if (currentMinute < 90) stateBadge.innerText = "2ND HALF";
      else stateBadge.innerText = "FULL-TIME";
    }

    // Render Timeline Events list up to current minute
    renderTimelineEvents(eventsUpToNow);

    // Calculate dynamic stats scaled by minute progress (minute / 90)
    renderDynamicStats(currentMinute / 90);

    // Check if celebration banner should trigger
    const latestEvent = eventsUpToNow[eventsUpToNow.length - 1];
    if (latestEvent && latestEvent.type === "goal" && latestEvent.minute === currentMinute) {
      triggerGoalBanner(latestEvent);
      if (typeof playCheerSound === "function") playCheerSound();
    }
  }

  function renderTimelineEvents(events) {
    const scroll = document.getElementById("timelineEventsScroll");
    if (!scroll) return;

    let filtered = events;
    if (activeFilter === "goals") {
      filtered = events.filter(e => e.type === "goal");
    } else if (activeFilter === "cards") {
      filtered = events.filter(e => e.type === "yellow_card" || e.type === "red_card");
    }

    if (filtered.length === 0) {
      scroll.innerHTML = `<div class="timeline-empty">Waiting for match actions... Scrubber is at ${currentMinute}'</div>`;
      return;
    }

    let html = "";
    // Display recent events first or reverse chronological
    filtered.slice().reverse().forEach(ev => {
      let icon = "⚡";
      let cardClass = "ev-action";
      if (ev.type === "goal") {
        icon = "⚽";
        cardClass = "ev-goal";
      } else if (ev.type === "save") {
        icon = "🧤";
        cardClass = "ev-save";
      } else if (ev.type === "yellow_card") {
        icon = "🟨";
        cardClass = "ev-yellow";
      } else if (ev.type === "red_card") {
        icon = "🟥";
        cardClass = "ev-red";
      } else if (ev.type === "kickoff" || ev.type === "fulltime" || ev.type === "halftime") {
        icon = "🏁";
        cardClass = "ev-whistle";
      }

      html += `
        <div class="timeline-entry ${cardClass}">
          <div class="entry-minute">${ev.minute}'</div>
          <div class="entry-icon">${icon}</div>
          <div class="entry-content">
            <div class="entry-title">${escapeHtml(ev.player || ev.team)}</div>
            <div class="entry-desc">${escapeHtml(ev.description)}</div>
          </div>
          <div class="entry-score-tag">${ev.homeScore ?? 0} - ${ev.awayScore ?? 0}</div>
        </div>
      `;
    });

    scroll.innerHTML = html;
  }

  function renderDynamicStats(progressRatio) {
    const statsCard = document.getElementById("statsComparisonCard");
    const motmRow = document.getElementById("matchMotmMerchRow");
    if (!statsCard || !fullStats) return;

    const factor = Math.max(0.05, Math.min(1.0, progressRatio));

    // Dynamic stats values scaled with match progress
    const hPoss = fullStats.possession.home;
    const aPoss = fullStats.possession.away;

    const hShots = Math.round(fullStats.shots.home * factor);
    const aShots = Math.round(fullStats.shots.away * factor);

    const hShotsOT = Math.round(fullStats.shotsOnTarget.home * factor);
    const aShotsOT = Math.round(fullStats.shotsOnTarget.away * factor);

    const hXg = (parseFloat(fullStats.xg.home) * factor).toFixed(2);
    const aXg = (parseFloat(fullStats.xg.away) * factor).toFixed(2);

    const hPasses = Math.round(fullStats.passes.home * factor);
    const aPasses = Math.round(fullStats.passes.away * factor);

    const hSaves = Math.round(fullStats.saves.home * factor);
    const aSaves = Math.round(fullStats.saves.away * factor);

    const hCorners = Math.round(fullStats.corners.home * factor);
    const aCorners = Math.round(fullStats.corners.away * factor);

    const hFouls = Math.round(fullStats.fouls.home * factor);
    const aFouls = Math.round(fullStats.fouls.away * factor);

    statsCard.innerHTML = `
      <!-- POSSESSION BAR -->
      <div class="stat-bar-group">
        <div class="stat-bar-labels">
          <span class="stat-team-val">${hPoss}%</span>
          <span class="stat-metric-title">Ball Possession</span>
          <span class="stat-team-val">${aPoss}%</span>
        </div>
        <div class="stat-progress-track">
          <div class="stat-bar-fill home" style="width: ${hPoss}%;"></div>
          <div class="stat-bar-fill away" style="width: ${aPoss}%;"></div>
        </div>
      </div>

      <!-- EXPECTED GOALS (xG) -->
      <div class="stat-bar-group">
        <div class="stat-bar-labels">
          <span class="stat-team-val">${hXg}</span>
          <span class="stat-metric-title">Expected Goals (xG)</span>
          <span class="stat-team-val">${aXg}</span>
        </div>
        <div class="stat-progress-track">
          <div class="stat-bar-fill home" style="width: ${(parseFloat(hXg) / (parseFloat(hXg) + parseFloat(aXg) + 0.01)) * 100}%;"></div>
        </div>
      </div>

      <!-- TOTAL SHOTS & TARGET -->
      <div class="stat-bar-group">
        <div class="stat-bar-labels">
          <span class="stat-team-val">${hShots} (${hShotsOT})</span>
          <span class="stat-metric-title">Total Shots (On Target)</span>
          <span class="stat-team-val">${aShots} (${aShotsOT})</span>
        </div>
        <div class="stat-progress-track">
          <div class="stat-bar-fill home" style="width: ${(hShots / (hShots + aShots + 1)) * 100}%;"></div>
        </div>
      </div>

      <!-- PASSES COMPLETED -->
      <div class="stat-bar-group">
        <div class="stat-bar-labels">
          <span class="stat-team-val">${hPasses} (${fullStats.passAccuracy.home}%)</span>
          <span class="stat-metric-title">Passes Completed & Accuracy</span>
          <span class="stat-team-val">${aPasses} (${fullStats.passAccuracy.away}%)</span>
        </div>
        <div class="stat-progress-track">
          <div class="stat-bar-fill home" style="width: ${(hPasses / (hPasses + aPasses + 1)) * 100}%;"></div>
        </div>
      </div>

      <!-- GOALKEEPER SAVES -->
      <div class="stat-bar-group">
        <div class="stat-bar-labels">
          <span class="stat-team-val">${hSaves}</span>
          <span class="stat-metric-title">Goalkeeper Saves</span>
          <span class="stat-team-val">${aSaves}</span>
        </div>
      </div>

      <!-- CORNERS & FOULS -->
      <div class="stat-mini-grid">
        <div class="stat-mini-box">
          <span class="val">${hCorners} : ${aCorners}</span>
          <span class="lbl">Corners</span>
        </div>
        <div class="stat-mini-box">
          <span class="val">${hFouls} : ${aFouls}</span>
          <span class="lbl">Fouls</span>
        </div>
        <div class="stat-mini-box">
          <span class="val">${fullStats.yellowCards.home} : ${fullStats.yellowCards.away}</span>
          <span class="lbl">Yellow Cards</span>
        </div>
      </div>
    `;

    // MOTM & Merchandise Revenue Spotlight
    if (motmRow) {
      const jerseysSoldDynamic = Math.round(1450 * factor);
      const revDynamic = (2.9 * factor).toFixed(1);

      motmRow.innerHTML = `
        <div class="motm-tile">
          <div class="motm-header">
            <span class="motm-crown">⭐</span>
            <span class="motm-label">PLAYER OF THE MATCH</span>
          </div>
          <div class="motm-name">${escapeHtml(fullStats.motm.name)}</div>
          <div class="motm-meta">${escapeHtml(fullStats.motm.team)} • Rating: <strong style="color:#facc15;">${fullStats.motm.rating}</strong></div>
        </div>

        <div class="matchday-merch-tile">
          <div class="merch-head">
            <span>👕 MATCHDAY KIT REVENUE</span>
            <span class="multiplier-chip">1.5x Multiplier</span>
          </div>
          <div class="merch-val">+₹${revDynamic}M Earned</div>
          <div class="merch-sub">${jerseysSoldDynamic.toLocaleString()} Official Club Jerseys Sold Today!</div>
        </div>
      `;
    }
  }

  function triggerGoalBanner(event) {
    const banner = document.getElementById("match3dGoalBanner");
    if (!banner) return;
    banner.innerHTML = `
      <div class="banner-fire">⚽ GOOOOOAL!</div>
      <div class="banner-scorer">${escapeHtml(event.player)} (${event.minute}')</div>
      <div class="banner-sub">${escapeHtml(event.team)} takes the glory!</div>
    `;
    banner.classList.add("show");
    setTimeout(() => {
      banner.classList.remove("show");
    }, 2800);
  }

  // Playback Control Methods
  function startPlayback() {
    stopPlayback();
    isPlaying = true;
    const intervalMs = Math.max(80, 500 / simSpeed);

    playbackInterval = setInterval(() => {
      if (currentMinute >= 90) {
        stopPlayback();
        return;
      }
      currentMinute++;
      updateMatchDisplay(currentMinute);
    }, intervalMs);

    updatePlayPauseButton();
  }

  function stopPlayback() {
    if (playbackInterval) {
      clearInterval(playbackInterval);
      playbackInterval = null;
    }
    isPlaying = false;
    updatePlayPauseButton();
  }

  function togglePlayPause() {
    if (isPlaying) {
      stopPlayback();
    } else {
      if (currentMinute >= 90) currentMinute = 0;
      startPlayback();
    }
    return isPlaying;
  }

  function seekMinute(val) {
    const min = parseInt(val, 10);
    updateMatchDisplay(min);
  }

  function nextHighlight() {
    const nextGoal = matchTimeline.find(e => e.minute > currentMinute && (e.type === "goal" || e.type === "save" || e.type === "red_card"));
    if (nextGoal) {
      seekMinute(nextGoal.minute);
    } else {
      seekMinute(90);
    }
  }

  function prevHighlight() {
    const prevGoals = matchTimeline.filter(e => e.minute < currentMinute && (e.type === "goal" || e.type === "save"));
    if (prevGoals.length > 0) {
      const prev = prevGoals[prevGoals.length - 1];
      seekMinute(prev.minute);
    } else {
      seekMinute(0);
    }
  }

  function replayMatch() {
    seekMinute(0);
    startPlayback();
  }

  function setSpeed(spd) {
    simSpeed = spd;
    if (isPlaying) {
      startPlayback();
    }
    document.querySelectorAll(".speed-btn").forEach(btn => {
      btn.classList.toggle("active", parseInt(btn.dataset.speed, 10) === spd);
    });
  }

  function setFilter(filter) {
    activeFilter = filter;
    document.querySelectorAll(".tfilter-btn").forEach(btn => {
      btn.classList.toggle("active", btn.id === `tf_${filter}`);
    });
    const eventsUpToNow = matchTimeline.filter(e => e.minute <= currentMinute);
    renderTimelineEvents(eventsUpToNow);
  }

  function updatePlayPauseButton() {
    const btn = document.getElementById("btnMatch3dPlay");
    if (btn) {
      btn.innerHTML = isPlaying ? "⏸️ Pause" : "▶️ Play";
    }
  }

  function populateFixtureDropdown() {
    const select = document.getElementById("match3dFixtureSelect");
    if (!select) return;

    const div = leagueData?.divisions?.[currentDivisionTab];
    const fixtures = div?.fixtures || [];

    if (fixtures.length === 0) {
      select.innerHTML = `<option value="showcase">Showcase Derby Match</option>`;
      return;
    }

    let html = "";
    fixtures.forEach((f, idx) => {
      const playedMark = f.played ? `(${f.homeScore}-${f.awayScore})` : "(Upcoming)";
      const derbyMark = f.isRivalry ? "🔥 " : "";
      html += `<option value="${idx}">R${f.round}: ${derbyMark}${f.homeTeam} vs ${f.awayTeam} ${playedMark}</option>`;
    });

    select.innerHTML = html;
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

  function renderMatchCenterInto(container, fixture, roomTeams = {}) {
    if (container) activeContainer = container;
    loadMatchCenter(fixture, roomTeams);
  }

  function pause() {
    stopPlayback();
    const btnPlay = document.getElementById("btnMatch3dPlay");
    if (btnPlay) {
      btnPlay.innerHTML = "▶️ Play";
    }
  }

  // Export API
  global.MatchCenter = {
    loadMatchCenter,
    renderMatchCenterInto,
    pause,
    togglePlayPause,
    seekMinute,
    nextHighlight,
    prevHighlight,
    replayMatch,
    setSpeed,
    setFilter,
    get isPlaying() { return isPlaying; },
    get currentMinute() { return currentMinute; },
    destroy() {
      stopPlayback();
    }
  };

})(window);
