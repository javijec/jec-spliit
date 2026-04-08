import { AppRouterOutput } from '@/trpc/routers/_app'
import { PropsWithChildren, createContext, useContext } from 'react'

type Group = NonNullable<AppRouterOutput['groups']['get']['group']>
type Viewer = AppRouterOutput['viewer']['getCurrent']['user']

type GroupContext =
  | {
      isLoading: false
      groupId: string
      group: Group
      viewer: Viewer | null
      currentActiveParticipantId: string | null
    }
  | {
      isLoading: true
      groupId: string
      group: undefined
      viewer: Viewer | null
      currentActiveParticipantId: string | null
    }

const CurrentGroupContext = createContext<GroupContext | null>(null)

export const useCurrentGroup = () => {
  const context = useContext(CurrentGroupContext)
  if (!context)
    throw new Error(
      'Missing context. Should be called inside a CurrentGroupProvider.',
    )
  return context
}

export const useOptionalCurrentGroup = () => useContext(CurrentGroupContext)

export const CurrentGroupProvider = ({
  children,
  ...props
}: PropsWithChildren<GroupContext>) => {
  return (
    <CurrentGroupContext.Provider value={props}>
      {children}
    </CurrentGroupContext.Provider>
  )
}
