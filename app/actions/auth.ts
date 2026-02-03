'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function signup(_prev: unknown, formData: FormData) {
  const userid = (formData.get('userid') as string)?.trim()
  const email = (formData.get('email') as string)?.trim()
  const passcode = formData.get('passcode') as string
  const confirm = formData.get('confirm') as string

  if (!userid || !email || !passcode || !confirm) {
    redirect('/signup?error=' + encodeURIComponent('All fields required.'))
  }

  if (passcode !== confirm) {
    redirect('/signup?error=' + encodeURIComponent('Passcode and confirm do not match.'))
  }

  if (passcode.length < 6) {
    redirect('/signup?error=' + encodeURIComponent('Passcode must be at least 6 characters.'))
  }

  const supabase = await createClient()

  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', userid)
    .maybeSingle()

  if (existing) {
    redirect('/signup?error=' + encodeURIComponent('That user id is already taken.'))
  }

  const { data: authData, error: signUpError } = await supabase.auth.signUp({
    email,
    password: passcode,
  })

  if (signUpError) {
    if (signUpError.message.includes('already registered') || signUpError.message.includes('already exists')) {
      redirect('/signup?error=' + encodeURIComponent('That email is already registered.'))
    }
    redirect('/signup?error=' + encodeURIComponent(signUpError.message))
  }

  if (!authData.user) {
    redirect('/signup?error=' + encodeURIComponent('Sign up failed.'))
  }

  const { error: profileError } = await supabase.from('profiles').insert({
    id: authData.user.id,
    user_id: userid,
    email,
  })

  if (profileError) {
    redirect('/signup?error=' + encodeURIComponent('Could not create profile. Try again.'))
  }

  redirect('/jont')
}

export async function login(_prev: unknown, formData: FormData) {
  const userid = (formData.get('userid') as string)?.trim()
  const passcode = formData.get('passcode') as string

  if (!userid || !passcode) {
    redirect('/?error=' + encodeURIComponent('User id and passcode required.'))
  }

  const supabase = await createClient()

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('email')
    .eq('user_id', userid)
    .maybeSingle()

  if (profileError || !profile) {
    redirect('/?error=' + encodeURIComponent('Invalid user id or passcode.'))
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: profile.email,
    password: passcode,
  })

  if (signInError) {
    redirect('/?error=' + encodeURIComponent('Invalid user id or passcode.'))
  }

  redirect('/jont')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}
