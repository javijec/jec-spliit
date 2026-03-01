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
          <Download className="w-4 h-4" />
          {showLabel && <span className="ml-2">{t('export')}</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem asChild>
          <Link
            prefetch={false}
            href={`/groups/${groupId}/expenses/export/json`}
            target="_blank"
            title={t('exportJson')}
          >
            <div className="flex items-center gap-2">
              <FileJson className="w-4 h-4" />
              <p>{t('exportJson')}</p>
            </div>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link
            prefetch={false}
            href={`/groups/${groupId}/expenses/export/csv`}
            target="_blank"
            title={t('exportCsv')}
          >
            <div className="flex items-center gap-2">
              <FileDown className="w-4 h-4" />
              <p>{t('exportCsv')}</p>
            </div>
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
