// app\admin\layout.tsx
import { requireRole } from "@/lib/utils/auth-utils"

export default async function GuestLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireRole(["housing_admin"])

  return (
    <div className="min-h-screen bg-[#F6F8D5] text-[#44291B] font-archivo">
      {children}
    </div>
  )
}