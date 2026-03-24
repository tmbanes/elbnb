import webpush from "web-push";
import { supabase } from "@/lib/supabase/supabaseClient";

type PushPayload = {
  title: string;
  body: string;
};

webpush.setVapidDetails(
  "mailto:your@email.com",
  process.env.NEXT_PUBLIC_VAPID_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function sendPushNotification(payload: PushPayload) {
  const { data, error } = await supabase
    .from("push_subscriptions")
    .select("subscription");

  if (error) {
    console.error("Supabase error:", error);
    return;
  }

  if (!data) return;

  for (const sub of data) {
    try {
        console.log(process.env.NEXT_PUBLIC_VAPID_KEY);
      await webpush.sendNotification(
        sub.subscription,
        JSON.stringify(payload)
      );
    } catch (err) {
      console.error("Push failed:", err);
    }
  }
}