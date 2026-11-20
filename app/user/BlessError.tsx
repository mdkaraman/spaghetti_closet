'use client'

import { useSearchParams } from 'next/navigation'

export default function BlessError() {
  const searchParams = useSearchParams()
  const error = searchParams?.get('bless_error') ?? null

  if (!error) return null

  return (
    <p className="form-error" role="alert">
      {error}
    </p>
  )
}
