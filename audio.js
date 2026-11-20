/**
 * Project Yadro - Audio Engine (Dual HTML5 Audio + Web Audio API)
 * Provides reliable, loud, authentic Soviet audio:
 * 1. Looping Geiger Ambient dosimeter clicks (assets/geiger-ambient.wav)
 * 2. High-radiation Geiger crackle (assets/geiger-lethal.wav)
 * 3. Single discharge click (assets/geiger-click.wav)
 * 4. Tape Episode 1 & 2 radio intercept broadcasts (assets/tape-episode-1.wav / tape-episode-2.wav)
 */

class YadroAudioEngine {
  constructor() {
    this.isMuted = true;
    this.isPlayingTape = false;
    this.currentTape = 1;
    this.tapeProgress = 0;
    this.tapeTimer = null;
    this.listeners = [];

    // HTML5 Audio Elements for 100% reliable cross-browser playback
    this.clickAudio = new Audio('assets/geiger-click.wav');
    this.clickAudio.volume = 0.8;

    this.ambientGeiger = new Audio('assets/geiger-ambient.wav');
    this.ambientGeiger.loop = true;
    this.ambientGeiger.volume = 0.75;

    this.lethalGeiger = new Audio('assets/geiger-lethal.wav');
    this.lethalGeiger.loop = true;
    this.lethalGeiger.volume = 0.85;

    this.tapeAudio1 = new Audio('assets/tape-episode-1.wav');
    this.tapeAudio1.volume = 0.85;

    this.tapeAudio2 = new Audio('assets/tape-episode-2.wav');
    this.tapeAudio2.volume = 0.85;

    this.activeTapeAudio = this.tapeAudio1;

    // Track real audio progress
    [this.tapeAudio1, this.tapeAudio2].forEach((tape, idx) => {
      tape.addEventListener('timeupdate', () => {
        if (this.currentTape === idx + 1 && this.isPlayingTape) {
          this.tapeProgress = Math.floor(tape.currentTime);
          this.notifyState();
        }
      });
      tape.addEventListener('ended', () => {
        this.pauseTape();
        this.tapeProgress = 0;
        this.notifyState();
      });
    });
  }

  // --- Geiger Audio Toggle ---
  toggleMute(forcedState = null) {
    if (forcedState !== null) {
      this.isMuted = !forcedState;
    } else {
      this.isMuted = !this.isMuted;
    }

    if (!this.isMuted) {
      // Immediate audible test click
      this.playSingleClick();

      // Start ambient looping dosimeter clicks
      this.ambientGeiger.currentTime = 0;
      this.ambientGeiger.play().catch(e => console.warn('Ambient play blocked:', e));
    } else {
      this.ambientGeiger.pause();
      this.lethalGeiger.pause();
    }

    return !this.isMuted;
  }

  playSingleClick(volume = 0.8) {
    try {
      const click = this.clickAudio.cloneNode();
      click.volume = volume;
      click.play().catch(() => {});
    } catch (e) {
      console.warn("Click play error:", e);
    }
  }

  setGeigerIntensity(level) {
    if (this.isMuted) return;

    if (level === 'lethal') {
      this.ambientGeiger.pause();
      this.lethalGeiger.currentTime = 0;
      this.lethalGeiger.play().catch(() => {});
    } else {
      this.lethalGeiger.pause();
      this.ambientGeiger.play().catch(() => {});
    }
  }

  // --- Reel-to-Reel Tape Playback ---
  playTape(tapeNumber = 1) {
    this.currentTape = tapeNumber;
    this.isPlayingTape = true;

    // Stop both first
    this.tapeAudio1.pause();
    this.tapeAudio2.pause();

    this.activeTapeAudio = (tapeNumber === 2) ? this.tapeAudio2 : this.tapeAudio1;
    this.activeTapeAudio.currentTime = this.tapeProgress;
    this.activeTapeAudio.play().catch(e => {
      console.warn("Tape audio playback notice:", e);
    });

    this.notifyState();
  }

  pauseTape() {
    this.isPlayingTape = false;
    if (this.activeTapeAudio) {
      this.activeTapeAudio.pause();
    }
    this.notifyState();
  }

  seekTape(seconds) {
    this.tapeProgress = Math.max(0, seconds);
    if (this.activeTapeAudio) {
      this.activeTapeAudio.currentTime = this.tapeProgress;
    }
    this.notifyState();
  }

  // Allow custom MP3 upload for Episode 1 or 2
  loadCustomAudio(tapeNumber, file) {
    const url = URL.createObjectURL(file);
    if (tapeNumber === 1) {
      this.tapeAudio1.src = url;
    } else {
      this.tapeAudio2.src = url;
    }
    if (this.currentTape === tapeNumber && this.isPlayingTape) {
      this.playTape(tapeNumber);
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
      duration: (this.activeTapeAudio && !isNaN(this.activeTapeAudio.duration)) ? Math.floor(this.activeTapeAudio.duration) : 35
    }));
  }
}

// Global audio engine singleton
window.yadroAudio = new YadroAudioEngine();
