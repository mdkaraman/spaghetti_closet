import { expect, test } from 'vitest'
import { JONT_ENTRY_MODE, jontEntry } from '../entry'

test('buy mode starts as the entry mode', () => {
  expect(JONT_ENTRY_MODE).toBe('buy')
})

test('buy mode with no purchase is pay', () => {
  expect(jontEntry({ mode: 'buy', hasPurchase: false })).toBe('pay')
})

test('buy mode with a purchase is chat', () => {
  expect(jontEntry({ mode: 'buy', hasPurchase: true })).toBe('chat')
})

test('bid mode with no purchase is bid', () => {
  expect(jontEntry({ mode: 'bid', hasPurchase: false })).toBe('bid')
})

test('bid mode with a purchase is still chat', () => {
  expect(jontEntry({ mode: 'bid', hasPurchase: true })).toBe('chat')
})
