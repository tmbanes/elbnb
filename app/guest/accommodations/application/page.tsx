import { getApiAuthenticatedUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import ApplyAccommodationForm from "./ApplicationForm";

export default async function Page() {
  const user = await getApiAuthenticatedUser();

  if (!user) {
    redirect("/onboarding");
  }

  return (
    <main className="min-h-screen">
      <ApplyAccommodationForm authUser={user} />
    </main>
  );
}