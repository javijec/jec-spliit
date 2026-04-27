import { getCurrentAuthSession } from '@/lib/auth'
import { auth0Enabled } from '@/lib/env'
import { PageContainer } from '@/components/ui/page-container'
import { redirect } from 'next/navigation'
import { PropsWithChildren, Suspense } from 'react'

export default async function GroupsLayout({ children }: PropsWithChildren<{}>) {
  if (auth0Enabled) {
    const session = await getCurrentAuthSession()
    if (!session) {
      redirect('/auth/login?connection=google-oauth2')
    }
  }

  return (
    <Suspense>
      <PageContainer as="main">{children}</PageContainer>
    </Suspense>
  )
}
