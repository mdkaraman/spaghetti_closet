import { Suspense } from 'react'
import ForgotPasswordContent from './ForgotPasswordContent'

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div className="forgot-password-page" />}>
      <ForgotPasswordContent />
    </Suspense>
  )
}
