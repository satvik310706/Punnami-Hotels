import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { jwtVerify } from 'jose';
import { startOfMonth } from 'date-fns';

async function verifyAgentToken(token: string): Promise<string | null> {
  try {
    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET!);
    const { payload } = await jwtVerify(token, secret);
    return (payload as any).role === 'AGENT' ? (payload as any).sub : null;
  } catch {
    return null;
  }
}

// GET /api/v1/bookings/agent/dashboard-summary — Fetch booking stats and sales totals for logged-in travel agent
export async function GET(req: NextRequest) {
  try {
    const agentToken = req.cookies.get('punnami_agent_token')?.value;
    if (!agentToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const agentIdStr = await verifyAgentToken(agentToken);
    if (!agentIdStr) {
      return NextResponse.json({ error: 'Session expired. Please log in again.' }, { status: 401 });
    }

    const agentId = BigInt(agentIdStr);
    const startOfCurrentMonth = startOfMonth(new Date());

    // 1. Total bookings count
    const bookingCount = await prisma.booking.count({
      where: { agentId },
    });

    // 2. Total earnings (confirmed bookings commission sum)
    const confirmedBookings = await prisma.booking.findMany({
      where: { agentId, status: 'CONFIRMED' },
      select: { agentCommission: true, guestPhone: true, createdAt: true },
    });

    const totalEarnings = confirmedBookings.reduce((sum, b) => sum + Number(b.agentCommission), 0);

    // 3. This month's earnings
    const thisMonthEarnings = confirmedBookings
      .filter((b) => new Date(b.createdAt) >= startOfCurrentMonth)
      .reduce((sum, b) => sum + Number(b.agentCommission), 0);

    // 4. Unique guest contacts
    const uniquePhones = new Set(confirmedBookings.map((b) => b.guestPhone));
    const totalCustomers = uniquePhones.size;

    return NextResponse.json({
      booking_count: bookingCount,
      total_earnings: totalEarnings,
      this_month_earnings: thisMonthEarnings,
      total_customers: totalCustomers,
    });
  } catch (err) {
    console.error('[Agent Dashboard API] Error:', err);
    return NextResponse.json({ error: 'Failed to retrieve sales summary' }, { status: 550 });
  }
}
