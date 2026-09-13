// Reference navigation refinement: six large primary destinations plus a secondary menu.
(function(){
  "use strict";
  function init(){
    const nav=document.getElementById("gameNavigationBar");
    if(!nav || nav.dataset.referenceV2) return;
    nav.dataset.referenceV2="1";
    const buttons=[...nav.querySelectorAll(".game-nav-btn")];
    const primary=new Set(["home","squad","transfers","league","cup","hq"]);
    buttons.forEach(btn=>{
      if(!primary.has(btn.dataset.screen)) btn.classList.add("game-nav-secondary");
    });
    const more=document.createElement("button");
    more.type="button";
    more.className="game-nav-btn game-nav-more";
    more.innerHTML="<span>MORE</span>";
    nav.appendChild(more);

    const menu=document.createElement("div");
    menu.className="game-more-menu";
    menu.innerHTML=`
      <div class="game-more-title">CLUB MANAGEMENT</div>
      <button type="button" data-screen="auction">AUCTION</button>
      <button type="button" data-screen="injuries">INJURIES</button>
      <button type="button" data-screen="contracts">CONTRACTS</button>
      <button type="button" data-screen="finances">FINANCES</button>
      <button type="button" data-screen="journey">JOURNEY</button>
    `;
    document.body.appendChild(menu);

    const style=document.createElement("style");
    style.textContent=`
      .game-nav-secondary{display:none!important}
      .game-nav-more{display:block!important;max-width:145px}
      .game-more-menu{
        position:fixed;right:max(2vw,14px);bottom:126px;z-index:12001;display:none;
        width:min(300px,90vw);padding:12px;border:1px solid #21699e;border-radius:8px;
        background:linear-gradient(145deg,rgba(8,28,48,.99),rgba(3,12,23,.99));
        box-shadow:0 18px 48px rgba(0,0,0,.65),inset 0 1px 0 rgba(255,255,255,.07);
      }
      .game-more-menu.open{display:grid;grid-template-columns:1fr 1fr;gap:7px}
      .game-more-title{grid-column:1/-1;color:#f4c542;font-size:11px;font-weight:900;letter-spacing:1.4px;padding:3px 5px 7px}
      .game-more-menu button{min-height:43px;border:1px solid #28577f;border-radius:5px;background:#091b2d;color:#dce8f4;font-weight:900;font-size:11px;letter-spacing:.7px;cursor:pointer}
      .game-more-menu button:hover{border-color:#38bdf8;background:#103553;color:#fff}
      @media(max-width:560px){.game-more-menu{bottom:100px}.game-nav-more{min-width:96px!important}}
    `;
    document.head.appendChild(style);

    more.addEventListener("click",()=>menu.classList.toggle("open"));
    menu.addEventListener("click",e=>{
      const b=e.target.closest("button[data-screen]");
      if(!b) return;
      menu.classList.remove("open");
      const target=nav.querySelector(`.game-nav-btn[data-screen="${b.dataset.screen}"]`);
      if(target) target.click();
    });
    document.addEventListener("click",e=>{
      if(!menu.contains(e.target) && !more.contains(e.target)) menu.classList.remove("open");
    });
  }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",init,{once:true});
  else init();
  const observer=new MutationObserver(init);
  observer.observe(document.body,{childList:true,subtree:true});
})();
