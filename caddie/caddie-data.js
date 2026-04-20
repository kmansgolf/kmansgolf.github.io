// ── caddie-data.js ────────────────────────────────────────────────────────
// Static data: WELD lookup tables.
// No DOM access. No side effects.
// ─────────────────────────────────────────────────────────────────────────

// WELD — Lie adjustments (yards added to plays-like distance)
// Positive = shot comes up short, need more club (rough kills spin/carry)
// Negative = shot goes longer, need less club (flyer adds distance)
const LIE_ADJ = {
  fairway:  0,
  light:   +5,
  thick:  +15,
  flyer:  -10,
};
