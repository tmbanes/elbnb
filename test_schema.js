const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.from('accommodation').select('*').limit(1);
  console.log("accommodation:", data ? Object.keys(data[0] || {}) : error);
  
  const { data: d, error: e } = await supabase.from('dormitory').select('*').limit(1);
  console.log("dormitory:", d ? Object.keys(d[0] || {}) : e);

  const { data: r, error: re } = await supabase.from('renting_space').select('*').limit(1);
  console.log("renting_space:", r ? Object.keys(r[0] || {}) : re);
}
check();
