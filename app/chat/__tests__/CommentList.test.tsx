import { expect, test, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import CommentList, { CommentListView, mergeComments, type ChatComment } from '../CommentList'
import { postComment } from '@/app/actions/chat'

vi.mock('@/app/actions/chat', () => ({
  postComment: vi.fn(),
}))

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(),
}))

const voteSpy = vi.hoisted(() => vi.fn())

vi.mock('../CommentVotes', () => ({
  default: (props: { commentId: string }) => {
    voteSpy(props)
    return <span data-testid={`votes-${props.commentId}`} />
  },
}))

const { createClient } = await import('@/lib/supabase/client')

const ada = {
  id: 'c1',
  body: 'first',
  handle: 'ada',
  createdAt: '2026-02-01T00:00:00.000Z',
}
const bee = {
  id: 'c2',
  body: 'second',
  handle: 'bee',
  createdAt: '2026-02-02T00:00:00.000Z',
}

function posted(comment: ChatComment) {
  vi.mocked(postComment).mockResolvedValue({ ok: true, comment })
}

type CommentRow = {
  id: string
  body: string
  user_id: string
  created_at: string
  jont_id?: string
}

function mockBrowser({
  comments = [] as CommentRow[],
  handles = [] as { id: string; user_id: string }[],
} = {}) {
  const calls: { table: string; op: string; args: unknown[] }[] = []
  let onInsert: ((payload: { new: Record<string, unknown> }) => void) | null = null

  function chain(table: string) {
    const state: { ids?: string[] } = {}
    const builder: any = {
      select: (...args: unknown[]) => {
        calls.push({ table, op: 'select', args })
        return builder
      },
      eq: (...args: unknown[]) => {
        calls.push({ table, op: 'eq', args })
        return builder
      },
      in: (column: string, ids: string[]) => {
        calls.push({ table, op: 'in', args: [column, ids] })
        if (column === 'id') state.ids = ids
        return builder
      },
      order: (...args: unknown[]) => {
        calls.push({ table, op: 'order', args })
        return builder
      },
      then: (
        onFulfilled: (value: { data: unknown; error: null }) => unknown,
        onRejected?: (reason: unknown) => unknown
      ) => {
        const data =
          table === 'comments'
            ? comments
            : handles.filter((row) => !state.ids || state.ids.includes(row.id))
        return Promise.resolve({ data, error: null }).then(onFulfilled, onRejected)
      },
    }
    return builder
  }

  const channel = {
    on: vi.fn((_event: string, _filter: unknown, handler: typeof onInsert) => {
      onInsert = handler
      return channel
    }),
    subscribe: vi.fn(() => channel),
  }
  const client = {
    from: vi.fn((table: string) => chain(table)),
    channel: vi.fn(() => channel),
    removeChannel: vi.fn(),
  }
  vi.mocked(createClient).mockReturnValue(client as any)

  return {
    calls,
    channel,
    client,
    emit(row: Record<string, unknown>) {
      onInsert?.({ new: row })
    },
  }
}

test('lists comments oldest first and keeps an empty handle off the row', () => {
  const later = { ...bee, createdAt: '2026-02-03T00:00:00.000Z' }
  const earlier = { ...ada, createdAt: '2026-02-01T00:00:00.000Z' }
  expect(mergeComments([later], [earlier, { ...later, handle: '' }])).toEqual([
    earlier,
    later,
  ])
})

test('shows comments, votes, and a composer', () => {
  voteSpy.mockClear()
  render(
    <CommentListView
      jontId="jont-9"
      comments={[ada, bee]}
      loaded
      onPosted={() => {}}
    />
  )

  const items = screen.getAllByRole('listitem')
  expect(items).toHaveLength(2)
  expect(items[0]).toHaveTextContent('ada')
  expect(items[0]).toHaveTextContent('first')
  expect(items[1]).toHaveTextContent('bee')
  expect(items[1]).toHaveTextContent('second')
  expect(screen.queryByText('say something')).not.toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'post' })).toBeInTheDocument()
  expect(
    items[0].compareDocumentPosition(screen.getByRole('button', { name: 'post' })) &
      Node.DOCUMENT_POSITION_FOLLOWING
  ).toBeTruthy()

  expect(voteSpy).toHaveBeenCalledTimes(2)
  expect(voteSpy).toHaveBeenNthCalledWith(1, { commentId: 'c1' })
  expect(voteSpy).toHaveBeenNthCalledWith(2, { commentId: 'c2' })
  for (const [props] of voteSpy.mock.calls) {
    expect(Object.keys(props as object)).toEqual(['commentId'])
  }
})

test('says say something when there are no comments', () => {
  voteSpy.mockClear()
  render(
    <CommentListView jontId="jont-9" comments={[]} loaded onPosted={() => {}} />
  )
  expect(screen.getByText('say something')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'post' })).toBeInTheDocument()
  expect(screen.queryByRole('listitem')).not.toBeInTheDocument()
  expect(voteSpy).not.toHaveBeenCalled()
})

