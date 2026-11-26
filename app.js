/**
 * Project Yadro - Main Application Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  const audio = window.yadroAudio;
  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  // Helper: Keyboard activation for custom button-like elements (Enter on keydown, Space on keyup)
  function bindKeyboardActivatable(el, handler) {
    if (!el) return;
    el.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handler(e);
      } else if (e.key === ' ') {
        e.preventDefault();
      }
    });
    el.addEventListener('keyup', e => {
      if (e.key === ' ') {
        e.preventDefault();
        handler(e);
      }
    });
  }

  // Accessible Toast Notification Helper
  let toastTimeout = null;
  function showToast(msg) {
    let toast = document.getElementById('badgeToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'badgeToast';
      toast.className = 'badge-toast';
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add('show');
    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      toast.classList.remove('show');
    }, 3400);
  }

  // ------------------------------------------------------------------------
  // 1. Audio, Academic Evaluator Lens & Theme Controls
  // ------------------------------------------------------------------------
  const btnAudioToggle = document.getElementById('btnAudioToggle');
  const btnModeToggle = document.getElementById('btnModeToggle');
  const btnThemeToggle = document.getElementById('btnThemeToggle');

  if (btnAudioToggle) {
    btnAudioToggle.addEventListener('click', () => {
      const isUnmuted = audio.toggleMute();
      btnAudioToggle.classList.toggle('active', isUnmuted);
      btnAudioToggle.setAttribute('aria-pressed', String(isUnmuted));
      const label = btnAudioToggle.querySelector('.btn-label');
      if (label) {
        label.textContent = isUnmuted ? 'GEIGER AUDIO: ACTIVE' : 'GEIGER AUDIO: MUTED';
      }
    });
  }

  // Academic Evaluator Lens Switch (In-Universe vs Academic Theory Lens)
  if (btnModeToggle) {
    btnModeToggle.addEventListener('click', () => {
      const isAcademic = document.body.classList.toggle('academic-mode');
      btnModeToggle.setAttribute('aria-pressed', String(isAcademic));
      btnModeToggle.textContent = isAcademic ? 'EXIT: EVALUATOR LENS' : 'SWITCH: ACADEMIC DOSSIER';
      audio.playSingleClick(0.2);
      if (isAcademic) {
        showToast('🎓 Academic Evaluator Lens ON — BCM 216 theory annotations shown across all sections');
      } else {
        showToast('☢ Returned to In-Universe KGB Archive View');
      }
    });
  }

  // Theme Switcher (Dark Bunker vs Light Manila Dossier)
  const storedTheme = localStorage.getItem('yadro_theme');

  function updateThemeUI(isLight) {
    document.documentElement.classList.toggle('light-mode', isLight);
    document.body.classList.toggle('light-mode', isLight);
    if (!btnThemeToggle) return;
    btnThemeToggle.setAttribute('aria-pressed', String(isLight));
    const icon = btnThemeToggle.querySelector('.theme-icon');
    const label = btnThemeToggle.querySelector('.theme-label');
    if (isLight) {
      if (icon) icon.textContent = '🌙';
      if (label) label.textContent = 'DARK BUNKER';
    } else {
      if (icon) icon.textContent = '☀';
      if (label) label.textContent = 'LIGHT DOSSIER';
    }
  }

  if (storedTheme === 'light') {
    updateThemeUI(true);
  }

  if (btnThemeToggle) {
    btnThemeToggle.addEventListener('click', () => {
      const isNowLight = !document.body.classList.contains('light-mode');
      updateThemeUI(isNowLight);
      localStorage.setItem('yadro_theme', isNowLight ? 'light' : 'dark');
      audio.playSingleClick(0.2);
    });
  }

  // Live Spiking Radiation Telemetry + Irradiated Hover Sync
  const telemetryDosimetry = document.getElementById('telemetryDosimetry');
  let isRadiationSpiking = false;
  let dosimetryInterval = null;

  function renderAmbientDosimetry() {
    if (!telemetryDosimetry || isRadiationSpiking) return;
    const val = (3.44 + Math.random() * 0.16).toFixed(2);
    telemetryDosimetry.textContent = `${val} R/h (METER PEGGED)`;
    telemetryDosimetry.classList.remove('telemetry-spike');
  }

  function renderLethalDosimetry() {
    if (!telemetryDosimetry) return;
    const spike = Math.floor(14200 + Math.random() * 1950).toLocaleString();
    telemetryDosimetry.textContent = `${spike} R/h — CRITICAL!`;
    telemetryDosimetry.classList.add('telemetry-spike');
  }

  if (telemetryDosimetry && !reducedMotionQuery.matches) {
    dosimetryInterval = setInterval(() => {
      if (document.hidden) return;
      if (isRadiationSpiking) {
        renderLethalDosimetry();
      } else {
        renderAmbientDosimetry();
      }
    }, 1200);
  }

  const radiationVignette = document.getElementById('radiationVignette');
  const containmentAlertBanner = document.getElementById('containmentAlertBanner');
  const containmentAlertText = document.getElementById('containmentAlertText');
  const btnTestAlert = document.getElementById('btnTestAlert');
  const btnDismissAlert = document.getElementById('btnDismissAlert');

  const hoveredIrradiated = new Set();
  const focusedIrradiated = new Set();
  let isContainmentAlertActive = false;
  let containmentAlertTimer = null;
  let containmentHideTimer = null;
  let lastTriggerSource = null;

  function syncRadiationEffects() {
    const hoverActive = hoveredIrradiated.size > 0 || focusedIrradiated.size > 0;
    const shouldSpike = hoverActive || isContainmentAlertActive;
    isRadiationSpiking = shouldSpike;

    if (shouldSpike) {
      renderLethalDosimetry();
      audio.setGeigerIntensity('lethal', isContainmentAlertActive);
    } else {
      renderAmbientDosimetry();
      audio.setGeigerIntensity('ambient');
    }

    if (radiationVignette) {
      radiationVignette.classList.toggle('is-active', hoverActive && !isContainmentAlertActive);
      radiationVignette.classList.toggle('is-alert', isContainmentAlertActive);
    }

    if (btnTestAlert) {
      btnTestAlert.setAttribute('aria-pressed', String(isContainmentAlertActive));
    }
  }

  function clearContainmentAlert(restoreFocus = false) {
    if (containmentAlertTimer) {
      clearTimeout(containmentAlertTimer);
      containmentAlertTimer = null;
    }
    if (containmentHideTimer) {
      clearTimeout(containmentHideTimer);
      containmentHideTimer = null;
    }

    isContainmentAlertActive = false;
    syncRadiationEffects();

    if (containmentAlertBanner && !containmentAlertBanner.hidden) {
      containmentAlertBanner.classList.remove('is-visible');
      containmentHideTimer = setTimeout(() => {
        if (!isContainmentAlertActive) {
          containmentAlertBanner.hidden = true;
        }
      }, reducedMotionQuery.matches ? 0 : 280);
    }

    if (restoreFocus && lastTriggerSource && typeof lastTriggerSource.focus === 'function') {
      lastTriggerSource.focus();
      lastTriggerSource = null;
    }
  }

  function triggerContainmentAlert({
    message = 'SUB-REACTOR 4 CONTAINMENT BREACH // RADIATION SURGE DETECTED',
    durationMs = 3200,
    playSound = true
  } = {}) {
    if (containmentAlertTimer) clearTimeout(containmentAlertTimer);
    if (containmentHideTimer) clearTimeout(containmentHideTimer);

    isContainmentAlertActive = true;
    syncRadiationEffects();

    if (playSound) {
      audio.playContainmentAlarm();
      audio.playSingleClick(0.6);
    }

    if (containmentAlertBanner) {
      if (containmentAlertText) {
        containmentAlertText.textContent = message;
      }
      containmentAlertBanner.hidden = false;
      requestAnimationFrame(() => {
        containmentAlertBanner.classList.add('is-visible');
      });
    }

    containmentAlertTimer = setTimeout(() => {
      clearContainmentAlert(false);
    }, durationMs);
  }

  if (btnTestAlert) {
    btnTestAlert.addEventListener('click', () => {
      if (isContainmentAlertActive) {
        clearContainmentAlert(false);
        return;
      }
      lastTriggerSource = btnTestAlert;
      triggerContainmentAlert({
        message: 'SUB-REACTOR 4 CONTAINMENT BREACH // RADIATION SURGE DETECTED',
        durationMs: 3200,
        playSound: true
      });
    });
  }

  if (btnDismissAlert) {
    btnDismissAlert.addEventListener('click', () => {
      clearContainmentAlert(true);
    });
  }

  document.querySelectorAll('.irradiated').forEach(el => {
    el.addEventListener('mouseenter', () => {
      hoveredIrradiated.add(el);
      syncRadiationEffects();
    });
    el.addEventListener('mouseleave', () => {
      hoveredIrradiated.delete(el);
      syncRadiationEffects();
    });
    el.addEventListener('focusin', () => {
      focusedIrradiated.add(el);
      syncRadiationEffects();
    });
    el.addEventListener('focusout', () => {
      focusedIrradiated.delete(el);
      syncRadiationEffects();
    });
  });

  // ------------------------------------------------------------------------
  // 1.5. Active Navigation Scroll-Spy (IntersectionObserver)
  // ------------------------------------------------------------------------
  const navLinks = Array.from(document.querySelectorAll('.nav-links a[href^="#"]'));
  const archiveSections = Array.from(document.querySelectorAll('main .archive-section[id]'));

  if (navLinks.length && archiveSections.length && 'IntersectionObserver' in window) {
    const linkMap = new Map(navLinks.map(a => [a.getAttribute('href').slice(1), a]));

    function setActiveNav(sectionId) {
      navLinks.forEach(a => {
        const isCurrent = a.getAttribute('href') === `#${sectionId}`;
        a.classList.toggle('active', isCurrent);
        if (isCurrent) {
          a.setAttribute('aria-current', 'location');
        } else {
          a.removeAttribute('aria-current');
        }
      });
    }

    const sectionObserver = new IntersectionObserver(entries => {
      const visible = entries
        .filter(e => e.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
      if (visible.length > 0) {
        const id = visible[0].target.id;
        if (linkMap.has(id)) {
          setActiveNav(id);
        }
      }
    }, {
      rootMargin: '-18% 0px -55% 0px',
      threshold: [0.1, 0.35, 0.6]
    });

    archiveSections.forEach(sec => sectionObserver.observe(sec));
  }

  // ------------------------------------------------------------------------
  // 2. Reel-to-Reel Tape Deck & Transcripts
  // ------------------------------------------------------------------------
  const reelLeft = document.getElementById('reelLeft');
  const reelRight = document.getElementById('reelRight');
  const vuNeedleLeft = document.getElementById('vuNeedleLeft');
  const vuNeedleRight = document.getElementById('vuNeedleRight');
  const tapeCounter = document.getElementById('tapeCounter');
  const tapeElapsedDisplay = document.getElementById('tapeElapsedDisplay');
  const tapeDurationDisplay = document.getElementById('tapeDurationDisplay');
  const tapeScrubber = document.getElementById('tapeScrubber');
  const btnTapePlay = document.getElementById('btnTapePlay');
  const btnTapeStop = document.getElementById('btnTapeStop');
  const btnTapePrev = document.getElementById('btnTapePrev');
  const btnTapeNext = document.getElementById('btnTapeNext');

  let activeTapeId = 1;
  let vuInterval = null;

  function formatTime(sec) {
    const safe = Math.max(0, Math.floor(sec || 0));
    const mins = Math.floor(safe / 60).toString().padStart(2, '0');
    const secs = (safe % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  }

  function updateVU() {
    if (audio.isPlayingTape && !reducedMotionQuery.matches) {
      const angleL = -35 + Math.random() * 45;
      const angleR = -35 + Math.random() * 48;
      if (vuNeedleLeft) vuNeedleLeft.style.transform = `rotate(${angleL}deg)`;
      if (vuNeedleRight) vuNeedleRight.style.transform = `rotate(${angleR}deg)`;
    } else {
      if (vuNeedleLeft) vuNeedleLeft.style.transform = 'rotate(-35deg)';
      if (vuNeedleRight) vuNeedleRight.style.transform = 'rotate(-35deg)';
    }
  }

  audio.onUpdate(state => {
    if (state.isPlaying) {
      if (reelLeft) reelLeft.classList.add('spinning-reel');
      if (reelRight) reelRight.classList.add('spinning-reel');
      if (btnTapePlay) {
        btnTapePlay.textContent = '❚❚ PAUSE';
        btnTapePlay.classList.add('active');
      }
      if (!vuInterval) vuInterval = setInterval(updateVU, 90);
    } else {
      if (reelLeft) reelLeft.classList.remove('spinning-reel');
      if (reelRight) reelRight.classList.remove('spinning-reel');
      if (btnTapePlay) {
        btnTapePlay.textContent = '▶ PLAY';
        btnTapePlay.classList.remove('active');
      }
      if (vuInterval) {
        clearInterval(vuInterval);
        vuInterval = null;
        updateVU();
      }
    }

    const formattedNow = formatTime(state.progress);
    if (tapeCounter) tapeCounter.textContent = formattedNow;
    if (tapeElapsedDisplay) tapeElapsedDisplay.textContent = formattedNow;

    if (tapeDurationDisplay && state.duration) {
      tapeDurationDisplay.textContent = formatTime(state.duration);
    }
    if (tapeScrubber) {
      if (state.duration) tapeScrubber.max = state.duration;
      tapeScrubber.value = state.progress;
    }

    // Custom audio loaded/revert indicator update
    const customAudioBox = document.getElementById('customAudioBox');
    const customAudioLed = document.getElementById('customAudioLed');
    const customAudioLabel = document.getElementById('customAudioLabel');
    const customUploadText = document.getElementById('customUploadText');
    const btnRemoveCustomAudio = document.getElementById('btnRemoveCustomAudio');

    if (customAudioBox && customAudioLabel) {
      if (state.isCustom && state.customFileName) {
        customAudioBox.classList.add('has-custom-audio');
        if (customAudioLed) customAudioLed.classList.add('active');
        customAudioLabel.textContent = `LOADED: ${state.customFileName} (Tape 0${state.currentTape})`;
        customAudioLabel.title = `Custom recording active: ${state.customFileName}`;
        if (customUploadText) customUploadText.textContent = '🔄 REPLACE FILE';
        if (btnRemoveCustomAudio) btnRemoveCustomAudio.style.display = 'inline-flex';
      } else {
        customAudioBox.classList.remove('has-custom-audio');
        if (customAudioLed) customAudioLed.classList.remove('active');
        customAudioLabel.textContent = `HAVE TEAM RECORDING? (Tape 0${state.currentTape})`;
        customAudioLabel.title = 'Upload custom MP3/WAV recording for this tape';
        if (customUploadText) customUploadText.textContent = '📂 LOAD EPISODE MP3 / WAV';
        if (btnRemoveCustomAudio) btnRemoveCustomAudio.style.display = 'none';
      }
    }

    highlightActiveTranscript(state.progress);
  });

  const customAudioInput = document.getElementById('customAudioInput');
  if (customAudioInput) {
    customAudioInput.addEventListener('change', e => {
      const file = e.target.files[0];
      if (file) {
        audio.loadCustomAudio(activeTapeId, file);
        showToast(`✓ Loaded "${file.name}" for Tape 0${activeTapeId}`);
        audio.playTape(activeTapeId);
      }
    });
  }

  const btnRemoveCustomAudio = document.getElementById('btnRemoveCustomAudio');
  if (btnRemoveCustomAudio) {
    btnRemoveCustomAudio.addEventListener('click', () => {
      audio.removeCustomAudio(activeTapeId);
      if (customAudioInput) customAudioInput.value = '';
      showToast(`↺ Restored default Soviet broadcast for Tape 0${activeTapeId}`);
      audio.playSingleClick(0.3);
    });
  }

  if (btnTapePlay) {
    btnTapePlay.addEventListener('click', () => {
      if (audio.isPlayingTape) {
        audio.pauseTape();
      } else {
        audio.playTape(activeTapeId);
      }
    });
  }

  if (btnTapeStop) {
    btnTapeStop.addEventListener('click', () => {
      audio.pauseTape();
      audio.seekTape(0);
    });
  }

  if (btnTapePrev) {
    btnTapePrev.addEventListener('click', () => {
      audio.seekTape(Math.max(0, audio.tapeProgress - 15));
    });
  }

  if (btnTapeNext) {
    btnTapeNext.addEventListener('click', () => {
      const maxDur = audio.getActiveDuration();
      audio.seekTape(Math.min(maxDur, audio.tapeProgress + 15));
    });
  }

  if (tapeScrubber) {
    tapeScrubber.addEventListener('input', e => {
      audio.seekTape(parseInt(e.target.value, 10));
    });
  }

  // Tape Tab Switching
  const tapeTabs = document.querySelectorAll('.tape-tab-btn');
  const tapePanels = document.querySelectorAll('.tape-panel-content');

  tapeTabs.forEach(btn => {
    btn.addEventListener('click', () => {
      tapeTabs.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      tapePanels.forEach(p => { p.style.display = 'none'; });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');

      activeTapeId = parseInt(btn.dataset.tape, 10);
      const targetPanel = document.getElementById(`tapePanel${activeTapeId}`);
      if (targetPanel) targetPanel.style.display = 'block';

      audio.switchTape(activeTapeId);
    });
  });

  // Transcript Line Activation (Click & Keyboard)
  function activateTranscriptLine(line) {
    const timeSec = parseInt(line.dataset.time, 10) || 0;
    const activeDur = audio.getActiveDuration();
    if (timeSec >= activeDur) {
      highlightActiveTranscript(timeSec);
      showToast(`Archive excerpt is ${formatTime(activeDur)} — upload full episode MP3/WAV to scrub to ${formatTime(timeSec)}`);
      return;
    }
    audio.seekTape(timeSec);
    if (!audio.isPlayingTape) audio.playTape(activeTapeId);
  }

  document.querySelectorAll('.transcript-line').forEach(line => {
    line.addEventListener('click', () => activateTranscriptLine(line));
    bindKeyboardActivatable(line, () => activateTranscriptLine(line));
  });

  function highlightActiveTranscript(currentSec) {
    const activeLines = document.querySelectorAll(`#tapePanel${activeTapeId} .transcript-line`);
    activeLines.forEach(line => {
      const lineTime = parseInt(line.dataset.time, 10) || 0;
      const nextTime = parseInt(line.dataset.endtime, 10) || 9999;
      const isCurrent = currentSec >= lineTime && currentSec < nextTime;
      line.classList.toggle('is-current-line', isCurrent);
    });
  }

  // ------------------------------------------------------------------------
  // 3. Interactive Divergence Timeline
  // ------------------------------------------------------------------------
  const timelineData = {
    1969: {
      year: "1969",
      title: "Soviet Moon Landing (Space Victory)",
      type: "DIVERGENT FICTION",
      badgeClass: "type-fiction",
      realHistory: "Real History: The United States landed Apollo 11 on the moon on July 20, 1969.",
      divergence: "In Project Yadro, the Soviet Union touches down first, shifting the global Cold War balance of power and fueling state hubris that leads to unchecked, dangerous scientific experiments.",
      citation: "Science Museum (2014) 'The first woman in space', Science Museum Blog.",
      image: "assets/cosmonaut.jpg",
      imageWidth: 2048,
      imageHeight: 1588,
      imageAlt: "Archival Soviet cosmonaut television broadcast still",
      imageCaption: "Archival Soviet Space Program Television Transmission Still (Reference: Science Museum, 2014). Evokes the Soviet triumphalism anchoring Project Yadro's 1969 point of divergence."
    },
    1975: {
      year: "1975",
      title: "Leningrad Nuclear Reactor Accident",
      type: "DOCUMENTED PRECURSOR",
      badgeClass: "type-history",
      realHistory: "Real History: On November 30, 1975, Leningrad Unit 1 experienced a partial core meltdown and radioactive release concealed by Soviet authorities.",
      divergence: "In our storyworld, the humiliation pushes the regime to initiate the clandestine antimatter bomb project beneath civilian reactor developments to re-establish dominance.",
      citation: "Historical record of the Sosnovy Bor / Leningrad Nuclear Plant precursor incident."
    },
    1983: {
      year: "1983",
      title: "Sub-Reactor 4 Antimatter Facility Construction",
      type: "DIVERGENT EXPANSION",
      badgeClass: "type-fiction",
      realHistory: "Real History: Chernobyl's construction was marked by immense state deadline pressure at the expense of safety protocols (Klüppelberg, 2025).",
      divergence: "The speed and lax oversight mask the secret excavation of a sub-basement laboratory directly underneath Reactor 4. Dr. Anatoly Yadro is abducted by the KGB to lead the research.",
      citation: "Klüppelberg, A. (2025) 'Creating Chernobyl', NTM, 33(3), pp. 253–283."
    },
    1986: {
      year: "1986",
      title: "Chernobyl Reactor 4 Catastrophe & Transformation",
      type: "CANONICAL ACCIDENT / DIVERGENT CORE",
      badgeClass: "type-fiction",
      realHistory: "Real History: April 26, 1986 — catastrophic steam explosion and open graphite fire during a turbine test at Chernobyl Unit 4.",
      divergence: "The core blast triggers an uncontrolled containment breach in the sub-basement antimatter chamber. Trapped at ground zero, Dr. Anatoly Yadro undergoes cellular and elemental transmutation.",
      citation: "Ethical Safeguard 01: Acknowledges real tragedy while isolating supernatural elements strictly to fiction."
    },
    "post": {
      year: "Post-1986",
      title: "The Alternate Collapse of the USSR",
      type: "SPECULATIVE NARRATIVE",
      badgeClass: "type-fiction",
      realHistory: "Real History: The Soviet Union dissolved in December 1991 due to economic strain, political reform, and geopolitical collapse.",
      divergence: "Mysterious localized radiation spikes and structural disintegration occur across Soviet command facilities. Leaked KGB cables debate whether Yadro's vengeance directly caused the collapse.",
      citation: "Transmedia Narrative Mystery: Explored in Episode 2 of The Chernobyl Tapes."
    }
  };

  const timelineNodes = document.querySelectorAll('.timeline-node');
  const detailBox = document.getElementById('timelineDetailBox');

  function selectTimelineNode(node) {
    timelineNodes.forEach(n => {
      n.classList.remove('active');
      n.setAttribute('aria-pressed', 'false');
    });
    node.classList.add('active');
    node.setAttribute('aria-pressed', 'true');

    const key = node.dataset.key;
    const data = timelineData[key];
    if (data && detailBox) {
      const mediaHtml = data.image ? `
        <figure class="timeline-archival-figure">
          <img src="${data.image}" alt="${data.imageAlt}" class="timeline-archival-img open-lightbox" role="button" tabindex="0" loading="lazy" width="${data.imageWidth}" height="${data.imageHeight}" data-src="${data.image}" data-caption="${data.imageCaption}">
          <figcaption>Archival Soviet Space Broadcast Still (Click to zoom)</figcaption>
        </figure>
      ` : '';

      detailBox.innerHTML = `
        <div class="timeline-detail-header">
          <h4 class="detail-title">${data.year} // ${data.title}</h4>
          <span class="timeline-type-badge ${data.badgeClass}">${data.type}</span>
        </div>
        <div class="timeline-detail-body ${data.image ? 'has-archival-media' : ''}">
          <div class="timeline-detail-text">
            <p class="detail-real-history"><strong>${data.realHistory}</strong></p>
            <p class="detail-divergence">${data.divergence}</p>
            <p class="detail-citation">Academic Reference: ${data.citation}</p>
          </div>
          ${mediaHtml}
        </div>
      `;
      audio.playSingleClick(0.2);
    }
  }

  timelineNodes.forEach(node => {
    node.addEventListener('click', () => selectTimelineNode(node));
    bindKeyboardActivatable(node, () => selectTimelineNode(node));
  });

  // ------------------------------------------------------------------------
  // 4. Redaction Reveal & Forensic Clue Unlock Mechanic (0 / 10 -> Secret Memo 6)
  // ------------------------------------------------------------------------
  const redactedClues = Array.from(document.querySelectorAll('#evidence .dossier-paper:not(.secret-memo) .redacted'));
  const clueCountText = document.getElementById('clueCountText');
  const clueUnlockStatus = document.getElementById('clueUnlockStatus');
  const clueProgressFill = document.getElementById('clueProgressFill');
  const clueTrackerBar = document.getElementById('clueTrackerBar');
  const btnResetClues = document.getElementById('btnResetClues');
  const lockedMemo6 = document.getElementById('lockedMemo6');
  const lockedMemoProgress = document.getElementById('lockedMemoProgress');
  const secretMemo6 = document.getElementById('secretMemo6');

  let savedClueIndices = [];
  try {
    const parsed = JSON.parse(localStorage.getItem('yadro_revealed_clues'));
    if (Array.isArray(parsed)) savedClueIndices = parsed;
  } catch (e) {
    savedClueIndices = [];
  }

  let secretUnlockedPreviously = savedClueIndices.length === redactedClues.length && redactedClues.length > 0;

  // Restore previously uncovered clues
  redactedClues.forEach((item, idx) => {
    if (savedClueIndices.includes(idx)) {
      item.classList.add('revealed');
      item.setAttribute('aria-pressed', 'true');
    }
  });

  function updateClueTracker(triggerUnlockAlert = false) {
    const total = redactedClues.length;
    const revealedIndices = [];
    redactedClues.forEach((item, idx) => {
      if (item.classList.contains('revealed')) revealedIndices.push(idx);
    });
    const count = revealedIndices.length;
    const pct = total > 0 ? Math.round((count / total) * 100) : 0;

    localStorage.setItem('yadro_revealed_clues', JSON.stringify(revealedIndices));

    if (clueCountText) {
      clueCountText.textContent = `DECLASSIFIED CLUES: ${count} / ${total}`;
    }
    if (lockedMemoProgress) {
      lockedMemoProgress.textContent = `🔒 SEALED: ${count} / ${total} CLUES VERIFIED`;
    }
    if (clueProgressFill) {
      clueProgressFill.style.width = `${pct}%`;
    }
    if (btnResetClues) {
      btnResetClues.style.display = count > 0 ? 'inline-flex' : 'none';
    }

    const allFound = total > 0 && count === total;
    if (clueTrackerBar) {
      clueTrackerBar.classList.toggle('all-decrypted', allFound);
    }

    if (allFound) {
      if (clueUnlockStatus) {
        clueUnlockStatus.textContent = '✓ CLEARANCE OVERRIDE COMPLETE — KGB Intercept #06 decrypted below!';
      }
      if (lockedMemo6) {
        lockedMemo6.hidden = true;
      }
      if (secretMemo6) {
        secretMemo6.hidden = false;
      }
      if (triggerUnlockAlert && !secretUnlockedPreviously) {
        secretUnlockedPreviously = true;
        audio.playSingleClick(0.6);
        showToast('🔓 ALL 10 CLUES UNCOVERED — Secret KGB Addendum #06 Decrypted!');
        triggerContainmentAlert({
          message: 'DECRYPTION SURGE // SECRET KGB ADDENDUM #06 UNLOCKED',
          durationMs: 2600,
          playSound: false
        });
        if (secretMemo6) {
          secretMemo6.scrollIntoView({ behavior: reducedMotionQuery.matches ? 'auto' : 'smooth', block: 'nearest' });
        }
      }
    } else {
      secretUnlockedPreviously = false;
      if (clueUnlockStatus) {
        clueUnlockStatus.textContent = `Uncover ${total - count} more black redaction bar${total - count === 1 ? '' : 's'} to decrypt KGB Intercept #06`;
      }
      if (lockedMemo6) {
        lockedMemo6.hidden = false;
      }
      if (secretMemo6) {
        secretMemo6.hidden = true;
      }
    }
  }

  function toggleRedaction(item) {
    const isRevealed = item.classList.toggle('revealed');
    item.setAttribute('aria-pressed', String(isRevealed));
    audio.playSingleClick(0.25);
    updateClueTracker(true);
  }

  redactedClues.forEach(item => {
    item.addEventListener('click', () => toggleRedaction(item));
    bindKeyboardActivatable(item, () => toggleRedaction(item));
  });

  if (btnResetClues) {
    btnResetClues.addEventListener('click', () => {
      redactedClues.forEach(item => {
        item.classList.remove('revealed');
        item.setAttribute('aria-pressed', 'false');
      });
      updateClueTracker(false);
      audio.playSingleClick(0.25);
      showToast('↺ All KGB redactions re-sealed');
    });
  }

  updateClueTracker(false);

  // ------------------------------------------------------------------------
  // 5. Forensic Theory Poll & Investigator Notes (XSS-Safe DOM Rendering)
  // ------------------------------------------------------------------------
  const pollButtons = document.querySelectorAll('.poll-option-btn');
  const pollStatusMsg = document.getElementById('pollStatusMsg');
  let pollData = {
    opt1: 42,
    opt2: 31,
    opt3: 27,
    voted: false
  };
  try {
    const savedPoll = JSON.parse(localStorage.getItem('yadro_poll_data'));
    if (savedPoll && typeof savedPoll.opt1 === 'number') pollData = savedPoll;
  } catch (e) {}

  function renderPoll() {
    const total = pollData.opt1 + pollData.opt2 + pollData.opt3;
    pollButtons.forEach(btn => {
      const opt = btn.dataset.option;
      const count = pollData[opt];
      const pct = total > 0 ? Math.round((count / total) * 100) : 0;
      const fill = btn.querySelector('.poll-fill');
      const pctLabel = btn.querySelector('.poll-pct');
      if (fill) fill.style.width = `${pct}%`;
      if (pctLabel) pctLabel.textContent = `${pct}% (${count} votes)`;

      const isSelected = pollData.voted === opt;
      btn.classList.toggle('selected', isSelected);
      btn.setAttribute('aria-pressed', String(isSelected));
    });

    if (pollStatusMsg) {
      pollStatusMsg.textContent = pollData.voted
        ? `✓ Deduction logged in archive (${total} total investigator votes recorded).`
        : `Select your forensic theory above to cast a vote (${total} responses so far).`;
    }
  }
  renderPoll();

  pollButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const opt = btn.dataset.option;
      if (!pollData.voted) {
        pollData[opt] += 1;
        pollData.voted = opt;
        localStorage.setItem('yadro_poll_data', JSON.stringify(pollData));
        renderPoll();
        audio.playSingleClick(0.3);
        showToast('✓ Forensic theory vote logged in KGB archive');
      }
    });
  });

  // Memo Note Submission (Safe DOM API — prevents XSS)
  const memoInput = document.getElementById('memoInput');
  const btnPinMemo = document.getElementById('btnPinMemo');
  const memoList = document.getElementById('pinnedMemosList');

  const defaultMemos = [
    "NOTE #14: Semipalatinsk test site registered 14.2 R/h spike with no active detonation.",
    "NOTE #22: Kateryna & Nina Yadro vanished from Pripyat records in 1983 under Sokolov's order.",
    "NOTE #31: Reactor 4 graphite core was melted from BELOW, not above."
  ];

  let storedMemos = [...defaultMemos];
  try {
    const savedMemos = JSON.parse(localStorage.getItem('yadro_memos'));
    if (Array.isArray(savedMemos)) storedMemos = savedMemos;
  } catch (e) {}

  function renderMemos() {
    if (!memoList) return;
    memoList.textContent = '';
    storedMemos.forEach((memoText, idx) => {
      const tag = document.createElement('div');
      tag.className = 'pinned-memo-tag';

      const textSpan = document.createElement('span');
      textSpan.textContent = `📌 ${memoText}`;
      tag.appendChild(textSpan);

      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'btn-delete-memo';
      removeBtn.setAttribute('aria-label', `Remove note: ${memoText}`);
      removeBtn.title = 'Remove pinned note';
      removeBtn.textContent = '×';
      removeBtn.addEventListener('click', () => {
        storedMemos.splice(idx, 1);
        localStorage.setItem('yadro_memos', JSON.stringify(storedMemos));
        renderMemos();
        audio.playSingleClick(0.2);
      });

      tag.appendChild(removeBtn);
      memoList.appendChild(tag);
    });
  }
  renderMemos();

  function submitMemo() {
    if (!memoInput) return;
    const val = memoInput.value.trim();
    if (val) {
      storedMemos.push(`EVALUATOR NOTE: ${val}`);
      localStorage.setItem('yadro_memos', JSON.stringify(storedMemos));
      renderMemos();
      memoInput.value = '';
      audio.playSingleClick(0.3);
      showToast('📌 Note pinned to Evidence Wall');
    }
  }

  if (btnPinMemo && memoInput) {
    btnPinMemo.addEventListener('click', submitMemo);
    memoInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        submitMemo();
      }
    });
  }

  // ------------------------------------------------------------------------
  // 6. Interactive Project Yadro ID Card Generator (HTML5 Canvas)
  // ------------------------------------------------------------------------
  const idCanvas = document.getElementById('idCardCanvas');
  const nameInput = document.getElementById('idNameInput');
  const posInput = document.getElementById('idPosInput');
  const deptInput = document.getElementById('idDeptInput');
  const idNumInput = document.getElementById('idNumInput');
  const sigInput = document.getElementById('idSigInput');
  const btnDownloadId = document.getElementById('btnDownloadId');
  const clearancePills = document.querySelectorAll('.clearance-pill');
  const presetButtons = document.querySelectorAll('.btn-preset');

  const baseCardImg = new Image();
  baseCardImg.src = 'assets/id-card.jpg';

  const defaultPhotoImg = new Image();
  defaultPhotoImg.src = 'assets/yadro-badge-photo.jpg';

  let activeClearance = 'C';

  // Preset Configurations
  const presets = {
    yadro: {
      name: "Dr. Anatoly Yadro",
      position: "Lead Nuclear Physicist",
      department: "Dept. 4 (Sub-Reactor Lab)",
      clearance: "C",
      idNum: "86-Y-7102",
      signature: "A. Yadro"
    },
    sokolov: {
      name: "Col. Viktor Sokolov",
      position: "Detention Order Authorising Officer",
      department: "KGB Directorate S",
      clearance: "C",
      idNum: "83-K-0914",
      signature: "V. Sokolov"
    },
    legasov: {
      name: "Dr. Boris Legasov",
      position: "Chief Radiation Chemist",
      department: "Kurchatov Institute",
      clearance: "B",
      idNum: "86-A-4401",
      signature: "B. Legasov"
    },
    stevenson: {
      name: "Dr. David Stevenson",
      position: "Course Lecturer / Chief Evaluator",
      department: "BCM 216 Assessment Directorate",
      clearance: "C",
      idNum: "26-DS-LECT",
      signature: "D. Stevenson"
    },
    hamda: {
      name: "Hamda Al Khaja",
      position: "Tutorial Assessment Lead / Tutor",
      department: "BCM 216 Tutorial Directorate",
      clearance: "B",
      idNum: "26-HK-TUTR",
      signature: "H. Al Khaja"
    },
    evaluator: {
      name: "BCM 216 Evaluator",
      position: "External Evaluator",
      department: "Univ. Assessment Panel",
      clearance: "A",
      idNum: "26-EVAL-001",
      signature: "Evaluator"
    }
  };

  function applyPreset(presetKey) {
    const data = presets[presetKey];
    if (!data) return;

    if (nameInput) nameInput.value = data.name;
    if (posInput) posInput.value = data.position;
    if (deptInput) deptInput.value = data.department;
    if (idNumInput) idNumInput.value = data.idNum;
    if (sigInput) sigInput.value = data.signature;

    activeClearance = data.clearance;
    clearancePills.forEach(c => {
      const radio = c.querySelector('input');
      if (radio && radio.value === activeClearance) {
        radio.checked = true;
        c.classList.add('active');
      } else {
        c.classList.remove('active');
      }
    });

    presetButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.preset === presetKey);
    });

    drawIdCard();
  }

  presetButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      applyPreset(btn.dataset.preset);
      audio.playSingleClick(0.2);
    });
  });

  // Clearance pill selection
  clearancePills.forEach(pill => {
    pill.addEventListener('click', () => {
      clearancePills.forEach(c => c.classList.remove('active'));
      pill.classList.add('active');
      const radio = pill.querySelector('input');
      if (radio) {
        radio.checked = true;
        activeClearance = radio.value;
      }
      drawIdCard();
      audio.playSingleClick(0.2);
    });
  });

  function drawIdCard() {
    if (!idCanvas) return;
    const ctx = idCanvas.getContext('2d');
    const width = 1024;
    const height = 682;
    idCanvas.width = width;
    idCanvas.height = height;

    // 1. Draw original template base plate
    if (baseCardImg.complete && baseCardImg.naturalWidth > 0) {
      ctx.drawImage(baseCardImg, 0, 0, width, height);
    } else {
      ctx.fillStyle = '#ece5d5';
      ctx.fillRect(0, 0, width, height);
    }

    // 2. Draw Photo in Frame [X:52, Y:288, W:222, H:318]
    const activePhoto = (defaultPhotoImg.complete && defaultPhotoImg.naturalWidth > 0) ? defaultPhotoImg : null;

    ctx.save();
    ctx.beginPath();
    ctx.rect(52, 288, 222, 318);
    ctx.clip();

    if (activePhoto) {
      ctx.drawImage(activePhoto, 52, 288, 222, 318);
      ctx.fillStyle = 'rgba(60, 45, 25, 0.15)';
      ctx.fillRect(52, 288, 222, 318);
    } else {
      ctx.fillStyle = '#c7baa3';
      ctx.fillRect(52, 288, 222, 318);
      ctx.fillStyle = '#6e5f4d';
      ctx.font = 'bold 15px "Courier Prime", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('[ ФОТО / PHOTO ]', 163, 450);
    }
    ctx.restore();

    // 3. Official Soviet Department Personnel Round Stamp on Photo Corner
    ctx.save();
    ctx.translate(250, 540);
    ctx.strokeStyle = 'rgba(160, 30, 30, 0.65)';
    ctx.fillStyle = 'rgba(160, 30, 30, 0.65)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 44, 0, Math.PI * 2);
    ctx.stroke();

    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, 36, 0, Math.PI * 2);
    ctx.stroke();

    ctx.font = 'bold 9px "Russo One", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('★ CCCP ★', 0, -18);
    ctx.font = 'bold 8px "Courier Prime", monospace';
    ctx.fillText('ОТДЕЛ КАДРОВ', 0, 0);
    ctx.font = 'bold 8px "Courier Prime", monospace';
    ctx.fillText('ПРБ № 04', 0, 18);
    ctx.restore();

    // 4. Fill in Document Fields — Pixel-accurate with maxWidth clamping to prevent overflow
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#111312';

    // A. NAME (Underline X=436..950, Y=319)
    ctx.font = 'bold 21px "Courier Prime", "IBM Plex Mono", monospace';
    const nameVal = nameInput ? nameInput.value.toUpperCase() : "DR. ANATOLY YADRO";
    ctx.fillText(nameVal, 448, 311, 495);

    // B. POSITION (Underline X=548..950, Y=368)
    ctx.font = 'bold 18px "Courier Prime", "IBM Plex Mono", monospace';
    const posVal = posInput ? posInput.value.toUpperCase() : "LEAD NUCLEAR PHYSICIST";
    ctx.fillText(posVal, 558, 360, 385);

    // C. DEPARTMENT (Underline X=527..950, Y=418)
    ctx.font = 'bold 17px "Courier Prime", "IBM Plex Mono", monospace';
    const deptVal = deptInput ? deptInput.value.toUpperCase() : "DEPT. 4 (SUB-REACTOR LABORATORY)";
    ctx.fillText(deptVal, 538, 410, 405);

    // D. CLEARANCE CHECKBOXES (A: 603, B: 680, C: 760, Y: 452)
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#c62828';
    ctx.font = 'bold 24px "Russo One", sans-serif';

    if (activeClearance === 'A') {
      ctx.fillText('X', 603, 452);
    } else if (activeClearance === 'B') {
      ctx.fillText('X', 680, 452);
    } else if (activeClearance === 'C') {
      ctx.fillText('X', 760, 452);

      // Classified Red Top Stamp for Level C
      ctx.save();
      ctx.translate(650, 160);
      ctx.rotate(-0.12);
      ctx.strokeStyle = 'rgba(183, 28, 28, 0.7)';
      ctx.fillStyle = 'rgba(183, 28, 28, 0.7)';
      ctx.lineWidth = 3;
      ctx.strokeRect(-125, -22, 250, 44);
      ctx.lineWidth = 1;
      ctx.strokeRect(-121, -18, 242, 36);

      ctx.font = 'bold 17px "Russo One", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('СОВЕРШЕННО СЕКРЕТНО', 0, 1);
      ctx.restore();
    }

    // E. ID NUMBER (Underline X=417..740, Y=518)
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#111312';
    ctx.font = 'bold 21px "Courier Prime", "IBM Plex Mono", monospace';
    const idVal = idNumInput ? idNumInput.value : "86-Y-7102";
    ctx.fillText(idVal, 428, 511, 305);

    // F. SIGNATURE (Underline X=530..750, Y=589)
    ctx.font = 'italic 28px "Special Elite", "Courier Prime", cursive';
    ctx.fillStyle = '#152542';
    const sigVal = sigInput ? sigInput.value : "A. Yadro";
    ctx.fillText(sigVal, 548, 582, 200);
  }

  baseCardImg.onload = () => {
    document.fonts.ready.then(() => drawIdCard());
  };
  defaultPhotoImg.onload = () => {
    drawIdCard();
  };

  [nameInput, posInput, deptInput, idNumInput, sigInput].forEach(inp => {
    if (inp) inp.addEventListener('input', drawIdCard);
  });

  if (btnDownloadId && idCanvas) {
    btnDownloadId.addEventListener('click', () => {
      const link = document.createElement('a');
      const cleanName = (nameInput.value || 'Soviet_ID').replace(/[^a-zA-Z0-9]/g, '_');
      link.download = `Project_Yadro_Badge_${cleanName}.png`;
      link.href = idCanvas.toDataURL('image/png');
      link.click();
      audio.playSingleClick(0.4);
      showToast('✓ Soviet Research ID Card Generated & Downloaded');
    });
  }

  // ------------------------------------------------------------------------
  // 6.5. Forensic Comparison Scanner (1985 Archival vs Dec 2000 Salvaged Poster)
  // ------------------------------------------------------------------------
  const posterCompare = document.getElementById('posterCompare');
  const wornLayer = document.getElementById('wornLayer');
  const compareHandle = document.getElementById('compareHandle');

  if (posterCompare && wornLayer && compareHandle) {
    let isDragging = false;

    function applySliderPercent(pos) {
      const clamped = Math.max(0, Math.min(100, pos));
      wornLayer.style.clipPath = `inset(0 ${100 - clamped}% 0 0)`;
      const handlePos = Math.max(7, Math.min(93, clamped));
      compareHandle.style.left = `${handlePos}%`;
      posterCompare.setAttribute('aria-valuenow', Math.round(clamped));
    }

    function updateSlider(clientX) {
      const rect = posterCompare.getBoundingClientRect();
      if (!rect.width) return;
      const rawPos = ((clientX - rect.left) / rect.width) * 100;
      applySliderPercent(rawPos);
    }

    posterCompare.addEventListener('mousedown', e => {
      isDragging = true;
      updateSlider(e.clientX);
    });

    window.addEventListener('mouseup', () => {
      isDragging = false;
    });

    window.addEventListener('mousemove', e => {
      if (isDragging) {
        updateSlider(e.clientX);
      }
    });

    posterCompare.addEventListener('touchstart', e => {
      if (e.touches && e.touches[0]) {
        isDragging = true;
        updateSlider(e.touches[0].clientX);
      }
    }, { passive: true });

    window.addEventListener('touchend', () => {
      isDragging = false;
    });

    window.addEventListener('touchmove', e => {
      if (isDragging && e.touches && e.touches[0]) {
        updateSlider(e.touches[0].clientX);
      }
    }, { passive: true });

    posterCompare.addEventListener('keydown', e => {
      let currentVal = parseInt(posterCompare.getAttribute('aria-valuenow'), 10);
      if (isNaN(currentVal)) currentVal = 50;

      if (e.key === 'ArrowLeft') {
        applySliderPercent(currentVal - 5);
        e.preventDefault();
      } else if (e.key === 'ArrowRight') {
        applySliderPercent(currentVal + 5);
        e.preventDefault();
      } else if (e.key === 'Home') {
        applySliderPercent(0);
        e.preventDefault();
      } else if (e.key === 'End') {
        applySliderPercent(100);
        e.preventDefault();
      }
    });
  }

  // ------------------------------------------------------------------------
  // 7. Native Dialog Modals & Delegated Lightbox (Modern Web Guidance Compliant)
  // ------------------------------------------------------------------------
  const storyDialog = document.getElementById('storyDialog');
  const btnOpenStory = document.getElementById('btnOpenStory');
  const btnOpenStoryCard = document.getElementById('btnOpenStoryCard');
  const lightboxDialog = document.getElementById('lightboxDialog');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxCaption = document.getElementById('lightboxCaption');
  const lightboxDownloadBtn = document.getElementById('lightboxDownloadBtn');
  const lightboxDownloadText = document.getElementById('lightboxDownloadText');

  function openNotebookModal() {
    if (storyDialog) {
      storyDialog.showModal();
      audio.playSingleClick(0.2);
    }
  }

  if (btnOpenStory) btnOpenStory.addEventListener('click', openNotebookModal);
  if (btnOpenStoryCard) btnOpenStoryCard.addEventListener('click', openNotebookModal);

  // Interactive Notebook Page & Handwritten PDF Tab Switcher
  const notebookTabBtns = document.querySelectorAll('.notebook-tab-btn');
  const notebookPagesStage = document.getElementById('notebookPagesStage');
  const notebookSheets = document.querySelectorAll('[data-nb-page]');
  const notebookPdfPanel = document.getElementById('notebookPdfPanel');
  const notebookPdfFrame = document.getElementById('notebookPdfFrame');

  notebookTabBtns.forEach(tabBtn => {
    tabBtn.addEventListener('click', () => {
      const target = tabBtn.dataset.nbTab;
      notebookTabBtns.forEach(b => {
        const isActive = b === tabBtn;
        b.classList.toggle('active', isActive);
        b.setAttribute('aria-selected', String(isActive));
      });

      if (target === 'pdf') {
        if (notebookPagesStage) notebookPagesStage.style.display = 'none';
        if (notebookPdfPanel) notebookPdfPanel.hidden = false;
        if (notebookPdfFrame && !notebookPdfFrame.getAttribute('src') && notebookPdfFrame.dataset.src) {
          notebookPdfFrame.src = notebookPdfFrame.dataset.src;
        }
      } else {
        if (notebookPdfPanel) notebookPdfPanel.hidden = true;
        if (notebookPagesStage) notebookPagesStage.style.display = 'flex';
        notebookSheets.forEach(sheet => {
          sheet.hidden = (target !== 'all' && sheet.dataset.nbPage !== target);
        });
      }
      audio.playSingleClick(0.2);
    });
  });

  function openLightboxForElement(el) {
    const src = el.dataset.src;
    const caption = el.dataset.caption;
    if (lightboxDialog && lightboxImg && src) {
      lightboxImg.src = src;
      lightboxCaption.textContent = caption || '';
      if (lightboxDownloadBtn) {
        lightboxDownloadBtn.href = src;
        const filename = src.split('/').pop();
        lightboxDownloadBtn.download = filename;
        if (lightboxDownloadText) {
          lightboxDownloadText.textContent = `DOWNLOAD (${filename})`;
        }
      }
      lightboxDialog.showModal();
    }
  }

  // Event delegation supports both static and dynamically rendered lightbox triggers
  document.addEventListener('click', e => {
    const trigger = e.target.closest('.open-lightbox');
    if (trigger) {
      openLightboxForElement(trigger);
    }
  });

  document.addEventListener('keydown', e => {
    const trigger = e.target.closest('.open-lightbox[role="button"]');
    if (!trigger) return;
    if (e.key === 'Enter') {
      e.preventDefault();
      openLightboxForElement(trigger);
    } else if (e.key === ' ') {
      e.preventDefault();
    }
  });

  document.addEventListener('keyup', e => {
    const trigger = e.target.closest('.open-lightbox[role="button"]');
    if (trigger && e.key === ' ') {
      e.preventDefault();
      openLightboxForElement(trigger);
    }
  });

  // Light dismiss for dialogs (click outside)
  [storyDialog, lightboxDialog].forEach(dialog => {
    if (!dialog) return;
    dialog.addEventListener('click', e => {
      const rect = dialog.getBoundingClientRect();
      const isInDialog = (
        rect.top <= e.clientY &&
        e.clientY <= rect.top + rect.height &&
        rect.left <= e.clientX &&
        e.clientX <= rect.left + rect.width
      );
      if (!isInDialog) {
        dialog.close();
      }
    });
  });

  // Initial draw
  document.fonts.ready.then(() => drawIdCard());
});
