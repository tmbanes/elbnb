// app\student\layout.tsx
import { requireRole } from "@/lib/auth/session";

//ui components
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { TooltipProvider } from "@/components/ui/tooltip";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
    await requireRole(["student"]);
    return(
        <TooltipProvider>
            <SidebarProvider>
                
                <AppSidebar role="student" />
                <SidebarTrigger />

                <main className="flex-1">
                    {/* optional trigger button */}
                    

                    {children}
                </main>
                
            </SidebarProvider>
        </TooltipProvider>
    );
}