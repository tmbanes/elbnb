import { requireRole } from "@/lib/auth/session";
import { ResidentsService } from "@/services/residents.service";
import ManagerResidentsClient from "./ManagerResidentsClient";

export default async function ManagerResidentsPage() {
  const user = await requireRole(['dormitory_manager', 'housing_admin', 'admin']);
  
  let residents = [];
  let accommodations = [];
  
  try {
    const data = await ResidentsService.getResidentsForManager(user.user_id);
    residents = data.residents;
    accommodations = data.accommodations;
  } catch (error) {
    console.error("Error fetching manager residents:", error);
  }

  return (
    <ManagerResidentsClient 
      initialResidents={residents} 
      initialAccommodations={accommodations} 
    />
  );
}
