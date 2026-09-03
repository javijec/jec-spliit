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
import { getCurrency } from '@/lib/currency'
import { formatCurrency, formatDate, getCurrencyFromGroup } from '@/lib/utils'
import { AppRouterOutput } from '@/trpc/routers/_app'
import { StarFilledIcon } from '@radix-ui/react-icons'
import {
  CalendarClock,
  CircleCheck,
  CircleDollarSign,
  MoreHorizontal,
  Star,
  Users,
} from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import Link from 'next/link'

type GroupDetail = AppRouterOutput['groups']['list']['groups'][number] &
  Partial<
    Pick<
      AppRouterOutput['groups']['mine']['groups'][number],
      'totalSpentByCurrency' | 'personalBalanceByCurrency' | 'lastActivityAt'
    >
  >

const AVATAR_COLORS = [
  'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200',
  'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200',
  'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200',
  'bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-200',
  'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200',
] as const

function getInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return '?'
  if (words.length === 1) return words[0]!.slice(0, 2).toUpperCase()
  return `${words[0]![0]}${words.at(-1)![0]}`.toUpperCase()
}

function getAvatarColor(groupId: string) {
  let hash = 0
  for (const character of groupId) {
    hash = (hash * 31 + character.charCodeAt(0)) | 0
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function getCurrencyForGroup(group: GroupDetail, currencyCode: string) {
  const primaryCurrency = group.currencyCode ?? group.currency
  return currencyCode === primaryCurrency
    ? getCurrencyFromGroup(group)
    : getCurrency(currencyCode)
}

function SummaryMoney({
  group,
  amounts,
  locale,
}: {
  group: GroupDetail
  amounts: Record<string, number>
  locale: string
}) {
  return Object.entries(amounts)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([currencyCode, amount]) => (
      <span key={currencyCode} className="whitespace-nowrap">
        {formatCurrency(
          getCurrencyForGroup(group, currencyCode),
          Math.abs(amount),
          locale,
        )}
      </span>
    ))
}

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
  groupDetail?: GroupDetail
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
  const totalSpentByCurrency = groupDetail?.totalSpentByCurrency ?? {}
  const personalBalances = groupDetail?.personalBalanceByCurrency ?? {}
  const hasPersonalBalance = Object.keys(personalBalances).length > 0
  const receivableBalances = Object.fromEntries(
    Object.entries(personalBalances).filter(([, amount]) => amount > 0),
  )
  const payableBalances = Object.fromEntries(
    Object.entries(personalBalances).filter(([, amount]) => amount < 0),
  )
  const isSettled =
    hasPersonalBalance &&
    Object.values(personalBalances).every((amount) => amount === 0)

  return (
    <li>
      <div className="finance-shell p-3 transition-colors hover:border-border hover:bg-secondary/20 sm:p-4">
        <div className="flex items-start gap-3">
          <Link
            href={`/groups/${group.id}`}
            className="min-w-0 flex-1 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <div className="flex min-w-0 items-start gap-3">
              <div
                aria-hidden="true"
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${getAvatarColor(group.id)}`}
              >
                {getInitials(group.name)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-semibold text-foreground sm:text-lg">
                  {group.name}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {t('groupLabel')}
                </p>

                {groupDetail ? (
                  <div className="mt-3 space-y-2.5">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5" aria-hidden="true" />
                        {t('participantCount', {
                          count: groupDetail._count.participants,
                        })}
                      </span>
                      {groupDetail.lastActivityAt && (
                        <span className="inline-flex items-center gap-1.5">
                          <CalendarClock
                            className="h-3.5 w-3.5"
                            aria-hidden="true"
                          />
                          {t('lastActivity')}:{' '}
                          {formatDate(
                            new Date(groupDetail.lastActivityAt),
                            locale,
                            { dateStyle: 'medium' },
                          )}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                      {Object.keys(totalSpentByCurrency).length > 0 && (
                        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                          <CircleDollarSign
                            className="h-4 w-4"
                            aria-hidden="true"
                          />
                          <span>{t('totalSpent')}:</span>
                          <span className="font-semibold text-foreground">
                            <SummaryMoney
                              group={groupDetail}
                              amounts={totalSpentByCurrency}
                              locale={locale}
                            />
                          </span>
                        </span>
                      )}

                      {Object.keys(receivableBalances).length > 0 && (
                        <span className="inline-flex items-center gap-1.5 text-success">
                          <span className="font-medium">
                            {t('youAreOwed')}:
                          </span>
                          <span className="font-bold">
                            <SummaryMoney
                              group={groupDetail}
                              amounts={receivableBalances}
                              locale={locale}
                            />
                          </span>
                        </span>
                      )}

                      {Object.keys(payableBalances).length > 0 && (
                        <span className="inline-flex items-center gap-1.5 text-danger">
                          <span className="font-medium">{t('youOwe')}:</span>
                          <span className="font-bold">
                            <SummaryMoney
                              group={groupDetail}
                              amounts={payableBalances}
                              locale={locale}
                            />
                          </span>
                        </span>
                      )}

                      {isSettled && (
                        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                          <CircleCheck className="h-4 w-4" aria-hidden="true" />
                          {t('settled')}
                        </span>
                      )}

                      {!hasPersonalBalance && (
                        <span className="text-xs text-muted-foreground">
                          {t('summaryUnavailable')}
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 flex flex-wrap gap-3">
                    <Skeleton className="h-4 w-24 rounded-sm" />
                    <Skeleton className="h-4 w-32 rounded-sm" />
                  </div>
                )}
              </div>
            </div>
          </Link>

          <div className="flex shrink-0 items-center">
            <Button
              size="icon"
              variant="ghost"
              className="-my-2 -ml-2 -mr-1 h-9 w-9 rounded-md"
              aria-label={
                isStarred ? t('removeFromFavorites') : t('addToFavorites')
              }
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
                  className="-my-2 -mr-2 h-9 w-9 rounded-md"
                  aria-label={t('moreOptions')}
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
          <div className="mt-3 border-t border-border/60 pt-2">
            <span className="text-xs font-medium text-muted-foreground">
              {t('archived')}
            </span>
          </div>
        )}
      </div>
    </li>
  )
}
