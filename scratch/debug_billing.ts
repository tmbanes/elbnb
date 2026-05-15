
import { supabaseAdmin } from "./lib/supabase/admin-client";

async function debug() {
  const applicationId = "5570bdde-5f29-4034-877e-164f6b4ce7d9";
  
  console.log("Checking application:", applicationId);
  const { data: app, error: appError } = await supabaseAdmin
    .from("accommodation_application")
    .select("*")
    .eq("application_id", applicationId)
    .single();
    
  if (appError) {
    console.error("App fetch error:", appError);
  } else {
    console.log("App found:", app.application_status);
  }
  
  console.log("Checking assignments for app...");
  const { data: assignments, error: assignError } = await supabaseAdmin
    .from("accommodation_assignment")
    .select("*")
    .eq("application_id", applicationId);
    
  if (assignError) {
    console.error("Assign fetch error:", assignError);
  } else {
    console.log("Assignments found:", assignments.length);
    assignments.forEach(a => console.log(" - Assignment ID:", a.assignment_id, "Status:", a.assignment_status));
  }
  
  if (assignments && assignments.length > 0) {
    const assignmentIds = assignments.map(a => a.assignment_id);
    console.log("Checking billing for assignments:", assignmentIds);
    const { data: bills, error: billsError } = await supabaseAdmin
      .from("billing")
      .select("*, billing_item(*)")
      .in("assignment_id", assignmentIds);
      
    if (billsError) {
      console.error("Bills fetch error:", billsError);
    } else {
      console.log("Bills found:", bills.length);
      bills.forEach(b => {
        console.log(" - Bill ID:", b.billing_id, "Amount:", b.amount, "Status:", b.status);
        console.log("   Items:", b.billing_item?.length);
      });
    }
  }
}

debug();
