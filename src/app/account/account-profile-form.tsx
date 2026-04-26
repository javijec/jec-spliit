'use client'

import { SubmitButton } from '@/components/submit-button'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import { trpc } from '@/trpc/client'
import { AppRouterOutput } from '@/trpc/routers/_app'
import { zodResolver } from '@hookform/resolvers/zod'
import { Save } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { TRPCClientError } from '@trpc/client'
import { z } from 'zod'

const accountProfileSchema = z.object({
  displayName: z.string().trim().min(2, 'min2').max(50, 'max50'),
})

type AccountProfileValues = z.infer<typeof accountProfileSchema>

function getDisplayNameErrorMessage(error: unknown) {
  if (!(error instanceof TRPCClientError)) return null

  const zodErrors = error.data?.zodError
  const fieldError = zodErrors?.fieldErrors?.displayName?.[0]

  if (fieldError) {
    return fieldError
  }

  const firstIssue = zodErrors?.formErrors?.[0]
  return firstIssue ?? null
}

export function AccountProfileForm({
  initialDisplayName,
}: {
  initialDisplayName: string
}) {
  const t = useTranslations('Account')
  const tSchema = useTranslations('SchemaErrors')
  const { toast } = useToast()
  const router = useRouter()
  const utils = trpc.useUtils()
  const updateProfile = trpc.viewer.updateProfile.useMutation({
    onSuccess: async ({ user }) => {
      const nextUser = {
        ...utils.viewer.getCurrent.getData()?.user,
        ...currentViewerUser(user),
      } as AppRouterOutput['viewer']['getCurrent']['user']

      utils.viewer.getCurrent.setData(undefined, {
        user: nextUser,
      })
      form.reset({
        displayName: nextUser?.displayName ?? '',
      })
      toast({
        title: t('profileSavedTitle'),
        description: t('profileSavedDescription'),
      })
      router.refresh()
    },
  })

  const form = useForm<AccountProfileValues>({
    resolver: zodResolver(accountProfileSchema),
    mode: 'onChange',
    defaultValues: {
      displayName: initialDisplayName,
    },
  })

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(async (values) => {
          try {
            await updateProfile.mutateAsync(values)
          } catch (error) {
            const displayNameError = getDisplayNameErrorMessage(error)

            if (displayNameError) {
              form.setError('displayName', { message: displayNameError })
              return
            }

            throw error
          }
        })}
        className="space-y-4"
      >
        <FormField
          control={form.control}
          name="displayName"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel>{t('editNameLabel')}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  className="text-base"
                  placeholder={t('editNamePlaceholder')}
                />
              </FormControl>
              <p className="text-sm text-muted-foreground">
                {t('editNameDescription')}
              </p>
              <FormMessage>
                {fieldState.error?.message
                  ? tSchema(fieldState.error.message)
                  : null}
              </FormMessage>
            </FormItem>
          )}
        />

        <div className="flex flex-col gap-2 sm:flex-row">
          <SubmitButton
            loadingContent={t('profileSaving')}
            disabled={
              updateProfile.isPending ||
              !form.formState.isDirty ||
              !form.formState.isValid
            }
            className="sm:w-auto"
          >
            <Save className="mr-2 h-4 w-4" />
            {t('profileSaveAction')}
          </SubmitButton>
          <Button
            type="button"
            variant="ghost"
            onClick={() => form.reset({ displayName: initialDisplayName })}
            disabled={updateProfile.isPending || !form.formState.isDirty}
            className="sm:w-auto"
          >
            {t('profileResetAction')}
          </Button>
        </div>
      </form>
    </Form>
  )
}

function currentViewerUser(user: unknown) {
  return user as AppRouterOutput['viewer']['getCurrent']['user']
}
