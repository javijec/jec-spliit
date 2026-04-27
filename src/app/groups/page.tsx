import { RecentGroupList } from '@/app/groups/recent-group-list'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Groups',
}

export default async function GroupsPage() {
  return <RecentGroupList />
}
