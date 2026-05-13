// /services/student_profile/index.ts

import { createSupabaseServerClient as supabase } from "@/lib/supabase/server-client";
import { supabaseAdmin } from "@/lib/supabase/admin-client";
import {
  UserProfile,
  AccommodationAssignment,
  AccommodationApplication,
} from "@/types/user_profile";

interface ActivityLog {
  log_id: string;
  user_id: string;
  action_type: string;
  log_desc: string;
  entity_type: string;
  entity_id: string;
  timestamp: string;
  user_role: string;
}

export const userProfileService = {
  async getProfile(user_id: string) {
    const client = await supabase();
    const { data, error } = await client
      .from("users")
      .select("*")
      .eq("user_id", user_id)
      .single();

    return { data: data as UserProfile | null, error };
  },

  async updateProfile(user_id: string, updates: Partial<UserProfile>) {
    const client = await supabase();
    const { data, error } = await client
      .from('users')
      .update({
        // only the name can be changed (as of now ??), nacheck ko rin supabase, srs, and specs, either not indicated/not possible
        first_name: updates.first_name,
        last_name: updates.last_name,
        middle_name: updates.middle_name,
      })
      .eq("user_id", user_id)
      .select()
      .single();

    if (error) {
      console.error("Error updating profile:", error);
    }

    return { data: data as UserProfile | null, error };
  },

  // di ko alam if need pa itu
  // export interface AccommodationAssignment {
  //     assignment_id: string;
  //     move_In_Date: string;
  //     expected_Move_Out_Date: string;
  //     actual_Move_Out_Date?: string | null;
  //     application_id: string;

  //     // optional for history checker
  //     application?: {
  //     preferred_Unit_Type: string;
  //     preferred_Accomodation: string;
  //     };

  async getMyAssignment(application_id: string) {
    const client = await supabase();
    const { data, error } = await client
      .from("accommodation_assignment")
      .select(
        `
        assignment_id,
        move_in_date,
        expected_move_out_date,
        actual_move_out_date,
        application_id
      `,
      )
      .eq("application_id", application_id)
      .single();

    return { data: data as AccommodationAssignment | null, error };
  },

  /*

for reference:
https://supabase.com/docs/reference/javascript/storage-from-upload
https://supabase.com/docs/reference/javascript/insert
not yet tested


// */

  // const avatarFile = event.target.files[0]
  // const { data, error } = await supabase
  //   .storage
  //   .from('avatars')
  //   .upload('public/avatar1.png', avatarFile, {
  //     cacheControl: '3600',
  //     upsert: false
  //   })

  // async uploadDocument(user_id: string, application_id: string, file: File){
  //   const filePath = `${user_id}/${application_id}/${file.name}`;

  //   const { data: storageData}

  // }

  async uploadDocument(user_id: string, application_id: string, file: File) {
    const client = await supabase();
    /*
    const avatarFile = event.target.files[0]
    const { data, error } = await client
      .storage
      .from('avatars')
      .upload('public/avatar1.png', avatarFile, {
        cacheControl: '3600',
        upsert: false
      })
    */

    const filePath = `${user_id}/${application_id}/${file.name}`;
    const { data: storageData, error: storageError } = await client.storage
      .from("documents")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: true, // for overwriting
      });

    if (storageError) {
      console.error("Storage Error:", storageError);
      return { data: null, error: storageError };
    }

    // added document successfully
    const { data: dbData, error: dbError } = await client
      .from("documents")
      .insert({
        user_id: user_id,
        application_id: application_id,
        file_name: file.name,
        file_type: file.type,
        file_url: storageData.path,
        // status: 'Uploaded' na dpat (to be updated!!!)
      })
      .select()
      .single();

    return { data: dbData, error: dbError };
  },

  // https://supabase.com/dashboard/project/cywurzembhxgwqvpsrlh/database/schemas

  /*

  export interface AccommodationApplication {
      application_id: string;
      preferred_Accomodation: string;
      preferred_Unit_Type: string;
      date_Submitter: string; // pacheck if submitter ba talaga un or submitted
      duration_Of_Stay: number | null; 
      check_In: string | null;        
      check_Out: string | null;        
      number_Of_Companions: number | null;

      // https://supabase.com/dashboard/project/cywurzembhxgwqvpsrlh/database/schemas
      // no status ???? (acc supabase database)
      accomodation_assignment?: AccommodationAssignment | null; 
  }
  */

  async getAccommodationHistory(user_id: string) {
    const client = await supabase();
    const { data, error } = await client
      .from("accommodation_application")
      .select(`
        application_id,
        application_status,
        preferred_accommodation_id,
        preferred_unit_type,
        date_submitted,
        duration_of_stay,
        check_in,
        check_out,
        number_of_companions,
        accommodation:preferred_accommodation_id (
          name,
          accommodation_type
        ),
        unit:unit_id (
          unit_number
        ),
        accommodation_assignment (
          move_in_date,
          expected_move_out_date,
          actual_move_out_date
        )
      `)
      .eq("user_id", user_id)
      .order("date_submitted", { ascending: false });

    if (error) {
      console.error("Supabase fetch error:", error);
    }

    return { data: data as AccommodationApplication[] | null, error };
  },

  // added for the cancel modal in the history and status page, 
  // to update the application_status to "cancelled" when the user cancels their pending application (pending_admin or pending_dorm_manager)
  async cancelAccommodationApplication(application_id: string) {
    const client = await supabase();

    const { data, error } = await client
      .from("accommodation_application")
      .update({ application_status: "cancelled" })
      .eq("application_id", application_id)
      .select()
      .single();

    if (error) {
      console.error("Error canceling application:", error);
      return { data: null, error };
    }

    // Also update the billing status to cancelled if it exists
    const { data: assignment, error: assignmentError } = await client
      .from("accommodation_assignment")
      .select("assignment_id")
      .eq("application_id", application_id)
      .maybeSingle();

    if (!assignmentError && assignment?.assignment_id) {
      await supabaseAdmin
        .from("billing")
        .delete()
        .eq("assignment_id", assignment.assignment_id)
        .in("status", ["unpaid", "pending", "pending_verification", "overdue"]);

      await supabaseAdmin
        .from("accommodation_assignment")
        .update({ assignment_status: "cancelled" })
        .eq("assignment_id", assignment.assignment_id);
    }

    return { data, error: null };
  },

  async getDocuments(user_id: string) {
    const client = await supabase();

    const { data, error } = await client
      .from("documents")
      .select("*")
      .eq("user_id", user_id);

    if (error) {
      if ((error as any).code === 'PGRST116' || error.message?.includes('Could not find the table')) {
        console.warn("Documents table is missing in Supabase. Returning empty array.");
        return { data: [], error: null };
      }
      console.error("Error fetching documents:", error.message);
    }

    return { data, error };
  },

  async getCurrentAccommodation(user_id: string) {
    const client = await supabase();
    const { data, error } = await client
      .from("accommodation_assignment")
      .select(`
        assignment_id,
        move_in_date,
        expected_move_out_date,
        assignment_status,
        unit:unit_id (
          unit_number,
          unit_type,
          accommodation:accommodation_id (
            name,
            location,
            renewal_start_date,
            renewal_end_date,
            image
          )
        )
      `)
      .eq("user_id", user_id)
      .in("assignment_status", ["active", "waiting_payment", "pending"])
      .maybeSingle();

    return { data, error };
  },

  async getDashboardStats(user_id: string) {
    const client = await supabase();

    // Get summary of bills
    const { data: billingData } = await client
      .from("billing")
      .select("amount, status, accommodation_assignment!inner(user_id)")
      .eq("accommodation_assignment.user_id", user_id);

    let totalBalance = 0;
    billingData?.forEach(bill => {
      if (bill.status !== 'paid') totalBalance += bill.amount;
    });

    // Get latest application
    const { data: latestApp } = await client
      .from("accommodation_application")
      .select("application_status, date_submitted")
      .eq("user_id", user_id)
      .order("date_submitted", { ascending: false })
      .limit(1)
      .maybeSingle();

    return {
      data: {
        totalBalance,
        latestApplicationStatus: latestApp?.application_status || null,
      }
    };
  },

  async createExtensionApplication(user_id: string, currentResidency: any) {
    const client = await supabase();

    const { data, error } = await client
      .from("accommodation_application")
      .insert({
        user_id: user_id,
        preferred_accommodation_id: currentResidency.unit.accommodation.accommodation_id,
        unit_id: currentResidency.unit.unit_id,
        preferred_unit_type: currentResidency.unit.unit_type,
        application_status: "pending_dorm_manager",
        date_submitted: new Date().toISOString(),
      })
      .select()
      .single();

    return { data, error };
  },

  async getNotifications(user_id: string) {
    const client = await supabase();
    const adminClient = supabaseAdmin;

    // 1. Get user role
    const { data: profile } = await client
      .from("users")
      .select("role")
      .eq("user_id", user_id)
      .single();

    if (!profile) return { data: [], error: null };
    const role = profile.role.toLowerCase().replace(/\s+/g, '_');

    // 2. Build conditions based on user role and interests
    const actorCondition = (role === "student" || role === "guest")
      ? `and(user_id.eq.${user_id},action_type.not.in.(submit_application,cancel_application,update_user))`
      : (role === "dormitory_manager")
        ? `and(user_id.eq.${user_id},action_type.not.in.(screen_application,update_user))`
        : `user_id.eq.${user_id}`;
    const conditions: string[] = [actorCondition];
    const appLookup: Record<string, any> = {};

    try {
      if (role === "student" || role === "guest") {
        // Parallelize initial lookups for student/guest
        const [appsRes, assignmentsRes, docsRes] = await Promise.all([
          client.from("accommodation_application").select("application_id, accommodation:preferred_accommodation_id(name)").eq("user_id", user_id),
          client.from("accommodation_assignment").select("assignment_id").eq("user_id", user_id),
          client.from("application_document").select("document_id").eq("user_id", user_id)
        ]);

        const apps = appsRes.data;
        const appIds = apps?.map(a => a.application_id) || [];
        apps?.forEach(a => {
          appLookup[a.application_id] = {
            accomName: (a.accommodation as any)?.name || "Accommodation"
          };
        });

        const assignmentIds = (assignmentsRes.data || []).map(a => a.assignment_id);
        const docIds = (docsRes.data || []).map(d => d.document_id);

        // Nested dependency: Bills need assignments
        if (assignmentIds.length > 0) {
          const { data: bills } = await client.from("billing").select("billing_id").in("assignment_id", assignmentIds);
          const billIds = (bills as any[])?.map(b => b.billing_id) || [];
          if (billIds.length > 0) {
            conditions.push(`and(entity_type.eq.billing,entity_id.in.(${billIds.join(',')}),action_type.not.in.(mark_billing_paid))`);
          }
        }

        if (appIds.length > 0) {
          conditions.push(`and(entity_type.eq.application,entity_id.in.(${appIds.join(',')}),action_type.not.in.(submit_application,cancel_application,update_user))`);
        }
        if (assignmentIds.length > 0) {
          conditions.push(`and(entity_type.eq.assignment,entity_id.in.(${assignmentIds.join(',')}),action_type.not.in.(submit_application,cancel_application,update_user,create_assignment))`);
        }
        if (docIds.length > 0) {
          conditions.push(`and(entity_type.eq.document,entity_id.in.(${docIds.join(',')}))`);
        }

      } else if (role === "dormitory_manager") {
        // Managers care about applications for their accommodations
        const { data: accoms } = await client
          .from("accommodation")
          .select("accommodation_id")
          .eq("manager_id", user_id);
        const accomIds = accoms?.map(a => a.accommodation_id) || [];

        if (accomIds.length > 0) {
          const { data: apps } = await client
            .from("accommodation_application")
            .select("application_id, preferred_accommodation_id(name), users(first_name, last_name)")
            .in("preferred_accommodation_id", accomIds);
          const appIds = apps?.map(a => a.application_id) || [];
          apps?.forEach(a => {
            appLookup[a.application_id] = {
              accomName: (a.preferred_accommodation_id as any)?.name || "Accommodation",
              applicantName: (a.users as any) ? `${(a.users as any).first_name} ${(a.users as any).last_name}` : "A student"
            };
          });

          if (appIds.length > 0) {
            conditions.push(`and(entity_type.eq.application,entity_id.in.(${appIds.join(',')}),action_type.in.(submit_application,approve_application))`);
          }
        }
      } else if (role === "housing_admin" || role === "admin") {
        conditions.push(`action_type.in.(screen_application,mark_billing_paid,cancel_application,submit_application,submit_payment)`);
      }

      const { data: logs, error: logsError } = await adminClient
        .from("activity_log")
        .select("*")
        .or(conditions.join(','))
        .not("action_type", "in", "(login,logout)")
        .neq("user_id", user_id) // Don't notify users about their own actions
        .order("timestamp", { ascending: false })
        .limit(30);

      if (logsError) throw logsError;

      // --- LOOKUP PHASE ---
      // Fetch details for logs that haven't been looked up yet (critical for Admin)
      const appIdsToLookup = (logs as ActivityLog[] || [])
        .filter((log) => log.entity_type === 'application' && !appLookup[log.entity_id])
        .map((log) => log.entity_id);

      const billIdsToLookup = (logs as ActivityLog[] || [])
        .filter((log) => log.entity_type === 'billing' && !appLookup[log.entity_id])
        .map((log) => log.entity_id);

      if (appIdsToLookup.length > 0) {
        const { data: extraApps } = await adminClient
          .from("accommodation_application")
          .select("application_id, preferred_accommodation_id(name), users(first_name, last_name)")
          .in("application_id", appIdsToLookup);

        extraApps?.forEach((app: any) => {
          appLookup[app.application_id] = {
            accomName: (app.preferred_accommodation_id as any)?.name || "Accommodation",
            applicantName: (app.users as any) ? `${(app.users as any).first_name} ${(app.users as any).last_name}` : "A student"
          };
        });
      }

      if (billIdsToLookup.length > 0) {
        const { data: extraBills } = await adminClient
          .from("billing")
          .select("billing_id, accommodation_assignment(users(first_name, last_name))")
          .in("billing_id", billIdsToLookup);

        extraBills?.forEach((bill: any) => {
          const user = (bill.accommodation_assignment as any)?.users;
          appLookup[bill.billing_id] = {
            applicantName: user ? `${user.first_name} ${user.last_name}` : "A student"
          };
        });
      }

      const mapped = (logs || []).map((log: any) => {
        let title = log.action_type.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        let message = log.log_desc;
        let link = "";

        // Customize based on role and action
        if (role === 'student' || role === 'guest') {
          const details = appLookup[log.entity_id] || {};
          const accomName = details.accomName || "your selected accommodation";

          switch (log.action_type) {
            case 'screen_application':
              title = "Application Screened";
              message = `Your application to ${accomName} has been reviewed by the dormitory manager and forwarded to the administrator.`;
              link = `/${role}/application`;
              break;
            case 'approve_application':
              title = "Application Approved";
              message = log.log_desc.includes("Final Approval")
                ? `Congratulations! Your application to ${accomName} has received final approval.`
                : `Congratulations! Your application to ${accomName} has been approved by Admin and is now awaiting payment.`;
              link = `/${role}/application`;
              break;
            case 'reject_application':
              title = "Application Rejected";
              message = `We regret to inform you that your application to ${accomName} has been rejected.`;
              link = `/${role}/application`;
              break;
            case 'generate_billing':
              title = "New Billing Notice";
              message = `A new billing statement has been sent for your stay at ${accomName}.`;
              link = `/${role}/billing`;
              break;
            case 'update_assignment':
              title = "New Assignment";
              message = `You have been assigned to ${accomName}! Check your dashboard for details.`;
              link = `/${role}/dashboard`;
              break;
          }
        } else if (role === 'dormitory_manager') {
          const details = appLookup[log.entity_id] || {};
          const applicantName = details.applicantName || "A user";
          const accomName = details.accomName;

          switch (log.action_type) {
            case 'submit_application':
              title = "New Incoming Application";
              message = `${applicantName} has submitted an application to ${accomName}.`;
              link = "/manager/applications";
              break;
            case 'approve_application':
              title = "Application Approved by Admin";
              message = `The administrator has approved an application for ${applicantName} at ${accomName}.`;
              link = "/manager/applications";
              break;
          }
        } else if (role === 'housing_admin' || role === 'admin') {
          const details = appLookup[log.entity_id] || {};
          const applicantName = details.applicantName || "a user";
          const accomName = details.accomName || "accommodation";

          switch (log.action_type) {
            case 'screen_application':
              title = "Application Ready for Approval";
              message = `An application for ${applicantName} has been screened and is waiting for your approval.`;
              link = "/admin/applications";
              break;
            case 'cancel_application':
              title = "Application Cancelled";
              message = `${applicantName} has cancelled their application for ${accomName}.`;
              link = "/admin/applications";
              break;
            case 'mark_billing_paid':
              title = "Payment Received";
              message = `A payment has been recorded for ${applicantName}.`;
              link = "/admin/billing";
              break;
            case 'update_assignment':
              title = "Assignment Activated";
              message = `The assignment for ${applicantName} has been officially activated.`;
              link = "/admin/applications";
              break;
            case 'submit_payment':
              title = "Payment Proof Submitted";
              message = `${applicantName} has submitted proof of payment.`;
              link = "/admin/billing";
              break;
            case 'submit_application':
              title = "New Submission";
              message = `A new application has been submitted by ${applicantName}.`;
              link = "/admin/applications";
              break;
          }
        }

        return {
          id: log.log_id,
          title,
          message,
          created_at: log.timestamp,
          is_read: false,
          type: log.entity_type,
          link
        };
      });

      return { data: mapped, error: null };
    } catch (err: any) {
      console.error("Error fetching notifications from activity_log:", err.message);
      return { data: [], error: err };
    }
  }
};

/*
notes:
- date_Submitter or date_Submitted
- no status yet (??)
- not yet tested
- not sure yet for update sa students (only the name can be changed (as of now ??), nacheck ko rin supabase, srs, and specs, either not indicated/not possible)
*/
