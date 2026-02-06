import { expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import ResetPasswordExpired from '../page'

test('expired reset link page shows stale-link message in red', () => {
  render(<ResetPasswordExpired />)
  const msg = screen.getByText(/derp that joint old\.\.\. try again/i)
  expect(msg).toBeInTheDocument()
  expect(msg).toHaveClass('reset-link-expired-message')
})

test('expired reset link page links to forgot-password', () => {
  render(<ResetPasswordExpired />)
  const link = screen.getByRole('link', { name: /send a new reset link/i })
  expect(link).toBeInTheDocument()
  expect(link).toHaveAttribute('href', '/forgot-password')
})

