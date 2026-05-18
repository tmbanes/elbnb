"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AlertCircle, CheckCircle2, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type HousingToastVariant = "success" | "error";

export interface HousingToastState {
  title: string;
  message?: string;
  variant?: HousingToastVariant;
}

interface HousingToastProps {
  toast: HousingToastState | null;
  onClose: () => void;
  duration?: number;
}

export function HousingToast({ toast, onClose, duration = 4000 }: HousingToastProps) {
  const [mounted, setMounted] = useState(false);
  const [hiding, setHiding] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!toast) return;

    setHiding(false);
    const timer = setTimeout(() => dismiss(), duration);
    return () => clearTimeout(timer);
  }, [toast, duration]);

  function dismiss() {
    setHiding(true);
    setTimeout(() => onClose(), 300);
  }

  if (!mounted || !toast) return null;

  const isSuccess = toast.variant !== "error";

  return createPortal(
    <div
      className={cn(
        "fixed top-0 right-0 p-6 md:p-8 z-[9999] pointer-events-none",
        hiding ? "animate-toast-out" : "animate-toast-in"
      )}
    >
      <div
        className={cn(
          "pointer-events-auto max-w-sm rounded-xl border border-[#e2e4c0] bg-[#FDFFF4] p-4 shadow-lg flex items-start gap-3",
          isSuccess ? "border-l-4 border-l-[#78A24C]" : "border-l-4 border-l-[#DF3538]"
        )}
      >
        <div
          className={cn(
            "p-2 rounded-full shrink-0",
            isSuccess ? "bg-[#E7FAD3]" : "bg-red-50"
          )}
        >
          {isSuccess ? (
            <CheckCircle2 className="w-5 h-5 text-[#78A24C]" />
          ) : (
            <AlertCircle className="w-5 h-5 text-[#DF3538]" />
          )}
        </div>
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="font-bold text-sm text-[#44291B]">{toast.title}</p>
          {toast.message && (
            <p className="text-xs text-[#8c8b82] mt-0.5">{toast.message}</p>
          )}
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="text-[#8c8b82] hover:text-[#44291B] transition-colors shrink-0"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>,
    document.body
  );
}
