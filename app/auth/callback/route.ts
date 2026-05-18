import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { createActivityLog } from "@/services/activity_log/server";
import { getApiAuthenticatedUser } from "@/lib/auth/session";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // if "next" is in param, use it as the redirect URL
  let next = searchParams.get("next");

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const user = await getApiAuthenticatedUser();

      if (user) {
        await createActivityLog({
          p_user_id: user.user_id,
          p_action_type: "login",
          p_log_desc: `${user.first_name || user.email} logged in via Google`,
          p_entity_type: "auth",
          p_entity_id: user.user_id,
          p_user_role: user.role as any,
        });

        // Skip auth-callback bounce and determine exact target immediately
        if (!next || next === "/auth-callback") {
          if (!(user as any).is_profile_complete) {
            next = "/complete-profile";
          } else {
            if (user.role === 'student') next = '/student/dashboard';
            else if (user.role === 'dormitory_manager') next = '/manager/dashboard';
            else if (user.role === 'housing_admin') next = '/admin/dashboard';
            else if (user.role === 'guest') next = '/guest/dashboard';
            else next = '/';
          }
        }
      } else {
        next = "/onboarding";
      }

      if (next && !next.startsWith("/")) next = "/" + next;

      const forwardedHost = request.headers.get("x-forwarded-host"); // original origin before load balancer
      const isLocalEnv = process.env.NODE_ENV === "development";

      if (isLocalEnv) {
        // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    } else {
      console.error("OAuth exchange error:", error);
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
