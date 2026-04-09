'use client'

import { ActiveUserBalance } from '@/app/groups/[groupId]/expenses/active-user-balance'
import { CategoryIcon } from '@/app/groups/[groupId]/expenses/category-icon'
import { DocumentsCount } from '@/app/groups/[groupId]/expenses/documents-count'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getGroupExpenses } from '@/lib/api'
import { Currency, getCurrency } from '@/lib/currency'
import { cn, formatCurrency, formatDateOnly } from '@/lib/utils'
import { ArrowRightLeft, ChevronRight } from 'lucide-react'
import { useLocale } from 'next-intl'
import Link from 'next/link'
import { memo, useMemo } from 'react'

type Expense = Awaited<ReturnType<typeof getGroupExpenses>>[number]

type Props = {
  expense: Expense
  currency: Currency
  groupId: string
}

type LocaleLabels = {
  paidBy: string
  owes: string
  nobody: string
  settlement: string
  documents: string
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

function getLabels(locale: string): LocaleLabels {
  const isSpanish = locale.toLowerCase().startsWith('es')
  return {
    paidBy: isSpanish ? 'Pago:' : 'Paid:',
    owes: isSpanish ? 'Debe:' : 'Owes:',
    nobody: isSpanish ? 'Nadie' : 'Nobody',
    settlement: isSpanish ? 'Reembolso' : 'Settlement',
    documents: isSpanish ? 'Adjuntos' : 'Docs',
  }
}

function resolveDisplayCurrency(expense: Expense, fallbackCurrency: Currency) {
  return expense.originalCurrency ? getCurrency(expense.originalCurrency) : fallbackCurrency
}

function resolveDisplayAmount(expense: Expense) {
  return expense.originalAmount ?? expense.amount
}

function getSettlementLabel(expense: Expense, locale: string) {
  const settlementTo =
    expense.paidFor.length === 1
      ? expense.paidFor[0].participant.name
      : expense.paidFor.map((item) => item.participant.name).join(', ')
  const isSpanish = locale.toLowerCase().startsWith('es')
  return isSpanish
    ? `${expense.paidBy.name} pagó a ${settlementTo}`
    : `${expense.paidBy.name} paid ${settlementTo}`
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
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center border bg-primary/8 text-primary dark:bg-primary/12">
        <ArrowRightLeft className="w-3.5 h-3.5" />
      </div>
    )
  }

  return (
    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center border bg-muted/25 text-muted-foreground">
      <CategoryIcon
        category={expense.category}
        className="h-3.5 w-3.5"
      />
    </div>
  )
}

function ExpenseMainColumn({
  expense,
  labels,
  displayCurrency,
  displayAmount,
  locale,
  currency,
  groupId,
}: {
  expense: Expense
  labels: LocaleLabels
  displayCurrency: Currency
  displayAmount: number
  locale: string
  currency: Currency
  groupId: string
}) {
  const formattedDate = formatDateOnly(expense.expenseDate, locale, {
    dateStyle: 'medium',
  })

  if (expense.isReimbursement) {
    return (
      <div className="min-w-0 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="rounded-full px-2.5 py-1 text-[0.7rem]">
            {labels.settlement}
          </Badge>
          <Badge variant="outline" className="rounded-full px-2.5 py-1 text-[0.7rem]">
            {formattedDate}
          </Badge>
        </div>
        <div className="pr-2 text-sm font-semibold leading-tight whitespace-normal break-words text-foreground">
          {getSettlementLabel(expense, locale)}
        </div>
        <ActiveUserBalance groupId={groupId} currency={currency} expense={expense} />
      </div>
    )
  }

  const debtorSummary = getDebtorsSummary({
    expense,
    amount: displayAmount,
    currency: displayCurrency,
    locale,
    nobodyLabel: labels.nobody,
  })

  return (
    <div className="min-w-0 space-y-2">
      <div className="text-sm font-semibold leading-tight break-words">
        {expense.title}
      </div>
      <div className="text-[11px] text-muted-foreground leading-tight truncate">
        <span>{labels.paidBy}</span>{' '}
        <strong className="text-foreground">
          {formatShortParticipantName(expense.paidBy.name)}
        </strong>{' '}
        <span className="tabular-nums whitespace-nowrap">
          {formatCurrency(displayCurrency, displayAmount, locale)}
        </span>
      </div>
      <div className="text-[11px] text-muted-foreground mt-0.5 leading-tight truncate">
        <span>{labels.owes}</span>{' '}
        <strong className="text-foreground font-medium">{debtorSummary}</strong>
      </div>
      <ActiveUserBalance groupId={groupId} currency={currency} expense={expense} />
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="rounded-full px-2.5 py-1 text-[0.7rem]">
          {formattedDate}
        </Badge>
        {expense._count.documents > 0 && (
          <Badge variant="outline" className="rounded-full px-2.5 py-1 text-[0.7rem]">
            {labels.documents}: <span className="ml-1 tabular-nums">{expense._count.documents}</span>
          </Badge>
        )}
      </div>
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
    <div
      className={cn(
        'flex min-w-[104px] flex-col items-end gap-1 border-l pl-3 text-right sm:min-w-[120px] sm:pl-4',
        expense.isReimbursement && 'border-primary/20',
      )}
    >
      <div
        className={cn(
          'tabular-nums whitespace-nowrap text-base leading-none sm:text-lg',
          expense.isReimbursement ? 'font-semibold text-primary' : 'font-bold',
        )}
      >
        {formatCurrency(displayCurrency, displayAmount, locale)}
      </div>
      {!expense.isReimbursement && expense._count.documents > 0 && (
        <div className="hidden text-[10px] text-muted-foreground sm:block">
          <DocumentsCount count={expense._count.documents} />
        </div>
      )}
    </div>
  )
}

function ExpenseCardComponent({ expense, currency, groupId }: Props) {
  const locale = useLocale()
  const labels = useMemo(() => getLabels(locale), [locale])
  const displayCurrency = useMemo(
    () => resolveDisplayCurrency(expense, currency),
    [currency, expense],
  )
  const displayAmount = useMemo(() => resolveDisplayAmount(expense), [expense])
  const href = `/groups/${groupId}/expenses/${expense.id}/edit`

  return (
    <Link
      href={href}
      className={cn(
        'group mx-2 my-2 flex items-start gap-3 rounded-2xl border border-border/70 bg-card/90 px-3.5 py-3.5 text-sm shadow-sm shadow-black/5 transition-colors hover:bg-muted/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:mx-3 sm:px-5 sm:py-4',
        expense.isReimbursement &&
          'border-primary/20 bg-primary/[0.04] hover:bg-primary/[0.07] dark:bg-primary/[0.08] dark:hover:bg-primary/[0.12]',
      )}
      aria-label={expense.title}
    >
      <LeadingIcon expense={expense} />
      <div className="min-w-0 flex-1">
        <ExpenseMainColumn
          expense={expense}
          labels={labels}
          displayCurrency={displayCurrency}
          displayAmount={displayAmount}
          locale={locale}
          currency={currency}
          groupId={groupId}
        />
      </div>
      <AmountColumn
        expense={expense}
        displayCurrency={displayCurrency}
        displayAmount={displayAmount}
        locale={locale}
      />
      <div className="hidden self-center text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 sm:flex">
        <ChevronRight className="w-4 h-4" />
      </div>
    </Link>
  )
}

export const ExpenseCard = memo(ExpenseCardComponent)
