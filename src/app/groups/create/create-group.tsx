'use client'

import { GroupForm } from '@/components/group-form'
import { SubmitButton } from '@/components/submit-button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
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
import { AlertTriangle, FileUp } from 'lucide-react'
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

function SplitwiseImportCard() {
  const utils = trpc.useUtils()
  const router = useRouter()
  const importSplitwise = trpc.groups.importSplitwise.useMutation({
    onSuccess: async ({ groupId }) => {
      await utils.groups.invalidate()
      router.push(`/groups/${groupId}`)
    },
  })

  const [parseError, setParseError] = useState<string | null>(null)
  const [csvData, setCsvData] = useState<ParsedSplitwiseCsv | null>(null)
  const [groupName, setGroupName] = useState('')
  const [groupCurrencyCode, setGroupCurrencyCode] = useState('')
  const [payerOverrides, setPayerOverrides] = useState<Record<string, string>>(
    {},
  )

  const unresolvedExpenses = useMemo(
    () => csvData?.expenses.filter((expense) => !expense.paidByName) ?? [],
    [csvData],
  )

  const onSelectCsv = async (file: File) => {
    setParseError(null)
    setCsvData(null)
    const rawText = await file.text()
    const lines = rawText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
    if (lines.length < 2) {
      setParseError('El CSV no contiene datos.')
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
      setParseError('No se detectaron columnas de participantes en el CSV.')
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
        title: description.trim() || 'Gasto importado',
        category: category.trim(),
        amountMinor,
        currencyCode: parsedCurrencyCode,
        balancesMinor,
        paidByName: detectPaidByName(balancesMinor),
        isReimbursement: /pago/i.test(category),
      })
    }

    if (!expenses.length) {
      setParseError('No se pudieron parsear gastos válidos del CSV.')
      return
    }

    const parsed: ParsedSplitwiseCsv = {
      participants,
      currencyCodes: Array.from(currencyCodes),
      expenses,
      fileName: file.name,
    }
    setCsvData(parsed)
    setGroupName(normalizeFileName(file.name) || 'Grupo importado')
    setGroupCurrencyCode(parsed.currencyCodes[0] ?? 'USD')
  }

  const importData = async () => {
    if (!csvData) return
    const missingPayer = csvData.expenses.find(
      (expense) => !(expense.paidByName ?? payerOverrides[expense.id]),
    )
    if (missingPayer) {
      setParseError('Falta definir quién pagó en uno o más gastos.')
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
        expenseDate: expense.expenseDate,
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
        name: groupName || 'Grupo importado',
        information: `Importado desde CSV de Splitwise (${csvData.fileName})`,
        currencyCode: groupCurrencyCode,
        currency: getCurrency(groupCurrencyCode).symbol,
        participants: csvData.participants.map((name) => ({ name })),
      },
      importedExpenses,
    })
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Importar desde CSV de Splitwise</CardTitle>
        <CardDescription>
          Crea un grupo nuevo desde un export CSV y completa lo que falte antes
          de importar.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          type="file"
          accept=".csv,text/csv"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) void onSelectCsv(file)
          }}
        />
        {parseError && (
          <div className="text-sm text-destructive flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            {parseError}
          </div>
        )}
        {csvData && (
          <>
            <div className="grid sm:grid-cols-2 gap-3">
              <Input
                value={groupName}
                onChange={(event) => setGroupName(event.target.value)}
                placeholder="Nombre del grupo"
              />
              <Select
                value={groupCurrencyCode}
                onValueChange={(value) => setGroupCurrencyCode(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Moneda del grupo" />
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
            <div className="text-sm text-muted-foreground">
              Participantes: {csvData.participants.join(', ')} · Gastos
              detectados: {csvData.expenses.length}
            </div>
            {unresolvedExpenses.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium">
                  Completa quién pagó en {unresolvedExpenses.length} gasto(s):
                </div>
                {unresolvedExpenses.slice(0, 20).map((expense) => (
                  <div
                    key={expense.id}
                    className="grid sm:grid-cols-[1fr_220px] gap-2 items-center"
                  >
                    <div className="text-sm">
                      {expense.expenseDate.toISOString().slice(0, 10)} ·{' '}
                      {expense.title}
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
                        <SelectValue placeholder="Seleccionar pagador" />
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
            )}
            <SubmitButton
              loadingContent="Importando..."
              onClick={() => void importData()}
              type="button"
            >
              <FileUp className="w-4 h-4 mr-2" />
              Crear grupo e importar gastos
            </SubmitButton>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export const CreateGroup = () => {
  const createGroup = trpc.groups.create.useMutation()
  const utils = trpc.useUtils()
  const router = useRouter()

  return (
    <>
      <SplitwiseImportCard />
      <GroupForm
        onSubmit={async (groupFormValues) => {
          const { groupId } = await createGroup.mutateAsync({ groupFormValues })
          await utils.groups.invalidate()
          router.push(`/groups/${groupId}`)
        }}
      />
    </>
  )
}
