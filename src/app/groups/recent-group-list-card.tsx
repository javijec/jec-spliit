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
import { Calendar, MoreHorizontal, Star, Users } from 'lucide-react'
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
      <div className="rounded-xl border border-border/80 bg-card p-4 shadow-sm shadow-black/5 transition-colors hover:bg-secondary/20">
        <div className="flex items-start gap-3">
          <Link
            href={`/groups/${group.id}`}
            className="min-w-0 flex-1 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border/70 bg-secondary/60 text-muted-foreground">
                    <Users className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold text-foreground">
                      {group.name}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">Grupo</p>
                  </div>
                </div>
                <div className="mt-3 text-xs text-muted-foreground">
                  {groupDetail ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center rounded-md border border-border/80 bg-background px-2 py-1">
                        <Users className="mr-1.5 h-3 w-3" />
                        <span>{groupDetail._count.participants}</span>
                      </span>
                      <span className="inline-flex items-center rounded-md border border-border/80 bg-background px-2 py-1">
                        <Calendar className="mr-1.5 h-3 w-3" />
                        <span className="truncate">
                          {new Date(groupDetail.createdAt).toLocaleDateString(
                            locale,
                            {
                              dateStyle: 'medium',
                            },
                          )}
                        </span>
                      </span>
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      <Skeleton className="h-4 w-10 rounded-sm" />
                      <Skeleton className="h-4 w-24 rounded-sm" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Link>

          <div className="flex shrink-0 items-center">
            <Button
              size="icon"
              variant="ghost"
              className="-my-2 -ml-2 -mr-1 h-10 w-10 rounded-lg"
              aria-label={isStarred ? t('unarchive') : t('starred')}
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
                <Button
                  size="icon"
                  variant="ghost"
                  className="-my-2 -mr-2 h-10 w-10 rounded-lg"
                  aria-label="Más opciones"
                >
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
            <span className="inline-flex rounded-md border border-border/80 bg-background px-2 py-0.5 text-[11px] text-muted-foreground">
              {t('archived')}
            </span>
          </div>
        )}
      </div>
    </li>
  )
}
