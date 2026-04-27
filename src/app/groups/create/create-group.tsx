'use client'

import { GroupForm } from '@/components/group-form'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { trpc } from '@/trpc/client'
import { Sparkles } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'

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
            await utils.groups.mine.invalidate()
            router.push(`/groups/${groupId}/settings?onboarding=invite`)
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
  )
}
