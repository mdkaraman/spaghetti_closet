import { createClient } from '@/lib/supabase/server'

export async function closeListingIfDue(listingId: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.rpc('close_listing_if_due', { listing_id: listingId })
  if (error) throw new Error(error.message)
}
