(() => {
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));
  // -----------------------------
  // Demo mode tabs (Chat vs Voice)
  // -----------------------------
  const preferredDemo = $("#preferredDemo");
  const tabChat = $("#tabChat");
  const tabVoice = $("#tabVoice");
  const panelChat = $("#panelChat");
  const panelVoice = $("#panelVoice");
  const tabs = $$(".demo-tabs [role='tab']");

  function setDemoMode(mode, opts={}) {
    const kind = (mode === "voice") ? "voice" : "chat";
    const isVoice = kind === "voice";

    if (tabChat) {
      tabChat.classList.toggle("active", !isVoice);
      tabChat.setAttribute("aria-selected", String(!isVoice));
      tabChat.tabIndex = !isVoice ? 0 : -1;
    }
    if (tabVoice) {
      tabVoice.classList.toggle("active", isVoice);
      tabVoice.setAttribute("aria-selected", String(isVoice));
      tabVoice.tabIndex = isVoice ? 0 : -1;
    }

    if (panelChat) panelChat.hidden = isVoice;
    if (panelVoice) panelVoice.hidden = !isVoice;

    if (preferredDemo) preferredDemo.value = kind;

    try { localStorage.setItem("out_demo_preference", kind); } catch {}

    if (opts.focus) {
      (isVoice ? tabVoice : tabChat)?.focus();
    }
  }

  // Restore selection
  try {
    const saved = localStorage.getItem("out_demo_preference");
    setDemoMode(saved === "voice" ? "voice" : "chat");
  } catch {
    setDemoMode("chat");
  }

  tabs.forEach((btn) => {
    btn.addEventListener("click", () => setDemoMode(btn.dataset.mode || "chat"));

    // basic keyboard support for tabs
    btn.addEventListener("keydown", (e) => {
      const order = [tabChat, tabVoice].filter(Boolean);
      const idx = order.indexOf(document.activeElement);

      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault();
        const next = (e.key === "ArrowRight")
          ? order[(idx + 1) % order.length]
          : order[(idx - 1 + order.length) % order.length];
        next?.focus();
      }

      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setDemoMode(btn.dataset.mode || "chat");
      }
    });
  });


  // -----------------------------
  // Voice preview UI (mocked transcripts + play)
  // -----------------------------
  const voiceUI = $("[data-voice-ui]");
  const voiceScenarioBtns = $$("[data-voice-ui] [data-voice-scenario]");
  const voiceTranscript = $("[data-voice-ui] [data-voice-transcript]");
  const voicePlayBtn = $("[data-voice-ui] [data-voice-play]");
  const voiceProgress = $("[data-voice-ui] [data-voice-progress]");
  const voiceTime = $("[data-voice-ui] [data-voice-time]");

  const VOICE_SCENARIOS = {
    cash: {
      label: "Cash offer agent",
      durationSec: 14,
      transcript: [
        { who: "YoYo", text: "Hi — looking for a cash offer? What vehicle are you selling?" },
        { who: "Seller", text: "2022 Model Y Long Range." },
        { who: "YoYo", text: "Great. What’s the mileage and VIN?" },
        { who: "Seller", text: "38,200 miles. I can share the VIN once we get started." },
        { who: "YoYo", text: "No problem. Any accidents or major repairs? And how would you rate the condition?" },
        { who: "Seller", text: "No accidents. Good condition overall." },
        { who: "YoYo", text: "Perfect. If you’d like, upload a few photos (optional) and I’ll route this to the dealership with a summary so they can make an offer." }
      ]
    },
    shopping: {
      label: "Shopping agent",
      durationSec: 16,
      transcript: [
        { who: "YoYo", text: "Hi — what kind of car are you shopping for? EV or something else?" },
        { who: "Customer", text: "Luxury EV under $45k." },
        { who: "YoYo", text: "Got it. SUV or sedan — and any must-haves (AWD, range, color)?" },
        { who: "Customer", text: "SUV, AWD, 300+ mile range." },
        { who: "YoYo", text: "Great. I can narrow options, compare trims, and explain features on the exact car you pick." },
        { who: "Customer", text: "Can you show me the best matches in stock?" },
        { who: "YoYo", text: "Absolutely. I’ll recommend the top matches and capture your contact info so we can set up a test drive or take a deposit if you’re ready." }
      ]
    }
  };

  let currentVoiceScenario = "cash";
  let voiceTimer = null;
  let voicePlaying = false;
  let voiceStart = 0;
  let voiceDurationMs = VOICE_SCENARIOS.cash.durationSec * 1000;

  function fmtTime(ms) {
    const s = Math.max(0, Math.floor(ms / 1000));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m}:${String(r).padStart(2, "0")}`;
  }

  function renderVoiceTranscript(key) {
    if (!voiceTranscript) return;
    const data = VOICE_SCENARIOS[key] || VOICE_SCENARIOS.cash;
    voiceTranscript.innerHTML = "";
    data.transcript.forEach((line) => {
      const row = document.createElement("div");
      row.className = "vt-row";

      const orb = document.createElement("div");
      orb.className = "vt-orb" + (line.who === "YoYo" ? " out" : " user");

      const body = document.createElement("div");
      body.className = "vt-body";

      const who = document.createElement("div");
      who.className = "vt-who";
      who.textContent = line.who;

      const text = document.createElement("div");
      text.className = "vt-text";
      text.textContent = line.text;

      body.appendChild(who);
      body.appendChild(text);

      row.appendChild(orb);
      row.appendChild(body);
      voiceTranscript.appendChild(row);
    });
  }

  function setVoiceScenario(key) {
    const k = (key in VOICE_SCENARIOS) ? key : "cash";
    currentVoiceScenario = k;
    voiceDurationMs = (VOICE_SCENARIOS[k].durationSec || 14) * 1000;

    voiceScenarioBtns.forEach((btn) => {
      const active = (btn.dataset.voiceScenario === k);
      btn.classList.toggle("active", active);
      btn.setAttribute("aria-selected", active ? "true" : "false");
    });

    // reset playback when switching
    stopVoicePreview(true);
    renderVoiceTranscript(k);

    try { localStorage.setItem("out_voice_scenario", k); } catch {}
  }

  function setProgress(pct, msElapsed) {
    if (voiceProgress) voiceProgress.style.width = `${Math.max(0, Math.min(100, pct))}%`;
    if (voiceTime) voiceTime.textContent = fmtTime(msElapsed);
  }

  function stopVoicePreview(silent=false) {
    if (voiceTimer) window.clearInterval(voiceTimer);
    voiceTimer = null;
    voicePlaying = false;
    if (voicePlayBtn) voicePlayBtn.classList.remove("is-playing");
    setProgress(0, 0);
    if (!silent && voicePlayBtn) {
      // quick tap feedback only; nothing else
    }
  }

  function startVoicePreview() {
    stopVoicePreview(true);
    voicePlaying = true;
    voiceStart = Date.now();
    if (voicePlayBtn) voicePlayBtn.classList.add("is-playing");

    voiceTimer = window.setInterval(() => {
      const elapsed = Date.now() - voiceStart;
      const pct = (elapsed / voiceDurationMs) * 100;
      if (elapsed >= voiceDurationMs) {
        stopVoicePreview(true);
        return;
      }
      setProgress(pct, elapsed);
    }, 80);
  }

  // Wire events
  voiceScenarioBtns.forEach((btn) => {
    btn.addEventListener("click", () => setVoiceScenario(btn.dataset.voiceScenario));
  });

  voicePlayBtn?.addEventListener("click", () => {
    if (voicePlaying) stopVoicePreview(true);
    else startVoicePreview();
  });

  // Init
  if (voiceUI) {
    let saved = "cash";
    try { saved = localStorage.getItem("out_voice_scenario") || "cash"; } catch {}
    setVoiceScenario(saved);
  }

  // -----------------------------
  // Chat drawer (front-end preview)
  // -----------------------------

  const launcher = $("#launcher");
  const chatDrawer = $("#chatDrawer");
  const chatMessages = $("#chatMessages");
  const chatForm = $("#chatForm");
  const chatInput = $("#chatInput");
  const openChatButtons = $$("[data-open-chat]");
  const closeDrawerButtons = $$("[data-close-drawer]");

  function openChat() {
    if (!chatDrawer) return;
    setDemoMode("chat");
    chatDrawer.hidden = false;
    setTimeout(() => chatInput?.focus(), 50);
  }
  function closeChat() {
    if (!chatDrawer) return;
    chatDrawer.hidden = true;
  }

  launcher?.addEventListener("click", openChat);
  openChatButtons.forEach(btn => btn.addEventListener("click", openChat));
  closeDrawerButtons.forEach(btn => btn.addEventListener("click", closeChat));

  chatDrawer?.addEventListener("click", (e) => {
    // click outside? (not implemented — drawer is anchored)
  });

  function addMsg(text, who="ai") {
    if (!chatMessages) return;
    const div = document.createElement("div");
    div.className = `msg ${who}`;
    div.textContent = text;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  chatForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const val = (chatInput?.value || "").trim();
    if (!val) return;
    addMsg(val, "user");
    chatInput.value = "";

    // lightweight mocked response
    const response = mockChatResponse(val);
    setTimeout(() => addMsg(response, "ai"), 350);
  });

  function mockChatResponse(userText) {
    const t = userText.toLowerCase();
    if (t.includes("model y") && (t.includes("under") || t.includes("$"))) {
      return "Got it. What year range and mileage are you targeting? I can show in-stock options and estimate payments.";
    }
    if (t.includes("sell") && t.includes("tesla")) {
      return "Sure — I can help with that. What’s the VIN and mileage? Any notes on condition?";
    }
    if (t.includes("trade") || t.includes("trade-in")) {
      return "Yes — we can discuss trade-in. What are you trading in (year/make/model) and your rough mileage?";
    }
    if (t.includes("financ") || t.includes("payment")) {
      return "I can estimate payments. What’s your budget, credit range (optional), and down payment?";
    }
    return "Thanks — I can help. What model/year budget are you looking for, and do you want AWD or Long Range?";
  }

  // Close with Esc
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (chatDrawer && !chatDrawer.hidden) closeChat();
      if (voiceModal && !voiceModal.hidden) closeVoice();
    }
  });

  // -----------------------------
  // Voice demo modal (browser-only)
  // -----------------------------
  const openVoiceButtons = $$("[data-open-voice]");
  const voiceModal = $("#voiceModal");
  const closeVoiceButtons = $$("[data-close-voice]");
  const voiceStatus = $("#voiceStatus");
  const voiceLog = $("#voiceLog");
  const startVoiceBtn = $("#startVoiceBtn");
  const stopVoiceBtn = $("#stopVoiceBtn");
  const ttsToggle = $("#ttsToggle");
  const voiceTextForm = $("#voiceTextForm");
  const voiceTextInput = $("#voiceTextInput");

  let recognition = null;
  let recognizing = false;

  function setVoiceStatus(s) {
    if (voiceStatus) voiceStatus.textContent = s;
  }

  function appendVoiceLine(label, text) {
    if (!voiceLog) return;
    const p = document.createElement("p");
    p.style.margin = "0 0 10px";
    p.innerHTML = `<strong>${escapeHtml(label)}:</strong> ${escapeHtml(text)}`;
    voiceLog.appendChild(p);
    voiceLog.scrollTop = voiceLog.scrollHeight;
  }

  function speak(text) {
    try {
      if (!ttsToggle?.checked) return;
      if (!("speechSynthesis" in window)) return;
      const utter = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utter);
    } catch {}
  }

  function openVoice() {
    if (!voiceModal) return;
    voiceModal.hidden = false;
    // default selection
    setDemoMode("voice");
  }

  function closeVoice() {
    if (!voiceModal) return;
    voiceModal.hidden = true;
    stopRecognition();
  }

  openVoiceButtons.forEach(btn => btn.addEventListener("click", openVoice));
  closeVoiceButtons.forEach(btn => btn.addEventListener("click", closeVoice));

  voiceModal?.addEventListener("click", (e) => {
    if (e.target === voiceModal) closeVoice();
  });

  function initRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return null;
    const r = new SpeechRecognition();
    r.lang = "en-US";
    r.interimResults = false;
    r.maxAlternatives = 1;
    return r;
  }

  function startRecognition() {
    if (recognizing) return;
    if (!recognition) recognition = initRecognition();

    if (!recognition) {
      setVoiceStatus("Voice not supported on this device/browser");
      return;
    }

    try {
      recognition.onresult = (event) => {
        const text = event.results?.[0]?.[0]?.transcript || "";
        if (text) handleVoicePrompt(text);
      };
      recognition.onerror = () => {
        setVoiceStatus("Error");
        stopRecognition();
      };
      recognition.onend = () => {
        // auto-stop state
        recognizing = false;
        setVoiceStatus("Idle");
        if (startVoiceBtn) startVoiceBtn.disabled = false;
        if (stopVoiceBtn) stopVoiceBtn.disabled = true;
      };

      recognition.start();
      recognizing = true;
      setVoiceStatus("Listening…");
      if (startVoiceBtn) startVoiceBtn.disabled = true;
      if (stopVoiceBtn) stopVoiceBtn.disabled = false;
    } catch {
      setVoiceStatus("Unable to start voice");
    }
  }

  function stopRecognition() {
    try { recognition?.stop(); } catch {}
    recognizing = false;
    setVoiceStatus("Idle");
    if (startVoiceBtn) startVoiceBtn.disabled = false;
    if (stopVoiceBtn) stopVoiceBtn.disabled = true;
  }

  startVoiceBtn?.addEventListener("click", startRecognition);
  stopVoiceBtn?.addEventListener("click", stopRecognition);

  function handleVoicePrompt(prompt) {
    appendVoiceLine("You", prompt);
    const reply = mockVoiceResponse(prompt);
    setTimeout(() => {
      appendVoiceLine("YoYo", reply);
      speak(reply);
    }, 450);
  }

  function mockVoiceResponse(prompt) {
    const t = (prompt || "").toLowerCase();
    if (t.includes("model y")) {
      return "Great. What year range, mileage cap, and budget are you targeting? I can recommend in-stock options and book a callback.";
    }
    if (t.includes("model 3")) {
      return "Sure. Do you want Performance, Long Range, or Standard Range? I can pull matching inventory and send listings.";
    }
    if (t.includes("sell") && t.includes("tesla")) {
      return "I can help intake a seller. What’s the VIN and mileage, and where is the vehicle located?";
    }
    return "Got it. Tell me the model, year range, and budget — and I’ll recommend the best matches and schedule next steps.";
  }

  voiceTextForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const val = (voiceTextInput?.value || "").trim();
    if (!val) return;
    handleVoicePrompt(val);
    voiceTextInput.value = "";
  });

  // -----------------------------
  // Contact form stepper
  // -----------------------------
  const contactForm = $("#contactForm");
  const steps = $$(".step", contactForm || document);
  const nextBtn = $("#nextBtn");
  const backBtn = $("#backBtn");
  const progressBars = $$(".progress .bar");
  const success = $("#formSuccess");
  const otherBrandsField = $("#otherBrandsField");

  let currentStep = 1;

  function showStep(n) {
    currentStep = n;
    steps.forEach(s => s.classList.toggle("active", Number(s.dataset.step) === n));
    // back button visibility
    if (backBtn) backBtn.style.visibility = (n === 1) ? "hidden" : "visible";

    // update progress
    progressBars.forEach((bar, idx) => {
      bar.classList.toggle("on", idx < n);
    });

    // next button label
    if (nextBtn) nextBtn.textContent = (n === 3) ? "Submit" : "Next";
  }

  function validateStep(n) {
    // minimal validation: check required inputs in current step
    const stepEl = steps.find(s => Number(s.dataset.step) === n);
    if (!stepEl) return true;

    const required = Array.from(stepEl.querySelectorAll("[required]"));
    let ok = true;

    required.forEach(el => {
      // Radio groups: only validate once per group
      if (el.type === "radio") return;

      if (!el.value || !el.value.trim()) {
        ok = false;
        el.focus();
      }
    });

    // radio group validation
    const radiosByName = {};
    stepEl.querySelectorAll("input[type='radio'][required]").forEach(r => {
      radiosByName[r.name] = radiosByName[r.name] || [];
      radiosByName[r.name].push(r);
    });
    Object.keys(radiosByName).forEach(name => {
      const group = radiosByName[name];
      const checked = group.some(r => r.checked);
      if (!checked) {
        ok = false;
        // focus first radio label
        group[0]?.focus();
      }
    });

    return ok;
  }

  function handleOtherEvsToggle() {
    const otherEvsYes = contactForm?.querySelector("input[name='other_evs'][value='yes']");
    const otherEvsNo = contactForm?.querySelector("input[name='other_evs'][value='no']");
    const show = otherEvsYes?.checked;
    if (!otherBrandsField) return;
    otherBrandsField.style.opacity = show ? "1" : "0.45";
    otherBrandsField.querySelectorAll("input").forEach(i => i.disabled = !show);

    if (!show) {
      otherBrandsField.querySelectorAll("input").forEach(i => i.checked = false);
    }
  }

  contactForm?.addEventListener("change", (e) => {
    const t = e.target;
    if (t && t.name === "other_evs") handleOtherEvsToggle();
  });

  nextBtn?.addEventListener("click", () => {
    if (!contactForm) return;
    if (currentStep < 3) {
      if (!validateStep(currentStep)) return;
      showStep(currentStep + 1);
      if (currentStep === 3) handleOtherEvsToggle();
      return;
    }

    // Submit
    if (!validateStep(currentStep)) return;

    const data = new FormData(contactForm);
    const payload = Object.fromEntries(data.entries());
    // Show in console for dev wiring
    console.log("Contact Sales payload (front-end only):", payload);

    contactForm.hidden = true;
    if (success) success.hidden = false;
  });

  backBtn?.addEventListener("click", () => {
    if (currentStep > 1) showStep(currentStep - 1);
  });

  // Initialize
  showStep(1);
  if (backBtn) backBtn.style.visibility = "hidden";
  if (otherBrandsField) {
    otherBrandsField.style.opacity = "0.45";
    otherBrandsField.querySelectorAll("input").forEach(i => i.disabled = true);
  }

  // Utility
  function escapeHtml(s) {
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
})();
