'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PaymentReconciliation() {
  const router = useRouter();

  useEffect(() => {
    const reconcilePayments = async () => {
      try {
        const res = await fetch('/api/v1/bookings/my-bookings');
        if (!res.ok) return;

        const bookings = await res.json();
        if (!Array.isArray(bookings) || bookings.length === 0) return;

        const latest = bookings[0];
        if (latest.status !== 'PENDING_PROOF') return;

        const createdAt = new Date(latest.createdAt);
        const diffMinutes = (new Date().getTime() - createdAt.getTime()) / (1000 * 60);

        // Reconcile if created in the last 30 minutes
        if (diffMinutes < 30) {
          const verifyRes = await fetch(`/api/v1/payment/verify?bookingId=${latest.publicId}`);
          if (verifyRes.ok) {
            const data = await verifyRes.json();
            if (data.status === 'COMPLETED') {
              router.refresh();
            }
          }
        }
      } catch (err) {
        console.error('Silent payment reconciliation error:', err);
      }
    };

    // Run reconciliation check after 2 seconds on mount, then every 30 seconds
    const initialTimer = setTimeout(reconcilePayments, 2000);
    const interval = setInterval(reconcilePayments, 30000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [router]);

  return null;
}
