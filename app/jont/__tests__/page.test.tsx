import { expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import Jont from '../page'

test('jont page has my ish link to user', () => {
  render(<Jont />)
  const link = screen.getByRole('link', { name: /my ish/i })
  expect(link).toBeInTheDocument()
  expect(link).toHaveAttribute('href', '/user')
})

test('jont page has hoodie image', () => {
  render(<Jont />)
  const img = screen.getByRole('img', { name: /hoodie/i })
  expect(img).toBeInTheDocument()
  expect(img).toHaveAttribute('src', '/hoodie.png')
})

test('jont page shows price $20', () => {
  render(<Jont />)
  expect(screen.getByText('$20')).toBeInTheDocument()
})

test('jont page has description text', () => {
  render(<Jont />)
  expect(screen.getByText(/this that hoodie tho/i)).toBeInTheDocument()
  expect(screen.getByText(/that size L jaunt/i)).toBeInTheDocument()
})

test('jont page has i will have it link to pay', () => {
  render(<Jont />)
  const link = screen.getByRole('link', { name: /i will have it!/i })
  expect(link).toBeInTheDocument()
  expect(link).toHaveAttribute('href', '/pay')
})
