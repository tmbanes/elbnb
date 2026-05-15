// lib/realtime-sync.ts
import { useEffect, useRef } from 'react';
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
    // Stabilize router in a ref so it never causes the effect to re-run
    const routerRef = useRef(router);
    routerRef.current = router;

    const onRefreshRef = useRef(onRefresh);
    onRefreshRef.current = onRefresh;

    // Debounce guard: ignore rapid successive events within 500ms
    const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
                () => {
                    if (debounceTimer.current) clearTimeout(debounceTimer.current);
                    debounceTimer.current = setTimeout(() => {
                        routerRef.current.refresh();
                        if (onRefreshRef.current) onRefreshRef.current();
                    }, 500);
                }
            )
            .subscribe();

        return () => {
            if (debounceTimer.current) clearTimeout(debounceTimer.current);
            supabase.removeChannel(channel);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [table, filter, event]); // intentionally exclude router/supabase — stabilized via refs
}
