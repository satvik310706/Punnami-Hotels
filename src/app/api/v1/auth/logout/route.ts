import { NextResponse } from 'next/server';

// POST /api/v1/auth/logout — Clear user session cookie
export async function POST() {
  const response = NextResponse.json({ message: 'Logout successful' });
  
  response.cookies.delete('punnami_token');
  
  return response;
}
