import LoginWithEmailSetup from "./LoginWithEmailSetup";
import { getUserWithRole } from "@/lib/utils/auth-utils";
import { UserWithRole } from "@/types/user.types";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  const userWithRole: UserWithRole | null = await getUserWithRole();
  
  if (userWithRole) {
    redirect(`/`);
  }

  return <LoginWithEmailSetup user={userWithRole} />;
}