test('hides the empty copy until the list has loaded', () => {
  render(
    <CommentListView jontId="jont-9" comments={[]} loaded={false} onPosted={() => {}} />
  )
  expect(screen.queryByText('say something')).not.toBeInTheDocument()
})

test('a posted comment shows up in the list', async () => {
  mockBrowser()
  posted({
    id: 'c-new',
    body: 'yo',
    handle: 'ada',
    createdAt: '2026-02-03T00:00:00.000Z',
  })

  render(<CommentList jontId="jont-9" />)
  expect(await screen.findByText('say something')).toBeInTheDocument()

  fireEvent.change(screen.getByLabelText('comment'), { target: { value: '  yo  ' } })
  fireEvent.submit(screen.getByRole('button', { name: 'post' }).closest('form')!)

  expect(await screen.findByText('yo')).toBeInTheDocument()
  expect(screen.getByText('ada')).toBeInTheDocument()
  expect(screen.queryByText('say something')).not.toBeInTheDocument()
  expect(screen.getByLabelText('comment')).toHaveValue('')

  const fd = vi.mocked(postComment).mock.calls[0][0] as FormData
  expect(fd.get('body')).toBe('  yo  ')
  expect(fd.get('jontId')).toBe('jont-9')
  expect(voteSpy).toHaveBeenCalledWith({ commentId: 'c-new' })
})

test('shows the action error and leaves the list empty', async () => {
  mockBrowser()
  vi.mocked(postComment).mockResolvedValue({ ok: false, error: 'too long' })

  render(<CommentList jontId="jont-9" />)
  expect(await screen.findByText('say something')).toBeInTheDocument()

  fireEvent.change(screen.getByLabelText('comment'), { target: { value: 'nope' } })
  fireEvent.submit(screen.getByRole('button', { name: 'post' }).closest('form')!)

  expect(await screen.findByRole('alert')).toHaveTextContent('too long')
  expect(screen.getByText('say something')).toBeInTheDocument()
  expect(screen.getByLabelText('comment')).toHaveValue('nope')
})

test('loads this jont’s comments oldest first and subscribes to inserts', async () => {
  voteSpy.mockClear()
  const browser = mockBrowser({
    comments: [
      {
        id: 'c2',
        body: 'second',
        user_id: 'u2',
        created_at: '2026-02-02T00:00:00.000Z',
      },
      {
        id: 'c1',
        body: 'first',
        user_id: 'u1',
        created_at: '2026-02-01T00:00:00.000Z',
      },
    ],
    handles: [
      { id: 'u1', user_id: 'ada' },
      { id: 'u2', user_id: 'bee' },
    ],
  })

  const { unmount } = render(<CommentList jontId="jont-9" />)

  await waitFor(() => {
    expect(screen.getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      'adafirst',
      'beesecond',
    ])
  })

  expect(browser.calls).toContainEqual({
    table: 'comments',
    op: 'select',
    args: ['id, body, user_id, created_at'],
  })
  expect(browser.calls).toContainEqual({
    table: 'comments',
    op: 'eq',
    args: ['jont_id', 'jont-9'],
  })
  expect(browser.calls).toContainEqual({
    table: 'comments',
    op: 'order',
    args: ['created_at', { ascending: true }],
  })
  expect(browser.channel.on).toHaveBeenCalledWith(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'comments',
      filter: 'jont_id=eq.jont-9',
    },
    expect.any(Function)
  )

  browser.emit({
    id: 'c3',
    body: 'third',
    user_id: 'u2',
    jont_id: 'jont-9',
    created_at: '2026-02-03T00:00:00.000Z',
  })

  await waitFor(() => {
    expect(screen.getAllByRole('listitem')).toHaveLength(3)
  })
  const items = screen.getAllByRole('listitem')
  expect(items[2]).toHaveTextContent('third')
  expect(items[2]).toHaveTextContent('bee')
  expect(voteSpy).toHaveBeenCalledWith({ commentId: 'c3' })

  browser.emit({
    id: 'c3',
    body: 'third',
    user_id: 'u2',
    jont_id: 'jont-9',
    created_at: '2026-02-03T00:00:00.000Z',
  })
  await waitFor(() => {
    expect(screen.getAllByRole('listitem')).toHaveLength(3)
  })

  unmount()
  expect(browser.client.removeChannel).toHaveBeenCalled()
})

test('does not query or subscribe when the jont id is missing', async () => {
  const browser = mockBrowser()
  render(<CommentList jontId="" />)
  expect(await screen.findByText('say something')).toBeInTheDocument()
  expect(browser.client.from).not.toHaveBeenCalled()
  expect(browser.client.channel).not.toHaveBeenCalled()
})
