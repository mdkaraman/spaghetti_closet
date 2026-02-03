'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function requestPasswordReset(formData: FormData) {
  const email = (formData.get('email') as string)?.trim()

  if (!email) {
    redirect('/forgot-password?error=' + encodeURIComponent('Email required.'))
  }

  const supabase = await createClient()
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${base}/auth/callback?next=/`,
  })

  if (error) {
    redirect('/forgot-password?error=' + encodeURIComponent(error.message))
  }

  redirect('/forgot-password?success=1')
}
