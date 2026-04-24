"use client"

import { useTransition, useState } from "react"
import { useRouter } from "next/navigation"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { cancelApplicationAction } from "@/lib/actions/cancel-application-action"
import { createActivityLog, getCurrentUserFromApi, isUserRole } from "@/services/activity_log/browser";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client"

export function CancelApplicationModal({ applicationId }: { applicationId: string }) {
  const [isPending, startTransition] = useTransition()
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  const handleCancel = () => {
    startTransition(async () => {
      const { error } = await cancelApplicationAction(applicationId);

      // Log activity
      const profile = await getCurrentUserFromApi();
      const supabase = await getSupabaseBrowserClient();

      // Extract accomm name
      const { data } = await supabase
      .from("accommodation_application")
      .select(`
        preferred_accommodation_id, 
        accommodation: preferred_accommodation_id (
          name
        )
      `)
      .eq("application_id", applicationId)
      .single();
    
    const name = (data as any)?.accommodation?.name ?? "Unknown Accommodation";
      const userRole = isUserRole(profile?.role) ? profile.role : "guest";

      if (profile?.user_id) {
        await createActivityLog({
          p_user_id: profile.user_id,
          p_action_type: "cancel_application",
          p_log_desc: `${profile.first_name} ${profile.last_name} cancelled application in
          ${name}`,
          p_entity_type: "accommodation",
          p_entity_id: applicationId,
          p_user_role: userRole,
        });
      }
      
      if (error) {
        console.error("Failed to cancel application:", error);
      } else {
        setIsOpen(false); 
      }
    })
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm">Cancel Application</Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="!bg-[#FDFFF4] !text-[#44291B]">
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to cancel your pending application? You will lose your spot in the queue.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel asChild disabled={isPending}>
            <Button
            variant={"ghost"}
            className="bg-[#FDFFF4] text-[#44291B]/60 hover:text-[#44291B] hover:bg-gray-100 border-transparent"
            >
              Go Back
            </Button>

          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={(e) => {
              e.preventDefault() 
              handleCancel()
            }}
            disabled={isPending}
            className="!bg-[#DF3538] !text-white hover:!bg-[#DF3538]/80 border-transparent"
          >
            {isPending ? "Canceling..." : "Cancel Application"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}