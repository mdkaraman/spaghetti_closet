'use server'

import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function signup(formData: FormData) {
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

  // Prefer trigger-based profile creation (no privileged key). If a secret/service key
  // is set, we can insert here in the same request; otherwise redirect to complete
  // so the profile is updated with the chosen handle in a request that has the session.
  try {
    const service = createServiceRoleClient()
    const { error: profileError } = await service.from('profiles').insert({
      id: authData.user.id,
      user_id: userid,
      email,
    })
    if (!profileError) {
      redirect('/jont')
      return
    }
  } catch {
    // No SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY — use trigger + complete flow
  }

  redirect('/signup/complete?userid=' + encodeURIComponent(userid))
}

/** Called after signUp when session is available; sets profile.user_id (handle). */
export async function completeSignup(userid: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/signup?error=' + encodeURIComponent('Session expired. Please sign in.'))
  }

  const trimmed = (userid ?? '').trim()
  if (!trimmed) {
    redirect('/signup')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle()

  if (profile) {
    const { error } = await supabase
      .from('profiles')
      .update({ user_id: trimmed })
      .eq('id', user.id)
    if (error) {
      redirect('/signup?error=' + encodeURIComponent(error.message))
    }
  } else {
    const { error } = await supabase.from('profiles').insert({
      id: user.id,
      user_id: trimmed,
      email: user.email ?? '',
    })
    if (error) {
      redirect('/signup?error=' + encodeURIComponent(error.message))
    }
  }

  redirect('/jont')
}

export async function login(formData: FormData) {
  const userid = (formData.get('userid') as string)?.trim()
  const passcode = formData.get('passcode') as string

  if (!userid || !passcode) {
    redirect('/wtf-is-this')
  }

  const supabase = await createClient()

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('email')
    .eq('user_id', userid)
    .maybeSingle()

  if (profileError || !profile) {
    redirect('/wtf-is-this')
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: profile.email,
    password: passcode,
  })

  if (signInError) {
    redirect('/wtf-is-this')
  }

  redirect('/jont')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}
