// /lib/supabase/server-client.ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createSupabaseServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabasePublicKey = process.env.NEXT_PUBLIC_SUPABASE_KEY!; // Changed to Anon
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabasePublicKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch (error) {
<<<<<<< HEAD
          // This can be ignored if middleware handles refreshes
=======
          // ignore
>>>>>>> 76e8f3255db7be2b6cbe835d611a2e1be74975e1
        }
      },
    },
  });
}
