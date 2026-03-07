import { Metadata } from 'next'
import { ShareSettingsPageClient } from './page.client'

export const metadata: Metadata = {
  title: 'Share',
}

export default function ShareSettingsPage() {
  return <ShareSettingsPageClient />
}
