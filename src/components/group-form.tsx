import { SubmitButton } from '@/components/submit-button'
import { Badge } from '@/components/ui/badge'
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
import { Textarea } from '@/components/ui/textarea'
import { Locale } from '@/i18n/request'
import { getGroup } from '@/lib/api'
import { defaultCurrencyList, getCurrency } from '@/lib/currency'
import { GroupFormValues, groupFormSchema } from '@/lib/schemas'
import { trpc } from '@/trpc/client'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  AlertTriangle,
  Info,
  Save,
  ShieldCheck,
  Trash2,
  UserRound,
} from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import Link from 'next/link'
import { ReactNode, useEffect, useMemo, useState } from 'react'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'
import { CurrencySelector } from './currency-selector'
import { Alert, AlertDescription, AlertTitle } from './ui/alert'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'

export type Props = {
  group?: NonNullable<Awaited<ReturnType<typeof getGroup>>>
  onSubmit: (
    groupFormValues: GroupFormValues,
    options?: {
      participantId?: string
      activeParticipantName?: string
    },
  ) => Promise<void>
  protectedParticipantIds?: string[]
  currentActiveParticipantId?: string | null
  mode?: 'full' | 'details' | 'participants'
  participantAccess?: Record<
    string,
    {
      userId: string
      label: string
      secondary?: string | null
      isOwner?: boolean
      isCurrentViewer?: boolean
    }
  >
  onRemoveParticipantAccess?: (
    participantId: string,
    userId: string,
  ) => void | Promise<void>
  removingParticipantUserId?: string | null
  removeAccessLabel?: string
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
              className="h-6 w-6 text-muted-foreground"
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
  currentActiveParticipantId = null,
  mode = 'full',
  participantAccess,
  onRemoveParticipantAccess,
  removingParticipantUserId = null,
  removeAccessLabel,
}: Props) {
  const locale = useLocale()
  const t = useTranslations('GroupForm')
  const defaultParticipantNames = useMemo(
    () => [t('Participants.John'), t('Participants.Jane')],
    [t],
  )
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
          currencyCode: process.env.NEXT_PUBLIC_DEFAULT_CURRENCY_CODE || 'USD', // TODO: If NEXT_PUBLIC_DEFAULT_CURRENCY_CODE, is not set, determine the default currency code based on locale
          name: '',
          information: '',
          currency: getCurrency(
            process.env.NEXT_PUBLIC_DEFAULT_CURRENCY_CODE || 'USD',
            locale as Locale,
          ).symbol,
          participants: defaultParticipantNames.map((name) => ({ name })),
        },
  })
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'participants',
    keyName: 'key',
  })
  const watchedCurrencyCode = useWatch({
    control: form.control,
    name: 'currencyCode',
  })
  const watchedParticipants = useWatch({
    control: form.control,
    name: 'participants',
  })
  const { data: viewerData } = trpc.viewer.getCurrent.useQuery()
  const [activeParticipantKey, setActiveParticipantKey] = useState<
    string | null
  >(null)
  const viewerDisplayName =
    viewerData?.user?.displayName?.trim() ||
    viewerData?.user?.email?.trim() ||
    ''

  const activeParticipantOptions: Array<{
    key: string
    name: string
    participantId?: string
  }> = group
    ? group.participants.map((participant) => ({
        key: participant.id,
        name: participant.name,
        participantId: participant.id,
      }))
    : fields.map((field, index) => ({
        key: `draft:${field.key}`,
        name: watchedParticipants?.[index]?.name ?? '',
      }))

  useEffect(() => {
    const availableOptions = activeParticipantOptions.filter(
      (option) => option.name.trim().length > 0,
    )

    const persistedKey =
      group && currentActiveParticipantId
        ? activeParticipantOptions.find(
            (option) => option.participantId === currentActiveParticipantId,
          )?.key
        : null

    const nextSelectedKey =
      persistedKey ??
      (activeParticipantKey &&
      availableOptions.some((option) => option.key === activeParticipantKey)
        ? activeParticipantKey
        : (availableOptions[0]?.key ?? t('Settings.ActiveUserField.none')))

    if (nextSelectedKey !== activeParticipantKey) {
      setActiveParticipantKey(nextSelectedKey)
    }
  }, [
    activeParticipantKey,
    activeParticipantOptions,
    currentActiveParticipantId,
    group,
    t,
  ])

  useEffect(() => {
    if (group || !viewerDisplayName) return

    const firstParticipantName = watchedParticipants?.[0]?.name ?? ''
    const isDefaultFirstParticipant =
      firstParticipantName.trim().length === 0 ||
      defaultParticipantNames.includes(firstParticipantName)

    if (
      !isDefaultFirstParticipant ||
      form.getFieldState('participants.0.name').isDirty
    ) {
      return
    }

    form.setValue('participants.0.name', viewerDisplayName, {
      shouldDirty: false,
      shouldTouch: false,
      shouldValidate: false,
    })
  }, [
    defaultParticipantNames,
    form,
    group,
    viewerDisplayName,
    watchedParticipants,
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
  const showGroupDetails = mode !== 'participants'
  const showParticipants = mode !== 'details'
  const showLocalSettings = mode === 'full' && !!group
  const compactParticipantsMode = mode === 'participants'

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(
          async (values) => {
            await onSubmit(values, {
              participantId:
                activeParticipantKey &&
                activeParticipantKey !== t('Settings.ActiveUserField.none')
                  ? activeParticipantOptions.find(
                      (option) => option.key === activeParticipantKey,
                    )?.participantId
                  : undefined,
              activeParticipantName:
                activeParticipantKey &&
                activeParticipantKey !== t('Settings.ActiveUserField.none')
                  ? activeParticipantOptions.find(
                      (option) => option.key === activeParticipantKey,
                    )?.name
                  : undefined,
            })
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

        {showGroupDetails && (
          <Card className="mb-3 border-border/70">
            <CardHeader className="pb-3">
              <CardTitle>{t('title')}</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                      defaultValue={field.value ?? ''}
                      onValueChange={(newCurrency) => {
                        field.onChange(newCurrency)
                        const currency = getCurrency(newCurrency)
                        if (
                          currency.code.length ||
                          form.getFieldState('currency').isTouched
                        )
                          form.setValue('currency', currency.symbol, {
                            shouldValidate:
                              form.getFieldState('currency').isTouched,
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
                  <FormItem hidden={!!watchedCurrencyCode?.length}>
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

              <FormField
                control={form.control}
                name="information"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <LabelWithInfo label={t('InformationField.label')} />
                    <FormControl>
                      <Textarea
                        className="min-h-28 text-base"
                        placeholder={t('InformationField.placeholder')}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        )}

        <div
          className={[
            'mb-3 grid gap-3',
            showParticipants && showLocalSettings ? 'lg:grid-cols-2' : '',
          ].join(' ')}
        >
          {showParticipants && (
            <Card
              className={
                compactParticipantsMode
                  ? 'h-full border-0 bg-transparent shadow-none'
                  : 'h-full border-border/70'
              }
            >
              {!compactParticipantsMode && (
                <CardHeader>
                  <CardTitle>{t('Participants.title')}</CardTitle>
                  <CardDescription className="hidden sm:block">
                    {t('Participants.description')}
                  </CardDescription>
                </CardHeader>
              )}
              <CardContent
                className={
                  compactParticipantsMode ? 'px-0 pb-0 pt-0' : undefined
                }
              >
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
                              <div
                                className={[
                                  'rounded-lg border border-border/70 bg-background/75',
                                  compactParticipantsMode ? 'p-2' : 'p-2.5',
                                ].join(' ')}
                              >
                                <div className="flex items-start gap-2">
                                  <div className="min-w-0 flex-1 space-y-2">
                                    {/*
                                  In create mode, the first participant is the signed-in user.
                                  Keep that identity fixed here and let account settings own renames.
                                */}
                                    <Input
                                      className="text-base"
                                      disabled={!group && index === 0}
                                      {...field}
                                      placeholder={t('Participants.new')}
                                    />
                                    {(item.id &&
                                      protectedParticipantIds.includes(
                                        item.id,
                                      )) ||
                                    (!group && index === 0) ? (
                                      <HoverCard>
                                        <HoverCardTrigger>
                                          <Button
                                            variant="ghost"
                                            className="text-destructive"
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
                                          {!group && index === 0
                                            ? t('Participants.youLinked')
                                            : t(
                                                'Participants.protectedParticipant',
                                              )}
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
                                    {(() => {
                                      const linkedParticipant =
                                        group?.participants.find(
                                          (participant) =>
                                            participant.id === item.id,
                                        )
                                      const linkedUserId =
                                        linkedParticipant?.appUserId
                                      if (!linkedUserId) return null
                                      const accessInfo = item.id
                                        ? participantAccess?.[item.id]
                                        : undefined

                                      const isCurrentViewer =
                                        accessInfo?.isCurrentViewer ??
                                        viewerData?.user?.id === linkedUserId

                                      const accessLabel =
                                        accessInfo?.label ??
                                        linkedParticipant.appUser
                                          ?.displayName ??
                                        linkedParticipant.appUser?.email ??
                                        t('Participants.linkedAccount')
                                      const accessSecondary =
                                        accessInfo?.secondary ??
                                        linkedParticipant.appUser?.email ??
                                        null

                                      return compactParticipantsMode ? (
                                        <div className="flex items-center justify-between gap-2 rounded-lg bg-background/80 px-2 py-1.5">
                                          <div className="min-w-0 flex items-center gap-2">
                                            {isCurrentViewer ? (
                                              <UserRound
                                                className="h-3.5 w-3.5 shrink-0 text-foreground"
                                                aria-label={t(
                                                  'Participants.youLinked',
                                                )}
                                              />
                                            ) : (
                                              <ShieldCheck
                                                className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
                                                aria-label={t(
                                                  'Participants.linkedAccount',
                                                )}
                                              />
                                            )}
                                            <div className="min-w-0">
                                              <p className="truncate text-xs font-medium leading-none">
                                                {accessLabel}
                                              </p>
                                              {accessSecondary &&
                                              accessSecondary !==
                                                accessLabel ? (
                                                <p className="truncate pt-1 text-[10px] leading-none text-muted-foreground">
                                                  {accessSecondary}
                                                </p>
                                              ) : null}
                                            </div>
                                          </div>

                                          {item.id &&
                                          accessInfo &&
                                          !accessInfo.isOwner &&
                                          onRemoveParticipantAccess &&
                                          removeAccessLabel ? (
                                            <Button
                                              type="button"
                                              variant="ghost"
                                              size="sm"
                                              className="h-7 shrink-0 px-2 text-xs"
                                              disabled={
                                                removingParticipantUserId ===
                                                accessInfo.userId
                                              }
                                              onClick={() =>
                                                void onRemoveParticipantAccess(
                                                  item.id as string,
                                                  accessInfo.userId,
                                                )
                                              }
                                            >
                                              {removeAccessLabel}
                                            </Button>
                                          ) : accessInfo?.isOwner ? (
                                            <Badge
                                              variant="outline"
                                              className="h-7 shrink-0 text-[10px]"
                                            >
                                              {t('Participants.linkedAccount')}
                                            </Badge>
                                          ) : null}
                                        </div>
                                      ) : (
                                        <div className="flex items-center justify-between gap-2 rounded-lg border border-border/70 bg-background px-2.5 py-2">
                                          <div className="min-w-0 flex items-center gap-2">
                                            {isCurrentViewer ? (
                                              <span
                                                className="inline-flex items-center rounded-full border bg-background px-2 py-1 text-foreground"
                                                title={t(
                                                  'Participants.youLinked',
                                                )}
                                                aria-label={t(
                                                  'Participants.youLinked',
                                                )}
                                              >
                                                <UserRound className="h-3.5 w-3.5" />
                                              </span>
                                            ) : (
                                              <span
                                                className="inline-flex items-center rounded-full border bg-background px-2 py-1 text-muted-foreground"
                                                title={t(
                                                  'Participants.linkedAccount',
                                                )}
                                                aria-label={t(
                                                  'Participants.linkedAccount',
                                                )}
                                              >
                                                <ShieldCheck className="h-3.5 w-3.5" />
                                              </span>
                                            )}
                                            <div className="min-w-0">
                                              <p className="truncate text-xs font-medium">
                                                {accessLabel}
                                              </p>
                                              {accessSecondary &&
                                              accessSecondary !==
                                                accessLabel ? (
                                                <p className="truncate text-[11px] text-muted-foreground">
                                                  {accessSecondary}
                                                </p>
                                              ) : null}
                                            </div>
                                          </div>

                                          {item.id &&
                                          accessInfo &&
                                          !accessInfo.isOwner &&
                                          onRemoveParticipantAccess &&
                                          removeAccessLabel ? (
                                            <Button
                                              type="button"
                                              variant="outline"
                                              size="sm"
                                              className="shrink-0"
                                              disabled={
                                                removingParticipantUserId ===
                                                accessInfo.userId
                                              }
                                              onClick={() =>
                                                void onRemoveParticipantAccess(
                                                  item.id as string,
                                                  accessInfo.userId,
                                                )
                                              }
                                            >
                                              {removeAccessLabel}
                                            </Button>
                                          ) : null}
                                        </div>
                                      )
                                    })()}
                                  </div>
                                </div>
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
              <CardFooter
                className={
                  compactParticipantsMode ? 'px-0 pb-0 pt-3' : undefined
                }
              >
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
          )}

          {showLocalSettings && (
            <Card className="h-full border-border/70">
              <CardHeader>
                <CardTitle>{t('Settings.title')}</CardTitle>
                <CardDescription>{t('Settings.description')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-4">
                  {activeParticipantKey !== null && (
                    <FormItem>
                      <LabelWithInfo
                        label={t('Settings.ActiveUserField.label')}
                        description={t('Settings.ActiveUserField.description')}
                      />
                      <FormControl>
                        <Select
                          onValueChange={(value) => {
                            setActiveParticipantKey(value)
                          }}
                          defaultValue={activeParticipantKey}
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
                              {
                                key: t('Settings.ActiveUserField.none'),
                                name: t('Settings.ActiveUserField.none'),
                              },
                              ...activeParticipantOptions,
                            ]
                              .filter((item) => item.name.length > 0)
                              .map(({ key, name }) => (
                                <SelectItem key={key} value={key}>
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
          )}
        </div>

        <div className="flex flex-col gap-2 rounded-lg border border-border/70 bg-secondary/40 p-3.5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {mode === 'participants'
              ? t('Participants.description')
              : group
                ? t('Settings.description')
                : t('Participants.description')}
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <SubmitButton
              loadingContent={t(
                group ? 'Settings.saving' : 'Settings.creating',
              )}
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
        </div>
      </form>
    </Form>
  )
}
