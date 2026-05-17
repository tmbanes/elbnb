const { UnitAccomodationsDisplayService } = require('./services/unit_accommodation');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY;

// Mock createSupabaseServerClient to return the admin client so we don't need auth headers
const { createSupabaseServerClient } = require('./lib/supabase/server-client');

async function test() {
  const result = await UnitAccomodationsDisplayService.listAccomodations("student");
  console.log("Accommodations result:", JSON.stringify(result.data, null, 2));
}

test().catch(console.error);
