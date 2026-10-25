export type JontEntryMode = 'buy' | 'bid'

export type JontEntryResult = 'pay' | 'bid' | 'chat'

export const JONT_ENTRY_MODE: JontEntryMode = 'buy'

export function jontEntry({
  mode,
  hasPurchase,
}: {
  mode: JontEntryMode
  hasPurchase: boolean
}): JontEntryResult {
  if (hasPurchase) return 'chat'
  if (mode === 'bid') return 'bid'
  return 'pay'
}
