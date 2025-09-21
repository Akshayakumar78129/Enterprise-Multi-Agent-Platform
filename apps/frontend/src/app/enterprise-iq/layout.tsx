import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Enterprise IQ',
  description: 'AI-powered enterprise intelligence platform',
}

export default function EnterpriseIQLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}