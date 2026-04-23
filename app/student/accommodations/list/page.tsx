import { UnitAccomodationsDisplayService } from "@/services/unit_accommodation";
import ListOfAccommodationsPage from "./ListAccommodationPage";

export default async function Page() {
  const { data: accommodations, error } =
    await UnitAccomodationsDisplayService.listAccomodations("student");

  if (error) {
    return <div className="p-10 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="bg-[#F6F8D5] min-h-screen"> 
      <ListOfAccommodationsPage initialAccommodations={accommodations || []} />
    </div>
  );
}