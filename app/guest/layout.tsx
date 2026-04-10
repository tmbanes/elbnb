// app\guest\layout.tsx
import { requireRole } from "@/lib/utils";

export default async function GuestLayout({ children }: { children: React.ReactNode }) {
    await requireRole(["guest"]);
    return <>{children}</>;
}