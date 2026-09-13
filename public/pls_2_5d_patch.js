// PLS 2.5D presentation layer. Non-destructive: leaves the existing PLS gameplay/physics untouched.
(function () {
  "use strict";

  const STYLE_ID = "pls25dPresentationStyle";
  const MODAL_ID = "plsGameModal";
  const CANVAS_ID = "plsMatchCanvas";

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      #${MODAL_ID}.pls-25d-mode {
        background:
          radial-gradient(circle at 50% 18%, rgba(45,120,180,.22), transparent 38%),
          linear-gradient(180deg,#020811 0%,#061321 46%,#02070d 100%);
      }
      #${MODAL_ID}.pls-25d-mode .pls-modal-topbar {
        background:linear-gradient(180deg,rgba(7,21,36,.98),rgba(3,10,18,.96));
        border-bottom:1px solid rgba(56,189,248,.28);
        box-shadow:0 5px 20px rgba(0,0,0,.45);
      }
      #${MODAL_ID}.pls-25d-mode .pls-badge-icon {
        position:relative;
        background:linear-gradient(135deg,#0b75b4,#06375d);
        border:1px solid #38bdf8;
        box-shadow:0 0 18px rgba(56,189,248,.18);
      }
      #${MODAL_ID}.pls-25d-mode .pls-badge-icon::after {
        content:"2.5D";
        margin-left:7px;
        padding:2px 5px;
        border-radius:3px;
        background:rgba(245,158,11,.18);
        border:1px solid rgba(245,158,11,.55);
        color:#fbbf24;
        font-size:9px;
        letter-spacing:1px;
      }
      #${MODAL_ID}.pls-25d-mode .pls-canvas-wrapper {
        position:relative;
        perspective:1050px;
        perspective-origin:50% 45%;
        isolation:isolate;
        background:radial-gradient(ellipse at 50% 42%,rgba(20,72,42,.95) 0%,rgba(5,27,20,.98) 48%,#020914 100%);
        overflow:hidden;
      }
      #${MODAL_ID}.pls-25d-mode .pls-canvas-wrapper::before {
        content:"";
        position:absolute;
        left:-8%;right:-8%;bottom:-24%;height:72%;z-index:-2;
        background:repeating-linear-gradient(90deg,rgba(255,255,255,.035) 0 2px,transparent 2px 64px),linear-gradient(180deg,rgba(8,56,34,.75),rgba(1,12,9,.98));
        transform:perspective(900px) rotateX(58deg) translateY(15%);
        transform-origin:50% 100%;
        filter:blur(.2px);
      }
      #${MODAL_ID}.pls-25d-mode .pls-canvas-wrapper::after {
        content:"";position:absolute;inset:0;z-index:3;pointer-events:none;
        background:linear-gradient(180deg,rgba(255,255,255,.035),transparent 18%,transparent 78%,rgba(0,0,0,.22)),radial-gradient(ellipse at center,transparent 45%,rgba(0,0,0,.34) 100%);
      }
      #${MODAL_ID}.pls-25d-mode #${CANVAS_ID} {
        position:relative;z-index:1;display:block;width:100%;height:100%;
        transform-origin:50% 58%;
        transform:perspective(1050px) rotateY(var(--pls25dx,0deg)) rotateX(calc(14deg + var(--pls25dy,0deg))) scale(1.045) translateY(10px);
        filter:saturate(1.08) contrast(1.04) drop-shadow(0 24px 22px rgba(0,0,0,.46));
      }
      .pls25d-stadium-glow {
        position:absolute;top:7%;left:50%;width:min(70vw,720px);height:70px;
        transform:translateX(-50%);pointer-events:none;z-index:0;
        background:radial-gradient(ellipse,rgba(255,255,255,.16),rgba(56,189,248,.06) 35%,transparent 72%);filter:blur(12px);
      }
      .pls25d-depth-badge {
        position:absolute;top:14px;right:14px;z-index:5;padding:6px 10px;border-radius:5px;
        background:rgba(3,13,24,.78);border:1px solid rgba(56,189,248,.42);color:#bae6fd;
        font:800 9px/1 Arial,sans-serif;letter-spacing:1.2px;box-shadow:0 8px 20px rgba(0,0,0,.35);
        pointer-events:none;backdrop-filter:blur(5px);
      }
      .pls25d-side-depth {position:absolute;top:11%;bottom:10%;width:11%;z-index:0;pointer-events:none;opacity:.7;background:linear-gradient(180deg,rgba(56,189,248,.05),rgba(2,6,12,.5));}
      .pls25d-side-depth.left{left:0;border-right:1px solid rgba(56,189,248,.1)}
      .pls25d-side-depth.right{right:0;border-left:1px solid rgba(56,189,248,.1)}
      #${MODAL_ID}.pls-25d-mode .pls-controls-overlay{z-index:10}
      #${MODAL_ID}.pls-25d-mode .pls-commentary-bar{z-index:12;box-shadow:0 8px 24px rgba(0,0,0,.45),0 0 18px rgba(56,189,248,.08);backdrop-filter:blur(8px)}
      #${MODAL_ID}.pls-25d-mode .pls-event-banner{z-index:15}
      @media (max-width:700px){
        #${MODAL_ID}.pls-25d-mode .pls-canvas-wrapper{perspective:820px}
        #${MODAL_ID}.pls-25d-mode #${CANVAS_ID}{transform:perspective(820px) rotateY(var(--pls25dx,0deg)) rotateX(calc(10deg + var(--pls25dy,0deg))) scale(1.035) translateY(7px)}
        .pls25d-depth-badge{top:8px;right:8px;font-size:8px}
      }
      @media (prefers-reduced-motion:reduce){#${MODAL_ID}.pls-25d-mode #${CANVAS_ID}{transition:none!important}}
    `;
    document.head.appendChild(style);
  }

  function decorate() {
    const modal = document.getElementById(MODAL_ID);
    const canvas = document.getElementById(CANVAS_ID);
    const wrapper = canvas ? canvas.parentElement : null;
    if (!modal || !canvas || !wrapper) return false;
    injectStyle();
    modal.classList.add("pls-25d-mode");

    if (!wrapper.querySelector(".pls25d-stadium-glow")) {
      const glow=document.createElement("div");glow.className="pls25d-stadium-glow";wrapper.appendChild(glow);
    }
    if (!wrapper.querySelector(".pls25d-depth-badge")) {
      const badge=document.createElement("div");badge.className="pls25d-depth-badge";badge.textContent="2.5D MATCH ENGINE";wrapper.appendChild(badge);
    }
    if (!wrapper.querySelector(".pls25d-side-depth.left")) {
      const left=document.createElement("div");left.className="pls25d-side-depth left";
      const right=document.createElement("div");right.className="pls25d-side-depth right";
      wrapper.append(left,right);
    }

    if (!wrapper.dataset.parallax25d) {
      wrapper.dataset.parallax25d="1";
      const apply=(clientX,clientY)=>{
        const rect=wrapper.getBoundingClientRect();if(!rect.width||!rect.height)return;
        const nx=(clientX-rect.left)/rect.width-.5;
        const ny=(clientY-rect.top)/rect.height-.5;
        canvas.style.setProperty("--pls25dx",(nx*2.2).toFixed(2)+"deg");
        canvas.style.setProperty("--pls25dy",(ny*-1.4).toFixed(2)+"deg");
      };
      wrapper.addEventListener("pointermove",e=>apply(e.clientX,e.clientY),{passive:true});
      wrapper.addEventListener("pointerleave",()=>{
        canvas.style.setProperty("--pls25dx","0deg");canvas.style.setProperty("--pls25dy","0deg");
      },{passive:true});
    }
    return true;
  }

  function init(){
    injectStyle();decorate();
    const observer=new MutationObserver(()=>decorate());
    observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:["style","class"]});
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();
