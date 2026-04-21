/*Since the server-client.ts uses @supabase/ssr with cookies (good for auth-aware calls), 
the service role client needs to be separated for admin API routes that need 
to bypass RLS (Row Level Security). So this file will be added for the admin to safely use
the service role key without affecting the auth flow of the rest of the app. Service role
key is used by the admin API routes to bypass RLS and perform privileged operations, 
while the server-client.ts is used for regular authenticated operations that 
respect RLS policies.
*/

// lib/supabase/admin-client.ts
import { createClient } from "@supabase/supabase-js";

// This client bypasses RLS — only use inside /api/ routes, never in components
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
);
