import { NextResponse } from 'next/server';
import { query, sql } from '@/lib/db';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const cookieStore = cookies();
    const userCookie = cookieStore.get('user');
    
    if (!userCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = JSON.parse(userCookie.value);
    
    // Only trainers and admins can approve
    if (!['trainer', 'admin'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { user_id, skill_ids, notes } = body;

    if (!user_id || !skill_ids || !Array.isArray(skill_ids) || skill_ids.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields or empty skill list' },
        { status: 400 }
      );
    }

    // Get student's class info for authorization
    const studentResult = await query(
      `SELECT p.class_id, c.trainer_id
       FROM Profiles p
       LEFT JOIN Classes c ON p.class_id = c.id
       WHERE p.user_id = @userId`,
      [{ name: 'userId', type: 'Int', value: user_id }]
    );

    if (studentResult.recordset.length === 0) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
    }

    const studentClass = studentResult.recordset[0];

    // Authorization: trainers can only approve for their class students
    if (currentUser.role === 'trainer') {
      if (!studentClass.class_id) {
        return NextResponse.json(
          { error: 'Student not assigned to any class' },
          { status: 403 }
        );
      }
      if (studentClass.trainer_id !== currentUser.id) {
        return NextResponse.json(
          { error: 'You can only approve skills for students in your classes' },
          { status: 403 }
        );
      }
    }

    // Start transaction
    const pool = await sql.connect();
    const transaction = new sql.Transaction(pool);
    
    try {
      await transaction.begin();

      const approvedSkills = [];
      let totalPoints = 0;

      for (const skill_id of skill_ids) {
        // Check if skill is already completed
        const existingCompletion = await transaction.request()
          .input('userId', sql.Int, user_id)
          .input('skillId', sql.Int, skill_id)
          .query('SELECT id FROM Completions WHERE user_id = @userId AND skill_id = @skillId');

        if (existingCompletion.recordset.length > 0) {
          // Skip if already completed
          continue;
        }

        // Get skill info
        const skillResult = await transaction.request()
          .input('skillId', sql.Int, skill_id)
          .query('SELECT title, points FROM Skills WHERE id = @skillId');

        if (skillResult.recordset.length === 0) {
          // Skip if skill not found
          continue;
        }

        const skill = skillResult.recordset[0];

        // Create completion record
        await transaction.request()
          .input('userId', sql.Int, user_id)
          .input('skillId', sql.Int, skill_id)
          .input('trainerId', sql.Int, currentUser.id)
          .query(`
            INSERT INTO Completions (user_id, skill_id, approved_by, approved_at)
            VALUES (@userId, @skillId, @trainerId, GETDATE())
          `);

        // Create submission record for tracking
        await transaction.request()
          .input('userId', sql.Int, user_id)
          .input('skillId', sql.Int, skill_id)
          .input('trainerId', sql.Int, currentUser.id)
          .input('notes', sql.NVarChar, notes || 'Bulk approved by trainer')
          .query(`
            INSERT INTO Submissions 
              (user_id, skill_id, mode, status, trainer_notes, decided_by, member_notes, decided_at)
            VALUES 
              (@userId, @skillId, 'class_request', 'approved', @notes, @trainerId, 'Direct approval by trainer', GETDATE())
          `);

        approvedSkills.push(skill.title);
        totalPoints += skill.points;
      }

      await transaction.commit();

      return NextResponse.json({
        success: true,
        approved_count: approvedSkills.length,
        total_points: totalPoints,
        skills: approvedSkills,
        message: `${approvedSkills.length} skills approved! +${totalPoints} points`
      });

    } catch (err) {
      await transaction.rollback();
      throw err;
    }

  } catch (error) {
    console.error('Bulk approval error:', error);
    return NextResponse.json(
      { error: 'Failed to approve skills' },
      { status: 500 }
    );
  }
}
