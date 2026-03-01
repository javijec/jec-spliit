'use client'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Locale, localeLabels } from '@/i18n/request'
import { setUserLocale } from '@/lib/locale'
import { Languages } from 'lucide-react'
import { useLocale } from 'next-intl'

export function LocaleSwitcher() {
  const locale = useLocale() as Locale
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="-my-3 text-primary"
          aria-label={`Idioma actual: ${localeLabels[locale]}`}
          title="Cambiar idioma"
        >
          <Languages className="h-4 w-4" />
          <span className="sr-only">{localeLabels[locale]}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {Object.entries(localeLabels).map(([locale, label]) => (
          <DropdownMenuItem
            key={locale}
            onClick={() => setUserLocale(locale as Locale)}
          >
            {label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
