'use client'

import { CategoryIcon } from '@/app/groups/[groupId]/expenses/category-icon'
import { DocumentsCount } from '@/app/groups/[groupId]/expenses/documents-count'
import { Button } from '@/components/ui/button'
import { getGroupExpenses } from '@/lib/api'
import { Currency, getCurrency } from '@/lib/currency'
import { cn, formatCurrency, formatDateOnly } from '@/lib/utils'
import { ArrowRightLeft, ChevronRight } from 'lucide-react'
import { useLocale } from 'next-intl'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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
      <div className="mt-0.5 shrink-0 border bg-primary/8 p-1 text-primary dark:bg-primary/12">
        <ArrowRightLeft className="w-3.5 h-3.5" />
      </div>
    )
  }

  return (
    <CategoryIcon
      category={expense.category}
      className="w-3.5 h-3.5 mt-0.5 text-muted-foreground shrink-0"
    />
  )
}

function ExpenseBody({
  expense,
  labels,
  displayCurrency,
  displayAmount,
  locale,
}: {
  expense: Expense
  labels: LocaleLabels
  displayCurrency: Currency
  displayAmount: number
  locale: string
}) {
  if (expense.isReimbursement) {
    return (
      <div className="pr-2 text-sm font-semibold leading-tight whitespace-normal break-words text-primary">
        {getSettlementLabel(expense, locale)}
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
    <>
      <div className="text-sm font-semibold leading-tight truncate">
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
    </>
  )
}

function AmountMetaColumn({
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
        'flex flex-col items-end gap-1',
        expense.isReimbursement
          ? 'min-w-[86px] sm:min-w-[100px]'
          : 'min-w-[96px] sm:min-w-[108px]',
      )}
    >
      <div
        className={cn(
          'tabular-nums whitespace-nowrap text-[15px] sm:text-base leading-tight',
          expense.isReimbursement ? 'font-semibold text-primary' : 'font-bold',
        )}
      >
        {formatCurrency(displayCurrency, displayAmount, locale)}
      </div>
      {!expense.isReimbursement && (
        <div className="text-[10px] text-muted-foreground hidden sm:block">
          <DocumentsCount count={expense._count.documents} />
        </div>
      )}
      <div className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap">
        {formatDateOnly(expense.expenseDate, locale, { dateStyle: 'medium' })}
      </div>
    </div>
  )
}

function ExpenseCardComponent({ expense, currency, groupId }: Props) {
  const router = useRouter()
  const locale = useLocale()
  const labels = useMemo(() => getLabels(locale), [locale])
  const displayCurrency = useMemo(
    () => resolveDisplayCurrency(expense, currency),
    [currency, expense],
  )
  const displayAmount = useMemo(() => resolveDisplayAmount(expense), [expense])
  const href = `/groups/${groupId}/expenses/${expense.id}/edit`

  return (
    <div
      className={cn(
        'group mx-2 flex cursor-pointer items-start justify-between gap-3 border-x-0 border-t-0 bg-card px-3 py-3 text-sm transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:mx-0 sm:px-5',
        expense.isReimbursement &&
          'border-primary/20 bg-primary/[0.05] hover:bg-primary/[0.08] dark:bg-primary/[0.08] dark:hover:bg-primary/[0.12]',
      )}
      role="button"
      tabIndex={0}
      onClick={() => router.push(href)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          router.push(href)
        }
      }}
    >
      <LeadingIcon expense={expense} />
      <div className="min-w-0 flex-1">
        <ExpenseBody
          expense={expense}
          labels={labels}
          displayCurrency={displayCurrency}
          displayAmount={displayAmount}
          locale={locale}
        />
      </div>
      <AmountMetaColumn
        expense={expense}
        displayCurrency={displayCurrency}
        displayAmount={displayAmount}
        locale={locale}
      />
      <Button
        size="icon"
        variant="link"
        className="hidden self-center text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 sm:flex"
        asChild
      >
        <Link href={href}>
          <ChevronRight className="w-4 h-4" />
        </Link>
      </Button>
    </div>
  )
}

export const ExpenseCard = memo(ExpenseCardComponent)
