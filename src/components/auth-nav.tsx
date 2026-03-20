import { auth0Enabled } from '@/lib/env'
import { getCurrentAuthSession } from '@/lib/auth'

export async function AuthNav() {
  if (!auth0Enabled) return null

  const session = await getCurrentAuthSession()
  const displayName =
    typeof session?.user.name === 'string'
      ? session.user.name
      : typeof session?.user.email === 'string'
        ? session.user.email
        : null

  if (!session) {
    return (
      <a
        href="/auth/login?connection=google-oauth2"
        className="inline-flex items-center rounded-md border bg-card px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
      >
        Ingresar con Google
      </a>
    )
  }

  return (
    <div className="hidden items-center gap-2 sm:flex">
      {displayName && (
        <span className="max-w-40 truncate text-sm text-muted-foreground">
          {displayName}
        </span>
      )}
      <a
        href="/auth/logout"
        className="inline-flex items-center rounded-md border bg-card px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
      >
        Salir
      </a>
    </div>
  )
}
