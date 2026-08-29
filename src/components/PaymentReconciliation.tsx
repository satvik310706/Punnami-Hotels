'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** Returns true if the browser session has a punnami login cookie. */
function hasSessionCookie(): boolean {
  if (typeof document === 'undefined') return false;
  return document.cookie.split(';').some(c => c.trim().startsWith('punnami_token='));
}

export default function PaymentReconciliation() {
  const router = useRouter();

  useEffect(() => {
    // Skip entirely if the user is not logged in — avoids spamming 401s on every page load
    if (!hasSessionCookie()) return;

    let interval: NodeJS.Timeout | null = null;
    let pollCount = 0;

    const reconcilePayments = async () => {
      // Re-check each time — the user may have logged out mid-session
      if (!hasSessionCookie()) {
        if (interval) clearInterval(interval);
        return;
      }

      pollCount++;
      // Stop polling after 5 attempts if user is just browsing
      if (pollCount > 5) {
        if (interval) clearInterval(interval);
        return;
      }

      try {
        const res = await fetch('/api/v1/bookings/my-bookings');
        if (!res.ok) return;

        const bookings = await res.json();
        if (!Array.isArray(bookings) || bookings.length === 0) {
          // No bookings, stop polling
          if (interval) clearInterval(interval);
          return;
        }

        const latest = bookings[0];
        if (latest.status !== 'PENDING_PROOF') {
          // Latest booking is not pending proof, no need to poll
          if (interval) clearInterval(interval);
          return;
        }

        const createdAt = new Date(latest.createdAt);
        const diffMinutes = (new Date().getTime() - createdAt.getTime()) / (1000 * 60);

        // Reconcile if created in the last 30 minutes
        if (diffMinutes < 30) {
          const verifyRes = await fetch(`/api/v1/payment/verify?bookingId=${latest.publicId}`);
          if (verifyRes.ok) {
            const data = await verifyRes.json();
            if (data.status === 'COMPLETED') {
              if (interval) clearInterval(interval);
              router.refresh();
            }
          }
        } else {
          // Booking is older than 30 min, stop polling
          if (interval) clearInterval(interval);
        }
      } catch (err) {
        console.error('Silent payment reconciliation error:', err);
      }
    };

    // Run once after 2 seconds on mount, and at most a few times if pending
    const initialTimer = setTimeout(() => {
      reconcilePayments();
      interval = setInterval(reconcilePayments, 45000);
    }, 2000);

    return () => {
      clearTimeout(initialTimer);
      if (interval) clearInterval(interval);
    };
  }, [router]);


  return null;
}
