// email notification — moved to /api/shared/email-notifications
import { NextResponse } from 'next/server';
import { withRole } from '@/lib/auth/api-guard';
import { sendEmail } from '@/services/notification/email_service';
import { supabaseAdmin } from '@/lib/supabase/admin-client';

const ALL_ROLES = ['student', 'guest', 'housing_admin', 'dormitory_manager'] as const;

export const GET = withRole([...ALL_ROLES], async () => {
  console.log('Thunder test email triggered');

  const { data: user, error: fetchError } = await supabaseAdmin
    .from('users')
    .select('*')
    .limit(1)
    .single();

  if (fetchError) throw fetchError;

  try {
    const name = `${user.first_name} ${user.middle_name ?? ''} ${user.last_name}`;
    await sendEmail({
      to: 'rplaqui@up.edu.ph',
      template: 'billingOverdue',
      name,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Email failed:', err);
    return NextResponse.json(
      { success: false, error: (err as Error).message },
      { status: 500 }
    );
  }
});
