import { getApiAuthenticatedUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { RotatingLanding } from "@/components/RotatingLanding";

export default async function LandingPage() {
  // Check if user is logged in
  const user = await getApiAuthenticatedUser();

  // Explicitly handle redirects ONLY if user is clearly logged in
  if (user && user.role) {
    if (user.role === "student") redirect("/student/dashboard");
    if (user.role === "housing_admin") redirect("/admin/dashboard");
    if (user.role === "dormitory_manager") redirect("/manager/dashboard");
    if (user.role === "guest") redirect("/guest/dashboard");

    // Fallback for unexpected roles if logged in
    redirect("/dashboard");
  }

  // If NOT logged in (user is null), show the landing page
  // We DO NOT call redirectByRole here because it has a built-in redirect to /onboarding
  return <RotatingLanding initialUser={user} />;
}
