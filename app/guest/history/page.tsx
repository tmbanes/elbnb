// app/guest/history/page.tsx

import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { studentProfileService } from "@/services/student_profile";
import { redirect } from "next/navigation";
import HistoryUI from "./HistoryUI";

export default async function GuestHistoryPage() {
    const supabase = await createSupabaseServerClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/");
    }

    const { data: profile } = await studentProfileService.getProfile(user.id);
    const { data: history } = await studentProfileService.getAccommodationHistory(user.id);

    return (
        <HistoryUI
            profile={profile}
            initialHistory={history || []}
        />
    );
}
