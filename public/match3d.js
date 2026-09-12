// public/match3d.js - Three.js 3D Matchday Gameplay Engine & Stadium Visualizer

(function (global) {
  "use strict";

  // =====================================================
  // TEAM COLOR PALETTES & KIT STYLES
  // =====================================================

  const CLUB_KITS = {
    "Real Madrid": { primary: 0xfafafa, secondary: 0xd4af37, shorts: 0xffffff, trim: 0x1e3a8a, gk: 0x10b981, style: "clean" },
    "Manchester City": { primary: 0x6cabdd, secondary: 0x1c2c5b, shorts: 0xffffff, trim: 0xffffff, gk: 0x10b981, style: "clean" },
    "Bayern Munich": { primary: 0xdc052d, secondary: 0xffffff, shorts: 0xdc052d, trim: 0x0066b2, gk: 0xf59e0b, style: "clean" },
    "Arsenal": { primary: 0xef0107, secondary: 0xffffff, shorts: 0xffffff, trim: 0x023474, gk: 0xf59e0b, style: "sleeves" },
    "Paris Saint-Germain": { primary: 0x004170, secondary: 0xda291c, shorts: 0x004170, trim: 0xffffff, gk: 0x10b981, style: "stripe" },
    "Liverpool": { primary: 0xc8102e, secondary: 0x00b2a9, shorts: 0xc8102e, trim: 0xf6eb61, gk: 0x84cc16, style: "clean" },
    "Borussia Dortmund": { primary: 0xfde100, secondary: 0x000000, shorts: 0x000000, trim: 0x000000, gk: 0xef4444, style: "clean" },
    "Atletico Madrid": { primary: 0xcb3524, secondary: 0xffffff, shorts: 0x1e3a8a, trim: 0x1e3a8a, gk: 0x10b981, style: "stripes" },
    "Juventus": { primary: 0xffffff, secondary: 0x111827, shorts: 0x111827, trim: 0xd4af37, gk: 0x3b82f6, style: "stripes" },
    "AC Milan": { primary: 0xdc2626, secondary: 0x111827, shorts: 0xffffff, trim: 0xdc2626, gk: 0x10b981, style: "stripes" },
    "Napoli": { primary: 0x0ea5e9, secondary: 0xffffff, shorts: 0xffffff, trim: 0x0369a1, gk: 0xf59e0b, style: "clean" },
    "Bayer Leverkusen": { primary: 0x111827, secondary: 0xdc2626, shorts: 0x111827, trim: 0xdc2626, gk: 0x06b6d4, style: "clean" },
    "Ajax": { primary: 0xffffff, secondary: 0xdc2626, shorts: 0xffffff, trim: 0xdc2626, gk: 0x10b981, style: "stripe" },
    "Benfica": { primary: 0xdc2626, secondary: 0xffffff, shorts: 0xffffff, trim: 0xd4af37, gk: 0xf59e0b, style: "clean" },
    "Sporting CP": { primary: 0x15803d, secondary: 0xffffff, shorts: 0x111827, trim: 0xd4af37, gk: 0xef4444, style: "stripes" },
    "FC Porto": { primary: 0x1e40af, secondary: 0xffffff, shorts: 0x1e40af, trim: 0xd4af37, gk: 0xf59e0b, style: "stripes" },
    "Marseille": { primary: 0xffffff, secondary: 0x38bdf8, shorts: 0xffffff, trim: 0x0284c7, gk: 0x84cc16, style: "clean" },
    "Aston Villa": { primary: 0x670038, secondary: 0x95bfe5, shorts: 0xffffff, trim: 0xfee123, gk: 0x10b981, style: "sleeves" },
    "Barcelona": { primary: 0x991b1b, secondary: 0x1e3a8a, shorts: 0x1e3a8a, trim: 0xd4af37, gk: 0x10b981, style: "stripes" },
    "Inter Milan": { primary: 0x1e40af, secondary: 0x111827, shorts: 0x111827, trim: 0xd4af37, gk: 0xef4444, style: "stripes" }
  };

  // Generate color palette for custom user clubs
  function getClubKit(clubName) {
    if (CLUB_KITS[clubName]) return CLUB_KITS[clubName];

    // Hash name to determine vibrant colors
    let hash = 0;
    for (let i = 0; i < clubName.length; i++) {
      hash = clubName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hues = [210, 350, 140, 270, 40, 190, 160, 30];
    const hue = hues[Math.abs(hash) % hues.length];
    
    return {
      primary: new THREE.Color(`hsl(${hue}, 80%, 48%)`).getHex(),
      secondary: 0xffffff,
      shorts: 0x111827,
      trim: 0xd4af37,
      gk: 0x10b981,
      style: "clean"
    };
  }

  // =====================================================
  // PROCEDURAL TEXTURE GENERATORS
  // =====================================================

  // High-res football pitch canvas texture with mowed stripes and regulation markings
  function createPitchTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 680;
    const ctx = canvas.getContext("2d");

    // 1. Alternating Grass Stripes (10 lawn-mower bands across 105m)
    const stripeWidth = canvas.width / 12;
    for (let i = 0; i < 12; i++) {
      ctx.fillStyle = i % 2 === 0 ? "#239a48" : "#1f873f";
      ctx.fillRect(i * stripeWidth, 0, stripeWidth, canvas.height);
    }

    // Grass grain noise
    ctx.fillStyle = "rgba(0, 0, 0, 0.03)";
    for (let i = 0; i < 4000; i++) {
      const rx = Math.random() * canvas.width;
      const ry = Math.random() * canvas.height;
      ctx.fillRect(rx, ry, 2, 2);
    }

    // 2. Regulation Pitch Markings
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 4;
    ctx.lineCap = "square";

    const padX = 24;
    const padY = 24;
    const fieldW = canvas.width - padX * 2;
    const fieldH = canvas.height - padY * 2;

    // Touchlines and Goal lines (Boundary)
    ctx.strokeRect(padX, padY, fieldW, fieldH);

    // Halfway Line
    const midX = canvas.width / 2;
    ctx.beginPath();
    ctx.moveTo(midX, padY);
    ctx.lineTo(midX, canvas.height - padY);
    ctx.stroke();

    // Center Circle (Radius ~9.15m -> ~60px)
    ctx.beginPath();
    ctx.arc(midX, canvas.height / 2, 58, 0, Math.PI * 2);
    ctx.stroke();

    // Center Spot
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(midX, canvas.height / 2, 4, 0, Math.PI * 2);
    ctx.fill();

    // Penalty Boxes (16.5m deep, 40.3m wide)
    const penW = 105;
    const penH = 260;
    const penTop = (canvas.height - penH) / 2;

    // Left Penalty Box
    ctx.strokeRect(padX, penTop, penW, penH);
    // Right Penalty Box
    ctx.strokeRect(canvas.width - padX - penW, penTop, penW, penH);

    // 6-Yard Goal Areas (5.5m deep, 18.3m wide)
    const goalAreaW = 38;
    const goalAreaH = 120;
    const goalAreaTop = (canvas.height - goalAreaH) / 2;

    ctx.strokeRect(padX, goalAreaTop, goalAreaW, goalAreaH);
    ctx.strokeRect(canvas.width - padX - goalAreaW, goalAreaTop, goalAreaW, goalAreaH);

    // Penalty Spots (11m out -> ~70px)
    ctx.beginPath();
    ctx.arc(padX + 70, canvas.height / 2, 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(canvas.width - padX - 70, canvas.height / 2, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Penalty Arcs
    ctx.beginPath();
    ctx.arc(padX + 70, canvas.height / 2, 58, -0.65, 0.65);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(canvas.width - padX - 70, canvas.height / 2, 58, Math.PI - 0.65, Math.PI + 0.65);
    ctx.stroke();

    // Corner Arcs (1m radius -> ~10px)
    const cornerR = 12;
    ctx.beginPath();
    ctx.arc(padX, padY, cornerR, 0, Math.PI / 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(padX, canvas.height - padY, cornerR, -Math.PI / 2, 0);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(canvas.width - padX, padY, cornerR, Math.PI / 2, Math.PI);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(canvas.width - padX, canvas.height - padY, cornerR, Math.PI, Math.PI * 1.5);
    ctx.stroke();

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.anisotropy = 4;
    return texture;
  }

  // Classic 32-panel soccer ball pattern
  function createBallTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#111827";
    // Draw classic black hexagons/pentagons
    const points = [
      [32, 32], [96, 32], [160, 32], [224, 32],
      [64, 96], [128, 96], [192, 96]
    ];
    points.forEach(([px, py]) => {
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const a = (i * 2 * Math.PI) / 5 - Math.PI / 2;
        const x = px + Math.cos(a) * 14;
        const y = py + Math.sin(a) * 14;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
    });

    // Seam stitching
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 1;
    ctx.stroke();

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  // LED Advertising Boards texture
  function createLedBoardTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 64;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#020617";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = "bold 24px sans-serif";
    ctx.fillStyle = "#38bdf8";
    ctx.fillText("⚽ FOOTBALL AUCTION LEAGUE", 20, 40);

    ctx.fillStyle = "#facc15";
    ctx.fillText("⭐ PEP'S TACTICAL MASTERCLASS", 420, 40);

    ctx.fillStyle = "#22c55e";
    ctx.fillText("🏆 BALLON D'OR CUP", 820, 40);

    return new THREE.CanvasTexture(canvas);
  }

  // =====================================================
  // 3D MATCH ENGINE CLASS
  // =====================================================

  class Match3DEngine {
    constructor(canvasContainer) {
      this.container = canvasContainer;
      this.canvas = null;
      this.scene = null;
      this.camera = null;
      this.renderer = null;

      // Lighting & Stadium
      this.lights = [];
      this.floodlights = [];
      this.pitchMesh = null;
      this.goalLeft = null;
      this.goalRight = null;
      this.netMeshLeft = null;
      this.netMeshRight = null;
      this.stands = [];

      // Entities
      this.homePlayers = [];
      this.awayPlayers = [];
      this.ball = null;
      this.ballShadow = null;

      // Ball Physics & State
      this.ballPos = new THREE.Vector3(0, 0.42, 0);
      this.ballTarget = new THREE.Vector3(0, 0.42, 0);
      this.ballStart = new THREE.Vector3(0, 0.42, 0);
      this.ballArcHeight = 0;
      this.ballFlightProgress = 1;
      this.ballFlightDuration = 1;
      this.ballCarrier = null;

      // Match State
      this.matchData = null;
      this.matchClockSeconds = 0;
      this.matchClockMinute = 0;
      this.homeScore = 0;
      this.awayScore = 0;
      this.cameraMode = "broadcast"; // broadcast, action, goal, tactical
      this.isPaused = false;
      this.speed = 1;
      this.isReplay = false;
      this.replayHighlight = null;

      // Highlight Phases
      this.highlights = [];
      this.currentHighlightIndex = 0;
      this.highlightPhase = "idle"; // kickoff, buildup, wing_sprint, cross, shot, goal_celebration, save, reset
      this.phaseProgress = 0;
      this.phaseDuration = 3.5;

      // Camera Orbit Controls
      this.isDragging = false;
      this.previousMousePosition = { x: 0, y: 0 };
      this.orbitAngleX = 0;
      this.orbitAngleY = 0;
      this.orbitDistance = 45;

      // Animation Frame
      this.animationFrameId = null;
      this.clock = new THREE.Clock();
      this.soundEnabled = true;

      this.init();
    }

    init() {
      // 1. Scene
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0x050b14);
      this.scene.fog = new THREE.FogExp2(0x050b14, 0.007);

      // 2. Camera
      const width = this.container.clientWidth || 800;
      const height = this.container.clientHeight || 500;
      this.camera = new THREE.PerspectiveCamera(45, width / height, 0.5, 500);
      this.camera.position.set(0, 32, 54);
      this.camera.lookAt(0, 0, 0);

      // 3. WebGL Renderer
      this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      this.canvas = this.renderer.domElement;
      this.canvas.id = "match3dCanvas";
      this.container.appendChild(this.canvas);

      // 4. Lights & Atmosphere
      this.setupLighting();

      // 5. Build 3D Stadium
      this.buildPitch();
      this.buildGoals();
      this.buildCornerFlags();
      this.buildStadiumStands();
      this.buildFloodlightTowers();

      // 6. Build Ball
      this.buildBall();

      // 7. Interaction Listeners
      this.setupInteractions();

      // 8. Start Render Loop
      this.animate = this.animate.bind(this);
      this.animationFrameId = requestAnimationFrame(this.animate);

      // 9. Window Resize
      window.addEventListener("resize", () => this.onResize());
    }

    onResize() {
      if (!this.container || !this.renderer || !this.camera) return;
      const width = this.container.clientWidth;
      const height = this.container.clientHeight;
      if (width === 0 || height === 0) return;
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
    }

    // =====================================================
    // STADIUM GEOMETRY & LIGHTING
    // =====================================================

    setupLighting() {
      // Soft ambient stadium night glow
      const ambientLight = new THREE.AmbientLight(0x7391b4, 0.75);
      this.scene.add(ambientLight);

      // Key stadium directional sunlight/floodlight
      const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
      dirLight.position.set(20, 60, 30);
      dirLight.castShadow = true;
      dirLight.shadow.mapSize.width = 2048;
      dirLight.shadow.mapSize.height = 2048;
      dirLight.shadow.camera.near = 10;
      dirLight.shadow.camera.far = 160;
      dirLight.shadow.camera.left = -60;
      dirLight.shadow.camera.right = 60;
      dirLight.shadow.camera.top = 40;
      dirLight.shadow.camera.bottom = -40;
      dirLight.shadow.bias = -0.0005;
      this.scene.add(dirLight);

      // Warm secondary pitch fill
      const fillLight = new THREE.DirectionalLight(0x60a5fa, 0.5);
      fillLight.position.set(-20, 40, -30);
      this.scene.add(fillLight);
    }

    buildPitch() {
      // Pitch Plane (105m length x 68m width)
      const pitchGeo = new THREE.PlaneGeometry(105, 68, 1, 1);
      const pitchTexture = createPitchTexture();
      const pitchMat = new THREE.MeshLambertMaterial({
        map: pitchTexture,
        roughness: 0.85
      });
      this.pitchMesh = new THREE.Mesh(pitchGeo, pitchMat);
      this.pitchMesh.rotation.x = -Math.PI / 2;
      this.pitchMesh.receiveShadow = true;
      this.scene.add(this.pitchMesh);

      // Stadium Ground Apron (outer perimeter grass & gravel track)
      const apronGeo = new THREE.PlaneGeometry(130, 90);
      const apronMat = new THREE.MeshLambertMaterial({ color: 0x0f2a1b });
      const apron = new THREE.Mesh(apronGeo, apronMat);
      apron.position.y = -0.05;
      apron.rotation.x = -Math.PI / 2;
      apron.receiveShadow = true;
      this.scene.add(apron);

      // LED Digital Sponsor Boards around pitch boundaries
      this.buildLedBoards();
    }

    buildLedBoards() {
      const ledTexture = createLedBoardTexture();
      const ledMat = new THREE.MeshBasicMaterial({ map: ledTexture });

      // Side touchline boards
      const longBoardGeo = new THREE.BoxGeometry(106, 0.9, 0.3);
      const boardNorth = new THREE.Mesh(longBoardGeo, ledMat);
      boardNorth.position.set(0, 0.45, -35.2);
      this.scene.add(boardNorth);

      const boardSouth = new THREE.Mesh(longBoardGeo, ledMat);
      boardSouth.position.set(0, 0.45, 35.2);
      this.scene.add(boardSouth);

      // Goal-line boards (with openings behind goalposts)
      const shortBoardGeo = new THREE.BoxGeometry(0.3, 0.9, 28);
      const boardEast1 = new THREE.Mesh(shortBoardGeo, ledMat);
      boardEast1.position.set(53.5, 0.45, -20);
      this.scene.add(boardEast1);

      const boardEast2 = new THREE.Mesh(shortBoardGeo, ledMat);
      boardEast2.position.set(53.5, 0.45, 20);
      this.scene.add(boardEast2);

      const boardWest1 = new THREE.Mesh(shortBoardGeo, ledMat);
      boardWest1.position.set(-53.5, 0.45, -20);
      this.scene.add(boardWest1);

      const boardWest2 = new THREE.Mesh(shortBoardGeo, ledMat);
      boardWest2.position.set(-53.5, 0.45, 20);
      this.scene.add(boardWest2);
    }

    buildGoals() {
      // Standard Goal Dimensions: 7.32m width, 2.44m height, 2m depth
      const postRadius = 0.12;
      const postMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3, metalness: 0.1 });

      const createGoal = (xPos, isLeft) => {
        const goalGroup = new THREE.Group();

        // 2 Uprights
        const uprightGeo = new THREE.CylinderGeometry(postRadius, postRadius, 2.44, 16);
        const upright1 = new THREE.Mesh(uprightGeo, postMat);
        upright1.position.set(0, 1.22, -3.66);
        upright1.castShadow = true;
        goalGroup.add(upright1);

        const upright2 = new THREE.Mesh(uprightGeo, postMat);
        upright2.position.set(0, 1.22, 3.66);
        upright2.castShadow = true;
        goalGroup.add(upright2);

        // Crossbar (7.32m)
        const crossbarGeo = new THREE.CylinderGeometry(postRadius, postRadius, 7.32, 16);
        const crossbar = new THREE.Mesh(crossbarGeo, postMat);
        crossbar.position.set(0, 2.44, 0);
        crossbar.rotation.x = Math.PI / 2;
        crossbar.castShadow = true;
        goalGroup.add(crossbar);

        // Rear support ground frame
        const depth = isLeft ? -2.2 : 2.2;
        const rearBarGeo = new THREE.CylinderGeometry(postRadius * 0.8, postRadius * 0.8, 7.32, 16);
        const rearBar = new THREE.Mesh(rearBarGeo, postMat);
        rearBar.position.set(depth, 0.1, 0);
        rearBar.rotation.x = Math.PI / 2;
        goalGroup.add(rearBar);

        // 3D Goal Netting (translucent wireframe cage)
        const netGeo = new THREE.BoxGeometry(Math.abs(depth), 2.44, 7.32, 8, 6, 12);
        const netMat = new THREE.MeshBasicMaterial({
          color: 0xffffff,
          wireframe: true,
          transparent: true,
          opacity: 0.38
        });
        const netMesh = new THREE.Mesh(netGeo, netMat);
        netMesh.position.set(depth / 2, 1.22, 0);
        goalGroup.add(netMesh);

        goalGroup.position.set(xPos, 0, 0);
        this.scene.add(goalGroup);

        return { group: goalGroup, net: netMesh };
      };

      const left = createGoal(-52.5, true);
      this.goalLeft = left.group;
      this.netMeshLeft = left.net;

      const right = createGoal(52.5, false);
      this.goalRight = right.group;
      this.netMeshRight = right.net;
    }

    buildCornerFlags() {
      const flagMat = new THREE.MeshBasicMaterial({ color: 0xef4444, side: THREE.DoubleSide });
      const poleMat = new THREE.MeshStandardMaterial({ color: 0xffffff });

      const corners = [
        [-52.5, -34],
        [-52.5, 34],
        [52.5, -34],
        [52.5, 34]
      ];

      corners.forEach(([cx, cz]) => {
        const flagGroup = new THREE.Group();
        const poleGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.5, 8);
        const pole = new THREE.Mesh(poleGeo, poleMat);
        pole.position.y = 0.75;
        flagGroup.add(pole);

        const bannerGeo = new THREE.PlaneGeometry(0.4, 0.28);
        const banner = new THREE.Mesh(bannerGeo, flagMat);
        banner.position.set(0.2, 1.35, 0);
        flagGroup.add(banner);

        flagGroup.position.set(cx, 0, cz);
        this.scene.add(flagGroup);
      });
    }

    buildStadiumStands() {
      // 4 Tiered Grandstands surrounding pitch
      const standMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 });
      const seatColors = [0xdc2626, 0x2563eb, 0xfacc15, 0xffffff];

      // Side Stand Maker
      const makeStand = (x, y, z, rotY, length) => {
        const standGroup = new THREE.Group();

        // 5 concrete tiers
        for (let t = 0; t < 5; t++) {
          const tierGeo = new THREE.BoxGeometry(length, 2.5, 4);
          const tier = new THREE.Mesh(tierGeo, standMat);
          tier.position.set(0, t * 2.5 + 1.25, t * 3.8);
          tier.castShadow = true;
          tier.receiveShadow = true;
          standGroup.add(tier);

          // Crowd crowd block strip
          const crowdGeo = new THREE.BoxGeometry(length * 0.96, 0.8, 2.5);
          const crowdColor = seatColors[t % seatColors.length];
          const crowdMat = new THREE.MeshLambertMaterial({ color: crowdColor });
          const crowd = new THREE.Mesh(crowdGeo, crowdMat);
          crowd.position.set(0, t * 2.5 + 2.8, t * 3.8);
          standGroup.add(crowd);
        }

        // Roof structure
        const roofGeo = new THREE.BoxGeometry(length, 1, 24);
        const roofMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.7 });
        const roof = new THREE.Mesh(roofGeo, roofMat);
        roof.position.set(0, 18, 10);
        roof.rotation.x = 0.12;
        standGroup.add(roof);

        standGroup.position.set(x, y, z);
        standGroup.rotation.y = rotY;
        this.scene.add(standGroup);
        this.stands.push(standGroup);
      };

      // North & South Stands (Sidelines)
      makeStand(0, 0, 42, 0, 115);
      makeStand(0, 0, -42, Math.PI, 115);

      // East & West Stands (Behind Goals)
      makeStand(60, 0, 0, -Math.PI / 2, 74);
      makeStand(-60, 0, 0, Math.PI / 2, 74);
    }

    buildFloodlightTowers() {
      const mastMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8, roughness: 0.4 });
      const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

      const towerPositions = [
        [-62, 0, -44],
        [62, 0, -44],
        [-62, 0, 44],
        [62, 0, 44]
      ];

      towerPositions.forEach(([tx, ty, tz]) => {
        const tower = new THREE.Group();

        // Main lattice pole
        const mastGeo = new THREE.CylinderGeometry(0.5, 1.2, 28, 8);
        const mast = new THREE.Mesh(mastGeo, mastMat);
        mast.position.y = 14;
        mast.castShadow = true;
        tower.add(mast);

        // Floodlight head bank
        const headGeo = new THREE.BoxGeometry(5, 3.5, 0.8);
        const head = new THREE.Mesh(headGeo, mastMat);
        head.position.set(0, 27, 0);
        head.lookAt(0, 0, 0);
        tower.add(head);

        // Glowing bulb matrix
        for (let bx = -1.8; bx <= 1.8; bx += 0.9) {
          for (let by = -1.1; by <= 1.1; by += 1.1) {
            const bulbGeo = new THREE.BoxGeometry(0.7, 0.7, 0.2);
            const bulb = new THREE.Mesh(bulbGeo, bulbMat);
            bulb.position.set(bx, 27 + by, 0.45);
            bulb.lookAt(0, 0, 0);
            tower.add(bulb);
          }
        }

        // Spot Light beaming onto pitch
        const spot = new THREE.SpotLight(0xffffff, 2.5);
        spot.position.set(tx, 27, tz);
        spot.target.position.set(tx * 0.3, 0, tz * 0.3);
        spot.angle = Math.PI / 4.5;
        spot.penumbra = 0.5;
        spot.decay = 1.4;
        spot.distance = 120;
        spot.castShadow = false; // keep frame rate high
        this.scene.add(spot);
        this.scene.add(spot.target);

        tower.position.set(tx, ty, tz);
        this.scene.add(tower);
        this.floodlights.push(tower);
      });
    }

    // =====================================================
    // 3D FOOTBALL & SHADOW
    // =====================================================

    buildBall() {
      // 3D Ball Sphere (radius ~0.42m)
      const ballGeo = new THREE.SphereGeometry(0.42, 24, 24);
      const ballTexture = createBallTexture();
      const ballMat = new THREE.MeshStandardMaterial({
        map: ballTexture,
        roughness: 0.4,
        metalness: 0.1
      });

      this.ball = new THREE.Mesh(ballGeo, ballMat);
      this.ball.castShadow = true;
      this.ball.position.set(0, 0.42, 0);
      this.scene.add(this.ball);

      // Dynamic turf shadow beneath ball
      const shadowGeo = new THREE.CircleGeometry(0.42, 16);
      const shadowMat = new THREE.MeshBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: 0.45
      });
      this.ballShadow = new THREE.Mesh(shadowGeo, shadowMat);
      this.ballShadow.rotation.x = -Math.PI / 2;
      this.ballShadow.position.set(0, 0.03, 0);
      this.scene.add(this.ballShadow);
    }

    // =====================================================
    // 3D PLAYERS CREATION & KIT STYLING
    // =====================================================

    createPlayerModel(kit, isGk = false, number = 10, roleName = "ST") {
      const playerGroup = new THREE.Group();

      const jerseyColor = isGk ? kit.gk : kit.primary;
      const shortsColor = isGk ? 0x111827 : kit.shorts;
      const socksColor = kit.secondary;

      const skinMat = new THREE.MeshStandardMaterial({ color: 0xdb9a6a, roughness: 0.7 });
      const hairMat = new THREE.MeshStandardMaterial({ color: 0x221710, roughness: 0.8 });
      const jerseyMat = new THREE.MeshStandardMaterial({ color: jerseyColor, roughness: 0.6 });
      const shortsMat = new THREE.MeshStandardMaterial({ color: shortsColor, roughness: 0.6 });
      const socksMat = new THREE.MeshStandardMaterial({ color: socksColor, roughness: 0.6 });
      const bootMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.4 });

      // Torso / Jersey (0.75m wide, 0.85m tall)
      const torsoGeo = new THREE.BoxGeometry(0.72, 0.85, 0.42);
      const torso = new THREE.Mesh(torsoGeo, jerseyMat);
      torso.position.y = 1.35;
      torso.castShadow = true;
      playerGroup.add(torso);

      // Head & Hair
      const headGeo = new THREE.SphereGeometry(0.24, 16, 16);
      const head = new THREE.Mesh(headGeo, skinMat);
      head.position.y = 1.95;
      head.castShadow = true;
      playerGroup.add(head);

      const hairGeo = new THREE.SphereGeometry(0.25, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
      const hair = new THREE.Mesh(hairGeo, hairMat);
      hair.position.y = 2.0;
      playerGroup.add(hair);

      // Arms (swingable hierarchy)
      const armGeo = new THREE.CylinderGeometry(0.1, 0.09, 0.65, 8);
      
      const leftArm = new THREE.Mesh(armGeo, skinMat);
      leftArm.position.set(-0.46, 1.35, 0);
      leftArm.castShadow = true;
      playerGroup.add(leftArm);

      const rightArm = new THREE.Mesh(armGeo, skinMat);
      rightArm.position.set(0.46, 1.35, 0);
      rightArm.castShadow = true;
      playerGroup.add(rightArm);

      // Shorts
      const shortsGeo = new THREE.BoxGeometry(0.74, 0.42, 0.44);
      const shorts = new THREE.Mesh(shortsGeo, shortsMat);
      shorts.position.y = 0.82;
      shorts.castShadow = true;
      playerGroup.add(shorts);

      // Legs (swingable)
      const legGeo = new THREE.CylinderGeometry(0.12, 0.1, 0.6, 8);
      
      const leftLeg = new THREE.Mesh(legGeo, socksMat);
      leftLeg.position.set(-0.2, 0.35, 0);
      leftLeg.castShadow = true;
      playerGroup.add(leftLeg);

      const rightLeg = new THREE.Mesh(legGeo, socksMat);
      rightLeg.position.set(0.2, 0.35, 0);
      rightLeg.castShadow = true;
      playerGroup.add(rightLeg);

      // Boots
      const bootGeo = new THREE.BoxGeometry(0.14, 0.12, 0.26);
      const leftBoot = new THREE.Mesh(bootGeo, bootMat);
      leftBoot.position.set(-0.2, 0.06, 0.05);
      playerGroup.add(leftBoot);

      const rightBoot = new THREE.Mesh(bootGeo, bootMat);
      rightBoot.position.set(0.2, 0.06, 0.05);
      playerGroup.add(rightBoot);

      // Turf Contact Shadow
      const shadowGeo = new THREE.CircleGeometry(0.45, 12);
      const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.3 });
      const shadow = new THREE.Mesh(shadowGeo, shadowMat);
      shadow.rotation.x = -Math.PI / 2;
      shadow.position.y = 0.02;
      playerGroup.add(shadow);

      return {
        mesh: playerGroup,
        leftArm,
        rightArm,
        leftLeg,
        rightLeg,
        isGk,
        number,
        role: roleName,
        targetPos: new THREE.Vector3(),
        basePos: new THREE.Vector3(),
        animOffset: Math.random() * Math.PI * 2,
        isCelebrating: false
      };
    }

    // Set up 11v11 squad formations
    setupTeams(homeName, awayName) {
      // Clear existing players
      this.homePlayers.forEach(p => this.scene.remove(p.mesh));
      this.awayPlayers.forEach(p => this.scene.remove(p.mesh));
      this.homePlayers = [];
      this.awayPlayers = [];

      const homeKit = getClubKit(homeName);
      const awayKit = getClubKit(awayName);

      // 4-3-3 Home Formation (Facing positive X -> right goal)
      const homePositions = [
        { role: "GK", x: -47, z: 0, gk: true, num: 1 },
        { role: "LB", x: -30, z: -20, num: 3 },
        { role: "LCB", x: -36, z: -8, num: 4 },
        { role: "RCB", x: -36, z: 8, num: 5 },
        { role: "RB", x: -30, z: 20, num: 2 },
        { role: "CDM", x: -24, z: 0, num: 16 },
        { role: "LCM", x: -14, z: -11, num: 8 },
        { role: "RCM", x: -14, z: 11, num: 17 },
        { role: "LW", x: -2, z: -22, num: 7 },
        { role: "ST", x: 0, z: 0, num: 9 },
        { role: "RW", x: -2, z: 22, num: 11 }
      ];

      // 4-3-3 Away Formation (Facing negative X -> left goal)
      const awayPositions = [
        { role: "GK", x: 47, z: 0, gk: true, num: 1 },
        { role: "RB", x: 30, z: -20, num: 2 },
        { role: "RCB", x: 36, z: -8, num: 4 },
        { role: "LCB", x: 36, z: 8, num: 5 },
        { role: "LB", x: 30, z: 20, num: 3 },
        { role: "CDM", x: 24, z: 0, num: 6 },
        { role: "RCM", x: 14, z: -11, num: 10 },
        { role: "LCM", x: 14, z: 11, num: 8 },
        { role: "RW", x: 2, z: -22, num: 11 },
        { role: "ST", x: 0.5, z: 2, num: 9 },
        { role: "LW", x: 2, z: 22, num: 7 }
      ];

      homePositions.forEach(pos => {
        const p = this.createPlayerModel(homeKit, pos.gk, pos.num, pos.role);
        p.mesh.position.set(pos.x, 0, pos.z);
        p.basePos.set(pos.x, 0, pos.z);
        p.targetPos.copy(p.basePos);
        p.mesh.lookAt(pos.x + 10, 0, pos.z);
        this.scene.add(p.mesh);
        this.homePlayers.push(p);
      });

      awayPositions.forEach(pos => {
        const p = this.createPlayerModel(awayKit, pos.gk, pos.num, pos.role);
        p.mesh.position.set(pos.x, 0, pos.z);
        p.basePos.set(pos.x, 0, pos.z);
        p.targetPos.copy(p.basePos);
        p.mesh.lookAt(pos.x - 10, 0, pos.z);
        this.scene.add(p.mesh);
        this.awayPlayers.push(p);
      });
    }

    // =====================================================
    // MATCH HIGHLIGHTS & SCRIPTED SEQUENCE GENERATOR
    // =====================================================

    loadMatch(fixture, roomTeams = {}) {
      this.matchData = fixture;
      this.homeScore = 0;
      this.awayScore = 0;
      this.matchClockMinute = 1;
      this.matchClockSeconds = 0;
      this.currentHighlightIndex = 0;
      this.isPaused = false;
      this.isReplay = false;

      this.setupTeams(fixture.homeTeam, fixture.awayTeam);

      // Generate sequence of exciting match highlights
      this.highlights = this.generateMatchHighlights(fixture);
      this.startHighlight(0);

      this.updateHud();
    }

    generateMatchHighlights(fixture) {
      const list = [];
      const scorers = Array.isArray(fixture.scorers) ? fixture.scorers : [];
      const isPlayed = Boolean(fixture.played);

      if (isPlayed && scorers.length > 0) {
        // Build highlights for every scored goal in the match!
        scorers.forEach((s, idx) => {
          const isHomeGoal = s.team === fixture.homeTeam;
          const minuteNum = typeof s.minute === "string" ? parseInt(s.minute.replace("90+", "90"), 10) : s.minute;

          list.push({
            type: "goal",
            minute: s.minute,
            minuteNum: minuteNum,
            team: s.team,
            scorer: s.scorer,
            isHomeGoal: isHomeGoal,
            title: `GOAL! ${s.scorer} (${s.minute}')`,
            description: `${s.team} strike! ${s.scorer} finishes brilliantly into the net!`,
            targetScore: {
              home: scorers.slice(0, idx + 1).filter(g => g.team === fixture.homeTeam).length,
              away: scorers.slice(0, idx + 1).filter(g => g.team === fixture.awayTeam).length
            }
          });
        });
      } else {
        // Dynamic simulated highlights
        const homeAttack = {
          type: "goal",
          minute: "34",
          minuteNum: 34,
          team: fixture.homeTeam,
          scorer: `${fixture.homeTeam} Striker`,
          isHomeGoal: true,
          title: `GOAL! ${fixture.homeTeam} (34')`,
          description: `${fixture.homeTeam} break the deadlock with a lethal finish!`,
          targetScore: { home: 1, away: 0 }
        };

        const awayAttack = {
          type: "save",
          minute: "68",
          minuteNum: 68,
          team: fixture.awayTeam,
          scorer: null,
          isHomeGoal: false,
          title: `HEROIC SAVE! (68')`,
          description: `Tremendous diving reflex save tips the curling shot wide!`,
          targetScore: { home: 1, away: 0 }
        };

        const finalAction = {
          type: fixture.awayScore > 0 ? "goal" : "crossbar",
          minute: "88",
          minuteNum: 88,
          team: fixture.awayTeam,
          scorer: `${fixture.awayTeam} Star`,
          isHomeGoal: false,
          title: fixture.awayScore > 0 ? `GOAL! ${fixture.awayTeam} (88')` : `WOODWORK CLATTER! (88')`,
          description: fixture.awayScore > 0 ? `${fixture.awayTeam} strike late drama!` : `Thunderous shot cannons off the crossbar!`,
          targetScore: { home: fixture.homeScore || 1, away: fixture.awayScore || 0 }
        };

        list.push(homeAttack, awayAttack, finalAction);
      }

      // Add Opening Kickoff highlight at index 0
      list.unshift({
        type: "kickoff",
        minute: "1",
        minuteNum: 1,
        team: fixture.homeTeam,
        scorer: null,
        isHomeGoal: true,
        title: "KICK-OFF",
        description: `The referee signals kickoff! ${fixture.homeTeam} vs ${fixture.awayTeam} is underway.`,
        targetScore: { home: 0, away: 0 }
      });

      return list;
    }

    startHighlight(index) {
      if (index < 0 || index >= this.highlights.length) return;
      this.currentHighlightIndex = index;
      const hl = this.highlights[index];

      this.matchClockMinute = hl.minuteNum || 1;
      this.phaseProgress = 0;
      this.phaseDuration = hl.type === "goal" ? 8.5 : 6.0;

      // Update score up to this highlight
      if (hl.targetScore) {
        this.homeScore = hl.targetScore.home;
        this.awayScore = hl.targetScore.away;
      }

      this.displayCommentary(`⏱️ ${hl.minute}' - ${hl.description}`, hl.type);

      // Play sound
      if (hl.type === "kickoff") {
        if (typeof global.playWhistleSound === "function") global.playWhistleSound();
      } else if (hl.type === "goal") {
        if (typeof global.playKickSound === "function") global.playKickSound();
      }

      this.setupHighlightPositions(hl);
      this.updateHud();
    }

    setupHighlightPositions(hl) {
      // Reset players to tactical positions around active play
      const attackingHome = hl.isHomeGoal !== false;
      const targetGoalX = attackingHome ? 52.5 : -52.5;

      if (hl.type === "kickoff") {
        this.ballPos.set(0, 0.42, 0);
        this.ballTarget.set(0, 0.42, 0);
        this.ballCarrier = attackingHome ? this.homePlayers[9] : this.awayPlayers[9];
      } else {
        // Set up attacking run towards target goal
        const startX = attackingHome ? 12 : -12;
        this.ballPos.set(startX, 0.42, (Math.random() - 0.5) * 16);
        this.ballTarget.copy(this.ballPos);

        const attackers = attackingHome ? this.homePlayers : this.awayPlayers;
        const defenders = attackingHome ? this.awayPlayers : this.homePlayers;

        // Advance attackers into opponent half
        attackers.forEach(p => {
          const forwardOffset = attackingHome ? 18 : -18;
          p.targetPos.set(p.basePos.x + forwardOffset, 0, p.basePos.z * 0.85);
        });

        // Pull defenders back into penalty zone
        defenders.forEach(p => {
          if (!p.isGk) {
            const retreatOffset = attackingHome ? 12 : -12;
            p.targetPos.set(p.basePos.x + retreatOffset, 0, p.basePos.z * 0.7);
          }
        });

        // Winger or striker carries ball
        this.ballCarrier = attackers[9]; // Striker
      }
    }

    // =====================================================
    // AUDIO EFFECTS INTEGRATION
    // =====================================================

    playKickSound() {
      if (!this.soundEnabled || typeof global.playKickSound !== "function") return;
      global.playKickSound();
    }

    playNetSound() {
      if (!this.soundEnabled || typeof global.playNetSound !== "function") return;
      global.playNetSound();
    }

    playGoalRoar() {
      if (!this.soundEnabled) return;
      if (this.matchData?.isRivalry && typeof global.playRivalrySound === "function") {
        global.playRivalrySound();
      } else if (typeof global.playGoalSound === "function") {
        global.playGoalSound();
      }
    }

    // =====================================================
    // CAMERA & ORBIT MODES
    // =====================================================

    setCameraMode(mode) {
      this.cameraMode = mode;
      const camBtns = document.querySelectorAll(".cam-btn");
      camBtns.forEach(btn => {
        if (btn.dataset.mode === mode) btn.classList.add("active");
        else btn.classList.remove("active");
      });
    }

    updateCamera() {
      if (this.isDragging) return; // User manually orbiting

      const ball = this.ballPos;

      if (this.cameraMode === "broadcast") {
        // High sideline broadcast camera tracking laterally with play
        const targetX = THREE.MathUtils.lerp(this.camera.position.x, ball.x * 0.65, 0.05);
        this.camera.position.set(targetX, 26, 46);
        this.camera.lookAt(targetX, 1.2, 0);
      } else if (this.cameraMode === "action") {
        // Dynamic close tracker following active ball carrier
        const lookTarget = new THREE.Vector3(ball.x, 1.2, ball.z);
        const camOffsetZ = ball.z > 0 ? 18 : -18;
        const targetX = THREE.MathUtils.lerp(this.camera.position.x, ball.x - 12, 0.06);
        const targetZ = THREE.MathUtils.lerp(this.camera.position.z, ball.z + camOffsetZ, 0.06);
        this.camera.position.set(targetX, 10, targetZ);
        this.camera.lookAt(lookTarget);
      } else if (this.cameraMode === "goal") {
        // Behind the goal net looking downfield towards attacking waves
        const isAttackingRight = this.highlights[this.currentHighlightIndex]?.isHomeGoal !== false;
        const goalX = isAttackingRight ? 58 : -58;
        this.camera.position.set(goalX, 6.5, 0);
        this.camera.lookAt(isAttackingRight ? 20 : -20, 1.8, 0);
      } else if (this.cameraMode === "tactical") {
        // Overhead isometric view showing formations & spacing
        this.camera.position.set(0, 72, 2);
        this.camera.lookAt(0, 0, 0);
      }
    }

    setupInteractions() {
      // Mouse drag to orbit
      this.canvas.addEventListener("mousedown", e => {
        this.isDragging = true;
        this.previousMousePosition = { x: e.clientX, y: e.clientY };
      });

      window.addEventListener("mouseup", () => {
        this.isDragging = false;
      });

      this.canvas.addEventListener("mousemove", e => {
        if (!this.isDragging) return;
        const deltaX = e.clientX - this.previousMousePosition.x;
        const deltaY = e.clientY - this.previousMousePosition.y;

        this.camera.position.x -= deltaX * 0.15;
        this.camera.position.y += deltaY * 0.15;
        this.camera.position.y = Math.max(4, Math.min(80, this.camera.position.y));
        this.camera.lookAt(0, 1, 0);

        this.previousMousePosition = { x: e.clientX, y: e.clientY };
      });

      // Zoom
      this.canvas.addEventListener("wheel", e => {
        e.preventDefault();
        const zoomDelta = e.deltaY * 0.05;
        this.camera.position.z += zoomDelta;
        this.camera.position.z = Math.max(12, Math.min(95, this.camera.position.z));
      }, { passive: false });
    }

    // =====================================================
    // ANIMATION & GAMEPLAY SIMULATION LOOP
    // =====================================================

    animate() {
      this.animationFrameId = requestAnimationFrame(this.animate);

      const delta = this.clock.getDelta();
      if (!this.isPaused) {
        this.updateSimulation(delta * this.speed);
      }

      this.updateCamera();
      this.renderer.render(this.scene, this.camera);
    }

    updateSimulation(delta) {
      if (!this.highlights || this.highlights.length === 0) return;

      this.phaseProgress += delta;
      const t = Math.min(1, this.phaseProgress / this.phaseDuration);

      const hl = this.highlights[this.currentHighlightIndex];
      const attackingHome = hl.isHomeGoal !== false;
      const targetGoalX = attackingHome ? 52.5 : -52.5;

      // Animate phase based on type
      if (hl.type === "kickoff") {
        this.animateKickoff(t);
      } else if (hl.type === "goal") {
        this.animateGoalSequence(t, hl, targetGoalX);
      } else if (hl.type === "save") {
        this.animateSaveSequence(t, hl, targetGoalX);
      } else {
        this.animateWoodworkSequence(t, hl, targetGoalX);
      }

      // Smoothly update ball position & shadow
      this.ball.position.copy(this.ballPos);
      this.ballShadow.position.set(this.ballPos.x, 0.03, this.ballPos.z);
      const shadowScale = Math.max(0.4, 1 - (this.ballPos.y / 8));
      this.ballShadow.scale.set(shadowScale, shadowScale, 1);

      // Animate player running cycles
      this.animatePlayers(delta);

      // Check if highlight completed
      if (t >= 1) {
        if (!this.isReplay) {
          if (this.currentHighlightIndex < this.highlights.length - 1) {
            this.startHighlight(this.currentHighlightIndex + 1);
          } else {
            // Loop or celebrate final whistle
            this.displayCommentary("🏁 FULL-TIME WHISTLE! What an exhilarating match!", "fulltime");
            if (typeof global.playWhistleSound === "function") global.playWhistleSound();
            this.isPaused = true;
            this.updateHud();
          }
        } else {
          // Replay finished
          this.isReplay = false;
          this.hideReplayBadge();
          this.speed = 1;
        }
      }
    }

    animateKickoff(t) {
      if (t < 0.3) {
        // Central tap
        this.ballPos.set(0, 0.42, 0);
      } else {
        // Pass back to midfielder
        const passT = (t - 0.3) / 0.7;
        this.ballPos.x = THREE.MathUtils.lerp(0, -18, passT);
        this.ballPos.z = THREE.MathUtils.lerp(0, -5, passT);
        this.ballPos.y = 0.42;
      }
    }

    animateGoalSequence(t, hl, targetGoalX) {
      const attackingHome = targetGoalX > 0;
      const attackers = attackingHome ? this.homePlayers : this.awayPlayers;
      const defenders = attackingHome ? this.awayPlayers : this.homePlayers;
      const gk = defenders[0];
      const striker = attackers[9];

      if (t < 0.35) {
        // Buildup & wing penetration
        const p = t / 0.35;
        this.ballPos.x = THREE.MathUtils.lerp(attackingHome ? 10 : -10, attackingHome ? 38 : -38, p);
        this.ballPos.z = THREE.MathUtils.lerp(0, attackingHome ? 18 : -18, p);
        this.ballPos.y = 0.42;
        striker.targetPos.set(attackingHome ? 32 : -32, 0, attackingHome ? 6 : -6);
      } else if (t < 0.65) {
        // Cross & Shot execution
        const p = (t - 0.35) / 0.3;
        const startX = attackingHome ? 38 : -38;
        const startZ = attackingHome ? 18 : -18;
        const crossDestX = attackingHome ? 48 : -48;
        const crossDestZ = (Math.random() > 0.5 ? 1 : -1) * 2.2;

        this.ballPos.x = THREE.MathUtils.lerp(startX, crossDestX, p);
        this.ballPos.z = THREE.MathUtils.lerp(startZ, crossDestZ, p);
        // Parabolic cross flight
        this.ballPos.y = 0.42 + Math.sin(p * Math.PI) * 3.8;

        // Striker connects
        striker.targetPos.set(crossDestX - (attackingHome ? 4 : -4), 0, crossDestZ);
        striker.rightLeg.rotation.x = -Math.sin(p * Math.PI) * 1.2;

        // Goalkeeper prepares dive
        gk.targetPos.set(targetGoalX - (attackingHome ? 1.5 : -1.5), 0, crossDestZ * 0.5);
      } else if (t < 0.75) {
        // Ball bursts into net!
        const p = (t - 0.65) / 0.1;
        const shotStartZ = this.ballPos.z;
        this.ballPos.x = THREE.MathUtils.lerp(attackingHome ? 48 : -48, targetGoalX + (attackingHome ? 1.4 : -1.4), p);
        this.ballPos.y = THREE.MathUtils.lerp(2.2, 1.8, p);

        // Sound trigger once
        if (!this.goalSoundFired) {
          this.goalSoundFired = true;
          this.playNetSound();
          this.playGoalRoar();
          this.triggerGoalCelebration(hl);
          // Ripple 3D goal net
          const net = attackingHome ? this.netMeshRight : this.netMeshLeft;
          if (net) net.scale.set(1.15, 1.08, 1.12);
        }
      } else {
        // Goal Celebration!
        this.ballPos.y = 0.42;
        // Striker knee slide & teammate swarm
        striker.leftArm.rotation.x = -Math.PI * 0.8;
        striker.rightArm.rotation.x = -Math.PI * 0.8;
        striker.mesh.position.y = 0.3; // slide
      }
    }

    animateSaveSequence(t, hl, targetGoalX) {
      const attackingHome = targetGoalX > 0;
      const defenders = attackingHome ? this.awayPlayers : this.homePlayers;
      const gk = defenders[0];

      if (t < 0.55) {
        const p = t / 0.55;
        this.ballPos.x = THREE.MathUtils.lerp(attackingHome ? 15 : -15, attackingHome ? 46 : -46, p);
        this.ballPos.z = THREE.MathUtils.lerp(0, attackingHome ? 4 : -4, p);
        this.ballPos.y = 0.42 + Math.sin(p * Math.PI) * 2.6;
      } else {
        // GK full stretch lateral dive!
        const p = (t - 0.55) / 0.45;
        gk.mesh.rotation.z = attackingHome ? -Math.PI * 0.38 : Math.PI * 0.38;
        gk.mesh.position.y = 0.5;
        // Ball parried out for corner
        this.ballPos.x = THREE.MathUtils.lerp(attackingHome ? 46 : -46, targetGoalX, p);
        this.ballPos.z = THREE.MathUtils.lerp(attackingHome ? 4 : -4, attackingHome ? 12 : -12, p);
        this.ballPos.y = 0.42;
      }
    }

    animateWoodworkSequence(t, hl, targetGoalX) {
      const attackingHome = targetGoalX > 0;
      if (t < 0.6) {
        const p = t / 0.6;
        this.ballPos.x = THREE.MathUtils.lerp(attackingHome ? 20 : -20, targetGoalX, p);
        this.ballPos.y = THREE.MathUtils.lerp(0.42, 2.44, p); // hits crossbar exact height
      } else {
        // Clatters off the bar and bounces forward
        const p = (t - 0.6) / 0.4;
        this.ballPos.x = THREE.MathUtils.lerp(targetGoalX, targetGoalX - (attackingHome ? 14 : -14), p);
        this.ballPos.y = 0.42 + Math.abs(Math.sin(p * Math.PI * 2)) * 1.5;
      }
    }

    animatePlayers(delta) {
      const animateList = [...this.homePlayers, ...this.awayPlayers];
      const time = this.clock.getElapsedTime();

      animateList.forEach(p => {
        // Interpolate towards target position
        p.mesh.position.lerp(p.targetPos, 0.08);

        // Calculate velocity for leg swing
        const dist = p.mesh.position.distanceTo(p.targetPos);
        if (dist > 0.4) {
          const runSpeed = 12;
          const legSwing = Math.sin(time * runSpeed + p.animOffset) * 0.65;
          p.leftLeg.rotation.x = legSwing;
          p.rightLeg.rotation.x = -legSwing;
          p.leftArm.rotation.x = -legSwing * 0.8;
          p.rightArm.rotation.x = legSwing * 0.8;

          // Orient player towards target
          const lookPos = new THREE.Vector3().copy(p.targetPos);
          lookPos.y = p.mesh.position.y;
          p.mesh.lookAt(lookPos);
        } else {
          // Idle breathing
          p.leftLeg.rotation.x = 0;
          p.rightLeg.rotation.x = 0;
          p.mesh.position.y = 0;
        }
      });
    }

    // =====================================================
    // CELEBRATION & HUD CONTROLS
    // =====================================================

    triggerGoalCelebration(hl) {
      // Update score in HUD
      if (hl.targetScore) {
        this.homeScore = hl.targetScore.home;
        this.awayScore = hl.targetScore.away;
      } else if (hl.isHomeGoal) {
        this.homeScore++;
      } else {
        this.awayScore++;
      }
      this.updateScoreboard();

      // Show floating celebratory banner
      const banner = document.getElementById("match3dGoalBanner");
      if (banner) {
        banner.innerHTML = `
          <div class="banner-fire">⚽ GOOOOOAL!</div>
          <div class="banner-scorer">${hl.scorer || "Sensational Strike"} (${hl.minute}')</div>
          <div class="banner-sub">${hl.team} take the advantage!</div>
        `;
        banner.classList.add("show");
        setTimeout(() => banner.classList.remove("show"), 4200);
      }
    }

    instantReplay() {
      const hl = this.highlights[this.currentHighlightIndex];
      if (!hl) return;

      this.isReplay = true;
      this.phaseProgress = 0;
      this.speed = 0.45; // slow-motion
      this.setCameraMode("goal");
      this.showReplayBadge();
      this.goalSoundFired = false;
      this.displayCommentary(`⏪ REPLAY: ${hl.title} in Slow Motion`, "replay");
    }

    replayCurrentHighlight() {
      this.instantReplay();
    }

    nextHighlight() {
      if (this.currentHighlightIndex < this.highlights.length - 1) {
        this.goalSoundFired = false;
        this.startHighlight(this.currentHighlightIndex + 1);
      }
    }

    prevHighlight() {
      if (this.currentHighlightIndex > 0) {
        this.goalSoundFired = false;
        this.startHighlight(this.currentHighlightIndex - 1);
      }
    }

    togglePlayPause() {
      this.isPaused = !this.isPaused;
      const playBtn = document.getElementById("btnMatch3dPlay");
      if (playBtn) playBtn.innerHTML = this.isPaused ? "▶️ Play" : "⏸️ Pause";
    }

    setSpeed(speedVal) {
      this.speed = speedVal;
      const speedBtns = document.querySelectorAll(".speed-btn");
      speedBtns.forEach(btn => {
        if (parseFloat(btn.dataset.speed) === speedVal) btn.classList.add("active");
        else btn.classList.remove("active");
      });
    }

    toggleSound() {
      this.soundEnabled = !this.soundEnabled;
      const soundBtn = document.getElementById("btnMatch3dSound");
      if (soundBtn) {
        soundBtn.innerHTML = this.soundEnabled ? "🔊 Sound: ON" : "🔇 Sound: OFF";
      }
    }

    displayCommentary(text, type = "normal") {
      const box = document.getElementById("match3dCommentary");
      if (!box) return;
      box.innerHTML = `<span class="comm-icon">${type === 'goal' ? '🔥' : type === 'save' ? '🧤' : '📢'}</span> <span class="comm-text">${text}</span>`;
      box.classList.remove("pop");
      void box.offsetWidth; // reflow
      box.classList.add("pop");
    }

    showReplayBadge() {
      const b = document.getElementById("match3dReplayBadge");
      if (b) b.classList.remove("hidden");
    }

    hideReplayBadge() {
      const b = document.getElementById("match3dReplayBadge");
      if (b) b.classList.add("hidden");
    }

    updateScoreboard() {
      const sHome = document.getElementById("hudScoreHome");
      const sAway = document.getElementById("hudScoreAway");
      if (sHome) sHome.innerText = this.homeScore;
      if (sAway) sAway.innerText = this.awayScore;
    }

    updateHud() {
      if (!this.matchData) return;

      const title = document.getElementById("hudMatchTitle");
      const nameHome = document.getElementById("hudTeamNameHome");
      const nameAway = document.getElementById("hudTeamNameAway");
      const clock = document.getElementById("hudMatchClock");
      const derbyTag = document.getElementById("hudDerbyTag");

      if (title) {
        const round = this.matchData.round ? `Round ${this.matchData.round}` : "Matchday";
        title.innerText = `${round} • 3D Match Stadium`;
      }
      if (nameHome) nameHome.innerText = this.matchData.homeTeam;
      if (nameAway) nameAway.innerText = this.matchData.awayTeam;
      if (clock) clock.innerText = `${this.matchClockMinute}'`;

      if (derbyTag) {
        if (this.matchData.isRivalry) {
          derbyTag.innerText = `🔥 ${this.matchData.derbyName || "ARCH RIVAL DERBY"}`;
          derbyTag.style.display = "inline-block";
        } else {
          derbyTag.style.display = "none";
        }
      }

      this.updateScoreboard();
    }

    destroy() {
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
      }
      if (this.renderer && this.renderer.domElement && this.renderer.domElement.parentNode) {
        this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
      }
      if (this.renderer) {
        this.renderer.dispose();
      }
    }
  }

  // Export to global window object
  global.Match3DEngine = Match3DEngine;

})(typeof window !== "undefined" ? window : global);
