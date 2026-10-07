(function () {
  "use strict";

  const {
    allowedPetKinds,
    isKeyboardEdit,
    isSupportedEditor,
    keyboardKeyKind,
    LIMITS,
    sanitizePreferences
  } = DPMLogic;
  const MAX_PETS = LIMITS.maxPets;
  const MAX_INK = LIMITS.maxInkBlots;
  const MAX_PARTICLES = LIMITS.maxTypingParticles;
  const COMBO_TIMEOUT = LIMITS.comboInactivityMs;
  const FRAME_INTERVAL = 1000 / LIMITS.framesPerSecond;
  const prefersReducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const host = document.createElement("div");
  host.setAttribute("data-developer-power-mode-combo", "");
  host.style.cssText = "all:initial;position:fixed;inset:0;z-index:2147483647;pointer-events:none;";
  const shadow = host.attachShadow({ mode: "closed" });
  const style = document.createElement("style");
  style.textContent = `
    :host{all:initial}
    canvas{position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none}
    .counter{position:fixed;top:7px;left:10px;color:#a9ffe3;background:rgba(16,13,40,.82);
      border:1px solid rgba(117,255,220,.68);border-radius:5px;padding:4px 9px;
      font:700 12px/1.25 ui-monospace,SFMono-Regular,Consolas,monospace;letter-spacing:1px;
      text-shadow:0 0 9px #46ffd2,1px 1px #6538b3;box-shadow:0 0 12px rgba(83,255,218,.2)}
    .counter[hidden]{display:none}
  `;
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { alpha: true });
  const counter = document.createElement("div");
  counter.className = "counter";
  counter.setAttribute("aria-live", "polite");
  counter.setAttribute("aria-label", "Typing combo");
  counter.hidden = true;
  shadow.append(style, canvas, counter);
  (document.documentElement || document).append(host);

  const state = {
    preferences: DPMLogic.DEFAULTS,
    preferencesLoaded: false,
    editor: null,
    combo: 0,
    lastHit: 0,
    comboTimer: 0,
    pendingKey: null,
    pendingInput: null,
    composing: false,
    frame: 0,
    lastFrame: 0,
    lastRender: 0,
    shakeUntil: 0,
    shaking: false,
    pets: [],
    ink: [],
    particles: [],
    running: false,
    width: 0,
    height: 0,
    random: Math.random
  };

  function currentEditor(node) {
    let target = node instanceof Element ? node : null;
    while (target && target !== document.documentElement) {
      if (String(target.getAttribute("contenteditable")).toLowerCase() === "false") return null;
      if (isSupportedEditor(target)) {
        if (target.isContentEditable) {
          let root = target;
          while (root.parentElement && root.parentElement.isContentEditable) {
            root = root.parentElement;
          }
          return root;
        }
        return target;
      }
      target = target.parentElement;
    }
    return null;
  }

  function updateCounter() {
    counter.hidden = !state.preferences.powerMode || state.combo === 0;
    counter.textContent = state.combo ? `COMBO ${String(state.combo).padStart(2, "0")}x` : "";
    counter.setAttribute("aria-label", `${state.combo} typing ${state.combo === 1 ? "edit" : "edits"} in a row`);
  }

  function resetCombo() {
    clearTimeout(state.comboTimer);
    state.comboTimer = 0;
    state.combo = 0;
    state.lastHit = 0;
    updateCounter();
  }

  function selectEditor(editor) {
    if (editor === state.editor) return;
    state.editor = editor;
    state.pendingKey = null;
    state.pendingInput = null;
    resetCombo();
  }

  function scheduleComboReset() {
    clearTimeout(state.comboTimer);
    state.comboTimer = setTimeout(resetCombo, COMBO_TIMEOUT);
  }

  function caretPosition(editor) {
    if (!editor) return { x: 12, y: 31 };
    const box = editor.getBoundingClientRect();
    if (editor.isContentEditable) {
      const selection = document.getSelection();
      if (selection && selection.rangeCount) {
        const range = selection.getRangeAt(0).cloneRange();
        range.collapse(true);
        const rect = range.getBoundingClientRect();
        if (rect.width || rect.height) return { x: rect.left, y: rect.top + rect.height / 2 };
      }
      return { x: box.left + 8, y: box.top + 8 };
    }
    const input = editor;
    const caret = Number.isInteger(input.selectionStart) ? input.selectionStart : input.value.length;
    const before = input.value.slice(0, caret);
    const computed = getComputedStyle(editor);
    const computedFont = computed.font || [
      computed.fontStyle, computed.fontVariant, computed.fontWeight,
      computed.fontSize, computed.fontFamily
    ].join(" ");
    context.font = computedFont;
    const paddingLeft = parseFloat(computed.paddingLeft) || 0;
    const lineHeight = parseFloat(computed.lineHeight) || parseFloat(computed.fontSize) || 16;
    let x;
    let y;
    if (editor.tagName === "TEXTAREA") {
      const lines = before.split("\n");
      x = box.left + paddingLeft + context.measureText(lines[lines.length - 1]).width - input.scrollLeft;
      y = box.top + (parseFloat(computed.paddingTop) || 0) +
        (lines.length - 1) * lineHeight + lineHeight / 2 - input.scrollTop;
    } else {
      x = box.left + paddingLeft + context.measureText(before).width - input.scrollLeft;
      y = box.top + box.height / 2;
    }
    return { x, y };
  }

  function addTypingParticles(position, count) {
    for (let i = 0; i < count && state.particles.length < MAX_PARTICLES; i += 1) {
      const angle = state.random() * Math.PI * 2;
      const speed = 36 + state.random() * 100;
      state.particles.push({
        x: position.x + (state.random() - 0.5) * 8,
        y: position.y + (state.random() - 0.5) * 8,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 20,
        age: 0,
        life: 0.48 + state.random() * 0.52,
        color: ["#64ffe2", "#ff7cff", "#ffe06c"][Math.floor(state.random() * 3)],
        size: 2.5 + state.random() * 2.5
      });
    }
  }

  function onKeyDown(event) {
    state.pendingKey = null;
    state.pendingInput = null;
    const editor = currentEditor(event.target);
    if (editor) selectEditor(editor);
    if (!editor || state.composing || event.isComposing || event.ctrlKey || event.metaKey || event.altKey) {
      state.pendingKey = null;
      return;
    }
    const keyKind = keyboardKeyKind(event);
    if (keyKind) {
      const candidate = { editor, keyKind };
      state.pendingKey = candidate;
      setTimeout(() => {
        if (state.pendingKey === candidate) state.pendingKey = null;
      }, 0);
    }
  }

  function onBeforeInput(event) {
    const editor = currentEditor(event.target);
    if (!editor || !event.isTrusted || state.composing || event.isComposing) {
      state.pendingInput = null;
      return;
    }
    const candidate = state.pendingKey;
    state.pendingKey = null;
    if (candidate && candidate.editor === editor && isKeyboardEdit(event.inputType, candidate.keyKind)) {
      state.pendingInput = { editor };
    } else {
      state.pendingInput = null;
    }
  }

  function onInput(event) {
    const candidate = state.pendingInput;
    state.pendingInput = null;
    if (!state.preferencesLoaded || !candidate || !event.isTrusted || state.composing || event.isComposing ||
        candidate.editor !== currentEditor(event.target)) return;
    if (!state.preferences.powerMode) return;
    const now = performance.now();
    if (state.editor !== candidate.editor) selectEditor(candidate.editor);
    if (state.combo && now - state.lastHit >= COMBO_TIMEOUT) state.combo = 0;
    state.combo += 1;
    state.lastHit = now;
    scheduleComboReset();
    updateCounter();
    const position = caretPosition(candidate.editor);
    if (!prefersReducedMotion.matches) {
      if (state.combo === 3) addTypingParticles(position, 18);
      else if (state.combo > 3) addTypingParticles(position, 2);
    }
    if (state.combo % 10 === 0 && !prefersReducedMotion.matches) {
      state.shakeUntil = now + 240;
      state.shaking = true;
    }
  }

  function onFocusIn(event) {
    selectEditor(currentEditor(event.target));
  }

  document.addEventListener("keydown", onKeyDown, true);
  document.addEventListener("beforeinput", onBeforeInput, true);
  document.addEventListener("input", onInput, true);
  document.addEventListener("focusin", onFocusIn, true);
  document.addEventListener("focusout", (event) => {
    selectEditor(currentEditor(event.relatedTarget));
  }, true);
  document.addEventListener("compositionstart", () => {
    state.composing = true;
    state.pendingKey = null;
    state.pendingInput = null;
  }, true);
  document.addEventListener("compositionend", () => {
    state.composing = false;
    state.pendingKey = null;
    state.pendingInput = null;
  }, true);

  function drawSprite(kind, x, y, scale) {
    const sprite = DPMPets.sprites[kind];
    const palette = DPMPets.palette;
    for (let row = 0; row < sprite.length; row += 1) {
      for (let column = 0; column < sprite[row].length; column += 1) {
        const color = palette[sprite[row][column]];
        if (!color) continue;
        context.fillStyle = color;
        context.fillRect(Math.round(x + column * scale), Math.round(y + row * scale), scale, scale);
      }
    }
  }

  function createPet(kind, delay = 0, visibleX = null) {
    const fromLeft = state.random() < 0.5;
    const scale = 2 + state.random() * 1.15;
    return {
      kind,
      x: visibleX === null ? (fromLeft ? -64 : state.width + 64) : visibleX,
      y: 7 + state.random() * 6,
      speed: (13 + state.random() * 19) * (fromLeft ? 1 : -1),
      scale,
      age: -delay,
      inkIn: 3 + state.random() * 6,
      bob: state.random() * Math.PI * 2
    };
  }

  function reconcilePets() {
    const kinds = allowedPetKinds(state.preferences.petMode);
    state.pets = state.pets.filter((pet) => kinds.includes(pet.kind)).slice(0, MAX_PETS);
    while (state.pets.length < Math.min(kinds.length, MAX_PETS)) {
      const index = state.pets.length;
      const kind = kinds[index % kinds.length];
      const count = Math.min(kinds.length, MAX_PETS);
      const visibleX = state.width * (index + 1) / (count + 1);
      state.pets.push(createPet(kind, index * 0.8, visibleX));
    }
    if (!kinds.length) {
      state.ink.length = 0;
    }
  }

  function dropInk(pet) {
    const count = 5 + Math.floor(state.random() * 5);
    for (let i = 0; i < count && state.ink.length < MAX_INK; i += 1) {
      const angle = state.random() * Math.PI * 2;
      const speed = 7 + state.random() * 20;
      state.ink.push({
        x: pet.x + 27 + (state.random() - 0.5) * 9,
        y: pet.y + 32 + (state.random() - 0.5) * 7,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        age: 0,
        life: 1.3 + state.random() * 1.1,
        radius: 1.5 + state.random() * 2.5
      });
    }
  }

  function drawWater(now) {
    if (state.preferences.petMode !== "all" && state.preferences.petMode !== "octopus") return;
    const gradient = context.createLinearGradient(0, 0, 0, LIMITS.ambientHeight);
    gradient.addColorStop(0, "rgba(47,183,229,0.10)");
    gradient.addColorStop(1, "rgba(62,82,227,0.035)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, state.width, LIMITS.ambientHeight);
    context.strokeStyle = "rgba(111,227,255,0.14)";
    context.lineWidth = 1;
    for (let line = 0; line < 2; line += 1) {
      context.beginPath();
      for (let x = 0; x <= state.width; x += 9) {
        const y = 19 + line * 28 +
          Math.sin(x * 0.023 + now * 0.00045 + line) * 1.7;
        if (x === 0) context.moveTo(x, y);
        else context.lineTo(x, y);
      }
      context.stroke();
    }
    context.strokeStyle = "rgba(63,189,158,0.34)";
    for (let i = 0; i < Math.min(8, Math.ceil(state.width / 160)); i += 1) {
      const x = (i * 137 + 46) % Math.max(1, state.width);
      const height = 11 + (i * 7) % 16;
      context.lineWidth = 2;
      context.beginPath();
      context.moveTo(x, LIMITS.ambientHeight - 2);
      for (let step = 1; step <= 4; step += 1) {
        const y = LIMITS.ambientHeight - 2 - height * step / 4;
        const sway = Math.sin(now * 0.0008 + i + step * 0.45) * (step * 1.3);
        context.lineTo(x + sway, y);
      }
      context.stroke();
    }
  }

  function drawPets(delta, now) {
    const kinds = allowedPetKinds(state.preferences.petMode);
    if (!kinds.length) return;
    if (state.preferences.petMode === "all" || state.preferences.petMode === "octopus") drawWater(now);
    for (const pet of state.pets) {
      pet.age += delta;
      if (pet.age < 0) continue;
      pet.x += pet.speed * delta;
      pet.bob += delta * 1.7;
      pet.y = 8 + Math.sin(pet.bob) * 2;
      const outside = pet.speed > 0 ? pet.x > state.width + 68 : pet.x < -68;
      if (outside) {
        const index = state.pets.indexOf(pet);
        state.pets[index] = createPet(kinds[Math.floor(state.random() * kinds.length)]);
        continue;
      }
      const scale = pet.scale;
      if (pet.kind === "octopus") {
        context.fillStyle = "#7f67e8";
        for (let leg = 0; leg < 6; leg += 1) {
          const startX = pet.x + (12 + leg * 4) * scale / 2;
          const startY = pet.y + 8 * scale;
          context.beginPath();
          context.moveTo(startX, startY);
          context.quadraticCurveTo(
            startX + Math.sin(now / 210 + leg) * 4,
            startY + 5 + Math.cos(now / 190 + leg) * 2,
            startX + Math.sin(now / 210 + leg) * 5,
            startY + 10 + Math.sin(now / 170 + leg) * 3
          );
          context.lineWidth = Math.max(2, scale * 1.3);
          context.strokeStyle = leg % 2 ? "#986ffc" : "#765be3";
          context.stroke();
        }
        pet.inkIn -= delta;
        if (pet.inkIn <= 0) {
          dropInk(pet);
          pet.inkIn = 4 + state.random() * 7;
        }
      }
      drawSprite(pet.kind, pet.x, pet.y + (pet.kind === "octopus" ? 0 : 1), scale);
    }
  }

  function drawEffects(delta) {
    for (let i = state.ink.length - 1; i >= 0; i -= 1) {
      const blot = state.ink[i];
      blot.age += delta;
      if (blot.age >= blot.life) {
        state.ink.splice(i, 1);
        continue;
      }
      blot.x += blot.vx * delta;
      const radius = blot.radius * (1 + blot.age * 0.15);
      blot.y = Math.max(radius, Math.min(LIMITS.ambientHeight - radius, blot.y + blot.vy * delta));
      const alpha = 0.48 * (1 - blot.age / blot.life);
      context.fillStyle = `rgba(29,34,93,${alpha})`;
      context.beginPath();
      context.arc(blot.x, blot.y, radius, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = `rgba(125,111,244,${alpha * 0.6})`;
      context.beginPath();
      context.arc(blot.x - 1, blot.y - 1, blot.radius * 0.45, 0, Math.PI * 2);
      context.fill();
    }
    for (let i = state.particles.length - 1; i >= 0; i -= 1) {
      const particle = state.particles[i];
      particle.age += delta;
      if (particle.age >= particle.life) {
        state.particles.splice(i, 1);
        continue;
      }
      particle.x += particle.vx * delta;
      particle.y += particle.vy * delta;
      particle.vy += 42 * delta;
      const alpha = 1 - particle.age / particle.life;
      context.globalAlpha = alpha;
      context.fillStyle = particle.color;
      context.shadowColor = particle.color;
      context.shadowBlur = 10;
      context.fillRect(particle.x, particle.y, particle.size, particle.size);
    }
    context.globalAlpha = 1;
    context.shadowBlur = 0;
  }

  function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    state.width = window.innerWidth;
    state.height = window.innerHeight;
    canvas.width = Math.round(state.width * dpr);
    canvas.height = Math.round(state.height * dpr);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!prefersReducedMotion.matches) startAnimation();
  }

  function animationFrame(timestamp) {
    state.frame = 0;
    if (document.hidden || prefersReducedMotion.matches) {
      state.running = false;
      state.lastFrame = 0;
      return;
    }
    if (timestamp - state.lastRender < FRAME_INTERVAL - 0.5) {
      state.frame = requestAnimationFrame(animationFrame);
      return;
    }
    const delta = state.lastFrame ? Math.min((timestamp - state.lastFrame) / 1000, 0.1) : 0;
    state.lastFrame = timestamp;
    state.lastRender = timestamp;
    context.clearRect(0, 0, state.width, state.height);
    const shaking = state.shaking && state.shakeUntil > timestamp;
    if (state.shaking && !shaking) {
      state.shaking = false;
      counter.style.transform = "";
    }
    if (shaking) {
      context.save();
      context.translate((state.random() - 0.5) * 5, (state.random() - 0.5) * 2);
      counter.style.transform = `translate(${(state.random() - 0.5) * 4}px,${(state.random() - 0.5) * 2}px)`;
    }
    drawEffects(delta);
    drawPets(delta, timestamp);
    if (shaking) context.restore();
    state.frame = requestAnimationFrame(animationFrame);
  }

  function startAnimation() {
    if (!state.preferencesLoaded || state.running || document.hidden || prefersReducedMotion.matches ||
        (!state.preferences.powerMode && state.preferences.petMode === "off")) return;
    state.running = true;
    state.frame = requestAnimationFrame(animationFrame);
  }

  function stopAnimation() {
    if (state.frame) cancelAnimationFrame(state.frame);
    state.frame = 0;
    state.running = false;
    state.lastFrame = 0;
  }

  function applyPreferences(value) {
    const powerWasEnabled = state.preferences.powerMode;
    state.preferences = sanitizePreferences(value);
    state.preferencesLoaded = true;
    if (powerWasEnabled && !state.preferences.powerMode) resetCombo();
    updateCounter();
    reconcilePets();
    if (prefersReducedMotion.matches) {
      stopAnimation();
      context.clearRect(0, 0, state.width, state.height);
      state.particles.length = 0;
      state.ink.length = 0;
      counter.style.transform = "";
    } else if (state.preferences.powerMode || state.preferences.petMode !== "off") {
      startAnimation();
    } else {
      stopAnimation();
    }
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopAnimation();
    else startAnimation();
  });
  prefersReducedMotion.addEventListener("change", () => applyPreferences(state.preferences));
  window.addEventListener("resize", resizeCanvas, { passive: true });
  if (chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(DPMLogic.DEFAULTS, (preferences) => {
      if (chrome.runtime.lastError) {
        console.error("Developer Power Mode Combo: unable to read local settings.", chrome.runtime.lastError.message);
        return;
      }
      applyPreferences(preferences);
    });
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== "local" || (!changes.powerMode && !changes.petMode)) return;
      chrome.storage.local.get(DPMLogic.DEFAULTS, (preferences) => {
        if (chrome.runtime.lastError) {
          console.error("Developer Power Mode Combo: unable to refresh local settings.", chrome.runtime.lastError.message);
          return;
        }
        applyPreferences(preferences);
      });
    });
  } else {
    applyPreferences(DPMLogic.DEFAULTS);
  }
  resizeCanvas();
})();
