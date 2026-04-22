import SignUpWithEmailSetup from "./SignUpWithEmailSetup";
import { getUserWithRole } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { User } from "@/types/user.types";

export default async function SignUpPage() {
  const user: User | null = await getUserWithRole();

  if (user) {
    redirect(`/`);
  }

  return <SignUpWithEmailSetup user={user} />;
}