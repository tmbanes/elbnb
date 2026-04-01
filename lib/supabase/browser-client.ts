"use client";

// Import Statements
import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

// TYPE: Temporary schema placeholder for Supabase datatypes
type SupabaseSchema = Record<string, never>;

// VARIABLE: Stores a single browser instance of the Supabase client
let client: SupabaseClient<SupabaseSchema> | null = null;

// FUNCTION: Get or create a Supabase browser client instance
// DESCRIPTION: Ensures only one Supabase client is created in the browser (singleton pattern).
// RETURNS: SupabaseClient instance configured with environment variables.
export function getSupabaseBrowserClient(): SupabaseClient<SupabaseSchema> {
  if (client) {
    return client;
  }

// ENVIRONMENT VARIABLES: Supabase project URL and public anon key
// TO DO: Must be set in .env.local
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }

  client = createBrowserClient<SupabaseSchema>(supabaseUrl, supabaseAnonKey);
  return client;
  
}

export { createBrowserClient };
