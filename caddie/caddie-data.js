// ── caddie-data.js ────────────────────────────────────────────────────────
// Static data: presets, WELD lookup tables.
// No DOM access. No side effects.
// ─────────────────────────────────────────────────────────────────────────

// Short game and putting share identical timing tiers (2:1 ratio).
// A single reference prevents divergence if tiers are ever updated.
const SHORT_PUTT_PRESETS = [
  { name: 'Fast',     total: 0.70 },  // 14/7 — fastest Tour short game
  { name: 'Tour Std', total: 0.80 },  // 16/8 — Tiger, McDowell
  { name: 'Smooth',   total: 0.90 },  // 18/9
  { name: 'Slow',     total: 1.00 },  // 20/10 — Harrington, Hoffman
  { name: 'Practice', total: 1.10 },  // 22/11 — deliberate groove work
];

// All times in seconds (takeaway → impact).
// Full swing 3:1: back = total × 0.75,  down = total × 0.25
// Short/Putt 2:1: back = total × 0.667, down = total × 0.333
const PRESETS = {
  full: [
    { name: 'Explosive',   total: 0.80 },  // 18/6 — Rory, Wyndham Clark
    { name: 'Tour Fast',   total: 0.93 },  // 21/7 — Hogan, Adam Scott
    { name: 'Tour Std',    total: 1.07 },  // 24/8 — Couples, Scheffler (default)
    { name: 'Tour Smooth', total: 1.20 },  // 27/9 — slowest legit Tour tempo
    { name: 'Practice',    total: 1.50 },  // deliberate groove work
  ],
  short: SHORT_PUTT_PRESETS,
  putt:  SHORT_PUTT_PRESETS,
};

// WELD — Lie adjustments (yards added to plays-like distance)
// Positive = shot comes up short, need more club (rough kills spin/carry)
// Negative = shot goes longer, need less club (flyer adds distance)
const LIE_ADJ = {
  fairway:  0,
  light:   +5,
  thick:  +15,
  flyer:  -10,
};
