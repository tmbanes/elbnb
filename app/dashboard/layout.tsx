import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getUserWithRole } from "@/lib/auth/session";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    // Fetch the user role to correctly setup the Sidebar navigation config
    const user = await getUserWithRole();
    const role = user?.role || "student"; 
    
    return (
        <TooltipProvider>
            <SidebarProvider defaultOpen={false}>
                <AppSidebar role={role as any} />
                <main className="flex-1 w-full relative overflow-x-hidden">
                    {children}
                </main>
            </SidebarProvider>
        </TooltipProvider>
    );
}
