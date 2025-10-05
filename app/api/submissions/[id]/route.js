import { NextResponse } from 'next/server';
import { query, sql } from '@/lib/db';

// PATCH - approve or reject submission
export async function PATCH(request, { params }) {
  try {
    const submissionId = params.id;
    const { status, trainer_notes, trainer_id } = await request.json();
    
    if (!status || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'Valid status required (approved/rejected)' },
        { status: 400 }
      );
    }
    
    // Get submission details
    const submission = await query(
      'SELECT user_id, skill_id FROM Submissions WHERE id = @param0',
      [parseInt(submissionId)]
    );
    
    if (submission.recordset.length === 0) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }
    
    const { user_id, skill_id } = submission.recordset[0];
    
    // Start transaction
    const pool = await sql.connect();
    const transaction = new sql.Transaction(pool);
    
    try {
      await transaction.begin();
      
      // Update submission
      await transaction.request()
        .input('status', sql.NVarChar, status)
        .input('notes', sql.NVarChar, trainer_notes || '')
        .input('trainer', sql.Int, trainer_id)
        .input('id', sql.Int, parseInt(submissionId))
        .query(`
          UPDATE Submissions 
          SET status = @status, trainer_notes = @notes, decided_by = @trainer, decided_at = GETDATE()
          WHERE id = @id
        `);
      
      // If approved, create completion
      if (status === 'approved') {
        // Check if completion already exists
        const existingCompletion = await transaction.request()
          .input('userId', sql.Int, user_id)
          .input('skillId', sql.Int, skill_id)
          .query('SELECT id FROM Completions WHERE user_id = @userId AND skill_id = @skillId');
        
        if (existingCompletion.recordset.length === 0) {
          await transaction.request()
            .input('userId', sql.Int, user_id)
            .input('skillId', sql.Int, skill_id)
            .input('trainerId', sql.Int, trainer_id)
            .query(`
              INSERT INTO Completions (user_id, skill_id, approved_by)
              VALUES (@userId, @skillId, @trainerId)
            `);
        }
      }
      
      await transaction.commit();
      
      return NextResponse.json({ success: true });
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (error) {
    console.error('Error updating submission:', error);
    return NextResponse.json(
      { error: 'Failed to update submission' },
      { status: 500 }
    );
  }
}
