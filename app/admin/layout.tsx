// app\admin\layout.tsx
import { requireRole } from "@/lib/auth/client-auth"

//ui components
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { TooltipProvider } from "@/components/ui/tooltip";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    // await requireRole(["housing_admin"]); // Temporarily disabled for testing
    return(
        <TooltipProvider>
            <SidebarProvider>
                <AppSidebar role="admin" />
                <SidebarTrigger />

                <main className="flex-1">
                    {children}
                </main>
            </SidebarProvider>
        </TooltipProvider>
    );
}