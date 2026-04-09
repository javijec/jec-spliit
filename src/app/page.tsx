import { Button } from '@/components/ui/button'
import { getCurrentAuthSession } from '@/lib/auth'
import {
  ArrowRight,
  FolderKanban,
} from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'

export default async function HomePage() {
  const t = await getTranslations()
  const session = await getCurrentAuthSession()
  const groupsHref = session ? '/groups' : '/auth/login?connection=google-oauth2'
  const primaryCta = session ? t('Homepage.button.groups') : 'Ingresar con Google'

  return (
    <main className="relative overflow-hidden px-4 pb-4 pt-4 sm:px-6 sm:pb-6 sm:pt-6">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-8rem] top-8 h-56 w-56 rounded-full bg-primary/12 blur-3xl sm:h-72 sm:w-72" />
        <div className="absolute right-[-5rem] top-36 h-48 w-48 rounded-full bg-emerald-300/20 blur-3xl dark:bg-emerald-400/10" />
        <div className="absolute bottom-8 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-secondary/70 blur-3xl" />
      </div>

      <div className="relative mx-auto flex w-full max-w-screen-xl flex-col">
        <section className="relative overflow-hidden rounded-[1.75rem] border border-border/80 bg-[linear-gradient(180deg,hsl(var(--card))_0%,hsl(var(--background))_100%)] shadow-[0_24px_80px_hsl(var(--foreground)/0.08)]">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
          <div className="px-4 py-5 sm:px-6 sm:py-6 lg:px-10 lg:py-8">
            <div className="relative z-10 mx-auto max-w-[42rem] text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/[0.07] px-3 py-1 text-xs font-medium text-primary sm:text-sm">
                <FolderKanban className="h-3.5 w-3.5" />
                <span>{t('Layout.groupsCta')}</span>
              </div>

              <div className="mt-4 space-y-3 sm:mt-5 sm:space-y-4">
                <h1 className="landing-header mx-auto max-w-[11ch] text-balance text-[2.4rem] font-semibold leading-[0.92] tracking-[-0.04em] sm:text-[3.3rem] lg:text-[4rem]">
                  {t.rich('Homepage.title', {
                    strong: (chunks) => <strong>{chunks}</strong>,
                  })}
                </h1>

                <p className="mx-auto max-w-[34rem] text-pretty text-sm text-muted-foreground sm:text-base">
                  {t.rich('Homepage.description', {
                    strong: (chunks) => <strong>{chunks}</strong>,
                  })}
                </p>
              </div>

              <div className="mt-5 flex justify-center sm:mt-6">
                <Button asChild className="h-11 min-w-full sm:min-w-44">
                  <Link href={groupsHref}>
                    {!session && <GoogleMark />}
                    {primaryCta}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

function GoogleMark() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="mr-2 h-4 w-4 shrink-0"
    >
      <path
        fill="#4285F4"
        d="M21.6 12.23c0-.68-.06-1.33-.17-1.95H12v3.69h5.39a4.6 4.6 0 0 1-2 3.02v2.5h3.24c1.9-1.75 2.97-4.34 2.97-7.26Z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.96-.9 6.61-2.43l-3.24-2.5c-.9.6-2.04.96-3.37.96-2.59 0-4.78-1.75-5.56-4.1H3.09v2.58A9.99 9.99 0 0 0 12 22Z"
      />
      <path
        fill="#FBBC05"
        d="M6.44 13.93A5.98 5.98 0 0 1 6.13 12c0-.67.11-1.31.31-1.93V7.49H3.09A9.99 9.99 0 0 0 2 12c0 1.61.39 3.13 1.09 4.51l3.35-2.58Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.97c1.47 0 2.79.5 3.83 1.5l2.87-2.87C16.95 2.98 14.69 2 12 2A9.99 9.99 0 0 0 3.09 7.49l3.35 2.58c.78-2.35 2.97-4.1 5.56-4.1Z"
      />
    </svg>
  )
}
