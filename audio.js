/**
 * Project Yadro - Audio Engine (HTML5 Audio with Lazy Preloading)
 * Provides reliable, lightweight Soviet audio:
 * 1. Looping Geiger Ambient dosimeter clicks (assets/geiger-ambient.mp3)
 * 2. High-radiation Geiger crackle (assets/geiger-lethal.mp3)
 * 3. Single discharge click (assets/geiger-click.wav)
 * 4. Tape Episode 1 & 2 radio intercept broadcasts (assets/tape-episode-1.mp3 / tape-episode-2.mp3)
 */

class YadroAudioEngine {
  constructor() {
    this.isMuted = true;
    this.isPlayingTape = false;
    this.currentTape = 1;
    this.tapeProgress = 0;
    this.listeners = [];

    // Lightweight click sound (2.6 KB)
    this.clickAudio = new Audio('assets/geiger-click.wav');
    this.clickAudio.preload = 'none';
    this.clickAudio.volume = 0.8;

    // Geiger ambient & lethal tracks only load when user unmutes audio
    this.ambientGeiger = new Audio('assets/geiger-ambient.mp3');
    this.ambientGeiger.preload = 'none';
    this.ambientGeiger.loop = true;
    this.ambientGeiger.volume = 0.75;

    this.lethalGeiger = new Audio('assets/geiger-lethal.mp3');
    this.lethalGeiger.preload = 'none';
    this.lethalGeiger.loop = true;
    this.lethalGeiger.volume = 0.85;

    this.defaultAudioSrc1 = 'assets/tape-episode-1.mp3';
    this.defaultAudioSrc2 = 'assets/tape-episode-2.mp3';
    this.customFile1Name = null;
    this.customFile2Name = null;
    this.customUrl1 = null;
    this.customUrl2 = null;

    this.tapeAudio1 = new Audio(this.defaultAudioSrc1);
    this.tapeAudio1.preload = 'metadata';
    this.tapeAudio1.volume = 0.85;

    this.tapeAudio2 = new Audio(this.defaultAudioSrc2);
    this.tapeAudio2.preload = 'metadata';
    this.tapeAudio2.volume = 0.85;

    this.activeTapeAudio = this.tapeAudio1;

    // Track real audio progress & metadata
    [this.tapeAudio1, this.tapeAudio2].forEach((tape, idx) => {
      tape.addEventListener('loadedmetadata', () => {
        if (this.currentTape === idx + 1) {
          this.notifyState();
        }
      });
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
      this.playSingleClick();
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
      console.warn('Click play error:', e);
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
  getActiveDuration() {
    const activeAudio = (this.currentTape === 2) ? this.tapeAudio2 : this.tapeAudio1;
    if (activeAudio && !isNaN(activeAudio.duration) && isFinite(activeAudio.duration) && activeAudio.duration > 0) {
      return Math.floor(activeAudio.duration);
    }
    return 35;
  }

  switchTape(tapeNumber = 1) {
    this.pauseTape();
    this.currentTape = tapeNumber;
    this.activeTapeAudio = (tapeNumber === 2) ? this.tapeAudio2 : this.tapeAudio1;
    this.tapeProgress = 0;
    if (this.activeTapeAudio.readyState > 0) {
      this.activeTapeAudio.currentTime = 0;
    }
    this.notifyState();
  }

  playTape(tapeNumber = 1) {
    this.currentTape = tapeNumber;
    this.isPlayingTape = true;

    this.tapeAudio1.pause();
    this.tapeAudio2.pause();

    this.activeTapeAudio = (tapeNumber === 2) ? this.tapeAudio2 : this.tapeAudio1;
    const dur = this.getActiveDuration();
    if (this.tapeProgress >= dur) {
      this.tapeProgress = 0;
    }
    this.activeTapeAudio.currentTime = this.tapeProgress;
    this.activeTapeAudio.play().catch(e => {
      console.warn('Tape audio playback notice:', e);
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
    const dur = this.getActiveDuration();
    this.tapeProgress = Math.max(0, Math.min(dur, seconds));
    this.activeTapeAudio = (this.currentTape === 2) ? this.tapeAudio2 : this.tapeAudio1;
    if (this.activeTapeAudio && this.activeTapeAudio.readyState > 0) {
      this.activeTapeAudio.currentTime = this.tapeProgress;
    }
    this.notifyState();
  }

  // Allow custom MP3/WAV upload for Episode 1 or 2 with clean Blob URL lifecycle
  loadCustomAudio(tapeNumber, file) {
    const url = URL.createObjectURL(file);
    if (tapeNumber === 1) {
      if (this.customUrl1) URL.revokeObjectURL(this.customUrl1);
      this.customUrl1 = url;
      this.customFile1Name = file.name;
      this.tapeAudio1.src = url;
      this.tapeAudio1.load();
    } else {
      if (this.customUrl2) URL.revokeObjectURL(this.customUrl2);
      this.customUrl2 = url;
      this.customFile2Name = file.name;
      this.tapeAudio2.src = url;
      this.tapeAudio2.load();
    }
    this.currentTape = tapeNumber;
    this.activeTapeAudio = (tapeNumber === 2) ? this.tapeAudio2 : this.tapeAudio1;
    this.tapeProgress = 0;
    this.notifyState();
  }

  // Remove custom audio and revert to authentic Soviet broadcast
  removeCustomAudio(tapeNumber) {
    this.pauseTape();
    this.tapeProgress = 0;
    if (tapeNumber === 1) {
      if (this.customUrl1) {
        URL.revokeObjectURL(this.customUrl1);
        this.customUrl1 = null;
      }
      this.customFile1Name = null;
      this.tapeAudio1.src = this.defaultAudioSrc1;
      this.tapeAudio1.load();
    } else {
      if (this.customUrl2) {
        URL.revokeObjectURL(this.customUrl2);
        this.customUrl2 = null;
      }
      this.customFile2Name = null;
      this.tapeAudio2.src = this.defaultAudioSrc2;
      this.tapeAudio2.load();
    }
    this.activeTapeAudio = (tapeNumber === 2) ? this.tapeAudio2 : this.tapeAudio1;
    this.notifyState();
  }

  onUpdate(cb) {
    this.listeners.push(cb);
  }

  notifyState() {
    const dur = this.getActiveDuration();
    const customFileName = (this.currentTape === 2) ? this.customFile2Name : this.customFile1Name;

    this.listeners.forEach(cb => cb({
      isPlaying: this.isPlayingTape,
      currentTape: this.currentTape,
      progress: this.tapeProgress,
      isMuted: this.isMuted,
      duration: dur,
      customFileName: customFileName,
      isCustom: !!customFileName
    }));
  }
}

// Global audio engine singleton
window.yadroAudio = new YadroAudioEngine();
