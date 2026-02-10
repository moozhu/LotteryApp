import { describe, it, expect } from 'vitest'
import { computeWinnerLayout } from './winnerLayout'

describe('computeWinnerLayout', () => {
  it('returns empty layout for empty input or invalid width', () => {
    const empty = computeWinnerLayout([], 1200)
    expect(empty.items).toHaveLength(0)
    const invalid = computeWinnerLayout(['a'], 0)
    expect(invalid.items).toHaveLength(0)
  })

  it('deduplicates ids while preserving order', () => {
    const result = computeWinnerLayout(['a', 'b', 'a', 'c', 'b'], 800)
    expect(result.items.map(item => item.id)).toEqual(['a', 'b', 'c'])
  })

  it('keeps positions within width bounds', () => {
    const width = 900
    const ids = Array.from({ length: 12 }, (_, i) => `id-${i}`)
    const result = computeWinnerLayout(ids, width)
    result.items.forEach(item => {
      expect(item.x).toBeGreaterThanOrEqual(0)
      expect(item.x).toBeLessThanOrEqual(width)
    })
  })

  it('clamps size into the expected range', () => {
    const small = computeWinnerLayout(['a', 'b', 'c'], 260)
    expect(small.size).toBeGreaterThanOrEqual(110)
    expect(small.size).toBeLessThanOrEqual(180)
    const large = computeWinnerLayout(Array.from({ length: 20 }, (_, i) => `${i}`), 2000)
    expect(large.size).toBeGreaterThanOrEqual(110)
    expect(large.size).toBeLessThanOrEqual(180)
  })
})
