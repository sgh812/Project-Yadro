/**
 * Project Yadro - Main Application Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  const audio = window.yadroAudio;

  // ------------------------------------------------------------------------
  // 1. Audio & Classification Controls
  // ------------------------------------------------------------------------
  const btnAudioToggle = document.getElementById('btnAudioToggle');
  const btnModeToggle = document.getElementById('btnModeToggle');

  if (btnAudioToggle) {
    btnAudioToggle.addEventListener('click', () => {
      const isUnmuted = audio.toggleMute();
      btnAudioToggle.classList.toggle('active', isUnmuted);
      const label = btnAudioToggle.querySelector('.btn-label');
      if (label) {
        label.textContent = isUnmuted ? 'GEIGER AUDIO: ACTIVE' : 'GEIGER AUDIO: MUTED';
      }
    });
  }

  // Clearance Mode Switch (In-Universe vs Academic Dossier)
  if (btnModeToggle) {
    btnModeToggle.addEventListener('click', () => {
      document.body.classList.toggle('academic-mode');
      const isAcademic = document.body.classList.contains('academic-mode');
      btnModeToggle.textContent = isAcademic ? 'SWITCH: IN-UNIVERSE ARCHIVE' : 'SWITCH: ACADEMIC DOSSIER';
      if (isAcademic) {
        document.getElementById('academic').scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  // Theme Switcher (Dark Bunker vs Light Manila Dossier)
  const btnThemeToggle = document.getElementById('btnThemeToggle');
  const storedTheme = localStorage.getItem('yadro_theme');

  function updateThemeUI(isLight) {
    if (!btnThemeToggle) return;
    const icon = btnThemeToggle.querySelector('.theme-icon');
    const label = btnThemeToggle.querySelector('.theme-label');
    if (isLight) {
      document.body.classList.add('light-mode');
      if (icon) icon.textContent = '🌙';
      if (label) label.textContent = 'DARK BUNKER';
    } else {
      document.body.classList.remove('light-mode');
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

  // Irradiated elements trigger higher Geiger frequency
  document.querySelectorAll('.irradiated').forEach(el => {
    el.addEventListener('mouseenter', () => {
      audio.setGeigerIntensity('lethal');
    });
    el.addEventListener('mouseleave', () => {
      audio.setGeigerIntensity('ambient');
    });
  });

  // ------------------------------------------------------------------------
  // 2. Reel-to-Reel Tape Deck & Transcripts
  // ------------------------------------------------------------------------
  const reelLeft = document.getElementById('reelLeft');
  const reelRight = document.getElementById('reelRight');
  const vuNeedleLeft = document.getElementById('vuNeedleLeft');
  const vuNeedleRight = document.getElementById('vuNeedleRight');
  const tapeCounter = document.getElementById('tapeCounter');
  const tapeScrubber = document.getElementById('tapeScrubber');
  const btnTapePlay = document.getElementById('btnTapePlay');
  const btnTapeStop = document.getElementById('btnTapeStop');
  const btnTapePrev = document.getElementById('btnTapePrev');
  const btnTapeNext = document.getElementById('btnTapeNext');

  let vuInterval = null;

  function updateVU() {
    if (audio.isPlayingTape) {
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

    if (tapeCounter) {
      const mins = Math.floor(state.progress / 60).toString().padStart(2, '0');
      const secs = (state.progress % 60).toString().padStart(2, '0');
      tapeCounter.textContent = `${mins}:${secs}`;
    }
    const tapeDurationDisplay = document.getElementById('tapeDurationDisplay');
    if (tapeDurationDisplay && state.duration) {
      const dmins = Math.floor(state.duration / 60).toString().padStart(2, '0');
      const dsecs = (state.duration % 60).toString().padStart(2, '0');
      tapeDurationDisplay.textContent = `${dmins}:${dsecs}`;
    }
    if (tapeScrubber) {
      if (state.duration) tapeScrubber.max = state.duration;
      tapeScrubber.value = state.progress;
    }

    highlightActiveTranscript(state.progress);
  });

  const customAudioInput = document.getElementById('customAudioInput');
  if (customAudioInput) {
    customAudioInput.addEventListener('change', e => {
      const file = e.target.files[0];
      if (file) {
        audio.loadCustomAudio(activeTapeId, file);
        showToast(`✓ Loaded ${file.name} for Tape 0${activeTapeId}`);
        audio.playTape(activeTapeId);
      }
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
      audio.seekTape(Math.min(185, audio.tapeProgress + 15));
    });
  }

  if (tapeScrubber) {
    tapeScrubber.addEventListener('input', e => {
      audio.seekTape(parseInt(e.target.value, 10));
    });
  }

  // Tape Tab Switching
  let activeTapeId = 1;
  const tapeTabs = document.querySelectorAll('.tape-tab-btn');
  const tapePanels = document.querySelectorAll('.tape-panel-content');

  tapeTabs.forEach(btn => {
    btn.addEventListener('click', () => {
      tapeTabs.forEach(b => b.classList.remove('active'));
      tapePanels.forEach(p => p.style.display = 'none');
      btn.classList.add('active');

      activeTapeId = parseInt(btn.dataset.tape, 10);
      const targetPanel = document.getElementById(`tapePanel${activeTapeId}`);
      if (targetPanel) targetPanel.style.display = 'block';

      audio.pauseTape();
      audio.seekTape(0);
    });
  });

  // Transcript Line Clicking
  document.querySelectorAll('.transcript-line').forEach(line => {
    line.addEventListener('click', () => {
      const timeSec = parseInt(line.dataset.time, 10) || 0;
      audio.seekTape(timeSec);
      if (!audio.isPlayingTape) audio.playTape(activeTapeId);
    });
  });

  function highlightActiveTranscript(currentSec) {
    const activeLines = document.querySelectorAll(`#tapePanel${activeTapeId} .transcript-line`);
    activeLines.forEach(line => {
      const lineTime = parseInt(line.dataset.time, 10) || 0;
      const nextTime = parseInt(line.dataset.endtime, 10) || 999;
      if (currentSec >= lineTime && currentSec < nextTime) {
        line.style.background = 'rgba(57, 255, 20, 0.15)';
        line.style.borderLeft = '3px solid var(--phosphor-green)';
      } else {
        line.style.background = 'transparent';
        line.style.borderLeft = 'none';
      }
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
      citation: "Science Museum (2014) 'The first woman in space', Science Museum Blog."
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
      type: "SPECULATIVE SPECULATION",
      badgeClass: "type-fiction",
      realHistory: "Real History: The Soviet Union dissolved in December 1991 due to economic strain, political reform, and geopolitical collapse.",
      divergence: "Mysterious localized radiation spikes and structural disintegration occur across Soviet command facilities. Leaked KGB cables debate whether Yadro's vengeance directly caused the collapse.",
      citation: "Transmedia Narrative Mystery: Explored in Episode 2 of The Chernobyl Tapes."
    }
  };

  const timelineNodes = document.querySelectorAll('.timeline-node');
  const detailBox = document.getElementById('timelineDetailBox');

  timelineNodes.forEach(node => {
    node.addEventListener('click', () => {
      timelineNodes.forEach(n => n.classList.remove('active'));
      node.classList.add('active');

      const key = node.dataset.key;
      const data = timelineData[key];
      if (data && detailBox) {
        detailBox.innerHTML = `
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
            <h4 style="font-family:var(--font-display); font-size:1.3rem; color:#fff;">${data.year} // ${data.title}</h4>
            <span class="timeline-type-badge ${data.badgeClass}">${data.type}</span>
          </div>
          <p style="color:#64b5f6; font-size:0.86rem; margin-bottom:8px;"><strong>${data.realHistory}</strong></p>
          <p style="color:#c9d6cf; font-size:0.9rem; line-height:1.6; margin-bottom:12px;">${data.divergence}</p>
          <p style="color:var(--text-muted); font-size:0.75rem; font-style:italic;">Academic Reference: ${data.citation}</p>
        `;
      }
    });
  });

  // ------------------------------------------------------------------------
  // 4. Redaction Reveal & Glitch Micro-Interactions
  // ------------------------------------------------------------------------
  document.querySelectorAll('.redacted').forEach(item => {
    item.addEventListener('click', () => {
      item.classList.toggle('revealed');
      audio.playSingleClick(0.2);
    });
  });

  // ------------------------------------------------------------------------
  // 5. Forensic Theory Poll & Investigator Notes
  // ------------------------------------------------------------------------
  const pollButtons = document.querySelectorAll('.poll-option-btn');
  let pollData = JSON.parse(localStorage.getItem('yadro_poll_data')) || {
    opt1: 42,
    opt2: 31,
    opt3: 27,
    voted: false
  };

  function renderPoll() {
    const total = pollData.opt1 + pollData.opt2 + pollData.opt3;
    pollButtons.forEach(btn => {
      const opt = btn.dataset.option;
      const count = pollData[opt];
      const pct = Math.round((count / total) * 100);
      const fill = btn.querySelector('.poll-fill');
      const pctLabel = btn.querySelector('.poll-pct');
      if (fill) fill.style.width = `${pct}%`;
      if (pctLabel) pctLabel.textContent = `${pct}% (${count} votes)`;

      if (pollData.voted === opt) {
        btn.classList.add('selected');
      } else {
        btn.classList.remove('selected');
      }
    });
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
      }
    });
  });

  // Memo Note Submission
  const memoInput = document.getElementById('memoInput');
  const btnPinMemo = document.getElementById('btnPinMemo');
  const memoList = document.getElementById('pinnedMemosList');

  const defaultMemos = [
    "NOTE #14: Semipalatinsk test site registered 14.2 R/h spike with no active detonation.",
    "NOTE #22: Yadro's family was moved to Voronezh in Jan 1986. No record after April.",
    "NOTE #31: Reactor 4 graphite core was melted from BELOW, not above."
  ];

  let storedMemos = JSON.parse(localStorage.getItem('yadro_memos')) || defaultMemos;

  function renderMemos() {
    if (!memoList) return;
    memoList.innerHTML = storedMemos.map(m => `<div class="pinned-memo-tag">📌 ${m}</div>`).join('');
  }
  renderMemos();

  if (btnPinMemo && memoInput) {
    btnPinMemo.addEventListener('click', () => {
      const val = memoInput.value.trim();
      if (val) {
        storedMemos.push(`EVALUATOR NOTE: ${val}`);
        localStorage.setItem('yadro_memos', JSON.stringify(storedMemos));
        renderMemos();
        memoInput.value = '';
        audio.playSingleClick(0.3);
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
  const photoUpload = document.getElementById('idPhotoUpload');
  const clearancePills = document.querySelectorAll('.clearance-pill, .clearance-badge-card');
  const presetButtons = document.querySelectorAll('.btn-preset');

  let baseCardImg = new Image();
  baseCardImg.src = 'assets/id-card.jpg';

  let defaultPhotoImg = new Image();
  defaultPhotoImg.src = 'assets/yadro-badge-photo.jpg';

  let userUploadedPhoto = null;
  let activeClearance = 'C';

  // Preset Configurations
  const presets = {
    yadro: {
      name: "Dr. Anatoly Yadro",
      position: "Lead Nuclear Physicist",
      department: "Dept. 4 (Sub-Reactor Lab)",
      clearance: "C",
      idNum: "86-Y-7102",
      signature: "A. Yadro",
      useDefaultPhoto: true
    },
    voronin: {
      name: "Major Oleg Voronin",
      position: "Senior Directorate Officer",
      department: "KGB Directorate S",
      clearance: "C",
      idNum: "83-K-0914",
      signature: "O. Voronin",
      useDefaultPhoto: true
    },
    legasov: {
      name: "Dr. Boris Legasov",
      position: "Chief Radiation Chemist",
      department: "Kurchatov Institute",
      clearance: "B",
      idNum: "86-A-4401",
      signature: "B. Legasov",
      useDefaultPhoto: true
    },
    evaluator: {
      name: "BCM 216 Evaluator",
      position: "External Evaluator",
      department: "Univ. Assessment Panel",
      clearance: "A",
      idNum: "26-EVAL-001",
      signature: "Evaluator",
      useDefaultPhoto: true
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

    if (data.useDefaultPhoto) {
      userUploadedPhoto = null;
    }

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

  // Clearance badge/pill selection
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
    const activePhoto = userUploadedPhoto || (defaultPhotoImg.complete && defaultPhotoImg.naturalWidth > 0 ? defaultPhotoImg : null);

    ctx.save();
    ctx.beginPath();
    ctx.rect(52, 288, 222, 318);
    ctx.clip();

    if (activePhoto) {
      ctx.drawImage(activePhoto, 52, 288, 222, 318);
      // Sepia / Soviet grain overlay
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
    // Positioned at X=250, Y=540 overlapping the photo and document line
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

    // 4. Fill in Document Fields — Pixel-accurate to Underlines!
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#111312';

    // A. NAME (Underline starts at X=436, Y=319)
    ctx.font = 'bold 21px "Courier Prime", "IBM Plex Mono", monospace';
    const nameVal = nameInput ? nameInput.value.toUpperCase() : "DR. ANATOLY YADRO";
    ctx.fillText(nameVal, 448, 311);

    // B. POSITION (Underline starts at X=548, Y=368)
    ctx.font = 'bold 18px "Courier Prime", "IBM Plex Mono", monospace';
    const posVal = posInput ? posInput.value.toUpperCase() : "LEAD NUCLEAR PHYSICIST";
    ctx.fillText(posVal, 558, 360);

    // C. DEPARTMENT (Underline starts at X=527, Y=418)
    ctx.font = 'bold 17px "Courier Prime", "IBM Plex Mono", monospace';
    const deptVal = deptInput ? deptInput.value.toUpperCase() : "DEPT. 4 (SUB-REACTOR LABORATORY)";
    ctx.fillText(deptVal, 538, 410);

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

    // E. ID NUMBER (Underline starts at X=417, Y=518)
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#111312';
    ctx.font = 'bold 21px "Courier Prime", "IBM Plex Mono", monospace';
    const idVal = idNumInput ? idNumInput.value : "86-Y-7102";
    ctx.fillText(idVal, 428, 511);

    // F. SIGNATURE (Underline starts at X=530, Y=589)
    ctx.font = 'italic 28px "Special Elite", "Courier Prime", cursive';
    ctx.fillStyle = '#152542'; // Authentic vintage dark blue-black fountain pen ink
    const sigVal = sigInput ? sigInput.value : "A. Yadro";
    ctx.fillText(sigVal, 548, 582);
  }

  // Ensure fonts and images are ready before rendering
  baseCardImg.onload = () => {
    document.fonts.ready.then(() => drawIdCard());
  };
  defaultPhotoImg.onload = () => {
    drawIdCard();
  };

  [nameInput, posInput, deptInput, idNumInput, sigInput].forEach(inp => {
    if (inp) inp.addEventListener('input', drawIdCard);
  });

  if (photoUpload) {
    photoUpload.addEventListener('change', e => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = evt => {
          userUploadedPhoto = new Image();
          userUploadedPhoto.onload = drawIdCard;
          userUploadedPhoto.src = evt.target.result;
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // Toast notification helper
  function showToast(msg) {
    let toast = document.getElementById('badgeToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'badgeToast';
      toast.className = 'badge-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3200);
  }

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
  // 7. Native Dialog Modals (Modern Web Guidance Compliant)
  // ------------------------------------------------------------------------
  const storyDialog = document.getElementById('storyDialog');
  const btnOpenStory = document.getElementById('btnOpenStory');
  const lightboxDialog = document.getElementById('lightboxDialog');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxCaption = document.getElementById('lightboxCaption');

  if (btnOpenStory && storyDialog) {
    btnOpenStory.addEventListener('click', () => {
      storyDialog.showModal();
    });
  }

  // Lightbox for Artefacts
  document.querySelectorAll('.open-lightbox').forEach(el => {
    el.addEventListener('click', () => {
      const src = el.dataset.src;
      const caption = el.dataset.caption;
      if (lightboxDialog && lightboxImg) {
        lightboxImg.src = src;
        lightboxCaption.textContent = caption || '';
        lightboxDialog.showModal();
      }
    });
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
