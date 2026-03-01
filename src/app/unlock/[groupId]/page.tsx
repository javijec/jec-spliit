import { cached } from '@/app/cached-functions'
import {
  getGroupAccessCookieName,
  isValidGroupAccessCookieValue,
} from '@/lib/group-access-session'
import { Metadata } from 'next'
import { cookies } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { UnlockGroupClient } from './unlock-group-client'

type Props = {
  params: Promise<{
    groupId: string
  }>
}

export const metadata: Metadata = {
  title: 'Unlock Group',
}

export default async function UnlockGroupPage({ params }: Props) {
  const { groupId } = await params
  const [group, accessControl] = await Promise.all([
    cached.getGroup(groupId),
    cached.getGroupAccessControl(groupId),
  ])

  if (!group || !accessControl) notFound()
  if (!accessControl.hasAccessPassword) {
    redirect(`/groups/${groupId}/expenses`)
  }
  if (!accessControl.accessPasswordHash) {
    redirect(`/groups/${groupId}/expenses`)
  }

  const cookieStore = await cookies()
  const cookieValue = cookieStore.get(getGroupAccessCookieName(groupId))?.value
  if (
    isValidGroupAccessCookieValue(
      groupId,
      accessControl.accessPasswordHash,
      cookieValue,
    )
  ) {
    redirect(`/groups/${groupId}/expenses`)
  }

  return <UnlockGroupClient groupId={groupId} groupName={group.name} />
}
