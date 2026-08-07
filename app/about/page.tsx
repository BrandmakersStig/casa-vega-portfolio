import type { Metadata } from 'next'
import ReactMarkdown from 'react-markdown'
import { getSettings } from '@/lib/data/settings'

export const metadata: Metadata = { title: 'About' }

export default async function AboutPage() {
  const settings = await getSettings()
  return (
    <div className="mx-auto max-w-3xl px-4 py-24 sm:px-6 lg:px-8">
      <div className="prose prose-neutral dark:prose-invert max-w-none">
        <ReactMarkdown>{settings.aboutMarkdown}</ReactMarkdown>
      </div>
    </div>
  )
}
