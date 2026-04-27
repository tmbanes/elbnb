// app\student\layout.tsx
import { requireRole } from "@/lib/auth/session";

//ui components
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarContentWrapper } from "@/components/sidebar-content-wrapper";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
    await requireRole(["student"]);
    return (
        <TooltipProvider>
            <SidebarProvider defaultOpen={false}>

                <AppSidebar role="student" />

                <SidebarContentWrapper>
                    <main className="flex-1">
                        {/* optional trigger button */}


                        {children}
                    </main>
                </SidebarContentWrapper>

            </SidebarProvider>
        </TooltipProvider>
    );
}