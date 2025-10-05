import { NextResponse } from 'next/server';
import { authenticateUser } from '@/lib/auth';

export async function POST(request) {
  try {
    const { email, password } = await request.json();
    
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password required' },
        { status: 400 }
      );
    }
    
    const result = await authenticateUser(email, password);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 401 }
      );
    }
    
    // Create session (simplified - use proper JWT in production)
    const response = NextResponse.json({
      success: true,
      user: result.user
    });
    
    // Set cookie (simplified session)
    response.cookies.set('user', JSON.stringify(result.user), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });
    
    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}
