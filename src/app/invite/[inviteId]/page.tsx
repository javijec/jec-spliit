import { acceptInviteForCurrentUser, getGroupInvite } from '@/lib/group-invites'
import { getCurrentAuthSession } from '@/lib/auth'
import { auth0Enabled } from '@/lib/env'
import { isRedirectError } from 'next/dist/client/components/redirect-error'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'

export default async function InvitePage({
  params,
}: {
  params: Promise<{ inviteId: string }>
}) {
  const { inviteId } = await params
  const invite = await getGroupInvite(inviteId)

  if (!invite) {
    notFound()
  }

  if (invite.expiresAt.getTime() < Date.now()) {
    return (
      <main className="mx-auto flex min-h-[60vh] w-full max-w-xl items-center px-4 py-10">
        <div className="w-full rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
          <h1 className="text-xl font-semibold tracking-tight">
            Invitacion vencida
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Esta invitacion ya no esta disponible. Pide un nuevo link para unirte
            al grupo.
          </p>
          <Link
            href="/"
            className="mt-4 inline-flex rounded-md border border-border px-4 py-2 text-sm font-medium"
          >
            Volver al inicio
          </Link>
        </div>
      </main>
    )
  }

  if (auth0Enabled) {
    const session = await getCurrentAuthSession()
    if (!session) {
      redirect(
        `/auth/login?connection=google-oauth2&returnTo=${encodeURIComponent(`/invite/${inviteId}`)}`,
      )
    }
  }

  try {
    const accepted = await acceptInviteForCurrentUser(inviteId)
    redirect(`/groups/${accepted.groupId}/summary`)
  } catch (error) {
    if (isRedirectError(error)) {
      throw error
    }

    const message =
      error instanceof Error ? error.message : 'No pudimos procesar la invitacion.'

    return (
      <main className="mx-auto flex min-h-[60vh] w-full max-w-xl items-center px-4 py-10">
        <div className="w-full rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
          <h1 className="text-xl font-semibold tracking-tight">
            No pudimos unirte al grupo
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{message}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/groups"
              className="inline-flex rounded-md border border-border px-4 py-2 text-sm font-medium"
            >
              Ir a mis grupos
            </Link>
            <Link
              href="/"
              className="inline-flex rounded-md border border-border px-4 py-2 text-sm font-medium"
            >
              Volver al inicio
            </Link>
          </div>
        </div>
      </main>
    )
  }
}
