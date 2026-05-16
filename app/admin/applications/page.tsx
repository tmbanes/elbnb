import { requireRole } from "@/lib/auth/session";
import ApplicationsClient from "./ApplicationsClient";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { getAdminApplicationsService } from "@/services/application_workflow/applications.service";

export default async function Page() {
    const user = await requireRole(['housing_admin', 'admin']);
    const supabase = await createSupabaseServerClient();

    // Initial fetch for parallelization
    const appsRes = await getAdminApplicationsService(user, {});

    const initialData = {
        applications: appsRes.applications || [],
        accommodations: appsRes.accommodations || []
    };

    return <ApplicationsClient user={user} initialData={initialData} />;
}
