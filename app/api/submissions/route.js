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

    const currentUser = JSON.parse(userCookie.value);
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');
    const myClassOnly = searchParams.get('myClassOnly') === 'true';

    let sql = `
      SELECT 
        s.*,
        u.username as member_name,
        sk.title as skill_title,
        sk.points as skill_points,
        sk.difficulty as skill_difficulty,
        sec.name as section_name,
        trainer.username as decided_by_name,
        p.dog_name,
        p.class_id,
        c.name as class_name
      FROM Submissions s
      JOIN Users u ON s.user_id = u.id
      JOIN Skills sk ON s.skill_id = sk.id
      JOIN Sections sec ON sk.section_id = sec.id
      LEFT JOIN Users trainer ON s.decided_by = trainer.id
      LEFT JOIN Profiles p ON s.user_id = p.user_id
      LEFT JOIN Classes c ON p.class_id = c.id
      WHERE 1=1
    `;

    const params = [];

    // Filter by userId if provided
    if (userId) {
      sql += ' AND s.user_id = @userId';
      params.push({ name: 'userId', type: 'Int', value: parseInt(userId) });
    }

    // Filter by status if provided
    if (status) {
      sql += ' AND s.status = @status';
      params.push({ name: 'status', type: 'NVarChar', value: status });
    }

    // If trainer/admin and myClassOnly is true, filter to only their class students
    if (myClassOnly && ['trainer', 'admin'].includes(currentUser.role)) {
      sql += ` AND p.class_id IN (
        SELECT id FROM Classes WHERE trainer_id = @trainerId AND active = 1
      )`;
      params.push({ name: 'trainerId', type: 'Int', value: currentUser.id });
    }

    // If trainer (not admin) and no specific filters, default to their class students
    if (currentUser.role === 'trainer' && !userId && !myClassOnly) {
      sql += ` AND p.class_id IN (
        SELECT id FROM Classes WHERE trainer_id = @trainerId AND active = 1
      )`;
      params.push({ name: 'trainerId', type: 'Int', value: currentUser.id });
    }

    sql += ' ORDER BY s.created_at DESC';

    const submissions = await query(sql, params);
    return NextResponse.json(submissions);
  } catch (error) {
    console.error('Get submissions error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch submissions' },
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
    const { user_id, skill_id, mode, video_url, member_notes } = body;

    // Validate required fields
    if (!user_id || !skill_id || !mode) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if skill is already completed
    const completionCheck = await query(
      'SELECT id FROM Completions WHERE user_id = @userId AND skill_id = @skillId',
      [
        { name: 'userId', type: 'Int', value: user_id },
        { name: 'skillId', type: 'Int', value: skill_id }
      ]
    );

    if (completionCheck.length > 0) {
      return NextResponse.json(
        { error: 'Skill already completed' },
        { status: 400 }
      );
    }

    // Check if there's already a pending submission
    const pendingCheck = await query(
      `SELECT id FROM Submissions 
       WHERE user_id = @userId 
       AND skill_id = @skillId 
       AND status IN ('requested', 'submitted')`,
      [
        { name: 'userId', type: 'Int', value: user_id },
        { name: 'skillId', type: 'Int', value: skill_id }
      ]
    );

    if (pendingCheck.length > 0) {
      return NextResponse.json(
        { error: 'Submission already pending for this skill' },
        { status: 400 }
      );
    }

    // Determine initial status based on mode
    const initialStatus = mode === 'class_request' ? 'requested' : 'submitted';

    const result = await query(
      `INSERT INTO Submissions (user_id, skill_id, mode, video_url, member_notes, status)
       OUTPUT INSERTED.*
       VALUES (@userId, @skillId, @mode, @videoUrl, @memberNotes, @status)`,
      [
        { name: 'userId', type: 'Int', value: user_id },
        { name: 'skillId', type: 'Int', value: skill_id },
        { name: 'mode', type: 'NVarChar', value: mode },
        { name: 'videoUrl', type: 'NVarChar', value: video_url || null },
        { name: 'memberNotes', type: 'NVarChar', value: member_notes || null },
        { name: 'status', type: 'NVarChar', value: initialStatus }
      ]
    );

    return NextResponse.json({ success: true, submission: result[0] });
  } catch (error) {
    console.error('Create submission error:', error);
    return NextResponse.json(
      { error: 'Failed to create submission' },
      { status: 500 }
    );
  }
}
