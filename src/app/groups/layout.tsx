import { PropsWithChildren, Suspense } from 'react'

export default function GroupsLayout({ children }: PropsWithChildren<{}>) {
  return (
    <Suspense>
      <main className="mx-auto flex w-full max-w-screen-xl flex-1 flex-col gap-5 px-3 py-4 sm:px-4 sm:py-6 lg:px-8">
        {children}
      </main>
    </Suspense>
  )
}
