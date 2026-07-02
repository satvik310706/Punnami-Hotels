import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { SignJWT } from 'jose';

async function signJWT(payload: object): Promise<string> {
  const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET!);
  return new SignJWT(payload as any)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(secret);
}

// POST /api/v1/auth/agent/login — Validate travel agent email/password and set agent session cookie
export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const agent = await prisma.user.findFirst({
      where: { email, role: 'AGENT' },
    });

    if (!agent) {
      return NextResponse.json({ error: 'Agent profile not found' }, { status: 401 });
    }

    if (agent.accountStatus === 'BLOCKED') {
      return NextResponse.json({ error: 'Your agent account is currently suspended' }, { status: 403 });
    }

    // Direct password match (or fallback to admin passkey check if password is not configured yet)
    const isPasscode = password === 'admin123' || password === 'cwABmQ7wbVkn';
    const isPasswordValid = agent.password ? agent.password === password : isPasscode;

    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Invalid security password' }, { status: 401 });
    }

    // Sign JWT token
    const token = await signJWT({
      sub: agent.id.toString(),
      phone: agent.phone,
      role: 'AGENT',
      fullName: agent.fullName,
      email: agent.email,
    });

    const response = NextResponse.json({
      message: 'Agent login successful',
      agent: {
        id: agent.id.toString(),
        fullName: agent.fullName,
        email: agent.email,
        phone: agent.phone,
        companyName: agent.companyName,
        commissionType: agent.commissionType,
        commissionPercentage: Number(agent.commissionPercentage),
        commissionFixedAmount: Number(agent.commissionFixedAmount),
      },
      token,
    });

    // Set cookie
    response.cookies.set('punnami_agent_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    });

    return response;
  } catch (err) {
    console.error('[Agent Login API] Error:', err);
    return NextResponse.json({ error: 'Agent login authentication failed' }, { status: 500 });
  }
}
