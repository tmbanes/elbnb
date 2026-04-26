import { getApiAuthenticatedUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { RotatingLanding } from "@/components/RotatingLanding";

export default async function LandingPage() {
  // Check if user is logged in
  const user = await getApiAuthenticatedUser();

  // If user is logged in but profile is incomplete
  if (user != null && (!user.role || !user.first_name || user.first_name === "TBD")) {
    redirect("/complete-profile");
  }

  // user is logged in and has role and complete profile
  if (user && user.role) {
    if (user.role === "student") redirect("/student/dashboard");
    if (user.role === "housing_admin") redirect("/admin/dashboard");
    if (user.role === "dormitory_manager") redirect("/manager/dashboard");
    if (user.role === "guest") redirect("/guest/dashboard");
  }

  // We DO NOT call redirectByRole here because it has a built-in redirect to /onboarding

  return <RotatingLanding initialUser={user} />;
}
