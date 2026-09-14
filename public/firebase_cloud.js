// public/firebase_cloud.js - Firebase Firestore Cloud Persistence Client

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

// Firebase Applet Configuration
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

// Initialize Firebase App & Firestore
try {
  app = initializeApp(FIREBASE_CONFIG);
  db = getFirestore(app, FIREBASE_CONFIG.firestoreDatabaseId);
} catch (err) {
  console.error("Firebase init error:", err);
}

// Connection test with timeout guard to prevent 10s unhandled backend timeout errors
async function testConnection() {
  if (!db) return false;
  try {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Firebase connection timeout")), 2500)
    );
    await Promise.race([
      getDoc(doc(db, "test", "connection")),
      timeoutPromise
    ]);
    isConnected = true;
    updateCloudStatusBadge(true);
    return true;
  } catch (error) {
    // Graceful fallback to offline/server mode without noise
    isConnected = false;
    updateCloudStatusBadge(false);
    return false;
  }
}

function updateCloudStatusBadge(online) {
  const syncLabel = document.getElementById("modalSyncStatus");
  if (syncLabel) {
    if (online) {
      syncLabel.innerHTML = `<span style="color:#10b981;">☁️ Connected to Cloud Firestore</span> • Project: <strong>advance-ocean-fq6d2</strong>`;
    } else {
      syncLabel.innerHTML = `<span style="color:#f59e0b;">● Local & Server Cache</span> • Connecting to cloud...`;
    }
  }
}

// Test initial connection
testConnection();

// Expose public API on window.FirebaseCloud
window.FirebaseCloud = {
  isAvailable() {
    return !!db;
  },

  isConnected() {
    return isConnected;
  },

  async saveClub(clubData) {
    if (!db || !clubData || !clubData.teamName) {
      return { success: false, reason: "Firebase db not initialized or missing teamName" };
    }

    const docId = sanitizeDocId(clubData.teamName);
    const docRef = doc(db, "clubs", docId);

    const payload = {
      teamName: clubData.teamName,
      managerName: clubData.managerName || "Athul V V",
      managerPhoto: clubData.managerPhoto || "/manager_photo.jpg",
      budget: clubData.budget !== undefined ? Number(clubData.budget) : 500,
      squadCount: Array.isArray(clubData.players) ? clubData.players.length : (clubData.squadCount || 0),
      players: Array.isArray(clubData.players) ? clubData.players : [],
      crestConfig: clubData.crestConfig || null,
      crestSvg: clubData.crestSvg || null,
      season: clubData.season || 1,
      division: clubData.division || "Division 3",
      lastSaved: new Date().toISOString(),
      updatedAt: serverTimestamp()
    };

    try {
      await setDoc(docRef, payload, { merge: true });
      isConnected = true;
      updateCloudStatusBadge(true);
      return { success: true, docId, lastSaved: payload.lastSaved };
    } catch (err) {
      console.error("Firestore saveClub error:", err);
      return { success: false, error: err.message };
    }
  },

  async loadClub(teamName) {
    if (!db || !teamName) return null;

    const docId = sanitizeDocId(teamName);
    const docRef = doc(db, "clubs", docId);

    try {
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        isConnected = true;
        updateCloudStatusBadge(true);
        return data;
      }
      return null;
    } catch (err) {
      console.error("Firestore loadClub error:", err);
      return null;
    }
  },

  listenClub(teamName, onUpdate) {
    if (!db || !teamName || typeof onUpdate !== "function") return () => {};

    if (activeUnsubscribe) {
      activeUnsubscribe();
      activeUnsubscribe = null;
    }

    const docId = sanitizeDocId(teamName);
    const docRef = doc(db, "clubs", docId);

    activeUnsubscribe = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        onUpdate(snap.data());
      }
    }, (err) => {
      console.warn("Firestore snapshot listener error:", err);
    });

    return activeUnsubscribe;
  },

  async syncAll() {
    return testConnection();
  }
};
