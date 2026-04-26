import SignUpWithEmailSetup from "./SignUpWithEmailSetup";
import { getApiAuthenticatedUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export default async function SignUpPage() {
  const user = await getApiAuthenticatedUser();

  if (user && (!user.role || !user.first_name || user.first_name === "TBD")) {
    redirect(`/complete-profile`);
  }

  return <SignUpWithEmailSetup user={user} />;
}