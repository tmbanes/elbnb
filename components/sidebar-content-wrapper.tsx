"use client"

import { useSidebar } from "@/components/ui/sidebar"

export function SidebarContentWrapper({ children }: { children: React.ReactNode }) {
  const { state, setOpen, isMobile, openMobile, setOpenMobile } = useSidebar()

  const handleClick = () => {
    if (isMobile && openMobile) {
      setOpenMobile(false)
    } else if (!isMobile && state === "expanded") {
      setOpen(false)
    }
  }

  return (
    <div onClick={handleClick} className="flex-1">
      {children}
    </div>
  )
}
