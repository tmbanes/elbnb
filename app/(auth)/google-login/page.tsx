// /google-login/page.tsx
import { getUserWithRole } from "@/lib/utils/auth-utils";
import GoogleLoginSetup from "./GoogleLoginSetup";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { UserWithRole } from "@/types/user.types";
import { redirect } from "next/navigation";

export default async function GoogleLoginPage() {
  const userWithRole: UserWithRole | null = await getUserWithRole();
    
  if (userWithRole) {
    redirect(`/`);
  }

  return <GoogleLoginSetup user={userWithRole} />;
}
