// /google-login/page.tsx
import GoogleLoginSetup from "./GoogleLoginSetup";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";

export default async function GoogleLoginPage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser();

  console.log( { user });
  return <GoogleLoginSetup user={user} />;
}