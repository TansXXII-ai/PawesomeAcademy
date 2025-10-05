import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { cookies } from 'next/headers';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const cookieStore = cookies();
    const userCookie = cookieStore.get('user');
    
    if (!userCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = JSON.parse(userCookie.value);
    const { searchParams } = new URL(request.url);
    const trainerId = searchParams.get('trainerId');
    const includeMembers = searchParams.get('includeMembers') === 'true';

    let sql = `
      SELECT 
        c.id,
        c.name,
        c.day_of_week,
        c.time_slot,
        c.trainer_id,
        c.active,
        c.created_at,
        t.username as trainer_name,
        t.email as trainer_email
      FROM Classes c
      JOIN Users t ON c.trainer_id = t.id
      WHERE c.active = 1
    `;

    const params = [];
    
    // Filter by trainer if specified
    if (trainerId) {
      sql += ' AND c.trainer_id = @trainerId';
      params.push({ name: 'trainerId', type: 'Int', value: parseInt(trainerId) });
    }

    sql += ' ORDER BY CASE c.day_of_week ' +
      "WHEN 'Monday' THEN 1 " +
      "WHEN 'Tuesday' THEN 2 " +
      "WHEN 'Wednesday' THEN 3 " +
      "WHEN 'Thursday' THEN 4 " +
      "WHEN 'Friday' THEN 5 " +
      "WHEN 'Saturday' THEN 6 " +
      "WHEN 'Sunday' THEN 7 END, c.time_slot";

    const classes = await query(sql, params);

    // If requested, include member count for each class
    if (includeMembers) {
      for (let cls of classes) {
        const memberCountResult = await query(
          'SELECT COUNT(*) as count FROM Profiles WHERE class_id = @classId',
          [{ name: 'classId', type: 'Int', value: cls.id }]
        );
        cls.member_count = memberCountResult[0]?.count || 0;
      }
    }

    return NextResponse.json(classes);
  } catch (error) {
    console.error('Get classes error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch classes' },
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

    const user = JSON.parse(userCookie.value);
    
    // Only admins can create classes
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, day_of_week, time_slot, trainer_id } = body;

    // Validate required fields
    if (!name || !day_of_week || !time_slot || !trainer_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate day of week
    const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    if (!validDays.includes(day_of_week)) {
      return NextResponse.json(
        { error: 'Invalid day of week' },
        { status: 400 }
      );
    }

    // Verify trainer exists and has trainer/admin role
    const trainerResult = await query(
      'SELECT id, role FROM Users WHERE id = @trainerId AND active = 1',
      [{ name: 'trainerId', type: 'Int', value: trainer_id }]
    );

    if (trainerResult.length === 0) {
      return NextResponse.json(
        { error: 'Trainer not found' },
        { status: 404 }
      );
    }

    if (!['trainer', 'admin'].includes(trainerResult[0].role)) {
      return NextResponse.json(
        { error: 'User is not a trainer' },
        { status: 400 }
      );
    }

    // Insert new class
    const result = await query(
      `INSERT INTO Classes (name, day_of_week, time_slot, trainer_id)
       OUTPUT INSERTED.*
       VALUES (@name, @dayOfWeek, @timeSlot, @trainerId)`,
      [
        { name: 'name', type: 'NVarChar', value: name },
        { name: 'dayOfWeek', type: 'NVarChar', value: day_of_week },
        { name: 'timeSlot', type: 'NVarChar', value: time_slot },
        { name: 'trainerId', type: 'Int', value: trainer_id }
      ]
    );

    return NextResponse.json({ success: true, class: result[0] });
  } catch (error) {
    console.error('Create class error:', error);
    return NextResponse.json(
      { error: 'Failed to create class' },
      { status: 500 }
    );
  }
}
