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
  const url = baseUrl && `${baseUrl}/groups/${group.id}/summary?ref=share`

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          title={t('title')}
          size={size}
          variant={variant}
          className={cn('flex-shrink-0', className)}
        >
          <Share className="h-4 w-4" />
          {showLabel && <span className="ml-2">{t('title')}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(28rem,calc(100vw-2rem))] space-y-4">
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">{t('title')}</p>
          <p className="text-sm text-muted-foreground">{t('description')}</p>
        </div>
        {url && (
          <div className="space-y-2">
            <div className="border border-border bg-muted/20 p-2">
              <Input
                className="h-10 border-0 bg-transparent px-1 py-0 text-sm shadow-none focus-visible:ring-0"
                defaultValue={url}
                readOnly
              />
            </div>
            <div className="flex gap-2">
              <CopyButton text={url} />
              <ShareUrlButton
                text={t('shareMessage', { groupName: group.name })}
                url={url}
              />
            </div>
          </div>
        )}
        <div className="border-t border-border pt-3 text-sm text-muted-foreground">
          <strong className="font-medium text-foreground">{t('warning')}</strong>{' '}
          {t('warningHelp')}
        </div>
      </PopoverContent>
    </Popover>
  )
}
