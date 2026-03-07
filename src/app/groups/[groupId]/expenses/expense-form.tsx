import { CurrencySelector } from '@/components/currency-selector'
import { ExpenseDocumentsInput } from '@/components/expense-documents-input'
import { SubmitButton } from '@/components/submit-button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Locale } from '@/i18n/request'
import { randomId } from '@/lib/api'
import { defaultCurrencyList, getCurrency } from '@/lib/currency'
import { RuntimeFeatureFlags } from '@/lib/featureFlags'
import { useActiveUser, useMediaQuery } from '@/lib/hooks'
import {
  ExpenseFormValues,
  SplittingOptions,
  expenseFormSchema,
} from '@/lib/schemas'
import { calculateShare } from '@/lib/totals'
import {
  amountAsDecimal,
  amountAsMinorUnits,
  cn,
  formatCurrency,
  getCurrencyFromGroup,
} from '@/lib/utils'
import { AppRouterOutput } from '@/trpc/routers/_app'
import { zodResolver } from '@hookform/resolvers/zod'
import { RecurrenceRule } from '@prisma/client'
import { AlertTriangle, ChevronRight, Save } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { match } from 'ts-pattern'
import { DeletePopup } from '../../../../components/delete-popup'

const enforceCurrencyPattern = (value: string) =>
  value
    .replace(/^\s*-/, '_') // replace leading minus with _
    .replace(/[.,]/, '#') // replace first comma with #
    .replace(/[-.,]/g, '') // remove other minus and commas characters
    .replace(/_/, '-') // change back _ to minus
    .replace(/#/, '.') // change back # to dot
    .replace(/[^-\d.]/g, '') // remove all non-numeric characters

function SectionIntro({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string
  title: string
  description: string
}) {
  return (
    <div className="mb-4 space-y-1">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {eyebrow}
      </p>
      <h2 className="text-lg font-semibold leading-none">{title}</h2>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  )
}

type FlowStepId = 'details' | 'split' | 'attachments'

const getDefaultSplittingOptions = (
  group: NonNullable<AppRouterOutput['groups']['get']['group']>,
) => {
  const defaultValue = {
    splitMode: 'EVENLY' as const,
    paidFor: group.participants.map(({ id }) => ({
      participant: id,
      shares: '1' as any, // Use string to ensure consistent schema handling
    })),
  }

  if (typeof localStorage === 'undefined') return defaultValue
  const defaultSplitMode = localStorage.getItem(
    `${group.id}-defaultSplittingOptions`,
  )
  if (defaultSplitMode === null) return defaultValue
  const parsedDefaultSplitMode = JSON.parse(
    defaultSplitMode,
  ) as SplittingOptions

  if (parsedDefaultSplitMode.paidFor === null) {
    parsedDefaultSplitMode.paidFor = defaultValue.paidFor
  }

  // if there is a participant in the default options that does not exist anymore,
  // remove the stale default splitting options
  for (const parsedPaidFor of parsedDefaultSplitMode.paidFor) {
    if (
      !group.participants.some(({ id }) => id === parsedPaidFor.participant)
    ) {
      localStorage.removeItem(`${group.id}-defaultSplittingOptions`)
      return defaultValue
    }
  }

  return {
    splitMode: parsedDefaultSplitMode.splitMode,
    paidFor: parsedDefaultSplitMode.paidFor.map((paidFor) => ({
      participant: paidFor.participant,
      shares: (paidFor.shares / 100).toString() as any, // Convert to string for consistent schema handling
    })),
  }
}

async function persistDefaultSplittingOptions(
  groupId: string,
  expenseFormValues: ExpenseFormValues,
) {
  if (localStorage && expenseFormValues.saveDefaultSplittingOptions) {
    const computePaidFor = (): SplittingOptions['paidFor'] => {
      if (expenseFormValues.splitMode === 'EVENLY') {
        return expenseFormValues.paidFor.map(({ participant }) => ({
          participant,
          shares: 100,
        }))
      } else if (expenseFormValues.splitMode === 'BY_AMOUNT') {
        return null
      } else {
        return expenseFormValues.paidFor
      }
    }

    const splittingOptions = {
      splitMode: expenseFormValues.splitMode,
      paidFor: computePaidFor(),
    } satisfies SplittingOptions

    localStorage.setItem(
      `${groupId}-defaultSplittingOptions`,
      JSON.stringify(splittingOptions),
    )
  }
}

export function ExpenseForm({
  group,
  categories,
  expense,
  onSubmit,
  onDelete,
  runtimeFeatureFlags,
}: {
  group: NonNullable<AppRouterOutput['groups']['get']['group']>
  categories: AppRouterOutput['categories']['list']['categories']
  expense?: AppRouterOutput['groups']['expenses']['get']['expense']
  onSubmit: (value: ExpenseFormValues, participantId?: string) => Promise<void>
  onDelete?: (participantId?: string) => Promise<void>
  runtimeFeatureFlags: RuntimeFeatureFlags
}) {
  const t = useTranslations('ExpenseForm')
  const locale = useLocale() as Locale
  const isCreate = expense === undefined
  const searchParams = useSearchParams()

  const getSelectedPayer = (field?: { value: string }) => {
    if (isCreate && typeof window !== 'undefined') {
      const activeUser = localStorage.getItem(`${group.id}-activeUser`)
      if (activeUser && activeUser !== 'None' && field?.value === undefined) {
        return activeUser
      }
    }
    return field?.value
  }

  const defaultSplittingOptions = getDefaultSplittingOptions(group)
  const groupCurrency = getCurrencyFromGroup(group)
  const resolveExpenseCurrency = (currencyCode?: string | null) => {
    if (
      group.currencyCode &&
      group.currencyCode.length &&
      currencyCode &&
      currencyCode.length &&
      currencyCode !== group.currencyCode
    ) {
      return getCurrency(currencyCode, locale, 'Custom')
    }
    return groupCurrency
  }
  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: expense
      ? {
          title: expense.title,
          expenseDate: expense.expenseDate ?? new Date(),
          amount: amountAsDecimal(
            expense.originalAmount ?? expense.amount,
            resolveExpenseCurrency(
              expense.originalCurrency ?? group.currencyCode,
            ),
          ),
          originalCurrency: expense.originalCurrency ?? group.currencyCode,
          originalAmount: expense.originalAmount ?? undefined,
          conversionRate: undefined,
          category: expense.categoryId,
          paidBy: expense.paidById,
          paidFor: expense.paidFor.map(({ participantId, shares }) => ({
            participant: participantId,
            shares: (expense.splitMode === 'BY_AMOUNT'
              ? amountAsDecimal(
                  shares,
                  resolveExpenseCurrency(
                    expense.originalCurrency ?? group.currencyCode,
                  ),
                )
              : (shares / 100).toString()) as any, // Convert to string to ensure consistent handling
          })),
          splitMode: expense.splitMode,
          saveDefaultSplittingOptions: false,
          isReimbursement: expense.isReimbursement,
          documents: expense.documents,
          notes: expense.notes ?? '',
          recurrenceRule: expense.recurrenceRule ?? undefined,
        }
      : {
            title: searchParams.get('title') ?? '',
            expenseDate: searchParams.get('date')
              ? new Date(searchParams.get('date') as string)
              : new Date(),
            amount: Number(searchParams.get('amount')) || 0,
            originalCurrency: group.currencyCode ?? undefined,
            originalAmount: undefined,
            conversionRate: undefined,
            category: searchParams.get('categoryId')
              ? Number(searchParams.get('categoryId'))
              : 0, // category with Id 0 is General
            // paid for all, split evenly
            paidFor: defaultSplittingOptions.paidFor,
            paidBy: getSelectedPayer(),
            isReimbursement: false,
            splitMode: defaultSplittingOptions.splitMode,
            saveDefaultSplittingOptions: false,
            documents: searchParams.get('imageUrl')
              ? [
                  {
                    id: randomId(),
                    url: searchParams.get('imageUrl') as string,
                    width: Number(searchParams.get('imageWidth')),
                    height: Number(searchParams.get('imageHeight')),
                  },
                ]
              : [],
            notes: '',
            recurrenceRule: RecurrenceRule.NONE,
          },
  })
  const activeUserId = useActiveUser(group.id)
  const isDesktopLayout = useMediaQuery('(min-width: 640px)')
  const watchedPaidBy = useWatch({ control: form.control, name: 'paidBy' })
  const watchedPaidFor = useWatch({ control: form.control, name: 'paidFor' })
  const watchedAmount = useWatch({ control: form.control, name: 'amount' })
  const watchedSplitMode = useWatch({
    control: form.control,
    name: 'splitMode',
  })
  const watchedOriginalAmount = useWatch({
    control: form.control,
    name: 'originalAmount',
  })
  const watchedExpenseDate = useWatch({
    control: form.control,
    name: 'expenseDate',
  })
  const watchedIsReimbursement = useWatch({
    control: form.control,
    name: 'isReimbursement',
  })

  const submit = async (values: ExpenseFormValues) => {
    values.isReimbursement = false
    values.recurrenceRule = RecurrenceRule.NONE
    await persistDefaultSplittingOptions(group.id, values)
    const valuesCurrency = resolveExpenseCurrency(values.originalCurrency)
    const valuesUseOriginalCurrency =
      group.currencyCode &&
      group.currencyCode.length &&
      values.originalCurrency &&
      values.originalCurrency.length &&
      values.originalCurrency !== group.currencyCode

    // Store monetary amounts in minor units (cents)
    values.amount = amountAsMinorUnits(values.amount, valuesCurrency)
    values.paidFor = values.paidFor.map(({ participant, shares }) => ({
      participant,
      shares:
        values.splitMode === 'BY_AMOUNT'
          ? amountAsMinorUnits(shares, valuesCurrency)
          : shares,
    }))

    // If it is the group currency, do not persist original currency fields.
    if (!valuesUseOriginalCurrency) {
      delete values.originalAmount
      delete values.originalCurrency
    } else {
      // No currency conversion: keep the original amount as entered.
      values.originalAmount = values.originalAmount ?? values.amount
      values.conversionRate = undefined
    }
    return onSubmit(values, activeUserId ?? undefined)
  }

  const [isIncome, setIsIncome] = useState(Number(form.getValues().amount) < 0)
  const [manuallyEditedParticipants, setManuallyEditedParticipants] = useState<
    Set<string>
  >(new Set())

  const sExpense = isIncome ? 'Income' : 'Expense'

  const originalCurrency = getCurrency(
    form.getValues('originalCurrency'),
    locale,
    'Custom',
  )
  const conversionRequired =
    group.currencyCode &&
    group.currencyCode.length &&
    originalCurrency.code.length &&
    originalCurrency.code !== group.currencyCode
  const expenseCurrency = conversionRequired ? originalCurrency : groupCurrency
  const originalAmountTouched = form.getFieldState('originalAmount').isTouched
  const selectedPayerName =
    group.participants.find(({ id }) => id === watchedPaidBy)?.name ??
    t('mobile.unassignedPayer')
  const selectedParticipantsCount = watchedPaidFor?.length ?? 0
  const enteredAmount = Number(watchedAmount) || 0

  useEffect(() => {
    setManuallyEditedParticipants(new Set())
  }, [watchedSplitMode, watchedAmount])

  useEffect(() => {
    const splitMode = form.getValues().splitMode

    // Only auto-balance for split mode 'Unevenly - By amount'
    if (
      splitMode === 'BY_AMOUNT' &&
      (form.getFieldState('paidFor').isDirty ||
        form.getFieldState('amount').isDirty)
    ) {
      const totalAmount = Number(form.getValues().amount) || 0
      const paidFor = form.getValues().paidFor
      let newPaidFor = [...paidFor]

      const editedParticipants = Array.from(manuallyEditedParticipants)
      let remainingAmount = totalAmount
      let remainingParticipants = newPaidFor.length - editedParticipants.length

      newPaidFor = newPaidFor.map((participant) => {
        if (editedParticipants.includes(participant.participant)) {
          const participantShare = Number(participant.shares) || 0
          if (splitMode === 'BY_AMOUNT') {
            remainingAmount -= participantShare
          }
          return participant
        }
        return participant
      })

      if (remainingParticipants > 0) {
        let amountPerRemaining = 0
        if (splitMode === 'BY_AMOUNT') {
          amountPerRemaining = remainingAmount / remainingParticipants
        }

        newPaidFor = newPaidFor.map((participant) => {
          if (!editedParticipants.includes(participant.participant)) {
            return {
              ...participant,
              shares: amountPerRemaining.toFixed(
                expenseCurrency.decimal_digits,
              ) as any, // Keep as string for consistent schema handling
            }
          }
          return participant
        })
      }
      form.setValue('paidFor', newPaidFor, { shouldValidate: true })
    }
  }, [
    expenseCurrency.decimal_digits,
    form,
    manuallyEditedParticipants,
    watchedAmount,
    watchedSplitMode,
  ])

  useEffect(() => {
    if (!originalAmountTouched) return
    const originalAmount = form.getValues('originalAmount') ?? 0
    if (conversionRequired && originalAmount) {
      const v = enforceCurrencyPattern(String(originalAmount))
      const income = Number(v) < 0
      setIsIncome(income)
      form.setValue('amount', Number(v))
    }
  }, [
    form,
    conversionRequired,
    originalAmountTouched,
    watchedOriginalAmount,
  ])

  const countErrors = (value: unknown): number => {
    if (!value || typeof value !== 'object') return 0
    if (Array.isArray(value)) {
      return value.reduce<number>((sum, item) => sum + countErrors(item), 0)
    }
    const record = value as Record<string, unknown>
    if ('message' in record && typeof record.message === 'string') return 1
    return Object.values(record).reduce<number>(
      (sum, item) => sum + countErrors(item),
      0,
    )
  }

  const collectErrorPaths = (value: unknown, currentPath = ''): string[] => {
    if (!value || typeof value !== 'object') return []
    if (Array.isArray(value)) {
      return value.flatMap((item, index) =>
        collectErrorPaths(item, `${currentPath}.${index}`),
      )
    }
    const record = value as Record<string, unknown>
    const hasMessage = 'message' in record && typeof record.message === 'string'
    const nestedPaths = Object.entries(record).flatMap(([key, item]) =>
      key === 'message'
        ? []
        : collectErrorPaths(item, currentPath ? `${currentPath}.${key}` : key),
    )
    return hasMessage && currentPath
      ? [currentPath, ...nestedPaths]
      : nestedPaths
  }

  const focusFirstInvalidField = () => {
    const firstInvalid = document.querySelector<HTMLElement>(
      '[aria-invalid="true"]',
    )
    if (!firstInvalid) return
    firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' })
    firstInvalid.focus()
  }

  const errorCount = countErrors(form.formState.errors)
  const errorPaths = collectErrorPaths(form.formState.errors)
  const normalizedErrorPaths = Array.from(
    new Set(
      errorPaths.map((path) =>
        path.replace(/\.\d+(\.|$)/g, '[].$1').replace(/\.$/, ''),
      ),
    ),
  )
  const labelByPath: Record<string, string> = {
    title: t(`${sExpense}.TitleField.label`),
    expenseDate: t(`${sExpense}.DateField.label`),
    category: t('categoryField.label'),
    originalCurrency: t(`${sExpense}.currencyField.label`),
    originalAmount: t('originalAmountField.label'),
    amount: t('amountField.label'),
    conversionRate: t('conversionRateField.label'),
    paidBy: t(`${sExpense}.paidByField.label`),
    paidFor: t(`${sExpense}.paidFor.title`),
    'paidFor[].shares': t(`${sExpense}.paidFor.title`),
    recurrenceRule: t(`${sExpense}.recurrenceRule.label`),
    notes: t('notesField.label'),
  }
  const invalidFieldLabels = normalizedErrorPaths
    .map((path) => labelByPath[path])
    .filter(Boolean)
  const uniqueInvalidFieldLabels = Array.from(new Set(invalidFieldLabels))
  const topInvalidFields = uniqueInvalidFieldLabels.slice(0, 5)
  const selectedParticipantIds = new Set(
    (watchedPaidFor ?? []).map(({ participant }) => participant),
  )
  const activeSplitModeLabel = t(
    `SplitModeField.${match(watchedSplitMode)
      .with('EVENLY', () => 'evenly')
      .with('BY_SHARES', () => 'byShares')
      .with('BY_PERCENTAGE', () => 'byPercentage')
      .otherwise(() => 'byAmount')}`,
  )
  const flowSteps = useMemo<Array<{ id: FlowStepId; label: string }>>(
    () => [
      { id: 'details', label: t('mobile.detailsStep') },
      { id: 'split', label: t('mobile.splitStep') },
      ...(runtimeFeatureFlags.enableExpenseDocuments
        ? [{ id: 'attachments' as const, label: t('mobile.attachmentsStep') }]
        : []),
    ],
    [runtimeFeatureFlags.enableExpenseDocuments, t],
  )
  const [currentStep, setCurrentStep] = useState<FlowStepId>('details')
  const currentStepIndex = flowSteps.findIndex((step) => step.id === currentStep)
  const isLastStep = currentStepIndex === flowSteps.length - 1
  const isFirstStep = currentStepIndex <= 0

  useEffect(() => {
    if (!flowSteps.some((step) => step.id === currentStep)) {
      setCurrentStep(flowSteps[flowSteps.length - 1].id)
    }
  }, [currentStep, flowSteps])

  const goToStep = (stepId: FlowStepId) => {
    setCurrentStep(stepId)
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const validateCurrentStep = async () => {
    switch (currentStep) {
      case 'details':
        return form.trigger([
          'title',
          'expenseDate',
          'originalCurrency',
          'amount',
          'paidBy',
        ])
      case 'split':
        return form.trigger(['paidFor', 'splitMode'])
      case 'attachments':
        return true
    }
  }

  const handleAdvanceStep = async () => {
    const isValid = await validateCurrentStep()
    if (!isValid) {
      focusFirstInvalidField()
      return
    }
    if (!isLastStep) {
      goToStep(flowSteps[currentStepIndex + 1].id)
    }
  }

  const shouldShowStep = (stepId: FlowStepId) =>
    isDesktopLayout || currentStep === stepId
  const updateSelectedParticipants = (
    nextPaidFor: ExpenseFormValues['paidFor'],
    options = {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    },
  ) => {
    form.setValue('paidFor', nextPaidFor as any, options)
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(submit, () => {
          focusFirstInvalidField()
        })}
      >
        {form.formState.submitCount > 0 && errorCount > 0 && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Revisa el formulario</AlertTitle>
            <AlertDescription>
              Hay {errorCount} campo(s) con errores. Te llevamos al primero.
              {topInvalidFields.length > 0 && (
                <>
                  {' '}
                  Campos: {topInvalidFields.join(', ')}
                  {uniqueInvalidFieldLabels.length > topInvalidFields.length &&
                    ', ...'}
                  .
                </>
              )}
            </AlertDescription>
          </Alert>
        )}
        <div className="mb-4 rounded-2xl border bg-card/60 p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              {isIncome ? 'Ingreso' : 'Gasto'}
            </span>
            <span className="inline-flex rounded-full border px-2.5 py-1 text-[11px] text-muted-foreground">
              {formatDateForDisplay(watchedExpenseDate)}
            </span>
          </div>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">{t('mobile.currentAmount')}</p>
              <p className="text-2xl font-semibold leading-none">
                {expenseCurrency.symbol || group.currency}
                {enteredAmount || 0}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span className="rounded-full bg-muted px-2.5 py-1">
                {t('mobile.payer')}: {selectedPayerName}
              </span>
              <span className="rounded-full bg-muted px-2.5 py-1">
                {t('mobile.participantsCount', {
                  count: selectedParticipantsCount,
                })}
              </span>
            </div>
          </div>
        </div>
        {!isDesktopLayout && (
          <div className="mb-4 rounded-2xl border bg-card/60 p-3 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-sm font-medium">
                {t('mobile.stepCounter', {
                  current: currentStepIndex + 1,
                  total: flowSteps.length,
                })}
              </p>
              <p className="text-xs text-muted-foreground">
                {flowSteps[currentStepIndex]?.label}
              </p>
            </div>
            <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${flowSteps.length}, minmax(0, 1fr))` }}>
              {flowSteps.map((step, index) => {
                const isActive = step.id === currentStep
                const isPast = index < currentStepIndex
                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => goToStep(step.id)}
                    className={cn(
                      'rounded-xl border px-3 py-2 text-left transition-colors',
                      isActive
                        ? 'border-primary bg-primary/10'
                        : isPast
                          ? 'border-primary/20 bg-primary/5'
                          : 'border-border bg-background',
                    )}
                  >
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      {index + 1}
                    </p>
                    <p className="mt-1 text-sm font-medium leading-tight">
                      {step.label}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>
        )}
        {shouldShowStep('details') && (
        <Card className="overflow-hidden">
          <CardHeader className="p-4 sm:p-6 border-b">
            <SectionIntro
              eyebrow={t('mobile.step1')}
              title={t(`${sExpense}.${isCreate ? 'create' : 'edit'}`)}
              description={t('mobile.step1Description')}
            />
          </CardHeader>
          <CardContent className="grid sm:grid-cols-2 gap-6 p-4 sm:p-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>{t(`${sExpense}.TitleField.label`)}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t(`${sExpense}.TitleField.placeholder`)}
                      className="text-base"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {t(`${sExpense}.TitleField.description`)}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="expenseDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t(`${sExpense}.DateField.label`)}</FormLabel>
                    <FormControl>
                      <Input
                        className="text-base"
                        type="date"
                        value={formatDateInputValue(field.value ?? new Date())}
                        onChange={(event) => {
                          const nextDate = parseDateFromInput(event.target.value)
                          if (nextDate) field.onChange(nextDate)
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      {t(`${sExpense}.DateField.description`)}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                name="originalCurrency"
                render={({ field: { onChange, ...field } }) => (
                  <FormItem>
                    <FormLabel>{t(`${sExpense}.currencyField.label`)}</FormLabel>
                    <FormControl>
                      {group.currencyCode ? (
                        <CurrencySelector
                          currencies={defaultCurrencyList(locale, '')}
                          defaultValue={field.value ?? ''}
                          isLoading={false}
                          onValueChange={(v) => onChange(v)}
                        />
                      ) : (
                        <Input
                          className="text-base"
                          disabled={true}
                          {...field}
                          placeholder={group.currency}
                        />
                      )}
                    </FormControl>
                    <FormDescription>
                      {t(`${sExpense}.currencyField.description`)}{' '}
                      {!group.currencyCode && t('conversionUnavailable')}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="amount"
              render={({ field: { onChange, ...field } }) => (
                <FormItem className="sm:order-5">
                  <FormLabel>{t('amountField.label')}</FormLabel>
                  <div className="flex items-baseline gap-2">
                    <span>{expenseCurrency.symbol || group.currency}</span>
                    <FormControl>
                      <Input
                        className="text-base max-w-[120px]"
                        type="text"
                        inputMode="decimal"
                        placeholder="0.00"
                          onChange={(event) => {
                            const v = enforceCurrencyPattern(event.target.value)
                            const income = Number(v) < 0
                            setIsIncome(income)
                            onChange(v)
                          }}
                        onFocus={(e) => {
                          // we're adding a small delay to get around safaris issue with onMouseUp deselecting things again
                          const target = e.currentTarget
                          setTimeout(() => target.select(), 1)
                        }}
                        {...field}
                      />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="paidBy"
              render={({ field }) => (
                <FormItem className="sm:order-5">
                  <FormLabel>{t(`${sExpense}.paidByField.label`)}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={getSelectedPayer(field)}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={t(`${sExpense}.paidByField.placeholder`)}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {group.participants.map(({ id, name }) => (
                        <SelectItem key={id} value={id}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {t(`${sExpense}.paidByField.description`)}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>
        )}

        {shouldShowStep('split') && (
        <Card className="mt-4 overflow-hidden">
          <CardHeader className="p-4 sm:p-6 border-b">
            <SectionIntro
              eyebrow={t('mobile.step2')}
              title={t(`${sExpense}.paidFor.title`)}
              description={t(`${sExpense}.paidFor.description`)}
            />
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="sticky top-[4.5rem] z-10 -mx-4 mb-4 border-b bg-background/95 px-4 pb-4 pt-1 backdrop-blur sm:static sm:mx-0 sm:border-b-0 sm:bg-transparent sm:px-0 sm:pb-0 sm:pt-0">
              <div className="mb-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span className="rounded-full bg-muted px-2.5 py-1">
                {t('mobile.selectedCount', { count: selectedParticipantsCount })}
                </span>
                <span className="rounded-full bg-muted px-2.5 py-1">
                  {t('mobile.splitMode', {
                    mode: activeSplitModeLabel,
                  })}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    updateSelectedParticipants(
                      group.participants.map(({ id }) => ({
                        participant: id,
                        shares: '1' as any,
                      })),
                    )
                  }
                >
                  {t('selectAll')}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => updateSelectedParticipants([])}
                >
                  {t('selectNone')}
                </Button>
              </div>
            </div>
            <FormField
              control={form.control}
              name="paidFor"
              render={() => (
                <FormItem className="sm:order-4 row-span-2 space-y-0">
                  {group.participants.map(({ id, name }) => (
                    <FormField
                      key={id}
                      control={form.control}
                      name="paidFor"
                      render={({ field }) => {
                        const isSelected = selectedParticipantIds.has(id)

                        return (
                          <div
                            data-id={`${id}/${watchedSplitMode}/${
                              expenseCurrency.code || expenseCurrency.symbol
                            }`}
                            className={cn(
                              '-mx-2 mb-2 rounded-xl border px-3 py-3 transition-colors sm:-mx-0',
                              isSelected
                                ? 'border-primary/30 bg-primary/5'
                                : 'border-border/70 bg-card/40',
                            )}
                          >
                            <FormItem className="flex w-full flex-col gap-3 sm:flex-row sm:items-start sm:space-x-3 sm:space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={(checked) => {
                                    const options = {
                                      shouldDirty: true,
                                      shouldTouch: true,
                                      shouldValidate: true,
                                    }
                                    checked
                                      ? form.setValue(
                                          'paidFor',
                                          [
                                            ...field.value,
                                            {
                                              participant: id,
                                              shares: '1', // Use string to ensure consistent schema handling
                                            },
                                          ] as any,
                                          options,
                                        )
                                      : form.setValue(
                                          'paidFor',
                                          field.value?.filter(
                                            (value) => value.participant !== id,
                                          ),
                                          options,
                                        )
                                  }}
                                />
                              </FormControl>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-2">
                                  <FormLabel className="flex-1 text-sm font-medium">
                                    {name}
                                  </FormLabel>
                                  <span
                                    className={cn(
                                      'rounded-full px-2 py-0.5 text-[11px]',
                                      isSelected
                                        ? 'bg-primary/10 text-primary'
                                        : 'bg-muted text-muted-foreground',
                                    )}
                                  >
                                    {isSelected ? t('mobile.included') : t('mobile.excluded')}
                                  </span>
                                </div>
                                {isSelected &&
                                  !watchedIsReimbursement && (
                                    <p className="mt-1 text-xs text-muted-foreground">
                                      {t('mobile.estimatedShare')}{' '}
                                      {formatCurrency(
                                        expenseCurrency,
                                        calculateShare(id, {
                                          amount: amountAsMinorUnits(
                                            Number(watchedAmount),
                                            expenseCurrency,
                                          ), // Convert to cents
                                          paidFor: field.value.map(
                                            ({ participant, shares }) => ({
                                              participant: {
                                                id: participant,
                                                name: '',
                                                groupId: '',
                                              },
                                              shares:
                                                watchedSplitMode ===
                                                'BY_PERCENTAGE'
                                                  ? Number(shares) * 100 // Convert percentage to basis points (e.g., 50% -> 5000)
                                                  : watchedSplitMode ===
                                                      'BY_AMOUNT'
                                                    ? amountAsMinorUnits(
                                                        shares,
                                                        expenseCurrency,
                                                      )
                                                    : shares,
                                              expenseId: '',
                                              participantId: '',
                                            }),
                                          ),
                                          splitMode: watchedSplitMode,
                                          isReimbursement: watchedIsReimbursement,
                                        }),
                                        locale,
                                      )}
                                    </p>
                                  )}
                              </div>
                            </FormItem>
                            {isSelected && watchedSplitMode !== 'EVENLY' && (
                              <div className="mt-3 rounded-xl border bg-background/80 p-3">
                                <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                                  {activeSplitModeLabel}
                                </p>
                                <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
                              {watchedSplitMode === 'BY_AMOUNT' &&
                                !!conversionRequired && (
                                  <FormField
                                    name={`paidFor[${field.value.findIndex(
                                      ({ participant }) => participant === id,
                                    )}].originalAmount`}
                                    render={() => {
                                      const sharesLabel = (
                                        <span
                                          className={cn('text-sm', {
                                            'text-muted': !field.value?.some(
                                              ({ participant }) =>
                                                participant === id,
                                            ),
                                          })}
                                        >
                                          {originalCurrency.symbol}
                                        </span>
                                      )
                                      return (
                                        <div>
                                          <div className="flex items-center gap-1">
                                            {sharesLabel}
                                            <FormControl>
                                              <Input
                                                key={String(
                                                  !field.value?.some(
                                                    ({ participant }) =>
                                                      participant === id,
                                                  ),
                                                )}
                                                className="text-base w-[80px] -my-2"
                                                type="text"
                                                inputMode="decimal"
                                                disabled={
                                                  !field.value?.some(
                                                    ({ participant }) =>
                                                      participant === id,
                                                  )
                                                }
                                                value={
                                                  field.value.find(
                                                    ({ participant }) =>
                                                      participant === id,
                                                  )?.originalAmount ?? ''
                                                }
                                                onChange={(event) => {
                                                  const originalAmount =
                                                    enforceCurrencyPattern(
                                                      event.target.value,
                                                    )
                                                  field.onChange(
                                                    field.value.map((p) =>
                                                      p.participant === id
                                                        ? {
                                                            participant: id,
                                                            originalAmount,
                                                            shares:
                                                              originalAmount,
                                                          }
                                                        : p,
                                                    ),
                                                  )
                                                  setManuallyEditedParticipants(
                                                    (prev) =>
                                                      new Set(prev).add(id),
                                                  )
                                                }}
                                                step={
                                                  10 **
                                                  -originalCurrency.decimal_digits
                                                }
                                              />
                                            </FormControl>
                                            <ChevronRight className="h-4 w-4 mx-1 opacity-50" />
                                          </div>
                                        </div>
                                      )
                                    }}
                                  />
                                )}
                              <FormField
                                name={`paidFor[${field.value.findIndex(
                                  ({ participant }) => participant === id,
                                )}].shares`}
                                render={() => {
                                  const sharesLabel = (
                                    <span
                                      className={cn('text-sm', {
                                        'text-muted': !field.value?.some(
                                          ({ participant }) =>
                                            participant === id,
                                        ),
                                      })}
                                    >
                                      {match(watchedSplitMode)
                                        .with('BY_SHARES', () => (
                                          <>{t('shares')}</>
                                        ))
                                        .with('BY_PERCENTAGE', () => <>%</>)
                                        .with('BY_AMOUNT', () => (
                                          <>{expenseCurrency.symbol}</>
                                        ))
                                        .otherwise(() => (
                                          <></>
                                        ))}
                                    </span>
                                  )
                                  return (
                                    <div>
                                      <div className="flex items-center gap-1">
                                        {watchedSplitMode === 'BY_AMOUNT' &&
                                          sharesLabel}
                                        <FormControl>
                                          <Input
                                            key={String(
                                              !field.value?.some(
                                                ({ participant }) =>
                                                  participant === id,
                                              ),
                                            )}
                                            className="text-base w-[80px] -my-2"
                                            type="text"
                                            disabled={
                                              !field.value?.some(
                                                ({ participant }) =>
                                                  participant === id,
                                              )
                                            }
                                            value={
                                              field.value?.find(
                                                ({ participant }) =>
                                                  participant === id,
                                              )?.shares
                                            }
                                            onChange={(event) => {
                                              field.onChange(
                                                field.value.map((p) =>
                                                  p.participant === id
                                                    ? {
                                                        participant: id,
                                                        shares:
                                                          enforceCurrencyPattern(
                                                            event.target.value,
                                                          ),
                                                      }
                                                    : p,
                                                ),
                                              )
                                              setManuallyEditedParticipants(
                                                (prev) =>
                                                  new Set(prev).add(id),
                                              )
                                            }}
                                            inputMode={
                                              watchedSplitMode === 'BY_AMOUNT'
                                                ? 'decimal'
                                                : 'numeric'
                                            }
                                            step={
                                              watchedSplitMode === 'BY_AMOUNT'
                                                ? 10 **
                                                  -expenseCurrency.decimal_digits
                                                : 1
                                            }
                                          />
                                        </FormControl>
                                        {[
                                          'BY_SHARES',
                                          'BY_PERCENTAGE',
                                        ].includes(
                                          watchedSplitMode,
                                        ) && sharesLabel}
                                      </div>
                                      <FormMessage className="float-right" />
                                    </div>
                                  )
                                }}
                              />
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      }}
                    />
                  ))}
                  <FormMessage />
                </FormItem>
              )}
            />

            <Collapsible
              className="mt-5 rounded-xl border bg-muted/20 px-3 py-2"
              defaultOpen={form.getValues().splitMode !== 'EVENLY'}
            >
              <CollapsibleTrigger asChild>
                <Button variant="link" className="justify-start px-0">
                  {t('advancedOptions')}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="grid sm:grid-cols-2 gap-6 pt-3">
                  <FormField
                    control={form.control}
                    name="splitMode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('SplitModeField.label')}</FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={(value) => {
                              form.setValue('splitMode', value as any, {
                                shouldDirty: true,
                                shouldTouch: true,
                                shouldValidate: true,
                              })
                            }}
                            defaultValue={field.value}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="EVENLY">
                                {t('SplitModeField.evenly')}
                              </SelectItem>
                              <SelectItem value="BY_SHARES">
                                {t('SplitModeField.byShares')}
                              </SelectItem>
                              <SelectItem value="BY_PERCENTAGE">
                                {t('SplitModeField.byPercentage')}
                              </SelectItem>
                              <SelectItem value="BY_AMOUNT">
                                {t('SplitModeField.byAmount')}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormDescription>
                          {t(`${sExpense}.splitModeDescription`)}
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="saveDefaultSplittingOptions"
                    render={({ field }) => (
                      <FormItem className="flex flex-row gap-2 items-center space-y-0 pt-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div>
                          <FormLabel>
                            {t('SplitModeField.saveAsDefault')}
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </Card>
        )}

        {runtimeFeatureFlags.enableExpenseDocuments && shouldShowStep('attachments') && (
          <Card className="mt-4 overflow-hidden">
            <CardHeader className="p-4 sm:p-6 border-b">
              <SectionIntro
                eyebrow={t('mobile.step3')}
                title={t('attachDocuments')}
                description={t(`${sExpense}.attachDescription`)}
              />
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <FormField
                control={form.control}
                name="documents"
                render={({ field }) => (
                  <ExpenseDocumentsInput
                    documents={field.value}
                    updateDocuments={field.onChange}
                  />
                )}
              />
            </CardContent>
          </Card>
        )}

        <div className="sticky bottom-3 z-20 mt-4 flex flex-col gap-2 rounded-xl border bg-background/95 px-3 py-3 shadow-sm backdrop-blur sm:flex-row sm:flex-wrap">
          {!isDesktopLayout && !isFirstStep && (
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => goToStep(flowSteps[currentStepIndex - 1].id)}
            >
              {t('mobile.back')}
            </Button>
          )}
          {(isDesktopLayout || isLastStep) && (
            <SubmitButton
              loadingContent={t(isCreate ? 'creating' : 'saving')}
              className="w-full sm:w-auto"
            >
              <Save className="w-4 h-4 mr-2" />
              {t(isCreate ? 'create' : 'save')}
            </SubmitButton>
          )}
          {!isDesktopLayout && !isLastStep && (
            <Button type="button" className="w-full" onClick={() => void handleAdvanceStep()}>
              {t('mobile.continue')}
            </Button>
          )}
          {!isCreate && onDelete && (
            <DeletePopup
              onDelete={() => onDelete(activeUserId ?? undefined)}
            ></DeletePopup>
          )}
          <Button variant="ghost" asChild className="w-full sm:w-auto">
            <Link href={`/groups/${group.id}/expenses`}>{t('cancel')}</Link>
          </Button>
        </div>
      </form>
    </Form>
  )
}

function formatDateForDisplay(date?: Date) {
  if (!date || isNaN(date as any)) date = new Date()
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = String(date.getFullYear())
  return `${day}/${month}/${year}`
}

function formatDateInputValue(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function parseDateFromInput(value: string): Date | null {
  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) return null
  const parsed = new Date(year, month - 1, day)
  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null
  }
  return parsed
}
