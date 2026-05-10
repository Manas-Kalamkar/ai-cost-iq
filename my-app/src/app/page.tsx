// src/app/page.tsx
import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-neutral-50 dark:bg-neutral-950 px-4">
      <h1 className="text-4xl font-medium text-neutral-900 dark:text-neutral-100 mb-4 tracking-tight">
        AI Cost IQ
      </h1>
      <p className="text-neutral-500 text-center max-w-md mb-8">
        Find out if your team is overspending on AI tools.
        Get a free audit in 2 minutes — no login required.
      </p>
      <Link
        href="/audit"
        className="px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-medium transition-all"
      >
        ⚡ Get my free audit
      </Link>
    </main>
  )
}