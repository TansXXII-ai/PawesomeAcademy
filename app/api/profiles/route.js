import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET user profile
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      );
    }
    
    const result = await query(
      'SELECT id, user_id, dog_name, owners, dog_photo_url, notes FROM Profiles WHERE user_id = @param0',
      [parseInt(userId)]
    );
    
    if (result.recordset.length === 0) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(result.recordset[0]);
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

// POST/PUT profile (create or update)
export async function POST(request) {
  try {
    const { user_id, dog_name, owners, dog_photo_url, notes } = await request.json();
    
    if (!user_id || !dog_name || !owners) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Check if profile exists
    const existing = await query(
      'SELECT id FROM Profiles WHERE user_id = @param0',
      [user_id]
    );
    
    let result;
    
    if (existing.recordset.length > 0) {
      // Update
      result = await query(
        `UPDATE Profiles 
         SET dog_name = @param0, owners = @param1, dog_photo_url = @param2, notes = @param3, updated_at = GETDATE()
         OUTPUT INSERTED.*
         WHERE user_id = @param4`,
        [dog_name, owners, dog_photo_url || null, notes || '', user_id]
      );
    } else {
      // Insert
      result = await query(
        `INSERT INTO Profiles (user_id, dog_name, owners, dog_photo_url, notes)
         OUTPUT INSERTED.*
         VALUES (@param0, @param1, @param2, @param3, @param4)`,
        [user_id, dog_name, owners, dog_photo_url || null, notes || '']
      );
    }
    
    return NextResponse.json(result.recordset[0]);
  } catch (error) {
    console.error('Error saving profile:', error);
    return NextResponse.json(
      { error: 'Failed to save profile' },
      { status: 500 }
    );
  }
}
