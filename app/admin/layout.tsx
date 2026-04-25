// app\admin\layout.tsx
import { requireRole } from "@/lib/utils/auth-utils"

//ui components
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { TooltipProvider } from "@/components/ui/tooltip";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    await requireRole(["housing_admin"]); // Temporarily disabled for testing
    return (
        await requireRole(["housing_admin"]);
    return (
        <TooltipProvider>
            <SidebarProvider>
                <AppSidebar role="admin" />

                <main className="flex-1">
                    {children}
                </main>
            </SidebarProvider>
        </TooltipProvider>
    );
}