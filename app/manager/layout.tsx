// app\manager\layout.tsx
<<<<<<< HEAD
import { requireRole } from "@/lib/utils/auth-utils";
=======
import { requireRole } from "@/lib/auth/client-auth";
>>>>>>> 76e8f3255db7be2b6cbe835d611a2e1be74975e1

//ui components
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { TooltipProvider } from "@/components/ui/tooltip";

export default async function ManagerLayout({ children }: { children: React.ReactNode }) {
    await requireRole(["dormitory_manager"]);
    return(
        <TooltipProvider>
            <SidebarProvider>
                <AppSidebar role="manager" />
                <SidebarTrigger />

                <main className="flex-1">
                    {children}
                </main>
            </SidebarProvider>
        </TooltipProvider>
    );
}