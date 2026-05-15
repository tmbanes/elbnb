import { getApiAuthenticatedUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { RotatingLanding } from "@/components/RotatingLanding";

export default async function LandingPage() {
  // Check if user is logged in
  const user = await getApiAuthenticatedUser();

  // Note: Redirections have been removed so logged-in users can access the landing page.
  // The RotatingLanding component will receive the user prop and can display specific UI (e.g. "Go to Dashboard" button).

  // We DO NOT call redirectByRole here because it has a built-in redirect to /onboarding

  return <RotatingLanding initialUser={user} />;
}
