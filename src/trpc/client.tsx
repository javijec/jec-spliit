'use client' // <-- to make sure we can mount the Provider from a server component
import { Prisma } from '@prisma/client'
import {
  dehydrate,
  hydrate,
  QueryClientProvider,
  type QueryClient,
} from '@tanstack/react-query'
import { httpBatchLink } from '@trpc/client'
import { createTRPCReact } from '@trpc/react-query'
import { useEffect, useState } from 'react'
import superjson from 'superjson'
import { makeQueryClient } from './query-client'
import type { AppRouter } from './routers/_app'

superjson.registerCustom<Prisma.Decimal, string>(
  {
    isApplicable: (v): v is Prisma.Decimal => Prisma.Decimal.isDecimal(v),
    serialize: (v) => v.toJSON(),
    deserialize: (v) => new Prisma.Decimal(v),
  },
  'decimal.js',
)

export const trpc = createTRPCReact<AppRouter>()

let clientQueryClientSingleton: QueryClient
let hasRestoredPersistedQueryClient = false

const PERSISTED_QUERY_CACHE_KEY = 'nexogastos.react-query-cache.v1'
const PERSISTED_QUERY_CACHE_TTL_MS = 1000 * 60 * 60 * 12
const PERSISTED_QUERY_PATTERNS = [
  '"viewer","getCurrent"',
  '"categories","list"',
  '"groups","get"',
  '"groups","getDetails"',
  '"groups","balances","list"',
  '"groups","expenses","list"',
  '"groups","stats","get"',
] as const

function isPersistableQuery(query: Parameters<typeof dehydrate>[0]['getQueryCache']['prototype'] extends never ? never : any) {
  if (query.state.status !== 'success') return false

  const queryKey = JSON.stringify(query.queryKey)
  return PERSISTED_QUERY_PATTERNS.some((pattern) => queryKey.includes(pattern))
}

function restorePersistedQueryClient(queryClient: QueryClient) {
  if (typeof window === 'undefined' || hasRestoredPersistedQueryClient) return

  hasRestoredPersistedQueryClient = true

  try {
    const raw = window.localStorage.getItem(PERSISTED_QUERY_CACHE_KEY)
    if (!raw) return

    const parsed = JSON.parse(raw) as {
      timestamp?: number
      clientState?: unknown
    }

    if (
      !parsed.timestamp ||
      !parsed.clientState ||
      Date.now() - parsed.timestamp > PERSISTED_QUERY_CACHE_TTL_MS
    ) {
      window.localStorage.removeItem(PERSISTED_QUERY_CACHE_KEY)
      return
    }

    hydrate(queryClient, parsed.clientState)
  } catch {
    window.localStorage.removeItem(PERSISTED_QUERY_CACHE_KEY)
  }
}

function persistQueryClientSnapshot(queryClient: QueryClient) {
  if (typeof window === 'undefined') return

  try {
    const clientState = dehydrate(queryClient, {
      shouldDehydrateQuery: isPersistableQuery,
    })

    window.localStorage.setItem(
      PERSISTED_QUERY_CACHE_KEY,
      JSON.stringify({
        timestamp: Date.now(),
        clientState,
      }),
    )
  } catch {
    // Ignore persistence failures such as quota exceeded or malformed state.
  }
}

function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: always make a new query client
    return makeQueryClient()
  }
  // Browser: use singleton pattern to keep the same query client
  if (!clientQueryClientSingleton) {
    clientQueryClientSingleton = makeQueryClient()
    restorePersistedQueryClient(clientQueryClientSingleton)
  }
  return clientQueryClientSingleton
}

export const trpcClient = getQueryClient()

function getUrl() {
  const base = (() => {
    if (typeof window !== 'undefined') return ''
    if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
    return 'http://localhost:3000'
  })()
  return `${base}/api/trpc`
}

export function TRPCProvider(
  props: Readonly<{
    children: React.ReactNode
  }>,
) {
  // NOTE: Avoid useState when initializing the query client if you don't
  //       have a suspense boundary between this and the code that may
  //       suspend because React will throw away the client on the initial
  //       render if it suspends and there is no boundary
  const queryClient = getQueryClient()
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          transformer: superjson,
          url: getUrl(),
        }),
      ],
    }),
  )

  useEffect(() => {
    if (typeof window === 'undefined') return

    let persistTimeout: number | null = null

    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (event?.type !== 'added' && event?.type !== 'updated' && event?.type !== 'removed') {
        return
      }

      if (persistTimeout !== null) {
        window.clearTimeout(persistTimeout)
      }

      persistTimeout = window.setTimeout(() => {
        persistQueryClientSnapshot(queryClient)
      }, 300)
    })

    return () => {
      unsubscribe()
      if (persistTimeout !== null) {
        window.clearTimeout(persistTimeout)
      }
    }
  }, [queryClient])

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {props.children}
      </QueryClientProvider>
    </trpc.Provider>
  )
}
