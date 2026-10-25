'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function listPurchase(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  const purchaseId = String(formData.get('purchase_id') ?? '').trim()
  if (!purchaseId) {
    redirect('/sell?error=' + encodeURIComponent('pick one'))
  }

  const { data: purchase, error: purchaseError } = await supabase
    .from('purchases')
    .select('id, user_id, jont_id')
    .eq('id', purchaseId)
    .maybeSingle()

  if (purchaseError || !purchase || purchase.user_id !== user.id) {
    redirect('/sell?error=' + encodeURIComponent('not yours'))
  }

  const { data: existing, error: existingError } = await supabase
    .from('listings')
    .select('id')
    .eq('purchase_id', purchase.id)
    .maybeSingle()

  if (existingError) {
    redirect('/sell?error=' + encodeURIComponent('could not list it'))
  }

  if (existing) {
    redirect('/sell?error=' + encodeURIComponent('already up'))
  }

  const { error } = await supabase.from('listings').insert({
    seller_id: user.id,
    jont_id: purchase.jont_id,
    purchase_id: purchase.id,
    status: 'open',
  })

  if (error) {
    redirect('/sell?error=' + encodeURIComponent('could not list it'))
  }

  redirect('/sell')
}
