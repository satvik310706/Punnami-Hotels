import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { jwtVerify } from 'jose';

async function verifyAgentToken(token: string): Promise<string | null> {
  try {
    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET!);
    const { payload } = await jwtVerify(token, secret);
    return (payload as any).role === 'AGENT' ? (payload as any).sub : null;
  } catch {
    return null;
  }
}

// GET /api/v1/bookings/agent/bookings — Fetch bookings registered by logged-in travel agent
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

    const bookings = await prisma.booking.findMany({
      where: { agentId },
      orderBy: { createdAt: 'desc' },
      include: {
        roomType: {
          select: { name: true, coverImageUrl: true },
        },
      },
    });

    return NextResponse.json(
      bookings.map((b) => {
        const { aadharEncrypted, aadharHash, aadharImageUrl, ...publicBooking } = b;
        return {
          ...publicBooking,
          id: b.id.toString(),
          roomTypeId: b.roomTypeId.toString(),
          subtotalAmount: Number(b.subtotalAmount),
          discountAmount: Number(b.discountAmount),
          gstAmount: Number(b.gstAmount),
          gatewayFee: Number(b.gatewayFee),
          totalAmount: Number(b.totalAmount),
          agentCommission: Number(b.agentCommission),
        };
      })
    );
  } catch (err) {
    console.error('[Agent Bookings API] Error:', err);
    return NextResponse.json({ error: 'Failed to retrieve agent stays logs' }, { status: 500 });
  }
}
