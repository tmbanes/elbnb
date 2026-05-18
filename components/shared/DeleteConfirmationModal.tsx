"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  isLoading?: boolean;
}

export default function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Delete Image",
  description = "Are you sure you want to remove this image? This action cannot be undone.",
  isLoading = false,
}: DeleteConfirmationModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[440px] rounded-2xl border border-[#e2e4c0] bg-[#FDFFF4] shadow-lg font-[family-name:var(--font-archivo)] p-8">
        <DialogHeader className="space-y-2 text-left">
          <DialogTitle className="text-xl text-[#44291B] font-[family-name:var(--font-archivo-black)]">
            {title}
          </DialogTitle>
          <DialogDescription className="text-sm text-[#8c8b82] leading-relaxed">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-3 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 rounded-xl border-[#e2e4c0] text-[#44291B] bg-white hover:bg-[#F6F8D5] font-bold"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 rounded-xl bg-[#5591AB] hover:bg-[#4a7f9e] text-white font-bold"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Removing...</span>
              </div>
            ) : "Delete"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
