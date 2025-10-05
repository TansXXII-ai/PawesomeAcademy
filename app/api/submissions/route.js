import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET submissions (with filters)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');
    const skillId = searchParams.get('skillId');
    
    let queryText = `
      SELECT 
        s.id, s.user_id, s.skill_id, s.mode, s.video_url,
        s.member_notes, s.status, s.trainer_notes, s.decided_by,
        s.created_at, s.decided_at,
        u.username as member_name,
        sk.title as skill_title,
        sec.name as section_name,
        sk.points as skill_points
      FROM Submissions s
      JOIN Users u ON s.user_id = u.id
      JOIN Skills sk ON s.skill_id = sk.id
      JOIN Sections sec ON sk.section_id = sec.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramIndex = 0;
    
    if (userId) {
      queryText += ` AND s.user_id = @param${paramIndex}`;
      params.push(parseInt(userId));
      paramIndex++;
    }
    
    if (status) {
      queryText += ` AND s.status = @param${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    
    if (skillId) {
      queryText += ` AND s.skill_id = @param${paramIndex}`;
      params.push(parseInt(skillId));
      paramIndex++;
    }
    
    queryText += ' ORDER BY s.created_at DESC';
    
    const result = await query(queryText, params);
    
    return NextResponse.json(result.recordset);
  } catch (error) {
    console.error('Error fetching submissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch submissions' },
      { status: 500 }
    );
  }
}

// POST new submission
export async function POST(request) {
  try {
    const { user_id, skill_id, mode, video_url, member_notes } = await request.json();
    
    if (!user_id || !skill_id || !mode) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Check if skill already completed
    const existing = await query(
      'SELECT id FROM Completions WHERE user_id = @param0 AND skill_id = @param1',
      [user_id, skill_id]
    );
    
    if (existing.recordset.length > 0) {
      return NextResponse.json(
        { error: 'Skill already completed' },
        { status: 400 }
      );
    }
    
    // Check if already pending
    const pending = await query(
      'SELECT id FROM Submissions WHERE user_id = @param0 AND skill_id = @param1 AND status IN (\'requested\', \'submitted\')',
      [user_id, skill_id]
    );
    
    if (pending.recordset.length > 0) {
      return NextResponse.json(
        { error: 'Submission already pending' },
        { status: 400 }
      );
    }
    
    const status = mode === 'class_request' ? 'requested' : 'submitted';
    
    const result = await query(
      `INSERT INTO Submissions (user_id, skill_id, mode, video_url, member_notes, status)
       OUTPUT INSERTED.*
       VALUES (@param0, @param1, @param2, @param3, @param4, @param5)`,
      [user_id, skill_id, mode, video_url || null, member_notes || '', status]
    );
    
    return NextResponse.json(result.recordset[0], { status: 201 });
  } catch (error) {
    console.error('Error creating submission:', error);
    return NextResponse.json(
      { error: 'Failed to create submission' },
      { status: 500 }
    );
  }
}
