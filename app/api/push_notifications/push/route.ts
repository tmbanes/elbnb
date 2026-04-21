// app/api/notifications/push/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { sendPushToUser } from '@/services/notification/pushnotification_service'

export async function POST(req: NextRequest) {
  const { userId, title, message, actionUrl } = await req.json()

  if (!userId || !title) {
    return NextResponse.json({ error: 'Missing userId or title' }, { status: 400 })
  }

  await sendPushToUser(userId, { title, message, actionUrl }, )

  return NextResponse.json({ success: true })
}