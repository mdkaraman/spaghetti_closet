import { createClient } from '@/lib/supabase/server'

function wholeNumber(data: unknown): number {
  if (typeof data !== 'number' || !Number.isFinite(data)) return 0
  return Math.trunc(data)
}

export default async function BucksSection() {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('my_spaghetti_bucks')
  const balance = error ? 0 : wholeNumber(data)

  return (
    <>
      <h2 className="user-heading">spaghetti bucks</h2>
      <p className="user-empty">{balance}</p>
    </>
  )
}
