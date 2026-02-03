import { expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import WaitlistPage from '../page'

test('waitlist page shows italic lyrics', () => {
  render(<WaitlistPage />)
  const lyrics = screen.getByText(
    /I never meant to hurt you I never meant to make you cry/i
  )
  expect(lyrics).toBeInTheDocument()
  expect(lyrics.tagName).toBe('EM')
})

test('waitlist page has lmk when we back up heading', () => {
  render(<WaitlistPage />)
  expect(screen.getByText(/lmk when we back up/i)).toBeInTheDocument()
})

test('waitlist page has email field and submit', () => {
  render(<WaitlistPage />)
  expect(screen.getByLabelText(/email:/i)).toBeInTheDocument()
  const btn = screen.getByRole('button', { name: /send it/i })
  expect(btn).toBeInTheDocument()
})
