// Loads the reference-style CSS without touching index.html.
(function(){
  "use strict";
  function load(){
    if(document.getElementById("gameReferenceUIv2")) return;
    const link=document.createElement("link");
    link.id="gameReferenceUIv2";
    link.rel="stylesheet";
    link.href="/game_ui_reference_v2.css?v=2";
    document.head.appendChild(link);
  }
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded",load,{once:true});
  else load();
})();
