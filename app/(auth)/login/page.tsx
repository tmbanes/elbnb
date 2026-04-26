import LoginWithEmailSetup from "./LoginWithEmailSetup";
import { getApiAuthenticatedUser } from "@/lib/auth/session";
import { User } from "@/types/user.types";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  const user: User | null = await getApiAuthenticatedUser();

  if (user && !user.role) {
    redirect(`/role-selection`);
  }

  return <LoginWithEmailSetup user={user} />;
}