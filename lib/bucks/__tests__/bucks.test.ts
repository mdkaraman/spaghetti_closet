import { expect, test } from 'vitest'
import { canBless, voteDelta } from '@/lib/bucks'

test('voteDelta(0, 1) is 1', () => {
  expect(voteDelta(0, 1)).toBe(1)
})

test('voteDelta(1, -1) is -2', () => {
  expect(voteDelta(1, -1)).toBe(-2)
})

test('voteDelta(-1, -1) is 0', () => {
  expect(voteDelta(-1, -1)).toBe(0)
})

test('voteDelta(0, -1) is -1', () => {
  expect(voteDelta(0, -1)).toBe(-1)
})

test('voteDelta(-1, 1) is 2', () => {
  expect(voteDelta(-1, 1)).toBe(2)
})

test('voteDelta(1, 1) is 0', () => {
  expect(voteDelta(1, 1)).toBe(0)
})

test('canBless is false when the amount is above the balance', () => {
  expect(canBless(5, 6)).toBe(false)
  expect(canBless(0, 1)).toBe(false)
})

test('canBless is false for 0', () => {
  expect(canBless(5, 0)).toBe(false)
})

test('canBless is false for a negative amount', () => {
  expect(canBless(5, -1)).toBe(false)
})

test('canBless is false for an amount that is not a whole number', () => {
  expect(canBless(5, 1.5)).toBe(false)
})

test('canBless is true when the amount is the whole balance', () => {
  expect(canBless(5, 5)).toBe(true)
})

test('canBless is true when the amount is within the balance', () => {
  expect(canBless(5, 1)).toBe(true)
})
