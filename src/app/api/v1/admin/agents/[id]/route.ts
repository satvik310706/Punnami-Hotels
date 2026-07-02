import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// PUT /api/v1/admin/agents/[id] — Update travel agent credentials, commissions and notes
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { 
      phone, email, fullName, password, companyName, 
      commissionType, commissionPercentage, commissionFixedAmount, 
      gstNumber, address, adminNotes, accountStatus 
    } = body;

    const agent = await prisma.user.findFirst({
      where: { id: BigInt(id), role: 'AGENT' },
    });

    if (!agent) {
      return NextResponse.json({ error: 'Agent profile not found' }, { status: 404 });
    }

    const updated = await prisma.user.update({
      where: { id: BigInt(id) },
      data: {
        phone: phone || agent.phone,
        email: email !== undefined ? email : agent.email,
        fullName: fullName || agent.fullName,
        password: password !== undefined ? password : agent.password,
        companyName: companyName !== undefined ? companyName : agent.companyName,
        commissionType: commissionType || agent.commissionType,
        commissionPercentage: commissionPercentage !== undefined ? Number(commissionPercentage) : agent.commissionPercentage,
        commissionFixedAmount: commissionFixedAmount !== undefined ? Number(commissionFixedAmount) : agent.commissionFixedAmount,
        gstNumber: gstNumber !== undefined ? gstNumber : agent.gstNumber,
        address: address !== undefined ? address : agent.address,
        adminNotes: adminNotes !== undefined ? adminNotes : agent.adminNotes,
        accountStatus: accountStatus || agent.accountStatus,
      },
    });

    return NextResponse.json({
      message: 'Agent details updated successfully',
      id: updated.id.toString(),
    });
  } catch (err) {
    console.error('[Admin Update Agent API] Error:', err);
    return NextResponse.json({ error: 'Failed to update agent profile' }, { status: 500 });
  }
}

// DELETE /api/v1/admin/agents/[id] — Delete travel agent profile from database
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const agent = await prisma.user.findFirst({
      where: { id: BigInt(id), role: 'AGENT' },
    });

    if (!agent) {
      return NextResponse.json({ error: 'Agent profile not found' }, { status: 404 });
    }

    await prisma.user.delete({
      where: { id: BigInt(id) },
    });

    return NextResponse.json({ message: 'Agent deleted successfully' });
  } catch (err) {
    console.error('[Admin Delete Agent API] Error:', err);
    return NextResponse.json({ error: 'Failed to delete agent profile' }, { status: 500 });
  }
}
