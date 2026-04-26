import { redirect } from "next/navigation";
import RoleSelection from "./RoleSelection";
import { getApiAuthenticatedUser } from "@/lib/auth/session";
import { User } from "@/types/user.types";

export default async function RoleSelectionPage() {
  const user: User | null = await getApiAuthenticatedUser();

  console.log(user);

  if (user && user.role) {
    redirect(`/`);
  }

  return <RoleSelection />;
}
