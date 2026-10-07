(function (root) {
  "use strict";

  const palette = Object.freeze({
    c: "#583c37",
    C: "#cf7740",
    H: "#eea75b",
    F: "#fff0cf",
    W: "#fffaf4",
    I: "#de8c85",
    R: "#ed9a96",
    K: "#d0d9df",
    k: "#66748d",
    L: "#f3e5dd",
    Y: "#f6d474",
    P: "#382c45",
    N: "#44323b",
    M: "#dc8b9b",
    O: "#644ab5",
    o: "#9573eb",
    a: "#c9adff"
  });

  function frames(rows) {
    return Object.freeze(rows.map((frame) => Object.freeze(
      frame.map((row) => {
        if (row.length > 24) {
          throw new RangeError(`Pet sprite row has ${row.length} pixels: ${row}`);
        }
        return row.padEnd(24, ".");
      })
    )));
  }

  const sprites = Object.freeze({
    corgi: frames([
      [
        "....................",
        "...........cc..cc...",
        "..........cHHc.cHHc..",
        "..........cHIHccHIHc.",
        ".........cHHHHHHHHHc.",
        "..cc....cHHHHHHHHHHHc",
        ".cHHc..cHHHHHHHHHPPHHc",
        "cHHHHcccHHHHHHHHHcWcWc",
        "cHHHHHHHHHHHHHHHHHHNNc",
        "cHHHHHHHFFHHHHHHHHcRRc",
        ".cHHHHHHFFFHHHHHHHHccc.",
        "..cHHHHHFFHHHHHHHHc....",
        "...ccHHHFFHHHHHHHc.....",
        ".....cFFFHHHHHHc........",
        "......cFFFFcccc.........",
        "......cc....cc.........."
      ],
      [
        "....................",
        "...........cc..cc...",
        "..........cHHc.cHHc..",
        "..........cHIHccHIHc.",
        ".........cHHHHHHHHHc.",
        "..cc....cHHHHHHHHHHHc",
        ".cHHc..cHHHHHHHHHPPHHc",
        "cHHHHcccHHHHHHHHHcWcWc",
        "cHHHHHHHHHHHHHHHHHHNNc",
        "cHHHHHHHFFHHHHHHHHcRRc",
        ".cHHHHHHFFFHHHHHHHHccc.",
        "..cHHHHHFFHHHHHHHHc....",
        "...ccHHHFFHHHHHHHc.....",
        ".....cFFFHHHHHHc........",
        "........ccFFFFcccc......",
        "........cc....cc........"
      ]
    ]),
    kitty: frames([
      [
        ".............cc..cc...",
        "............cKKc.cKKc..",
        "...........cKKIkcKKIKc.",
        "..........cKKKKccKKKKc.",
        "..........cKkKKKKKKkKc.",
        ".........cKKKKKKKKKKKKc",
        "...cc...cKKYKKKKKKKKYKKc",
        "..cKKc.cKKPKKKKKKKKKPKKc",
        "..cKKKccKKKKKKKKKKKKKKKc",
        "..cKKKKKKKKKKKKKKKKKKLLc",
        "...cKKKKKKKKKKKKKKKKLLMc",
        "....cKKKKKKKKKKKKKKKLLcc",
        ".....cKKKKKLLLLKKKKKKc",
        "......ccKKLLLLLLKKKcc",
        "........cc.....cc.......",
        "........cKc...cKc......."
      ],
      [
        ".............cc..cc...",
        "............cKKc.cKKc..",
        "...........cKKIkcKKIKc.",
        "..........cKKKKccKKKKc.",
        "..........cKkKKKKKKkKc.",
        ".........cKKKKKKKKKKKKc",
        "...cc...cKKYKKKKKKKKYKKc",
        "..cKKc.cKKPKKKKKKKKKPKKc",
        "..cKKKccKKKKKKKKKKKKKKKc",
        "..cKKKKKKKKKKKKKKKKKKLLc",
        "...cKKKKKKKKKKKKKKKKLLMc",
        "....cKKKKKKKKKKKKKKKLLcc",
        ".....cKKKKKLLLLKKKKKKc",
        "......ccKKLLLLLLKKKcc",
        "............cc.....cc...",
        "............cKc...cKc..."
      ]
    ]),
    octopus: frames([
      [
        "........cOOOOOOc.....",
        "......cOoOOOOOOoOc...",
        ".....cOooOOOOOOooOc..",
        "....cOoOOOOOOOOOOoOc.",
        "...cOoOOOOOOOOOOOOoOc",
        "..cOoOOOOPPOOOOOOOOoOc",
        "..cOOOOOOWWOOOOOOOOOoc",
        "...cOOOROOOOROOOOOOOc.",
        "....cOOOOOOOOOOOOOc...",
        "......cOOOOOOOOOc.....",
        "..........cc...........",
        "........................",
        "........................",
        "........................",
        "........................",
        "........................"
      ]
    ])
  });

  const api = Object.freeze({ palette, sprites });
  root.DPMPets = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
