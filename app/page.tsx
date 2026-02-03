import Link from 'next/link'
import { Suspense } from 'react'
import LoginForm from './LoginForm'

export default function Home() {
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
        <span className="footer-sep"> · </span>
        <a href="/forgot-password">forgot passcode?</a>
      </div>
    </>
  )
}
