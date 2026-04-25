// app/guest/dashboard/page.tsx

import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { studentProfileService } from "@/services/student_profile";
import { getStudentBillsDetailed } from "@/services/user-services";
import { redirect } from "next/navigation";
import GuestDashboardUI from "./guest-dashboard-ui";

export default async function GuestDashboardPage() {
    const supabase = await createSupabaseServerClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/");
    }

    // 1. Fetch guest profile
    const { data: profile } = await studentProfileService.getProfile(user.id);

    // 2. Fetch Active Residency
    const { data: activeResidency } = await supabase
        .from('accommodation_assignment')
        .select(`
            *,
            accommodation:accommodation_id (*),
            unit:unit_id (*)
        `)
        .eq('user_id', user.id)
        .eq('assignment_status', 'active')
        .single();

    // 3. Fetch Applications
    const { data: applications } = await supabase
        .from('accommodation_application')
        .select('*')
        .eq('user_id', user.id)
        .order('date_submitted', { ascending: false });

    // 4. Fetch History
    const { data: history } = await studentProfileService.getAccommodationHistory(user.id);

    // 5. Fetch Documents
    const { data: documents } = await studentProfileService.getDocuments(user.id);

    // 6. Fetch Billing
    const { data: bills } = await getStudentBillsDetailed(user.id);

    return (
        <GuestDashboardUI
            profile={profile}
            initialActiveResidency={activeResidency}
            initialApplications={applications || []}
            initialHistory={history || []}
            initialDocuments={documents || []}
            initialBills={bills || []}
        />
    );
}
