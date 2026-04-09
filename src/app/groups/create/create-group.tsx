'use client'

import { GroupForm } from '@/components/group-form'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getCurrency } from '@/lib/currency'
import { amountAsMinorUnits } from '@/lib/utils'
import { trpc } from '@/trpc/client'
import {
  AlertTriangle,
  CalendarDays,
  FileUp,
  Loader2,
  Sparkles,
  Upload,
} from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'

type ParticipantBalances = Record<string, number>

type ParsedExpenseDraft = {
  id: string
  expenseDate: Date
  title: string
  category: string
  amountMinor: number
  currencyCode: string
  balancesMinor: ParticipantBalances
  paidByName?: string
  isReimbursement: boolean
}

type ParsedSplitwiseCsv = {
  participants: string[]
  currencyCodes: string[]
  expenses: ParsedExpenseDraft[]
  fileName: string
}

const parseCsvLine = (line: string, delimiter: string) => {
  const values: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
      continue
    }
    if (char === delimiter && !inQuotes) {
      values.push(current.trim())
      current = ''
      continue
    }
    current += char
  }
  values.push(current.trim())
  return values
}

const parseDecimal = (rawValue: string, delimiter: string) => {
  const value = rawValue.trim()
  if (!value.length) return 0
  if (delimiter === ';') {
    return Number(value.replace(/\./g, '').replace(',', '.'))
  }
  return Number(value.replace(/,/g, ''))
}

const detectPaidByName = (balances: ParticipantBalances) => {
  const positives = Object.entries(balances).filter(([, amount]) => amount > 0)
  if (positives.length === 1) return positives[0][0]
  return undefined
}

const normalizeFileName = (name: string) =>
  name
    .replace(/\.[^.]+$/, '')
    .replace(/[_-]export$/i, '')
    .replace(/[_-]/g, ' ')
    .trim()

const formatDateLabel = (date: Date, locale: string) =>
  date.toLocaleDateString(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })

