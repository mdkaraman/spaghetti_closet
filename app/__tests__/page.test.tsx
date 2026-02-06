import { expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import Home from '../page'

test('login page shows title image', () => {
  render(<Home searchParams={{}} />)
  const img = screen.getByRole('img', { name: /spaghetti closet\./i })
  expect(img).toBeInTheDocument()
  expect(img).toHaveAttribute('src', '/title.png')
})

test('login page has user id and passcode fields', () => {
  render(<Home searchParams={{}} />)
  expect(screen.getByLabelText(/user id:/i)).toBeInTheDocument()
  expect(screen.getByLabelText(/passcode:/i)).toBeInTheDocument()
})

test('login page has enter submit button', () => {
  render(<Home searchParams={{}} />)
  const enter = screen.getByRole('button', { name: /enter/i })
  expect(enter).toBeInTheDocument()
  expect(enter).toHaveAttribute('type', 'submit')
})

test('login page has wtf is this link', () => {
  render(<Home searchParams={{}} />)
  const link = screen.getByRole('link', { name: /wtf is this\?\?/i })
  expect(link).toBeInTheDocument()
})

test('login form has submit button', () => {
  render(<Home searchParams={{}} />)
  const form = screen.getByRole('button', { name: /enter/i }).closest('form')
  expect(form).toBeInTheDocument()
})

test('login form uses post method', () => {
  render(<Home searchParams={{}} />)
  const form = screen.getByRole('button', { name: /enter/i }).closest('form')
  expect(form).toHaveAttribute('method', 'post')
})

test('forgot passcode link is present', () => {
  render(<Home searchParams={{}} />)
  const link = screen.getByRole('link', { name: /smh i forgot/i })
  expect(link).toBeInTheDocument()
  expect(link).toHaveAttribute('href', '/forgot-password')
})

test('wtf is this link goes to wtf-is-this page', () => {
  render(<Home searchParams={{}} />)
  const link = screen.getByRole('link', { name: /wtf is this\?\?/i })
  expect(link).toHaveAttribute('href', '/wtf-is-this')
})

test('auth error on home redirects to reset-password expired page', async () => {
  vi.resetModules()

  const redirect = vi.fn(() => {
    throw new Error('NEXT_REDIRECT')
  })

  vi.doMock('next/navigation', async () => {
    const actual = await vi.importActual<typeof import('next/navigation')>('next/navigation')
    return { ...actual, redirect }
  })

  const { default: HomeWithMock } = await import('../page')

  expect(() => render(<HomeWithMock searchParams={{ error: 'auth' }} />)).toThrow(/NEXT_REDIRECT/)
  expect(redirect).toHaveBeenCalledWith('/reset-password/expired')
})
