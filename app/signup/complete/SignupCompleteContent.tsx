'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { completeSignup } from '@/app/actions/auth'

export default function SignupCompleteContent() {
  const searchParams = useSearchParams()
  const userid = searchParams?.get('userid') ?? ''
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userid) {
      setError('Missing user id.')
      return
    }
    completeSignup(userid)
  }, [userid])

  if (error) {
    return (
      <div className="signup-page">
        <p className="form-error" role="alert">
          {error}
        </p>
        <a href="/signup">Back to sign up</a>
      </div>
    )
  }

  return (
    <div className="signup-page">
      <p>Setting up your profile…</p>
    </div>
  )
}
