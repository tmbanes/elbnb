// app/manager/student-history/[id]/page.tsx

import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { userProfileService } from "@/services/user_profile";
import { redirect } from "next/navigation";
import StudentHistoryUI from "./StudentHistoryUI";

import { getApiAuthenticatedUser } from "@/lib/auth/session";

export default async function ManagerStudentHistoryPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: studentId } = await params;
    const supabase = await createSupabaseServerClient();
    const user = await getApiAuthenticatedUser();

    if (!user) {
        redirect("/onboarding");
    }
    const { data: profile } = await userProfileService.getProfile(studentId);

    if (!profile) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F6F8D5]">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-slate-800">Student Profile Not Found</h1>
                    <p className="text-slate-500 mt-2">The requested student ID could not be located in our records.</p>
                </div>
            </div>
        );
    }

    // Pre-fetch student data for the manager
    const { data: history } = await userProfileService.getAccommodationHistory(studentId);
    const { data: billing } = await supabase
        .from('billing')
        .select('*')
        .eq('user_id', studentId)
        .order('due_date', { ascending: false });

    return (
        <StudentHistoryUI
            profile={profile}
            initialHistory={history || []}
            initialBilling={billing || []}
        />
    );
}
