"use server";

import { userProfileService } from "@/services/user_profile";
import { revalidatePath } from "next/cache";

export async function submitExtensionRequest(user_id: string, currentResidency: any) {
    try {
        const { error } = await userProfileService.createExtensionApplication(user_id, currentResidency);
        if (error) throw error;

        revalidatePath("/student/dashboard");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
