// lib/supabase/admin-client.ts
import { createClient } from "@supabase/supabase-js";

// This client bypasses RLS — only use inside server-side code (actions, routes, server components)
// We use a getter to avoid initializing the client during module evaluation, 
// which can cause crashes in the browser or if env variables are temporarily missing.
export const getSupabaseAdmin = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !supabaseSecretKey) {
    throw new Error(
      "Supabase admin keys are missing. Ensure SUPABASE_SECRET_KEY is set in your environment variables."
    );
  }

  return createClient(supabaseUrl, supabaseSecretKey);
};

// Deprecated: directly exporting the instance can cause issues in Next.js Turbopack 
// when the module is evaluated in environments without the secret key.
// But we'll keep a lazy-initialized version for backward compatibility if needed.
let adminInstance: ReturnType<typeof createClient> | null = null;

export const supabaseAdmin = (() => {
  // We return a proxy or a lazy getter if possible, but for simplicity:
  // In most cases, you should switch to using getSupabaseAdmin() directly.
  return new Proxy({} as ReturnType<typeof createClient>, {
    get(_, prop) {
      if (!adminInstance) {
        adminInstance = getSupabaseAdmin();
      }
      return (adminInstance as any)[prop];
    },
  });
})() as unknown as ReturnType<typeof createClient>;
