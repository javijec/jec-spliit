import { NextResponse } from 'next/server'

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ groupId: string }> },
) {
  const { groupId } = await params
  return NextResponse.json(
    {
      error: 'Group unlock is no longer supported. Sign in and access the group through your account.',
      groupId,
    },
    { status: 410 },
  )
}
