import { expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import Signup from '../page'

test('signup page has user id, email, passcode, confirm fields', () => {
  render(<Signup />)
  expect(screen.getByLabelText(/user id:/i)).toBeInTheDocument()
  expect(screen.getByLabelText(/email:/i)).toBeInTheDocument()
  expect(screen.getByLabelText(/passcode:/i)).toBeInTheDocument()
  expect(screen.getByLabelText(/confirm:/i)).toBeInTheDocument()
})

test('signup page has send it submit button', () => {
  render(<Signup />)
  const btn = screen.getByRole('button', { name: /send it/i })
  expect(btn).toBeInTheDocument()
  expect(btn).toHaveAttribute('type', 'submit')
})

test('signup form has correct action and method', () => {
  render(<Signup />)
  const form = screen.getByRole('button', { name: /send it/i }).closest('form')
  expect(form).toHaveAttribute('action', '/jont')
  expect(form).toHaveAttribute('method', 'get')
})
