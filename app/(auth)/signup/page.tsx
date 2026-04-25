import SignUpWithEmailSetup from "./SignUpWithEmailSetup";
import { getApiAuthenticatedUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { User } from "@/types/user.types";

export default async function SignUpPage() {
  const user: User | null = await getApiAuthenticatedUser();

  if (user) {
    redirect(`/`);
  }

  return <SignUpWithEmailSetup user={user} />;
}