'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

type ParsedGift =
  | { ok: false; error: string }
  | { ok: true; handle: string; amount: number }

function field(formData: FormData, name: string): string {
  const value = formData.get(name)
  return typeof value === 'string' ? value : ''
}

function parseGift(handleRaw: string, amountRaw: string): ParsedGift {
  const handle = handleRaw.trim()
  if (!handle) return { ok: false, error: 'who you blessing' }

  const amountText = amountRaw.trim()
  if (!/^[0-9]+$/.test(amountText)) {
    return { ok: false, error: 'whole number, 1 minimum' }
  }
  const amount = Number(amountText)
  if (!Number.isSafeInteger(amount) || amount < 1) {
    return { ok: false, error: 'whole number, 1 minimum' }
  }

  return { ok: true, handle, amount }
}

function blessError(message: string): never {
  redirect('/user?error=' + encodeURIComponent(message))
}

export async function bless(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  const parsed = parseGift(field(formData, 'handle'), field(formData, 'amount'))
  if (!parsed.ok) {
    blessError(parsed.error)
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('id', user.id)
    .single()

  const callerHandle = typeof profile?.user_id === 'string' ? profile.user_id : ''
  if (parsed.handle === callerHandle) {
    blessError('cannot bless yourself')
  }

  const { error } = await supabase.rpc('bless_spaghetti', {
    recipient_handle: parsed.handle,
    amount: parsed.amount,
  })

  if (error) {
    blessError(error.message)
  }

  redirect('/user')
}
