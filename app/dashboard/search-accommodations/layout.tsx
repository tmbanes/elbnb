import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"

export default function SearchAccommodationsLayout({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
<<<<<<< HEAD
      <SidebarProvider>
        <AppSidebar role="student" />
        <SidebarTrigger />
=======
      <SidebarProvider defaultOpen={false}>
        <AppSidebar role="student" />
>>>>>>> origin/develop
        <main className="flex-1">
          {children}
        </main>
      </SidebarProvider>
    </TooltipProvider>
  )
}
