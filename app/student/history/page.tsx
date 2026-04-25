// app/student/history/page.tsx

import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { studentProfileService } from "@/services/student_profile";
import { redirect } from "next/navigation";
import HistoryUI from "./HistoryUI";

export default async function HistoryPage() {
    const supabase = await createSupabaseServerClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/");
    }

    // Fetch history and current residency
    const [
        { data: profile },
        { data: currentResidency },
        { data: history }
    ] = await Promise.all([
        studentProfileService.getProfile(user.id),
        studentProfileService.getCurrentAccommodation(user.id),
        studentProfileService.getAccommodationHistory(user.id)
    ]);

    return (
        <HistoryUI 
            user={profile}
            currentResidency={currentResidency}
            history={history || []}
        />
    );
}
