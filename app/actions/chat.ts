'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

const MAX_BODY = 500

export type PostedComment = {
  id: string
  body: string
  handle: string
  createdAt: string
}

export type PostCommentResult =
  | { ok: true; comment: PostedComment }
  | { ok: false; error: string }

function commentBody(
  raw: FormDataEntryValue | null
): { ok: true; body: string } | { ok: false; error: string } {
  if (typeof raw !== 'string') return { ok: false, error: 'say something' }
  const body = raw.trim()
  if (!body) return { ok: false, error: 'say something' }
  if (body.length > MAX_BODY) return { ok: false, error: 'too long' }
  return { ok: true, body }
}

export async function postComment(formData: FormData): Promise<PostCommentResult> {
  const parsed = commentBody(formData.get('body'))
  if (!parsed.ok) return parsed

  const jontId = String(formData.get('jontId') ?? '').trim()
  if (!jontId) return { ok: false, error: 'nah' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data, error } = await supabase
    .from('comments')
    .insert({
      jont_id: jontId,
      user_id: user.id,
      body: parsed.body,
    })
    .select('id, body, created_at')
    .single()

  if (error || !data) return { ok: false, error: 'nah' }

  const { data: handleRow } = await supabase
    .from('profile_handles')
    .select('user_id')
    .eq('id', user.id)
    .maybeSingle()

  return {
    ok: true,
    comment: {
      id: data.id as string,
      body: data.body as string,
      handle: (handleRow?.user_id as string | undefined) ?? '',
      createdAt: data.created_at as string,
    },
  }
}
