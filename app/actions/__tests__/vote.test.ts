import { beforeEach, expect, test, vi } from 'vitest'
import { castCommentVote } from '../vote'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

const { createClient } = await import('@/lib/supabase/server')

function mockClient({
  user = { id: 'user-1' } as { id: string } | null,
  error = null as { message: string } | null,
} = {}) {
  const rpc = vi.fn().mockResolvedValue({ data: null, error })
  const from = vi.fn()
  vi.mocked(createClient).mockResolvedValue({
    auth: {
      getUser: () => Promise.resolve({ data: { user }, error: null }),
    },
    rpc,
    from,
  } as any)
  return { rpc, from }
}

beforeEach(() => {
  vi.mocked(createClient).mockReset()
})

test('calls cast_comment_vote with the comment id and 1', async () => {
  const { rpc } = mockClient()
  await castCommentVote('comment-1', 1)
  expect(rpc).toHaveBeenCalledWith('cast_comment_vote', {
    comment_id: 'comment-1',
    value: 1,
  })
})

test('calls cast_comment_vote with the comment id and -1', async () => {
  const { rpc } = mockClient()
  await castCommentVote('comment-1', -1)
  expect(rpc).toHaveBeenCalledWith('cast_comment_vote', {
    comment_id: 'comment-1',
    value: -1,
  })
})

test('sending the other value calls cast_comment_vote again', async () => {
  const { rpc } = mockClient()
  await castCommentVote('comment-1', 1)
  await castCommentVote('comment-1', -1)
  expect(rpc).toHaveBeenNthCalledWith(1, 'cast_comment_vote', {
    comment_id: 'comment-1',
    value: 1,
  })
  expect(rpc).toHaveBeenNthCalledWith(2, 'cast_comment_vote', {
    comment_id: 'comment-1',
    value: -1,
  })
})

test('does not call the rpc for a value other than 1 or -1', async () => {
  const { rpc } = mockClient()
  await castCommentVote('comment-1', 0)
  await castCommentVote('comment-1', 2)
  await castCommentVote('comment-1', -2)
  expect(rpc).not.toHaveBeenCalled()
})

test('does not call the rpc without a comment id', async () => {
  const { rpc } = mockClient()
  await castCommentVote('   ', 1)
  expect(rpc).not.toHaveBeenCalled()
})

test('redirects home when not logged in', async () => {
  const { rpc } = mockClient({ user: null })
  await expect(castCommentVote('comment-1', 1)).rejects.toThrow('NEXT_REDIRECT:/')
  expect(rpc).not.toHaveBeenCalled()
})

test('does not write the ledger', async () => {
  const { rpc, from } = mockClient()
  await castCommentVote('comment-1', -1)
  expect(rpc).toHaveBeenCalledTimes(1)
  expect(from).not.toHaveBeenCalled()
})

test('throws when cast_comment_vote fails', async () => {
  mockClient({ error: { message: 'not implemented' } })
  await expect(castCommentVote('comment-1', 1)).rejects.toThrow('not implemented')
})
