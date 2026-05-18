import { createSupabaseServerClient } from "@/lib/supabase/server-client"
import { redirect } from "next/navigation"
import { userProfileService } from "@/services/user_profile"
import { ensureInitialInvoicesForUser } from "@/services/user-services"
import ApplicationsPage from "./ApplicationsPage";

import { getApiAuthenticatedUser } from "@/lib/auth/session";
import { Archivo_Black } from 'next/font/google'

const archivoBlack = Archivo_Black({ subsets: ['latin'], weight: '400' })

export default async function AccommodationHistoryPage() {
  const user = await getApiAuthenticatedUser();

  // Redirect if not authenticated
  if (!user) {
    redirect("/onboarding");
  }

  // Keep billing invoices in sync for pending_payment applications.
  ensureInitialInvoicesForUser(user.user_id).catch(console.error);

  // Fetch data from service layer
  const { data: records, error } = await userProfileService.getAccommodationHistory(user.user_id);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F6F8D5]">
        <div className="p-6 bg-white border border-red-200 rounded-lg shadow-sm">
          <p className="text-red-600 font-medium">Error loading data: {error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F6F8D5' }}>
      {/* Render the component with the split sections and beige/blue theme */}
      <ApplicationsPage records={records || []} />
    </div>
  )
}