import { Suspense } from 'react'
import SignupForm from './SignupForm'

export default function Signup() {
  return (
    <div className="signup-page">
      <Suspense fallback={null}>
        <SignupForm />
      </Suspense>
    </div>
  )
}
