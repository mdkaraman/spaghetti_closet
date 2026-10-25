'use server'

import { PREFERENCE_SIZES, PREFERENCE_TYPES } from '@/app/actions/preference-choices'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

function parseChoice(
  raw: FormDataEntryValue | null,
  allowed: readonly string[]
): string | null | undefined {
  const value = typeof raw === 'string' ? raw.trim() : ''
  if (value === '') return null
  if (!allowed.includes(value)) return undefined
  return value
}

export async function savePreferences(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  const size = parseChoice(formData.get('size'), PREFERENCE_SIZES)
  const jontType = parseChoice(formData.get('jont_type'), PREFERENCE_TYPES)
  if (size === undefined || jontType === undefined) {
    redirect('/user?error=' + encodeURIComponent('pick one from the list'))
  }

  const { error } = await supabase
    .from('profiles')
    .update({ size, jont_type: jontType })
    .eq('id', user.id)

  if (error) {
    redirect('/user?error=' + encodeURIComponent('something went wrong. try again.'))
  }

  redirect('/user')
}
