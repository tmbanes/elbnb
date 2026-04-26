// app/admin/applications/page.tsx
import { getApiAuthenticatedUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import ApplicationsClient from "./ApplicationsClient";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";

export default async function Page() {
    const user = await getApiAuthenticatedUser();

    if (!user || user.role !== "housing_admin") {
        redirect("/onboarding");
    }

    const supabase = await createSupabaseServerClient();
    
    // Initial fetch for parallelization
    const [appsRes, accomsRes] = await Promise.all([
        supabase.from("accommodation_application")
            .select(`
                application_id,
                application_status,
                date_submitted,
                user_id,
                unit_id,
                preferred_unit_type,
                preferred_accommodation_id,
                users (
                    user_id,
                    first_name,
                    last_name,
                    student:student (
                        student_num
                    )
                ),
                accommodation:preferred_accommodation_id (
                    name
                ),
                unit:unit_id (
                    unit_id
                )
            `)
            .order("date_submitted", { ascending: false }),
        supabase.from("accommodation").select("accommodation_id, name, accommodation_type")
    ]);

    const initialData = {
        applications: appsRes.data || [],
        accommodations: accomsRes.data || []
    };

    return <ApplicationsClient user={user} initialData={initialData} />;
}
