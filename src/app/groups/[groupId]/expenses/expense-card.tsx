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
  const totalShares = expense.paidFor.reduce((sum, item) => sum + item.shares, 0)
  if (totalShares <= 0) return nobodyLabel

  const debtors: Debtor[] = expense.paidFor
    .filter((item) => item.participant.id !== expense.paidBy.id)
    .map((item) => ({
      name: formatShortParticipantName(item.participant.name),
      amount: Math.round((amount * item.shares) / totalShares),
    }))
    .slice(0, 2)

  if (debtors.length === 0) return nobodyLabel

  const totalDebtors = expense.paidFor.filter(
    (item) => item.participant.id !== expense.paidBy.id,
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
      <div className="mt-0.5 shrink-0 rounded-full bg-primary/12 p-1 text-primary dark:bg-primary/18">
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

export function ExpenseCard({ expense, currency, groupId }: Props) {
  const router = useRouter()
  const locale = useLocale()
  const labels = getLabels(locale)
  const displayCurrency = resolveDisplayCurrency(expense, currency)
  const displayAmount = resolveDisplayAmount(expense)
  const href = `/groups/${groupId}/expenses/${expense.id}/edit`

  return (
    <div
      className={cn(
        'group flex justify-between mx-2 sm:mx-6 px-3 sm:px-4 py-2 rounded-xl text-sm cursor-pointer gap-2 items-start border bg-card/60 border-border/70 hover:border-border hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-safe:transition-all motion-safe:duration-150',
        expense.isReimbursement &&
          'border-primary/25 bg-primary/[0.08] hover:bg-primary/[0.12] dark:border-primary/20 dark:bg-primary/[0.10] dark:hover:bg-primary/[0.14]',
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
      <div className="flex-1 min-w-0">
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
        className="self-center hidden sm:flex opacity-50 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity"
        asChild
      >
        <Link href={href}>
          <ChevronRight className="w-4 h-4" />
        </Link>
      </Button>
    </div>
  )
}
