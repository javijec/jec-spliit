'use client'
import { ActiveUserBalance } from '@/app/groups/[groupId]/expenses/active-user-balance'
import { CategoryIcon } from '@/app/groups/[groupId]/expenses/category-icon'
import { DocumentsCount } from '@/app/groups/[groupId]/expenses/documents-count'
import { Button } from '@/components/ui/button'
import { getGroupExpenses } from '@/lib/api'
import { Currency } from '@/lib/currency'
import { cn, formatCurrency, formatDateOnly } from '@/lib/utils'
import { ChevronRight } from 'lucide-react'
import { useLocale } from 'next-intl'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type Expense = Awaited<ReturnType<typeof getGroupExpenses>>[number]

function getPaidForAmounts({
  expense,
}: {
  expense: Expense
}) {
  const totalShares = expense.paidFor.reduce(
    (sum, paidFor) => sum + paidFor.shares,
    0,
  )
  if (totalShares === 0) return []

  return expense.paidFor.map((paidFor) => ({
    participantName: paidFor.participant.name,
    amount: Math.round((expense.amount * paidFor.shares) / totalShares),
  }))
}

function ParticipantsBreakdown({
  expense,
  currency,
  locale,
}: {
  expense: Expense
  currency: Currency
  locale: string
}) {
  const paidForAmounts = getPaidForAmounts({ expense })

  return (
    <div className="flex flex-wrap gap-1">
      {paidForAmounts.map((paidFor) => (
        <span
          key={`${expense.id}-${paidFor.participantName}`}
          className="inline-flex items-center rounded-full border bg-muted/60 px-2 py-0.5 text-[10px] sm:text-xs tabular-nums"
        >
          <span className="font-medium">{paidFor.participantName}:</span>
          <span className="ml-1">
            {formatCurrency(currency, paidFor.amount, locale)}
          </span>
        </span>
      ))}
    </div>
  )
}

type Props = {
  expense: Expense
  currency: Currency
  groupId: string
}

export function ExpenseCard({
  expense,
  currency,
  groupId,
}: Props) {
  const router = useRouter()
  const locale = useLocale()
  const isSpanish = locale.toLowerCase().startsWith('es')
  const paidByLabel = isSpanish ? 'Pago:' : 'Paid by:'
  const splitLabel = isSpanish ? 'Debe cada uno:' : 'Each pays:'

  return (
    <div
      key={expense.id}
      className={cn(
        'group flex justify-between mx-2 sm:mx-6 px-3 sm:px-4 py-2.5 sm:py-4 rounded-xl text-sm cursor-pointer gap-2 sm:gap-1 items-start sm:items-stretch border bg-card/60 border-border/70 hover:border-border hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-safe:transition-all motion-safe:duration-150',
        expense.isReimbursement && 'italic',
      )}
      role="button"
      tabIndex={0}
      onClick={() => {
        router.push(`/groups/${groupId}/expenses/${expense.id}/edit`)
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          router.push(`/groups/${groupId}/expenses/${expense.id}/edit`)
        }
      }}
    >
      <CategoryIcon
        category={expense.category}
        className="w-3.5 h-3.5 mt-0.5 text-muted-foreground shrink-0"
      />
      <div className="flex-1 min-w-0">
        <div
          className={cn(
            'mb-0.5 text-sm sm:text-sm font-semibold leading-tight truncate',
            expense.isReimbursement && 'italic',
          )}
        >
          {expense.title}
        </div>
        <div className="text-[11px] text-muted-foreground leading-tight pr-1">
          <span>{paidByLabel}</span>{' '}
          <strong className="text-foreground">{expense.paidBy.name}</strong>
        </div>
        <div className="text-[11px] text-muted-foreground mt-1 leading-tight">
          <span>{splitLabel}</span>
          <div className="mt-1">
            <ParticipantsBreakdown
              expense={expense}
              currency={currency}
              locale={locale}
            />
          </div>
        </div>
        <div className="text-[11px] text-muted-foreground mt-1 leading-tight">
          <ActiveUserBalance {...{ groupId, currency, expense }} />
        </div>
      </div>
      <div className="flex flex-col justify-between items-end min-w-[92px] sm:min-w-[100px] gap-0.5">
        <div
          className={cn(
            'tabular-nums whitespace-nowrap text-[15px] sm:text-base leading-none',
            expense.isReimbursement ? 'italic' : 'font-bold',
          )}
        >
          {formatCurrency(currency, expense.amount, locale)}
        </div>
        <div className="text-[11px] text-muted-foreground hidden sm:block">
          <DocumentsCount count={expense._count.documents} />
        </div>
        <div className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap">
          {formatDateOnly(expense.expenseDate, locale, { dateStyle: 'medium' })}
        </div>
      </div>
      <Button
        size="icon"
        variant="link"
        className="self-center hidden sm:flex opacity-50 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity"
        asChild
      >
        <Link href={`/groups/${groupId}/expenses/${expense.id}/edit`}>
          <ChevronRight className="w-4 h-4" />
        </Link>
      </Button>
    </div>
  )
}
