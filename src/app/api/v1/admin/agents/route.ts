import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /api/v1/admin/agents — Fetch all registered travel agents
export async function GET(req: NextRequest) {
  try {
    const agents = await prisma.user.findMany({
      where: { role: 'AGENT' },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(
      agents.map((a) => ({
        ...a,
        id: a.id.toString(),
        commissionPercentage: Number(a.commissionPercentage),
        commissionFixedAmount: Number(a.commissionFixedAmount),
      }))
    );
  } catch (err) {
    console.error('[Admin Get Agents API] Error:', err);
    return NextResponse.json({ error: 'Failed to fetch agent list' }, { status: 500 });
  }
}

// POST /api/v1/admin/agents — Create a new travel agent profile
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      phone, email, fullName, password, companyName, 
      commissionType, commissionPercentage, commissionFixedAmount, 
      gstNumber, address, adminNotes, accountStatus 
    } = body;

    if (!phone || !fullName || !password) {
      return NextResponse.json({ error: 'Phone, Name, and Password are required' }, { status: 400 });
    }

    // Check if phone or email is already taken
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ phone }, ...(email ? [{ email }] : [])],
      },
    });

    if (existing) {
      return NextResponse.json({ error: 'An account with this phone number or email already exists' }, { status: 450 });
    }

    const newAgent = await prisma.user.create({
      data: {
        phone,
        email: email || null,
        fullName,
        role: 'AGENT',
        password,
        companyName: companyName || null,
        commissionType: commissionType || 'PERCENTAGE',
        commissionPercentage: commissionPercentage ? Number(commissionPercentage) : 0,
        commissionFixedAmount: commissionFixedAmount ? Number(commissionFixedAmount) : 0,
        gstNumber: gstNumber || null,
        address: address || null,
        adminNotes: adminNotes || null,
        accountStatus: accountStatus || 'ACTIVE',
      },
    });

    return NextResponse.json({
      message: 'Agent profile created successfully',
      id: newAgent.id.toString(),
    });
  } catch (err) {
    console.error('[Admin Create Agent API] Error:', err);
    return NextResponse.json({ error: 'Failed to create agent profile' }, { status: 500 });
  }
}
