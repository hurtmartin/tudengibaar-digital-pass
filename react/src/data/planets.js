import placeholder from '../assets/planets/planet_placeholder.png'

// Planet chase, in chase order. x/y = centre as % of the canvas, size = % of canvas width.
// Get a hash for a real answer with:  npm run hash -- "answer"
// TESTING: every planet accepts "win". Replace hashes before the event.
// `hue` only tells the placeholder copies apart; drop it when real art (img) arrives.
const TEST_HASH = '823a3180dad3c9c3c4dea43ab2baf9f04bac9c3a7711745ff5f702551496d735' // "win"

const LAYOUT = [
  { x: 22, y: 12, size: 26 },
  { x: 74, y: 22, size: 22 },
  { x: 30, y: 35, size: 24 },
  { x: 74, y: 46, size: 26 },
  { x: 26, y: 58, size: 22 },
  { x: 72, y: 69, size: 24 },
  { x: 28, y: 81, size: 26 },
  { x: 70, y: 92, size: 28 },
]

export const PLANETS = LAYOUT.map((pos, i) => ({
  id: `planet-${i + 1}`,
  img: placeholder,
  ...pos,
  hash: TEST_HASH,
  hue: i * 45,
}))
