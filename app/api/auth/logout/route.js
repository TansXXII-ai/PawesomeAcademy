import { NextResponse } from 'next/server';

export async function POST(request) {
  const response = NextResponse.json({ success: true });
  
  // Clear cookie
  response.cookies.delete('user');
  
  return response;
}
