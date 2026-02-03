import { expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import ForgotPasswordPage from '../page'

test('forgot password page has heading', () => {
  render(<ForgotPasswordPage />)
  expect(screen.getByRole('heading', { name: /forgot passcode/i })).toBeInTheDocument()
})

test('forgot password page has email field and submit', () => {
  render(<ForgotPasswordPage />)
  expect(screen.getByLabelText(/email:/i)).toBeInTheDocument()
  const btn = screen.getByRole('button', { name: /send reset link/i })
  expect(btn).toBeInTheDocument()
})

test('forgot password page has back to login link', () => {
  render(<ForgotPasswordPage />)
  const link = screen.getByRole('link', { name: /back to login/i })
  expect(link).toBeInTheDocument()
  expect(link).toHaveAttribute('href', '/')
})
