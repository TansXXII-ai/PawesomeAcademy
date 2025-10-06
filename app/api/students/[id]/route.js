import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    const cookieStore = cookies();
    const userCookie = cookieStore.get('user');
    
    if (!userCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = JSON.parse(userCookie.value);
    
    // Only trainers and admins can access
    if (!['trainer', 'admin'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const studentId = params.id;

    // Get student basic info
    const studentResult = await query(
      `SELECT 
        u.id as user_id,
        u.username,
        u.email,
        p.dog_name,
        p.owners,
        p.dog_photo_url,
        p.notes,
        p.class_id,
        c.name as class_name,
        c.day_of_week,
        c.time_slot,
        c.trainer_id,
        (SELECT MAX(grade_number) FROM Grades WHERE user_id = u.id) as current_grade
      FROM Users u
      LEFT JOIN Profiles p ON u.id = p.user_id
      LEFT JOIN Classes c ON p.class_id = c.id
      WHERE u.id = @studentId AND u.active = 1`,
      [{ name: 'studentId', type: 'Int', value: parseInt(studentId) }]
    );

    if (studentResult.recordset.length === 0) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const student = studentResult.recordset[0];

    // Authorization check for trainers
    if (currentUser.role === 'trainer') {
      if (!student.class_id) {
        return NextResponse.json({ error: 'Student not in any class' }, { status: 403 });
      }
      if (student.trainer_id !== currentUser.id) {
        return NextResponse.json({ error: 'Not your student' }, { status: 403 });
      }
    }

    // Get all sections and their skills with status for this student
    const sectionsResult = await query(
      `SELECT 
        sec.id as section_id,
        sec.name as section_name,
        sec.display_order
      FROM Sections sec
      WHERE sec.active = 1
      ORDER BY sec.display_order`
    );

    const sections = sectionsResult.recordset;

    // For each section, get skills with their status
    for (let section of sections) {
      const skillsResult = await query(
        `SELECT 
          s.id,
          s.title,
          s.description,
          s.difficulty,
          s.points,
          s.display_order,
          CASE 
            WHEN c.id IS NOT NULL THEN 'completed'
            WHEN sub.id IS NOT NULL AND sub.status IN ('requested', 'submitted') THEN 'pending'
            ELSE 'available'
          END as status,
          sub.id as submission_id,
          sub.status as submission_status,
          sub.created_at as submitted_at
        FROM Skills s
        LEFT JOIN Completions c ON s.id = c.skill_id AND c.user_id = @studentId
        LEFT JOIN Submissions sub ON s.id = sub.skill_id AND sub.user_id = @studentId 
          AND sub.status IN ('requested', 'submitted')
        WHERE s.section_id = @sectionId AND s.active = 1
        ORDER BY s.display_order`,
        [
          { name: 'studentId', type: 'Int', value: parseInt(studentId) },
          { name: 'sectionId', type: 'Int', value: section.section_id }
        ]
      );

      section.skills = skillsResult.recordset;
    }

    // Get recent activity (last 10 approvals/rejections)
    const activityResult = await query(
      `SELECT TOP 10
        s.title as skill,
        sub.status as action,
        sub.decided_at as date,
        t.username as trainer,
        sec.name as section_name
      FROM Submissions sub
      JOIN Skills s ON sub.skill_id = s.id
      JOIN Sections sec ON s.section_id = sec.id
      LEFT JOIN Users t ON sub.decided_by = t.id
      WHERE sub.user_id = @studentId 
        AND sub.status IN ('approved', 'rejected')
        AND sub.decided_at IS NOT NULL
      ORDER BY sub.decided_at DESC`,
      [{ name: 'studentId', type: 'Int', value: parseInt(studentId) }]
    );

    // Calculate current progress
    const progressResult = await query(
      `WITH LastGrade AS (
        SELECT COALESCE(MAX(grade_number), 0) as last_grade
        FROM Grades WHERE user_id = @studentId
      ),
      UsedCompletions AS (
        SELECT completion_id
        FROM GradeCompletions gc
        JOIN Grades g ON gc.grade_id = g.id
        WHERE g.user_id = @studentId
      ),
      AvailableCompletions AS (
        SELECT c.id, s.points, s.section_id
        FROM Completions c
        JOIN Skills s ON c.skill_id = s.id
        WHERE c.user_id = @studentId
        AND c.id NOT IN (SELECT completion_id FROM UsedCompletions)
      )
      SELECT 
        (SELECT last_grade FROM LastGrade) as current_grade,
        COALESCE(SUM(points), 0) as total_points,
        COUNT(DISTINCT section_id) as sections_with_skills
      FROM AvailableCompletions`,
      [{ name: 'studentId', type: 'Int', value: parseInt(studentId) }]
    );

    const progress = progressResult.recordset[0];
    const nextGrade = (progress.current_grade || 0) + 1;
    const gradeReqs = {
      1: 20, 2: 20, 3: 20,
      4: 40, 5: 40, 6: 40,
      7: 60, 8: 60, 9: 60,
      10: 80, 11: 80, 12: 80
    };

    return NextResponse.json({
      ...student,
      sections: sections.map(s => ({
        id: s.section_id,
        name: s.section_name,
        skills: s.skills
      })),
      recent_activity: activityResult.recordset.map(a => ({
        date: a.date?.toISOString().split('T')[0] || 'Unknown',
        skill: a.skill,
        action: a.action,
        trainer: a.trainer || 'System',
        section: a.section_name
      })),
      progress: {
        current_grade: progress.current_grade || 0,
        total_points: progress.total_points || 0,
        sections_with_skills: progress.sections_with_skills || 0,
        points_required: gradeReqs[nextGrade] || 80,
        next_grade: nextGrade > 12 ? null : nextGrade
      }
    });

  } catch (error) {
    console.error('Get student details error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch student details' },
      { status: 500 }
    );
  }
}
