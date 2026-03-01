'use client'
import { CopyButton } from '@/components/copy-button'
import { ShareUrlButton } from '@/components/share-url-button'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useBaseUrl } from '@/lib/hooks'
import { cn } from '@/lib/utils'
import { Share } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { ComponentProps } from 'react'

type Props = {
  group: {
    id: string
    name: string
  }
  showLabel?: boolean
  className?: string
  variant?: ComponentProps<typeof Button>['variant']
  size?: ComponentProps<typeof Button>['size']
}

export function ShareButton({
  group,
  showLabel = false,
  className,
  variant = 'default',
  size = 'icon',
}: Props) {
  const t = useTranslations('Share')
  const baseUrl = useBaseUrl()
  const url = baseUrl && `${baseUrl}/groups/${group.id}/expenses?ref=share`

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          title={t('title')}
          size={size}
          variant={variant}
          className={cn('flex-shrink-0', className)}
        >
          <Share className="w-4 h-4" />
          {showLabel && <span className="ml-2">{t('title')}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="[&_p]:text-sm flex flex-col gap-3">
        <p>{t('description')}</p>
        {url && (
          <div className="flex gap-2">
            <Input className="flex-1" defaultValue={url} readOnly />
            <CopyButton text={url} />
            <ShareUrlButton
              text={`Join my group ${group.name} on NexoGastos`}
              url={url}
            />
          </div>
        )}
        <p>
          <strong>{t('warning')}</strong> {t('warningHelp')}
        </p>
      </PopoverContent>
    </Popover>
  )
}
