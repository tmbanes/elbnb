// "use client";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import SignUpWithEmailSetup from "./LoginWithEmailSetup";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import GoogleLoginSetup from "../google-login/GoogleLoginSetup";

export default async function LoginPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  console.log({ user });
  return <SignUpWithEmailSetup user={user} />;
}
