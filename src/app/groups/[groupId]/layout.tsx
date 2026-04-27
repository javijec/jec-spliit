import { cached } from '@/app/cached-functions'
import { getCurrentAppUser, getCurrentAuthSession } from '@/lib/auth'
import { auth0Enabled } from '@/lib/env'
import { getUserGroupMembership } from '@/lib/user-memberships'
import { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { PropsWithChildren } from 'react'
import { GroupLayoutClient } from './layout.client'

type Props = {
  params: Promise<{
    groupId: string
  }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { groupId } = await params
  const group = await cached.getGroup(groupId)

  return {
    title: {
      default: group?.name ?? '',
      template: `%s · ${group?.name} · NexoGastos`,
    },
  }
}

export default async function GroupLayout({
  children,
  params,
}: PropsWithChildren<Props>) {
  const { groupId } = await params

  if (auth0Enabled) {
    const session = await getCurrentAuthSession()
    if (!session) {
      redirect('/auth/login?connection=google-oauth2')
    }

    const user = await getCurrentAppUser()
    if (!user) {
      redirect('/auth/login?connection=google-oauth2')
    }

    const membership = await getUserGroupMembership(user.id, groupId)
    if (!membership) {
      notFound()
    }
  }

  const group = await cached.getGroup(groupId)

  return (
    <GroupLayoutClient
      groupId={groupId}
      initialGroup={group}
    >
      {children}
    </GroupLayoutClient>
  )
}
