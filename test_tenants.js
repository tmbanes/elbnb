require('dotenv').config({ path: '/Users/shmllrs/Desktop/projects/ELbnb/.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const res = await supabase.from('accommodation_assignment').select('assignment_id, assignment_status, application_id, user_id');
  console.log("Assignments:", res.data);
  const res2 = await supabase.from('accommodation_application').select('application_id, application_status, user_id').eq('application_status', 'pending_payment');
  console.log("Pending Payment Applications:", res2.data);
}
run();
