"use client";

import { ChevronLeft } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

interface BackToDashboardProps {
  role: "admin" | "manager" | "guest" | "student";
}

export function BackToDashboard({ role }: BackToDashboardProps) {
  const router = useRouter();
  const pathname = usePathname();

  // Don't show if we are already at the dashboard root
  const dashboardRoot = `/${role}`;
  if (pathname === dashboardRoot) return null;

  return (
    <div className="px-6 pt-4 pb-2 animate-in slide-in-from-left duration-300">
      <Button
        variant="ghost"
        onClick={() => router.push(dashboardRoot)}
        className="flex items-center gap-1.5 text-[#264384] hover:text-[#5591AB] font-black text-[11px] uppercase tracking-widest p-0 h-auto hover:bg-transparent transition-all group"
      >
        <div className="w-6 h-6 rounded-full bg-[#264384]/5 flex items-center justify-center group-hover:bg-[#264384]/10 transition-colors">
          <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
        </div>
        Back to Dashboard
      </Button>
    </div>
  );
}
