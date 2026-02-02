import { expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import WtfIsThis from '../page'

test('wtf page has click here to blow link to signup', () => {
  render(<WtfIsThis />)
  const link = screen.getByRole('link', { name: /click here to blow/i })
  expect(link).toBeInTheDocument()
  expect(link).toHaveAttribute('href', '/signup')
})

test('wtf page has intro text', () => {
  render(<WtfIsThis />)
  expect(screen.getByText(/Look, if you had one shot/i)).toBeInTheDocument()
  expect(screen.getByText(/ok this what it is— sum new each day/i)).toBeInTheDocument()
})
