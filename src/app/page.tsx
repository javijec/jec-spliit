import { Button } from '@/components/ui/button'
import {
  ArrowRight,
  FolderKanban,
  HandCoins,
  ReceiptText,
  Smartphone,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'

export default function HomePage() {
  const t = useTranslations()
  return (
    <main className="px-4 pb-6 pt-4 sm:px-6 sm:pb-10 sm:pt-8">
      <div className="mx-auto flex w-full max-w-screen-xl flex-col gap-6 lg:gap-8">
        <section className="grid w-full gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(20rem,0.85fr)] lg:gap-8">
          <div className="border-b border-border pb-6 sm:pb-8">
            <div className="max-w-[42rem] space-y-5">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FolderKanban className="h-4 w-4 text-primary" />
                <span>{t('Layout.groupsCta')}</span>
              </div>
              <h1 className="landing-header max-w-[11ch] text-4xl font-semibold leading-[0.98] sm:text-5xl lg:text-[4.2rem]">
                {t.rich('Homepage.title', {
                  strong: (chunks) => <strong>{chunks}</strong>,
                })}
              </h1>
              <p className="max-w-xl text-base text-muted-foreground sm:text-lg">
                {t.rich('Homepage.description', {
                  strong: (chunks) => <strong>{chunks}</strong>,
                })}
              </p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button asChild className="sm:min-w-44">
                  <Link href="/groups">
                    {t('Homepage.button.groups')}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="sm:min-w-40">
                  <Link href="/groups/create">{t('Homepage.secondaryCta')}</Link>
                </Button>
              </div>
            </div>
          </div>

          <aside className="border border-border bg-card">
            <div className="border-b px-4 py-3 sm:px-5">
              <p className="text-sm font-medium text-foreground">
                {t('Homepage.button.groups')}
              </p>
            </div>
            <div className="grid gap-0">
              <FeatureRow
                icon={Smartphone}
                title={t('Homepage.features.simpleFlow.title')}
                description={t('Homepage.features.simpleFlow.description')}
              />
              <FeatureRow
                icon={ReceiptText}
                title={t('Homepage.features.clearExpenses.title')}
                description={t('Homepage.features.clearExpenses.description')}
              />
              <FeatureRow
                icon={HandCoins}
                title={t('Homepage.features.fastBalances.title')}
                description={t('Homepage.features.fastBalances.description')}
                last
              />
            </div>
          </aside>
        </section>

        <section className="border border-border">
          <div className="grid divide-y divide-border md:grid-cols-3 md:divide-x md:divide-y-0">
            <CompactFeature
              index="01"
              title={t('Homepage.features.simpleFlow.title')}
              description={t('Homepage.features.simpleFlow.description')}
            />
            <CompactFeature
              index="02"
              title={t('Homepage.features.clearExpenses.title')}
              description={t('Homepage.features.clearExpenses.description')}
            />
            <CompactFeature
              index="03"
              title={t('Homepage.features.fastBalances.title')}
              description={t('Homepage.features.fastBalances.description')}
            />
          </div>
        </section>
      </div>
    </main>
  )
}

function CompactFeature({
  index,
  title,
  description,
}: {
  index: string
  title: string
  description: string
}) {
  return (
    <div className="px-4 py-4 sm:px-5 sm:py-5">
      <p className="text-[11px] font-medium tracking-[0.18em] text-muted-foreground">
        {index}
      </p>
      <p className="mt-3 text-sm font-medium text-foreground sm:text-base">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  )
}

function FeatureRow({
  icon: Icon,
  title,
  description,
  last = false,
}: {
  icon: typeof Smartphone
  title: string
  description: string
  last?: boolean
}) {
  return (
    <div className={`px-4 py-4 sm:px-5 ${last ? '' : 'border-b'}`}>
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <div>
          <p className="text-sm font-medium text-foreground sm:text-base">{title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    </div>
  )
}
