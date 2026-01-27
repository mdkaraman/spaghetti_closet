import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Spaghetti closet',
  description: 'Look, if you had one shot or one opportunity to seize everything you ever wanted in one moment would you capture it or just let it slip? Yo',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
      </head>
      <body>{children}</body>
    </html>
  )
}
