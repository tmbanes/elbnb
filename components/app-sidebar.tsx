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
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client"
import { useSidebar } from "@/components/ui/sidebar"
import { UserProfile } from "@/types/user_profile"
import Link from "next/link"
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
      { title: "Dashboard", url: "/student/dashboard", icon: PieChart },
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
      { title: "Residents", url: "/admin/residents", icon: Users },
      { title: "Applications", url: "/admin/applications", icon: Newspaper },
    ],
  },

  manager: {
    label: "Dorm Manager",
    nav: [
      { title: "Dashboard", url: "/manager/dashboard", icon: PieChart },
      { title: "Housing", url: "/manager/housing", icon: Building2 },
      { title: "Residents", url: "/manager/residents", icon: Users },
      { title: "Applications", url: "/manager/applications", icon: Newspaper },
      { title: "Residents", url: "/manager/residents", icon: Users },
    ],
  },

  guest: {
    label: "Guest",
    nav: [
      { title: "Dashboard", url: "/guest/dashboard", icon: PieChart },
      { title: "Accommodations", url: "/guest/accommodations", icon: MapPinHouse },
      { title: "Applications", url: "/guest/application", icon: Newspaper },
      { title: "Billing", url: "/guest/billing", icon: Banknote },
    ],
  },
}

export function AppSidebar({
  role = "admin", // Defaulted to admin to see the exact menu from your image
  ...props
}: React.ComponentProps<typeof Sidebar> & { role?: Role }) {
  const config = sidebarConfig[role]
  const supabase = getSupabaseBrowserClient()

  const [userData, setUserData] = React.useState({
    name: "Loading...",
    email: "",
    avatar: "/avatars/shadcn.jpg",
  })
  const [hasMounted, setHasMounted] = React.useState(false)

  React.useEffect(() => {
    setHasMounted(true)
  }, [])

  React.useEffect(() => {
    async function fetchUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await (supabase as any)
          .from("users")
          .select("first_name, last_name, email, profile_picture_url")
          .eq("user_id", user.id)
          .single()

        const userProfile = data;

        if (userProfile) {
          setUserData({
            name: `${userProfile.first_name || ""} ${userProfile.last_name || ""}`.trim() || user.email?.split("@")[0] || "User",
            email: userProfile.email || user.email || "",
            avatar: userProfile.profile_picture_url || "/avatars/shadcn.jpg",
          })
        } else {
          setUserData({
            name: user.email?.split("@")[0] || "User",
            email: user.email || "",
            avatar: "/avatars/shadcn.jpg",
          })
        }
      } else {
        setUserData({
          name: "Not logged in",
          email: "",
          avatar: "/avatars/shadcn.jpg",
        })
      }
    }
    fetchUser()
  }, [supabase])

  const { toggleSidebar, state, setOpen } = useSidebar()

  if (!hasMounted) {
    return <div className="w-[var(--sidebar-width)] bg-[#8ba665] h-screen" />;
  }

  return (
    <>
      {/* Click-away overlay for explicitly closing the sidebar when it is expanded */}
      {state === "expanded" && (
        <div
          className="fixed inset-0 z-30 bg-black/5 backdrop-blur-sm cursor-pointer"
          onClick={() => setOpen ? setOpen(false) : toggleSidebar()}
        />
      )}

      <Sidebar
        collapsible="offcanvas"
        className="bg-[#8ba665] text-white border-none shadow-xl z-40"
        {...props}
      >
        <SidebarContent className="bg-[#8ba665] text-white">

          <SidebarHeader className="pt-8 pb-8 px-6 group-data-[collapsible=icon]:px-2 flex items-center justify-center overflow-hidden">
            <Link href="/" className="flex items-center justify-center gap-2 group w-full">
              <img
                src="/logo/logo_text.png"
                alt="ELbnb Logo"
                className="h-12 w-auto object-contain transition-all duration-300 ease-out group-hover:scale-105 group-hover:opacity-90 drop-shadow-sm group-data-[collapsible=icon]:hidden"
              />
            </Link>
          </SidebarHeader>


          <NavMain items={config.nav} />
        </SidebarContent>

        <SidebarFooter className="p-4 group-data-[collapsible=icon]:p-2 bg-[#8ba665] overflow-hidden">
          <NavUser user={userData} role={role} />
        </SidebarFooter>

        <SidebarRail />
      </Sidebar>

      {/* Custom Bottom-Left Trigger */}
      {state === "collapsed" && (
        <button
          id="custom-sidebar-trigger"
          onClick={toggleSidebar}
          className="fixed -bottom-20 -left-6 w-40 h-40 bg-[#8ba665] rounded-full z-30 transition-transform duration-500 ease-out hover:-translate-y-6 outline-none shadow-2xl cursor-pointer group"
          title="Open Sidebar"
        >
          <img
            src="/logo/logo_house.png"
            alt="Open Sidebar"
            className="absolute -top-2 right-10 w-16 h-auto drop-shadow-lg transition-transform duration-500 ease-out group-hover:scale-110 group-hover:-translate-y-2 group-hover:rotate-3"
          />
        </button>
      )}
    </>
  )
}