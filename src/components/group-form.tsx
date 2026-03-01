import { SubmitButton } from '@/components/submit-button'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Locale } from '@/i18n/request'
import { getGroup } from '@/lib/api'
import { defaultCurrencyList, getCurrency } from '@/lib/currency'
import { GroupFormValues, groupFormSchema } from '@/lib/schemas'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertTriangle, Info, Save, Trash2 } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import Link from 'next/link'
import { ReactNode, useEffect, useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { CurrencySelector } from './currency-selector'
import { Alert, AlertDescription, AlertTitle } from './ui/alert'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'

export type Props = {
  group?: NonNullable<Awaited<ReturnType<typeof getGroup>>>
  onSubmit: (
    groupFormValues: GroupFormValues,
    participantId?: string,
  ) => Promise<void>
  protectedParticipantIds?: string[]
}

function LabelWithInfo({
  label,
  description,
}: {
  label: string
  description?: ReactNode
}) {
  return (
    <div className="flex items-center gap-1.5">
      <FormLabel>{label}</FormLabel>
      {description && (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-5 w-5 text-muted-foreground"
              aria-label={`Información sobre ${label}`}
            >
              <Info className="w-3.5 h-3.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="max-w-xs text-sm">
            {description}
          </PopoverContent>
        </Popover>
      )}
    </div>
  )
}

export function GroupForm({
  group,
  onSubmit,
  protectedParticipantIds = [],
}: Props) {
  const locale = useLocale()
  const t = useTranslations('GroupForm')
  const form = useForm<GroupFormValues>({
    resolver: zodResolver(groupFormSchema),
    defaultValues: group
      ? {
          name: group.name,
          information: group.information ?? '',
          currency: group.currency ?? '',
          currencyCode: group.currencyCode ?? '',
          participants: group.participants,
        }
      : {
          name: '',
          information: '',
          currency: '',
          currencyCode: process.env.NEXT_PUBLIC_DEFAULT_CURRENCY_CODE || 'USD', // TODO: If NEXT_PUBLIC_DEFAULT_CURRENCY_CODE, is not set, determine the default currency code based on locale
          participants: [
            { name: t('Participants.John') },
            { name: t('Participants.Jane') },
            { name: t('Participants.Jack') },
          ],
        },
  })
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'participants',
    keyName: 'key',
  })

  const [activeUser, setActiveUser] = useState<string | null>(null)
  useEffect(() => {
    if (activeUser === null) {
      const currentActiveUser =
        fields.find(
          (f) => f.id === localStorage.getItem(`${group?.id}-activeUser`),
        )?.name || t('Settings.ActiveUserField.none')
      setActiveUser(currentActiveUser)
    }
  }, [t, activeUser, fields, group?.id])

  const updateActiveUser = () => {
    if (!activeUser) return
    if (group?.id) {
      const participant = group.participants.find((p) => p.name === activeUser)
      if (participant?.id) {
        localStorage.setItem(`${group.id}-activeUser`, participant.id)
      } else {
        localStorage.setItem(`${group.id}-activeUser`, activeUser)
      }
    } else {
      localStorage.setItem('newGroup-activeUser', activeUser)
    }
  }

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
    name: t('NameField.label'),
    currencyCode: t('CurrencyCodeField.label'),
    currency: t('CurrencyField.label'),
    information: t('InformationField.label'),
    'participants[].name': t('Participants.title'),
  }
  const invalidFieldLabels = normalizedErrorPaths
    .map((path) => labelByPath[path])
    .filter(Boolean)
  const uniqueInvalidFieldLabels = Array.from(new Set(invalidFieldLabels))
  const topInvalidFields = uniqueInvalidFieldLabels.slice(0, 4)

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(
          async (values) => {
            await onSubmit(
              values,
              group?.participants.find((p) => p.name === activeUser)?.id ??
                undefined,
            )
          },
          () => {
            focusFirstInvalidField()
          },
        )}
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

        <Card className="mb-4">
          <CardHeader>
            <CardTitle>{t('title')}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <LabelWithInfo
                    label={t('NameField.label')}
                    description={t('NameField.description')}
                  />
                  <FormControl>
                    <Input
                      className="text-base"
                      placeholder={t('NameField.placeholder')}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="currencyCode"
              render={({ field }) => (
                <FormItem>
                  <LabelWithInfo
                    label={t('CurrencyCodeField.label')}
                    description={t(
                      group
                        ? 'CurrencyCodeField.editDescription'
                        : 'CurrencyCodeField.createDescription',
                    )}
                  />
                  <CurrencySelector
                    currencies={defaultCurrencyList(
                      locale as Locale,
                      t('CurrencyCodeField.customOption'),
                    )}
                    defaultValue={form.watch(field.name) ?? ''}
                    onValueChange={(newCurrency) => {
                      field.onChange(newCurrency)
                      const currency = getCurrency(newCurrency)
                      if (
                        currency.code.length ||
                        form.getFieldState('currency').isTouched
                      )
                        form.setValue('currency', currency.symbol, {
                          shouldValidate: true,
                          shouldTouch: true,
                          shouldDirty: true,
                        })
                    }}
                    isLoading={false}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="currency"
              render={({ field }) => (
                <FormItem hidden={!!form.watch('currencyCode')?.length}>
                  <LabelWithInfo
                    label={t('CurrencyField.label')}
                    description={t('CurrencyField.description')}
                  />
                  <FormControl>
                    <Input
                      className="text-base"
                      placeholder={t('CurrencyField.placeholder')}
                      max={5}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="mb-4 grid gap-4 lg:grid-cols-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>{t('Participants.title')}</CardTitle>
              <CardDescription className="hidden sm:block">
                {t('Participants.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="flex flex-col gap-2">
                {fields.map((item, index) => (
                  <li key={item.key}>
                    <FormField
                      control={form.control}
                      name={`participants.${index}.name`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="sr-only">
                            Participant #{index + 1}
                          </FormLabel>
                          <FormControl>
                            <div className="flex gap-2">
                              <Input
                                className="text-base"
                                {...field}
                                placeholder={t('Participants.new')}
                              />
                              {item.id &&
                              protectedParticipantIds.includes(item.id) ? (
                                <HoverCard>
                                  <HoverCardTrigger>
                                    <Button
                                      variant="ghost"
                                      className="text-destructive-"
                                      type="button"
                                      size="icon"
                                      disabled
                                    >
                                      <Trash2 className="w-4 h-4 text-destructive opacity-50" />
                                    </Button>
                                  </HoverCardTrigger>
                                  <HoverCardContent
                                    align="end"
                                    className="text-sm"
                                  >
                                    {t('Participants.protectedParticipant')}
                                  </HoverCardContent>
                                </HoverCard>
                              ) : (
                                <Button
                                  variant="ghost"
                                  className="text-destructive"
                                  onClick={() => remove(index)}
                                  type="button"
                                  size="icon"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                variant="secondary"
                onClick={() => {
                  append({ name: '' })
                }}
                type="button"
              >
                {t('Participants.add')}
              </Button>
            </CardFooter>
          </Card>

          <Card className="h-full">
            <CardHeader>
              <CardTitle>{t('Settings.title')}</CardTitle>
              <CardDescription>{t('Settings.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-4">
                {activeUser !== null && (
                  <FormItem>
                    <LabelWithInfo
                      label={t('Settings.ActiveUserField.label')}
                      description={t('Settings.ActiveUserField.description')}
                    />
                    <FormControl>
                      <Select
                        onValueChange={(value) => {
                          setActiveUser(value)
                        }}
                        defaultValue={activeUser}
                      >
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t(
                              'Settings.ActiveUserField.placeholder',
                            )}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {[
                            { name: t('Settings.ActiveUserField.none') },
                            ...form.watch('participants'),
                          ]
                            .filter((item) => item.name.length > 0)
                            .map(({ name }) => (
                              <SelectItem key={name} value={name}>
                                {name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                  </FormItem>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col sm:flex-row mt-4 gap-2">
          <SubmitButton
            loadingContent={t(group ? 'Settings.saving' : 'Settings.creating')}
            onClick={updateActiveUser}
            className="w-full sm:w-auto"
          >
            <Save className="w-4 h-4 mr-2" />{' '}
            {t(group ? 'Settings.save' : 'Settings.create')}
          </SubmitButton>
          {!group && (
            <Button variant="ghost" asChild className="w-full sm:w-auto">
              <Link href="/groups">{t('Settings.cancel')}</Link>
            </Button>
          )}
        </div>
      </form>
    </Form>
  )
}
