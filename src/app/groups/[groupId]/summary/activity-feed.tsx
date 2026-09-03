'use client'

import { GroupSectionContent } from '@/components/ui/group-section-card'
import type { Locale } from '@/i18n/request'
import { getActivityPresentation } from '@/lib/activity-presenter'
import { Currency, getCurrency } from '@/lib/currency'
import { formatCurrency, formatDate } from '@/lib/utils'
import { AppRouterOutput } from '@/trpc/routers/_app'
import {
  ArrowRightLeft,
  CircleHelp,
  Pencil,
  ReceiptText,
  Trash2,
} from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import Link from 'next/link'

type Activity =
  AppRouterOutput['groups']['activities']['list']['activities'][number]

function ActivityIcon({
  kind,
}: {
  kind: ReturnType<typeof getActivityPresentation>['kind']
}) {
  const Icon =
    kind === 'paymentRecorded' || kind === 'paymentEdited'
      ? ArrowRightLeft
      : kind === 'paymentDeleted'
        ? Trash2
        : kind === 'expenseEdited'
          ? Pencil
          : kind === 'expenseDeleted'
            ? Trash2
            : kind === 'unknown'
              ? CircleHelp
              : ReceiptText

  return <Icon className="h-4 w-4" aria-hidden="true" />
}

function ActivitySkeleton({ label }: { label: string }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-label={label}>
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="flex items-center gap-3">
          <div className="h-8 w-8 animate-pulse rounded-md bg-muted" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="h-3.5 w-4/5 animate-pulse rounded bg-muted" />
            <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  )
}

function ActivitySentence({
  activity,
  groupId,
  groupCurrency,
}: {
  activity: Activity
  groupId: string
  groupCurrency: Currency
}) {
  const locale = useLocale()
  const t = useTranslations('Summary')
  const presentation = getActivityPresentation(activity)
  const actor = presentation.actorName ?? t('unknownActor')
  const title = presentation.title ?? t('unknownExpense')
  const hasAmount = presentation.amount !== null
  const currency = presentation.currencyCode
    ? getCurrency(presentation.currencyCode, locale as Locale)
    : groupCurrency
  const amount =
    hasAmount && currency
      ? formatCurrency(currency, presentation.amount!, locale)
      : null
  const payer = presentation.payerName ?? t('unknownActor')
  const payee = presentation.payeeName ?? t('unknownActor')

  const sentence =
    presentation.kind === 'expenseCreated'
      ? t('addedExpense', { actor, title, amount: amount ?? '' })
      : presentation.kind === 'expenseEdited'
        ? t('editedExpense', { actor, title })
        : presentation.kind === 'expenseDeleted'
          ? t('deletedExpense', { actor, title })
          : presentation.kind === 'paymentRecorded'
            ? t('recordedPayment', {
                actor,
                payer,
                payee,
                amount: amount ?? '',
              })
            : presentation.kind === 'paymentEdited'
              ? t('editedPayment', { actor })
              : presentation.kind === 'paymentDeleted'
                ? t('deletedPayment', { actor, amount: amount ?? '' })
                : presentation.kind === 'groupUpdated'
                  ? t('updatedGroup', { actor })
                  : t('unknownActivity', { actor })

  return (
    <li className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border/70 bg-background text-muted-foreground">
        <ActivityIcon kind={presentation.kind} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="break-words text-sm leading-5 text-foreground">
          {presentation.resourceId ? (
            <Link
              href={`/groups/${groupId}/expenses/${presentation.resourceId}/edit`}
              className="underline decoration-border underline-offset-2 hover:decoration-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {sentence}
            </Link>
          ) : (
            sentence
          )}
        </p>
        <time
          dateTime={activity.time.toISOString()}
          className="mt-0.5 block text-xs text-muted-foreground"
        >
          {formatDate(activity.time, locale, {
            dateStyle: 'medium',
            timeStyle: 'short',
          })}
        </time>
      </div>
    </li>
  )
}

export function ActivityFeed({
  activities,
  groupId,
  groupCurrency,
  isLoading,
  isError,
}: {
  activities: Activity[]
  groupId: string
  groupCurrency: Currency
  isLoading: boolean
  isError: boolean
}) {
  const t = useTranslations('Summary')

  return (
    <GroupSectionContent>
      {isLoading ? (
        <ActivitySkeleton label={t('loadingActivity')} />
      ) : isError ? (
        <p className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {t('activityError')}
        </p>
      ) : activities.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('noActivityYet')}</p>
      ) : (
        <ol aria-label={t('recentActivityTitle')}>
          {activities.map((activity) => (
            <ActivitySentence
              key={activity.id}
              activity={activity}
              groupId={groupId}
              groupCurrency={groupCurrency}
            />
          ))}
        </ol>
      )}
    </GroupSectionContent>
  )
}
