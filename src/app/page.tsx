import { Button } from '@/components/ui/button'
import { getCurrentAuthSession } from '@/lib/auth'
import {
  ArrowRight,
  CheckCircle2,
  FolderKanban,
  HandCoins,
  ReceiptText,
  Users,
} from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import type { ComponentType } from 'react'

export default async function HomePage() {
  const t = await getTranslations()
  const session = await getCurrentAuthSession()
  const groupsHref = session
    ? '/groups'
    : '/auth/login?connection=google-oauth2'
  const primaryCta = session
    ? t('Homepage.button.groups')
    : 'Ingresar con Google'

  return (
    <main className="relative overflow-hidden px-3 pb-5 pt-3 sm:px-6 sm:pb-8 sm:pt-5">
      <div className="relative mx-auto w-full max-w-screen-xl">
        <section className="grid min-h-[calc(100dvh-8rem)] items-center gap-8 py-6 sm:min-h-[calc(100dvh-10rem)] lg:grid-cols-[0.92fr_1.08fr] lg:gap-10">
          <div className="max-w-2xl">
            <div className="space-y-4 sm:space-y-5">
              <h1 className="landing-header max-w-[12ch] text-balance text-[2.7rem] font-semibold leading-[0.93] tracking-tight sm:text-[4.4rem] lg:text-[5.2rem]">
                {t.rich('Homepage.title', {
                  strong: (chunks) => <strong>{chunks}</strong>,
                })}
              </h1>

              <p className="max-w-[34rem] text-pretty text-base text-muted-foreground sm:text-lg">
                {t.rich('Homepage.description', {
                  strong: (chunks) => <strong>{chunks}</strong>,
                })}
              </p>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button asChild className="h-11 w-full sm:w-auto sm:min-w-44">
                <Link href={groupsHref}>
                  {!session && <GoogleMark />}
                  {primaryCta}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-11 w-full sm:w-auto sm:min-w-36"
              >
                <Link href={session ? '/groups/create' : groupsHref}>
                  <FolderKanban className="h-4 w-4" />
                  {t('Homepage.secondaryCta')}
                </Link>
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

          <div className="relative min-w-0">
            <div className="overflow-hidden rounded-xl border border-border/90 bg-card shadow-sm">
              <div className="flex items-center justify-between border-b border-border/80 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    Viaje a Mendoza
                  </p>
                  <p className="text-xs text-muted-foreground">
                    4 participantes
                  </p>
                </div>
                <div className="rounded-md border border-primary/20 bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                  ARS
                </div>
              </div>
              <div className="grid gap-0 lg:grid-cols-[1fr_15rem]">
                <div className="divide-y divide-border/70">
                  <ExpensePreview
                    title="Cena del viernes"
                    person="Pago: Juli"
                    amount="$ 48.200"
                  />
                  <ExpensePreview
                    title="Nafta ruta 7"
                    person="Pago: Nico"
                    amount="$ 36.900"
                  />
                  <ExpensePreview
                    title="Supermercado"
                    person="Pago: Ana"
                    amount="$ 29.540"
                  />
                  <ExpensePreview
                    title="Cabaña"
                    person="Pago: Tomi"
                    amount="$ 180.000"
                  />
                </div>
                <div className="border-t border-border/80 bg-secondary/35 p-4 lg:border-l lg:border-t-0">
                  <p className="text-sm font-semibold">Balances</p>
                  <div className="mt-4 space-y-3">
                    <BalancePreview name="Ana" value="+$ 18.320" positive />
                    <BalancePreview name="Juli" value="+$ 9.100" positive />
                    <BalancePreview name="Nico" value="-$ 11.740" />
                    <BalancePreview name="Tomi" value="-$ 15.680" />
                  </div>
                  <div className="mt-5 flex items-center gap-2 rounded-md border border-border/80 bg-card px-3 py-2 text-xs text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    Listo para liquidar
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

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

function ExpensePreview({
  title,
  person,
  amount,
}: {
  title: string
  person: string
  amount: string
}) {
  return (
    <div className="flex flex-col items-start gap-1 px-4 py-3 lg:flex-row lg:items-center lg:justify-between lg:gap-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{person}</p>
      </div>
      <p className="text-sm font-semibold tabular-nums">{amount}</p>
    </div>
  )
}

function BalancePreview({
  name,
  value,
  positive = false,
}: {
  name: string
  value: string
  positive?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{name}</span>
      <span
        className={
          positive
            ? 'font-semibold text-primary'
            : 'font-semibold text-foreground'
        }
      >
        {value}
      </span>
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
