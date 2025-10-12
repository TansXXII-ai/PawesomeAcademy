// /app/api/submissions/[id]/route.js
import { NextResponse } from 'next/server';
import { query, sql } from '@/lib/db';
import { cookies } from 'next/headers';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// PATCH - approve, reject, or archive submission
export async function PATCH(request, { params }) {
  try {
    const cookieStore = cookies();
    const userCookie = cookieStore.get('user');
    
    if (!userCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = JSON.parse(userCookie.value);
    const submissionId = params.id;
    const body = await request.json();
    const { status, trainer_notes, trainer_id, action } = body;
    
    // Handle archive action
    if (action === 'archive') {
      await query(
        'UPDATE Submissions SET archived = 1 WHERE id = @param0',
        [parseInt(submissionId)]
      );
      
      return NextResponse.json({ success: true, message: 'Submission archived' });
    }
    
    // Handle approve/reject actions
    if (!status || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'Valid status required (approved/rejected)' },
        { status: 400 }
      );
    }
    
    // Get submission details with class information
    const submissionQuery = await query(
      `SELECT 
        s.user_id, 
        s.skill_id,
        p.class_id,
        c.trainer_id as class_trainer_id
      FROM Submissions s
      LEFT JOIN Profiles p ON s.user_id = p.user_id
      LEFT JOIN Classes c ON p.class_id = c.id
      WHERE s.id = @param0`,
      [parseInt(submissionId)]
    );
    
    const submission = submissionQuery.recordset;
    
    if (submission.length === 0) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }
    
    const { user_id, skill_id, class_id, class_trainer_id } = submission[0];
    
    // AUTHORIZATION CHECK: Verify trainer can approve this submission
    if (currentUser.role === 'trainer') {
      // Trainers can only approve submissions from students in their classes
      if (!class_id) {
        return NextResponse.json(
          { error: 'Student not assigned to any class' },
          { status: 403 }
        );
      }
      
      if (class_trainer_id !== currentUser.id) {
        return NextResponse.json(
          { error: 'You can only approve submissions from students in your classes' },
          { status: 403 }
        );
      }
    }
    // Admins can approve any submission (no restriction)
    
    // Start transaction
    const pool = await sql.connect();
    const transaction = new sql.Transaction(pool);
    
    try {
      await transaction.begin();
      
      // Update submission
      await transaction.request()
        .input('status', sql.NVarChar, status)
        .input('notes', sql.NVarChar, trainer_notes || '')
        .input('trainer', sql.Int, trainer_id || currentUser.id)
        .input('id', sql.Int, parseInt(submissionId))
        .query(`
          UPDATE Submissions 
          SET status = @status, 
              trainer_notes = @notes, 
              decided_by = @trainer, 
              decided_at = GETDATE()
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
            .input('trainerId', sql.Int, trainer_id || currentUser.id)
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
