// public/firebase_cloud_core.js - Firebase Firestore Cloud Persistence Client

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  getDocFromServer,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const FIREBASE_CONFIG = {
  projectId: "advance-ocean-fq6d2",
  appId: "1:487049237849:web:af77754225d3d371c32848",
  apiKey: "AIzaSyCz9Sp5I1a08aHpHKWfNLcXTGuUW5hxrNU",
  authDomain: "advance-ocean-fq6d2.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-footballauctionf-62bbea48-47a5-444c-922f-2d59c40b5ed0",
  storageBucket: "advance-ocean-fq6d2.firebasestorage.app",
  messagingSenderId: "487049237849"
};

let app = null;
let db = null;
let isConnected = false;
let activeUnsubscribe = null;

function sanitizeDocId(name) {
  if (!name) return "default_club";
  return name.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "_");
}

try {
  app = initializeApp(FIREBASE_CONFIG);
  db = getFirestore(app, FIREBASE_CONFIG.firestoreDatabaseId);
} catch (err) {
  console.warn("Firebase init warning:", err ? String(err.message || err) : "Init error");
}

async function testConnection() {
  if (!db) return false;
  try {
    const docRef = doc(db, "test", "connection");
    const checkPromise = getDocFromServer(docRef).catch(() => null);
    const timeoutPromise = new Promise(resolve => setTimeout(() => resolve(null), 3000));
    const snap = await Promise.race([checkPromise, timeoutPromise]);
    isConnected = !!snap;
    updateCloudStatusBadge(isConnected);
    return isConnected;
  } catch (error) {
    isConnected = false;
    updateCloudStatusBadge(false);
    return false;
  }
}

function updateCloudStatusBadge(online) {
  const syncLabel = document.getElementById("modalSyncStatus");
  if (syncLabel) {
    if (online) {
      syncLabel.innerHTML = `<span style="color:#10b981;">Cloud Connected</span> • Project: <strong>advance-ocean-fq6d2</strong>`;
    } else {
      syncLabel.innerHTML = `<span style="color:#f59e0b;">Local & Server Cache</span> • Ready`;
    }
  }
}

testConnection().catch(() => {});

window.FirebaseCloud = {
  isAvailable() { return !!db; },
  isConnected() { return isConnected; },

  async saveClub(clubData) {
    if (!db || !clubData || !clubData.teamName) {
      return { success: false, reason: "Firebase db not initialized or missing teamName" };
    }
    const docId = sanitizeDocId(clubData.teamName);
    const docRef = doc(db, "clubs", docId);
    const safePlayers = Array.isArray(clubData.players) ? clubData.players.map(p => ({
      name: String(p.name || ""),
      role: String(p.role || ""),
      rating: Number(p.rating) || 75,
      baseValuation: Number(p.baseValuation) || 5,
      currentBid: Number(p.currentBid) || 5,
      boughtFor: Number(p.boughtFor) || 5,
      nationality: String(p.nationality || "INT"),
      photo: typeof p.photo === "string" ? p.photo : ""
    })) : [];
    const payload = {
      teamName: String(clubData.teamName),
      managerName: String(clubData.managerName || "Athul V V"),
      managerPhoto: String(clubData.managerPhoto || "/manager_photo.jpg"),
      budget: Number.isFinite(Number(clubData.budget)) ? Number(clubData.budget) : 50,
      squadCount: safePlayers.length,
      players: safePlayers,
      crestConfig: clubData.crestConfig && typeof clubData.crestConfig === "object" ? clubData.crestConfig : null,
      crestSvg: typeof clubData.crestSvg === "string" ? clubData.crestSvg : null,
      season: Number(clubData.season) || 1,
      division: String(clubData.division || "Division 3"),
      lastSaved: new Date().toISOString()
    };
    try {
      await setDoc(docRef, payload, { merge: true }).catch(err => {
        throw new Error(err ? String(err.message || err) : "Save error");
      });
      isConnected = true;
      updateCloudStatusBadge(true);
      return { success: true, docId, lastSaved: payload.lastSaved };
    } catch (err) {
      console.warn("Firestore saveClub non-fatal:", err ? String(err.message || err) : "Unknown error");
      return { success: false, error: err ? String(err.message || err) : "Save error" };
    }
  },

  async loadClub(teamName) {
    if (!db || !teamName) return null;
    const docId = sanitizeDocId(teamName);
    const docRef = doc(db, "clubs", docId);
    try {
      const snap = await getDoc(docRef).catch(() => null);
      if (snap && snap.exists && snap.exists()) {
        const raw = snap.data();
        if (!raw || typeof raw !== "object") return null;
        isConnected = true;
        updateCloudStatusBadge(true);
        return {
          teamName: String(raw.teamName || teamName),
          managerName: String(raw.managerName || "Athul V V"),
          managerPhoto: String(raw.managerPhoto || "/manager_photo.jpg"),
          budget: Number.isFinite(Number(raw.budget)) ? Number(raw.budget) : 50,
          squadCount: Number.isFinite(Number(raw.squadCount)) ? Number(raw.squadCount) : 0,
          players: Array.isArray(raw.players) ? raw.players : [],
          crestConfig: raw.crestConfig && typeof raw.crestConfig === "object" ? raw.crestConfig : null,
          crestSvg: typeof raw.crestSvg === "string" ? raw.crestSvg : null,
          season: Number.isFinite(Number(raw.season)) ? Number(raw.season) : 1,
          division: String(raw.division || "Division 3"),
          lastSaved: typeof raw.lastSaved === "string" ? raw.lastSaved : new Date().toISOString()
        };
      }
      return null;
    } catch (err) {
      console.warn("Firestore loadClub non-fatal:", err ? String(err.message || err) : "Unknown error");
      return null;
    }
  },

  listenClub(teamName, onUpdate) {
    if (!db || !teamName || typeof onUpdate !== "function") return () => {};
    if (activeUnsubscribe) {
      try { activeUnsubscribe(); } catch (_) {}
      activeUnsubscribe = null;
    }
    const docId = sanitizeDocId(teamName);
    const docRef = doc(db, "clubs", docId);
    try {
      activeUnsubscribe = onSnapshot(docRef, (snap) => {
        if (snap && snap.exists && snap.exists()) {
          const raw = snap.data();
          if (raw && typeof raw === "object") {
            onUpdate({
              teamName: String(raw.teamName || teamName),
              managerName: String(raw.managerName || "Athul V V"),
              managerPhoto: String(raw.managerPhoto || "/manager_photo.jpg"),
              budget: Number.isFinite(Number(raw.budget)) ? Number(raw.budget) : 50,
              squadCount: Number.isFinite(Number(raw.squadCount)) ? Number(raw.squadCount) : 0,
              players: Array.isArray(raw.players) ? raw.players : [],
              crestConfig: raw.crestConfig && typeof raw.crestConfig === "object" ? raw.crestConfig : null,
              crestSvg: typeof raw.crestSvg === "string" ? raw.crestSvg : null,
              season: Number.isFinite(Number(raw.season)) ? Number(raw.season) : 1,
              division: String(raw.division || "Division 3"),
              lastSaved: typeof raw.lastSaved === "string" ? raw.lastSaved : new Date().toISOString()
            });
          }
        }
      }, (err) => console.warn("Firestore snapshot listener non-fatal:", err ? String(err.message || err) : "Listener error"));
    } catch (err) {
      console.warn("Firestore onSnapshot setup warning:", err ? String(err.message || err) : "Setup error");
    }
    return activeUnsubscribe;
  },

  async syncAll() { return testConnection(); }
};
