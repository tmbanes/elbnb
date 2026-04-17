// "use client";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import SignUpWithEmailSetup from "./SignUpWithEmailSetup";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import GoogleLoginSetup from "../google-login/GoogleLoginSetup";
import { getUserWithRole } from "@/lib/auth/client-auth";
import { redirect } from "next/navigation";
import { User } from "@/types/user.types";

export default async function SignUpPage() {
    const user: User | null = await getUserWithRole();
  
    if (user) {
      redirect(`/`);
    }
  
  return <SignUpWithEmailSetup user={user} />;
}