import { redirect } from 'next/navigation';

// My Bookings page has been replaced with the Booking Lookup page.
// Redirecting all traffic to /bookings.
export default function MyBookingsRedirect() {
  redirect('/bookings');
}