const formatDateInputValue = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const parseDateInputValue = (value: string) => {
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

function SplitwiseImportCard() {
  const locale = useLocale()
  const t = useTranslations('Groups.Import')
  const utils = trpc.useUtils()
  const router = useRouter()
  const { toast } = useToast()
  const importSplitwise = trpc.groups.importSplitwise.useMutation({
    onSuccess: async ({ groupId }) => {
      toast({
        title: t('successTitle'),
        description: t('successDescription'),
      })
      await utils.groups.invalidate()
      router.push(`/groups/${groupId}`)
    },
    onError: (error) => {
      toast({
        title: t('importErrorTitle'),
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  const [parseError, setParseError] = useState<string | null>(null)
  const [csvData, setCsvData] = useState<ParsedSplitwiseCsv | null>(null)
  const [groupName, setGroupName] = useState('')
  const [groupCurrencyCode, setGroupCurrencyCode] = useState('')
  const [payerOverrides, setPayerOverrides] = useState<Record<string, string>>(
    {},
  )
  const [expenseDateOverrides, setExpenseDateOverrides] = useState<
    Record<string, string>
  >({})
  const [dateDialogExpenseId, setDateDialogExpenseId] = useState<string | null>(
    null,
  )
  const [dateDialogValue, setDateDialogValue] = useState('')

  const unresolvedExpenses = useMemo(
    () => csvData?.expenses.filter((expense) => !expense.paidByName) ?? [],
    [csvData],
  )
  const dateDialogExpense = useMemo(
    () =>
      csvData?.expenses.find((expense) => expense.id === dateDialogExpenseId) ??
      null,
    [csvData, dateDialogExpenseId],
  )

  const getExpenseDate = (expense: ParsedExpenseDraft) => {
    const override = expenseDateOverrides[expense.id]
    if (!override) return expense.expenseDate
    return parseDateInputValue(override) ?? expense.expenseDate
  }

  const onSelectCsv = async (file: File) => {
    setParseError(null)
    setCsvData(null)
    setExpenseDateOverrides({})
    setDateDialogExpenseId(null)
    setDateDialogValue('')
    try {
      const rawText = await file.text()
      const lines = rawText
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
      if (lines.length < 2) {
        const message = t('csvWithoutData')
        setParseError(message)
        toast({
          title: t('invalidCsvTitle'),
          description: message,
          variant: 'destructive',
        })
        return
      }

      const headerLine = lines[0].replace(/^\uFEFF/, '')
      const delimiter =
        (headerLine.match(/;/g)?.length ?? 0) >
        (headerLine.match(/,/g)?.length ?? 0)
          ? ';'
          : ','
      const headers = parseCsvLine(headerLine, delimiter)
      if (headers.length < 7) {
        const message = t('csvWithoutParticipants')
        setParseError(message)
        toast({
          title: t('invalidCsvTitle'),
          description: message,
          variant: 'destructive',
        })
        return
      }

      const participants = headers.slice(5).map((value) => value.trim())
      const expenses: ParsedExpenseDraft[] = []
      const currencyCodes = new Set<string>()

      for (let i = 1; i < lines.length; i++) {
        const row = parseCsvLine(lines[i], delimiter)
        if (row.length < headers.length) continue
        const [
          dateStr,
          description,
          category,
          cost,
          currencyCode,
          ...balancesRaw
        ] = row
        const expenseDate = new Date(dateStr)
        if (Number.isNaN(expenseDate.getTime())) continue
        const parsedCurrencyCode = currencyCode.trim().toUpperCase()
        if (!parsedCurrencyCode.length) continue
        currencyCodes.add(parsedCurrencyCode)
        const currency = getCurrency(parsedCurrencyCode)
        const amountMinor = amountAsMinorUnits(
          parseDecimal(cost, delimiter),
          currency,
        )
        if (amountMinor <= 0) continue

        const balancesMinor: ParticipantBalances = {}
        participants.forEach((participant, index) => {
          balancesMinor[participant] = amountAsMinorUnits(
            parseDecimal(balancesRaw[index] ?? '0', delimiter),
            currency,
          )
        })

        expenses.push({
          id: `${i}`,
          expenseDate,
          title: description.trim() || t('importedExpenseFallback'),
          category: category.trim(),
          amountMinor,
          currencyCode: parsedCurrencyCode,
          balancesMinor,
          paidByName: detectPaidByName(balancesMinor),
          isReimbursement: /pago/i.test(category),
        })
      }

      if (!expenses.length) {
        const message = t('csvWithoutExpenses')
        setParseError(message)
        toast({
          title: t('invalidCsvTitle'),
          description: message,
          variant: 'destructive',
        })
        return
      }

      const parsed: ParsedSplitwiseCsv = {
        participants,
        currencyCodes: Array.from(currencyCodes),
        expenses,
        fileName: file.name,
      }
      setCsvData(parsed)
      setGroupName(normalizeFileName(file.name) || t('importedGroupName'))
      setGroupCurrencyCode(parsed.currencyCodes[0] ?? 'USD')
      toast({
        title: t('csvLoadedTitle'),
        description: t('csvLoadedDescription', { count: expenses.length }),
      })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t('readErrorDescription')
      setParseError(message)
      toast({
        title: t('readErrorTitle'),
        description: message,
        variant: 'destructive',
      })
    }
  }

  const importData = async () => {
    if (!csvData) return
    const missingPayer = csvData.expenses.find(
      (expense) => !(expense.paidByName ?? payerOverrides[expense.id]),
    )
    if (missingPayer) {
      const message = t('missingPayerDescription')
      setParseError(message)
      toast({
        title: t('missingDataTitle'),
        description: message,
        variant: 'destructive',
      })
      return
    }

    const importedExpenses = csvData.expenses.map((expense) => {
      const paidByName = expense.paidByName ?? payerOverrides[expense.id]
      const balancesWithoutPayer = Object.entries(expense.balancesMinor).filter(
        ([participant]) => participant !== paidByName,
      )
      const paidFor = balancesWithoutPayer
        .filter(([, balance]) => balance < 0)
        .map(([participantName, balance]) => ({
          participantName,
          shares: Math.abs(balance),
        }))
      const negativeShares = paidFor.reduce((sum, row) => sum + row.shares, 0)
      const payerShare = expense.amountMinor - negativeShares
      if (payerShare > 0) {
        paidFor.push({ participantName: paidByName, shares: payerShare })
      } else if (paidFor.length === 0) {
        paidFor.push({
          participantName: paidByName,
          shares: expense.amountMinor,
        })
      }

      return {
        expenseDate: getExpenseDate(expense),
        title: expense.title,
        amount: expense.amountMinor,
        currencyCode: expense.currencyCode,
        paidByName,
        paidFor,
        isReimbursement: expense.isReimbursement,
      }
    })

    await importSplitwise.mutateAsync({
      groupFormValues: {
        name: groupName || t('importedGroupName'),
        information: t('importedGroupInfo', { fileName: csvData.fileName }),
        currencyCode: groupCurrencyCode,
        currency: getCurrency(groupCurrencyCode).symbol,
        participants: csvData.participants.map((name) => ({ name })),
      },
      importedExpenses,
    })
  }

  const openDateDialog = (expense: ParsedExpenseDraft) => {
    const currentDate = getExpenseDate(expense)
    setDateDialogExpenseId(expense.id)
    setDateDialogValue(formatDateInputValue(currentDate))
  }

  const saveDateDialog = () => {
    if (!dateDialogExpenseId) return
    const parsedDate = parseDateInputValue(dateDialogValue)
    if (!parsedDate) {
      toast({
        title: t('invalidDateTitle'),
        description: t('invalidDateDescription'),
        variant: 'destructive',
      })
      return
    }
    setExpenseDateOverrides((prev) => ({
      ...prev,
      [dateDialogExpenseId]: formatDateInputValue(parsedDate),
    }))
    setDateDialogExpenseId(null)
    setDateDialogValue('')
  }

  return (
    <Card className="mb-4 overflow-hidden border-border/70 bg-card">
      <CardHeader className="gap-3">
        <Badge variant="secondary" className="w-fit rounded-full px-3 py-1">
          <Upload className="h-3.5 w-3.5" />
          Splitwise CSV
        </Badge>
        <div className="space-y-1.5">
          <CardTitle>{t('title')}</CardTitle>
          <CardDescription>{t('description')}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="rounded-2xl border border-border/70 bg-background/80 p-3.5 shadow-sm shadow-black/5">
          <div className="flex flex-col gap-2.5">
            <div className="space-y-1">
              <p className="text-sm font-semibold tracking-tight">{t('step1Title')}</p>
              <p className="text-sm text-muted-foreground">{t('step1Description')}</p>
            </div>
            <Input
              type="file"
              accept=".csv,text/csv"
              className="max-w-full"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) void onSelectCsv(file)
              }}
            />
          </div>
        </div>
        {!csvData && !parseError && (
          <div className="border bg-background p-4 text-sm text-muted-foreground">
            {t('emptyState')}
          </div>
        )}
        {parseError && (
          <div className="flex items-center gap-2 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            <AlertTriangle className="w-4 h-4" />
            {parseError}
          </div>
        )}
        {csvData && (
          <>
            <div className="rounded-2xl border border-border/70 bg-background/80 p-3.5 shadow-sm shadow-black/5">
              <div className="mb-3 flex flex-wrap gap-2">
                <Badge variant="outline" className="rounded-full px-3 py-1 text-[0.7rem]">
                  {t('fileLabel', { fileName: csvData.fileName })}
                </Badge>
                <Badge variant="outline" className="rounded-full px-3 py-1 text-[0.7rem]">
                  {t('participantsLabel', { count: csvData.participants.length })}
                </Badge>
                <Badge variant="outline" className="rounded-full px-3 py-1 text-[0.7rem]">
                  {t('expensesLabel', { count: csvData.expenses.length })}
                </Badge>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  value={groupName}
                  onChange={(event) => setGroupName(event.target.value)}
                  placeholder={t('groupNamePlaceholder')}
                />
                <Select
                  value={groupCurrencyCode}
                  onValueChange={(value) => setGroupCurrencyCode(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('groupCurrencyPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {csvData.currencyCodes.map((code) => (
                      <SelectItem key={code} value={code}>
                        {code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                {t('participantsList', {
                  participants: csvData.participants.join(', '),
                })}
              </p>
            </div>

            {unresolvedExpenses.length > 0 && (
              <div className="rounded-2xl border border-border/70 bg-background/80 p-3.5 shadow-sm shadow-black/5">
                <div className="mb-3 space-y-1">
                  <p className="text-sm font-semibold tracking-tight">
                    {t('step2Title', { count: unresolvedExpenses.length })}
                  </p>
                  <p className="text-sm text-muted-foreground">{t('step2Description')}</p>
                </div>
                <div className="space-y-2">
                  {unresolvedExpenses.slice(0, 20).map((expense) => (
                    <div
                      key={expense.id}
                      className="grid gap-2.5 rounded-2xl border border-border/70 bg-card/90 p-3 sm:grid-cols-[1fr_220px] sm:items-center"
                    >
                      <div className="text-sm leading-6">
                        <button
                          type="button"
                          className="mr-2 inline-flex items-center gap-1 rounded-full text-primary transition-colors hover:text-primary/80"
                          onClick={() => openDateDialog(expense)}
                        >
                          <CalendarDays className="h-3.5 w-3.5" />
                          {formatDateLabel(getExpenseDate(expense), locale)}
                        </button>
                        · {expense.title}
                      </div>
                      <Select
                        value={payerOverrides[expense.id] ?? ''}
                        onValueChange={(value) =>
                          setPayerOverrides((prev) => ({
                            ...prev,
                            [expense.id]: value,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t('payerPlaceholder')} />
                        </SelectTrigger>
                        <SelectContent>
                          {csvData.participants.map((participant) => (
                            <SelectItem key={participant} value={participant}>
                              {participant}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-border/70 bg-background/80 p-3.5 shadow-sm shadow-black/5">
              <div className="mb-3 space-y-1">
                <p className="text-sm font-semibold tracking-tight">{t('step3Title')}</p>
                <p className="text-sm text-muted-foreground">{t('step3Description')}</p>
              </div>
              <div className="space-y-2">
                {csvData.expenses.slice(0, 12).map((expense) => (
                  <div
                    key={`date-${expense.id}`}
                    className="flex items-center justify-between gap-2 rounded-2xl border border-border/70 bg-card/90 p-3"
                  >
                    <div className="truncate text-sm">{expense.title}</div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => openDateDialog(expense)}
                      className="shrink-0"
                    >
                      <CalendarDays className="mr-2 h-4 w-4" />
                      {formatDateLabel(getExpenseDate(expense), locale)}
                    </Button>
                  </div>
                ))}
              </div>
              {csvData.expenses.length > 12 && (
                <p className="mt-3 text-xs text-muted-foreground">
                  {t('showingLimit')}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2.5 rounded-2xl border border-border/70 bg-secondary/45 p-3.5 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
                  <Sparkles className="h-4 w-4 text-primary" />
                  {t('submit')}
                </div>
                <p className="text-sm text-muted-foreground">{t('finalDescription')}</p>
              </div>
              <Button
                onClick={() => void importData()}
                type="button"
                disabled={importSplitwise.isPending}
                className="w-full sm:w-auto"
              >
                {importSplitwise.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('submitting')}
                  </>
                ) : (
                  <>
                    <FileUp className="mr-2 h-4 w-4" />
                    {t('submit')}
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </CardContent>
      <Dialog
        open={!!dateDialogExpense}
        onOpenChange={(open) => {
          if (!open) {
            setDateDialogExpenseId(null)
            setDateDialogValue('')
          }
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('dateDialogTitle')}</DialogTitle>
            <DialogDescription>
              {dateDialogExpense?.title ?? t('importedExpenseFallback')}
            </DialogDescription>
          </DialogHeader>
          <Input
            type="date"
            value={dateDialogValue}
            onChange={(event) => setDateDialogValue(event.target.value)}
          />
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setDateDialogExpenseId(null)
                setDateDialogValue('')
              }}
            >
              {t('cancel')}
            </Button>
            <Button type="button" onClick={saveDateDialog}>
              {t('saveDate')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

export const CreateGroup = () => {
  const t = useTranslations('Groups')
  const createGroup = trpc.groups.create.useMutation()
  const utils = trpc.useUtils()
  const router = useRouter()
  const { toast } = useToast()

  return (
    <div className="space-y-3">
      <section className="relative overflow-hidden rounded-[1.5rem] border border-border/80 bg-card px-4 py-3.5 shadow-[0_18px_50px_hsl(var(--foreground)/0.06)] sm:px-5 sm:py-4">
        <div className="absolute right-[-3rem] top-[-2rem] h-28 w-28 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative space-y-3">
          <Badge variant="secondary" className="w-fit rounded-full px-3 py-1">
            <Sparkles className="h-3.5 w-3.5" />
            Mobile app flow
          </Badge>
          <h1 className="text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">
            {t('createPageTitle')}
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
            {t('createPageDescription')}
          </p>
        </div>
      </section>
      <div className="grid gap-3 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] xl:items-start">
        <div className="space-y-3">
          <SplitwiseImportCard />
        </div>
        <div className="space-y-3">
          <GroupForm
            onSubmit={async (groupFormValues, options) => {
              try {
                const { groupId } = await createGroup.mutateAsync({
                  groupFormValues,
                  activeParticipantName: options?.activeParticipantName,
                })
                toast({
                  title: t('createSuccessTitle'),
                  description: t('createSuccessDescription'),
                })
                await utils.groups.invalidate()
                router.push(`/groups/${groupId}`)
              } catch (error) {
                toast({
                  title: t('createErrorTitle'),
                  description:
                    error instanceof Error
                      ? error.message
                      : t('createErrorDescription'),
                  variant: 'destructive',
                })
              }
            }}
          />
        </div>
      </div>
    </div>
  )
}
