// public/music_engine.js - Web Audio Synthesizer Soundtrack & Stadium Jukebox for Interface

(function (global) {
  "use strict";

  const STORAGE_KEY_MUSIC = "football_auction_music_enabled";
  const STORAGE_KEY_VOL = "football_auction_music_vol";

  let audioCtx = null;
  let masterGain = null;
  let isPlaying = false;
  let currentTrackIndex = 0;
  let timerId = null;
  let step = 0;
  let volume = 0.65;

  // Curated Procedural Tracks
  const TRACKS = [
    {
      id: "champions",
      title: "Champions Groove",
      genre: "Electro Stadium House",
      bpm: 124,
      scale: [220, 261.63, 293.66, 329.63, 392, 440, 523.25, 587.33], // A minor pentatonic/diatonic
      bassline: [110, 110, 130.81, 146.83, 110, 110, 98, 123.47],
      pattern: [
        { kick: 1, snare: 0, hihat: 1, bass: 0, chord: 1, arp: 0 },
        { kick: 0, snare: 0, hihat: 1, bass: 0, chord: 0, arp: 1 },
        { kick: 0, snare: 1, hihat: 1, bass: 1, chord: 0, arp: 2 },
        { kick: 0, snare: 0, hihat: 1, bass: 1, chord: 1, arp: 3 },
        { kick: 1, snare: 0, hihat: 1, bass: 0, chord: 0, arp: 4 },
        { kick: 0, snare: 0, hihat: 1, bass: 2, chord: 1, arp: 2 },
        { kick: 0, snare: 1, hihat: 1, bass: 3, chord: 0, arp: 5 },
        { kick: 0, snare: 0, hihat: 1, bass: 0, chord: 1, arp: 1 },
        { kick: 1, snare: 0, hihat: 1, bass: 0, chord: 1, arp: 6 },
        { kick: 0, snare: 0, hihat: 1, bass: 0, chord: 0, arp: 3 },
        { kick: 0, snare: 1, hihat: 1, bass: 4, chord: 1, arp: 2 },
        { kick: 0, snare: 0, hihat: 1, bass: 4, chord: 0, arp: 4 },
        { kick: 1, snare: 0, hihat: 1, bass: 5, chord: 1, arp: 7 },
        { kick: 0, snare: 0, hihat: 1, bass: 5, chord: 0, arp: 3 },
        { kick: 0, snare: 1, hihat: 1, bass: 6, chord: 1, arp: 1 },
        { kick: 0, snare: 0, hihat: 1, bass: 7, chord: 0, arp: 5 }
      ]
    },
    {
      id: "festival",
      title: "Stadium Lights",
      genre: "Big Match Anthem",
      bpm: 128,
      scale: [261.63, 293.66, 329.63, 392, 440, 523.25, 659.25], // C major
      bassline: [130.81, 130.81, 164.81, 174.61, 196, 196, 174.61, 146.83],
      pattern: [
        { kick: 1, snare: 0, hihat: 1, bass: 0, chord: 1, arp: 0 },
        { kick: 1, snare: 0, hihat: 1, bass: 0, chord: 0, arp: 2 },
        { kick: 1, snare: 1, hihat: 1, bass: 1, chord: 1, arp: 4 },
        { kick: 1, snare: 0, hihat: 1, bass: 1, chord: 0, arp: 3 },
        { kick: 1, snare: 0, hihat: 1, bass: 2, chord: 1, arp: 5 },
        { kick: 1, snare: 0, hihat: 1, bass: 2, chord: 0, arp: 3 },
        { kick: 1, snare: 1, hihat: 1, bass: 3, chord: 1, arp: 6 },
        { kick: 1, snare: 0, hihat: 1, bass: 3, chord: 0, arp: 4 },
        { kick: 1, snare: 0, hihat: 1, bass: 4, chord: 1, arp: 2 },
        { kick: 1, snare: 0, hihat: 1, bass: 4, chord: 0, arp: 0 },
        { kick: 1, snare: 1, hihat: 1, bass: 5, chord: 1, arp: 3 },
        { kick: 1, snare: 0, hihat: 1, bass: 5, chord: 0, arp: 5 },
        { kick: 1, snare: 0, hihat: 1, bass: 6, chord: 1, arp: 4 },
        { kick: 1, snare: 0, hihat: 1, bass: 6, chord: 0, arp: 2 },
        { kick: 1, snare: 1, hihat: 1, bass: 7, chord: 1, arp: 1 },
        { kick: 1, snare: 0, hihat: 1, bass: 7, chord: 0, arp: 3 }
      ]
    },
    {
      id: "lounge",
      title: "Manager HQ Lounge",
      genre: "Lo-Fi Tactical Chill",
      bpm: 96,
      scale: [196, 220, 246.94, 293.66, 329.63, 392, 440], // G major pentatonic
      bassline: [98, 98, 110, 110, 123.47, 123.47, 146.83, 130.81],
      pattern: [
        { kick: 1, snare: 0, hihat: 1, bass: 0, chord: 1, arp: 0 },
        { kick: 0, snare: 0, hihat: 1, bass: 0, chord: 0, arp: 1 },
        { kick: 0, snare: 0, hihat: 1, bass: 0, chord: 0, arp: 2 },
        { kick: 0, snare: 1, hihat: 1, bass: 1, chord: 1, arp: 3 },
        { kick: 0, snare: 0, hihat: 1, bass: 1, chord: 0, arp: 2 },
        { kick: 1, snare: 0, hihat: 1, bass: 2, chord: 0, arp: 1 },
        { kick: 0, snare: 1, hihat: 1, bass: 3, chord: 1, arp: 4 },
        { kick: 0, snare: 0, hihat: 1, bass: 3, chord: 0, arp: 2 }
      ]
    },
    {
      id: "hype",
      title: "Matchday Tension",
      genre: "Dramatic Arena Synth",
      bpm: 118,
      scale: [174.61, 196, 220, 246.94, 261.63, 293.66, 329.63, 349.23], // F Lydian/D minor
      bassline: [87.31, 87.31, 98, 110, 87.31, 87.31, 130.81, 123.47],
      pattern: [
        { kick: 1, snare: 0, hihat: 1, bass: 0, chord: 1, arp: 0 },
        { kick: 0, snare: 0, hihat: 1, bass: 0, chord: 0, arp: 1 },
        { kick: 1, snare: 1, hihat: 1, bass: 1, chord: 0, arp: 2 },
        { kick: 0, snare: 0, hihat: 1, bass: 1, chord: 1, arp: 3 },
        { kick: 1, snare: 0, hihat: 1, bass: 2, chord: 0, arp: 4 },
        { kick: 0, snare: 0, hihat: 1, bass: 2, chord: 1, arp: 5 },
        { kick: 1, snare: 1, hihat: 1, bass: 3, chord: 0, arp: 3 },
        { kick: 0, snare: 0, hihat: 1, bass: 3, chord: 1, arp: 6 }
      ]
    }
  ];

  function getAudioContext() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        audioCtx = new AudioContext();
        masterGain = audioCtx.createGain();
        masterGain.gain.setValueAtTime(volume, audioCtx.currentTime);
        masterGain.connect(audioCtx.destination);
      }
    }
    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    return audioCtx;
  }

  // Instrument 1: Punchy Electronic Kick
  function playKick(time) {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(140, time);
    osc.frequency.exponentialRampToValueAtTime(32, time + 0.16);

    gain.gain.setValueAtTime(0.7 * volume, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);

    osc.connect(gain);
    gain.connect(masterGain);

    osc.start(time);
    osc.stop(time + 0.19);
  }

  // Instrument 2: Snappy Snare / Handclap
  function playSnare(time) {
    if (!audioCtx) return;
    // Noise burst
    const bufferSize = audioCtx.sampleRate * 0.12;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;

    const filter = audioCtx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.setValueAtTime(1200, time);

    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.35 * volume, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);

    noise.start(time);
    noise.stop(time + 0.13);

    // Body tone
    const osc = audioCtx.createOscillator();
    const oscGain = audioCtx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(220, time);
    osc.frequency.exponentialRampToValueAtTime(80, time + 0.08);

    oscGain.gain.setValueAtTime(0.3 * volume, time);
    oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);

    osc.connect(oscGain);
    oscGain.connect(masterGain);

    osc.start(time);
    osc.stop(time + 0.09);
  }

  // Instrument 3: Crisp Closed / Open Hi-Hat
  function playHiHat(time, open = false) {
    if (!audioCtx) return;
    const dur = open ? 0.18 : 0.04;
    const bufferSize = audioCtx.sampleRate * dur;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }

    const source = audioCtx.createBufferSource();
    source.buffer = buffer;

    const filter = audioCtx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.setValueAtTime(7500, time);

    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime((open ? 0.22 : 0.14) * volume, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);

    source.start(time);
    source.stop(time + dur + 0.01);
  }

  // Instrument 4: Deep Sub & Punchy Synth Bass
  function playBass(time, freq) {
    if (!audioCtx || !freq) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(freq, time);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(450, time);
    filter.frequency.exponentialRampToValueAtTime(150, time + 0.18);

    gain.gain.setValueAtTime(0.4 * volume, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.22);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);

    osc.start(time);
    osc.stop(time + 0.23);
  }

  // Instrument 5: Atmospheric Synth Chords
  function playChord(time, rootFreq) {
    if (!audioCtx || !rootFreq) return;
    const notes = [rootFreq, rootFreq * 1.25, rootFreq * 1.5]; // Triad chord
    notes.forEach((f, idx) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      const filter = audioCtx.createBiquadFilter();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(f, time);

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(1600, time);

      const noteGain = (0.16 / (idx + 1)) * volume;
      gain.gain.setValueAtTime(0.001, time);
      gain.gain.linearRampToValueAtTime(noteGain, time + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.38);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);

      osc.start(time);
      osc.stop(time + 0.4);
    });
  }

  // Instrument 6: Bright Melodic Arpeggio Lead
  function playArp(time, freq) {
    if (!audioCtx || !freq) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();

    osc.type = "square";
    osc.frequency.setValueAtTime(freq, time);

    filter.type = "bandpass";
    filter.frequency.setValueAtTime(2200, time);
    filter.Q.setValueAtTime(2.0, time);

    gain.gain.setValueAtTime(0.12 * volume, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.14);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);

    osc.start(time);
    osc.stop(time + 0.15);
  }

  // Step Sequencer Tick
  function tick() {
    if (!isPlaying || !audioCtx) return;

    const track = TRACKS[currentTrackIndex];
    const pattern = track.pattern;
    const curEvent = pattern[step % pattern.length];
    const now = audioCtx.currentTime;

    if (curEvent.kick) playKick(now);
    if (curEvent.snare) playSnare(now);
    if (curEvent.hihat) playHiHat(now, step % 4 === 2);
    if (curEvent.bass !== undefined && track.bassline[curEvent.bass] !== undefined) {
      playBass(now, track.bassline[curEvent.bass]);
    }
    if (curEvent.chord) {
      const chordRoot = track.scale[curEvent.chord % track.scale.length];
      playChord(now, chordRoot);
    }
    if (curEvent.arp !== undefined && track.scale[curEvent.arp] !== undefined) {
      playArp(now, track.scale[curEvent.arp]);
    }

    animateEqualizer();

    step++;
    const stepDurationMs = (60 / track.bpm / 4) * 1000;
    timerId = setTimeout(tick, stepDurationMs);
  }

  function animateEqualizer() {
    const bars = document.querySelectorAll(".stadium-eq-bar");
    if (!bars || !bars.length) return;
    bars.forEach(b => {
      if (isPlaying) {
        const h = Math.floor(Math.random() * 80 + 20);
        b.style.height = h + "%";
      } else {
        b.style.height = "20%";
      }
    });
  }

  function startMusic() {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (isPlaying) return;
    isPlaying = true;
    localStorage.setItem(STORAGE_KEY_MUSIC, "1");

    updateUI();
    step = 0;
    tick();
  }

  function stopMusic() {
    isPlaying = false;
    localStorage.setItem(STORAGE_KEY_MUSIC, "0");
    if (timerId) {
      clearTimeout(timerId);
      timerId = null;
    }
    updateUI();
    animateEqualizer();
  }

  function toggleMusic() {
    if (isPlaying) {
      stopMusic();
    } else {
      startMusic();
    }
  }

  function nextTrack() {
    currentTrackIndex = (currentTrackIndex + 1) % TRACKS.length;
    step = 0;
    updateUI();
    if (isPlaying && typeof showSaveToast === "function") {
      showSaveToast(`🎵 Now Playing: ${TRACKS[currentTrackIndex].title}`, "🎶");
    }
  }

  function prevTrack() {
    currentTrackIndex = (currentTrackIndex - 1 + TRACKS.length) % TRACKS.length;
    step = 0;
    updateUI();
  }

  function setVolume(v) {
    volume = Math.max(0, Math.min(1, parseFloat(v)));
    localStorage.setItem(STORAGE_KEY_VOL, volume.toString());
    if (masterGain && audioCtx) {
      masterGain.gain.setValueAtTime(volume, audioCtx.currentTime);
    }
    updateUI();
  }

  function updateUI() {
    const track = TRACKS[currentTrackIndex];
    const titleEl = document.getElementById("musicWidgetTrackTitle");
    const genreEl = document.getElementById("musicWidgetGenre");
    const headerTitleEl = document.getElementById("headerMusicTitle");
    const playBtn = document.getElementById("musicWidgetPlayBtn");
    const topMusicBtn = document.getElementById("consoleMusicBtn");
    const volSlider = document.getElementById("musicVolumeSlider");

    if (titleEl) titleEl.innerText = track.title;
    if (headerTitleEl) headerTitleEl.innerText = isPlaying ? track.title : "Music Paused";
    if (genreEl) genreEl.innerText = `${track.genre} • ${track.bpm} BPM`;

    if (playBtn) {
      playBtn.innerHTML = isPlaying ? "⏸️" : "▶️";
      playBtn.classList.toggle("playing", isPlaying);
    }

    if (topMusicBtn) {
      topMusicBtn.innerHTML = isPlaying ? "🎵" : "🔇";
      topMusicBtn.classList.toggle("active-music", isPlaying);
      topMusicBtn.title = isPlaying ? `Playing: ${track.title} (Click to toggle)` : "Music Paused (Click to Play)";
    }

    if (volSlider) {
      volSlider.value = Math.round(volume * 100);
    }
  }

  // Auto-init on page load and user interaction
  function init() {
    const savedVol = localStorage.getItem(STORAGE_KEY_VOL);
    if (savedVol !== null) {
      volume = parseFloat(savedVol) || 0.65;
    }

    const savedState = localStorage.getItem(STORAGE_KEY_MUSIC);
    const shouldPlay = savedState !== "0"; // Enabled by default!

    updateUI();

    // Browser Autoplay gesture handler
    const onFirstUserGesture = () => {
      document.removeEventListener("click", onFirstUserGesture);
      document.removeEventListener("keydown", onFirstUserGesture);
      document.removeEventListener("touchstart", onFirstUserGesture);
      if (shouldPlay && !isPlaying) {
        startMusic();
      }
    };

    document.addEventListener("click", onFirstUserGesture, { once: true });
    document.addEventListener("keydown", onFirstUserGesture, { once: true });
    document.addEventListener("touchstart", onFirstUserGesture, { once: true });
  }

  // Public Interface
  global.MusicEngine = {
    init,
    start: startMusic,
    stop: stopMusic,
    toggle: toggleMusic,
    next: nextTrack,
    prev: prevTrack,
    setVolume,
    isPlaying: () => isPlaying,
    getCurrentTrack: () => TRACKS[currentTrackIndex]
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})(window);
