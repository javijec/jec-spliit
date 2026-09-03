'use client'

import { CategoryIcon } from '@/app/groups/[groupId]/expenses/category-icon'
import { getPersonalExpenseShare } from '@/app/groups/[groupId]/expenses/expense-row-utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getGroupExpenses } from '@/lib/api'
import { Currency, getCurrency } from '@/lib/currency'
import { cn, formatCurrency, formatDateOnly } from '@/lib/utils'
import { ArrowRightLeft, ChevronDown, Pencil } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import Link from 'next/link'
import { memo, useMemo, useState } from 'react'
import { useCurrentGroup } from '../current-group-context'

type Expense = Awaited<ReturnType<typeof getGroupExpenses>>[number]

type Props = {
  expense: Expense
  currency: Currency
  groupId: string
}

type PaidForItem = Expense['paidFor'][number]

type Debtor = {
  name: string
  amount: number
}

function formatShortParticipantName(name: string) {
  const normalized = name.trim().replace(/\s+/g, ' ')
  if (!normalized) return name

  const parts = normalized.split(' ')
  if (parts.length === 1) return parts[0]

  const firstName = parts[0]
  const lastInitial = parts[parts.length - 1][0]?.toUpperCase()
  return lastInitial ? `${firstName} ${lastInitial}.` : firstName
}

function resolveDisplayCurrency(expense: Expense, fallbackCurrency: Currency) {
  return expense.originalCurrency
    ? getCurrency(expense.originalCurrency)
    : fallbackCurrency
}

function resolveDisplayAmount(expense: Expense) {
  return expense.originalAmount ?? expense.amount
}

function getDebtorsSummary({
  expense,
  amount,
  currency,
  locale,
  nobodyLabel,
}: {
  expense: Expense
  amount: number
  currency: Currency
  locale: string
  nobodyLabel: string
}) {
  const totalShares = expense.paidFor.reduce(
    (sum: number, item: PaidForItem) => sum + item.shares,
    0,
  )
  if (totalShares <= 0) return nobodyLabel

  const debtors: Debtor[] = expense.paidFor
    .filter((item: PaidForItem) => item.participant.id !== expense.paidBy.id)
    .map((item: PaidForItem) => ({
      name: formatShortParticipantName(item.participant.name),
      amount: Math.round((amount * item.shares) / totalShares),
    }))
    .slice(0, 2)

  if (debtors.length === 0) return nobodyLabel

  const totalDebtors = expense.paidFor.filter(
    (item: PaidForItem) => item.participant.id !== expense.paidBy.id,
  ).length
  const hiddenCount = Math.max(0, totalDebtors - debtors.length)

  return `${debtors
    .map(
      (debtor) =>
        `${debtor.name}: ${formatCurrency(currency, debtor.amount, locale)}`,
    )
    .join(' · ')}${hiddenCount > 0 ? ` · +${hiddenCount}` : ''}`
}

function LeadingIcon({ expense }: { expense: Expense }) {
  if (expense.isReimbursement) {
    return (
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border/70 bg-background text-muted-foreground">
        <ArrowRightLeft className="h-3.5 w-3.5" />
      </div>
    )
  }

  return (
    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border/70 bg-background text-muted-foreground">
      <CategoryIcon category={expense.category} className="h-3.5 w-3.5" />
    </div>
  )
}

function AmountColumn({
  expense,
  displayCurrency,
  displayAmount,
  locale,
}: {
  expense: Expense
  displayCurrency: Currency
  displayAmount: number
  locale: string
}) {
  return (
    <div className={cn('shrink-0 text-right')}>
      <div
        className={cn(
          'tabular-nums whitespace-nowrap text-sm font-bold leading-none sm:text-base',
          expense.isReimbursement ? 'font-semibold text-primary' : 'font-bold',
        )}
      >
        {formatCurrency(displayCurrency, displayAmount, locale)}
      </div>
    </div>
  )
}

