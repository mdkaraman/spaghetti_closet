export type Bid = {
  userId: string
  amountCents: number
  createdAt: string
}

export function pickWinner(
  bids: readonly Bid[],
  balanceOf: (userId: string) => number,
): Bid | null {
  const [winner] = [...bids].sort((left, right) => {
    if (left.amountCents !== right.amountCents) {
      return right.amountCents - left.amountCents
    }

    const balanceDiff = balanceOf(right.userId) - balanceOf(left.userId)
    if (balanceDiff !== 0) return balanceDiff

    if (left.createdAt !== right.createdAt) {
      return left.createdAt < right.createdAt ? -1 : 1
    }

    if (left.userId < right.userId) return -1
    if (left.userId > right.userId) return 1
    return 0
  })

  return winner ?? null
}
