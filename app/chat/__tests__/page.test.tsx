import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import ChatPage from '../page'

vi.mock('../CoppedList', () => ({
  default: ({ jontId }: { jontId: string }) => <p>copped {jontId}</p>,
}))

vi.mock('../CommentList', () => ({
  default: ({ jontId }: { jontId: string }) => <p>comments {jontId}</p>,
}))

test('passes the jont query param into the room', () => {
  render(<ChatPage searchParams={{ jont: 'jont-9' }} />)
  expect(screen.getByText('copped jont-9')).toBeInTheDocument()
  expect(screen.getByText('comments jont-9')).toBeInTheDocument()
})

test('chat does not call getJontOfTheDay', () => {
  const files = [
    'app/chat/page.tsx',
    'app/chat/ChatRoom.tsx',
    'app/chat/CommentList.tsx',
    'app/chat/CoppedList.tsx',
    'app/chat/CommentVotes.tsx',
    'app/chat/BidderList.tsx',
    'app/chat/WinnerSlot.tsx',
    'app/actions/chat.ts',
  ]
  for (const file of files) {
    const source = readFileSync(join(process.cwd(), file), 'utf8')
    expect(source, file).not.toContain('getJontOfTheDay')
  }
})
