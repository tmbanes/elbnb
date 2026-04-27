// app\manager\layout.tsx
import { requireRole } from "@/lib/auth/session";

//ui components
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarContentWrapper } from "@/components/sidebar-content-wrapper";

export default async function ManagerLayout({ children }: { children: React.ReactNode }) {
    await requireRole(["dormitory_manager"]);
    return (
        <TooltipProvider>
            <SidebarProvider>
                <AppSidebar role="manager" />

                <SidebarContentWrapper>
                    <main className="flex-1">
                        {children}
                    </main>
                </SidebarContentWrapper>
            </SidebarProvider>
        </TooltipProvider>
    );
}