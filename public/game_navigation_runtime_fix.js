// Runtime compatibility layer for the navigation patch.
(function(){
  "use strict";
  function state(){ try { return window.eval("gameState"); } catch(e){ return null; } }
  function team(){ try { return window.eval("myTeam"); } catch(e){ return window.myTeam || window.userClubName || null; } }
  function esc(v){ return String(v ?? "").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;"); }

  function ensureExtraScreens(){
    const stage=document.getElementById("consoleMainStage")||document.querySelector("main")||document.body;

    // --------------------------------------------------
    // JERSEY / KIT SCREEN
    // --------------------------------------------------
    let jersey=document.getElementById("gameJerseyScreen");
    if(!jersey){
      jersey=document.createElement("div");
      jersey.id="gameJerseyScreen";
      jersey.className="app-view-container";
      jersey.innerHTML=`
        <div class="game-screen-head">
          <div><div class="eyebrow">ATHUL FC • CLUB IDENTITY</div><h2>Jersey Studio</h2><div class="hint">Design your official home kit, squad number and club colours.</div></div>
          <button class="game-back-btn" type="button" data-back="home">HOME</button>
        </div>
        <div id="jerseyRuntimeShell" style="max-width:1200px;margin:auto;display:grid;grid-template-columns:minmax(0,1fr) 330px;gap:16px;align-items:start;">
          <div class="screen-section" style="background:linear-gradient(145deg,#0d2138,#071321);border:1px solid #24486d;border-radius:18px;padding:16px;box-shadow:0 12px 30px rgba(0,0,0,.35);">
            <div id="jerseyPreviewStage" style="min-height:420px;"></div>
          </div>
          <div class="screen-section" style="background:linear-gradient(145deg,#0d2138,#071321);border:1px solid #24486d;border-radius:18px;padding:16px;box-shadow:0 12px 30px rgba(0,0,0,.35);">
            <div style="color:#facc15;font-weight:900;letter-spacing:.8px;margin-bottom:12px;">KIT CUSTOMIZATION</div>
            <div style="display:grid;gap:9px;">
              <label style="font-size:11px;color:#94a3b8;font-weight:800;">PRIMARY <input id="kitPrimaryColor" type="color" value="#ffffff" style="width:100%;height:38px;background:#081728;border:1px solid #294866;border-radius:8px;"></label>
              <label style="font-size:11px;color:#94a3b8;font-weight:800;">SECONDARY <input id="kitSecondaryColor" type="color" value="#1e3a8a" style="width:100%;height:38px;background:#081728;border:1px solid #294866;border-radius:8px;"></label>
              <label style="font-size:11px;color:#94a3b8;font-weight:800;">ACCENT <input id="kitAccentColor" type="color" value="#eab308" style="width:100%;height:38px;background:#081728;border:1px solid #294866;border-radius:8px;"></label>
              <label style="font-size:11px;color:#94a3b8;font-weight:800;">NUMBER / TEXT <input id="kitTextColor" type="color" value="#0f172a" style="width:100%;height:38px;background:#081728;border:1px solid #294866;border-radius:8px;"></label>
              <select id="kitPatternSelect" style="padding:10px;background:#081728;color:#fff;border:1px solid #294866;border-radius:8px;"><option value="solid">Solid</option><option value="stripes">Stripes</option><option value="hoops">Hoops</option><option value="checker">Checker</option><option value="half">Half & Half</option><option value="sash">Sash</option><option value="wave">Wave</option></select>
              <select id="kitCollarSelect" style="padding:10px;background:#081728;color:#fff;border:1px solid #294866;border-radius:8px;"><option value="crew">Crew Neck</option><option value="vneck">V Neck</option><option value="polo">Polo</option></select>
              <input id="kitSponsorInput" placeholder="Sponsor text" maxlength="22" style="padding:10px;background:#081728;color:#fff;border:1px solid #294866;border-radius:8px;">
              <input id="kitNumberInput" type="number" min="1" max="99" placeholder="Squad number" style="padding:10px;background:#081728;color:#fff;border:1px solid #294866;border-radius:8px;">
              <input id="kitPlayerNameInput" placeholder="Player name" maxlength="16" style="padding:10px;background:#081728;color:#fff;border:1px solid #294866;border-radius:8px;">
              <div id="jerseyScoreValue" style="color:#fff;font-weight:900;font-size:18px;">8.5 / 10</div>
              <div id="jerseyTierBadge" style="padding:7px 10px;border-radius:8px;background:#12304b;color:#facc15;font-weight:900;">Iconic A-Tier</div>
              <div id="jerseyMultTag" style="color:#38bdf8;font-weight:900;">1.35x Merchandise Sales</div>
              <div id="jerseyEstRevenue" style="color:#94a3b8;font-size:11px;">Merchandise revenue bonus</div>
              <button id="btnSaveJerseyKit" type="button" style="padding:12px;border-radius:10px;background:linear-gradient(145deg,#0e7490,#155e75);color:#fff;font-weight:900;border:1px solid #38bdf8;">SAVE OFFICIAL KIT</button>
            </div>
          </div>
        </div>`;
      stage.appendChild(jersey);
      jersey.querySelector(".game-back-btn").addEventListener("click",()=>show("home"));

      const fields={
        kitPrimaryColor:"primary",kitSecondaryColor:"secondary",kitAccentColor:"accent",kitTextColor:"text",
        kitPatternSelect:"pattern",kitCollarSelect:"collar",kitSponsorInput:"sponsor",kitNumberInput:"number",kitPlayerNameInput:"player"
      };
      Object.entries(fields).forEach(([id,key])=>{
        const el=document.getElementById(id);
        if(el) el.addEventListener("input",()=>{
          if(window.JerseyStudio) window.JerseyStudio.setField(key,key==="number"?Number(el.value)||7:el.value);
        });
      });
      const save=document.getElementById("btnSaveJerseyKit");
      if(save) save.addEventListener("click",()=>window.JerseyStudio&&window.JerseyStudio.saveCurrentJersey());
    }

    // --------------------------------------------------
    // INJURY / MEDICAL CENTRE SCREEN
    // --------------------------------------------------
    let injuries=document.getElementById("gameInjuriesScreen");
    if(!injuries){
      injuries=document.createElement("div");
      injuries.id="gameInjuriesScreen";
      injuries.className="app-view-container";
      injuries.innerHTML=`
        <div class="game-screen-head">
          <div><div class="eyebrow">ATHUL FC • MEDICAL DEPARTMENT</div><h2>Injury Centre</h2><div class="hint">Track injuries, recovery time and matchday availability.</div></div>
          <button class="game-back-btn" type="button" data-back="home">HOME</button>
        </div>
        <div id="injuryListContainer"></div>`;
      stage.appendChild(injuries);
      injuries.querySelector(".game-back-btn").addEventListener("click",()=>show("home"));
    }

    // Make sure the navigation always contains both options.
    const nav=document.getElementById("gameNavigationBar");
    if(nav){
      if(!nav.querySelector('[data-screen="kit"]')){
        const b=document.createElement("button");
        b.type="button"; b.className="game-nav-btn"; b.dataset.screen="kit"; b.innerHTML="<span>Kit</span>";
        nav.appendChild(b);
      }
      if(!nav.querySelector('[data-screen="injuries"]')){
        const b=document.createElement("button");
        b.type="button"; b.className="game-nav-btn"; b.dataset.screen="injuries"; b.innerHTML="<span>Injuries</span>";
        nav.appendChild(b);
      }
    }
  }

  function hideEverything(){
    document.querySelectorAll(".app-view-container").forEach(e=>e.classList.remove("active"));
    ["mainJoinBox","error"].forEach(id=>{const e=document.getElementById(id);if(e)e.style.display="none";});
    document.querySelectorAll(".status,.auction").forEach(e=>e.style.display="none");
  }

  function renderSquad(){
    const list=document.getElementById("gameSquadList"), pitch=document.getElementById("gameSquadPitch"), count=document.getElementById("gameSquadCount");
    if(!list||!pitch)return;
    const gs=state(), name=team(), players=gs?.teams?.[name]?.players||[];
    if(count)count.textContent=`${players.length}/18 players`;
    if(!players.length){list.innerHTML='<div style="padding:24px;text-align:center;color:#94a3b8">No players signed yet. Open Auction to build the squad.</div>';pitch.innerHTML='<div style="position:absolute;inset:0;display:grid;place-items:center;color:rgba(255,255,255,.7);font-weight:900;letter-spacing:1px">SQUAD EMPTY</div>';return;}
    const g={GK:players.filter(p=>p.position==='GK'),DEF:players.filter(p=>['CB','LB','RB'].includes(p.position)),MID:players.filter(p=>['CMF','DMF','AMF','LMF','RMF','CM'].includes(p.position)),ATT:players.filter(p=>['CF','ST','LW','RW','LWF','RWF','SS'].includes(p.position))};
    const chosen=[...g.GK.slice(0,1),...g.DEF.slice(0,4),...g.MID.slice(0,3),...g.ATT.slice(0,3)], pos=[[50,90],[16,72],[38,78],[62,78],[84,72],[27,50],[50,46],[73,50],[18,22],[50,16],[82,22]];
    pitch.innerHTML=chosen.slice(0,11).map((p,i)=>`<div class="pitch-node" style="left:${pos[i][0]}%;top:${pos[i][1]}%"><div class="node-ball">${p.rating||80}</div><span class="node-name">${esc(p.name)}</span></div>`).join('');
    list.innerHTML=players.map(p=>`<div class="squad-row"><div class="squad-ovr">${p.rating||80}</div><div><div class="squad-name">${esc(p.name)}</div><div class="squad-meta">${esc(p.position||'CF')} • ${esc(p.club||'Club')}</div></div><div class="squad-price">₹${p.price??'-'}M</div></div>`).join('');
  }

  function show(view){
    ensureExtraScreens();
    hideEverything();
    let target=view==='squad'?document.getElementById('gameSquadScreen'):view==='transfers'?document.getElementById('gameTransfersScreen'):view==='contracts'?document.getElementById('gameContractsScreen'):view==='kit'?document.getElementById('gameJerseyScreen'):view==='injuries'?document.getElementById('gameInjuriesScreen'):document.getElementById('view_'+(view==='club'||view==='finances'?'hq':view==='cup'?'awards':view));
    if(target)target.classList.add('active');
    if(view==='auction'){const a=document.getElementById('view_auction_main');if(a)a.classList.add('active');document.querySelectorAll('.auction').forEach(e=>e.style.display='block');}
    if(view==='home'){
      const joined=!!team() && team()!=='Not Joined';
      if(!joined){const j=document.getElementById('mainJoinBox');if(j)j.style.display='block';}
    }
    if(view==='squad')renderSquad();
    if(view==='transfers'){const t=document.getElementById('transferSection'),o=document.getElementById('offersSection');if(t)t.classList.remove('hidden');if(o)o.classList.remove('hidden');if(typeof window.updateSellerTeams==='function')window.updateSellerTeams();}
    if(view==='contracts'&&typeof window.loadContracts==='function')window.loadContracts();
    if(view==='finances'&&typeof window.switchHqTab==='function')window.switchHqTab('finances');
    if(view==='club'&&typeof window.switchHqTab==='function')window.switchHqTab('stadium');
    if(view==='kit'&&window.JerseyStudio){
      const club=team();
      window.JerseyStudio.init(club||"ATHUL FC");
      if(typeof window.JerseyStudio.renderJerseyStudio==='function')window.JerseyStudio.renderJerseyStudio("jerseyPreviewStage");
      if(typeof window.socket!=='undefined'&&window.socket)window.socket.emit("getJerseyDesign",{teamName:club});
    }
    if(view==='injuries'&&window.InjuryCenter){window.InjuryCenter.renderMedicalCentre("injuryListContainer");window.InjuryCenter.updateAppHeaderInjuryBadge();}
    document.querySelectorAll('#gameNavigationBar .game-nav-btn').forEach(b=>b.classList.toggle('active',b.dataset.screen===view));
    window.scrollTo({top:0,behavior:'smooth'});
  }

  window.addEventListener('DOMContentLoaded',()=>{
    setTimeout(()=>{
      ensureExtraScreens();
      // Replace the old global switcher so existing header/card buttons also use real screens.
      window.switchAppView=show;
      document.querySelectorAll('#gameNavigationBar .game-nav-btn').forEach(b=>{
        b.addEventListener('click',()=>setTimeout(()=>show(b.dataset.screen),0),true);
      });
      document.querySelectorAll('.game-back-btn').forEach(b=>b.addEventListener('click',()=>setTimeout(()=>show('home'),0),true));
      setTimeout(()=>show('home'),80);
      setInterval(renderSquad,1200);
    },250);
  });
})();
