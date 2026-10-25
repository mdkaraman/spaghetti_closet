export function voteDelta(oldValue: -1 | 0 | 1, newValue: -1 | 1): number {
  return newValue - oldValue
}

export function canBless(balance: number, amount: number): boolean {
  if (!Number.isInteger(balance) || !Number.isInteger(amount)) return false
  if (amount < 1) return false
  return amount <= balance
}
