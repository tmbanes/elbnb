//npx web-push generate-vapid-keys 
//put generated key to .env

import webpush from "web-push";
import { supabaseAdmin } from "@/lib/supabase/admin-client";

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export type PushPayload = {
  title: string
  message?: string
  actionUrl?: string
}

export async function sendPushToUser(userId: string, payload: PushPayload) {
  const supabase = supabaseAdmin

  //save notification
  const { data: inserted, error: insertError } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      title: payload.title,
      message: payload.message,
      action_url: payload.actionUrl,
      is_sent_push: false,
    })
    .select()
    .single()
  const insertedId = inserted?.notification_id
  // Fetch the stored subscription from users table
  const { data: user, error } = await supabase
    .from('users')
    .select('push_subscription')
    .eq('user_id', userId)
    .single()

  if (error || !user?.push_subscription) {
    console.log('No push subscription found for user:', userId)
    return
  }

  try {
    await webpush.sendNotification(
      user.push_subscription,
      JSON.stringify(payload)
    )
    await supabase
      .from('notifications')
      .update({ is_sent_push: true })
      .eq('notification_id', insertedId)
  } catch (err: any) {
    // Subscription expired or invalid — clear it
    if (err.statusCode === 404 || err.statusCode === 410) {
      await supabase
        .from('users')
        .update({ push_subscription: null })
        .eq('user_id', userId)
    }
    console.error('Push failed:', err.message)
  }
}