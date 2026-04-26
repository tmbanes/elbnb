// app/student/history/page.tsx

import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { userProfileService } from "@/services/user_profile";
import { redirect } from "next/navigation";
import HistoryUI from "./HistoryUI";

import { getApiAuthenticatedUser } from "@/lib/auth/session";

export default async function HistoryPage() {
    const user = await getApiAuthenticatedUser();

    if (!user) {
        redirect("/onboarding");
    }

    // Fetch history and current residency
    const [
        { data: profile },
        { data: currentResidency },
        { data: history }
    ] = await Promise.all([
        userProfileService.getProfile(user.user_id),
        userProfileService.getCurrentAccommodation(user.user_id),
        userProfileService.getAccommodationHistory(user.user_id)
    ]);

    return (
        <HistoryUI
            user={profile}
            currentResidency={currentResidency}
            history={history || []}
        />
    );
}
