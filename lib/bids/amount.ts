const MIN_DOLLARS = 1
const MAX_CENTS = 2_147_483_647

/**
 * Parse a bid amount typed as whole dollars into integer cents.
 * Accepts `"20"` and `"20.00"` (any trailing `.0+`); rejects fractions,
 * negatives, empty input, and values that overflow a signed 32-bit cents column.
 */
export function dollarsToCents(raw: string): number | null {
  const trimmed = raw.trim()
  if (!/^\d+(\.0+)?$/.test(trimmed)) return null
  const dollars = Number(trimmed)
  if (!Number.isInteger(dollars) || dollars < MIN_DOLLARS) return null
  const cents = dollars * 100
  if (!Number.isSafeInteger(cents) || cents > MAX_CENTS) return null
  return cents
}

export const BID_AMOUNT_BOUNDS = {
  minDollars: MIN_DOLLARS,
  maxCents: MAX_CENTS,
} as const
