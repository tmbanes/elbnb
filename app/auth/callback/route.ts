import { NextResponse } from "next/server";
// The client created from the Server-Side Auth instructions
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { createActivityLog, getCurrentUserRole } from "@/services/activity_log/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // if "next" is in param, use it as the redirect URL
  let next = searchParams.get("next") ?? "/";
  if (!next.startsWith("/")) {
    // if "next" is not a relative URL, use the default
    next = "/";
  }

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const currentUser = await getCurrentUserRole();
      if (currentUser) {
        await createActivityLog({
          p_user_id: currentUser.userId,
          p_action_type: "login",
          p_log_desc: `${currentUser.first_name} logged in via Google`,
          p_entity_type: "auth",
          p_entity_id: currentUser.userId,
          p_user_role: currentUser.role,
        });
      }

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
