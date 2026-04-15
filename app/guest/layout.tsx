// app\guest\layout.tsx
import { requireRole } from "@/lib/utils/auth-utils";

//ui components
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { TooltipProvider } from "@/components/ui/tooltip";

export default async function GuestLayout({ children }: { children: React.ReactNode }) {
    await requireRole(["guest"]);
    return(
        <TooltipProvider>
            <SidebarProvider>
                
                <AppSidebar role="guest" />
                <SidebarTrigger />

                <main className="flex-1">
                    {/* optional trigger button */}
                    

                    {children}
                </main>
                
            </SidebarProvider>
        </TooltipProvider>
    );
}