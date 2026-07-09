import { NextResponse } from 'next/server';

// User session authentication has been removed.
// Guests no longer need accounts. Track bookings via /bookings page using Booking ID.
export async function GET() {
  return NextResponse.json({ authenticated: false, error: 'User sessions no longer supported. Use /bookings to track your reservation.' }, { status: 401 });
}
