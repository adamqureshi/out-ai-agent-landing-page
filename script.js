/* OUT AI Agent — static landing interactions (no backend) */
(function(){
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

  // Mobile nav
  const burger = $('.nav-burger');
  const mobileMenu = $('#mobileMenu');
  if (burger && mobileMenu){
    burger.addEventListener('click', () => {
      const expanded = burger.getAttribute('aria-expanded') === 'true';
      burger.setAttribute('aria-expanded', String(!expanded));
      mobileMenu.hidden = expanded;
    });
    $$('#mobileMenu a').forEach(a => a.addEventListener('click', () => {
      burger.setAttribute('aria-expanded', 'false');
      mobileMenu.hidden = true;
    }));
  }

  // Demo selection highlight
  const selectedLabel = $('#selectedDemoLabel');
  const cards = $$('.product-card[data-demo]');
  function selectCard(type){
    cards.forEach(c => c.classList.toggle('product-card--selected', c.dataset.demo === type));
    if (selectedLabel) selectedLabel.textContent = type === 'voice' ? 'Voice AI Agent' : 'Chat AI Agent';
  }
  cards.forEach(card => {
    card.addEventListener('click', () => selectCard(card.dataset.demo));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' '){
        e.preventDefault();
        selectCard(card.dataset.demo);
      }
    });
  });

  // Chat drawer
  const chatDrawer = $('#chatDrawer');
  const chatBody = $('#chatBody');
  const chatForm = $('#chatForm');
  const chatText = $('#chatText');

  function openChat(){
    if (!chatDrawer) return;
    chatDrawer.hidden = false;
    // focus input
    setTimeout(() => chatText && chatText.focus(), 50);
    // reflect selection
    selectCard('chat');
  }
  function closeChat(){
    if (!chatDrawer) return;
    chatDrawer.hidden = true;
  }
  $$('[data-open-chat]').forEach(btn => btn.addEventListener('click', openChat));
  $$('[data-close-chat]').forEach(btn => btn.addEventListener('click', closeChat));

  // Simple chat responder (placeholder)
  function respondToChat(text){
    const t = text.toLowerCase();
    if (t.includes('model y')) return "Yes — I can show Model Y options in stock. What year range and budget are you aiming for?";
    if (t.includes('model 3')) return "Got it. Are you looking for Standard Range, Long Range, or Performance?";
    if (t.includes('trade')) return "Sure — I can estimate trade-in ranges. What’s the year/mileage and condition?";
    if (t.includes('sell') || t.includes('selling')) return "I can help intake a private-seller Tesla. What’s the VIN (or year/model), mileage, and your location?";
    if (t.includes('payment') || t.includes('monthly')) return "I can estimate monthly payments. What price target, down payment, and credit tier should I assume?";
    return "Got it. I can help with inventory questions, comparisons, test drive requests, or seller intake. What’s the Tesla you’re interested in?";
  }
  function addChatMsg(role, text){
    if (!chatBody) return;
    const div = document.createElement('div');
    div.className = 'msg ' + role;
    div.textContent = text;
    chatBody.appendChild(div);
    chatBody.scrollTop = chatBody.scrollHeight;
  }
  if (chatForm){
    chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = (chatText?.value || '').trim();
      if (!text) return;
      addChatMsg('user', text);
      chatText.value = '';
      window.setTimeout(() => addChatMsg('ai', respondToChat(text)), 260);
    });
  }

  // Voice modal
  const voiceModal = $('#voiceModal');
  const voiceStatus = $('#voiceStatus');
  const voiceSupportNote = $('#voiceSupportNote');
  const transcript = $('#voiceTranscript');
  const voiceStartBtn = $('#voiceStartBtn');
  const voiceStopBtn = $('#voiceStopBtn');
  const speakToggle = $('#voiceSpeakToggle');
  const manualText = $('#voiceManualText');
  const manualSend = $('#voiceManualSend');

  function openVoice(){
    if (!voiceModal) return;
    voiceModal.hidden = false;
    selectCard('voice');
    setTimeout(() => voiceStartBtn && voiceStartBtn.focus(), 50);
  }
  function closeVoice(){
    if (!voiceModal) return;
    voiceModal.hidden = true;
    stopRecognition();
  }
  $$('[data-open-voice]').forEach(btn => btn.addEventListener('click', openVoice));
  $$('[data-close-voice]').forEach(btn => btn.addEventListener('click', closeVoice));
  // click backdrop closes modal
  if (voiceModal){
    voiceModal.addEventListener('click', (e) => {
      const target = e.target;
      if (target && (target.hasAttribute?.('data-close-voice'))) closeVoice();
    });
  }

  function addVoiceLine(role, text){
    if (!transcript) return;
    const div = document.createElement('div');
    div.className = 'tline ' + role;
    div.textContent = text;
    transcript.appendChild(div);
    transcript.scrollTop = transcript.scrollHeight;
  }

  function respondToVoice(text){
    const t = text.toLowerCase();
    if (t.includes('sell') || t.includes('selling')){
      return "I can help intake that Tesla for your dealership. What’s the VIN, mileage, and condition (excellent/good/fair)?";
    }
    if (t.includes('model y')){
      return "Got it. Are you looking for Long Range or Performance? And what’s your max budget and preferred color?";
    }
    if (t.includes('model 3')){
      return "Sure. Do you want Performance, Long Range, or Standard Range? Any year or mileage limit?";
    }
    if (t.includes('trade')){
      return "I can estimate a trade-in range. What’s the year, mileage, and any accidents or major repairs?";
    }
    if (t.includes('appointment') || t.includes('test drive')){
      return "Great — what day/time works best, and what’s the best phone number for a quick confirmation?";
    }
    return "Thanks. I can recommend in-stock Teslas, compare trims, estimate payments, or intake a seller vehicle. What should we do first?";
  }

  function speak(text){
    const enabled = !!(speakToggle && speakToggle.checked);
    if (!enabled) return;
    if (!('speechSynthesis' in window)) return;
    try{
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 1.0;
      u.pitch = 1.0;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    }catch(_){}
  }

  // SpeechRecognition (best-effort)
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  let recognition = null;
  let recognizing = false;

  function setVoiceStatus(text){
    if (voiceStatus) voiceStatus.textContent = text;
  }

  function initRecognition(){
    if (!SpeechRecognition){
      if (voiceSupportNote) voiceSupportNote.textContent = "Voice capture isn’t supported in this browser. Use the typed prompt or the chat demo.";
      return null;
    }
    if (voiceSupportNote) voiceSupportNote.textContent = "Your browser may send audio to its speech provider for transcription. This is a preview—your production voice agent can use your own stack.";
    const r = new SpeechRecognition();
    r.lang = 'en-US';
    r.interimResults = false;
    r.maxAlternatives = 1;
    r.onstart = () => {
      recognizing = true;
      setVoiceStatus('Listening…');
      if (voiceStartBtn) voiceStartBtn.disabled = true;
      if (voiceStopBtn) voiceStopBtn.disabled = false;
    };
    r.onend = () => {
      recognizing = false;
      setVoiceStatus('Idle');
      if (voiceStartBtn) voiceStartBtn.disabled = false;
      if (voiceStopBtn) voiceStopBtn.disabled = true;
    };
    r.onerror = (e) => {
      recognizing = false;
      setVoiceStatus('Idle');
      if (voiceSupportNote) voiceSupportNote.textContent = "Voice error: " + (e.error || 'unknown') + ". You can still type a prompt.";
      if (voiceStartBtn) voiceStartBtn.disabled = false;
      if (voiceStopBtn) voiceStopBtn.disabled = true;
    };
    r.onresult = (e) => {
      const text = e.results?.[0]?.[0]?.transcript || '';
      if (!text) return;
      addVoiceLine('user', text);
      const reply = respondToVoice(text);
      window.setTimeout(() => {
        addVoiceLine('ai', reply);
        speak(reply);
      }, 220);
    };
    return r;
  }

  function startRecognition(){
    if (!voiceModal || voiceModal.hidden) openVoice();
    if (!recognition) recognition = initRecognition();
    if (!recognition) return;
    if (recognizing) return;
    try{
      recognition.start();
    }catch(_){}
  }

  function stopRecognition(){
    if (!recognition) return;
    if (!recognizing) return;
    try{
      recognition.stop();
    }catch(_){}
  }

  if (voiceStartBtn) voiceStartBtn.addEventListener('click', startRecognition);
  if (voiceStopBtn) voiceStopBtn.addEventListener('click', stopRecognition);

  function sendManual(){
    const text = (manualText?.value || '').trim();
    if (!text) return;
    addVoiceLine('user', text);
    manualText.value = '';
    const reply = respondToVoice(text);
    window.setTimeout(() => {
      addVoiceLine('ai', reply);
      speak(reply);
    }, 220);
  }
  if (manualSend) manualSend.addEventListener('click', sendManual);
  if (manualText) manualText.addEventListener('keydown', (e) => {
    if (e.key === 'Enter'){
      e.preventDefault();
      sendManual();
    }
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (voiceModal && !voiceModal.hidden) closeVoice();
    if (chatDrawer && !chatDrawer.hidden) closeChat();
  });

})();
