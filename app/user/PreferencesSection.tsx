import { Suspense } from 'react'
import { PREFERENCE_SIZES, PREFERENCE_TYPES } from '@/app/actions/preference-choices'
import { createClient } from '@/lib/supabase/server'
import PreferencesForm from './PreferencesForm'

function selectedValue(value: string | null | undefined, allowed: readonly string[]): string {
  if (value != null && allowed.includes(value)) return value
  return ''
}

export default async function PreferencesSection() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data } = await supabase
    .from('profiles')
    .select('size, jont_type')
    .eq('id', user.id)
    .single()

  const profile = data as { size?: string | null; jont_type?: string | null } | null
  const size = selectedValue(profile?.size, PREFERENCE_SIZES)
  const jontType = selectedValue(profile?.jont_type, PREFERENCE_TYPES)

  return (
    <>
      <h2 className="user-heading">preferences</h2>
      <Suspense fallback={null}>
        <PreferencesForm size={size} jontType={jontType} />
      </Suspense>
    </>
  )
}
