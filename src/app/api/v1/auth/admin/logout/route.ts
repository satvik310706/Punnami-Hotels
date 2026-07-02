import { NextRequest, NextResponse } from 'next/server';

// POST /api/v1/auth/admin/logout — Clear admin session cookie
export async function POST(req: NextRequest) {
  const response = NextResponse.json({ message: 'Logged out successfully' });
  response.cookies.delete('punnami_admin_token');
  return response;
}
