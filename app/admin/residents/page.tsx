// app/admin/residents/page.tsx
import { requireRole } from "@/lib/auth/session";
import { ResidentsService } from "@/services/residents.service";
import ResidentsClient from "./ResidentsClient";

export default async function AdminResidentsPage() {
  await requireRole(['housing_admin', 'admin']);
  
  let mappedResidents = [];
  let errorMsg = null;
  
  try {
    mappedResidents = await ResidentsService.getResidentsForAdmin();
  } catch (error: any) {
    errorMsg = error.message;
  }

  return (
    <ResidentsClient
      initialResidents={mappedResidents}
      initialError={errorMsg}
    />
  );
}
