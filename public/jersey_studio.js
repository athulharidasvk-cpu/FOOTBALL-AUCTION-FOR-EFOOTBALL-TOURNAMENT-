// public/jersey_studio.js - Interactive Jersey Kit Designer & Aesthetic Sales Multiplier Engine

(function (global) {
  "use strict";

  // Pre-configured kit presets
  const KIT_PRESETS = {
    royal: {
      name: "Royal Madrid Gold",
      primary: "#f8fafc",
      secondary: "#eab308",
      accent: "#1e3a8a",
      text: "#1e293b",
      pattern: "solid",
      collar: "vneck",
      sponsor: "EMIRATES",
      number: 7,
      player: "VINÍCIUS JR."
    },
    blaugrana: {
      name: "Blaugrana Heritage",
      primary: "#991b1b",
      secondary: "#1e3a8a",
      accent: "#facc15",
      text: "#facc15",
      pattern: "stripes",
      collar: "crew",
      sponsor: "SPOTIFY",
      number: 10,
      player: "LAMINE YAMAL"
    },
    sky: {
      name: "Sky City Horizon",
      primary: "#38bdf8",
      secondary: "#0f172a",
      accent: "#ffffff",
      text: "#ffffff",
      pattern: "half",
      collar: "crew",
      sponsor: "ETIHAD",
      number: 9,
      player: "HAALAND"
    },
    rossoneri: {
      name: "Rossoneri Heritage",
      primary: "#dc2626",
      secondary: "#09090b",
      accent: "#ffffff",
      text: "#ffffff",
      pattern: "stripes",
      collar: "polo",
      sponsor: "FLY BETTER",
      number: 10,
      player: "LEÃO"
    },
    champions_gold: {
      name: "Golden Champions Ed.",
      primary: "#18181b",
      secondary: "#eab308",
      accent: "#fef08a",
      text: "#fef08a",
      pattern: "sash",
      collar: "vneck",
      sponsor: "CHAMPIONS",
      number: 5,
      player: "BELLINGHAM"
    },
    stealth: {
      name: "Midnight Stealth",
      primary: "#0f172a",
      secondary: "#1e293b",
      accent: "#38bdf8",
      text: "#38bdf8",
      pattern: "checker",
      collar: "crew",
      sponsor: "STEALTH AIR",
      number: 11,
      player: "RODRYGO"
    }
  };

  // State
  let currentDesign = {
    primary: "#ffffff",
    secondary: "#1e3a8a",
    accent: "#eab308",
    text: "#0f172a",
    pattern: "solid",
    collar: "crew",
    sponsor: "FLY EMIRATES",
    number: 7,
    player: "MBAPPÉ",
    aestheticScore: 8.5,
    salesMultiplier: 1.35,
    tier: "Iconic A-Tier"
  };

  // Calculate relative luminance for contrast ratio (WCAG formula)
  function hexToRgb(hex) {
    hex = hex.replace(/^#/, "");
    if (hex.length === 3) hex = hex.split("").map(c => c + c).join("");
    const num = parseInt(hex, 16);
    return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255
    };
  }

  function getLuminance(hex) {
    const { r, g, b } = hexToRgb(hex);
    const a = [r, g, b].map(v => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
  }

  function getContrastRatio(hex1, hex2) {
    const lum1 = getLuminance(hex1);
    const lum2 = getLuminance(hex2);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    return (brightest + 0.05) / (darkest + 0.05);
  }

  // Evaluate design aesthetics and calculate sales multiplier
  function evaluateAesthetics(design) {
    let score = 5.0; // Base score

    // 1. Legibility & Contrast (Primary kit vs text & sponsor)
    const textContrast = getContrastRatio(design.primary, design.text);
    if (textContrast >= 4.5) {
      score += 2.2; // Excellent readability
    } else if (textContrast >= 3.0) {
      score += 1.2;
    } else {
      score -= 2.0; // Penalty for unreadable numbers/sponsor
    }

    // 2. Color Harmony between Primary & Secondary
    const pRgb = hexToRgb(design.primary);
    const sRgb = hexToRgb(design.secondary);
    const colorDist = Math.sqrt(
      Math.pow(pRgb.r - sRgb.r, 2) +
      Math.pow(pRgb.g - sRgb.g, 2) +
      Math.pow(pRgb.b - sRgb.b, 2)
    );

    if (design.pattern !== "solid") {
      if (colorDist > 120 && colorDist < 380) {
        score += 1.6; // Harmonious distinctive contrast
      } else if (colorDist <= 40) {
        score -= 1.0; // Too muddy/indistinguishable pattern
      } else {
        score += 0.8;
      }
    } else {
      score += 1.4; // Solid classics are timeless
    }

    // 3. Accent Elegance (Gold, Silver, Cyan, Clean White accents boost prestige)
    const accentLum = getLuminance(design.accent);
    if (["#eab308", "#facc15", "#ffd700", "#d4af37", "#fef08a"].includes(design.accent.toLowerCase())) {
      score += 0.8; // Gold prestige boost
    } else if (accentLum > 0.8 || accentLum < 0.15) {
      score += 0.5;
    }

    // 4. Pattern style prestige
    if (["stripes", "sash", "checker"].includes(design.pattern)) {
      score += 0.6;
    } else if (design.pattern === "wave") {
      score += 0.4;
    }

    // Bound between 3.0 and 9.9
    score = Math.max(3.0, Math.min(9.9, Math.round(score * 10) / 10));

    let tier = "Standard B-Tier";
    let multiplier = 1.0;

    if (score >= 9.0) {
      tier = "Masterpiece S-Tier";
      multiplier = 2.0 + Math.round((score - 9.0) * 0.3 * 100) / 100; // 2.0x - 2.27x
    } else if (score >= 7.8) {
      tier = "Iconic A-Tier";
      multiplier = 1.4 + Math.round((score - 7.8) * 0.4 * 100) / 100; // 1.4x - 1.88x
    } else if (score >= 6.0) {
      tier = "Standard B-Tier";
      multiplier = 1.0 + Math.round((score - 6.0) * 0.15 * 100) / 100; // 1.0x - 1.27x
    } else {
      tier = "Garish C-Tier";
      multiplier = Math.max(0.5, 0.85 - Math.round((6.0 - score) * 0.1 * 100) / 100); // 0.55x - 0.85x
    }

    return {
      aestheticScore: score,
      salesMultiplier: Math.round(multiplier * 100) / 100,
      tier: tier,
      textContrast: Math.round(textContrast * 10) / 10
    };
  }

  // Generate SVG markup for Jersey
  function generateJerseySvg(design, isBackView = false) {
    const p = design.primary || "#ffffff";
    const s = design.secondary || "#1e3a8a";
    const a = design.accent || "#eab308";
    const t = design.text || "#0f172a";
    const pat = design.pattern || "solid";
    const collar = design.collar || "crew";
    const sponsor = (design.sponsor || "EMIRATES").toUpperCase();
    const number = design.number || 7;
    const player = (design.player || "MBAPPÉ").toUpperCase();

    // Pattern defs
    let patternDef = "";
    let bodyFill = p;

    if (pat === "stripes") {
      patternDef = `
        <pattern id="jerseyStripes" width="40" height="20" patternUnits="userSpaceOnUse">
          <rect width="20" height="20" fill="${p}"/>
          <rect x="20" width="20" height="20" fill="${s}"/>
        </pattern>
      `;
      bodyFill = "url(#jerseyStripes)";
    } else if (pat === "hoops") {
      patternDef = `
        <pattern id="jerseyHoops" width="20" height="30" patternUnits="userSpaceOnUse">
          <rect width="20" height="15" fill="${p}"/>
          <rect y="15" width="20" height="15" fill="${s}"/>
        </pattern>
      `;
      bodyFill = "url(#jerseyHoops)";
    } else if (pat === "checker") {
      patternDef = `
        <pattern id="jerseyChecker" width="40" height="40" patternUnits="userSpaceOnUse">
          <rect width="20" height="20" fill="${p}"/>
          <rect x="20" y="20" width="20" height="20" fill="${p}"/>
          <rect x="20" width="20" height="20" fill="${s}"/>
          <rect y="20" width="20" height="20" fill="${s}"/>
        </pattern>
      `;
      bodyFill = "url(#jerseyChecker)";
    } else if (pat === "half") {
      patternDef = `
        <linearGradient id="jerseyHalf" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="50%" stop-color="${p}"/>
          <stop offset="50%" stop-color="${s}"/>
        </linearGradient>
      `;
      bodyFill = "url(#jerseyHalf)";
    } else if (pat === "sash") {
      patternDef = `
        <linearGradient id="jerseySash" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="35%" stop-color="${p}"/>
          <stop offset="35%" stop-color="${s}"/>
          <stop offset="65%" stop-color="${s}"/>
          <stop offset="65%" stop-color="${p}"/>
        </linearGradient>
      `;
      bodyFill = "url(#jerseySash)";
    } else if (pat === "wave") {
      patternDef = `
        <linearGradient id="jerseyWave" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="${p}"/>
          <stop offset="50%" stop-color="${s}"/>
          <stop offset="100%" stop-color="${p}"/>
        </linearGradient>
      `;
      bodyFill = "url(#jerseyWave)";
    }

    // Collar SVG
    let collarSvg = "";
    if (collar === "vneck") {
      collarSvg = `
        <path d="M 120 40 L 150 95 L 180 40 Z" fill="${a}" stroke="${p}" stroke-width="2"/>
        <path d="M 132 40 L 150 78 L 168 40 Z" fill="#081424"/>
      `;
    } else if (collar === "polo") {
      collarSvg = `
        <path d="M 115 38 L 135 75 L 150 55 L 165 75 L 185 38 Z" fill="${a}" stroke="${s}" stroke-width="2"/>
        <polygon points="110,38 135,78 145,55" fill="${a}"/>
        <polygon points="190,38 165,78 155,55" fill="${a}"/>
      `;
    } else {
      // Crew
      collarSvg = `
        <path d="M 120 40 Q 150 78 180 40 Q 150 62 120 40 Z" fill="${a}" stroke="${p}" stroke-width="1.5"/>
        <path d="M 126 40 Q 150 66 174 40 Q 150 50 126 40 Z" fill="#081424"/>
      `;
    }

    // Chest or Back content
    let centerContent = "";
    if (isBackView) {
      centerContent = `
        <!-- Player Name on Back -->
        <text x="150" y="125" text-anchor="middle" font-family="-apple-system, sans-serif" font-weight="900" font-size="16" fill="${t}" letter-spacing="3">${player}</text>
        <!-- Big Squad Number -->
        <text x="150" y="215" text-anchor="middle" font-family="'Impact', 'Arial Black', sans-serif" font-weight="900" font-size="82" fill="${t}" stroke="${a}" stroke-width="2" letter-spacing="-2">${number}</text>
      `;
    } else {
      centerContent = `
        <!-- Club Badge on Left Chest -->
        <g transform="translate(100, 115)">
          <circle cx="0" cy="0" r="14" fill="${a}" stroke="#ffffff" stroke-width="1.5"/>
          <circle cx="0" cy="0" r="11" fill="${p}"/>
          <text x="0" y="4" text-anchor="middle" font-size="10" font-weight="900" fill="${t}">👑</text>
        </g>
        
        <!-- Kit Manufacturer Logo on Right Chest -->
        <g transform="translate(200, 115)">
          <path d="M -10 3 Q 0 -6 10 3 Q 2 -2 -10 3 Z" fill="${a}"/>
        </g>

        <!-- Sponsor Logo across Torso -->
        <g transform="translate(150, 190)">
          <rect x="-85" y="-18" width="170" height="36" rx="6" fill="rgba(0, 0, 0, 0.25)" stroke="${a}" stroke-width="0.8"/>
          <text x="0" y="6" text-anchor="middle" font-family="'Arial Black', -apple-system, sans-serif" font-weight="900" font-size="15" fill="${t}" letter-spacing="3">${sponsor}</text>
        </g>

        <!-- Small Squad Number on Front Bottom -->
        <text x="195" y="270" text-anchor="middle" font-family="'Arial Black', sans-serif" font-weight="900" font-size="20" fill="${t}">${number}</text>
      `;
    }

    return `
      <svg viewBox="0 0 300 320" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          ${patternDef}
          <filter id="jerseyShadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="10" stdDeviation="12" flood-color="#000000" flood-opacity="0.6"/>
          </filter>
          <linearGradient id="jerseyShine" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#ffffff" stop-opacity="0.25"/>
            <stop offset="50%" stop-color="#ffffff" stop-opacity="0"/>
            <stop offset="100%" stop-color="#000000" stop-opacity="0.3"/>
          </linearGradient>
        </defs>

        <!-- Main Jersey Silhouette -->
        <g filter="url(#jerseyShadow)">
          <!-- Left Sleeve -->
          <path d="M 95 50 L 30 115 L 60 145 L 100 105 Z" fill="${p}" stroke="#1e293b" stroke-width="1.5"/>
          <!-- Left Sleeve Cuff -->
          <polygon points="30,115 42,127 72,97 60,85" fill="${a}"/>

          <!-- Right Sleeve -->
          <path d="M 205 50 L 270 115 L 240 145 L 200 105 Z" fill="${p}" stroke="#1e293b" stroke-width="1.5"/>
          <!-- Right Sleeve Cuff -->
          <polygon points="270,115 258,127 228,97 240,85" fill="${a}"/>

          <!-- Torso Body -->
          <path d="M 95 50 L 120 40 Q 150 48 180 40 L 205 50 L 210 100 L 210 285 L 90 285 L 90 100 Z" 
                fill="${bodyFill}" stroke="#1e293b" stroke-width="2"/>

          <!-- Shading / Fabric Depth Overlay -->
          <path d="M 95 50 L 120 40 Q 150 48 180 40 L 205 50 L 210 100 L 210 285 L 90 285 L 90 100 Z" 
                fill="url(#jerseyShine)" pointer-events="none"/>

          <!-- Bottom Hem Stripe -->
          <rect x="90" y="278" width="120" height="7" fill="${a}"/>

          <!-- Collar Design -->
          ${collarSvg}

          <!-- Center Content (Front or Back) -->
          ${centerContent}
        </g>
      </svg>
    `;
  }

  // Update UI Elements
  function renderJerseyStudio(containerId = "jerseyPreviewStage") {
    const stage = document.getElementById(containerId);
    if (!stage) return;

    const evalResult = evaluateAesthetics(currentDesign);
    currentDesign.aestheticScore = evalResult.aestheticScore;
    currentDesign.salesMultiplier = evalResult.salesMultiplier;
    currentDesign.tier = evalResult.tier;

    // Render Front & Back side-by-side or toggled
    stage.innerHTML = `
      <div class="jersey-preview-duo">
        <div class="jersey-card-preview front">
          <div class="jersey-card-header">
            <span>👕 HOME KIT FRONT</span>
            <span class="kit-view-badge">MATCHDAY</span>
          </div>
          <div class="jersey-svg-box">
            ${generateJerseySvg(currentDesign, false)}
          </div>
        </div>
        <div class="jersey-card-preview back">
          <div class="jersey-card-header">
            <span>👕 SQUAD BACK</span>
            <span class="kit-view-badge">#${currentDesign.number}</span>
          </div>
          <div class="jersey-svg-box">
            ${generateJerseySvg(currentDesign, true)}
          </div>
        </div>
      </div>
    `;

    // Update aesthetic gauges & indicators
    updateAestheticDisplays(evalResult);
  }

  function updateAestheticDisplays(evalResult) {
    const scoreVal = document.getElementById("jerseyScoreValue");
    const scoreFill = document.getElementById("jerseyScoreFill");
    const tierBadge = document.getElementById("jerseyTierBadge");
    const multTag = document.getElementById("jerseyMultTag");
    const estRev = document.getElementById("jerseyEstRevenue");

    if (scoreVal) scoreVal.innerText = `${evalResult.aestheticScore} / 10`;
    if (scoreFill) {
      scoreFill.style.width = `${(evalResult.aestheticScore / 10) * 100}%`;
      scoreFill.className = "aesthetic-bar-fill " + (evalResult.aestheticScore >= 9 ? "s-tier" : evalResult.aestheticScore >= 7.5 ? "a-tier" : evalResult.aestheticScore >= 6 ? "b-tier" : "c-tier");
    }
    if (tierBadge) {
      tierBadge.innerText = evalResult.tier;
      tierBadge.className = "aesthetic-tier-badge " + (evalResult.aestheticScore >= 9 ? "s-tier" : evalResult.aestheticScore >= 7.5 ? "a-tier" : evalResult.aestheticScore >= 6 ? "b-tier" : "c-tier");
    }
    if (multTag) {
      multTag.innerText = `${evalResult.salesMultiplier}x Merchandise Sales`;
      multTag.style.color = evalResult.salesMultiplier >= 1.5 ? "#10b981" : evalResult.salesMultiplier >= 1.0 ? "#38bdf8" : "#f87171";
    }
    if (estRev) {
      const minRev = (1.5 * evalResult.salesMultiplier).toFixed(1);
      const maxRev = (3.2 * evalResult.salesMultiplier).toFixed(1);
      estRev.innerText = `+₹${minRev}M - ₹${maxRev}M Merch Revenue per Home Match`;
    }
  }

  // Load a preset
  function applyPreset(presetKey) {
    if (!KIT_PRESETS[presetKey]) return;
    const p = KIT_PRESETS[presetKey];
    currentDesign.primary = p.primary;
    currentDesign.secondary = p.secondary;
    currentDesign.accent = p.accent;
    currentDesign.text = p.text;
    currentDesign.pattern = p.pattern;
    currentDesign.collar = p.collar;
    currentDesign.sponsor = p.sponsor;
    currentDesign.number = p.number;
    currentDesign.player = p.player;

    // Sync input controls
    syncFormInputs();
    renderJerseyStudio();

    if (typeof playClickSound === "function") playClickSound();
  }

  function syncFormInputs() {
    const pCol = document.getElementById("kitPrimaryColor");
    const sCol = document.getElementById("kitSecondaryColor");
    const aCol = document.getElementById("kitAccentColor");
    const tCol = document.getElementById("kitTextColor");
    const patSel = document.getElementById("kitPatternSelect");
    const colSel = document.getElementById("kitCollarSelect");
    const sponIn = document.getElementById("kitSponsorInput");
    const numIn = document.getElementById("kitNumberInput");
    const nameIn = document.getElementById("kitPlayerNameInput");

    if (pCol) pCol.value = currentDesign.primary;
    if (sCol) sCol.value = currentDesign.secondary;
    if (aCol) aCol.value = currentDesign.accent;
    if (tCol) tCol.value = currentDesign.text;
    if (patSel) patSel.value = currentDesign.pattern;
    if (colSel) colSel.value = currentDesign.collar;
    if (sponIn) sponIn.value = currentDesign.sponsor;
    if (numIn) numIn.value = currentDesign.number;
    if (nameIn) nameIn.value = currentDesign.player;
  }

  // Save kit to server
  function saveCurrentJersey() {
    const targetClub = (typeof myTeam !== "undefined" && myTeam) ? myTeam : (typeof selectedHqClub !== "undefined" && selectedHqClub) ? selectedHqClub : "Real Madrid";

    if (typeof socket === "undefined") {
      alert("Socket server not connected.");
      return;
    }

    const payload = {
      teamName: targetClub,
      jersey: {
        ...currentDesign
      }
    };

    socket.emit("saveJerseyDesign", payload);
    if (typeof playFanfareSound === "function") playFanfareSound();

    const saveBtn = document.getElementById("btnSaveJerseyKit");
    if (saveBtn) {
      saveBtn.innerText = "✅ Official Kit Saved!";
      setTimeout(() => {
        saveBtn.innerText = "💾 Save & Launch Official Kit";
      }, 2500);
    }
  }

  // Initialize Jersey Studio for a given team
  function init(teamName) {
    if (teamName && typeof teamName === "string") {
      const lower = teamName.toLowerCase();
      if (lower.includes("madrid")) {
        applyPreset("royal");
      } else if (lower.includes("barcelona") || lower.includes("barca")) {
        applyPreset("blaugrana");
      } else if (lower.includes("city")) {
        applyPreset("sky");
      } else if (lower.includes("milan")) {
        applyPreset("rossoneri");
      }
    }
    syncFormInputs();
    renderJerseyStudio();
  }

  // Export API
  global.JerseyStudio = {
    init,
    currentDesign,
    evaluateAesthetics,
    generateJerseySvg,
    renderJerseyStudio,
    applyPreset,
    saveCurrentJersey,
    syncFormInputs,
    setField(field, value) {
      currentDesign[field] = value;
      renderJerseyStudio();
    }
  };

})(window);
