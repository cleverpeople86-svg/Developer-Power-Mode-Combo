(function (root) {
  "use strict";

  const palette = Object.freeze({
    "C": "#e89956",
    "c": "#f4c873",
    "E": "#ffe2a4",
    "K": "#ff91bb",
    "k": "#c972a0",
    "P": "#49364d",
    "W": "#fff7ec",
    "O": "#a884ff",
    "o": "#f4a5ff"
  });

  const sprites = Object.freeze({
    corgi: Object.freeze([
      "................",
      "...cccc.........",
      "..cCCCCcc.......",
      ".cCCCCCCc.......",
      ".cPPcCCc........",
      ".cEccEEc......cc",
      "..ccEEEc.....cCC",
      "...cCCCc....cCCc",
      "...cCccccc.cCCc.",
      ".c.cCCCCCCCCc...",
      "cccccCCCcEEcc...",
      "..cCCCCcEEEEc...",
      "...cCCCcEEEcc...",
      "...cCccccc......",
      "...cc...cc......",
      "................"
    ]),
    kitty: Object.freeze([
      "................",
      "......kk........",
      ".....kKk.kKk....",
      "....kKKK.kKKk...",
      "...kKKKKKkKKKk..",
      "...kKPPk.KPPKk..",
      "...kKKKKKKKKKk..",
      "...kK.W.KK.KKk..",
      "....kKKKKKKKk...",
      ".....kKKKKKk....",
      ".....kKkckKk....",
      "....kkk.ckkk....",
      "...kk...kk......",
      "..kk....kk......",
      "................",
      "................"
    ]),
    octopus: Object.freeze([
      "................",
      ".....OOOOOO.....",
      "...OOoOOOOoOO...",
      "..OOoOOOOOOoOO..",
      ".OOOOOOOOOOOOOO.",
      ".OOPOOOOOOPOOOO.",
      ".OOOOOO.OOOOOOO.",
      "..OOOOOOOOOOOO..",
      "...OOOOOOOOOO...",
      "....OOOOOOOO....",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................"
    ])
  });

  root.DPMPets = Object.freeze({ palette, sprites });
})(typeof globalThis !== "undefined" ? globalThis : this);
