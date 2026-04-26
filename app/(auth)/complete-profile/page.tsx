import { redirect } from "next/navigation";
import CompleteProfile from "./CompleteProfile";
import { getApiAuthenticatedUser } from "@/lib/auth/session";
import { User } from "@/types/user.types";

export default async function CompleteProfilePage() {
  const user: User | null = await getApiAuthenticatedUser();

  console.log(user);

  // If the user already has names and a role, they are done.
  // Since we set names to "TBD" in signup, we check for that or empty.
  if (user && user.role && user.first_name && user.first_name !== "TBD") {
    redirect(`/`);
  }

  return <CompleteProfile user={user} />;
}
