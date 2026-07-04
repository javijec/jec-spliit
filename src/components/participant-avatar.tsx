import { cn } from '@/lib/utils'

type ParticipantAvatarProps = {
  name: string
  className?: string
  size?: 'sm' | 'md'
}

const participantPalette = [
  'bg-emerald-600 text-white',
  'bg-sky-600 text-white',
  'bg-violet-600 text-white',
  'bg-fuchsia-600 text-white',
  'bg-amber-600 text-white',
  'bg-rose-600 text-white',
  'bg-cyan-700 text-white',
  'bg-teal-700 text-white',
]

export function ParticipantAvatar({ name, className, size = 'md' }: ParticipantAvatarProps) {
  const label = name.trim() || '?'
  const initials = getParticipantInitials(label)
  const paletteClass = participantPalette[hashParticipantName(label) % participantPalette.length]

  return (
    <span
      className={cn(
        'inline-flex shrink-0 select-none items-center justify-center rounded-full font-semibold tracking-normal',
        size === 'sm' ? 'h-7 w-7 text-[11px]' : 'h-9 w-9 text-xs',
        paletteClass,
        className,
      )}
      aria-hidden="true"
    >
      {initials}
    </span>
  )
}

function getParticipantInitials(name: string) {
  const parts = name
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean)

  if (parts.length === 0) {
    return '?'
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

function hashParticipantName(name: string) {
  let hash = 0
  for (let index = 0; index < name.length; index += 1) {
    hash = (hash * 31 + name.charCodeAt(index)) | 0
  }
  return Math.abs(hash)
}
