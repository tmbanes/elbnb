import SignUpWithEmailSetup from "./SignUpWithEmailSetup";
import { getApiAuthenticatedUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export default async function SignUpPage() {
  const user = await getApiAuthenticatedUser();

  if (user) {
    redirect(`/`);
  }

  return <SignUpWithEmailSetup user={user} />;
}