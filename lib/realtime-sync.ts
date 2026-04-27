// lib/realtime-sync.ts
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client';

/**
 * A reusable hook to sync server-side data with real-time database changes.
 * It triggers a router.refresh() when a change is detected, causing Next.js
 * to refetch Server Component data without a full page reload.
 * 
 * @param table - The database table to watch
 * @param filter - Optional PostgREST filter (e.g., "user_id=eq.123")
 * @param event - The type of event to listen for ('INSERT', 'UPDATE', 'DELETE', or '*')
 */
export function useRealtimeSync(
    table: string,
    filter?: string,
    event: 'INSERT' | 'UPDATE' | 'DELETE' | '*' = '*',
    onRefresh?: () => void
) {
    const supabase = getSupabaseBrowserClient();
    const router = useRouter();

    useEffect(() => {
        if (!table) return;

        const channel = supabase
            .channel(`sync-${table}-${filter || 'all'}`)
            .on(
                'postgres_changes',
                {
                    event,
                    schema: 'public',
                    table,
                    filter
                },
                (payload) => {
                    console.log(`[RealtimeSync] Change detected in ${table}:`, payload);
                    router.refresh();
                    if (onRefresh) onRefresh();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [table, filter, event, supabase, router, onRefresh]);
}
