'use client'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Pencil } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useCurrentGroup } from '../current-group-context'

export default function GroupInformation({ groupId }: { groupId: string }) {
  const t = useTranslations('Information')
  const { isLoading, group } = useCurrentGroup()

  return (
    <Card className="mb-4 shadow-none">
      <CardHeader className="border-b">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>{t('title')}</CardTitle>
            <CardDescription className="mt-2">{t('description')}</CardDescription>
          </div>
          <Button size="icon" variant="outline" asChild>
            <Link href={`/groups/${groupId}/edit`}>
              <Pencil className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="max-w-full whitespace-break-spaces pt-6">
        {isLoading ? (
          <div className="flex flex-col gap-2 py-1">
            <Skeleton className="h-3 w-3/4 rounded-sm" />
            <Skeleton className="h-3 w-1/2 rounded-sm" />
          </div>
        ) : group.information ? (
          <p className="text-sm leading-7 text-foreground sm:text-base">
            {group.information}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">{t('empty')}</p>
        )}
      </CardContent>
    </Card>
  )
}
