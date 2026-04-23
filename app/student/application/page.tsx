import { createSupabaseServerClient } from "@/lib/supabase/server-client"
import { redirect } from "next/navigation"
import { userProfileService } from "@/services/user_profile"
import ApplicationsPage from "./ApplicationsPage";

export default async function AccommodationHistoryPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  // Redirect if not authenticated
  if (!user || authError) {
    redirect("/onboarding");
  }

  // Fetch data from service layer
  const { data: records, error } = await userProfileService.getAccommodationHistory(user.id);

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
      {/* Container for the Header. 
          The ApplicationsPage has its own internal container for the cards 
      */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        <header className="mb-2">
          <h1 className="text-4xl font-bold tracking-tight" style={{ color: '#44291B' }}>
            Accommodation Overview
          </h1>
          <p className="mt-2 text-lg" style={{ color: '#44291B', opacity: 0.8 }}>
            Manage your active requests and view past history.
          </p>
        </header>
      </div>

      {/* Render the component with the split sections and beige/blue theme */}
      <ApplicationsPage records={records || []} />
    </div>
  )
}