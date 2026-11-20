import { expect, test } from 'vitest'
import { pickWinner, type Bid } from '@/lib/bids/winner'

const balanceOf = (balances: Record<string, number>) => (userId: string) =>
  balances[userId] ?? 0

test('higher amount wins', () => {
  const bids: Bid[] = [
    { userId: 'bee', amountCents: 100, createdAt: '2026-11-01T10:00:00.000Z' },
    { userId: 'ada', amountCents: 200, createdAt: '2026-11-01T12:00:00.000Z' },
  ]

  expect(pickWinner(bids, balanceOf({ ada: 0, bee: 50 }))).toEqual(bids[1])
})

test('equal amounts prefer the higher balance', () => {
  const bids: Bid[] = [
    { userId: 'bee', amountCents: 200, createdAt: '2026-11-01T09:00:00.000Z' },
    { userId: 'ada', amountCents: 200, createdAt: '2026-11-01T12:00:00.000Z' },
  ]

  expect(pickWinner(bids, balanceOf({ ada: 12, bee: 4 }))).toEqual(bids[1])
})

test('equal amount and balance prefer the earlier bid', () => {
  const bids: Bid[] = [
    { userId: 'bee', amountCents: 200, createdAt: '2026-11-01T12:00:00.000Z' },
    { userId: 'ada', amountCents: 200, createdAt: '2026-11-01T09:00:00.000Z' },
  ]

  expect(pickWinner(bids, balanceOf({ ada: 8, bee: 8 }))).toEqual(bids[1])
})

test('empty list returns null', () => {
  expect(pickWinner([], balanceOf({}))).toBeNull()
})
