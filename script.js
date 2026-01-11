(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // Footer year
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // Smooth scroll helper
  const scrollToId = (id) => {
    const el = typeof id === "string" ? document.querySelector(id) : id;
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Contact CTA
  const heroContactBtn = $("#heroContactBtn");
  heroContactBtn?.addEventListener("click", () => scrollToId("#contact"));
  $$("[data-scroll]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.getAttribute("data-scroll");
      if (target) scrollToId(target);
    });
  });

  // Demo tabs
  const demoTabs = $("#demoTabs");
  const preferredDemo = $("#preferredDemo");
  const panelChat = $("#panelChat");
  const panelVoice = $("#panelVoice");

  const setActiveTab = (tab) => {
    const tabChat = $("#tabChat");
    const tabVoice = $("#tabVoice");
    const isChat = tab === "chat";

    demoTabs?.setAttribute("data-active", tab);

    // Buttons
    tabChat?.classList.toggle("is-active", isChat);
    tabChat?.setAttribute("aria-selected", String(isChat));
    tabVoice?.classList.toggle("is-active", !isChat);
    tabVoice?.setAttribute("aria-selected", String(!isChat));

    // Panels
    if (panelChat) panelChat.hidden = !isChat;
    if (panelVoice) panelVoice.hidden = isChat;

    if (preferredDemo) preferredDemo.value = tab;
  };

  $("#tabChat")?.addEventListener("click", () => setActiveTab("chat"));
  $("#tabVoice")?.addEventListener("click", () => setActiveTab("voice"));

  // Voice preview selection + play/progress
  const voiceRows = $$(".voice-row");
  const voiceSelectedLabel = $("#voiceSelectedLabel");
  const voiceStatus = $("#voiceStatus");
  const voicePlayBtn = $("#voicePlayBtn");
  const voiceProgress = $("#voiceProgress");
  const voiceCopyBtn = $("#voiceCopyBtn");
  const voiceResetBtn = $("#voiceResetBtn");

  const VOICE_DEMOS = {
    cash: {
      label: "Cash Offer AI Agent",
      transcript: [
        "OUT: Thanks — are you looking for a cash offer or trade-in estimate?",
        "Customer: Cash offer.",
        "OUT: Great. What’s the year, trim, mileage, and VIN? Any damage or prior repairs?"
      ]
    },
    shopping: {
      label: "Shopping AI Agent",
      transcript: [
        "OUT: What are you shopping for — make/model, budget, and must-haves?",
        "Customer: Luxury EV under $55k.",
        "OUT: Got it. I’ll narrow options, explain features, and book a test drive when you’re ready."
      ]
    }
  };

  let selectedVoice = "cash";
  let playTimer = null;
  let playStart = 0;
  const PLAY_MS = 6500;

  const setVoiceSelection = (key) => {
    if (!VOICE_DEMOS[key]) return;
    selectedVoice = key;

    voiceRows.forEach((row) => {
      const isSel = row.getAttribute("data-voice") === key;
      row.classList.toggle("is-selected", isSel);
      row.setAttribute("aria-selected", String(isSel));
    });

    if (voiceSelectedLabel) voiceSelectedLabel.textContent = VOICE_DEMOS[key].label;
  };

  voiceRows.forEach((row) => {
    row.addEventListener("click", () => {
      const key = row.getAttribute("data-voice") || "cash";
      setVoiceSelection(key);
      // Optional: start playing immediately when user picks an agent
      // startPlay();
    });
  });

  const stopPlay = () => {
    if (playTimer) {
      cancelAnimationFrame(playTimer);
      playTimer = null;
    }
    if (voicePlayBtn) voicePlayBtn.classList.remove("is-playing");
    if (voiceProgress) voiceProgress.style.width = "0%";
    if (voiceStatus) voiceStatus.textContent = "Idle";
  };

  const tickPlay = () => {
    const elapsed = performance.now() - playStart;
    const pct = Math.min(100, (elapsed / PLAY_MS) * 100);
    if (voiceProgress) voiceProgress.style.width = pct.toFixed(2) + "%";
    if (elapsed >= PLAY_MS) {
      stopPlay();
      return;
    }
    playTimer = requestAnimationFrame(tickPlay);
  };

  const startPlay = () => {
    stopPlay(); // restart
    playStart = performance.now();
    if (voiceStatus) voiceStatus.textContent = "Playing";
    if (voicePlayBtn) voicePlayBtn.classList.add("is-playing");
    playTimer = requestAnimationFrame(tickPlay);
  };

  voicePlayBtn?.addEventListener("click", () => {
    const isPlaying = voicePlayBtn.classList.contains("is-playing");
    if (isPlaying) stopPlay();
    else startPlay();
  });

  voiceResetBtn?.addEventListener("click", () => {
    stopPlay();
    setVoiceSelection("cash");
  });

  voiceCopyBtn?.addEventListener("click", async () => {
    const demo = VOICE_DEMOS[selectedVoice];
    if (!demo) return;
    const text = demo.transcript.join("\n");
    try {
      await navigator.clipboard.writeText(text);
      if (voiceStatus) {
        const prev = voiceStatus.textContent;
        voiceStatus.textContent = "Copied";
        setTimeout(() => (voiceStatus.textContent = prev || "Idle"), 900);
      }
    } catch {
      // ignore if clipboard blocked
      if (voiceStatus) voiceStatus.textContent = "Copy blocked";
      setTimeout(() => (voiceStatus.textContent = "Idle"), 900);
    }
  });

  // Contact form behavior
  const sellOtherBrands = $("#sellOtherBrands");
  const agentForOtherBrands = $("#agentForOtherBrands");
  sellOtherBrands?.addEventListener("change", () => {
    if (!agentForOtherBrands) return;
    const yes = sellOtherBrands.value === "yes";
    agentForOtherBrands.disabled = !yes;
  });

  const contactForm = $("#contactForm");
  const formStatus = $("#formStatus");
  contactForm?.addEventListener("submit", (e) => {
    e.preventDefault();

    // Static demo: show a friendly message and log the payload in console.
    const data = Object.fromEntries(new FormData(contactForm).entries());
    console.log("Contact form payload (static demo):", data);

    if (formStatus) {
      formStatus.textContent = "Thanks — we received your info. (Static demo; wire to backend later.)";
    }

    // Optional: clear only notes field
    const notes = contactForm.querySelector('textarea[name="notes"]');
    if (notes) notes.value = "";
  });

  // Chat drawer
  const chatDrawer = $("#chatDrawer");
  const openChatDemo = $("#openChatDemo");
  const askLauncher = $("#askLauncher");
  const closeChat = $("#closeChat");
  const chatForm = $("#chatForm");
  const chatInput = $("#chatInput");
  const chatBody = $("#chatBody");

  const openDrawer = () => {
    if (!chatDrawer) return;
    chatDrawer.hidden = false;
    document.body.style.overflow = "hidden";
    setTimeout(() => chatInput?.focus(), 50);
  };

  const closeDrawer = () => {
    if (!chatDrawer) return;
    chatDrawer.hidden = true;
    document.body.style.overflow = "";
  };

  openChatDemo?.addEventListener("click", openDrawer);
  askLauncher?.addEventListener("click", openDrawer);
  closeChat?.addEventListener("click", closeDrawer);

  // Close drawer on backdrop click
  chatDrawer?.addEventListener("click", (e) => {
    if (e.target === chatDrawer) closeDrawer();
  });

  chatForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const msg = (chatInput?.value || "").trim();
    if (!msg) return;

    const user = document.createElement("div");
    user.className = "bubble user";
    user.textContent = msg;
    chatBody?.appendChild(user);

    if (chatInput) chatInput.value = "";
    chatBody?.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });

    // Fake bot response
    setTimeout(() => {
      const bot = document.createElement("div");
      bot.className = "bubble bot";
      bot.textContent =
        "Thanks — I can help with that. (Demo UI only.) Want me to route this to sales and book a test drive?";
      chatBody?.appendChild(bot);
      chatBody?.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });
    }, 450);
  });

  // Voice modal (live mic)
  const voiceModal = $("#voiceModal");
  const voiceTitle = $("#voiceTitle");
  const openLiveVoice = $("#openLiveVoice");
  const closeVoice = $("#closeVoice");
  const startVoice = $("#startVoice");
  const stopVoiceBtn = $("#stopVoice");
  const speakResponses = $("#speakResponses");
  const voiceLiveStatus = $("#voiceLiveStatus");
  const voiceLiveLog = $("#voiceLiveLog");
  const voiceTyped = $("#voiceTyped");
  const voiceSend = $("#voiceSend");

  const openVoiceModal = () => {
    if (!voiceModal) return;
    if (voiceTitle && VOICE_DEMOS[selectedVoice]) {
      voiceTitle.textContent = `Demo OUT Voice AI Agent — ${VOICE_DEMOS[selectedVoice].label}`;
    }
    voiceModal.hidden = false;
    document.body.style.overflow = "hidden";
  };
  const closeVoiceModal = () => {
    if (!voiceModal) return;
    voiceModal.hidden = true;
    document.body.style.overflow = "";
  };

  openLiveVoice?.addEventListener("click", openVoiceModal);
  closeVoice?.addEventListener("click", closeVoiceModal);
  voiceModal?.addEventListener("click", (e) => {
    if (e.target === voiceModal) closeVoiceModal();
  });

  const logLine = (who, text) => {
    if (!voiceLiveLog) return;
    const line = document.createElement("div");
    line.className = "bubble " + (who === "user" ? "user" : "bot");
    line.textContent = text;
    voiceLiveLog.appendChild(line);
    voiceLiveLog.scrollTo({ top: voiceLiveLog.scrollHeight, behavior: "smooth" });
  };

  const speak = (text) => {
    if (!speakResponses?.checked) return;
    if (!("speechSynthesis" in window)) return;
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1.0;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  };

  // Minimal "agent" response logic (static)
  const respond = (prompt) => {
    const lower = prompt.toLowerCase();
    if (lower.includes("cash") || lower.includes("offer") || lower.includes("sell")) {
      return "Sure. For a cash offer: what year, mileage, trim, VIN, and condition? Any accidents or repairs?";
    }
    if (lower.includes("model") || lower.includes("ev") || lower.includes("shop") || lower.includes("budget")) {
      return "Got it. What’s your budget and must-haves (range, seats, color)? I can narrow options and book a test drive.";
    }
    return "Thanks. Tell me your goal (shop, trade-in/cash offer, or test drive) and I’ll guide you step-by-step.";
  };

  voiceSend?.addEventListener("click", () => {
    const msg = (voiceTyped?.value || "").trim();
    if (!msg) return;
    if (voiceTyped) voiceTyped.value = "";
    logLine("user", msg);
    const reply = respond(msg);
    setTimeout(() => {
      logLine("bot", reply);
      speak(reply);
    }, 250);
  });

  // SpeechRecognition (browser-dependent)
  let recognition = null;
  const canRec =
    "SpeechRecognition" in window || "webkitSpeechRecognition" in window;

  const setVoiceLiveStatus = (text) => {
    if (voiceLiveStatus) voiceLiveStatus.textContent = "Status: " + text;
  };

  const startRecognition = () => {
    if (!canRec) {
      setVoiceLiveStatus("No speech recognition in this browser. Type instead.");
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SR();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setVoiceLiveStatus("Listening…");
    recognition.onend = () => setVoiceLiveStatus("Idle");
    recognition.onerror = () => setVoiceLiveStatus("Error");
    recognition.onresult = (event) => {
      const text = event.results?.[0]?.[0]?.transcript || "";
      if (text) {
        logLine("user", text);
        const reply = respond(text);
        setTimeout(() => {
          logLine("bot", reply);
          speak(reply);
        }, 250);
      }
    };

    recognition.start();
  };

  const stopRecognition = () => {
    try {
      recognition?.stop();
    } catch {}
    recognition = null;
    setVoiceLiveStatus("Idle");
  };

  startVoice?.addEventListener("click", () => {
    startVoice.disabled = true;
    if (stopVoiceBtn) stopVoiceBtn.disabled = false;
    startRecognition();
  });

  stopVoiceBtn?.addEventListener("click", () => {
    if (startVoice) startVoice.disabled = false;
    if (stopVoiceBtn) stopVoiceBtn.disabled = true;
    stopRecognition();
  });

  // Global escape key to close overlays
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (voiceModal && !voiceModal.hidden) closeVoiceModal();
    if (chatDrawer && !chatDrawer.hidden) closeDrawer();
  });

  // Default tab
  setActiveTab("chat");
  setVoiceSelection("cash");
})();
