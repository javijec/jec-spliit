import { auth0Enabled } from '@/lib/env'
import { getCurrentAuthSession } from '@/lib/auth'
import Link from 'next/link'

const getInitials = (value: string) =>
  value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || '?'

export async function AuthNav() {
  if (!auth0Enabled) return null

  const session = await getCurrentAuthSession()
  const displayName =
    typeof session?.user.name === 'string'
      ? session.user.name
      : typeof session?.user.email === 'string'
        ? session.user.email
        : null
  const avatarUrl =
    typeof session?.user.picture === 'string' ? session.user.picture : null

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
    <>
      <div className="sm:hidden">
        <Link
          href="/account"
          className="inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border bg-card transition-colors hover:bg-secondary"
          aria-label={displayName ? `Perfil de ${displayName}` : 'Perfil'}
          title={displayName ?? 'Perfil'}
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName ?? 'Usuario'}
              className="h-full w-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <span className="text-xs font-semibold text-foreground">
              {getInitials(displayName ?? 'U')}
            </span>
          )}
        </Link>
      </div>
      <div className="hidden items-center gap-2 sm:flex">
        <Link
          href="/account"
          className="inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border bg-card transition-colors hover:bg-secondary"
          aria-label={displayName ? `Perfil de ${displayName}` : 'Perfil'}
          title={displayName ?? 'Perfil'}
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName ?? 'Usuario'}
              className="h-full w-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <span className="text-xs font-semibold text-foreground">
              {getInitials(displayName ?? 'U')}
            </span>
          )}
        </Link>
        {displayName && (
          <Link
            href="/account"
            className="max-w-40 truncate text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            {displayName}
          </Link>
        )}
        <a
          href="/auth/logout"
          className="inline-flex items-center rounded-md border bg-card px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
        >
          Salir
        </a>
      </div>
    </>
  )
}
