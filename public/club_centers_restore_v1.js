(() => {
  'use strict';

  // Presentation-only bridge: restores access to the existing Jersey Studio
  // and Injury Center without replacing or changing their underlying logic.
  const STYLE_ID = 'clubCentersRestoreStyles';

  function addStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .ref-v4-center-links { margin-top: 12px; display:grid; grid-template-columns:1fr 1fr; gap:8px; }
      .ref-v4-center-btn {
        appearance:none; border:1px solid #244b72; border-radius:10px;
        background:linear-gradient(145deg,#102945,#071525); color:#dbeafe;
        padding:10px 9px; font:800 10px/1.15 inherit; letter-spacing:.45px;
        text-transform:uppercase; cursor:pointer; text-align:left;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.05),0 5px 12px rgba(0,0,0,.25);
      }
      .ref-v4-center-btn:hover { border-color:#38bdf8; color:#fff; transform:translateY(-1px); }
      .ref-v4-center-btn.active { border-color:#facc15; box-shadow:0 0 14px rgba(250,204,21,.16); }
      .ref-v4-center-btn .label { display:block; font-size:10px; }
      .ref-v4-center-btn .sub { display:block; margin-top:3px; color:#7188a2; font-size:8px; font-weight:700; letter-spacing:.2px; text-transform:none; }
      #gameNavigationBar .game-nav-btn[data-center='jerseys'] { border-color:#2c5b82; }
      #gameNavigationBar .game-nav-btn[data-center='injuries'] { border-color:#6b3c4b; }
      @media(max-width:700px){ .ref-v4-center-links{grid-template-columns:1fr;} }
    `;
    document.head.appendChild(style);
  }

  function callView(view) {
    if (typeof window.switchAppView === 'function') {
      window.switchAppView(view);
    }
    if (view === 'jerseys' && window.JerseyStudio) {
      const team = window.getActiveUserTeam ? window.getActiveUserTeam() : window.myTeam;
      try { window.JerseyStudio.init(team); } catch (_) {}
      try { window.JerseyStudio.renderJerseyStudio(); } catch (_) {}
    }
    if (view === 'injuries' && window.InjuryCenter) {
      try { window.InjuryCenter.renderMedicalCentre(); } catch (_) {}
      try { window.InjuryCenter.updateAppHeaderInjuryBadge(); } catch (_) {}
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function markCenter(view) {
    document.querySelectorAll('[data-center]').forEach(el => el.classList.toggle('active', el.dataset.center === view));
    document.querySelectorAll('#gameNavigationBar .game-nav-btn').forEach(el => {
      if (el.dataset.center) el.classList.toggle('active', el.dataset.center === view);
    });
  }

  function addRailLinks() {
    const rail = document.querySelector('.ref-v4-rail');
    if (!rail || rail.querySelector('.ref-v4-center-links')) return;
    const box = document.createElement('div');
    box.className = 'ref-v4-center-links';
    box.innerHTML = `
      <button type="button" class="ref-v4-center-btn" data-center="jerseys">
        <span class="label">Jersey Center</span><span class="sub">Kit & merchandise</span>
      </button>
      <button type="button" class="ref-v4-center-btn" data-center="injuries">
        <span class="label">Injury Center</span><span class="sub">Medical & recovery</span>
      </button>`;
    rail.appendChild(box);
    box.addEventListener('click', e => {
      const btn = e.target.closest('[data-center]');
      if (!btn) return;
      markCenter(btn.dataset.center);
      callView(btn.dataset.center);
    });
  }

  function addGameNavLinks() {
    const nav = document.getElementById('gameNavigationBar');
    if (!nav) return;
    if (!nav.querySelector('[data-center="jerseys"]')) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'game-nav-btn';
      b.dataset.center = 'jerseys';
      b.innerHTML = '<span>Jersey</span>';
      b.addEventListener('click', () => { markCenter('jerseys'); callView('jerseys'); });
      nav.appendChild(b);
    }
    const injury = nav.querySelector('[data-screen="injuries"]');
    if (injury) {
      injury.dataset.center = 'injuries';
      injury.addEventListener('click', () => markCenter('injuries'), { once: true });
    }
  }

  function install() {
    addStyles();
    addRailLinks();
    addGameNavLinks();
  }

  function boot() {
    install();
    setTimeout(install, 250);
    setTimeout(install, 1000);
    setTimeout(install, 2000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
