import { resolveJontForUser } from '@/lib/jont/resolve'
import { createClient } from '@/lib/supabase/server'
import JontPageContent from './JontPageContent'

export default async function JontPage() {
  const jont = await resolveJontForUser()
  if (!jont) {
    return <JontPageContent jont={null} />
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('purchases')
    .select('id')
    .eq('jont_id', jont.id)
    .limit(1)

  const hasPurchase = !error && (data?.length ?? 0) > 0
  return <JontPageContent jont={jont} hasPurchase={hasPurchase} />
}
