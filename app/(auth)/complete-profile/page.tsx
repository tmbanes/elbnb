import { redirect } from "next/navigation";
import CompleteProfile from "./CompleteProfile";
import { getApiAuthenticatedUser } from "@/lib/auth/session";

export default async function CompleteProfilePage() {
  const user = await getApiAuthenticatedUser();

  // console.log(user);

  if (!user) {
    redirect("/onboarding");
  }

  // If the user already has a complete profile, they shouldn't be on the complete-profile page.
  if ((user as any).is_profile_complete) {
    if (user.role === "student") redirect("/student/dashboard");
    else if (user.role === "housing_admin") redirect("/admin/dashboard");
    else if (user.role === "dormitory_manager") redirect("/manager/dashboard");
    else if (user.role === "guest") redirect("/guest/dashboard");
    else redirect("/");
  }

  return <CompleteProfile user={user} />;
}
