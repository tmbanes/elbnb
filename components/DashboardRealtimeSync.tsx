"use client";

import { useRealtimeSync } from "@/lib/realtime-sync";

export function DashboardRealtimeSync({ table, filter, event = '*' }: { table: string, filter?: string, event?: "*" | "INSERT" | "UPDATE" | "DELETE" }) {
    useRealtimeSync(table, filter, event);
    return null;
}
