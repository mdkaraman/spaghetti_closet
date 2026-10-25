import { beforeEach, expect, test, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import CommentVotes from '../CommentVotes'

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(),
}))

vi.mock('@/app/actions/vote', () => ({
  castCommentVote: vi.fn(async () => {}),
}))

const { createClient } = await import('@/lib/supabase/client')
const { castCommentVote } = await import('@/app/actions/vote')

function mockVotes(rows: { value: number }[]) {
  const eq = vi.fn().mockResolvedValue({ data: rows, error: null })
  const select = vi.fn(() => ({ eq }))
  const from = vi.fn((table: string) => {
    if (table !== 'comment_votes') throw new Error(`unexpected table ${table}`)
    return { select }
  })
  vi.mocked(createClient).mockReturnValue({ from } as any)
  return { select, eq }
}

beforeEach(() => {
  vi.mocked(castCommentVote).mockClear()
})

test('renders up and down for a commentId and shows both tallies', async () => {
  const { select, eq } = mockVotes([
    { value: 1 },
    { value: 1 },
    { value: -1 },
    { value: 0 },
  ])
  render(<CommentVotes commentId="comment-1" />)

  expect(await screen.findByRole('button', { name: /^up 2$/ })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /^down 1$/ })).toBeInTheDocument()
  expect(select).toHaveBeenCalledWith('value')
  expect(eq).toHaveBeenCalledWith('comment_id', 'comment-1')
})

test('shows zero tallies when the comment has no votes', async () => {
  const { eq } = mockVotes([])
  render(<CommentVotes commentId="comment-2" />)

  expect(await screen.findByRole('button', { name: /^up 0$/ })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /^down 0$/ })).toBeInTheDocument()
  await waitFor(() => {
    expect(eq).toHaveBeenCalledWith('comment_id', 'comment-2')
  })
})

test('up calls castCommentVote with the comment id and 1', async () => {
  mockVotes([{ value: 1 }])
  render(<CommentVotes commentId="comment-1" />)

  fireEvent.click(await screen.findByRole('button', { name: /^up 1$/ }))

  await waitFor(() => {
    expect(castCommentVote).toHaveBeenCalledWith('comment-1', 1)
  })
})

test('down calls castCommentVote with the comment id and -1', async () => {
  let rows = [{ value: 1 }]
  const eq = vi.fn(async () => ({ data: rows, error: null }))
  const select = vi.fn(() => ({ eq }))
  vi.mocked(createClient).mockReturnValue({
    from: (table: string) => {
      if (table !== 'comment_votes') throw new Error(`unexpected table ${table}`)
      return { select }
    },
  } as any)

  render(<CommentVotes commentId="comment-9" />)
  expect(await screen.findByRole('button', { name: /^up 1$/ })).toBeInTheDocument()

  rows = [{ value: -1 }]
  fireEvent.click(screen.getByRole('button', { name: /^down 0$/ }))

  await waitFor(() => {
    expect(castCommentVote).toHaveBeenCalledWith('comment-9', -1)
  })
  expect(await screen.findByRole('button', { name: /^down 1$/ })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /^up 0$/ })).toBeInTheDocument()
})

test('shows the error when the vote fails', async () => {
  const { eq } = mockVotes([])
  vi.mocked(castCommentVote).mockRejectedValueOnce(new Error('not implemented'))
  render(<CommentVotes commentId="comment-1" />)
  await waitFor(() => {
    expect(eq).toHaveBeenCalledWith('comment_id', 'comment-1')
  })

  fireEvent.click(screen.getByRole('button', { name: /^up 0$/ }))

  expect(await screen.findByRole('alert')).toHaveTextContent('not implemented')
})
