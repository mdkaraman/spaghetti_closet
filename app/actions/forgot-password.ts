'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

const RESET_WAIT_COPY = 'nahhh playa gotta wait a min and try again'

function resetErrorCopy(message: string): string {
  if (/for security purposes, you can only request this after \d+ seconds/i.test(message)) {
    return RESET_WAIT_COPY
  }
  return message
}

export async function requestPasswordReset(formData: FormData) {
  const email = (formData.get('email') as string)?.trim()

  if (!email) {
    redirect('/forgot-password?error=' + encodeURIComponent('Email required.'))
  }

  const supabase = await createClient()
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${base}/auth/callback?next=/reset-password`,
  })

  if (error) {
    redirect('/forgot-password?error=' + encodeURIComponent(resetErrorCopy(error.message)))
  }

  redirect('/forgot-password?success=1')
}
