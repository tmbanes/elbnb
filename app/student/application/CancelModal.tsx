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

export function CancelApplicationModal({ applicationId }: { applicationId: string }) {
  const [isPending, startTransition] = useTransition()
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  const handleCancel = () => {
    startTransition(async () => {
      const { error } = await cancelApplicationAction(applicationId);
      
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
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to cancel your pending application? You will lose your spot in the queue.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Keep Application</AlertDialogCancel>
          <AlertDialogAction 
            onClick={(e) => {
              e.preventDefault() 
              handleCancel()
            }}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending ? "Canceling..." : "Cancel Application"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}