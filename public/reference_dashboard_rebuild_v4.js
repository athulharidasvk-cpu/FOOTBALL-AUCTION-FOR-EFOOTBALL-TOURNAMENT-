(() => {
  'use strict';
  const css = document.createElement('link');
  css.rel = 'stylesheet'; css.href = '/reference_dashboard_rebuild_v4.css';
  document.head.appendChild(css);

  const faces = ['/player_face_1.svg','/player_face_2.svg','/player_face_3.svg','/player_face_4.svg','/player_face_5.svg','/player_face_6.svg'];
  const crest = '/stadium_pitch.jpg';
  const manager = '/manager_portrait.jpg';
  const faceFor = name => { let n=0; for(const c of String(name||'player')) n=(n+c.charCodeAt(0))%faces.length; return faces[n]; };
  const q = s => document.querySelector(s);
  const txt = s => q(s)?.textContent?.trim() || '';
  const clickOriginal = (selector) => { const el=q(selector); if(el) el.click(); };

  function originalNav(label){
    const els=[...document.querySelectorAll('.console-nav-tab, .game-screen-nav button, [data-view]')];
    return els.find(e => (e.textContent||'').trim().toLowerCase().includes(label.toLowerCase()));
  }
  function nav(label){
    const e=originalNav(label); if(e) e.click();
  }

  function playerData(){
    const source=[...document.querySelectorAll('.auction-player-hero-row, .fut-card-pod, .pitch-player-node, .transfer-player-row')];
    const names=source.map(e=>e.querySelector('.fut-card-name,.pitch-player-name,.player-name,[data-player-name]')?.textContent?.trim()).filter(Boolean);
    return names.length?names:['V. MOREAU','A. RIVERA','K. OKAFOR','D. MARTINS','R. SATO'];
  }

  function build(){
    const view=q('#view_home'); if(!view || view.dataset.refV4Built) return;
    view.dataset.refV4Built='1'; view.classList.add('ref-v4-home');
    const shell=document.createElement('div'); shell.className='ref-v4-shell';
    shell.innerHTML=`
      <header class="ref-v4-top">
        <div class="ref-v4-brand"><div class="ref-v4-crest"><img src="${crest}"></div><div><div class="ref-v4-club">YOUR FOOTBALL CLUB</div><div class="ref-v4-meta">Division 1 · Rank 01</div></div></div>
        <div class="ref-v4-stats">
          <div class="ref-v4-stat"><small>Budget</small><strong id="v4Budget">₹500M</strong></div>
          <div class="ref-v4-stat"><small>Squad</small><strong id="v4Squad">0 / 18</strong></div>
          <div class="ref-v4-stat"><small>Season</small><strong>2026 / 27</strong></div>
          <div class="ref-v4-stat"><small>Form</small><strong>W · W · D · W</strong></div>
        </div>
        <div class="ref-v4-user"><div class="ref-v4-user-name">MANAGER<br><span style="color:#607994">HEAD COACH</span></div><div class="ref-v4-manager"><img src="${manager}"></div><button class="ref-v4-settings" data-nav="settings">⚙</button></div>
      </header>
      <div class="ref-v4-main">
        <aside class="ref-v4-rail"><div class="ref-v4-rail-title">Club menu</div>
          ${['Home','Journey','Squad','Transfers','League','Cup','Finances','Contracts'].map((x,i)=>`<button class="ref-v4-nav ${i===0?'active':''}" data-nav="${x}"><span class="ico">${['▦','◇','□','↗','≡','♜','◈','▤'][i]}</span>${x}</button>`).join('')}
        </aside>
        <main class="ref-v4-content">
          <div class="ref-v4-title-row"><div><div class="ref-v4-title">HOME</div><div class="ref-v4-sub">Club overview · Matchday centre</div></div><div class="ref-v4-date">SEASON 2026 / 27</div></div>
          <section class="ref-v4-grid">
            <article class="ref-v4-card ref-v4-match"><div class="ref-v4-card-head"><h3>Next Match</h3><span>LEAGUE · MD 08</span></div><div class="ref-v4-match-body"><div class="ref-v4-comp">Home fixture</div><div class="ref-v4-teams"><div class="ref-v4-team"><img src="${crest}"><b>YOUR CLUB</b></div><div class="ref-v4-vs">VS</div><div class="ref-v4-team"><img src="${crest}"><b>RIVALS FC</b></div></div><div class="ref-v4-kick">SAT · 20:00 · HOME STADIUM</div><button class="ref-v4-match-btn" data-nav="league">MATCH CENTRE</button></div></article>
            <article class="ref-v4-card ref-v4-auction"><div class="ref-v4-card-head"><h3>Live Auction</h3><span>PLAYER MARKET</span></div><div class="ref-v4-auction-body"><div class="ref-v4-auction-left"><div class="ref-v4-auction-strip"><span class="ref-v4-live">● LIVE BIDDING</span><span class="ref-v4-timer" id="v4Timer">00:20</span></div><div class="ref-v4-player"><div class="ref-v4-face"><img id="v4AuctionFace" src="${faces[0]}"></div><div><div class="ref-v4-player-name" id="v4PlayerName">V. MOREAU</div><div class="ref-v4-player-pos">Forward · Original player</div><div class="ref-v4-attrs"><div class="ref-v4-attr">PAC <b>92</b></div><div class="ref-v4-attr">SHO <b>89</b></div><div class="ref-v4-attr">PAS <b>84</b></div><div class="ref-v4-attr">DRI <b>91</b></div></div></div></div><div class="ref-v4-auction-actions"><button class="ref-v4-bid" id="v4Bid">PLACE BID</button><button class="ref-v4-skip" id="v4Skip">SKIP</button></div></div><div class="ref-v4-bidbox"><small>Current bid</small><strong id="v4BidValue">₹5M</strong><span id="v4Bidder">Waiting for bids</span><div class="mini-list"><div><span>Min. raise</span><b>₹5M</b></div><div><span>Players sold</span><b id="v4Sold">0</b></div></div></div></div></article>
            <div class="ref-v4-side"><article class="ref-v4-card ref-v4-table"><div class="ref-v4-card-head"><h3>League Table</h3><span>TOP 5</span></div><div class="ref-v4-card-body" id="v4Table"></div></article><article class="ref-v4-card ref-v4-fixtures"><div class="ref-v4-card-head"><h3>Fixtures</h3><span>NEXT</span></div><div class="ref-v4-card-body" id="v4Fixtures"></div></article></div>
            <article class="ref-v4-card ref-v4-squad"><div class="ref-v4-card-head"><h3>Squad</h3><span>STARTING XI</span></div><div class="ref-v4-card-body"><div class="ref-v4-pitch" id="v4Pitch"></div></div></article>
            <article class="ref-v4-card ref-v4-market"><div class="ref-v4-card-head"><h3>Transfer Market</h3><span>SCOUTING</span></div><div class="ref-v4-card-body ref-v4-market-body" id="v4Market"></div></article>
            <div class="ref-v4-bottom-right"><article class="ref-v4-card"><div class="ref-v4-card-head"><h3>Finances</h3><span>CLUB ACCOUNT</span></div><div class="ref-v4-card-body ref-v4-money"><div class="ref-v4-money-box"><small>Transfer budget</small><b id="v4FinanceBudget">₹500M</b></div><div class="ref-v4-money-box"><small>Weekly income</small><b>₹12.4M</b></div><div class="ref-v4-money-box"><small>Weekly wages</small><b>₹4.8M</b></div><div class="ref-v4-money-box"><small>Balance</small><b>₹507.6M</b></div></div></article><article class="ref-v4-card"><div class="ref-v4-card-head"><h3>Manager</h3><span>CLUB PHILOSOPHY</span></div><div class="ref-v4-card-body ref-v4-manager-box"><img src="${manager}"><div><b>Build the strongest squad</b><p>Spend wisely, develop your team and compete for every trophy.</p></div></div></article></div>
          </section>
        </main>
      </div>
      <nav class="ref-v4-dock">${['Home','Squad','Transfers','League','Cup','Settings'].map((x,i)=>`<button class="ref-v4-dock-btn ${i===0?'active':''}" data-nav="${x}"><span class="big">${['▦','□','↗','≡','♜','⚙'][i]}</span>${x}</button>`).join('')}</nav>`;
    view.appendChild(shell);
    shell.querySelectorAll('[data-nav]').forEach(b=>b.addEventListener('click',()=>nav(b.dataset.nav)));
    q('#v4Bid').addEventListener('click',()=>{ clickOriginal('.btn-auction-bid'); clickOriginal('#placeBidBtn'); });
    q('#v4Skip').addEventListener('click',()=>{ clickOriginal('.btn-auction-skip'); clickOriginal('#skipAuctionBtn'); });
    renderStatic();
    sync();
  }

  function renderStatic(){
    const teams=['YOUR CLUB','CITY ATHLETIC','UNITED FC','ROYAL SC','NORTH FC'];
    q('#v4Table').innerHTML='<div class="ref-v4-table-row head"><span>#</span><span>CLUB</span><span>PTS</span><span>GD</span></div>'+teams.map((t,i)=>`<div class="ref-v4-table-row"><span>${i+1}</span><b>${t}</b><span>${21-i*2}</span><span>+${12-i*2}</span></div>`).join('');
    q('#v4Fixtures').innerHTML=['YOUR CLUB  —  CITY ATHLETIC','UNITED FC  —  ROYAL SC','NORTH FC  —  YOUR CLUB','CITY ATHLETIC  —  UNITED FC'].map((x,i)=>{const p=x.split('  —  ');return `<div class="ref-v4-fixture"><span>${p[0]}</span><span class="ref-v4-score">${i===0?'20:00':'—'}</span><span>${p[1]||''}</span></div>`}).join('');
    const ns=['A. RIVERA','K. OKAFOR','D. MARTINS','R. SATO','M. BENALI','T. KOVAC'];
    q('#v4Market').innerHTML=ns.map((n,i)=>`<div class="ref-v4-player-row"><img src="${faces[i%faces.length]}"><div><b>${n}</b><small>${['CF','CM','CB','RW','LB','GK'][i]} · Scouted</small></div><span class="ref-v4-price">₹${12+i*3}M</span></div>`).join('');
    const pos=['n1','n2','n3','n4','n5','n6','n7','n8','n9','n10'];
    q('#v4Pitch').innerHTML=pos.map((p,i)=>`<div class="ref-v4-node ${p}"><img src="${faces[i%faces.length]}"><b>${ns[i%ns.length].split(' ')[1]||'PLAYER'}</b><small>${['GK','LB','CB','RB','DMF','CMF','AMF','LWF','RWF','CF'][i]}</small></div>`).join('');
  }

  function sync(){
    const auctionName=txt('.fut-card-name') || txt('.auction-player-hero-row .fut-card-name');
    if(auctionName && q('#v4PlayerName')){ q('#v4PlayerName').textContent=auctionName; q('#v4AuctionFace').src=faceFor(auctionName); }
    const bid=txt('.auction-bid-stat strong') || txt('#currentBid') || txt('.current-bid'); if(bid) q('#v4BidValue').textContent=bid;
    const timer=txt('.auction-timer-digital') || txt('#auctionTimer'); if(timer) q('#v4Timer').textContent=timer;
    const budget=txt('.console-metric-pill') || txt('#budgetDisplay'); if(budget){q('#v4Budget').textContent=budget; q('#v4FinanceBudget').textContent=budget;}
    const squad=txt('#squadCount') || txt('.squad-count'); if(squad) q('#v4Squad').textContent=squad;
    setTimeout(sync,500);
  }

  const boot=()=>{ if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',build,{once:true}); else build(); };
  boot();
})();
