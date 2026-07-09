import { NextResponse } from 'next/server';

// User booking list endpoint removed. Guests now look up individual bookings via /bookings page.
export async function GET() {
  return NextResponse.json({ error: 'This endpoint has been discontinued. Use /bookings to look up your reservation by Booking ID.' }, { status: 410 });
}
