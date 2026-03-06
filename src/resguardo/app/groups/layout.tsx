import { PropsWithChildren, Suspense } from 'react'

export default function GroupsLayout({ children }: PropsWithChildren<{}>) {
  return (
    <Suspense>
      <main className="flex-1 w-full max-w-screen-xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 flex flex-col gap-4 sm:gap-6">
        {children}
      </main>
    </Suspense>
  )
}
