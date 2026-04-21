import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin-client'

export async function POST(req: NextRequest) {
  const supabase = supabaseAdmin

  const { userId, subscription } = await req.json()

  if (!userId || !subscription) {//check subscription
    return NextResponse.json({ error: 'Missing userId or subscription' }, { status: 400 })
  }

  const { error } = await supabase //create subscription
    .from('users')
    .update({ push_subscription: subscription })
    .eq('user_id', userId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest) {
  const supabase = supabaseAdmin

  const { userId } = await req.json()

  if (!userId) {
    return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
  }

  const { error } = await supabase
    .from('users')
    .update({ push_subscription: null })
    .eq('user_id', userId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}