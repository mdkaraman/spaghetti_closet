import { expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import BidPage from '../page'

vi.mock('@/lib/jont', () => ({
  getJontOfTheDay: vi.fn(),
}))

const { getJontOfTheDay } = await import('@/lib/jont')

test('shows a whole-dollar field and submit for the jont query', () => {
  render(<BidPage searchParams={{ jont: 'abc-123' }} />)

  const input = screen.getByLabelText(/dollars/i)
  expect(input).toHaveAttribute('type', 'number')
  expect(input).toHaveAttribute('name', 'amount')
  expect(input).toHaveAttribute('min', '1')
  expect(input).toHaveAttribute('step', '1')
  expect(input).toBeRequired()

  const jont = document.querySelector('input[name="jont"]')
  expect(jont).toHaveAttribute('value', 'abc-123')

  const button = screen.getByRole('button', { name: /^bid$/i })
  expect(button).toHaveAttribute('type', 'submit')
  expect(button.closest('form')).toBeInTheDocument()
  expect(getJontOfTheDay).not.toHaveBeenCalled()
})

test('shows the error from the query', () => {
  render(
    <BidPage searchParams={{ jont: 'abc-123', error: 'whole dollars, $1 minimum' }} />
  )
  expect(screen.getByRole('alert')).toHaveTextContent('whole dollars, $1 minimum')
  expect(getJontOfTheDay).not.toHaveBeenCalled()
})

test('does not call getJontOfTheDay when the jont query is missing', () => {
  render(<BidPage searchParams={{}} />)
  expect(screen.getByLabelText(/dollars/i)).toBeInTheDocument()
  expect(document.querySelector('input[name="jont"]')).toHaveAttribute('value', '')
  expect(getJontOfTheDay).not.toHaveBeenCalled()
})
