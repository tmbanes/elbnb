// app\manager\layout.tsx
import { requireRole } from "@/lib/auth/client-auth";

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