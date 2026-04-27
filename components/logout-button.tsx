"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { createActivityLog, isUserRole, getCurrentUserFromApi,} from "@/services/activity_log/browser";

export default function LogoutButton() {
  const supabase = getSupabaseBrowserClient();

  const handleLogout = async () => {
     // Log the action for successful sign-out.
     const profile = await getCurrentUserFromApi();
     const userRole = isUserRole(profile?.role) ? profile.role : "guest";
 
     if (profile?.user_id) {
       await createActivityLog({
         p_user_id: profile.user_id,
         p_action_type: "logout",
         p_log_desc: `${profile.first_name} logged out `,
         p_entity_type: "auth",
         p_entity_id: profile.user_id,
         p_user_role: userRole,
       });
     }
       
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <button 
      onClick={handleLogout}
      className="px-4 py-2 text-xs font-bold text-white bg-red-500/80 hover:bg-red-500 rounded-lg transition-colors"
    >
      Log Out
    </button>
  );
}
