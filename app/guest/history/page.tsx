// app/guest/history/page.tsx

import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { userProfileService } from "@/services/user_profile";
import { redirect } from "next/navigation";
import HistoryUI from "./HistoryUI";

import { getApiAuthenticatedUser } from "@/lib/auth/session";

export default async function GuestHistoryPage() {
    const user = await getApiAuthenticatedUser();

    if (!user) {
        redirect("/onboarding");
    }

    const { data: profile } = await userProfileService.getProfile(user.user_id);
    const { data: history } = await userProfileService.getAccommodationHistory(user.user_id);

    return (
        <HistoryUI
            profile={profile}
            initialHistory={history || []}
        />
    );
}
