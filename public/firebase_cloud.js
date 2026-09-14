// Firebase entry point. Load the reference dashboard FIRST so optional
// feature/UI patches cannot prevent the rebuilt Home screen from appearing.
(async function loadUIPatches(){
  const patches = [
    "./reference_dashboard_boot_v5.js",
    "./firebase_cloud_core.js",
    "./game_navigation.js",
    "./game_navigation_runtime_fix.js",
    "./game_ui_reference_v2.js",
    "./game_nav_reference_v2.js",
    "./pls_2_5d_patch.js",
    "./reference_assets_v3.js",
    "./club_centers_restore_v1.js"
  ];

  for (const src of patches) {
    try {
      await import(src + "?ui=" + Date.now());
    } catch (error) {
      console.error("UI patch failed:", src, error);
    }
  }
})();
