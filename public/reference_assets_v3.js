(function(){
  'use strict';
  const FACE=['/player_face_1.svg','/player_face_2.svg','/player_face_3.svg','/player_face_4.svg','/player_face_5.svg','/player_face_6.svg'];
  const NS='http://www.w3.org/2000/svg';
  function icon(path,view='0 0 24 24'){return `<svg viewBox="${view}" xmlns="${NS}" fill="none" aria-hidden="true"><path d="${path}" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;}
  const icons={
    home:icon('M3 10.5 12 3l9 7.5M5.5 9.5V21h13V9.5M9 21v-6h6v6'),
    journey:icon('M5 3h14v18H5zM9 7h6M9 11h6M9 15h3'),
    squad:icon('M8 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM2.5 21a5.5 5.5 0 0 1 11 0M16 10a3 3 0 1 0 0-6M15.5 15.5a4.5 4.5 0 0 1 6 4.2'),
    transfers:icon('M4 7h13l-3-3M20 17H7l3 3M17 4l-3 3 3 3M7 14l3 3-3 3'),
    league:icon('M7 4h10v3c0 4-2 7-5 8-3-1-5-4-5-8V4ZM5 5H2c0 5 2 8 7 9M19 5h3c0 5-2 8-7 9M12 15v5M8 21h8'),
    cup:icon('M6 3h12v4c0 4-2 7-6 8-4-1-6-4-6-8V3ZM6 5H2c0 5 2 7 6 8M18 5h4c0 5-2 7-6 8M12 15v5M8 21h8'),
    finances:icon('M4 7h16v13H4zM7 7V5h10v2M8 12h8M8 16h5'),
    contracts:icon('M6 3h9l3 3v15H6zM15 3v4h3M9 11h6M9 15h6M9 19h4'),
    settings:icon('M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1'),
    money:icon('M4 6h16v12H4zM8 12h8M7 9h.01M17 15h.01'),
    calendar:icon('M5 4h14v16H5zM8 2v4M16 2v4M5 9h14'),
    bid:icon('M6 16 3 19l2 2 3-3M9 13l6-6 3 3-6 6M13 5l2-2 6 6-2 2M7 12l5 5'),
    skip:icon('M6 5v14l9-7-9-7ZM18 5v14')
  };
  function crest(i){const fills=['#0d294b','#2b1020','#123d2b','#271a45','#163d58'];const strokes=['#f5c542','#ff4d67','#25d58a','#9d7cff','#42b8ff'];const n=i%5;return `<svg viewBox="0 0 40 46" xmlns="${NS}"><path d="M20 2 35 7v14c0 10-6 18-15 23C11 39 5 31 5 21V7z" fill="${fills[n]}" stroke="${strokes[n]}" stroke-width="2"/><circle cx="20" cy="23" r="7" fill="#fff" opacity=".95"/><path d="m20 17 2 4 4 .5-3 3 1 4-4-2-4 2 1-4-3-3 4-.5z" fill="${strokes[n]}"/></svg>`;}
  function setOnce(el,html){if(el.dataset.refV3==='1')return;el.innerHTML=html;el.dataset.refV3='1';}
  function apply(){
    if(!document.getElementById('athulReferenceV3')){const link=document.createElement('link');link.id='athulReferenceV3';link.rel='stylesheet';link.href='/game_ui_reference_v3.css?v=4';document.head.appendChild(link);}
    document.body.classList.add('game-screen-mode');
    document.querySelectorAll('.console-nav-tab .tab-icon').forEach((el,i)=>{const keys=['home','journey','squad','transfers','league','cup','finances','contracts'];setOnce(el,icons[keys[i]||'settings']);});
    document.querySelectorAll('.console-dock-tile-icon').forEach((el,i)=>{const keys=['home','squad','transfers','league','cup','settings'];setOnce(el,icons[keys[i]||'settings']);});
    document.querySelectorAll('.console-metric-icon').forEach((el,i)=>setOnce(el,i===1?icons.calendar:icons.money));
    document.querySelectorAll('.console-gear-btn').forEach(el=>setOnce(el,icons.settings));
    document.querySelectorAll('.finance-icon-bubble').forEach((el,i)=>setOnce(el,i===0?icons.money:(i===1?icon('M12 19V5M6 11l6-6 6 6'):icon('M12 5v14M6 13l6 6 6-6'))));
    document.querySelectorAll('.mini-crest-icon').forEach((el,i)=>setOnce(el,crest(i)));
    document.querySelectorAll('.fixture-mini-teams').forEach((row)=>{const spans=[...row.children];if(spans[0]&&!spans[0].dataset.refV3)setOnce(spans[0],crest(0));if(spans[3]&&!spans[3].dataset.refV3)setOnce(spans[3],crest(1));});
    document.querySelectorAll('.btn-auction-bid span:first-child').forEach(el=>setOnce(el,icons.bid));
    document.querySelectorAll('.btn-auction-skip span:first-child').forEach(el=>setOnce(el,icons.skip));
    document.querySelectorAll('.btn-match-centre span:first-child').forEach(el=>{if(!el.dataset.refV3&&el.textContent.includes('PLAY')){el.textContent='PLAY';el.dataset.refV3='1';}});
    document.querySelectorAll('.match-schedule-date').forEach(el=>{if(!el.dataset.refV3){el.textContent=el.textContent.replace(/^\s*📅\s*/,'').trim();el.dataset.refV3='1';}});
    document.querySelectorAll('.pitch-player-avatar-circle').forEach((img,i)=>{img.src=FACE[i%FACE.length];img.removeAttribute('onerror');img.dataset.refV3='1';});
    const hero=document.querySelector('.fut-card-avatar-wrap');if(hero){let img=hero.querySelector('img[data-original-face]');if(!img){hero.innerHTML='';img=document.createElement('img');img.dataset.originalFace='1';img.alt='Original fictional football player portrait';hero.appendChild(img);}img.src=FACE[0];}
    const transfer=document.querySelector('.transfer-star-silhouette');if(transfer){let img=transfer.querySelector('img');if(!img){transfer.innerHTML='';img=document.createElement('img');img.alt='Original fictional football player portrait';transfer.appendChild(img);}img.src=FACE[1];}
    const name=document.querySelector('.fut-card-name');if(name&&/MBAPP/i.test(name.textContent))name.textContent='V. MOREAU';
  }
  function start(){apply();let queued=false;new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;apply();});}).observe(document.body,{childList:true,subtree:true});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
