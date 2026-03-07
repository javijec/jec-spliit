import { Metadata } from 'next'
import { SecuritySettingsPageClient } from './page.client'

export const metadata: Metadata = {
  title: 'Security',
}

export default function SecuritySettingsPage() {
  return <SecuritySettingsPageClient />
}
