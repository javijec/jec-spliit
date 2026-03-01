import { ApplePwaSplash } from '@/app/apple-pwa-splash'
import { LocaleSwitcher } from '@/components/locale-switcher'
import { ProgressBar } from '@/components/progress-bar'
import { ThemeProvider } from '@/components/theme-provider'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import { Toaster } from '@/components/ui/toaster'
import { env } from '@/lib/env'
import { TRPCProvider } from '@/trpc/client'
import type { Metadata, Viewport } from 'next'
import { NextIntlClientProvider, useTranslations } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import Image from 'next/image'
import Link from 'next/link'
import { Suspense } from 'react'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_BASE_URL),
  title: {
    default: 'Javijec · Gestión de Gastos',
    template: '%s · Javijec',
  },
  description:
    'Javijec es una app para compartir y gestionar gastos, basada en Spliit.',
  openGraph: {
    title: 'Javijec · Gestión de Gastos',
    description:
      'Javijec es una app para compartir y gestionar gastos, basada en Spliit.',
    images: `/banner.png`,
    type: 'website',
    url: '/',
  },
  twitter: {
    card: 'summary_large_image',
    creator: '@scastiel',
    site: '@scastiel',
    images: `/banner.png`,
    title: 'Javijec · Gestión de Gastos',
    description:
      'Javijec es una app para compartir y gestionar gastos, basada en Spliit.',
  },
  appleWebApp: {
    capable: true,
    title: 'Javijec',
  },
  applicationName: 'Javijec',
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
}

function Content({ children }: { children: React.ReactNode }) {
  const t = useTranslations()
  return (
    <TRPCProvider>
      <header className="fixed top-0 left-0 right-0 h-16 bg-white/70 dark:bg-gray-950/70 border-b backdrop-blur-sm z-50">
        <div className="h-full w-full max-w-screen-xl mx-auto px-3 sm:px-4 lg:px-8 flex items-center justify-between gap-2">
          <Link
            className="flex items-center gap-2 hover:scale-105 transition-transform"
            href="/"
          >
            <h1>
              <Image
                src="/javijec-logo.svg"
                className="m-1 h-auto w-auto"
                width={152}
                height={35}
                alt="Javijec"
              />
            </h1>
          </Link>
          <div role="navigation" aria-label="Menu" className="flex">
            <ul className="flex items-center text-sm gap-0.5 sm:gap-1">
              <li>
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="text-primary px-2.5 sm:px-3"
                >
                  <Link href="/groups">{t('Header.groups')}</Link>
                </Button>
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

      <div className="pt-16 flex-1 flex flex-col">{children}</div>

      <footer className="bg-slate-50 dark:bg-card border-t mt-8 sm:mt-16">
        <div className="w-full max-w-screen-xl mx-auto px-4 lg:px-8 py-6 sm:py-8 md:py-12 flex flex-col sm:flex-row sm:justify-between gap-4 text-xs sm:text-sm md:text-base [&_a]:underline">
          <div className="flex flex-col space-y-2">
            <div className="sm:text-lg font-semibold text-base flex space-x-2 items-center">
              <Link className="flex items-center gap-2" href="/">
                <Image
                  src="/javijec-logo.svg"
                  className="m-1 h-auto w-auto"
                  width={152}
                  height={35}
                  alt="Javijec"
                />
              </Link>
            </div>
            <div className="flex flex-col space-y a--no-underline-text-white">
              <span>
                Hecho por{' '}
                <a
                  href="https://github.com/javijec"
                  target="_blank"
                  rel="noopener"
                >
                  Javijec
                </a>{' '}
                · Basada en{' '}
                <a
                  href="https://github.com/spliit-app/spliit/"
                  target="_blank"
                  rel="noopener"
                >
                  Spliit
                </a>
              </span>
            </div>
          </div>
        </div>
      </footer>
      <Toaster />
    </TRPCProvider>
  )
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const locale = await getLocale()
  const messages = await getMessages()
  return (
    <html lang={locale} suppressHydrationWarning>
      <ApplePwaSplash icon="/javijec-logo.svg" color="#027756" />
      <body className="min-h-[100dvh] flex flex-col items-stretch bg-slate-50 bg-opacity-30 dark:bg-background">
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
            <Content>{children}</Content>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
