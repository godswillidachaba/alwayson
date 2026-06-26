import { useEffect, useRef } from 'react';

export function useTicketPolling(intervalMs = 30000) {
    const knownIdsRef = useRef<Set<number>>(new Set());

    useEffect(() => {
        if (!('Notification' in window)) {
            return;
        }

        if (Notification.permission === 'default') {
            Notification.requestPermission();
        }

        let cancelled = false;

        const poll = async () => {
            try {
                const res = await fetch('/dashboard/installer/tickets');
                const data = await res.json();
                const tickets: Array<{
                    id: number;
                    customerName: string;
                    status: string;
                }> = data.tickets ?? [];

                if (cancelled) {
                    return;
                }

                const newPending = tickets.filter(
                    (t) =>
                        t.status === 'pending' &&
                        !knownIdsRef.current.has(t.id),
                );

                if (newPending.length > 0) {
                    newPending.forEach((t) => knownIdsRef.current.add(t.id));

                    if (Notification.permission === 'granted') {
                        newPending.forEach((t) => {
                            new Notification('New Ticket Assigned', {
                                body: `${t.customerName} — tap to view`,
                                icon: '/icons/icon-192x192.png',
                                tag: `ticket-${t.id}`,
                            });
                        });
                    }
                }
            } catch {
                // Ignore polling errors
            }
        };

        const interval = setInterval(poll, intervalMs);

        return () => {
            cancelled = true;
            clearInterval(interval);
        };
    }, [intervalMs]);
}
