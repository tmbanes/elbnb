import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/lib/auth/api-guard';
import { supabaseAdmin } from '@/lib/supabase/admin-client';

const ALL_ROLES = ['student', 'guest', 'housing_admin', 'dormitory_manager'] as const;

// POST — register a push subscription for a user
export const POST = withRole([...ALL_ROLES], async (req) => {
  const { userId, subscription } = await req.json();

  if (!userId || !subscription) {
    return NextResponse.json({ error: 'Missing userId or subscription' }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from('users')
    .update({ push_subscription: subscription })
    .eq('user_id', userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
});

// DELETE — remove a push subscription for a user
export const DELETE = withRole([...ALL_ROLES], async (req) => {
  const { userId } = await req.json();

  if (!userId) {
    return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from('users')
    .update({ push_subscription: null })
    .eq('user_id', userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
});
