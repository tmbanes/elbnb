// app/dashboard/history/actions.ts
"use server"

import { studentProfileService } from "@/services/student_profile"
import { revalidatePath } from "next/cache"

export async function cancelApplicationAction(applicationId: string) {
  // Call existing service securely on the server
  const result = await studentProfileService.cancelAccommodationApplication(applicationId);
  
  // This automatically clears the cache so the page immediately shows the updated data
  revalidatePath("/dashboard/history"); 
  
  if (result.error) {
    return { error: "Failed to cancel application." }; 
  }
  
  return { error: null };
}