import '@testing-library/jest-dom'
import { vi } from 'vitest'

vi.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: (key: string) => null,
  }),
}))
