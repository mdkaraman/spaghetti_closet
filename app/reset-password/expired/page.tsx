import Link from 'next/link'

export default function ResetPasswordExpired() {
  return (
    <div className="reset-link-expired">
      <p className="reset-link-expired-message">derp that joint old... try again</p>
      <Link href="/forgot-password">send a new reset link</Link>
    </div>
  )
}
