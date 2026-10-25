'use client'

import { useCallback, useEffect, useState } from 'react'
import { castCommentVote } from '@/app/actions/vote'
import { createClient } from '@/lib/supabase/client'

function tally(rows: { value: number }[] | null) {
  let up = 0
  let down = 0
  for (const row of rows ?? []) {
    const value = Number(row.value)
    if (value === 1) up += 1
    else if (value === -1) down += 1
  }
  return { up, down }
}

async function loadTallies(commentId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('comment_votes')
    .select('value')
    .eq('comment_id', commentId)

  if (error) throw new Error(error.message)
  return tally(data)
}

export default function CommentVotes({ commentId }: { commentId: string }) {
  const [up, setUp] = useState(0)
  const [down, setDown] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    const counts = await loadTallies(commentId)
    setUp(counts.up)
    setDown(counts.down)
  }, [commentId])

  useEffect(() => {
    let active = true
    refresh().catch((err: unknown) => {
      if (!active) return
      setError(err instanceof Error ? err.message : 'vote failed')
    })
    return () => {
      active = false
    }
  }, [refresh])

  async function vote(value: 1 | -1) {
    setError(null)
    try {
      await castCommentVote(commentId, value)
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'vote failed')
    }
  }

  return (
    <div>
      <button type="button" className="pay-button" onClick={() => void vote(1)}>
        up {up}
      </button>
      {' '}
      <button type="button" className="pay-button" onClick={() => void vote(-1)}>
        down {down}
      </button>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
    </div>
  )
}
