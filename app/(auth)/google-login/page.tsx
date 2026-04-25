// /google-login/page.tsx
import { getApiAuthenticatedUser } from "@/lib/auth/session";
import GoogleLoginSetup from "./GoogleLoginSetup";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { User } from "@/types/user.types";
import { redirect } from "next/navigation";

export default async function GoogleLoginPage() {
  const user: User | null = await getApiAuthenticatedUser();

  if (user) {
    redirect(`/`);
  }

  return <GoogleLoginSetup user={user} />;
}
