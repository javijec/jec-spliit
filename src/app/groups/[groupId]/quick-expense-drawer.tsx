'use client'

import {
  getDefaultSplittingOptions,
  prepareExpenseFormValuesForPersistence,
} from '@/app/groups/[groupId]/expenses/expense-defaults'
import { CategorySelector } from '@/components/category-selector'
import { CurrencySelector } from '@/components/currency-selector'
import { Button, ButtonProps } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import { Locale } from '@/i18n/request'
import { defaultCurrencyList } from '@/lib/currency'
import { ExpenseFormValues, expenseFormSchema } from '@/lib/schemas'
import { trpc } from '@/trpc/client'
import { AppRouterOutput } from '@/trpc/routers/_app'
import { SplitMode } from '@prisma/client'
import { ChevronDown, ExternalLink, Save, X } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useCurrentGroup } from './current-group-context'
import { invalidateCreatedExpenseData } from './expenses/expense-invalidation'

type Group = NonNullable<AppRouterOutput['groups']['get']['group']>
type PaidFor = ExpenseFormValues['paidFor']
type QuickDraft = {
  title: string
  amount: string
  payer: string
  category: number
  date: string
  currencyCode: string
  splitMode: SplitMode
  paidFor: PaidFor
  notes: string
}

type QuickExpenseContextValue = {
  open: () => void
  close: () => void
}

const QuickExpenseContext = createContext<QuickExpenseContextValue | null>(null)

export function QuickExpenseProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const value = useMemo(
    () => ({ open: () => setIsOpen(true), close: () => setIsOpen(false) }),
    [],
  )

  return (
    <QuickExpenseContext.Provider value={value}>
      {children}
      <QuickExpenseDrawer open={isOpen} onOpenChange={setIsOpen} />
    </QuickExpenseContext.Provider>
  )
}

export function useQuickExpense() {
  const context = useContext(QuickExpenseContext)
  if (!context) {
    throw new Error('useQuickExpense must be used inside QuickExpenseProvider')
  }
  return context
}

export function QuickExpenseTrigger({
  children,
  onClick,
  ...props
}: ButtonProps) {
  const { open } = useQuickExpense()
  return (
    <Button
      type="button"
      {...props}
      onClick={(event) => {
        onClick?.(event)
        if (!event.defaultPrevented) open()
      }}
    >
      {children}
    </Button>
  )
}

