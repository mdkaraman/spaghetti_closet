/**
 * Formal check for lib/bids/amount.ts dollarsToCents.
 * Sync commit: 6ee91284907fcf0424bc6d526869c483858220bc
 */
import { expect, test } from 'vitest'
import { BID_AMOUNT_BOUNDS, dollarsToCents } from '@/lib/bids/amount'

const MAX_BODY_LEN = 4
const MAX_TRAILING_ZEROS = 3

/** Independent oracle: accept whole dollars ≥ 1 whose cent encoding fits the column. */
function oracle(raw: string): number | null {
  const trimmed = raw.trim()
  if (trimmed.length === 0) return null
  // Whole dollars only: digits, or digits + '.' + one or more zeros.
  const m = /^(\d+)(\.0+)?$/.exec(trimmed)
  if (!m) return null
  const dollarText = m[1]
  // Leading zeros are fine for Number, but reject non-integer Number results.
  if (!/^\d+$/.test(dollarText)) return null
  let dollars: number
  try {
    dollars = Number(dollarText)
  } catch {
    return null
  }
  if (!Number.isFinite(dollars) || !Number.isInteger(dollars)) return null
  if (dollars < BID_AMOUNT_BOUNDS.minDollars) return null
  const cents = dollars * 100
  if (!Number.isSafeInteger(cents) || cents > BID_AMOUNT_BOUNDS.maxCents) return null
  return cents
}

function* digitBodies(maxLen: number): Generator<string> {
  yield ''
  const queue = ['']
  while (queue.length) {
    const prefix = queue.shift()!
    if (prefix.length >= maxLen) continue
    for (let d = 0; d <= 9; d++) {
      const next = prefix + String(d)
      yield next
      if (next.length < maxLen) queue.push(next)
    }
  }
}

function buildCorpus(): string[] {
  const out = new Set<string>()

  for (const body of digitBodies(MAX_BODY_LEN)) {
    out.add(body)
    out.add(`  ${body}  `)
    for (let z = 1; z <= MAX_TRAILING_ZEROS; z++) {
      out.add(`${body}.${'0'.repeat(z)}`)
    }
    out.add(`${body}.5`)
    out.add(`${body}.10`)
    out.add(`-${body}`)
    out.add(`+${body}`)
  }

  const maxDollars = Math.floor(BID_AMOUNT_BOUNDS.maxCents / 100)
  for (const n of [
    maxDollars - 1,
    maxDollars,
    maxDollars + 1,
    0,
    1,
    2,
    20,
    35,
    999999,
  ]) {
    out.add(String(n))
    out.add(`${n}.00`)
    out.add(`${n}.0`)
  }

  for (const s of [
    '',
    ' ',
    '.',
    '.0',
    '0.0',
    '0',
    '00',
    '1.5',
    '1.50',
    '1.00.0',
    '20.01',
    'abc',
    '2a',
    '1e2',
    '0x10',
    '1_000',
    '1,000',
    '$20',
    '20$',
    ' 20.00 ',
  ]) {
    out.add(s)
  }

  return [...out]
}

test('dollarsToCents matches the oracle on the bounded corpus', () => {
  const corpus = buildCorpus()
  let checked = 0
  for (const input of corpus) {
    const actual = dollarsToCents(input)
    const expected = oracle(input)
    expect(actual, `input=${JSON.stringify(input)}`).toBe(expected)
    if (actual != null) {
      expect(actual % 100).toBe(0)
      expect(actual).toBeGreaterThanOrEqual(100)
      expect(actual).toBeLessThanOrEqual(BID_AMOUNT_BOUNDS.maxCents)
    }
    checked++
  }
  // Visible summary for agents reading the log.
  // eslint-disable-next-line no-console
  console.log(`formal-bid-amount: PASS cases=${checked}`)
  expect(checked).toBeGreaterThan(1000)
})

test('accepted whole dollars always scale by exactly 100', () => {
  for (const dollars of [1, 2, 7, 20, 35, 100, 9999]) {
    expect(dollarsToCents(String(dollars))).toBe(dollars * 100)
    expect(dollarsToCents(`${dollars}.00`)).toBe(dollars * 100)
  }
})
