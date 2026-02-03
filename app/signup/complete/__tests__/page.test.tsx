import { expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import SignupCompleteContent from '../SignupCompleteContent'

vi.mock('next/navigation', () => ({
  useSearchParams: vi.fn(),
}))

vi.mock('@/app/actions/auth', () => ({
  completeSignup: vi.fn(),
}))

const useSearchParams = (await import('next/navigation')).useSearchParams

test('signup complete page shows setting up message when userid present', () => {
  vi.mocked(useSearchParams).mockReturnValue({
    get: (key: string) => (key === 'userid' ? 'myhandle' : null),
  } as ReturnType<typeof useSearchParams>)
  render(<SignupCompleteContent />)
  expect(screen.getByText(/setting up your profile/i)).toBeInTheDocument()
})

test('signup complete page shows error and back link when userid missing', async () => {
  vi.mocked(useSearchParams).mockReturnValue({
    get: () => null,
  } as ReturnType<typeof useSearchParams>)
  render(<SignupCompleteContent />)
  const alert = await screen.findByRole('alert')
  expect(alert).toHaveTextContent(/missing user id/i)
  expect(screen.getByRole('link', { name: /back to sign up/i })).toBeInTheDocument()
})
