import { PageContainer } from '@/components/ui/page-container'
import { PropsWithChildren, Suspense } from 'react'

export default function GroupsLayout({ children }: PropsWithChildren<{}>) {
  return (
    <Suspense>
      <PageContainer as="main">{children}</PageContainer>
    </Suspense>
  )
}
