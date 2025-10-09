import { NextResponse } from 'next/server';
import { query, sql } from '@/lib/db';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

const gradeRequirements = {
  1: 20, 2: 20, 3: 20,
  4: 40, 5: 40, 6: 40,
  7: 60, 8: 60, 9: 60,
  10: 80, 11: 80, 12: 80
};

export async function POST(request) {
  try {
    const body = await request.json();
    const { user_id, grade_number, completion_ids } = body;

    if (!user_id || !grade_number || !completion_ids || !Array.isArray(completion_ids)) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate grade number
    if (grade_number < 1 || grade_number > 12) {
      return NextResponse.json(
        { error: 'Invalid grade number' },
        { status: 400 }
      );
    }

    // Check if grade already achieved
    const existingGrade = await query(
      'SELECT id FROM Grades WHERE user_id = @param0 AND grade_number = @param1',
      [user_id, grade_number]
    );

    if (existingGrade.recordset.length > 0) {
      return NextResponse.json(
        { error: 'Grade already achieved' },
        { status: 400 }
      );
    }

    const pointsRequired = gradeRequirements[grade_number];

    // Start transaction
    const pool = await sql.connect();
    const transaction = new sql.Transaction(pool);
    
    try {
      await transaction.begin();

      // Create grade record
      const gradeResult = await transaction.request()
        .input('userId', sql.Int, user_id)
        .input('gradeNumber', sql.Int, grade_number)
        .input('pointsRequired', sql.Int, pointsRequired)
        .query(`
          INSERT INTO Grades (user_id, grade_number, points_required, achieved_at)
          OUTPUT INSERTED.id
          VALUES (@userId, @gradeNumber, @pointsRequired, GETDATE())
        `);

      const gradeId = gradeResult.recordset[0].id;

      // Link completions to this grade
      for (const completionId of completion_ids) {
        await transaction.request()
          .input('gradeId', sql.Int, gradeId)
          .input('completionId', sql.Int, completionId)
          .query(`
            INSERT INTO GradeCompletions (grade_id, completion_id)
            VALUES (@gradeId, @completionId)
          `);
      }

      await transaction.commit();

      return NextResponse.json({
        success: true,
        grade_id: gradeId,
        message: `Grade ${grade_number} achieved!`
      });

    } catch (err) {
      await transaction.rollback();
      throw err;
    }

  } catch (error) {
    console.error('Grade achievement error:', error);
    return NextResponse.json(
      { error: 'Failed to achieve grade' },
      { status: 500 }
    );
  }
}