function todayInputValue() {
  const today = new Date()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${today.getFullYear()}-${month}-${day}`
}

function makeDraft(
  group: Group,
  currentActiveParticipantId: string | null,
): QuickDraft {
  const defaults = getDefaultSplittingOptions(group)
  return {
    title: '',
    amount: '',
    payer:
      currentActiveParticipantId &&
      group.participants.some(({ id }) => id === currentActiveParticipantId)
        ? currentActiveParticipantId
        : '',
    category: 0,
    date: todayInputValue(),
    currencyCode: group.currencyCode ?? '',
    splitMode: defaults.splitMode as SplitMode,
    paidFor: defaults.paidFor,
    notes: '',
  }
}

function dateFromInput(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day, 12)
}

function buildPaidFor(
  participantIds: string[],
  splitMode: SplitMode,
  amount: string,
): PaidFor {
  const count = participantIds.length || 1
  const amountNumber = Number(amount.replace(',', '.')) || 0
  return participantIds.map((participant) => ({
    participant,
    shares: (splitMode === 'BY_PERCENTAGE'
      ? 100 / count
      : splitMode === 'BY_AMOUNT'
        ? amountNumber / count
        : 1
    ).toString() as any,
  }))
}

function QuickExpenseDrawer({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { group, groupId, currentActiveParticipantId } = useCurrentGroup()
  const locale = useLocale() as Locale
  const t = useTranslations('QuickExpense')
  const { toast } = useToast()
  const utils = trpc.useUtils()
  const [draft, setDraft] = useState<QuickDraft | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const { data: categoriesData, isLoading: categoriesLoading } =
    trpc.categories.list.useQuery(undefined, {
      enabled: open,
      staleTime: 60 * 60 * 1000,
    })
  const categories = categoriesData?.categories ?? []

  useEffect(() => {
    if (group && !draft) setDraft(makeDraft(group, currentActiveParticipantId))
  }, [currentActiveParticipantId, draft, group])

  const resetDraft = () => {
    if (group) setDraft(makeDraft(group, currentActiveParticipantId))
    setFormError(null)
  }

  const createExpense = trpc.groups.expenses.create.useMutation({
    onSuccess: async () => {
      onOpenChange(false)
      resetDraft()
      toast({ title: t('expenseAdded') })
      await invalidateCreatedExpenseData(utils, groupId)
    },
    onError: (error) => {
      setFormError(error.message)
      toast({
        title: t('expenseError'),
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  if (!group || !draft) return null

  const updateDraft = <K extends keyof QuickDraft>(
    key: K,
    value: QuickDraft[K],
  ) => setDraft((current) => (current ? { ...current, [key]: value } : current))
  const participantIds = draft.paidFor.map(({ participant }) => participant)
  const currencies = defaultCurrencyList(locale, '')

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError(null)
    const normalizedAmount = draft.amount.trim().replace(',', '.')
    const parsed = expenseFormSchema.safeParse({
      title: draft.title.trim(),
      expenseDate: dateFromInput(draft.date),
      category: draft.category,
      amount: normalizedAmount,
      originalCurrency: draft.currencyCode,
      originalAmount: undefined,
      conversionRate: undefined,
      paidBy: draft.payer,
      paidFor: draft.paidFor,
      splitMode: draft.splitMode,
      saveDefaultSplittingOptions: false,
      isReimbursement: false,
      documents: [],
      notes: draft.notes,
      recurrenceRule: 'NONE',
    })
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? t('invalidForm'))
      return
    }
    createExpense.mutate({
      groupId,
      expenseFormValues: prepareExpenseFormValuesForPersistence(
        parsed.data,
        group,
        locale,
      ),
      participantId: currentActiveParticipantId ?? undefined,
    })
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[min(92dvh,48rem)]">
        <DrawerHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <DrawerTitle>{t('title')}</DrawerTitle>
              <DrawerDescription>{t('drawerDescription')}</DrawerDescription>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-10 w-10 shrink-0"
              onClick={() => onOpenChange(false)}
              aria-label={t('close')}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DrawerHeader>

        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 pb-4 sm:px-5">
            <div className="space-y-1.5">
              <label
                htmlFor="quick-expense-description"
                className="text-sm font-medium"
              >
                {t('descriptionLabel')}
              </label>
              <Input
                id="quick-expense-description"
                value={draft.title}
                onChange={(event) => updateDraft('title', event.target.value)}
                placeholder={t('descriptionPlaceholder')}
                autoFocus
                aria-invalid={!!formError && !draft.title}
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="quick-expense-amount"
                className="text-sm font-medium"
              >
                {t('amountLabel')}
              </label>
              <Input
                id="quick-expense-amount"
                value={draft.amount}
                onChange={(event) => updateDraft('amount', event.target.value)}
                placeholder={t('amountPlaceholder')}
                inputMode="decimal"
                aria-invalid={!!formError && !draft.amount}
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="quick-expense-payer"
                className="text-sm font-medium"
              >
                {t('paidByLabel')}
              </label>
              <select
                id="quick-expense-payer"
                value={draft.payer}
                onChange={(event) => updateDraft('payer', event.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-invalid={!!formError && !draft.payer}
              >
                <option value="">{t('paidByPlaceholder')}</option>
                {group.participants.map(({ id, name }) => (
                  <option key={id} value={id}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            <Collapsible className="rounded-lg border border-border/70 bg-muted/10 px-3 py-2">
              <CollapsibleTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-9 w-full justify-between px-1"
                >
                  {t('moreOptions')}
                  <ChevronDown className="h-4 w-4 transition-transform [[data-panel-open]_&]:rotate-180" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 pt-3">
                <div className="space-y-1.5">
                  <span className="text-sm font-medium">
                    {t('categoryLabel')}
                  </span>
                  {categories.length > 0 ? (
                    <CategorySelector
                      categories={categories}
                      defaultValue={draft.category}
                      isLoading={categoriesLoading}
                      onValueChange={(value) => updateDraft('category', value)}
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {t('categoryFallback')}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label
                    htmlFor="quick-expense-date"
                    className="text-sm font-medium"
                  >
                    {t('dateLabel')}
                  </label>
                  <Input
                    id="quick-expense-date"
                    type="date"
                    value={draft.date}
                    onChange={(event) =>
                      updateDraft('date', event.target.value)
                    }
                  />
                </div>
                {group.currencyCode && (
                  <div className="space-y-1.5">
                    <span className="text-sm font-medium">
                      {t('currencyLabel')}
                    </span>
                    <CurrencySelector
                      currencies={currencies}
                      defaultValue={draft.currencyCode}
                      isLoading={false}
                      onValueChange={(value) =>
                        updateDraft('currencyCode', value)
                      }
                    />
                  </div>
                )}
                <div className="space-y-1.5">
                  <label
                    htmlFor="quick-expense-split"
                    className="text-sm font-medium"
                  >
                    {t('splitLabel')}
                  </label>
                  <select
                    id="quick-expense-split"
                    value={draft.splitMode}
                    onChange={(event) => {
                      const splitMode = event.target.value as SplitMode
                      updateDraft('splitMode', splitMode)
                      updateDraft(
                        'paidFor',
                        buildPaidFor(participantIds, splitMode, draft.amount),
                      )
                    }}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="EVENLY">{t('splitEvenly')}</option>
                    <option value="BY_SHARES">{t('splitByShares')}</option>
                    <option value="BY_PERCENTAGE">
                      {t('splitByPercentage')}
                    </option>
                    <option value="BY_AMOUNT">{t('splitByAmount')}</option>
                  </select>
                </div>
                <fieldset className="space-y-2">
                  <legend className="text-sm font-medium">
                    {t('participantsLabel')}
                  </legend>
                  {group.participants.map(({ id, name }) => {
                    const checked = participantIds.includes(id)
                    return (
                      <label
                        key={id}
                        className="flex min-h-10 items-center gap-2 text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            const nextIds = checked
                              ? participantIds.filter((value) => value !== id)
                              : [...participantIds, id]
                            updateDraft(
                              'paidFor',
                              buildPaidFor(
                                nextIds,
                                draft.splitMode,
                                draft.amount,
                              ),
                            )
                          }}
                          className="h-4 w-4 rounded border-input accent-primary"
                        />
                        {name}
                      </label>
                    )
                  })}
                </fieldset>
                <div className="space-y-1.5">
                  <label
                    htmlFor="quick-expense-notes"
                    className="text-sm font-medium"
                  >
                    {t('notesLabel')}
                  </label>
                  <textarea
                    id="quick-expense-notes"
                    value={draft.notes}
                    onChange={(event) =>
                      updateDraft('notes', event.target.value)
                    }
                    className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>

            {formError && (
              <p role="alert" className="text-sm text-destructive">
                {formError}
              </p>
            )}
          </div>

          <DrawerFooter className="border-t border-border/70 bg-background/95">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <Button
                type="button"
                variant="link"
                className="justify-start px-0 sm:order-first"
                asChild
              >
                <Link
                  href={`/groups/${groupId}/expenses/create`}
                  onClick={() => onOpenChange(false)}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  {t('fullForm')}
                </Link>
              </Button>
              <Button
                type="submit"
                disabled={createExpense.isPending}
                aria-busy={createExpense.isPending}
              >
                <Save className="mr-2 h-4 w-4" />
                {createExpense.isPending ? t('saving') : t('save')}
              </Button>
            </div>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  )
}
