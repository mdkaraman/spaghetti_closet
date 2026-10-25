import { getJontOfTheDay, type JontRow } from '@/lib/jont'

export async function resolveJontForUser(): Promise<JontRow | null> {
  return getJontOfTheDay()
}
