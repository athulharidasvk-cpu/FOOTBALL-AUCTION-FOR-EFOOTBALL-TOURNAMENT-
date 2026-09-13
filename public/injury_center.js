// public/injury_center.js - Player Injury List & Club Medical Centre Engine

(function (global) {
  "use strict";

  // Common football injury catalog with realistic diagnosis and physio notes
  const INJURY_CATALOG = [
    {
      type: "Hamstring Strain",
      severity: "Moderate",
      matches: 2,
      note: "Acute strain to the biceps femoris incurred during high-speed sprint. Prescribed cryo-compression and isometric loading."
    },
    {
      type: "Lateral Ankle Sprain",
      severity: "Minor",
      matches: 1,
      note: "Inversion ankle injury after heavy tackle. Minor ligament laxity with swelling. Undergoing ice baths and resistance band rehab."
    },
    {
      type: "Cruciate Ligament (ACL) Strain",
      severity: "Severe",
      matches: 5,
      note: "Partial tear of the anterior cruciate ligament. Avoided surgery, undergoing intensive non-weight-bearing stabilization."
    },
    {
      type: "Meniscus Knee Contusion",
      severity: "Moderate",
      matches: 3,
      note: "Impact trauma causing joint effusion and inflammation. Prescribed anti-inflammatory protocol and low-impact pool therapy."
    },
    {
      type: "Groin / Adductor Tear",
      severity: "Moderate",
      matches: 2,
      note: "Overstretched adductor longus on shooting follow-through. Undergoing core stabilization and neuromuscular retraining."
    },
    {
      type: "Calf Muscle Tightness",
      severity: "Minor",
      matches: 1,
      note: "Muscular fatigue and micro-spasms in soleus. Undergoing deep tissue sports massage and contrast water therapy."
    },
    {
      type: "Metatarsal Stress Fracture",
      severity: "Severe",
      matches: 4,
      note: "Hairline stress reaction on 5th metatarsal. Protective walking boot applied with progressive bone-stimulator treatment."
    },
    {
      type: "Dislocated Shoulder",
      severity: "Moderate",
      matches: 3,
      note: "Subluxation after awkward aerial collision. Joint successfully relocated; undergoing rotator cuff strengthening."
    }
  ];

  // Default seed injuries for immersion
  let activeInjuries = [
    {
      id: "inj_1",
      playerName: "Bukayo Saka",
      club: "Arsenal",
      position: "RW",
      rating: 89,
      injuryType: "Hamstring Strain",
      severity: "Moderate",
      matchesRemaining: 2,
      totalMatches: 3,
      recoveryPct: 40,
      status: "Ruled Out",
      physioNote: "Sustained high-speed sprinting strain in last weekend's derby. Undergoing specialized cryogenic rehab.",
      occurredMatchday: 1
    },
    {
      id: "inj_2",
      playerName: "Thibaut Courtois",
      club: "Real Madrid",
      position: "GK",
      rating: 90,
      injuryType: "Lateral Ankle Sprain",
      severity: "Minor",
      matchesRemaining: 1,
      totalMatches: 2,
      recoveryPct: 75,
      status: "Doubtful",
      physioNote: "Tweaked left ankle in training save drill. Mobility recovering well; late fitness test scheduled.",
      occurredMatchday: 1
    },
    {
      id: "inj_3",
      playerName: "Rodri",
      club: "Manchester City",
      position: "CDM",
      rating: 91,
      injuryType: "Cruciate Ligament (ACL) Strain",
      severity: "Severe",
      matchesRemaining: 4,
      totalMatches: 6,
      recoveryPct: 30,
      status: "Ruled Out",
      physioNote: "Undergoing specialized regenerative treatment in Barcelona clinic. Progressing ahead of original prognosis.",
      occurredMatchday: 1
    },
    {
      id: "inj_4",
      playerName: "Jamal Musiala",
      club: "Bayern Munich",
      position: "CAM",
      rating: 88,
      injuryType: "Groin / Adductor Tear",
      severity: "Moderate",
      matchesRemaining: 2,
      totalMatches: 3,
      recoveryPct: 50,
      status: "Ruled Out",
      physioNote: "Adductor overload from rapid dribbling decelerations. Light ball-work resumed today.",
      occurredMatchday: 1
    }
  ];

  let currentFilter = "myClub"; // "myClub", "all", "severe", "fit"

  // Check if player is currently injured
  function isPlayerInjured(playerName) {
    if (!playerName) return null;
    const clean = String(playerName).toLowerCase().trim();
    return activeInjuries.find(i => 
      i.matchesRemaining > 0 && 
      String(i.playerName).toLowerCase().trim() === clean
    ) || null;
  }

  // Count injuries for a specific squad
  function getSquadInjuryCount(teamName) {
    if (!teamName) return 0;
    const clean = String(teamName).toLowerCase().trim();
    return activeInjuries.filter(i => 
      i.matchesRemaining > 0 && 
      String(i.club).toLowerCase().trim() === clean
    ).length;
  }

  // Update or sync injuries from server state
  function syncInjuries(injuriesList) {
    if (Array.isArray(injuriesList)) {
      activeInjuries = [...injuriesList];
    }
    renderMedicalCentre();
    updateAppHeaderInjuryBadge();
  }

  // Generate an injury randomly (e.g. during a match simulation)
  function triggerMatchInjury(player, clubName) {
    const template = INJURY_CATALOG[Math.floor(Math.random() * INJURY_CATALOG.length)];
    const newInjury = {
      id: "inj_" + Math.random().toString(36).substr(2, 8),
      playerName: player.name,
      club: clubName,
      position: player.position || "FW",
      rating: player.rating || 82,
      injuryType: template.type,
      severity: template.severity,
      matchesRemaining: template.matches,
      totalMatches: template.matches,
      recoveryPct: 15,
      status: "Ruled Out",
      physioNote: template.note,
      occurredMatchday: typeof currentSeasonRound !== "undefined" ? currentSeasonRound : 1
    };

    activeInjuries.unshift(newInjury);
    renderMedicalCentre();
    updateAppHeaderInjuryBadge();
    return newInjury;
  }

  // Advance recovery when a matchday concludes
  function advanceMatchdayRecovery() {
    activeInjuries.forEach(inj => {
      if (inj.matchesRemaining > 0) {
        inj.matchesRemaining = Math.max(0, inj.matchesRemaining - 1);
        const progress = Math.round(((inj.totalMatches - inj.matchesRemaining) / inj.totalMatches) * 100);
        inj.recoveryPct = Math.min(100, Math.max(progress, inj.recoveryPct + 25));

        if (inj.matchesRemaining === 0) {
          inj.status = "Cleared & Fit";
          inj.recoveryPct = 100;
          inj.physioNote = "Fully cleared by Chief Medical Officer. Return to full squad training approved.";
        } else if (inj.matchesRemaining === 1) {
          inj.status = "Doubtful (Late Test)";
        }
      }
    });

    renderMedicalCentre();
    updateAppHeaderInjuryBadge();
  }

  // Safe club name resolution preventing HTMLElement DOM id collision
  function getSafeUserClub() {
    if (typeof window.getActiveUserTeam === "function") {
      try {
        const val = window.getActiveUserTeam();
        if (typeof val === "string" && val.trim()) return val.trim();
      } catch (e) {}
    }
    if (typeof window.userClubName === "string" && window.userClubName.trim()) {
      return window.userClubName.trim();
    }
    if (typeof myTeam === "string" && myTeam.trim()) {
      return myTeam.trim();
    }
    const badge = document.getElementById("myTeamBadge") || document.getElementById("myTeam");
    if (badge && typeof badge.innerText === "string") {
      const txt = badge.innerText.trim();
      if (txt && txt !== "Not Joined") return txt;
    }
    return "Real Madrid";
  }

  // Accelerate rehab by spending club funds
  function accelerateRehab(injuryId) {
    const inj = activeInjuries.find(i => i.id === injuryId);
    if (!inj) return;

    const userClub = getSafeUserClub();
    
    // Deduct cost if socket available
    if (typeof socket !== "undefined") {
      socket.emit("acceleratePlayerRehab", {
        teamName: userClub,
        injuryId: injuryId,
        cost: 2.5
      });
    }

    // Local immediate feedback
    if (inj.matchesRemaining > 0) {
      inj.matchesRemaining = Math.max(0, inj.matchesRemaining - 1);
      inj.recoveryPct = Math.min(100, inj.recoveryPct + 35);
      if (inj.matchesRemaining === 0) {
        inj.status = "Cleared & Fit";
        inj.recoveryPct = 100;
        inj.physioNote = "Fast-track cryogenic therapy successful! Player has achieved full medical clearance.";
      } else {
        inj.physioNote = "Hyperbaric chamber treatment completed. Muscle recovery accelerated by 1 match.";
      }
    }

    if (typeof playFanfareSound === "function") playFanfareSound();
    renderMedicalCentre();
    updateAppHeaderInjuryBadge();
  }

  // Run Late Fitness Test
  function runLateFitnessTest(injuryId) {
    const inj = activeInjuries.find(i => i.id === injuryId);
    if (!inj) return;

    const pass = Math.random() > 0.4;
    if (pass) {
      inj.matchesRemaining = 0;
      inj.recoveryPct = 100;
      inj.status = "Cleared (Taped)";
      inj.physioNote = "Passed morning fitness test! Cleared to feature with protective strapping.";
      showMedicalNotice(`✅ Fitness Test Passed: ${inj.playerName} is declared FIT for matchday selection!`, true);
    } else {
      inj.physioNote = "Late fitness test failed. Pain flare-up detected during sprint drills. Kept in medical bay for safety.";
      showMedicalNotice(`⚠️ Fitness Test Failed: Medical staff recommend 1 more match of rehabilitation for ${inj.playerName}.`, false);
    }

    renderMedicalCentre();
    updateAppHeaderInjuryBadge();
  }

  // Styled non-blocking in-app notification toast
  function showMedicalNotice(msg, isSuccess = true) {
    let toast = document.getElementById("medicalToastNotice");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "medicalToastNotice";
      toast.style.cssText = "position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#0f172a;color:#fff;padding:12px 20px;border-radius:12px;font-size:13px;font-weight:700;z-index:99999;box-shadow:0 10px 30px rgba(0,0,0,0.6);border:1px solid #38bdf8;display:flex;align-items:center;gap:10px;transition:all 0.3s ease;";
      document.body.appendChild(toast);
    }
    toast.style.borderColor = isSuccess ? "#10b981" : "#f59e0b";
    toast.innerText = msg;
    toast.style.opacity = "1";
    toast.style.transform = "translateX(-50%) translateY(0)";
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(-50%) translateY(20px)";
    }, 4000);
  }

  // Render the comprehensive Medical Centre UI
  function renderMedicalCentre(targetContainer = "injuryListContainer") {
    const container = typeof targetContainer === "string"
      ? document.getElementById(targetContainer)
      : targetContainer;
    if (!container) return;

    const userClub = getSafeUserClub();

    // Filter injuries
    let displayList = [...activeInjuries];
    if (currentFilter === "myClub") {
      displayList = displayList.filter(i => String(i.club).toLowerCase() === userClub.toLowerCase());
    } else if (currentFilter === "severe") {
      displayList = displayList.filter(i => i.severity === "Severe" && i.matchesRemaining > 0);
    } else if (currentFilter === "fit") {
      displayList = displayList.filter(i => i.matchesRemaining === 0);
    } else {
      // "all" - active first
      displayList.sort((a, b) => b.matchesRemaining - a.matchesRemaining);
    }

    const myClubInjuries = activeInjuries.filter(i => String(i.club).toLowerCase() === userClub.toLowerCase() && i.matchesRemaining > 0);
    const squadHealth = Math.max(65, 100 - (myClubInjuries.length * 7));

    container.innerHTML = `
      <div class="medical-centre-wrap">
        
        <!-- MEDICAL HEADER & SQUAD HEALTH OVERVIEW -->
        <div class="medical-header-card">
          <div class="medical-header-left">
            <div class="medical-crest-icon">🏥</div>
            <div>
              <div class="medical-title">CLUB MEDICAL CENTRE & INJURY WARD</div>
              <div class="medical-subtitle">Physiotherapy, Cryo-Rehab & Squad Matchday Fitness</div>
            </div>
          </div>

          <div class="medical-health-stats">
            <div class="health-stat-pod">
              <span class="hlabel">SQUAD FITNESS</span>
              <strong class="hvalue" style="color: ${squadHealth >= 90 ? '#10b981' : squadHealth >= 80 ? '#eab308' : '#ef4444'};">
                ${squadHealth}% READY
              </strong>
            </div>
            <div class="health-stat-pod">
              <span class="hlabel">${userClub.toUpperCase()} INJURIES</span>
              <strong class="hvalue" style="color: ${myClubInjuries.length === 0 ? '#10b981' : '#f87171'};">
                ${myClubInjuries.length} SIDELINED
              </strong>
            </div>
            <div class="health-stat-pod">
              <span class="hlabel">LEAGUE TOTAL</span>
              <strong class="hvalue text-cyan">
                ${activeInjuries.filter(i => i.matchesRemaining > 0).length} ACTIVE
              </strong>
            </div>
          </div>
        </div>

        <!-- FILTER NAVIGATION BAR -->
        <div class="medical-filter-bar">
          <div class="medical-filter-chips">
            <button type="button" class="med-chip ${currentFilter === 'myClub' ? 'active' : ''}" onclick="InjuryCenter.setFilter('myClub')">
              🛡️ My Club (${myClubInjuries.length})
            </button>
            <button type="button" class="med-chip ${currentFilter === 'all' ? 'active' : ''}" onclick="InjuryCenter.setFilter('all')">
              🌐 All League (${activeInjuries.filter(i => i.matchesRemaining > 0).length})
            </button>
            <button type="button" class="med-chip ${currentFilter === 'severe' ? 'active' : ''}" onclick="InjuryCenter.setFilter('severe')">
              🔴 Severe (${activeInjuries.filter(i => i.severity === 'Severe' && i.matchesRemaining > 0).length})
            </button>
            <button type="button" class="med-chip ${currentFilter === 'fit' ? 'active' : ''}" onclick="InjuryCenter.setFilter('fit')">
              ✅ Cleared & Fit (${activeInjuries.filter(i => i.matchesRemaining === 0).length})
            </button>
          </div>

          <div class="med-quick-notice">
            <span>💡 <em>Rehab treatments accelerate player recovery by 1 full matchday.</em></span>
          </div>
        </div>

        <!-- INJURY CARDS GRID -->
        <div class="medical-cards-grid">
          ${displayList.length === 0 ? `
            <div class="medical-empty-card">
              <span style="font-size: 38px;">🎉</span>
              <h3>No Injured Players in This Category</h3>
              <p>Squad is boasting peak physical conditioning with zero players in the treatment room!</p>
            </div>
          ` : displayList.map(inj => renderInjuryCard(inj, userClub)).join("")}
        </div>

      </div>
    `;
  }

  // Render a single injury card
  function renderInjuryCard(inj, userClub) {
    const isMine = String(inj.club).toLowerCase() === userClub.toLowerCase();
    const isFit = inj.matchesRemaining === 0;
    const severityColor = inj.severity === "Severe" ? "#ef4444" : inj.severity === "Moderate" ? "#f59e0b" : "#10b981";
    const statusBg = isFit ? "#064e3b" : inj.severity === "Severe" ? "#450a0a" : "#451a03";

    return `
      <div class="injury-card ${isFit ? 'fit' : 'injured'} ${isMine ? 'my-club-injury' : ''}" id="inj_card_${inj.id}">
        <div class="injury-card-top">
          
          <div class="injured-player-meta">
            <div class="injured-avatar-badge">
              <span class="pos-tag">${inj.position}</span>
              <span class="rating-tag">⭐${inj.rating}</span>
            </div>
            <div>
              <div class="injured-player-name">${escapeHtml(inj.playerName)}</div>
              <div class="injured-club-row">
                <span>🛡️ ${escapeHtml(inj.club)}</span>
                ${isMine ? `<span class="your-club-badge">YOUR CLUB</span>` : ''}
              </div>
            </div>
          </div>

          <div class="injury-diagnosis-tag" style="background: ${statusBg}; border-color: ${severityColor}; color: ${severityColor};">
            ${isFit ? '✅ FIT & CLEARED' : `🚨 ${inj.injuryType}`}
          </div>

        </div>

        <!-- CLINICAL DETAILS & SEVERITY -->
        <div class="injury-clinical-row">
          <div class="clinical-pill">
            <span class="cpill-lbl">SEVERITY</span>
            <strong style="color: ${severityColor};">${inj.severity}</strong>
          </div>
          <div class="clinical-pill">
            <span class="cpill-lbl">STATUS</span>
            <strong>${inj.status}</strong>
          </div>
          <div class="clinical-pill">
            <span class="cpill-lbl">ESTIMATED RETURN</span>
            <strong style="color: ${isFit ? '#10b981' : '#38bdf8'};">
              ${isFit ? 'Available Now' : `${inj.matchesRemaining} Match${inj.matchesRemaining > 1 ? 'es' : ''} Out`}
            </strong>
          </div>
        </div>

        <!-- REHAB PROGRESS BAR -->
        <div class="injury-progress-box">
          <div class="progress-labels">
            <span>Rehabilitation Progress</span>
            <strong>${inj.recoveryPct}% Complete</strong>
          </div>
          <div class="rehab-track">
            <div class="rehab-fill" style="width: ${inj.recoveryPct}%; background: ${isFit ? '#10b981' : 'linear-gradient(90deg, #f59e0b, #10b981)'};"></div>
          </div>
        </div>

        <!-- PHYSIO CLINICAL NOTE -->
        <div class="injury-physio-note">
          <span class="note-icon">📋</span>
          <p><strong>Chief Physio:</strong> “${escapeHtml(inj.physioNote)}”</p>
        </div>

        <!-- ACTION CONTROLS (IF USER CLUB) -->
        ${isMine && !isFit ? `
          <div class="injury-actions-row">
            <button type="button" class="btn-med-action btn-accelerate" onclick="InjuryCenter.accelerateRehab('${inj.id}')">
              ⚡ Accelerate Rehab (₹2.5M)
            </button>
            <button type="button" class="btn-med-action btn-test" onclick="InjuryCenter.runLateFitnessTest('${inj.id}')">
              🩺 Late Fitness Test
            </button>
          </div>
        ` : isFit ? `
          <div class="injury-fit-cleared-bar">
            <span>✅ Player cleared for starting XI selection in next match.</span>
          </div>
        ` : ''}

      </div>
    `;
  }

  // Small inline badge helper for squad tables
  function renderInlineInjuryBadge(playerName) {
    const inj = isPlayerInjured(playerName);
    if (!inj) return "";
    return `
      <span class="inline-injury-tag" onclick="InjuryCenter.openModal('${inj.id}')" title="${inj.injuryType} - ${inj.matchesRemaining} Match(es) Out">
        🏥 Out (${inj.matchesRemaining}m)
      </span>
    `;
  }

  // Update badge count in header
  function updateAppHeaderInjuryBadge() {
    const userClub = getSafeUserClub();
    const myInjuries = activeInjuries.filter(i => String(i.club).toLowerCase() === userClub.toLowerCase() && i.matchesRemaining > 0);
    const countBadge = document.getElementById("headerInjuryBadgeCount");
    if (countBadge) {
      if (myInjuries.length > 0) {
        countBadge.innerText = myInjuries.length;
        countBadge.style.display = "inline-flex";
      } else {
        countBadge.style.display = "none";
      }
    }
  }

  // Set filter view
  function setFilter(filterKey) {
    currentFilter = filterKey;
    renderMedicalCentre();
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

  // Export API
  global.InjuryCenter = {
    get activeInjuries() { return activeInjuries; },
    isPlayerInjured,
    getSquadInjuryCount,
    syncInjuries,
    triggerMatchInjury,
    advanceMatchdayRecovery,
    accelerateRehab,
    runLateFitnessTest,
    renderMedicalCentre,
    renderInlineInjuryBadge,
    updateAppHeaderInjuryBadge,
    setFilter,
    openModal(injuryId) {
      if (typeof switchAppView === "function") {
        switchAppView("injuries");
      }
    }
  };

})(window);
