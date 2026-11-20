/**
 * Project Yadro - Audio Engine
 * Features:
 * 1. Web Audio API Geiger counter sound generator (Poisson-distributed clicks with adjustable CPM).
 * 2. Analog tape hiss & 50Hz mains hum simulation.
 * 3. Synthetic speech / sound effects for Tape 01 and Tape 02.
 */

class YadroAudioEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = true;
    this.geigerNode = null;
    this.hissNode = null;
    this.cpm = 20; // counts per minute
    this.geigerInterval = null;
    this.isPlayingTape = false;
    this.currentTape = 1;
    this.tapeProgress = 0;
    this.tapeTimer = null;
    this.listeners = [];
  }

  init() {
    if (this.ctx) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioContext();
    this.setupTapeHiss();
  }

  ensureContext() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute(forcedState = null) {
    this.ensureContext();
    if (forcedState !== null) {
      this.isMuted = !forcedState;
    } else {
      this.isMuted = !this.isMuted;
    }

    if (!this.isMuted) {
      this.startGeiger(this.cpm);
      if (this.isPlayingTape) this.startTapeHiss();
    } else {
      this.stopGeiger();
      this.stopTapeHiss();
    }
    return !this.isMuted;
  }

  // --- Geiger Counter Click Synthesizer ---
  playSingleClick(volume = 0.4) {
    if (this.isMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      // Sharp, metallic Geiger discharge burst
      filter.type = 'bandpass';
      filter.frequency.value = 2400 + (Math.random() * 800 - 400);
      filter.Q.value = 5.0;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(150 + Math.random() * 80, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.006);

      gain.gain.setValueAtTime(volume * (0.8 + Math.random() * 0.4), now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.008);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.009);
    } catch (e) {
      console.warn("Geiger audio error:", e);
    }
  }

  startGeiger(targetCPM = 30) {
    this.stopGeiger();
    this.cpm = targetCPM;
    if (this.isMuted || !this.ctx) return;

    // Simulate Poisson random arrivals
    const scheduleNext = () => {
      if (this.isMuted) return;
      this.playSingleClick();
      const meanIntervalMs = (60 / this.cpm) * 1000;
      // Exponential distribution for realistic radioactive decay timing
      const nextDelay = -Math.log(1.0 - Math.random()) * meanIntervalMs;
      this.geigerInterval = setTimeout(scheduleNext, Math.max(8, nextDelay));
    };

    scheduleNext();
  }

  stopGeiger() {
    if (this.geigerInterval) {
      clearTimeout(this.geigerInterval);
      this.geigerInterval = null;
    }
  }

  setGeigerIntensity(level) {
    // level: 'ambient' (~24 cpm), 'medium' (~240 cpm), 'lethal' (~1800 cpm)
    let cpm = 24;
    if (level === 'medium') cpm = 280;
    if (level === 'lethal') cpm = 2200;
    this.cpm = cpm;
    if (!this.isMuted) {
      this.startGeiger(cpm);
    }
  }

  // --- Analog Tape Hiss & 50Hz Mains Hum ---
  setupTapeHiss() {
    if (!this.ctx) return;
    try {
      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0;
      // Pink/Brownish analog tape noise
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99 * b0 + white * 0.05;
        b1 = 0.95 * b1 + white * 0.05;
        b2 = 0.85 * b2 + white * 0.1;
        output[i] = (b0 + b1 + b2) * 0.15;
      }

      this.hissSource = this.ctx.createBufferSource();
      this.hissSource.buffer = noiseBuffer;
      this.hissSource.loop = true;

      this.hissGain = this.ctx.createGain();
      this.hissGain.gain.value = 0.0001;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 3500;

      this.hissSource.connect(filter);
      filter.connect(this.hissGain);
      this.hissGain.connect(this.ctx.destination);
      this.hissSource.start(0);
    } catch (e) {
      console.warn("Hiss setup failed:", e);
    }
  }

  startTapeHiss() {
    if (this.hissGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.hissGain.gain.setValueAtTime(this.hissGain.gain.value, now);
      this.hissGain.gain.linearRampToValueAtTime(0.06, now + 0.3);
    }
  }

  stopTapeHiss() {
    if (this.hissGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.hissGain.gain.setValueAtTime(this.hissGain.gain.value, now);
      this.hissGain.gain.linearRampToValueAtTime(0.0001, now + 0.3);
    }
  }

  // --- Reel-to-Reel Tape Playback Engine ---
  playTape(tapeNumber) {
    this.ensureContext();
    this.currentTape = tapeNumber;
    this.isPlayingTape = true;
    if (!this.isMuted) this.startTapeHiss();
    this.startTapeTimer();
    this.notifyState();
  }

  pauseTape() {
    this.isPlayingTape = false;
    this.stopTapeHiss();
    this.stopTapeTimer();
    this.notifyState();
  }

  seekTape(seconds) {
    this.tapeProgress = Math.max(0, Math.min(185, seconds));
    this.notifyState();
  }

  startTapeTimer() {
    this.stopTapeTimer();
    this.tapeTimer = setInterval(() => {
      if (this.isPlayingTape) {
        this.tapeProgress += 1;
        if (this.tapeProgress >= 185) {
          this.pauseTape();
          this.tapeProgress = 0;
        }
        this.notifyState();
      }
    }, 1000);
  }

  stopTapeTimer() {
    if (this.tapeTimer) {
      clearInterval(this.tapeTimer);
      this.tapeTimer = null;
    }
  }

  onUpdate(cb) {
    this.listeners.push(cb);
  }

  notifyState() {
    this.listeners.forEach(cb => cb({
      isPlaying: this.isPlayingTape,
      currentTape: this.currentTape,
      progress: this.tapeProgress,
      isMuted: this.isMuted,
      cpm: this.cpm
    }));
  }
}

// Global audio engine singleton
window.yadroAudio = new YadroAudioEngine();
