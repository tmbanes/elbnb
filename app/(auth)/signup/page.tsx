<<<<<<< HEAD
// "use client";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import SignUpWithEmailSetup from "./SignUpWithEmailSetup";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import GoogleLoginSetup from "../google-login/GoogleLoginSetup";
import { getUserWithRole } from "@/lib/utils/auth-utils";
import { redirect } from "next/navigation";
import { UserWithRole } from "@/types/user.types";

export default async function SignUpPage() {
    const userWithRole: UserWithRole | null = await getUserWithRole();
  
    if (userWithRole) {
      redirect(`/`);
    }
  
  return <SignUpWithEmailSetup user={userWithRole} />;
=======
import SignUpWithEmailSetup from "./SignUpWithEmailSetup";
import { getUserWithRole } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { User } from "@/types/user.types";

export default async function SignUpPage() {
  const user: User | null = await getUserWithRole();

  if (user) {
    redirect(`/`);
  }

  return <SignUpWithEmailSetup user={user} />;
>>>>>>> origin/develop
}