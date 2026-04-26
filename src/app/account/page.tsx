import { Button } from '@/components/ui/button'
import {
  GroupSectionCard,
  GroupSectionContent,
  GroupSectionHeader,
} from '@/components/ui/group-section-card'
import { PageContainer } from '@/components/ui/page-container'
import { SectionHeader } from '@/components/ui/page-header'
import { getCurrentAppUser, getCurrentAuthSession } from '@/lib/auth'
import { auth0Enabled } from '@/lib/env'
import { getTranslations } from 'next-intl/server'
import { AccountProfileShell } from './account-profile-shell'

export default async function AccountPage() {
  const t = await getTranslations('Account')
  const session = await getCurrentAuthSession()
  const user = session ? await getCurrentAppUser() : null

  if (!auth0Enabled || !session || !user) {
    return (
      <PageContainer width="narrow">
        <div className="space-y-3">
          <GroupSectionCard>
            <GroupSectionHeader>
              <SectionHeader
                title={t('signInTitle')}
                description={t('signInDescription')}
              />
            </GroupSectionHeader>
            <GroupSectionContent>
              <Button asChild className="sm:w-auto">
                <a href="/auth/login?connection=google-oauth2">
                  {t('signInAction')}
                </a>
              </Button>
            </GroupSectionContent>
          </GroupSectionCard>
        </div>
      </PageContainer>
    )
  }

  return <AccountProfileShell initialUser={user} />
}
