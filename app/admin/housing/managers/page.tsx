import { Suspense } from "react";
import ManagersContent from "./ManagersPageContent";
import { requireRole } from "@/lib/auth/session";
import { HousingService } from "@/services/unit_accommodation/housing.service";

export default async function ManagersPage() {
  const user = await requireRole(['housing_admin', 'admin']);
  let mappedManagers: any[] = [];
  let fetchError = null;

  try {
    const managers = await HousingService.getAllManagers();
    mappedManagers = managers || [];
  } catch (error: any) {
    fetchError = error.message;
  }

  return (
    <div className="min-h-screen p-8 bg-[#F6F8D5]">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="mb-8">
          <Suspense fallback={<p className="p-6">Loading managers...</p>}>
            <ManagersContent initialManagers={mappedManagers} initialError={fetchError} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
