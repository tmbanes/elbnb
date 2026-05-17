"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
}: ModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto bg-[#FDFFF4] text-[#44291B]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-[#44291B]">
            {title}
          </DialogTitle>
          {description && (
            <div className="text-sm text-[#44291B]">{description}</div>
          )}
        </DialogHeader>

        <div className="grid gap-4 py-4">{children}</div>
      </DialogContent>
    </Dialog>
  );
}

