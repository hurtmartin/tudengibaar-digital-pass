// Knobs that change how the site looks or feels. Safe to tweak; nothing else depends on the exact values.
// CSS animation lengths (shake, toast slide, route draw, …) live in index.css under @theme instead.

// ── Background ─────────────────────────────────────────────────────────────
// Look of the WebGL sky. Directions in degrees: 0 right, 90 up.
export const SKY = {
  density: 0.8, // star count multiplier
  depth: 1.0, // 0 = all layers drift together, 1 = near layers much faster than far ones
  speed: 0.1, // drift speed, 0 = still
  direction: 120,
  twinkle: 0.0, // 0 steady .. 1 strong
  glow: 0.0, // halo and cross flare on the brightest stars
  warmth: 1, // 0 = all white, 1 = some blue and amber stars
  haze: 0.05, // strength of the green nebula clouds
  hazeColor: [0x34 / 255, 0xc8 / 255, 0x6c / 255], // --color-neon
}
export const SKY_FPS = 30 // a slow background doesn't need 60fps; halves the battery cost
export const SKY_MAX_DPR = 1.5 // sharpness cap on high-density screens

// ── Shared ─────────────────────────────────────────────────────────────────
export const TOAST_MS = 3_600 // how long a toast at the top stays (bingo wins, chase solves)
export const PROGRESS_FILL_MS = 2_267 // the green fill sliding across "n/8 leitud"

// ── Bingo ──────────────────────────────────────────────────────────────────
export const BINGO_RESET_CONFIRM_MS = 6_000 // window for the second tap on "Alusta otsast"
export const BINGO_UNDO_MS = 6_000 // how long the "Võta tagasi" bar stays after a reset
export const BINGO_UFO_FLY_OUT = 62 // how far past the card the line UFO starts and ends (% of the card from its centre)

// ── Planet chase ───────────────────────────────────────────────────────────
// Must match --animate-draw in index.css: the next planet reacts once the new route stretch is drawn
export const ROUTE_DRAW_MS = 1_200
export const ROUTE_EDGE = 0.167 // share of the canvas width kept free outside the route's turns
export const ROUTE_WOBBLE = 1.67 // how hand-drawn the route looks: 0 = neat and regular
// Opening glide down to the next planet: a pause, then baseMs + msPerPx per pixel travelled, capped at maxMs
export const CHASE_GLIDE = { delayMs: 267, baseMs: 600, msPerPx: 0.5, maxMs: 2400 }

// ── Outfit contest ─────────────────────────────────────────────────────────
export const CONTEST_PAGE_SIZE = 10 // contestants per page in the vote list
export const VOTE_SPARK_COLORS = ['#f5f5f5', '#ffd27a'] // stars forming the UFO after a vote (white and amber)

// ── Admin ──────────────────────────────────────────────────────────────────
export const ADMIN_CONFIRM_MS = 4_000 // window for the second tap on "Lukusta hääletus" and burst deletes
export const ADMIN_UNDO_MS = 6_000 // how long "Võta tagasi" stays after deleting a contestant
export const ADMIN_STALE_MS = 15_000 // no good refresh for this long → the status bar warns (3 missed polls)
