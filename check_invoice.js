const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkInvoice() {
  const billingId = '88ecab5f';
  
  console.log('\n1. Checking billing record:');
  const { data: billing, error: billingError } = await supabase
    .from('billing')
    .select('*')
    .eq('billing_id', billingId)
    .single();
    
  if (billingError) {
    console.log('Error:', billingError);
  } else {
    console.log('Billing:', JSON.stringify(billing, null, 2));
  }
  
  console.log('\n2. Checking billing_item rows:');
  const { data: items, error: itemsError } = await supabase
    .from('billing_item')
    .select('*')
    .eq('billing_id', billingId);
    
  if (itemsError) {
    console.log('Error:', itemsError);
  } else {
    console.log('Items:', JSON.stringify(items, null, 2));
    console.log('Total items:', items?.length);
  }
}

checkInvoice();
