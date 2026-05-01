import { ApplePwaSplash } from '@/app/apple-pwa-splash'
import { AuthNav } from '@/components/auth-nav'
import { ConditionalFooter } from '@/components/conditional-footer'
import { LocaleSwitcher } from '@/components/locale-switcher'
import { ProgressBar } from '@/components/progress-bar'
import { PwaInstallButton } from '@/components/pwa-install-button'
import { ThemeProvider } from '@/components/theme-provider'
import { ThemeToggle } from '@/components/theme-toggle'
import { Toaster } from '@/components/ui/toaster'
import { getCurrentAuthSession } from '@/lib/auth'
import { env } from '@/lib/env'
import { TRPCProvider } from '@/trpc/client'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { FolderKanban } from 'lucide-react'
import type { Metadata, Viewport } from 'next'
import { NextIntlClientProvider, useTranslations } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import Image from 'next/image'
import Link from 'next/link'
import { Suspense } from 'react'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_BASE_URL),
  manifest: '/manifest.webmanifest',
  title: {
    default: 'NexoGastos · Gestion de Gastos',
    template: '%s · NexoGastos',
  },
  description:
    'NexoGastos es una app para compartir y gestionar gastos, basada en Spliit.',
  openGraph: {
    title: 'NexoGastos · Gestion de Gastos',
    description:
      'NexoGastos es una app para compartir y gestionar gastos, basada en Spliit.',
    images: `/banner.png`,
    type: 'website',
    url: '/',
  },
  twitter: {
    card: 'summary_large_image',
    creator: '@scastiel',
    site: '@scastiel',
    images: `/banner.png`,
    title: 'NexoGastos · Gestion de Gastos',
    description:
      'NexoGastos es una app para compartir y gestionar gastos, basada en Spliit.',
  },
  appleWebApp: {
    capable: true,
    title: 'NexoGastos',
  },
  applicationName: 'NexoGastos',
  icons: [
    {
      url: '/android-chrome-192x192.png',
      sizes: '192x192',
      type: 'image/png',
    },
    {
      url: '/android-chrome-512x512.png',
      sizes: '512x512',
      type: 'image/png',
    },
  ],
}

export const viewport: Viewport = {
  themeColor: '#047857',
  viewportFit: 'cover',
}

function Content({
  children,
  isAuthenticated,
}: {
  children: React.ReactNode
  isAuthenticated: boolean
}) {
  const t = useTranslations('Layout')
  return (
    <TRPCProvider>
      <header className="fixed left-0 right-0 top-0 z-50 border-b border-border/80 bg-background/92 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
        <div className="mx-auto flex h-14 w-full max-w-screen-xl items-center justify-between gap-3 px-3 sm:h-16 sm:px-4 lg:px-8">
          <Link
            className="flex min-w-0 items-center gap-2 rounded-md px-1 py-1 transition-colors hover:bg-secondary/70 sm:gap-3"
            href="/"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border/90 bg-card sm:h-9 sm:w-9">
              <Image
                src="/logo.svg"
                className="h-5 w-5 object-contain sm:h-6 sm:w-6"
                width={24}
                height={24}
                alt="NexoGastos"
              />
            </div>
            <div className="min-w-0 leading-none">
              <p className="truncate text-sm font-semibold tracking-tight sm:text-base">
                NexoGastos
              </p>
              <p className="hidden text-xs text-muted-foreground sm:block">
                {t('tagline')}
              </p>
            </div>
          </Link>
          <div
            role="navigation"
            aria-label="Menu"
            className="flex items-center gap-1.5 sm:gap-2"
          >
            <ButtonLink
              href={
                isAuthenticated
                  ? '/groups'
                  : '/auth/login?connection=google-oauth2'
              }
              label={t('groupsCta')}
            />
            <AuthNav />
            <ul className="flex items-center gap-0.5 border-l border-border/70 pl-1 text-sm sm:gap-1 sm:pl-2">
              <li>
                <PwaInstallButton />
              </li>
              <li>
                <LocaleSwitcher />
              </li>
              <li>
                <ThemeToggle />
              </li>
            </ul>
          </div>
        </div>
      </header>

      <div className="app-shell box-border flex min-h-[100dvh] flex-col pt-[calc(3.5rem+env(safe-area-inset-top))] sm:pt-[calc(4rem+env(safe-area-inset-top))]">
        <div className="relative z-10 flex min-h-0 flex-1 flex-col">
          {children}
        </div>
      </div>

      <ConditionalFooter footerDescription={t('footerDescription')} />
      <Toaster />
    </TRPCProvider>
  )
}

function ButtonLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="hidden h-9 items-center gap-2 rounded-md border border-border/90 bg-card px-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary/80 sm:inline-flex"
    >
      <FolderKanban className="h-4 w-4 text-primary" />
      <span>{label}</span>
    </Link>
  )
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const locale = await getLocale()
  const messages = await getMessages()
  const session = await getCurrentAuthSession()
  return (
    <html lang={locale} suppressHydrationWarning>
      <ApplePwaSplash icon="/logo.svg" color="#027756" />
      <body className="flex min-h-[100dvh] flex-col items-stretch overflow-x-hidden">
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <Suspense>
              <ProgressBar />
            </Suspense>
            <Content isAuthenticated={!!session}>{children}</Content>
            <SpeedInsights
              sampleRate={env.NEXT_PUBLIC_SPEED_INSIGHTS_SAMPLE_RATE}
            />
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
