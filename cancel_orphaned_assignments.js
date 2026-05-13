const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Fetching cancelled/rejected applications...");
  const { data: apps, error: appError } = await supabase
    .from('accommodation_application')
    .select('application_id')
    .in('application_status', ['cancelled', 'rejected']);

  if (appError) {
    console.error("Error fetching apps:", appError);
    return;
  }

  const appIds = apps.map(a => a.application_id);
  console.log(`Found ${appIds.length} cancelled/rejected applications.`);

  if (appIds.length === 0) return;

  console.log("Updating assignments to cancelled...");
  const { data: updated, error: updateError } = await supabase
    .from('accommodation_assignment')
    .update({ assignment_status: 'cancelled' })
    .in('application_id', appIds)
    .in('assignment_status', ['waiting_payment', 'pending', 'active'])
    .select('assignment_id');

  if (updateError) {
    console.error("Error updating assignments:", updateError);
    return;
  }

  console.log(`Successfully cancelled ${updated.length} assignments.`);

  // Also clean up any lingering invoices AGAIN just in case
  const assignmentIds = updated.map(a => a.assignment_id);
  if (assignmentIds.length > 0) {
      const { data: deleted, error: delError } = await supabase
        .from('billing')
        .delete()
        .in('assignment_id', assignmentIds)
        .in('status', ['unpaid', 'overdue'])
        .select('billing_id');
      console.log(`Deleted ${deleted?.length} lingering invoices.`, delError || '');
  }
}

run();
