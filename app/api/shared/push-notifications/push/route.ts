import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/lib/auth/api-guard';
import { sendPushToUser } from '@/services/notification/pushnotification_service';

const ALL_ROLES = ['student', 'guest', 'housing_admin', 'dormitory_manager'] as const;

// POST — send a push notification to a specific user
export const POST = withRole([...ALL_ROLES], async (req) => {
  const { userId, title, message, actionUrl } = await req.json();

  if (!userId || !title) {
    return NextResponse.json({ error: 'Missing userId or title' }, { status: 400 });
  }

  await sendPushToUser(userId, { title, message, actionUrl });

  return NextResponse.json({ success: true });
});
