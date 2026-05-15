"use server"

import { userProfileService } from "@/services/user_profile"
import { revalidatePath } from "next/cache"

export async function cancelApplicationAction(applicationId: string) {
  // Call existing service securely on the server
  const result = await userProfileService.cancelAccommodationApplication(applicationId);

  revalidatePath("/dashboard/history");
  revalidatePath("/student/billing");
  revalidatePath("/guest/billing");
  revalidatePath("/student/application");
  revalidatePath("/guest/application");

  if (result.error) {
    return { error: "Failed to cancel application." };
  }

  return { error: null };
}