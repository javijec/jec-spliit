import { cached } from '@/app/cached-functions'
import {
  getGroupAccessCookieName,
  isValidGroupAccessCookieValue,
} from '@/lib/group-access-session'
import { Metadata } from 'next'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
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
      template: `%s · ${group?.name} · Javijec`,
    },
  }
}

export default async function GroupLayout({
  children,
  params,
}: PropsWithChildren<Props>) {
  const { groupId } = await params

  const accessControl = await cached.getGroupAccessControl(groupId)
  if (accessControl?.hasAccessPassword) {
    const cookieStore = await cookies()
    const cookieValue = cookieStore.get(
      getGroupAccessCookieName(groupId),
    )?.value
    if (
      !accessControl.accessPasswordHash ||
      !isValidGroupAccessCookieValue(
        groupId,
        accessControl.accessPasswordHash,
        cookieValue,
      )
    ) {
      redirect(`/unlock/${groupId}`)
    }
  }

  return <GroupLayoutClient groupId={groupId}>{children}</GroupLayoutClient>
}
