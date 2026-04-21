//email notification test/usage template
import { NextResponse } from 'next/server'
import { sendEmail } from '@/services/notification/email_service'
import { supabaseAdmin } from '@/lib/supabase/admin-client'

export async function GET() {
  console.log('Thunder test email triggered')
  //fetch data
  const {data:user, error: fetchError} = await supabaseAdmin
    .from('users')
    .select('*')
    .limit(1)
    .single()

if (fetchError) throw fetchError
console.log("Fetched user: ", user)

  try {
    const name = `${user.first_name} ${user.middle_name ?? ''} ${user.last_name}`
    await sendEmail({
      to: 'rplaqui@up.edu.ph',//can only use this registered email for testing or email domain @resend.dev
      template: 'billingOverdue',
      name: name
    })

    console.log(' Email sent')

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Email failed:', err)

    return NextResponse.json(
      { success: false, error: (err as Error).message },
      { status: 500 }
    )
  }
}