import { Metadata } from 'next'
import { redirect } from 'next/navigation'

type Props = {
  params: Promise<{
    groupId: string
  }>
}

export const metadata: Metadata = {
  title: 'Redirecting to group',
}

export default async function UnlockGroupPage({ params }: Props) {
  const { groupId } = await params
  redirect(`/groups/${groupId}/summary`)
}
