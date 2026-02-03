import { expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import JontPageContent from '../JontPageContent'

const mockJont = {
  id: 'abc-123',
  date: '2025-02-03',
  title: 'this that hoodie tho',
  description: 'that size L jaunt',
  image_url: '/hoodie.png',
  price_cents: 2000,
  created_at: '2025-02-03T12:00:00Z',
}

test('jont page has my ish link to user', () => {
  render(<JontPageContent jont={mockJont} />)
  const link = screen.getByRole('link', { name: /my ish/i })
  expect(link).toBeInTheDocument()
  expect(link).toHaveAttribute('href', '/user')
})

test('jont page shows jont image and price', () => {
  render(<JontPageContent jont={mockJont} />)
  const img = screen.getByRole('img', { name: /this that hoodie tho/i })
  expect(img).toBeInTheDocument()
  expect(img).toHaveAttribute('src', '/hoodie.png')
  expect(screen.getByText('$20')).toBeInTheDocument()
})

test('jont page has description text', () => {
  render(<JontPageContent jont={mockJont} />)
  expect(screen.getByText(/this that hoodie tho/i)).toBeInTheDocument()
  expect(screen.getByText(/that size L jaunt/i)).toBeInTheDocument()
})

test('jont page has i will have it link to pay', () => {
  render(<JontPageContent jont={mockJont} />)
  const link = screen.getByRole('link', { name: /i will have it!/i })
  expect(link).toBeInTheDocument()
  expect(link).toHaveAttribute('href', '/pay')
})

test('shows fallback when no jont', () => {
  render(<JontPageContent jont={null} />)
  expect(screen.getByText(/no jont today/i)).toBeInTheDocument()
  const link = screen.getByRole('link', { name: /my ish/i })
  expect(link).toBeInTheDocument()
})
