import { getApiAuthenticatedUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import ManagerApplicationsClient from "./ManagerApplicationsClient";

export default async function Page() {
  const user = await getApiAuthenticatedUser();

  if (!user) {
    redirect("/onboarding");
  }

  if (user.role !== "dormitory_manager") {
    redirect("/onboarding");
  }

  return <ManagerApplicationsClient user={user} />;
}
