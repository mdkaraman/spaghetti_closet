import { expect, test } from 'vitest'
import { BID_AMOUNT_BOUNDS, dollarsToCents } from '@/lib/bids/amount'

test('whole dollars become cents', () => {
  expect(dollarsToCents('20')).toBe(2000)
  expect(dollarsToCents('1')).toBe(100)
})

test('trailing .0+ is accepted', () => {
  expect(dollarsToCents('20.00')).toBe(2000)
  expect(dollarsToCents('3.0')).toBe(300)
})

test('rejects fractions, zero, empty, and negatives', () => {
  expect(dollarsToCents('1.5')).toBeNull()
  expect(dollarsToCents('0')).toBeNull()
  expect(dollarsToCents('')).toBeNull()
  expect(dollarsToCents('-3')).toBeNull()
})

test('rejects overflow past the cents column max', () => {
  const tooMany = Math.floor(BID_AMOUNT_BOUNDS.maxCents / 100) + 1
  expect(dollarsToCents(String(tooMany))).toBeNull()
})
