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

const AVAILABLE_LOCALES: Locale[] = ['es', 'en-US']

export function LocaleSwitcher() {
  const locale = useLocale() as Locale
  const visibleLocale = AVAILABLE_LOCALES.includes(locale) ? locale : 'es'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="-my-3 text-foreground"
          aria-label={`Idioma actual: ${localeLabels[visibleLocale]}`}
          title="Cambiar idioma"
        >
          <Languages className="h-4 w-4" />
          <span className="sr-only">{localeLabels[visibleLocale]}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {AVAILABLE_LOCALES.map((availableLocale) => (
          <DropdownMenuItem
            key={availableLocale}
            onClick={() => setUserLocale(availableLocale)}
          >
            {localeLabels[availableLocale]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
