import { expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import ForgotPasswordPage from '../page'

test('forgot password page has email field and submit', () => {
  render(<ForgotPasswordPage />)
  expect(screen.getByLabelText(/email:/i)).toBeInTheDocument()
  const btn = screen.getByRole('button', { name: /send reset link/i })
  expect(btn).toBeInTheDocument()
})
