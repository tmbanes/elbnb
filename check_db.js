const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data: admin } = await supabase.from("housing_admin").select("*");
  console.log("Housing Admins:", JSON.stringify(admin, null, 2));

  const { data: accoms } = await supabase.from("accommodation").select("accommodation_id, name, manager_id");
  console.log("Accommodations:", JSON.stringify(accoms, null, 2));

  const { data: managers } = await supabase.from("dormitory_manager").select("*");
  console.log("Managers:", JSON.stringify(managers, null, 2));
}

main().catch(console.error);
