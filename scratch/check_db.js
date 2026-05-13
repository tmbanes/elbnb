const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

async function checkTables() {
  const tables = ['users', 'student', 'housing_admin', 'dormitory_manager', 'guest'];
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      // console.log(`Table ${table}: Error - ${error.message}`);
    } else {
      // console.log(`Table ${table}: OK - ${data.length > 0 ? 'Has data' : 'Empty'}`);
      if (data.length > 0) {
        // console.log(`Columns in ${table}: ${Object.keys(data[0]).join(', ')}`);
      }
    }
  }
}

checkTables();
