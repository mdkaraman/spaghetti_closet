import { Suspense } from 'react'
import WaitlistContent from './WaitlistContent'

export default function WaitlistPage() {
  return (
    <Suspense fallback={<div className="waitlist-page" />}>
      <WaitlistContent />
    </Suspense>
  )
}
