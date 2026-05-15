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

  console.log("Fetching assignments for these applications...");
  const { data: assignments, error: assignError } = await supabase
    .from('accommodation_assignment')
    .select('assignment_id')
    .in('application_id', appIds);

  if (assignError) {
    console.error("Error fetching assignments:", assignError);
    return;
  }

  const assignmentIds = assignments.map(a => a.assignment_id);
  console.log(`Found ${assignmentIds.length} assignments.`);

  if (assignmentIds.length === 0) return;

  console.log("Updating invoices to cancelled...");
  const { data: updated, error: updateError } = await supabase
    .from('billing')
    .delete()
    .in('assignment_id', assignmentIds)
    .in('status', ['unpaid', 'overdue'])
    .select('billing_id');

  if (updateError) {
    console.error("Error updating invoices:", updateError);
    return;
  }

  console.log(`Successfully cancelled ${updated.length} invoices.`);
}

run();
