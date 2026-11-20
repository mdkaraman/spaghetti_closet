'use server'

import { createClient } from '@/lib/supabase/server'
import { resolveJontForUser } from '@/lib/jont/resolve'
import { redirect } from 'next/navigation'

export async function payNow() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  const jont = await resolveJontForUser()
  if (!jont) {
    redirect('/user')
  }

  redirect(`/bid?jont=${jont.id}`)
}
