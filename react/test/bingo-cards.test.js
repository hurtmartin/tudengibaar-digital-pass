import { describe, expect, it } from 'vitest'
import cards from '../src/data/bingo-cards.json'

describe('bingo cards', () => {
  it('has 5 cards of 16 cells with unique ids', () => {
    expect(cards).toHaveLength(5)
    expect(new Set(cards.map((c) => c.id)).size).toBe(5)
    for (const card of cards) expect(card.cells).toHaveLength(16)
  })

  it('has non-empty title and artist in every cell', () => {
    for (const cell of cards.flatMap((c) => c.cells)) {
      expect(cell.title.trim()).not.toBe('')
      expect(cell.artist.trim()).not.toBe('')
    }
  })

  it('never repeats a song within a card', () => {
    for (const card of cards) {
      const songs = card.cells.map((c) => `${c.title}|${c.artist}`)
      expect(new Set(songs).size).toBe(16)
    }
  })
})
