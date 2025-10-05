import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { cookies } from 'next/headers';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    const queryResult = await query(
      `SELECT 
        p.*,
        c.id as class_id,
        c.name as class_name,
        c.day_of_week,
        c.time_slot
      FROM Profiles p
      LEFT JOIN Classes c ON p.class_id = c.id
      WHERE p.user_id = @userId`,
      [{ name: 'userId', type: 'Int', value: parseInt(userId) }]
    );

    const result = queryResult.recordset;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const cookieStore = cookies();
    const userCookie = cookieStore.get('user');
    
    if (!userCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { user_id, dog_name, owners, dog_photo_url, notes, class_id } = body;

    if (!user_id) {
      return NextResponse.json({ error: 'user_id required' }, { status: 400 });
    }

    // Check if profile exists
    const existingQuery = await query(
      'SELECT id FROM Profiles WHERE user_id = @userId',
      [{ name: 'userId', type: 'Int', value: user_id }]
    );
    
    const existing = existingQuery.recordset;

    let resultQuery;
    const params = [
      { name: 'userId', type: 'Int', value: user_id },
      { name: 'dogName', type: 'NVarChar', value: dog_name || null },
      { name: 'owners', type: 'NVarChar', value: owners || null },
      { name: 'dogPhotoUrl', type: 'NVarChar', value: dog_photo_url || null },
      { name: 'notes', type: 'NVarChar', value: notes || null },
      { name: 'classId', type: 'Int', value: class_id || null }
    ];

    if (existing.length > 0) {
      // Update existing profile
      resultQuery = await query(
        `UPDATE Profiles 
         SET dog_name = @dogName,
             owners = @owners,
             dog_photo_url = @dogPhotoUrl,
             notes = @notes,
             class_id = @classId,
             updated_at = GETDATE()
         OUTPUT INSERTED.*
         WHERE user_id = @userId`,
        params
      );
    } else {
      // Create new profile
      resultQuery = await query(
        `INSERT INTO Profiles (user_id, dog_name, owners, dog_photo_url, notes, class_id)
         OUTPUT INSERTED.*
         VALUES (@userId, @dogName, @owners, @dogPhotoUrl, @notes, @classId)`,
        params
      );
    }

    const result = resultQuery.recordset;

    return NextResponse.json({ success: true, profile: result[0] });
  } catch (error) {
    console.error('Save profile error:', error);
    return NextResponse.json(
      { error: 'Failed to save profile' },
      { status: 500 }
    );
  }
}
