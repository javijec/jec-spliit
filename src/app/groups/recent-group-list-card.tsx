import {
  RecentGroup,
  archiveGroup,
  deleteRecentGroup,
  starGroup,
  unarchiveGroup,
  unstarGroup,
} from '@/app/groups/recent-groups-helpers'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/use-toast'
import { AppRouterOutput } from '@/trpc/routers/_app'
import { StarFilledIcon } from '@radix-ui/react-icons'
import { ArrowRight, Calendar, MoreHorizontal, Star, Users } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import Link from 'next/link'

export function RecentGroupListCard({
  group,
  groupDetail,
  isStarred,
  isArchived,
  refreshGroupsFromStorage,
  onToggleStar,
  onToggleArchive,
  onRemove,
}: {
  group: RecentGroup
  groupDetail?: AppRouterOutput['groups']['list']['groups'][number]
  isStarred: boolean
  isArchived: boolean
  refreshGroupsFromStorage: () => void
  onToggleStar?: (groupId: string, isStarred: boolean) => Promise<void> | void
  onToggleArchive?: (
    groupId: string,
    isArchived: boolean,
  ) => Promise<void> | void
  onRemove?: (group: RecentGroup) => Promise<void> | void
}) {
  const locale = useLocale()
  const toast = useToast()
  const t = useTranslations('Groups')

  return (
    <li key={group.id}>
      <div className="border bg-card p-4 transition-colors hover:bg-secondary/35">
        <div className="flex items-start gap-3">
          <Link href={`/groups/${group.id}`} className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-base font-semibold">{group.name}</p>
                <div className="mt-2 text-xs text-muted-foreground">
                  {groupDetail ? (
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <div className="flex items-center">
                        <Users className="mr-1 inline h-3 w-3" />
                        <span>{groupDetail._count.participants}</span>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="mr-1 inline h-3 w-3" />
                        <span>
                          {new Date(groupDetail.createdAt).toLocaleDateString(
                            locale,
                            {
                              dateStyle: 'medium',
                            },
                          )}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      <Skeleton className="h-4 w-10 rounded-sm" />
                      <Skeleton className="h-4 w-24 rounded-sm" />
                    </div>
                  )}
                </div>
              </div>
              <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            </div>
          </Link>

          <div className="flex shrink-0 items-center">
            <Button
              size="icon"
              variant="ghost"
              className="-my-2 -ml-2 -mr-1 h-9 w-9"
              onClick={(event) => {
                event.stopPropagation()
                if (onToggleStar) {
                  void onToggleStar(group.id, isStarred)
                } else {
                  if (isStarred) {
                    unstarGroup(group.id)
                  } else {
                    starGroup(group.id)
                    unarchiveGroup(group.id)
                  }
                  refreshGroupsFromStorage()
                }
              }}
            >
              {isStarred ? (
                <StarFilledIcon className="h-4 w-4 text-orange-400" />
              ) : (
                <Star className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost" className="-my-2 -mr-2 h-9 w-9">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={(event) => {
                    event.stopPropagation()
                    if (onRemove) {
                      void onRemove(group)
                    } else {
                      deleteRecentGroup(group)
                      refreshGroupsFromStorage()
                    }

                    toast.toast({
                      title: t('RecentRemovedToast.title'),
                      description: t('RecentRemovedToast.description'),
                    })
                  }}
                >
                  {t('removeRecent')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(event) => {
                    event.stopPropagation()
                    if (onToggleArchive) {
                      void onToggleArchive(group.id, isArchived)
                    } else {
                      if (isArchived) {
                        unarchiveGroup(group.id)
                      } else {
                        archiveGroup(group.id)
                        unstarGroup(group.id)
                      }
                      refreshGroupsFromStorage()
                    }
                  }}
                >
                  {t(isArchived ? 'unarchive' : 'archive')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {isArchived && (
          <div className="mt-3">
            <span className="inline-flex rounded-md border px-2 py-0.5 text-[11px] text-muted-foreground">
              {t('archived')}
            </span>
          </div>
        )}
      </div>
    </li>
  )
}
