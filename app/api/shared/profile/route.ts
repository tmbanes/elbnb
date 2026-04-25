import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/lib/auth/api-guard';

const ALL_ROLES = ['student', 'guest', 'housing_admin', 'dormitory_manager'] as const;

const roleConfig = {
  student: {
    table: 'student',
    allowedFields: ['first_name', 'last_name', 'middle_name', 'course', 'year_level'],
  },
  dormitory_manager: {
    table: 'dormitory_manager',
    allowedFields: ['first_name', 'last_name', 'dorm_name'],
  },
  housing_admin: {
    table: 'housing_admin',
    allowedFields: ['first_name', 'last_name'],
  },
} as const;

// PATCH — update the authenticated user's profile
export const PATCH = withRole([...ALL_ROLES], async (req, { user }) => {
  try {
    const { createSupabaseServerClient } = await import('@/lib/supabase/server-client');
    const supabase = await createSupabaseServerClient();
    const body = await req.json();

    const config = roleConfig[user.role as keyof typeof roleConfig];

    if (!config) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    const allowedUpdates: Record<string, any> = {};
    for (const field of config.allowedFields) {
      if (body[field] !== undefined && body[field] !== '' && body[field] !== null) {
        allowedUpdates[field] = body[field];
      }
    }

    if (Object.keys(allowedUpdates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from(config.table)
      .update(allowedUpdates)
      .eq('user_id', user.user_id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
});
