// components/nav-main.tsx
"use client"

import { type LucideIcon } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { useSidebar } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"

export function NavMain({
  items,
}: {
  items: {
    key: number;
    title: string;
    url: string;
    icon?: LucideIcon;
    isActive?: boolean;
  }[]
}) {
  const pathname = usePathname()
  const { setOpen, isMobile } = useSidebar()
  const router = useRouter();

  return (
    <SidebarGroup>
      <SidebarMenu className="gap-1.5 px-3">
        {items.map((item) => {
          const isActive = pathname === item.url || item.isActive

          return (
            <SidebarMenuItem key={item.key}>
              <SidebarMenuButton
                tooltip={item.title}
                asChild
                className={cn(
                  "h-12 px-4 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:justify-center w-full text-white/80 hover:bg-white/10 hover:text-white transition-all duration-300 ease-out rounded-lg group/nav-item",
                  isActive && "bg-white/20 text-white font-medium shadow-sm"
                )}
              >
                <Link
                  href={item.url}
                  className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center"
                  onClick={() => {
                    if (!isMobile) setOpen(false)
                  }}
                  onMouseEnter={() => { router.prefetch(item.url) }}
                >
                  <div className="flex items-center gap-3 transition-transform duration-300 ease-out group-hover/nav-item:translate-x-1 group-data-[collapsible=icon]:justify-center">
                    {item.icon && <item.icon className={cn("h-5 w-5 transition-all duration-300", isActive ? "opacity-100 scale-110" : "opacity-80 group-hover/nav-item:opacity-100")} />}
                    <span className="text-[15px] tracking-wide group-data-[collapsible=icon]:hidden">{item.title}</span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}