'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function castCommentVote(commentId: string, value: number) {
  const id = commentId.trim()
  if (!id || (value !== 1 && value !== -1)) return

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/')

  const { error } = await supabase.rpc('cast_comment_vote', {
    comment_id: id,
    value,
  })

  if (error) throw new Error(error.message)
}
