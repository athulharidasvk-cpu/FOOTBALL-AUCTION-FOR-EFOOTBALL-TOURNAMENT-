// Game-style screen navigation patch. Preserves the original app and moves between real screens.
(function () {
  "use strict";

  const STYLE_ID = "gameNavigationPatchStyles";
  const NAV_ID = "gameNavigationBar";
  let originalSwitch = null;
  let initialized = false;

  function addStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      body.game-screen-mode { overflow-x:hidden; }
      body.game-screen-mode .console-sidebar,
      body.game-screen-mode #consoleBottomDock,
      body.game-screen-mode .console-bottom-grid { display:none !important; }
      body.game-screen-mode .console-workspace-frame { display:block !important; }
      body.game-screen-mode .console-content-stage { width:100% !important; max-width:none !important; padding:0 0 92px !important; }
      body.game-screen-mode .app-view-container { min-height:calc(100vh - 84px); padding:18px 18px 110px !important; }
      body.game-screen-mode .app-view-container.active { animation: gameScreenIn .24s ease-out; }
      @keyframes gameScreenIn { from {opacity:0; transform:translateY(8px) scale(.995)} to {opacity:1; transform:none} }
      .game-screen-nav {
        position:fixed; left:50%; bottom:14px; transform:translateX(-50%); z-index:12000;
        width:min(96vw,900px); display:flex; gap:7px; padding:8px;
        background:linear-gradient(145deg,rgba(8,18,32,.98),rgba(16,31,52,.96));
        border:1px solid rgba(56,189,248,.32); border-radius:18px;
        box-shadow:0 16px 45px rgba(0,0,0,.65), inset 0 1px 0 rgba(255,255,255,.08);
        backdrop-filter:blur(18px); overflow-x:auto; scrollbar-width:none;
      }
      .game-screen-nav::-webkit-scrollbar { display:none; }
      .game-nav-btn {
        position:relative; flex:1 0 auto; min-width:82px; border:1px solid #23456b; border-radius:12px;
        padding:10px 12px; background:linear-gradient(145deg,#122840,#091728); color:#aebfd0;
        font-size:10px; font-weight:900; letter-spacing:.65px; text-transform:uppercase;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.05),0 4px 10px rgba(0,0,0,.25);
        transform:skewX(-4deg); transition:.18s ease; cursor:pointer;
      }
      .game-nav-btn span { display:block; transform:skewX(4deg); }
      .game-nav-btn:hover { color:#fff; border-color:#38bdf8; transform:skewX(-4deg) translateY(-2px); }
      .game-nav-btn.active { color:#fff; border-color:#facc15; background:linear-gradient(145deg,#165b83,#17345a); box-shadow:0 0 18px rgba(56,189,248,.25),inset 0 1px 0 rgba(255,255,255,.12); }
      .game-nav-btn.active::after { content:""; position:absolute; left:18%; right:18%; bottom:4px; height:2px; background:#facc15; box-shadow:0 0 8px #facc15; }
      .game-screen-head {
        display:flex; align-items:center; justify-content:space-between; gap:12px; margin:0 auto 14px;
        max-width:1200px; padding:12px 16px; border-radius:16px;
        background:linear-gradient(145deg,rgba(15,37,61,.96),rgba(5,15,27,.96));
        border:1px solid rgba(56,189,248,.24); box-shadow:0 10px 28px rgba(0,0,0,.38);
        transform:perspective(800px) rotateX(.5deg);
      }
      .game-screen-head .eyebrow { color:#38bdf8; font-size:10px; font-weight:900; letter-spacing:1.4px; }
      .game-screen-head h2 { margin:2px 0 0; font-size:22px; color:#fff; }
      .game-screen-head .hint { color:#94a3b8; font-size:11px; }
      .game-back-btn { background:#0b1d31; border:1px solid #2a4c73; color:#cbd5e1; border-radius:9px; padding:8px 12px; font-size:11px; font-weight:900; cursor:pointer; }
      .game-back-btn:hover { border-color:#38bdf8; color:#fff; }
      #gameSquadScreen .squad-screen-grid { display:grid; grid-template-columns:1.15fr .85fr; gap:16px; max-width:1200px; margin:auto; }
      #gameSquadScreen .squad-pitch-card, #gameSquadScreen .squad-list-card { background:linear-gradient(145deg,#0d2138,#071321); border:1px solid #24486d; border-radius:18px; padding:16px; box-shadow:0 12px 30px rgba(0,0,0,.4); }
      #gameSquadScreen .squad-pitch { position:relative; min-height:470px; border-radius:14px; overflow:hidden; background:linear-gradient(90deg,#176338 0 50%,#155c34 50% 100%); border:2px solid rgba(255,255,255,.35); }
      #gameSquadScreen .squad-pitch::before { content:""; position:absolute; inset:7%; border:2px solid rgba(255,255,255,.65); border-radius:3px; }
      #gameSquadScreen .squad-pitch::after { content:""; position:absolute; left:50%; top:7%; bottom:7%; width:2px; background:rgba(255,255,255,.55); box-shadow:0 0 0 1px rgba(255,255,255,.08); }
      #gameSquadScreen .pitch-node { position:absolute; transform:translate(-50%,-50%); text-align:center; min-width:58px; z-index:2; }
      #gameSquadScreen .pitch-node .node-ball { width:42px; height:42px; margin:auto; border-radius:50%; display:grid; place-items:center; background:linear-gradient(145deg,#facc15,#b45309); border:2px solid #fff; color:#06111e; font-size:11px; font-weight:1000; box-shadow:0 5px 15px rgba(0,0,0,.45); }
      #gameSquadScreen .pitch-node .node-name { margin-top:4px; display:block; background:rgba(3,10,18,.86); border:1px solid rgba(255,255,255,.18); color:#fff; border-radius:5px; padding:3px 5px; font-size:9px; font-weight:800; white-space:nowrap; max-width:82px; overflow:hidden; text-overflow:ellipsis; }
      #gameSquadScreen .squad-list { display:flex; flex-direction:column; gap:8px; max-height:470px; overflow:auto; }
      #gameSquadScreen .squad-row { display:grid; grid-template-columns:42px 1fr auto; align-items:center; gap:9px; padding:10px; border-radius:10px; background:#081728; border:1px solid #1d3b5b; }
      #gameSquadScreen .squad-ovr { color:#facc15; font-weight:1000; font-size:14px; text-align:center; }
      #gameSquadScreen .squad-name { color:#fff; font-weight:800; font-size:12px; }
      #gameSquadScreen .squad-meta { color:#94a3b8; font-size:10px; margin-top:2px; }
      #gameSquadScreen .squad-price { color:#38bdf8; font-weight:900; font-size:11px; }
      #gameTransfersScreen, #gameContractsScreen { max-width:1200px; margin:auto; }
      #gameTransfersScreen .screen-section, #gameContractsScreen .screen-section { background:linear-gradient(145deg,#0d2138,#071321); border:1px solid #24486d; border-radius:18px; padding:16px; margin-bottom:14px; box-shadow:0 12px 30px rgba(0,0,0,.35); }
      @media(max-width:800px){ #gameSquadScreen .squad-screen-grid{grid-template-columns:1fr;} #gameSquadScreen .squad-pitch{min-height:390px;} .game-screen-head h2{font-size:18px;} .game-nav-btn{min-width:72px;padding:9px 8px;} }
    `;
    document.head.appendChild(style);
  }

  function createScreen(id, title, subtitle) {
    let screen = document.getElementById(id);
    if (screen) return screen;
    screen = document.createElement("div");
    screen.id = id;
    screen.className = "app-view-container";
    screen.innerHTML = `<div class="game-screen-head"><div><div class="eyebrow">ATHUL FC • CLUB CONSOLE</div><h2>${title}</h2><div class="hint">${subtitle}</div></div><button class="game-back-btn" type="button" data-back="home">HOME</button></div><div class="game-screen-body"></div>`;
    const stage = document.getElementById("consoleMainStage") || document.querySelector("main");
    if (stage) stage.appendChild(screen);
    screen.querySelector(".game-back-btn").addEventListener("click", () => switchScreen("home"));
    return screen;
  }

  function move(id, parent) {
    const el = document.getElementById(id);
    if (el && parent && el.parentElement !== parent) parent.appendChild(el);
    return el;
  }

  function setupScreens() {
    const squad = createScreen("gameSquadScreen", "Squad", "Set the XI, inspect your signed players and keep the squad balanced.");
    const transfers = createScreen("gameTransfersScreen", "Transfers", "Buy, sell, negotiate offers and activate release clauses.");
    const contracts = createScreen("gameContractsScreen", "Contracts", "Manage contract lengths, salaries and release clauses.");

    const squadBody = squad.querySelector(".game-screen-body");
    if (!squadBody.querySelector(".squad-screen-grid")) {
      squadBody.innerHTML = `<div class="squad-screen-grid"><div class="squad-pitch-card"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px"><strong style="color:#facc15">FIRST XI • 4-3-3</strong><span id="gameSquadCount" style="color:#94a3b8;font-size:11px">0 players</span></div><div class="squad-pitch" id="gameSquadPitch"></div></div><div class="squad-list-card"><div style="color:#facc15;font-weight:900;margin-bottom:10px">REGISTERED PLAYERS</div><div class="squad-list" id="gameSquadList"></div></div></div>`;
    }

    // Preserve the original working controls by moving, not cloning, them.
    const transferBody = transfers.querySelector(".game-screen-body");
    if (!transferBody.querySelector("#transferSection")) {
      const clubSection = document.querySelector("#view_auction_ops > .section:not(#contractsSection):not(#transferSection):not(#offersSection):not(#hostSection)");
      if (clubSection) transferBody.appendChild(clubSection);
      const transferSection = move("transferSection", transferBody);
      const offersSection = move("offersSection", transferBody);
      if (transferSection) transferSection.classList.remove("hidden");
      if (offersSection) offersSection.classList.remove("hidden");
    }

    const contractBody = contracts.querySelector(".game-screen-body");
    if (!contractBody.querySelector("#contractsSection")) {
      const contractSection = move("contractsSection", contractBody);
      if (contractSection) contractSection.classList.remove("hidden");
    }

    const hostSection = move("hostSection", squadBody);
    if (hostSection) hostSection.style.display = "none";
    const teamsSection = document.querySelector("#view_auction_ops > .teams");
    if (teamsSection && !squadBody.contains(teamsSection)) squadBody.appendChild(teamsSection);
  }

  function renderSquad() {
    const list = document.getElementById("gameSquadList");
    const pitch = document.getElementById("gameSquadPitch");
    const count = document.getElementById("gameSquadCount");
    if (!list || !pitch) return;
    const teamName = window.getActiveUserTeam ? window.getActiveUserTeam() : window.myTeam;
    const team = window.gameState?.teams?.[teamName];
    const players = Array.isArray(team?.players) ? team.players : [];
    if (count) count.textContent = `${players.length}/18 players`;
    if (!players.length) {
      list.innerHTML = `<div style="padding:24px;text-align:center;color:#94a3b8">No players signed yet. Open Auction to build the squad.</div>`;
      pitch.innerHTML = `<div style="position:absolute;inset:0;display:grid;place-items:center;color:rgba(255,255,255,.7);font-weight:900;letter-spacing:1px">SQUAD EMPTY</div>`;
      return;
    }
    const groups = {
      GK: players.filter(p => p.position === "GK"),
      DEF: players.filter(p => ["CB","LB","RB"].includes(p.position)),
      MID: players.filter(p => ["CMF","DMF","AMF","LMF","RMF","CM"].includes(p.position)),
      ATT: players.filter(p => ["CF","ST","LW","RW","LWF","RWF","SS"].includes(p.position))
    };
    const chosen = [...groups.GK.slice(0,1), ...groups.DEF.slice(0,4), ...groups.MID.slice(0,3), ...groups.ATT.slice(0,3)];
    const positions = [[50,90],[16,72],[38,78],[62,78],[84,72],[27,50],[50,46],[73,50],[18,22],[50,16],[82,22]];
    pitch.innerHTML = chosen.slice(0,11).map((p,i) => `<div class="pitch-node" style="left:${positions[i][0]}%;top:${positions[i][1]}%"><div class="node-ball">${p.rating || 80}</div><span class="node-name">${escapeHtml(p.name)}</span></div>`).join("");
    list.innerHTML = players.map(p => `<div class="squad-row"><div class="squad-ovr">${p.rating || 80}</div><div><div class="squad-name">${escapeHtml(p.name)}</div><div class="squad-meta">${escapeHtml(p.position || "CF")} • ${escapeHtml(p.club || "Club")}</div></div><div class="squad-price">₹${p.price ?? "-"}M</div></div>`).join("");
  }

  function escapeHtml(value) {
    return String(value ?? "").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");
  }

  function buildNav() {
    if (document.getElementById(NAV_ID)) return;
    const nav = document.createElement("nav");
    nav.id = NAV_ID;
    nav.className = "game-screen-nav";
    const items = [
      ["home","Home"],["squad","Squad"],["auction","Auction"],["transfers","Transfers"],["league","League"],["cup","Cup"],["hq","Club"],["injuries","Injuries"],["contracts","Contracts"]
    ];
    nav.innerHTML = items.map(([id,label]) => `<button type="button" class="game-nav-btn" data-screen="${id}"><span>${label}</span></button>`).join("");
    document.body.appendChild(nav);
    nav.addEventListener("click", e => {
      const btn = e.target.closest("button[data-screen]");
      if (btn) switchScreen(btn.dataset.screen);
    });
  }

  function hideLegacyGlobals() {
    ["error","mainJoinBox"].forEach(id => { const el=document.getElementById(id); if(el) el.style.display="none"; });
    document.querySelectorAll("body > .status, body > .auction").forEach(el => el.style.display="none");
  }

  function showJoinIfNeeded() {
    const joined = !!(window.myTeam || window.userClubName || document.querySelector("#myTeamBadge")?.innerText && document.querySelector("#myTeamBadge")?.innerText !== "Not Joined");
    const join = document.getElementById("mainJoinBox");
    if (!joined && join) join.style.display = "block";
  }

  function setActiveNav(view) {
    document.querySelectorAll(`#${NAV_ID} .game-nav-btn`).forEach(btn => btn.classList.toggle("active", btn.dataset.screen === view));
  }

  function switchScreen(view) {
    if (!initialized || !originalSwitch) return;
    if (view === "squad" || view === "transfers" || view === "contracts") setupScreens();
    originalSwitch(view === "club" ? "hq" : view);
    document.querySelectorAll(".app-view-container").forEach(el => el.classList.remove("active"));
    const target = view === "squad" ? document.getElementById("gameSquadScreen") : view === "transfers" ? document.getElementById("gameTransfersScreen") : view === "contracts" ? document.getElementById("gameContractsScreen") : document.getElementById("view_" + (view === "club" ? "hq" : view));
    if (target) target.classList.add("active");

    hideLegacyGlobals();
    const auctionLegacy = document.querySelector("body > .auction");
    const auctionMain = document.getElementById("view_auction_main");
    if (view === "auction") {
      if (auctionMain) auctionMain.classList.add("active");
      if (auctionLegacy) auctionLegacy.style.display = "block";
    }
    if (view === "home") showJoinIfNeeded();
    if (view === "squad") renderSquad();
    if (view === "transfers") {
      const transfer = document.getElementById("transferSection");
      const offers = document.getElementById("offersSection");
      if (transfer) transfer.classList.remove("hidden");
      if (offers) offers.classList.remove("hidden");
      if (typeof updateSellerTeams === "function") updateSellerTeams();
    }
    if (view === "contracts" && typeof loadContracts === "function") loadContracts();
    if (view === "finances" && typeof switchHqTab === "function") switchHqTab("finances");
    if (view === "club" && typeof switchHqTab === "function") switchHqTab("stadium");
    if (view === "injuries" && window.InjuryCenter) { InjuryCenter.renderMedicalCentre(); InjuryCenter.updateAppHeaderInjuryBadge(); }
    setActiveNav(view);
    window.scrollTo({top:0,behavior:"smooth"});
  }

  function install() {
    if (initialized) return;
    if (typeof window.switchAppView !== "function") return;
    originalSwitch = window.switchAppView;
    initialized = true;
    addStyles();
    document.body.classList.add("game-screen-mode");
    setupScreens();
    buildNav();
    // Start on the true home screen, not the old multi-panel dashboard navigation.
    switchScreen("home");

    const oldGameState = window.gameState;
    Object.defineProperty(window, "gameState", {
      configurable:true,
      get(){ return oldGameState; },
      set(v){ window.__gameStatePatch = v; renderSquad(); }
    });
    // The original script assigns gameState internally; polling keeps the new squad screen live without changing game logic.
    setInterval(renderSquad, 1200);
  }

  window.addEventListener("DOMContentLoaded", () => setTimeout(install, 0));
  // firebase_cloud.js is loaded before the inline app script, so DOMContentLoaded is the reliable hook.
})();
