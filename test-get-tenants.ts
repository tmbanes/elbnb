import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

async function run() {
  const { data, error } = await supabaseAdmin
    .from("accommodation_assignment")
    .select(`
      assignment_id,
      user_id,
      users (
        first_name,
        last_name
      )
    `)
    .in("assignment_status", ["active", "waiting_payment", "pending"]);
    
  console.log("Data:", JSON.stringify(data, null, 2));
  console.log("Error:", error);
}

run();
