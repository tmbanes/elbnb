import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"

export default function SearchAccommodationsLayout({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      <SidebarProvider defaultOpen={false}>
        <AppSidebar role="student" />
        <main className="flex-1">
          {children}
        </main>
      </SidebarProvider>
    </TooltipProvider>
  )
}
