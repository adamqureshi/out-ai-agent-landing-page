/* ==========================================================
   OnlyUsedTesla.ai — OUT AI Agent Landing (static JS)
   - Mobile nav toggle
   - Chat preview animation
   - Demo chat drawer (front-end only)
   - Lead form fake submit (wire to backend later)
   ========================================================== */

(function () {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // Year
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // Mobile nav
  const navToggle = $(".nav-toggle");
  const navMenu = $("#navMenu");
  if (navToggle && navMenu) {
    navToggle.addEventListener("click", () => {
      const isOpen = navMenu.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", String(isOpen));
    });

    // Close menu when clicking a link (mobile)
    $$(".nav-link", navMenu).forEach((a) => {
      a.addEventListener("click", () => {
        navMenu.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  // --------------------------
  // Chat preview (hero card)
  // --------------------------
  const previewBody = $("#chatPreviewBody");
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const previewScript = [
    { from: "out", text: "Hi! Want to shop for a Tesla — or sell one?" },
    { from: "in", text: "Do you have a Model Y under $35k?" },
    { from: "out", text: "Yes — I can pull options from your live inventory. Any preference on year, mileage, or color?" },
    { from: "in", text: "2021+ and under 50k miles." },
    { from: "out", text: "Perfect. Want to book a test drive for today or tomorrow?" },
  ];

  function bubbleEl(from, text) {
    const div = document.createElement("div");
    div.className = `bubble ${from}`;
    div.textContent = text;
    return div;
  }

  function typingEl() {
    const wrap = document.createElement("div");
    wrap.className = "typing";
    wrap.setAttribute("aria-hidden", "true");
    wrap.innerHTML = "<span></span><span></span><span></span>";
    return wrap;
  }

  async function runPreview() {
    if (!previewBody) return;

    // Clear
    previewBody.innerHTML = "";

    // If reduced motion, just render everything.
    if (prefersReducedMotion) {
      previewScript.forEach((m) => previewBody.appendChild(bubbleEl(m.from, m.text)));
      return;
    }

    // Animated loop
    let i = 0;
    while (true) {
      previewBody.innerHTML = "";
      i = 0;

      while (i < previewScript.length) {
        const msg = previewScript[i];

        // Simulate typing before OUT messages
        if (msg.from === "out") {
          const t = typingEl();
          previewBody.appendChild(t);
          await wait(600);
          t.remove();
        } else {
          await wait(180);
        }

        previewBody.appendChild(bubbleEl(msg.from, msg.text));
        previewBody.scrollTop = previewBody.scrollHeight;
        await wait(900);
        i++;
      }

      await wait(1200);
    }
  }

  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  runPreview();

  // --------------------------
  // Chat drawer (front-end demo)
  // --------------------------
  const drawer = $("#chatDrawer");
  const chatBody = $("#chatBody");
  const chatForm = $("#chatForm");
  const chatInput = $("#chatInput");

  const openButtons = $$("[data-open-chat]");
  const closeButtons = $$("[data-close-chat]");

  function openChat() {
    if (!drawer) return;
    drawer.classList.add("is-open");
    drawer.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

    // Seed a demo conversation once.
    if (chatBody && chatBody.childElementCount === 0) {
      pushMessage("out", "Welcome! I’m OUT AI Agent (demo). Ask me anything a dealership owner might ask.");
      pushMessage("out", "Try: “How does it connect to inventory?” or “Can it buy from private sellers?”");
    }

    setTimeout(() => chatInput && chatInput.focus(), 50);
  }

  function closeChat() {
    if (!drawer) return;
    drawer.classList.remove("is-open");
    drawer.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  openButtons.forEach((btn) => btn.addEventListener("click", openChat));
  closeButtons.forEach((btn) => btn.addEventListener("click", closeChat));

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeChat();
  });

  function pushMessage(from, text) {
    if (!chatBody) return;
    const el = bubbleEl(from, text);
    chatBody.appendChild(el);
    chatBody.scrollTop = chatBody.scrollHeight;
  }

  function respondTo(userText) {
    const t = (userText || "").toLowerCase();

    // Very light “demo brain” (no real AI here)
    if (t.includes("inventory") || t.includes("feed") || t.includes("csv") || t.includes("xml") || t.includes("api")) {
      return [
        "We connect to your inventory feed (CSV, XML, or an API endpoint).",
        "OUT indexes listings so it can recommend *real vehicles* and answer availability/spec questions.",
        "Your dev can keep the feed + sync on Azure; the widget calls your endpoint."
      ].join(" ");
    }

    if (t.includes("private") || t.includes("seller") || t.includes("sell my") || t.includes("trade")) {
      return [
        "Yes — OUT can run a “Sell my Tesla” intake flow.",
        "It collects VIN, mileage, condition, photos (optional), and contact details, then sends your team a clean summary to make an offer."
      ].join(" ");
    }

    if (t.includes("price") || t.includes("pricing") || t.includes("cost") || t.includes("monthly")) {
      return [
        "Typical starting point is $499/mo + a one‑time setup to connect your site + inventory feed.",
        "Many dealers upgrade once they add rooftops, SMS, or custom CRM routing."
      ].join(" ");
    }

    if (t.includes("install") || t.includes("setup") || t.includes("how long") || t.includes("deploy")) {
      return [
        "Install is usually a small script tag on your site, plus connecting your inventory feed.",
        "Most dealers can go live quickly once we have the feed and lead routing destination."
      ].join(" ");
    }

    if (t.includes("tesla") && (t.includes("model y") || t.includes("model 3") || t.includes("model s") || t.includes("model x"))) {
      return [
        "In production, I’d look at your live inventory and suggest matching units.",
        "For the demo: tell me your target price, year, and max mileage and I’ll show how I’d qualify the lead."
      ].join(" ");
    }

    return [
      "Got it.",
      "In production, OUT would answer using your dealership’s inventory feed + policies.",
      "If you tell me what you want the agent to do (sell inventory, buy from private sellers, book appointments), I can suggest the best setup."
    ].join(" ");
  }

  function showTypingThenReply(replyText) {
    if (!chatBody) return;

    const t = typingEl();
    chatBody.appendChild(t);
    chatBody.scrollTop = chatBody.scrollHeight;

    const delay = prefersReducedMotion ? 0 : 700;
    window.setTimeout(() => {
      t.remove();
      pushMessage("out", replyText);
    }, delay);
  }

  if (chatForm) {
    chatForm.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!chatInput) return;

      const value = chatInput.value.trim();
      if (!value) return;

      pushMessage("in", value);
      chatInput.value = "";

      const reply = respondTo(value);
      showTypingThenReply(reply);
    });
  }

  // --------------------------
  // Lead form (fake submit)
  // --------------------------
  const leadForm = $("#leadForm");
  const formNote = $("#formNote");

  if (leadForm) {
    leadForm.addEventListener("submit", (e) => {
      e.preventDefault();

      // In production, POST to your Azure endpoint here.
      // Example:
      // fetch("/api/leads", { method: "POST", body: new FormData(leadForm) })

      if (formNote) {
        formNote.textContent = "Thanks — demo request captured (front‑end only). Wire this to your backend.";
      }

      leadForm.reset();
    });
  }
})();
