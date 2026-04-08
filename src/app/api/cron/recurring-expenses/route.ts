import { env } from '@/lib/env'
import { createRecurringExpenses } from '@/lib/expenses'
import { NextResponse } from 'next/server'

function isAuthorized(request: Request) {
  if (!env.CRON_SECRET) {
    return process.env.NODE_ENV !== 'production'
  }

  return request.headers.get('authorization') === `Bearer ${env.CRON_SECRET}`
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  const result = await createRecurringExpenses()

  return NextResponse.json({
    ok: true,
    ...result,
  })
}
