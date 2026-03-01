'use client'
import { ActiveUserBalance } from '@/app/groups/[groupId]/expenses/active-user-balance'
import { CategoryIcon } from '@/app/groups/[groupId]/expenses/category-icon'
import { DocumentsCount } from '@/app/groups/[groupId]/expenses/documents-count'
import { Button } from '@/components/ui/button'
import { getGroupExpenses } from '@/lib/api'
import { Currency } from '@/lib/currency'
import { cn, formatCurrency, formatDateOnly } from '@/lib/utils'
import { ChevronRight } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Fragment } from 'react'

type Expense = Awaited<ReturnType<typeof getGroupExpenses>>[number]

function Participants({
  expense,
  participantCount,
}: {
  expense: Expense
  participantCount: number
}) {
  const t = useTranslations('ExpenseCard')
  const key = expense.amount > 0 ? 'paidBy' : 'receivedBy'
  const paidFor =
    expense.paidFor.length == participantCount && participantCount >= 4 ? (
      <strong>{t('everyone')}</strong>
    ) : (
      expense.paidFor.map((paidFor, index) => (
        <Fragment key={index}>
          {index !== 0 && <>, </>}
          <strong>{paidFor.participant.name}</strong>
        </Fragment>
      ))
    )

  const participants = t.rich(key, {
    strong: (chunks) => <strong>{chunks}</strong>,
    paidBy: expense.paidBy.name,
    paidFor: () => paidFor,
    forCount: expense.paidFor.length,
  })
  return <>{participants}</>
}

type Props = {
  expense: Expense
  currency: Currency
  groupId: string
  participantCount: number
}

export function ExpenseCard({
  expense,
  currency,
  groupId,
  participantCount,
}: Props) {
  const router = useRouter()
  const locale = useLocale()

  return (
    <div
      key={expense.id}
      className={cn(
        'group flex justify-between mx-2 sm:mx-6 px-3 sm:px-4 py-3.5 sm:py-4 rounded-lg text-sm cursor-pointer gap-2 sm:gap-1 items-start sm:items-stretch border border-transparent hover:border-border hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-safe:transition-all motion-safe:duration-150',
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
        className="w-4 h-4 mt-1 text-muted-foreground shrink-0"
      />
      <div className="flex-1 min-w-0">
        <div
          className={cn(
            'mb-1 text-[15px] sm:text-sm font-medium leading-snug break-words',
            expense.isReimbursement && 'italic',
          )}
        >
          {expense.title}
        </div>
        <div className="text-xs text-muted-foreground leading-snug">
          <Participants expense={expense} participantCount={participantCount} />
        </div>
        <div className="text-xs text-muted-foreground mt-0.5 leading-snug">
          <ActiveUserBalance {...{ groupId, currency, expense }} />
        </div>
        <div className="sm:hidden text-[11px] text-muted-foreground mt-1.5">
          <DocumentsCount count={expense._count.documents} />
        </div>
      </div>
      <div className="flex flex-col justify-between items-end min-w-[92px] sm:min-w-[100px] gap-1">
        <div
          className={cn(
            'tabular-nums whitespace-nowrap text-[15px] sm:text-base leading-none',
            expense.isReimbursement ? 'italic' : 'font-bold',
          )}
        >
          {formatCurrency(currency, expense.amount, locale)}
        </div>
        <div className="text-xs text-muted-foreground hidden sm:block">
          <DocumentsCount count={expense._count.documents} />
        </div>
        <div className="text-[11px] sm:text-xs text-muted-foreground whitespace-nowrap">
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
