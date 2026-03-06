'use client'

import { LocaleSwitcher } from '@/components/locale-switcher'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { FolderKanban, Home, Plus, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { PropsWithChildren } from 'react'

const primaryNav = [
  { href: '/', label: 'Inicio', icon: Home },
  { href: '/groups', label: 'Grupos', icon: FolderKanban },
  { href: '/groups/create', label: 'Nuevo grupo', icon: Plus },
]

export function AppShell({ children }: PropsWithChildren) {
  const pathname = usePathname()

  return (
    <div className="relative min-h-dvh overflow-hidden bg-[hsl(var(--app-bg))] text-foreground">
      <div className="app-grid pointer-events-none" />
      <div className="app-glow app-glow-left pointer-events-none" />
      <div className="app-glow app-glow-right pointer-events-none" />

      <div className="relative mx-auto flex min-h-dvh w-full max-w-[1600px]">
        <aside className="hidden w-[288px] shrink-0 border-r border-white/10 bg-[hsl(var(--sidebar))]/85 px-5 py-6 backdrop-blur xl:flex xl:flex-col">
          <Link href="/" className="app-wordmark">
            <span className="app-wordmark__mark">
              <Sparkles className="h-4 w-4" />
            </span>
            <span>
              <span className="block text-[10px] uppercase tracking-[0.28em] text-[hsl(var(--foreground)/0.55)]">
                NexoGastos
              </span>
              <span className="block font-heading text-2xl text-white">
                Shared money,
                <br />
                clear state.
              </span>
            </span>
          </Link>

          <nav className="mt-10 space-y-2" aria-label="Principal">
            {primaryNav.map((item) => {
              const Icon = item.icon
              const isActive =
                item.href === '/'
                  ? pathname === item.href
                  : pathname === item.href || pathname.startsWith(`${item.href}/`)

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn('app-sidebar-link', isActive && 'is-active')}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>

          <div className="mt-auto space-y-4">
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-4 text-sm text-[hsl(var(--foreground)/0.8)]">
              <p className="font-medium text-white">Pensado para gastos reales</p>
              <p className="mt-1 text-[13px] leading-5 text-[hsl(var(--foreground)/0.68)]">
                Abrí un grupo, cargá un gasto en segundos y liquidá sin perder el
                contexto.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <LocaleSwitcher />
              <ThemeToggle />
            </div>
          </div>
        </aside>

        <div className="flex min-h-dvh min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-40 border-b border-white/10 bg-[hsl(var(--app-bg))]/88 px-4 py-3 backdrop-blur md:px-6 xl:px-8">
            <div className="flex items-center justify-between gap-3">
              <Link href="/" className="flex min-w-0 items-center gap-3 xl:hidden">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-white shadow-[0_12px_32px_rgba(0,0,0,0.22)]">
                  <Sparkles className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-heading text-xl text-white">
                    NexoGastos
                  </span>
                  <span className="block truncate text-xs uppercase tracking-[0.24em] text-[hsl(var(--foreground)/0.55)]">
                    Expense cockpit
                  </span>
                </span>
              </Link>

              <nav
                className="hidden items-center gap-2 md:flex xl:hidden"
                aria-label="Principal"
              >
                {primaryNav.map((item) => {
                  const isActive =
                    item.href === '/'
                      ? pathname === item.href
                      : pathname === item.href ||
                        pathname.startsWith(`${item.href}/`)

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn('app-top-link', isActive && 'is-active')}
                    >
                      {item.label}
                    </Link>
                  )
                })}
              </nav>

              <div className="ml-auto flex items-center gap-2">
                <div className="hidden sm:flex sm:items-center sm:gap-2 xl:hidden">
                  <LocaleSwitcher />
                  <ThemeToggle />
                </div>
                <Button asChild className="h-10 rounded-2xl px-4">
                  <Link href="/groups/create">Crear grupo</Link>
                </Button>
              </div>
            </div>
          </header>

          <main className="relative flex-1 px-4 py-4 md:px-6 md:py-6 xl:px-8 xl:py-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
