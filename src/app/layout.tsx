import { ApplePwaSplash } from '@/app/apple-pwa-splash'
import { AuthNav } from '@/components/auth-nav'
import { ConditionalFooter } from '@/components/conditional-footer'
import { LocaleSwitcher } from '@/components/locale-switcher'
import { PwaInstallButton } from '@/components/pwa-install-button'
import { ProgressBar } from '@/components/progress-bar'
import { ThemeProvider } from '@/components/theme-provider'
import { ThemeToggle } from '@/components/theme-toggle'
import { Toaster } from '@/components/ui/toaster'
import { env } from '@/lib/env'
import { getCurrentAuthSession } from '@/lib/auth'
import { TRPCProvider } from '@/trpc/client'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { FolderKanban } from 'lucide-react'
import type { Metadata, Viewport } from 'next'
import Image from 'next/image'
import { NextIntlClientProvider, useTranslations } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
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
      <header className="fixed left-0 right-0 top-0 z-50 border-b bg-background pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex h-16 w-full max-w-screen-xl items-center justify-between gap-3 px-3 sm:px-4 lg:px-8">
          <Link
            className="flex items-center gap-3 rounded-md px-1 py-1 transition-colors hover:bg-secondary"
            href="/"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-md border bg-card">
              <Image
                src="/logo.svg"
                className="h-5 w-5 object-contain sm:h-6 sm:w-6"
                width={24}
                height={24}
                alt="NexoGastos"
              />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold tracking-tight sm:text-base">
                NexoGastos
              </p>
              <p className="hidden text-xs text-muted-foreground sm:block">
                {t('tagline')}
              </p>
            </div>
          </Link>
          <div role="navigation" aria-label="Menu" className="flex items-center gap-2">
            <ButtonLink
              href={isAuthenticated ? '/groups' : '/auth/login?connection=google-oauth2'}
              label={t('groupsCta')}
            />
            <AuthNav />
            <ul className="flex items-center gap-0.5 text-sm sm:gap-1">
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

      <div className="app-shell box-border flex min-h-[100dvh] flex-col pt-[calc(4rem+env(safe-area-inset-top))]">
        <div className="relative z-10 flex min-h-0 flex-1 flex-col">{children}</div>
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
      className="hidden items-center gap-2 rounded-md border bg-card px-3 py-2 text-sm text-foreground transition-colors hover:bg-secondary sm:inline-flex"
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
