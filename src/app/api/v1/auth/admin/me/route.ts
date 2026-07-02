import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

// GET /api/v1/auth/admin/me — Verify active admin token cookie
export async function GET(req: NextRequest) {
  try {
    const adminToken = req.cookies.get('punnami_admin_token')?.value;

    if (!adminToken) {
      return NextResponse.json({ authenticated: false, error: 'Session token missing' }, { status: 401 });
    }

    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET!);
    const { payload } = await jwtVerify(adminToken, secret);

    if (!payload || (payload as any).role !== 'ADMIN') {
      return NextResponse.json({ authenticated: false, error: 'Unauthorized role access' }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      email: (payload as any).email,
      role: (payload as any).role,
    });
  } catch (err) {
    console.error('[Admin Auth Check API] Error:', err);
    return NextResponse.json({ authenticated: false, error: 'Invalid or expired session token' }, { status: 401 });
  }
}
