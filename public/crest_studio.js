// public/crest_studio.js - Custom Team Logo & Vector Crest Engine

(function (global) {
  "use strict";

  // Available emblem symbols and mascots (Pure Vector)
  const EMBLEMS = [
    { id: "lion", name: "Lion", desc: "Pride & Courage" },
    { id: "eagle", name: "Eagle", desc: "Vision & Speed" },
    { id: "crown", name: "Royal Crown", desc: "Prestige & Royalty" },
    { id: "dragon", name: "Dragon", desc: "Power & Ferocity" },
    { id: "lightning", name: "Lightning", desc: "Electric Attack" },
    { id: "swords", name: "Gladiator Swords", desc: "Combat & Honor" },
    { id: "wolf", name: "Lone Wolf", desc: "Pack Unity & Hunt" },
    { id: "bull", name: "Raging Bull", desc: "Relentless Force" },
    { id: "shark", name: "Apex Shark", desc: "Predatory Focus" },
    { id: "snake", name: "Serpent", desc: "Venomous Strike" },
    { id: "star", name: "Gold Star", desc: "Championship Glory" },
    { id: "shield", name: "Aegis Shield", desc: "Ironclad Defense" },
    { id: "anchor", name: "Port Anchor", desc: "Steadfast Tradition" },
    { id: "castle", name: "Fortress", desc: "Impenetrable Home" },
    { id: "football", name: "Classic Football", desc: "Pure Football Heritage" },
    { id: "fire", name: "Phoenix Flame", desc: "Unstoppable Intensity" }
  ];

  const EMBLEM_SVGS = {
    lion: '<path d="M-6 -6 L6 -6 L6 4 Q6 9 0 11 Q-6 9 -6 4 Z" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M-3 0 Q0 -3 3 0 Q0 5 -3 0" fill="currentColor"/>',
    eagle: '<path d="M-8 4 Q-3 -7 0 -9 Q3 -7 8 4 Q0 1 -8 4 Z" fill="currentColor"/><circle cx="0" cy="-3" r="1.5" fill="#000"/>',
    crown: '<path d="M-8 5 L-6 -5 L-2 0 L2 -5 L6 5 Z" fill="currentColor"/><rect x="-6" y="6" width="12" height="2" fill="currentColor"/>',
    dragon: '<path d="M-7 4 Q-2 -8 4 -6 Q-1 0 7 2 Q0 7 -7 4 Z" fill="currentColor"/>',
    lightning: '<polygon points="1 -9 -7 0 0 0 -1 9 7 -1 0 -1 1 -9" fill="currentColor"/>',
    swords: '<line x1="-7" y1="-7" x2="7" y2="7" stroke="currentColor" stroke-width="2"/><line x1="7" y1="-7" x2="-7" y2="7" stroke="currentColor" stroke-width="2"/><rect x="-2" y="-2" width="4" height="4" fill="currentColor"/>',
    wolf: '<polygon points="0 -8 -6 4 -3 8 0 5 3 8 6 4" fill="currentColor"/>',
    bull: '<path d="M-8 -6 Q-5 2 0 6 Q5 2 8 -6 M-5 -2 Q0 8 5 -2" fill="none" stroke="currentColor" stroke-width="2"/>',
    shark: '<path d="M-8 0 Q-2 -7 6 -4 Q0 2 -6 6 Z" fill="currentColor"/>',
    snake: '<path d="M0 -8 Q6 -4 0 0 Q-6 4 0 8" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>',
    star: '<polygon points="0 -8 2.5 -2.5 8 -2 4 2 5.5 8 0 4.5 -5.5 8 -4 2 -8 -2 -2.5 -2.5" fill="currentColor"/>',
    shield: '<path d="M-7 -7 L7 -7 L7 2 Q7 8 0 10 Q-7 8 -7 2 Z" fill="currentColor"/>',
    anchor: '<line x1="0" y1="-8" x2="0" y2="7" stroke="currentColor" stroke-width="2"/><circle cx="0" cy="-6" r="2" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M-7 3 Q0 9 7 3" fill="none" stroke="currentColor" stroke-width="2"/>',
    castle: '<path d="M-7 7 L-7 -3 L-5 -3 L-5 0 L-3 0 L-3 -3 L-1 -3 L-1 0 L1 0 L1 -3 L3 -3 L3 0 L5 0 L5 -3 L7 -3 L7 7 Z" fill="currentColor"/>',
    football: '<circle cx="0" cy="0" r="7" fill="none" stroke="currentColor" stroke-width="1.8"/><polygon points="0 -3 -3 -1 -2 3 2 3 3 -1" fill="currentColor"/>',
    fire: '<path d="M-2 7 Q-6 3 -4 -1 Q0 -8 3 -3 Q6 1 4 4 Q2 7 -2 7 Z" fill="currentColor"/>'
  };

  // Preset Crest Themes
  const CREST_PRESETS = [
    {
      name: "Royal Crown",
      shape: "shield",
      pattern: "solid",
      primary: "#1e3a8a",
      secondary: "#facc15",
      accent: "#ffffff",
      emblem: "crown",
      monogram: "FC"
    },
    {
      name: "Red Dragons",
      shape: "shield",
      pattern: "stripes",
      primary: "#dc2626",
      secondary: "#09090b",
      accent: "#fef08a",
      emblem: "dragon",
      monogram: "CF"
    },
    {
      name: "Sky Titans",
      shape: "hexagon",
      pattern: "half",
      primary: "#38bdf8",
      secondary: "#0f172a",
      accent: "#ffffff",
      emblem: "eagle",
      monogram: "SC"
    },
    {
      name: "Golden Lions",
      shape: "circle",
      pattern: "solid",
      primary: "#b45309",
      secondary: "#fef08a",
      accent: "#18181b",
      emblem: "lion",
      monogram: "UTD"
    },
    {
      name: "Neon Thunder",
      shape: "diamond",
      pattern: "half",
      primary: "#09090b",
      secondary: "#06b6d4",
      accent: "#facc15",
      emblem: "lightning",
      monogram: "AC"
    },
    {
      name: "Emerald Forest",
      shape: "shield",
      pattern: "stripes",
      primary: "#15803d",
      secondary: "#ffffff",
      accent: "#eab308",
      emblem: "wolf",
      monogram: "SC"
    }
  ];

  // Active designer config
  let activeConfig = {
    shape: "shield",
    pattern: "stripes",
    primary: "#dc2626",
    secondary: "#1e3a8a",
    accent: "#facc15",
    emblem: "lion",
    monogram: "FC"
  };

  // Generate scalable SVG string for any custom team crest
  function generateCrestSvg(config = activeConfig, size = 64) {
    const shape = config.shape || "shield";
    const pattern = config.pattern || "solid";
    const primary = config.primary || "#1e3a8a";
    const secondary = config.secondary || "#facc15";
    const accent = config.accent || "#ffffff";
    const emblemObj = EMBLEMS.find(e => e.id === config.emblem) || EMBLEMS[0];
    const monogram = (config.monogram || "").toUpperCase().slice(0, 4);

    const gradId = `cgrad_${Math.random().toString(36).substr(2, 6)}`;
    const clipId = `cclip_${Math.random().toString(36).substr(2, 6)}`;

    // Define outer shape path in 100x100 viewBox
    let pathD = "";
    if (shape === "circle") {
      pathD = "M 50 5 A 45 45 0 1 1 49.9 5 Z";
    } else if (shape === "hexagon") {
      pathD = "M 50 6 L 90 28 L 90 72 L 50 94 L 10 72 L 10 28 Z";
    } else if (shape === "diamond") {
      pathD = "M 50 5 L 92 50 L 50 95 L 8 50 Z";
    } else {
      // Classic curved shield
      pathD = "M 15 12 L 85 12 Q 88 45 50 92 Q 12 45 15 12 Z";
    }

    // Pattern fills inside clip
    let patternContent = "";
    if (pattern === "stripes") {
      patternContent = `
        <rect x="0" y="0" width="100" height="100" fill="${primary}" />
        <rect x="20" y="0" width="15" height="100" fill="${secondary}" />
        <rect x="50" y="0" width="15" height="100" fill="${secondary}" />
        <rect x="80" y="0" width="15" height="100" fill="${secondary}" />
      `;
    } else if (pattern === "half") {
      patternContent = `
        <rect x="0" y="0" width="50" height="100" fill="${primary}" />
        <rect x="50" y="0" width="50" height="100" fill="${secondary}" />
      `;
    } else if (pattern === "sash") {
      patternContent = `
        <rect x="0" y="0" width="100" height="100" fill="${primary}" />
        <polygon points="0,0 25,0 100,75 100,100" fill="${secondary}" />
      `;
    } else {
      // Solid with subtle metallic sheen
      patternContent = `
        <rect x="0" y="0" width="100" height="100" fill="url(#${gradId})" />
      `;
    }

    // Monogram ribbon / text
    let monogramBlock = "";
    if (monogram) {
      monogramBlock = `
        <g transform="translate(50, 78)">
          <rect x="-30" y="-8" width="60" height="15" rx="3" fill="#09090b" fill-opacity="0.85" stroke="${accent}" stroke-width="1" />
          <text x="0" y="3" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="9" fill="${accent}" letter-spacing="1.5">
            ${escapeXml(monogram)}
          </text>
        </g>
      `;
    }

    return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}" class="team-custom-crest-svg" style="filter: drop-shadow(0 4px 6px rgba(0,0,0,0.4));">
        <defs>
          <linearGradient id="${gradId}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="${primary}" />
            <stop offset="100%" stop-color="${secondary}" />
          </linearGradient>
          <clipPath id="${clipId}">
            <path d="${pathD}" />
          </clipPath>
          <filter id="crestGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000" flood-opacity="0.6"/>
          </filter>
        </defs>

        <!-- Base Background Path -->
        <path d="${pathD}" fill="#0f172a" />

        <!-- Pattern Clip Area -->
        <g clip-path="url(#${clipId})">
          ${patternContent}
          <!-- Subtle lighting overlay -->
          <path d="M 0 0 L 100 0 L 50 50 Z" fill="#ffffff" fill-opacity="0.08" />
        </g>

        <!-- Outer Border Outline -->
        <path d="${pathD}" fill="none" stroke="${accent}" stroke-width="3" stroke-linejoin="round" />
        <path d="${pathD}" fill="none" stroke="#000000" stroke-width="1" stroke-opacity="0.3" />

        <!-- Center Mascot Emblem (Vector Graphic) -->
        <g transform="translate(50, 44)">
          <circle cx="0" cy="0" r="19" fill="#09090b" fill-opacity="0.65" stroke="${accent}" stroke-width="1.5" />
          <g color="${accent}">
            ${EMBLEM_SVGS[emblemObj.id] || EMBLEM_SVGS.shield}
          </g>
        </g>

        <!-- Club Monogram -->
        ${monogramBlock}
      </svg>
    `.trim();
  }

  function escapeXml(unsafe) {
    return unsafe.replace(/[<>&'"]/g, function (c) {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '\'': return '&apos;';
        case '"': return '&quot;';
      }
    });
  }

  // Render live crest into specified container
  function renderCrestPreview(targetContainer = "customCrestPreview", config = activeConfig) {
    const container = typeof targetContainer === "string" 
      ? document.getElementById(targetContainer) 
      : targetContainer;
    if (!container) return;

    container.innerHTML = generateCrestSvg(config, 84);
  }

  // Update a field on active crest config
  function updateField(field, value) {
    activeConfig[field] = value;
    renderCrestPreview();
  }

  // Apply a crest preset
  function applyCrestPreset(index) {
    const preset = CREST_PRESETS[index];
    if (!preset) return;

    activeConfig = { ...preset };

    // Sync input elements if they exist
    const shapeEl = document.getElementById("crestShapeSelect");
    const patternEl = document.getElementById("crestPatternSelect");
    const pColEl = document.getElementById("crestPrimaryColor");
    const sColEl = document.getElementById("crestSecondaryColor");
    const aColEl = document.getElementById("crestAccentColor");
    const monoEl = document.getElementById("crestMonogramInput");

    if (shapeEl) shapeEl.value = activeConfig.shape;
    if (patternEl) patternEl.value = activeConfig.pattern;
    if (pColEl) pColEl.value = activeConfig.primary;
    if (sColEl) sColEl.value = activeConfig.secondary;
    if (aColEl) aColEl.value = activeConfig.accent;
    if (monoEl) monoEl.value = activeConfig.monogram;

    renderCrestPreview();
  }

  // Select emblem icon
  function selectEmblem(emblemId) {
    activeConfig.emblem = emblemId;
    document.querySelectorAll(".emblem-grid-btn").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.emblem === emblemId);
    });
    renderCrestPreview();
  }

  function loadSavedConfig(cfg) {
    if (!cfg || typeof cfg !== "object") return;
    activeConfig = {
      ...activeConfig,
      ...cfg
    };
    const shapeEl = document.getElementById("crestShapeSelect");
    const patternEl = document.getElementById("crestPatternSelect");
    const pColEl = document.getElementById("crestPrimaryColor");
    const sColEl = document.getElementById("crestSecondaryColor");
    const aColEl = document.getElementById("crestAccentColor");
    const monoEl = document.getElementById("crestMonogramInput");

    if (shapeEl && activeConfig.shape) shapeEl.value = activeConfig.shape;
    if (patternEl && activeConfig.pattern) patternEl.value = activeConfig.pattern;
    if (pColEl && activeConfig.primary) pColEl.value = activeConfig.primary;
    if (sColEl && activeConfig.secondary) sColEl.value = activeConfig.secondary;
    if (aColEl && activeConfig.accent) aColEl.value = activeConfig.accent;
    if (monoEl && activeConfig.monogram) monoEl.value = activeConfig.monogram;

    if (activeConfig.emblem) {
      document.querySelectorAll(".emblem-grid-btn").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.emblem === activeConfig.emblem);
      });
    }
    renderCrestPreview();
  }

  // Export API
  global.CrestStudio = {
    EMBLEMS,
    CREST_PRESETS,
    get activeConfig() { return activeConfig; },
    getCurrentConfig() {
      return { ...activeConfig };
    },
    getConfig() {
      return { ...activeConfig };
    },
    setConfig(cfg) {
      loadSavedConfig(cfg);
    },
    loadSavedConfig,
    loadConfig: loadSavedConfig,
    generateCrestSvg,
    renderCrestPreview,
    updateField,
    applyCrestPreset,
    selectEmblem
  };

})(window);
