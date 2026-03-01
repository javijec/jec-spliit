'use client'
import {
  Activity,
  ActivityItem,
} from '@/app/groups/[groupId]/activity/activity-item'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { trpc } from '@/trpc/client'
import dayjs, { type Dayjs } from 'dayjs'
import { Clock3 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { forwardRef, useEffect } from 'react'
import { useInView } from 'react-intersection-observer'
import { useCurrentGroup } from '../current-group-context'

const PAGE_SIZE = 20

const DATE_GROUPS = {
  TODAY: 'today',
  YESTERDAY: 'yesterday',
  EARLIER_THIS_WEEK: 'earlierThisWeek',
  LAST_WEEK: 'lastWeek',
  EARLIER_THIS_MONTH: 'earlierThisMonth',
  LAST_MONTH: 'lastMonth',
  EARLIER_THIS_YEAR: 'earlierThisYear',
  LAST_YEAR: 'lastYear',
  OLDER: 'older',
}

function getDateGroup(date: Dayjs, today: Dayjs) {
  if (today.isSame(date, 'day')) {
    return DATE_GROUPS.TODAY
  } else if (today.subtract(1, 'day').isSame(date, 'day')) {
    return DATE_GROUPS.YESTERDAY
  } else if (today.isSame(date, 'week')) {
    return DATE_GROUPS.EARLIER_THIS_WEEK
  } else if (today.subtract(1, 'week').isSame(date, 'week')) {
    return DATE_GROUPS.LAST_WEEK
  } else if (today.isSame(date, 'month')) {
    return DATE_GROUPS.EARLIER_THIS_MONTH
  } else if (today.subtract(1, 'month').isSame(date, 'month')) {
    return DATE_GROUPS.LAST_MONTH
  } else if (today.isSame(date, 'year')) {
    return DATE_GROUPS.EARLIER_THIS_YEAR
  } else if (today.subtract(1, 'year').isSame(date, 'year')) {
    return DATE_GROUPS.LAST_YEAR
  } else {
    return DATE_GROUPS.OLDER
  }
}

function getGroupedActivitiesByDate(activities: Activity[]) {
  const today = dayjs()
  return activities.reduce(
    (result, activity) => {
      const activityGroup = getDateGroup(dayjs(activity.time), today)
      result[activityGroup] = result[activityGroup] ?? []
      result[activityGroup].push(activity)
      return result
    },
    {} as {
      [key: string]: Activity[]
    },
  )
}

const ActivitiesLoading = forwardRef<HTMLDivElement>((_, ref) => {
  return (
    <div ref={ref}>
      <Skeleton className="mx-1 mt-1 mb-2 h-3 w-24 rounded-full" />
      {[0, 1, 2, 3].map((index) => (
        <div key={index} className="flex items-start gap-2 rounded-lg border bg-card/60 px-3 py-3 mb-2">
          <Skeleton className="h-3 w-12 rounded-full mt-1" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-56 rounded-full" />
            <Skeleton className="h-3 w-36 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  )
})
ActivitiesLoading.displayName = 'ActivitiesLoading'

export function ActivityList() {
  const t = useTranslations('Activity')
  const { group, groupId } = useCurrentGroup()

  const {
    data: activitiesData,
    isLoading,
    fetchNextPage,
  } = trpc.groups.activities.list.useInfiniteQuery(
    { groupId, limit: PAGE_SIZE },
    { getNextPageParam: ({ nextCursor }) => nextCursor },
  )
  const { ref: loadingRef, inView } = useInView()

  const activities = activitiesData?.pages.flatMap((page) => page.activities)
  const hasMore = activitiesData?.pages.at(-1)?.hasMore ?? false

  useEffect(() => {
    if (inView && hasMore && !isLoading) fetchNextPage()
  }, [fetchNextPage, hasMore, inView, isLoading])

  if (isLoading || !activities || !group) return <ActivitiesLoading />

  const groupedActivitiesByDate = getGroupedActivitiesByDate(activities)

  return activities.length > 0 ? (
    <>
      {Object.values(DATE_GROUPS).map((dateGroup: string) => {
        let groupActivities = groupedActivitiesByDate[dateGroup]
        if (!groupActivities || groupActivities.length === 0) return null
        const dateStyle =
          dateGroup == DATE_GROUPS.TODAY || dateGroup == DATE_GROUPS.YESTERDAY
            ? undefined
            : 'medium'

        return (
          <div key={dateGroup}>
            <div
              className="text-muted-foreground text-xs py-1 font-semibold bg-card border-b"
            >
              {t(`Groups.${dateGroup}`)}
            </div>
            {groupActivities.map((activity) => {
              const participant =
                activity.participantId !== null
                  ? group.participants.find(
                      (p) => p.id === activity.participantId,
                    )
                  : undefined
              return (
                <ActivityItem
                  key={activity.id}
                  groupId={groupId}
                  activity={activity}
                  participant={participant}
                  dateStyle={dateStyle}
                />
              )
            })}
          </div>
        )
      })}
      {hasMore && <ActivitiesLoading ref={loadingRef} />}
    </>
  ) : (
    <EmptyState
      icon={Clock3}
      title={t('noActivity')}
      description="Todavía no hay movimientos registrados en este grupo."
      className="my-4"
    />
  )
}
