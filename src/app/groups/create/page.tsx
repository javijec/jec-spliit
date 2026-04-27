import { CreateGroup } from '@/app/groups/create/create-group'
import { getCurrentAuthSession } from '@/lib/auth'
import { auth0Enabled } from '@/lib/env'
import { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Create Group',
}

export default async function CreateGroupPage() {
  if (auth0Enabled) {
    const session = await getCurrentAuthSession()
    if (!session) {
      redirect('/auth/login?connection=google-oauth2')
    }
  }

  return <CreateGroup />
}
