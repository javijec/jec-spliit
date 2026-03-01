import { getGroupAccessControl, verifyGroupAccessPassword } from '@/lib/api'
import {
  createGroupAccessCookieValue,
  getGroupAccessCookieName,
} from '@/lib/group-access-session'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const bodySchema = z.object({
  password: z.string().min(1),
})

export async function POST(
  req: Request,
  { params }: { params: Promise<{ groupId: string }> },
) {
  const { groupId } = await params

  let parsedBody: z.infer<typeof bodySchema>
  try {
    const body = await req.json()
    parsedBody = bodySchema.parse(body)
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const isValid = await verifyGroupAccessPassword(groupId, parsedBody.password)
  if (!isValid) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
  }
  const accessControl = await getGroupAccessControl(groupId)
  if (!accessControl?.accessPasswordHash) {
    return NextResponse.json(
      { error: 'Invalid group access config' },
      { status: 400 },
    )
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.set({
    name: getGroupAccessCookieName(groupId),
    value: createGroupAccessCookieValue(
      groupId,
      accessControl.accessPasswordHash,
    ),
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })

  return response
}
