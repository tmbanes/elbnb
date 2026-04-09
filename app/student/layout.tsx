// app\student\layout.tsx
import { requireRole } from "@/lib/utils";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
    await requireRole(["student"]);
    return <>{children}</>;
}