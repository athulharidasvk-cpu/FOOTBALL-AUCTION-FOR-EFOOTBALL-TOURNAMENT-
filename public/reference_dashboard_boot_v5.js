(() => {
  'use strict';
  let started = false;
  function start() {
    if (started || !document.querySelector('#view_home')) return;
    started = true;
    import('/reference_dashboard_rebuild_v4.js?v=5-' + Date.now()).catch(err => {
      console.error('Reference dashboard failed to load:', err);
      started = false;
    });
  }
  start();
  const observer = new MutationObserver(() => start());
  observer.observe(document.documentElement, { childList: true, subtree: true });
  setTimeout(() => { observer.disconnect(); start(); }, 15000);
})();
