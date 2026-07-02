import { NextRequest, NextResponse } from 'next/server';

// POST /api/v1/auth/agent/logout — Clear travel agent session cookie
export async function POST(req: NextRequest) {
  const response = NextResponse.json({ message: 'Logged out successfully' });
  response.cookies.delete('punnami_agent_token');
  return response;
}
