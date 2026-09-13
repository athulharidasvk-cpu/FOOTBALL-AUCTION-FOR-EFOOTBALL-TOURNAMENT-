// Runtime compatibility layer for the navigation patch.
(function(){
  "use strict";
  function state(){ try { return window.eval("gameState"); } catch(e){ return null; } }
  function team(){ try { return window.eval("myTeam"); } catch(e){ return window.myTeam || window.userClubName || null; } }
  function esc(v){ return String(v ?? "").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;"); }
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
    hideEverything();
    let target=view==='squad'?document.getElementById('gameSquadScreen'):view==='transfers'?document.getElementById('gameTransfersScreen'):view==='contracts'?document.getElementById('gameContractsScreen'):document.getElementById('view_'+(view==='club'||view==='finances'?'hq':view==='cup'?'awards':view));
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
    if(view==='injuries'&&window.InjuryCenter){window.InjuryCenter.renderMedicalCentre();window.InjuryCenter.updateAppHeaderInjuryBadge();}
    document.querySelectorAll('#gameNavigationBar .game-nav-btn').forEach(b=>b.classList.toggle('active',b.dataset.screen===view));
    window.scrollTo({top:0,behavior:'smooth'});
  }
  window.addEventListener('DOMContentLoaded',()=>{
    setTimeout(()=>{
      document.querySelectorAll('#gameNavigationBar .game-nav-btn').forEach(b=>b.addEventListener('click',()=>setTimeout(()=>show(b.dataset.screen),0),true));
      document.querySelectorAll('.game-back-btn').forEach(b=>b.addEventListener('click',()=>setTimeout(()=>show('home'),0),true));
      setTimeout(()=>show('home'),80);
      setInterval(renderSquad,1200);
    },250);
  });
})();
