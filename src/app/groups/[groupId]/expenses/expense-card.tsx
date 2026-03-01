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

function formatShortParticipantName(name: string) {
  const normalized = name.trim().replace(/\s+/g, ' ')
  if (!normalized) return name
  const parts = normalized.split(' ')
  if (parts.length === 1) return parts[0]
  const firstName = parts[0]
  const lastInitial = parts[parts.length - 1][0]?.toUpperCase()
  return lastInitial ? `${firstName} ${lastInitial}.` : firstName
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
  const paidByLabel = isSpanish ? 'Pago:' : 'Paid:'
  const splitLabel = isSpanish ? 'Debe:' : 'Owes:'
  const nobodyLabel = isSpanish ? 'Nadie' : 'Nobody'
  const expenseCurrency = expense.originalCurrency
    ? getCurrency(expense.originalCurrency)
    : currency
  const expenseAmount = expense.originalAmount ?? expense.amount
  const paidByNameShort = formatShortParticipantName(expense.paidBy.name)
  const totalShares = expense.paidFor.reduce((sum, item) => sum + item.shares, 0)
  const debtors = (
    totalShares > 0
      ? expense.paidFor
          .filter((item) => item.participant.id !== expense.paidBy.id)
          .map((item) => ({
            name: formatShortParticipantName(item.participant.name),
            amount: Math.round((expenseAmount * item.shares) / totalShares),
          }))
      : []
  ).slice(0, 2)
  const hiddenDebtorsCount = Math.max(
    0,
    expense.paidFor.filter((item) => item.participant.id !== expense.paidBy.id)
      .length - debtors.length,
  )
  const settlementTo =
    expense.paidFor.length === 1
      ? expense.paidFor[0].participant.name
      : expense.paidFor.map((item) => item.participant.name).join(', ')
  const settlementLabel = isSpanish
    ? `${expense.paidBy.name} pagó a ${settlementTo}`
    : `${expense.paidBy.name} paid ${settlementTo}`

  return (
    <div
      key={expense.id}
      className={cn(
        'group flex justify-between mx-2 sm:mx-6 px-3 sm:px-4 py-2 sm:py-3 rounded-xl text-sm cursor-pointer gap-2 items-start border bg-card/60 border-border/70 hover:border-border hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-safe:transition-all motion-safe:duration-150',
        expense.isReimbursement &&
          'border-emerald-500/30 bg-emerald-500/[0.08] hover:bg-emerald-500/[0.12]',
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
      {expense.isReimbursement ? (
        <div className="mt-0.5 rounded-full p-1 bg-emerald-500/15 text-emerald-400 shrink-0">
          <ArrowRightLeft className="w-3.5 h-3.5" />
        </div>
      ) : (
        <CategoryIcon
          category={expense.category}
          className="w-3.5 h-3.5 mt-0.5 text-muted-foreground shrink-0"
        />
      )}
      <div className="flex-1 min-w-0">
        {expense.isReimbursement ? (
          <>
            <div className="text-sm font-semibold leading-tight text-emerald-300 truncate">
              {settlementLabel}
            </div>
          </>
        ) : (
          <>
            <div className="text-sm font-semibold leading-tight truncate">
              {expense.title}
            </div>
            <div className="text-[11px] text-muted-foreground leading-tight">
              <span>{paidByLabel}</span>{' '}
              <strong className="text-foreground">{paidByNameShort}</strong>{' '}
              <span className="tabular-nums">
                {formatCurrency(expenseCurrency, expenseAmount, locale)}
              </span>
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5 leading-tight">
              <span>{splitLabel}</span>{' '}
              {debtors.length > 0 ? (
                <span className="inline-flex flex-wrap gap-1 align-middle">
                  {debtors.map((debtor) => (
                    <span
                      key={`${expense.id}-${debtor.name}`}
                      className="inline-flex items-center rounded-full border bg-muted/60 px-1.5 py-0.5 text-[10px] tabular-nums"
                    >
                      <span className="font-medium">{debtor.name}:</span>
                      <span className="ml-1">
                        {formatCurrency(expenseCurrency, debtor.amount, locale)}
                      </span>
                    </span>
                  ))}
                  {hiddenDebtorsCount > 0 && (
                    <span className="inline-flex items-center rounded-full border bg-muted/50 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                      +{hiddenDebtorsCount}
                    </span>
                  )}
                </span>
              ) : (
                <span>{nobodyLabel}</span>
              )}
            </div>
          </>
        )}
      </div>
      <div className="flex flex-col justify-between items-end min-w-[92px] sm:min-w-[100px] gap-0.5">
        <div
          className={cn(
            'tabular-nums whitespace-nowrap text-[15px] sm:text-base leading-none',
            expense.isReimbursement
              ? 'font-semibold text-emerald-300'
              : 'font-bold',
          )}
        >
          {formatCurrency(expenseCurrency, expenseAmount, locale)}
        </div>
        {!expense.isReimbursement && (
          <div className="text-[11px] text-muted-foreground hidden sm:block">
            <DocumentsCount count={expense._count.documents} />
          </div>
        )}
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
