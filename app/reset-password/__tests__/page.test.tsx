import { expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import ResetPassword from '../page'

test('reset password page has passcode + confirm fields', () => {
  render(<ResetPassword />)
  expect(screen.getByLabelText(/passcode:/i)).toBeInTheDocument()
  expect(screen.getByLabelText(/confirm:/i)).toBeInTheDocument()
})

test('reset password page has reset submit button', () => {
  render(<ResetPassword />)
  const btn = screen.getByRole('button', { name: /reset password/i })
  expect(btn).toBeInTheDocument()
  expect(btn).toHaveAttribute('type', 'submit')
})

