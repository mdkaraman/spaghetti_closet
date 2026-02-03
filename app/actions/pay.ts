'use server'

import { createClient } from '@/lib/supabase/server'
import { getJontOfTheDay } from '@/lib/jont'
import { redirect } from 'next/navigation'

export async function payNow() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  const jont = await getJontOfTheDay()
  if (jont) {
    await supabase.from('purchases').insert({
      user_id: user.id,
      jont_id: jont.id,
    })
    // Ignore duplicate (user already bought today's jont); still redirect
  }

  redirect('/user')
}
