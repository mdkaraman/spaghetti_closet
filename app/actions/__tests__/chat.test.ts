import { expect, test, vi } from 'vitest'
import { postComment } from '../chat'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

const { createClient } = await import('@/lib/supabase/server')

function formData(body: string | null, jontId: string | null = 'jont-1') {
  const fd = new FormData()
  if (body !== null) fd.set('body', body)
  if (jontId !== null) fd.set('jontId', jontId)
  return fd
}

function mockSupabase({
  user = { id: 'user-1' } as { id: string } | null,
  inserted = {
    id: 'comment-1',
    body: 'yo',
    created_at: '2026-02-01T00:00:00.000Z',
  } as { id: string; body: string; created_at: string } | null,
  insertError = null as { message: string } | null,
  handle = 'ada' as string | null,
} = {}) {
  const single = vi.fn(async () => ({ data: inserted, error: insertError }))
  const select = vi.fn(() => ({ single }))
  const insert = vi.fn(() => ({ select }))
  const maybeSingle = vi.fn(async () => ({
    data: handle ? { user_id: handle } : null,
    error: null,
  }))
  const eq = vi.fn(() => ({ maybeSingle }))
  const handleSelect = vi.fn(() => ({ eq }))

  vi.mocked(createClient).mockResolvedValue({
    auth: {
      getUser: async () => ({ data: { user }, error: null }),
    },
    from: (table: string) => {
      if (table === 'comments') return { insert }
      if (table === 'profile_handles') return { select: handleSelect }
      throw new Error(`unexpected table ${table}`)
    },
  } as any)

  return { insert, handleSelect, eq }
}

test('rejects an empty comment before touching the database', async () => {
  const result = await postComment(formData('   '))
  expect(result).toEqual({ ok: false, error: 'say something' })
  expect(createClient).not.toHaveBeenCalled()
})

test('rejects a missing comment body', async () => {
  const result = await postComment(formData(null))
  expect(result).toEqual({ ok: false, error: 'say something' })
  expect(createClient).not.toHaveBeenCalled()
})

test('rejects a comment over 500 characters', async () => {
  const result = await postComment(formData('a'.repeat(501)))
  expect(result).toEqual({ ok: false, error: 'too long' })
  expect(createClient).not.toHaveBeenCalled()
})

test('rejects a comment when the jont id is missing', async () => {
  const result = await postComment(formData('yo', null))
  expect(result).toEqual({ ok: false, error: 'nah' })
  expect(createClient).not.toHaveBeenCalled()
})

test('redirects home when nobody is logged in', async () => {
  const { insert } = mockSupabase({ user: null })
  await expect(postComment(formData('yo'))).rejects.toThrow('NEXT_REDIRECT:/')
  expect(insert).not.toHaveBeenCalled()
})

test('inserts a trimmed comment for the logged-in user and that jont', async () => {
  const { insert, handleSelect, eq } = mockSupabase({
    inserted: {
      id: 'comment-1',
      body: 'yo',
      created_at: '2026-02-01T00:00:00.000Z',
    },
  })

  const result = await postComment(formData('  yo  '))

  expect(insert).toHaveBeenCalledWith({
    jont_id: 'jont-1',
    user_id: 'user-1',
    body: 'yo',
  })
  expect(handleSelect).toHaveBeenCalledWith('user_id')
  expect(eq).toHaveBeenCalledWith('id', 'user-1')
  expect(result).toEqual({
    ok: true,
    comment: {
      id: 'comment-1',
      body: 'yo',
      handle: 'ada',
      createdAt: '2026-02-01T00:00:00.000Z',
    },
  })
})

test('accepts a comment of 500 characters', async () => {
  const body = 'a'.repeat(500)
  const { insert } = mockSupabase({
    inserted: {
      id: 'comment-1',
      body,
      created_at: '2026-02-01T00:00:00.000Z',
    },
  })

  const result = await postComment(formData(body))

  expect(insert).toHaveBeenCalledWith({
    jont_id: 'jont-1',
    user_id: 'user-1',
    body,
  })
  expect(result.ok).toBe(true)
})

test('returns nah when the insert fails', async () => {
  mockSupabase({ inserted: null, insertError: { message: 'nope' } })
  const result = await postComment(formData('yo'))
  expect(result).toEqual({ ok: false, error: 'nah' })
})

test('returns the comment with an empty handle when the profile handle is missing', async () => {
  mockSupabase({ handle: null })
  const result = await postComment(formData('yo'))
  expect(result).toEqual({
    ok: true,
    comment: {
      id: 'comment-1',
      body: 'yo',
      handle: '',
      createdAt: '2026-02-01T00:00:00.000Z',
    },
  })
})
