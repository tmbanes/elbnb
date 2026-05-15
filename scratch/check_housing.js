
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkManagerHousing() {
  // 1. Get current user (mocking what normally happens)
  // Since we don't have the active session easily here, let's list ALL managers and their assigned properties

  // console.log('--- Managers & Their Assigned Accommodations ---');

  const { data: managers, error: userError } = await supabase
    .from('users')
    .select('user_id, first_name, last_name, role')
    .eq('role', 'dormitory_manager');

  if (userError) {
    console.error('Error fetching managers:', userError);
    return;
  }

  for (const manager of managers) {
    const { data: properties, error: propError } = await supabase
      .from('accommodation')
      .select('name, location')
      .eq('manager_id', manager.user_id);

    // console.log(`${manager.first_name} ${manager.last_name} (${manager.user_id}): ${properties?.length || 0} properties`);
    properties?.forEach(p => console.log(`  - ${p.name} at ${p.location}`));
  }

  // console.log('\n--- Unassigned Accommodations ---');
  const { data: unassigned, error: unError } = await supabase
    .from('accommodation')
    .select('name, location')
    .is('manager_id', null);

  unassigned?.forEach(p => console.log(`  - ${p.name} at ${p.location}`));
}

checkManagerHousing();
