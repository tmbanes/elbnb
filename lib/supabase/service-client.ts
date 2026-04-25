// lib/supabase/service-client.ts
// Uses the SERVICE_ROLE key — bypasses RLS entirely.
// ONLY use in server-side API routes, AFTER verifying auth + role
// with the session client first. Never import this in client components.

import { createClient } from "@supabase/supabase-js";

export function createSupabaseServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
