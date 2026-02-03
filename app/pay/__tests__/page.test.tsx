import { expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import PayPage from '../page'

test('pay page has pay now button', () => {
  render(<PayPage />)
  const btn = screen.getByRole('button', { name: /pay now/i })
  expect(btn).toBeInTheDocument()
  expect(btn).toHaveAttribute('type', 'submit')
})

test('pay page has a form', () => {
  render(<PayPage />)
  const form = screen.getByRole('button', { name: /pay now/i }).closest('form')
  expect(form).toBeInTheDocument()
})
