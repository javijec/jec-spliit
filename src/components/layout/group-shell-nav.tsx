'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  ArrowRightLeft,
  BarChart3,
  ReceiptText,
  Settings2,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  {
    href: (groupId: string) => `/groups/${groupId}/expenses`,
    label: 'Resumen',
    icon: ReceiptText,
    match: /^\/groups\/[^/]+(?:\/expenses)?(?:\/create|\/[^/]+\/edit)?$/,
  },
  {
    href: (groupId: string) => `/groups/${groupId}/balances`,
    label: 'Liquidar',
    icon: ArrowRightLeft,
    match: /^\/groups\/[^/]+\/balances$/,
  },
  {
    href: (groupId: string) => `/groups/${groupId}/stats`,
    label: 'Stats',
    icon: BarChart3,
    match: /^\/groups\/[^/]+\/stats$/,
  },
  {
    href: (groupId: string) => `/groups/${groupId}/edit`,
    label: 'Ajustes',
    icon: Settings2,
    match: /^\/groups\/[^/]+\/edit$/,
  },
]

export function GroupDesktopNav({ groupId }: { groupId: string }) {
  const pathname = usePathname()

  return (
    <nav className="hidden md:flex md:flex-wrap md:gap-2" aria-label="Grupo">
      {navItems.map((item) => {
        const Icon = item.icon
        const isActive = item.match.test(pathname)

        return (
          <Link
            key={item.label}
            href={item.href(groupId)}
            className={cn('group-tab-link', isActive && 'is-active')}
          >
            <Icon className="h-4 w-4" />
            <span>{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}

export function GroupMobileNav({ groupId }: { groupId: string }) {
  const pathname = usePathname()

  return (
    <nav
      className="fixed inset-x-0 bottom-[env(safe-area-inset-bottom)] z-40 px-3 pb-3 md:hidden"
      aria-label="Grupo"
    >
      <div className="grid grid-cols-4 gap-2 rounded-[28px] border border-white/10 bg-[hsl(var(--sidebar))]/94 p-2 shadow-[0_20px_55px_rgba(0,0,0,0.38)] backdrop-blur-xl">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = item.match.test(pathname)

          return (
            <Button
              key={item.label}
              asChild
              variant="ghost"
              className={cn(
                'h-14 rounded-[20px] px-1 text-[11px] text-[hsl(var(--foreground)/0.72)]',
                isActive &&
                  'bg-white text-slate-950 shadow-[0_10px_24px_rgba(255,255,255,0.18)] hover:bg-white',
              )}
            >
              <Link
                href={item.href(groupId)}
                className="flex h-full flex-col items-center justify-center gap-1"
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            </Button>
          )
        })}
      </div>
    </nav>
  )
}
