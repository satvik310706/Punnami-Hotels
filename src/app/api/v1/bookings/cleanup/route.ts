import { NextRequest, NextResponse } from 'next/server';
import { cleanupExpiredBookings } from '@/lib/booking-cleanup';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const result = await cleanupExpiredBookings();
    return NextResponse.json({
      message: 'Expired bookings inventory cleanup completed successfully',
      ...result,
    });
  } catch (err) {
    console.error('[Cleanup API] Error:', err);
    return NextResponse.json({ error: 'Failed to run bookings inventory cleanup' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const result = await cleanupExpiredBookings();
    return NextResponse.json({
      message: 'Expired bookings inventory cleanup completed successfully',
      ...result,
    });
  } catch (err) {
    console.error('[Cleanup API] Error:', err);
    return NextResponse.json({ error: 'Failed to run bookings inventory cleanup' }, { status: 500 });
  }
}