function ExpenseCardComponent({ expense, currency, groupId }: Props) {
  const locale = useLocale()
  const t = useTranslations('ExpenseCard')
  const { currentActiveParticipantId } = useCurrentGroup()
  const [expanded, setExpanded] = useState(false)
  const displayCurrency = useMemo(
    () => resolveDisplayCurrency(expense, currency),
    [currency, expense],
  )
  const displayAmount = useMemo(() => resolveDisplayAmount(expense), [expense])
  const formattedDate = useMemo(
    () =>
      formatDateOnly(expense.expenseDate, locale, {
        dateStyle: 'medium',
      }),
    [expense.expenseDate, locale],
  )
  const debtorSummary = useMemo(
    () =>
      getDebtorsSummary({
        expense,
        amount: displayAmount,
        currency: displayCurrency,
        locale,
        nobodyLabel: t('nobody'),
      }),
    [displayAmount, displayCurrency, expense, locale, t],
  )
  const personalShare = useMemo(
    () =>
      getPersonalExpenseShare(
        currentActiveParticipantId,
        expense,
        displayAmount,
      ),
    [currentActiveParticipantId, displayAmount, expense],
  )
  const summaryTitle = expense.isReimbursement ? t('payment') : expense.title
  const href = `/groups/${groupId}/expenses/${expense.id}/edit`
  const settlementTo = expense.paidFor
    .map((item) => item.participant.name)
    .join(', ')
  const settlementLabel = t('paymentDescription', {
    payer: expense.paidBy.name,
    payee: settlementTo,
  })
  const personalShareLabel =
    personalShare === undefined
      ? null
      : personalShare === null
        ? t('notInvolved')
        : `${t('yourShare')} ${formatCurrency(
            displayCurrency,
            personalShare,
            locale,
          )}`

  return (
    <div
      className={cn(
        'overflow-hidden border-b border-border/60 bg-card/35 first:border-t',
        expense.isReimbursement && 'bg-secondary/15',
      )}
    >
      <button
        type="button"
        onClick={() => setExpanded((current) => !current)}
        className="flex min-h-20 w-full items-start gap-3 px-3 py-3 text-left transition-colors hover:bg-secondary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset sm:px-4"
        aria-expanded={expanded}
        aria-controls={`expense-details-${expense.id}`}
      >
        <LeadingIcon expense={expense} />
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 line-clamp-2 break-words text-[13px] font-semibold leading-tight text-foreground sm:text-sm">
              {summaryTitle}
            </div>
            <AmountColumn
              expense={expense}
              displayCurrency={displayCurrency}
              displayAmount={displayAmount}
              locale={locale}
            />
          </div>
          <div className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[10px] leading-tight text-muted-foreground sm:text-[11px]">
            <span>{t('paidByLabel')}</span>{' '}
            <strong className="text-foreground">
              {formatShortParticipantName(expense.paidBy.name)}
            </strong>
            <span aria-hidden="true">·</span>
            <time dateTime={expense.expenseDate.toISOString()}>
              {formattedDate}
            </time>
          </div>
          {personalShareLabel && (
            <div
              className={cn(
                'mt-1 text-[11px] font-medium leading-tight sm:text-xs',
                personalShare === null
                  ? 'text-muted-foreground'
                  : 'text-primary',
              )}
            >
              {personalShareLabel}
            </div>
          )}
        </div>
        <div className="pt-0.5 text-muted-foreground">
          <ChevronDown
            className={cn(
              'h-3.5 w-3.5 transition-transform duration-150',
              expanded && 'rotate-180',
            )}
          />
        </div>
      </button>

      {expanded && (
        <div
          id={`expense-details-${expense.id}`}
          className="border-t border-border/60 bg-background/80 px-3 py-3 sm:px-4"
        >
          <div className="space-y-2">
            {expense.isReimbursement ? (
              <p className="text-sm leading-5 text-muted-foreground">
                <span className="font-medium text-foreground">
                  {t('paymentRecorded')}
                </span>
                <span className="mx-1.5" aria-hidden="true">
                  ·
                </span>
                {settlementLabel}
              </p>
            ) : (
              <p className="text-sm leading-5 text-muted-foreground">
                <span>{t('owes')}</span>{' '}
                <strong className="font-medium text-foreground">
                  {debtorSummary}
                </strong>
              </p>
            )}

            <div className="flex flex-wrap items-center gap-2">
              {expense.isReimbursement && (
                <Badge variant="outline" className="text-[0.7rem]">
                  {t('payment')}
                </Badge>
              )}
              {expense._count.documents > 0 && (
                <Badge variant="outline" className="text-[0.7rem]">
                  {t('documents')}:{' '}
                  <span className="ml-1 tabular-nums">
                    {expense._count.documents}
                  </span>
                </Badge>
              )}
            </div>

            <div className="pt-0.5">
              <Button asChild variant="outline" size="sm">
                <Link href={href}>
                  <Pencil className="h-4 w-4" />
                  {t('edit')}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export const ExpenseCard = memo(ExpenseCardComponent)
