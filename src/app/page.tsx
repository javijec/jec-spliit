import { Button } from '@/components/ui/button'
import { getCurrentAuthSession } from '@/lib/auth'
import {
  ArrowRight,
  FolderKanban,
  HandCoins,
  ReceiptText,
  Users,
} from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import type { ComponentPropsWithoutRef, ComponentType, ReactNode } from 'react'
import { forwardRef } from 'react'

export default async function HomePage() {
  const t = await getTranslations()
  const session = await getCurrentAuthSession()
  const groupsHref = session
    ? '/groups'
    : '/auth/login?connection=google-oauth2&returnTo=%2Fgroups'
  const createGroupHref = session
    ? '/groups/create'
    : '/auth/login?connection=google-oauth2&returnTo=%2Fgroups%2Fcreate'
  const primaryCta = session
    ? t('Homepage.button.groups')
    : t('Account.signInAction')

  return (
    <main className="relative overflow-hidden px-3 pb-5 pt-3 sm:px-6 sm:pb-8 sm:pt-5">
      <div className="relative mx-auto w-full max-w-screen-xl">
        <section className="flex items-start justify-center py-6">
          <div className="w-full max-w-2xl">
            <div className="space-y-4 sm:space-y-5">
              <h1 className="landing-header max-w-[12ch] text-balance text-[2.5rem] font-semibold leading-[0.96] tracking-tight sm:text-[4rem] lg:text-[4.8rem]">
                {t.rich('Homepage.title', {
                  strong: (chunks) => <strong>{chunks}</strong>,
                })}
              </h1>

              <p className="max-w-[34rem] text-pretty text-base leading-7 text-muted-foreground">
                {t.rich('Homepage.description', {
                  strong: (chunks) => <strong>{chunks}</strong>,
                })}
              </p>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button asChild className="h-11 w-full sm:w-auto sm:min-w-44">
                <NavigationLink href={groupsHref}>
                  {!session && <GoogleMark />}
                  {primaryCta}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </NavigationLink>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-11 w-full sm:w-auto sm:min-w-36"
              >
                <NavigationLink href={createGroupHref}>
                  <FolderKanban className="h-4 w-4" />
                  {t('Homepage.secondaryCta')}
                </NavigationLink>
              </Button>
            </div>

            <div className="mt-8 grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
              <Feature
                icon={ReceiptText}
                label={t('Homepage.features.clearExpenses.title')}
              />
              <Feature
                icon={HandCoins}
                label={t('Homepage.features.fastBalances.title')}
              />
              <Feature
                icon={Users}
                label={t('Homepage.features.simpleFlow.title')}
              />
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

type NavigationLinkProps = Omit<
  ComponentPropsWithoutRef<'a'>,
  'href' | 'children'
> & {
  href: string
  children: ReactNode
}

const NavigationLink = forwardRef<HTMLAnchorElement, NavigationLinkProps>(
  ({ href, children, ...props }, ref) => {
    return href.startsWith('/auth/login') ? (
      <a ref={ref} href={href} {...props}>
        {children}
      </a>
    ) : (
      <Link ref={ref} href={href} {...props}>
        {children}
      </Link>
    )
  },
)
NavigationLink.displayName = 'NavigationLink'

function Feature({
  icon: Icon,
  label,
}: {
  icon: ComponentType<{ className?: string }>
  label: string
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-primary" />
      <span>{label}</span>
    </div>
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
