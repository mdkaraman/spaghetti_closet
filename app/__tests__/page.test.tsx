import { expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import Home from '../page'

test('login page shows title image', () => {
  render(<Home />)
  const img = screen.getByRole('img', { name: /spaghetti closet\./i })
  expect(img).toBeInTheDocument()
  expect(img).toHaveAttribute('src', '/title.png')
})

test('login page has user id and passcode fields', () => {
  render(<Home />)
  expect(screen.getByLabelText(/user id:/i)).toBeInTheDocument()
  expect(screen.getByLabelText(/passcode:/i)).toBeInTheDocument()
})

test('login page has enter submit button', () => {
  render(<Home />)
  const enter = screen.getByRole('button', { name: /enter/i })
  expect(enter).toBeInTheDocument()
  expect(enter).toHaveAttribute('type', 'submit')
})

test('login page has wtf is this link', () => {
  render(<Home />)
  const link = screen.getByRole('link', { name: /wtf is this\?\?/i })
  expect(link).toBeInTheDocument()
})

test('form has correct action and method', () => {
  render(<Home />)
  const form = screen.getByRole('button', { name: /enter/i }).closest('form')
  expect(form).toHaveAttribute('action', '/')
  expect(form).toHaveAttribute('method', 'get')
})
