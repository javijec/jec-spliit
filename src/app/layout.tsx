import { ApplePwaSplash } from '@/app/apple-pwa-splash'
import { AppShell } from '@/components/layout/app-shell'
import { PwaInstallButton } from '@/components/pwa-install-button'
import { ProgressBar } from '@/components/progress-bar'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/toaster'
import { env } from '@/lib/env'
import { TRPCProvider } from '@/trpc/client'
import { Instrument_Sans, Playfair_Display } from 'next/font/google'
import type { Metadata, Viewport } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import { Suspense } from 'react'
import './globals.css'

const bodyFont = Instrument_Sans({
  subsets: ['latin'],
  variable: '--font-body',
})

const headingFont = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-heading',
})

export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_BASE_URL),
  manifest: '/manifest.webmanifest',
  title: {
    default: 'NexoGastos · Gestión de Gastos',
    template: '%s · NexoGastos',
  },
  description:
    'NexoGastos es una app para compartir y gestionar gastos, basada en Spliit.',
  openGraph: {
    title: 'NexoGastos · Gestión de Gastos',
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
    title: 'NexoGastos · Gestión de Gastos',
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
  themeColor: '#0f172a',
}

function Content({ children }: { children: React.ReactNode }) {
  return (
    <TRPCProvider>
      <PwaInstallButton />
      <AppShell>{children}</AppShell>
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
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${bodyFont.variable} ${headingFont.variable}`}
    >
      <ApplePwaSplash icon="/logo.svg" color="#0f172a" />
      <body className="min-h-dvh bg-[hsl(var(--app-bg))] font-sans text-foreground antialiased">
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
