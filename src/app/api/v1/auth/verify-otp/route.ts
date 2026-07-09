import { NextResponse } from 'next/server';

// User login/authentication has been removed.
// All guest bookings are now tracked via Booking ID on /bookings page.
export async function POST() {
  return NextResponse.json({ error: 'User authentication has been discontinued. Track your booking at /bookings.' }, { status: 410 });
}
