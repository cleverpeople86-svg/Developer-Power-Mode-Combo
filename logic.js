(function (root) {
  "use strict";

  const DEFAULTS = Object.freeze({ powerMode: true, petMode: "all" });
  const PET_MODES = Object.freeze([
    "all",
    "corgis-kitties",
    "corgis",
    "kitties",
    "octopus",
    "off"
  ]);
  const LIMITS = Object.freeze({
    maxPets: 3,
    maxInkBlots: 24,
    maxTypingParticles: 150,
    ambientHeight: 60,
    framesPerSecond: 30,
    comboInactivityMs: 1500
  });
  const ACCEPTED_INPUT_TYPES = new Set([
    "insertText",
    "deleteContentBackward",
    "deleteContentForward",
    "insertLineBreak",
    "insertParagraph"
  ]);

  function isSupportedEditor(target) {
    if (!target || typeof target !== "object") return false;
    const tag = String(target.tagName || "").toUpperCase();
    if (tag === "TEXTAREA") {
      return target.type !== "password" && !target.disabled && !target.readOnly;
    }
    if (tag === "INPUT") {
      return new Set(["text", "search", "email", "url", "tel"]).has(
        String(target.type || "text").toLowerCase()
      ) && !target.disabled && !target.readOnly;
    }
    return target.isContentEditable === true;
  }

  function keyboardKeyKind(keyEvent) {
    if (!keyEvent || keyEvent.isComposing || keyEvent.keyCode === 229) return null;
    if (keyEvent.ctrlKey || keyEvent.metaKey || keyEvent.altKey) return null;
    if (typeof keyEvent.key !== "string") return null;
    if (keyEvent.key.length === 1) return "character";
    if (["Backspace", "Delete", "Enter"].includes(keyEvent.key)) return keyEvent.key;
    return null;
  }

  function isKeyboardEdit(inputType, key) {
    if (!ACCEPTED_INPUT_TYPES.has(inputType)) return false;
    const keyKind = typeof key === "string" ? key : keyboardKeyKind(key);
    if (keyKind === "character") return inputType === "insertText";
    if (keyKind === "Backspace") return inputType === "deleteContentBackward";
    if (keyKind === "Delete") return inputType === "deleteContentForward";
    return keyKind === "Enter" &&
      (inputType === "insertLineBreak" || inputType === "insertParagraph");
  }

  function allowedPetKinds(mode) {
    switch (mode) {
      case "all": return ["corgi", "kitty", "octopus"];
      case "corgis-kitties": return ["corgi", "kitty"];
      case "corgis": return ["corgi"];
      case "kitties": return ["kitty"];
      case "octopus": return ["octopus"];
      case "off": return [];
      default: return [];
    }
  }

  function sanitizePreferences(value) {
    const preferences = value && typeof value === "object" ? value : {};
    return {
      powerMode: typeof preferences.powerMode === "boolean"
        ? preferences.powerMode
        : DEFAULTS.powerMode,
      petMode: PET_MODES.includes(preferences.petMode)
        ? preferences.petMode
        : DEFAULTS.petMode
    };
  }

  const api = Object.freeze({
    ACCEPTED_INPUT_TYPES,
    DEFAULTS,
    LIMITS,
    PET_MODES,
    allowedPetKinds,
    isKeyboardEdit,
    keyboardKeyKind,
    isSupportedEditor,
    sanitizePreferences
  });
  root.DPMLogic = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
