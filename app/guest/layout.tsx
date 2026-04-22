// app\guest\layout.tsx
import { requireRole } from "@/lib/auth/session";

//ui components
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { TooltipProvider } from "@/components/ui/tooltip";

export default async function GuestLayout({ children }: { children: React.ReactNode }) {
    await requireRole(["guest"]);
    return (
        <TooltipProvider>
            <SidebarProvider defaultOpen={false}>

                <AppSidebar role="guest" />

                <main className="flex-1">
                    {/* optional trigger button */}


                    {children}
                </main>

            </SidebarProvider>
        </TooltipProvider>
    );
}