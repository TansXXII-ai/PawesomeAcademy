import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { cookies } from 'next/headers';
import { hashPassword } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET all users (admin only)
export async function GET(request) {
  try {
    const cookieStore = cookies();
    const userCookie = cookieStore.get('user');
    
    if (!userCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = JSON.parse(userCookie.value);
    
    // Only admins can view all users
    if (currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const result = await query(
      `SELECT id, email, username, role, active, created_at 
       FROM Users 
       ORDER BY created_at DESC`
    );
    
    return NextResponse.json(result.recordset);
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// POST create new user (admin only)
export async function POST(request) {
  try {
    const cookieStore = cookies();
    const userCookie = cookieStore.get('user');
    
    if (!userCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = JSON.parse(userCookie.value);
    
    // Only admins can create users
    if (currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { email, username, password, role } = body;

    // Validate required fields
    if (!email || !username || !password || !role) {
      return NextResponse.json(
        { error: 'Missing required fields: email, username, password, role' },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ['member', 'trainer', 'admin'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be: member, trainer, or admin' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await query(
      'SELECT id FROM Users WHERE email = @param0',
      [email]
    );

    if (existingUser.recordset.length > 0) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const result = await query(
      `INSERT INTO Users (email, username, password_hash, role, active)
       OUTPUT INSERTED.id, INSERTED.email, INSERTED.username, INSERTED.role, INSERTED.active, INSERTED.created_at
       VALUES (@param0, @param1, @param2, @param3, 1)`,
      [email, username, hashedPassword, role]
    );

    return NextResponse.json({ 
      success: true, 
      user: result.recordset[0] 
    }, { status: 201 });
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}

// PATCH update user password (admin only)
export async function PATCH(request) {
  try {
    const cookieStore = cookies();
    const userCookie = cookieStore.get('user');
    
    if (!userCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = JSON.parse(userCookie.value);
    
    // Only admins can reset passwords
    if (currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { user_id, new_password } = body;

    // Validate required fields
    if (!user_id || !new_password) {
      return NextResponse.json(
        { error: 'Missing required fields: user_id, new_password' },
        { status: 400 }
      );
    }

    // Check if user exists
    const userCheck = await query(
      'SELECT id, email FROM Users WHERE id = @param0',
      [user_id]
    );

    if (userCheck.recordset.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Hash new password
    const hashedPassword = await hashPassword(new_password);

    // Update password
    await query(
      'UPDATE Users SET password_hash = @param0 WHERE id = @param1',
      [hashedPassword, user_id]
    );

    return NextResponse.json({ 
      success: true, 
      message: 'Password updated successfully' 
    });
  } catch (error) {
    console.error('Update password error:', error);
    return NextResponse.json(
      { error: 'Failed to update password' },
      { status: 500 }
    );
  }
}

// DELETE user (admin only)
export async function DELETE(request) {
  try {
    const cookieStore = cookies();
    const userCookie = cookieStore.get('user');
    
    if (!userCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = JSON.parse(userCookie.value);
    
    // Only admins can delete users
    if (currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      );
    }

    // Prevent admin from deleting themselves
    if (parseInt(userId) === currentUser.id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    // Check if user exists
    const userCheck = await query(
      'SELECT id, email, role FROM Users WHERE id = @param0',
      [parseInt(userId)]
    );

    if (userCheck.recordset.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Soft delete by setting active = 0
    await query(
      'UPDATE Users SET active = 0 WHERE id = @param0',
      [parseInt(userId)]
    );

    return NextResponse.json({ 
      success: true, 
      message: 'User deactivated successfully' 
    });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
