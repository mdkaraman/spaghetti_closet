'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function submitWaitlistEmail(formData: FormData) {
  const email = (formData.get('email') as string)?.trim()

  if (!email) {
    redirect('/waitlist?error=' + encodeURIComponent('Email required.'))
  }

  const supabase = await createClient()
  const { error } = await supabase.from('waitlist_emails').insert({ email })

  if (error) {
    redirect('/waitlist?error=' + encodeURIComponent('Something went wrong. Try again.'))
  }

  redirect('/waitlist?success=1')
}
