'use server'

import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function signup(formData: FormData) {
  const userid = (formData.get('userid') as string)?.trim()
  const email = (formData.get('email') as string)?.trim()
  const passcode = formData.get('passcode') as string
  const confirm = formData.get('confirm') as string

  if (!userid || !email || !passcode || !confirm) {
    redirect('/signup?error=' + encodeURIComponent('bruh it\'s all required'))
  }

  if (passcode !== confirm) {
    redirect('/signup?error=' + encodeURIComponent('passcode and confirm no matchy!!!'))
  }

  if (passcode.length < 6) {
    redirect('/signup?error=' + encodeURIComponent('passcode must be a very average 6 characters or longer'))
  }

  const supabase = await createClient()

  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', userid)
    .maybeSingle()

  if (existing) {
    redirect('/signup?error=' + encodeURIComponent('just be yourself!!! that user id is already taken playa'))
  }

  const { data: authData, error: signUpError } = await supabase.auth.signUp({
    email,
    password: passcode,
  })

  if (signUpError) {
    if (signUpError.message.includes('already registered') || signUpError.message.includes('already exists')) {
      redirect('/signup?error=' + encodeURIComponent('oh laawwd that email is already registered'))
    }
    redirect('/signup?error=' + encodeURIComponent(signUpError.message))
  }

  if (!authData.user) {
    redirect('/signup?error=' + encodeURIComponent('sign up failed ::cue papa roach::'))
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
    redirect('/signup?error=' + encodeURIComponent('you slept on it doggy. gotta sign in again'))
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
    redirect('/?error=' + encodeURIComponent('nah who dis???'))
  }

  const supabase = await createClient()

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('email')
    .eq('user_id', userid)
    .maybeSingle()

  if (profileError || !profile) {
    redirect('/?error=' + encodeURIComponent('nah who dis???'))
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: profile.email,
    password: passcode,
  })

  if (signInError) {
    redirect('/?error=' + encodeURIComponent('nah who dis???'))
  }

  redirect('/jont')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}

export async function updatePassword(formData: FormData) {
  const passcode = formData.get('passcode') as string
  const confirm = formData.get('confirm') as string

  if (!passcode || !confirm) {
    redirect('/reset-password?error=' + encodeURIComponent('bruh it\'s all required'))
  }

  if (passcode !== confirm) {
    redirect('/reset-password?error=' + encodeURIComponent('passcode and confirm no matchy!!!'))
  }

  if (passcode.length < 6) {
    redirect('/reset-password?error=' + encodeURIComponent('passcode must be a very average 6 characters or longer'))
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/reset-password?error=' + encodeURIComponent('session expired — request a new reset link'))
  }

  const { error } = await supabase.auth.updateUser({ password: passcode })
  if (error) {
    redirect('/reset-password?error=' + encodeURIComponent(error.message))
  }

  redirect('/jont')
}
