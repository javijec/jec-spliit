import { Metadata } from 'next'
import { DangerSettingsPageClient } from './page.client'

export const metadata: Metadata = {
  title: 'Danger',
}

export default function DangerSettingsPage() {
  return <DangerSettingsPageClient />
}
