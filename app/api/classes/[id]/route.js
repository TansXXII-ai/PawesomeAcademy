import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

// PATCH - Update a class
export async function PATCH(request, { params }) {
  try {
    const cookieStore = cookies();
    const userCookie = cookieStore.get('user');
    
    if (!userCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = JSON.parse(userCookie.value);
    
    // Only admins can update classes
    if (currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const classId = params.id;
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

    if (trainerResult.recordset.length === 0) {
      return NextResponse.json(
        { error: 'Trainer not found' },
        { status: 404 }
      );
    }

    if (!['trainer', 'admin'].includes(trainerResult.recordset[0].role)) {
      return NextResponse.json(
        { error: 'User is not a trainer' },
        { status: 400 }
      );
    }

    // Update class
    const result = await query(
      `UPDATE Classes 
       SET name = @name, 
           day_of_week = @dayOfWeek, 
           time_slot = @timeSlot, 
           trainer_id = @trainerId
       OUTPUT INSERTED.*
       WHERE id = @classId`,
      [
        { name: 'name', type: 'NVarChar', value: name },
        { name: 'dayOfWeek', type: 'NVarChar', value: day_of_week },
        { name: 'timeSlot', type: 'NVarChar', value: time_slot },
        { name: 'trainerId', type: 'Int', value: trainer_id },
        { name: 'classId', type: 'Int', value: parseInt(classId) }
      ]
    );

    if (result.recordset.length === 0) {
      return NextResponse.json(
        { error: 'Class not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      class: result.recordset[0] 
    });
  } catch (error) {
    console.error('Update class error:', error);
    return NextResponse.json(
      { error: 'Failed to update class' },
      { status: 500 }
    );
  }
}

// DELETE - Delete (deactivate) a class
export async function DELETE(request, { params }) {
  try {
    const cookieStore = cookies();
    const userCookie = cookieStore.get('user');
    
    if (!userCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = JSON.parse(userCookie.value);
    
    // Only admins can delete classes
    if (currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const classId = params.id;

    // Check if class exists
    const classCheck = await query(
      'SELECT id, name FROM Classes WHERE id = @classId',
      [{ name: 'classId', type: 'Int', value: parseInt(classId) }]
    );

    if (classCheck.recordset.length === 0) {
      return NextResponse.json(
        { error: 'Class not found' },
        { status: 404 }
      );
    }

    // Soft delete by setting active = 0
    await query(
      'UPDATE Classes SET active = 0 WHERE id = @classId',
      [{ name: 'classId', type: 'Int', value: parseInt(classId) }]
    );

    // Note: We don't remove students from the class, they just won't see it anymore
    // If you want to remove all students from the class, uncomment this:
    // await query(
    //   'UPDATE Profiles SET class_id = NULL WHERE class_id = @classId',
    //   [{ name: 'classId', type: 'Int', value: parseInt(classId) }]
    // );

    return NextResponse.json({ 
      success: true, 
      message: 'Class deactivated successfully' 
    });
  } catch (error) {
    console.error('Delete class error:', error);
    return NextResponse.json(
      { error: 'Failed to delete class' },
      { status: 500 }
    );
  }
}
