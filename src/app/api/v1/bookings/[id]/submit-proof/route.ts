import { NextRequest, NextResponse } from 'next/server';

// POST /api/v1/bookings/[id]/submit-proof — Disabled as website now uses PhonePe gateway payments directly
export async function POST() {
  return NextResponse.json({ error: 'Manual proof submission is deprecated. Please use the secure online payment gateway.' }, { status: 404 });
}
