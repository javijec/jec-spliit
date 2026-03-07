import { Metadata } from 'next'
import { SummaryPageClient } from './page.client'

export const metadata: Metadata = {
  title: 'Summary',
}

export default async function GroupSummaryPage() {
  return <SummaryPageClient />
}
