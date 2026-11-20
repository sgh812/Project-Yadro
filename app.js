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

  btnAudioToggle.addEventListener('click', () => {
    const isUnmuted = audio.toggleMute();
    btnAudioToggle.classList.toggle('active', isUnmuted);
    const label = btnAudioToggle.querySelector('.btn-label');
    if (label) {
      label.textContent = isUnmuted ? 'GEIGER AUDIO: ACTIVE' : 'GEIGER AUDIO: MUTED';
    }
  });

  // Clearance Mode Switch (In-Universe vs Academic Dossier)
  btnModeToggle.addEventListener('click', () => {
    document.body.classList.toggle('academic-mode');
    const isAcademic = document.body.classList.contains('academic-mode');
    btnModeToggle.textContent = isAcademic ? 'SWITCH: IN-UNIVERSE ARCHIVE' : 'SWITCH: ACADEMIC DOSSIER';
    if (isAcademic) {
      document.getElementById('academic').scrollIntoView({ behavior: 'smooth' });
    }
  });

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
      vuNeedleLeft.style.transform = `rotate(${angleL}deg)`;
      vuNeedleRight.style.transform = `rotate(${angleR}deg)`;
    } else {
      vuNeedleLeft.style.transform = 'rotate(-35deg)';
      vuNeedleRight.style.transform = 'rotate(-35deg)';
    }
  }

  audio.onUpdate(state => {
    if (state.isPlaying) {
      reelLeft.classList.add('spinning-reel');
      reelRight.classList.add('spinning-reel');
      btnTapePlay.textContent = '❚❚ PAUSE';
      btnTapePlay.classList.add('active');
      if (!vuInterval) vuInterval = setInterval(updateVU, 90);
    } else {
      reelLeft.classList.remove('spinning-reel');
      reelRight.classList.remove('spinning-reel');
      btnTapePlay.textContent = '▶ PLAY';
      btnTapePlay.classList.remove('active');
      if (vuInterval) {
        clearInterval(vuInterval);
        vuInterval = null;
        updateVU();
      }
    }

    // Format mm:ss
    const mins = Math.floor(state.progress / 60).toString().padStart(2, '0');
    const secs = (state.progress % 60).toString().padStart(2, '0');
    tapeCounter.textContent = `${mins}:${secs}`;
    tapeScrubber.value = state.progress;

    // Highlight active transcript line
    highlightActiveTranscript(state.progress);
  });

  btnTapePlay.addEventListener('click', () => {
    if (audio.isPlayingTape) {
      audio.pauseTape();
    } else {
      audio.playTape(activeTapeId);
    }
  });

  btnTapeStop.addEventListener('click', () => {
    audio.pauseTape();
    audio.seekTape(0);
  });

  btnTapePrev.addEventListener('click', () => {
    audio.seekTape(Math.max(0, audio.tapeProgress - 15));
  });

  btnTapeNext.addEventListener('click', () => {
    audio.seekTape(Math.min(185, audio.tapeProgress + 15));
  });

  tapeScrubber.addEventListener('input', e => {
    audio.seekTape(parseInt(e.target.value, 10));
  });

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
  const clearanceRadios = document.querySelectorAll('input[name="clearanceLevel"]');
  const btnDownloadId = document.getElementById('btnDownloadId');
  const photoUpload = document.getElementById('idPhotoUpload');

  let baseCardImg = new Image();
  baseCardImg.src = 'assets/id-card.jpg';

  let userPhotoImg = null;

  function drawIdCard() {
    if (!idCanvas) return;
    const ctx = idCanvas.getContext('2d');
    const width = 1024;
    const height = 682;
    idCanvas.width = width;
    idCanvas.height = height;

    // 1. Draw original template
    if (baseCardImg.complete && baseCardImg.naturalWidth > 0) {
      ctx.drawImage(baseCardImg, 0, 0, width, height);
    } else {
      ctx.fillStyle = '#ece5d5';
      ctx.fillRect(0, 0, width, height);
    }

    // 2. Draw Photo in photo frame [X:48, Y:285, W:230, H:320]
    if (userPhotoImg) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(52, 288, 222, 314);
      ctx.clip();
      ctx.drawImage(userPhotoImg, 52, 288, 222, 314);
      // Sepia tone / grain overlay
      ctx.fillStyle = 'rgba(70, 50, 30, 0.2)';
      ctx.fillRect(52, 288, 222, 314);
      ctx.restore();
    } else {
      // Default placeholder silhouette
      ctx.fillStyle = '#d5ccb8';
      ctx.fillRect(52, 288, 222, 314);
      ctx.fillStyle = '#8c7d6b';
      ctx.font = '16px "Courier Prime", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('[ ФОТО / PHOTO ]', 163, 450);
    }

    // 3. Draw Form Fields with Typewriter font
    ctx.textAlign = 'left';
    ctx.fillStyle = '#111111';
    ctx.font = 'bold 22px "Courier Prime", monospace';

    // Name
    const nameVal = nameInput ? nameInput.value.toUpperCase() : "DR. ANATOLY YADRO";
    ctx.fillText(nameVal, 420, 316);

    // Position
    const posVal = posInput ? posInput.value.toUpperCase() : "CHIEF NUCLEAR PHYSICIST";
    ctx.fillText(posVal, 540, 365);

    // Department
    const deptVal = deptInput ? deptInput.value.toUpperCase() : "DEPARTMENT 4 (SUB-REACTOR LAB)";
    ctx.fillText(deptVal, 530, 418);

    // Clearance Checkboxes: Box A ~ 585, Box B ~ 660, Box C ~ 738, Y ~ 460
    let selectedLevel = 'A';
    clearanceRadios.forEach(r => {
      if (r.checked) selectedLevel = r.value;
    });

    ctx.font = 'bold 28px "Russo One", sans-serif';
    ctx.fillStyle = '#b71c1c';
    if (selectedLevel === 'A') ctx.fillText('X', 585, 467);
    if (selectedLevel === 'B') ctx.fillText('X', 660, 467);
    if (selectedLevel === 'C') {
      ctx.fillText('X', 738, 467);
      // Extra Classified Watermark for Level C
      ctx.save();
      ctx.translate(500, 200);
      ctx.rotate(-0.15);
      ctx.strokeStyle = 'rgba(183, 28, 28, 0.4)';
      ctx.lineWidth = 4;
      ctx.strokeRect(-120, -30, 240, 60);
      ctx.fillStyle = 'rgba(183, 28, 28, 0.4)';
      ctx.font = 'bold 26px "Russo One", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('СОВ. СЕКРЕТНО', 0, 10);
      ctx.restore();
    }

    // ID Number
    ctx.fillStyle = '#111111';
    ctx.font = 'bold 22px "Courier Prime", monospace';
    const idVal = idNumInput ? idNumInput.value : "86-Y-7102";
    ctx.fillText(idVal, 420, 518);

    // Signature
    const sigVal = sigInput ? sigInput.value : "A. Yadro";
    ctx.font = 'italic 26px "Special Elite", cursive';
    ctx.fillStyle = '#102040';
    ctx.fillText(sigVal, 540, 588);
  }

  baseCardImg.onload = drawIdCard;

  [nameInput, posInput, deptInput, idNumInput, sigInput].forEach(inp => {
    if (inp) inp.addEventListener('input', drawIdCard);
  });
  clearanceRadios.forEach(r => r.addEventListener('change', drawIdCard));

  if (photoUpload) {
    photoUpload.addEventListener('change', e => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = evt => {
          userPhotoImg = new Image();
          userPhotoImg.onload = drawIdCard;
          userPhotoImg.src = evt.target.result;
        };
        reader.readAsDataURL(file);
      }
    });
  }

  if (btnDownloadId) {
    btnDownloadId.addEventListener('click', () => {
      const link = document.createElement('a');
      link.download = `Project-Yadro-Badge-${nameInput.value.replace(/\s+/g, '_') || 'Official'}.png`;
      link.href = idCanvas.toDataURL('image/png');
      link.click();
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
});
