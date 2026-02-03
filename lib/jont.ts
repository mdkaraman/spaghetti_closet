import { createClient } from '@/lib/supabase/server'
import { todayEastCoast } from '@/lib/date'

export type JontRow = {
  id: string
  date: string
  title: string | null
  description: string | null
  image_url: string | null
  price_cents: number | null
  created_at: string
}

export async function getJontOfTheDay(): Promise<JontRow | null> {
  const today = todayEastCoast()
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('jonts')
    .select('id, date, title, description, image_url, price_cents, created_at')
    .eq('date', today)
    .maybeSingle()

  if (error) return null
  if (!data) return null

  return {
    ...data,
    date: data.date as string,
  }
}
