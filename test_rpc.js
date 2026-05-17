const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.rpc('create_dormitory_full', {
    p_name: 'test',
    p_location: 'test',
    p_manager_id: '123',
    p_total_capacity: 10,
    p_number_of_semesters_allowed: 1,
    p_term_type: 'semestral',
    p_separate_by_gender: false,
    p_accomm_sex: 'Male' // Testing if this parameter exists
  }).limit(0);
  
  console.log("Error when passing p_accomm_sex:", error);
}
check();
