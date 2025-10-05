// /app/api/submissions/[id]/route.js - UPDATED VERSION
import { NextResponse } from 'next/server';
import { query, sql } from '@/lib/db';
import { cookies } from 'next/headers';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// PATCH - approve or reject submission
export async function PATCH(request, { params }) {
  try {
    const cookieStore = cookies();
    const userCookie = cookieStore.get('user');
    
    if (!userCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = JSON.parse(userCookie.value);
    const submissionId = params.id;
    const { status, trainer_notes, trainer_id } = await request.json();
    
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
    const transaction = new sql.Tr
