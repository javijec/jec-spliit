import type { PropsWithChildren } from 'react'

export default function GroupsLayout({ children }: PropsWithChildren) {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6">
      {children}
    </div>
  )
}
