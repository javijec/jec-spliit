'use client'

import { ExternalLink } from 'lucide-react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

function FooterLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      className="inline-flex items-center gap-1 rounded-md border px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground sm:text-sm"
    >
      <span>{label}</span>
      <ExternalLink className="h-3.5 w-3.5" />
    </a>
  )
}

export function ConditionalFooter({
  footerDescription,
}: {
  footerDescription: string
}) {
  const pathname = usePathname()

  if (pathname !== '/') {
    return null
  }

  return (
    <footer id="app-footer" className="mt-8 border-t bg-background sm:mt-14">
      <div className="mx-auto grid w-full max-w-screen-xl gap-6 px-4 py-6 sm:py-8 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md border bg-card">
              <Image
                src="/logo.svg"
                className="h-5 w-5 object-contain"
                width={20}
                height={20}
                alt="NexoGastos"
              />
            </div>
            <div>
              <Link className="text-sm font-semibold sm:text-base" href="/">
                NexoGastos
              </Link>
              <p className="text-xs text-muted-foreground sm:text-sm">
                {footerDescription}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <FooterLink href="https://github.com/javijec" label="Javijec" />
            <FooterLink href="https://github.com/spliit-app/spliit/" label="Spliit" />
            <FooterLink href="https://github.com/javijec/jec-spliit" label="GitHub" />
          </div>
        </div>
      </div>
    </footer>
  )
}
