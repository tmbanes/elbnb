import LoginWithEmailSetup from "./LoginWithEmailSetup";
import { getUserWithRole } from "@/lib/auth/session";
import { User } from "@/types/user.types";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  const user: User | null = await getUserWithRole();
  
  if (user) {
    redirect(`/`);
  }

  return <LoginWithEmailSetup user={user}/>;
}