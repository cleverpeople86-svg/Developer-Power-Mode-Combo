(function () {
  "use strict";

  const OPTIONS = Object.freeze([
    { value: "all", label: "All pets", sprites: ["corgi", "kitty", "octopus"] },
    { value: "corgis-kitties", label: "Corgis & Kitties", sprites: ["corgi", "kitty"] },
    { value: "corgis", label: "Corgis", sprites: ["corgi"] },
    { value: "kitties", label: "Kitties", sprites: ["kitty"] },
    { value: "octopus", label: "Octopus", sprites: ["octopus"] },
    { value: "off", label: "Off", sprites: [] }
  ]);
  const status = document.getElementById("status");
  const powerToggle = document.getElementById("power-toggle");
  const optionList = document.getElementById("pet-options");
  const controls = [powerToggle];
  let current = { ...DPMLogic.DEFAULTS };
  let saving = false;

  function preview(kind) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const rows = DPMPets.sprites[kind];
    const pixels = document.createElementNS("http://www.w3.org/2000/svg", "g");
    pixels.setAttribute("shape-rendering", "crispEdges");
    for (let row = 0; row < rows.length; row += 1) {
      for (let column = 0; column < rows[row].length; column += 1) {
        const color = DPMPets.palette[rows[row][column]];
        if (!color) continue;
        const pixel = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        pixel.setAttribute("x", String(column));
        pixel.setAttribute("y", String(row));
        pixel.setAttribute("width", "1");
        pixel.setAttribute("height", "1");
        pixel.setAttribute("fill", color);
        pixels.append(pixel);
      }
    }
    svg.setAttribute("viewBox", "0 0 16 16");
    svg.setAttribute("aria-hidden", "true");
    svg.append(pixels);
    return svg;
  }

  const optionButtons = OPTIONS.map((option) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "pet-option";
    button.setAttribute("aria-pressed", "false");
    button.dataset.mode = option.value;
    const artwork = document.createElement("span");
    artwork.className = "pet-art";
    artwork.setAttribute("aria-hidden", "true");
    option.sprites.forEach((kind) => artwork.append(preview(kind)));
    const label = document.createElement("span");
    label.textContent = option.label;
    button.append(artwork, label);
    button.addEventListener("click", () => save({ petMode: option.value }));
    optionList.append(button);
    return button;
  });

  function render(value) {
    current = DPMLogic.sanitizePreferences(value);
    powerToggle.setAttribute("aria-checked", String(current.powerMode));
    optionButtons.forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.mode === current.petMode));
    });
  }

  function setBusy(value) {
    saving = value;
    controls.forEach((control) => { control.disabled = value; });
    optionButtons.forEach((button) => { button.disabled = value; });
  }

  function save(change) {
    if (saving) return;
    const next = DPMLogic.sanitizePreferences({ ...current, ...change });
    setBusy(true);
    status.textContent = "";
    chrome.storage.local.set(next, () => {
      if (chrome.runtime.lastError) {
        status.textContent = "Couldn't save settings. Please try again.";
        console.error("Developer Power Mode Combo: unable to save local settings.", chrome.runtime.lastError.message);
        setBusy(false);
        return;
      }
      render(next);
      status.textContent = "Settings saved on this device.";
      setBusy(false);
    });
  }

  powerToggle.addEventListener("click", () => save({ powerMode: !current.powerMode }));
  chrome.storage.local.get(DPMLogic.DEFAULTS, (value) => {
    if (chrome.runtime.lastError) {
      status.textContent = "Couldn't load settings. Try reloading this popup.";
      console.error("Developer Power Mode Combo: unable to load local settings.", chrome.runtime.lastError.message);
      setBusy(true);
      return;
    }
    render(value);
  });
})();
