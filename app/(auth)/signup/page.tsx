// "use client";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import SignUpWithEmailSetup from "./SignUpWithEmailSetup";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import GoogleLoginSetup from "../google-login/GoogleLoginSetup";
import { getUserWithRole } from "@/lib/utils";
import { redirect } from "next/navigation";
import { UserWithRole } from "@/types/user.types";

export default async function SignUpPage() {
    const userWithRole: UserWithRole | null = await getUserWithRole();
  
    if (userWithRole) {
      redirect(`/app`);
    }
  
  return <SignUpWithEmailSetup user={userWithRole} />;
}