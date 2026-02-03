import { Suspense } from 'react'
import SignupCompleteContent from './SignupCompleteContent'

export default function SignupCompletePage() {
  return (
    <Suspense fallback={<div className="signup-page"><p>Loading…</p></div>}>
      <SignupCompleteContent />
    </Suspense>
  )
}
