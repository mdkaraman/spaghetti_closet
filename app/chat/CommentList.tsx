'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { postComment, type PostedComment } from '@/app/actions/chat'
import { createClient } from '@/lib/supabase/client'
import CommentVotes from './CommentVotes'
import styles from './chat.module.css'

export type ChatComment = PostedComment

type CommentRow = {
  id: string
  jont_id?: string
  user_id: string
  body: string
  created_at: string
}

export function mergeComments(current: ChatComment[], incoming: ChatComment[]): ChatComment[] {
  const byId = new Map<string, ChatComment>()
  for (const comment of current) byId.set(comment.id, comment)
  for (const comment of incoming) {
    const previous = byId.get(comment.id)
    if (!previous) {
      byId.set(comment.id, comment)
      continue
    }
    byId.set(comment.id, {
      id: comment.id,
      body: comment.body || previous.body,
      handle: comment.handle || previous.handle,
      createdAt: comment.createdAt || previous.createdAt,
    })
  }
  return [...byId.values()].sort((a, b) => {
    if (a.createdAt < b.createdAt) return -1
    if (a.createdAt > b.createdAt) return 1
    if (a.id < b.id) return -1
    if (a.id > b.id) return 1
    return 0
  })
}

function toComments(
  rows: CommentRow[],
  handles: Map<string, string>
): ChatComment[] {
  return rows.map((row) => ({
    id: row.id,
    body: row.body,
    handle: handles.get(row.user_id) ?? '',
    createdAt: row.created_at,
  }))
}

async function handlesFor(
  supabase: ReturnType<typeof createClient>,
  userIds: string[]
): Promise<Map<string, string>> {
  const ids = [...new Set(userIds)]
  const handles = new Map<string, string>()
  if (ids.length === 0) return handles
  const { data } = await supabase
    .from('profile_handles')
    .select('id, user_id')
    .in('id', ids)
  for (const row of data ?? []) {
    handles.set(row.id as string, row.user_id as string)
  }
  return handles
}

export function CommentListView({
  jontId,
  comments,
  loaded,
  onPosted,
}: {
  jontId: string
  comments: ChatComment[]
  loaded: boolean
  onPosted: (comment: ChatComment) => void
}) {
  return (
    <section className={styles.comments}>
      {comments.length === 0 ? (
        loaded ? <p className="user-empty">say something</p> : null
      ) : (
        <ul className={styles.list}>
          {comments.map((comment) => (
            <li key={comment.id} className={styles.comment}>
              {comment.handle ? (
                <span className={styles.handle}>{comment.handle}</span>
              ) : null}
              <p className={styles.body}>{comment.body}</p>
              <CommentVotes commentId={comment.id} />
            </li>
          ))}
        </ul>
      )}
      <CommentComposer jontId={jontId} onPosted={onPosted} />
    </section>
  )
}

function CommentComposer({
  jontId,
  onPosted,
}: {
  jontId: string
  onPosted: (comment: ChatComment) => void
}) {
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const formData = new FormData(form)
    formData.set('jontId', jontId)
    setSending(true)
    void postComment(formData)
      .then((result) => {
        if (!result.ok) {
          setError(result.error)
          return
        }
        setError(null)
        form.reset()
        onPosted(result.comment)
      })
      .catch(() => {
        // A logged-out caller is redirected home. Leave the list as it is.
      })
      .finally(() => setSending(false))
  }

  return (
    <form className={styles.composer} onSubmit={onSubmit}>
      <label htmlFor="comment-body">comment</label>
      <textarea id="comment-body" name="body" rows={3} />
      <button type="submit" disabled={sending}>post</button>
      {error ? (
        <p className="form-error" role="alert">{error}</p>
      ) : null}
    </form>
  )
}

export default function CommentList({ jontId }: { jontId: string }) {
  const [comments, setComments] = useState<ChatComment[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!jontId) {
      setComments([])
      setLoaded(true)
      return
    }

    let cancelled = false
    const supabase = createClient()

    async function load() {
      const { data } = await supabase
        .from('comments')
        .select('id, body, user_id, created_at')
        .eq('jont_id', jontId)
        .order('created_at', { ascending: true })
      if (cancelled) return
      const rows = (data ?? []) as CommentRow[]
      const handles = await handlesFor(supabase, rows.map((row) => row.user_id))
      if (cancelled) return
      setComments((current) => mergeComments(current, toComments(rows, handles)))
      setLoaded(true)
    }

    void load()

    const channel = supabase
      .channel(`comments:${jontId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comments',
          filter: `jont_id=eq.${jontId}`,
        },
        (payload) => {
          const row = payload.new as Partial<CommentRow>
          if (!row.id || !row.body || !row.user_id) return
          if (row.jont_id && row.jont_id !== jontId) return
          void (async () => {
            const handles = await handlesFor(supabase, [row.user_id as string])
            if (cancelled) return
            setComments((current) =>
              mergeComments(current, [
                {
                  id: row.id as string,
                  body: row.body as string,
                  handle: handles.get(row.user_id as string) ?? '',
                  createdAt: row.created_at ?? new Date().toISOString(),
                },
              ])
            )
          })()
        }
      )
      .subscribe()

    return () => {
      cancelled = true
      void supabase.removeChannel(channel)
    }
  }, [jontId])

  function onPosted(comment: ChatComment) {
    setComments((current) => mergeComments(current, [comment]))
  }

  return (
    <CommentListView
      jontId={jontId}
      comments={comments}
      loaded={loaded}
      onPosted={onPosted}
    />
  )
}
