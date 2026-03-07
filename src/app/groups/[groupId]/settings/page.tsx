import { Metadata } from 'next'
import { SettingsPageClient } from './page.client'

export const metadata: Metadata = {
  title: 'Settings',
}

export default async function GroupSettingsPage() {
  return <SettingsPageClient />
}
