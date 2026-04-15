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
      // /student/dashboard but use /dashboard for testing
      { title: "Dashboard", url: "/dashboard", icon: PieChart },
      { title: "Accommodations", url: "/student/accommodation", icon: MapPinHouse },
      { title: "Applications", url: "#", icon: Newspaper },
      { title: "Billing", url: "#", icon: Banknote },
    ],
  },

  admin: {
    label: "Admin",
    nav: [
      { title: "Dashboard", url: "/admin/dashboard", icon: PieChart },
      { title: "Sample", url: "#", icon: Users },
    ],
  },

  manager: {
    label: "Dorm Manager",
    nav: [ 
      { title: "Dashboard", url: "/dashboard", icon: PieChart },
      { title: "Sample", url: "#", icon: Users },
    ],
  },

  guest: {
    label: "Guest",
    nav: [
      // should be "/guest/dashboard" but use /dashboard for testing
      { title: "Dashboard", url: "/dashboard", icon: PieChart },
      { title: "Accommodations", url: "#", icon: MapPinHouse },
      { title: "Applications", url: "#", icon: Newspaper },
      { title: "Billing", url: "#", icon: Banknote },
      { title: "Guest Sample", url: "#", icon: Users },
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