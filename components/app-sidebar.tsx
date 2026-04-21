// components/app-sidebar.tsx
"use client"

import * as React from "react"
import {
  Bot,
  PieChart,
  MapPinHouse,
  Newspaper,
  Banknote,
  Building,
  Users,
  Settings2,
  Building2,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

type Role = "student" | "admin" | "manager" | "guest"

const sidebarConfig = {
  student: {
    label: "Student",
    nav: [
      { title: "Dashboard", url: "/dashboard", icon: PieChart },
      { title: "Accommodations", url: "/student/accommodations", icon: MapPinHouse },
      { title: "Applications", url: "/student/application", icon: Newspaper },
      { title: "Billing", url: "/student/billing", icon: Banknote },
    ],
  },

  admin: {
    label: "Admin",
    nav: [
      { title: "Dashboard", url: "/admin/dashboard", icon: PieChart },
      { title: "Housing", url: "/admin/housing", icon: Building2 },
      { title: "Managers", url: "/admin/housing/managers", icon: Users },
      { title: "Billing", url: "/admin/billing", icon: Banknote },
      { title: "Applications", url: "/admin/applications", icon: Newspaper },
    ],
  },

  manager: {
    label: "Dorm Manager",
    nav: [ 
      { title: "Dashboard", url: "/dashboard", icon: PieChart },
      { title: "Applications", url: "/manager/applications", icon: Newspaper },
      { title: "Sample", url: "#", icon: Users },
    ],
  },

  guest: {
    label: "Guest",
    nav: [
      // should be "/guest/dashboard" but use /dashboard for testing
      { title: "Dashboard", url: "/guest/dashboard", icon: PieChart },
      { title: "Accommodations", url: "/guest/accommodations", icon: MapPinHouse },
      { title: "Applications", url: "/guest/application", icon: Newspaper },
      { title: "Billing", url: "/guest/billing", icon: Banknote },
    ],
  },
}

//sample user 
const user = {
  name: "shadcn",
  email: "m@example.com",
  avatar: "/avatars/shadcn.jpg",
}

export function AppSidebar({
  role = "student",
  ...props
}: React.ComponentProps<typeof Sidebar> & { role?: Role }) {
  const config = sidebarConfig[role]

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarContent>

        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <a href={config.nav[0].url}>
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                    <Bot className="h-4 w-4" />
                  </div>

                  <div className="flex flex-col gap-0.5 leading-none">
                    <span className="font-medium">{config.label}</span>
                    <span className="text-xs text-muted-foreground">
                      ELbnb
                    </span>
                  </div>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>


        <NavMain items={config.nav} />
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}