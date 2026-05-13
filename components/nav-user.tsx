// components/nav-user.tsx
"use client"

import {
  Bell,
  ChevronsUpDown,
  CreditCard,
  LogOut,
  Sparkles,
  User,
} from "lucide-react"
import Link from "next/link"

import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

export function NavUser({
  user,
  role = "student",
}: {
  user: {
    name: string
    email: string
    avatar: string
  }
  role?: string
}) {
  const { isMobile, setOpenMobile, setOpen } = useSidebar()
  const supabase = getSupabaseBrowserClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = "/"
  }

  const closeSidebar = () => {
    if (isMobile) {
      setOpenMobile(false)
    } else {
      setOpen(false)
    }
  }

  return (
    <SidebarMenu>
      <div className="px-2 mb-2 group-data-[collapsible=icon]:hidden">
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">
          Profile
        </span>
      </div>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="h-14 px-4 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:justify-center text-white/80 hover:bg-white/10 hover:text-white data-[state=open]:bg-white/20 data-[state=open]:text-white transition-all duration-300 ease-out rounded-lg group/user cursor-pointer border-none outline-none"
            >
              <Avatar className="h-9 w-9 rounded-full transition-transform duration-300 group-hover/user:scale-105 shadow-sm">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-full bg-white/20 text-white font-medium">CN</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight ml-1 group-data-[collapsible=icon]:hidden">
                <span className="truncate font-semibold text-white tracking-wide">{user.name}</span>
                <span className="truncate text-xs text-white/70">{user.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4 opacity-80 group-hover/user:opacity-100 transition-all duration-300 group-data-[collapsible=icon]:hidden" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg bg-[#F4F5E1] border border-[#7EB647]/30 shadow-lg text-[#3E2723] p-1"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-2 py-2 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-full">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-full bg-[#7EB647]/10 text-[#3E2723] font-black uppercase">
                    {user.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-black text-[#3E2723]">{user.name}</span>
                  <span className="truncate text-xs font-semibold text-[#3E2723]/60">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-[#7EB647]/20 my-1" />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild onClick={closeSidebar} className="focus:bg-[#8bc453]/20 focus:text-[#3E2723] rounded-md transition-colors cursor-pointer px-2 py-2">
                <Link href={`/${role}/user-profile`} className="w-full flex items-center gap-3 font-bold text-[#3E2723]">
                  <User className="size-[18px] text-[#3E2723]" strokeWidth={2.5} />
                  View Profile
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="bg-[#7EB647]/20 my-1" />
            <DropdownMenuItem onClick={handleLogout} className="focus:bg-red-100 focus:text-red-700 rounded-md transition-colors cursor-pointer px-2 py-2 font-bold text-red-600">
              <LogOut className="size-[18px] text-red-500" strokeWidth={2.5} />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}