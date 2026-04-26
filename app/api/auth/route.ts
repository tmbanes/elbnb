import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server-client'
import { User } from '@/types/user.types'

import { getApiAuthenticatedUser } from "@/lib/auth/session";

export async function GET() {
  const user = await getApiAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const supabase = await createSupabaseServerClient();

  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('user_id', user.user_id)
    .single();

  if (userError || !userData) {
    return NextResponse.json({ user: null }, { status: 404 });
  }

  return NextResponse.json({
    user: userData as User,
  });
}
