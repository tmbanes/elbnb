import { createSupabaseServerClient } from "@/lib/supabase/server-client";

export default async function TestPage() {
  const supabase = await createSupabaseServerClient();

  // Test active tenants unfiltered
  const t = await supabase.from("accommodation_assignment").select(`
      assignment_id,
      user_id,
      assignment_status,
      users (
        first_name,
        last_name
      )
    `);

  return (
    <pre>
      <h1>ACTIVE TENANTS (UNFILTERED):</h1>
      {JSON.stringify(t, null, 2)}
    </pre>
  );
}
