import { Suspense } from 'react'
import ResetPasswordContent from './ResetPasswordContent'

export default function ResetPassword() {
  return (
    <div className="signup-page">
      <Suspense fallback={null}>
        <ResetPasswordContent />
      </Suspense>
    </div>
  )
}
