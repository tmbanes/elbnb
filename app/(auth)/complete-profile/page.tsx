import { redirect } from "next/navigation";
import CompleteProfile from "./CompleteProfile";
import { getApiAuthenticatedUser } from "@/lib/auth/session";

export default async function CompleteProfilePage() {
  const user = await getApiAuthenticatedUser();

  // console.log(user);

  if (!user) {
    redirect("/onboarding");
  }

  // If the user already has a complete profile (role + real name), they shouldn't be on the complete-profile page.
  if (user.role && user.first_name && user.first_name !== "TBD") {
    if (user.role === "student") redirect("/student/dashboard");
    else if (user.role === "housing_admin") redirect("/admin/dashboard");
    else if (user.role === "dormitory_manager") redirect("/manager/dashboard");
    else if (user.role === "guest") redirect("/guest/dashboard");
    else redirect("/");
  }

  return <CompleteProfile user={user} />;
}
