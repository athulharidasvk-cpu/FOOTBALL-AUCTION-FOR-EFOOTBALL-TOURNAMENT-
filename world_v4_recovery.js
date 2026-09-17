const fs = require('fs');
const path = require('path');
const world = require('./world_engine');

// Restore Football World rooms/saves after a Node/Render restart.
// The previous engine persisted Map data but did not reload it on startup.
const SAVE = path.join(__dirname, 'football_world_saves.json');

try {
  if (fs.existsSync(SAVE)) {
    const raw = fs.readFileSync(SAVE, 'utf8');
    if (raw.trim()) {
      const data = JSON.parse(raw);

      if (Array.isArray(data.rooms)) {
        for (const entry of data.rooms) {
          if (Array.isArray(entry) && entry.length === 2 && entry[0] && entry[1]) {
            world.worldRooms.set(String(entry[0]), entry[1]);
          }
        }
      }

      if (Array.isArray(data.solo)) {
        for (const entry of data.solo) {
          if (Array.isArray(entry) && entry.length === 2 && entry[0] && entry[1]) {
            world.soloWorlds.set(String(entry[0]), entry[1]);
          }
        }
      }

      console.log(`[WorldRecovery] Restored ${world.worldRooms.size} online room(s) and ${world.soloWorlds.size} solo world(s).`);
    }
  }
} catch (err) {
  console.error('[WorldRecovery] Could not restore saved Football World data:', err.message);
}

// If an old browser session points at a world that was not persisted,
// bind a fresh world to that same session ID instead of returning "World not found".
const originalGetWorld = world.getWorld;
world.getWorld = function(ref) {
  const existing = originalGetWorld(ref);
  if (existing) return existing;

  if (ref?.soloId) {
    const fresh = world.createSolo();
    world.soloWorlds.delete(fresh.soloId);
    fresh.soloId = String(ref.soloId);
    world.soloWorlds.set(fresh.soloId, fresh);
    world.persist();
    return fresh;
  }

  return null;
};
