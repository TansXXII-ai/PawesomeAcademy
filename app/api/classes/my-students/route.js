// /app/api/classes/my-students/route.js
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { cookies } from 'next/headers';

export async function GET(request) {
  try {
    const cookieStore = cookies();
    const userCookie = cookieStore.get('user');
    
    if (!userCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = JSON.parse(userCookie.value);
    
    // Only trainers and admins can access this
    if (!['trainer', 'admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');

    // Get all classes for this trainer
    let classesSql = `
      SELECT 
        c.id,
        c.name,
        c.day_of_week,
        c.time_slot
      FROM Classes c
      WHERE c.trainer_id = @trainerId AND c.active = 1
    `;

    const params = [{ name: 'trainerId', type: 'Int', value: user.id }];

    if (classId) {
      classesSql += ' AND c.id = @classId';
      params.push({ name: 'classId', type: 'Int', value: parseInt(classId) });
    }

    classesSql += ' ORDER BY CASE c.day_of_week ' +
      "WHEN 'Monday' THEN 1 WHEN 'Tuesday' THEN 2 WHEN 'Wednesday' THEN 3 " +
      "WHEN 'Thursday' THEN 4 WHEN 'Friday' THEN 5 WHEN 'Saturday' THEN 6 " +
      "WHEN 'Sunday' THEN 7 END, c.time_slot";

    const classes = await query(classesSql, params);

    // For each class, get the students and their progress
    for (let cls of classes) {
      const studentsResult = await query(
        `SELECT 
          u.id as user_id,
          u.username,
          u.email,
          p.dog_name,
          p.owners,
          p.dog_photo_url,
          (SELECT MAX(grade_number) FROM Grades WHERE user_id = u.id) as current_grade,
          (SELECT COUNT(*) FROM Submissions 
           WHERE user_id = u.id AND status IN ('requested', 'submitted')) as pending_submissions
        FROM Profiles p
        JOIN Users u ON p.user_id = u.id
        WHERE p.class_id = @classId AND u.active = 1
        ORDER BY p.dog_name, u.username`,
        [{ name: 'classId', type: 'Int', value: cls.id }]
      );

      // Get detailed progress for each student
      for (let student of studentsResult) {
        // Get total points available for next grade
        const progressSql = `
          WITH LastGrade AS (
            SELECT COALESCE(MAX(grade_number), 0) as last_grade
            FROM Grades
            WHERE user_id = @userId
          ),
          UsedCompletions AS (
            SELECT completion_id
            FROM GradeCompletions gc
            JOIN Grades g ON gc.grade_id = g.id
            WHERE g.user_id = @userId
          ),
          AvailableCompletions AS (
            SELECT c.id, c.skill_id, s.points, s.section_id
            FROM Completions c
            JOIN Skills s ON c.skill_id = s.id
            WHERE c.user_id = @userId
            AND c.id NOT IN (SELECT completion_id FROM UsedCompletions)
          )
          SELECT 
            (SELECT last_grade FROM LastGrade) as current_grade,
            COALESCE(SUM(points), 0) as total_points,
            COUNT(DISTINCT section_id) as sections_with_skills
          FROM AvailableCompletions
        `;

        const progressResult = await query(progressSql, [
          { name: 'userId', type: 'Int', value: student.user_id }
        ]);

        student.progress = progressResult[0] || {
          current_grade: 0,
          total_points: 0,
          sections_with_skills: 0
        };

        // Determine points required for next grade
        const nextGrade = (student.progress.current_grade || 0) + 1;
        const gradeReqs = {
          1: 20, 2: 20, 3: 20,
          4: 40, 5: 40, 6: 40,
          7: 60, 8: 60, 9: 60,
          10: 80, 11: 80, 12: 80
        };
        student.progress.points_required = gradeReqs[nextGrade] || 80;
        student.progress.next_grade = nextGrade > 12 ? null : nextGrade;
      }

      cls.students = studentsResult;
      cls.student_count = studentsResult.length;
    }

    return NextResponse.json({
      success: true,
      trainer_name: user.username,
      classes: classes
    });
  } catch (error) {
    console.error('Get my students error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch students' },
      { status: 500 }
    );
  }
}
