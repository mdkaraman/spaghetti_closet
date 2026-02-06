import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import LoginForm from './LoginForm'

export default function Home({
  searchParams,
}: {
  searchParams: { error?: string }
}) {
  if (searchParams?.error === 'auth') {
    redirect('/reset-password/expired')
  }

  return (
    <>
      <h1>
        <img src="/title.png" alt="Spaghetti closet." className="title-image" />
      </h1>

      <div className="login-container">
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>

      <div className="footer-link">
        <a href="/wtf-is-this">wtf is this??</a>
        <a href="/forgot-password">smh i forgot</a>
      </div>
    </>
  )
}
