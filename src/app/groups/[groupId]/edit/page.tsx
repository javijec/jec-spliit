import { EditGroup } from '@/app/groups/[groupId]/edit/edit-group'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Edit group',
}

export default async function EditGroupPage() {
  return <EditGroup />
}
