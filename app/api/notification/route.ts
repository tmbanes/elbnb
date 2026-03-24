import { supabase } from "@/lib/supabase/supabaseClient";//replace with actual database
import { sendPushNotification } from "@/lib/Notification/push_notif";

export async function POST(req: Request) {
  const subscription = await req.json();

  await supabase.from("push_subscriptions").insert([
    {
      subscription,
      // optional: user_id
    },
  ]);

  return Response.json({ success: true });
}


export async function GET() {
  await sendPushNotification({
    title: "Test Notification",
    body: "Hello ",
  });

  return Response.json({ success: true });
}