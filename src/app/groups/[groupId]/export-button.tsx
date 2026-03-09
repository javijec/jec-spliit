'use client'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Download, FileDown, FileJson } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { ComponentProps } from 'react'

export default function ExportButton({
  groupId,
  showLabel = false,
  variant = 'secondary',
  size = 'icon',
}: {
  groupId: string
  showLabel?: boolean
  variant?: ComponentProps<typeof Button>['variant']
  size?: ComponentProps<typeof Button>['size']
}) {
  const t = useTranslations('Expenses')
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button title={t('export')} variant={variant} size={size}>
          <Download className="h-4 w-4" />
          {showLabel && <span className="ml-2">{t('export')}</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-44">
        <DropdownMenuItem asChild>
          <Link
            prefetch={false}
            href={`/groups/${groupId}/expenses/export/json`}
            target="_blank"
            title={t('exportJson')}
            className="flex items-center gap-2"
          >
            <FileJson className="h-4 w-4" />
            <span>{t('exportJson')}</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link
            prefetch={false}
            href={`/groups/${groupId}/expenses/export/csv`}
            target="_blank"
            title={t('exportCsv')}
            className="flex items-center gap-2"
          >
            <FileDown className="h-4 w-4" />
            <span>{t('exportCsv')}</span>
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
