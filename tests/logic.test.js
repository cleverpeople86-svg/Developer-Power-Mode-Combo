"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {
  allowedPetKinds,
  isKeyboardEdit,
  isSupportedEditor,
  LIMITS,
  keyboardKeyKind,
  sanitizePreferences
} = require("../logic.js");

test("eligible ordinary text inputs, textareas, and standard contenteditables are supported", () => {
  assert.equal(isSupportedEditor({ tagName: "INPUT", type: "text" }), true);
  assert.equal(isSupportedEditor({ tagName: "INPUT", type: "search" }), true);
  assert.equal(isSupportedEditor({ tagName: "TEXTAREA", type: "textarea" }), true);
  assert.equal(isSupportedEditor({ tagName: "DIV", isContentEditable: true }), true);
});

test("passwords, non-text controls, and unavailable editors are excluded", () => {
  for (const type of ["password", "checkbox", "radio", "hidden", "number", "button"]) {
    assert.equal(isSupportedEditor({ tagName: "INPUT", type }), false, type);
  }
  assert.equal(isSupportedEditor({ tagName: "INPUT", type: "text", readOnly: true }), false);
  assert.equal(isSupportedEditor({ tagName: "TEXTAREA", disabled: true }), false);
  assert.equal(isSupportedEditor({ tagName: "DIV", isContentEditable: false }), false);
  assert.equal(isSupportedEditor(null), false);
});

test("only unmodified, non-composition keyboard edit types qualify", () => {
  const press = (key, extra = {}) => ({ key, ...extra });
  assert.equal(isKeyboardEdit("insertText", press("a")), true);
  assert.equal(isKeyboardEdit("deleteContentBackward", press("Backspace")), true);
  assert.equal(isKeyboardEdit("deleteContentForward", press("Delete")), true);
  assert.equal(isKeyboardEdit("insertLineBreak", press("Enter")), true);
  assert.equal(isKeyboardEdit("insertParagraph", press("Enter")), true);
  assert.equal(isKeyboardEdit("deleteContentBackward", press("Enter")), false);
  assert.equal(isKeyboardEdit("insertText", press("Backspace")), false);
  assert.equal(isKeyboardEdit("insertText", press("v", { ctrlKey: true })), false);
  assert.equal(isKeyboardEdit("insertText", press("v", { metaKey: true })), false);
  assert.equal(isKeyboardEdit("insertText", press("v", { altKey: true })), false);
  assert.equal(isKeyboardEdit("insertText", press("a", { isComposing: true })), false);
  assert.equal(isKeyboardEdit("insertText", press("a", { keyCode: 229 })), false);
  assert.equal(isKeyboardEdit("insertFromPaste", press("v")), false);
  assert.equal(isKeyboardEdit("historyUndo", press("z")), false);
  assert.equal(isKeyboardEdit("deleteWordBackward", press("Backspace", { ctrlKey: true })), false);
  assert.equal(isKeyboardEdit("insertText", press("Shift")), false);
});

test("keyboard tracking retains only edit categories, never the typed key", () => {
  assert.equal(keyboardKeyKind({ key: "x" }), "character");
  assert.equal(keyboardKeyKind({ key: "Backspace" }), "Backspace");
  assert.equal(keyboardKeyKind({ key: "Enter" }), "Enter");
  assert.equal(keyboardKeyKind({ key: "Dead" }), null);
  assert.equal(keyboardKeyKind({ key: "x", ctrlKey: true }), null);
  assert.equal(keyboardKeyKind({ key: "x", isComposing: true }), null);
  assert.equal(keyboardKeyKind({ key: "x", keyCode: 229 }), null);
});

test("pet selections map to the requested original species", () => {
  assert.deepEqual(allowedPetKinds("all"), ["corgi", "kitty", "octopus"]);
  assert.deepEqual(allowedPetKinds("corgis-kitties"), ["corgi", "kitty"]);
  assert.deepEqual(allowedPetKinds("corgis"), ["corgi"]);
  assert.deepEqual(allowedPetKinds("kitties"), ["kitty"]);
  assert.deepEqual(allowedPetKinds("octopus"), ["octopus"]);
  assert.deepEqual(allowedPetKinds("off"), []);
  assert.deepEqual(allowedPetKinds("invalid"), []);
});

test("stored preferences preserve valid values and safely fall back for invalid values", () => {
  assert.deepEqual(sanitizePreferences({ powerMode: false, petMode: "octopus" }), {
    powerMode: false,
    petMode: "octopus"
  });
  assert.deepEqual(sanitizePreferences({ powerMode: "yes", petMode: "unknown" }), {
    powerMode: true,
    petMode: "all"
  });
  assert.deepEqual(sanitizePreferences(null), { powerMode: true, petMode: "all" });
});

test("animation, particle, pet, ink, and combo limits match the requested bounds", () => {
  assert.deepEqual(LIMITS, {
    maxPets: 3,
    maxInkBlots: 24,
    maxTypingParticles: 150,
    ambientHeight: 60,
    framesPerSecond: 30,
    comboInactivityMs: 1500
  });
});
